import { BrowserRouter, Route, Routes as Switch } from "react-router-dom";
import { MainPage } from "./pages/main.page";
import { TemplatesPage } from "./pages/templates.page";
import { useState } from "react";
import { MusicPage } from "./pages/music.page";
import { CustomPage } from "./pages/custom.page";
import { VideoDownloaderPage } from "./pages/downloader.page";
import { AdminPage } from "./pages/admin.page";

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
      <Switch>
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
        <Route path="/custom" element={<CustomPage />} />
        <Route path="/video-downloader" element={<VideoDownloaderPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Switch>
    </BrowserRouter>
  );
};
