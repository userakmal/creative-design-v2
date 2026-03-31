# 🚀 Telegram Video Bot - Auto-Start Guide

## Quick Start (1-Time Setup)

### Step 1: Run the Autostart Setup
**Double-click this file:** `setup_autostart.py`

This will:
- Create a Windows Startup shortcut
- Ask if you want to start the bot now
- The bot will run invisibly in the background

### Step 2: Done! ✅

The bot will now:
- ✅ Start automatically when you log in to Windows
- ✅ Run invisibly (no CMD window)
- ✅ Auto-restart if it crashes (5-second delay)
- ✅ Log all activity to `bot_autorestart.log`

---

## Manual Start (Alternative)

If you don't want autostart, you can manually start the bot:

**Option A - Invisible Mode (Recommended):**
```
Double-click: run_invisible.vbs
```

**Option B - Visible Mode (For Debugging):**
```
Double-click: start_bot_auto.bat
```

---

## File Descriptions

| File | Purpose |
|------|---------|
| `setup_autostart.py` | **Run this once** to set up Windows autostart |
| `run_invisible.vbs` | Runs bot invisibly (no window) |
| `start_bot_auto.bat` | Runs bot with visible console + auto-restart |
| `bot_autorestart.log` | Log file (auto-created) |

---

## How to Stop the Bot

### Method 1: Task Manager
1. Press `Ctrl + Shift + Esc`
2. Find `python.exe` in the Processes tab
3. Click **End Task**

### Method 2: Command Line
```cmd
taskkill /F /IM python.exe
```

---

## How to Disable Autostart

1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter
4. Delete the shortcut: **Telegram Video Bot.lnk**

---

## Troubleshooting

### Bot doesn't start automatically
- Make sure you ran `setup_autostart.py`
- Check if shortcut exists in Startup folder
- Try running `run_invisible.vbs` manually

### Bot crashes repeatedly
- Check `bot_autorestart.log` for error messages
- Common issues:
  - Invalid `TELEGRAM_BOT_TOKEN` in `.env`
  - Missing Python packages (`pip install -r requirements.txt`)
  - Port already in use (if using webhooks)

### Can't delete the shortcut
- Make sure the bot is stopped first (Task Manager)
- Try running as Administrator

---

## Logs

All bot activity is logged to:
- **Console output:** `bot_autorestart.log`
- **Bot logs:** `bot.log` (if configured in `.env`)

To view logs:
```cmd
type bot_autorestart.log
```

Or open the file in Notepad.

---

## Support

If you need help:
1. Check the log files first
2. Verify your `.env` configuration
3. Ensure Python 3.8+ is installed
4. Make sure all dependencies are installed
