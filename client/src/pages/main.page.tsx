import React, { useEffect } from "react";
import { LayoutGrid, Star, UploadCloud, Music, Download, Globe } from "lucide-react";
import { Header } from "../components/Header";
import { HeroShowcase } from "../components/HeroShowcase";
import { MenuButton } from "../components/MenuButton";
import type { MenuItem } from "../types";
import { config } from "../config";
import { useNavigate } from "react-router-dom";

// WhatsApp SVG icon (lucide-react da yo'q)
const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// YouTube SVG icon (lucide-react dagi ko'rinishi yaxshiroq)
const YouTubeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

// Telegram SVG icon
const TelegramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
);

// Instagram SVG icon
const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const socialLinks = [
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/Creative_DesignUz",
    icon: TelegramIcon,
    hoverColor: "hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9]/30 hover:shadow-[0_8px_25px_-5px_rgba(34,158,217,0.4)]",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/creative_designuz/",
    icon: InstagramIcon,
    hoverColor: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-[#dc2743]/30 hover:shadow-[0_8px_25px_-5px_rgba(220,39,67,0.4)]",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@Creative_designuz",
    icon: YouTubeIcon,
    hoverColor: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]/30 hover:shadow-[0_8px_25px_-5px_rgba(255,0,0,0.4)]",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://wa.me/998888000480",
    icon: WhatsAppIcon,
    hoverColor: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]/30 hover:shadow-[0_8px_25px_-5px_rgba(37,211,102,0.4)]",
  },
];

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
      id: "websites",
      label: "webSitelik taklifnomalar",
      icon: Globe,
      action: () => navigate("/websites"),
      delayMs: 450,
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
      label: "O'z rasmlaringiz bilan",
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
      {/* Refined Background Elements — static, GPU-isolated */}
      <div className="fixed top-[-20%] right-[-10%] w-[60vh] h-[60vh] rounded-full -z-10 bg-blur-static" style={{ background: 'rgba(254, 243, 199, 0.3)', filter: 'blur(64px)' }} aria-hidden="true" />
      <div className="fixed bottom-[-10%] left-[-20%] w-[70vh] h-[70vh] rounded-full -z-10 bg-blur-static" style={{ background: 'rgba(255, 228, 230, 0.4)', filter: 'blur(64px)' }} aria-hidden="true" />
      <div className="fixed top-[40%] left-[20%] w-[30vh] h-[30vh] rounded-full -z-10 bg-blur-static" style={{ background: 'rgba(245, 245, 244, 0.6)', filter: 'blur(64px)' }} aria-hidden="true" />

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
        className="w-full flex flex-col items-center py-8 z-10 "
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          {socialLinks.map((social) => {
            const IconComponent = social.icon;
            return (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.label}
                className={`
                  w-10 h-10 flex items-center justify-center rounded-xl
                  bg-white/90 backdrop-blur-sm
                  text-stone-400 border border-stone-200/60
                  transition-all duration-500 ease-out
                  active:scale-95
                  ${social.hoverColor}
                `}
              >
                <IconComponent size={18} />
              </a>
            );
          })}
        </div>
        <div className="text-[10px] text-stone-500 font-medium tracking-[0.2em] uppercase">
          {config.footerText}
        </div>
      </footer>
    </div>
  );
};

