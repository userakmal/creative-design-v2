# 🚀 PHP Backend — Deploy qo'llanma

Bu papkadagi fayllar Node.js `upload-server.js` ning to'liq o'rnini bosadi.
Endi kompyuteringizni yoqib turish shart emas — hamma narsa hostingda
24/7 ishlaydi.

---

## ⚠️ AVVALO — XAVFSIZLIK

Siz suhbatda hosting parolini ochiq yubordingiz. **Hozir hostingga kiring
va parolni o'zgartiring**. Parolni hech qachon chatda, koddagi commit-larda,
yoki screenshot-da yubormang.

Admin panel paroli (`creative2026`) ham juda oddiy. Pastdagi 4-bosqichda
uni o'zgartirishni unutmang.

---

## 📁 Hostingda fayllar qanday joylashishi kerak

Hostingingiz root-i (odatda `public_html/` yoki `www/`) shu ko'rinishda
bo'lishi kerak:

```
public_html/
├── index.html              ← React build (client/dist dan)
├── assets/                 ← React build (client/dist dan)
├── .htaccess               ← shu yerda — SPA fallback + cache
│
├── api/                    ← PHP backend (shu papkadan)
│   ├── _bootstrap.php
│   ├── health.php
│   ├── stats.php
│   ├── videos.php
│   ├── music.php
│   ├── upload.php
│   ├── upload-music.php
│   └── .htaccess
│
├── data/                   ← JSON saqlanadigan papka
│   ├── videos.json         ← bo'sh [] bilan boshlanadi
│   ├── music.json
│   └── .htaccess           ← brauzer ko'rishini blokirovka qiladi
│
├── videos/                 ← yuklangan video fayllar (yozish ruxsati 0775)
├── image/                  ← thumbnail rasmlar
└── music/                  ← yuklangan musiqalar
```

---

## 🪜 Bosqichma-bosqich joylashtirish

### 1. Hostingingizga FTP yoki File Manager orqali kiring

`ns8.sayt.uz` da odatda **File Manager** mavjud (cPanel ichida). Yoki
FileZilla bilan FTP orqali ulansa ham bo'ladi.

### 2. `php-backend/` ichidagi hammasini hosting root-ga yuklang

Shu papkaning **ichidagi** hamma narsa (api/, data/, videos/, image/,
music/, .htaccess) `public_html/` ichiga tushishi kerak — **`php-backend/`
papkasining o'zini emas**.

> Eski `webSites/` yoki React fayllaringiz allaqachon u yerda bo'lsa,
> ustiga yozmasin: yangi `.htaccess` SPA fallback qo'shadi, mavjud
> bo'lsa qo'shiltirish kerak. Eng havfsizi: ko'chirib qo'yishdan oldin
> mavjud `.htaccess` ni `.htaccess.old` ga nomlab qo'ying.

### 3. Papka ruxsatlarini (CHMOD) sozlang

File Manager-da yoki FTP da:

| Papka     | Ruxsat |
|-----------|--------|
| `data/`   | `0775` |
| `videos/` | `0775` |
| `image/`  | `0775` |
| `music/`  | `0775` |
| `api/`    | `0755` |

Fayllarga: `data/*.json` → `0664`, PHP fayllar → `0644`.

### 4. Admin parolini o'zgartiring

`api/_bootstrap.php` ichida 28-qator atrofida:

```php
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'creative2026');
```

`'creative2026'` o'rniga **uzun, tasodifiy** parol qo'ying. Masalan:

```php
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'Xz9!kPm2$qRtN8vL');
```

Keyin `client/src/pages/admin.page.tsx` da `ADMIN_PASSWORD = "creative2026"`
ham xuddi shunday yangilang va React appni qaytadan build qiling.

> **Yaxshiroq variant:** cPanel-da Environment Variable ga `ADMIN_PASSWORD`
> qo'shsangiz, koddagi qiymat ishlatilmaydi — repo-da hech qaysi sir qolmaydi.

### 5. Endpoint-lar ishlayotganini tekshiring

Brauzerda:

```
https://creative-design.uz/api/health.php
```

Quyidagicha javob qaytishi kerak:

```json
{
  "status": "ok",
  "message": "PHP upload server ishlamoqda",
  "stats": { "videos": 0, "music": 0 },
  "php": "8.x.x"
}
```

Agar **500 error** chiqsa: hosting cPanel → Error Log ga qarang.
Agar **404 error** chiqsa: fayl noto'g'ri joyga yuklangan.
Agar **403 error** chiqsa: CHMOD muammosi yoki `.htaccess` blokladi.

### 6. Admin panelni sinab ko'ring

```
https://creative-design.uz/admin
```

Yuqori-o'ng burchakda yashil **Online** indikatori paydo bo'lsa, backend
ulangan. Endi kichik video bilan upload qilib ko'ring.

---

## 📐 Upload hajmi limiti

`api/.htaccess` ichida 200MB ga sozlangan. Sizning 150MB video-laringiz
mos keladi (rasm hisobiga + ~5MB).

Agar hosting `php_value` direktivasini blokirovka qilsa (ba'zi
provayderlarda shunday), shu qiymatlarni cPanel → **MultiPHP INI Editor**
yoki **Select PHP Version → Options** orqali qo'lda yozing:

```
upload_max_filesize = 200M
post_max_size       = 210M
memory_limit        = 256M
max_execution_time  = 300
max_input_time      = 300
```

---

## 🎬 Video downloader (Python FastAPI) haqida

Sizning `api-server/video-downloader/` papkangizda Python xizmati bor
(YouTube/TikTok/Instagram link orqali video yuklab oluvchi). U **shared
hosting da ishlamaydi** — chunki Python jarayonlari, ffmpeg, va port
ochish kerak.

3 ta variant:
1. **O'chirib qo'yish** — Admin panel-dagi "Download Center" bo'limini
   olib tashlash.
2. **VPS olish** — masalan, regtime.uz, hetzner.com (oyiga ~5$). U yerda
   Python xizmati ishlaydi.
3. **Hozircha kompyuteringizda ishlatish** — faqat o'zingizga kerak
   bo'lganda yoqasiz; foydalanuvchilarga ko'rinmaydi.

Bu PHP migratsiyaga aloqasi yo'q — video upload qismi mustaqil ishlaydi.

---

## 🛟 Tez-tez muammolar

| Muammo | Yechim |
|---|---|
| `Online` chiqmayapti | `health.php` ni brauzerda ochib ko'ring |
| 500 xato | cPanel → Error Log ga qarang, ehtimol PHP 7 ishlayapti — 8+ kerak |
| Upload 413 (Payload too large) | hosting o'zining nginx limitini oshirish kerak — supportga yozing |
| Video yuklandi lekin saytda ko'rinmayapti | `videos/`, `image/` CHMOD 0775 ekanini va `.htaccess` SPA fallback `api/` ni o'tkazib yuborayotganini tekshiring |
| `Parol noto'g'ri` | `_bootstrap.php` dagi parol = admin.page.tsx dagi parol bo'lishi shart |

---

## ✅ Final checklist

- [ ] Hosting paroli (ochiq yuborilgan) o'zgartirildi
- [ ] `php-backend/` ichidagi fayllar `public_html/` ga ko'chirildi
- [ ] `videos/`, `image/`, `music/`, `data/` CHMOD 0775
- [ ] Admin parol kuchli + frontend bilan moslandi
- [ ] `https://creative-design.uz/api/health.php` ishlaydi
- [ ] Admin panelda **Online** indikator yashil
- [ ] Test video yuklab ko'rildi va saytda ko'rindi
- [ ] Kompyuterdagi `start-all.bat` endi ishlatilmaydi — Node.js server kerak emas
