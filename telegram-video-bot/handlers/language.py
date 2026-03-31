"""
Language selection handler for Telegram Video Downloader Bot.
Provides /lang command with inline keyboard for language selection.
"""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message, InlineKeyboardButton, InlineKeyboardMarkup
from loguru import logger

from locales import get_text, set_user_language, AVAILABLE_LANGUAGES

language_router = Router()


def create_language_keyboard() -> InlineKeyboardMarkup:
    """Create inline keyboard for language selection."""
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


@language_router.message(Command("lang"))
async def handle_lang_command(message: Message) -> None:
    """Handle /lang command - show language selection keyboard."""
    user_id = message.from_user.id
    text = get_text("language_keyboard", user_id)
    
    await message.answer(
        text,
        reply_markup=create_language_keyboard()
    )
    logger.info(f"User {user_id} opened language selection")


@language_router.callback_query(F.data.startswith("set_lang:"))
async def handle_language_selection(callback_query: CallbackQuery) -> None:
    """
    Handle language selection callback.
    FIX #2: After user selects language, delete selection message and send welcome message with main menu.
    """
    user_id = callback_query.from_user.id
    lang_code = callback_query.data.replace("set_lang:", "")

    # Set language in memory cache
    await set_user_language(user_id, lang_code)

    # Also update database if cache is available
    try:
        cache = callback_query.bot.cache if hasattr(callback_query.bot, 'cache') else None
        if cache:
            await cache.set_user_language(user_id, lang_code)
            logger.info(f"User {user_id} language set to {lang_code} in database")
    except Exception as e:
        logger.warning(f"Failed to update language in database: {e}")

    # Get language display name
    lang_name = AVAILABLE_LANGUAGES.get(lang_code, lang_code)

    # Send confirmation
    text = get_text("language_selected", user_id, language=lang_name)

    # Delete the language selection message (cleanup)
    try:
        await callback_query.message.delete()
    except Exception:
        # If can't delete, just edit
        try:
            await callback_query.message.edit_text(f"✅ {text}")
        except:
            pass

    # Send the actual welcome message in the selected language WITH MAIN MENU KEYBOARD
    from locales import get_text as get_translated_text
    from keyboards import create_main_menu_keyboard
    
    welcome_text = get_translated_text("start", user_id)
    
    await callback_query.message.answer(
        welcome_text,
        reply_markup=create_main_menu_keyboard(user_id)
    )
    
    # Answer the callback
    await callback_query.answer()

    logger.info(f"User {user_id} selected language: {lang_code} - Welcome message with main menu sent")
