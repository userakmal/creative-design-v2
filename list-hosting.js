/**
 * LIST REMOTE DIRECTORIES ON HOSTING
 * Shows what folders exist on the hosting server
 */

import * as ftp from 'basic-ftp';

const FTP_CONFIG = {
  host: 'ns8.sayt.uz',
  user: 'creative-designuz',
  password: 'qH9fZ2yF5z',
  secure: false,
};

async function listDirectory(client, remotePath, indent = '') {
  try {
    await client.cd(remotePath);
    const list = await client.list();
    
    console.log(`${indent}📂 ${remotePath}`);
    
    for (const item of list) {
      if (item.isDirectory) {
        console.log(`${indent}  📁 ${item.name}`);
      } else if (item.isFile) {
        const size = item.size > 1024 * 1024 
          ? (item.size / (1024 * 1024)).toFixed(2) + ' MB'
          : (item.size / 1024).toFixed(1) + ' KB';
        console.log(`${indent}  📄 ${item.name} (${size})`);
      }
    }
    console.log('');
  } catch (err) {
    console.log(`${indent}❌ Cannot access ${remotePath}: ${err.message}\n`);
  }
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  📋 HOSTING DIRECTORY STRUCTURE');
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

  // List root directories
  console.log('📂 ROOT STRUCTURE:\n');
  await listDirectory(client, '/');
  
  // Check public_html
  console.log('📂 PUBLIC_HTML:\n');
  await listDirectory(client, '/public_html');
  
  // Check videos folder
  console.log('📂 VIDEOS FOLDER:\n');
  await listDirectory(client, '/public_html/videos');
  
  // Check if media folder exists
  console.log('📂 MEDIA FOLDER (if exists):\n');
  await listDirectory(client, '/public_html/media').catch(() => {});
  
  // Check image folder
  console.log('📂 IMAGE FOLDER:\n');
  await listDirectory(client, '/public_html/image');
  
  // Check data folder
  console.log('📂 DATA FOLDER:\n');
  await listDirectory(client, '/public_html/data');

  client.close();
  console.log('════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ FATAL ERROR:', err);
  process.exit(1);
});
