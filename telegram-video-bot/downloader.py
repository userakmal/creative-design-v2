"""
Video Downloader Engine
Core yt-dlp extraction and download logic with FFmpeg merge support.
Used by both Telegram Bot and FastAPI Web Backend.
"""

import asyncio
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import yt_dlp
from loguru import logger

from config import config
from models import DownloadStatus, DownloadTask, VideoInfo

# ============================================================================
# Custom Exceptions
# ============================================================================

class DownloadError(Exception):
    """Exception raised when video download fails."""
    pass


class VideoTooLargeError(Exception):
    """Exception raised when video exceeds size limit."""
    pass


class InvalidURLError(Exception):
    """Exception raised when URL is invalid or unsupported."""
    pass


class HLSProcessingError(Exception):
    """Exception raised when HLS stream processing fails."""
    pass


class AudioExtractionError(Exception):
    """Exception raised when audio extraction fails."""
    pass



# ============================================================================
# Configuration
# ============================================================================

# Static cookies file for YouTube authentication (bypasses bot protection)
COOKIE_FILE = Path(__file__).parent / "cookies.txt"


def check_ffmpeg() -> bool:
    """Check if FFmpeg is available and log confirmation."""
    try:
        result = subprocess.run(
            [config.downloader.FFMPEG_PATH, "-version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.split()[2] if result.stdout.split() else "unknown"
            logger.info(f"✅ FFmpeg available: {version} (required for video/audio merge)")
            return True
    except Exception as e:
        logger.warning(f"⚠️ FFmpeg check failed: {e}")
    return False


def get_ytdlp_cookies() -> dict:
    """
    Get cookies configuration for yt-dlp.
    Uses static cookies.txt file for maximum reliability.
    """
    if COOKIE_FILE.exists() and COOKIE_FILE.stat().st_size > 100:
        logger.debug(f"Using cookies from: {COOKIE_FILE} ({COOKIE_FILE.stat().st_size} bytes)")
        return {"cookiefile": str(COOKIE_FILE)}
    else:
        logger.warning("⚠️ cookies.txt not found or too small - YouTube downloads may fail")
        return {}


def build_format_string(resolution: Optional[str] = None) -> str:
    """
    Build dynamic yt-dlp format string for robust download.
    
    Args:
        resolution: Target resolution ("360", "720", "1080", "best") or None
    
    Returns:
        yt-dlp format string with proper fallbacks
    """
    if resolution and resolution != "best":
        try:
            height = int(resolution)
            # Dynamic format: DASH merge → pre-merged → any available
            return f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[height<={height}]/best'
        except (ValueError, TypeError):
            pass
    
    # Default: best available with DASH merge
    return 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best/best'


# ============================================================================
# Video Downloader Class
# ============================================================================

class VideoDownloader:
    """
    Advanced video downloader with yt-dlp and FFmpeg support.
    Handles universal URLs and DASH stream merging.
    """

    def __init__(self, download_dir: Optional[str] = None):
        self.download_dir = Path(download_dir or config.downloader.DOWNLOAD_DIR)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        self._progress_callback: Optional[Callable[[int], None]] = None

    def set_progress_callback(self, callback: Callable[[int], None]) -> None:
        """Set callback for download progress updates."""
        self._progress_callback = callback

    def _detect_hls(self, url: str) -> bool:
        """Detect if URL is an HLS (.m3u8) stream."""
        hls_patterns = [
            r"\.m3u8(\?.*)?$",
            r"m3u8",
            r"format=m3u8",
            r"protocol=hls",
        ]
        return any(re.search(pattern, url, re.IGNORECASE) for pattern in hls_patterns)

    def _create_ytdlp_options(
        self,
        output_path: str,
        progress_hook: Optional[Callable] = None,
        resolution: Optional[str] = None,
    ) -> dict:
        """
        Create yt-dlp options dictionary with dynamic format selection.

        Args:
            output_path: Output file path template
            progress_hook: Optional progress callback
            resolution: Target resolution ("360", "720", "1080", "best")
        """
        format_str = build_format_string(resolution)

        opts = {
            "format": format_str,
            "outtmpl": output_path,
            "merge_output_format": "mp4",
            "noplaylist": True,
            "no_warnings": True,
            "quiet": True,
            "nocheckcertificate": True,
            "extract_flat": False,
            "writeinfojson": False,
            "writesubtitles": False,
            "writethumbnail": False,
            # FIX #3: Prevent yt-dlp hangs with socket timeout and retries
            "socket_timeout": 15,
            "retries": 3,
            "fragment_retries": 3,
            "http_chunk_size": 10485760,  # 10MB
            # CRITICAL: Static cookies for YouTube authentication
            **get_ytdlp_cookies(),
            # CRITICAL: FFmpeg post-processor for DASH merge
            "postprocessors": [{
                "key": "FFmpegVideoConvertor",
                "preferedformat": "mp4",
            }],
        }

        if progress_hook:
            opts["progress_hooks"] = [progress_hook]

        return opts

    def _ytdlp_progress_hook(self, d: dict) -> None:
        """Handle yt-dlp progress updates."""
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
            downloaded = d.get("downloaded_bytes", 0)

            if total > 0:
                progress = int((downloaded / total) * 100)
                if self._progress_callback:
                    self._progress_callback(progress)

        elif d["status"] == "finished":
            if self._progress_callback:
                self._progress_callback(90)

    async def _run_ffmpeg(
        self,
        input_path: str,
        output_path: str,
        options: Optional[List[str]] = None,
    ) -> None:
        """Run ffmpeg asynchronously using subprocess."""
        cmd = [
            config.downloader.FFMPEG_PATH,
            "-i", input_path,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-strict", "experimental",
            "-movflags", "+faststart",
        ]

        if options:
            cmd.extend(options)

        cmd.append(output_path)

        logger.debug(f"Running FFmpeg: {' '.join(cmd)}")

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown FFmpeg error"
            raise HLSProcessingError(f"FFmpeg failed: {error_msg}")

    async def _process_hls_stream(
        self,
        playlist_url: str,
        output_path: str,
        task: DownloadTask,
    ) -> str:
        """
        Download and compile HLS (.m3u8) stream into MP4.
        FIX: Use direct FFmpeg method for ALL HLS streams (handles live HLS properly).
        """
        logger.info(f"Processing HLS stream with FFmpeg: {playlist_url}")
        
        # CRITICAL: Direct FFmpeg method handles live HLS and regular HLS streams properly
        return await self._ffmpeg_hls_direct(playlist_url, output_path)

    async def _ffmpeg_hls_direct(
        self,
        playlist_url: str,
        output_path: str,
    ) -> str:
        """
        Direct FFmpeg HLS download - works for both live and regular HLS streams.
        """
        logger.info(f"Using direct FFmpeg HLS download: {playlist_url}")

        # FFmpeg with HLS timeout options
        # Note: Some HLS streams may fail due to expired URLs or geo-restrictions
        # FIX: Pass as list, not shell command (asyncio forbids shell=True)
        cmd = [
            config.downloader.FFMPEG_PATH,
            "-loglevel", "warning",
            "-i", playlist_url,
            "-timeout", "60000000",
            "-listen_timeout", "30000000",
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-c", "copy",
            "-copyts",
            "-avoid_negative_ts", "disabled",
            "-movflags", "+faststart",
            "-y",
            output_path,
        ]

        logger.debug(f"Running FFmpeg HLS command: {' '.join(cmd)}")

        # FIX: Use create_subprocess_exec WITHOUT shell=True
        process = await asyncio.create_subprocess_exec(
            *cmd,  # Unpack list as separate arguments
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # Wait with timeout (10 minutes max for HLS streams)
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=600)
            
            # Log stderr for debugging
            if stderr:
                stderr_text = stderr.decode('utf-8', errors='ignore')
                # Only log if there's actual content (not just version info)
                if "Invalid data" in stderr_text or "error" in stderr_text.lower():
                    logger.warning(f"FFmpeg warnings: {stderr_text[:500]}...")
                
        except asyncio.TimeoutError:
            logger.error(f"HLS download timed out after 10 minutes: {playlist_url}")
            try:
                process.kill()
            except:
                pass
            await process.communicate()
            raise HLSProcessingError(f"HLS download timed out after 10 minutes. The stream might be offline or too slow.")

        if process.returncode != 0:
            error_msg = stderr.decode('utf-8', errors='ignore') if stderr else "Unknown error"
            logger.error(f"FFmpeg HLS download failed (return code {process.returncode}): {error_msg[:500]}")
            
            # Check for common error patterns
            if "Invalid data found when processing input" in error_msg:
                raise HLSProcessingError(
                    "HLS stream invalid or expired. The video link may have expired or is geo-restricted. "
                    "Please try refreshing the page and getting a new link."
                )
            elif "timed out" in error_msg.lower() or "Connection timed out" in error_msg:
                raise HLSProcessingError(
                    "HLS stream timed out. The server might be slow or offline. Please try again later."
                )
            elif "403" in error_msg or "Forbidden" in error_msg:
                raise HLSProcessingError(
                    "Access denied (403). The HLS stream requires authentication or has expired."
                )
            elif "404" in error_msg or "Not Found" in error_msg:
                raise HLSProcessingError(
                    "Stream not found (404). The HLS URL is invalid or the content has been removed."
                )
            else:
                raise HLSProcessingError(f"Direct HLS download failed: {error_msg[:300]}")

        # Verify output file was created
        if not os.path.exists(output_path):
            raise HLSProcessingError(f"FFmpeg completed but output file was not created: {output_path}")

        file_size = os.path.getsize(output_path)
        if file_size == 0:
            os.remove(output_path)
            raise HLSProcessingError(f"FFmpeg created empty file. The HLS stream might be offline.")

        logger.info(f"HLS download successful: {output_path} ({file_size} bytes)")
        return output_path

    async def extract_info(self, url: str) -> VideoInfo:
        """
        Extract video information without downloading.
        CRITICAL: Uses static cookies.txt for YouTube authentication.
        """
        logger.info(f"Extracting info for URL: {url[:50]}...")

        def extract():
            opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "noplaylist": True,
                "format": build_format_string(),
                # FIX #3: Prevent yt-dlp hangs with socket timeout and retries
                "socket_timeout": 15,
                "retries": 3,
                **get_ytdlp_cookies(),
            }

            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(url, download=False)

        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, extract)

            is_hls = self._detect_hls(url) or (
                info.get("protocol") == "hls" or
                info.get("ext") == "m3u8"
            )

            return VideoInfo(
                url=url,
                title=info.get("title", "Unknown"),
                duration=info.get("duration"),
                thumbnail=info.get("thumbnail"),
                uploader=info.get("uploader") or info.get("channel"),
                view_count=info.get("view_count"),
                upload_date=info.get("upload_date"),
                description=info.get("description"),
                filesize=info.get("filesize") or info.get("filesize_approx"),
                format=info.get("format"),
                is_hls=is_hls,
                hls_playlist_url=info.get("url") if is_hls else None,
            )

        except yt_dlp.utils.DownloadError as e:
            error_str = str(e)
            
            # YouTube bot protection
            if "sign in to confirm" in error_str.lower():
                raise InvalidURLError(
                    "YouTube vaqtinchalik bu videoni yuklashga ruxsat bermayapti. "
                    "Iltimos birozdan so'ng urinib ko'ring."
                )
            
            if "unavailable" in error_str.lower():
                raise InvalidURLError(f"Video unavailable or private: {url}")
            elif "unsupported" in error_str.lower():
                raise InvalidURLError(f"Unsupported URL: {url}")
            
            raise InvalidURLError(f"Failed to extract info: {error_str}")

    async def download(
        self,
        task: DownloadTask,
        video_info: VideoInfo,
        resolution: Optional[str] = None,
    ) -> Tuple[str, int]:
        """
        Download video file with dynamic resolution-based format selection.
        CRITICAL: Uses static cookies.txt and FFmpeg merge.
        """
        task.status = DownloadStatus.DOWNLOADING

        safe_title = re.sub(r'[<>:"/\\|?*]', "_", video_info.title)[:100]
        output_template = str(
            self.download_dir / f"{task.task_id}_{safe_title}.%(ext)s"
        )

        # Check file size limit
        filesize = video_info.get_filesize_int()
        if filesize:
            max_size = config.downloader.MAX_FILE_SIZE
            if filesize > max_size:
                filesize_mb = filesize / (1024 * 1024)
                max_size_mb = max_size / (1024 * 1024)
                raise VideoTooLargeError(
                    f"Video size ({filesize_mb:.2f}MB) exceeds limit "
                    f"({max_size_mb:.1f}MB)"
                )

        logger.info(
            f"Downloading: {video_info.title} "
            f"({video_info.filesize_mb or 'unknown'}MB)"
        )
        logger.info(f"🎬 Using FFmpeg for video/audio merge (resolution: {resolution or 'best'})")

        if video_info.is_hls and config.downloader.ENABLE_HLS_PROCESSING:
            task.status = DownloadStatus.PROCESSING
            output_path = str(
                self.download_dir / f"{task.task_id}_{safe_title}.mp4"
            )

            hls_url = video_info.hls_playlist_url or video_info.url
            return await self._process_hls_stream(hls_url, output_path, task)

        else:
            opts = self._create_ytdlp_options(output_template, resolution=resolution)

            def download_video():
                with yt_dlp.YoutubeDL(opts) as ydl:
                    return ydl.extract_info(video_info.url, download=True)

            try:
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, download_video)

                downloaded_files = list(
                    self.download_dir.glob(f"{task.task_id}_*")
                )

                if not downloaded_files:
                    raise DownloadError("Download completed but file not found")

                file_path = str(downloaded_files[0])
                file_size = os.path.getsize(file_path)

                # Validate size after download
                max_size = config.downloader.MAX_FILE_SIZE
                if file_size > max_size:
                    os.remove(file_path)
                    raise VideoTooLargeError(
                        f"Downloaded file ({file_size / 1024 / 1024:.2f}MB) "
                        f"exceeds limit ({max_size / 1024 / 1024}MB)"
                    )

                if self._progress_callback:
                    self._progress_callback(100)

                return file_path, file_size

            except yt_dlp.utils.DownloadError as e:
                raise DownloadError(f"Download failed: {str(e)}")

    async def download_with_format(
        self,
        task: DownloadTask,
        video_info: VideoInfo,
        format_str: str,
    ) -> Tuple[str, int]:
        """Download video with specific yt-dlp format string."""
        return await self.download(task, video_info, resolution=None)

    async def download_with_progress(
        self,
        task: DownloadTask,
        video_info: VideoInfo,
    ) -> Tuple[str, int]:
        """Download video with progress tracking."""
        self.set_progress_callback(lambda p: setattr(task, "progress", p))
        return await self.download(task, video_info)

    async def cleanup_file(self, file_path: str) -> None:
        """Delete local file after upload with retry logic."""
        import gc

        for attempt in range(3):
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.debug(f"Cleaned up file: {file_path}")

                    # Force garbage collection
                    gc.collect()

                    if not os.path.exists(file_path):
                        return

                await asyncio.sleep(0.5)

            except PermissionError:
                logger.warning(f"File locked, retrying: {file_path}")
                await asyncio.sleep(1)
            except Exception as e:
                logger.debug(f"Cleanup error (attempt {attempt + 1}): {e}")
                await asyncio.sleep(1)

        logger.warning(f"Failed to cleanup file after 3 attempts: {file_path}")

    async def extract_audio_from_url(
        self,
        url: str,
        task_id: str,
        title: str,
    ) -> Tuple[str, int]:
        """Extract audio from URL as MP3."""
        audio_dir = Path(config.downloader.AUDIO_DIR)
        audio_dir.mkdir(parents=True, exist_ok=True)

        safe_title = re.sub(r'[<>:"/\\|?*]', "_", title)[:100]
        output_path = str(audio_dir / f"{task_id}_{safe_title}.mp3")

        opts = {
            "format": "bestaudio/best",
            "outtmpl": output_path,
            "noplaylist": True,
            "no_warnings": True,
            "quiet": True,
            # FIX #3: Prevent yt-dlp hangs with socket timeout and retries
            "socket_timeout": 15,
            "retries": 3,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            **get_ytdlp_cookies(),
        }

        def extract_audio():
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(url, download=True)

        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, extract_audio)

            audio_files = list(audio_dir.glob(f"{task_id}_*"))

            if not audio_files:
                raise AudioExtractionError("Audio extraction completed but file not found")

            file_path = str(audio_files[0])
            file_size = os.path.getsize(file_path)

            return file_path, file_size

        except yt_dlp.utils.DownloadError as e:
            raise AudioExtractionError(f"Audio extraction failed: {str(e)}")
