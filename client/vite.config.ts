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
