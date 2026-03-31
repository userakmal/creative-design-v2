# 🔄 AUTO SYNC - LOCALHOSTDAN PRODUCTIONGA AVTOMATIK YUKLASH

---

## 🎯 NIMA BU?

**Localhostda yuklangan videolar AVTOMATIK productionga ko'chiriladi!**

```
Localhost (Kompyuter):
  ↓ Video yuklandi (http://localhost:5173/admin)
  ↓
Auto Sync (Har 60 soniyada):
  ↓ rsync orqali sync
  ↓
Production (creative-design.uz):
  ✅ Video hammaning ko'z oldida!
```

---

## 📁 FAYLLAR:

| Fayl | Vazifasi |
|------|----------|
| `auto_sync.py` | 🐍 Python auto-sync script |
| `AUTO_SYNC.bat` | 🪟 Windows batch versiyasi |
| `START_AUTO_SYNC.bat` | 🚀 Task Scheduler uchun |
| `sync-config.json` | ⚙️ Konfiguratsiya fayli |

---

## ⚡ TEZKOR START:

### 1-QADAM: Config Faylni Tahrirlang

**`sync-config.json` ni oching:**

```json
{
  "server": {
    "host": "creative-design.uz",
    "user": "root",
    "port": 22,
    "path": "/var/www/creative-design"
  },
  "sync": {
    "enabled": true,
    "interval": 60,
    "auto": true
  }
}
```

**O'zgartiring:**
- `user` - Server username (root yoki boshqa)
- `host` - Server IP yoki domain
- `path` - Loyiha papkasi serverda

---

### 2-QADAM: SSH Key O'rnating (Password Siz)

**Windows da:**

```bash
# SSH key yaratish
ssh-keygen -t ed25519

# Serverga yuborish
ssh-copy-id root@creative-design.uz
```

**Natija:**
```
✅ Passwordsiz kirish mumkin
✅ Auto-sync ishlaydi
```

---

### 3-QADAM: rsync O'rnating

**Git Bash yuklab oling:**
```
https://git-scm.com/download/win
```

**O'rnatish:**
```
Next → Next → Next
✓ Git Bash Here
✓ rsync
```

**Tekshirish:**
```bash
rsync --version
```

---

### 4-QADAM: Auto-Start

#### VARIANT A: Python (Tavsiya)

```bash
# Virtual environment agar bo'lsa
cd C:\Users\Acer\OneDrive\Desktop\creative-design-main

# Ishga tushirish
python auto_sync.py
```

**Natija:**
```
============================================================
  🔄 AUTO SYNC - LOCALHOST TO PRODUCTION
  creative-design.uz
============================================================

✓ rsync available
✓ Auto-sync started
Server: root@creative-design.uz
Interval: 60 seconds

To stop: Ctrl+C

[17:30:45] Syncing videos...
  ✅ Videos synced
[17:30:46] Syncing images...
  ✅ Images synced
[17:30:47] Syncing videos.json...
  ✅ videos.json synced

Next sync in 60 seconds...
```

---

#### VARIANT B: Batch File

```bash
AUTO_SYNC.bat
```

---

### 5-QADAM: Avtomatik Ishga Tushirish (Task Scheduler)

**1. Task Scheduler oching:**
```
Windows + R
taskschd.msc
Enter
```

**2. Task yarating:**
```
Action → Create Basic Task
Name: Creative Design Auto-Sync
Trigger: When the computer starts
Action: Start a program
Program: C:\Users\Acer\OneDrive\Desktop\creative-design-main\START_AUTO_SYNC.bat
```

**3. Finish bosing**

**Natija:**
```
✅ Kompyuter yoqilganda auto-sync ishlaydi
✅ Har 60 soniyada sync qiladi
✅ Kompyuter o'chgunicha ishlaydi
```

---

## 🎯 QANDAY ISHLAYDI?

### Jarayon:

```
1. Kompyuter yoqildi
   ↓
2. START_AUTO_SYNC.bat ishga tushdi
   ↓
3. auto_sync.py ochildi
   ↓
4. Har 60 soniyada:
   ├─ public/videos/ → serverga
   ├─ public/image/ → serverga
   └─ public/data/videos.json → serverga
   ↓
5. ✅ Productionda video ko'rinadi!
```

---

## 📊 LOGLAR:

**Log fayl:**
```
logs/auto-sync.log
```

**Misol:**
```
[2026-03-31 17:30:45] [INFO] Config loaded successfully
[2026-03-31 17:30:45] [INFO] ✓ rsync available
[2026-03-31 17:30:45] [INFO] ✓ Auto-sync started
[2026-03-31 17:30:45] [INFO] Server: root@creative-design.uz
[2026-03-31 17:31:45] [INFO] [17:31:45] Syncing videos...
[2026-03-31 17:31:46] [INFO]   ✅ Videos synced
```

---

## 🛠️ MUAMMOLARNI HAL QILISH:

### 1. "rsync topilmadi"

**Yechim:**
```
Git Bash o'rnating:
https://git-scm.com/download/win
```

---

### 2. "Permission denied (publickey)"

**Yechim:**
```bash
# SSH key yaratish
ssh-keygen -t ed25519

# Serverga yuborish
ssh-copy-id root@creative-design.uz

# Tekshirish
ssh root@creative-design.uz
# Passwordsiz kirishi kerak
```

---

### 3. "Connection timed out"

**Yechim:**
```
1. Internetni tekshiring
2. Server ishlaganini tekshiring
3. SSH port ochiqmi (22)
4. Firewall tekshiring
```

---

### 4. "Sync failed"

**Loglarni tekshiring:**
```
type logs\auto-sync.log
```

**Qo'lda sync qiling:**
```bash
rsync -avz public/videos/ root@creative-design.uz:/var/www/creative-design/public/videos/
```

---

## ✅ TEKSHIRISH:

### 1. Auto-Start Tekshirish:

```
1. Task Scheduler oching
2. Creative Design Auto-Sync ni toping
3. Right-click → Run
4. Auto-sync oynasi ochilishi kerak
```

---

### 2. Sync Tekshirish:

**Localhostda video yuklang:**
```
http://localhost:5173/admin
```

**60 soniya kuting**

**Productionda tekshiring:**
```
https://creative-design.uz/templates
```

**Natija:**
```
✅ Video ko'rindi!
```

---

### 3. Serverda Tekshirish:

```bash
ssh root@creative-design.uz
ls /var/www/creative-design/public/videos/
# Yangi video fayl ko'rinishi kerak
```

---

## 🎯 TAVSIYALAR:

### 1. SSH Key Ishlating

Password o'rniga SSH key:
```bash
ssh-keygen -t ed25519
ssh-copy-id root@creative-design.uz
```

**Afzallik:**
- ✅ Xavfsiz
- ✅ Passwordsiz
- ✅ Avtomatik

---

### 2. Sync Interval

Config da o'zgartiring:
```json
"sync": {
  "interval": 30  // 30 soniya
}
```

**Tezroq sync:**
- 30 soniya - Tez
- 60 soniya - Optimal
- 300 soniya - Sekin

---

### 3. Log Rotation

```bash
# Eski loglarni o'chirish
del logs\auto-sync.log
```

---

## 📊 XULOSA:

| Xususiyat | Qiymat |
|-----------|--------|
| **Sync Interval** | 60 soniya |
| **Sync Method** | rsync |
| **Auto-Start** | Task Scheduler |
| **Logging** | ✅ Faylga yoziladi |
| **Error Handling** | ✅ Xatolar logda |
| **SSH Key** | ✅ Tavsiya etiladi |

---

## 🎉 TAYYOR!

**Endi:**

1. ✅ Kompyuterni yoqing
2. ✅ Auto-sync ishlaydi
3. ✅ Localhostda video yuklang
4. ✅ 60 soniyadan keyin productionda ko'rinadi!

**Barcha foydalanuvchilar videoni ko'radi!** 🎉

---

**Yaratdi:** Creative_designuz  
**Sana:** 2026-03-31  
**Versiya:** 1.0 - Auto Sync  
**Status:** ✅ READY
