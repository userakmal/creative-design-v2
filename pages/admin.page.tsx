import React, { useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Video, Save, CheckCircle2, ArrowLeft, WifiOff, Wifi, Trash2, Film, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UploadedVideo {
  id: number;
  title: string;
  image: string;
  videoUrl: string;
}

// Use production URL or localhost
const SERVER_URL = window.location.hostname === 'creative-design.uz' 
  ? 'https://creative-design.uz' 
  : 'http://localhost:3001';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [serverConnected, setServerConnected] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Uploaded videos state
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Check server connection on mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/health`);
        if (response.ok) {
          setServerConnected(true);
          loadUploadedVideos();
        } else {
          setServerConnected(false);
        }
      } catch (err) {
        setServerConnected(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load uploaded videos
  const loadUploadedVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/videos`);
      if (response.ok) {
        const videos = await response.json();
        setUploadedVideos(videos);
      }
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Delete video
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`${SERVER_URL}/api/videos/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "O'chirishda xatolik");
      }

      // Remove from list
      setUploadedVideos(prev => prev.filter(v => v.id !== id));
      setActionMessage({ type: 'success', text: 'Video o\'chirildi!' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || "Server bilan ulanishda xato" });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  // Rename video
  const handleRename = (video: UploadedVideo) => {
    setEditingId(video.id);
    setEditTitle(video.title);
  };

  const handleSaveRename = async (id: number) => {
    if (!editTitle.trim()) {
      setActionMessage({ type: 'error', text: 'Nom kiritish kerak' });
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/videos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "O'zgartirishda xatolik");
      }

      // Update in list
      setUploadedVideos(prev => prev.map(v => 
        v.id === id ? { ...v, title: editTitle.trim() } : v
      ));
      setEditingId(null);
      setActionMessage({ type: 'success', text: 'Nom o\'zgartirildi!' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || "Server bilan ulanishda xato" });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle("");
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
 
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoFile || !imageFile) {
      setError("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("video", videoFile);
    formData.append("image", imageFile);
    formData.append("password", password);

    try {
      // Use the Node.js upload server
      const response = await fetch(`${SERVER_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yuklashda xatolik yuz berdi");
      }

      setSuccess(true);
      setTitle("");
      setVideoFile(null);
      setImageFile(null);

      // Reset file inputs visually
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => input.value = "");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Server bilan ulanishda xato. Upload server (npm run server) ishlaganiga ishonch hosil qiling.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-stone-100 shadow-xl shadow-stone-200/50">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-center text-stone-800 mb-2">Admin Panel</h2>
          <p className="text-center text-sm text-stone-500 mb-8">Tizimga kirish uchun malumotlarni kiriting.</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Login</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] transition-all"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] transition-all"
                placeholder="••••••••"
              />
            </div>

            {loginError && <p className="text-red-500 text-sm text-center font-medium mt-1">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-3.5 mt-4 bg-[#229ED9] text-white rounded-xl font-medium active:scale-[0.98] transition-all shadow-md shadow-blue-500/20"
            >
              Kirish
            </button>
          </form>
          
          <button onClick={() => navigate("/")} className="w-full mt-4 py-2 text-stone-400 hover:text-stone-600 text-sm flex items-center justify-center gap-1 transition-colors">
            <ArrowLeft size={16} /> Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFCF8] animate-fade-in pb-10 max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAF9F6]/90 backdrop-blur-xl px-6 py-4 flex items-center mb-6 shadow-sm">
        <button
          onClick={() => navigate("/")}
          className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600 active:scale-95 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-serif font-bold text-stone-800">
          Admin Panel <span className="text-xs font-sans font-normal text-rose-500 ml-2 px-2 py-0.5 bg-rose-50 rounded border border-rose-100">Himoyalangan (Lokal)</span>
        </h2>
      </div>

      <div className="px-6">
        {/* Server Status */}
        <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${
          serverConnected 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {serverConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
          <span>
            {serverConnected 
              ? 'Upload server ulandi' 
              : 'Upload server topilmadi. "start-upload-server.bat" ni ishga tushiring!'}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-6">
          <p className="text-stone-500 text-sm mb-6">
            Yangi videoni shu yerdan yuklang. Fayllar avtomatik "public/videos" va "public/image" papkalariga saqlanadi va "data/videos.json" yangilanadi.
          </p>

          <form onSubmit={handleUpload} className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Video nomi (Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Yangi Dizayn"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] transition-all"
              />
            </div>

            {/* Thumbnail Image */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                <ImageIcon size={16} className="text-stone-400" />
                Rasm (Thumbnail: .jpg, .png)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#229ED9]/10 file:text-[#229ED9] hover:file:bg-[#229ED9]/20 transition-all cursor-pointer text-sm"
              />
            </div>

            {/* Video File */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                <Video size={16} className="text-stone-400" />
                Video (.mp4, .mov)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#229ED9]/10 file:text-[#229ED9] hover:file:bg-[#229ED9]/20 transition-all cursor-pointer text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-center gap-2">
                <CheckCircle2 size={18} />
                Muvaffaqiyatli saqlandi! Saytni yangilab (/templates) ko'rishingiz mumkin.
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-4 mt-2 bg-[#229ED9] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1c81b4] active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud size={20} />
              )}
              {isUploading ? "Yuklanmoqda..." : "Videoni Yuklash va Saqlash"}
            </button>
          </form>
        </div>

        {/* Uploaded Videos List */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 flex items-center gap-2">
              <Film size={20} className="text-[#229ED9]" />
              Yuklangan Videolar
            </h3>
            <button
              onClick={loadUploadedVideos}
              className="text-xs text-[#229ED9] hover:text-[#1c81b4] font-medium flex items-center gap-1"
            >
              <RefreshCw size={14} className={isLoadingVideos ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Yangilash</span>
            </button>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
              actionMessage.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {actionMessage.text}
            </div>
          )}

          {isLoadingVideos ? (
            <div className="flex items-center justify-center py-8 text-stone-400">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-[#229ED9] rounded-full animate-spin" />
            </div>
          ) : uploadedVideos.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              Hozircha yuklangan videolar yo'q
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {uploadedVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-[#229ED9]/30 transition-all"
                >
                  <img
                    src={`${SERVER_URL}${video.image}`}
                    alt={video.title}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24'%3E%3Crect fill='%23e5e5e5' width='24' height='24'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='4'%3E?%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === video.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-[#229ED9] rounded focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(video.id);
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                        />
                      </div>
                    ) : (
                      <p className="font-medium text-stone-800 text-sm truncate">
                        {video.title}
                      </p>
                    )}
                    <p className="text-xs text-stone-400">
                      ID: {video.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingId === video.id ? (
                      <>
                        <button
                          onClick={() => handleSaveRename(video.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Saqlash"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Bekor qilish"
                        >
                          <ArrowLeft size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRename(video)}
                          disabled={deletingId === video.id}
                          className="p-2 text-[#229ED9] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Nomini o'zgartirish"
                        >
                          <Save size={18} className="rotate-45" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id, video.title)}
                          disabled={deletingId === video.id || editingId !== null}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="O'chirish"
                        >
                          {deletingId === video.id ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </>
                    )}
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
