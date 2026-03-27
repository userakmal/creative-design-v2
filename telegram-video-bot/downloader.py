"""
Video downloader module with yt-dlp and ffmpeg integration.
Handles universal URL extraction and HLS (.m3u8) stream processing.
"""

import asyncio
import os
import re
import shutil
from pathlib import Path
from typing import Any, Callable, Optional, Tuple

import yt_dlp
from loguru import logger

from config import config
from models import DownloadStatus, DownloadTask, VideoInfo


class DownloadError(Exception):
    """Custom exception for download errors."""
    pass


class VideoTooLargeError(DownloadError):
    """Raised when video exceeds size limit."""
    pass


class InvalidURLError(DownloadError):
    """Raised when URL is invalid or unsupported."""
    pass


class HLSProcessingError(DownloadError):
    """Raised when HLS processing fails."""
    pass


class VideoDownloader:
    """
    Advanced video downloader with yt-dlp and ffmpeg support.
    Handles universal URLs and HLS stream compilation.
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
    ) -> dict:
        """Create yt-dlp options dictionary."""
        opts = {
            "format": config.downloader.YTDLP_FORMAT,
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
            "socket_timeout": 30,
            "retries": 3,
            "fragment_retries": 3,
            "http_chunk_size": 10485760,  # 10MB
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
        options: Optional[list[str]] = None,
    ) -> None:
        """
        Run ffmpeg asynchronously using subprocess.
        Non-blocking execution to prevent bot freezing.
        """
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
        
        logger.debug(f"Running ffmpeg: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown ffmpeg error"
            raise HLSProcessingError(f"ffmpeg failed: {error_msg}")
    
    async def _process_hls_stream(
        self,
        playlist_url: str,
        output_path: str,
        task: DownloadTask,
    ) -> str:
        """
        Download and compile HLS (.m3u8) stream into MP4.
        Uses yt-dlp for HLS download and ffmpeg for compilation.
        """
        temp_dir = self.download_dir / f"hls_{task.task_id}"
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Download HLS segments with yt-dlp
            hls_opts = {
                "format": "best",
                "outtmpl": str(temp_dir / "segment_%(segment_number)s.ts"),
                "noplaylist": True,
                "quiet": True,
                "no_warnings": True,
                "extractor_args": {
                    "generic": {"hls_prefer_native": ["True"]}
                },
                "progress_hooks": [self._ytdlp_progress_hook],
            }
            
            logger.info(f"Processing HLS stream: {playlist_url}")
            
            def download_hls():
                with yt_dlp.YoutubeDL(hls_opts) as ydl:
                    return ydl.extract_info(playlist_url, download=True)
            
            # Run yt-dlp in executor to prevent blocking
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, download_hls)
            
            # Find downloaded segments
            segments = list(temp_dir.glob("*.ts"))
            
            if not segments:
                # Try alternative: direct ffmpeg HLS processing
                return await self._ffmpeg_hls_direct(playlist_url, output_path)
            
            # Concatenate segments using ffmpeg
            concat_file = temp_dir / "concat.txt"
            with open(concat_file, "w") as f:
                for segment in sorted(segments):
                    f.write(f"file '{segment.absolute()}'\n")
            
            # Run ffmpeg concatenation
            process = await asyncio.create_subprocess_exec(
                config.downloader.FFMPEG_PATH,
                "-f", "concat",
                "-safe", "0",
                "-i", str(concat_file),
                "-c", "copy",
                "-movflags", "+faststart",
                output_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                # Fallback to re-encoding
                await self._run_ffmpeg(str(segments[0]), output_path)
            
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
            
            if self._progress_callback:
                self._progress_callback(95)
            
            return output_path
            
        except Exception as e:
            shutil.rmtree(temp_dir, ignore_errors=True)
            raise HLSProcessingError(f"HLS processing failed: {str(e)}")
    
    async def _ffmpeg_hls_direct(
        self,
        playlist_url: str,
        output_path: str,
    ) -> str:
        """Direct ffmpeg HLS download as fallback."""
        logger.info(f"Using direct ffmpeg HLS download: {playlist_url}")
        
        process = await asyncio.create_subprocess_exec(
            config.downloader.FFMPEG_PATH,
            "-i", playlist_url,
            "-c", "copy",
            "-bsf:a", "aac_adtstoasc",
            "-movflags", "+faststart",
            output_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        _, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            raise HLSProcessingError(f"Direct HLS download failed: {error_msg}")
        
        return output_path
    
    async def extract_info(self, url: str) -> VideoInfo:
        """
        Extract video information without downloading.
        Used for validation and size checking.
        """
        logger.info(f"Extracting info for URL: {url[:50]}...")
        
        def extract():
            opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": False,
                "noplaylist": True,
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(url, download=False)
        
        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(None, extract)
            
            # Detect HLS
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
            if "unavailable" in error_str.lower():
                raise InvalidURLError(f"Video unavailable or private: {url}")
            elif "unsupported" in error_str.lower():
                raise InvalidURLError(f"Unsupported URL: {url}")
            raise InvalidURLError(f"Failed to extract info: {error_str}")
    
    async def download(
        self,
        task: DownloadTask,
        video_info: VideoInfo,
    ) -> Tuple[str, int]:
        """
        Download video file.
        Returns (file_path, file_size).
        """
        task.status = DownloadStatus.DOWNLOADING
        
        # Generate output filename
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
        
        if video_info.is_hls and config.downloader.ENABLE_HLS_PROCESSING:
            # Handle HLS stream
            task.status = DownloadStatus.PROCESSING
            output_path = str(
                self.download_dir / f"{task.task_id}_{safe_title}.mp4"
            )
            
            hls_url = video_info.hls_playlist_url or video_info.url
            return await self._process_hls_stream(hls_url, output_path, task)
        
        else:
            # Standard download with yt-dlp
            opts = self._create_ytdlp_options(output_template)
            
            def download_video():
                with yt_dlp.YoutubeDL(opts) as ydl:
                    return ydl.extract_info(video_info.url, download=True)
            
            try:
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, download_video)
                
                # Find downloaded file
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
    
    async def download_with_progress(
        self,
        task: DownloadTask,
        video_info: VideoInfo,
    ) -> Tuple[str, int]:
        """
        Download video with progress tracking.
        Wrapper method that sets up progress callback.
        """
        self.set_progress_callback(lambda p: setattr(task, "progress", p))
        return await self.download(task, video_info)
    
    async def cleanup_file(self, file_path: str) -> None:
        """Delete local file after upload with retry logic."""
        import asyncio
        import gc
        
        try:
            path = Path(file_path)
            if not path.exists():
                return
            
            # Force garbage collection to release any file handles
            gc.collect()
            
            # Wait a bit for any pending file operations to complete
            await asyncio.sleep(0.5)
            
            # Try to delete with retries
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    os.remove(path)
                    logger.debug(f"Cleaned up local file: {file_path}")
                    return
                except OSError as e:
                    if attempt == max_retries - 1:
                        # Last attempt - log warning but don't fail
                        logger.warning(
                            f"Failed to cleanup file after {max_retries} attempts: {file_path} - {e}"
                        )
                        # Try to mark for deletion on next reboot
                        try:
                            os.rename(path, path.with_suffix(path.suffix + '.delete'))
                        except:
                            pass
                    else:
                        # Wait and retry
                        await asyncio.sleep(1 * (attempt + 1))
                        gc.collect()
                        
        except Exception as e:
            logger.warning(f"Unexpected error during file cleanup: {file_path} - {e}")
    
    async def validate_url(self, url: str) -> bool:
        """Validate URL before processing."""
        url_patterns = [
            r"^https?://",
            r"^(www\.)?",
        ]
        
        if not any(re.match(pattern, url) for pattern in url_patterns):
            return False
        
        # Check for known supported domains
        supported_domains = [
            r"youtube\.com",
            r"youtu\.be",
            r"instagram\.com",
            r"tiktok\.com",
            r"twitter\.com",
            r"x\.com",
            r"facebook\.com",
            r"fb\.watch",
            r"vimeo\.com",
            r"dailymotion\.com",
            r"twitch\.tv",
            r"reddit\.com",
            r"pinterest\.com",
        ]
        
        # HLS streams are always supported
        if self._detect_hls(url):
            return True
        
        return any(re.search(domain, url) for domain in supported_domains)
