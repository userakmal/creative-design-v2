import React from "react";
import ReactDOM from "react-dom/client";
import { Routes } from "./routes";
import { config } from "./config";

// ============================================================================
// Type Definitions
// ============================================================================
interface VideoData {
  id?: number;
  title?: string;
  image?: string;
  videoUrl: string;
  [key: string]: unknown;
}

interface MusicData {
  id?: number;
  title?: string;
  duration?: string;
  author?: string;
  url: string;
  [key: string]: unknown;
}

// ============================================================================
// Environment Configuration
// ============================================================================
const Environment = {
  isProduction: window.location.hostname === 'creative-design.uz',
  
  get baseUrl(): string {
    return this.isProduction 
      ? 'https://creative-design.uz' 
      : 'http://localhost:3001';
  },
  
  get timeoutMs(): number {
    return this.isProduction ? 5000 : 3000;
  }
} as const;

// ============================================================================
// Error Boundary for graceful error handling
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
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// Data Fetching Utilities
// ============================================================================
const fetchWithTimeout = async (
  url: string, 
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const fetchVideos = async (): Promise<VideoData[]> => {
  if (!Environment.isProduction) {
    try {
      const response = await fetchWithTimeout(
        `${Environment.baseUrl}/api/videos`, 
        Environment.timeoutMs
      );
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload server videos loaded:', data.length);
        return data;
      }
    } catch {
      console.warn("⚠ Upload server not available for videos");
    }
  }

  try {
    const res = await fetch("/data/videos.json");
    if (res.ok) {
      const data = await res.json();
      console.log('✅ videos.json loaded:', data.length);
      return data;
    }
  } catch {
    console.warn("⚠ Could not load videos.json");
  }

  return [];
};

const fetchMusic = async (): Promise<MusicData[]> => {
  if (!Environment.isProduction) {
    try {
      const response = await fetchWithTimeout(
        `${Environment.baseUrl}/api/music`, 
        Environment.timeoutMs
      );
      if (response.ok) {
        const data = await response.json();
        console.log('🎵 Upload server music loaded:', data.length);
        return data;
      }
    } catch {
      console.warn("⚠ Upload server not available for music");
    }
  }

  try {
    const res = await fetch("/data/music.json");
    if (res.ok) {
      const data = await res.json();
      console.log('🎵 music.json loaded:', data.length);
      return data;
    }
  } catch {
    console.warn("⚠ Could not load music.json");
  }

  return [];
};

// ============================================================================
// URL Rewriting Utilities
// ============================================================================
const rewriteVideoUrls = (videos: VideoData[]): VideoData[] => {
  return videos.map(video => ({
    ...video,
    image: video.image?.startsWith('http') 
      ? video.image 
      : `${Environment.baseUrl}${video.image}`,
    videoUrl: video.videoUrl.startsWith('http') 
      ? video.videoUrl 
      : `${Environment.baseUrl}${video.videoUrl}`,
  }));
};

const rewriteMusicUrls = (music: MusicData[]): MusicData[] => {
  return music.map(track => ({
    ...track,
    url: track.url.startsWith('http') 
      ? track.url 
      : `${Environment.baseUrl}${track.url}`,
  }));
};

// ============================================================================
// Application Initialization
// ============================================================================
const initializeApp = async (): Promise<void> => {
  const [videosData, musicData] = await Promise.allSettled([
    fetchVideos(),
    fetchMusic()
  ]);

  const videos = videosData.status === 'fulfilled' ? videosData.value : [];
  const music = musicData.status === 'fulfilled' ? musicData.value : [];

  if (videos.length > 0) {
    const rewrittenVideos = rewriteVideoUrls(videos);
    // Type assertion: uploaded videos may have partial data
    config.videos.push(...rewrittenVideos as any);
    console.log(`✅ Total videos: ${config.videos.length} (${videos.length} from server)`);
  }

  if (music.length > 0) {
    const rewrittenMusic = rewriteMusicUrls(music);
    // Type assertion: uploaded music may have partial data
    config.music.push(...rewrittenMusic as any);
    console.log(`🎵 Total music: ${config.music.length} (${music.length} from server)`);
  }
};

// ============================================================================
// Render Application
// ============================================================================
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

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
    console.error("❌ Error initializing app:", error);
    // Still render even if data fetching fails
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <Routes />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
