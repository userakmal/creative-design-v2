import React from "react";
import ReactDOM from "react-dom/client";
import { Routes } from "./routes";
import { config, type VideoItem, type MusicItem } from "./config";

// ============================================================================
// TYPE DEFINITIONS (for uploaded content)
// ============================================================================

interface UploadedVideo {
  id?: number;
  title?: string;
  image?: string;
  videoUrl: string;
  uploadedAt?: string;
  size?: string;
  [key: string]: unknown;
}

interface UploadedMusic {
  id?: number;
  title?: string;
  author?: string;
  duration?: string;
  url: string;
  uploadedAt?: string;
  size?: string;
  [key: string]: unknown;
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const Environment = {
  isProduction: window.location.hostname === 'creative-design.uz',

  get cdnUrl(): string {
    // LOCAL: Use localhost for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001'; // Upload server
    }
    // PRODUCTION: Use CDN
    return 'https://creative-design.uz';
  },

  get timeoutMs(): number {
    return this.isProduction ? 5000 : 3000;
  }
} as const;

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAF9F6',
          padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', marginBottom: '0.5rem', color: '#1c1917' }}>
              Xatolik yuz berdi
            </h1>
            <p style={{ color: '#78716c', marginBottom: '1.5rem', fontSize: '14px' }}>
              {this.state.error?.message || "Noma'lum xatolik"}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#1c1917',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Sahifani yangilash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// DATA FETCHING UTILITIES
// ============================================================================

/**
 * Fetch JSON from URL with timeout and error handling
 */
async function fetchJSON<T>(url: string, timeout: number): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[fetchJSON] ${url} returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`[fetchJSON] ✅ Loaded from ${url}`, Array.isArray(data) ? `${data.length} items` : 'data');
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[fetchJSON] ❌ Failed to fetch ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Ensure URL is absolute
 * - If already starts with http/https, return as-is
 * - Otherwise, prepend the CDN base URL
 */
function ensureAbsoluteUrl(path: string | undefined, baseUrl: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Handle both /path and path formats
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Transform uploaded video data to match VideoItem interface
 */
function normalizeUploadedVideo(video: UploadedVideo, cdnUrl: string): VideoItem | null {
  if (!video.videoUrl) return null;

  return {
    id: video.id || 0,
    title: video.title || `Video #${video.id || 'unknown'}`,
    image: ensureAbsoluteUrl(video.image, cdnUrl),
    videoUrl: ensureAbsoluteUrl(video.videoUrl, cdnUrl),
    uploadedAt: video.uploadedAt,
    size: video.size,
    isUploaded: true,
  };
}

/**
 * Transform uploaded music data to match MusicItem interface
 */
function normalizeUploadedMusic(music: UploadedMusic, cdnUrl: string): MusicItem | null {
  if (!music.url) return null;

  return {
    id: music.id || 0,
    title: music.title || `Track #${music.id || 'unknown'}`,
    author: music.author || "Noma'lum",
    duration: music.duration || "0:00",
    url: ensureAbsoluteUrl(music.url, cdnUrl),
    uploadedAt: music.uploadedAt,
    size: music.size,
    isUploaded: true,
  };
}

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load uploaded videos from videos.json
 * This file is updated by upload-server.js and synced via FTP
 */
async function loadUploadedVideos(): Promise<VideoItem[]> {
  const url = '/data/videos.json';
  const data = await fetchJSON<UploadedVideo[]>(url, Environment.timeoutMs);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data
    .map(video => normalizeUploadedVideo(video, Environment.cdnUrl))
    .filter((v): v is VideoItem => v !== null);
}

/**
 * Load uploaded music from music.json
 * This file is updated by upload-server.js and synced via FTP
 */
async function loadUploadedMusic(): Promise<MusicItem[]> {
  const url = '/data/music.json';
  const data = await fetchJSON<UploadedMusic[]>(url, Environment.timeoutMs);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data
    .map(music => normalizeUploadedMusic(music, Environment.cdnUrl))
    .filter((m): m is MusicItem => m !== null);
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

async function initializeApp(): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Creative Design Platform - Initializing');
  console.log('═══════════════════════════════════════════');
  console.log('📍 Environment:', Environment.isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
  console.log('🌐 CDN URL:', Environment.cdnUrl);

  // Load uploaded content in parallel
  const [uploadedVideos, uploadedMusic] = await Promise.all([
    loadUploadedVideos(),
    loadUploadedMusic(),
  ]);

  console.log('');
  console.log('📊 Content Summary:');
  console.log('  📹 Built-in videos:', config.videos.length);
  console.log('  📤 Uploaded videos:', uploadedVideos.length);
  console.log('  🎵 Built-in music:', config.music.length);
  console.log('  📤 Uploaded music:', uploadedMusic.length);

  // Merge uploaded content with config
  if (uploadedVideos.length > 0) {
    config.videos.push(...uploadedVideos);
    console.log('  ✅ Videos merged successfully');
  }

  if (uploadedMusic.length > 0) {
    config.music.push(...uploadedMusic);
    console.log('  ✅ Music merged successfully');
  }

  console.log('');
  console.log('📈 Final Counts:');
  console.log('  📹 Total videos:', config.videos.length);
  console.log('  🎵 Total music:', config.music.length);
  console.log('═══════════════════════════════════════════');
  console.log('');
}

// ============================================================================
// RENDER APPLICATION
// ============================================================================

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize data then render
initializeApp()
  .then(() => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <Routes />
        </ErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error("[initializeApp] Fatal error:", error);
    // Still render even if data loading fails
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <Routes />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
