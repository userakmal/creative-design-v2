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

// Fetch dynamic videos from the server JSON
const fetchVideos = async () => {
  if (!isProduction) {
    // Local development: try upload server first
    try {
      const response = await fetch("http://localhost:3001/data/videos.json");
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload server videos loaded:', data.length);
        return data;
      }
    } catch (err) {
      console.log("⚠ Upload server not available, trying Vite...");
    }
  }

  // Production or Vite fallback
  try {
    const res = await fetch("/data/videos.json");
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Videos loaded:', data.length);
      return data;
    }
  } catch (err) {
    console.error("⚠ Could not load videos.json:", err);
  }

  console.log('ℹ️ No additional videos found, using config only');
  return [];
};

// Load videos and render app
fetchVideos()
  .then((data) => {
    if (Array.isArray(data) && data.length > 0) {
      // Rewrite relative paths: use CDN in production, localhost in dev
      const baseUrl = isProduction ? CDN_BASE : 'http://localhost:3001';
      const rewrittenData = data.map(video => ({
        ...video,
        image: video.image.startsWith('http') ? video.image : `${baseUrl}${video.image}`,
        videoUrl: video.videoUrl.startsWith('http') ? video.videoUrl : `${baseUrl}${video.videoUrl}`
      }));

      // Append the newly uploaded online videos to the end of the config
      config.videos.push(...rewrittenData);
      console.log('✅ Total videos:', config.videos.length);
    }
    
    // Render the app
    renderApp();
  })
  .catch((err) => {
    console.error("❌ Error loading videos:", err);
    // Render anyway even if videos fail to load
    renderApp();
  });
