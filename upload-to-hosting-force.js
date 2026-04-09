/**
 * FORCE FTP UPLOAD - SENIOR DEVELOPER FIX
 * Uploads ALL files to hosting, ensuring correct paths
 * This script FORCE uploads even if files exist
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

const REMOTE_BASE = '/public_html';

async function connectFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true; // Show detailed logs

  await client.access({
    host: FTP_CONFIG.host,
    user: FTP_CONFIG.user,
    password: FTP_CONFIG.password,
    secure: FTP_CONFIG.secure,
  });

  return client;
}

async function forceUploadDirectory(client, localDir, remoteDir) {
  const files = fs.readdirSync(localDir).filter(f => fs.statSync(path.join(localDir, f)).isFile());

  console.log(`\n📂 Papka: ${remoteDir} (${files.length} ta fayl)`);
  await client.ensureDir(`${REMOTE_BASE}/${remoteDir}`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = `${REMOTE_BASE}/${remoteDir}/${file}`;
    const localStat = fs.statSync(localPath);

    console.log(`   ⬆️ ${file} (${(localStat.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    try {
      await client.uploadFrom(localPath, remotePath);
      uploaded++;
      console.log(`      ✅ Uploaded successfully`);
    } catch (err) {
      failed++;
      console.log(`      ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n  📊 Natija: ${uploaded} yuklandi, ${skipped} o'tkazildi, ${failed} xato`);
  return { uploaded, failed, skipped };
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  🔥 FORCE FTP UPLOAD (ALL FILES) 🔥  ');
  console.log('════════════════════════════════════════════════');
  console.log(`FTP Host: ${FTP_CONFIG.host}`);
  console.log(`Remote:   ${REMOTE_BASE}/`);
  console.log('');

  const client = await connectFTP();
  console.log('\n✅ FTP serverga ulandi!');

  const totals = { uploaded: 0, failed: 0, skipped: 0 };

  // Upload ALL directories
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
      const r = await forceUploadDirectory(client, absPath, dir.remote);
      totals.uploaded += r.uploaded;
      totals.failed += r.failed;
      totals.skipped += r.skipped;
    } else {
      console.log(`\n❌ Local directory not found: ${absPath}`);
    }
  }

  // Upload .htaccess
  const htaccessFile = path.join(__dirname, 'media-htaccess.txt');
  if (fs.existsSync(htaccessFile)) {
    try {
      await client.ensureDir(REMOTE_BASE);
      await client.uploadFrom(htaccessFile, `${REMOTE_BASE}/.htaccess`);
      console.log('\n✅ .htaccess (CORS) yuklandi');
    } catch (err) {
      console.log(`\n⚠️ .htaccess upload failed: ${err.message}`);
    }
  }

  client.close();

  console.log('\n════════════════════════════════════════════════');
  console.log(`  BARCHA FAYLLAR YUKLANDI!`);
  console.log(`  ➕ Yangi yuklandi: ${totals.uploaded}`);
  console.log(`  ❌ Xatolar: ${totals.failed}`);
  console.log('════════════════════════════════════════════════');
  
  if (totals.failed > 0) {
    console.log('\n⚠️ BA\'ZI FAYLLAR YUKLANMADI!');
    console.log('Yuqoridagi xatolarni tekshiring.');
  } else {
    console.log('\n✅ HAMMA NARSA MUVAFFAQIYATLI YUKLANDI!');
    console.log('\n📝 Keyingi qadamlar:');
    console.log('   1. https://creative-design.uz ni oching');
    console.log('   2. Ctrl+Shift+R (Hard Refresh)');
    console.log('   3. Console da (F12) loglarni tekshiring');
    console.log('   4. Templates page da barcha videolarni ko\'ring');
  }
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
