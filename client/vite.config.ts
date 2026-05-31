import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Auto-copy webSites folder to public directory for static serving
try {
  const srcDir = path.resolve(__dirname, '..', 'webSites');
  const destDir = path.resolve(__dirname, 'public', 'webSites');
  // Refreshing copy logic...
  
  function copyDirectorySync(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirectorySync(srcPath, destPath);
      } else {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }
  
  if (fs.existsSync(srcDir)) {
    copyDirectorySync(srcDir, destDir);
    console.log('✅ Successfully copied webSites to public/webSites');
  }
} catch (error) {
  console.error('❌ Failed to copy webSites directory:', error);
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/api-video': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-video/, '/api'),
          },
          '/videos': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/image': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/music': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/data': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      plugins: [
        react(),
        {
          name: 'copy-index-html-for-routes',
          closeBundle() {
            const distDir = path.resolve(__dirname, '../dist');
            const indexHtml = path.join(distDir, 'index.html');
            if (fs.existsSync(indexHtml)) {
              const routesWithDirs = ['optom_gulbozor', 'music'];
              routesWithDirs.forEach(route => {
                const routeDir = path.join(distDir, route);
                if (!fs.existsSync(routeDir)) {
                  fs.mkdirSync(routeDir, { recursive: true });
                }
                fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'));
                console.log(`✅ Copied index.html to ${route}/index.html`);
              });

              // /websites — Telegram'da link UMUMAN preview qilmasin (na rasm, na sarlavha, na tavsif).
              // Telegram faqat statik HTML'ni o'qiydi: og/twitter teglar, <title> va meta description
              // bo'lmasa, preview kartochkasi qurilmaydi. Sahifa nomi brauzerda React orqali qo'yiladi
              // (websites.page.tsx → document.title). Asosiy index.html ga tegmaymiz.
              let websitesHtml = fs.readFileSync(indexHtml, 'utf-8');
              websitesHtml = websitesHtml
                // Barcha Open Graph / Twitter meta teglarini olib tashlash
                .replace(/\s*<meta property="og:[^"]*"[^>]*\/?>/g, '')
                .replace(/\s*<meta property="twitter:[^"]*"[^>]*\/?>/g, '')
                // <title> va meta description — Telegram bularni preview sarlavhasi sifatida ishlatadi
                .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
                .replace(/\s*<meta name="description"[^>]*\/?>/g, '')
                // JSON-LD (Telegram o'qimaydi, lekin keraksiz) — butunlay olib tashlash
                .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/i, '')
                // canonical'ni /websites ga moslash (SEO uchun)
                .replace(/https:\/\/creative-design\.uz\/"/g, 'https://creative-design.uz/websites"');
              const websitesDir = path.join(distDir, 'websites');
              if (!fs.existsSync(websitesDir)) {
                fs.mkdirSync(websitesDir, { recursive: true });
              }
              fs.writeFileSync(path.join(websitesDir, 'index.html'), websitesHtml);
              console.log('✅ Generated websites/index.html (preview meta butunlay olib tashlandi)');
            }
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      },
      // Serve static files from public directory
      publicDir: 'public',
      build: {
        outDir: '../dist',
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        sourcemap: false,
        cssCodeSplit: true,
        chunkSizeWarningLimit: 500,
        modulePreload: {
          polyfill: false, // Modern browsers only — polyfill kerak emas
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              // React + ReactDOM + Scheduler — bitta chunkda bo'lishi SHART
              if (id.includes('react') && id.includes('node_modules') && !id.includes('react-router')) {
                return 'react-vendor';
              }
              // Router alohida chunk
              if (id.includes('react-router')) return 'router';
              // Lucide icons — katta kutubxona, alohida chunk
              if (id.includes('lucide-react')) return 'icons';
              // Boshqa vendor paketlar
              if (id.includes('node_modules')) return 'vendor';
            }
          }
        },
        assetsInlineLimit: 4096,
      }
    };
});
