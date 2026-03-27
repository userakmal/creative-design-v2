"""
Configuration module for Telegram Video Downloader Bot.
Loads settings from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class BotConfig:
    """Telegram bot configuration."""
    
    # Telegram Bot Token (required)
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    
    # Telegram Local API Server (for 2GB uploads)
    # Set to your local server URL (e.g., "http://localhost:8081")
    # Leave empty to use standard Telegram API (50MB limit)
    TELEGRAM_API_SERVER: Optional[str] = os.getenv("TELEGRAM_API_SERVER", None)
    
    # Bot API Server local path (for file serving)
    TELEGRAM_API_LOCAL_PATH: Optional[str] = os.getenv("TELEGRAM_API_LOCAL_PATH", None)


@dataclass(frozen=True)
class DatabaseConfig:
    """Database configuration for caching."""
    
    # Database type: "sqlite" or "redis"
    DB_TYPE: str = os.getenv("DB_TYPE", "sqlite")
    
    # SQLite database path
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", "cache.db")
    
    # Redis configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    
    # Cache TTL in seconds (7 days default)
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "604800"))


@dataclass(frozen=True)
class DownloaderConfig:
    """Video downloader configuration."""
    
    # Temporary download directory
    DOWNLOAD_DIR: str = os.getenv("DOWNLOAD_DIR", "downloads")
    
    # Maximum file size in bytes (2GB for local server, 50MB for standard)
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "2147483648"))  # 2GB
    
    # yt-dlp options
    YTDLP_FORMAT: str = os.getenv("YTDLP_FORMAT", "best[ext=mp4]/best")
    YTDLP_TIMEOUT: int = int(os.getenv("YTDLP_TIMEOUT", "300"))  # 5 minutes
    
    # ffmpeg configuration
    FFMPEG_PATH: str = os.getenv("FFMPEG_PATH", "ffmpeg")
    FFPROBE_PATH: str = os.getenv("FFPROBE_PATH", "ffprobe")
    
    # Enable HLS (.m3u8) processing
    ENABLE_HLS_PROCESSING: bool = os.getenv("ENABLE_HLS_PROCESSING", "true").lower() == "true"


@dataclass(frozen=True)
class LoggingConfig:
    """Logging configuration."""
    
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "bot.log")
    LOG_FORMAT: str = os.getenv(
        "LOG_FORMAT",
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )


@dataclass(frozen=True)
class Config:
    """Main configuration container."""
    
    bot: BotConfig = BotConfig()
    database: DatabaseConfig = DatabaseConfig()
    downloader: DownloaderConfig = DownloaderConfig()
    logging: LoggingConfig = LoggingConfig()
    
    def validate(self) -> None:
        """Validate critical configuration values."""
        if not self.bot.TELEGRAM_BOT_TOKEN:
            raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required")
        
        # Create necessary directories
        Path(self.downloader.DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
        
        # Validate file size based on API server configuration
        if self.bot.TELEGRAM_API_SERVER:
            if self.downloader.MAX_FILE_SIZE > 2147483648:  # 2GB
                raise ValueError("MAX_FILE_SIZE cannot exceed 2GB")
        else:
            if self.downloader.MAX_FILE_SIZE > 52428800:  # 50MB
                raise ValueError("MAX_FILE_SIZE cannot exceed 50MB without Local API Server")


# Global configuration instance
config = Config()
