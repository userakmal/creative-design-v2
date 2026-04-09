// ============================================================================
// CREATIVE DESIGN PLATFORM - CONFIGURATION
// ============================================================================
// Barcha media fayllar CDN (creative-design.uz) orqali uzatiladi
// ============================================================================

// CDN Base URL - barcha media fayllar shu yerda saqlanadi
const CDN_BASE = "https://creative-design.uz";

// Helper function to build CDN URLs
const cdn = (path: string): string => `${CDN_BASE}${path}`;

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export interface AppConfig {
  brandName: string;
  subTitle: string;
  footerText: string;
  logoUrl: string;
  telegramLink: string;
  videos: VideoItem[];
  music: MusicItem[];
}

export interface VideoItem {
  id: number;
  title: string;
  image: string;
  videoUrl: string;
  uploadedAt?: string;
  size?: string;
  isUploaded?: boolean;
}

export interface MusicItem {
  id: number;
  title: string;
  author: string;
  duration?: string;
  url: string;
  uploadedAt?: string;
  size?: string;
  isUploaded?: boolean;
}

export const config: AppConfig = {
  // 1. BRAND INFORMATION
  brandName: "Creative_designuz",
  subTitle: "Unutilmas Taklifnomalar",
  footerText: "Created by Creative_designuz",
  logoUrl: cdn("/logo/l2.png"),

  // 2. TELEGRAM
  telegramLink: "https://t.me/+998993955537",

  // 3. VIDEO TEMPLATES (48 built-in designs)
  videos: [
    { id: 1, title: "Blue yulduz", image: cdn("/image/i1.jpg"), videoUrl: cdn("/videos/v1.mp4") },
    { id: 2, title: "Oq Qora", image: cdn("/image/i2.jpg"), videoUrl: cdn("/videos/v2.mp4") },
    { id: 3, title: "Elegant Floral", image: cdn("/image/i3.jpg"), videoUrl: cdn("/videos/v3.mp4") },
    { id: 4, title: "Elegant Gullar", image: cdn("/image/i4.jpg"), videoUrl: cdn("/videos/v4.mp4") },
    { id: 5, title: "Oq binafsha", image: cdn("/image/i5.jpg"), videoUrl: cdn("/videos/v5.mp4") },
    { id: 6, title: "Qizlar bazmi", image: cdn("/image/i6.jpg"), videoUrl: cdn("/videos/v6.mp4") },
    { id: 7, title: "Yashil Go'zalik", image: cdn("/image/i7.jpg"), videoUrl: cdn("/videos/v7.mp4") },
    { id: 8, title: "Nahorgi Osh", image: cdn("/image/i8.jpg"), videoUrl: cdn("/videos/v8.mp4") },
    { id: 9, title: "Elegant Blue", image: cdn("/image/i9.jpg"), videoUrl: cdn("/videos/v9.mp4") },
    { id: 10, title: "Nafis qizlar bazmi", image: cdn("/image/i10.jpg"), videoUrl: cdn("/videos/v10.mp4") },
    { id: 11, title: "Rus tilida", image: cdn("/image/i11.jpg"), videoUrl: cdn("/videos/v11.mp4") },
    { id: 12, title: "Classic Go'zalik", image: cdn("/image/i12.jpg"), videoUrl: cdn("/videos/v12.mp4") },
    { id: 13, title: "Dizayn 13", image: cdn("/image/i13.jpg"), videoUrl: cdn("/videos/v13.mp4") },
    { id: 14, title: "Dizayn 14", image: cdn("/image/i14.jpg"), videoUrl: cdn("/videos/v14.mp4") },
    { id: 15, title: "Dizayn 15", image: cdn("/image/i15.jpg"), videoUrl: cdn("/videos/v15.mp4") },
    { id: 16, title: "Dizayn 16", image: cdn("/image/i16.jpg"), videoUrl: cdn("/videos/v16.mp4") },
    { id: 17, title: "Dizayn 17", image: cdn("/image/i17.jpg"), videoUrl: cdn("/videos/v17.mp4") },
    { id: 18, title: "Dizayn 18", image: cdn("/image/i18.jpg"), videoUrl: cdn("/videos/v18.mp4") },
    { id: 19, title: "Dizayn 19", image: cdn("/image/i19.jpg"), videoUrl: cdn("/videos/v19.mp4") },
    { id: 20, title: "Dizayn 20", image: cdn("/image/i20.jpg"), videoUrl: cdn("/videos/v20.mp4") },
    { id: 21, title: "Dizayn 21", image: cdn("/image/i21.jpg"), videoUrl: cdn("/videos/v21.mp4") },
    { id: 22, title: "Dizayn 22", image: cdn("/image/i22.jpg"), videoUrl: cdn("/videos/v22.mp4") },
    { id: 23, title: "Dizayn 23", image: cdn("/image/i23.jpg"), videoUrl: cdn("/videos/v23.mp4") },
    { id: 24, title: "Dizayn 24", image: cdn("/image/i24.jpg"), videoUrl: cdn("/videos/v24.mp4") },
    { id: 25, title: "Dizayn 25", image: cdn("/image/i25.jpg"), videoUrl: cdn("/videos/v25.mp4") },
    { id: 26, title: "Dizayn 26", image: cdn("/image/i26.jpg"), videoUrl: cdn("/videos/v26.mp4") },
    { id: 27, title: "Dizayn 27", image: cdn("/image/i27.jpg"), videoUrl: cdn("/videos/v27.mp4") },
    { id: 28, title: "Dizayn 28", image: cdn("/image/i28.jpg"), videoUrl: cdn("/videos/v28.mp4") },
    { id: 29, title: "Dizayn 29", image: cdn("/image/i29.jpg"), videoUrl: cdn("/videos/v29.mp4") },
    { id: 30, title: "Dizayn 30", image: cdn("/image/i30.jpg"), videoUrl: cdn("/videos/v30.mp4") },
    { id: 31, title: "Dizayn 31", image: cdn("/image/i31.jpg"), videoUrl: cdn("/videos/v31.mp4") },
    { id: 32, title: "Dizayn 32", image: cdn("/image/i32.jpg"), videoUrl: cdn("/videos/v32.mp4") },
    { id: 33, title: "Dizayn 33", image: cdn("/image/i33.jpg"), videoUrl: cdn("/videos/v33.mp4") },
    { id: 34, title: "Dizayn 34", image: cdn("/image/i34.jpg"), videoUrl: cdn("/videos/v34.mp4") },
    { id: 35, title: "Dizayn 35", image: cdn("/image/i35.jpg"), videoUrl: cdn("/videos/v35.mp4") },
    { id: 36, title: "Dizayn 36", image: cdn("/image/i36.jpg"), videoUrl: cdn("/videos/v36.mp4") },
    { id: 37, title: "Dizayn 37", image: cdn("/image/i37.jpg"), videoUrl: cdn("/videos/v37.mp4") },
    { id: 38, title: "Dizayn 38", image: cdn("/image/i38.jpg"), videoUrl: cdn("/videos/v38.mp4") },
    { id: 39, title: "Dizayn 39", image: cdn("/image/i39.jpg"), videoUrl: cdn("/videos/v39.mp4") },
    { id: 40, title: "Dizayn 40", image: cdn("/image/i40.jpg"), videoUrl: cdn("/videos/v40.mp4") },
    { id: 41, title: "Dizayn 41", image: cdn("/image/i41.jpg"), videoUrl: cdn("/videos/v41.mp4") },
    { id: 42, title: "Dizayn 42", image: cdn("/image/i42.jpg"), videoUrl: cdn("/videos/v42.mp4") },
    { id: 43, title: "Dizayn 43", image: cdn("/image/i43.jpg"), videoUrl: cdn("/videos/v43.mp4") },
    { id: 44, title: "Dizayn 44", image: cdn("/image/i44.jpg"), videoUrl: cdn("/videos/v44.mp4") },
    { id: 45, title: "Dizayn 45", image: cdn("/image/i45.jpg"), videoUrl: cdn("/videos/v45.mp4") },
    { id: 46, title: "Dizayn 46", image: cdn("/image/i46.jpg"), videoUrl: cdn("/videos/v46.mp4") },
    { id: 47, title: "Dizayn 47", image: cdn("/image/i47.jpg"), videoUrl: cdn("/videos/v47.mp4") },
    { id: 48, title: "Dizayn 48", image: cdn("/image/i48.jpg"), videoUrl: cdn("/videos/v48.mp4") },
  ],

  // 4. MUSIC LIBRARY
  music: [
    { id: 1, title: "Choli Qushi - Acoustic", duration: "0:35", author: "Turkish Vibe", url: cdn("/music/choliQushi.m4a") },
    { id: 2, title: "Nadyr - Seni osmonimga olib ketaman", duration: "0:21", author: "Kel, deb aytolmasam netaman", url: cdn("/music/ketDebHaydolmasa.m4a") },
    { id: 3, title: "Maher zain", duration: "0:17", author: "For The Rest Of My Life", url: cdn("/music/meher.m4a") },
    { id: 4, title: "Sato - Torimning siri", duration: "0:22", author: "Osh Uchun", url: cdn("/music/osh.m4a") },
    { id: 5, title: "Izzat Shukurov", duration: "0:38", author: "Oshiq bo'lar edim", url: cdn("/music/oshiqBolarEdim.m4a") },
    { id: 6, title: "Jah Khalib", duration: "0:19", author: "Angela", url: cdn("/music/tamDuragayaAngela.m4a") },
    { id: 7, title: "Izzat Shukurov", duration: "0:19", author: "Vafodorim", url: cdn("/music/Vafodorim.m4a") },
    { id: 8, title: "Muhammad Al Muqit", duration: "2:59", author: "Wedding Nasheed", url: cdn("/music/Mu.mp3") },
    { id: 9, title: "Alisher Uzoqov", duration: "3:17", author: "Oshiq yurak", url: cdn("/music/AlisherUzoqov.mp3") },
  ],
};
