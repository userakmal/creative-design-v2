# Creative Design Platform

Video templates platform with admin dashboard.
React frontend + PHP backend, all in one tree.

## Architecture

- **Frontend** — React + Vite (`client/`). Vite copies `client/public/*`
  into the build output, so the PHP backend ships with the SPA.
- **Backend** — Plain PHP 8 under `client/public/api/`. No Node, no DB.
  JSON file storage in `client/public/data/`.
- **Video downloader** (optional) — Python FastAPI under `api-server/video-downloader/`.
  Doesn't run on shared hosting; deploy to a VPS or skip.

## Local development

```bash
cd client && npm install
npm run dev          # React on http://localhost:5173
```

In dev, the SPA hits `/api/*` (PHP) via the Vite proxy to localhost:3001 —
but the Node upload server is gone, so live uploads in dev need either a
local PHP server (`php -S localhost:3001 -t client/public`) or testing
straight on production.

## Deploy

Push to `main`. GitHub Actions (`.github/workflows/deploy-ftp.yml`) runs
`npm run build` and FTPs `dist/` to the hosting root. The workflow
preserves uploaded media (`videos/`, `image/`, `music/`) and live JSON
(`data/*.json`) on the server so production state isn't clobbered.

After every deploy, smoke-test:

```
https://creative-design.uz/api/health.php
```

## Security notes

- The FTP password lives in `.github/workflows/deploy-ftp.yml`. It's been
  exposed publicly in this repo — **rotate it on the hosting**, add it to
  GitHub Secrets as `FTP_PASSWORD`, and the workflow will pick it up.
- The admin upload password is hard-coded in `client/public/api/_bootstrap.php`
  (`ADMIN_PASSWORD`). Change it before shipping new features.
