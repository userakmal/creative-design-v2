/**
 * CHECK MEDIA FILES ON HOSTING
 * Verifies that uploaded video and image files are accessible
 */

const CDN_BASE = 'https://creative-design.uz';

// Read local videos.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const videosJsonPath = path.join(__dirname, 'public', 'data', 'videos.json');
const videosData = JSON.parse(fs.readFileSync(videosJsonPath, 'utf-8'));

console.log('🔍 Checking uploaded media files on hosting...\n');

for (const video of videosData) {
  console.log(`📹 Video #${video.id}: ${video.title}`);
  
  const videoUrl = `${CDN_BASE}${video.videoUrl}`;
  const imageUrl = `${CDN_BASE}${video.image}`;
  
  console.log(`   Checking: ${video.videoUrl}`);
  
  try {
    const videoRes = await fetch(videoUrl, { method: 'HEAD' });
    const videoOk = videoRes.ok;
    const videoSize = videoRes.headers.get('content-length');
    
    console.log(`   ${videoOk ? '✅' : '❌'} Video: ${videoRes.status} (${videoSize ? (videoSize / (1024*1024)).toFixed(2) + ' MB' : 'unknown size'})`);
  } catch (err) {
    console.log(`   ❌ Video: Failed - ${err.message}`);
  }
  
  try {
    const imageRes = await fetch(imageUrl, { method: 'HEAD' });
    const imageOk = imageRes.ok;
    const imageSize = imageRes.headers.get('content-length');
    
    console.log(`   ${imageOk ? '✅' : '❌'} Image: ${imageRes.status} (${imageSize ? (imageSize / 1024).toFixed(1) + ' KB' : 'unknown size'})`);
  } catch (err) {
    console.log(`   ❌ Image: Failed - ${err.message}`);
  }
  
  console.log('');
}

// Also test a built-in video to make sure CDN works
console.log('🎬 Testing built-in video for comparison...');
const builtInVideo = `${CDN_BASE}/videos/v1.mp4`;
try {
  const res = await fetch(builtInVideo, { method: 'HEAD' });
  console.log(`   ${res.ok ? '✅' : '❌'} v1.mp4: ${res.status} (${res.headers.get('content-length') ? (res.headers.get('content-length') / (1024*1024)).toFixed(2) + ' MB' : 'unknown'})`);
} catch (err) {
  console.log(`   ❌ Failed: ${err.message}`);
}
