# 🚀 CREATIVE DESIGN - PRODUCTION DEPLOYMENT

## ⚠️ MUAMMO: "Unexpected token '<'" Xatosi

Bu xato **upload server ishga tushmagan** yoki **to'g'ri konfiguratsiya qilinmagan** degani.

---

## ✅ YECHIM: Production Serverga To'liq O'rnatish

### 1-QADAM: Fayllarni Tayyorlash

```bash
# Loyihani build qilish
npm run build

# Papkalar tayyor:
# - dist/ (frontend)
# - upload-server.js (backend API)
# - public/ (videolar va rasmlar)
```

---

### 2-QADAM: Serverga Yuklash

**VPS/Hostingga yuklash kerak:**

```
/var/www/creative-design/
├── dist/                    # Frontend (build dan keyin)
├── public/
│   ├── videos/             # Video fayllar
│   ├── image/              # Rasm fayllar
│   └── data/
│       └── videos.json     # Video ma'lumotlari
├── upload-server.js        # Backend API
├── package.json            # Dependencies
└── .env                    # Environment variables
```

**FTP/SFTP orqali:**
1. `dist/` papkasini serverga yuklang
2. `upload-server.js` ni yuklang
3. `package.json` ni yuklang
4. `public/` papkasini yuklang (agar videolar bor bo'lsa)

---

### 3-QADAM: Serverda O'rnatish

**SSH orqali serverga kiring:**

```bash
# Papkaga o'tish
cd /var/www/creative-design

# Dependencies o'rnatish
npm install --production

# Upload serverini ishga tushirish (test)
node upload-server.js
```

**Natija:**
```
🚀 Upload server running on http://localhost:3001
📁 Upload endpoint: http://localhost:3001/api/upload
📊 Videos JSON: http://localhost:3001/data/videos.json
```

---

### 4-QADAM: PM2 bilan Doimiy Ishga Tushirish

**PM2 o'rnatish:**
```bash
sudo npm install -g pm2
```

**Upload serverini PM2 da ishga tushirish:**
```bash
cd /var/www/creative-design
pm2 start upload-server.js --name creative-upload --env production
pm2 save
pm2 startup
```

**PM2 startup buyrug'ini bajaring** (agar ko'rsatma bersa):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www-data --hp /home/www-data
```

---

### 5-QADAM: Nginx Konfiguratsiyasi

**Nginx config faylini yangilash:**

`/etc/nginx/sites-available/creative-design.uz`

```nginx
server {
    listen 80;
    server_name creative-design.uz www.creative-design.uz;

    # Frontend (Vite build)
    location / {
        root /var/www/creative-design/dist;
        try_files $uri $uri/ /index.html;
    }

    # Upload Server API (Reverse Proxy)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Video upload uchun maxsus sozlamalar
        client_max_body_size 300M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Video fayllar
    location /videos/ {
        proxy_pass http://localhost:3001/videos/;
        proxy_set_header Host $host;
    }

    # Rasm fayllar
    location /image/ {
        proxy_pass http://localhost:3001/image/;
        proxy_set_header Host $host;
    }

    # Data fayllar
    location /data/ {
        proxy_pass http://localhost:3001/data/;
        proxy_set_header Host $host;
    }
}
```

**Nginx ni qayta ishga tushirish:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### 6-QADAM: HTTPS (SSL) O'rnatish

```bash
sudo certbot --nginx -d creative-design.uz -d www.creative-design.uz
```

---

## 🔍 MUAMMOLARNI HAL QILISH

### "Unexpected token '<'" xatosi bo'lsa:

**1. Upload server ishlaganini tekshiring:**
```bash
# PM2 status
pm2 status creative-upload

# Agar o'chgan bo'lsa
pm2 restart creative-upload
```

**2. API endpoint ishlaganini tekshiring:**
```bash
curl http://localhost:3001/api/health
```

Natija: `{"status":"ok","message":"Upload server is running"}`

**3. Nginx loglarini tekshiring:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**4. Upload server loglarini tekshiring:**
```bash
pm2 logs creative-upload
```

---

### Admin Panel ishmasa:

**1. Browserda tekshiring:**
- URL: `https://creative-design.uz/admin`
- F12 bosing → Console → Xatolarni o'qing

**2. Server URL to'g'riligini tekshiring:**
```javascript
// Browser console da:
console.log(window.location.hostname);
// "creative-design.uz" bo'lishi kerak
```

**3. API ga ulanishni tekshiring:**
```bash
curl https://creative-design.uz/api/health
```

---

## 📱 TELEFONDA ISHLATISH

**Admin panelga kirish:**
1. Telefon brauzerini oching
2. URL: `https://creative-design.uz/admin`
3. Login: `admin`
4. Password: `creative2026`

**Videolarni boshqarish:**
- ✏️ Rename - Nomini o'zgartirish
- 🗑️ Delete - O'chirish
- 📤 Upload - Yangi video yuklash

---

## 🎯 TO'LIQ BUYRUQLAR (Copy-Paste)

```bash
# 1. Build qilish
npm run build

# 2. Serverga yuklash (FTP/SFTP)
# (dist/, public/, upload-server.js, package.json)

# 3. Serverda
cd /var/www/creative-design
npm install --production

# 4. PM2 o'rnatish
sudo npm install -g pm2

# 5. Upload serverini ishga tushirish
pm2 start upload-server.js --name creative-upload --env production
pm2 save
pm2 startup

# 6. Nginx konfiguratsiyasi
sudo nano /etc/nginx/sites-available/creative-design.uz
# (yuqoridagi config ni qo'shing)

sudo nginx -t
sudo systemctl reload nginx

# 7. SSL o'rnatish
sudo certbot --nginx -d creative-design.uz -d www.creative-design.uz
```

---

## ✅ TEKSHIRISH

**1. Frontend ishlaganini tekshirish:**
```
https://creative-design.uz
```

**2. Upload server ishlaganini tekshirish:**
```
https://creative-design.uz/api/health
```

**3. Admin panel ishlaganini tekshirish:**
```
https://creative-design.uz/admin
```

**4. Video yuklashni test qilish:**
- Admin panelga kiring
- Video yuklang
- "/templates" sahifasida ko'ring

---

## 🆘 YORDAM

Muammolar bo'lsa:
1. `pm2 logs creative-upload` - Server loglari
2. `sudo tail -f /var/log/nginx/error.log` - Nginx xatolar
3. Browser Console (F12) - Frontend xatolar

---

**Yaratdi:** Creative_designuz
**Sana:** 2026-03-31
**Versiya:** 2.0 (Production Ready)
