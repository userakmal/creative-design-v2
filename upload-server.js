import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, 'public', 'videos');
    } else if (file.fieldname === 'image') {
      uploadPath = path.join(__dirname, 'public', 'image');
    }
    
    // Create directory if it doesn't exist
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
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Faqat mp4, mov yoki webm formatlari ruxsat etiladi'), false);
    }
  } else if (file.fieldname === 'image') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Faqat jpg, jpeg, png yoki webp formatlari ruxsat etiladi'), false);
    }
  } else {
    cb(new Error('Noto\'g\'ri fayl turi'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload endpoint
app.post('/api/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check password
    const password = req.body.password;
    if (password !== 'creative2026') {
      return res.status(401).json({ error: 'Parol noto\'g\'ri yoki ruxsat yo\'q' });
    }

    if (!req.files?.video || !req.files?.image) {
      return res.status(400).json({ error: 'Iltimos, video va rasmni to\'liq yuklang' });
    }

    const title = req.body.title || 'Yangi video';
    const videoFile = req.files.video[0];
    const imageFile = req.files.image[0];

    // Create file paths for the website
    const videoUrl = `/videos/${path.basename(videoFile.filename)}`;
    const imageUrl = `/image/${path.basename(imageFile.filename)}`;

    // Read existing videos from data/videos.json
    const dataDir = path.join(__dirname, 'data');
    const dataFile = path.join(dataDir, 'videos.json');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let videos = [];
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      videos = JSON.parse(content);
    }

    // Find max ID
    let maxId = 48; // Starting from the base config
    videos.forEach(v => {
      if (v.id && v.id > maxId) {
        maxId = v.id;
      }
    });

    const newId = maxId + 1;
    const newVideo = {
      id: newId,
      title: title,
      image: imageUrl,
      videoUrl: videoUrl
    };

    videos.push(newVideo);

    // Save to videos.json
    fs.writeFileSync(dataFile, JSON.stringify(videos, null, 2), 'utf-8');

    console.log(`New video uploaded: ${title} (ID: ${newId})`);

    res.json({
      success: true,
      message: 'Video muvaffaqiyatli saqlandi!',
      data: newVideo
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Serverda xatolik yuz berdi' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Upload server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Upload server running on http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
});
