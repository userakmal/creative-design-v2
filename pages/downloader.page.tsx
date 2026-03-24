import React, { useState } from "react";
import {
  ArrowLeft,
  Download,
  AlertCircle,
  Link2,
  Loader2,
  Video,
  Music,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DownloadResult {
  url: string;
  thumbnail?: string;
  title?: string;
  type: "video" | "audio" | "unknown";
}

export const VideoDownloaderPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);

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
      // Basic URL validation
      new URL(url);
    } catch {
      setError("Iltimos, to'g'ri havola kiriting (https://...)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Agar qilingan havola to'g'ridan-to'g'ri M3U8 bo'lsa, lokal (Node.js) serverga jo'natamiz
      if (url.trim().includes(".m3u8")) {
        try {
          const m3u8Response = await fetch("http://localhost:3001/api/download-m3u8", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url.trim() })
          });

          const m3u8Data = await m3u8Response.json();
          if (!m3u8Response.ok) throw new Error(m3u8Data.error || "M3U8 saqlashda xatolik yuz berdi.");

          setResult({
            url: m3u8Data.url,
            title: "M3U8 Jonli Efir Videos",
            type: "video"
          });
          setIsLoading(false);
          return;
        } catch (err: any) {
          throw new Error("Lokal serverga ulanib bo'lmadi yoki FFmpeg yetishmayapti. Iltimos tekshiring.");
        }
      }

      // Proxy orqali Cobalt serveriga ulanish
      let successData = null;
      let lastError: Error | null = null;

      try {
        const response = await fetch("/api/proxy.php", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            u: btoa(url.trim()),
            q: "1080"
          })
        });

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (err) {
          console.error("Non-JSON response:", responseText);
          let errorSnippet = responseText.substring(0, 100);
          throw new Error(`Server xatosi: ${errorSnippet}... (JSON emas)`);
        }

        if (data.status !== "error") {
          successData = data;
        } else {
          lastError = new Error(data.text || "Yuklab olish imkoni bo'lmadi.");
        }
      } catch (err: any) {
        lastError = err;
      }

      if (!successData) {
        throw new Error(lastError?.message || "Sayt serverida yoki tasdiqlangan API'larda tarmoq muammosi.");
      }

      // Format natijalarni chiqarish
      setResult({
        url: successData.url,
        title: "Yuklab olingan video", 
        type: "video",
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Kutilmagan xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
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
              Instagram, TikTok, YouTube va boshqa ijtimoiy tarmoqlardan
              videolarni havolasi orqali bepul yuklab oling.
            </p>
          </div>
        </div>

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
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100 animate-fadeInUp">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
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
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full py-3.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Video size={18} />
                Videoni yuklab olish
              </a>
              {/* If you add audio support to API, add button here */}
            </div>
          </div>
        )}

        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-2">
            Qanday ishlaydi?
          </p>
          <p className="text-xs text-stone-500 leading-relaxed max-w-[280px] mx-auto">
            Ijtimoiy tarmoqlardagi (Instagram, TikTok, YouTube) videoning havolasini nusxalang, shu yerga tashlang va yuklab oling.
          </p>
        </div>
      </div>
    </div>
  );
};
