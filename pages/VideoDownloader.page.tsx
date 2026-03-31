import React, { useState } from 'react';
import { Download, Loader, AlertCircle, Film, Link } from 'lucide-react';

/**
 * Simple Video Downloader Page for creative-design.uz
 * Connects to the FastAPI backend (api_enhanced.py)
 */
export default function VideoDownloaderPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Backend API URL
  const API_BASE = 'http://localhost:8000';

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Iltimos, video havolasini kiriting');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, include_thumbnails: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Video ma\\lumotlarini olish muvaffaqiyatsiz');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formatId: string, quality: string) => {
    setDownloading(true);

    try {
      const response = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format_id: formatId, quality }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Yuklab olish muvaffaqiyatsiz');
      }

      // Download the file
      if (data.download_type === 'direct' && data.direct_url) {
        window.open(data.direct_url, '_blank');
      } else if (data.task_id) {
        window.open(`${API_BASE}/api/download/${data.task_id}`, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Yuklab olish muvaffaqiyatsiz');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Film className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Video Yuklab Olish
                </h1>
                <p className="text-sm text-gray-500">
                  YouTube, Instagram, TikTok va boshqalar
                </p>
              </div>
            </div>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Bosh sahifa
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* URL Input */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Video Havolasi
              </span>
              <div className="mt-1 flex space-x-3">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Tahlil...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Tahlil Qilish</span>
                    </>
                  )}
                </button>
              </div>
            </label>
          </form>

          {/* Supported Platforms */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Qo'llab-quvvatlanadigan platformalar:</p>
            <div className="flex flex-wrap gap-2">
              {['YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'Vimeo'].map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Xatolik</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Video ma'lumotlari olinmoqda...</p>
          </div>
        )}

        {/* Results */}
        {result && result.success && (
          <div className="space-y-6">
            {/* Video Info */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="md:flex">
                {result.thumbnail && (
                  <div className="md:w-1/3">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-full h-full object-cover min-h-[200px]"
                    />
                  </div>
                )}
                <div className="p-6 md:w-2/3">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {result.title}
                  </h2>
                  {result.uploader && (
                    <p className="text-gray-600 mb-3">
                      <span className="font-medium">Muallif:</span> {result.uploader}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {result.duration && (
                      <span>⏱️ {result.duration_formatted}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Download Formats */}
            {result.merged_formats && result.merged_formats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Tavsiya Etilgan Formatlar ({result.merged_formats.length})
                </h3>
                <div className="space-y-3">
                  {result.merged_formats.slice(0, 5).map((format: any) => (
                    <div
                      key={format.format_id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {format.quality}
                        </span>
                        <span className="text-sm text-gray-600">
                          {format.ext.toUpperCase()} • {format.filesize_formatted}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(format.format_id, format.quality)}
                        disabled={downloading}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {downloading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Yuklanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Yuklab olish</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 Creative Design UZ • Video Downloader
          </p>
        </div>
      </footer>
    </div>
  );
}
