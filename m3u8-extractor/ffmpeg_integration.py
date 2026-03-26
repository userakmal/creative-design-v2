"""
FFmpeg Integration Guide
========================
Complete guide for downloading M3U8/HLS streams with FFmpeg.
"""

import asyncio
import subprocess
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


# ============================================================================
# FFMPEG DOWNLOADER CLASS
# ============================================================================

@dataclass
class DownloadOptions:
    """Options for FFmpeg download"""
    
    output_path: str
    video_codec: str = "copy"
    audio_codec: str = "copy"
    container: str = "mp4"
    overwrite: bool = True
    timeout: int = 3600  # 1 hour default
    show_progress: bool = True
    extra_args: List[str] = None


class M3U8Downloader:
    """
    Download M3U8/HLS streams using FFmpeg.
    
    Features:
    - Progress tracking
    - Resume support (for some streams)
    - Quality selection
    - Format conversion
    - Subtitle extraction
    """
    
    def __init__(self, ffmpeg_path: str = None):
        """
        Initialize downloader.
        
        Args:
            ffmpeg_path: Path to FFmpeg binary (uses system FFmpeg if None)
        """
        self.ffmpeg_path = ffmpeg_path or "ffmpeg"
        self.process: Optional[asyncio.subprocess.Process] = None
    
    async def download(
        self,
        m3u8_url: str,
        options: DownloadOptions,
        progress_callback: callable = None,
    ) -> bool:
        """
        Download M3U8 stream.
        
        Args:
            m3u8_url: M3U8 playlist URL
            options: Download configuration
            progress_callback: Async callback for progress updates
        
        Returns:
            True if successful, False otherwise
        """
        
        # Build FFmpeg command
        cmd = [
            self.ffmpeg_path,
            "-i", m3u8_url,
            "-c:v", options.video_codec,
            "-c:a", options.audio_codec,
            "-bsf:a", "aac_adtstoasc",  # Fix AAC for MP4
        ]
        
        # Add extra arguments
        if options.extra_args:
            cmd.extend(options.extra_args)
        
        # Output options
        if options.overwrite:
            cmd.append("-y")
        
        cmd.append(options.output_path)
        
        print(f"📥 Downloading: {m3u8_url[:100]}...")
        print(f"💾 Saving to: {options.output_path}")
        
        try:
            # Start process
            self.process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            
            # Read stderr for progress (FFmpeg outputs progress to stderr)
            stderr_lines = []
            
            async def read_stderr():
                while True:
                    line = await self.process.stderr.readline()
                    if not line:
                        break
                    
                    line_str = line.decode('utf-8', errors='ignore').strip()
                    stderr_lines.append(line_str)
                    
                    # Parse progress
                    if progress_callback and "time=" in line_str:
                        progress = self._parse_progress(line_str)
                        await progress_callback(progress)
            
            # Wait for completion with timeout
            try:
                await asyncio.wait_for(
                    asyncio.gather(
                        self.process.wait(),
                        read_stderr(),
                    ),
                    timeout=options.timeout,
                )
            except asyncio.TimeoutError:
                print("⏰ Download timeout!")
                self.process.kill()
                return False
            
            # Check result
            if self.process.returncode == 0:
                file_size = os.path.getsize(options.output_path)
                print(f"✅ Download complete: {self._format_size(file_size)}")
                return True
            else:
                stderr_output = '\n'.join(stderr_lines[-10:])  # Last 10 lines
                print(f"❌ Download failed: {stderr_output}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
        finally:
            self.process = None
    
    def _parse_progress(self, line: str) -> Dict[str, Any]:
        """Parse FFmpeg progress line"""
        progress = {}
        
        # Extract time
        if "time=" in line:
            time_str = line.split("time=")[1].split()[0]
            progress["time"] = time_str
        
        # Extract speed
        if "speed=" in line:
            speed_str = line.split("speed=")[1].split()[0]
            progress["speed"] = speed_str
        
        # Extract bitrate
        if "bitrate=" in line:
            bitrate_str = line.split("bitrate=")[1].split()[0]
            progress["bitrate"] = bitrate_str
        
        return progress
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"
    
    async def cancel(self):
        """Cancel ongoing download"""
        if self.process:
            print("⏹️ Cancelling download...")
            self.process.kill()
            await self.process.wait()


# ============================================================================
# HLS DOWNLOADER (Alternative using youtube-dl/yt-dlp)
# ============================================================================

class HLSDownloader:
    """
    Download HLS streams using yt-dlp (more reliable for some sites).
    """
    
    def __init__(self, ytdlp_path: str = "yt-dlp"):
        self.ytdlp_path = ytdlp_path
    
    async def download(
        self,
        m3u8_url: str,
        output_path: str,
        format: str = "best",
    ) -> bool:
        """
        Download using yt-dlp.
        
        Args:
            m3u8_url: M3U8 URL
            output_path: Output file path (without extension)
            format: Format selection
        """
        
        cmd = [
            self.ytdlp_path,
            "-f", format,
            "-o", f"{output_path}.%(ext)s",
            "--no-playlist",
            "--no-warnings",
            m3u8_url,
        ]
        
        print(f"📥 yt-dlp: {m3u8_url[:100]}...")
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            
            # Stream output
            async for line in process.stdout:
                print(line.decode().strip())
            
            await process.wait()
            
            if process.returncode == 0:
                print("✅ Download complete!")
                return True
            else:
                print(f"❌ Download failed (code {process.returncode})")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False


# ============================================================================
# INTEGRATION WITH M3U8 EXTRACTOR
# ============================================================================

async def download_from_url(
    page_url: str,
    output_path: str,
    headless: bool = True,
) -> bool:
    """
    Complete flow: Extract M3U8 from page and download.
    
    Args:
        page_url: Page URL containing video
        output_path: Output file path
        headless: Run browser in headless mode
    
    Returns:
        True if successful
    """
    
    # Import extractor
    from extractor import get_m3u8_url
    
    try:
        # Step 1: Extract M3U8 URL
        print("🔍 Extracting M3U8 URL...")
        m3u8_url = await get_m3u8_url(page_url, headless=headless)
        print(f"✅ Found: {m3u8_url[:100]}...")
        
        # Step 2: Download with FFmpeg
        print("📥 Starting download...")
        downloader = M3U8Downloader()
        options = DownloadOptions(output_path=output_path)
        
        async def on_progress(progress):
            print(f"📊 Progress: {progress}")
        
        success = await downloader.download(m3u8_url, options, on_progress)
        
        if success:
            print(f"🎉 All done! Video saved to: {output_path}")
        
        return success
        
    except ValueError as e:
        print(f"❌ Extraction failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_basic_download():
    """Basic download example"""
    from extractor import get_m3u8_url
    
    # Extract
    m3u8_url = await get_m3u8_url("https://example.com/video/123")
    
    # Download
    downloader = M3U8Downloader()
    options = DownloadOptions(output_path="video.mp4")
    await downloader.download(m3u8_url, options)


async def example_with_progress():
    """Download with progress callback"""
    from extractor import get_m3u8_url
    
    m3u8_url = await get_m3u8_url("https://example.com/video/123")
    
    downloader = M3U8Downloader()
    options = DownloadOptions(
        output_path="video.mp4",
        show_progress=True,
    )
    
    async def progress_callback(progress):
        print(f"⏳ {progress.get('time', 'N/A')} @ {progress.get('speed', 'N/A')}")
    
    await downloader.download(m3u8_url, options, progress_callback)


async def example_batch_download():
    """Download multiple videos"""
    from extractor import get_m3u8_url
    
    urls = [
        ("https://example.com/video/1", "video1.mp4"),
        ("https://example.com/video/2", "video2.mp4"),
        ("https://example.com/video/3", "video3.mp4"),
    ]
    
    for page_url, output_path in urls:
        print(f"\n{'='*60}")
        print(f"Downloading: {page_url}")
        print(f"{'='*60}")
        
        success = await download_from_url(page_url, output_path)
        
        if success:
            print(f"✅ Saved: {output_path}")
        else:
            print(f"❌ Failed: {page_url}")
        
        # Be nice to servers
        await asyncio.sleep(1)


async def example_convert_format():
    """Download and convert to different format"""
    from extractor import get_m3u8_url
    
    m3u8_url = await get_m3u8_url("https://example.com/video/123")
    
    downloader = M3U8Downloader()
    options = DownloadOptions(
        output_path="video.mkv",
        container="mkv",
        extra_args=[
            "-movflags", "+faststart",  # Web optimization
        ],
    )
    
    await downloader.download(m3u8_url, options)


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Download M3U8 streams with FFmpeg"
    )
    
    parser.add_argument("m3u8_url", help="M3U8 URL or page URL")
    parser.add_argument("-o", "--output", default="output.mp4", help="Output file path")
    parser.add_argument("--page", action="store_true", help="Extract from page URL")
    parser.add_argument("--headless", action="store_true", default=True, help="Headless browser")
    parser.add_argument("--no-headless", action="store_true", help="Visible browser")
    
    args = parser.parse_args()
    
    async def run():
        if args.page:
            # Extract from page and download
            success = await download_from_url(
                args.m3u8_url,
                args.output,
                headless=not args.no_headless,
            )
        else:
            # Direct M3U8 download
            downloader = M3U8Downloader()
            options = DownloadOptions(output_path=args.output)
            success = await downloader.download(args.m3u8_url, options)
        
        return 0 if success else 1
    
    exit(asyncio.run(run()))


if __name__ == "__main__":
    main()
