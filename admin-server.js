import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/videos');
const imageDir = path.join(__dirname, 'public/image');

[uploadDir, imageDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, 'public/videos');
        } else {
            cb(null, 'public/image');
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fileName = `${Date.now()}${ext}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage });

// Admin Login endpoint (Optional, usually handled frontend)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'creative2026') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Upload endpoint
app.post('/api/upload.php', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), (req, res) => {
    try {
        const { title } = req.body;
        const videoFile = req.files['video'] ? req.files['video'][0] : null;
        const imageFile = req.files['image'] ? req.files['image'][0] : null;

        if (!videoFile || !imageFile) {
            return res.status(400).json({ error: 'Fayllar yetishmayapti' });
        }

        // Return the paths to the frontend
        res.json({
            success: true,
            videoPath: `/videos/${videoFile.filename}`,
            imagePath: `/image/${imageFile.filename}`,
            title: title
        });
        
        console.log(`✅ Yangi video yuklandi: ${title}`);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Admin server ishga tushdi: http://localhost:${port}`);
    console.log(`📡 API endpoint: http://localhost:${port}/api/upload.php`);
});
