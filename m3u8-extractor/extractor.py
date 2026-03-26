"""
Advanced M3U8 URL Extractor
============================
Production-grade module for extracting hidden M3U8 URLs from complex video hosting sites.
Uses Playwright with stealth techniques to bypass anti-bot protections.

Author: Creative Design Uz Team
Version: 1.0.0
"""

import asyncio
import logging
import random
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Set, Dict, Any
from contextlib import asynccontextmanager

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    Response,
    TimeoutError as PlaywrightTimeoutError,
    Error as PlaywrightError,
)

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class ExtractorConfig:
    """Configuration for M3U8 extractor"""
    
    # Timeouts
    page_load_timeout: int = 30000  # 30 seconds
    network_idle_timeout: int = 15000  # 15 seconds
    extraction_timeout: int = 20000  # 20 seconds total
    wait_after_click: int = 5000  # 5 seconds after interaction
    
    # Browser settings
    headless: bool = True
    stealth_mode: bool = True
    bypass_csp: bool = True
    
    # Retry settings
    max_retries: int = 3
    retry_delay: float = 1.0  # seconds
    
    # Logging
    log_level: int = logging.INFO


@dataclass
class ExtractionResult:
    """Result of M3U8 extraction"""
    
    success: bool
    m3u8_url: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Additional found URLs (master, variants, etc.)
    all_m3u8_urls: List[str] = field(default_factory=list)
    
    # Page information
    page_title: Optional[str] = None
    final_url: Optional[str] = None
    
    @classmethod
    def success_result(
        cls,
        m3u8_url: str,
        all_urls: List[str] = None,
        metadata: Dict = None,
        page_title: str = None,
        final_url: str = None,
    ) -> "ExtractionResult":
        return cls(
            success=True,
            m3u8_url=m3u8_url,
            all_m3u8_urls=all_urls or [],
            metadata=metadata or {},
            page_title=page_title,
            final_url=final_url,
        )
    
    @classmethod
    def error_result(
        cls,
        error_message: str,
        metadata: Dict = None,
    ) -> "ExtractionResult":
        return cls(
            success=False,
            error_message=error_message,
            metadata=metadata or {},
        )


# ============================================================================
# USER AGENT ROTATION
# ============================================================================

class UserAgentRotator:
    """Rotate user agents to avoid detection"""
    
    USER_AGENTS = [
        # Chrome - Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        # Chrome - macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        # Firefox - Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
        # Safari - macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        # Edge - Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    ]
    
    @classmethod
    def get_random(cls) -> str:
        """Get a random user agent"""
        return random.choice(cls.USER_AGENTS)
    
    @classmethod
    def get_modern_chrome(cls) -> str:
        """Get a modern Chrome user agent"""
        chrome_agents = [ua for ua in cls.USER_AGENTS if "Chrome" in ua]
        return random.choice(chrome_agents) if chrome_agents else cls.get_random()


# ============================================================================
# STEALTH UTILITIES
# ============================================================================

class StealthUtils:
    """Utilities for bypassing bot detection"""
    
    @staticmethod
    async def apply_stealth(page: Page) -> None:
        """Apply stealth techniques to avoid detection"""
        
        # Override the navigator.webdriver property
        await page.add_init_script("""
            // Override the navigator.webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Override plugins to look more like a real browser
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            // Override languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            
            // Override hardware concurrency
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => 8,
            });
            
            // Override device memory
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => 8,
            });
            
            // Override connection
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    effectiveType: '4g',
                    rtt: 50,
                    downlink: 10,
                    saveData: false,
                }),
            });
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
            
            // Override WebGL
            const getParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) {
                    return 'Intel Inc.';
                }
                if (parameter === 37446) {
                    return 'Intel Iris OpenGL Engine';
                }
                return getParameter.call(this, parameter);
            };
        """)
    
    @staticmethod
    async def set_random_viewport(page: Page) -> None:
        """Set a random viewport size"""
        viewports = [
            (1920, 1080),
            (1366, 768),
            (1536, 864),
            (1440, 900),
            (1280, 720),
        ]
        width, height = random.choice(viewports)
        await page.set_viewport_size({"width": width, "height": height})


# ============================================================================
# MAIN EXTRACTOR CLASS
# ============================================================================

class M3U8Extractor:
    """
    Advanced M3U8 URL extractor using Playwright with stealth techniques.
    
    Features:
    - Headless browser automation with anti-bot bypass
    - Network interception for M3U8 detection
    - Interaction simulation (click play buttons)
    - Automatic cleanup to prevent zombie processes
    - Retry logic with exponential backoff
    """
    
    def __init__(self, config: ExtractorConfig = None):
        self.config = config or ExtractorConfig()
        self.logger = self._setup_logging()
        self.found_m3u8_urls: Set[str] = set()
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger(__name__)
        logger.setLevel(self.config.log_level)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    @asynccontextmanager
    async def _create_browser(self):
        """Context manager for browser lifecycle"""
        browser = None
        try:
            playwright = await async_playwright().start()
            
            # Launch browser with anti-detection settings
            browser = await playwright.chromium.launch(
                headless=self.config.headless,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                ],
            )
            
            # Create context with stealth settings
            user_agent = UserAgentRotator.get_modern_chrome()
            
            context = await browser.new_context(
                user_agent=user_agent,
                viewport={"width": 1920, "height": 1080},
                bypass_csp=self.config.bypass_csp,
                ignore_https_errors=True,
                java_script_enabled=True,
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                },
            )
            
            yield browser, context
            
        finally:
            # Cleanup
            if browser:
                try:
                    await browser.close()
                except Exception as e:
                    self.logger.warning(f"Error closing browser: {e}")
    
    def _is_m3u8_url(self, url: str, content_type: str = "") -> bool:
        """Check if URL is an M3U8 stream"""
        if not url:
            return False
        
        # Check URL pattern
        if ".m3u8" in url.lower():
            return True
        
        # Check content type
        if "mpegurl" in content_type.lower() or "x-mpegurl" in content_type.lower():
            return True
        
        return False
    
    def _should_capture_url(self, url: str) -> bool:
        """Filter out unwanted URLs"""
        # Skip data URLs, ads, analytics, etc.
        skip_patterns = [
            r'^data:',
            r'advertisement',
            r'/ads/',
            r'google-analytics',
            r'googletagmanager',
            r'facebook\.com.*pixel',
            r'doubleclick',
            r'^blob:',
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return False
        
        return True
    
    async def _setup_network_listener(self, page: Page) -> None:
        """Setup network request/response listener"""
        
        async def handle_response(response: Response):
            try:
                url = response.url
                content_type = response.headers.get("content-type", "")
                
                if not self._should_capture_url(url):
                    return
                
                # Check if this is an M3U8 URL
                if self._is_m3u8_url(url, content_type):
                    self.logger.info(f"🎯 M3U8 detected: {url[:150]}")
                    self.found_m3u8_urls.add(url.split('?')[0])  # Remove query params for dedup
                    
                    # Also store full URL with query params
                    self.found_m3u8_urls.add(url)
                    
            except Exception as e:
                self.logger.debug(f"Error processing response: {e}")
        
        page.on("response", handle_response)
    
    async def _wait_for_video_player(self, page: Page) -> None:
        """Wait for video player elements to load"""
        
        video_selectors = [
            # Video elements
            "video",
            "video[src]",
            "video source",
            # Common player containers
            ".video-player",
            ".video-js",
            ".jwplayer",
            ".plyr",
            ".flowplayer",
            ".mejs__container",
            # Play buttons
            "[class*='play']",
            "[id*='play']",
            ".play-button",
            ".btn-play",
            "#play-button",
            # Load buttons
            "[class*='load']",
            ".load-button",
            ".btn-load",
            # Generic interactive elements
            "button[data-action='play']",
            "[data-role='play-button']",
            ".video-controls",
        ]
        
        # Wait for any video-related element
        try:
            await page.wait_for_selector(
                ", ".join(video_selectors),
                state="attached",
                timeout=5000,
            )
            self.logger.info("Video player element found")
        except PlaywrightTimeoutError:
            self.logger.debug("No specific video player element found, continuing...")
    
    async def _simulate_interaction(self, page: Page) -> bool:
        """Simulate human-like interaction with the page"""
        
        try:
            # Scroll the page slightly (human behavior)
            await page.evaluate("window.scrollBy(0, 100)")
            await asyncio.sleep(random.uniform(0.5, 1.0))
            
            # Find and click play/load buttons
            click_selectors = [
                # Play buttons
                ".play-button",
                "[class*='play']",
                "[id*='play']",
                ".btn-play",
                "#play-button",
                "button[data-action='play']",
                "[data-role='play-button']",
                # Load buttons
                ".load-button",
                ".btn-load",
                # Video element (click to play)
                "video",
                # Generic buttons that might trigger video
                "button.video-trigger",
                "[class*='video-trigger']",
                ".start-watching",
                ".watch-now",
            ]
            
            for selector in click_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        # Click the first visible element
                        for element in elements:
                            is_visible = await element.is_visible()
                            is_enabled = await element.is_enabled()
                            
                            if is_visible and is_enabled:
                                self.logger.info(f"Clicking: {selector}")
                                
                                # Human-like click with slight offset
                                box = await element.bounding_box()
                                if box:
                                    await page.mouse.click(
                                        box["x"] + box["width"] * 0.5 + random.uniform(-2, 2),
                                        box["y"] + box["height"] * 0.5 + random.uniform(-2, 2),
                                        delay=random.uniform(50, 150),
                                    )
                                    await asyncio.sleep(self.config.wait_after_click / 1000)
                                    return True
                except Exception as e:
                    self.logger.debug(f"Failed to click {selector}: {e}")
                    continue
            
            # Try keyboard interaction (spacebar to play)
            try:
                await page.keyboard.press(" ")
                await asyncio.sleep(1.0)
            except:
                pass
            
            return False
            
        except Exception as e:
            self.logger.warning(f"Interaction failed: {e}")
            return False
    
    async def _extract_from_page(self, page: Page, url: str) -> ExtractionResult:
        """Main extraction logic"""
        
        self.logger.info(f"Navigating to: {url[:100]}...")
        
        try:
            # Navigate to page
            await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=self.config.page_load_timeout,
            )
            
            # Wait for network to be mostly idle
            try:
                await page.wait_for_load_state("networkidle", timeout=self.config.network_idle_timeout)
            except PlaywrightTimeoutError:
                self.logger.debug("Network never fully idle, continuing...")
            
            # Wait for video player
            await self._wait_for_video_player(page)
            
            # Small delay to let initial scripts run
            await asyncio.sleep(random.uniform(1.0, 2.0))
            
            # Check if we already found M3U8 URLs
            if self.found_m3u8_urls:
                self.logger.info(f"Found {len(self.found_m3u8_urls)} M3U8 URL(s) without interaction")
            
            # Simulate interaction to trigger lazy-loaded videos
            clicked = await self._simulate_interaction(page)
            
            if clicked:
                self.logger.info("Interaction successful, waiting for network requests...")
                # Wait for network requests after interaction
                try:
                    await page.wait_for_load_state("networkidle", timeout=self.config.network_idle_timeout)
                except PlaywrightTimeoutError:
                    pass
            
            # Additional wait for delayed requests
            await asyncio.sleep(3.0)
            
            # Get page info
            page_title = await page.title()
            final_url = page.url
            
            # Process results
            if self.found_m3u8_urls:
                # Prioritize master.m3u8 URLs
                master_urls = [u for u in self.found_m3u8_urls if "master" in u.lower()]
                all_urls = list(self.found_m3u8_urls)
                
                if master_urls:
                    best_url = master_urls[0]
                    self.logger.info(f"Selected master playlist: {best_url[:150]}")
                else:
                    # Select the longest URL (usually the most complete)
                    best_url = max(all_urls, key=len)
                    self.logger.info(f"Selected URL: {best_url[:150]}")
                
                return ExtractionResult.success_result(
                    m3u8_url=best_url,
                    all_urls=all_urls,
                    page_title=page_title,
                    final_url=final_url,
                    metadata={
                        "clicked_to_trigger": clicked,
                        "total_urls_found": len(all_urls),
                    },
                )
            
            # No M3U8 found - try to find embedded video URLs as fallback
            video_urls = await self._extract_video_urls_from_dom(page)
            if video_urls:
                return ExtractionResult.success_result(
                    m3u8_url=video_urls[0],
                    all_urls=video_urls,
                    page_title=page_title,
                    final_url=final_url,
                    metadata={"fallback": "direct_video_urls"},
                )
            
            return ExtractionResult.error_result(
                error_message="No M3U8 or video URLs found within timeout",
                metadata={
                    "page_title": page_title,
                    "final_url": final_url,
                },
            )
            
        except PlaywrightTimeoutError as e:
            return ExtractionResult.error_result(
                error_message=f"Page load timeout: {str(e)}",
            )
        except PlaywrightError as e:
            return ExtractionResult.error_result(
                error_message=f"Playwright error: {str(e)}",
            )
        except Exception as e:
            self.logger.exception(f"Unexpected error: {e}")
            return ExtractionResult.error_result(
                error_message=f"Unexpected error: {str(e)}",
            )
    
    async def _extract_video_urls_from_dom(self, page: Page) -> List[str]:
        """Extract video URLs directly from DOM as fallback"""
        
        try:
            video_urls = await page.evaluate("""
                () => {
                    const urls = new Set();
                    
                    // Video elements
                    document.querySelectorAll('video, video source, source').forEach(el => {
                        if (el.src) urls.add(el.src);
                        if (el.currentSrc) urls.add(el.currentSrc);
                    });
                    
                    // Search in page content for m3u8/mp4 patterns
                    const bodyText = document.body.innerHTML;
                    const m3u8Matches = bodyText.match(/https?:\\/\\/[^\\s"'<>]+\\.m3u8[^\\s"'<>]*/gi) || [];
                    const mp4Matches = bodyText.match(/https?:\\/\\/[^\\s"'<>]+\\.mp4[^\\s"'<>]*/gi) || [];
                    
                    m3u8Matches.forEach(u => urls.add(u));
                    mp4Matches.forEach(u => urls.add(u));
                    
                    return Array.from(urls);
                }
            """)
            
            return [u for u in video_urls if self._should_capture_url(u)]
            
        except Exception as e:
            self.logger.debug(f"DOM extraction failed: {e}")
            return []
    
    async def extract(
        self,
        url: str,
        retry_count: int = 0,
    ) -> ExtractionResult:
        """
        Extract M3U8 URL from a page.
        
        Args:
            url: The page URL to extract from
            retry_count: Current retry attempt (internal use)
        
        Returns:
            ExtractionResult with success status and M3U8 URL
        """
        
        self.logger.info(f"Starting extraction (attempt {retry_count + 1}/{self.config.max_retries + 1})")
        self.found_m3u8_urls = set()
        
        try:
            async with self._create_browser() as (browser, context):
                self.browser = browser
                self.context = context
                
                # Create page
                page = await context.new_page()
                self.page = page
                
                # Apply stealth if enabled
                if self.config.stealth_mode:
                    await StealthUtils.apply_stealth(page)
                    await StealthUtils.set_random_viewport(page)
                
                # Setup network listener
                await self._setup_network_listener(page)
                
                # Run extraction with timeout
                try:
                    result = await asyncio.wait_for(
                        self._extract_from_page(page, url),
                        timeout=self.config.extraction_timeout / 1000,
                    )
                except asyncio.TimeoutError:
                    result = ExtractionResult.error_result(
                        error_message=f"Extraction timeout ({self.config.extraction_timeout}ms)",
                    )
                
                # Retry logic
                if not result.success and retry_count < self.config.max_retries:
                    delay = self.config.retry_delay * (2 ** retry_count)
                    self.logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    return await self.extract(url, retry_count + 1)
                
                return result
                
        except Exception as e:
            self.logger.exception(f"Extraction failed: {e}")
            return ExtractionResult.error_result(
                error_message=f"Extraction failed: {str(e)}",
            )
        finally:
            # Ensure cleanup
            self.page = None
            self.context = None
            self.browser = None


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

async def get_m3u8_url(
    page_url: str,
    headless: bool = True,
    timeout: int = 20000,
    retries: int = 2,
) -> str:
    """
    Convenience function to extract M3U8 URL from a page.
    
    Args:
        page_url: The page URL to extract from
        headless: Run browser in headless mode
        timeout: Extraction timeout in milliseconds
        retries: Number of retry attempts
    
    Returns:
        The extracted M3U8 URL
    
    Raises:
        ValueError: If no M3U8 URL was found
    """
    
    config = ExtractorConfig(
        headless=headless,
        extraction_timeout=timeout,
        max_retries=retries,
    )
    
    extractor = M3U8Extractor(config)
    result = await extractor.extract(page_url)
    
    if result.success and result.m3u8_url:
        return result.m3u8_url
    else:
        raise ValueError(f"Failed to extract M3U8 URL: {result.error_message}")


async def get_all_m3u8_urls(
    page_url: str,
    headless: bool = True,
    timeout: int = 20000,
) -> List[str]:
    """
    Extract all M3U8 URLs from a page.
    
    Args:
        page_url: The page URL to extract from
        headless: Run browser in headless mode
        timeout: Extraction timeout in milliseconds
    
    Returns:
        List of all found M3U8 URLs
    """
    
    config = ExtractorConfig(
        headless=headless,
        extraction_timeout=timeout,
    )
    
    extractor = M3U8Extractor(config)
    result = await extractor.extract(page_url)
    
    return result.all_m3u8_urls if result.success else []


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Extract M3U8 URLs from video hosting sites",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python extractor.py https://example.com/video/123
  python extractor.py https://example.com/video/123 --no-headless
  python extractor.py https://example.com/video/123 --timeout 30000 --retries 3
        """
    )
    
    parser.add_argument("url", help="Page URL to extract M3U8 from")
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Run browser with visible UI (for debugging)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20000,
        help="Extraction timeout in milliseconds (default: 20000)",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=2,
        help="Number of retry attempts (default: 2)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Return all found M3U8 URLs (default: best only)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Verbose output",
    )
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(levelname)s - %(message)s',
    )
    
    # Run extraction
    async def run():
        if args.all:
            urls = await get_all_m3u8_urls(
                args.url,
                headless=not args.no_headless,
                timeout=args.timeout,
            )
            
            if args.json:
                import json
                print(json.dumps({"urls": urls, "count": len(urls)}, indent=2))
            else:
                print(f"\nFound {len(urls)} M3U8 URL(s):")
                for url in urls:
                    print(f"  • {url}")
            
            return urls
        
        else:
            try:
                url = await get_m3u8_url(
                    args.url,
                    headless=not args.no_headless,
                    timeout=args.timeout,
                    retries=args.retries,
                )
                
                if args.json:
                    import json
                    print(json.dumps({"url": url}, indent=2))
                else:
                    print(f"\n✅ M3U8 URL extracted:")
                    print(f"   {url}")
                
                return url
                
            except ValueError as e:
                print(f"\n❌ Error: {e}")
                return None
    
    asyncio.run(run())


if __name__ == "__main__":
    main()
