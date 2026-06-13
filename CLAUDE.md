# CLAUDE.md

Bu fayl loyiha xaritasi — har bir Claude sessiyasi noldan o'rganmasligi va kam token
ishlatishi uchun. O'zgarish kiritsang, shu faylni ham yangilab qo'y.

## Loyiha nima

**Creative Design Platform** — `https://creative-design.uz`. Video shablonlar
platformasi + admin panel. React frontend + plain PHP backend, hammasi bitta repoda.
Bundan tashqari repo ichida bir nechta alohida statik mini-saytlar bor (to'y
taklifnomalari, telegram bot va h.k. — pastga qara).

## Asosiy arxitektura

- **Frontend** — React 19 + Vite + TypeScript + Tailwind, `client/` papkada.
  React Router v7 (`BrowserRouter`, client-side routing).
- **Backend** — oddiy PHP 8, `client/public/api/` ichida. Node yo'q, DB yo'q.
  Ma'lumotlar JSON fayllarda: `client/public/data/*.json`.
- **Video downloader** (ixtiyoriy) — Python FastAPI, `api-server/video-downloader/`.
  Shared hostingda ishlamaydi; alohida VPS kerak yoki tashlab ketiladi.

## ⚠️ Eng muhim: nima qayerga deploy bo'ladi

- **Manba (tracked):** `client/public/` — backend (PHP), data, media, `.htaccess`,
  va statik sub-saytlar shu yerda turadi.
- **Build natijasi:** `dist/` — **gitignore'da** (`.gitignore:78`), build artefakti.
  ⚠️ **`dist/` ni qo'lda umuman ishlatma/tahrirlama.** Egasi unga hech qachon
  tegmaydi — doim git orqali push qiladi va `dist/` ni **GitHub Actions avtomatik**
  build qiladi. Barcha o'zgarishlar faqat **`client/public/`** (yoki `client/src/`)
  da qilinadi. Lokal `dist/` papkasi eski bo'lishi mumkin — uni manba deb olma.
- **Deploy oqimi (yagona to'g'ri yo'l):**
  1. O'zgarishni `client/public/` yoki `client/src/` da qil.
  2. Commit qilib `main` ga push qil.
  3. GitHub Actions (`.github/workflows/deploy-ftp.yml`) o'zi `npm run build`
     qiladi va `dist/` ni FTP orqali hosting root'iga yuboradi.
  Workflow serverdagi yuklangan media (`videos/`, `image/`, `music/`) va jonli
  JSON (`data/*.json`) ni saqlab qoladi — production holati o'chmaydi.
  Qo'lda `npm run build` yoki `dist/` ni deploy qilish **shart emas**.
- Deploy'dan keyin smoke-test: `https://creative-design.uz/api/health.php`.

## Buyruqlar

Root `package.json` workspace orqali `client` ga proksi qiladi:

```bash
npm run dev      # client/ da vite dev server -> http://localhost:5173
npm run build    # client/ da vite build -> dist/
npm run lint     # tsc --noEmit (type-check)
npm run preview  # build'ni lokal ko'rish
```

Dev'da SPA `/api/*` ni Vite proxy orqali `localhost:3001` ga uzatadi. Node upload
serveri endi yo'q — lokal upload test uchun: `php -S localhost:3001 -t client/public`.

## Frontend tuzilishi (`client/src/`)

- `routes.tsx` — barcha route'lar shu yerda. `MainPage` eager, qolganlari
  `React.lazy` bilan. Route ↔ sahifa:
  - `/` → `pages/main.page.tsx`
  - `/templates`, `/popular` → `pages/templates.page.tsx` (filter prop bilan)
  - `/music` → `pages/music.page.tsx`
  - `/websites` → `pages/websites.page.tsx`
  - `/custom` → `pages/custom.page.tsx`
  - `/video-downloader` → `pages/downloader.page.tsx`
  - `/admin` → `pages/admin.page.tsx`
  - `/optom_gulbozor` → `pages/optom-gulbozor.page.tsx`
- `components/` — `Header`, `HeroShowcase`, `VideoCard`, `MenuButton`,
  `LoadingSpinner`, `FetchVDashboard`.
- `vite.config.ts` — proxy, manualChunks, va `closeBundle` plugin'i: build'dan
  keyin `index.html` ni `music/` va `optom_gulbozor/` papkalariga ko'chiradi,
  hamda `/websites` uchun og:image'siz `index.html` yaratadi.

## PHP backend (`client/public/api/`)

- `_bootstrap.php` — umumiy sozlamalar, `ADMIN_PASSWORD` shu yerda (hard-coded).
- `health.php` — smoke-test endpoint.
- `videos.php`, `music.php` — ro'yxatlarni `data/*.json` dan o'qiydi.
- `upload.php`, `upload-music.php` — media yuklash (admin paroli kerak).
- `auth.php`, `stats.php`, `proxy.php`.

## ⚠️ Routing gotcha — SPA route + fizik papka konflikti (.htaccess)

Bu yerda allaqachon bitta 404 bag bo'lgan, qaytarmaslik uchun yodda tut.

`client/public/.htaccess` Apache rewrite orqali SPA fallback qiladi. Lekin ba'zi
route'lar **bir vaqtning o'zida fizik papka** (`music/`, `optom_gulbozor/` —
ichida media/rasm bor). SPA catch-all faqat `!-d` (papka emas) so'rovlarni
`index.html` ga yo'naltiradi, shuning uchun fizik papka bo'lgan route'lar 404 beradi.

**Yechim:** bunday har bir route uchun media-skip qoidasidan **OLDIN** aniq qoida:
```apache
RewriteRule ^music/?$ /index.html [L]
RewriteRule ^optom_gulbozor/?$ /index.html [L]
RewriteRule ^(videos|image|music|data|assets|logo|api)/ - [L]   # media-skip
```
`^route/?$` faqat toza route'ni ushlaydi; `/music/qoshiq.mp3` baribir real fayl
bo'lib qoladi. **Yangi shunday route qo'shsang, `.htaccess` ga ham qoida qo'sh.**

## Repo ichidagi alohida loyihalar (asosiy platformaga bog'liq emas)

- `client/public/Muhammad_Yulduzxon/`, `client/public/sardor_gulnoza/` — alohida
  statik to'y taklifnomasi saytlari (`index.html` + media). Asosiy React app emas.
- `client/public/1/` va root `1/` — `kstu imtihon ui` (imtihon/quiz UI) build'i.
  Yaqinda commit'larda "real deployed source" sifatida shu `1/` papka aytilgan.
- `webSites/` — dizayn namunalari (statik HTML saytlar). Vite build'da
  `client/public/webSites/` ga ko'chiriladi.
- `telegram-video-bot/` — Python Telegram bot (video downloader). Ko'p `.md`
  qo'llanma fayllari bor; shared hostingda emas.
- `api-server/video-downloader/` — Python FastAPI video downloader.
- `oyim/` — alohida PHP "telegram location" ilovasi (`config.php` maxfiy, gitignore).
- `kstu imtihon ui/`, `fixes/`, `scripts/`, `setup-info/` — yordamchi/eski materiallar.

## Til & konvensiyalar

- UI matni va kod izohlari **o'zbekcha** (lotin). Foydalanuvchi bilan ham o'zbekcha.
- Commit xabarlari o'zbekcha yoziladi.

## Maxfiylik eslatmalari (README'dan)

- FTP paroli `.github/workflows/deploy-ftp.yml` da ochiq qolgan — hostingda
  almashtirib, GitHub Secrets'ga `FTP_PASSWORD` qilib qo'yish kerak.
- Admin upload paroli `client/public/api/_bootstrap.php` da hard-coded.
