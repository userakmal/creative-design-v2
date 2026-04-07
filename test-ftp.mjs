import * as ftp from 'basic-ftp';

async function testFTP() {
  const client = new ftp.Client();
  // client.ftp.verbose = true;
  try {
    await client.access({
      host: 'ns8.sayt.uz',
      user: 'creative-designuz',
      password: 'qH9fZ2yF5z',
      secure: false,
    });
    console.log("✅ FTP connected");
    
    console.log("Listing /public_html/videos ...");
    const videoFiles = await client.list('/public_html/videos');
    console.log("Videos:", videoFiles.map(f => f.name));
    
    console.log("Listing /public_html/image ...");
    const imageFiles = await client.list('/public_html/image');
    console.log("Images:", imageFiles.map(f => f.name));
    
  } catch (err) {
    console.error('❌ FTP error:', err.message);
  } finally {
    client.close();
  }
}

testFTP();
