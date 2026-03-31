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

// Fetch dynamic videos from the online server JSON before rendering
// Try upload server first (port 3001), then fallback to Vite (port 5173)
const fetchVideos = async () => {
  try {
    // Try upload server first
    const response = await fetch("http://localhost:3001/data/videos.json");
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload server videos loaded:', data.length);
      return data;
    }
  } catch (err) {
    console.log("⚠ Upload server not available, trying Vite...");
  }

  // Fallback to Vite
  try {
    const res = await fetch("/data/videos.json");
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Vite videos loaded:', data.length);
      return data;
    }
  } catch (err) {
    console.error("⚠ Could not load videos from Vite:", err);
  }

  console.log('ℹ️ No additional videos found, using config only');
  return [];
};

// Load videos and render app
fetchVideos()
  .then((data) => {
    if (Array.isArray(data) && data.length > 0) {
      // Rewrite paths to use upload server for uploaded videos
      const rewrittenData = data.map(video => ({
        ...video,
        image: video.image.startsWith('http') ? video.image : `http://localhost:3001${video.image}`,
        videoUrl: video.videoUrl.startsWith('http') ? video.videoUrl : `http://localhost:3001${video.videoUrl}`
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
