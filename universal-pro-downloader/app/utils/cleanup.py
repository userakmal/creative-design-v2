"""
Cleanup Service Module
=======================
Background service for cleaning up temporary files
"""

import asyncio
import logging
import time
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


class CleanupService:
    """
    Background cleanup service
    
    Periodically removes old temporary files to prevent
    disk space exhaustion.
    """
    
    def __init__(
        self,
        download_dir: Path,
        retention_seconds: int = 7200,  # 2 hours
    ):
        self.download_dir = download_dir
        self.retention_seconds = retention_seconds
        self.running = False
    
    async def start_periodic_cleanup(self):
        """Start periodic cleanup loop"""
        self.running = True
        logger.info("🧹 Cleanup service started")
        
        while self.running:
            try:
                await asyncio.sleep(3600)  # Run every hour
                await self.cleanup_old_files()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup error: {e}")
        
        logger.info("Cleanup service stopped")
    
    async def cleanup_old_files(self) -> int:
        """
        Remove files older than retention period
        
        Returns:
            Number of files removed
        """
        now = time.time()
        removed = 0
        
        # File extensions to clean
        extensions = {
            '.mp4', '.webm', '.mkv', '.avi', '.mov',  # Video
            '.m3u8', '.ts', '.m4s', '.m4a',  # Stream chunks
            '.part', '.ytdl', '.tmp', '.download',  # Temporary
            '.jpg', '.png', '.webp',  # Thumbnails
        }
        
        try:
            if not self.download_dir.exists():
                return 0
            
            for file_path in self.download_dir.iterdir():
                if not file_path.is_file():
                    continue
                
                # Check extension
                if file_path.suffix.lower() not in extensions:
                    continue
                
                # Check age
                try:
                    file_age = now - file_path.stat().st_mtime
                    
                    if file_age > self.retention_seconds:
                        file_path.unlink()
                        removed += 1
                        logger.info(f"🗑️ Cleaned up: {file_path.name} ({file_age:.0f}s old)")
                        
                except Exception as e:
                    logger.debug(f"Error checking {file_path}: {e}")
            
            if removed > 0:
                logger.info(f"✅ Cleanup complete: removed {removed} files")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
        
        return removed
    
    async def cleanup_file(self, file_path: Path) -> bool:
        """Remove specific file"""
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info(f"🗑️ Cleaned up: {file_path}")
                return True
        except Exception as e:
            logger.error(f"Failed to clean {file_path}: {e}")
        return False
    
    def stop(self):
        """Stop cleanup service"""
        self.running = False
