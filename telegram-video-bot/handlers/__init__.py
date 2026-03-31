"""
Handlers package for Telegram Video Downloader Bot.
Modular router-based architecture.
"""

from .language import language_router
from .quality import quality_router
from .admin import admin_router

__all__ = [
    "language_router",
    "quality_router",
    "admin_router",
]
