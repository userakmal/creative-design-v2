import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        // Proxy API requests to backend server during development
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
      plugins: [react()],
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
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
