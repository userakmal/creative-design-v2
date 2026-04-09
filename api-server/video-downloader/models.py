"""
Data models for the Telegram Video Downloader Bot.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class DownloadStatus(Enum):
    """Status of a download operation."""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    CACHED = "cached"


class CacheBackend(Enum):
    """Supported cache backends."""
    SQLITE = "sqlite"
    REDIS = "redis"


@dataclass
class VideoInfo:
    """Video metadata extracted from URL."""

    url: str
    title: str
    duration: Optional[float] = None  # Can be float from yt-dlp (in seconds)
    thumbnail: Optional[str] = None
    uploader: Optional[str] = None
    view_count: Optional[float] = None  # Can be float from yt-dlp
    upload_date: Optional[str] = None
    description: Optional[str] = None
    filesize: Optional[float] = None  # Can be float from yt-dlp's filesize_approx
    format: Optional[str] = None
    is_hls: bool = False
    hls_playlist_url: Optional[str] = None

    def get_filesize_int(self) -> Optional[int]:
        """Get filesize as integer (for formatting and validation)."""
        if self.filesize is None:
            return None
        return int(self.filesize)
    
    def get_duration_int(self) -> Optional[int]:
        """Get duration as integer (for formatting)."""
        if self.duration is None:
            return None
        return int(self.duration)
    
    def get_view_count_int(self) -> Optional[int]:
        """Get view count as integer (for formatting)."""
        if self.view_count is None:
            return None
        return int(self.view_count)
    
    @property
    def duration_formatted(self) -> str:
        """Format duration as HH:MM:SS."""
        if self.duration is None:
            return "Unknown"
        hours, remainder = divmod(self.duration, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"
    
    @property
    def filesize_mb(self) -> Optional[float]:
        """Return file size in MB."""
        if self.filesize is None:
            return None
        return round(self.filesize / (1024 * 1024), 2)


@dataclass
class CachedVideo:
    """Cached video entry in database."""
    
    url_hash: str
    file_id: str
    video_info: VideoInfo
    created_at: datetime = field(default_factory=datetime.now)
    access_count: int = 0
    last_accessed: datetime = field(default_factory=datetime.now)
    file_size: int = 0
    
    def to_dict(self) -> dict:
        """Convert to dictionary for database storage."""
        return {
            "url_hash": self.url_hash,
            "file_id": self.file_id,
            "title": self.video_info.title,
            "duration": self.video_info.duration,
            "thumbnail": self.video_info.thumbnail,
            "uploader": self.video_info.uploader,
            "created_at": self.created_at.isoformat(),
            "access_count": self.access_count,
            "last_accessed": self.last_accessed.isoformat(),
            "file_size": self.file_size,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "CachedVideo":
        """Create from dictionary."""
        return cls(
            url_hash=data["url_hash"],
            file_id=data["file_id"],
            video_info=VideoInfo(
                url="",  # Original URL not stored
                title=data.get("title", "Unknown"),
                duration=data.get("duration"),
                thumbnail=data.get("thumbnail"),
                uploader=data.get("uploader"),
            ),
            created_at=datetime.fromisoformat(data["created_at"]),
            access_count=data.get("access_count", 0),
            last_accessed=datetime.fromisoformat(data["last_accessed"]),
            file_size=data.get("file_size", 0),
        )


@dataclass
class DownloadTask:
    """Represents a download task with status tracking."""

    task_id: str
    url: str
    user_id: int
    status: DownloadStatus = DownloadStatus.PENDING
    video_info: Optional[VideoInfo] = None
    file_path: Optional[str] = None
    file_id: Optional[str] = None
    error_message: Optional[str] = None
    progress: int = 0  # 0-100
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    extra: dict = field(default_factory=dict)  # Additional metadata (chat_type, etc.)

    @property
    def is_complete(self) -> bool:
        """Check if task is complete."""
        return self.status in (DownloadStatus.COMPLETED, DownloadStatus.CACHED)

    @property
    def is_failed(self) -> bool:
        """Check if task has failed."""
        return self.status == DownloadStatus.FAILED


@dataclass
class BotStatistics:
    """Bot usage statistics."""
    
    total_downloads: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    total_bytes_downloaded: int = 0
    total_bytes_uploaded: int = 0
    failed_downloads: int = 0
    unique_users: int = 0
    uptime_seconds: int = 0
    
    @property
    def cache_hit_rate(self) -> float:
        """Calculate cache hit rate percentage."""
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return (self.cache_hits / total) * 100
