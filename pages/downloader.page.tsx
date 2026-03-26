/**
 * Video Downloader Page - Senior-level Refactored Version
 * Improved TypeScript, error handling, and state management
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VideoFormat {
  format_id: string;
  extension: string;
  resolution: string;
  filesize: number | null;
  quality: string;
  tbr?: number;
}

interface VideoData {
  title: string;
  url: string;
  thumbnail?: string | null;
  type: string;
  duration?: number;
  formats?: VideoFormat[];
  isM3U8?: boolean;
}

interface DownloadProgress {
  status: "starting" | "downloading" | "completed" | "error" | "cancelled";
  percent: number;
  size?: string;
  speed?: string;
  eta?: string;
  message?: string;
}

type ServerStatus = "checking" | "online" | "offline";

interface ApiEndpoint {
  url: string;
  priority: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_ENDPOINTS: ApiEndpoint[] = [
  { url: "http://localhost:3000/api/download", priority: 1 },
  { url: "https://creative-video-api.loca.lt/api/download", priority: 2 },
];

const REQUEST_TIMEOUT = 90000; // 90 seconds
const HEALTH_CHECK_TIMEOUT = 3000;
const PROGRESS_CLEAR_DELAY = 5000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\.\./g, "")
    .substring(0, 50) || "video";
};

const checkEndpointHealth = async (baseUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    
    const res = await fetch(baseUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "Bypass-Tunnel-Reminder": "true" },
    });
    
    clearTimeout(timeoutId);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VideoDownloaderPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoData | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("best");
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const progressClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      // Cleanup EventSource on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // Clear progress timeout
      if (progressClearTimeoutRef.current) {
        clearTimeout(progressClearTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // SERVER STATUS CHECK
  // ============================================================================

  const checkServerStatus = useCallback(async () => {
    setServerStatus("checking");
    
    // Sort endpoints by priority
    const sortedEndpoints = [...API_ENDPOINTS].sort((a, b) => a.priority - b.priority);
    
    for (const endpoint of sortedEndpoints) {
      const baseUrl = endpoint.url.replace("/api/download", "");
      const isAlive = await checkEndpointHealth(baseUrl);
      
      if (isAlive) {
        setActiveEndpoint(endpoint.url);
        setServerStatus("online");
        return;
      }
    }
    
    setActiveEndpoint(null);
    setServerStatus("offline");
  }, []);

  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  // ============================================================================
  // DOWNLOAD HANDLERS
  // ============================================================================

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.warn("Failed to read clipboard:", err);
    }
  };

  const triggerDownload = async (videoUrl: string, title: string) => {
    if (!activeEndpoint) {
      setError("Server offline. Please start the server.");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ status: "starting", percent: 0, speed: "", eta: "" });

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCurrentJobId(jobId);
    
    const serverBase = activeEndpoint.replace(/\/api\/(download|info)$/, "");
    const safeTitle = sanitizeFilename(title);

    // Setup SSE progress tracking
    try {
      eventSourceRef.current?.close();
      
      const eventSource = new EventSource(`${serverBase}/api/progress/${jobId}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data: DownloadProgress = JSON.parse(event.data);
        setDownloadProgress(data);
        
        if (data.status === "completed" || data.status === "error") {
          eventSource.close();
          eventSourceRef.current = null;
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
      };

      // Start proxy download
      const proxyUrl = `${serverBase}/api/proxy-download?${new URLSearchParams({
        url: videoUrl,
        title: safeTitle,
        format: selectedFormat,
        jobId,
      })}`;

      const response = await fetch(proxyUrl, {
        headers: { "Bypass-Tunnel-Reminder": "true" },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${safeTitle}.mp4`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

    } catch (err) {
      console.error("Proxy download failed:", err);
      
      // Fallback: open direct URL
      window.open(videoUrl, "_blank");
    } finally {
      setIsDownloading(false);
      setCurrentJobId(null);
      
      // Clear progress after delay
      if (progressClearTimeoutRef.current) {
        clearTimeout(progressClearTimeoutRef.current);
      }
      progressClearTimeoutRef.current = setTimeout(() => {
        setDownloadProgress(null);
      }, PROGRESS_CLEAR_DELAY);
    }
  };

  const handleCancelDownload = async () => {
    if (!currentJobId || !activeEndpoint) return;

    const serverBase = activeEndpoint.replace(/\/api\/(download|info)$/, "");
    
    try {
      await fetch(`${serverBase}/api/cancel/${currentJobId}`, {
        method: "POST",
        headers: { "Bypass-Tunnel-Reminder": "true" },
      });
    } catch (err) {
      console.error("Cancel failed:", err);
    } finally {
      setIsDownloading(false);
      setCurrentJobId(null);
      setDownloadProgress(null);
      
      // Close EventSource
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    }
  };

  const downloadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError("Please enter a valid URL (https://...)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Determine endpoints to try
    const endpointsToTry = activeEndpoint
      ? [activeEndpoint, ...API_ENDPOINTS.filter((ep) => ep.url !== activeEndpoint)]
      : API_ENDPOINTS.map((ep) => ep.url);

    let lastError = "";

    for (const endpoint of endpointsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const infoEndpoint = endpoint.replace("/download", "/info");
        
        const response = await fetch(infoEndpoint, {
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
        
        let data: { status?: string; data?: VideoData; text?: string };
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("Non-JSON response from", endpoint);
          lastError = "Server returned invalid response";
          continue;
        }

        if (data.status === "success" && data.data) {
          setActiveEndpoint(endpoint);
          setServerStatus("online");
          setResult({
            ...data.data,
            url: data.data.url || url.trim(),
          });
          setIsLoading(false);
          return;
        } else {
          lastError = data.text || "Video not found. Please check the URL.";
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        
        if (err.name === "AbortError") {
          lastError = "Request timeout. Please check your connection.";
        } else {
          lastError = err.message || "Failed to connect to server";
        }
        continue;
      }
    }

    // All endpoints failed
    setError(lastError || "Server is offline. Please start the server.");
    setServerStatus("offline");
    setIsLoading(false);
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
            aria-label="Go back"
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
          aria-label={`Server status: ${serverStatus}`}
        >
          {serverStatus === "online" && <Wifi size={12} />}
          {serverStatus === "offline" && <WifiOff size={12} />}
          {serverStatus === "checking" && <Loader2 size={12} className="animate-spin" />}
          {serverStatus === "online" ? "Server ON" : serverStatus === "offline" ? "Server OFF" : "Checking"}
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
              Download Any Video
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Free video downloader for Instagram, TikTok, YouTube, M3U8 streams,
              and more. Automatically bypasses geo and SSL restrictions.
            </p>
          </div>
        </div>

        {/* Server Offline Warning */}
        {serverStatus === "offline" && (
          <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-fade-in">
            <div className="flex items-start gap-3">
              <WifiOff size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Server is offline</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Start <b>Serverni_Yoqish.bat</b> to run the video server.
                </p>
                <button
                  onClick={checkServerStatus}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw size={12} />
                  Check Again
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
              aria-label="Video URL"
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
                  onClick={() => {
                    setError(null);
                    downloadVideo(new Event("submit") as any);
                  }}
                  className="mt-2 flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
                >
                  <RefreshCw size={12} />
                  Retry
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
                Searching...
              </>
            ) : (
              <>
                <Download size={18} />
                Search Video
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
                  {result.title || "Video Found"}
                </h4>
                <p className="text-xs text-stone-500">Ready to download</p>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              {/* Format Selection */}
              {result.formats && result.formats.length > 0 && (
                <div className="mb-2">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                    Select Quality:
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl text-sm text-stone-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value="best">Best Quality (Auto)</option>
                    {result.formats.map((f) => (
                      <option key={f.format_id} value={f.format_id}>
                        {f.resolution} {f.quality && `(${f.quality})`} - {f.extension}
                        {f.filesize ? ` (~${(f.filesize / 1024 / 1024).toFixed(1)} MB)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Progress Bar */}
              {downloadProgress && (
                <div className="mb-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-stone-600">
                      {downloadProgress.status === "downloading" ? "Downloading..." :
                       downloadProgress.status === "starting" ? "Preparing..." :
                       downloadProgress.status === "completed" ? "Complete!" :
                       downloadProgress.status === "error" ? "Error!" : "Waiting..."}
                    </span>
                    <span className="text-xs font-bold text-blue-500">
                      {Math.round(downloadProgress.percent)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>

                  {isDownloading && (
                    <button
                      onClick={handleCancelDownload}
                      className="mt-3 w-full py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle size={14} />
                      CANCEL DOWNLOAD
                    </button>
                  )}
                  
                  {downloadProgress.speed && downloadProgress.eta && (
                    <div className="flex justify-between mt-2 text-[10px] text-stone-400 font-medium">
                      <span>Speed: {downloadProgress.speed}</span>
                      <span>ETA: {downloadProgress.eta}</span>
                    </div>
                  )}
                  
                  {downloadProgress.message && (
                    <p className="mt-1 text-[10px] text-red-500">{downloadProgress.message}</p>
                  )}
                </div>
              )}

              {/* M3U8 Warning */}
              {result.isM3U8 && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-700 mb-1">
                  ⚡ M3U8 stream — Can be opened in VLC or browser
                </div>
              )}
              
              {/* Download Button */}
              <button
                onClick={() => triggerDownload(result.url, result.title || "video")}
                disabled={isDownloading}
                className="w-full py-3.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {downloadProgress?.status === "downloading" 
                      ? `Downloading (${Math.round(downloadProgress.percent)}%)` 
                      : "Downloading..."}
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    {result.isM3U8 ? "Open Stream" : "Download Video"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-2">
            How it works?
          </p>
          <p className="text-xs text-stone-500 leading-relaxed max-w-[280px] mx-auto">
            Copy the video URL or M3U8 stream link from social media, paste it here,
            and download. Automatically bypasses geo and SSL restrictions.
          </p>
        </div>
      </div>
    </div>
  );
};
