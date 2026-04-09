# Video Ko'rinish Muammosi - Debug Yo'riqnomasi

## ✅ **Nima Qilindi:**

1. **index.tsx** da `fetchVideos()` funksiyasi o'zgartirildi
   - Endi **HAR DOIM** `/data/videos.json` dan o'qiydi
   - API server kerak emas
   - Development va Production da bir xil ishlaydi

2. **Debug loglar** qo'shildi:
   - Console da qancha video yuklanganini ko'rasiz
   - Har bir bosqichda ma'lumot chiqadi

3. **Build** muvaffaqiyatli - 0 xato

---

## 🧪 **Test Qilish:**

### **1. Saytni Ishga Tushiring:**
```bash
npm run dev
```

### **2. Browser da Oching:**
```
http://localhost:5173
```

### **3. Developer Console (F12):**
Console tab da quyidagilar bo'lishi kerak:

```
🚀 Initializing app...
📍 Environment: DEVELOPMENT
🌐 Base URL: http://localhost:3001
✅ videos.json loaded: 2 videos
📹 Videos fetched: 2
📝 Before merge - config.videos: 48
✅ Total videos after merge: 50 (2 from videos.json)
📹 Last video: {id: 53, title: "dizayn 50", image: "/image/i_1775044353756-344111606.jpg", videoUrl: "/videos/v_1775044353680-575382692.mp4"}
```

### **4. Templates Page:**
- `/templates` ga o'ting
- **Eng pastda** yoki **slider** da "dizayn 49" va "dizayn 50" ko'rinishi kerak

---

## 🔍 **Agar Ko'rinmasa - Debugging:**

### **Qadam 1: videos.json URL ini Tekshiring**
Browser da ochib ko'ring:
```
http://localhost:5173/data/videos.json
```

**Natija:**
```json
[
  {
    "id": 52,
    "title": "dizayn 49",
    "image": "/image/i_1775037830271-242443065.jpg",
    "videoUrl": "/videos/v_1775037830219-84304006.mp4"
  },
  {
    "id": 53,
    "title": "dizayn 50",
    "image": "/image/i_1775044353756-344111606.jpg",
    "videoUrl": "/videos/v_1775044353680-575382692.mp4"
  }
]
```

✅ **Agar shu ko'rinsa** - fayl to'g'ri serve bo'lmoqda
❌ **Agar 404 ko'rinsa** - Vite config muammosi

### **Qadam 2: Console Loglarni O'qing**

**Agar:**
```
⚠ Could not load videos.json
```
➡️ **Fayl topilmadi** - Vite publicDir muammosi

**Agar:**
```
✅ videos.json loaded: 2 videos
```
➡️ **Fayl o'qildi** - lekin boshqa muammo bor

### **Qadam 3: Video URL Lar To'g'riligini Tekshiring**

Console da:
```javascript
console.log(config.videos)
```

Oxirgi 2 element:
```javascript
{
  id: 53,
  title: "dizayn 50",
  image: "http://localhost:3001/image/i_1775044353756-344111606.jpg",
  videoUrl: "http://localhost:3001/videos/v_1775044353680-575382692.mp4"
}
```

⚠️ **MUAMMO:** URL `http://localhost:3001` ga ko'rsatmoqda!
✅ **YECHIM:** Upload server ishlayotgan bo'lishi kerak yoki URL lar `http://localhost:5173` ga ko'rsatishi kerak

---

## 🐛 **Asosiy Muammo:**

**videoUrl** lar `/videos/v_*.mp4` formatida, lekin:
- Development da: `http://localhost:3001/videos/*` (upload server)
- Production da: `https://creative-design.uz/videos/*` (CDN)

**Lekin** siz localda ishlayotganingizda, **upload server** (port 3001) ishlamayotgan bo'lishi mumkin!

### **YECHIM:**

**1. Upload serverni ishga tushiring:**
```bash
npm run server
```

Bu server:
- `/videos/*` fayllarni serve qiladi
- `/image/*` fayllarni serve qiladi
- `/data/videos.json` ni serve qiladi

**2. Yoki** - `index.tsx` da URL larni to'g'rilaymiz:

```typescript
const Environment = {
  isProduction: window.location.hostname === 'creative-design.uz',
  
  get baseUrl(): string {
    return this.isProduction
      ? 'https://creative-design.uz'
      : window.location.origin;  // ✅ Hozirgi origin (localhost:5173)
  },
}
```

Bu o'zgarish bilan:
- Development da: `http://localhost:5173/videos/*`
- Production da: `https://creative-design.uz/videos/*`

---

## 🎯 **Tavsiya:**

Agar **upload server** ishlatmoqchi bo'lsangiz:

```bash
# Terminal 1 - Upload server
npm run server

# Terminal 2 - Web app  
npm run dev
```

Agar **faqat web app** kerak bo'lsa (upload server siz):

`index.tsx` da Environment.baseUrl ni o'zgartiring:
```typescript
get baseUrl(): string {
  return this.isProduction
    ? 'https://creative-design.uz'
    : window.location.origin;  // ✅ localhost:5173
}
```

---

## 📊 **Kutilayotgan Natija:**

```
Console:
✅ videos.json loaded: 2 videos
✅ Total videos after merge: 50 (2 from videos.json)

Templates Page:
- 50 ta video ko'rinishi kerak
- Oxirgi 2 ta: "dizayn 49" va "dizayn 50"
```

---

**Savol bo'lsa:** Console loglarni yuboring, darhol yordam beraman!
