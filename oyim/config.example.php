<?php
// ============================================
//   MAXFIY MA'LUMOTLAR — HECH KIMGA BERMANG
// ============================================
// Bu — TEMPLATE fayl. Real qiymatlar bilan
// config.php nomida nusxa oling (git'ga ketmaydi).
//
//   cp config.example.php config.php
//
// Keyin config.php ichidagi qiymatlarni to'ldiring.

// --------------------------------------------
// 1) Telegram bot token (@BotFather dan oling)
//    Format: 1234567890:AAH-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// --------------------------------------------
define('BOT_TOKEN', 'BU_YERGA_BOT_TOKEN_YOZING');

// --------------------------------------------
// 2) Sizning Telegram chat ID (@userinfobot ga /start)
// --------------------------------------------
define('CHAT_ID', 'BU_YERGA_CHAT_ID_YOZING');

// --------------------------------------------
// 3) Saytingiz manzili (CSRF himoyasi uchun)
// --------------------------------------------
define('ALLOWED_ORIGIN', 'https://creative-design.uz/oyim');

// --------------------------------------------
// 4) Rate limiting (DDoS himoyasi)
// --------------------------------------------
define('RATE_LIMIT_MAX',    5);   // Maksimal so'rovlar soni
define('RATE_LIMIT_WINDOW', 20);  // Vaqt oynasi (sekund)

// --------------------------------------------
// 5) Aniqlik chegarasi (metr) — bundan yomonroq rad etiladi
// --------------------------------------------
define('MAX_ACCURACY_M', 50);

// --------------------------------------------
// 6) Log fayllar uchun papka (avtomatik yaratiladi)
// --------------------------------------------
define('LOG_DIR', __DIR__ . '/logs');
