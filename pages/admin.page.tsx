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
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Video stats
  const [videoStats, setVideoStats] = useState({
    total: 0,
    uploadedToday: 0,
    lastUpload: null
  });
  
  // Upload form state
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Instagram/YouTube auto-download state
  const [autoUrl, setAutoUrl] = useState("");
  const [isAutoDownloading, setIsAutoDownloading] = useState(false);

  // Check server on mount
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
    } catch (err) {
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
        
        // Update stats
        const today = new Date().toDateString();
        const uploadedToday = data.filter(video => {
          // Simple check - in real app, add timestamp to video data
          return false;
        }).length;
        
        const lastUpload = data.length > 0 ? data[data.length - 1] : null;
        
        setVideoStats({
          total: data.length,
          uploadedToday: uploadedToday,
          lastUpload: lastUpload ? lastUpload.title : null
        });
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "creative2026") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Login yoki parol noto'g'ri!");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !videoFile || !imageFile) {
      setMessage({ type: "error", text: "Barcha maydonlarni to'ldiring" });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

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

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage({ type: "success", text: "Video muvaffaqiyatli yuklandi!" });
      setTitle("");
      setVideoFile(null);
      setImageFile(null);
      loadVideos();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoDownload = async (e) => {
    e.preventDefault();
    if (!autoUrl.trim()) {
      setMessage({ type: "error", text: "Link kiriting" });
      return;
    }

    setIsAutoDownloading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${SERVER_URL}/api/auto-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: autoUrl.trim(),
          password: "creative2026" 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Download failed");
      }

      setMessage({ type: "success", text: "Video yuklandi va templatesga qo'shildi!" });
      setAutoUrl("");
      loadVideos();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Download failed. Serverni tekshiring." });
    } finally {
      setIsAutoDownloading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`"${title}" ni o'chirmoqchimisiz?`)) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/videos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setMessage({ type: "success", text: "Video o'chirildi" });
      loadVideos();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleRename = (video) => {
    const newTitle = prompt("Yangi nom:", video.title);
    if (newTitle && newTitle !== video.title) {
      fetch(`${SERVER_URL}/api/videos/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })
        .then(res => res.json())
        .then(() => {
          setMessage({ type: "success", text: "Nom o'zgartirildi" });
          loadVideos();
        })
        .catch(err => setMessage({ type: "error", text: err.message }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-card" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="admin-card-title" style={{ textAlign: 'center' }}>Admin Panel</h2>
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

            <button type="submit" className="admin-btn">
              Kirish
            </button>
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

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <button onClick={() => navigate("/")} className="admin-back-btn">
          ←
        </button>
        <h1 className="admin-title">Admin Panel</h1>
        <span className="admin-badge">Lokal</span>
      </div>

      <div className="admin-content">
        {/* Server Status */}
        <div className={`admin-status ${serverConnected ? 'connected' : 'disconnected'}`}>
          <span>{serverConnected ? "✓" : "✗"}</span>
          <span>{serverConnected ? "Upload server ulandi" : "Upload server topilmadi"}</span>
        </div>

        {/* Video Stats Indicator */}
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
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {videoStats.uploadedToday}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78716c' }}>Bugun</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e7e5e4' }}></div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1c1917' }}>
                {videoStats.lastUpload ? '✓' : '○'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78716c', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoStats.lastUpload || 'Yo\'q'}
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`admin-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Upload Form */}
        <div className="admin-card">
          <h3 className="admin-card-title">Yangi Video Yuklash</h3>
          <p className="admin-card-desc">Video va rasm yuklang, avtomatik templatesga qo'shiladi</p>

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

            <button
              type="submit"
              disabled={isUploading}
              className="admin-btn"
            >
              {isUploading ? "Yuklanmoqda..." : "Videoni Yuklash"}
            </button>
          </form>
        </div>

        {/* Instagram/YouTube Auto Download */}
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
                placeholder="https://www.instagram.com/reel/... yoki https://youtube.com/..."
              />
            </div>

            <button
              type="submit"
              disabled={isAutoDownloading}
              className="admin-btn admin-btn-gradient"
            >
              {isAutoDownloading ? "Yuklanmoqda..." : "🚀 Avto Yuklash"}
            </button>
          </form>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#78716c' }}>
            ✓ Instagram Reels  ✓ Instagram Video  ✓ YouTube  ✓ YouTube Shorts
          </div>
        </div>

        {/* Videos List */}
        <div className="admin-card">
          <h3 className="admin-card-title">Yuklangan Videolar</h3>
          
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
                    src={`${SERVER_URL}${video.image}`}
                    alt={video.title}
                    className="admin-video-thumb"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Crect fill='%23e5e5e5' width='24' height='24'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='4'%3E?%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="admin-video-info">
                    <p className="admin-video-title">{video.title}</p>
                    <p className="admin-video-id">ID: {video.id}</p>
                  </div>
                  <div className="admin-video-actions">
                    <button
                      onClick={() => handleRename(video)}
                      className="admin-action-btn edit"
                      title="Nomini o'zgartirish"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(video.id, video.title)}
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
      </div>
    </div>
  );
};
