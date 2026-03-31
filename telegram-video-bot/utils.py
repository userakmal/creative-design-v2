"""
Utility functions for the Telegram Video Downloader Bot.
"""

import asyncio
import os
import re
import time
from datetime import datetime
from typing import Optional

from loguru import logger


def format_file_size(size_bytes) -> str:
    """Format file size in human-readable format."""
    # Handle None, float, or int inputs
    if size_bytes is None:
        return "0 B"
    
    # Convert to int if float (yt-dlp can return floats for filesize_approx)
    size = float(int(size_bytes) if size_bytes >= 0 else 0)
    
    if size < 0:
        return "0 B"

    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0

    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1

    if unit_index == 0:
        return f"{int(size)} {units[unit_index]}"
    return f"{size:.2f} {units[unit_index]}"


def format_duration(seconds) -> str:
    """Format duration in HH:MM:SS format."""
    if seconds is None:
        return "Unknown"
    
    # Convert to int if float (yt-dlp can return float duration)
    seconds = int(float(seconds))
    
    if seconds < 0:
        return "Unknown"

    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def format_timestamp(timestamp: datetime) -> str:
    """Format timestamp for display."""
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")


def calculate_eta(
    downloaded: int,
    total: int,
    start_time: float,
) -> Optional[str]:
    """Calculate estimated time remaining."""
    if downloaded <= 0 or total <= 0:
        return None
    
    elapsed = time.time() - start_time
    if elapsed <= 0:
        return None
    
    speed = downloaded / elapsed
    remaining_bytes = total - downloaded
    
    if speed <= 0:
        return None
    
    eta_seconds = remaining_bytes / speed
    
    if eta_seconds < 60:
        return f"{int(eta_seconds)}s"
    elif eta_seconds < 3600:
        return f"{int(eta_seconds / 60)}m {int(eta_seconds % 60)}s"
    else:
        hours = int(eta_seconds / 3600)
        minutes = int((eta_seconds % 3600) / 60)
        return f"{hours}h {minutes}m"


def truncate_text(text: str, max_length: int = 50) -> str:
    """Truncate text with ellipsis if too long."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def sanitize_filename(filename: str) -> str:
    """Remove invalid characters from filename."""
    import re
    # Remove invalid characters
    sanitized = re.sub(r'[<>:"/\\|?*]', "_", filename)
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip(" .")
    # Limit length
    return sanitized[:200]


def extract_url_from_text(text: str) -> Optional[str]:
    """
    Extract the first valid HTTP/HTTPS URL from text.
    UNIVERSAL URL REGEX - Catches ALL URL formats including:
    - Instagram: instagram.com/p/, /reel/, /stories/, /tv/, short links
    - YouTube: youtube.com, youtu.be
    - TikTok: tiktok.com
    - And any other valid HTTP/HTTPS URL
    
    Sanitizes input by removing trailing garbage, spaces, and extra characters.

    Handles cases like:
    - "https://instagram.com/reel/...?igsh=... °C³" -> "https://instagram.com/reel/...?igsh=..."
    - "  https://youtube.com/watch?v=abc  " -> "https://youtube.com/watch?v=abc"
    - "Check this: https://tiktok.com/..." -> "https://tiktok.com/..."
    """
    import re

    # UNIVERSAL URL PATTERN - Matches any HTTP/HTTPS URL
    # This comprehensive regex catches:
    # - Standard URLs with domain and path
    # - URLs with query parameters and fragments
    # - Short URLs (youtu.be, etc.)
    # - Instagram specific paths (/p/, /reel/, /stories/, /tv/)
    url_pattern = re.compile(
        r'(https?://)'                          # protocol: http:// or https://
        r'(?:'                                   # start domain/path group
        r'(?:[^\s<>"\'{}|\\^`\[\]]+)'           # domain and path (non-whitespace chars)
        r')'                                    # end domain/path group
        r'(?:'                                   # optional query/fragment
        r'[?#][^\s<>"\'{}|\\^`\[\]]*'           # query string or fragment
        r')?'                                   # optional
        ,
        re.IGNORECASE | re.UNICODE
    )

    match = url_pattern.search(text)
    if match:
        url = match.group(0)
        # Clean up trailing invalid characters
        # Remove common trailing garbage
        url = re.sub(r'[°\x00-\x1f\x7f-\x9f\s]+$', '', url)
        # Remove trailing punctuation that's not part of URL
        url = re.sub(r'[.,;:!?\)]+$', '', url)
        return url

    return None


def is_valid_url(text: str) -> bool:
    """Basic URL validation."""
    import re
    url_pattern = re.compile(
        r"^https?://"
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
        r"(?::\d+)?"
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE
    )
    return bool(url_pattern.match(text))


def create_progress_bar(
    current: int,
    total: int,
    width: int = 30,
) -> str:
    """Create a text-based progress bar."""
    if total <= 0:
        return "[Unknown]"
    
    percentage = min(100, max(0, (current / total) * 100))
    filled = int(width * current // total)
    bar = "█" * filled + "░" * (width - filled)
    
    return f"[{bar}] {percentage:.1f}%"


async def run_in_executor(func, *args):
    """Run a blocking function in an executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, func, *args)


def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    log_format: Optional[str] = None,
) -> None:
    """Configure logging for the application."""
    from config import config
    import sys

    # Remove default handler
    logger.remove()

    # Console handler - use sys.stderr.write for Unicode-safe output on Windows
    logger.add(
        sys.stderr,
        level=log_level,
        format=log_format or config.logging.LOG_FORMAT,
        colorize=True,
    )

    # File handler if specified
    if log_file:
        logger.add(
            log_file,
            level=log_level,
            format=log_format or config.logging.LOG_FORMAT,
            rotation="10 MB",
            retention="7 days",
            compression="zip",
            encoding="utf-8"
        )

    logger.info(f"Logging initialized (level: {log_level})")


class RateLimiter:
    """Simple rate limiter for API calls."""
    
    def __init__(self, calls: int, period: float):
        self.calls = calls
        self.period = period
        self.timestamps: list[float] = []
    
    async def acquire(self) -> None:
        """Wait until rate limit allows."""
        now = time.time()
        
        # Remove old timestamps
        self.timestamps = [
            ts for ts in self.timestamps
            if now - ts < self.period
        ]
        
        if len(self.timestamps) >= self.calls:
            # Wait until oldest expires
            wait_time = self.period - (now - self.timestamps[0])
            if wait_time > 0:
                await asyncio.sleep(wait_time)
                self.timestamps.pop(0)
        
        self.timestamps.append(now)
    
    async def __aenter__(self):
        await self.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


class AsyncFileLock:
    """Async file lock for preventing concurrent access."""
    
    def __init__(self, lock_file: str):
        self.lock_file = lock_file
        self._lock: Optional[asyncio.Lock] = None
    
    async def __aenter__(self):
        if self._lock is None:
            self._lock = asyncio.Lock()
        await self._lock.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._lock:
            self._lock.release()


def get_uptime() -> str:
    """Get bot uptime as formatted string."""
    from main import bot_start_time
    
    uptime_seconds = int(time.time() - bot_start_time)
    
    days, remainder = divmod(uptime_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    
    return " ".join(parts)
