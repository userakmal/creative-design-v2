# creative-design.uz/1 test javoblarini tekshirish hisoboti

Manba: `kstu imtihon ui/src/questions.json` (sayt shu fayldan build qilingan, `1/assets/...js` ichiga JSON sifatida joylangan).
Solishtirildi: `BARCHA fanlardan test.txt` (`?` = savol, `+` = to'g'ri javob, `-` = boshqa variantlar).

## Umumiy raqamlar
- Saytdagi savollar: **785**
- txt dagi savol bloklari: **782**

## Javob pozitsiyasi (talab: `+` javob doim 1-variantda)
| Holat | Soni |
|---|---|
| Allaqachon 1-variantda edi | 217 |
| **Boshqa variantga tushib qolgan — tuzatildi** | **540** |
| Tuzatildi (aniq matn mosligi) | 514 |
| Tuzatildi (kichik typo farqi, fuzzy) | 20 |
| Tuzatildi (qo'lda override) | 6 |
| Qo'lda hal qilish kerak (FLAG) | 3 |
| txt da topilmadi (tekshirilmadi) | 25 |

Tuzatishdan keyin: moslashgan barcha savollarda `+` javob endi **1-variantda** (0 ta xato qoldi).

## ✅ Qo'lda tuzatilgan 3 ta savol (to'g'ri javob variantlarda yo'q edi)
- **#602** "...kabi dasturlar Mac va Windows-da iOS-ni boshqarishi mumkin" → `Xcode` 1-variant qilib qo'shildi.
- **#603** "...Linux operatsion tizimida Windows dasturlarini ishlaydi" → ortiqcha `Xcode` varianti olib tashlandi (`WINE` 1-variantda).
- **#645** "Mobil dastur boshqa dasturda yaratilgan ma'lumotlar bazasiga kira oladimi" → `mumkin, lekin faqat kontent-provayderlar yordamida` 1-variant qilib qo'shildi.

## Savollar to'liqligi ("hamma savol bormi")
Saytda bor, lekin **bugungi txt da yo'q** (25 ta). Asosiysi — bir blok embedded-tizim savollari:
- #568–587: aktuator, PWM, watchdog, bare-metal, RTOS, polling, interrupt, debounce, cross-compilation, latency, jitter, deterministik — bularning txt da mosi yo'q.
- #18, #100, #675, #698, #766 — yozilish/parse farqi (saytda boshqacha so'z bilan bor bo'lishi mumkin).

Bu savollar tekshirilmadi (txt manbasi bo'lmagani uchun), eski holatida qoldi.

## O'zgartirilgan fayllar
- `kstu imtihon ui/src/questions.json` — manba tuzatildi.
- `1/assets/index-fa9f4b85.js` — live bundle yangilandi (eski `index-Bibp4mdZ.js` qayta nomlandi, cache yangilanishi uchun).
- `1/index.html` — yangi bundle nomiga yangilandi.

O'zgarishlar `worktree-fix-quiz-answers` branchida (hali commit qilinmagan).
