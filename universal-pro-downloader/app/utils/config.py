"""
Configuration Module
=====================
Application configuration and environment variables
"""

import os
from pathlib import Path
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration"""
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Download settings
    DOWNLOAD_DIR: Path = Path(os.getenv("DOWNLOAD_DIR", "downloads"))
    TEMP_DIR: Path = Path(os.getenv("TEMP_DIR", "temp"))
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "500000000"))  # 500MB
    DOWNLOAD_TIMEOUT: int = int(os.getenv("DOWNLOAD_TIMEOUT", "180"))  # 3 minutes
    
    # yt-dlp settings
    COOKIES_FILE: Path = Path(os.getenv("COOKIES_FILE", "cookies.txt"))
    YTDLP_TIMEOUT: int = int(os.getenv("YTDLP_TIMEOUT", "120"))
    
    # Playwright settings
    PLAYWRIGHT_TIMEOUT: int = int(os.getenv("PLAYWRIGHT_TIMEOUT", "30"))  # seconds
    PLAYWRIGHT_HEADLESS: bool = os.getenv("PLAYWRIGHT_HEADLESS", "True").lower() == "true"
    
    # FFmpeg settings
    FFMPEG_TIMEOUT: int = int(os.getenv("FFMPEG_TIMEOUT", "300"))  # 5 minutes
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
    
    # Cleanup settings
    CLEANUP_INTERVAL: int = int(os.getenv("CLEANUP_INTERVAL", "3600"))  # 1 hour
    FILE_RETENTION: int = int(os.getenv("FILE_RETENTION", "7200"))  # 2 hours
    
    @classmethod
    def create_directories(cls):
        """Create required directories"""
        cls.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration"""
        import shutil
        
        warnings = []
        
        # Check FFmpeg
        if not shutil.which('ffmpeg'):
            warnings.append("⚠️ FFmpeg not found in PATH - M3U8 processing won't work")
        
        # Check cookies
        if not cls.COOKIES_FILE.exists():
            warnings.append("⚠️ cookies.txt not found - Instagram may require login")
        
        # Print warnings
        for warning in warnings:
            print(warning)
        
        return True


# Create directories on import
Config.create_directories()
