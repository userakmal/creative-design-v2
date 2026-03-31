# 🎹 Main Menu Keyboard Guide

## Overview

The bot now features a **persistent Reply Keyboard** (Main Menu) that appears at the bottom of the chat screen, providing easy access to all bot features.

---

## Keyboard Layout

### For Regular Users:
```
┌─────────────────────────┐
│  🎬 Video Yuklash       │
├───────────┬─────────────┤
│ ⚙️       │ ℹ️ Yordam / │
│ Sozlamalar│ Qo'llanma   │
└───────────┴─────────────┘
```

### For Admin Users:
```
┌─────────────────────────┐
│  🎬 Video Yuklash       │
├───────────┬─────────────┤
│ ⚙️       │ ℹ️ Yordam / │
│ Sozlamalar│ Qo'llanma   │
├───────────┴─────────────┤
│  👑 Admin Panel         │
└─────────────────────────┘
```

---

## Features

### ✅ Persistent
- Keyboard stays visible after each message
- `resize_keyboard=True` - Fits screen nicely
- `one_time_keyboard=False` - Doesn't disappear

### ✅ Dynamic Admin Button
- **Automatically shown** if `message.from_user.id == ADMIN_ID`
- **Hidden** for all other users
- No code changes needed - checks `.env` config

### ✅ Multi-Language Ready
- Button text in Uzbek (can be customized)
- Works with all supported languages

---

## Button Functions

### 🎬 Video Yuklash
**Action:** Shows video upload instructions

**Response:**
```
🎥 Video Yuklash

Menga YouTube, Instagram yoki TikTok video 
ssilkasini tashlang.

Qo'llab-quvvatlanadigan platformalar:
• YouTube, Instagram, TikTok
• Twitter/X, Facebook, Vimeo
• Va 1000+ boshqa saytlar

Ssilka tashlang, men uni yuklab olaman!
```

---

### ⚙️ Sozlamalar
**Action:** Opens language selection menu

**Response:**
```
⚙️ Sozlamalar

Tilni tanlang / Выберите язык / Select language:

[🇺🇿 O'zbekcha]
[🇷🇺 Русский]
[🇬🇧 English]
```

---

### ℹ️ Yordam / Qo'llanma
**Action:** Shows help/instructions in user's language

**Response:** Full help text based on selected language

---

### 👑 Admin Panel (Admin Only)
**Action:** Opens admin dashboard

**Response:**
```
🎛️ Admin Dashboard

Select an option:

📊 Statistics    💻 Server Health
🧹 Clear Cache   📢 Broadcast
```

**Security:** Only shown to `ADMIN_ID` users

---

## When Keyboard Appears

### New Users:
1. User sends `/start`
2. Bot shows language selection (inline keyboard)
3. User selects language
4. Bot sends welcome message **with main menu keyboard**

### Returning Users:
1. User sends `/start`
2. Bot sends welcome message **with main menu keyboard immediately**

### After Any Message:
- Keyboard persists (doesn't disappear)
- Always available at bottom of screen

---

## Customization

### Change Button Text

Edit `keyboards.py`:

```python
def create_main_menu_keyboard(user_id: int) -> ReplyKeyboardMarkup:
    keyboard = [
        [
            KeyboardButton(text="🎬 Upload Video")  # Changed
        ],
        [
            KeyboardButton(text="⚙️ Settings"),     # Changed
            KeyboardButton(text="ℹ️ Help")           # Changed
        ],
    ]
    
    # Admin button
    if admin_id and user_id == admin_id:
        keyboard.append([
            KeyboardButton(text="👑 Admin Panel")
        ])
```

### Add New Button

```python
keyboard = [
    [
        KeyboardButton(text="🎬 Video Yuklash")
    ],
    [
        KeyboardButton(text="⚙️ Sozlamalar"),
        KeyboardButton(text="ℹ️ Yordam")
    ],
    [
        KeyboardButton(text="🆕 New Feature")  # New button
    ],
]
```

Then add handler:
```python
self.dp.message(F.text == "🆕 New Feature")(self.handle_new_feature)
```

---

## Handler Registration

Handlers are registered in `bot.py`:

```python
# Main menu button handlers (BEFORE generic text handler)
self.dp.message(F.text == "🎬 Video Yuklash")(self.handle_menu_video_upload)
self.dp.message(F.text == "⚙️ Sozlamalar")(self.handle_menu_settings)
self.dp.message(F.text == "ℹ️ Yordam / Qo'llanma")(self.handle_menu_help)
self.dp.message(F.text == "👑 Admin Panel")(self.handle_menu_admin)

# Generic URL handler (LAST)
self.dp.message(F.text)(self.handle_url_message)
```

**Important:** Menu handlers must be registered **BEFORE** the generic text handler!

---

## Testing

### Test as Regular User:
1. Send `/start`
2. Select language
3. ✅ See 2-row keyboard (no admin button)
4. Click `🎬 Video Yuklash` → See upload instructions
5. Click `⚙️ Sozlamalar` → See language selection
6. Click `ℹ️ Yordam / Qo'llanma` → See help text

### Test as Admin:
1. Send `/start` (as ADMIN_ID)
2. Select language
3. ✅ See 3-row keyboard (with admin button)
4. Click `👑 Admin Panel` → See admin dashboard

---

## Troubleshooting

### Keyboard doesn't appear:
- Check if bot sent message with `reply_markup`
- Verify `resize_keyboard=True`
- Try `/start` again

### Admin button shows for everyone:
- Check `ADMIN_ID` in `.env`
- Verify `config.bot.ADMIN_ID` is set correctly
- Restart bot after changing `.env`

### Buttons don't respond:
- Check handler registration order
- Ensure menu handlers are **BEFORE** generic text handler
- Check logs for handler execution

### Wrong button text:
- Edit `keyboards.py`
- Restart bot
- Send `/start` to refresh keyboard

---

## Files Modified

| File | Purpose |
|------|---------|
| `keyboards.py` | New file - keyboard builders |
| `bot.py` | Added menu handlers |
| `handlers/language.py` | Sends keyboard after language selection |

---

## Architecture

```
keyboards.py
├── create_main_menu_keyboard()
├── create_language_inline_keyboard()
├── create_admin_dashboard_inline_keyboard()
├── create_back_inline_keyboard()
├── create_quality_inline_keyboard()
└── create_audio_download_inline_keyboard()

bot.py
├── handle_start() → Sends main menu
├── handle_menu_video_upload()
├── handle_menu_settings()
├── handle_menu_help()
└── handle_menu_admin()

handlers/language.py
└── handle_language_selection() → Sends main menu
```

---

## Best Practices

1. **Always send keyboard with welcome message**
2. **Register menu handlers BEFORE generic handlers**
3. **Check admin status dynamically** (don't hardcode)
4. **Use `resize_keyboard=True`** for better UX
5. **Keep button text concise** (fits on one line)

---

## Support

For issues:
1. Check `bot.log` for handler execution
2. Verify keyboard is sent with message
3. Test with different user IDs (admin vs regular)
