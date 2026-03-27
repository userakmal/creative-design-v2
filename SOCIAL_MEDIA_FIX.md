# 🎬 Instagram va Ijtimoiy Tarmoqlar Fayllarini Yuklashni Tuzatish

Instagram va boshqa tarmoqlar tez-tez o'z xavfsizlik tizimini yangilab turadi. Agar videolar yuklanmayotgan bo'olsa, quyidagi amallarni bajaring:

## 1. Cookies (Kuki) o'rnatish (Eng yaxshi usul)

Instagram bot aniqlanganida videoni ko'rsatmaydi. Buni chetlab o'tish uchun brauzeringizdagi ma'lumotlarni botga berish kerak.

1.  **Kengaytmani o'rnating**: Brauzeringizga (Chrome, Edge yoki Firefox) [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) kengaytmasini o'rnating.
2.  **Instagramga kiring**: Instagram.com saytiga kiring va o'z hisobingizga kirganingizga ishonch hosil qiling.
3.  **Eksport qiling**: Kengaytma belgisini bosing va "Export" (Netscape formatida) tanlang.
4.  **Nomini o'zgartiring**: Yuklangan faylni `cookies.txt` deb nomlang.
5.  **Botga tashlang**: Ushbu faylni bot loyihasining asosiy papkasiga yuklang:
    - Path: `c:\Users\Acer\OneDrive\Desktop\creative-design-main\cookies.txt`

## 2. Brauzerdan to'g'ridan-to'g'ri foydalanish (Local uchun)

Agar botni o'zingizning kompyuteringizda ishlatsangiz, u Chrome brauzeringizdan kukilarni avtomatik olishi mumkin. Buning uchun `yt-dlp` buyrug'iga `--cookies-from-browser chrome` qo'shish kifoya. (Hozirgi yangilanishda bu qo'llab-quvvatlanadi).

## 3. Playwright orqali yuklash

Agar `yt-dlp` baribir ishlamasa, bot avtomatik ravishmda Playwright (brauzer simulyatsiyasi) orqali videoni qidiradi. Men bugun ushbu qismni ham yaxshiladim.

---
**Muammo davom etsa, botni o'chirib qayta yoqing!**
