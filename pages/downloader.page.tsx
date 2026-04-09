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
  Instagram,
  Edit3,
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
const isLocalhost = window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

// API configuration
// In production: assumes video API is hosted at /api endpoint (proxy or same domain)
// In development: use localhost:8000 (FastAPI server)
const API_BASE = isLocalhost
  ? 'http://localhost:8000' // Development: local Python server
  : '/api-video'; // Production: use relative path (requires nginx proxy to port 8000)

// ============================================================================
// COMPONENT
// ============================================================================

export const VideoDownloaderPage: React.FC = () => {
  const navigate = useNavigate();

  // API is always configured (either localhost or production proxy)
  const isApiAvailable = true;

  const [url, setUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>(isApiAvailable ? "checking" : "offline");
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("best");
  const [selectedMediaType, setSelectedMediaType] = useState<"video" | "audio">("video");
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

      // Auto-fill title
      if (data.title) {
        setVideoTitle(data.title);
      }

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
    setDownloadMessage("⏳ Yuklanmoqda...");

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          quality: selectedQuality,
          type: selectedMediaType, // "video" or "audio"
        }),
        signal: AbortSignal.timeout(300000), // 5 min timeout
      });

      const data: DownloadResult = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Yuklashda xatolik");
      }

      // DIRECT DOWNLOAD - no new window
      if (data.download_type === "file" && data.file_url) {
        setDownloadMessage("✅ Tayyor! Yuklab olish boshlanmoqda...");
        const fileUrl = `${API_BASE}${data.file_url}`;
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = data.filename || "video.mp4";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (data.download_type === "direct" && data.direct_url) {
        setDownloadMessage("✅ Tayyor! Yuklab olish boshlanmoqda...");
        const a = document.createElement("a");
        a.href = data.direct_url;
        a.download = data.filename || "video.mp4";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 animate-fade-in pb-10 max-w-md mx-auto">
      {/* Header - Instagram Reels Style */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-purple-900/95 via-pink-800/95 to-orange-700/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between mb-2 shadow-lg border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Instagram size={22} className="text-pink-300" />
            <h2 className="text-lg font-bold text-white">
              Reels Downloader
            </h2>
          </div>
        </div>

        <button
          onClick={checkServer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-95 ${
            serverStatus === "online"
              ? "bg-green-500/20 text-green-300 border border-green-400/30"
              : serverStatus === "offline"
              ? "bg-red-500/20 text-red-300 border border-red-400/30"
              : "bg-white/10 text-white/60 border border-white/20 animate-pulse"
          }`}
        >
          {serverStatus === "online" && <Wifi size={12} />}
          {serverStatus === "offline" && <WifiOff size={12} />}
          {serverStatus === "checking" && <Loader2 size={12} className="animate-spin" />}
          {serverStatus === "online" ? "Online" : serverStatus === "offline" ? "Offline" : "..."}
        </button>
      </div>

      <div className="px-5 mt-6">
        {/* Info Card - Instagram Style */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-lg mb-6 flex gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
            <Download size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm mb-1">
              Instagram Reels Video Downloader
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Instagram Reels, YouTube, TikTok va boshqa platformalardan yuqori sifatli video yuklab oling.
            </p>
          </div>
        </div>

        {/* Server Offline Warning */}
        {serverStatus === "offline" && (
          <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-md rounded-2xl border border-red-400/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <WifiOff size={18} className="text-red-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-200 mb-1">
                  {!isApiAvailable
                    ? "Video downloader hozircha ishlamayapti"
                    : "Server ishlamayapti"}
                </p>
                <p className="text-xs text-red-300/90 leading-relaxed">
                  {!isApiAvailable
                    ? "Video downloader faqat development rejimida ishlaydi"
                    : "Video API serverni ishga tushiring"}
                </p>
                {isApiAvailable && (
                  <button
                    onClick={checkServer}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/30 hover:bg-red-500/40 text-red-200 rounded-lg text-xs font-bold transition-colors"
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
              <Link2 size={18} className="text-white/60" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/... yoki https://youtube.com/watch?v=..."
              className="w-full pl-11 pr-20 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute inset-y-2 right-2 px-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-xs font-bold transition-colors"
            >
              Paste
            </button>
          </div>

          {/* Video Title Input (shown after extraction) */}
          {extractResult && (
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Edit3 size={16} className="text-white/60" />
              </div>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Video nomi..."
                className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 transition-all shadow-inner"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-md text-red-200 rounded-xl text-xs flex items-start gap-2 border border-red-400/30 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {downloadMessage && (
            <div className="mb-4 p-3 bg-green-500/20 backdrop-blur-md text-green-200 rounded-xl text-xs flex items-start gap-2 border border-green-400/30 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{downloadMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isExtracting || !url.trim() || serverStatus === "offline"}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 focus:ring-4 focus:ring-pink-400/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]"
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden animate-fade-in-up">
            {/* Video Info Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex gap-3">
                {extractResult.thumbnail && (
                  <img
                    src={extractResult.thumbnail}
                    alt={extractResult.title}
                    className="w-20 h-14 rounded-lg object-cover shrink-0 border border-white/20"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">
                    {extractResult.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/70">
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
              {/* Video/Audio Type Selection */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">
                  Format:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMediaType("video")}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      selectedMediaType === "video"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 border-pink-400 text-white shadow-lg"
                        : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Video size={16} />
                      <span>Video</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMediaType("audio")}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      selectedMediaType === "audio"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 border-pink-400 text-white shadow-lg"
                        : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Film size={16} />
                      <span>Audio (MP3)</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quality Selection (only for video) */}
              {selectedMediaType === "video" && extractResult.formats.length > 1 && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">
                    Video sifati:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {extractResult.formats.map((fmt) => (
                      <button
                        key={fmt.format_id}
                        type="button"
                        onClick={() => setSelectedQuality(fmt.quality)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          selectedQuality === fmt.quality
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 border-pink-400 text-white shadow-lg"
                            : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Film size={14} />
                          <span>{fmt.quality}</span>
                        </div>
                        <div className="text-[10px] text-white/50 mt-1">
                          {fmt.filesize_formatted}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70 active:scale-[0.98]"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    {selectedMediaType === "video"
                      ? (selectedQuality === "best" ? "Video yuklash" : `${selectedQuality} da yuklash`)
                      : "Audio (MP3) yuklash"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-2">
            Qanday ishlaydi?
          </p>
          <p className="text-xs text-white/60 leading-relaxed max-w-[280px] mx-auto">
            Ijtimoiy tarmoqlardan video linkini nusxalab, shu yerga joylang va yuklab oling.
            Instagram Reels, YouTube, TikTok va 1000+ saytlar qo'llab-quvvatlanadi.
          </p>
        </div>
      </div>
    </div>
  );
};
