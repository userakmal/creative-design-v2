/**
 * Bulk FTP Upload Script
 * Uploads all videos and images from public/ to hosting FTP server.
 * Run: node upload-to-hosting.js
 */

import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FTP_CONFIG = {
  host: 'ns8.sayt.uz',
  user: 'creative-designuz',
  password: 'qH9fZ2yF5z',
  secure: false,
};

const REMOTE_BASE = '/public_html/media';
const CDN_BASE = 'https://creative-design.uz/media';

async function connectFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  await client.access({
    host: FTP_CONFIG.host,
    user: FTP_CONFIG.user,
    password: FTP_CONFIG.password,
    secure: FTP_CONFIG.secure,
  });

  return client;
}

async function uploadDirectory(client, localDir, remoteDir) {
  const files = fs.readdirSync(localDir).filter(f => {
    const fullPath = path.join(localDir, f);
    return fs.statSync(fullPath).isFile();
  });

  console.log(`\n📂 Uploading ${files.length} files from ${localDir} → ${remoteDir}`);

  await client.ensureDir(`${REMOTE_BASE}/${remoteDir}`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = `${REMOTE_BASE}/${remoteDir}/${file}`;

    try {
      process.stdout.write(`  [${uploaded + failed + 1}/${files.length}] ${file}...`);
      await client.uploadFrom(localPath, remotePath);
      uploaded++;
      console.log(' ✅');
    } catch (err) {
      failed++;
      console.log(` ❌ ${err.message}`);
    }
  }

  console.log(`  📊 Result: ${uploaded} uploaded, ${failed} failed`);
  return { uploaded, failed };
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  BULK FTP UPLOAD — creative-design.uz hosting');
  console.log('════════════════════════════════════════════════');
  console.log(`FTP Host: ${FTP_CONFIG.host}`);
  console.log(`Remote:   ${REMOTE_BASE}/`);
  console.log(`CDN:      ${CDN_BASE}/`);
  console.log('');

  const client = await connectFTP();
  console.log('✅ FTP connected!');

  const totals = { uploaded: 0, failed: 0 };

  // Upload videos
  const videosDir = path.join(__dirname, 'public', 'videos');
  if (fs.existsSync(videosDir)) {
    const r = await uploadDirectory(client, videosDir, 'videos');
    totals.uploaded += r.uploaded;
    totals.failed += r.failed;
  }

  // Upload images
  const imageDir = path.join(__dirname, 'public', 'image');
  if (fs.existsSync(imageDir)) {
    const r = await uploadDirectory(client, imageDir, 'image');
    totals.uploaded += r.uploaded;
    totals.failed += r.failed;
  }

  // Upload music
  const musicDir = path.join(__dirname, 'public', 'music');
  if (fs.existsSync(musicDir)) {
    const r = await uploadDirectory(client, musicDir, 'music');
    totals.uploaded += r.uploaded;
    totals.failed += r.failed;
  }

  // Upload logo
  const logoDir = path.join(__dirname, 'public', 'logo');
  if (fs.existsSync(logoDir)) {
    const r = await uploadDirectory(client, logoDir, 'logo');
    totals.uploaded += r.uploaded;
    totals.failed += r.failed;
  }

  // Upload .htaccess for CORS and caching
  const htaccessFile = path.join(__dirname, 'media-htaccess.txt');
  if (fs.existsSync(htaccessFile)) {
    try {
      await client.ensureDir(REMOTE_BASE);
      await client.uploadFrom(htaccessFile, `${REMOTE_BASE}/.htaccess`);
      console.log('\n✅ .htaccess uploaded for CORS support');
    } catch (err) {
      console.log('\n⚠️ .htaccess upload failed:', err.message);
    }
  }

  client.close();

  console.log('\n════════════════════════════════════════════════');
  console.log(`  YAKUNLANDI: ${totals.uploaded} yuklandi, ${totals.failed} xato`);
  console.log('════════════════════════════════════════════════');
  console.log(`\nEndi config.ts ni yangilang:`);
  console.log(`  videoUrl: "${CDN_BASE}/videos/v1.mp4"`);
  console.log(`  image:    "${CDN_BASE}/image/i1.jpg"`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
