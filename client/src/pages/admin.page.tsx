import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================
const isProduction = window.location.hostname === 'creative-design.uz';

const SERVER_URL = isProduction
  ? 'https://creative-design.uz:3001'
  : 'http://localhost:3001';

const VIDEO_DOWNLOADER_API = isProduction
  ? 'https://creative-design.uz:8000'
  : 'http://localhost:8000';

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

    if (!serverConnected) {
      showToast("error", "Upload server ishlamayapti! Serverni ishga tushiring.");
      return;
    }

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

      showToast("success", `✅ "${data.data.title}" muvaffaqiyatli yuklandi!`);

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
  // Delete Handlers
  // ========================================================================

  const handleDeleteVideo = async (id: number, title: string) => {
    if (!confirm(`"${title}" videosini o'chirishni xohlaysizmi?`)) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/videos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast("success", `✅ "${title}" o'chirildi`);
        loadVideos();
        loadStats();
      } else {
        showToast("error", data.error || "O'chirishda xatolik");
      }
    } catch (err: any) {
      showToast("error", err.message || "Tarmoq xatosi");
    }
  };

  const handleDeleteMusic = async (id: number, title: string) => {
    if (!confirm(`"${title}" musiqasini o'chirishni xohlaysizmi?`)) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/music/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast("success", `✅ "${title}" o'chirildi`);
        loadMusic();
        loadStats();
      } else {
        showToast("error", data.error || "O'chirishda xatolik");
      }
    } catch (err: any) {
      showToast("error", err.message || "Tarmoq xatosi");
    }
  };

  // ========================================================================
  // Helpers
  // ========================================================================

  const formatFileSize = (size: number): string => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="admin-root">
      <div className="admin-bg-pattern" />
      <div className="admin-wrapper">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-inner">
            <div className="admin-header-left">
              <button onClick={() => navigate("/")} className="admin-back-btn">
                ←
              </button>
              <span className="admin-logo-text">Admin Panel</span>
            </div>
            <div className={`admin-badge-online ${serverConnected ? 'connected' : 'disconnected'}`}>
              <span className="admin-badge-dot" />
              {serverConnected ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
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
            <div className="admin-stat-value">{stats.diskUsage}</div>
            <div className="admin-stat-label">Hajm</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'video' ? 'active-video' : ''}`}
            onClick={() => setActiveTab("video")}
          >
            📹 Video
          </button>
          <button
            className={`admin-tab ${activeTab === 'music' ? 'active-music' : ''}`}
            onClick={() => setActiveTab("music")}
          >
            🎵 Musiqa
          </button>
        </div>

        {/* Toast Message */}
        {message.text && (
          <div className={`admin-toast ${message.type}`}>
            {message.type === "success" ? "✅" : "❌"} {message.text}
          </div>
        )}

        {/* Video Tab */}
        {activeTab === "video" && (
          <>
            {/* Upload Card */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-icon video">📹</div>
                <div>
                  <div className="admin-card-title">Video Yuklash</div>
                  <div className="admin-card-desc">Video va thumbnail rasm yuklang</div>
                </div>
              </div>

              <form onSubmit={handleVideoUpload}>
                <div className="admin-form-group">
                  <label className="admin-label">Video Nomi</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Masalan: To'y taklifnomasi"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Video Fayl</label>
                  <div
                    className="admin-file-drop"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <span className="admin-file-drop-icon">🎬</span>
                    <div className="admin-file-drop-text">
                      {videoFile ? videoFile.name : "Video faylni tanlang"}
                    </div>
                    <div className="admin-file-drop-hint">
                      {videoFile ? formatFileSize(videoFile.size) : "MP4, MOV, AVI, MKV, WEBM"}
                    </div>
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="admin-file-input-hidden"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Thumbnail Rasm</label>
                  <div
                    className="admin-file-drop"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <span className="admin-file-drop-icon">🖼️</span>
                    <div className="admin-file-drop-text">
                      {imageFile ? imageFile.name : "Rasm faylni tanlang"}
                    </div>
                    <div className="admin-file-drop-hint">
                      {imageFile ? formatFileSize(imageFile.size) : "JPG, JPEG, PNG, WEBP"}
                    </div>
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="admin-file-input-hidden"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  {imagePreview && (
                    <div className="admin-preview-container">
                      <img src={imagePreview} alt="Preview" className="admin-preview-image" />
                    </div>
                  )}
                </div>

                {isUploadingVideo && (
                  <div className="admin-upload-progress">
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill video-progress"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                    <div className="admin-progress-text">{videoUploadProgress}%</div>
                  </div>
                )}

                <button
                  type="submit"
                  className="admin-btn-primary video-btn"
                  disabled={isUploadingVideo || !serverConnected}
                >
                  {isUploadingVideo ? "⏳ Yuklanmoqda..." : "📤 Video Yuklash"}
                </button>
              </form>
            </div>

            {/* Video List */}
            <div className="admin-card">
              <div className="admin-list-header">
                <div className="admin-card-title">Videolar Ro'yxati</div>
                <div className="admin-list-count">{videos.length} ta</div>
              </div>

              {isLoadingVideos ? (
                <div className="admin-spinner" />
              ) : videos.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">📹</div>
                  <div className="admin-empty-text">Hali videolar yuklanmagan</div>
                </div>
              ) : (
                <div className="admin-items-list">
                  {videos.map((video) => (
                    <div key={video.id} className="admin-item">
                      <img
                        src={video.image.startsWith('http') ? video.image : `${SERVER_URL}${video.image}`}
                        alt={video.title}
                        className="admin-item-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="%23333" width="48" height="48"/><text x="50%" y="50%" fill="%23999" text-anchor="middle" dy=".3em" font-size="20">🎬</text></svg>';
                        }}
                      />
                      <div className="admin-item-info">
                        <div className="admin-item-title">{video.title}</div>
                        <div className="admin-item-meta">
                          ID: {video.id} {video.size ? `• ${video.size}` : ''}
                        </div>
                      </div>
                      <div className="admin-item-actions">
                        <button
                          className="admin-action-btn delete"
                          onClick={() => handleDeleteVideo(video.id, video.title)}
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

        {/* Music Tab */}
        {activeTab === "music" && (
          <>
            {/* Upload Card */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-icon music">🎵</div>
                <div>
                  <div className="admin-card-title">Musiqa Yuklash</div>
                  <div className="admin-card-desc">Musiqa faylini yuklang</div>
                </div>
              </div>

              <form onSubmit={handleMusicUpload}>
                <div className="admin-form-group">
                  <label className="admin-label">Musiqa Nomi</label>
                  <input
                    type="text"
                    className="admin-input music-focus"
                    placeholder="Masalan: To'y musiqasi"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Muallif</label>
                  <input
                    type="text"
                    className="admin-input music-focus"
                    placeholder="Masalan: San'atkor nomi"
                    value={musicAuthor}
                    onChange={(e) => setMusicAuthor(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Musiqa Fayl</label>
                  <div
                    className={`admin-file-drop music-drop ${musicFile ? 'music-selected' : ''}`}
                    onClick={() => musicInputRef.current?.click()}
                  >
                    <span className="admin-file-drop-icon">🎵</span>
                    <div className="admin-file-drop-text">
                      {musicFile ? musicFile.name : "Musiqa faylni tanlang"}
                    </div>
                    <div className="admin-file-drop-hint">
                      {musicFile ? formatFileSize(musicFile.size) : "MP3, M4A, WAV, OGG, AAC, FLAC"}
                    </div>
                    <input
                      type="file"
                      ref={musicInputRef}
                      className="admin-file-input-hidden"
                      accept="audio/*"
                      onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                {isUploadingMusic && (
                  <div className="admin-upload-progress">
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill music-progress"
                        style={{ width: `${musicUploadProgress}%` }}
                      />
                    </div>
                    <div className="admin-progress-text">{musicUploadProgress}%</div>
                  </div>
                )}

                <button
                  type="submit"
                  className="admin-btn-primary music-btn"
                  disabled={isUploadingMusic || !serverConnected}
                >
                  {isUploadingMusic ? "⏳ Yuklanmoqda..." : "📤 Musiqa Yuklash"}
                </button>
              </form>
            </div>

            {/* Music List */}
            <div className="admin-card">
              <div className="admin-list-header">
                <div className="admin-card-title">Musiqalar Ro'yxati</div>
                <div className="admin-list-count">{musicList.length} ta</div>
              </div>

              {isLoadingMusic ? (
                <div className="admin-spinner" />
              ) : musicList.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">🎵</div>
                  <div className="admin-empty-text">Hali musiqalar yuklanmagan</div>
                </div>
              ) : (
                <div className="admin-items-list">
                  {musicList.map((music) => (
                    <div key={music.id} className="admin-item">
                      <div className="admin-item-music-icon">🎵</div>
                      <div className="admin-item-info">
                        <div className="admin-item-title">{music.title}</div>
                        <div className="admin-item-meta">
                          {music.author} {music.duration ? `• ${music.duration}` : ''}
                        </div>
                      </div>
                      <div className="admin-item-actions">
                        <button
                          className="admin-action-btn delete"
                          onClick={() => handleDeleteMusic(music.id, music.title)}
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
