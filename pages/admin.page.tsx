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

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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
    };
    init();
    const interval = setInterval(async () => {
      const connected = await checkServer();
      if (connected) loadStats();
    }, 8000);
    return () => clearInterval(interval);
  }, [checkServer, loadStats, loadVideos, loadMusic]);

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
  // LOGIN SCREEN
  // ========================================================================

  if (!isAuthenticated) {
    return (
      <div className="admin-root">
        <div className="admin-login-bg">
          <div className="admin-login-card">
            <div className="admin-login-logo">🎬</div>
            <h2 className="admin-login-title">Admin Panel</h2>
            <p className="admin-login-desc">Creative Design boshqaruv tizimi</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (username === "admin" && password === ADMIN_PASSWORD) {
                setIsAuthenticated(true);
                setLoginError("");
              } else {
                setLoginError("Login yoki parol noto'g'ri!");
              }
            }}>
              <div className="admin-form-group">
                <label className="admin-label">Login</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="admin-input"
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Parol</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="admin-login-btn">Kirish →</button>

              {loginError && <div className="admin-login-error">{loginError}</div>}
            </form>

            <button onClick={() => navigate("/")} className="admin-login-back">
              ← Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  <div className={`admin-file-drop ${imageFile ? "active" : ""}`}>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
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
                        <span>🖼️</span>
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
                  <div className={`admin-file-drop ${videoFile ? "active" : ""}`}>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
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
                        <span>🎥</span>
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
