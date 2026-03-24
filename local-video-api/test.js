const { execSync } = require('child_process');
try {
  console.log("Running yt-dlp...");
  let out = execSync('.\\yt-dlp.exe -f "best" --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"', { maxBuffer: 1024 * 1024 * 50 });
  let data = JSON.parse(out);
  console.log("Success! Data URL:", data.url ? data.url.substring(0, 100) + "..." : "URL NOT FOUND");
} catch(e) {
  console.error("Yt-dlp error:", e.message);
  if (e.stdout) console.log("STDOUT:", e.stdout.toString().substring(0, 500));
  if (e.stderr) console.log("STDERR:", e.stderr.toString());
}
