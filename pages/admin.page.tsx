import React, { useState } from "react";
import { UploadCloud, Image as ImageIcon, Video, Save, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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
      const response = await fetch("http://localhost:3001/api/upload", {
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
      </div>
    </div>
  );
};
