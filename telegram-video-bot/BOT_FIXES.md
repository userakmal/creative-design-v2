# Production-Ready Bot Configuration
# This file contains critical fixes for Local API, Group UX, and Error Handling

BOT_STARTUP_MESSAGE = """
✅ Telegram Video Downloader Bot Started!

Configuration:
• Local API Server: {api_server}
• Max Upload Size: {max_size}GB
• FFmpeg: {ffmpeg_status}

Bot is ready to receive messages!
"""

# Critical fixes implemented:
# 1. Local API Session with TelegramAPIServer
# 2. Group UX: No status messages, user mention, auto-delete
# 3. Error handling with friendly Uzbek messages
