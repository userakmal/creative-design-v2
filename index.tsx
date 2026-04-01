import React from "react";
import ReactDOM from "react-dom/client";
import { Routes } from "./routes";

import { config } from "./config";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const renderApp = () => {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Routes />
    </React.StrictMode>
  );
};

// Detect environment
const isProduction = window.location.hostname === 'creative-design.uz';
const CDN_BASE = 'https://creative-design.uz';
const LOCAL_SERVER = 'http://localhost:3001';

// ============================================================================
// Fetch Dynamic Videos from upload server
// ============================================================================
const fetchVideos = async (): Promise<any[]> => {
  if (!isProduction) {
    try {
      const response = await fetch(`${LOCAL_SERVER}/api/videos`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload server videos loaded:', data.length);
        return data;
      }
    } catch {
      console.log("⚠ Upload server not available for videos");
    }
  }

  // Production or fallback
  try {
    const res = await fetch("/data/videos.json");
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Videos.json loaded:', data.length);
      return data;
    }
  } catch {
    console.log("⚠ Could not load videos.json");
  }

  return [];
};

// ============================================================================
// Fetch Dynamic Music from upload server
// ============================================================================
const fetchMusic = async (): Promise<any[]> => {
  if (!isProduction) {
    try {
      const response = await fetch(`${LOCAL_SERVER}/api/music`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🎵 Upload server music loaded:', data.length);
        return data;
      }
    } catch {
      console.log("⚠ Upload server not available for music");
    }
  }

  // Production or fallback
  try {
    const res = await fetch("/data/music.json");
    if (res.ok) {
      const data = await res.json();
      console.log('🎵 Music.json loaded:', data.length);
      return data;
    }
  } catch {
    console.log("⚠ Could not load music.json");
  }

  return [];
};

// ============================================================================
// Load all data & render
// ============================================================================
Promise.all([fetchVideos(), fetchMusic()])
  .then(([videosData, musicData]) => {
    const baseUrl = isProduction ? CDN_BASE : LOCAL_SERVER;

    // Append uploaded videos
    if (Array.isArray(videosData) && videosData.length > 0) {
      const rewrittenVideos = videosData.map(video => ({
        ...video,
        image: video.image?.startsWith('http') ? video.image : `${baseUrl}${video.image}`,
        videoUrl: video.videoUrl?.startsWith('http') ? video.videoUrl : `${baseUrl}${video.videoUrl}`,
      }));
      config.videos.push(...rewrittenVideos);
      console.log(`✅ Total videos: ${config.videos.length} (${videosData.length} from server)`);
    }

    // Append uploaded music
    if (Array.isArray(musicData) && musicData.length > 0) {
      const rewrittenMusic = musicData.map(track => ({
        ...track,
        url: track.url?.startsWith('http') ? track.url : `${baseUrl}${track.url}`,
      }));
      config.music.push(...rewrittenMusic);
      console.log(`🎵 Total music: ${config.music.length} (${musicData.length} from server)`);
    }

    renderApp();
  })
  .catch((err) => {
    console.error("❌ Error loading data:", err);
    renderApp();
  });
