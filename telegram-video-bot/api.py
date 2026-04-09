"""
Video Downloader FastAPI Backend
Production-ready REST API for web frontend integration.
Shares core logic with Telegram Bot (downloader.py).
"""

import asyncio
import os
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

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
# Lifespan (replaces deprecated on_event)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup
    logger.info("🚀 Video Downloader API starting...")

    Path(config.downloader.DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

    if COOKIE_FILE.exists() and COOKIE_FILE.stat().st_size > 100:
        logger.info(f"✅ Cookies loaded: {COOKIE_FILE} ({COOKIE_FILE.stat().st_size} bytes)")
    else:
        logger.warning("⚠️ cookies.txt not found or empty — YouTube downloads may fail")

    # Start background cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup())

    logger.info("✅ API ready!")
    yield

    # Shutdown
    cleanup_task.cancel()
    logger.info("👋 Video Downloader API shutting down...")


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="Video Downloader API",
    description="REST API for video extraction and download (YouTube, Instagram, TikTok, etc.)",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Configure logging
logger.add(
    "api.log",
    rotation="10 MB",
    retention="7 days",
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
)

# ============================================================================
# CORS Configuration
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://creative-design.uz",
        "https://www.creative-design.uz",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Length", "X-Download-Url"],
)

# ============================================================================
# Pydantic Models
# ============================================================================

class ExtractRequest(BaseModel):
    url: str


class FormatInfo(BaseModel):
    format_id: str
    quality: str
    height: Optional[int]
    filesize: Optional[int]
    filesize_formatted: str
    ext: str
    url: Optional[str] = None


class ExtractResponse(BaseModel):
    success: bool
    title: str
    thumbnail: Optional[str]
    duration: Optional[float]  # Changed from int to float (yt-dlp returns fractional seconds)
    duration_formatted: str
    uploader: Optional[str]
    formats: List[FormatInfo]
    is_live: bool = False


class DownloadRequest(BaseModel):
    url: str
    format_id: Optional[str] = None
    quality: Optional[str] = "best"
    type: Optional[str] = "video"  # "video" or "audio"


class DownloadResponse(BaseModel):
    success: bool
    download_type: str  # "direct" or "file" or "hls"
    direct_url: Optional[str] = None
    file_path: Optional[str] = None
    filename: Optional[str] = None
    file_url: Optional[str] = None
    task_id: Optional[str] = None
    message: str


# ============================================================================
# Global State
# ============================================================================

downloader = VideoDownloader()


# ============================================================================
# Background Tasks
# ============================================================================

async def periodic_cleanup():
    """Delete downloaded files older than 1 hour."""
    while True:
        try:
            await asyncio.sleep(600)  # every 10 minutes
            download_dir = Path(config.downloader.DOWNLOAD_DIR)
            if not download_dir.exists():
                continue
            now = datetime.now().timestamp()
            for f in download_dir.iterdir():
                if f.is_file() and (now - f.stat().st_mtime) > 3600:
                    f.unlink(missing_ok=True)
                    logger.debug(f"Cleaned up old file: {f.name}")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning(f"Cleanup error: {e}")


# ============================================================================
# Helper Functions
# ============================================================================

def extract_available_formats(info: dict) -> List[FormatInfo]:
    """Extract ACTUAL available formats from yt-dlp info dict."""
    formats = []
    raw_formats = info.get("formats", [])
    
    if not raw_formats:
        # No individual formats - only has 'requested_formats' (DASH)
        requested = info.get("requested_formats", [])
        if requested:
            # DASH stream - will be merged automatically
            logger.info(f"DASH formats detected: {len(requested)} streams")
            # Return a single "best" option
            total_size = sum(f.get("filesize") or f.get("filesize_approx", 0) for f in requested)
            formats.append(FormatInfo(
                format_id="best",
                quality="best",
                height=info.get("height"),
                filesize=total_size if total_size > 0 else None,
                filesize_formatted=format_file_size(total_size) if total_size > 0 else "Unknown",
                ext=info.get("ext", "mp4"),
                url=None,
            ))
        else:
            # Single format available
            formats.append(FormatInfo(
                format_id="best",
                quality="best",
                height=info.get("height"),
                filesize=info.get("filesize") or info.get("filesize_approx"),
                filesize_formatted=format_file_size(info.get("filesize") or info.get("filesize_approx", 0)),
                ext=info.get("ext", "mp4"),
                url=info.get("url"),
            ))
        return formats
    
    # Parse individual formats
    quality_map = {}
    for fmt in raw_formats:
        # Skip audio-only formats
        if fmt.get("vcodec") == "none":
            continue
        
        height = fmt.get("height")
        if not height:
            continue
        
        # Group by quality
        if height <= 360:
            quality = "360p"
        elif height <= 480:
            quality = "480p"
        elif height <= 720:
            quality = "720p"
        elif height <= 1080:
            quality = "1080p"
        elif height <= 1440:
            quality = "1440p"
        else:
            quality = f"{height}p"
        
        filesize = fmt.get("filesize") or fmt.get("filesize_approx", 0) or 0
        
        # Keep largest file for each quality
        if quality not in quality_map or filesize > (quality_map[quality].get("filesize") or 0):
            quality_map[quality] = fmt
    
    # Build format list
    for quality, fmt in sorted(
        quality_map.items(),
        key=lambda x: int(re.search(r'\d+', x[0]).group()) if re.search(r'\d+', x[0]) else 0,
    ):
        formats.append(FormatInfo(
            format_id=fmt.get("format_id", "best"),
            quality=quality,
            height=fmt.get("height"),
            filesize=fmt.get("filesize") or fmt.get("filesize_approx"),
            filesize_formatted=format_file_size(fmt.get("filesize") or fmt.get("filesize_approx", 0)),
            ext=fmt.get("ext", "mp4"),
            url=fmt.get("url"),
        ))
    
    # If no video formats found, return "best" only
    if not formats:
        formats.append(FormatInfo(
            format_id="best",
            quality="best",
            height=info.get("height"),
            filesize=info.get("filesize") or info.get("filesize_approx"),
            filesize_formatted=format_file_size(info.get("filesize") or info.get("filesize_approx", 0)),
            ext=info.get("ext", "mp4"),
            url=info.get("url"),
        ))
    
    logger.info(f"Extracted {len(formats)} formats: {[f.quality for f in formats]}")
    return formats


def get_direct_download_url(info: dict) -> Optional[str]:
    """Get direct download URL if available."""
    direct_url = info.get("url")
    if direct_url and direct_url.startswith("http"):
        return direct_url

    formats = info.get("formats", [])
    for fmt in reversed(formats):
        if fmt.get("url") and fmt.get("url").startswith("http"):
            return fmt["url"]

    return None


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """API health check."""
    return {
        "status": "ok",
        "service": "Video Downloader API",
        "version": "2.0.0",
        "endpoints": {
            "extract": "/api/extract",
            "download": "/api/download",
            "files": "/api/files/{filename}",
            "docs": "/api/docs",
        },
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    cookies_status = "loaded" if COOKIE_FILE.exists() and COOKIE_FILE.stat().st_size > 100 else "missing"

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cookies": cookies_status,
    }


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_video(request: ExtractRequest):
    """Extract video information and available qualities."""
    logger.info(f"Extract request: {request.url[:100]}...")

    try:
        loop = asyncio.get_event_loop()

        def extract_sync():
            # NO format restriction - get ALL available formats for YouTube
            opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "noplaylist": True,
                # Get all formats without filtering
                "format": "all",
                "socket_timeout": 20,
                "retries": 5,
                "fragment_retries": 5,
                **get_ytdlp_cookies(),
            }
            import yt_dlp
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(request.url, download=False)

        info = await loop.run_in_executor(None, extract_sync)

        if not info:
            raise HTTPException(status_code=400, detail="Failed to extract video information")

        formats = extract_available_formats(info)

        response = ExtractResponse(
            success=True,
            title=info.get("title", "Unknown"),
            thumbnail=info.get("thumbnail"),
            duration=info.get("duration"),
            duration_formatted=format_duration(info.get("duration")),
            uploader=info.get("uploader") or info.get("channel"),
            formats=formats,
            is_live=info.get("is_live", False),
        )

        logger.info(f"Extract successful: {response.title[:50]}...")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extract failed: {str(e)}")
        error_msg = str(e)
        if "sign in to confirm" in error_msg.lower() or "no video formats" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="YouTube vaqtinchalik bu videoni yuklashga ruxsat bermayapti. Iltimos birozdan so'ng urinib ko'ring.",
            )
        raise HTTPException(status_code=400, detail=f"Failed to extract: {str(e)[:200]}")


@app.post("/api/download", response_model=DownloadResponse)
async def download_video(request: DownloadRequest):
    """
    Download video/audio and serve file directly.
    ALWAYS downloads locally - no direct URLs (prevents stream issues).
    """
    logger.info(f"📥 Download request: URL={request.url[:80]}... | Type={request.type or 'video'} | Quality={request.quality or 'best'}")

    try:
        loop = asyncio.get_event_loop()
        task_id = str(uuid.uuid4())[:8]

        # Get video info first
        logger.info(f"🔍 Extracting info...")
        def extract_sync():
            opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "noplaylist": True,
                "format": "all",
                "socket_timeout": 20,
                "retries": 5,
                "fragment_retries": 5,
                **get_ytdlp_cookies(),
            }
            import yt_dlp
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(request.url, download=False)

        info = await loop.run_in_executor(None, extract_sync)
        
        if not info:
            raise HTTPException(status_code=400, detail="Video ma'lumotlarini olib bo'lmadi")
        
        logger.info(f"✅ Video info extracted: {info.get('title', 'Unknown')[:50]}")

        # Setup download
        download_dir = Path(config.downloader.DOWNLOAD_DIR)
        download_dir.mkdir(parents=True, exist_ok=True)
        
        safe_title = re.sub(r'[<>:"/\\|?*]', "_", info.get("title", "video"))[:100]
        download_type = request.type or "video"

        if download_type == "audio":
            # AUDIO: Extract MP3
            logger.info(f"🎵 Downloading as AUDIO (MP3)")
            output_template = str(download_dir / f"{task_id}_{safe_title}.%(ext)s")
            
            def download_sync():
                opts = {
                    "format": "bestaudio/best",
                    "outtmpl": output_template,
                    "noplaylist": True,
                    "no_warnings": False,  # Show warnings for debugging
                    "quiet": False,
                    "socket_timeout": 20,
                    "retries": 5,
                    "postprocessors": [{
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }],
                    **get_ytdlp_cookies(),
                }
                import yt_dlp
                with yt_dlp.YoutubeDL(opts) as ydl:
                    return ydl.extract_info(request.url, download=True)
        else:
            # VIDEO: Download with quality selection
            logger.info(f"🎬 Downloading as VIDEO (quality: {request.quality})")
            output_template = str(download_dir / f"{task_id}_{safe_title}.%(ext)s")
            
            def download_sync():
                opts = {
                    "format": build_format_string(request.quality),
                    "outtmpl": output_template,
                    "merge_output_format": "mp4",
                    "noplaylist": True,
                    "no_warnings": False,
                    "quiet": False,
                    "socket_timeout": 20,
                    "retries": 5,
                    "fragment_retries": 5,
                    "concurrent_fragment_downloads": 2,
                    **get_ytdlp_cookies(),
                    # FIX: Remove FFmpegMerger postprocessor (causes file not found on Windows)
                    # FFmpegVideoConvertor handles format conversion automatically
                    "postprocessors": [{
                        "key": "FFmpegVideoConvertor",
                        "preferedformat": "mp4",  # Note: yt-dlp uses 'preferedformat' (not 'preferredformat')
                    }],
                    # Keep intermediate files until merge is complete
                    "keepvideo": False,
                    "prefer_ffmpeg": True,
                }
                import yt_dlp
                with yt_dlp.YoutubeDL(opts) as ydl:
                    return ydl.extract_info(request.url, download=True)

        # Execute download
        logger.info(f"⬇️ Starting download...")
        await loop.run_in_executor(None, download_sync)
        
        # Find downloaded file
        downloaded_files = list(download_dir.glob(f"{task_id}_*"))
        logger.info(f"📁 Downloaded files: {[f.name for f in downloaded_files]}")
        
        if not downloaded_files:
            # Try broader search
            all_files = list(download_dir.iterdir())
            recent_files = [f for f in all_files if (datetime.now().timestamp() - f.stat().st_mtime) < 60]
            logger.error(f"❌ Task file not found. Recent files: {[f.name for f in recent_files]}")
            raise HTTPException(status_code=500, detail="Download tugallandi lekin fayl topilmadi")
        
        file_path = downloaded_files[0]
        file_size = file_path.stat().st_size
        
        # Determine correct filename and extension
        if download_type == "audio":
            filename = f"{safe_title}.mp3"
            # Rename if wrong extension
            if file_path.suffix != ".mp3":
                new_path = file_path.with_suffix(".mp3")
                file_path.rename(new_path)
                file_path = new_path
        else:
            filename = f"{safe_title}.mp4"
            # Rename if wrong extension
            if file_path.suffix not in [".mp4", ".mkv", ".webm"]:
                new_path = file_path.with_suffix(".mp4")
                file_path.rename(new_path)
                file_path = new_path
        
        logger.info(f"✅ Download successful: {file_path.name} ({file_size / 1024 / 1024:.2f} MB)")

        return DownloadResponse(
            success=True,
            download_type="file",
            file_path=str(file_path),
            filename=filename,
            file_url=f"/api/files/{file_path.name}",
            task_id=task_id,
            message="File tayyor",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Download failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        error_msg = str(e)
        if "sign in to confirm" in error_msg.lower() or "no video formats" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="YouTube bu videoni bloklagan. Boshqa video urinib ko'ring.",
            )
        raise HTTPException(status_code=500, detail=f"Download xato: {error_msg[:200]}")


@app.get("/api/files/{filename}")
async def serve_file(filename: str):
    """Serve a downloaded file for browser download."""
    # Security: prevent path traversal
    safe_name = Path(filename).name
    download_dir = Path(config.downloader.DOWNLOAD_DIR)
    file_path = download_dir / safe_name

    logger.info(f"File requested: {safe_name}")
    logger.info(f"Download dir: {download_dir}")
    logger.info(f"Full path: {file_path}")
    logger.info(f"File exists: {file_path.exists()}")

    if not file_path.exists() or not file_path.is_file():
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found or expired")

    file_size = file_path.stat().st_size
    logger.info(f"Serving file: {file_path.name} ({file_size} bytes)")

    # Determine MIME type
    if file_path.suffix == ".mp4":
        mime_type = "video/mp4"
    elif file_path.suffix == ".mp3":
        mime_type = "audio/mpeg"
    elif file_path.suffix in [".webm", ".mkv"]:
        mime_type = "video/webm"
    else:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type=mime_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Disposition": f'inline; filename="{file_path.name}"',
        },
    )


@app.delete("/api/files/{filename}")
async def delete_file(filename: str):
    """Delete a downloaded file."""
    safe_name = Path(filename).name
    download_dir = Path(config.downloader.DOWNLOAD_DIR)
    file_path = download_dir / safe_name

    if file_path.exists():
        file_path.unlink(missing_ok=True)
        logger.info(f"Deleted file: {safe_name}")

    return {"status": "deleted", "filename": safe_name}


# ============================================================================
# Run Server (Development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    logger.info("🌐 Starting API server on http://0.0.0.0:8000")
    logger.info("📖 API Docs: http://0.0.0.0:8000/api/docs")

    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
