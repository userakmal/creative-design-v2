import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";

const SERVER_URL = "http://localhost:3001";

export const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [serverConnected, setServerConnected] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState<"video" | "music">("video");

  // Video stats
  const [videoStats, setVideoStats] = useState({
    total: 0,
    lastUpload: null as string | null,
  });

  // Upload form state
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Music upload state
  const [musicTitle, setMusicTitle] = useState("");
  const [musicAuthor, setMusicAuthor] = useState("");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);

  // Instagram/YouTube auto-download state
  const [autoUrl, setAutoUrl] = useState("");
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkServer = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/health`);
      if (res.ok) {
        setServerConnected(true);
        loadVideos();
      } else {
        setServerConnected(false);
      }
    } catch {
      setServerConnected(false);
    }
  };

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/videos`);
      if (res.ok) {
        const data = await res.json();
        setUploadedVideos(data);
        const lastUpload = data.length > 0 ? data[data.length - 1] : null;
        setVideoStats({
          total: data.length,
          lastUpload: lastUpload ? lastUpload.title : null,
        });
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "creative2026") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoFile || !imageFile) {
      showMessage("error", "Barcha maydonlarni to'ldiring");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("video", videoFile);
    formData.append("image", imageFile);
    formData.append("password", "creative2026");

    try {
      const res = await fetch(`${SERVER_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      showMessage("success", "✅ Video muvaffaqiyatli yuklandi va hostingga joylandi!");
      setTitle("");
      setVideoFile(null);
      setImageFile(null);

      // Reset file inputs
      const fileInputs = document.querySelectorAll<HTMLInputElement>('.admin-file-input');
      fileInputs.forEach(input => { input.value = ''; });

      loadVideos();
    } catch (err: any) {
      showMessage("error", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMusicUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicTitle || !musicAuthor || !musicFile) {
      showMessage("error", "Barcha maydonlarni to'ldiring");
      return;
    }

    setIsUploadingMusic(true);

    const formData = new FormData();
    formData.append("title", musicTitle);
    formData.append("author", musicAuthor);
    formData.append("music", musicFile);
    formData.append("password", "creative2026");

    try {
      const res = await fetch(`${SERVER_URL}/api/upload-music`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      showMessage("success", "✅ Musiqa muvaffaqiyatli yuklandi!");
      setMusicTitle("");
      setMusicAuthor("");
      setMusicFile(null);

      const fileInputs = document.querySelectorAll<HTMLInputElement>('.admin-music-input');
      fileInputs.forEach(input => { input.value = ''; });
    } catch (err: any) {
      showMessage("error", err.message);
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const handleAutoDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoUrl.trim()) {
      showMessage("error", "Link kiriting");
      return;
    }

    setIsAutoDownloading(true);

    try {
      const res = await fetch(`${SERVER_URL}/api/auto-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: autoUrl.trim(), password: "creative2026" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Download failed");

      showMessage("success", "✅ Video yuklandi va templatesga qo'shildi!");
      setAutoUrl("");
      loadVideos();
    } catch (err: any) {
      showMessage("error", err.message || "Download failed");
    } finally {
      setIsAutoDownloading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" ni o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showMessage("success", "Video o'chirildi");
      loadVideos();
    } catch (err: any) {
      showMessage("error", err.message);
    }
  };

  const handleRename = (video: any) => {
    const newTitle = prompt("Yangi nom:", video.title);
    if (newTitle && newTitle !== video.title) {
      fetch(`${SERVER_URL}/api/videos/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })
        .then(res => res.json())
        .then(() => {
          showMessage("success", "Nom o'zgartirildi");
          loadVideos();
        })
        .catch(err => showMessage("error", err.message));
    }
  };

  // =========================================================================
  // LOGIN SCREEN
  // =========================================================================

  if (!isAuthenticated) {
    return (
      <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-card" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="admin-card-title" style={{ textAlign: 'center' }}>🔐 Admin Panel</h2>
          <p className="admin-card-desc" style={{ textAlign: 'center' }}>Tizimga kirish</p>

          <form onSubmit={handleLogin}>
            <div className="admin-form-group">
              <label className="admin-label">Login</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="admin-input"
                placeholder="admin"
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
              />
            </div>

            {loginError && (
              <div className="admin-message error">{loginError}</div>
            )}

            <button type="submit" className="admin-btn">Kirish</button>
          </form>

          <button
            onClick={() => navigate("/")}
            style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', width: '100%' }}
          >
            ← Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN PANEL
  // =========================================================================

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <button onClick={() => navigate("/")} className="admin-back-btn">←</button>
        <h1 className="admin-title">Admin Panel</h1>
        <span className={`admin-badge ${serverConnected ? '' : 'offline'}`}>
          {serverConnected ? "🟢 Online" : "🔴 Offline"}
        </span>
      </div>

      <div className="admin-content">
        {/* Stats */}
        <div className="admin-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#229ed9' }}>
                {videoStats.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78716c' }}>Jami Videolar</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e7e5e4' }}></div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1c1917' }}>
                {videoStats.lastUpload ? '✓' : '○'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoStats.lastUpload || "Yo'q"}
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`admin-message ${message.type}`}>{message.text}</div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab("video")}
            className="admin-btn"
            style={{
              flex: 1,
              background: activeTab === "video" ? '#229ed9' : '#e7e5e4',
              color: activeTab === "video" ? 'white' : '#57534e',
            }}
          >
            🎬 Video
          </button>
          <button
            onClick={() => setActiveTab("music")}
            className="admin-btn"
            style={{
              flex: 1,
              background: activeTab === "music" ? '#a855f7' : '#e7e5e4',
              color: activeTab === "music" ? 'white' : '#57534e',
            }}
          >
            🎵 Musiqa
          </button>
        </div>

        {/* ===== VIDEO TAB ===== */}
        {activeTab === "video" && (
          <>
            {/* Video Upload Form */}
            <div className="admin-card">
              <h3 className="admin-card-title">📹 Yangi Video Yuklash</h3>
              <p className="admin-card-desc">Video va rasm yuklang — avtomatik hostingga joylashadi</p>

              <form onSubmit={handleUpload}>
                <div className="admin-form-group">
                  <label className="admin-label">Video Nomi</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="admin-input"
                    placeholder="Masalan: Dizayn 50"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Rasm (Thumbnail)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="admin-file-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Video</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="admin-file-input"
                  />
                </div>

                <button type="submit" disabled={isUploading} className="admin-btn">
                  {isUploading ? "⏳ Yuklanmoqda..." : "📤 Videoni Yuklash"}
                </button>
              </form>
            </div>

            {/* Auto Download */}
            <div className="admin-card" style={{ border: '2px solid #a855f7' }}>
              <h3 className="admin-card-title" style={{ color: '#a855f7' }}>📥 Instagram/YouTube dan Yuklash</h3>
              <p className="admin-card-desc">Linkni tashlang, avtomatik yuklab templatesga qo'shiladi</p>

              <form onSubmit={handleAutoDownload}>
                <div className="admin-form-group">
                  <label className="admin-label">Instagram yoki YouTube Link</label>
                  <input
                    type="url"
                    value={autoUrl}
                    onChange={(e) => setAutoUrl(e.target.value)}
                    className="admin-input"
                    placeholder="https://www.instagram.com/reel/..."
                  />
                </div>

                <button type="submit" disabled={isAutoDownloading} className="admin-btn admin-btn-gradient">
                  {isAutoDownloading ? "⏳ Yuklanmoqda..." : "🚀 Avto Yuklash"}
                </button>
              </form>

              <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#78716c' }}>
                ✓ Instagram Reels &nbsp; ✓ YouTube &nbsp; ✓ TikTok
              </div>
            </div>

            {/* Videos List */}
            <div className="admin-card">
              <h3 className="admin-card-title">📋 Yuklangan Videolar</h3>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="admin-spinner" style={{ margin: '0 auto' }}></div>
                </div>
              ) : uploadedVideos.length === 0 ? (
                <p className="admin-empty">Hozircha yuklangan videolar yo'q</p>
              ) : (
                <div className="admin-videos-list">
                  {uploadedVideos.map((video) => (
                    <div key={video.id} className="admin-video-item">
                      <img
                        src={video.image.startsWith('http') ? video.image : `${SERVER_URL}${video.image}`}
                        alt={video.title}
                        className="admin-video-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e5e5e5' width='64' height='64'/%3E%3Ctext fill='%23999' x='32' y='36' text-anchor='middle' font-size='12'%3E?%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="admin-video-info">
                        <p className="admin-video-title">{video.title}</p>
                        <p className="admin-video-id">ID: {video.id}</p>
                      </div>
                      <div className="admin-video-actions">
                        <button onClick={() => handleRename(video)} className="admin-action-btn edit" title="Nomini o'zgartirish">✏️</button>
                        <button onClick={() => handleDelete(video.id, video.title)} className="admin-action-btn delete" title="O'chirish">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== MUSIC TAB ===== */}
        {activeTab === "music" && (
          <div className="admin-card">
            <h3 className="admin-card-title">🎵 Yangi Musiqa Yuklash</h3>
            <p className="admin-card-desc">Musiqa faylni yuklang — avtomatik hostingga joylashadi</p>

            <form onSubmit={handleMusicUpload}>
              <div className="admin-form-group">
                <label className="admin-label">Musiqa Nomi</label>
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  className="admin-input"
                  placeholder="Masalan: Oshiq yurak"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Muallif</label>
                <input
                  type="text"
                  value={musicAuthor}
                  onChange={(e) => setMusicAuthor(e.target.value)}
                  className="admin-input"
                  placeholder="Masalan: Alisher Uzoqov"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Musiqa Fayl (MP3/M4A)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
                  className="admin-file-input admin-music-input"
                />
              </div>

              <button type="submit" disabled={isUploadingMusic} className="admin-btn" style={{ background: '#a855f7' }}>
                {isUploadingMusic ? "⏳ Yuklanmoqda..." : "🎵 Musiqani Yuklash"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
