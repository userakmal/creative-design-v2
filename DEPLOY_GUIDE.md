# 📤 LOCALHOSTDAN PRODUCTIONGA VIDEO YUKLASH

## ❌ MUAMMO:

**Localhostda yuklangan videolar productionda ko'rinmaydi!**

```
Localhost (kompyuter):
  public/videos/v123.mp4 ✅ Bor
  public/image/i123.jpg  ✅ Bor
  
Production (creative-design.uz):
  public/videos/v123.mp4 ❌ Yo'q!
  public/image/i123.jpg  ❌ Yo'q!
```

---

## ✅ 3 TA YECHIM:

---

### VARIANT 1: Production Serverga To'g'ridan-To'g'ri Yuklash (Oson)

**Admin panelga production URL orqali kiring:**

```
1. Browserda oching:
   https://creative-design.uz/admin

2. Login:
   Username: admin
   Password: creative2026

3. Video yuklang:
   - Video nomi
   - Rasm
   - Video
   - "Videoni Yuklash"
```

**Natija:**
```
✅ Video production serverga yuklandi
✅ Barcha foydalanuvchilar ko'radi
✅ Telefondan ham ko'rinadi
```

---

### VARIANT 2: FTP/SFTP Orqali Yuklash (Tez)

**FileZilla yoki WinSCP ishlating:**

#### 1. FileZilla O'rnating:
```
https://filezilla-project.org/
```

#### 2. Serverga Ulaning:
```
Host: creative-design.uz
Username: root (yoki hosting username)
Password: ********
Port: 22 (SFTP) yoki 21 (FTP)
```

#### 3. Fayllarni Ko'chiring:

**Localhostdan:**
```
C:\Users\Acer\OneDrive\Desktop\creative-design-main\public\
├── videos\
│   └── v_1234567890.mp4
├── image\
│   └── i_1234567890.jpg
└── data\
    └── videos.json
```

**Productionga:**
```
/var/www/creative-design/public/
├── videos\
│   └── v_1234567890.mp4  ← Yuklang
├── image\
│   └── i_1234567890.jpg  ← Yuklang
└── data\
    └── videos.json       ← Yuklang
```

#### 4. Tayyor!
```
✅ Barcha fayllar serverga yuklandi
✅ https://creative-design.uz/templates da ko'rinadi
```

---

### VARIANT 3: SSH/Rsync Orqali (Professional)

**Windows da:**

#### 1. Git Bash o'rnating:
```
https://git-scm.com/download/win
```

#### 2. Script ni ishga tushiring:
```bash
DEPLOY_TO_PRODUCTION.bat
```

#### 3. Server ma'lumotlarini kiriting:
```
Username: root
Server: creative-design.uz
Path: /var/www/creative-design
```

#### 4. Avtomatik yuklash:
```
[1/3] Videolar yuklanmoqda...
    ✅ Videolar yuklandi
[2/3] Rasmlar yuklanmoqda...
    ✅ Rasmlar yuklandi
[3/3] videos.json yuklanmoqda...
    ✅ videos.json yuklandi

✅ DEPLOY COMPLETE!
```

---

## 🎯 QAYSI VARIANTNI TANLASH KERAK?

| Variant | Qachon | Tezlik | Qulaylik |
|---------|--------|--------|----------|
| **VARIANT 1** | Har doim | ⭐⭐⭐ | ⭐⭐⭐ |
| **VARIANT 2** | Katta fayllar | ⭐⭐ | ⭐⭐ |
| **VARIANT 3** | Professional | ⭐⭐⭐ | ⭐ |

---

## 📋 TAVSIYA:

### Har Kungi Ishlatish Uchun:

**VARIANT 1** - Production admin panel:
```
https://creative-design.uz/admin
```

✅ Oson
✅ Tez
✅ Barcha joyda ishlaydi
✅ Telefondan ham mumkin

---

### Katta Miqdorda Video Uchun:

**VARIANT 2** - FTP:
```
FileZilla orqali barcha fayllarni bir marta yuklang
```

✅ Ko'p fayllar
✅ Katta hajm
✅ Ishonchli

---

### Avtomatlashtirish Uchun:

**VARIANT 3** - SSH/Rsync:
```
DEPLOY_TO_PRODUCTION.bat
```

✅ Avtomatik
✅ Professional
✅ Tez

---

## 🛠️ MUAMMOLARNI HAL QILISH:

### 1. "Videolar upload bo'ldi, lekin ko'rinmaydi"

**Yechim:**
```
1. Browser cache ni tozalang:
   Ctrl + Shift + Delete

2. Sahifani yangilang:
   F5 yoki Ctrl + R

3. Serverda tekshiring:
   ssh root@creative-design.uz
   ls /var/www/creative-design/public/videos/
```

---

### 2. "videos.json yangilanmadi"

**Yechim:**
```
1. Localhostda videos.json ni oching:
   public/data/videos.json

2. Productionga yuklang:
   FTP orqali /var/www/creative-design/public/data/

3. Yoki SSH orqali:
   scp public/data/videos.json root@creative-design.uz:/var/www/creative-design/public/data/
```

---

### 3. "Fayl huquqlari xato"

**Yechim:**
```bash
# SSH orqali
ssh root@creative-design.uz

# Huquqlarni to'g'rilash
chown -R www-data:www-data /var/www/creative-design/public/
chmod -R 755 /var/www/creative-design/public/
```

---

## ✅ TEKSHIRISH:

### Upload muvaffaqiyatli bo'ldimi?

**1. Localhostda:**
```
http://localhost:5173/templates
✓ Video ko'rindi
```

**2. Productionda:**
```
https://creative-design.uz/templates
✓ Video ko'rindi
```

**3. Serverda:**
```bash
ssh root@creative-design.uz
ls /var/www/creative-design/public/videos/
✓ Video fayl bor
```

---

## 📊 XULOSA:

| Joy | Video Qayerga Yuklanadi? | Kim Ko'radi? |
|-----|-------------------------|--------------|
| **localhost:5173/admin** | Kompyuteringizga | Faqat siz |
| **creative-design.uz/admin** | Serverga | Hamma |

---

## 🎯 TAVSIYA:

**Har doim production serverga yuklang:**

```
https://creative-design.uz/admin
```

**Sabab:**
- ✅ Barcha foydalanuvchilar ko'radi
- ✅ Telefondan ham ko'rinadi
- ✅ Internetda mavjud
- ✅ Backup qilinadi

---

**Yaratdi:** Creative_designuz  
**Sana:** 2026-03-31  
**Versiya:** 1.0 - Deploy Guide
