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
fetch("/data/videos.json")
  .then((res) => {
    if (res.ok) return res.json();
    return [];
  })
  .then((data) => {
    if (Array.isArray(data) && data.length > 0) {
      // Append the newly uploaded online videos to the end of the config
      config.videos.push(...data);
    }
  })
  .catch((err) => console.error("Could not load dynamic videos:", err))
  .finally(() => {
    renderApp();
  });
