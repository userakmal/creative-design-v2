# ⚡ FIX: "Unexpected token '<'" Error

## ❌ MUAMMO
Video yuklashda xato: **"Unexpected token '<', " <!DOCTYPE "... is not valid JSON"**

Bu xato **server HTML javob qaytarayotgani** degani (JSON o'rniga).

---

## 🔍 SABABLAR

1. **Upload server ishga tushmagan** (eng ko'p uchraydigan)
2. **API URL noto'g'ri** (localhost vs production)
3. **Nginx konfiguratsiyasi xato**
4. **Port 3001 band emas**

---

## ✅ YECHIMLAR

### 1️⃣ LOCALHOSTDA (Kompyuterda)

**Tekshirish:**
```bash
# Port 3001 da server bormi?
netstat -ano | findstr :3001
```

**Agar yo'q bo'lsa:**
```bash
# Upload serverini ishga tushiring
start-upload-server.bat

# Yoki
node upload-server.js
```

**Natija:**
```
🚀 Upload server running on http://localhost:3001
```

**Test:**
Browserda oching: http://localhost:3001/api/health

Ko'rinishi kerak: `{"status":"ok","message":"Upload server is running"}`

---

### 2️⃣ PRODUCTIONDA (creative-design.uz)

**Qadam 1: SSH orqali serverga kiring**

**Qadam 2: PM2 statusini tekshiring**
```bash
pm2 status
```

**Agar "offline" bo'lsa:**
```bash
pm2 restart creative-upload
pm2 logs creative-upload
```

**Qadam 3: API ni tekshiring**
```bash
curl http://localhost:3001/api/health
```

**Natija:** `{"status":"ok",...}`

**Qadam 4: Nginx konfiguratsiyasini tekshiring**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### 3️⃣ BROWSERDA TEKSHIRISH

**1. Admin panelni oching:**
- Localhost: http://localhost:5173/admin
- Production: https://creative-design.uz/admin

**2. F12 bosing → Console**

**3. Network tabini oching**

**4. Video yuklashni urinib ko'ring**

**5. Xatoni o'qing:**
- `POST /api/upload` ni bosing
- Response tabini ko'ring
- Agar HTML ko'rsangiz → Server xato berayapti

---

## 🎯 TEZKOR FIX

### Localhost uchun:
```bash
# Barcha serverlarni qayta ishga tushirish
taskkill /F /FI "WINDOWTITLE eq Upload Server*"
start "Upload Server" cmd /k "node upload-server.js"
```

### Production uchun:
```bash
# Serverda
pm2 restart creative-upload
pm2 logs creative-upload --lines 50
```

---

## 📋 DIAGNOSTIKA CHECKLIST

- [ ] Port 3001 ochiqmi? (`netstat -ano | findstr :3001`)
- [ ] `/api/health` JSON qaytaryaptimi?
- [ ] Admin panel to'g'ri URL ga ulanganmi?
- [ ] Nginx loglarida xato bormi?
- [ ] PM2 daemon ishlaganmi?

---

## 🔧 CONFIGURATION

### Admin Panel Auto-Detection:

Admin panel endi avtomatik aniqlaydi:

```javascript
// Localhost
hostname: localhost → http://localhost:3001

// Production
hostname: creative-design.uz → https://creative-design.uz
```

**Fayl:** `pages/admin.page.tsx` (qator 12-28)

---

## 💡 MASLAHATLAR

1. **Har doim PM2 ishlatsin:**
   ```bash
   pm2 startup
   pm2 save
   ```

2. **Loglarni ko'ring:**
   ```bash
   pm2 logs creative-upload --lines 100
   ```

3. **Auto-restart qo'shing:**
   ```bash
   pm2 start upload-server.js --name creative-upload --restart-delay=3000
   ```

4. **Monitoring:**
   ```bash
   pm2 monit
   ```

---

## 🆘 AGAR HAMON ISHLAMASA

**1. Serverni to'liq qayta ishga tushirish:**

```bash
# Barcha node jarayonlarini to'xtatish
taskkill /F /IM node.exe

# Qayta ishga tushirish
start "Upload Server" cmd /k "node upload-server.js"
```

**2. Build ni qayta qilish:**

```bash
npm run build
```

**3. Yangi deployment:**

```bash
prepare-deploy.bat
# deploy-package/ ni serverga yuklang
```

---

## ✅ MUVAFFAQIYAT BELGILARI

**Ishlayotganini tekshirish:**

1. ✅ `http://localhost:3001/api/health` → JSON javob
2. ✅ Admin panel ochiladi
3. ✅ Video yuklash formasi ko'rinadi
4. ✅ Yuklangan videolar ro'yxati ko'rinadi
5. ✅ Delete/Rename tugmalari ishlaydi

---

**Yordam kerak bo'lsa:**
- `PRODUCTION_DEPLOYMENT.md` ni o'qing
- `pm2 logs creative-upload`
- Browser Console (F12)
