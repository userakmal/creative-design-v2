# 🚀 CREATIVE DESIGN - PRODUCTION SERVERGA UPLOAD SERVER O'RNATISH

## ❌ MUAMMO:
**creative-design.uz/admin dan video yuklash ishlamayapti!**

Sabab: Production serverda upload server ishlamayapti.

---

## ✅ YECHIM: Production Serverda Upload Server Ishga Tushirish

---

### 1-QADAM: SSH Orqali Serverga Kirish

```bash
ssh root@creative-design.uz
# Yoki hosting SSH access
```

---

### 2-QADAM: Loyihani Serverga Yuklash

**Agar hali yuklanmagan bo'lsa:**

```bash
# Serverda
cd /var/www

# Loyihani yuklash (git yoki FTP)
git clone <your-repo> creative-design
# Yoki FTP orqali yuklang

cd creative-design
```

**Kerakli fayllar:**
```
/var/www/creative-design/
├── upload-server.js        ← MUHIM!
├── package.json            ← MUHIM!
├── public/
│   ├── videos/
│   ├── image/
│   └── data/
│       └── videos.json
└── .env                    ← Agar bor bo'lsa
```

---

### 3-QADAM: Dependencies O'rnatish

```bash
cd /var/www/creative-design

# npm install
npm install --production
```

**Natija:**
```
added 150 packages in 30s
```

---

### 4-QADAM: Upload Serverni Ishga Tushirish

#### VARIANT A: PM2 Bilan (Tavsiya!)

```bash
# PM2 o'rnatish
npm install -g pm2

# Upload serverni ishga tushirish
pm2 start upload-server.js --name creative-upload --env production

# Avtomatik ishga tushirish
pm2 save
pm2 startup

# Status tekshirish
pm2 status
```

**Natija:**
```
┌─────┬─────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id  │ name                │ mode     │ ↺    │ status    │ cpu      │ memory   │
├─────┼─────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0   │ creative-upload     │ fork     │ 0    │ online    │ 0%       │ 50mb     │
└─────┴─────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

---

#### VARIANT B: Systemd Bilan

**Service fayl yarating:**

```bash
nano /etc/systemd/system/creative-upload.service
```

**Quyidagi content ni qo'shing:**

```ini
[Unit]
Description=Creative Design Upload Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/creative-design
ExecStart=/usr/bin/node /var/www/creative-design/upload-server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

**Ishga tushirish:**

```bash
# Enable va start
systemctl enable creative-upload
systemctl start creative-upload

# Status tekshirish
systemctl status creative-upload
```

---

#### VARIANT C: Qo'lda (Test uchun)

```bash
cd /var/www/creative-design
node upload-server.js
```

**Natija:**
```
🚀 Upload server running on http://localhost:3001
📁 Upload endpoint: http://localhost:3001/api/upload
```

---

### 5-QADAM: Nginx Konfiguratsiyasi

**Nginx config faylini oching:**

```bash
nano /etc/nginx/sites-available/creative-design.uz
```

**Quyidagi qatorlarni qo'shing:**

```nginx
server {
    listen 80;
    server_name creative-design.uz www.creative-design.uz;

    # Frontend
    location / {
        root /var/www/creative-design/dist;
        try_files $uri $uri/ /index.html;
    }

    # Upload Server API - MUHIM!
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
        
        # Video upload uchun
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
# Config ni tekshirish
nginx -t

# Reload
systemctl reload nginx
```

---

### 6-QADAM: HTTPS (SSL) O'rnatish

```bash
# Certbot o'rnatish
apt-get update
apt-get install certbot python3-certbot-nginx

# SSL sertifikat olish
certbot --nginx -d creative-design.uz -d www.creative-design.uz
```

---

### 7-QADAM: TEKSHIRISH

**1. Upload server ishlayaptimi?**

```bash
curl http://localhost:3001/api/health
```

Natija:
```json
{"status":"ok","message":"Upload server is running"}
```

**2. HTTPS orqali ishlayaptimi?**

```bash
curl https://creative-design.uz/api/health
```

Natija:
```json
{"status":"ok","message":"Upload server is running"}
```

**3. Admin panel ochiladimi?**

Browserda:
```
https://creative-design.uz/admin
```

**4. Video yuklash ishlaydimi?**

Admin panelda:
1. Login qiling
2. Video yuklang
3. Templates sahifasida ko'ring

---

## 🛠️ MUAMMOLARNI HAL QILISH:

### 1. "Port 3001 band"

```bash
# Band portni topish
netstat -tulpn | grep :3001

# Jarayonni to'xtatish
kill -9 <PID>

# Qayta ishga tushirish
pm2 restart creative-upload
```

### 2. "Nginx 502 Bad Gateway"

```bash
# Upload server ishlaganini tekshirish
pm2 status

# Nginx loglarini tekshirish
tail -f /var/log/nginx/error.log

# Nginx config ni tekshirish
nginx -t
```

### 3. "Permission denied"

```bash
# Huquqlarni to'g'rilash
chown -R www-data:www-data /var/www/creative-design/public/
chmod -R 755 /var/www/creative-design/public/
```

### 4. "PM2 topilmadi"

```bash
# PM2 o'rnatish
npm install -g pm2

# PATH ga qo'shish
export PATH=$PATH:/usr/local/bin
```

---

## 📊 XULOSA:

| Qadam | Vazifa | Status |
|-------|--------|--------|
| 1 | SSH orqali kirish | ✅ |
| 2 | Loyihani yuklash | ✅ |
| 3 | Dependencies | ✅ |
| 4 | Upload server | ✅ |
| 5 | Nginx config | ✅ |
| 6 | HTTPS | ✅ |
| 7 | Tekshirish | ✅ |

---

## 🎯 TAYYOR BUYRUQLAR:

```bash
# 1. SSH orqali kirish
ssh root@creative-design.uz

# 2. Loyiha papkasiga o'tish
cd /var/www/creative-design

# 3. Dependencies
npm install --production

# 4. PM2 o'rnatish
npm install -g pm2

# 5. Upload serverni ishga tushirish
pm2 start upload-server.js --name creative-upload --env production
pm2 save
pm2 startup

# 6. Nginx config
nano /etc/nginx/sites-available/creative-design.uz
# (config ni qo'shing)
nginx -t
systemctl reload nginx

# 7. SSL
certbot --nginx -d creative-design.uz -d www.creative-design.uz

# 8. Tekshirish
curl http://localhost:3001/api/health
```

---

**Yaratdi:** Creative_designuz  
**Sana:** 2026-03-31  
**Versiya:** 1.0 - Production Upload Server
