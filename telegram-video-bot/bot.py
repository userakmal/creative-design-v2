"""
Telegram Video Downloader Bot - Main Bot Module
Built with aiogram v3, featuring smart file_id caching and 2GB upload support.
"""

import asyncio
import os
import time
import uuid
from datetime import datetime
from typing import Optional

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    FSInputFile,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaVideo,
    Message,
)
from loguru import logger

from config import config
from database import SQLiteCache, create_cache_backend, hash_url
from downloader import (
    DownloadError,
    DownloadStatus,
    DownloadTask,
    HLSProcessingError,
    InvalidURLError,
    VideoDownloader,
    VideoInfo,
    VideoTooLargeError,
)
from models import BotStatistics
from utils import (
    calculate_eta,
    create_progress_bar,
    extract_url_from_text,
    format_duration,
    format_file_size,
    format_timestamp,
    get_uptime,
    is_valid_url,
    setup_logging,
    truncate_text,
)

# Global bot start time for uptime calculation
bot_start_time: float = time.time()

# Statistics tracking
stats = BotStatistics()


class DownloadStates(StatesGroup):
    """FSM states for download workflow."""
    waiting_for_url = State()
    downloading = State()


# Create router for video downloads
download_router = Router()


class VideoDownloaderBot:
    """
    Main bot class handling Telegram interactions and video processing.
    Implements smart file_id caching for instant responses to cached URLs.
    """
    
    def __init__(self):
        self.bot: Optional[Bot] = None
        self.dp: Optional[Dispatcher] = None
        self.downloader: Optional[VideoDownloader] = None
        self.cache: Optional[SQLiteCache] = None
        self._active_tasks: dict[str, DownloadTask] = {}
    
    async def initialize(self) -> None:
        """Initialize bot, cache, and downloader."""
        setup_logging(
            config.logging.LOG_LEVEL,
            config.logging.LOG_FILE,
            config.logging.LOG_FORMAT,
        )
        
        # Initialize cache backend
        self.cache = create_cache_backend()
        await self.cache.initialize()
        logger.info("Cache backend initialized")
        
        # Initialize downloader
        self.downloader = VideoDownloader()
        logger.info("Video downloader initialized")
        
        # Configure bot session with custom API server and timeout settings
        # Note: aiogram expects a numeric timeout in seconds
        session = AiohttpSession(timeout=600)  # 10 minute timeout for large file uploads

        bot_kwargs = {
            "token": config.bot.TELEGRAM_BOT_TOKEN,
            "default": DefaultBotProperties(parse_mode=ParseMode.HTML),
            "session": session,
            "timeout": 600,  # Request timeout in seconds
        }

        # Configure for Local Bot API Server (2GB uploads)
        if config.bot.TELEGRAM_API_SERVER:
            bot_kwargs["base_url"] = config.bot.TELEGRAM_API_SERVER
            logger.info(
                f"Using Local Bot API Server: {config.bot.TELEGRAM_API_SERVER} "
                f"(supports up to 2GB uploads)"
            )

        self.bot = Bot(**bot_kwargs)
        self.dp = Dispatcher()
        
        # Register routers and handlers
        self._register_handlers()
        
        logger.info("Bot initialized successfully")
    
    def _register_handlers(self) -> None:
        """Register all bot handlers."""
        # Commands
        self.dp.message(CommandStart())(self.handle_start)
        self.dp.message(Command("help"))(self.handle_help)
        self.dp.message(Command("stats"))(self.handle_stats)
        self.dp.message(Command("cache"))(self.handle_cache_info)
        
        # URL messages (video downloads)
        self.dp.message(F.text)(self.handle_url_message)
        
        # Error handler
        self.dp.errors()(self.handle_error)
        
        logger.debug("Handlers registered")
    
    async def handle_start(self, message: Message) -> None:
        """Handle /start command."""
        welcome_text = (
            "🎬 <b>Video Downloader Bot</b>\n\n"
            "Send me any video URL and I'll download it for you!\n\n"
            "<b>Supported Platforms:</b>\n"
            "• YouTube, Instagram, TikTok\n"
            "• Twitter/X, Facebook, Vimeo\n"
            "• Direct .m3u8 HLS streams\n"
            "• And 1000+ more sites\n\n"
            "<b>Features:</b>\n"
            "✅ Smart caching for instant downloads\n"
            "✅ Support for files up to 2GB\n"
            "✅ HLS stream compilation\n"
            "✅ High quality output\n\n"
            "<i>Just paste a URL to get started!</i>"
        )
        
        await message.answer(welcome_text)
    
    async def handle_help(self, message: Message) -> None:
        """Handle /help command."""
        help_text = (
            "📖 <b>How to Use</b>\n\n"
            "1. <b>Download Video:</b>\n"
            "   Simply send any video URL\n\n"
            "2. <b>Check Status:</b>\n"
            "   Bot will show download progress\n\n"
            "3. <b>Get Cached Videos:</b>\n"
            "   Cached URLs download instantly!\n\n"
            "<b>Commands:</b>\n"
            "/start - Start the bot\n"
            "/help - Show this help\n"
            "/stats - View bot statistics\n"
            "/cache - Cache information\n\n"
            "<b>Tips:</b>\n"
            "• Public videos are cached for faster access\n"
            "• Larger files may take longer to process\n"
            "• HLS streams are automatically compiled to MP4"
        )
        
        await message.answer(help_text)
    
    async def handle_stats(self, message: Message) -> None:
        """Handle /stats command - show bot statistics."""
        cache_stats = await self.cache.get_stats()
        
        cache_hit_rate = 0.0
        total_requests = cache_stats.get("cache_hits", 0) + cache_stats.get("cache_misses", 0)
        if total_requests > 0:
            cache_hit_rate = (cache_stats.get("cache_hits", 0) / total_requests) * 100
        
        stats_text = (
            "📊 <b>Bot Statistics</b>\n\n"
            f"<b>Downloads:</b>\n"
            f"• Total: {cache_stats.get('total_downloads', 0)}\n"
            f"• Successful: {cache_stats.get('total_downloads', 0) - cache_stats.get('failed_downloads', 0)}\n"
            f"• Failed: {cache_stats.get('failed_downloads', 0)}\n\n"
            f"<b>Cache Performance:</b>\n"
            f"• Cache Hits: {cache_stats.get('cache_hits', 0)}\n"
            f"• Cache Misses: {cache_stats.get('cache_misses', 0)}\n"
            f"• Hit Rate: {cache_hit_rate:.1f}%\n"
            f"• Cached Videos: {cache_stats.get('cached_entries', 0)}\n"
            f"• Cache Size: {format_file_size(cache_stats.get('total_cache_size_bytes', 0))}\n\n"
            f"<b>Uptime:</b>\n"
            f"• {get_uptime()}"
        )
        
        await message.answer(stats_text)
    
    async def handle_cache_info(self, message: Message) -> None:
        """Handle /cache command - show cache information."""
        cache_stats = await self.cache.get_stats()
        
        cache_info = (
            "💾 <b>Cache Information</b>\n\n"
            f"<b>Backend:</b> {config.database.DB_TYPE.upper()}\n"
            f"<b>Cached Entries:</b> {cache_stats.get('cached_entries', 0)}\n"
            f"<b>Total Size:</b> {format_file_size(cache_stats.get('total_cache_size_bytes', 0))}\n"
            f"<b>Cache TTL:</b> {config.database.CACHE_TTL // 86400} days\n\n"
            "<i>Cached videos are served instantly without re-downloading!</i>"
        )
        
        await message.answer(cache_info)
    
    async def handle_url_message(self, message: Message) -> None:
        """Handle incoming URL messages for video download."""
        # Sanitize input: extract clean URL from message text
        raw_text = message.text.strip() if message.text else ""
        url = extract_url_from_text(raw_text)
        
        # Validate extracted URL
        if not url or not is_valid_url(url):
            await message.answer(
                "❌ <b>Invalid URL</b>\n\n"
                "Please send a valid HTTP/HTTPS URL.\n"
                "<i>Example: https://youtube.com/watch?v=...</i>"
            )
            return
        
        # Create download task
        task = DownloadTask(
            task_id=str(uuid.uuid4())[:8],
            url=url,
            user_id=message.from_user.id,
        )
        
        self._active_tasks[task.task_id] = task
        
        # Send initial status
        status_message = await message.answer(
            f"⏳ <b>Processing Request</b>\n\n"
            f"Task ID: <code>{task.task_id}</code>\n"
            f"URL: {truncate_text(url, 60)}\n\n"
            "<i>Checking cache and extracting video info...</i>"
        )
        
        # Process download in background
        asyncio.create_task(
            self.process_download(task, message, status_message)
        )
    
    async def process_download(
        self,
        task: DownloadTask,
        message: Message,
        status_message: Message,
    ) -> None:
        """
        Main download processing pipeline.
        Implements smart caching for instant responses.
        """
        try:
            # Step 1: Check cache
            url_hash = hash_url(task.url)
            cached = await self.cache.get(url_hash)
            
            if cached:
                # Cache hit - instant response!
                await self._handle_cache_hit(task, cached, message, status_message)
                return
            
            # Cache miss - proceed with download
            stats.cache_misses += 1
            await self.cache.increment_stat("cache_misses")
            
            # Step 2: Extract video info
            task.status = DownloadStatus.DOWNLOADING
            await self._update_status(
                status_message,
                task,
                "Extracting video information..."
            )
            
            video_info = await self.downloader.extract_info(task.url)
            task.video_info = video_info
            
            # Step 3: Validate and download
            await self._update_status(
                status_message,
                task,
                f"Downloading: {truncate_text(video_info.title, 50)}\n"
                f"Size: {format_file_size(video_info.get_filesize_int() or 0)}\n"
                f"Duration: {format_duration(video_info.duration)}"
            )
            
            file_path, file_size = await self.downloader.download(task, video_info)
            task.file_path = file_path
            
            # Step 4: Upload to Telegram
            task.status = DownloadStatus.UPLOADING
            await self._update_status(
                status_message,
                task,
                f"Uploading to Telegram...\n{create_progress_bar(50, 100)}"
            )
            
            # Send video and capture file_id
            file_id = await self._send_video(
                message,
                status_message,
                file_path,
                video_info,
            )
            
            task.file_id = file_id
            task.status = DownloadStatus.COMPLETED
            task.completed_at = datetime.now()
            
            # Step 5: Cache the file_id
            await self.cache.set(url_hash, file_id, video_info, file_size)
            
            # Step 6: Cleanup local file
            await self.downloader.cleanup_file(file_path)
            
            # Update statistics
            stats.total_downloads += 1
            await self.cache.increment_stat("total_downloads")
            
            logger.info(
                f"Download complete: {task.task_id} | "
                f"{video_info.title[:50]} | cached for instant access"
            )
            
        except VideoTooLargeError as e:
            await self._handle_error(task, status_message, str(e))
        
        except InvalidURLError as e:
            await self._handle_error(task, status_message, str(e))
        
        except HLSProcessingError as e:
            await self._handle_error(
                task,
                status_message,
                f"Failed to process HLS stream: {str(e)}"
            )
        
        except DownloadError as e:
            await self._handle_error(task, status_message, str(e))
        
        except Exception as e:
            logger.exception(f"Unexpected error in task {task.task_id}")
            await self._handle_error(
                task,
                status_message,
                f"Unexpected error: {str(e)}"
            )
        
        finally:
            # Remove from active tasks
            self._active_tasks.pop(task.task_id, None)
    
    async def _handle_cache_hit(
        self,
        task: DownloadTask,
        cached,
        message: Message,
        status_message: Message,
    ) -> None:
        """Handle cache hit - instant video send."""
        task.status = DownloadStatus.CACHED
        
        await self._update_status(
            status_message,
            task,
            "✨ <b>Cache Hit!</b>\nSending instantly..."
        )
        
        try:
            # Send using cached file_id - instant!
            await self.bot.send_video(
                chat_id=message.chat.id,
                video=cached.file_id,
                caption=self._create_video_caption(cached.video_info),
                reply_to_message_id=message.message_id,
            )
            
            task.status = DownloadStatus.COMPLETED
            task.completed_at = datetime.now()
            
            # Update statistics
            stats.cache_hits += 1
            await self.cache.increment_stat("cache_hits")
            
            await status_message.delete()
            
            logger.info(
                f"Cache hit: {task.task_id} | "
                f"sent instantly with file_id: {cached.file_id}"
            )
            
        except Exception as e:
            logger.error(f"Failed to send cached video: {e}")
            # Cache might be invalid, remove and re-download
            await self.cache.delete(hash_url(task.url))
            await self._update_status(
                status_message,
                task,
                "⚠️ Cached file expired, re-downloading..."
            )
            # Re-process without cache
            task.status = DownloadStatus.PENDING
            asyncio.create_task(
                self.process_download(task, message, status_message)
            )
    
    async def _send_video(
        self,
        message: Message,
        status_message: Message,
        file_path: str,
        video_info: VideoInfo,
    ) -> str:
        """
        Send video to Telegram and return file_id.
        Supports progress updates during upload with retry logic.
        """
        import asyncio
        from aiogram.exceptions import TelegramNetworkError, TelegramRetryAfter
        
        file_size = os.path.getsize(file_path)
        caption = self._create_video_caption(video_info)

        # Retry logic for network errors
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                # Send video
                video_file = FSInputFile(path=file_path, filename=f"{video_info.title}.mp4")
                result = await self.bot.send_video(
                    chat_id=message.chat.id,
                    video=video_file,
                    caption=caption,
                    reply_to_message_id=message.message_id,
                    request_timeout=300,  # 5 minute timeout for large files
                )

                # Clean up status message
                try:
                    await status_message.delete()
                except:
                    pass

                # Return file_id for caching
                return result.video.file_id
                
            except TelegramRetryAfter as e:
                # Telegram is rate limiting - wait and retry
                retry_after = e.retry_after
                logger.warning(f"Rate limited by Telegram. Waiting {retry_after}s...")
                await asyncio.sleep(retry_after)
                
            except TelegramNetworkError as e:
                last_error = e
                logger.warning(f"Network error (attempt {attempt + 1}/{max_retries}): {e}")
                
                if attempt < max_retries - 1:
                    # Wait before retry with exponential backoff
                    wait_time = 5 * (attempt + 1)
                    await asyncio.sleep(wait_time)
                else:
                    # Last attempt failed
                    raise
                    
            except Exception as e:
                # Unexpected error - don't retry
                logger.error(f"Unexpected error sending video: {e}")
                raise
        
        # If we get here, all retries failed
        raise last_error
    
    def _create_video_caption(self, video_info: VideoInfo) -> str:
        """Create formatted video caption."""
        caption_parts = [
            f"🎬 <b>{truncate_text(video_info.title, 100)}</b>",
        ]

        if video_info.uploader:
            caption_parts.append(f"👤 {truncate_text(video_info.uploader, 50)}")

        if video_info.duration:
            caption_parts.append(f"⏱️ {format_duration(video_info.duration)}")

        if video_info.view_count:
            # Convert to int to avoid float formatting issues
            view_count_int = int(video_info.view_count) if isinstance(video_info.view_count, float) else video_info.view_count
            caption_parts.append(
                f"👁️ {view_count_int:,} views"
            )

        caption_parts.append(
            f"\n🔗 <i>Downloaded with Video Bot</i>"
        )

        return "\n".join(caption_parts)
    
    async def _update_status(
        self,
        status_message: Message,
        task: Optional[DownloadTask],
        text: str,
    ) -> None:
        """Update status message with current progress."""
        try:
            full_text = text
            if task:
                full_text = (
                    f"🔄 <b>Download Progress</b>\n\n"
                    f"Task: <code>{task.task_id}</code>\n\n"
                    f"{text}"
                )
            
            await status_message.edit_text(full_text)
        except Exception as e:
            # Message might be unchanged or deleted
            if "message is not modified" not in str(e).lower():
                logger.debug(f"Status update error: {e}")
    
    async def _handle_error(
        self,
        task: DownloadTask,
        status_message: Message,
        error_message: str,
    ) -> None:
        """Handle download error with user notification."""
        task.status = DownloadStatus.FAILED
        task.error_message = error_message
        
        stats.failed_downloads += 1
        await self.cache.increment_stat("failed_downloads")
        
        error_text = (
            f"❌ <b>Download Failed</b>\n\n"
            f"Task ID: <code>{task.task_id}</code>\n\n"
            f"<b>Error:</b>\n"
            f"<code>{truncate_text(error_message, 200)}</code>\n\n"
            "<i>Please try again or check the URL.</i>"
        )
        
        try:
            await status_message.edit_text(error_text)
        except Exception:
            pass
        
        # Cleanup any partial files
        if task.file_path:
            await self.downloader.cleanup_file(task.file_path)
        
        logger.warning(f"Task failed: {task.task_id} | {error_message}")
    
    async def handle_error(
        self,
        update: any,
        exception: Exception,
    ) -> None:
        """Global error handler."""
        logger.exception(f"Global error: {exception}")
    
    async def start(self) -> None:
        """Start the bot polling loop."""
        await self.initialize()

        logger.info("Starting bot polling...")
        try:
            await self.dp.start_polling(self.bot)
        except asyncio.CancelledError:
            logger.info("Polling cancelled")
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        except Exception as e:
            logger.exception(f"Polling error: {e}")
        finally:
            await self.shutdown()

    async def shutdown(self) -> None:
        """Graceful shutdown."""
        logger.info("Shutting down bot...")

        if self.bot:
            await self.bot.session.close()

        if self.cache:
            await self.cache.close()

        logger.info("Bot shutdown complete")


# Bot instance
bot_instance = VideoDownloaderBot()


async def main() -> None:
    """Main entry point."""
    try:
        await bot_instance.start()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        await bot_instance.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
