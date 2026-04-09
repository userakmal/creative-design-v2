/**
 * DELETE /media/ FOLDER FROM HOSTING
 * Removes duplicate media folder and ensures all files are in correct location
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
  client.ftp.verbose = true;

  await client.access({
    host: FTP_CONFIG.host,
    user: FTP_CONFIG.user,
    password: FTP_CONFIG.password,
    secure: FTP_CONFIG.secure,
  });

  return client;
}

/**
 * Recursively delete a directory on FTP
 */
async function deleteDirectoryRecursive(client, remotePath) {
  console.log(`🗑️ Deleting: ${remotePath}`);
  
  try {
    // List all files in directory
    await client.cd(remotePath);
    const list = await client.list();
    
    console.log(`   Found ${list.length} items`);
    
    for (const item of list) {
      const itemPath = `${remotePath}/${item.name}`;
      
      if (item.isDirectory) {
        // Recursively delete subdirectories
        await deleteDirectoryRecursive(client, itemPath);
      } else if (item.isFile) {
        // Delete file
        console.log(`   📄 Deleting file: ${item.name}`);
        try {
          await client.remove(itemPath);
        } catch (err) {
          console.log(`   ⚠️ Failed to delete ${item.name}: ${err.message}`);
        }
      }
    }
    
    // Delete the directory itself
    console.log(`   📁 Removing directory: ${remotePath}`);
    try {
      // Go to parent directory
      const parentPath = remotePath.substring(0, remotePath.lastIndexOf('/'));
      if (parentPath) {
        await client.cd(parentPath);
      } else {
        await client.cd('/');
      }
      await client.removeDir(remotePath);
      console.log(`   ✅ Directory deleted successfully`);
    } catch (err) {
      console.log(`   ❌ Failed to delete directory: ${err.message}`);
    }
  } catch (err) {
    console.log(`   ❌ Error accessing ${remotePath}: ${err.message}`);
  }
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('  🗑️ DELETE /media/ FOLDER FROM HOSTING');
  console.log('════════════════════════════════════════════════\n');

  const client = await connectFTP();
  console.log('\n✅ FTP serverga ulandi!\n');

  // Delete /public_html/media/ directory
  const mediaPath = `${REMOTE_BASE}/media`;
  
  console.log('⚠️ WARNING: This will delete the entire /media/ folder!');
  console.log('   All files inside will be permanently removed.\n');
  
  await deleteDirectoryRecursive(client, mediaPath);

  // Verify it's deleted
  console.log('\n🔍 Verifying deletion...\n');
  try {
    await client.cd(mediaPath);
    console.log('❌ /media/ folder still exists!');
  } catch (err) {
    console.log('✅ /media/ folder successfully deleted!\n');
  }

  // List remaining directories
  console.log('📂 Remaining structure in /public_html/:\n');
  try {
    await client.cd(REMOTE_BASE);
    const list = await client.list();
    
    for (const item of list) {
      if (item.isDirectory) {
        console.log(`  📁 ${item.name}/`);
      } else {
        console.log(`  📄 ${item.name}`);
      }
    }
  } catch (err) {
    console.log(`❌ Error listing directory: ${err.message}`);
  }

  client.close();

  console.log('\n════════════════════════════════════════════════');
  console.log('✅ /media/ FOLDER DELETED!');
  console.log('════════════════════════════════════════════════\n');

  console.log('📝 CORRECT HOSTING STRUCTURE:');
  console.log('   /public_html/');
  console.log('   ├── videos/     ← All videos');
  console.log('   ├── image/      ← All images');
  console.log('   ├── music/      ← All music');
  console.log('   ├── data/       ← JSON files');
  console.log('   ├── logo/       ← Logo files');
  console.log('   └── .htaccess');
  console.log('');
  console.log('❌ /media/ - DELETED (was duplicate)');
}

main().catch(err => {
  console.error('\n❌ FATAL ERROR:', err);
  process.exit(1);
});
