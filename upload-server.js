import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as ftp from 'basic-ftp';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Async FTP upload function (Runs in background via Smart Sync script)
async function autoSyncToFTP() {
  console.log(`☁️ FTP Smart Auto-Sync started in background...`);
  try {
    const child = spawn('node', [path.join(__dirname, 'upload-to-hosting.js')], {
      detached: true,
      stdio: 'inherit' // Bu orqali loglarni upload-server oynamizda ham ko'ramiz
    });
    child.unref(); // Server yopilmasligi uchun
  } catch (err) {
    console.error('❌ FTP Auto-Sync trigger failed:', err.message);
  }
}



const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Admin Credentials
// ============================================================================
const ADMIN_PASSWORD = 'creative2026';

// ============================================================================
// Data Paths
// ============================================================================
const DATA_DIR = path.join(__dirname, 'public', 'data');
const VIDEOS_JSON = path.join(DATA_DIR, 'videos.json');
const MUSIC_JSON = path.join(DATA_DIR, 'music.json');
const UPLOAD_DIRS = {
  video: path.join(__dirname, 'public', 'videos'),
  image: path.join(__dirname, 'public', 'image'),
  music: path.join(__dirname, 'public', 'music'),
};

// Ensure all directories exist
[DATA_DIR, ...Object.values(UPLOAD_DIRS)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Initialize JSON files if missing
if (!fs.existsSync(VIDEOS_JSON)) fs.writeFileSync(VIDEOS_JSON, '[]', 'utf-8');
if (!fs.existsSync(MUSIC_JSON)) fs.writeFileSync(MUSIC_JSON, '[]', 'utf-8');

// ============================================================================
// Express Configuration
// ============================================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Multer File Upload Configuration
// ============================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dirMap = { video: UPLOAD_DIRS.video, image: UPLOAD_DIRS.image, music: UPLOAD_DIRS.music };
    cb(null, dirMap[file.fieldname] || UPLOAD_DIRS.video);
  },
  filename: (req, file, cb) => {
    const prefix = { video: 'v', image: 'i', music: 'm' }[file.fieldname] || 'f';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${prefix}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedVideo = /\.(mp4|mov|avi|mkv|webm)$/i;
    const allowedImage = /\.(jpg|jpeg|png|webp|gif|bmp)$/i;
    const allowedMusic = /\.(mp3|m4a|wav|ogg|aac|flac)$/i;

    if (file.fieldname === 'video' && allowedVideo.test(path.extname(file.originalname))) {
      cb(null, true);
    } else if (file.fieldname === 'image' && allowedImage.test(path.extname(file.originalname))) {
      cb(null, true);
    } else if (file.fieldname === 'music' && allowedMusic.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error(`Noto'g'ri fayl formati: ${file.originalname}`));
    }
  }
});

// ============================================================================
// Helper Functions (Asynchronous)
// ============================================================================
async function readJSONAsync(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeJSONAsync(filePath, data) {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getNextId(items) {
  if (items.length === 0) return 1000;
  return Math.max(1000, ...items.map(i => i.id || 0)) + 1;
}

async function deleteLocalFileAsync(relativePath) {
  if (!relativePath || relativePath.startsWith('http')) return;
  const fullPath = path.join(__dirname, 'public', relativePath);
  try {
    await fs.promises.access(fullPath);
    await fs.promises.unlink(fullPath);
    console.log(`🗑️ Deleted: ${fullPath}`);
  } catch {
    // Silent fail if file doesn't exist
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================================================
// API: Health Check
// ============================================================================
app.get('/api/health', async (req, res) => {
  const [videos, music] = await Promise.all([
    readJSONAsync(VIDEOS_JSON),
    readJSONAsync(MUSIC_JSON)
  ]);
  res.json({
    status: 'ok',
    message: '🚀 Upload server ishlamoqda',
    stats: {
      videos: videos.length,
      music: music.length,
    },
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ============================================================================
// API: Dashboard Stats
// ============================================================================
app.get('/api/stats', async (req, res) => {
  const [videos, music] = await Promise.all([
    readJSONAsync(VIDEOS_JSON),
    readJSONAsync(MUSIC_JSON)
  ]);

  let totalSize = 0;
  const countFilesAsync = async (dir) => {
    try {
      const files = await fs.promises.readdir(dir);
      const statsPromises = files.map(f => fs.promises.stat(path.join(dir, f)));
      const stats = await Promise.all(statsPromises);
      stats.forEach(stat => { totalSize += stat.size; });
      return files.length;
    } catch {
      return 0;
    }
  };

  const [videoFiles, imageFiles, musicFiles] = await Promise.all([
    countFilesAsync(UPLOAD_DIRS.video),
    countFilesAsync(UPLOAD_DIRS.image),
    countFilesAsync(UPLOAD_DIRS.music)
  ]);

  res.json({
    videos: videos.length,
    music: music.length,
    files: { videos: videoFiles, images: imageFiles, music: musicFiles },
    diskUsage: formatFileSize(totalSize),
    lastVideoUpload: videos.length > 0 ? videos[videos.length - 1].title : null,
    lastMusicUpload: music.length > 0 ? music[music.length - 1].title : null,
  });
});

// ============================================================================
// API: Video Upload
// ============================================================================
app.post('/api/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), async (req, res) => {
  try {
    const { password, title } = req.body;
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Parol noto'g'ri" });
    }

    if (!req.files?.video || !req.files?.image) {
      return res.status(400).json({ error: "Video va rasm fayllarini yuklang" });
    }

    const videoFile = req.files.video[0];
    const imageFile = req.files.image[0];
    const videos = await readJSONAsync(VIDEOS_JSON);
    const newId = getNextId(videos);

    const newVideo = {
      id: newId,
      title: title || `Dizayn ${newId}`,
      image: `/image/${imageFile.filename}`,
      videoUrl: `/videos/${videoFile.filename}`,
      uploadedAt: new Date().toISOString(),
      size: formatFileSize(videoFile.size + imageFile.size),
    };

    videos.push(newVideo);
    await writeJSONAsync(VIDEOS_JSON, videos);

    console.log(`✅ Yangi video yuklandi: "${newVideo.title}" (ID: ${newId})`);
    console.log(`   📁 Video: ${videoFile.filename} (${formatFileSize(videoFile.size)})`);
    console.log(`   🖼️ Rasm: ${imageFile.filename} (${formatFileSize(imageFile.size)})`);

    res.json({
      success: true,
      message: `"${newVideo.title}" muvaffaqiyatli yuklandi va serverga yuborilmoqda!`,
      data: newVideo,
      totalVideos: videos.length,
    });

    // Run auto-sync to production in background without blocking response
    autoSyncToFTP();
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: error.message || 'Server xatosi' });
  }
});

// ============================================================================
// API: Instagram Video Download & Auto-Upload
// ============================================================================
app.post('/api/download-instagram', async (req, res) => {
  try {
    const { password, instagramUrl, customTitle } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Parol noto'g'ri" });
    }

    if (!instagramUrl || !instagramUrl.includes('instagram.com')) {
      return res.status(400).json({ error: "To'g'ri Instagram URL kiriting" });
    }

    console.log(`📥 Instagram download requested: ${instagramUrl}`);

    // Download directory
    const downloadDir = path.join(__dirname, 'downloads', 'instagram');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Run Python script to download video (spawn already imported at top)
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'instagram-downloader.py'),
      instagramUrl,
      downloadDir
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[Downloader] ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`[Downloader Error] ${data.toString()}`);
    });

    pythonProcess.on('close', async (code) => {
      try {
        if (code !== 0) {
          return res.status(500).json({
            error: "Video yuklab olinmadi",
            details: errorOutput
          });
        }

        // Parse result
        const resultMatch = output.match(/\{[\s\S]*\}/);
        if (!resultMatch) {
          return res.status(500).json({
            error: "Download result parse error",
            output: output
          });
        }

        const result = JSON.parse(resultMatch[0]);

        if (!result.success) {
          return res.status(500).json({
            error: result.error || "Download failed"
          });
        }

        // Read downloaded files
        const videoData = fs.readFileSync(result.video_path);
        const videoFilename = path.basename(result.video_path);
        
        let imageData = null;
        let imageFilename = null;
        
        if (result.thumbnail_path && fs.existsSync(result.thumbnail_path)) {
          imageData = fs.readFileSync(result.thumbnail_path);
          imageFilename = path.basename(result.thumbnail_path);
        }

        // Move files to proper locations
        const finalVideoName = `v_${Date.now()}.mp4`;
        const finalImageName = `i_${Date.now()}.jpg`;
        
        const videoDest = path.join(UPLOAD_DIRS.video, finalVideoName);
        const imageDest = path.join(UPLOAD_DIRS.image, finalImageName);

        fs.copyFileSync(result.video_path, videoDest);
        
        if (imageData) {
          fs.copyFileSync(result.thumbnail_path, imageDest);
        } else {
          // Create a placeholder if no thumbnail
          const placeholderPath = path.join(UPLOAD_DIRS.image, finalImageName);
          fs.writeFileSync(placeholderPath, '');
        }

        // Add to videos.json
        const videos = await readJSONAsync(VIDEOS_JSON);
        const newId = getNextId(videos);

        const newVideo = {
          id: newId,
          title: customTitle || result.title || `Instagram #${newId}`,
          image: `/image/${finalImageName}`,
          videoUrl: `/videos/${finalVideoName}`,
          uploadedAt: new Date().toISOString(),
          size: `${result.size_mb || 0} MB`,
        };

        videos.push(newVideo);
        await writeJSONAsync(VIDEOS_JSON, videos);

        // Cleanup download directory
        try {
          fs.rmSync(result.video_path);
          if (result.thumbnail_path) fs.rmSync(result.thumbnail_path);
        } catch (e) { /* ignore cleanup errors */ }

        console.log(`✅ Instagram video uploaded: "${newVideo.title}" (ID: ${newId})`);

        res.json({
          success: true,
          message: `"${newVideo.title}" muvaffaqiyatli yuklandi!`,
          data: newVideo,
          totalVideos: videos.length,
        });

        // Auto-sync to production
        autoSyncToFTP();
      } catch (err) {
        console.error('Instagram upload error:', err);
        res.status(500).json({ error: err.message || 'Server error' });
      }
    });

  } catch (error) {
    console.error('Instagram download endpoint error:', error);
    res.status(500).json({ error: error.message || 'Server xatosi' });
  }
});

// ============================================================================
// API: Get All Videos
// ============================================================================
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await readJSONAsync(VIDEOS_JSON);
    res.json(videos);
  } catch (error) {
    console.error('Error reading videos:', error);
    res.status(500).json({ error: 'Videolarni o\'qishda xatolik' });
  }
});

// ============================================================================
// API: Delete Video
// ============================================================================
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const videos = await readJSONAsync(VIDEOS_JSON);
    const index = videos.findIndex(v => v.id === videoId);

    if (index === -1) {
      return res.status(404).json({ error: 'Video topilmadi' });
    }

    const video = videos[index];

    // Delete local files
    await Promise.all([
      deleteLocalFileAsync(video.videoUrl),
      deleteLocalFileAsync(video.image)
    ]);

    videos.splice(index, 1);
    await writeJSONAsync(VIDEOS_JSON, videos);

    console.log(`🗑️ Video o'chirildi: "${video.title}" (ID: ${videoId})`);

    res.json({
      success: true,
      message: `"${video.title}" o'chirildi`,
      deletedId: videoId,
      totalVideos: videos.length,
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// API: Rename Video
// ============================================================================
app.put('/api/videos/:id', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { title } = req.body;
    const videos = await readJSONAsync(VIDEOS_JSON);
    const index = videos.findIndex(v => v.id === videoId);

    if (index === -1) return res.status(404).json({ error: 'Video topilmadi' });
    if (!title?.trim()) return res.status(400).json({ error: 'Nom kiritish kerak' });

    const oldTitle = videos[index].title;
    videos[index].title = title.trim();
    await writeJSONAsync(VIDEOS_JSON, videos);

    console.log(`✏️ Video nomi o'zgartirildi: "${oldTitle}" → "${title.trim()}"`);

    res.json({ success: true, message: "Nom o'zgartirildi", data: videos[index] });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// API: Music Upload
// ============================================================================
app.post('/api/upload-music', upload.fields([
  { name: 'music', maxCount: 1 },
]), async (req, res) => {
  try {
    const { password, title, author } = req.body;
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Parol noto'g'ri" });
    }

    if (!req.files?.music) {
      return res.status(400).json({ error: 'Musiqa faylni yuklang' });
    }

    const musicFile = req.files.music[0];
    const musicList = await readJSONAsync(MUSIC_JSON);
    const newId = getNextId(musicList);

    const newMusic = {
      id: newId,
      title: title || 'Yangi musiqa',
      author: author || "Noma'lum",
      duration: '0:00',
      url: `/music/${musicFile.filename}`,
      uploadedAt: new Date().toISOString(),
      size: formatFileSize(musicFile.size),
    };

    musicList.push(newMusic);
    await writeJSONAsync(MUSIC_JSON, musicList);

    console.log(`🎵 Yangi musiqa yuklandi: "${newMusic.title}" by ${newMusic.author} (ID: ${newId})`);
    console.log(`   📁 Fayl: ${musicFile.filename} (${formatFileSize(musicFile.size)})`);

    res.json({
      success: true,
      message: `"${newMusic.title}" muvaffaqiyatli yuklandi!`,
      data: newMusic,
      totalMusic: musicList.length,
    });
  } catch (error) {
    console.error('Music upload error:', error);
    res.status(500).json({ error: error.message || 'Server xatosi' });
  }
});

// ============================================================================
// API: Get All Music
// ============================================================================
app.get('/api/music', async (req, res) => {
  try {
    const music = await readJSONAsync(MUSIC_JSON);
    res.json(music);
  } catch (error) {
    console.error('Error reading music:', error);
    res.status(500).json({ error: 'Musiqalarni o\'qishda xatolik' });
  }
});

// ============================================================================
// API: Delete Music
// ============================================================================
app.delete('/api/music/:id', async (req, res) => {
  try {
    const musicId = parseInt(req.params.id);
    const musicList = await readJSONAsync(MUSIC_JSON);
    const index = musicList.findIndex(m => m.id === musicId);

    if (index === -1) {
      return res.status(404).json({ error: 'Musiqa topilmadi' });
    }

    const music = musicList[index];
    await deleteLocalFileAsync(music.url);

    musicList.splice(index, 1);
    await writeJSONAsync(MUSIC_JSON, musicList);

    console.log(`🗑️ Musiqa o'chirildi: "${music.title}" (ID: ${musicId})`);

    res.json({
      success: true,
      message: `"${music.title}" o'chirildi`,
      deletedId: musicId,
      totalMusic: musicList.length,
    });
  } catch (error) {
    console.error('Music delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// API: Rename Music
// ============================================================================
app.put('/api/music/:id', async (req, res) => {
  try {
    const musicId = parseInt(req.params.id);
    const { title, author } = req.body;
    const musicList = await readJSONAsync(MUSIC_JSON);
    const index = musicList.findIndex(m => m.id === musicId);

    if (index === -1) return res.status(404).json({ error: 'Musiqa topilmadi' });

    if (title?.trim()) musicList[index].title = title.trim();
    if (author?.trim()) musicList[index].author = author.trim();
    await writeJSONAsync(MUSIC_JSON, musicList);

    console.log(`✏️ Musiqa yangilandi: ID ${musicId}`);

    res.json({ success: true, message: "Musiqa yangilandi", data: musicList[index] });
  } catch (error) {
    console.error('Music update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Error Handler for Multer
// ============================================================================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Fayl hajmi juda katta (max 500MB)' });
    }
    return res.status(400).json({ error: `Upload xatosi: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ============================================================================
// Serve Static Files
// ============================================================================
app.use('/videos', express.static(UPLOAD_DIRS.video));
app.use('/image', express.static(UPLOAD_DIRS.image));
app.use('/music', express.static(UPLOAD_DIRS.music));
app.use('/data', express.static(DATA_DIR));

// ============================================================================
// Start Server
// ============================================================================
app.listen(PORT, async () => {
  const videos = await readJSONAsync(VIDEOS_JSON);
  const music = await readJSONAsync(MUSIC_JSON);

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    🚀 Creative Design Upload Server             ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🌐 Server:  http://localhost:${PORT}              ║`);
  console.log(`║  📹 Videos:  ${String(videos.length).padEnd(36)}║`);
  console.log(`║  🎵 Music:   ${String(music.length).padEnd(36)}║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  📤 POST /api/upload        - Video yuklash     ║');
  console.log('║  📤 POST /api/upload-music   - Musiqa yuklash   ║');
  console.log('║  📋 GET  /api/videos         - Videolar          ║');
  console.log('║  📋 GET  /api/music          - Musiqalar         ║');
  console.log('║  📊 GET  /api/stats          - Statistika        ║');
  console.log('║  💚 GET  /api/health         - Health check      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});
