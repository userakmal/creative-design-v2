"""
Playwright Extractor Module
============================
Fallback extraction engine using headless browser
Intercepts network requests to find hidden video URLs
"""

import asyncio
import logging
import time
import re
from pathlib import Path
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, field

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Response

from extractors.base import BaseExtractor, ExtractionResult

logger = logging.getLogger(__name__)


@dataclass
class FoundVideo:
    """Found video URL with priority"""
    url: str
    type: str  # m3u8, mp4, webm, etc.
    priority: int = 0
    content_type: str = ""


class PlaywrightExtractor(BaseExtractor):
    """
    Playwright extraction engine
    
    Fallback engine that uses headless browser to intercept
    network requests and find hidden video URLs.
    """
    
    # Selectors for video players and play buttons
    VIDEO_SELECTORS = [
        'video',
        'video[src]',
        '.video-player',
        '.video-js',
        '.jwplayer',
        '.plyr',
        '.flowplayer',
    ]
    
    PLAY_BUTTON_SELECTORS = [
        '.play-button',
        '[class*="play"]',
        '[id*="play"]',
        '.btn-play',
        '#play-button',
        '[data-action="play"]',
        '.vjs-big-play-button',
        '.jw-icon-display',
    ]
    
    def __init__(
        self,
        download_dir: Path,
        timeout: int = 30,
        headless: bool = True,
    ):
        super().__init__(download_dir, timeout)
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
    
    async def close(self):
        """Close browser"""
        if self.browser:
            try:
                await self.browser.close()
            except:
                pass
            self.browser = None
    
    def _is_video_url(self, url: str, content_type: str = "") -> bool:
        """Check if URL is a video"""
        if not url:
            return False
        
        # Skip unwanted URLs
        skip_patterns = [
            r'advertisement', r'/ads/', r'google-analytics',
            r'googletagmanager', r'facebook\.com.*pixel',
            r'doubleclick', r'^data:', r'^blob:',
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return False
        
        # Check for video patterns
        if '.m3u8' in url.lower():
            return True
        if any(ext in url.lower() for ext in ['.mp4', '.webm', '.mkv', '.avi', '.mov']):
            return True
        if 'mpegurl' in content_type.lower() or 'video/' in content_type.lower():
            return True
        
        return False
    
    def _get_priority(self, url: str, content_type: str = "") -> int:
        """Get priority for video URL (higher = better)"""
        priority = 0
        
        # M3U8 master playlists
        if 'master' in url.lower() or 'playlist' in url.lower():
            priority += 25
        elif '.m3u8' in url.lower():
            priority += 20
        
        # MP4 videos
        if '.mp4' in url.lower():
            priority += 15
        
        # High quality indicators
        if any(q in url.lower() for q in ['1080', '720', '4k', 'hd']):
            priority += 10
        
        # Content type
        if 'video/mp4' in content_type.lower():
            priority += 15
        elif 'mpegurl' in content_type.lower():
            priority += 20
        
        return priority
    
    async def extract(self, url: str, quality: str = "best") -> ExtractionResult:
        """
        Extract video using Playwright
        
        Launches headless browser, intercepts network requests,
        and finds hidden video URLs.
        
        Args:
            url: Page URL
            quality: Quality preference (not used for now)
        
        Returns:
            ExtractionResult with found video URL
        """
        logger.info(f"🎭 Playwright extracting: {url[:100]}...")
        
        start_time = time.time()
        found_videos: Set[FoundVideo] = set()
        
        try:
            playwright = await async_playwright().start()
            
            # Launch browser
            browser = await playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ],
            )
            
            # Create context
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                ignore_https_errors=True,
                java_script_enabled=True,
                bypass_csp=True,
            )
            
            page = await context.new_page()
            
            # Block unnecessary resources
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,eot}', 
                           lambda route: route.abort())
            
            # Setup network interceptor
            def handle_response(response: Response):
                try:
                    req_url = response.url
                    content_type = response.headers.get('content-type', '')
                    
                    if self._is_video_url(req_url, content_type):
                        priority = self._get_priority(req_url, content_type)
                        video = FoundVideo(
                            url=req_url.split('?')[0],  # Remove query params for dedup
                            type='m3u8' if '.m3u8' in req_url.lower() else 'mp4',
                            priority=priority,
                            content_type=content_type,
                        )
                        found_videos.add(video)
                        logger.info(f"🎯 Found video: {req_url[:120]} (priority: {priority})")
                except Exception as e:
                    logger.debug(f"Error processing response: {e}")
            
            page.on('response', handle_response)
            
            # Navigate to page
            logger.info("Navigating to page...")
            await page.goto(url, wait_until='domcontentloaded', timeout=min(self.timeout * 1000, 30000))
            
            # Wait for network idle
            try:
                await page.wait_for_load_state('networkidle', timeout=min(self.timeout * 1000, 15000))
            except:
                logger.debug("Network never fully idle, continuing...")
            
            # Small delay for JS execution
            await asyncio.sleep(2)
            
            # Check for video players
            logger.info("Looking for video players...")
            for selector in self.VIDEO_SELECTORS:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        logger.info(f"Found video element: {selector}")
                except:
                    pass
            
            # Try clicking play buttons if no videos found yet
            if len(found_videos) == 0:
                logger.info("No videos found, trying to click play buttons...")
                
                for selector in self.PLAY_BUTTON_SELECTORS:
                    try:
                        elements = await page.query_selector_all(selector)
                        for element in elements:
                            is_visible = await element.is_visible()
                            is_enabled = await element.is_enabled()
                            
                            if is_visible and is_enabled:
                                logger.info(f"Clicking: {selector}")
                                await element.click(timeout=2000)
                                await asyncio.sleep(3)
                                
                                if len(found_videos) > 0:
                                    break
                                
                    except Exception as e:
                        logger.debug(f"Failed to click {selector}: {e}")
                    
                    if len(found_videos) > 0:
                        break
            
            # Additional wait for delayed requests
            if len(found_videos) == 0:
                logger.info("Waiting for delayed video loading...")
                await asyncio.sleep(5)
            
            # Final DOM scan
            logger.info("Scanning DOM for video URLs...")
            try:
                dom_videos = await page.evaluate("""
                    () => {
                        const urls = new Set();
                        
                        // Video elements
                        document.querySelectorAll('video, video source, source').forEach(el => {
                            if (el.src) urls.add(el.src);
                            if (el.currentSrc) urls.add(el.currentSrc);
                        });
                        
                        // Search in page content
                        const bodyText = document.body.innerHTML;
                        const m3u8Matches = bodyText.match(/https?:\\/\\/[^\\s"'<>]+\\.m3u8[^\\s"'<>]*/gi) || [];
                        const mp4Matches = bodyText.match(/https?:\\/\\/[^\\s"'<>]+\\.mp4[^\\s"'<>]*/gi) || [];
                        
                        m3u8Matches.forEach(u => urls.add(u));
                        mp4Matches.forEach(u => urls.add(u));
                        
                        return Array.from(urls);
                    }
                """)
                
                for vid_url in dom_videos:
                    if vid_url and vid_url.startswith('http'):
                        found_videos.add(FoundVideo(
                            url=vid_url.split('?')[0],
                            type='m3u8' if '.m3u8' in vid_url.lower() else 'mp4',
                            priority=10,
                        ))
                        
            except Exception as e:
                logger.debug(f"DOM scan failed: {e}")
            
            # Cleanup
            await browser.close()
            
            # Process results
            elapsed = time.time() - start_time
            
            if len(found_videos) == 0:
                logger.warning(f"❌ Playwright found no videos in {elapsed:.2f}s")
                return ExtractionResult(
                    success=False,
                    error="No video URLs found on page",
                    engine="playwright",
                )
            
            # Select best video
            sorted_videos = sorted(found_videos, key=lambda v: v.priority, reverse=True)
            best = sorted_videos[0]
            
            logger.info(f"✅ Playwright found video in {elapsed:.2f}s: {best.url[:120]}")
            
            # Build metadata
            metadata = {
                'title': await page.title(),
                'uploader': None,
                'duration': None,
                'thumbnail': None,
            }
            
            return ExtractionResult(
                success=True,
                download_url=best.url,
                is_m3u8=best.type == 'm3u8',
                metadata=metadata,
                engine="playwright",
                all_urls=[v.url for v in sorted_videos],
            )
            
        except asyncio.TimeoutError:
            logger.error(f"❌ Playwright timeout after {self.timeout}s")
            return ExtractionResult(
                success=False,
                error=f"Timeout after {self.timeout} seconds",
                engine="playwright",
            )
        except Exception as e:
            logger.exception(f"❌ Playwright error: {e}")
            return ExtractionResult(
                success=False,
                error=f"Playwright failed: {str(e)[:200]}",
                engine="playwright",
            )
        finally:
            await self.close()
