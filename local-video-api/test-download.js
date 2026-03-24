// using global fetch

async function run() {
    try {
        console.log("1. API-ga so'rov yuborilmoqda (YouTube video)...");
        const apiRes = await fetch('http://localhost:3000/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://vimeo.com/22439234' })
        });
        
        const json = await apiRes.json();
        if (json.status !== 'success' || !json.data || !json.data.url) {
            console.error("XATO: API dan URL qaytmadi:", json);
            return;
        }
        
        console.log("2. API URL qaytardi. Asl video URL:", json.data.url.substring(0, 80) + "...");
        
        console.log("3. Video URL ishlayotganligini (HEAD so'rov bilan) tekshirish...");
        const videoRes = await fetch(json.data.url, { method: 'HEAD' });
        
        console.log("HTTP Holati (O'qish ruxsati):", videoRes.status, videoRes.statusText);
        console.log("Fayl turi (Content-Type):", videoRes.headers.get('content-type'));
        console.log("Fayl hajmi (Content-Length):", videoRes.headers.get('content-length'), "bayt");
        
        if (videoRes.status === 200) {
            console.log("\n✅ Video tayyor! Hech qanday xatosiz to'liq ishlayapti!");
        } else {
            console.log("\n❌ Hujjat serveri rad etdi yoki xatolik.");
        }
    } catch (err) {
        console.error("Umumiy xatolik:", err.message);
    }
}
run();
