import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';
import * as ftp from 'basic-ftp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// FTP Configuration — sayt.uz hosting
// ============================================================================
const FTP_CONFIG = {
  host: 'ns8.sayt.uz',
  user: 'creative-designuz',
  password: 'qH9fZ2yF5z',
  secure: false,
  remotePath: '/public_html/media',
};

// Hosting CDN base URL
const CDN_BASE = 'https://creative-design.uz/media';

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
// Multer File Upload
// ============================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, 'public', 'videos');
    } else if (file.fieldname === 'image') {
      uploadPath = path.join(__dirname, 'public', 'image');
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    if (file.fieldname === 'video') {
      cb(null, `v_${uniqueSuffix}${ext}`);
    } else if (file.fieldname === 'image') {
      cb(null, `i_${uniqueSuffix}${ext}`);
    }
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// ============================================================================
// FTP Upload Helper
// ============================================================================

/**
 * Upload a local file to FTP hosting.
 * @param localPath - Absolute path to local file
 * @param remoteDir - Remote directory relative to FTP_CONFIG.remotePath (e.g., 'videos')
 * @param remoteFilename - Filename on remote server
 * @returns Remote URL
 */
async function uploadToFTP(localPath, remoteDir, remoteFilename) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: FTP_CONFIG.host,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
      secure: FTP_CONFIG.secure,
    });

    const remotePath = `${FTP_CONFIG.remotePath}/${remoteDir}`;

    // Ensure remote directory exists
    await client.ensureDir(remotePath);

    // Upload file
    await client.uploadFrom(localPath, `${remotePath}/${remoteFilename}`);

    console.log(`✅ FTP uploaded: ${remoteFilename} → ${remotePath}/`);
    return `${CDN_BASE}/${remoteDir}/${remoteFilename}`;
  } catch (err) {
    console.error(`❌ FTP upload failed for ${remoteFilename}:`, err.message);
    throw err;
  } finally {
    client.close();
  }
}

// ============================================================================
// API Endpoints
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Upload server is running', ftp: FTP_CONFIG.host });
});

// Upload endpoint — saves locally + uploads to FTP hosting
app.post('/api/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), async (req, res) => {
  console.log('Upload request received');

  try {
    const password = req.body.password;
    if (password !== 'creative2026') {
      return res.status(401).json({ error: "Parol noto'g'ri yoki ruxsat yo'q" });
    }

    if (!req.files?.video || !req.files?.image) {
      return res.status(400).json({ error: "Iltimos, video va rasmni to'liq yuklang" });
    }

    const title = req.body.title || 'Yangi video';
    const videoFile = req.files.video[0];
    const imageFile = req.files.image[0];

    console.log('Files saved locally:', videoFile.filename, imageFile.filename);

    // Upload to FTP hosting
    let videoUrl, imageUrl;
    try {
      console.log('📤 Uploading to FTP hosting...');

      videoUrl = await uploadToFTP(
        videoFile.path,
        'videos',
        videoFile.filename,
      );

      imageUrl = await uploadToFTP(
        imageFile.path,
        'image',
        imageFile.filename,
      );

      console.log('✅ FTP upload complete!');
      console.log('   Video:', videoUrl);
      console.log('   Image:', imageUrl);
    } catch (ftpErr) {
      console.error('⚠️ FTP upload failed, using local paths:', ftpErr.message);
      // Fallback to local paths
      videoUrl = `/videos/${videoFile.filename}`;
      imageUrl = `/image/${imageFile.filename}`;
    }

    // Save to videos.json
    const dataDir = path.join(__dirname, 'public', 'data');
    const dataFile = path.join(dataDir, 'videos.json');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let videos = [];
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      videos = JSON.parse(content);
    }

    let maxId = 48;
    videos.forEach(v => {
      if (v.id && v.id > maxId) maxId = v.id;
    });

    const newVideo = {
      id: maxId + 1,
      title: title,
      image: imageUrl,
      videoUrl: videoUrl,
    };

    videos.push(newVideo);
    fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2), 'utf-8');

    console.log(`✅ New video saved: ${title} (ID: ${newVideo.id})`);

    res.json({
      success: true,
      message: 'Video muvaffaqiyatli saqlandi va hostingga yuklandi!',
      data: newVideo,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Serverda xatolik yuz berdi' });
  }
});

// Get all videos
app.get('/api/videos', (req, res) => {
  try {
    const dataFile = path.join(__dirname, 'public', 'data', 'videos.json');
    if (!fs.existsSync(dataFile)) {
      return res.json([]);
    }
    const content = fs.readFileSync(dataFile, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Error reading videos:', error);
    res.status(500).json({ error: 'Failed to read videos' });
  }
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const dataFile = path.join(__dirname, 'public', 'data', 'videos.json');

    if (!fs.existsSync(dataFile)) {
      return res.status(404).json({ error: 'Videos file not found' });
    }

    const content = fs.readFileSync(dataFile, 'utf-8');
    let videos = JSON.parse(content);

    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videos[videoIndex];

    // Delete local files if they exist
    if (!video.videoUrl.startsWith('http')) {
      const videoPath = path.join(__dirname, 'public', 'videos', path.basename(video.videoUrl));
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }
    if (!video.image.startsWith('http')) {
      const imagePath = path.join(__dirname, 'public', 'image', path.basename(video.image));
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    videos.splice(videoIndex, 1);
    fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2), 'utf-8');

    console.log(`Video deleted: ${video.title} (ID: ${videoId})`);
    res.json({ success: true, message: "Video o'chirildi", deletedId: videoId });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Serverda xatolik yuz berdi' });
  }
});

// Rename video
app.put('/api/videos/:id', (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { title } = req.body;
    const dataFile = path.join(__dirname, 'public', 'data', 'videos.json');

    if (!fs.existsSync(dataFile) || !title?.trim()) {
      return res.status(400).json({ error: 'Nom kiritish kerak' });
    }

    const content = fs.readFileSync(dataFile, 'utf-8');
    let videos = JSON.parse(content);

    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    videos[videoIndex].title = title.trim();
    fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2), 'utf-8');

    console.log(`Video renamed: ${videoId} - ${title}`);
    res.json({ success: true, message: "Nom o'zgartirildi", data: videos[videoIndex] });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message || 'Serverda xatolik yuz berdi' });
  }
});

// Auto Download from Instagram/YouTube
app.post('/api/auto-download', async (req, res) => {
  try {
    const { url, password } = req.body;

    if (password !== 'creative2026') {
      return res.status(401).json({ error: "Parol noto'g'ri" });
    }
    if (!url?.trim()) {
      return res.status(400).json({ error: 'URL kiriting' });
    }

    console.log(`[INFO] Auto download started: ${url}`);

    const scriptPath = path.join(__dirname, 'telegram-video-bot', 'auto_template_downloader.py');
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({ error: 'Auto downloader script topilmadi' });
    }

    const pythonProcess = spawn('python', [scriptPath, url], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, message: "Video muvaffaqiyatli yuklandi va templatesga qo'shildi" });
      } else {
        res.status(500).json({ error: 'Video yuklashda xatolik', details: errorOutput });
      }
    });
  } catch (error) {
    console.error('Auto download error:', error);
    res.status(500).json({ error: error.message || 'Serverda xatolik yuz berdi' });
  }
});

// Serve static files
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));
app.use('/image', express.static(path.join(__dirname, 'public', 'image')));
app.use('/data', express.static(path.join(__dirname, 'public', 'data')));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Upload server running on http://localhost:${PORT}`);
  console.log(`📤 FTP Host: ${FTP_CONFIG.host}`);
  console.log(`🌐 CDN Base: ${CDN_BASE}`);
});
