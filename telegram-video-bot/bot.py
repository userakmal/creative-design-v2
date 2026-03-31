"""
Telegram Video Downloader Bot - Main Bot Module
Built with aiogram v3, featuring smart file_id caching and 2GB upload support.
"""

import asyncio
import logging
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiohttp
from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.enums import ChatType, ChatMemberStatus, ParseMode
from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    ChatMemberUpdated,
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
    AudioExtractionError,
    DownloadError,
    DownloadStatus,
    DownloadTask,
    HLSProcessingError,
    InvalidURLError,
    VideoDownloader,
    VideoInfo,
    VideoTooLargeError,
)
from handlers import language_router, quality_router, admin_router
from keyboards import create_main_menu_keyboard
from locales import get_text, set_user_language, get_user_language, AVAILABLE_LANGUAGES
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

# Rate limiting configuration
RATE_LIMIT_MAX_REQUESTS = 4  # Maximum requests per window
RATE_LIMIT_WINDOW_SECONDS = 60  # Time window in seconds


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    Tracks user request timestamps and enforces rate limits.
    
    FIX #3: Rate limiting is based on user_id (from_user.id), NOT chat.id.
    This ensures each USER is rate limited individually, not the entire group.
    If a user sends 4 URLs in a minute, only THAT user is blocked.
    Other users in the same group can still use the bot.
    """

    def __init__(self, max_requests: int = RATE_LIMIT_MAX_REQUESTS, window_seconds: int = RATE_LIMIT_WINDOW_SECONDS):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Dictionary: user_id -> list of request timestamps
        # KEY: user_id (NOT chat_id) - each user is tracked individually
        self._user_requests: dict[int, list[float]] = {}

    def is_rate_limited(self, user_id: int) -> bool:
        """
        Check if user is rate limited.
        Returns True if user has exceeded the rate limit.
        """
        current_time = time.time()
        window_start = current_time - self.window_seconds

        # Get user's request history
        if user_id not in self._user_requests:
            self._user_requests[user_id] = []

        # Remove old timestamps outside the window
        self._user_requests[user_id] = [
            ts for ts in self._user_requests[user_id]
            if ts > window_start
        ]

        # Check if user has exceeded the limit
        return len(self._user_requests[user_id]) >= self.max_requests

    def record_request(self, user_id: int) -> None:
        """Record a new request timestamp for the user."""
        current_time = time.time()
        if user_id not in self._user_requests:
            self._user_requests[user_id] = []
        self._user_requests[user_id].append(current_time)

    def get_remaining_requests(self, user_id: int) -> int:
        """Get the number of remaining requests for the user in current window."""
        current_time = time.time()
        window_start = current_time - self.window_seconds

        if user_id not in self._user_requests:
            return self.max_requests

        # Count valid timestamps in current window
        valid_requests = [
            ts for ts in self._user_requests[user_id]
            if ts > window_start
        ]
        return max(0, self.max_requests - len(valid_requests))


# Global rate limiter instance
rate_limiter = RateLimiter()

# Assets path for downloading animation
ASSETS_DIR = Path(__file__).parent / "assets"
DOWNLOADING_GIF_PATH = ASSETS_DIR / "downloading.gif"


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
        self._animation_messages: dict[str, int] = {}  # task_id -> message_id
    
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

        # CRITICAL: Check FFmpeg availability (required for video/audio merge)
        from downloader import check_ffmpeg
        check_ffmpeg()

        # Configure bot session with Local API Server for 2GB uploads
        # CRITICAL: Must use TelegramAPIServer.from_base() for proper local server integration
        api_server = None
        if config.bot.TELEGRAM_API_SERVER:
            api_server = TelegramAPIServer.from_base(config.bot.TELEGRAM_API_SERVER)
            max_size_gb = config.downloader.MAX_FILE_SIZE / 1024 / 1024 / 1024
            logger.info(
                f"Using Local Bot API Server: {config.bot.TELEGRAM_API_SERVER} "
                f"(configured for up to {max_size_gb:.1f}GB uploads)"
            )
        else:
            logger.warning("TELEGRAM_API_SERVER not configured - using standard Telegram API (50MB limit)")

        session = AiohttpSession(
            api=api_server,
            timeout=600  # 10 minute timeout for large file uploads
        )

        self.bot = Bot(
            token=config.bot.TELEGRAM_BOT_TOKEN,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML),
            session=session,
        )
        self.dp = Dispatcher()

        # Attach cache and downloader to bot instance for handler access
        self.bot.cache = self.cache
        self.bot.downloader = self.downloader

        # Register routers and handlers
        self._register_handlers()

        logger.info("Bot initialized successfully")
    
    def _register_handlers(self) -> None:
        """Register all bot handlers."""
        # Include modular routers
        self.dp.include_router(language_router)
        self.dp.include_router(quality_router)
        self.dp.include_router(admin_router)

        # Main bot commands
        self.dp.message(CommandStart())(self.handle_start)
        self.dp.message(Command("help"))(self.handle_help)
        self.dp.message(Command("stats"))(self.handle_stats)
        self.dp.message(Command("cache"))(self.handle_cache_info)

        # Main menu button handlers (must be registered BEFORE generic text handler)
        self.dp.message(F.text == "🎬 Video Yuklash")(self.handle_menu_video_upload)
        self.dp.message(F.text == "⚙️ Sozlamalar")(self.handle_menu_settings)
        self.dp.message(F.text == "ℹ️ Yordam / Qo'llanma")(self.handle_menu_help)
        self.dp.message(F.text == "👑 Admin Panel")(self.handle_menu_admin)

        # URL messages (video downloads) - explicitly allow all chat types
        # FIX #1: Use F.text filter that matches text in ANY chat type (private, group, supergroup)
        self.dp.message(F.text)(self.handle_url_message)

        # Callback queries (audio extraction)
        self.dp.callback_query(F.data.startswith("download_audio:"))(self.handle_download_audio_callback)

        # Chat member updates (bot added to group)
        # aiogram v3: Use F filter for status changes
        self.dp.my_chat_member(
            F.new_chat_member.status.in_([ChatMemberStatus.MEMBER, ChatMemberStatus.ADMINISTRATOR])
            & F.old_chat_member.status == ChatMemberStatus.LEFT
        )(self.handle_bot_added_to_group)

        # Error handler
        self.dp.errors()(self.handle_error)

        logger.info("Handlers registered - URL handler accepts messages from all chat types")

    async def handle_download_audio_callback(self, callback_query: CallbackQuery) -> None:
        """
        Handle 'Download Audio' button click.
        Extracts audio from video and sends as MP3.
        """
        # Extract URL from callback data
        # Format: download_audio:<url>
        callback_data = callback_query.data
        if not callback_data.startswith("download_audio:"):
            await callback_query.answer("❌ Invalid request", show_alert=True)
            return

        url = callback_data.replace("download_audio:", "", 1)

        if not url:
            await callback_query.answer("❌ URL not found", show_alert=True)
            return

        user_id = callback_query.from_user.id
        task_id = str(uuid.uuid4())[:8]

        # Acknowledge the callback
        await callback_query.answer("⏳ Extracting audio...")

        # Send processing message
        processing_message = await callback_query.message.answer(
            f"🎵 <b>Extracting Audio</b>\n\n"
            f"Task ID: <code>{task_id}</code>\n\n"
            "<i>Please wait while we extract the audio...</i>",
            reply_to_message_id=callback_query.message.message_id,
        )

        # Process audio extraction in background
        asyncio.create_task(
            self.process_audio_extraction(url, task_id, user_id, processing_message, callback_query.message)
        )

    async def process_audio_extraction(
        self,
        url: str,
        task_id: str,
        user_id: int,
        processing_message: Message,
        original_message: Message,
    ) -> None:
        """
        Process audio extraction from URL.
        Downloads audio directly or extracts from cached video.
        """
        try:
            # Step 1: Check if we have cached video info
            url_hash = hash_url(url)
            cached = await self.cache.get(url_hash)

            audio_file_path = None
            video_info = None

            if cached:
                # We have cached video, but we need to download audio fresh
                # since we don't store the original file
                logger.info(f"Using URL for audio extraction: {url}")
                video_info = cached.video_info
                video_info.url = url  # Restore URL for extraction

            # Step 2: Extract video info if not available
            if not video_info:
                try:
                    video_info = await self.downloader.extract_info(url)
                except Exception as e:
                    logger.error(f"Failed to extract video info: {e}")
                    await self._edit_or_send_message(
                        processing_message,
                        original_message,
                        f"❌ <b>Audio Extraction Failed</b>\n\n"
                        f"Task ID: <code>{task_id}</code>\n\n"
                        f"<b>Error:</b>\n"
                        f"<code>Failed to get video information</code>\n\n"
                        f"<i>The URL might be invalid or the video is unavailable.</i>"
                    )
                    return

            # Step 3: Download audio directly from URL
            await self._edit_or_send_message(
                processing_message,
                original_message,
                f"🎵 <b>Downloading Audio</b>\n\n"
                f"Task ID: <code>{task_id}</code>\n"
                f"Title: {truncate_text(video_info.title, 50)}\n\n"
                "<i>Extracting audio stream...</i>"
            )

            audio_file_path, audio_size = await self.downloader.extract_audio_from_url(
                url=url,
                task_id=task_id,
                title=video_info.title or "audio",
            )

            # Step 4: Send audio file
            await self._edit_or_send_message(
                processing_message,
                original_message,
                f"🎵 <b>Audio Ready!</b>\n\n"
                f"Title: {truncate_text(video_info.title, 50)}\n"
                f"Size: {format_file_size(audio_size)}\n\n"
                "<i>Sending audio...</i>"
            )

            # Create audio caption
            audio_caption = (
                f"🎵 <b>{truncate_text(video_info.title, 100)}</b>\n"
            )
            if video_info.uploader:
                audio_caption += f"👤 {truncate_text(video_info.uploader, 50)}\n"
            if video_info.duration:
                audio_caption += f"⏱️ {format_duration(video_info.duration)}\n"
            audio_caption += f"\n🔗 <i>Extracted with Video Bot</i>"

            # Send as audio document
            audio_file = FSInputFile(path=audio_file_path, filename=f"{video_info.title}.mp3")
            await self.bot.send_audio(
                chat_id=original_message.chat.id,
                audio=audio_file,
                caption=audio_caption,
                reply_to_message_id=original_message.message_id,
                request_timeout=300,
            )

            # Cleanup
            await self.downloader.cleanup_file(audio_file_path)

            # Delete processing message
            try:
                await processing_message.delete()
            except:
                pass

            logger.info(f"Audio extraction complete: {task_id} | {video_info.title[:50]}")

        except AudioExtractionError as e:
            logger.error(f"Audio extraction error: {e}")
            await self._edit_or_send_message(
                processing_message,
                original_message,
                f"❌ <b>Audio Extraction Failed</b>\n\n"
                f"Task ID: <code>{task_id}</code>\n\n"
                f"<b>Error:</b>\n"
                f"<code>{truncate_text(str(e), 200)}</code>\n\n"
                "<i>Please try again or check the URL.</i>"
            )

        except Exception as e:
            logger.exception(f"Unexpected error in audio extraction: {e}")
            await self._edit_or_send_message(
                processing_message,
                original_message,
                f"❌ <b>Audio Extraction Failed</b>\n\n"
                f"Task ID: <code>{task_id}</code>\n\n"
                f"<b>Error:</b>\n"
                f"<code>{truncate_text(str(e), 200)}</code>\n\n"
                "<i>An unexpected error occurred.</i>"
            )

    async def _edit_or_send_message(
        self,
        edit_message: Message,
        fallback_message: Message,
        text: str,
    ) -> None:
        """
        Try to edit a message, or send new message if edit fails.
        """
        try:
            await edit_message.edit_text(text)
        except Exception:
            # Message might be deleted or unchanged
            try:
                await fallback_message.answer(text)
            except Exception:
                logger.debug("Failed to send/edit message")
    
    async def handle_start(self, message: Message) -> None:
        """
        Handle /start command.
        FIX #2: First shows language selection, then sends welcome message after user chooses.
        Sends persistent main menu keyboard after language selection.
        """
        user_id = message.from_user.id
        
        # Check if user already has a language set
        user_lang = await self.cache.get_user_language(user_id) if self.cache else "uz"
        
        if user_lang and user_lang in AVAILABLE_LANGUAGES:
            # User already has a language - send welcome message with main menu
            welcome_text = get_text("start", user_id)
            await message.answer(
                welcome_text,
                reply_markup=create_main_menu_keyboard(user_id)
            )
        else:
            # New user - show language selection first
            from locales import AVAILABLE_LANGUAGES
            
            # Create language selection keyboard
            keyboard = []
            for lang_code, lang_name in AVAILABLE_LANGUAGES.items():
                keyboard.append([
                    InlineKeyboardButton(
                        text=lang_name,
                        callback_data=f"set_lang:{lang_code}"
                    )
                ])
            
            language_keyboard = InlineKeyboardMarkup(
                inline_keyboard=keyboard,
                resize_keyboard=True
            )
            
            # Send greeting with language selection
            greeting = (
                "👋 <b>Assalomu alaykum! / Здравствуйте! / Hello!</b>\n\n"
                "Iltimos, tilni tanlang:\n"
                "Пожалуйста, выберите язык:\n"
                "Please select your language:\n\n"
                "Bot to'g'ri ishlashi uchun tilni tanlashingiz kerak."
            )
            
            await message.answer(greeting, reply_markup=language_keyboard)

    async def handle_help(self, message: Message) -> None:
        """Handle /help command."""
        user_id = message.from_user.id
        help_text = get_text("help", user_id)
        await message.answer(help_text)
    
    async def handle_stats(self, message: Message) -> None:
        """
        Handle /stats command - show bot statistics.
        RESTRICTED: Only accessible by ADMIN_ID.
        """
        user_id = message.from_user.id
        
        # Check if user is admin
        admin_id = config.bot.ADMIN_ID
        if not admin_id or user_id != admin_id:
            await message.answer(get_text("stats_denied", user_id))
            return

        # Get cache statistics
        cache_stats = await self.cache.get_stats()

        # Get unique users count
        unique_users_count = await self.cache.get_unique_users_count()

        cache_hit_rate = 0.0
        total_requests = cache_stats.get("cache_hits", 0) + cache_stats.get("cache_misses", 0)
        if total_requests > 0:
            cache_hit_rate = (cache_stats.get("cache_hits", 0) / total_requests) * 100

        stats_text = get_text(
            "stats",
            user_id,
            unique_users=unique_users_count,
            total_downloads=cache_stats.get('total_downloads', 0),
            successful=cache_stats.get('total_downloads', 0) - cache_stats.get('failed_downloads', 0),
            failed=cache_stats.get('failed_downloads', 0),
            cache_hits=cache_stats.get('cache_hits', 0),
            cache_misses=cache_stats.get('cache_misses', 0),
            hit_rate=f"{cache_hit_rate:.1f}",
            cached_entries=cache_stats.get('cached_entries', 0),
            cache_size=format_file_size(cache_stats.get('total_cache_size_bytes', 0)),
            uptime=get_uptime()
        )

        await message.answer(stats_text)

    async def handle_cache_info(self, message: Message) -> None:
        """Handle /cache command - show cache information."""
        user_id = message.from_user.id
        cache_stats = await self.cache.get_stats()

        cache_info = get_text(
            "cache_info",
            user_id,
            backend=config.database.DB_TYPE.upper(),
            cached_entries=cache_stats.get('cached_entries', 0),
            total_size=format_file_size(cache_stats.get('total_cache_size_bytes', 0)),
            ttl=config.database.CACHE_TTL // 86400
        )

        await message.answer(cache_info)

    # ========== Main Menu Button Handlers ==========

    async def handle_menu_video_upload(self, message: Message) -> None:
        """Handle [🎬 Video Yuklash] button click."""
        user_id = message.from_user.id
        
        response_text = (
            "🎥 <b>Video Yuklash</b>\n\n"
            "Menga YouTube, Instagram yoki TikTok video ssilkasini tashlang.\n\n"
            "<b>Qo'llab-quvvatlanadigan platformalar:</b>\n"
            "• YouTube, Instagram, TikTok\n"
            "• Twitter/X, Facebook, Vimeo\n"
            "• Va 1000+ boshqa saytlar\n\n"
            "<i>Ssilka tashlang, men uni yuklab olaman!</i>"
        )
        
        await message.answer(response_text)
        logger.info(f"User {user_id} clicked Video Yuklash menu button")

    async def handle_menu_settings(self, message: Message) -> None:
        """Handle [⚙️ Sozlamalar] button click - show language selection."""
        user_id = message.from_user.id
        
        from keyboards import create_language_inline_keyboard
        
        settings_text = (
            "⚙️ <b>Sozlamalar</b>\n\n"
            "Tilni tanlang / Выберите язык / Select language:"
        )
        
        await message.answer(
            settings_text,
            reply_markup=create_language_inline_keyboard()
        )
        
        logger.info(f"User {user_id} clicked Settings menu button")

    async def handle_menu_help(self, message: Message) -> None:
        """Handle [ℹ️ Yordam / Qo'llanma] button click."""
        user_id = message.from_user.id
        help_text = get_text("help", user_id)
        
        await message.answer(help_text)
        logger.info(f"User {user_id} clicked Help menu button")

    async def handle_menu_admin(self, message: Message) -> None:
        """Handle [👑 Admin Panel] button click - show admin dashboard."""
        user_id = message.from_user.id
        
        # Check if user is admin
        admin_id = config.bot.ADMIN_ID
        if not admin_id or user_id != admin_id:
            await message.answer("🔒 Admin access only.")
            return
        
        # Show admin dashboard
        from keyboards import create_admin_dashboard_inline_keyboard
        
        dashboard_text = (
            "🎛️ <b>Admin Dashboard</b>\n\n"
            "Select an option:\n\n"
            "📊 <b>Statistics:</b> View bot usage stats\n"
            "💻 <b>Server Health:</b> Monitor system resources\n"
            "🧹 <b>Clear Cache:</b> Free up disk space\n"
            "📢 <b>Broadcast:</b> Send message to all users"
        )
        
        await message.answer(
            dashboard_text,
            reply_markup=create_admin_dashboard_inline_keyboard()
        )
        
        logger.info(f"Admin {user_id} clicked Admin Panel menu button")

    # ========== End Main Menu Handlers ==========

    async def handle_bot_added_to_group(self, event: ChatMemberUpdated) -> None:
        """
        Handle when bot is added to a group or supergroup.
        Sends a welcome message requesting admin rights for auto-cleaning.
        """
        chat = event.chat
        chat_type = chat.type
        
        # Only respond in groups and supergroups
        if chat_type not in [ChatType.GROUP, ChatType.SUPERGROUP]:
            return
        
        logger.info(f"🤖 Bot added to {chat_type} '{chat.title}' (ID: {chat.id})")
        
        # Welcome message in Uzbek
        welcome_text = (
            "👋 Salom! Guruhga qo'shganingiz uchun rahmat.\n\n"
            "Men to'g'ri ishlashim va tashlangan video ssilkalarni avtomatik tozalab turishim uchun "
            "menga <b>Admin (Xabarlarni o'chirish)</b> huquqini berishingiz shart.\n\n"
            "Admin qilinganimdan so'ng bemalol ssilka tashlashingiz mumkin!"
        )
        
        try:
            await self.bot.send_message(
                chat_id=chat.id,
                text=welcome_text,
                parse_mode=ParseMode.HTML
            )
            logger.info(f"✅ Welcome message sent to group '{chat.title}'")
        except TelegramBadRequest as e:
            logger.warning(f"Failed to send welcome message to group {chat.id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error sending welcome message: {e}")

    async def handle_url_message(self, message: Message) -> None:
        """Handle incoming URL messages for video download."""
        # FIX #4: Add debug logs to verify handler is triggering
        logger.info(f"📩 Message received in {message.chat.type} chat (ID: {message.chat.id}) from user {message.from_user.id}")
        logger.debug(f"Message text: {message.text[:100] if message.text else 'None'}...")

        user_id = message.from_user.id

        # FIX #1: AUTO-REGISTRATION - Track user on ANY message (no /start required)
        if self.cache:
            try:
                # Auto-register user if not exists
                await self.cache.track_user(user_id)
                logger.debug(f"Auto-registered/tracked user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to auto-register user {user_id}: {e}")

        # FIX #3: Rate limiting is correctly based on user_id (from_user.id), NOT chat.id
        # This ensures each USER is rate limited, not the entire group
        if rate_limiter.is_rate_limited(user_id):
            logger.info(f"⚠️ User {user_id} is rate limited")
            warning_text = get_text(
                "rate_limit",
                user_id,
                max_requests=RATE_LIMIT_MAX_REQUESTS
            )

            if message.chat.type == ChatType.PRIVATE:
                await message.answer(warning_text)
            else:
                # Group: send warning and auto-delete
                warning_message = await message.answer(
                    warning_text,
                    reply_to_message_id=message.message_id,
                )
                try:
                    await message.delete()
                    await asyncio.sleep(5)
                    await warning_message.delete()
                except Exception as e:
                    logger.warning(f"Failed to delete rate limit warning in group: {e}")
            return

        # Sanitize input: extract clean URL from message text
        raw_text = message.text.strip() if message.text else ""
        url = extract_url_from_text(raw_text)

        # Validate extracted URL
        if not url or not is_valid_url(url):
            logger.debug(f"Invalid URL from user {user_id}: {raw_text[:50]}")
            # FIX #3: Call fallback handler for non-URL messages
            await self.handle_fallback_message(message)
            return

        logger.info(f"✅ Valid URL detected: {url[:50]}... from user {user_id} in {message.chat.type}")

        # Record this request for rate limiting
        rate_limiter.record_request(user_id)

        # Determine chat type for UX logic
        chat_type = message.chat.type
        is_private_chat = chat_type == ChatType.PRIVATE

        logger.info(f"Chat type: {chat_type}, is_private: {is_private_chat}")

        # Check if it's a YouTube URL (for quality selector)
        from handlers.quality import is_youtube_url, show_quality_selection_cached

        if is_youtube_url(url) and is_private_chat:
            # YouTube URL in private chat - show quality selector
            task_id = str(uuid.uuid4())[:8]
            task = DownloadTask(
                task_id=task_id,
                url=url,
                user_id=user_id,
                extra={"chat_type": chat_type, "is_private": is_private_chat}
            )
            self._active_tasks[task.task_id] = task

            # Extract video info first
            try:
                video_info = await self.downloader.extract_info(url)
                logger.info(f"Showing quality selector for: {video_info.title[:50]}")
                await show_quality_selection_cached(message, url, video_info, task)
                return
            except Exception as e:
                logger.warning(f"Failed to extract YouTube info, proceeding with normal download: {e}")

        # Create download task
        task = DownloadTask(
            task_id=str(uuid.uuid4())[:8],
            url=url,
            user_id=message.from_user.id,
        )

        self._active_tasks[task.task_id] = task

        # Store chat type in task for later use
        task.extra = {"chat_type": chat_type, "is_private": is_private_chat}

        logger.info(f"Created download task {task.task_id} for user {user_id}")

        if is_private_chat:
            # Private chat: send status message and edit it later
            status_message = await message.answer(
                get_text(
                    "processing_request",
                    user_id,
                    task_id=task.task_id,
                    url=truncate_text(url, 60)
                )
            )
            logger.debug(f"Sent status message in private chat: {task.task_id}")
        else:
            # Group/supergroup: process SILENTLY - no status messages
            # This prevents "Deleted message" stubs and spam
            status_message = None
            logger.debug(f"Processing silently in group chat: {task.task_id}")

        # Process download in background
        logger.info(f"Starting background download for task {task.task_id}")
        asyncio.create_task(
            self.process_download(task, message, status_message)
        )

    async def handle_fallback_message(self, message: Message) -> None:
        """
        FIX #3: FALLBACK HANDLER - Catches all text messages that don't match URL handler.
        This proves the bot is listening and helps with debugging.
        """
        user_id = message.from_user.id
        chat_type = message.chat.type
        message_text = message.text.strip() if message.text else ""
        
        logger.info(f"📭 FALLBACK: Non-URL message from user {user_id} in {chat_type}: '{message_text[:50]}...'")
        
        # Auto-register user on any message
        if self.cache:
            try:
                await self.cache.track_user(user_id)
                logger.debug(f"Auto-registered/tracked user {user_id} from fallback handler")
            except Exception as e:
                logger.warning(f"Failed to auto-register user {user_id}: {e}")
        
        # Send fallback message proving bot is listening
        fallback_text = (
            "🤖 <b>Xabaringiz yetib keldi!</b>\n\n"
            "Lekin men undan ssilkani topa olmadim.\n\n"
            "<b>Qanday foydalanish:</b>\n"
            "1. Instagram, YouTube, TikTok yoki boshqa video havolasini yuboring\n"
            "2. Men havolani taniyman va videoni yuklab olaman\n\n"
            "<i>Misol: https://www.instagram.com/reel/...</i>"
        )
        
        await message.answer(fallback_text)
        logger.info(f"Sent fallback message to user {user_id}")

    async def _send_downloading_animation(
        self,
        chat_id: int,
        task_id: str,
        reply_to_message_id: Optional[int] = None,
    ) -> Optional[int]:
        """
        Send downloading animation (GIF) to indicate processing.
        Returns message_id for later deletion.
        """
        if not DOWNLOADING_GIF_PATH.exists():
            logger.warning(f"Downloading GIF not found: {DOWNLOADING_GIF_PATH}")
            return None

        try:
            # FIX #3: Use FSInputFile for local files (aiogram 3.x requirement)
            animation = FSInputFile(str(DOWNLOADING_GIF_PATH))
            
            caption = (
                "🔄 <b>Video yuklanmoqda...</b>\n\n"
                f"Task ID: <code>{task_id}</code>\n\n"
                "<i>Iltimos, kuting...</i>"
            )

            sent_message = await self.bot.send_animation(
                chat_id=chat_id,
                animation=animation,
                caption=caption,
                parse_mode=ParseMode.HTML,
                reply_to_message_id=reply_to_message_id,
            )

            # Store message ID for later deletion
            self._animation_messages[task_id] = sent_message.message_id
            logger.debug(f"Sent downloading animation: message_id={sent_message.message_id}")

            return sent_message.message_id

        except Exception as e:
            logger.warning(f"Failed to send downloading animation: {e}")
            return None

    async def _delete_downloading_animation(self, task_id: str, chat_id: int) -> None:
        """Delete the downloading animation message."""
        message_id = self._animation_messages.pop(task_id, None)

        if message_id:
            try:
                await self.bot.delete_message(chat_id=chat_id, message_id=message_id)
                logger.debug(f"Deleted downloading animation: message_id={message_id}")
            except TelegramBadRequest as e:
                # Message already deleted or chat not found - this is OK
                logger.debug(f"Animation already deleted or chat unavailable: {e}")
            except Exception as e:
                logger.warning(f"Failed to delete downloading animation: {e}")

    async def process_download(
        self,
        task: DownloadTask,
        message: Message,
        status_message: Optional[Message],
    ) -> None:
        """
        Main download processing pipeline.
        Implements smart caching for instant responses.
        Uses downloading animation (GIF) for professional UX.
        """
        animation_message_id = None
        chat_id = message.chat.id

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

            # FIX: Send downloading animation for professional UX
            animation_message_id = await self._send_downloading_animation(
                chat_id=chat_id,
                task_id=task.task_id,
                reply_to_message_id=message.message_id,
            )

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
            if status_message:
                await self._update_status(
                    status_message,
                    task,
                    f"Uploading to Telegram...\n{create_progress_bar(50, 100)}"
                )

            # FIX: Delete downloading animation before sending video
            await self._delete_downloading_animation(task.task_id, chat_id)

            # Send video and capture file_id
            file_id = await self._send_video(
                message,
                status_message,
                file_path,
                video_info,
                task,
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

            # Track unique user with their language preference
            user_lang = await self.cache.get_user_language(task.user_id)
            await self.cache.track_user(task.user_id, user_lang)

            logger.info(
                f"Download complete: {task.task_id} | "
                f"{video_info.title[:50]} | cached for instant access"
            )

        except VideoTooLargeError as e:
            # FIX: Delete animation before showing error
            await self._delete_downloading_animation(task.task_id, chat_id)
            await self._handle_error(task, status_message, str(e))

        except InvalidURLError as e:
            await self._delete_downloading_animation(task.task_id, chat_id)
            await self._handle_error(task, status_message, str(e))

        except HLSProcessingError as e:
            await self._delete_downloading_animation(task.task_id, chat_id)
            await self._handle_error(
                task,
                status_message,
                f"Failed to process HLS stream: {str(e)}"
            )

        except DownloadError as e:
            await self._delete_downloading_animation(task.task_id, chat_id)
            await self._handle_error(task, status_message, str(e))

        except Exception as e:
            logger.exception(f"Unexpected error in task {task.task_id}")
            await self._delete_downloading_animation(task.task_id, chat_id)
            await self._handle_error(
                task,
                status_message,
                f"Unexpected error: {str(e)}"
            )

        finally:
            # Remove from active tasks
            self._active_tasks.pop(task.task_id, None)
            # Ensure animation is deleted in finally block as safety net
            if task.task_id in self._animation_messages:
                await self._delete_downloading_animation(task.task_id, chat_id)
    
    async def _handle_cache_hit(
        self,
        task: DownloadTask,
        cached,
        message: Message,
        status_message: Optional[Message],
    ) -> None:
        """Handle cache hit - instant video send."""
        task.status = DownloadStatus.CACHED

        # Determine if this is a private chat
        is_private = message.chat.type == ChatType.PRIVATE
        if task and task.extra:
            is_private = task.extra.get("is_private", is_private)

        if status_message and is_private:
            # Only show status in private chats
            await self._update_status(
                status_message,
                task,
                "✨ <b>Cache Hit!</b>\nSending instantly..."
            )

        try:
            # FIX #1: ALWAYS create audio download button for ALL chat types
            audio_callback_data = f"download_audio:{cached.video_info.url if hasattr(cached.video_info, 'url') else task.url}"
            reply_markup = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="🎵 Download Audio",
                            callback_data=audio_callback_data,
                        )
                    ]
                ]
            )

            # CRITICAL FIX: Create caption with user mention
            caption = self._create_video_caption(cached.video_info, message.from_user)

            # CRITICAL FIX: Only use reply_to_message_id in private chats
            send_kwargs = {
                "chat_id": message.chat.id,
                "video": cached.file_id,
                "caption": caption,
                "reply_markup": reply_markup,
            }
            
            if is_private:
                send_kwargs["reply_to_message_id"] = message.message_id

            result = await self.bot.send_video(**send_kwargs)

            # Auto-cleaner for groups: delete user's original message containing the URL
            if not is_private:
                # Small delay to ensure video is sent first
                await asyncio.sleep(0.5)

                try:
                    # Delete the original user message that contained the URL
                    await message.delete()
                    logger.info(f"✅ Successfully deleted user URL message in group {message.chat.id} (cache hit)")
                except TelegramBadRequest as e:
                    error_msg = e.message if hasattr(e, 'message') else str(e)
                    logger.warning(
                        f"⚠️ AUTO-CLEANER FAILED in group {message.chat.id}: "
                        f"{error_msg}. "
                        f"Bot needs 'Delete Messages' admin right."
                    )
                except TelegramForbiddenError as e:
                    logger.warning(f"🚫 Bot cannot access chat {message.chat.id} (kicked/blocked): {e}")
                except Exception as e:
                    logger.error(f"❌ Unexpected error deleting message in group {message.chat.id}: {type(e).__name__}: {e}")

            task.status = DownloadStatus.COMPLETED
            task.completed_at = datetime.now()

            # Update statistics
            stats.cache_hits += 1
            await self.cache.increment_stat("cache_hits")

            # Track unique user with their language preference
            user_lang = await self.cache.get_user_language(task.user_id)
            await self.cache.track_user(task.user_id, user_lang)

            # Clean up status message
            if status_message:
                await status_message.delete()

            logger.info(
                f"Cache hit: {task.task_id} | "
                f"sent instantly with file_id: {cached.file_id}"
            )

        except Exception as e:
            logger.error(f"Failed to send cached video: {e}")
            # Cache might be invalid, remove and re-download
            await self.cache.delete(hash_url(task.url))
            if status_message:
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
        status_message: Optional[Message],
        file_path: str,
        video_info: VideoInfo,
        task: Optional[DownloadTask] = None,
    ) -> str:
        """
        Send video to Telegram and return file_id.
        Supports progress updates during upload with retry logic.
        FIX #1: Audio download button now appears in ALL chat types (private, group, supergroup).
        In groups, deletes the user's original message after sending (silent moderation).
        FIX #2: NO reply_to_message_id in groups to avoid "Deleted message" stub.
        FIX #3: Add user HTML mention in caption.
        """
        import asyncio
        from aiogram.exceptions import TelegramNetworkError, TelegramRetryAfter

        file_size = os.path.getsize(file_path)
        
        # Determine if this is a private chat
        is_private = message.chat.type == ChatType.PRIVATE
        if task and task.extra:
            is_private = task.extra.get("is_private", is_private)
        
        # CRITICAL FIX: Create caption with user mention
        caption = self._create_video_caption(video_info, message.from_user)

        # FIX #1: ALWAYS create audio download button for ALL chat types
        audio_callback_data = f"download_audio:{video_info.url}"
        reply_markup = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🎵 Download Audio",
                        callback_data=audio_callback_data,
                    )
                ]
            ]
        )

        # Retry logic for network errors
        max_retries = 3
        last_error = None

        for attempt in range(max_retries):
            try:
                # Send video
                video_file = FSInputFile(path=file_path, filename=f"{video_info.title}.mp4")
                
                # CRITICAL FIX: Only use reply_to_message_id in private chats
                # In groups, this causes "Deleted message" stub when original is deleted
                send_kwargs = {
                    "chat_id": message.chat.id,
                    "video": video_file,
                    "caption": caption,
                    "reply_markup": reply_markup,
                    "request_timeout": 300,
                }
                
                # Only reply to original message in private chats
                if is_private:
                    send_kwargs["reply_to_message_id"] = message.message_id

                result = await self.bot.send_video(**send_kwargs)

                # Auto-cleaner for groups: delete user's original message containing the URL
                if not is_private:
                    # Small delay to ensure video is sent first
                    await asyncio.sleep(0.5)

                    try:
                        # Delete the original user message that contained the URL
                        await message.delete()
                        logger.info(f"✅ Successfully deleted user URL message in group {message.chat.id}")
                    except TelegramBadRequest as e:
                        # Bot lacks delete permissions
                        error_msg = e.message if hasattr(e, 'message') else str(e)
                        logger.warning(
                            f"⚠️ AUTO-CLEANER FAILED in group {message.chat.id}: "
                            f"{error_msg}. "
                            f"Bot needs 'Delete Messages' admin right."
                        )
                    except TelegramForbiddenError as e:
                        logger.warning(f"🚫 Bot cannot access chat {message.chat.id} (kicked/blocked): {e}")
                    except Exception as e:
                        logger.error(f"❌ Unexpected error deleting message in group {message.chat.id}: {type(e).__name__}: {e}")

                # Clean up status message
                if status_message:
                    try:
                        await status_message.delete()
                    except:
                        pass

                # Return file_id for caching
                return result.video.file_id

            except TelegramRetryAfter as e:
                retry_after = e.retry_after
                logger.warning(f"Rate limited by Telegram. Waiting {retry_after}s...")
                await asyncio.sleep(retry_after)

            except TelegramNetworkError as e:
                last_error = e
                logger.warning(f"Network error (attempt {attempt + 1}/{max_retries}): {e}")

                if attempt < max_retries - 1:
                    wait_time = 5 * (attempt + 1)
                    await asyncio.sleep(wait_time)
                else:
                    raise

            except Exception as e:
                logger.error(f"Unexpected error sending video: {e}")
                raise

        raise last_error

    def _create_video_caption(
        self,
        video_info: VideoInfo,
        user=None,
    ) -> str:
        """
        Create formatted video caption with optional user mention.
        
        Args:
            video_info: Video information
            user: Optional user object for mention (adds "Yukladi: <name>")
        """
        caption_parts = [
            f"🎬 <b>{truncate_text(video_info.title, 100)}</b>",
        ]

        # CRITICAL: Add user mention if user is provided
        if user:
            user_mention = f"📥 Yukladi: <a href='tg://user?id={user.id}'>{truncate_text(user.first_name, 50)}</a>"
            caption_parts.append(user_mention)

        if video_info.uploader:
            caption_parts.append(f"👤 {truncate_text(video_info.uploader, 50)}")

        if video_info.duration:
            caption_parts.append(f"⏱️ {format_duration(video_info.duration)}")

        if video_info.view_count:
            view_count_int = int(video_info.view_count) if isinstance(video_info.view_count, float) else video_info.view_count
            caption_parts.append(f"👁️ {view_count_int:,} views")

        caption_parts.append(f"\n🔗 <i>Downloaded with Video Bot</i>")

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

        # CRITICAL: Detect specific errors and show user-friendly messages
        error_lower = error_message.lower()

        if "sign in to confirm" in error_lower or "youtube vaqtinchalik" in error_lower:
            # YouTube bot protection - show clean message
            error_text = (
                f"⚠️ <b>YouTube Cheklovi</b>\n\n"
                f"Task ID: <code>{task.task_id}</code>\n\n"
                f"YouTube vaqtinchalik bu videoni yuklashga ruxsat bermayapti.\n"
                f"Iltimos birozdan so'ng urinib ko'ring.\n\n"
                "<i>Bu YouTube'ning botga qarshi himoyasi sababli yuzaga keldi.</i>"
            )
        elif "requested format is not available" in error_lower or "no video formats found" in error_lower:
            # YouTube format unavailable (n-signature challenge)
            error_text = (
                f"⚠️ <b>YouTube Format Muammosi</b>\n\n"
                f"Task ID: <code>{task.task_id}</code>\n\n"
                f"YouTube bu video formatini hozircha yuklashga ruxsat bermayapti.\n\n"
                f"<b>Sabab:</b> YouTube'ning yangi botga qarshi himoyasi.\n"
                f"<b>Yechim:</b> 24-48 soatdan keyin qayta urinib ko'ring.\n\n"
                "<i>Bu muammo barcha YouTube yuklab olish vositalariga ta'sir qilmoqda.</i>"
            )
        elif "cookie ma'lumotlar bazasi" in error_lower or "could not copy" in error_lower:
            # Browser cookie database locked
            error_text = (
                f"🔐 <b>Brauzer Cookie Muammosi</b>\n\n"
                f"Task ID: <code>{task.task_id}</code>\n\n"
                f"Chrome/Edge brauzeri cookie ma'lumotlar bazasi band.\n\n"
                f"<b>Yechim:</b>\n"
                f"1. Brauzerni yoping\n"
                f"2. Qayta urinib ko'ring\n\n"
                "<i>Yoki: YouTube URL'ni Edge brauzerida ochib ko'ring</i>"
            )
        else:
            # Standard error message
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
        """Start the bot polling loop with hard reset and webhook cleanup."""
        await self.initialize()

        # ========================================================================
        # HARD RESET: Force webhook deletion and cloud logout before local polling
        # This prevents "silent death" when webhook conflicts with polling
        # ========================================================================
        logger.info("=" * 60)
        logger.info("PERFORMING HARD RESET: Cleaning up Telegram Cloud session...")
        logger.info("=" * 60)

        # Create a temporary bot instance with STANDARD Telegram API (not local)
        # to perform webhook deletion and logout on the cloud server
        temp_bot = None
        try:
            from aiogram.client.session.aiohttp import AiohttpSession as StandardSession
            
            # Create temporary bot with standard session (no local API server)
            temp_session = StandardSession()
            temp_bot = Bot(
                token=config.bot.TELEGRAM_BOT_TOKEN,
                session=temp_session,
            )
            
            logger.info("Temporary bot instance created for cloud cleanup...")
            
            # STEP 1: Force delete webhook with pending updates drop
            # This is CRITICAL - if webhook is set, polling will silently fail
            try:
                await temp_bot.delete_webhook(drop_pending_updates=True)
                logger.info("✅ Webhook deleted successfully (drop_pending_updates=True)")
            except Exception as e:
                logger.warning(f"Webhook deletion returned: {e}")
            
            # STEP 2: Logout from Telegram Cloud to release any locked sessions
            try:
                await temp_bot.log_out()
                logger.info("✅ Logged out from Telegram Cloud successfully")
            except Exception as e:
                logger.warning(f"Cloud logout returned: {e}")
            
            # STEP 3: Close temporary bot session
            await temp_bot.session.close()
            logger.info("✅ Temporary bot session closed")
            
        except Exception as e:
            logger.warning(f"Hard reset encountered error (continuing anyway): {e}")
        finally:
            if temp_bot:
                try:
                    await temp_bot.session.close()
                except:
                    pass
        
        logger.info("=" * 60)
        logger.info("HARD RESET COMPLETE - Now connecting to Local API Server...")
        logger.info("=" * 60)

        # ========================================================================
        # PING LOCAL API SERVER (with retry mechanism)
        # ========================================================================
        if config.bot.TELEGRAM_API_SERVER:
            logger.info(f"Pinging Bot API Server at {config.bot.TELEGRAM_API_SERVER}...")
            max_retries = 5
            retry_delay = 5  # seconds
            
            for attempt in range(1, max_retries + 1):
                try:
                    async with aiohttp.ClientSession() as session:
                        # Try to call getMe via the local API server
                        api_url = f"{config.bot.TELEGRAM_API_SERVER}/bot{config.bot.TELEGRAM_BOT_TOKEN}/getMe"
                        async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            if response.status == 200:
                                result = await response.json()
                                if result.get("ok"):
                                    logger.info(f"✅ Bot API Server is healthy (attempt {attempt}/{max_retries})")
                                    break
                                else:
                                    logger.warning(f"API Server returned ok=false: {result}")
                            else:
                                logger.warning(f"API Server returned status {response.status}")
                except asyncio.TimeoutError:
                    logger.warning(f"API Server ping timeout (attempt {attempt}/{max_retries})")
                except aiohttp.ClientError as e:
                    logger.warning(f"API Server connection error (attempt {attempt}/{max_retries}): {e}")
                except Exception as e:
                    logger.warning(f"Unexpected error pinging API Server (attempt {attempt}/{max_retries}): {e}")
                
                if attempt < max_retries:
                    logger.info(f"Waiting {retry_delay} seconds before retry...")
                    await asyncio.sleep(retry_delay)
            else:
                logger.error(f"❌ Failed to connect to Bot API Server after {max_retries} attempts")
                logger.error("The bot will attempt to start anyway, but uploads >50MB may fail.")

        # ========================================================================
        # VERIFY MAIN BOT CONNECTION
        # ========================================================================
        if self.bot:
            try:
                me = await self.bot.get_me()
                logger.info(f"✅ Bot connected successfully as @{me.username}")
            except Exception as e:
                logger.error(f"Failed to verify bot connection: {e}")
                raise

        # ========================================================================
        # START POLLING ON LOCAL API SERVER
        # ========================================================================
        logger.info("Starting bot polling on Local API Server...")
        try:
            await self.dp.start_polling(self.bot)
        except asyncio.CancelledError:
            logger.info("Polling cancelled")
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        except Exception as e:
            logger.exception(f"Polling error: {e}")
            raise
        finally:
            await self.shutdown()

    async def shutdown(self) -> None:
        """Graceful shutdown with bulletproof logout."""
        logger.info("Shutting down bot...")

        if self.bot:
            # FIX #2: Wrap log_out in broad try-except to prevent startup halts
            try:
                await self.bot.log_out()
                logger.info("Bot logged out successfully")
            except Exception as e:
                logger.warning(f"Bot log_out failed (may already be logged out): {e}")
            
            try:
                await self.bot.session.close()
            except Exception as e:
                logger.warning(f"Session close failed: {e}")

        if self.cache:
            try:
                await self.cache.close()
            except Exception as e:
                logger.warning(f"Cache close failed: {e}")

        logger.info("Bot shutdown complete")


# Bot instance
bot_instance = VideoDownloaderBot()


def setup_critical_log_handler() -> None:
    """Setup file handler for critical errors."""
    log_file = Path(__file__).parent / "bot_critical.log"
    try:
        file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
        file_handler.setLevel(logging.CRITICAL)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        logging.getLogger().addHandler(file_handler)
        logger.info(f"Critical error log handler initialized: {log_file}")
    except Exception as e:
        logger.warning(f"Failed to setup critical log handler: {e}")


async def main() -> None:
    """Main entry point with global error handling."""
    # FIX #4: Setup critical error logging
    setup_critical_log_handler()
    
    try:
        await bot_instance.start()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        # Log to both loguru and critical log file
        error_msg = f"Fatal error in main: {e}"
        logger.critical(error_msg, exc_info=True)
        
        # Write to critical log file directly
        log_file = Path(__file__).parent / "bot_critical.log"
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"\n{'='*60}\n")
                f.write(f"CRITICAL ERROR - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"{'='*60}\n")
                f.write(f"Error: {error_msg}\n")
                f.write(f"Exception type: {type(e).__name__}\n")
                import traceback
                f.write(f"Traceback:\n{traceback.format_exc()}\n")
                f.write(f"{'='*60}\n\n")
        except Exception as log_err:
            logger.error(f"Failed to write to critical log: {log_err}")
        
        # Re-raise to be visible in terminal
        raise
    finally:
        await bot_instance.shutdown()


if __name__ == "__main__":
    # FIX: Global try-except to catch ALL startup errors including import failures
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBot startup interrupted by user")
    except Exception as e:
        # FATAL ERROR - Write to critical log and terminal
        import traceback
        tb = traceback.format_exc()
        
        error_text = (
            f"\n{'='*70}\n"
            f"FATAL STARTUP ERROR - {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"{'='*70}\n"
            f"Error Type: {type(e).__name__}\n"
            f"Error Message: {e}\n\n"
            f"Traceback:\n{tb}\n"
            f"{'='*70}\n"
        )
        
        # Write to critical log file
        log_file = Path(__file__).parent / "bot_critical.log"
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(error_text)
        except Exception as log_err:
            print(f"Failed to write to critical log: {log_err}")
        
        # Print to terminal
        print(error_text)
        
        # Also use loguru if available
        try:
            logger.critical(f"FATAL STARTUP ERROR: {e}")
        except:
            pass
        
        # Exit with error code
        import sys
        sys.exit(1)
