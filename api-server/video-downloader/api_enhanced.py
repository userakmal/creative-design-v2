"""
Video Downloader FastAPI Backend - FetchV.net Style Enhancement
Production-ready REST API with comprehensive format extraction and HLS support.
"""

import asyncio
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from loguru import logger
from downloader import (
    VideoDownloader,
    VideoInfo,
    get_ytdlp_cookies,
    COOKIE_FILE,
    build_format_string,
)
from config import config
from utils import format_file_size, format_duration, truncate_text

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="Video Downloader API - FetchV Enhanced",
    description="REST API for video extraction and download with FetchV-style format selection",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure logging
logger.add(
    "api.log",
    rotation="10 MB",
    retention="7 days",
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# ============================================================================
# CORS Configuration
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://creative-design.uz",
        "https://www.creative-design.uz",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Download-Url", "X-File-Size"],
)

# ============================================================================
# Enhanced Pydantic Models - FetchV Style
# ============================================================================

class ExtractRequest(BaseModel):
    url: str = Field(..., description="Video URL to extract")
    include_thumbnails: bool = True


class VideoFormat(BaseModel):
    """Individual video format - mimics FetchV format table."""
    format_id: str
    quality: str  # "4K", "1080p", "720p", etc.
    height: Optional[int]
    width: Optional[int]
    filesize: Optional[int]
    filesize_formatted: str
    ext: str
    vcodec: Optional[str]
    acodec: Optional[str]
    fps: Optional[int]
    url: Optional[str] = None
    is_hls: bool = False
    protocol: Optional[str] = None


class AudioFormat(BaseModel):
    """Audio-only format."""
    format_id: str
    quality: str  # "High", "Medium", "Low"
    filesize: Optional[int]
    filesize_formatted: str
    ext: str
    acodec: Optional[str]
    abr: Optional[int]  # Audio bitrate
    url: Optional[str] = None


class MergedFormat(BaseModel):
    """Pre-merged format (video + audio)."""
    format_id: str
    quality: str
    height: Optional[int]
    filesize: Optional[int]
    filesize_formatted: str
    ext: str
    vcodec: Optional[str]
    acodec: Optional[str]
    url: Optional[str] = None


class HLSStream(BaseModel):
    """HLS/m3u8 stream information."""
    format_id: str
    quality: str
    is_live: bool
    protocol: str
    url: str


class ExtractResponse(BaseModel):
    """Comprehensive extraction response - FetchV style."""
    success: bool
    title: str
    thumbnail: Optional[str]
    duration: Optional[int]
    duration_formatted: str
    uploader: Optional[str]
    view_count: Optional[int]
    description: Optional[str]
    
    # Categorized formats
    merged_formats: List[MergedFormat] = []  # Ready MP4s
    video_formats: List[VideoFormat] = []     # Video-only (needs merge)
    audio_formats: List[AudioFormat] = []     # Audio-only
    hls_streams: List[HLSStream] = []         # HLS/m3u8 streams
    
    # Metadata
    is_live: bool = False
    was_live: bool = False
    extractor: Optional[str] = None
    webpage_url: Optional[str] = None


class DownloadRequest(BaseModel):
    url: str
    format_id: Optional[str] = None
    quality: Optional[str] = "best"
    is_hls: bool = False


class DownloadResponse(BaseModel):
    success: bool
    download_type: Literal["direct", "file", "hls"]
    direct_url: Optional[str] = None
    file_path: Optional[str] = None
    filename: Optional[str] = None
    task_id: Optional[str] = None
    message: str
    filesize: Optional[int] = None


# ============================================================================
# Global State
# ============================================================================

downloader = VideoDownloader()
active_downloads: Dict[str, dict] = {}

# ============================================================================
# Enhanced Format Extraction - FetchV Style
# ============================================================================

def categorize_formats(info: dict) -> dict:
    """
    Categorize formats into merged, video-only, audio-only, and HLS.
    Mimics FetchV's comprehensive format table.
    """
    merged_formats = []
    video_formats = []
    audio_formats = []
    hls_streams = []
    
    raw_formats = info.get("formats", [])
    
    for fmt in raw_formats:
        format_id = fmt.get("format_id", "")
        vcodec = fmt.get("vcodec")
        acodec = fmt.get("acodec")
        height = fmt.get("height")
        filesize = fmt.get("filesize") or fmt.get("filesize_approx", 0)
        ext = fmt.get("ext", "mp4")
        url = fmt.get("url")
        protocol = fmt.get("protocol", "")
        
        # Detect HLS streams
        if protocol == "hls" or (url and ".m3u8" in url):
            hls_streams.append(HLSStream(
                format_id=format_id,
                quality=f"{height}p" if height else "HLS",
                is_live=info.get("is_live", False),
                protocol="hls",
                url=url,
            ))
            continue
        
        # Audio-only formats
        if vcodec == "none" and acodec and acodec != "none":
            abr = fmt.get("abr")
            if abr:
                quality = "High" if abr >= 256 else "Medium" if abr >= 128 else "Low"
            else:
                quality = "Medium"
            
            audio_formats.append(AudioFormat(
                format_id=format_id,
                quality=quality,
                filesize=filesize,
                filesize_formatted=format_file_size(filesize),
                ext=ext,
                acodec=acodec,
                abr=int(abr) if abr else None,
                url=url,
            ))
            continue
        
        # Video-only formats (no audio)
        if acodec == "none" and vcodec and vcodec != "none":
            if height:
                quality = f"{height}p"
            else:
                quality = "Video"
            
            video_formats.append(VideoFormat(
                format_id=format_id,
                quality=quality,
                height=height,
                width=fmt.get("width"),
                filesize=filesize,
                filesize_formatted=format_file_size(filesize),
                ext=ext,
                vcodec=vcodec,
                acodec=None,
                fps=int(fmt.get("fps", 0)) if fmt.get("fps") else None,
                url=url,
                protocol=protocol,
            ))
            continue
        
        # Pre-merged formats (has both video and audio)
        if vcodec and vcodec != "none" and acodec and acodec != "none":
            if height:
                quality = f"{height}p"
            else:
                quality = "Mixed"
            
            merged_formats.append(MergedFormat(
                format_id=format_id,
                quality=quality,
                height=height,
                filesize=filesize,
                filesize_formatted=format_file_size(filesize),
                ext=ext,
                vcodec=vcodec,
                acodec=acodec,
                url=url,
            ))
    
    # Sort formats by quality
    def sort_key(fmt):
        if hasattr(fmt, 'height') and fmt.height:
            return fmt.height
        return 0
    
    merged_formats.sort(key=sort_key, reverse=True)
    video_formats.sort(key=sort_key, reverse=True)
    audio_formats.sort(key=lambda x: x.abr or 0, reverse=True)
    
    return {
        "merged_formats": merged_formats,
        "video_formats": video_formats,
        "audio_formats": audio_formats,
        "hls_streams": hls_streams,
    }


# ============================================================================
# API Endpoints - FetchV Enhanced
# ============================================================================

@app.get("/")
async def root():
    """API health check."""
    return {
        "status": "ok",
        "service": "Video Downloader API - FetchV Enhanced",
        "version": "2.0.0",
        "features": [
            "Comprehensive format extraction",
            "HLS/m3u8 stream support",
            "Format categorization (merged, video, audio)",
            "File size estimation",
            "Direct download URLs",
        ],
        "endpoints": {
            "extract": "/api/extract",
            "download": "/api/download",
            "docs": "/api/docs",
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    cookies_status = "loaded" if COOKIE_FILE.exists() and COOKIE_FILE.stat().st_size > 100 else "missing"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cookies": cookies_status,
        "cookie_file": str(COOKIE_FILE),
        "ffmpeg_available": True,  # Will be checked on startup
    }


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_video(request: ExtractRequest):
    """
    Extract comprehensive video information - FetchV style.
    
    Returns categorized formats:
    - merged_formats: Ready-to-download MP4s (video + audio)
    - video_formats: Video-only streams (need audio merge)
    - audio_formats: Audio-only streams
    - hls_streams: HLS/m3u8 live or VOD streams
    """
    logger.info(f"Extract request: {request.url[:100]}...")
    
    try:
        loop = asyncio.get_event_loop()
        
        def extract_sync():
            opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "noplaylist": True,
                "format": "best",
                **get_ytdlp_cookies(),
            }
            
            import yt_dlp
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(request.url, download=False)
        
        info = await loop.run_in_executor(None, extract_sync)
        
        if not info:
            raise HTTPException(status_code=400, detail="Failed to extract video information")
        
        # Categorize formats (FetchV style)
        categorized = categorize_formats(info)
        
        response = ExtractResponse(
            success=True,
            title=info.get("title", "Unknown"),
            thumbnail=info.get("thumbnail") if request.include_thumbnails else None,
            duration=int(info.get("duration", 0)) if info.get("duration") else None,
            duration_formatted=format_duration(info.get("duration")),
            uploader=info.get("uploader") or info.get("channel"),
            view_count=int(info.get("view_count", 0)) if info.get("view_count") else None,
            description=info.get("description", "")[:500] if info.get("description") else None,
            merged_formats=categorized["merged_formats"],
            video_formats=categorized["video_formats"],
            audio_formats=categorized["audio_formats"],
            hls_streams=categorized["hls_streams"],
            is_live=info.get("is_live", False),
            was_live=info.get("was_live", False),
            extractor=info.get("extractor"),
            webpage_url=info.get("webpage_url"),
        )
        
        logger.info(f"Extract successful: {response.title[:50]}... | {len(response.merged_formats)} merged, {len(response.video_formats)} video-only, {len(response.audio_formats)} audio")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extract failed: {str(e)}")
        
        error_msg = str(e)
        if "sign in to confirm" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="YouTube vaqtinchalik bu videoni yuklashga ruxsat bermayapti. Iltimos birozdan so'ng urinib ko'ring."
            )
        if "no video formats" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="Video formatlari topilmadi. Boshqa video bilan urinib ko'ring."
            )
        
        raise HTTPException(status_code=400, detail=f"Failed to extract: {str(e)[:200]}")


@app.post("/api/download", response_model=DownloadResponse)
async def download_video(request: DownloadRequest):
    """
    Download video with format selection.
    
    Handles:
    - Direct URLs (Instagram, TikTok)
    - Pre-merged formats (YouTube with audio)
    - HLS/m3u8 streams (uses FFmpeg to merge TS chunks)
    """
    logger.info(f"Download request: {request.url[:100]}... (quality: {request.quality}, hls: {request.is_hls})")
    
    try:
        loop = asyncio.get_event_loop()
        task_id = str(uuid.uuid4())[:8]
        
        # First, extract info to get best format
        def extract_sync():
            opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "noplaylist": True,
                "format": build_format_string(request.quality),
                **get_ytdlp_cookies(),
            }
            
            import yt_dlp
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(request.url, download=False)
        
        info = await loop.run_in_executor(None, extract_sync)
        
        if not info:
            raise HTTPException(status_code=400, detail="Failed to extract video information")
        
        # Check for direct URL (Instagram, TikTok, etc.)
        direct_url = info.get("url")
        if direct_url and direct_url.startswith("http") and not request.is_hls:
            # Check if it's an HLS stream
            if ".m3u8" in direct_url or info.get("protocol") == "hls":
                request.is_hls = True
            else:
                # Direct download available
                logger.info(f"Direct URL available: {direct_url[:100]}...")
                return DownloadResponse(
                    success=True,
                    download_type="direct",
                    direct_url=direct_url,
                    filename=f"{info.get('title', 'video')}.mp4",
                    message="Direct download URL generated",
                )
        
        # HLS stream or requires merge - download locally
        logger.info(f"Downloading locally (HLS or merge required)...")
        
        download_dir = Path(config.downloader.DOWNLOAD_DIR)
        download_dir.mkdir(parents=True, exist_ok=True)
        
        safe_title = re.sub(r'[<>:"/\\|?*]', "_", info.get("title", "video"))[:100]
        output_template = str(download_dir / f"{task_id}_{safe_title}.%(ext)s")
        
        def download_sync():
            opts = {
                "format": build_format_string(request.quality),
                "outtmpl": output_template,
                "merge_output_format": "mp4",
                "noplaylist": True,
                "no_warnings": True,
                "quiet": True,
                "socket_timeout": 60,
                "retries": 3,
                **get_ytdlp_cookies(),
                "postprocessors": [{
                    "key": "FFmpegVideoConvertor",
                    "preferedformat": "mp4",
                }],
            }
            
            import yt_dlp
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(request.url, download=True)
        
        await loop.run_in_executor(None, download_sync)
        
        downloaded_files = list(download_dir.glob(f"{task_id}_*"))
        
        if not downloaded_files:
            raise HTTPException(status_code=500, detail="Download completed but file not found")
        
        file_path = downloaded_files[0]
        filename = f"{safe_title}.mp4"
        filesize = file_path.stat().st_size
        
        logger.info(f"Download complete: {file_path} ({format_file_size(filesize)})")
        
        return DownloadResponse(
            success=True,
            download_type="hls" if request.is_hls else "file",
            file_path=str(file_path),
            filename=filename,
            task_id=task_id,
            message="File ready for download",
            filesize=filesize,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        
        error_msg = str(e)
        if "Invalid data found when processing input" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="HLS stream invalid or expired. Link muddati tugagan yoki geo-cheklangan."
            )
        if "sign in to confirm" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="YouTube vaqtinchalik bu videoni yuklashga ruxsat bermayapti."
            )
        
        raise HTTPException(status_code=400, detail=f"Download failed: {str(e)[:200]}")


@app.get("/api/download/{task_id}")
async def serve_download(task_id: str):
    """
    Serve downloaded file to client with proper headers.
    Auto-deleted after serving.
    """
    download_dir = Path(config.downloader.DOWNLOAD_DIR)
    files = list(download_dir.glob(f"{task_id}_*"))
    
    if not files:
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    file_path = files[0]
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    filesize = file_path.stat().st_size
    mime_type = "video/mp4" if file_path.suffix == ".mp4" else "application/octet-stream"
    
    logger.info(f"Serving file: {file_path.name} ({format_file_size(filesize)})")
    
    # Return with streaming headers
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type=mime_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{file_path.name}\"",
            "Content-Length": str(filesize),
            "X-File-Size": str(filesize),
            "Accept-Ranges": "bytes",
        },
    )


@app.delete("/api/download/{task_id}")
async def cancel_download(task_id: str):
    """Cancel and cleanup a download."""
    download_dir = Path(config.downloader.DOWNLOAD_DIR)
    files = list(download_dir.glob(f"{task_id}_*"))
    
    for file_path in files:
        try:
            file_path.unlink()
            logger.info(f"Cancelled download: {file_path.name}")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
    
    return {"status": "cancelled", "task_id": task_id}


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("🚀 Video Downloader API - FetchV Enhanced starting...")
    
    Path(config.downloader.DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
    
    if COOKIE_FILE.exists() and COOKIE_FILE.stat().st_size > 100:
        logger.info(f"✅ Cookies loaded: {COOKIE_FILE} ({COOKIE_FILE.stat().st_size} bytes)")
    else:
        logger.warning("⚠️ cookies.txt not found or empty - YouTube downloads may fail")
    
    logger.info("✅ API ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("👋 Video Downloader API shutting down...")


# ============================================================================
# Run Server (Development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🌐 Starting FetchV Enhanced API on http://0.0.0.0:8000")
    logger.info("📖 API Docs: http://0.0.0.0:8000/api/docs")
    
    uvicorn.run(
        "api_enhanced:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
