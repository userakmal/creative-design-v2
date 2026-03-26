"""
Universal Pro Downloader API
=============================
Production-grade video extraction system with smart routing,
multiple engines (yt-dlp, Playwright), and FFmpeg processing.

Author: Creative Design Uz Team
Version: 3.0.0
"""

import asyncio
import logging
import os
import shutil
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, HttpUrl, Field

# Import extractors
from extractors.base import ExtractionResult, DownloadStatus
from extractors.ytdlp import YtDlpExtractor
from extractors.playwright import PlaywrightExtractor
from processors.ffmpeg import FFmpegProcessor
from utils.cleanup import CleanupService
from utils.config import Config

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('universal_downloader.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# DATA MODELS
# ============================================================================

class EngineType(str, Enum):
    """Extraction engine types"""
    YTDLP = "yt-dlp"
    PLAYWRIGHT = "playwright"
    FFMPEG = "ffmpeg"

class DownloadRequest(BaseModel):
    """Request model for video download"""
    url: HttpUrl = Field(..., description="Video URL to download")
    quality: str = Field(default="best", description="Quality: best, high, medium, low")
    format: str = Field(default="mp4", description="Output format: mp4, webm, mp3")
    force_fallback: bool = Field(default=False, description="Force Playwright fallback")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.instagram.com/reel/ABC123/",
                "quality": "best",
                "format": "mp4",
                "force_fallback": False
            }
        }

class VideoMetadata(BaseModel):
    """Video metadata"""
    title: str
    uploader: Optional[str] = None
    duration: Optional[int] = None
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    view_count: Optional[int] = None
    like_count: Optional[int] = None

class ExtractionInfo(BaseModel):
    """Extraction result info"""
    success: bool
    engine: EngineType
    url: str
    download_url: Optional[str] = None
    file_path: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    is_m3u8: bool = False
    filesize: Optional[int] = None
    error: Optional[str] = None

class ApiResponse(BaseModel):
    """Standard API response"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    processing_time: Optional[float] = None

# ============================================================================
# SMART ROUTER (Factory/Strategy Pattern)
# ============================================================================

class UniversalDownloaderRouter:
    """
    Smart router that implements Factory/Strategy pattern
    to route URLs to appropriate extraction engine
    """
    
    def __init__(
        self,
        ytdlp_extractor: YtDlpExtractor,
        playwright_extractor: PlaywrightExtractor,
        ffmpeg_processor: FFmpegProcessor,
    ):
        self.ytdlp = ytdlp_extractor
        self.playwright = playwright_extractor
        self.ffmpeg = ffmpeg_processor
        
        # Domains best handled by yt-dlp
        self.ytdlp_optimized_domains = {
            'youtube.com', 'youtu.be',
            'instagram.com', 'instagr.am',
            'tiktok.com',
            'twitter.com', 'x.com',
            'facebook.com', 'fb.watch',
            'vimeo.com',
            'twitch.tv',
            'soundcloud.com',
        }
        
        # Domains that usually need Playwright
        self.playwright_optimized_domains = {
            'reddit.com',
            'pinterest.com',
            'linkedin.com',
            'snapchat.com',
        }
    
    def _should_use_playwright_first(self, url: str) -> bool:
        """Determine if Playwright should be tried first"""
        from urllib.parse import urlparse
        
        domain = urlparse(url).netloc.lower()
        
        # Check if domain is in Playwright-optimized list
        for pw_domain in self.playwright_optimized_domains:
            if pw_domain in domain:
                return True
        
        return False
    
    def _should_skip_ytdlp(self, url: str) -> bool:
        """Check if we should skip yt-dlp entirely"""
        from urllib.parse import urlparse
        
        domain = urlparse(url).netloc.lower()
        
        # Direct M3U8 or MP4 URLs - skip yt-dlp
        if any(ext in url.lower() for ext in ['.m3u8', '.mp4', '.webm', '.mkv']):
            return True
        
        return False
    
    async def extract(
        self,
        url: str,
        quality: str = "best",
        force_fallback: bool = False,
    ) -> ExtractionInfo:
        """
        Smart extraction with automatic engine selection and fallback
        
        Flow:
        1. Analyze URL to determine best engine
        2. Try yt-dlp first (fastest, most reliable)
        3. If yt-dlp fails, fallback to Playwright
        4. If M3U8 detected, process with FFmpeg
        """
        
        start_time = time.time()
        logger.info(f"🔍 Starting extraction: {url[:100]}...")
        
        # Check if we should skip yt-dlp
        skip_ytdlp = force_fallback or self._should_skip_ytdlp(url)
        
        # Try yt-dlp first (primary engine)
        if not skip_ytdlp:
            try:
                logger.info("🎯 Trying yt-dlp engine...")
                result = await self.ytdlp.extract(url, quality)
                
                if result.success and result.download_url:
                    logger.info(f"✅ yt-dlp succeeded in {time.time() - start_time:.2f}s")
                    
                    # Check if M3U8 - process with FFmpeg
                    if result.is_m3u8 and result.download_url:
                        logger.info("📹 M3U8 detected, processing with FFmpeg...")
                        ffmpeg_result = await self.ffmpeg.download_m3u8(
                            result.download_url,
                            output_filename=f"video_{int(time.time())}"
                        )
                        
                        if ffmpeg_result.success:
                            return ExtractionInfo(
                                success=True,
                                engine=EngineType.FFMPEG,
                                url=url,
                                file_path=str(ffmpeg_result.file_path),
                                metadata=VideoMetadata(**result.metadata) if result.metadata else None,
                                is_m3u8=True,
                                filesize=ffmpeg_result.filesize,
                            )
                    
                    # Direct download URL
                    return ExtractionInfo(
                        success=True,
                        engine=EngineType.YTDLP,
                        url=url,
                        download_url=result.download_url,
                        metadata=VideoMetadata(**result.metadata) if result.metadata else None,
                        is_m3u8=result.is_m3u8,
                    )
                    
            except Exception as e:
                logger.warning(f"yt-dlp failed: {e}")
                # Continue to fallback
        
        # Fallback to Playwright
        try:
            logger.info("🎭 Trying Playwright fallback engine...")
            result = await self.playwright.extract(url, quality)
            
            if result.success and result.download_url:
                logger.info(f"✅ Playwright succeeded in {time.time() - start_time:.2f}s")
                
                # Check if M3U8 - process with FFmpeg
                if result.is_m3u8 and result.download_url:
                    logger.info("📹 M3U8 detected, processing with FFmpeg...")
                    ffmpeg_result = await self.ffmpeg.download_m3u8(
                        result.download_url,
                        output_filename=f"video_{int(time.time())}"
                    )
                    
                    if ffmpeg_result.success:
                        return ExtractionInfo(
                            success=True,
                            engine=EngineType.FFMPEG,
                            url=url,
                            file_path=str(ffmpeg_result.file_path),
                            metadata=VideoMetadata(**result.metadata) if result.metadata else None,
                            is_m3u8=True,
                            filesize=ffmpeg_result.filesize,
                        )
                
                return ExtractionInfo(
                    success=True,
                    engine=EngineType.PLAYWRIGHT,
                    url=url,
                    download_url=result.download_url,
                    metadata=VideoMetadata(**result.metadata) if result.metadata else None,
                    is_m3u8=result.is_m3u8,
                )
                
        except Exception as e:
            logger.warning(f"Playwright failed: {e}")
        
        # All engines failed
        elapsed = time.time() - start_time
        logger.error(f"❌ All extraction engines failed in {elapsed:.2f}s")
        
        return ExtractionInfo(
            success=False,
            engine=EngineType.YTDLP,  # Primary engine that was tried first
            url=url,
            error="All extraction methods failed. URL may be invalid or protected.",
        )

# ============================================================================
# FASTAPI APP
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("🚀 Universal Pro Downloader API starting...")
    logger.info(f"📁 Download directory: {Config.DOWNLOAD_DIR.absolute()}")
    logger.info(f"🍪 Cookies file: {Config.COOKIES_FILE.absolute()}")
    logger.info(f"🎬 FFmpeg available: {shutil.which('ffmpeg') is not None}")
    
    # Initialize components
    ytdlp = YtDlpExtractor(
        cookies_file=Config.COOKIES_FILE,
        download_dir=Config.DOWNLOAD_DIR,
    )
    
    playwright = PlaywrightExtractor(
        download_dir=Config.DOWNLOAD_DIR,
        timeout=Config.PLAYWRIGHT_TIMEOUT,
    )
    
    ffmpeg = FFmpegProcessor(
        download_dir=Config.DOWNLOAD_DIR,
    )
    
    # Create router
    app.state.router = UniversalDownloaderRouter(ytdlp, playwright, ffmpeg)
    app.state.cleanup_service = CleanupService(Config.DOWNLOAD_DIR)
    
    # Start background cleanup
    cleanup_task = asyncio.create_task(
        app.state.cleanup_service.start_periodic_cleanup()
    )
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    # Close Playwright
    await playwright.close()

app = FastAPI(
    title="Universal Pro Downloader API",
    description="Download videos from ANY platform with smart routing and automatic fallback",
    version="3.0.0",
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

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", response_model=ApiResponse)
async def root():
    """API health check"""
    return ApiResponse(
        success=True,
        data={
            "name": "Universal Pro Downloader API",
            "version": "3.0.0",
            "status": "running",
            "engines": ["yt-dlp", "playwright", "ffmpeg"],
        }
    )

@app.get("/health", response_model=ApiResponse)
async def health_check():
    """Detailed health check"""
    import shutil
    
    return ApiResponse(
        success=True,
        data={
            "status": "healthy",
            "ffmpeg_available": shutil.which('ffmpeg') is not None,
            "cookies_available": Config.COOKIES_FILE.exists(),
            "download_dir_exists": Config.DOWNLOAD_DIR.exists(),
        }
    )

@app.post("/api/download", response_model=ApiResponse)
async def download_video(
    request: DownloadRequest,
    background_tasks: BackgroundTasks,
    client_ip: str = Query(default="unknown"),
):
    """
    Universal video downloader with smart routing
    
    Automatically selects best extraction engine and falls back
    to alternative methods if primary fails.
    """
    start_time = time.time()
    logger.info(f"📥 Download request from {client_ip}: {request.url}")
    
    try:
        # Get router from app state
        router: UniversalDownloaderRouter = app.state.router
        
        # Extract video
        result = await router.extract(
            url=str(request.url),
            quality=request.quality,
            force_fallback=request.force_fallback,
        )
        
        processing_time = time.time() - start_time
        
        if result.success:
            logger.info(f"✅ Download complete in {processing_time:.2f}s")
            
            response_data = {
                "engine_used": result.engine.value,
                "url": result.url,
                "is_m3u8": result.is_m3u8,
                "processing_time": processing_time,
            }
            
            if result.download_url:
                response_data["download_url"] = result.download_url
            
            if result.file_path:
                response_data["file_path"] = result.file_path
                response_data["filename"] = Path(result.file_path).name
            
            if result.metadata:
                response_data["metadata"] = result.metadata.model_dump()
            
            if result.filesize:
                response_data["filesize"] = result.filesize
                response_data["filesize_mb"] = round(result.filesize / 1024 / 1024, 2)
            
            return ApiResponse(
                success=True,
                data=response_data,
                message=f"Successfully extracted using {result.engine.value}",
                processing_time=processing_time,
            )
        else:
            logger.warning(f"❌ Extraction failed: {result.error}")
            return ApiResponse(
                success=False,
                error="ExtractionFailed",
                message=result.error or "Failed to extract video",
                processing_time=processing_time,
            )
            
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        processing_time = time.time() - start_time
        return ApiResponse(
            success=False,
            error="InternalServerError",
            message=f"An unexpected error occurred: {str(e)[:200]}",
            processing_time=processing_time,
        )

@app.post("/api/extract-info", response_model=ApiResponse)
async def extract_info(request: DownloadRequest):
    """
    Extract video information without downloading
    
    Faster than full download, returns metadata and direct URL
    """
    start_time = time.time()
    
    try:
        router: UniversalDownloaderRouter = app.state.router
        
        result = await router.extract(
            url=str(request.url),
            quality=request.quality,
            force_fallback=request.force_fallback,
        )
        
        processing_time = time.time() - start_time
        
        if result.success:
            return ApiResponse(
                success=True,
                data={
                    "engine_used": result.engine.value,
                    "url": result.url,
                    "download_url": result.download_url,
                    "is_m3u8": result.is_m3u8,
                    "metadata": result.metadata.model_dump() if result.metadata else None,
                },
                message="Info extracted successfully",
                processing_time=processing_time,
            )
        else:
            return ApiResponse(
                success=False,
                error="ExtractionFailed",
                message=result.error,
                processing_time=processing_time,
            )
            
    except Exception as e:
        logger.exception(f"Error: {e}")
        return ApiResponse(
            success=False,
            error="InternalServerError",
            message=str(e)[:200],
        )

@app.get("/api/file/{filename}")
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

@app.delete("/api/file/{filename}", response_model=ApiResponse)
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

@app.post("/api/cleanup", response_model=ApiResponse)
async def force_cleanup():
    """Force cleanup of old files"""
    try:
        cleanup_service: CleanupService = app.state.cleanup_service
        removed = await cleanup_service.cleanup_old_files()
        return ApiResponse(
            success=True,
            message=f"Cleanup completed. Removed {removed} files.",
            data={"removed_count": removed},
        )
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail="Cleanup failed")

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Run the server"""
    import uvicorn
    
    logger.info(f"🌐 Starting server on {Config.HOST}:{Config.PORT}")
    
    uvicorn.run(
        app,
        host=Config.HOST,
        port=Config.PORT,
        log_level="info" if Config.DEBUG else "warning",
    )

if __name__ == "__main__":
    main()
