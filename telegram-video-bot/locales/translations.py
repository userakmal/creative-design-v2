"""
Translation strings for Telegram Video Downloader Bot.
Supports: Uzbek (uz), Russian (ru), English (en)
"""

from typing import Dict
from loguru import logger

# In-memory user language cache: {user_id: language_code}
_user_languages: Dict[int, str] = {}

# Available languages
AVAILABLE_LANGUAGES = {
    "uz": "🇺🇿 O'zbekcha",
    "ru": "🇷🇺 Русский",
    "en": "🇬🇧 English",
}

# Translation dictionary
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "uz": {
        # Commands
        "start": "🎬 <b>Video Yuklab Olish Boti</b>\n\n"
                "Menga har qanday video havolasini (URL) yuboring, men uni yuklab olaman!\n\n"
                "<b>Qo'llab-quvvatlanadigan platformalar:</b>\n"
                "• YouTube, Instagram, TikTok\n"
                "• Twitter/X, Facebook, Vimeo\n"
                "• To'g'ridan-to'g'ri .m3u8 HLS oqimlari\n"
                "• Va 1000+ boshqa saytlar\n\n"
                "<b>Xususiyatlar:</b>\n"
                "✅ Tezkor yuklab olish uchun keshlash\n"
                "✅ 2GB gacha fayllarni qo'llab-quvvatlash\n"
                "✅ HLS oqimlarini birlashtirish\n"
                "✅ Yuqori sifatli natija\n\n"
                "<i>Boshlash uchun havolani yuboring!</i>",
        
        "help": "📖 <b>Qanday foydalanish</b>\n\n"
                "1. <b>Video yuklab olish:</b>\n"
                "   Shunchaki video havolasini yuboring\n\n"
                "2. <b>Holatni tekshirish:</b>\n"
                "   Bot yuklab olish jarayonini ko'rsatadi\n\n"
                "3. <b>Keshlangan videolar:</b>\n"
                "   Keshlangan havolalar tezda yuklab olinadi!\n\n"
                "<b>Buyruqlar:</b>\n"
                "/start - Botni boshlash\n"
                "/help - Yordamni ko'rsatish\n"
                "/lang - Tilni o'zgartirish\n"
                "/stats - Bot statistikasi (faqat admin)\n"
                "/cache - Kesh ma'lumotlari\n\n"
                "<b>Maslahatlar:</b>\n"
                "• Jamoat videolari tezroq yuklab olish uchun keshlanadi\n"
                "• Katta fayllar ko'proq vaqt olishi mumkin\n"
                "• HLS oqimlari avtomatik ravishda MP4 formatiga o'tkaziladi",
        
        "stats": "📊 <b>Admin Boshqaruv Paneli</b>\n\n"
                 "<b>Foydalanuvchi statistikasi:</b>\n"
                 "• Jami foydalanuvchilar: {unique_users}\n\n"
                 "<b>Yuklab olish statistikasi:</b>\n"
                 "• Jami yuklab olingan videolar: {total_downloads}\n"
                 "• Muvaffaqiyatli: {successful}\n"
                 "• Muvaffaqiyatsiz: {failed}\n\n"
                 "<b>Kesh samaradorligi:</b>\n"
                 "• Kesh hitlari: {cache_hits}\n"
                 "• Kesh misslari: {cache_misses}\n"
                 "• Hit darajasi: {hit_rate}%\n"
                 "• Keshlangan videolar: {cached_entries}\n"
                 "• Kesh hajmi: {cache_size}\n\n"
                 "<b>Bot ish vaqti:</b>\n"
                 "• {uptime}",
        
        "stats_denied": "🔒 <b>Ruxsat Rad Etildi</b>\n\n"
                        "Bu buyruq faqat administratorlar uchun.",
        
        "cache_info": "💾 <b>Kesh Ma'lumotlari</b>\n\n"
                      "<b>Backend:</b> {backend}\n"
                      "<b>Keshlangan yozuvlar:</b> {cached_entries}\n"
                      "<b>Jami hajm:</b> {total_size}\n"
                      "<b>Kesh muddati:</b> {ttl} kun\n\n"
                      "<i>Keshlangan videolar qayta yuklab olinmasdan tez yuboriladi!</i>",
        
        # Language selection
        "language_selected": "✅ Til o'zgartirildi: {language}",
        "language_keyboard": "🌐 Tilni tanlang / Выберите язык / Select language:",
        
        # Download status
        "processing_request": "⏳ <b>So'rov qayta ishlanmoqda</b>\n\n"
                              "Task ID: <code>{task_id}</code>\n"
                              "Havola: {url}\n\n"
                              "<i>Kesh tekshirilmoqda va video ma'lumotlari olinmoqda...</i>",
        
        "processing_video": "🔄 <i>Video qayta ishlanmoqda...</i>\n"
                           "<i>Task ID: <code>{task_id}</code></i>",
        
        "cache_hit": "✨ <b>Keshda topildi!</b>\nTez yuborilmoqda...",
        
        "downloading": "⬇️ <b>Yuklab olinmoqda</b>\n\n"
                       "Task: <code>{task_id}</code>\n\n"
                       "{text}",
        
        "uploading": "⬆️ <b>Telegramga yuklanmoqda...</b>\n{progress}",
        
        "download_complete": "✅ Yuklab olish tugallandi!",
        
        # Errors
        "invalid_url": "❌ <b>Noto'g'ri havola</b>\n\n"
                       "Iltimos, to'g'ri HTTP/HTTPS havolasini yuboring.\n"
                       "<i>Misol: https://youtube.com/watch?v=...</i>",
        
        "download_failed": "❌ <b>Yuklab olish muvaffaqiyatsiz</b>\n\n"
                           "Task ID: <code>{task_id}</code>\n\n"
                           "<b>Xatolik:</b>\n"
                           "<code>{error}</code>\n\n"
                           "<i>Iltimos, qayta urinib ko'ring yoki havolani tekshiring.</i>",
        
        "video_too_large": "❌ <b>Video juda katta</b>\n\n"
                           "Video hajmi ({current}MB) limitdan oshib ketdi ({max}MB).\n\n"
                           "<i>Iltimos, kichikroq video tanlang.</i>",
        
        "rate_limit": "⏳ <b>Limit tugadi</b>\n\n"
                      "Siz daqiqasiga maksimal {max_requests} ta so'rov limitidan oshib ketdingiz.\n"
                      "<i>Qayta yuklab olish uchun bir daqiqa kuting.</i>",
        
        # Audio
        "extracting_audio": "🎵 <b>Audio olinmoqda</b>\n\n"
                           "Task ID: <code>{task_id}</code>\n\n"
                           "<i>Iltimos, audio olinishini kuting...</i>",
        
        "downloading_audio": "🎵 <b>Audio yuklanmoqda</b>\n\n"
                            "Task ID: <code>{task_id}</code>\n"
                            "Nomi: {title}\n\n"
                            "<i>Audio oqim olinmoqda...</i>",
        
        "audio_ready": "🎵 <b>Audio tayyor!</b>\n\n"
                       "Nomi: {title}\n"
                       "Hajmi: {size}\n\n"
                       "<i>Audio yuborilmoqda...</i>",
        
        "audio_extraction_failed": "❌ <b>Audio olish muvaffaqiyatsiz</b>\n\n"
                                   "Task ID: <code>{task_id}</code>\n\n"
                                   "<b>Xatolik:</b>\n"
                                   "<code>{error}</code>\n\n"
                                   "<i>Iltimos, qayta urinib ko'ring.</i>",
        
        # Quality selector
        "select_quality": "📺 <b>Video sifatini tanlang</b>\n\n"
                         "<b>{title}</b>\n"
                         "Davomiyligi: {duration}\n\n"
                         "Kerakli sifatni tanlang:",
        
        "quality_360p": "📹 360p (~{size})",
        "quality_720p": "📹 720p HD (~{size})",
        "quality_1080p": "📹 1080p Full HD (~{size})",
        "quality_best": "📹 Eng yaxshi sifat (~{size})",
        
        "downloading_selected_quality": "⬇️ <b>Tanlangan sifat yuklanmoqda</b>\n"
                                        "Sifat: {quality}\n\n"
                                        "<i>Iltimos, kuting...</i>",
        
        # Broadcast
        "broadcast_start": "📢 <b>Yangi xabar yuborish</b>\n\n"
                          "Iltimos, yubormoqchi bo'lgan xabaringizni yuboring.\n"
                          "(Matn, Rasm yoki Video + caption)\n\n"
                          "Bekor qilish uchun /cancel buyrug'ini yuboring.",
        
        "broadcast_confirm": "✅ <b>Xabar qabul qilindi!</b>\n\n"
                            "Xabarni barcha foydalanuvchilarga yuborishni tasdiqlaysizmi?\n\n"
                            "Davom etish: /confirm\n"
                            "Bekor qilish: /cancel",
        
        "broadcast_started": "🔄 <b>Yuborish boshlandi...</b>\n\n"
                            "Jami foydalanuvchilar: {total}\n"
                            "<i>Xabar yuborilmoqda...</i>",
        
        "broadcast_completed": "✅ <b>Yuborish tugallandi!</b>\n\n"
                               "<b>Hisobot:</b>\n"
                               "• Jami: {total}\n"
                               "• Muvaffaqiyatli: {success}\n"
                               "• Muvaffaqiyatsiz: {failed}\n\n"
                               "<i>Bajarildi: {time}s</i>",
        
        "broadcast_cancelled": "❌ Yuborish bekor qilindi.",
        
        "broadcast_only_admin": "🔒 Bu buyruq faqat administratorlar uchun.",
        
        "broadcast_waiting": "⏳ Avval /broadcast buyrug'ini ishlatishingiz kerak.",
        
        # Common
        "cancel": "Bekor qilish",
        "confirm": "Tasdiqlash",
        "back": "Ortga",
        "close": "Yopish",
        "download_audio": "🎵 Audio yuklab olish",
    },
    
    "ru": {
        # Commands
        "start": "🎬 <b>Бот для скачивания видео</b>\n\n"
                "Отправьте мне любую ссылку на видео, и я скачаю его для вас!\n\n"
                "<b>Поддерживаемые платформы:</b>\n"
                "• YouTube, Instagram, TikTok\n"
                "• Twitter/X, Facebook, Vimeo\n"
                "• Прямые .m3u8 HLS потоки\n"
                "• И 1000+ других сайтов\n\n"
                "<b>Возможности:</b>\n"
                "✅ Кэширование для мгновенной загрузки\n"
                "✅ Поддержка файлов до 2GB\n"
                "✅ Компиляция HLS потоков\n"
                "✅ Высокое качество\n\n"
                "<i>Просто отправьте ссылку!</i>",
        
        "help": "📖 <b>Как использовать</b>\n\n"
                "1. <b>Скачать видео:</b>\n"
                "   Просто отправьте ссылку на видео\n\n"
                "2. <b>Проверить статус:</b>\n"
                "   Бот покажет прогресс загрузки\n\n"
                "3. <b>Кэшированные видео:</b>\n"
                "   Кэшированные ссылки загружаются мгновенно!\n\n"
                "<b>Команды:</b>\n"
                "/start - Запустить бота\n"
                "/help - Показать эту справку\n"
                "/lang - Изменить язык\n"
                "/stats - Статистика бота (только админ)\n"
                "/cache - Информация о кэше\n\n"
                "<b>Советы:</b>\n"
                "• Публичные видео кэшируются для быстрого доступа\n"
                "• Большие файлы могут обрабатываться дольше\n"
                "• HLS потоки автоматически компилируются в MP4",
        
        "stats": "📊 <b>Панель администратора</b>\n\n"
                 "<b>Статистика пользователей:</b>\n"
                 "• Всего пользователей: {unique_users}\n\n"
                 "<b>Статистика загрузок:</b>\n"
                 "• Всего видео скачано: {total_downloads}\n"
                 "• Успешно: {successful}\n"
                 "• Неудачно: {failed}\n\n"
                 "<b>Эффективность кэша:</b>\n"
                 "• Попаданий в кэш: {cache_hits}\n"
                 "• Промахов кэша: {cache_misses}\n"
                 "• Процент попаданий: {hit_rate}%\n"
                 "• Кэшировано видео: {cached_entries}\n"
                 "• Размер кэша: {cache_size}\n\n"
                 "<b>Время работы бота:</b>\n"
                 "• {uptime}",
        
        "stats_denied": "🔒 <b>Доступ запрещён</b>\n\n"
                        "Эта команда доступна только администраторам.",
        
        "cache_info": "💾 <b>Информация о кэше</b>\n\n"
                      "<b>Backend:</b> {backend}\n"
                      "<b>Кэшировано записей:</b> {cached_entries}\n"
                      "<b>Общий размер:</b> {total_size}\n"
                      "<b>Срок жизни кэша:</b> {ttl} дн.\n\n"
                      "<i>Кэшированные видео отправляются мгновенно!</i>",
        
        # Language selection
        "language_selected": "✅ Язык изменён: {language}",
        "language_keyboard": "🌐 Выберите язык / Select language:",
        
        # Download status
        "processing_request": "⏳ <b>Обработка запроса</b>\n\n"
                              "Task ID: <code>{task_id}</code>\n"
                              "Ссылка: {url}\n\n"
                              "<i>Проверка кэша и получение информации...</i>",
        
        "processing_video": "🔄 <i>Обработка видео...</i>\n"
                           "<i>Task ID: <code>{task_id}</code></i>",
        
        "cache_hit": "✨ <b>Найдено в кэше!</b>\nОтправляю мгновенно...",
        
        "downloading": "⬇️ <b>Скачивание</b>\n\n"
                       "Task: <code>{task_id}</code>\n\n"
                       "{text}",
        
        "uploading": "⬆️ <b>Загрузка в Telegram...</b>\n{progress}",
        
        "download_complete": "✅ Загрузка завершена!",
        
        # Errors
        "invalid_url": "❌ <b>Неверная ссылка</b>\n\n"
                       "Пожалуйста, отправьте корректную HTTP/HTTPS ссылку.\n"
                       "<i>Пример: https://youtube.com/watch?v=...</i>",
        
        "download_failed": "❌ <b>Ошибка загрузки</b>\n\n"
                           "Task ID: <code>{task_id}</code>\n\n"
                           "<b>Ошибка:</b>\n"
                           "<code>{error}</code>\n\n"
                           "<i>Попробуйте снова или проверьте ссылку.</i>",
        
        "video_too_large": "❌ <b>Видео слишком большое</b>\n\n"
                           "Размер видео ({current}MB) превышает лимит ({max}MB).\n\n"
                           "<i>Пожалуйста, выберите видео меньшего размера.</i>",
        
        "rate_limit": "⏳ <b>Лимит достигнут</b>\n\n"
                      "Вы превысили максимальное количество запросов ({max_requests}) в минуту.\n"
                      "<i>Пожалуйста, подождите минуту перед следующей загрузкой.</i>",
        
        # Audio
        "extracting_audio": "🎵 <b>Извлечение аудио</b>\n\n"
                           "Task ID: <code>{task_id}</code>\n\n"
                           "<i>Пожалуйста, подождите...</i>",
        
        "downloading_audio": "🎵 <b>Загрузка аудио</b>\n\n"
                            "Task ID: <code>{task_id}</code>\n"
                            "Название: {title}\n\n"
                            "<i>Извлечение аудиопотока...</i>",
        
        "audio_ready": "🎵 <b>Аудио готово!</b>\n\n"
                       "Название: {title}\n"
                       "Размер: {size}\n\n"
                       "<i>Отправка аудио...</i>",
        
        "audio_extraction_failed": "❌ <b>Ошибка извлечения аудио</b>\n\n"
                                   "Task ID: <code>{task_id}</code>\n\n"
                                   "<b>Ошибка:</b>\n"
                                   "<code>{error}</code>\n\n"
                                   "<i>Попробуйте снова.</i>",
        
        # Quality selector
        "select_quality": "📺 <b>Выберите качество видео</b>\n\n"
                         "<b>{title}</b>\n"
                         "Длительность: {duration}\n\n"
                         "Выберите качество:",
        
        "quality_360p": "📹 360p (~{size})",
        "quality_720p": "📹 720p HD (~{size})",
        "quality_1080p": "📹 1080p Full HD (~{size})",
        "quality_best": "📹 Лучшее качество (~{size})",
        
        "downloading_selected_quality": "⬇️ <b>Загрузка выбранного качества</b>\n"
                                        "Качество: {quality}\n\n"
                                        "<i>Пожалуйста, подождите...</i>",
        
        # Broadcast
        "broadcast_start": "📢 <b>Новая рассылка</b>\n\n"
                          "Пожалуйста, отправьте сообщение для рассылки.\n"
                          "(Текст, Фото или Видео + подпись)\n\n"
                          "Для отмены отправьте /cancel",
        
        "broadcast_confirm": "✅ <b>Сообщение получено!</b>\n\n"
                            "Подтвердите отправку всем пользователям?\n\n"
                            "Продолжить: /confirm\n"
                            "Отмена: /cancel",
        
        "broadcast_started": "🔄 <b>Рассылка началась...</b>\n\n"
                            "Всего пользователей: {total}\n"
                            "<i>Отправка сообщений...</i>",
        
        "broadcast_completed": "✅ <b>Рассылка завершена!</b>\n\n"
                               "<b>Отчёт:</b>\n"
                               "• Всего: {total}\n"
                               "• Успешно: {success}\n"
                               "• Неудачно: {failed}\n\n"
                               "<i>Выполнено за: {time}с</i>",
        
        "broadcast_cancelled": "❌ Рассылка отменена.",
        
        "broadcast_only_admin": "🔒 Эта команда доступна только администраторам.",
        
        "broadcast_waiting": "⏳ Сначала используйте команду /broadcast.",
        
        # Common
        "cancel": "Отмена",
        "confirm": "Подтвердить",
        "back": "Назад",
        "close": "Закрыть",
        "download_audio": "🎵 Скачать аудио",
    },
    
    "en": {
        # Commands
        "start": "🎬 <b>Video Downloader Bot</b>\n\n"
                "Send me any video URL and I'll download it for you!\n\n"
                "<b>Supported Platforms:</b>\n"
                "• YouTube, Instagram, TikTok\n"
                "• Twitter/X, Facebook, Vimeo\n"
                "• Direct .m3u8 HLS streams\n"
                "• And 1000+ more sites\n\n"
                "<b>Features:</b>\n"
                "✅ Smart caching for instant downloads\n"
                "✅ Support for files up to 2GB\n"
                "✅ HLS stream compilation\n"
                "✅ High quality output\n\n"
                "<i>Just paste a URL to get started!</i>",
        
        "help": "📖 <b>How to Use</b>\n\n"
                "1. <b>Download Video:</b>\n"
                "   Simply send any video URL\n\n"
                "2. <b>Check Status:</b>\n"
                "   Bot will show download progress\n\n"
                "3. <b>Get Cached Videos:</b>\n"
                "   Cached URLs download instantly!\n\n"
                "<b>Commands:</b>\n"
                "/start - Start the bot\n"
                "/help - Show this help\n"
                "/lang - Change language\n"
                "/stats - View bot statistics (admin only)\n"
                "/cache - Cache information\n\n"
                "<b>Tips:</b>\n"
                "• Public videos are cached for faster access\n"
                "• Larger files may take longer to process\n"
                "• HLS streams are automatically compiled to MP4",
        
        "stats": "📊 <b>Admin Dashboard</b>\n\n"
                 "<b>User Statistics:</b>\n"
                 "• Total Users: {unique_users}\n\n"
                 "<b>Download Statistics:</b>\n"
                 "• Total Videos Downloaded: {total_downloads}\n"
                 "• Successful: {successful}\n"
                 "• Failed: {failed}\n\n"
                 "<b>Cache Performance:</b>\n"
                 "• Cache Hits: {cache_hits}\n"
                 "• Cache Misses: {cache_misses}\n"
                 "• Hit Rate: {hit_rate}%\n"
                 "• Cached Videos: {cached_entries}\n"
                 "• Cache Size: {cache_size}\n\n"
                 "<b>Bot Uptime:</b>\n"
                 "• {uptime}",
        
        "stats_denied": "🔒 <b>Access Denied</b>\n\n"
                        "This command is restricted to administrators only.",
        
        "cache_info": "💾 <b>Cache Information</b>\n\n"
                      "<b>Backend:</b> {backend}\n"
                      "<b>Cached Entries:</b> {cached_entries}\n"
                      "<b>Total Size:</b> {total_size}\n"
                      "<b>Cache TTL:</b> {ttl} days\n\n"
                      "<i>Cached videos are sent instantly!</i>",
        
        # Language selection
        "language_selected": "✅ Language changed: {language}",
        "language_keyboard": "🌐 Select language / Выберите язык:",
        
        # Download status
        "processing_request": "⏳ <b>Processing Request</b>\n\n"
                              "Task ID: <code>{task_id}</code>\n"
                              "URL: {url}\n\n"
                              "<i>Checking cache and extracting video info...</i>",
        
        "processing_video": "🔄 <i>Processing video...</i>\n"
                           "<i>Task ID: <code>{task_id}</code></i>",
        
        "cache_hit": "✨ <b>Cache Hit!</b>\nSending instantly...",
        
        "downloading": "⬇️ <b>Downloading</b>\n\n"
                       "Task: <code>{task_id}</code>\n\n"
                       "{text}",
        
        "uploading": "⬆️ <b>Uploading to Telegram...</b>\n{progress}",
        
        "download_complete": "✅ Download complete!",
        
        # Errors
        "invalid_url": "❌ <b>Invalid URL</b>\n\n"
                       "Please send a valid HTTP/HTTPS URL.\n"
                       "<i>Example: https://youtube.com/watch?v=...</i>",
        
        "download_failed": "❌ <b>Download Failed</b>\n\n"
                           "Task ID: <code>{task_id}</code>\n\n"
                           "<b>Error:</b>\n"
                           "<code>{error}</code>\n\n"
                           "<i>Please try again or check the URL.</i>",
        
        "video_too_large": "❌ <b>Video Too Large</b>\n\n"
                           "Video size ({current}MB) exceeds limit ({max}MB).\n\n"
                           "<i>Please select a smaller video.</i>",
        
        "rate_limit": "⏳ <b>Limit reached</b>\n\n"
                      "You have exceeded the maximum of {max_requests} requests per minute.\n"
                      "<i>Please wait a minute before downloading again.</i>",
        
        # Audio
        "extracting_audio": "🎵 <b>Extracting Audio</b>\n\n"
                           "Task ID: <code>{task_id}</code>\n\n"
                           "<i>Please wait while we extract the audio...</i>",
        
        "downloading_audio": "🎵 <b>Downloading Audio</b>\n\n"
                            "Task ID: <code>{task_id}</code>\n"
                            "Title: {title}\n\n"
                            "<i>Extracting audio stream...</i>",
        
        "audio_ready": "🎵 <b>Audio Ready!</b>\n\n"
                       "Title: {title}\n"
                       "Size: {size}\n\n"
                       "<i>Sending audio...</i>",
        
        "audio_extraction_failed": "❌ <b>Audio Extraction Failed</b>\n\n"
                                   "Task ID: <code>{task_id}</code>\n\n"
                                   "<b>Error:</b>\n"
                                   "<code>{error}</code>\n\n"
                                   "<i>Please try again.</i>",
        
        # Quality selector
        "select_quality": "📺 <b>Select Video Quality</b>\n\n"
                         "<b>{title}</b>\n"
                         "Duration: {duration}\n\n"
                         "Select quality:",
        
        "quality_360p": "📹 360p (~{size})",
        "quality_720p": "📹 720p HD (~{size})",
        "quality_1080p": "📹 1080p Full HD (~{size})",
        "quality_best": "📹 Best Quality (~{size})",
        
        "downloading_selected_quality": "⬇️ <b>Downloading Selected Quality</b>\n"
                                        "Quality: {quality}\n\n"
                                        "<i>Please wait...</i>",
        
        # Broadcast
        "broadcast_start": "📢 <b>New Broadcast</b>\n\n"
                          "Please send the message you want to broadcast.\n"
                          "(Text, Photo, or Video with caption)\n\n"
                          "Send /cancel to abort.",
        
        "broadcast_confirm": "✅ <b>Message Received!</b>\n\n"
                            "Confirm sending to all users?\n\n"
                            "Continue: /confirm\n"
                            "Cancel: /cancel",
        
        "broadcast_started": "🔄 <b>Broadcast Started...</b>\n\n"
                            "Total Users: {total}\n"
                            "<i>Sending messages...</i>",
        
        "broadcast_completed": "✅ <b>Broadcast Completed!</b>\n\n"
                               "<b>Report:</b>\n"
                               "• Total: {total}\n"
                               "• Successful: {success}\n"
                               "• Failed: {failed}\n\n"
                               "<i>Completed in: {time}s</i>",
        
        "broadcast_cancelled": "❌ Broadcast cancelled.",
        
        "broadcast_only_admin": "🔒 This command is restricted to administrators only.",
        
        "broadcast_waiting": "⏳ Please use /broadcast command first.",
        
        # Common
        "cancel": "Cancel",
        "confirm": "Confirm",
        "back": "Back",
        "close": "Close",
        "download_audio": "🎵 Download Audio",
    },
}


def get_user_language(user_id: int) -> str:
    """Get user's preferred language."""
    return _user_languages.get(user_id, "uz")  # Default to Uzbek


async def set_user_language(user_id: int, lang_code: str) -> bool:
    """Set user's preferred language."""
    if lang_code not in AVAILABLE_LANGUAGES:
        logger.warning(f"Invalid language code: {lang_code}")
        return False
    _user_languages[user_id] = lang_code
    logger.info(f"User {user_id} language set to {lang_code}")
    return True


def get_text(key: str, user_id: int = 0, **kwargs) -> str:
    """
    Get translated text for the given key.
    
    Args:
        key: Translation key
        user_id: User ID to get language preference
        **kwargs: Format arguments for the translation string
    
    Returns:
        Translated and formatted string
    """
    lang = get_user_language(user_id)
    lang_dict = TRANSLATIONS.get(lang, TRANSLATIONS["uz"])  # Fallback to Uzbek
    
    text = lang_dict.get(key, TRANSLATIONS["uz"].get(key, key))
    
    if kwargs:
        try:
            text = text.format(**kwargs)
        except KeyError:
            logger.warning(f"Missing format keys for {key}: {kwargs.keys()}")
    
    return text


def get_all_languages() -> Dict[str, str]:
    """Get all available languages with their display names."""
    return AVAILABLE_LANGUAGES.copy()
