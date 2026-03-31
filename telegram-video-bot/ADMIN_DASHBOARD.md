# 🎛️ Admin Dashboard Guide

## Access

The Admin Dashboard is **restricted to ADMIN_ID only** (set in `.env`).

### Commands

| Command | Description |
|---------|-------------|
| `/admin` | Open interactive dashboard |
| `/stats` | Quick statistics (also restricted) |
| `/broadcast` | Start broadcast workflow |

---

## Dashboard Menu

When you send `/admin`, you'll see a 2x2 menu:

```
🎛️ Admin Dashboard

Select an option:

📊 Statistics    💻 Server Health
🧹 Clear Cache   📢 Broadcast
```

### Button Functions

#### 📊 Statistics
Shows detailed bot usage:
- Total Users
- Total Videos Downloaded
- Successful vs Failed downloads
- Cache Hits/Misses
- Cache Hit Rate %
- Cache Size (MB)
- Bot Uptime

#### 💻 Server Health
Real-time system monitoring:
- **CPU Usage** % (with color status)
- **RAM Usage** (Used/Total GB + %)
- **Disk Space** (Used/Free GB + %)
- Last updated timestamp

**Status Colors:**
- 🟢 Green: < 50% (Good)
- 🟡 Yellow: 50-80% (Warning)
- 🔴 Red: > 80% (Critical)

**Requirements:** `psutil` must be installed
```bash
pip install psutil
```

#### 🧹 Clear Cache
Deletes temporary files:
- All `.mp4` files in `downloads/`
- All `.mp3` files in `downloads/audio/`
- All `hls_*` temporary directories

**Report shows:**
- Number of files deleted
- Total space freed (MB)
- Directories cleaned

#### 📢 Broadcast
Starts the broadcast workflow:
1. Click button
2. Send message (text/photo/video/document)
3. Send `/confirm` to broadcast
4. Send `/cancel` to abort

**Features:**
- Rate limited (20 msg/sec to avoid Telegram limits)
- Shows progress report
- Reports success/failure counts

---

## Navigation

- Every submenu has a **🔙 Back** button
- Click it to return to the main dashboard
- Dashboard message is edited (not spammed)

---

## Security

- **All buttons check ADMIN_ID**
- Non-admins see: "🔒 Admin access only."
- Callback queries are validated
- Broadcast requires confirmation

---

## Setup

### 1. Install Dependencies

```bash
pip install psutil
```

Or update requirements:
```bash
pip install -r requirements.txt
```

### 2. Set ADMIN_ID

In your `.env` file:
```env
ADMIN_ID=853691902
```

### 3. Restart Bot

```bash
python bot.py
```

---

## Usage Examples

### Check Server Health
```
1. Send: /admin
2. Click: 💻 Server Health
3. View: CPU, RAM, Disk metrics
4. Click: 🔙 Back (to return)
```

### Clear Cache
```
1. Send: /admin
2. Click: 🧹 Clear Cache
3. See: "✅ Cache Cleared: 15 files, 234.56 MB freed"
4. Click: 🔙 Back
```

### View Statistics
```
1. Send: /admin
2. Click: 📊 Statistics
3. See: Users, Downloads, Cache performance
4. Click: 🔙 Back
```

### Broadcast Message
```
1. Send: /admin
2. Click: 📢 Broadcast
3. Send your message (text/photo/video)
4. Send: /confirm
5. Wait for completion report
```

---

## Troubleshooting

### "psutil not installed" warning
```bash
pip install psutil
```

### Dashboard doesn't appear
- Check if ADMIN_ID is set correctly in `.env`
- Restart the bot
- Check logs for errors

### Clear Cache shows 0 MB freed
- Cache directories might already be empty
- Check if `downloads/` folder exists
- Bot might be cleaning up automatically

### Broadcast fails
- Ensure bot has messages enabled
- Check if users table is populated
- Verify rate limiting isn't too strict

---

## Logs

All admin actions are logged:
```
INFO: Admin 853691902 opened dashboard
INFO: Admin 853691902 cleared cache: 15 files, 234.56 MB freed
INFO: Admin 853691902 started broadcast to 150 users
```

Check `bot.log` for full audit trail.

---

## Advanced: Customize Dashboard

Edit `handlers/admin.py`:

### Change button layout
```python
def create_admin_dashboard_keyboard():
    keyboard = [
        [
            InlineKeyboardButton(text="📊 Stats", callback_data="admin_stats"),
            InlineKeyboardButton(text="💻 Health", callback_data="admin_server_health"),
        ],
        [
            InlineKeyboardButton(text="🧹 Cache", callback_data="admin_clear_cache"),
            InlineKeyboardButton(text="📢 Broadcast", callback_data="admin_broadcast"),
        ],
    ]
```

### Add new button
```python
# Add to keyboard
keyboard.append([
    InlineKeyboardButton(text="🔧 Settings", callback_data="admin_settings")
])

# Add handler
@admin_router.callback_query(F.data == "admin_settings")
async def handle_settings(callback_query: CallbackQuery):
    # Your code here
```

---

## Support

For issues or feature requests, check the logs first:
```bash
tail -f bot.log
```

Common issues:
- Permission errors (check ADMIN_ID)
- psutil import errors (install psutil)
- Disk space errors (run Clear Cache)
