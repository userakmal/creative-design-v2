import React, { useState, useEffect } from "react";
import { LayoutGrid, Star, UploadCloud, Music, Download } from "lucide-react";
import { Header } from "../components/Header";
import { HeroShowcase } from "../components/HeroShowcase";
import { MenuButton } from "../components/MenuButton";
import { TemplatesPage } from "./templates.page";
import { CustomPage } from "./custom.page";
import { MusicPage } from "./music.page";
import type { MenuItem } from "../types";
import { config } from "../config";
import { useNavigate } from "react-router-dom";

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  // Browser Icon va Title ni Configdan yangilash
  useEffect(() => {
    // Favicon yangilash
    const existingFavicon = document.querySelector(
      "link[rel~='icon']"
    ) as HTMLLinkElement;
    if (existingFavicon) {
      existingFavicon.href = config.logoUrl;
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = config.logoUrl;
      document.head.appendChild(link);
    }

    // Apple Icon yangilash
    const existingAppleIcon = document.querySelector(
      "link[rel~='apple-touch-icon']"
    ) as HTMLLinkElement;
    if (existingAppleIcon) {
      existingAppleIcon.href = config.logoUrl;
    } else {
      const link = document.createElement("link");
      link.rel = "apple-touch-icon";
      link.href = config.logoUrl;
      document.head.appendChild(link);
    }

    // Title yangilash
    document.title = config.brandName;
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: "all",
      label: "Hamma Dizaynlar",
      icon: LayoutGrid,
      action: () => navigate("/templates"),
      delayMs: 300,
    },
    {
      id: "popular",
      label: "Ommabop",
      icon: Star,
      action: () => navigate("/popular"),
      delayMs: 400,
    },
    {
      id: "music",
      label: "Muzika tanlash",
      icon: Music,
      action: () => navigate("/music"),
      delayMs: 500,
    },
    {
      id: "upload",
      label: "O‘z rasmlaringiz bilan",
      icon: UploadCloud,
      action: () => navigate("/custom"),
      delayMs: 600,
    },
    {
      id: "downloader",
      label: "Video Downloader",
      icon: Download,
      action: () => navigate("/video-downloader"),
      delayMs: 700,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FDFCF8] flex flex-col relative overflow-y-auto overflow-x-hidden">
      {/* Refined Background Elements */}
      <div className="fixed top-[-20%] right-[-10%] w-[60vh] h-[60vh] bg-amber-100/30 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />
      <div className="fixed bottom-[-10%] left-[-20%] w-[70vh] h-[70vh] bg-rose-50/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />
      <div className="fixed top-[40%] left-[20%] w-[30vh] h-[30vh] bg-stone-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="flex-grow flex flex-col w-full max-w-md mx-auto z-10">
        <div className="w-full flex flex-col items-center min-h-screen pt-2 pb-10 px-5">
          <Header />

          <HeroShowcase />

          <main className="w-full flex flex-col mt-12 max-w-[380px]">
            {menuItems.map((item) => (
              <MenuButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                onClick={item.action}
                delayMs={item.delayMs}
              />
            ))}
          </main>
        </div>
      </div>

      <footer 
        onDoubleClick={() => navigate("/admin")}
        className="w-full text-center py-6 text-[9px] text-stone-300 font-medium tracking-[0.2em] uppercase z-10 cursor-pointer select-none"
        title="Admin uchun ikki marta bosing"
      >
        {config.footerText}
      </footer>
    </div>
  );
};
