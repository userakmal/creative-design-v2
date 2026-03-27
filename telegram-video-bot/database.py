"""
Database module for video caching.
Supports both SQLite and Redis backends with async operations.
"""

import hashlib
import json
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiosqlite
from loguru import logger

from config import config
from models import CachedVideo, VideoInfo


class CacheBackend(ABC):
    """Abstract base class for cache backends."""
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the cache backend."""
        pass
    
    @abstractmethod
    async def get(self, url_hash: str) -> Optional[CachedVideo]:
        """Get cached video by URL hash."""
        pass
    
    @abstractmethod
    async def set(
        self,
        url_hash: str,
        file_id: str,
        video_info: VideoInfo,
        file_size: int,
    ) -> None:
        """Cache a video entry."""
        pass
    
    @abstractmethod
    async def delete(self, url_hash: str) -> bool:
        """Delete a cached entry."""
        pass
    
    @abstractmethod
    async def exists(self, url_hash: str) -> bool:
        """Check if URL hash exists in cache."""
        pass
    
    @abstractmethod
    async def close(self) -> None:
        """Close the cache connection."""
        pass
    
    @abstractmethod
    async def get_stats(self) -> dict:
        """Get cache statistics."""
        pass
    
    @abstractmethod
    async def cleanup_old_entries(self, days: int = 7) -> int:
        """Remove entries older than specified days."""
        pass


class SQLiteCache(CacheBackend):
    """SQLite-based cache implementation."""
    
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self._connection: Optional[aiosqlite.Connection] = None
    
    async def initialize(self) -> None:
        """Initialize SQLite database and create tables."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self._connection = await aiosqlite.connect(str(self.db_path))
        self._connection.row_factory = aiosqlite.Row
        
        await self._connection.executescript("""
            CREATE TABLE IF NOT EXISTS cached_videos (
                url_hash TEXT PRIMARY KEY,
                file_id TEXT NOT NULL,
                title TEXT NOT NULL,
                duration INTEGER,
                thumbnail TEXT,
                uploader TEXT,
                created_at TEXT NOT NULL,
                access_count INTEGER DEFAULT 0,
                last_accessed TEXT NOT NULL,
                file_size INTEGER DEFAULT 0
            );
            
            CREATE TABLE IF NOT EXISTS statistics (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_downloads INTEGER DEFAULT 0,
                cache_hits INTEGER DEFAULT 0,
                cache_misses INTEGER DEFAULT 0,
                total_bytes_downloaded INTEGER DEFAULT 0,
                total_bytes_uploaded INTEGER DEFAULT 0,
                failed_downloads INTEGER DEFAULT 0,
                unique_users INTEGER DEFAULT 0
            );
            
            CREATE INDEX IF NOT EXISTS idx_access_count 
            ON cached_videos(access_count DESC);
            
            CREATE INDEX IF NOT EXISTS idx_created_at 
            ON cached_videos(created_at);
            
            INSERT OR IGNORE INTO statistics (id) VALUES (1);
        """)
        
        await self._connection.commit()
        logger.info(f"SQLite cache initialized: {self.db_path}")
    
    async def get(self, url_hash: str) -> Optional[CachedVideo]:
        """Retrieve cached video by URL hash."""
        if not self._connection:
            return None
        
        async with self._connection.execute(
            "SELECT * FROM cached_videos WHERE url_hash = ?",
            (url_hash,)
        ) as cursor:
            row = await cursor.fetchone()
            
            if not row:
                return None
            
            # Update access statistics
            await self._connection.execute(
                """
                UPDATE cached_videos 
                SET access_count = access_count + 1, 
                    last_accessed = ?
                WHERE url_hash = ?
                """,
                (datetime.now().isoformat(), url_hash)
            )
            await self._connection.commit()
            
            return CachedVideo(
                url_hash=row["url_hash"],
                file_id=row["file_id"],
                video_info=VideoInfo(
                    url="",
                    title=row["title"],
                    duration=row["duration"],
                    thumbnail=row["thumbnail"],
                    uploader=row["uploader"],
                ),
                created_at=datetime.fromisoformat(row["created_at"]),
                access_count=row["access_count"] + 1,
                last_accessed=datetime.now(),
                file_size=row["file_size"],
            )
    
    async def set(
        self,
        url_hash: str,
        file_id: str,
        video_info: VideoInfo,
        file_size,  # Can be int or float
    ) -> None:
        """Cache a video entry."""
        if not self._connection:
            return

        # Convert to int if float (for database storage)
        file_size_int = int(file_size) if file_size else 0

        await self._connection.execute(
            """
            INSERT OR REPLACE INTO cached_videos
            (url_hash, file_id, title, duration, thumbnail, uploader,
             created_at, last_accessed, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                url_hash,
                file_id,
                video_info.title,
                video_info.duration,
                video_info.thumbnail,
                video_info.uploader,
                datetime.now().isoformat(),
                datetime.now().isoformat(),
                file_size_int,
            )
        )
        await self._connection.commit()
        logger.debug(f"Cached video: {url_hash[:16]}... -> {file_id}")
    
    async def delete(self, url_hash: str) -> bool:
        """Delete a cached entry."""
        if not self._connection:
            return False
        
        cursor = await self._connection.execute(
            "DELETE FROM cached_videos WHERE url_hash = ?",
            (url_hash,)
        )
        await self._connection.commit()
        return cursor.rowcount > 0
    
    async def exists(self, url_hash: str) -> bool:
        """Check if URL hash exists in cache."""
        if not self._connection:
            return False
        
        async with self._connection.execute(
            "SELECT 1 FROM cached_videos WHERE url_hash = ? LIMIT 1",
            (url_hash,)
        ) as cursor:
            return await cursor.fetchone() is not None
    
    async def close(self) -> None:
        """Close database connection."""
        if self._connection:
            await self._connection.close()
            self._connection = None
            logger.info("SQLite cache connection closed")
    
    async def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self._connection:
            return {}
        
        async with self._connection.execute(
            "SELECT * FROM statistics WHERE id = 1"
        ) as cursor:
            stats_row = await cursor.fetchone()
        
        async with self._connection.execute(
            "SELECT COUNT(*) as count, SUM(file_size) as total_size FROM cached_videos"
        ) as cursor:
            cache_row = await cursor.fetchone()
        
        return {
            "total_downloads": stats_row["total_downloads"] if stats_row else 0,
            "cache_hits": stats_row["cache_hits"] if stats_row else 0,
            "cache_misses": stats_row["cache_misses"] if stats_row else 0,
            "cached_entries": cache_row["count"] or 0,
            "total_cache_size_bytes": cache_row["total_size"] or 0,
            "failed_downloads": stats_row["failed_downloads"] if stats_row else 0,
        }
    
    async def cleanup_old_entries(self, days: int = 7) -> int:
        """Remove entries older than specified days."""
        if not self._connection:
            return 0
        
        cutoff = datetime.now().timestamp() - (days * 24 * 60 * 60)
        cursor = await self._connection.execute(
            """
            DELETE FROM cached_videos 
            WHERE datetime(created_at) < datetime(?)
            """,
            (datetime.fromtimestamp(cutoff).isoformat(),)
        )
        await self._connection.commit()
        deleted = cursor.rowcount
        
        if deleted > 0:
            logger.info(f"Cleaned up {deleted} old cache entries")
        
        # Vacuum database to reclaim space
        await self._connection.execute("VACUUM")
        
        return deleted
    
    async def increment_stat(self, stat_name: str, value: int = 1) -> None:
        """Increment a statistics counter."""
        if not self._connection:
            return
        
        await self._connection.execute(
            f"UPDATE statistics SET {stat_name} = {stat_name} + ? WHERE id = 1",
            (value,)
        )
        await self._connection.commit()


class RedisCache(CacheBackend):
    """Redis-based cache implementation."""
    
    def __init__(
        self,
        host: str,
        port: int,
        db: int = 0,
        password: Optional[str] = None,
        ttl: int = 604800,
    ):
        self.host = host
        self.port = port
        self.db = db
        self.password = password
        self.ttl = ttl
        self._redis: Optional[any] = None
    
    async def initialize(self) -> None:
        """Initialize Redis connection."""
        try:
            import redis.asyncio as redis
        except ImportError:
            import asyncio_redis as redis
        
        self._redis = await redis.Redis(
            host=self.host,
            port=self.port,
            db=self.db,
            password=self.password,
            decode_responses=True,
        )
        await self._redis.ping()
        logger.info(
            f"Redis cache initialized: {self.host}:{self.port}/{self.db}"
        )
    
    async def get(self, url_hash: str) -> Optional[CachedVideo]:
        """Retrieve cached video by URL hash."""
        if not self._redis:
            return None
        
        data = await self._redis.get(f"video:{url_hash}")
        if not data:
            return None
        
        cached = CachedVideo.from_dict(json.loads(data))
        
        # Update access count
        await self._redis.hincrby(f"stats:{url_hash}", "access_count", 1)
        await self._redis.expire(f"video:{url_hash}", self.ttl)
        
        return cached
    
    async def set(
        self,
        url_hash: str,
        file_id: str,
        video_info: VideoInfo,
        file_size,  # Can be int or float
    ) -> None:
        """Cache a video entry."""
        if not self._redis:
            return

        # Convert to int if float (for storage)
        file_size_int = int(file_size) if file_size else 0

        cached = CachedVideo(
            url_hash=url_hash,
            file_id=file_id,
            video_info=video_info,
            file_size=file_size_int,
        )

        await self._redis.setex(
            f"video:{url_hash}",
            self.ttl,
            json.dumps(cached.to_dict()),
        )
        logger.debug(f"Cached video in Redis: {url_hash[:16]}... -> {file_id}")
    
    async def delete(self, url_hash: str) -> bool:
        """Delete a cached entry."""
        if not self._redis:
            return False
        
        result = await self._redis.delete(f"video:{url_hash}")
        await self._redis.delete(f"stats:{url_hash}")
        return result > 0
    
    async def exists(self, url_hash: str) -> bool:
        """Check if URL hash exists in cache."""
        if not self._redis:
            return False
        
        return await self._redis.exists(f"video:{url_hash}")
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            logger.info("Redis cache connection closed")
    
    async def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self._redis:
            return {}
        
        # Get all video keys
        keys = await self._redis.keys("video:*")
        
        total_size = 0
        for key in keys:
            data = await self._redis.get(key)
            if data:
                cached_data = json.loads(data)
                total_size += cached_data.get("file_size", 0)
        
        return {
            "cached_entries": len(keys),
            "total_cache_size_bytes": total_size,
        }
    
    async def cleanup_old_entries(self, days: int = 7) -> int:
        """Redis handles TTL automatically, but we can force cleanup."""
        # Redis automatically expires keys with TTL
        # This method is mainly for logging
        logger.info(f"Redis TTL auto-cleanup active (TTL: {self.ttl}s)")
        return 0


def create_cache_backend() -> CacheBackend:
    """Factory function to create appropriate cache backend."""
    db_config = config.database
    
    if db_config.DB_TYPE.lower() == "redis":
        return RedisCache(
            host=db_config.REDIS_HOST,
            port=db_config.REDIS_PORT,
            db=db_config.REDIS_DB,
            password=db_config.REDIS_PASSWORD,
            ttl=db_config.CACHE_TTL,
        )
    else:
        return SQLiteCache(db_config.SQLITE_DB_PATH)


def hash_url(url: str) -> str:
    """Create a consistent hash for a URL."""
    return hashlib.sha256(url.encode()).hexdigest()[:32]
