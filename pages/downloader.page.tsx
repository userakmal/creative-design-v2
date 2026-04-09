/**
 * Video Downloader Page
 * Uses FastAPI backend at localhost:8000 for video extraction and download.
 */

import React, { useState, useEffect, useCallback } from "react";
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
  Clock,
  User,
  Film,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ============================================================================
// TYPES
// ============================================================================

interface FormatInfo {
  format_id: string;
  quality: string;
  height: number | null;
  filesize: number | null;
  filesize_formatted: string;
  ext: string;
}

interface ExtractResult {
  success: boolean;
  title: string;
  thumbnail: string | null;
  duration: number | null;
  duration_formatted: string;
  uploader: string | null;
  formats: FormatInfo[];
  is_live: boolean;
}

interface DownloadResult {
  success: boolean;
  download_type: "direct" | "file";
  direct_url?: string;
  file_path?: string;
  filename?: string;
  file_url?: string;
  message: string;
}

type ServerStatus = "checking" | "online" | "offline";

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

// Detect environment and set API base URL
const isProduction = window.location.hostname === 'creative-design.uz';

// In production, video downloader may not work (needs Python backend)
// In development, use localhost:8000
const API_BASE = isProduction 
  ? '' // Production: disable or configure proxy
  : 'http://localhost:8000'; // Development: use local Python server

// ============================================================================
// COMPONENT
// ============================================================================

export const VideoDownloaderPage: React.FC = () => {
  const navigate = useNavigate();

  // Check if API is available
  const isApiAvailable = API_BASE !== '';

  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>(isApiAvailable ? "checking" : "offline");
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("best");
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  // ============================================================================
  // SERVER CHECK
  // ============================================================================

  const checkServer = useCallback(async () => {
    if (!isApiAvailable) {
      setServerStatus("offline");
      return;
    }
    
    setServerStatus("checking");
    try {
      const res = await fetch(`${API_BASE}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch {
      setServerStatus("offline");
    }
  }, [isApiAvailable]);

  useEffect(() => {
    checkServer();
  }, [checkServer]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.warn("Clipboard failed:", err);
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isApiAvailable) {
      setError("Video downloader hozircha ishlamayapti. Iltimos, keyinroq urinib ko'ring.");
      return;
    }

    if (!url.trim()) {
      setError("Link kiriting");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("To'g'ri URL kiriting (https://...)");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractResult(null);
    setDownloadMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: AbortSignal.timeout(120000), // 2 min timeout
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Xatolik yuz berdi");
      }

      setExtractResult(data);

      // Auto-select best quality
      if (data.formats && data.formats.length > 0) {
        const bestFormat = data.formats[data.formats.length - 1];
        setSelectedQuality(bestFormat.quality);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        setError("Ulanish vaqti tugadi. Internet va serverni tekshiring.");
      } else {
        setError(err.message || "Video ma'lumotlarini olishda xatolik");
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim() || !isApiAvailable) return;

    setIsDownloading(true);
    setError(null);
    setDownloadMessage("⏳ Video yuklanmoqda...");

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          quality: selectedQuality,
        }),
        signal: AbortSignal.timeout(300000), // 5 min timeout
      });

      const data: DownloadResult = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Yuklashda xatolik");
      }

      if (data.download_type === "direct" && data.direct_url) {
        // Direct URL — open in new tab for browser download
        setDownloadMessage("✅ To'g'ridan-to'g'ri yuklash boshlanmoqda...");
        window.open(data.direct_url, "_blank");
      } else if (data.download_type === "file" && data.file_url) {
        // File served from our API
        setDownloadMessage("✅ Video tayyor! Yuklab olish boshlanmoqda...");

        const fileUrl = `${API_BASE}${data.file_url}`;
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = data.filename || "video.mp4";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setDownloadMessage("✅ " + data.message);
      }

      // Clear message after delay
      setTimeout(() => setDownloadMessage(null), 5000);
    } catch (err: any) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        setError("Yuklab olish vaqti tugadi. Kichikroq sifat tanlang.");
      } else {
        setError(err.message || "Yuklashda xatolik");
      }
      setDownloadMessage(null);
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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

        <button
          onClick={checkServer}
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
          {serverStatus === "online" ? "Online" : serverStatus === "offline" ? "Offline" : "..."}
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
              Video Yuklab Olish
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              YouTube, Instagram, TikTok va boshqa platformalardan bepul video yuklab oling.
            </p>
          </div>
        </div>

        {/* Server Offline Warning */}
        {serverStatus === "offline" && (
          <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-fade-in">
            <div className="flex items-start gap-3">
              <WifiOff size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  {!isApiAvailable 
                    ? "Video downloader hozircha ishlamayapti" 
                    : "Server ishlamayapti"}
                </p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  {!isApiAvailable 
                    ? "Video downloader faqat development rejimida ishlaydi" 
                    : "Video API serverni ishga tushiring"}
                </p>
                {isApiAvailable && (
                  <button
                    onClick={checkServer}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <RefreshCw size={12} />
                    Qayta tekshirish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleExtract} className="mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Link2 size={18} className="text-stone-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
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
              <span>{error}</span>
            </div>
          )}

          {downloadMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-xs flex items-start gap-2 border border-green-100 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{downloadMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isExtracting || !url.trim() || serverStatus === "offline"}
            className="w-full py-4 bg-[#229ED9] text-white rounded-xl font-medium text-sm hover:bg-[#1c81b4] focus:ring-4 focus:ring-blue-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_rgba(34,158,217,0.3)] active:scale-[0.98]"
          >
            {isExtracting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Qidirilmoqda...
              </>
            ) : (
              <>
                <Download size={18} />
                Video Qidirish
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {extractResult && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden animate-fade-in-up">
            {/* Video Info Header */}
            <div className="p-4 border-b border-stone-100">
              <div className="flex gap-3">
                {extractResult.thumbnail && (
                  <img
                    src={extractResult.thumbnail}
                    alt={extractResult.title}
                    className="w-20 h-14 rounded-lg object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-stone-800 text-sm leading-tight line-clamp-2">
                    {extractResult.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-500">
                    {extractResult.uploader && (
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {extractResult.uploader}
                      </span>
                    )}
                    {extractResult.duration_formatted && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {extractResult.duration_formatted}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Selection */}
            <div className="p-4">
              {extractResult.formats.length > 1 && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                    Sifat tanlang:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {extractResult.formats.map((fmt) => (
                      <button
                        key={fmt.format_id}
                        onClick={() => setSelectedQuality(fmt.quality)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          selectedQuality === fmt.quality
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-stone-50 border-stone-100 text-stone-600 hover:border-stone-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Film size={14} />
                          <span>{fmt.quality}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1">
                          {fmt.filesize_formatted}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-3.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70 active:scale-[0.98]"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    {selectedQuality === "best" ? "Eng yaxshi sifatda yuklash" : `${selectedQuality} da yuklash`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-2">
            Qanday ishlaydi?
          </p>
          <p className="text-xs text-stone-500 leading-relaxed max-w-[280px] mx-auto">
            Ijtimoiy tarmoqlardan video linkini nusxalab, shu yerga joylang va yuklab oling.
            YouTube, Instagram, TikTok va 1000+ saytlar qo'llab-quvvatlanadi.
          </p>
        </div>
      </div>
    </div>
  );
};
