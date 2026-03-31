"""
Keyboard utilities for Telegram Video Downloader Bot.
Reusable keyboard builders for main menu and other interfaces.
"""

from aiogram.types import ReplyKeyboardMarkup, InlineKeyboardMarkup, InlineKeyboardButton, KeyboardButton
from config import config


def create_main_menu_keyboard(user_id: int) -> ReplyKeyboardMarkup:
    """
    Create persistent main menu keyboard.
    Shows admin button only if user is ADMIN_ID.
    
    Layout:
    Row 1: [🎬 Video Yuklash]
    Row 2: [⚙️ Sozlamalar] [ℹ️ Yordam / Qo'llanma]
    Row 3: [👑 Admin Panel] (admin only)
    """
    keyboard = [
        [
            KeyboardButton(text="🎬 Video Yuklash")
        ],
        [
            KeyboardButton(text="⚙️ Sozlamalar"),
            KeyboardButton(text="ℹ️ Yordam / Qo'llanma")
        ],
    ]
    
    # Add admin button only for ADMIN_ID
    admin_id = config.bot.ADMIN_ID
    if admin_id and user_id == admin_id:
        keyboard.append([
            KeyboardButton(text="👑 Admin Panel")
        ])
    
    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,  # Resize to fit screen
        one_time_keyboard=False,  # Persist after use
        input_field_placeholder="Buyruqni tanlang..."  # Placeholder text
    )


def create_language_inline_keyboard() -> InlineKeyboardMarkup:
    """Create inline keyboard for language selection."""
    from locales import AVAILABLE_LANGUAGES
    
    keyboard = []
    for lang_code, lang_name in AVAILABLE_LANGUAGES.items():
        keyboard.append([
            InlineKeyboardButton(
                text=lang_name,
                callback_data=f"set_lang:{lang_code}"
            )
        ])
    
    return InlineKeyboardMarkup(
        inline_keyboard=keyboard,
        resize_keyboard=True
    )


def create_admin_dashboard_inline_keyboard() -> InlineKeyboardMarkup:
    """Create 2x2 admin dashboard inline keyboard."""
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


def create_back_inline_keyboard() -> InlineKeyboardMarkup:
    """Create keyboard with back button."""
    keyboard = [
        [InlineKeyboardButton(text="🔙 Back", callback_data="admin_dashboard")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard, resize_keyboard=True)


def create_quality_inline_keyboard(formats: list) -> InlineKeyboardMarkup:
    """Create inline keyboard for quality selection."""
    keyboard = []
    
    quality_labels = {
        "360p": "📹 360p",
        "720p": "📹 720p HD",
        "1080p": "📹 1080p Full HD",
        "best": "📹 Best Quality",
    }
    
    for fmt in formats:
        quality = fmt["quality"]
        size = f" (~{fmt['filesize'] / 1024 / 1024:.1f} MB)" if fmt.get("filesize") else ""
        label = quality_labels.get(quality, f"📹 {quality.upper()}")
        
        keyboard.append([
            InlineKeyboardButton(
                text=f"{label}{size}",
                callback_data=f"quality:{quality}:{fmt.get('url', '')}"
            )
        ])
    
    keyboard.append([
        InlineKeyboardButton(text="❌ Cancel", callback_data="quality:cancel")
    ])
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard, resize_keyboard=True)


def create_audio_download_inline_keyboard(url: str) -> InlineKeyboardMarkup:
    """Create inline keyboard with audio download button."""
    return InlineKeyboardMarkup(
        inline_keyboard=[[
            InlineKeyboardButton(
                text="🎵 Download Audio",
                callback_data=f"download_audio:{url}"
            )
        ]],
        resize_keyboard=True
    )
