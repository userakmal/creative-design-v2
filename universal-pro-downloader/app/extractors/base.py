"""
Extractor Base Module
======================
Abstract base class for all extraction engines
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from pathlib import Path
from enum import Enum


class ExtractionStatus(Enum):
    """Extraction status"""
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class ExtractionResult:
    """Result from extraction engine"""
    success: bool
    download_url: Optional[str] = None
    file_path: Optional[Path] = None
    is_m3u8: bool = False
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    engine: str = "unknown"
    all_urls: List[str] = field(default_factory=list)
    
    @property
    def filesize(self) -> Optional[int]:
        """Get file size if file exists"""
        if self.file_path and self.file_path.exists():
            return self.file_path.stat().st_size
        return None


class BaseExtractor(ABC):
    """
    Abstract base class for extraction engines
    
    All extractors (yt-dlp, Playwright, etc.) must implement this
    """
    
    def __init__(self, download_dir: Path, timeout: int = 60):
        self.download_dir = download_dir
        self.timeout = timeout
        self.download_dir.mkdir(parents=True, exist_ok=True)
    
    @abstractmethod
    async def extract(self, url: str, quality: str = "best") -> ExtractionResult:
        """
        Extract video URL or download file
        
        Args:
            url: Video URL to extract
            quality: Quality preference (best, high, medium, low)
        
        Returns:
            ExtractionResult with download URL or file path
        """
        pass
    
    async def close(self):
        """Cleanup resources (browser, etc.)"""
        pass
    
    def _sanitize_filename(self, filename: str, max_length: int = 50) -> str:
        """Sanitize filename for safe storage"""
        import re
        
        # Remove invalid characters
        sanitized = re.sub(r'[<>:"/\\|?*]', '', filename)
        # Replace spaces with underscores
        sanitized = sanitized.replace(' ', '_')
        # Limit length
        return sanitized[:max_length] or 'video'
