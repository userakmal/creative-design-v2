import { BrowserRouter, Route, Routes as Switch, useLocation } from "react-router-dom";
import React, { useState, Suspense, useEffect } from "react";
import { MainPage } from "./pages/main.page";

// Lazy loading large components to optimize main bundle size
const TemplatesPage = React.lazy(() => import("./pages/templates.page").then(m => ({ default: m.TemplatesPage })));
const MusicPage = React.lazy(() => import("./pages/music.page").then(m => ({ default: m.MusicPage })));
const CustomPage = React.lazy(() => import("./pages/custom.page").then(m => ({ default: m.CustomPage })));
const VideoDownloaderPage = React.lazy(() => import("./pages/downloader.page").then(m => ({ default: m.VideoDownloaderPage })));
const AdminPage = React.lazy(() => import("./pages/admin.page").then(m => ({ default: m.AdminPage })));
const WebsitesPage = React.lazy(() => import("./pages/websites.page").then(m => ({ default: m.WebsitesPage })));

const LoadingSpinnerFallback = () => (
  <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
    Yuklanmoqda...
  </div>
);

// Har safar sahifa o'zgarganda scrollni tepaga qaytarish uchun komponent
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const Routes = () => {
  const [likedVideos, setLikedVideos] = useState<number[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("likedVideos");
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch (e) {
      console.error("Error reading from localStorage", e);
      return [];
    }
  });

  const toggleLike = (id: number) => {
    setLikedVideos((prev) => {
      const newLikes = prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id];

      try {
        localStorage.setItem("likedVideos", JSON.stringify(newLikes));
      } catch (e) {
        console.error("Error saving to localStorage", e);
      }
      return newLikes;
    });
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinnerFallback />}>
        <Switch>
          {/* Dashboard is eagerly loaded for fastest Time To Interactive */}
          <Route path="/" element={<MainPage />} />
          <Route
            path="/templates"
            element={
              <TemplatesPage
                title="Hamma Dizaynlar"
                filter="all"
                likedVideos={likedVideos}
                onToggleLike={toggleLike}
              />
            }
          />
          <Route
            path="/popular"
            element={
              <TemplatesPage
                title="Ommabop Dizaynlar"
                filter="popular"
                likedVideos={likedVideos}
                onToggleLike={toggleLike}
              />
            }
          />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/websites" element={<WebsitesPage />} />
          <Route path="/custom" element={<CustomPage />} />
          <Route path="/video-downloader" element={<VideoDownloaderPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
};
