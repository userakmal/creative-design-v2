# Creative Design Platform

Video taklifnomalar va dizayn ko'rgazmasi platformasi.

## Tezkor Boshlash

```
current_starter.bat
```

Bu bitta fayl:
1. Node.js va Python kutubxonalarni o'rnatadi (birinchi marta)
2. Barcha 4 xizmatni ishga tushiradi

## Xizmatlar

| Xizmat | Port | Manzil |
|--------|------|--------|
| Web sayt | 5173 | http://localhost:5173 |
| Admin panel | 5173 | http://localhost:5173/admin |
| Video Downloader | 5173 | http://localhost:5173/video-downloader |
| Upload Server | 3001 | http://localhost:3001 |
| Video API | 8000 | http://localhost:8000/api/docs |
| Telegram Bot | — | Ishlayapti |

## Papka Tuzilishi

```
creative-design-main/
├── current_starter.bat          # Barcha xizmatlarni yoqish
├── CLEANUP.bat                  # Keraksiz fayllarni tozalash
├── upload-to-hosting.js         # Media fayllarni hostingga yuklash
│
├── index.tsx                    # React kirish nuqtasi
├── config.ts                    # Video/musiqa konfiguratsiyasi (CDN URL)
├── routes.tsx                   # Sahifa yo'nalishlari
├── upload-server.js             # Express upload server
│
├── pages/                       # React sahifalar
│   ├── main.page.tsx            # Bosh sahifa
│   ├── templates.page.tsx       # Dizayn shablonlar
│   ├── downloader.page.tsx      # Video yuklab olish
│   ├── music.page.tsx           # Musiqalar
│   ├── admin.page.tsx           # Admin panel (video + music upload)
│   └── custom.page.tsx          # Buyurtma sahifa
│
├── telegram-video-bot/          # Telegram Bot + API
│   ├── bot.py                   # Asosiy bot (aiogram v3)
│   ├── api.py                   # FastAPI video API
│   ├── config.py                # Bot sozlamalari
│   ├── downloader.py            # yt-dlp yuklab olish
│   ├── database.py              # SQLite kesh
│   ├── handlers/                # Bot handlerlari
│   └── locales/                 # Tarjimalar (uz, ru, en)
│
└── public/                      # Statik fayllar
    ├── videos/                  # Video fayllar
    ├── image/                   # Rasm fayllar
    ├── music/                   # Musiqa fayllar
    └── logo/                    # Logo fayllar
```

## Hosting

Media fayllar: `https://creative-design.uz/media/`

Yangi media yuklash: `node upload-to-hosting.js`

## Texnologiyalar

- React 19 + TypeScript + Vite
- Express.js (upload server)
- Python aiogram v3 (Telegram bot)
- FastAPI + yt-dlp (video API)
- FTP → sayt.uz hosting
