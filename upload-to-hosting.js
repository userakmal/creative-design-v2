/**
 * Bulk FTP Upload Script (SMART SYNC)
 * Faqat yangi yoki o'zgargan fayllarni yuklaydi.
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

// ✅ TO'G'RI PATH: /www/creative-design.uz/
const REMOTE_BASE = '/www/creative-design.uz';
const CDN_BASE = 'https://creative-design.uz';

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
  const files = fs.readdirSync(localDir).filter(f => fs.statSync(path.join(localDir, f)).isFile());

  console.log(`\n📂 Papka: ${remoteDir} (${files.length} ta lokal fayl)`);
  
  // Ensure remote directory exists
  await client.ensureDir(`${REMOTE_BASE}/${remoteDir}`);

  console.log('   🔄 Serverdagi holat tekshirilmoqda...');
  
  // Navigate to the correct remote directory before listing
  await client.cd(`${REMOTE_BASE}/${remoteDir}`);
  
  const remoteFiles = await client.list();
  const remoteMap = new Map();
  for (const rf of remoteFiles) {
    if (rf.isFile) remoteMap.set(rf.name, rf.size);
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const localPath = path.join(localDir, file);
    const remotePath = `${REMOTE_BASE}/${remoteDir}/${file}`;
    const localStat = fs.statSync(localPath);

    // Smart Sync - Agar serverda shu fayl doimiy hajmi bilan tursa, yuklamaydi!
    if (remoteMap.has(file) && remoteMap.get(file) === localStat.size) {
      skipped++;
      process.stdout.write(`\r   ⏭️ O'tkazib yuborildi: jami ${skipped} ta eskidan bor fayl`);
      continue;
    }

    try {
      console.log(`\n   ⬆️ Yuklanyapti: ${file} (${(localStat.size / (1024 * 1024)).toFixed(1)} MB)...`);
      await client.uploadFrom(localPath, remotePath);
      uploaded++;
    } catch (err) {
      failed++;
      console.log(`   ❌ Xato: ${err.message}`);
    }
  }

  console.log(`\n  📊 Natija: ${uploaded} ta yangi yuklandi, ${skipped} ta eski bor fayl tejaldi, ${failed} ta xato`);
  return { uploaded, failed, skipped };
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  🔥 SMART FTP UPLOAD (SENIOR DEVELOPER MODE) 🔥  ');
  console.log('════════════════════════════════════════════════');
  console.log(`FTP Host: ${FTP_CONFIG.host}`);
  console.log(`Remote:   ${REMOTE_BASE}/`);
  console.log('');

  const client = await connectFTP();
  console.log('✅ FTP serverga ulandi!');

  const totals = { uploaded: 0, failed: 0, skipped: 0 };

  const dirs = [
    { local: 'public/videos', remote: 'videos' },
    { local: 'public/image', remote: 'image' },
    { local: 'public/music', remote: 'music' },
    { local: 'public/logo', remote: 'logo' },
    { local: 'public/data', remote: 'data' }
  ];

  for (const dir of dirs) {
    const absPath = path.join(__dirname, dir.local);
    if (fs.existsSync(absPath)) {
      const r = await uploadDirectory(client, absPath, dir.remote);
      totals.uploaded += r.uploaded;
      totals.failed += r.failed;
      totals.skipped += r.skipped;
    }
  }

  // Upload .htaccess
  const htaccessFile = path.join(__dirname, 'media-htaccess.txt');
  if (fs.existsSync(htaccessFile)) {
    try {
      await client.ensureDir(REMOTE_BASE);
      await client.uploadFrom(htaccessFile, `${REMOTE_BASE}/.htaccess`);
      console.log('\n✅ .htaccess (CORS) yuklandi');
    } catch (err) {}
  }

  client.close();

  console.log('\n════════════════════════════════════════════════');
  console.log(`  Barcha topshiriqlar bajarildi! (Tejovchi rejim)`);
  console.log(`  ➕ Yangi fayllar: ${totals.uploaded}`);
  console.log(`  ⏭️ Tejalgan (Eski) fayllar: ${totals.skipped}`);
  console.log(`  ❌ Xatolar: ${totals.failed}`);
  console.log('════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('\nKutilmagan xatolik:', err);
  process.exit(1);
});
