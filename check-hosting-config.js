/**
 * CHECK HOSTING CONFIGURATION
 * Determines where the domain root points to and how CDN reads files
 */

import * as ftp from 'basic-ftp';

const FTP_CONFIG = {
  host: 'ns8.sayt.uz',
  user: 'creative-designuz',
  password: 'qH9fZ2yF5z',
  secure: false,
};

const CDN_BASE = 'https://creative-design.uz';

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  🔍 CHECKING HOSTING CONFIGURATION');
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

  // Check root structure
  console.log('📂 ROOT (/) directories:\n');
  await client.cd('/');
  const rootList = await client.list();
  
  for (const item of rootList) {
    if (item.isDirectory) {
      console.log(`  📁 ${item.name}/`);
    }
  }
  
  console.log('\n');

  // Check www directory (common for web roots)
  console.log('📂 WWW/ directory (if exists):\n');
  try {
    await client.cd('/www');
    const wwwList = await client.list();
    for (const item of wwwList) {
      if (item.isDirectory) {
        console.log(`  📁 ${item.name}/`);
      } else {
        console.log(`  📄 ${item.name}`);
      }
    }
    console.log('');
  } catch (err) {
    console.log('  ❌ /www/ does not exist\n');
  }

  // Check if there's a symlink or alias
  console.log('🔍 Testing direct URLs:\n');
  
  const testUrls = [
    // Test with /videos/ path
    `${CDN_BASE}/videos/v1.mp4`,
    `${CDN_BASE}/videos/v_1775037830219-84304006.mp4`,
    
    // Test if maybe domain points to /public_html
    `${CDN_BASE}/public_html/videos/v1.mp4`,
    
    // Check root
    `${CDN_BASE}/`,
  ];

  for (const url of testUrls) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      console.log(`${res.ok ? '✅' : '❌'} ${url}`);
      console.log(`   Status: ${res.status}`);
      if (res.ok) {
        const size = res.headers.get('content-length');
        const contentType = res.headers.get('content-type');
        if (size) console.log(`   Size: ${(parseInt(size) / (1024*1024)).toFixed(2)} MB`);
        if (contentType) console.log(`   Type: ${contentType}`);
      }
      console.log('');
    } catch (err) {
      console.log(`❌ ${url}`);
      console.log(`   Error: ${err.message}\n`);
    }
  }

  // Check /public_html/videos/ for uploaded files
  console.log('📂 Checking /public_html/videos/ for uploaded files:\n');
  await client.cd('/public_html/videos');
  const videosList = await client.list();
  
  const uploadedFiles = videosList.filter(v => 
    v.name.startsWith('v_') && v.name.endsWith('.mp4')
  );
  
  if (uploadedFiles.length > 0) {
    console.log(`Found ${uploadedFiles.length} uploaded video(s):\n`);
    for (const file of uploadedFiles) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`  📹 ${file.name} (${sizeMB} MB)`);
      console.log(`     Permissions: ${file.unique}`);
    }
  } else {
    console.log('  ❌ No uploaded videos found!');
  }

  client.close();

  console.log('\n════════════════════════════════════════════════');
  console.log('📝 DIAGNOSIS:');
  console.log('════════════════════════════════════════════════');
  console.log('');
  console.log('Agar built-in videolar (v1.mp4) ishlayotgan bo\'lsa');
  console.log('lekin uploaded videolar (v_*.mp4) ishlamasa:');
  console.log('');
  console.log('1. CDN caching - 24 soat kuting');
  console.log('2. File permissions - 644 bo\'lishi kerak');
  console.log('3. Server restart kerak bo\'lishi mumkin');
  console.log('4. Hosting support ga murojaat qiling');
}

main().catch(err => {
  console.error('❌ FATAL ERROR:', err);
  process.exit(1);
});
