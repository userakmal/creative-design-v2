"""
Admin handlers for Telegram Video Downloader Bot.
Includes interactive dashboard, broadcast system with FSM, and server monitoring.
"""

import asyncio
import os
import shutil
import time
from pathlib import Path
from typing import Optional

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from loguru import logger

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("psutil not installed. Server health monitoring disabled. Run: pip install psutil")

from config import config
from locales import get_text
from database import SQLiteCache

admin_router = Router()


class BroadcastState(StatesGroup):
    """FSM states for broadcast workflow."""
    waiting_for_content = State()
    waiting_for_confirmation = State()


# Store broadcast content temporarily
_broadcast_content: dict = {}

# Store admin dashboard state
_dashboard_state: dict = {}


def is_admin(user_id: int) -> bool:
    """Check if user is admin."""
    return config.bot.ADMIN_ID is not None and user_id == config.bot.ADMIN_ID


def create_admin_dashboard_keyboard() -> InlineKeyboardMarkup:
    """Create 2x2 admin dashboard keyboard."""
    keyboard = [
        [
            InlineKeyboardButton(text="📊 Statistics", callback_data="admin_stats"),
            InlineKeyboardButton(text="💻 Server Health", callback_data="admin_server_health"),
        ],
        [
            InlineKeyboardButton(text="🧹 Clear Cache", callback_data="admin_clear_cache"),
            InlineKeyboardButton(text="📢 Broadcast", callback_data="admin_broadcast"),
        ],
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard, resize_keyboard=True)


def create_back_keyboard() -> InlineKeyboardMarkup:
    """Create keyboard with back button."""
    keyboard = [
        [InlineKeyboardButton(text="🔙 Back", callback_data="admin_dashboard")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard, resize_keyboard=True)


@admin_router.message(Command("admin"))
async def handle_admin_command(message: Message) -> None:
    """Handle /admin command - show interactive dashboard."""
    user_id = message.from_user.id
    
    if not is_admin(user_id):
        await message.answer("🔒 Admin access only.")
        return
    
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
        reply_markup=create_admin_dashboard_keyboard()
    )
    
    logger.info(f"Admin {user_id} opened dashboard")


@admin_router.callback_query(F.data == "admin_dashboard")
async def handle_dashboard_back(callback_query: CallbackQuery) -> None:
    """Handle back to dashboard button."""
    user_id = callback_query.from_user.id
    
    if not is_admin(user_id):
        await callback_query.answer("🔒 Admin access only.", show_alert=True)
        return
    
    dashboard_text = (
        "🎛️ <b>Admin Dashboard</b>\n\n"
        "Select an option:"
    )
    
    try:
        await callback_query.message.edit_text(
            dashboard_text,
            reply_markup=create_admin_dashboard_keyboard()
        )
    except:
        await callback_query.message.answer(
            dashboard_text,
            reply_markup=create_admin_dashboard_keyboard()
        )
    
    await callback_query.answer()


@admin_router.callback_query(F.data == "admin_stats")
async def handle_admin_stats(callback_query: CallbackQuery) -> None:
    """Handle Statistics button - show detailed bot stats."""
    user_id = callback_query.from_user.id
    
    if not is_admin(user_id):
        await callback_query.answer("🔒 Admin access only.", show_alert=True)
        return
    
    cache = callback_query.bot.cache if hasattr(callback_query.bot, 'cache') else None
    
    if not cache:
        await callback_query.answer("❌ Cache not available", show_alert=True)
        return
    
    # Get statistics
    cache_stats = await cache.get_stats()
    unique_users_count = await cache.get_unique_users_count()
    
    # Calculate cache hit rate
    cache_hit_rate = 0.0
    total_requests = cache_stats.get("cache_hits", 0) + cache_stats.get("cache_misses", 0)
    if total_requests > 0:
        cache_hit_rate = (cache_stats.get("cache_hits", 0) / total_requests) * 100
    
    # Get uptime
    from utils import get_uptime
    
    stats_text = (
        "📊 <b>Bot Statistics</b>\n\n"
        f"<b>👥 Users:</b>\n"
        f"• Total Users: {unique_users_count}\n\n"
        f"<b>📥 Downloads:</b>\n"
        f"• Total Videos: {cache_stats.get('total_downloads', 0)}\n"
        f"• Successful: {cache_stats.get('total_downloads', 0) - cache_stats.get('failed_downloads', 0)}\n"
        f"• Failed: {cache_stats.get('failed_downloads', 0)}\n\n"
        f"<b>⚡ Cache Performance:</b>\n"
        f"• Cache Hits: {cache_stats.get('cache_hits', 0)}\n"
        f"• Cache Misses: {cache_stats.get('cache_misses', 0)}\n"
        f"• Hit Rate: {cache_hit_rate:.1f}%\n"
        f"• Cached Videos: {cache_stats.get('cached_entries', 0)}\n"
        f"• Cache Size: {cache_stats.get('total_cache_size_bytes', 0) / 1024 / 1024:.2f} MB\n\n"
        f"<b>⏱️ Uptime:</b>\n"
        f"• {get_uptime()}"
    )
    
    try:
        await callback_query.message.edit_text(
            stats_text,
            reply_markup=create_back_keyboard()
        )
    except:
        await callback_query.message.answer(
            stats_text,
            reply_markup=create_back_keyboard()
        )
    
    await callback_query.answer()


@admin_router.callback_query(F.data == "admin_server_health")
async def handle_server_health(callback_query: CallbackQuery) -> None:
    """Handle Server Health button - show system metrics."""
    user_id = callback_query.from_user.id
    
    if not is_admin(user_id):
        await callback_query.answer("🔒 Admin access only.", show_alert=True)
        return
    
    if not PSUTIL_AVAILABLE:
        health_text = (
            "⚠️ <b>Server Health Unavailable</b>\n\n"
            "psutil is not installed.\n"
            "Install it with: <code>pip install psutil</code>"
        )
        
        try:
            await callback_query.message.edit_text(
                health_text,
                reply_markup=create_back_keyboard()
            )
        except:
            await callback_query.message.answer(
                health_text,
                reply_markup=create_back_keyboard()
            )
        await callback_query.answer()
        return
    
    # Get system metrics
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Format memory
        memory_used_gb = memory.used / (1024 ** 3)
        memory_total_gb = memory.total / (1024 ** 3)
        memory_percent = memory.percent
        
        # Format disk
        disk_used_gb = disk.used / (1024 ** 3)
        disk_free_gb = disk.free / (1024 ** 3)
        disk_percent = disk.percent
        
        # Determine status emojis
        cpu_status = "🟢" if cpu_percent < 50 else "🟡" if cpu_percent < 80 else "🔴"
        ram_status = "🟢" if memory_percent < 50 else "🟡" if memory_percent < 80 else "🔴"
        disk_status = "🟢" if disk_percent < 50 else "🟡" if disk_percent < 80 else "🔴"
        
        health_text = (
            "💻 <b>Server Health Monitor</b>\n\n"
            f"<b>{cpu_status} CPU Usage:</b>\n"
            f"• {cpu_percent}%\n\n"
            f"<b>{ram_status} RAM Usage:</b>\n"
            f"• {memory_used_gb:.2f} GB / {memory_total_gb:.2f} GB\n"
            f"• {memory_percent}%\n\n"
            f"<b>{disk_status} Disk Space:</b>\n"
            f"• {disk_used_gb:.2f} GB used\n"
            f"• {disk_free_gb:.2f} GB free\n"
            f"• {disk_percent}% used\n\n"
            f"<i>Last updated: {time.strftime('%H:%M:%S')}</i>"
        )
        
        try:
            await callback_query.message.edit_text(
                health_text,
                reply_markup=create_back_keyboard()
            )
        except:
            await callback_query.message.answer(
                health_text,
                reply_markup=create_back_keyboard()
            )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Failed to get server health: {e}")
        await callback_query.answer("❌ Failed to get server metrics", show_alert=True)


@admin_router.callback_query(F.data == "admin_clear_cache")
async def handle_clear_cache(callback_query: CallbackQuery) -> None:
    """Handle Clear Cache button - delete temporary files."""
    user_id = callback_query.from_user.id
    
    if not is_admin(user_id):
        await callback_query.answer("🔒 Admin access only.", show_alert=True)
        return
    
    # Get download directories
    download_dir = Path(config.downloader.DOWNLOAD_DIR)
    audio_dir = Path(config.downloader.AUDIO_DIR)
    
    total_freed = 0
    files_deleted = 0
    
    # Clear video files
    if download_dir.exists():
        for file_path in download_dir.glob("*.mp4"):
            try:
                file_size = file_path.stat().st_size
                file_path.unlink()
                total_freed += file_size
                files_deleted += 1
                logger.debug(f"Deleted: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete {file_path}: {e}")
        
        for file_path in download_dir.glob("*.mkv"):
            try:
                file_size = file_path.stat().st_size
                file_path.unlink()
                total_freed += file_size
                files_deleted += 1
            except Exception as e:
                logger.warning(f"Failed to delete {file_path}: {e}")
    
    # Clear audio files
    if audio_dir.exists():
        for file_path in audio_dir.glob("*.mp3"):
            try:
                file_size = file_path.stat().st_size
                file_path.unlink()
                total_freed += file_size
                files_deleted += 1
                logger.debug(f"Deleted: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete {file_path}: {e}")
    
    # Also clear HLS temp directories
    if download_dir.exists():
        for temp_dir in download_dir.glob("hls_*"):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
                logger.debug(f"Deleted temp dir: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to delete temp dir {temp_dir}: {e}")
    
    # Format freed space
    freed_mb = total_freed / (1024 * 1024)
    
    result_text = (
        "🧹 <b>Cache Cleared</b>\n\n"
        f"✅ <b>Files deleted:</b> {files_deleted}\n"
        f"✅ <b>Space freed:</b> {freed_mb:.2f} MB\n\n"
        f"<i>Directories cleaned:</i>\n"
        f"• {download_dir.absolute()}\n"
        f"• {audio_dir.absolute()}"
    )
    
    try:
        await callback_query.message.edit_text(
            result_text,
            reply_markup=create_back_keyboard()
        )
    except:
        await callback_query.message.answer(
            result_text,
            reply_markup=create_back_keyboard()
        )
    
    logger.info(f"Admin {user_id} cleared cache: {files_deleted} files, {freed_mb:.2f} MB freed")
    await callback_query.answer(f"✅ Cleared {freed_mb:.2f} MB")


@admin_router.callback_query(F.data == "admin_broadcast")
async def handle_broadcast_button(callback_query: CallbackQuery, state: FSMContext) -> None:
    """Handle Broadcast button - start broadcast workflow."""
    user_id = callback_query.from_user.id
    
    if not is_admin(user_id):
        await callback_query.answer("🔒 Admin access only.", show_alert=True)
        return
    
    # Close the dashboard message
    try:
        await callback_query.message.delete()
    except:
        pass
    
    # Set state and start broadcast workflow
    await state.set_state(BroadcastState.waiting_for_content)
    
    await callback_query.message.answer(
        get_text("broadcast_start", user_id)
    )
    
    logger.info(f"Admin {user_id} started broadcast workflow from dashboard")
