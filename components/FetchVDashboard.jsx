import React, { useState } from 'react';
import { Download, Loader, CheckCircle, AlertCircle, Film, Music, Video, Tv } from 'lucide-react';

// ============================================================================
// Types (for TypeScript - can be used with JSDoc in .jsx)
// ============================================================================

/**
 * @typedef {Object} MergedFormat
 * @property {string} format_id
 * @property {string} quality
 * @property {number|null} height
 * @property {number|null} filesize
 * @property {string} filesize_formatted
 * @property {string} ext
 * @property {string|null} vcodec
 * @property {string|null} acodec
 * @property {string|null} url
 */

/**
 * @typedef {Object} ExtractResponse
 * @property {boolean} success
 * @property {string} title
 * @property {string|null} thumbnail
 * @property {number|null} duration
 * @property {string} duration_formatted
 * @property {string|null} uploader
 * @property {MergedFormat[]} merged_formats
 */

// ============================================================================
// FetchV-Style Dashboard Component
// ============================================================================

export default function FetchVDashboard() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null); // format_id being downloaded
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // API base URL (update for production)
  const API_BASE = 'http://localhost:8000';

  /**
   * Analyze video URL
   */
  const handleAnalyze = async (e) => {
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
        body: JSON.stringify({ 
          url,
          include_thumbnails: true 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Video ma\\'lumotlarini olish muvaffaqiyatsiz');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download specific format
   * @param {string} formatId 
   * @param {string} quality 
   */
  const handleDownload = async (formatId, quality) => {
    setDownloading(formatId);

    try {
      const response = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          format_id: formatId,
          quality: quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Yuklab olish muvaffaqiyatsiz');
      }

      // Handle different download types
      if (data.download_type === 'direct') {
        // Direct URL - open in new tab
        window.open(data.direct_url, '_blank');
      } else if (data.download_type === 'file' || data.download_type === 'hls') {
        // File on server - download via endpoint
        window.open(`${API_BASE}/api/download/${data.task_id}`, '_blank');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Film className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  FetchV Clone
                </h1>
                <p className="text-sm text-gray-500">
                  Professional Video Downloader
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Powered by</p>
              <p className="text-sm font-semibold text-blue-600">
                Creative Design UZ
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* URL Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Video Havolasi
              </span>
              <div className="mt-1 flex space-x-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="YouTube, Instagram, TikTok, yoki boshqa video URL..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Yuklanmoqda...</span>
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
              {['YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'Vimeo', 'HLS/m3u8'].map((platform) => (
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

        {/* Error Message */}
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

        {/* Loading Animation */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Video ma'lumotlari olinmoqda...</p>
          </div>
        )}

        {/* Results - FetchV Style Format Table */}
        {result && result.success && (
          <div className="space-y-8">
            {/* Video Info Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {result.title}
                  </h2>
                  {result.uploader && (
                    <p className="text-gray-600 mb-3">
                      <span className="font-medium">Muallif:</span> {result.uploader}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {result.duration && (
                      <span className="flex items-center">
                        <Video className="w-4 h-4 mr-1" />
                        {result.duration_formatted}
                      </span>
                    )}
                    {result.view_count && (
                      <span className="flex items-center">
                        <Tv className="w-4 h-4 mr-1" />
                        {new Intl.NumberFormat().format(result.view_count)} views
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Merged Formats (Ready MP4s) */}
            {result.merged_formats && result.merged_formats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Tayyor Videolar ({result.merged_formats.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sifat</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Format</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hajm</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Kodek</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.merged_formats.map((format) => (
                        <tr
                          key={format.format_id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {format.quality}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {format.ext.toUpperCase()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {format.filesize_formatted}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {format.vcodec} + {format.acodec}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleDownload(format.format_id, format.quality)}
                              disabled={downloading === format.format_id}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                            >
                              {downloading === format.format_id ? (
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audio Formats */}
            {result.audio_formats && result.audio_formats.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Music className="w-6 h-6 text-purple-500 mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Audio Fayllar ({result.audio_formats.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sifat</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Format</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hajm</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.audio_formats.map((format) => (
                        <tr
                          key={format.format_id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              {format.quality}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {format.ext.toUpperCase()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {format.filesize_formatted}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => handleDownload(format.format_id, 'best')}
                              disabled={downloading === format.format_id}
                              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                            >
                              {downloading === format.format_id ? (
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            FetchV-style Video Downloader • Powered by yt-dlp & FFmpeg
          </p>
        </div>
      </footer>
    </div>
  );
}
