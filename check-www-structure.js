/**
 * CHECK /www/creative-design.uz/ STRUCTURE
 * This is likely where the domain actually reads from!
 */

import * as ftp from 'basic-ftp';

const FTP_CONFIG = {
  host: 'ns8.sayt.uz',
  user: 'creative-designuz',
  password: 'qH9fZ2yF5z',
  secure: false,
};

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  🔍 CHECKING /www/creative-design.uz/');
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

  // Check /www/creative-design.uz/ structure
  console.log('📂 /www/creative-design.uz/ structure:\n');
  await client.cd('/www/creative-design.uz');
  const list = await client.list();
  
  for (const item of list) {
    if (item.isDirectory) {
      console.log(`  📁 ${item.name}/`);
    } else if (item.isFile) {
      const size = item.size > 1024 * 1024 
        ? (item.size / (1024 * 1024)).toFixed(2) + ' MB'
        : (item.size / 1024).toFixed(1) + ' KB';
      console.log(`  📄 ${item.name} (${size})`);
    }
  }

  // Check /www/creative-design.uz/videos/
  console.log('\n📂 /www/creative-design.uz/videos/ contents:\n');
  try {
    await client.cd('/www/creative-design.uz/videos');
    const videos = await client.list();
    
    const uploadedVideos = videos.filter(v => 
      v.name.startsWith('v_') && v.name.endsWith('.mp4')
    );
    
    if (uploadedVideos.length > 0) {
      console.log(`✅ Found ${uploadedVideos.length} uploaded video(s):\n`);
      for (const v of uploadedVideos) {
        const sizeMB = (v.size / (1024 * 1024)).toFixed(2);
        console.log(`  📹 ${v.name} (${sizeMB} MB)`);
      }
    } else {
      console.log('  ❌ NO uploaded videos found!');
      console.log('  📝 This is why CDN returns 404!');
    }
    
    console.log('\n📂 Built-in videos:\n');
    const builtInVideos = videos.filter(v => 
      v.name.match(/^v\d+\.mp4$/)
    );
    console.log(`  Found ${builtInVideos.length} built-in videos`);
    
  } catch (err) {
    console.log(`  ❌ /www/creative-design.uz/videos/ does not exist: ${err.message}`);
  }

  // Check /www/creative-design.uz/image/
  console.log('\n📂 /www/creative-design.uz/image/ contents:\n');
  try {
    await client.cd('/www/creative-design.uz/image');
    const images = await client.list();
    
    const uploadedImages = images.filter(v => 
      v.name.startsWith('i_') && v.name.endsWith('.jpg')
    );
    
    if (uploadedImages.length > 0) {
      console.log(`✅ Found ${uploadedImages.length} uploaded image(s):\n`);
      for (const img of uploadedImages.slice(0, 5)) {
        const sizeKB = (img.size / 1024).toFixed(1);
        console.log(`  🖼️ ${img.name} (${sizeKB} KB)`);
      }
    } else {
      console.log('  ❌ NO uploaded images found!');
    }
  } catch (err) {
    console.log(`  ❌ /www/creative-design.uz/image/ does not exist: ${err.message}`);
  }

  client.close();

  console.log('\n════════════════════════════════════════════════');
  console.log('📝 CONCLUSION:');
  console.log('════════════════════════════════════════════════\n');
  console.log('Domain /www/creative-design.uz/ dan o\'qiydi!');
  console.log('Biz /public_html/ ga yuklagan edik - bu NOTO\'G\'RI joy!\n');
  console.log('YECHIM:');
  console.log('  1. Upload serverni /www/creative-design.uz/ ga upload qiladigan qilish');
  console.log('  2. Yoki /public_html/ dan /www/creative-design.uz/ ga symlink yaratish');
}

main().catch(err => {
  console.error('❌ FATAL ERROR:', err);
  process.exit(1);
});
