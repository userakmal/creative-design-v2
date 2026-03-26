"""
Social Media Video Downloader API
==================================
Production-ready FastAPI backend with yt-dlp integration
for Instagram, TikTok, Twitter, and other platforms.

Author: Creative Design Uz Team
Version: 2.0.0
"""

import asyncio
import logging
import os
import shutil
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, HttpUrl, Field
import yt_dlp

# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Application configuration"""
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Download settings
    DOWNLOAD_DIR: Path = Path(os.getenv("DOWNLOAD_DIR", "downloads"))
    TEMP_DIR: Path = Path(os.getenv("TEMP_DIR", "temp"))
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 100 * 1024 * 1024))  # 100MB
    DOWNLOAD_TIMEOUT: int = int(os.getenv("DOWNLOAD_TIMEOUT", 120))  # seconds
    
    # Cookie settings
    COOKIES_FILE: Path = Path(os.getenv("COOKIES_FILE", "cookies.txt"))
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", 10))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", 60))  # seconds
    
    # Cleanup
    CLEANUP_INTERVAL: int = int(os.getenv("CLEANUP_INTERVAL", 3600))  # 1 hour
    FILE_RETENTION: int = int(os.getenv("FILE_RETENTION", 3600))  # 1 hour

# Create directories
Config.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
Config.TEMP_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class VideoDownloaderError(Exception):
    """Base exception for video downloader"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class PrivateAccountError(VideoDownloaderError):
    """Video is from a private account"""
    def __init__(self, message: str = "This account is private"):
        super().__init__(message, status_code=403)

class VideoDeletedError(VideoDownloaderError):
    """Video has been deleted"""
    def __init__(self, message: str = "This video has been deleted"):
        super().__init__(message, status_code=404)

class GeoBlockedError(VideoDownloaderError):
    """Video is geo-blocked"""
    def __init__(self, message: str = "This video is not available in your region"):
        super().__init__(message, status_code=403)

class RateLimitError(VideoDownloaderError):
    """Rate limit exceeded"""
    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(message, status_code=429)

class LoginRequiredError(VideoDownloaderError):
    """Login required"""
    def __init__(self, message: str = "Login required to access this content"):
        super().__init__(message, status_code=401)

class UnsupportedSiteError(VideoDownloaderError):
    """Site not supported"""
    def __init__(self, message: str = "This site is not supported"):
        super().__init__(message, status_code=400)

# ============================================================================
# DATA MODELS
# ============================================================================

class DownloadRequest(BaseModel):
    """Request model for video download"""
    url: HttpUrl = Field(..., description="Social media video URL")
    quality: str = Field(default="best", description="Video quality: best, high, medium, low")
    format: str = Field(default="mp4", description="Output format: mp4, webm, mp3")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.instagram.com/reel/ABC123/",
                "quality": "best",
                "format": "mp4"
            }
        }

class VideoInfo(BaseModel):
    """Video information model"""
    id: str
    title: str
    description: Optional[str] = None
    uploader: str
    uploader_id: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    upload_date: Optional[str] = None
    platform: str
    url: str
    download_url: Optional[str] = None
    filesize: Optional[int] = None
    filesize_approx: Optional[int] = None
    ext: str = "mp4"
    quality: str = "best"

class ApiResponse(BaseModel):
    """Standard API response model"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ============================================================================
# RATE LIMITER
# ============================================================================

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed"""
        now = time.time()
        
        # Clean old requests
        if client_id in self.requests:
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if now - req_time < self.window_seconds
            ]
        else:
            self.requests[client_id] = []
        
        # Check limit
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        # Add request
        self.requests[client_id].append(now)
        return True
    
    def get_retry_after(self, client_id: str) -> int:
        """Get seconds until retry is allowed"""
        if client_id not in self.requests:
            return 0
        
        oldest = min(self.requests[client_id])
        return int(self.window_seconds - (time.time() - oldest)) + 1

rate_limiter = RateLimiter(Config.RATE_LIMIT_REQUESTS, Config.RATE_LIMIT_WINDOW)

# ============================================================================
# YT-DLP WRAPPER
# ============================================================================

class YtDlpDownloader:
    """yt-dlp wrapper with production-ready features"""
    
    # Supported platforms
    SUPPORTED_PLATFORMS = {
        'instagram.com': 'Instagram',
        'instagr.am': 'Instagram',
        'tiktok.com': 'TikTok',
        'twitter.com': 'Twitter/X',
        'x.com': 'Twitter/X',
        'youtube.com': 'YouTube',
        'youtu.be': 'YouTube',
        'facebook.com': 'Facebook',
        'fb.watch': 'Facebook',
        'vimeo.com': 'Vimeo',
        'reddit.com': 'Reddit',
        'pinterest.com': 'Pinterest',
        'linkedin.com': 'LinkedIn',
        'snapchat.com': 'Snapchat',
    }
    
    def __init__(self, cookies_file: Optional[Path] = None):
        self.cookies_file = cookies_file
        self._validate_cookies()
    
    def _validate_cookies(self) -> None:
        """Validate cookies file exists"""
        if self.cookies_file and not self.cookies_file.exists():
            logger.warning(f"Cookies file not found: {self.cookies_file}")
            logger.warning("Instagram and some sites may require login")
    
    def _get_ydl_options(self, output_path: Path, quality: str = "best") -> Dict:
        """
        Build yt-dlp options for optimal extraction
        
        Args:
            output_path: Where to save the file
            quality: Quality preference (best, high, medium, low)
        
        Returns:
            yt-dlp options dictionary
        """
        # Quality mapping
        quality_map = {
            'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'high': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]',
            'medium': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]',
            'low': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]',
        }
        
        options = {
            # Format selection
            'format': quality_map.get(quality, quality_map['best']),
            'merge_output_format': 'mp4',
            
            # Output settings
            'outtmpl': str(output_path / '%(id)s.%(ext)s'),
            'restrictfilenames': True,
            'nooverwrites': True,
            
            # Network settings
            'socket_timeout': 30,
            'retries': 3,
            'fragment_retries': 3,
            'http_chunk_size': 10485760,  # 10MB
            
            # Performance
            'concurrent_fragment_downloads': 4,
            'ratelimit': 0,  # No limit
            
            # Stealth
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': None,
            
            # Cookies (crucial for Instagram)
            'cookiefile': str(self.cookies_file) if self.cookies_file and self.cookies_file.exists() else None,
            
            # Avoid downloads
            'skip_download': True,  # We only want to extract info
            'writesubtitles': False,
            'writeautomaticsub': False,
            'writethumbnail': False,
            
            # Extractor settings
            'extract_flat': False,
            'include_ads': False,
            
            # Compatibility
            'compat_opts': {'allow-unsafe-ext'},
            
            # Progress
            'noprogress': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        # Add geo-bypass for geo-blocked content
        options['geo_bypass'] = True
        
        return options
    
    def _get_download_options(self, output_path: Path, quality: str = "best") -> Dict:
        """Get options for actual file download"""
        options = self._get_ydl_options(output_path, quality)
        options['skip_download'] = False
        return options
    
    def _detect_platform(self, url: str) -> Optional[str]:
        """Detect social media platform from URL"""
        from urllib.parse import urlparse
        
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Remove www.
        domain = domain.replace('www.', '')
        
        for supported_domain, platform_name in self.SUPPORTED_PLATFORMS.items():
            if supported_domain in domain:
                return platform_name
        
        return None
    
    async def extract_info(self, url: str, quality: str = "best") -> VideoInfo:
        """
        Extract video information without downloading
        
        Args:
            url: Social media video URL
            quality: Quality preference
        
        Returns:
            VideoInfo object with metadata
        """
        loop = asyncio.get_event_loop()
        
        def _extract():
            options = self._get_ydl_options(Config.TEMP_DIR, quality)
            
            with yt_dlp.YoutubeDL(options) as ydl:
                try:
                    info = ydl.extract_info(url, download=False)
                    
                    if not info:
                        raise VideoDownloaderError("No video information returned", status_code=500)
                    
                    # Detect platform
                    platform = self._detect_platform(url) or info.get('extractor', 'Unknown')
                    
                    # Get direct URL if available
                    download_url = info.get('url')
                    if not download_url and info.get('formats'):
                        # Get best format URL
                        formats = info.get('formats', [])
                        if formats:
                            download_url = formats[-1].get('url')
                    
                    return VideoInfo(
                        id=info.get('id', 'unknown'),
                        title=info.get('title', 'Unknown Video'),
                        description=info.get('description'),
                        uploader=info.get('uploader', 'Unknown'),
                        uploader_id=info.get('uploader_id'),
                        thumbnail=info.get('thumbnail'),
                        duration=info.get('duration'),
                        view_count=info.get('view_count'),
                        like_count=info.get('like_count'),
                        upload_date=info.get('upload_date'),
                        platform=platform,
                        url=url,
                        download_url=download_url,
                        filesize=info.get('filesize'),
                        filesize_approx=info.get('filesize_approx'),
                        ext=info.get('ext', 'mp4'),
                        quality=quality,
                    )
                    
                except yt_dlp.utils.DownloadError as e:
                    error_msg = str(e).lower()
                    
                    # Parse specific error types
                    if 'private' in error_msg or 'unavailable' in error_msg:
                        raise PrivateAccountError("This account or video is private")
                    elif 'deleted' in error_msg or 'removed' in error_msg:
                        raise VideoDeletedError("This video has been deleted or removed")
                    elif 'unavailable' in error_msg and 'country' in error_msg:
                        raise GeoBlockedError("This video is not available in your region")
                    elif 'login' in error_msg or 'authentication' in error_msg:
                        raise LoginRequiredError("Login required to access this content")
                    elif 'rate limit' in error_msg or 'too many requests' in error_msg:
                        raise RateLimitError("Rate limit exceeded. Please try again later.")
                    else:
                        raise VideoDownloaderError(f"Extraction failed: {str(e)[:200]}")
        
        return await loop.run_in_executor(None, _extract)
    
    async def download_video(
        self,
        url: str,
        quality: str = "best",
        output_filename: Optional[str] = None,
    ) -> Path:
        """
        Download video to server
        
        Args:
            url: Social media video URL
            quality: Quality preference
            output_filename: Custom output filename
        
        Returns:
            Path to downloaded file
        """
        loop = asyncio.get_event_loop()
        
        # Generate output path
        if output_filename:
            output_path = Config.DOWNLOAD_DIR / output_filename
        else:
            output_path = Config.DOWNLOAD_DIR / f"video_{int(time.time())}"
        
        def _download():
            options = self._get_download_options(Config.DOWNLOAD_DIR, quality)
            options['outtmpl'] = str(output_path) + '.%(ext)s'
            
            with yt_dlp.YoutubeDL(options) as ydl:
                try:
                    info = ydl.extract_info(url, download=True)
                    
                    if not info:
                        raise VideoDownloaderError("Download failed")
                    
                    # Find the actual file
                    filename = ydl.prepare_filename(info)
                    
                    # Handle merged files
                    if not Path(filename).exists():
                        # Try mp4 extension
                        filename = Path(filename).with_suffix('.mp4')
                    
                    if not Path(filename).exists():
                        raise VideoDownloaderError("Downloaded file not found")
                    
                    return Path(filename)
                    
                except yt_dlp.utils.DownloadError as e:
                    error_msg = str(e).lower()
                    
                    if 'private' in error_msg:
                        raise PrivateAccountError("This account or video is private")
                    elif 'deleted' in error_msg:
                        raise VideoDeletedError("This video has been deleted")
                    elif 'unavailable' in error_msg and 'country' in error_msg:
                        raise GeoBlockedError("This video is not available in your region")
                    elif 'login' in error_msg:
                        raise LoginRequiredError("Login required")
                    elif 'rate limit' in error_msg:
                        raise RateLimitError("Rate limit exceeded")
                    else:
                        raise VideoDownloaderError(f"Download failed: {str(e)[:200]}")
        
        return await loop.run_in_executor(None, _download)

# ============================================================================
# FASTAPI APP
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("🚀 Social Media Downloader API starting...")
    logger.info(f"📁 Download directory: {Config.DOWNLOAD_DIR.absolute()}")
    logger.info(f"🍪 Cookies file: {Config.COOKIES_FILE.absolute()}")
    
    # Start cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Social Media Video Downloader API",
    description="Download videos from Instagram, TikTok, Twitter, YouTube, and more",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize downloader
downloader = YtDlpDownloader(Config.COOKIES_FILE)

# ============================================================================
# BACKGROUND TASKS
# ============================================================================

async def periodic_cleanup():
    """Periodically clean up old files"""
    while True:
        try:
            await asyncio.sleep(Config.CLEANUP_INTERVAL)
            cleanup_old_files()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Cleanup error: {e}")

def cleanup_old_files():
    """Remove files older than retention period"""
    now = time.time()
    removed = 0
    
    for directory in [Config.DOWNLOAD_DIR, Config.TEMP_DIR]:
        if not directory.exists():
            continue
        
        for file_path in directory.glob("*"):
            if file_path.is_file():
                try:
                    file_age = now - file_path.stat().st_mtime
                    if file_age > Config.FILE_RETENTION:
                        file_path.unlink()
                        removed += 1
                        logger.info(f"Cleaned up: {file_path}")
                except Exception as e:
                    logger.error(f"Error cleaning {file_path}: {e}")
    
    if removed > 0:
        logger.info(f"Cleanup complete: removed {removed} files")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", response_model=ApiResponse)
async def root():
    """API health check"""
    return ApiResponse(
        success=True,
        data={
            "name": "Social Media Downloader API",
            "version": "2.0.0",
            "status": "running",
            "supported_platforms": list(YtDlpDownloader.SUPPORTED_PLATFORMS.values()),
        }
    )

@app.get("/health", response_model=ApiResponse)
async def health_check():
    """Detailed health check"""
    return ApiResponse(
        success=True,
        data={
            "status": "healthy",
            "download_dir_exists": Config.DOWNLOAD_DIR.exists(),
            "cookies_available": Config.COOKIES_FILE.exists(),
            "disk_usage": get_disk_usage(),
        }
    )

@app.get("/platforms", response_model=ApiResponse)
async def list_platforms():
    """List supported platforms"""
    return ApiResponse(
        success=True,
        data={
            "platforms": YtDlpDownloader.SUPPORTED_PLATFORMS,
            "count": len(YtDlpDownloader.SUPPORTED_PLATFORMS),
        }
    )

@app.post("/extract", response_model=ApiResponse)
async def extract_video_info(request: DownloadRequest, client_ip: str = Query(default="unknown")):
    """
    Extract video information without downloading
    
    Returns metadata and direct download URL if available
    """
    # Rate limiting
    if not rate_limiter.is_allowed(client_ip):
        retry_after = rate_limiter.get_retry_after(client_ip)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds",
        )
    
    try:
        logger.info(f"Extracting info: {request.url}")
        
        # Extract info
        video_info = await downloader.extract_info(
            str(request.url),
            quality=request.quality,
        )
        
        return ApiResponse(
            success=True,
            data=video_info.model_dump(),
            message=f"Successfully extracted info from {video_info.platform}",
        )
        
    except VideoDownloaderError as e:
        logger.warning(f"Extraction error: {e.message}")
        return ApiResponse(
            success=False,
            error=e.__class__.__name__,
            message=e.message,
        )
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return ApiResponse(
            success=False,
            error="InternalServerError",
            message="An unexpected error occurred",
        )

@app.post("/download", response_model=ApiResponse)
async def download_video(
    request: DownloadRequest,
    background_tasks: BackgroundTasks,
    client_ip: str = Query(default="unknown"),
):
    """
    Download video to server
    
    Returns file path for retrieval
    """
    # Rate limiting
    if not rate_limiter.is_allowed(client_ip):
        retry_after = rate_limiter.get_retry_after(client_ip)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds",
        )
    
    try:
        logger.info(f"Downloading: {request.url}")
        
        # Download video
        file_path = await downloader.download_video(
            str(request.url),
            quality=request.quality,
        )
        
        # Get file info
        file_size = file_path.stat().st_size
        
        logger.info(f"Download complete: {file_path} ({file_size} bytes)")
        
        return ApiResponse(
            success=True,
            data={
                "filename": file_path.name,
                "path": str(file_path),
                "size": file_size,
                "size_mb": round(file_size / 1024 / 1024, 2),
                "quality": request.quality,
                "format": request.format,
            },
            message="Download complete",
        )
        
    except VideoDownloaderError as e:
        logger.warning(f"Download error: {e.message}")
        return ApiResponse(
            success=False,
            error=e.__class__.__name__,
            message=e.message,
        )
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return ApiResponse(
            success=False,
            error="InternalServerError",
            message="An unexpected error occurred",
        )

@app.get("/file/{filename}")
async def get_file(filename: str):
    """Retrieve downloaded file"""
    file_path = Config.DOWNLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="video/mp4",
    )

@app.delete("/file/{filename}", response_model=ApiResponse)
async def delete_file(filename: str):
    """Delete downloaded file"""
    file_path = Config.DOWNLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return ApiResponse(
            success=True,
            message=f"File {filename} deleted successfully",
        )
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

@app.post("/cleanup", response_model=ApiResponse)
async def force_cleanup():
    """Force cleanup of old files"""
    try:
        cleanup_old_files()
        return ApiResponse(
            success=True,
            message="Cleanup completed",
        )
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail="Cleanup failed")

# ============================================================================
# UTILITIES
# ============================================================================

def get_disk_usage() -> Dict:
    """Get disk usage statistics"""
    import shutil
    
    total, used, free = shutil.disk_usage(Config.DOWNLOAD_DIR)
    return {
        "total_gb": round(total / (1024**3), 2),
        "used_gb": round(used / (1024**3), 2),
        "free_gb": round(free / (1024**3), 2),
        "percent_used": round(used / total * 100, 2),
    }

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Run the server"""
    import uvicorn
    
    logger.info(f"Starting server on {Config.HOST}:{Config.PORT}")
    
    uvicorn.run(
        app,
        host=Config.HOST,
        port=Config.PORT,
        log_level="info" if Config.DEBUG else "warning",
    )

if __name__ == "__main__":
    main()
