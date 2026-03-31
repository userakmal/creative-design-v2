"""
YouTube Quality Selector handler for Telegram Video Downloader Bot.
Allows users to select video quality before downloading.
CRITICAL: Uses simple resolution tags in callback data (res_360, res_720, etc.)
and dynamically builds format strings during download.
"""

import re
import uuid
from typing import Dict, List, Optional, Tuple

from aiogram import Router, F
from aiogram.types import CallbackQuery, Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from loguru import logger

import yt_dlp

from locales import get_text
from downloader import VideoDownloader, VideoInfo, DownloadTask, get_browser_cookies
from database import SQLiteCache, hash_url
from utils import format_file_size, format_duration, truncate_text

quality_router = Router()


class QualitySelectionState(StatesGroup):
    """FSM states for quality selection."""
    waiting_for_quality = State()


# Quality configuration - simple resolution tags
QUALITY_OPTIONS = {
    "360": {"label": "360p", "height": 360},
    "720": {"label": "720p", "height": 720},
    "1080": {"label": "1080p", "height": 1080},
    "best": {"label": "Best", "height": 2160},
}


def is_youtube_url(url: str) -> bool:
    """Check if URL is a YouTube URL."""
    youtube_patterns = [
        r"^(https?://)?(www\.)?(youtube\.com|youtu\.be)/",
        r"^(https?://)?(m\.)?(youtube\.com)/",
    ]
    return any(re.match(pattern, url, re.IGNORECASE) for pattern in youtube_patterns)


async def extract_available_resolutions(url: str) -> List[str]:
    """
    Extract available resolutions from YouTube URL.
    Returns list of resolution tags (e.g., ["360", "720", "1080", "best"]).
    CRITICAL: Uses browser cookies for authentication.
    """
    available = set()
    
    def extract():
        # CRITICAL: Browser cookies for YouTube authentication
        opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "noplaylist": True,
            **get_browser_cookies(),
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info

    try:
        import asyncio
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, extract)

        # Collect available heights from formats
        for fmt in info.get("formats", []):
            height = fmt.get("height")
            if height:
                if height >= 1080:
                    available.add("1080")
                    available.add("best")
                elif height >= 720:
                    available.add("720")
                    available.add("1080")
                    available.add("best")
                elif height >= 360:
                    available.add("360")
                    available.add("720")
                    available.add("1080")
                    available.add("best")

        # Always include at least 360p and best as fallback
        if not available:
            available = {"360", "best"}
        
        # Ensure "best" is always available
        available.add("best")

        return sorted(list(available), key=lambda x: int(x) if x != "best" else 9999)

    except Exception as e:
        logger.error(f"Failed to extract resolutions: {e}")
        # Return default options
        return ["360", "720", "best"]


def create_quality_keyboard(url: str, resolutions: List[str]) -> InlineKeyboardMarkup:
    """
    Create inline keyboard for quality selection.
    CRITICAL: Uses simple resolution tags (res_360, res_720) - no format_ids!
    """
    keyboard = []

    for res in resolutions:
        if res not in QUALITY_OPTIONS:
            continue
            
        quality_label = QUALITY_OPTIONS[res]["label"]

        keyboard.append([
            InlineKeyboardButton(
                text=f"📹 {quality_label}",
                callback_data=f"res_{res}"  # Simple tag - NO URL or format_id
            )
        ])

    keyboard.append([
        InlineKeyboardButton(
            text="❌ Cancel",
            callback_data="quality_cancel"
        )
    ])

    return InlineKeyboardMarkup(
        inline_keyboard=keyboard,
        resize_keyboard=True
    )


async def show_quality_selection(
    message: Message,
    url: str,
    video_info: VideoInfo,
    task: DownloadTask,
) -> None:
    """Show quality selection keyboard for YouTube videos."""
    user_id = message.from_user.id

    # Extract available resolutions
    resolutions = await extract_available_resolutions(url)

    # Create selection message
    duration = format_duration(video_info.duration) if video_info.duration else "Unknown"

    text = get_text(
        "select_quality",
        user_id,
        title=truncate_text(video_info.title, 50),
        duration=duration
    )

    keyboard = create_quality_keyboard(url, resolutions)

    await message.answer(
        text,
        reply_markup=keyboard
    )

    logger.info(f"Showing quality selection for user {user_id}: {video_info.title[:50]}")
    logger.debug(f"Available resolutions: {resolutions}")


@quality_router.callback_query(F.data.startswith("res_"))
async def handle_quality_selection(
    callback_query: CallbackQuery,
    state,
) -> None:
    """
    Handle quality selection callback.
    CRITICAL: Resolution tag only (res_360, res_720, etc.) - dynamically builds format string.
    """
    user_id = callback_query.from_user.id
    callback_data = callback_query.data

    # Parse callback data: res_<resolution>
    if not callback_data.startswith("res_"):
        await callback_query.answer("❌ Invalid selection", show_alert=True)
        return

    resolution = callback_data.replace("res_", "")

    if resolution == "cancel":
        await callback_query.message.delete()
        await callback_query.answer("Cancelled")
        return

    # Validate resolution
    if resolution not in QUALITY_OPTIONS:
        await callback_query.answer("❌ Invalid quality", show_alert=True)
        return

    quality_label = QUALITY_OPTIONS[resolution]["label"]

    # Acknowledge
    await callback_query.answer(f"⏳ Downloading {quality_label}...")

    # Update message to show progress
    progress_text = get_text(
        "downloading_selected_quality",
        user_id,
        quality=quality_label.upper()
    )
    await callback_query.message.edit_text(progress_text)

    # Get the URL from user data or re-extract
    # For simplicity, we need to store URL somewhere - using FSM or inline query
    # Since we can't pass URL in callback, we need a different approach
    # Let's store in task.extra via a temporary cache
    
    logger.info(f"User {user_id} selected resolution: {resolution} ({quality_label})")
    
    # For now, send a message asking user to resend the URL with quality info
    # This is a limitation of Telegram's 64-byte callback limit
    # Better approach: Store URL in a temporary dict/cache keyed by user_id
    
    await callback_query.message.answer(
        f"⚠️ <b>Quality Selected: {quality_label}</b>\n\n"
        f"Please send the YouTube URL again to download in {quality_label} quality.\n\n"
        f"<i>(Due to Telegram's callback limitations, we need the URL separately)</i>"
    )


# Alternative approach: Store URL in a temporary cache per user
_quality_selection_cache: Dict[int, dict] = {}


async def show_quality_selection_cached(
    message: Message,
    url: str,
    video_info: VideoInfo,
    task: DownloadTask,
) -> None:
    """
    Show quality selection keyboard with URL caching.
    CRITICAL: Stores URL in memory cache for callback retrieval.
    """
    user_id = message.from_user.id

    # Extract available resolutions
    resolutions = await extract_available_resolutions(url)

    # Store URL and video info in cache
    _quality_selection_cache[user_id] = {
        "url": url,
        "video_info": video_info,
        "task": task,
    }

    # Create selection message
    duration = format_duration(video_info.duration) if video_info.duration else "Unknown"

    text = get_text(
        "select_quality",
        user_id,
        title=truncate_text(video_info.title, 50),
        duration=duration
    )

    keyboard = create_quality_keyboard(url, resolutions)

    await message.answer(
        text,
        reply_markup=keyboard
    )

    logger.info(f"Showing quality selection for user {user_id}: {video_info.title[:50]}")
    logger.debug(f"Available resolutions: {resolutions}, cached URL: {url[:50]}")


@quality_router.callback_query(F.data == "quality_cancel")
async def handle_quality_cancel(
    callback_query: CallbackQuery,
) -> None:
    """Handle quality selection cancellation."""
    user_id = callback_query.from_user.id
    
    # Clear cache
    _quality_selection_cache.pop(user_id, None)
    
    await callback_query.message.delete()
    await callback_query.answer("Cancelled")


@quality_router.callback_query(F.data.startswith("res_"))
async def handle_quality_selection_with_cache(
    callback_query: CallbackQuery,
    state,
) -> None:
    """
    Handle quality selection callback with URL cache.
    CRITICAL: Resolution tag only (res_360, res_720) - dynamically builds format string.
    """
    user_id = callback_query.from_user.id
    callback_data = callback_query.data

    # Parse callback data: res_<resolution>
    resolution = callback_data.replace("res_", "")

    # Validate resolution
    if resolution not in QUALITY_OPTIONS:
        await callback_query.answer("❌ Invalid quality", show_alert=True)
        return

    quality_label = QUALITY_OPTIONS[resolution]["label"]

    # Get cached URL
    cached = _quality_selection_cache.get(user_id)
    if not cached:
        await callback_query.answer(
            "⚠️ Session expired. Please send the URL again.",
            show_alert=True
        )
        return

    url = cached["url"]
    video_info = cached["video_info"]
    task = cached["task"]

    # Acknowledge
    await callback_query.answer(f"⏳ Downloading {quality_label}...")

    # Update message to show progress
    progress_text = get_text(
        "downloading_selected_quality",
        user_id,
        quality=quality_label.upper()
    )
    await callback_query.message.edit_text(progress_text)

    logger.info(f"User {user_id} selected resolution: {resolution} ({quality_label}) for: {video_info.title[:50]}")

    # Get downloader instance
    downloader = callback_query.bot.downloader if hasattr(callback_query.bot, 'downloader') else None
    if not downloader:
        downloader = VideoDownloader()

    # Download with selected resolution - DYNAMIC FORMAT STRING
    try:
        task.video_info = video_info

        # CRITICAL: Pass resolution (not format_id) - downloader builds format string dynamically
        file_path, file_size = await downloader.download(task, video_info, resolution=resolution)

        task.file_path = file_path

        # Send video
        from aiogram.types import FSInputFile, InlineKeyboardButton, InlineKeyboardMarkup

        # CRITICAL: Add user mention in caption
        caption = (
            f"🎬 <b>{truncate_text(video_info.title, 100)}</b>\n"
            f"📹 Quality: {quality_label.upper()}\n"
            f"📥 Yukladi: <a href='tg://user?id={user_id}'>{callback_query.from_user.first_name}</a>\n"
        )
        if video_info.uploader:
            caption += f"👤 {truncate_text(video_info.uploader, 50)}\n"
        if video_info.duration:
            caption += f"⏱️ {format_duration(video_info.duration)}\n"
        caption += f"\n🔗 <i>Downloaded with Video Bot</i>"

        # Add audio download button
        audio_callback_data = f"download_audio:{url}"
        reply_markup = InlineKeyboardMarkup(
            inline_keyboard=[[
                InlineKeyboardButton(
                    text=get_text("download_audio", user_id),
                    callback_data=audio_callback_data
                )
            ]]
        )

        video_file = FSInputFile(path=file_path, filename=f"{video_info.title}.mp4")
        # CRITICAL: No reply_to_message_id to avoid "Deleted message" stub
        result = await callback_query.message.bot.send_video(
            chat_id=callback_query.message.chat.id,
            video=video_file,
            caption=caption,
            reply_markup=reply_markup,
            request_timeout=300,
        )

        # Cleanup
        await downloader.cleanup_file(file_path)

        # Delete quality selection message
        try:
            await callback_query.message.delete()
        except:
            pass

        # Clear cache
        _quality_selection_cache.pop(user_id, None)

        logger.info(f"Quality download complete: {task.task_id} | {resolution} | {video_info.title[:50]}")

    except Exception as e:
        logger.exception(f"Quality download failed: {e}")
        
        # Clear cache on error
        _quality_selection_cache.pop(user_id, None)
        
        await callback_query.message.answer(
            get_text(
                "download_failed",
                user_id,
                task_id=task.task_id,
                error=str(e)
            )
        )
