// =========================================================================================
//  SAYTNI BOSHQARISH PULTI (CONFIG)
// =========================================================================================

// Hosting CDN base URL — barcha media fayllar shu yerda saqlanadi
const CDN = "https://creative-design.uz";

export const config = {
  // 1. SAYT HAQIDA MA'LUMOTLAR
  brandName: "Creative_designuz",
  subTitle: "Unutilmas Taklifnomalar",
  footerText: "Created by Creative_designuz",
  logoUrl: `${CDN}/logo/l2.png`,
  // 2. TELEGRAM SOZLAMALARI
  telegramLink: "https://t.me/+998993955537",

  // 3. VIDEOLAR RO'YXATI — Hosting CDN URLs
  videos: [
    { id: 1, title: "Blue yulduz", image: `${CDN}/image/i1.jpg`, videoUrl: `${CDN}/videos/v1.mp4` },
    { id: 2, title: "Oq Qora", image: `${CDN}/image/i2.jpg`, videoUrl: `${CDN}/videos/v2.mp4` },
    { id: 3, title: "Elegant Floral", image: `${CDN}/image/i3.jpg`, videoUrl: `${CDN}/videos/v3.mp4` },
    { id: 4, title: "Elegant Gullar", image: `${CDN}/image/i4.jpg`, videoUrl: `${CDN}/videos/v4.mp4` },
    { id: 5, title: "Oq binafsha", image: `${CDN}/image/i5.jpg`, videoUrl: `${CDN}/videos/v5.mp4` },
    { id: 6, title: "Qizlar bazmi", image: `${CDN}/image/i6.jpg`, videoUrl: `${CDN}/videos/v6.mp4` },
    { id: 7, title: "Yashil Go'zalik", image: `${CDN}/image/i7.jpg`, videoUrl: `${CDN}/videos/v7.mp4` },
    { id: 8, title: "Nahorgi Osh", image: `${CDN}/image/i8.jpg`, videoUrl: `${CDN}/videos/v8.mp4` },
    { id: 9, title: "Elegant Blue", image: `${CDN}/image/i9.jpg`, videoUrl: `${CDN}/videos/v9.mp4` },
    { id: 10, title: "Nafis qizlar bazmi", image: `${CDN}/image/i10.jpg`, videoUrl: `${CDN}/videos/v10.mp4` },
    { id: 11, title: "Rus tilida", image: `${CDN}/image/i11.jpg`, videoUrl: `${CDN}/videos/v11.mp4` },
    { id: 12, title: "Classic Go'zalik", image: `${CDN}/image/i12.jpg`, videoUrl: `${CDN}/videos/v12.mp4` },
    { id: 13, title: "Dizayn 13", image: `${CDN}/image/i13.jpg`, videoUrl: `${CDN}/videos/v13.mp4` },
    { id: 14, title: "Dizayn 14", image: `${CDN}/image/i14.jpg`, videoUrl: `${CDN}/videos/v14.mp4` },
    { id: 15, title: "Dizayn 15", image: `${CDN}/image/i15.jpg`, videoUrl: `${CDN}/videos/v15.mp4` },
    { id: 16, title: "Dizayn 16", image: `${CDN}/image/i16.jpg`, videoUrl: `${CDN}/videos/v16.mp4` },
    { id: 17, title: "Dizayn 17", image: `${CDN}/image/i17.jpg`, videoUrl: `${CDN}/videos/v17.mp4` },
    { id: 18, title: "Dizayn 18", image: `${CDN}/image/i18.jpg`, videoUrl: `${CDN}/videos/v18.mp4` },
    { id: 19, title: "Dizayn 19", image: `${CDN}/image/i19.jpg`, videoUrl: `${CDN}/videos/v19.mp4` },
    { id: 20, title: "Dizayn 20", image: `${CDN}/image/i20.jpg`, videoUrl: `${CDN}/videos/v20.mp4` },
    { id: 21, title: "Dizayn 21", image: `${CDN}/image/i21.jpg`, videoUrl: `${CDN}/videos/v21.mp4` },
    { id: 22, title: "Dizayn 22", image: `${CDN}/image/i22.jpg`, videoUrl: `${CDN}/videos/v22.mp4` },
    { id: 23, title: "Dizayn 23", image: `${CDN}/image/i23.jpg`, videoUrl: `${CDN}/videos/v23.mp4` },
    { id: 24, title: "Dizayn 24", image: `${CDN}/image/i24.jpg`, videoUrl: `${CDN}/videos/v24.mp4` },
    { id: 25, title: "Dizayn 25", image: `${CDN}/image/i25.jpg`, videoUrl: `${CDN}/videos/v25.mp4` },
    { id: 26, title: "Dizayn 26", image: `${CDN}/image/i26.jpg`, videoUrl: `${CDN}/videos/v26.mp4` },
    { id: 27, title: "Dizayn 27", image: `${CDN}/image/i27.jpg`, videoUrl: `${CDN}/videos/v27.mp4` },
    { id: 28, title: "Dizayn 28", image: `${CDN}/image/i28.jpg`, videoUrl: `${CDN}/videos/v28.mp4` },
    { id: 29, title: "Dizayn 29", image: `${CDN}/image/i29.jpg`, videoUrl: `${CDN}/videos/v29.mp4` },
    { id: 30, title: "Dizayn 30", image: `${CDN}/image/i30.jpg`, videoUrl: `${CDN}/videos/v30.mp4` },
    { id: 31, title: "Dizayn 31", image: `${CDN}/image/i31.jpg`, videoUrl: `${CDN}/videos/v31.mp4` },
    { id: 32, title: "Dizayn 32", image: `${CDN}/image/i32.jpg`, videoUrl: `${CDN}/videos/v32.mp4` },
    { id: 33, title: "Dizayn 33", image: `${CDN}/image/i33.jpg`, videoUrl: `${CDN}/videos/v33.mp4` },
    { id: 34, title: "Dizayn 34", image: `${CDN}/image/i34.jpg`, videoUrl: `${CDN}/videos/v34.mp4` },
    { id: 35, title: "Dizayn 35", image: `${CDN}/image/i35.jpg`, videoUrl: `${CDN}/videos/v35.mp4` },
    { id: 36, title: "Dizayn 36", image: `${CDN}/image/i36.jpg`, videoUrl: `${CDN}/videos/v36.mp4` },
    { id: 37, title: "Dizayn 37", image: `${CDN}/image/i37.jpg`, videoUrl: `${CDN}/videos/v37.mp4` },
    { id: 38, title: "Dizayn 38", image: `${CDN}/image/i38.jpg`, videoUrl: `${CDN}/videos/v38.mp4` },
    { id: 39, title: "Dizayn 39", image: `${CDN}/image/i39.jpg`, videoUrl: `${CDN}/videos/v39.mp4` },
    { id: 40, title: "Dizayn 40", image: `${CDN}/image/i40.jpg`, videoUrl: `${CDN}/videos/v40.mp4` },
    { id: 41, title: "Dizayn 41", image: `${CDN}/image/i41.jpg`, videoUrl: `${CDN}/videos/v41.mp4` },
    { id: 42, title: "Dizayn 42", image: `${CDN}/image/i42.jpg`, videoUrl: `${CDN}/videos/v42.mp4` },
    { id: 43, title: "Dizayn 43", image: `${CDN}/image/i43.jpg`, videoUrl: `${CDN}/videos/v43.mp4` },
    { id: 44, title: "Dizayn 44", image: `${CDN}/image/i44.jpg`, videoUrl: `${CDN}/videos/v44.mp4` },
    { id: 45, title: "Dizayn 45", image: `${CDN}/image/i45.jpg`, videoUrl: `${CDN}/videos/v45.mp4` },
    { id: 46, title: "Dizayn 46", image: `${CDN}/image/i46.jpg`, videoUrl: `${CDN}/videos/v46.mp4` },
    { id: 47, title: "Dizayn 47", image: `${CDN}/image/i47.jpg`, videoUrl: `${CDN}/videos/v47.mp4` },
    { id: 48, title: "Dizayn 48", image: `${CDN}/image/i48.jpg`, videoUrl: `${CDN}/videos/v48.mp4` },
  ],

  // 4. MUSIQALAR RO'YXATI
  music: [
    { id: 1, title: "Choli Qushi - Acoustic", duration: "0:35", author: "Turkish Vibe", url: `${CDN}/music/choliQushi.m4a` },
    { id: 2, title: "Nadyr - Seni osmonimga olib ketaman", duration: "0:21", author: "Kel, deb aytolmasam netaman", url: `${CDN}/music/ketDebHaydolmasa.m4a` },
    { id: 3, title: "Maher zain", duration: "0:17", author: "For The Rest Of My Life", url: `${CDN}/music/meher.m4a` },
    { id: 4, title: "Sato - Torimning siri", duration: "0:22", author: "Osh Uchun", url: `${CDN}/music/osh.m4a` },
    { id: 5, title: "Izzat Shukurov", duration: "0:38", author: "Oshiq bo'lar edim", url: `${CDN}/music/oshiqBolarEdim.m4a` },
    { id: 6, title: "Jah Khalib", duration: "0:19", author: "Angela", url: `${CDN}/music/tamDuragayaAngela.m4a` },
    { id: 7, title: "Izzat Shukurov", duration: "0:19", author: "Vafodorim", url: `${CDN}/music/Vafodorim.m4a` },
    { id: 8, title: "Muhammad Al Muqit", duration: "2:59", author: "Wedding Nasheed", url: `${CDN}/music/Mu.mp3` },
    { id: 9, title: "Alisher Uzoqov", duration: "3:17", author: "Oshiq yurak", url: `${CDN}/music/AlisherUzoqov.mp3` },
  ],
};
