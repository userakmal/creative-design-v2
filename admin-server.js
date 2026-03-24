import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let folder = "";
    if (file.fieldname === "video") folder = "public/videos";
    else if (file.fieldname === "image") folder = "public/image";
    else folder = "public/uploads";

    const dir = path.join(__dirname, folder);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename preserving extension
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

// Upload Endpoint
app.post(
  "/api/upload",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const { title } = req.body;

      if (!files.video || !files.video[0] || !files.image || !files.image[0]) {
        return res.status(400).json({ error: "Video and Image are required" });
      }

      const videoFile = files.video[0];
      const imageFile = files.image[0];

      // Relative paths for the frontend
      const videoUrl = `/videos/${videoFile.filename}`;
      const imageUrl = `/image/${imageFile.filename}`;

      // Update config.ts
      const configPath = path.join(__dirname, "config.ts");
      let configContent = await fs.readFile(configPath, "utf-8");

      // Extract existing IDs using regex to find max ID
      const idMatches = [...configContent.matchAll(/id:\s*(\d+)/g)];
      let maxId = 0;
      idMatches.forEach((match) => {
        const id = parseInt(match[1]);
        if (id > maxId) maxId = id;
      });

      const newId = maxId + 1;

      // Construct new video entry string
      const newVideoEntry = `    {
      id: ${newId},
      title: "${title}",
      image: "${imageUrl}",
      videoUrl: "${videoUrl}",
    },
  ],

  // 4. MUSIQALAR RO'YXATI`;

      // Find the end of the videos array and insert the new entry
      const searchTarget = `  ],

  // 4. MUSIQALAR RO'YXATI`;
      
      if (!configContent.includes(searchTarget)) {
        throw new Error("Could not find the insertion point in config.ts");
      }

      configContent = configContent.replace(searchTarget, newVideoEntry);

      await fs.writeFile(configPath, configContent, "utf-8");

      res.json({ success: true, message: "Video uploaded and config updated!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// M3U8 Downloader Endpoint
import { spawn } from "child_process";

app.post("/api/download-m3u8", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('.m3u8')) {
      return res.status(400).json({ error: "M3U8 havola kiritilmadi yoki yaroqsiz." });
    }

    const fileName = `m3u8-${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, "public", "videos", fileName);

    // M3U8 dan MP4 ga o'girish uchun FFmpeg buyrug'i
    const ffmpeg = spawn("ffmpeg", [
      "-i", url,
      "-c", "copy",
      "-bsf:a", "aac_adtstoasc",
      outputPath
    ]);

    let errorOutput = "";
    ffmpeg.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        res.json({ success: true, url: `http://localhost:3001/videos/${fileName}`, file: fileName });
      } else {
        console.error("FFmpeg error:", errorOutput);
        res.status(500).json({ error: "Videoni saqlab bo'lmadi. Serverda FFmpeg dasturi o'rnatilganligiga ishonch hosil qiling." });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Admin Upload Server running on http://localhost:${PORT}`);
});
