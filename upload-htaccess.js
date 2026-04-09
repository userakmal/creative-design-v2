/**
 * UPLOAD HTACCESS AND TEST
 * Updates .htaccess and verifies file accessibility
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

const CDN_BASE = 'https://creative-design.uz';

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  📝 UPLOAD HTACCESS AND VERIFY');
  console.log('════════════════════════════════════════════════\n');

  const client = new ftp.Client();
  client.ftp.verbose = false;

  await client.access({
    host: FTP_CONFIG.host,
    user: FTP_CONFIG.user,
    password: FTP_CONFIG.password,
    secure: FTP_CONFIG.secure,
  });

  console.log('✅ FTP serverga ulandi!\n');

  // Upload .htaccess
  const htaccessFile = path.join(__dirname, 'media-htaccess.txt');
  if (fs.existsSync(htaccessFile)) {
    console.log('⬆️ Uploading .htaccess...');
    await client.uploadFrom(htaccessFile, '/public_html/.htaccess');
    console.log('✅ .htaccess uploaded successfully\n');
  }

  // Also upload to media/.htaccess if it exists
  try {
    await client.cd('/public_html/media');
    console.log('⬆️ Uploading .htaccess to /media/...');
    await client.uploadFrom(htaccessFile, '/public_html/media/.htaccess');
    console.log('✅ /media/.htaccess uploaded\n');
  } catch (err) {
    console.log('⚠️ Could not upload to /media/ (folder may not exist)\n');
  }

  client.close();

  // Test file accessibility
  console.log('🔍 Testing file accessibility...\n');
  
  const testUrls = [
    `${CDN_BASE}/videos/v_1775037830219-84304006.mp4`,
    `${CDN_BASE}/videos/v_1775044353680-575382692.mp4`,
    `${CDN_BASE}/image/i_1775037830271-242443065.jpg`,
    `${CDN_BASE}/image/i_1775044353756-344111606.jpg`,
    `${CDN_BASE}/data/videos.json`,
  ];

  for (const url of testUrls) {
    try {
      const res = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache', // Force fresh request
      });
      
      const size = res.headers.get('content-length');
      console.log(`${res.ok ? '✅' : '❌'} ${url.split('/').pop()}`);
      console.log(`   Status: ${res.status}`);
      if (size) console.log(`   Size: ${(parseInt(size) / (1024*1024)).toFixed(2)} MB`);
      console.log('');
    } catch (err) {
      console.log(`❌ ${url.split('/').pop()}`);
      console.log(`   Error: ${err.message}\n`);
    }
  }

  console.log('════════════════════════════════════════════════');
  console.log('✅ HTACCESS UPDATED!');
  console.log('════════════════════════════════════════════════\n');
  
  console.log('📝 KEYINGI QADAMLAR:');
  console.log('   1. Browser cache ni tozalang (Ctrl+Shift+Del)');
  console.log('   2. Yoki Incognito mode da ochib ko\'ring');
  console.log('   3. https://creative-design.uz ni oching');
  console.log('   4. Console (F12) da loglarni tekshiring');
  console.log('');
  console.log('Agar hali ham 404 bo\'lsa:');
  console.log('   - Hosting support ga murojaat qiling');
  console.log('   - Ayting: "/videos/ papkasidagi fayllar 404 qaytarayapti"');
}

main().catch(err => {
  console.error('❌ FATAL ERROR:', err);
  process.exit(1);
});
