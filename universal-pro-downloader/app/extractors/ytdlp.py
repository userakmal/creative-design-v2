"""
yt-dlp Extractor Module
========================
Primary extraction engine using yt-dlp
"""

import asyncio
import logging
import time
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass

import yt_dlp

from extractors.base import BaseExtractor, ExtractionResult, ExtractionStatus

logger = logging.getLogger(__name__)


@dataclass
class YtDlpOptions:
    """yt-dlp configuration options"""
    quality: str = "best"
    format: str = "mp4"
    timeout: int = 120
    retries: int = 3
    cookies_file: Optional[Path] = None
    
    def to_ydl_options(self, output_template: str) -> Dict:
        """Convert to yt-dlp options dictionary"""
        
        # Quality mapping
        quality_map = {
            'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'high': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]',
            'medium': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]',
            'low': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]',
        }
        
        return {
            # Format selection
            'format': quality_map.get(self.quality, quality_map['best']),
            'merge_output_format': self.format,
            
            # Output
            'outtmpl': output_template,
            'restrictfilenames': True,
            'nooverwrites': True,
            
            # Network
            'socket_timeout': 30,
            'retries': self.retries,
            'fragment_retries': 3,
            'http_chunk_size': 10485760,
            
            # Performance
            'concurrent_fragment_downloads': 4,
            
            # Stealth
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            
            # Cookies (crucial for Instagram)
            'cookiefile': str(self.cookies_file) if self.cookies_file and self.cookies_file.exists() else None,
            
            # Geo bypass
            'geo_bypass': True,
            
            # Extractor settings
            'extract_flat': False,
            'include_ads': False,
            
            # Progress
            'noprogress': True,
            'quiet': True,
            'no_warnings': True,
            
            # Compatibility
            'compat_opts': {'allow-unsafe-ext'},
        }


class YtDlpExtractor(BaseExtractor):
    """
    yt-dlp extraction engine
    
    Primary engine for most platforms. Supports 1000+ sites.
    """
    
    # Supported platforms (optimized)
    SUPPORTED_PLATFORMS = {
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'instagram.com': 'Instagram',
        'instagr.am': 'Instagram',
        'tiktok.com': 'TikTok',
        'twitter.com': 'Twitter/X',
        'x.com': 'Twitter/X',
        'facebook.com': 'Facebook',
        'fb.watch': 'Facebook',
        'vimeo.com': 'Vimeo',
        'twitch.tv': 'Twitch',
        'soundcloud.com': 'SoundCloud',
        'reddit.com': 'Reddit',
        'pinterest.com': 'Pinterest',
    }
    
    def __init__(
        self,
        cookies_file: Optional[Path] = None,
        download_dir: Optional[Path] = None,
        timeout: int = 120,
    ):
        super().__init__(download_dir or Path('./downloads'), timeout)
        self.cookies_file = cookies_file
        self._validate_cookies()
    
    def _validate_cookies(self) -> None:
        """Validate cookies file"""
        if self.cookies_file and not self.cookies_file.exists():
            logger.warning(f"⚠️ Cookies file not found: {self.cookies_file}")
            logger.warning("Instagram and some sites may require login")
    
    def _detect_platform(self, url: str) -> Optional[str]:
        """Detect platform from URL"""
        from urllib.parse import urlparse
        
        domain = urlparse(url).netloc.lower()
        domain = domain.replace('www.', '')
        
        for supported_domain, platform_name in self.SUPPORTED_PLATFORMS.items():
            if supported_domain in domain:
                return platform_name
        
        return None
    
    async def extract(self, url: str, quality: str = "best") -> ExtractionResult:
        """
        Extract video using yt-dlp
        
        Args:
            url: Video URL
            quality: Quality preference
        
        Returns:
            ExtractionResult with download URL or file path
        """
        logger.info(f"🎯 yt-dlp extracting: {url[:100]}...")
        
        loop = asyncio.get_event_loop()
        start_time = time.time()
        
        def _extract():
            options = YtDlpOptions(
                quality=quality,
                timeout=self.timeout,
                cookies_file=self.cookies_file,
            )
            
            output_template = str(self.download_dir / '%(id)s.%(ext)s')
            ydl_opts = options.to_ydl_options(output_template)
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                try:
                    # Extract info without downloading
                    info = ydl.extract_info(url, download=False)
                    
                    if not info:
                        return ExtractionResult(
                            success=False,
                            error="No information returned",
                            engine="yt-dlp",
                        )
                    
                    # Detect platform
                    platform = self._detect_platform(url)
                    if platform:
                        logger.info(f"📱 Platform: {platform}")
                    
                    # Get direct URL
                    download_url = info.get('url')
                    is_m3u8 = '.m3u8' in download_url.lower() if download_url else False
                    
                    # Get best format URL if direct URL not available
                    if not download_url and info.get('formats'):
                        formats = info.get('formats', [])
                        if formats:
                            download_url = formats[-1].get('url')
                            is_m3u8 = '.m3u8' in download_url.lower()
                    
                    # Build metadata
                    metadata = {
                        'title': info.get('title', 'Unknown Video'),
                        'uploader': info.get('uploader'),
                        'duration': info.get('duration'),
                        'thumbnail': info.get('thumbnail'),
                        'description': info.get('description'),
                        'view_count': info.get('view_count'),
                        'like_count': info.get('like_count'),
                        'upload_date': info.get('upload_date'),
                    }
                    
                    logger.info(f"✅ yt-dlp extraction complete in {time.time() - start_time:.2f}s")
                    
                    return ExtractionResult(
                        success=True,
                        download_url=download_url,
                        is_m3u8=is_m3u8,
                        metadata=metadata,
                        engine="yt-dlp",
                    )
                    
                except yt_dlp.utils.DownloadError as e:
                    error_msg = str(e)
                    
                    # Parse specific errors
                    if 'unavailable' in error_msg.lower() or 'private' in error_msg.lower():
                        return ExtractionResult(
                            success=False,
                            error="Video is private or unavailable",
                            engine="yt-dlp",
                        )
                    elif 'deleted' in error_msg.lower() or 'removed' in error_msg.lower():
                        return ExtractionResult(
                            success=False,
                            error="Video has been deleted",
                            engine="yt-dlp",
                        )
                    elif 'login' in error_msg.lower() or 'authentication' in error_msg.lower():
                        return ExtractionResult(
                            success=False,
                            error="Login required. Add cookies.txt file.",
                            engine="yt-dlp",
                        )
                    elif 'unsupported' in error_msg.lower():
                        return ExtractionResult(
                            success=False,
                            error="Site not supported by yt-dlp",
                            engine="yt-dlp",
                        )
                    else:
                        logger.error(f"yt-dlp error: {error_msg[:200]}")
                        return ExtractionResult(
                            success=False,
                            error=f"Extraction failed: {error_msg[:200]}",
                            engine="yt-dlp",
                        )
                except Exception as e:
                    logger.exception("Unexpected yt-dlp error")
                    return ExtractionResult(
                        success=False,
                        error=f"Unexpected error: {str(e)[:200]}",
                        engine="yt-dlp",
                    )
        
        return await loop.run_in_executor(None, _extract)
    
    async def download(
        self,
        url: str,
        quality: str = "best",
        output_filename: Optional[str] = None,
    ) -> ExtractionResult:
        """
        Download video file using yt-dlp
        
        Args:
            url: Video URL
            quality: Quality preference
            output_filename: Custom output filename
        
        Returns:
            ExtractionResult with file path
        """
        logger.info(f"📥 yt-dlp downloading: {url[:100]}...")
        
        loop = asyncio.get_event_loop()
        start_time = time.time()
        
        def _download():
            options = YtDlpOptions(
                quality=quality,
                timeout=self.timeout,
                cookies_file=self.cookies_file,
            )
            
            # Output template
            if output_filename:
                output_template = str(self.download_dir / output_filename)
            else:
                output_template = str(self.download_dir / '%(id)s.%(ext)s')
            
            ydl_opts = options.to_ydl_options(output_template)
            ydl_opts['skip_download'] = False
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                try:
                    info = ydl.extract_info(url, download=True)
                    
                    if not info:
                        return ExtractionResult(
                            success=False,
                            error="Download failed",
                            engine="yt-dlp",
                        )
                    
                    # Find actual file
                    filename = ydl.prepare_filename(info)
                    file_path = Path(filename)
                    
                    # Handle merged files
                    if not file_path.exists():
                        file_path = file_path.with_suffix('.mp4')
                    
                    if not file_path.exists():
                        return ExtractionResult(
                            success=False,
                            error="Downloaded file not found",
                            engine="yt-dlp",
                        )
                    
                    logger.info(f"✅ Download complete in {time.time() - start_time:.2f}s")
                    
                    # Build metadata
                    metadata = {
                        'title': info.get('title', 'Unknown Video'),
                        'uploader': info.get('uploader'),
                        'duration': info.get('duration'),
                        'thumbnail': info.get('thumbnail'),
                    }
                    
                    return ExtractionResult(
                        success=True,
                        file_path=file_path,
                        is_m3u8=False,
                        metadata=metadata,
                        engine="yt-dlp",
                    )
                    
                except Exception as e:
                    logger.error(f"Download error: {e}")
                    return ExtractionResult(
                        success=False,
                        error=str(e)[:200],
                        engine="yt-dlp",
                    )
        
        return await loop.run_in_executor(None, _download)
