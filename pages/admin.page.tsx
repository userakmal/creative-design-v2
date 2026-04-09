import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================
// Development: http://localhost:3001
// Production: Upload server must be running on same origin or proxied
// ============================================================================
const isProduction = window.location.hostname === 'creative-design.uz';

// For local development, use localhost:3001
// For production, this requires the upload server to be accessible
const SERVER_URL = isProduction 
  ? 'https://creative-design.uz:3001'  // Production API server
  : 'http://localhost:3001';           // Development server

const ADMIN_PASSWORD = "creative2026";

// ============================================================================
// Types
// ============================================================================
interface VideoItem {
  id: number;
  title: string;
  image: string;
  videoUrl: string;
  uploadedAt?: string;
  size?: string;
}

interface MusicItem {
  id: number;
  title: string;
  author: string;
  duration?: string;
  url: string;
  uploadedAt?: string;
  size?: string;
}

interface Stats {
  videos: number;
  music: number;
  diskUsage: string;
  lastVideoUpload: string | null;
  lastMusicUpload: string | null;
}

type MessageType = { type: "success" | "error" | ""; text: string };

// ============================================================================
// Main Component
// ============================================================================
export const AdminPage = () => {
  const navigate = useNavigate();

  // Auth - Local development da login kerak emas
  // const isAuthenticated = true; // Always authenticated on localhost

  // Server
  const [serverConnected, setServerConnected] = useState(false);
  const [stats, setStats] = useState<Stats>({ videos: 0, music: 0, diskUsage: "0 B", lastVideoUpload: null, lastMusicUpload: null });

  // Tab
  const [activeTab, setActiveTab] = useState<"video" | "music">("video");

  // Videos
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Music
  const [musicList, setMusicList] = useState<MusicItem[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);

  // Video Upload
  const [videoTitle, setVideoTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Universal Video Downloader (uses FastAPI at port 8000)
  const [videoDownloaderUrl, setVideoDownloaderUrl] = useState("");
  const [customVideoTitle, setCustomVideoTitle] = useState("");
  const [isExtractingVideo, setIsExtractingVideo] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isUploadingDownloadedVideo, setIsUploadingDownloadedVideo] = useState(false);
  const [videoExtractResult, setVideoExtractResult] = useState<any>(null);
  const [selectedVideoQuality, setSelectedVideoQuality] = useState("best");
  const [selectedMediaType, setSelectedMediaType] = useState<"video" | "audio">("video");
  const [videoDownloaderStatus, setVideoDownloaderStatus] = useState<"checking" | "online" | "offline">("checking");
  const [videoDownloaderMessage, setVideoDownloaderMessage] = useState<string | null>(null);
  const [downloadedVideoPath, setDownloadedVideoPath] = useState<string | null>(null);
  const [downloadedVideoFilename, setDownloadedVideoFilename] = useState<string | null>(null);

  // Music Upload
  const [musicTitle, setMusicTitle] = useState("");
  const [musicAuthor, setMusicAuthor] = useState("");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicUploadProgress, setMusicUploadProgress] = useState(0);

  // Toast
  const [message, setMessage] = useState<MessageType>({ type: "", text: "" });

  // Refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // ========================================================================
  // API Calls
  // ========================================================================

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  }, []);

  // ========================================================================
  // Universal Video Downloader API Calls (Port 8000)
  // ========================================================================

  const checkVideoDownloaderServer = useCallback(async () => {
    setVideoDownloaderStatus("checking");
    try {
      const res = await fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setVideoDownloaderStatus("online");
      } else {
        setVideoDownloaderStatus("offline");
      }
    } catch {
      setVideoDownloaderStatus("offline");
    }
  }, []);

  const handleVideoExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoDownloaderUrl.trim()) { showToast("error", "Video URL kiriting"); return; }

    setIsExtractingVideo(true);
    setVideoDownloaderMessage(null);
    setVideoExtractResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/extract', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoDownloaderUrl.trim() }),
        signal: AbortSignal.timeout(120000),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Video ma'lumotlarini olib bo'lmadi");
      }

      setVideoExtractResult(data);
      
      // Auto-fill custom title
      if (data.title) {
        setCustomVideoTitle(data.title);
      }
      
      if (data.formats && data.formats.length > 0) {
        const bestFormat = data.formats[data.formats.length - 1];
        setSelectedVideoQuality(bestFormat.quality);
      }
      showToast("success", `✅ "${data.title}" topildi!`);
    } catch (err: any) {
      showToast("error", err.message || "Video qidirishda xatolik");
    } finally {
      setIsExtractingVideo(false);
    }
  };

  const handleVideoDownload = async () => {
    if (!videoDownloaderUrl.trim() || !videoExtractResult) return;

    setIsDownloadingVideo(true);
    setVideoDownloaderMessage("⏳ Video yuklanmoqda...");
    setDownloadedVideoPath(null);
    setDownloadedVideoFilename(null);

    try {
      const res = await fetch('http://localhost:8000/api/download', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: videoDownloaderUrl.trim(),
          quality: selectedVideoQuality,
          type: selectedMediaType, // "video" or "audio"
        }),
        signal: AbortSignal.timeout(300000),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Yuklashda xatolik");
      }

      if (data.download_type === "file" && data.file_url) {
        setVideoDownloaderMessage("✅ Video muvaffaqiyatli yuklab olindi! Endi nomini o'zgartirib upload qilishingiz mumkin.");

        // Save downloaded file info for upload
        const fileUrl = `http://localhost:8000${data.file_url}`;
        setDownloadedVideoPath(fileUrl);
        setDownloadedVideoFilename(data.filename || "video.mp4");

        showToast("success", `✅ "${videoExtractResult.title}" yuklab olindi!`);
      } else if (data.download_type === "direct" && data.direct_url) {
        setVideoDownloaderMessage("✅ Video muvaffaqiyatli yuklab olindi! Endi nomini o'zgartirib upload qilishingiz mumkin.");

        // Save downloaded file info for upload
        setDownloadedVideoPath(data.direct_url);
        setDownloadedVideoFilename(data.filename || "video.mp4");

        showToast("success", `✅ "${videoExtractResult.title}" yuklab olindi!`);
      } else {
        setVideoDownloaderMessage("✅ " + data.message);
      }

      setTimeout(() => setVideoDownloaderMessage(null), 5000);
    } catch (err: any) {
      showToast("error", err.message || "Yuklashda xatolik");
      setVideoDownloaderMessage(null);
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  const handleUploadDownloadedVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serverConnected) {
      showToast("error", "Upload server ishlamayapti! CRrunner.bat ni ishga tushiring.");
      return;
    }

    if (!downloadedVideoPath || !downloadedVideoFilename) {
      showToast("error", "Avval videoni yuklab oling");
      return;
    }

    if (!customVideoTitle.trim()) {
      showToast("error", "Video nomini kiriting");
      return;
    }

    setIsUploadingDownloadedVideo(true);
    setVideoUploadProgress(0);

    try {
      console.log('📥 Step 1: Downloading video from FastAPI server...', downloadedVideoPath);
      
      // Step 1: Download video from the FastAPI server to a blob
      const response = await fetch(downloadedVideoPath);
      if (!response.ok) {
        throw new Error(`Videoni yuklab olib bo'lmadi: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('✅ Video blob created:', blob.size, 'bytes, type:', blob.type);
      
      const videoFile = new File([blob], downloadedVideoFilename, { type: blob.type || "video/mp4" });
      console.log('📹 Video file created:', videoFile.name, videoFile.size, 'bytes');

      // Step 2: Generate thumbnail from video or use default
      console.log('🖼️ Step 2: Generating thumbnail...');
      const thumbnailFile = await generateThumbnailFromVideo(videoFile);
      console.log('✅ Thumbnail created:', thumbnailFile.name, thumbnailFile.size, 'bytes');

      // Step 3: Upload to the server
      console.log('📤 Step 3: Uploading to server...', SERVER_URL);
      
      const formData = new FormData();
      formData.append("title", customVideoTitle.trim());
      formData.append("video", videoFile);
      formData.append("image", thumbnailFile);
      formData.append("password", ADMIN_PASSWORD);
      
      // Log FormData entries for debugging
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes)`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setVideoUploadProgress(pct);
            console.log(`📊 Upload progress: ${pct}%`);
          }
        });

        xhr.addEventListener("load", () => {
          console.log('📡 XHR load completed, status:', xhr.status);
          console.log('Response:', xhr.responseText);
          
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log('✅ Upload successful:', data);
              resolve(data);
            } else {
              console.error('❌ Upload failed with status:', xhr.status, data);
              reject(new Error(data.error || `Upload xatosi: ${xhr.status}`));
            }
          } catch {
            console.error('❌ Failed to parse response:', xhr.responseText);
            reject(new Error("Server javobini o'qib bo'lmadi"));
          }
        });

        xhr.addEventListener("error", (err) => {
          console.error('❌ XHR error:', err);
          reject(new Error("Tarmoq xatosi"));
        });
        
        xhr.addEventListener("abort", () => {
          console.warn('⚠️ Upload aborted');
          reject(new Error("Upload bekor qilindi"));
        });

        xhr.open("POST", `${SERVER_URL}/api/upload`);
        xhr.send(formData);
      });

      await uploadPromise;

      showToast("success", `✅ "${customVideoTitle.trim()}" muvaffaqiyatli yuklandi!`);

      // Reset form
      setCustomVideoTitle("");
      setDownloadedVideoPath(null);
      setDownloadedVideoFilename(null);
      setVideoDownloaderMessage(null);

      // Refresh
      console.log('🔄 Refreshing video list...');
      await loadVideos();
      await loadStats();
      console.log('✅ Video list refreshed');
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      showToast("error", `Upload xatosi: ${err.message || 'Noma\'lum xatolik'}`);
    } finally {
      setIsUploadingDownloadedVideo(false);
      setVideoUploadProgress(0);
    }
  };

  // Helper function to generate thumbnail from video
  const generateThumbnailFromVideo = async (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true; // Mute to avoid autoplay issues
      video.src = URL.createObjectURL(videoFile);

      let timeout: NodeJS.Timeout;

      video.onloadeddata = () => {
        console.log('📹 Video loaded, duration:', video.duration, 'width:', video.videoWidth, 'height:', video.videoHeight);
        // Seek to 2 seconds or 25% of video for better thumbnail
        video.currentTime = Math.min(2, video.duration * 0.25);
      };

      video.onseeked = () => {
        console.log('✅ Video seeked to:', video.currentTime);
        clearTimeout(timeout);
        
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          console.log('🖼️ Thumbnail drawn to canvas');
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
            console.log('✅ Thumbnail file created:', blob.size, 'bytes');
            URL.revokeObjectURL(video.src);
            resolve(thumbnailFile);
          } else {
            console.error('❌ Canvas toBlob failed');
            URL.revokeObjectURL(video.src);
            reject(new Error("Thumbnail yaratib bo'lmadi"));
          }
        }, "image/jpeg", 0.8);
      };

      video.onerror = (err) => {
        console.error('❌ Video loading error, using fallback thumbnail', err);
        clearTimeout(timeout);
        URL.revokeObjectURL(video.src);
        
        // Fallback: create a simple colored placeholder
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, "#667eea");
          gradient.addColorStop(1, "#764ba2");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text
          ctx.fillStyle = "white";
          ctx.font = "bold 30px Arial";
          ctx.textAlign = "center";
          ctx.fillText("VIDEO", canvas.width / 2, canvas.height / 2);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
            console.log('✅ Fallback thumbnail created:', blob.size, 'bytes');
            resolve(thumbnailFile);
          } else {
            reject(new Error("Thumbnail yaratib bo'lmadi"));
          }
        }, "image/jpeg", 0.8);
      };

      // Timeout fallback after 10 seconds
      timeout = setTimeout(() => {
        console.warn('⏱️ Thumbnail generation timeout, using fallback');
        (video.onerror as any)(new Event('timeout'));
      }, 10000);
    });
  };

  const checkServer = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setServerConnected(true);
        return true;
      }
    } catch { /* silent */ }
    setServerConnected(false);
    return false;
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* silent */ }
  }, []);

  const loadVideos = useCallback(async () => {
    setIsLoadingVideos(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/videos`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  const loadMusic = useCallback(async () => {
    setIsLoadingMusic(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/music`);
      if (res.ok) {
        const data = await res.json();
        setMusicList(data);
      }
    } catch (err) {
      console.error("Failed to load music:", err);
    } finally {
      setIsLoadingMusic(false);
    }
  }, []);

  // Initial load + periodic health check
  useEffect(() => {
    const init = async () => {
      const connected = await checkServer();
      if (connected) {
        loadStats();
        loadVideos();
        loadMusic();
      }
      // Check video downloader server
      checkVideoDownloaderServer();
    };
    init();
    const interval = setInterval(async () => {
      const connected = await checkServer();
      if (connected) loadStats();
      checkVideoDownloaderServer();
    }, 8000);
    return () => clearInterval(interval);
  }, [checkServer, loadStats, loadVideos, loadMusic, checkVideoDownloaderServer]);

  // Image preview
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  // ========================================================================
  // Upload Handlers
  // ========================================================================

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Server connection check
    if (!serverConnected) {
      showToast("error", "Upload server ishlamayapti! CRrunner.bat ni ishga tushiring.");
      return;
    }
    
    // Validate inputs
    if (!videoTitle.trim()) { showToast("error", "Video nomini kiriting"); return; }
    if (!videoFile) { showToast("error", "Video faylni tanlang"); return; }
    if (!imageFile) { showToast("error", "Rasm (thumbnail) tanlang"); return; }

    setIsUploadingVideo(true);
    setVideoUploadProgress(0);

    const formData = new FormData();
    formData.append("title", videoTitle.trim());
    formData.append("video", videoFile);
    formData.append("image", imageFile);
    formData.append("password", ADMIN_PASSWORD);

    try {
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setVideoUploadProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || "Upload xatosi"));
            }
          } catch {
            reject(new Error("Server javobini o'qib bo'lmadi"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Tarmoq xatosi")));
        xhr.addEventListener("abort", () => reject(new Error("Upload bekor qilindi")));

        xhr.open("POST", `${SERVER_URL}/api/upload`);
        xhr.send(formData);
      });

      const data = await uploadPromise;

      showToast("success", `✅ "${data.data.title}" muvaffaqiyatli yuklandi!`);

      // Reset form
      setVideoTitle("");
      setVideoFile(null);
      setImageFile(null);
      setImagePreview(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";

      // Refresh
      loadVideos();
      loadStats();
    } catch (err: any) {
      showToast("error", err.message || "Upload xatosi");
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
    }
  };

  const handleMusicUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicTitle.trim()) { showToast("error", "Musiqa nomini kiriting"); return; }
    if (!musicAuthor.trim()) { showToast("error", "Muallif nomini kiriting"); return; }
    if (!musicFile) { showToast("error", "Musiqa faylni tanlang"); return; }

    setIsUploadingMusic(true);
    setMusicUploadProgress(0);

    const formData = new FormData();
    formData.append("title", musicTitle.trim());
    formData.append("author", musicAuthor.trim());
    formData.append("music", musicFile);
    formData.append("password", ADMIN_PASSWORD);

    try {
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setMusicUploadProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || "Upload xatosi"));
            }
          } catch {
            reject(new Error("Server javobini o'qib bo'lmadi"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Tarmoq xatosi")));
        xhr.addEventListener("abort", () => reject(new Error("Upload bekor qilindi")));

        xhr.open("POST", `${SERVER_URL}/api/upload-music`);
        xhr.send(formData);
      });

      const data = await uploadPromise;

      showToast("success", `🎵 "${data.data.title}" muvaffaqiyatli yuklandi!`);

      // Reset form
      setMusicTitle("");
      setMusicAuthor("");
      setMusicFile(null);
      if (musicInputRef.current) musicInputRef.current.value = "";

      // Refresh
      loadMusic();
      loadStats();
    } catch (err: any) {
      showToast("error", err.message || "Upload xatosi");
    } finally {
      setIsUploadingMusic(false);
      setMusicUploadProgress(0);
    }
  };

  // ========================================================================
  // Delete / Rename Handlers
  // ========================================================================

  const handleDeleteVideo = async (id: number, title: string) => {
    if (!confirm(`"${title}" ni o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("O'chirib bo'lmadi");
      showToast("success", `🗑️ "${title}" o'chirildi`);
      loadVideos();
      loadStats();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleRenameVideo = async (video: VideoItem) => {
    const newTitle = prompt("Yangi nom kiriting:", video.title);
    if (!newTitle || newTitle === video.title) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/videos/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error("O'zgartirib bo'lmadi");
      showToast("success", `✏️ Nom o'zgartirildi`);
      loadVideos();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDeleteMusic = async (id: number, title: string) => {
    if (!confirm(`"${title}" ni o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/music/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("O'chirib bo'lmadi");
      showToast("success", `🗑️ "${title}" o'chirildi`);
      loadMusic();
      loadStats();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleRenameMusic = async (music: MusicItem) => {
    const newTitle = prompt("Yangi nom kiriting:", music.title);
    if (!newTitle || newTitle === music.title) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/music/${music.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, author: music.author }),
      });
      if (!res.ok) throw new Error("O'zgartirib bo'lmadi");
      showToast("success", `✏️ Nom o'zgartirildi`);
      loadMusic();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // ========================================================================
  // Helpers
  // ========================================================================

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getImageUrl = (src: string) => {
    if (src.startsWith("http")) return src;
    return `${SERVER_URL}${src}`;
  };

  // ========================================================================
  // MAIN ADMIN DASHBOARD
  // ========================================================================

  return (
    <div className="admin-root">
      <div className="admin-bg-pattern" />
      <div className="admin-wrapper">
        {/* ===== HEADER ===== */}
        <div className="admin-header">
          <div className="admin-header-inner">
            <div className="admin-header-left">
              <button onClick={() => navigate("/")} className="admin-back-btn">←</button>
              <span className="admin-logo-text">Admin Panel</span>
            </div>
            <div className={`admin-badge-online ${serverConnected ? "connected" : "disconnected"}`}>
              <span className="admin-badge-dot" />
              {serverConnected ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card videos">
            <div className="admin-stat-icon">📹</div>
            <div className="admin-stat-value">{stats.videos}</div>
            <div className="admin-stat-label">Videolar</div>
          </div>
          <div className="admin-stat-card music">
            <div className="admin-stat-icon">🎵</div>
            <div className="admin-stat-value">{stats.music}</div>
            <div className="admin-stat-label">Musiqalar</div>
          </div>
          <div className="admin-stat-card disk">
            <div className="admin-stat-icon">💾</div>
            <div className="admin-stat-value" style={{ fontSize: "16px" }}>{stats.diskUsage}</div>
            <div className="admin-stat-label">Disk</div>
          </div>
        </div>

        {/* ===== TOAST ===== */}
        {message.text && (
          <div className={`admin-toast ${message.type}`}>
            {message.type === "success" ? "✅" : "❌"} {message.text}
          </div>
        )}

        {/* ===== TABS ===== */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "video" ? "active-video" : ""}`}
            onClick={() => setActiveTab("video")}
          >
            🎬 Video
          </button>
          <button
            className={`admin-tab ${activeTab === "music" ? "active-music" : ""}`}
            onClick={() => setActiveTab("music")}
          >
            🎵 Musiqa
          </button>
        </div>

        {/* ============================================================== */}
        {/* VIDEO TAB                                                      */}
        {/* ============================================================== */}
        {activeTab === "video" && (
          <>
            {/* Universal Video Downloader Card */}
            <div className="admin-card" style={{ marginBottom: "20px", border: "2px solid #10b981" }}>
              <div className="admin-card-header">
                <div className="admin-card-icon" style={{ background: "#10b981", color: "white" }}>🎬</div>
                <div style={{ flex: 1 }}>
                  <div className="admin-card-title">Universal Video Downloader</div>
                  <div className="admin-card-desc">YouTube, Instagram, TikTok va 1000+ saytlar</div>
                </div>
                <button
                  onClick={checkVideoDownloaderServer}
                  className={`admin-badge-online ${videoDownloaderStatus === "online" ? "connected" : videoDownloaderStatus === "offline" ? "disconnected" : ""}`}
                  style={{ marginLeft: "auto", cursor: "pointer" }}
                >
                  <span className="admin-badge-dot" />
                  {videoDownloaderStatus === "online" ? "Online" : videoDownloaderStatus === "offline" ? "Offline" : "..."}
                </button>
              </div>

              <form onSubmit={handleVideoExtract}>
                <div className="admin-form-group">
                  <label className="admin-label">Video URL (YouTube, Instagram, TikTok, etc.)</label>
                  <input
                    type="url"
                    value={videoDownloaderUrl}
                    onChange={(e) => setVideoDownloaderUrl(e.target.value)}
                    className="admin-input"
                    placeholder="https://youtube.com/watch?v=... yoki https://www.instagram.com/reel/..."
                    required
                  />
                </div>

                {/* Video Downloader Message */}
                {videoDownloaderMessage && (
                  <div className="admin-toast success" style={{ marginBottom: "16px" }}>
                    {videoDownloaderMessage}
                  </div>
                )}

                {/* Extract Result */}
                {videoExtractResult && (
                  <div style={{ marginBottom: "16px", padding: "16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #86efac" }}>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      {videoExtractResult.thumbnail && (
                        <img
                          src={videoExtractResult.thumbnail}
                          alt={videoExtractResult.title}
                          style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>{videoExtractResult.title}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {videoExtractResult.uploader && <span>{videoExtractResult.uploader} • </span>}
                          {videoExtractResult.duration_formatted && <span>{videoExtractResult.duration_formatted}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Custom Video Title Input */}
                    <div className="admin-form-group" style={{ marginBottom: "12px" }}>
                      <label className="admin-label">Video Nomi (o'zgartirishingiz mumkin)</label>
                      <input
                        type="text"
                        value={customVideoTitle}
                        onChange={(e) => setCustomVideoTitle(e.target.value)}
                        className="admin-input"
                        placeholder="Video nomi..."
                        style={{ fontWeight: "500" }}
                      />
                    </div>

                    {/* Video/Audio Type Selection */}
                    <div style={{ marginBottom: "12px" }}>
                      <label className="admin-label">Format:</label>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedMediaType("video")}
                          style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "8px",
                            border: selectedMediaType === "video" ? "2px solid #10b981" : "1px solid #e5e7eb",
                            background: selectedMediaType === "video" ? "#f0fdf4" : "white",
                            color: selectedMediaType === "video" ? "#059669" : "#374151",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          🎬 Video
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMediaType("audio")}
                          style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "8px",
                            border: selectedMediaType === "audio" ? "2px solid #10b981" : "1px solid #e5e7eb",
                            background: selectedMediaType === "audio" ? "#f0fdf4" : "white",
                            color: selectedMediaType === "audio" ? "#059669" : "#374151",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          🎵 Audio (MP3)
                        </button>
                      </div>
                    </div>

                    {/* Quality Selection (only for video) */}
                    {selectedMediaType === "video" && videoExtractResult.formats && videoExtractResult.formats.length > 1 && (
                      <div style={{ marginBottom: "12px" }}>
                        <label className="admin-label">Video sifati:</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", marginTop: "8px" }}>
                          {videoExtractResult.formats.map((fmt: any) => (
                            <button
                              key={fmt.format_id}
                              type="button"
                              onClick={() => setSelectedVideoQuality(fmt.quality)}
                              style={{
                                padding: "10px",
                                borderRadius: "8px",
                                border: selectedVideoQuality === fmt.quality ? "2px solid #10b981" : "1px solid #e5e7eb",
                                background: selectedVideoQuality === fmt.quality ? "#f0fdf4" : "white",
                                color: selectedVideoQuality === fmt.quality ? "#059669" : "#374151",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              <div>{fmt.quality}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{fmt.filesize_formatted}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single format info */}
                    {selectedMediaType === "video" && videoExtractResult.formats && videoExtractResult.formats.length === 1 && (
                      <div style={{ marginBottom: "12px", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          ℹ️ Bu video faqat <strong>1 ta formatda</strong> mavjud: <strong>{videoExtractResult.formats[0].quality}</strong> ({videoExtractResult.formats[0].filesize_formatted})
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleVideoDownload}
                      disabled={isDownloadingVideo}
                      className="admin-btn-primary"
                      style={{ width: "100%", background: "#10b981" }}
                    >
                      {isDownloadingVideo ? (
                        <>⏳ Yuklanmoqda...</>
                      ) : (
                        <>⬇️ {selectedMediaType === "video" ? "Video yuklash" : "Audio (MP3) yuklash"}</>
                      )}
                    </button>

                    {/* Upload Downloaded Video Section */}
                    {downloadedVideoPath && (
                      <div style={{ marginTop: "16px", padding: "16px", background: "#fef3c7", borderRadius: "12px", border: "2px solid #f59e0b" }}>
                        <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px", color: "#92400e" }}>
                          ✅ Video yuklab olindi! Endi upload qiling
                        </div>

                        {/* Upload Progress */}
                        {isUploadingDownloadedVideo && (
                          <div className="admin-upload-progress" style={{ marginBottom: "12px" }}>
                            <div className="admin-progress-bar-bg">
                              <div
                                className="admin-progress-bar-fill"
                                style={{ width: `${videoUploadProgress}%`, background: "#f59e0b" }}
                              />
                            </div>
                            <div className="admin-progress-text" style={{ color: "#92400e" }}>
                              {videoUploadProgress < 100 ? `Upload qilinmoqda... ${videoUploadProgress}%` : "Tayyorlanmoqda..."}
                            </div>
                          </div>
                        )}

                        {/* Upload Button Form */}
                        <form onSubmit={handleUploadDownloadedVideo}>
                          <button
                            type="submit"
                            disabled={isUploadingDownloadedVideo || !customVideoTitle.trim() || !serverConnected}
                            className="admin-btn-primary"
                            style={{ 
                              width: "100%", 
                              background: isUploadingDownloadedVideo ? "#d97706" : "#f59e0b",
                              opacity: (!customVideoTitle.trim() || !serverConnected) ? 0.5 : 1
                            }}
                          >
                            {isUploadingDownloadedVideo ? (
                              <>⏳ Upload qilinmoqda... {videoUploadProgress}%</>
                            ) : (
                              <>📤 Video nomini saqlash va upload qilish</>
                            )}
                          </button>
                        </form>

                        {!serverConnected && (
                          <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "8px" }}>
                            ⚠️ Upload server ishlamayapti! CRrunner.bat ni ishga tushiring.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isExtractingVideo || !videoDownloaderUrl.trim() || videoDownloaderStatus === "offline"}
                  className="admin-btn-primary"
                  style={{ marginTop: "16px", background: "#10b981" }}
                >
                  {isExtractingVideo ? (
                    <>⏳ Qidirilmoqda...</>
                  ) : (
                    <>🔍 Video Qidirish</>
                  )}
                </button>
              </form>
            </div>

            {/* Upload Form */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-icon video">📹</div>
                <div>
                  <div className="admin-card-title">Yangi Video Yuklash</div>
                  <div className="admin-card-desc">Video va thumbnail rasmni tanlang</div>
                </div>
              </div>

              <form onSubmit={handleVideoUpload}>
                <div className="admin-form-group">
                  <label className="admin-label">Video Nomi</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="admin-input"
                    placeholder="Masalan: Dizayn 50"
                  />
                </div>

                {/* Thumbnail */}
                <div className="admin-form-group">
                  <label className="admin-label">Rasm (Thumbnail)</label>
                  <div 
                    className={`admin-file-drop ${imageFile ? "active" : ""}`}
                    onClick={() => imageInputRef.current?.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                        console.log('✅ Thumbnail selected:', file?.name);
                      }}
                      className="admin-file-input-hidden"
                    />
                    {!imageFile ? (
                      <>
                        <span className="admin-file-drop-icon">🖼️</span>
                        <div className="admin-file-drop-text">Rasmni tanlang yoki tashlang</div>
                        <div className="admin-file-drop-hint">JPG, PNG, WebP — max 50MB</div>
                      </>
                    ) : (
                      <div className="admin-file-drop-selected">
                        <span>✅</span>
                        <span className="admin-file-name">{imageFile.name}</span>
                        <span className="admin-file-size">{formatFileSize(imageFile.size)}</span>
                      </div>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="admin-preview-container">
                      <img src={imagePreview} alt="Preview" className="admin-preview-image" />
                      <div className="admin-preview-overlay">Thumbnail ko'rinishi</div>
                    </div>
                  )}
                </div>

                {/* Video File */}
                <div className="admin-form-group">
                  <label className="admin-label">Video Fayl</label>
                  <div 
                    className={`admin-file-drop ${videoFile ? "active" : ""}`}
                    onClick={() => videoInputRef.current?.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setVideoFile(file);
                        console.log('✅ Video selected:', file?.name);
                      }}
                      className="admin-file-input-hidden"
                    />
                    {!videoFile ? (
                      <>
                        <span className="admin-file-drop-icon">🎥</span>
                        <div className="admin-file-drop-text">Video faylni tanlang</div>
                        <div className="admin-file-drop-hint">MP4, MOV, WebM — max 500MB</div>
                      </>
                    ) : (
                      <div className="admin-file-drop-selected">
                        <span>✅</span>
                        <span className="admin-file-name">{videoFile.name}</span>
                        <span className="admin-file-size">{formatFileSize(videoFile.size)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploadingVideo && (
                  <div className="admin-upload-progress">
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill video-progress"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                    <div className="admin-progress-text">
                      {videoUploadProgress < 100 ? `Yuklanmoqda... ${videoUploadProgress}%` : "Server qayta ishlamoqda..."}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingVideo}
                  className="admin-btn-primary video-btn"
                  style={{ marginTop: "16px" }}
                >
                  {isUploadingVideo ? (
                    <>⏳ Yuklanmoqda... {videoUploadProgress}%</>
                  ) : (
                    <>📤 Video Yuklash</>
                  )}
                </button>
              </form>
            </div>

            {/* Videos List */}
            <div className="admin-card">
              <div className="admin-list-header">
                <div className="admin-card-header" style={{ marginBottom: 0 }}>
                  <div className="admin-card-icon video">📋</div>
                  <div>
                    <div className="admin-card-title">Yuklangan Videolar</div>
                    <div className="admin-card-desc">Barcha yuklangan video shablonlar</div>
                  </div>
                </div>
                <span className="admin-list-count">{videos.length} ta</span>
              </div>

              {isLoadingVideos ? (
                <div className="admin-spinner" />
              ) : videos.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">📹</div>
                  <div className="admin-empty-text">Hozircha video yuklanmagan</div>
                </div>
              ) : (
                <div className="admin-items-list">
                  {[...videos].reverse().map((video) => (
                    <div key={video.id} className="admin-item">
                      <img
                        src={getImageUrl(video.image)}
                        alt={video.title}
                        className="admin-item-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%231a1a26' width='48' height='48' rx='10'/%3E%3Ctext fill='%235a5a72' x='24' y='28' text-anchor='middle' font-size='16'%3E🎬%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="admin-item-info">
                        <div className="admin-item-title">{video.title}</div>
                        <div className="admin-item-meta">
                          ID: {video.id} {video.size ? `• ${video.size}` : ""}
                        </div>
                      </div>
                      <div className="admin-item-actions">
                        <button
                          onClick={() => handleRenameVideo(video)}
                          className="admin-action-btn"
                          title="Nomini o'zgartirish"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.id, video.title)}
                          className="admin-action-btn delete"
                          title="O'chirish"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* MUSIC TAB                                                      */}
        {/* ============================================================== */}
        {activeTab === "music" && (
          <>
            {/* Upload Form */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-icon music">🎵</div>
                <div>
                  <div className="admin-card-title">Yangi Musiqa Yuklash</div>
                  <div className="admin-card-desc">MP3, M4A, WAV fayllarni yuklang</div>
                </div>
              </div>

              <form onSubmit={handleMusicUpload}>
                <div className="admin-form-group">
                  <label className="admin-label">Musiqa Nomi</label>
                  <input
                    type="text"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    className="admin-input music-focus"
                    placeholder="Masalan: Oshiq yurak"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Muallif</label>
                  <input
                    type="text"
                    value={musicAuthor}
                    onChange={(e) => setMusicAuthor(e.target.value)}
                    className="admin-input music-focus"
                    placeholder="Masalan: Alisher Uzoqov"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Musiqa Fayl</label>
                  <div className={`admin-file-drop music-drop ${musicFile ? "active" : ""}`}>
                    <input
                      ref={musicInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
                      className="admin-file-input-hidden"
                    />
                    {!musicFile ? (
                      <>
                        <span className="admin-file-drop-icon">🎧</span>
                        <div className="admin-file-drop-text">Musiqa faylni tanlang</div>
                        <div className="admin-file-drop-hint">MP3, M4A, WAV, OGG — max 50MB</div>
                      </>
                    ) : (
                      <div className="admin-file-drop-selected music-selected">
                        <span>🎧</span>
                        <span className="admin-file-name">{musicFile.name}</span>
                        <span className="admin-file-size">{formatFileSize(musicFile.size)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploadingMusic && (
                  <div className="admin-upload-progress">
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill music-progress"
                        style={{ width: `${musicUploadProgress}%` }}
                      />
                    </div>
                    <div className="admin-progress-text">
                      {musicUploadProgress < 100 ? `Yuklanmoqda... ${musicUploadProgress}%` : "Server qayta ishlamoqda..."}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingMusic}
                  className="admin-btn-primary music-btn"
                  style={{ marginTop: "16px" }}
                >
                  {isUploadingMusic ? (
                    <>⏳ Yuklanmoqda... {musicUploadProgress}%</>
                  ) : (
                    <>🎵 Musiqa Yuklash</>
                  )}
                </button>
              </form>
            </div>

            {/* Music List */}
            <div className="admin-card">
              <div className="admin-list-header">
                <div className="admin-card-header" style={{ marginBottom: 0 }}>
                  <div className="admin-card-icon music">📋</div>
                  <div>
                    <div className="admin-card-title">Yuklangan Musiqalar</div>
                    <div className="admin-card-desc">Barcha yuklangan musiqa fayllar</div>
                  </div>
                </div>
                <span className="admin-list-count">{musicList.length} ta</span>
              </div>

              {isLoadingMusic ? (
                <div className="admin-spinner" />
              ) : musicList.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">🎵</div>
                  <div className="admin-empty-text">Hozircha musiqa yuklanmagan</div>
                </div>
              ) : (
                <div className="admin-items-list">
                  {[...musicList].reverse().map((music) => (
                    <div key={music.id} className="admin-item">
                      <div className="admin-item-music-icon">🎵</div>
                      <div className="admin-item-info">
                        <div className="admin-item-title">{music.title}</div>
                        <div className="admin-item-meta">
                          {music.author} {music.size ? `• ${music.size}` : ""}
                        </div>
                      </div>
                      <div className="admin-item-actions">
                        <button
                          onClick={() => handleRenameMusic(music)}
                          className="admin-action-btn"
                          title="Nomini o'zgartirish"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMusic(music.id, music.title)}
                          className="admin-action-btn delete"
                          title="O'chirish"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
