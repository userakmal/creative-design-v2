/**
 * UPLOAD ONLY MISSING FILES
 * Only uploads the 2 uploaded videos and 2 images + data files
 * Fast and targeted upload
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

// Only the files that are MISSING from hosting
const FILES_TO_UPLOAD = [
  // Uploaded videos
  { 
    local: 'public/videos/v_1775037830219-84304006.mp4', 
    remote: 'videos/v_1775037830219-84304006.mp4' 
  },
  { 
    local: 'public/videos/v_1775044353680-575382692.mp4', 
    remote: 'videos/v_1775044353680-575382692.mp4' 
  },
  
  // Uploaded images
  { 
    local: 'public/image/i_1775037830271-242443065.jpg', 
    remote: 'image/i_1775037830271-242443065.jpg' 
  },
  { 
    local: 'public/image/i_1775044353756-344111606.jpg', 
    remote: 'image/i_1775044353756-344111606.jpg' 
  },
  
  // Data files
  { 
    local: 'public/data/videos.json', 
    remote: 'data/videos.json' 
  },
  { 
    local: 'public/data/music.json', 
    remote: 'data/music.json' 
  },
];

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

async function uploadFile(client, localPath, remotePath) {
  const fullLocalPath = path.join(__dirname, localPath);
  const fullRemotePath = `${REMOTE_BASE}/${remotePath}`;
  
  if (!fs.existsSync(fullLocalPath)) {
    console.log(`   ⚠️ Local file not found: ${localPath}`);
    return false;
  }
  
  const stat = fs.statSync(fullLocalPath);
  console.log(`   ⬆️ ${remotePath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  
  try {
    await client.uploadFrom(fullLocalPath, fullRemotePath);
    console.log(`      ✅ Uploaded successfully`);
    return true;
  } catch (err) {
    console.log(`      ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  🎯 UPLOAD ONLY MISSING FILES');
  console.log('════════════════════════════════════════════════');
  console.log('');

  const client = await connectFTP();
  console.log('✅ FTP serverga ulandi!\n');

  let uploaded = 0;
  let failed = 0;

  for (const file of FILES_TO_UPLOAD) {
    const success = await uploadFile(client, file.local, file.remote);
    if (success) uploaded++;
    else failed++;
  }

  client.close();

  console.log('');
  console.log('════════════════════════════════════════════════');
  console.log(`  ✅ Uploaded: ${uploaded}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('════════════════════════════════════════════════');
  
  if (failed === 0) {
    console.log('\n🎉 ALL FILES UPLOADED SUCCESSFULLY!');
    console.log('\n📝 Endi qiling:');
    console.log('   1. https://creative-design.uz ni oching');
    console.log('   2. Ctrl+Shift+R (Hard Refresh)');
    console.log('   3. Templates page ga o\'ting');
    console.log('   4. Barcha 50 ta video ko\'rinishi kerak!');
  }
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
