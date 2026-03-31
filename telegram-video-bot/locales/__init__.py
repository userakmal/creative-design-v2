"""
Internationalization (i18n) module for Telegram Video Downloader Bot.
Supports Uzbek (uz), Russian (ru), and English (en).
"""

from .translations import get_text, set_user_language, get_user_language, AVAILABLE_LANGUAGES

__all__ = [
    "get_text",
    "set_user_language",
    "get_user_language",
    "AVAILABLE_LANGUAGES",
]
