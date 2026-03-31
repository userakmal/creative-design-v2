"""
Telegram Bot - Quick Test
Bot token va ulanishni tekshiradi
"""

import os
import sys
from dotenv import load_dotenv
import requests

print("=" * 60)
print("  TELEGRAM BOT - QUICK TEST")
print("=" * 60)
print()

# Load .env
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not TELEGRAM_BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN topilmadi!")
    print("   .env faylni tekshiring")
    sys.exit(1)

print(f"✓ Token: {TELEGRAM_BOT_TOKEN[:20]}...")
print()

# Test bot token
print("🔍 Bot token tekshirilmoqda...")
url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"

try:
    response = requests.get(url, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        
        if data.get("ok"):
            bot = data["result"]
            print("✅ Token to'g'ri!")
            print()
            print(f"   Bot Username: @{bot.get('username', 'N/A')}")
            print(f"   Bot ID: {bot.get('id', 'N/A')}")
            print(f"   Bot Name: {bot.get('first_name', 'N/A')}")
            print()
            print("✅ Bot tayyor! START_BOT.bat ni ishga tushiring")
        else:
            print(f"❌ Token noto'g'ri: {data}")
            print("   Telegram dan @BotFather ga murojaat qiling")
            sys.exit(1)
    else:
        print(f"❌ Telegram API xatosi: {response.status_code}")
        sys.exit(1)

except requests.exceptions.Timeout:
    print("❌ Timeout: Internetni tekshiring")
    sys.exit(1)
except requests.exceptions.ConnectionError:
    print("❌ Ulanish xatosi: Internetni tekshiring")
    sys.exit(1)
except Exception as e:
    print(f"❌ Xatolik: {e}")
    sys.exit(1)

print()
print("=" * 60)
