import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  AlertCircle,
  Link2,
  Loader2,
  Video,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DownloadResult {
  url: string;
  thumbnail?: string;
  title?: string;
  type: "video" | "audio" | "unknown";
  isM3U8?: boolean;
}

// API manzillari: avval lokal, keyin tunnel
const API_ENDPOINTS = [
  "http://localhost:3000/api/download",
  "https://creative-video-api.loca.lt/api/download",
];

// Tez ulanish tekshiruvi
const checkEndpoint = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url.replace("/api/download", ""), {
      method: "HEAD",
      signal: controller.signal,
      headers: { "Bypass-Tunnel-Reminder": "true" },
    });
    clearTimeout(timeoutId);
    return res.ok || res.status === 404; // 404 is ok — server is alive, just no GET route
  } catch {
    return false;
  }
};

export const VideoDownloaderPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Videoni to'g'ridan-to'g'ri yuklab olish (yangi oyna ochmasdan)
  const triggerDownload = async (videoUrl: string, title: string) => {
    // M3U8 stream ni ochish (yuklab bo'lmaydi)
    if (videoUrl.includes('.m3u8')) {
      window.open(videoUrl, '_blank');
      return;
    }
    
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title || 'video'}.mp4`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Tozalash
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      // CORS xatolik bo'lsa — fallback: oyna ochish
      console.log("Blob download failed, fallback to link:", err);
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${title || 'video'}.mp4`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
    } finally {
      setIsDownloading(false);
    }
  };

  // Server holatini tekshirish
  const checkServerStatus = async () => {
    setServerStatus("checking");
    for (const endpoint of API_ENDPOINTS) {
      const isAlive = await checkEndpoint(endpoint);
      if (isAlive) {
        setActiveEndpoint(endpoint);
        setServerStatus("online");
        return;
      }
    }
    setActiveEndpoint(null);
    setServerStatus("offline");
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.log("Failed to read clipboard");
    }
  };

  const downloadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Iltimos, havolani kiriting");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Iltimos, to'g'ri havola kiriting (https://...)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Barcha endpointlarni sinash
    let lastError = "";
    const endpointsToTry = activeEndpoint
      ? [activeEndpoint, ...API_ENDPOINTS.filter((e) => e !== activeEndpoint)]
      : API_ENDPOINTS;

    for (const endpoint of endpointsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true",
          },
          body: JSON.stringify({ url: url.trim() }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Non-JSON response from", endpoint, responseText.substring(0, 200));
          lastError = "Server javob bermadi. Qayta urinib ko'ring.";
          continue; // Keyingi endpoint ga o'tish
        }

        if (data.status === "success" && data.data?.url) {
          setActiveEndpoint(endpoint); // Ishlaganni eslab qolish
          setServerStatus("online");
          setResult({
            url: data.data.url,
            title: data.data.title || "Yuklab olingan video",
            type: "video",
            isM3U8: data.data.isM3U8 || false,
          });
          setIsLoading(false);
          return; // Muvaffaqiyat!
        } else {
          lastError = data.text || "Video topilmadi. Havolani tekshirib qayta urinib ko'ring.";
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          lastError = "So'rov vaqti tugadi. Internet aloqangizni tekshiring.";
        } else {
          lastError = err.message || "Server bilan bog'lanib bo'lmadi.";
        }
        continue;
      }
    }

    // Hech bir endpoint ishlamadi
    setError(lastError || "Server ishlamayapti. Serverni yoqib qayta urinib ko'ring.");
    setServerStatus("offline");
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-cream animate-fade-in pb-10 max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAF9F6]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between mb-2 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-serif font-medium text-stone-800">
            Video Downloader
          </h2>
        </div>

        {/* Server Status Indicator */}
        <button
          onClick={checkServerStatus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-95 ${
            serverStatus === "online"
              ? "bg-green-50 text-green-600 border border-green-100"
              : serverStatus === "offline"
              ? "bg-red-50 text-red-500 border border-red-100"
              : "bg-stone-50 text-stone-400 border border-stone-100 animate-pulse"
          }`}
        >
          {serverStatus === "online" && <Wifi size={12} />}
          {serverStatus === "offline" && <WifiOff size={12} />}
          {serverStatus === "checking" && <Loader2 size={12} className="animate-spin" />}
          {serverStatus === "online" ? "Server ON" : serverStatus === "offline" ? "Server OFF" : "Tekshirilmoqda"}
        </button>
      </div>

      <div className="px-5 mt-6">
        {/* Info Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm mb-6 flex gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shrink-0">
            <Download size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 text-sm mb-1">
              Istagan videoni yuklang
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Instagram, TikTok, YouTube, M3U8 streamlar va boshqa
              platformalardan videolarni havolasi orqali bepul yuklab oling.
              Barcha cheklovlardan avtomatik o'tadi.
            </p>
          </div>
        </div>

        {/* Server Offline Warning */}
        {serverStatus === "offline" && (
          <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-fade-in">
            <div className="flex items-start gap-3">
              <WifiOff size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Server ishlamayapti</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Video serverini yoqish uchun <b>Serverni_Yoqish.bat</b> faylini ishga tushiring.
                </p>
                <button
                  onClick={checkServerStatus}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw size={12} />
                  Qayta tekshirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Downloader Form */}
        <form onSubmit={downloadVideo} className="mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Link2 size={18} className="text-stone-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full pl-11 pr-20 py-4 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-stone-700 placeholder:text-stone-300 shadow-inner"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute inset-y-2 right-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-medium transition-colors"
            >
              Paste
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-100 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => { setError(null); downloadVideo(new Event("submit") as any); }}
                  className="mt-2 flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
                >
                  <RefreshCw size={12} />
                  Qayta urinish
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full py-4 bg-[#229ED9] text-white rounded-xl font-medium text-sm hover:bg-[#1c81b4] focus:ring-4 focus:ring-blue-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_rgba(34,158,217,0.3)] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Qidirilmoqda...
              </>
            ) : (
              <>
                <Download size={18} />
                Videoni izlash
              </>
            )}
          </button>
        </form>

        {/* Result Area */}
        {result && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-stone-800 text-sm truncate">
                  {result.title || "Video topildi"}
                </h4>
                <p className="text-xs text-stone-500">Yuklab olishga tayyor</p>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              {result.isM3U8 && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-700 mb-1">
                  ⚡ M3U8 stream — VLC yoki brauzerda ochish mumkin
                </div>
              )}
              <button
                onClick={() => triggerDownload(result.url, result.title || 'video')}
                disabled={isDownloading}
                className="w-full py-3.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    {result.isM3U8 ? "Streamni ochish" : "Videoni yuklab olish"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-2">
            Qanday ishlaydi?
          </p>
          <p className="text-xs text-stone-500 leading-relaxed max-w-[280px] mx-auto">
            Ijtimoiy tarmoqlardagi videoning havolasini yoki M3U8 stream URL ni nusxalang, shu yerga tashlang va yuklab oling. Geo va SSL cheklovlardan avtomatik o'tadi.
          </p>
        </div>
      </div>
    </div>
  );
};
