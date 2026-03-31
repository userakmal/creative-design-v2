"""
Telegram Bot - Debug Mode
Bu skript botni debug mode da ishga tushiradi va barcha xabarlarni ko'rsatadi
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("=" * 60)
print("  TELEGRAM BOT - DEBUG MODE")
print("=" * 60)
print()

# Check environment
print("[1/5] Environment tekshirish...")
from dotenv import load_dotenv
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not TELEGRAM_BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN topilmadi!")
    sys.exit(1)

print(f"✓ Token: {TELEGRAM_BOT_TOKEN[:20]}...")
print()

# Check dependencies
print("[2/5] Dependencies tekshirish...")
try:
    from aiogram import Bot, Dispatcher
    print("✓ aiogram o'rnatilgan")
except ImportError as e:
    print(f"❌ aiogram topilmadi: {e}")
    print("   pip install aiogram")
    sys.exit(1)

try:
    import yt_dlp
    print("✓ yt-dlp o'rnatilgan")
except ImportError as e:
    print(f"❌ yt-dlp topilmadi: {e}")
    print("   pip install yt-dlp")
    sys.exit(1)

print()

# Check bot token
print("[3/5] Bot token tekshirish...")
import requests

token_info_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
try:
    response = requests.get(token_info_url, timeout=10)
    if response.status_code == 200:
        bot_info = response.json()
        if bot_info.get("ok"):
            print(f"✓ Bot topildi: @{bot_info['result']['username']}")
            print(f"  ID: {bot_info['result']['id']}")
            print(f"  Name: {bot_info['result']['first_name']}")
        else:
            print(f"❌ Token noto'g'ri: {bot_info}")
            sys.exit(1)
    else:
        print(f"❌ Telegram API xatosi: {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"❌ Ulanishda xatolik: {e}")
    sys.exit(1)

print()

# Check Docker container
print("[4/5] Bot API Server tekshirish...")
try:
    response = requests.get("http://localhost:8081", timeout=5)
    if response.status_code == 200:
        print("✓ Bot API Server ishlayapti (Port 8081)")
    else:
        print(f"⚠ Bot API Server javobi: {response.status_code}")
except Exception as e:
    print(f"⚠ Bot API Server ulanmadi: {e}")
    print("   Docker container tekshiring: docker compose ps")

print()

# Start bot
print("[5/5] Bot ishga tushirish...")
print()
print("=" * 60)
print("  BOT ISHGA TUSHDI!")
print("=" * 60)
print()
print("Bot javob berishni boshladi...")
print("To'xtatish uchun Ctrl+C bosing")
print()

# Import and run the actual bot
from bot import main

if __name__ == "__main__":
    main()
