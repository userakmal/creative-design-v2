# Creative Design Platform

Video templates platform with admin dashboard.
React frontend + PHP backend on shared hosting.

## Architecture

- **Frontend** — React + Vite (`client/`). Build artifacts deploy to hosting `public_html/`.
- **Backend** — Plain PHP 8 on shared hosting (`php-backend/`). No Node, no DB. JSON file storage.
- **Video downloader** (optional) — Python FastAPI under `api-server/video-downloader/`.
  Does NOT run on shared hosting; deploy to a VPS or skip.

## Local development

```bash
npm install --prefix client
npm run dev          # React on http://localhost:5173
```

The admin panel and templates page detect the host and use the right backend:
- On `localhost` → expects Node upload server on `:3001` (removed; restore from git
  history if you need local upload testing).
- On `creative-design.uz` → calls `/api/*.php`.

## Deploy

See `php-backend/DEPLOY.md` for the full hosting setup.

Short version:
1. `npm run build` → produces `client/dist/`
2. Upload `client/dist/*` contents to hosting `public_html/`
3. Upload `php-backend/*` contents to hosting `public_html/`
4. Set CHMOD 0775 on `videos/`, `image/`, `music/`, `data/`
5. Change `ADMIN_PASSWORD` in `api/_bootstrap.php`
6. Visit `https://creative-design.uz/api/health.php` to verify
