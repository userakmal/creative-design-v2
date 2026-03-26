"""
FFmpeg Processor Module
========================
Processes M3U8 streams and converts to MP4
"""

import asyncio
import logging
import time
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass

from extractors.base import ExtractionResult

logger = logging.getLogger(__name__)


@dataclass
class FFmpegResult:
    """FFmpeg processing result"""
    success: bool
    file_path: Optional[Path] = None
    filesize: Optional[int] = None
    duration: Optional[float] = None
    error: Optional[str] = None


class FFmpegProcessor:
    """
    FFmpeg processor for M3U8 streams
    
    Downloads and merges M3U8/HLS streams into MP4 files.
    """
    
    def __init__(self, download_dir: Path, timeout: int = 300):
        self.download_dir = download_dir
        self.timeout = timeout
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        # Check FFmpeg availability
        self.ffmpeg_path = shutil.which('ffmpeg')
        if not self.ffmpeg_path:
            logger.warning("⚠️ FFmpeg not found in PATH!")
            logger.warning("M3U8 processing will not work")
    
    def _is_available(self) -> bool:
        """Check if FFmpeg is available"""
        return self.ffmpeg_path is not None
    
    async def download_m3u8(
        self,
        m3u8_url: str,
        output_filename: str,
    ) -> FFmpegResult:
        """
        Download M3U8 stream and convert to MP4
        
        Args:
            m3u8_url: M3U8 playlist URL
            output_filename: Output filename (without extension)
        
        Returns:
            FFmpegResult with file path
        """
        
        if not self._is_available():
            return FFmpegResult(
                success=False,
                error="FFmpeg not available",
            )
        
        logger.info(f"🎬 FFmpeg processing M3U8: {m3u8_url[:100]}...")
        start_time = time.time()
        
        output_path = self.download_dir / f"{output_filename}.mp4"
        
        # FFmpeg command
        cmd = [
            self.ffmpeg_path,
            '-i', m3u8_url,
            '-c', 'copy',  # Copy streams without re-encoding
            '-bsf:a', 'aac_adtstoasc',  # Fix AAC for MP4
            '-movflags', '+faststart',  # Web optimization
            '-y',  # Overwrite
            str(output_path),
        ]
        
        logger.info(f"Running: {' '.join(cmd)}")
        
        try:
            # Run FFmpeg
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            # Wait with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.timeout,
                )
            except asyncio.TimeoutError:
                logger.error(f"❌ FFmpeg timeout after {self.timeout}s")
                process.kill()
                return FFmpegResult(
                    success=False,
                    error=f"Timeout after {self.timeout} seconds",
                )
            
            # Check result
            if process.returncode == 0:
                elapsed = time.time() - start_time
                
                if output_path.exists():
                    filesize = output_path.stat().st_size
                    logger.info(f"✅ FFmpeg complete in {elapsed:.2f}s ({filesize / 1024 / 1024:.2f} MB)")
                    
                    return FFmpegResult(
                        success=True,
                        file_path=output_path,
                        filesize=filesize,
                    )
                else:
                    return FFmpegResult(
                        success=False,
                        error="Output file not created",
                    )
            else:
                error_msg = stderr.decode('utf-8', errors='ignore')[:500]
                logger.error(f"❌ FFmpeg failed: {error_msg}")
                return FFmpegResult(
                    success=False,
                    error=f"FFmpeg error: {error_msg[:200]}",
                )
                
        except Exception as e:
            logger.exception(f"❌ FFmpeg error: {e}")
            return FFmpegResult(
                success=False,
                error=str(e)[:200],
            )
    
    async def convert_to_mp4(
        self,
        input_path: Path,
        output_filename: Optional[str] = None,
    ) -> FFmpegResult:
        """
        Convert video file to MP4
        
        Args:
            input_path: Input file path
            output_filename: Output filename (optional)
        
        Returns:
            FFmpegResult with file path
        """
        
        if not self._is_available():
            return FFmpegResult(success=False, error="FFmpeg not available")
        
        if not input_path.exists():
            return FFmpegResult(success=False, error="Input file not found")
        
        output_path = self.download_dir / f"{output_filename or input_path.stem}.mp4"
        
        cmd = [
            self.ffmpeg_path,
            '-i', str(input_path),
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-movflags', '+faststart',
            '-y',
            str(output_path),
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=self.timeout,
            )
            
            if process.returncode == 0 and output_path.exists():
                return FFmpegResult(
                    success=True,
                    file_path=output_path,
                    filesize=output_path.stat().st_size,
                )
            else:
                return FFmpegResult(
                    success=False,
                    error=stderr.decode('utf-8', errors='ignore')[:200],
                )
                
        except asyncio.TimeoutError:
            process.kill()
            return FFmpegResult(success=False, error="Conversion timeout")
        except Exception as e:
            return FFmpegResult(success=False, error=str(e))
    
    async def get_video_info(self, input_path: Path) -> Optional[Dict[str, Any]]:
        """
        Get video information using FFprobe
        
        Args:
            input_path: Video file path
        
        Returns:
            Dictionary with video info or None
        """
        
        ffprobe_path = shutil.which('ffprobe')
        if not ffprobe_path:
            return None
        
        cmd = [
            ffprobe_path,
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            str(input_path),
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            stdout, _ = await asyncio.wait_for(
                process.communicate(),
                timeout=30,
            )
            
            import json
            info = json.loads(stdout.decode('utf-8'))
            
            return {
                'duration': float(info.get('format', {}).get('duration', 0)),
                'size': int(info.get('format', {}).get('size', 0)),
                'bitrate': int(info.get('format', {}).get('bit_rate', 0)),
            }
            
        except Exception as e:
            logger.debug(f"FFprobe error: {e}")
            return None
