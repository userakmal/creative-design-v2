<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

// ============================================
//   YORDAMCHI FUNKSIYALAR
// ============================================

/**
 * Foydalanuvchining haqiqiy IP manzilini olish.
 * Cloudflare / proxy ortida ham to'g'ri ishlaydi.
 */
function getClientIp(): string {
    $candidates = [
        'HTTP_CF_CONNECTING_IP', // Cloudflare
        'HTTP_X_REAL_IP',        // Nginx
        'HTTP_X_FORWARDED_FOR',  // Standart proxy
        'REMOTE_ADDR',           // To'g'ridan-to'g'ri ulanish
    ];
    foreach ($candidates as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = explode(',', $_SERVER[$key])[0];
            $ip = trim($ip);
            if (filter_var($ip, FILTER_VALIDATE_IP) !== false) {
                return $ip;
            }
        }
    }
    return '0.0.0.0';
}

/**
 * Log papkasini yaratish va himoyalash (faqat birinchi marta).
 */
function ensureLogDir(): bool {
    if (is_dir(LOG_DIR)) return true;
    if (!@mkdir(LOG_DIR, 0750, true) && !is_dir(LOG_DIR)) {
        return false;
    }
    // .htaccess fayli yo'q bo'lsa — qo'shamiz (himoya)
    $ht = LOG_DIR . '/.htaccess';
    if (!file_exists($ht)) {
        @file_put_contents(
            $ht,
            "Order allow,deny\nDeny from all\n",
            LOCK_EX
        );
    }
    return true;
}

/**
 * Xatolarni log fayliga yozish.
 * Format: JSON Lines (har bir satr - bitta hodisa).
 */
function logEvent(string $level, string $message, array $context = []): void {
    if (!ensureLogDir()) return;

    $entry = [
        'time'    => date('Y-m-d H:i:s'),
        'level'   => $level,
        'ip'      => getClientIp(),
        'message' => $message,
        'context' => $context,
    ];

    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($line === false) return;

    @file_put_contents(
        LOG_DIR . '/error.log',
        $line . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

/**
 * Sliding-window rate limit.
 * IP bo'yicha cheklov: WINDOW sekund ichida MAX dan ko'p so'rov bo'lmasligi kerak.
 *
 * @return array{allowed:bool, remaining:int, retryAfter:int}
 */
function checkRateLimit(string $ip): array {
    if (!ensureLogDir()) {
        // Log papka mavjud emas — fail-open, lekin xabar beramiz
        return ['allowed' => true, 'remaining' => RATE_LIMIT_MAX, 'retryAfter' => 0];
    }

    $file = LOG_DIR . '/rate_' . hash('sha256', $ip) . '.json';
    $now  = time();

    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        logEvent('warn', 'Rate limit faylini ocholmadi', ['file' => basename($file)]);
        return ['allowed' => true, 'remaining' => RATE_LIMIT_MAX, 'retryAfter' => 0];
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return ['allowed' => true, 'remaining' => RATE_LIMIT_MAX, 'retryAfter' => 0];
    }

    $raw  = stream_get_contents($fp);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($data) || !isset($data['timestamps']) || !is_array($data['timestamps'])) {
        $data = ['timestamps' => []];
    }

    // Vaqt oynasidan tashqaridagi yozuvlarni o'chiramiz
    $windowStart = $now - RATE_LIMIT_WINDOW;
    $data['timestamps'] = array_values(array_filter(
        $data['timestamps'],
        static fn($t) => is_int($t) && $t > $windowStart
    ));

    $count   = count($data['timestamps']);
    $allowed = $count < RATE_LIMIT_MAX;

    if ($allowed) {
        $data['timestamps'][] = $now;
    }

    // Faylga yozish
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    $remaining  = max(0, RATE_LIMIT_MAX - count($data['timestamps']));
    $retryAfter = 0;
    if (!$allowed && !empty($data['timestamps'])) {
        $oldest     = min($data['timestamps']);
        $retryAfter = max(1, ($oldest + RATE_LIMIT_WINDOW) - $now);
    }

    // Vaqti-vaqti bilan eski rate-limit fayllarini tozalash (1% ehtimol)
    if (random_int(1, 100) === 1) {
        cleanupOldRateFiles();
    }

    return [
        'allowed'    => $allowed,
        'remaining'  => $remaining,
        'retryAfter' => $retryAfter,
    ];
}

/**
 * Eski rate-limit fayllarini tozalash (1 soatdan ortiq tegilmagani).
 */
function cleanupOldRateFiles(): void {
    $files = @glob(LOG_DIR . '/rate_*.json') ?: [];
    $cutoff = time() - 3600;
    foreach ($files as $file) {
        if (@filemtime($file) < $cutoff) {
            @unlink($file);
        }
    }
}

/**
 * Markdown-ga zararli belgilarni qochirish.
 */
function tgEscape(string $s): string {
    return str_replace(['`', '*', '_', '['], ['', '', '', '('], $s);
}

/**
 * Telegram API ga so'rov yuborish.
 *
 * @return array{ok:bool, error?:string, httpCode:int}
 */
function tgRequest(string $method, array $params): array {
    $url = 'https://api.telegram.org/bot' . BOT_TOKEN . '/' . $method;
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($params),
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['ok' => false, 'error' => 'cURL: ' . $curlErr, 'httpCode' => 0];
    }

    $decoded = json_decode((string)$response, true);
    if (!is_array($decoded)) {
        return ['ok' => false, 'error' => 'Invalid JSON response', 'httpCode' => $httpCode];
    }

    if (($decoded['ok'] ?? false) !== true) {
        return [
            'ok'       => false,
            'error'    => $decoded['description'] ?? 'Unknown Telegram error',
            'httpCode' => $httpCode,
        ];
    }

    return ['ok' => true, 'httpCode' => $httpCode];
}

/**
 * JSON javob qaytarish va dasturni tugatish.
 */
function jsonResponse(int $httpCode, array $body): void {
    http_response_code($httpCode);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================
//   ASOSIY LOGIKA
// ============================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// ---- 1. CSRF himoyasi (Origin/Referer tekshiruvi) ----
if (defined('ALLOWED_ORIGIN') && ALLOWED_ORIGIN !== '') {
    $allowed = rtrim(ALLOWED_ORIGIN, '/');
    $parts   = parse_url($allowed);
    $allowedHost = ($parts['host'] ?? '') . (isset($parts['port']) ? ':' . $parts['port'] : '');
    $allowedNoScheme = preg_replace('#^https?://#i', '', $allowed);

    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';

    $originOk = false;
    if ($origin !== '' && $allowedHost !== '') {
        $oParts = parse_url($origin);
        $oHost  = ($oParts['host'] ?? '') . (isset($oParts['port']) ? ':' . $oParts['port'] : '');
        $originOk = strcasecmp($oHost, $allowedHost) === 0;
    }

    $refererOk = false;
    if ($referer !== '' && $allowedNoScheme !== '') {
        $rNoScheme = preg_replace('#^https?://#i', '', $referer);
        $refererOk = stripos($rNoScheme, $allowedNoScheme) === 0;
    }

    if (!$originOk && !$refererOk) {
        logEvent('warn', 'Forbidden origin', [
            'origin'  => substr($origin, 0, 200),
            'referer' => substr($referer, 0, 200),
        ]);
        jsonResponse(403, ['ok' => false, 'error' => 'Forbidden origin']);
    }
}

// ---- 2. Rate limiting ----
$clientIp = getClientIp();
$rate     = checkRateLimit($clientIp);

if (!$rate['allowed']) {
    logEvent('info', 'Rate limit oshib ketdi', ['retryAfter' => $rate['retryAfter']]);
    header('Retry-After: ' . $rate['retryAfter']);
    header('X-RateLimit-Limit: ' . RATE_LIMIT_MAX);
    header('X-RateLimit-Remaining: 0');
    jsonResponse(429, [
        'ok'         => false,
        'error'      => 'Juda ko\'p so\'rov. Iltimos, biroz kuting.',
        'retryAfter' => $rate['retryAfter'],
    ]);
}

header('X-RateLimit-Limit: ' . RATE_LIMIT_MAX);
header('X-RateLimit-Remaining: ' . $rate['remaining']);

// ---- 3. JSON payload validatsiyasi ----
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 4096) {
    logEvent('warn', 'Yaroqsiz payload (hajm)', ['size' => is_string($raw) ? strlen($raw) : 0]);
    jsonResponse(400, ['ok' => false, 'error' => 'Invalid payload']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    logEvent('warn', 'Yaroqsiz JSON');
    jsonResponse(400, ['ok' => false, 'error' => 'Invalid JSON']);
}

// ---- 4. Koordinatalarni tekshirish ----
$lat      = filter_var($data['lat']      ?? null, FILTER_VALIDATE_FLOAT);
$lon      = filter_var($data['lon']      ?? null, FILTER_VALIDATE_FLOAT);
$accuracy = filter_var($data['accuracy'] ?? null, FILTER_VALIDATE_FLOAT);

if ($lat === false || $lon === false
    || $lat < -90 || $lat > 90
    || $lon < -180 || $lon > 180
    || ($lat === 0.0 && $lon === 0.0)) {
    logEvent('warn', 'Yaroqsiz koordinata', ['lat' => $lat, 'lon' => $lon]);
    jsonResponse(400, ['ok' => false, 'error' => 'Invalid coordinates']);
}

// ---- 5. Aniqlik validatsiyasi (qattiq) ----
if ($accuracy === false || $accuracy <= 0) {
    logEvent('warn', 'Aniqlik kiritilmagan', ['accuracy' => $accuracy]);
    jsonResponse(400, ['ok' => false, 'error' => 'Accuracy required']);
}

if ($accuracy > MAX_ACCURACY_M) {
    logEvent('info', 'Aniqlik chegaradan oshib ketdi', [
        'accuracy' => $accuracy,
        'max'      => MAX_ACCURACY_M,
    ]);
    jsonResponse(422, [
        'ok'    => false,
        'error' => sprintf(
            'Lokatsiya juda noaniq (±%d m). Iltimos, qaytadan urinib ko\'ring.',
            (int)round($accuracy)
        ),
    ]);
}

// ---- 6. Qo'shimcha ma'lumotlar ----
$altitude  = filter_var($data['altitude']  ?? null, FILTER_VALIDATE_FLOAT);
$speed     = filter_var($data['speed']     ?? null, FILTER_VALIDATE_FLOAT);
$samples   = filter_var($data['samples']   ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 1000]]);
$elapsedMs = filter_var($data['elapsedMs'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 600000]]);
$reason    = in_array($data['reason'] ?? '', ['target', 'acceptable', 'timeout'], true)
    ? $data['reason']
    : 'unknown';

// ---- 7. Konfiguratsiya tekshiruvi ----
if (!defined('BOT_TOKEN') || BOT_TOKEN === '' || strpos(BOT_TOKEN, 'BU_YERGA') !== false
    || !defined('CHAT_ID')   || CHAT_ID   === '' || strpos((string)CHAT_ID, 'BU_YERGA') !== false) {
    logEvent('error', 'Server konfiguratsiyasi nato\'g\'ri (BOT_TOKEN yoki CHAT_ID)');
    jsonResponse(500, ['ok' => false, 'error' => 'Server not configured']);
}

// ---- 8. Telegram xabarini tayyorlash ----
$ua        = substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 200);
$time      = date('Y-m-d H:i:s');
$mapsLink  = "https://www.google.com/maps?q={$lat},{$lon}";
$accRound  = (int)round((float)$accuracy);

if ($accRound <= 5)       { $accBadge = "🟢 A'lo"; }
elseif ($accRound <= 15)  { $accBadge = "🟡 Yaxshi"; }
elseif ($accRound <= 30)  { $accBadge = "🟠 O'rtacha"; }
else                       { $accBadge = "🔵 Qabul qilarli"; }

$reasonLabel = [
    'target'     => "5m maqsadga yetdi",
    'acceptable' => "qabul qilarli daraja",
    'timeout'    => "vaqt tugadi",
    'unknown'    => "—",
][$reason] ?? '—';

$caption  = "📍 *Yangi lokatsiya*\n\n";
$caption .= "🕐 Vaqt: `{$time}`\n";
$caption .= "🎯 Aniqlik: *±{$accRound} m*  {$accBadge}\n";
if ($altitude !== false && $altitude !== null) {
    $caption .= "⛰ Balandlik: " . round((float)$altitude) . " m\n";
}
if ($speed !== false && $speed !== null && $speed > 0) {
    $caption .= "🏃 Tezlik: " . round((float)$speed * 3.6, 1) . " km/h\n";
}
if ($samples) {
    $caption .= "📊 O'lchovlar: {$samples} ta, " . round(((int)$elapsedMs) / 1000) . " s ({$reasonLabel})\n";
}
$caption .= "🌐 IP: `" . tgEscape($clientIp) . "`\n";
$caption .= "📱 Qurilma: `" . tgEscape($ua) . "`\n\n";
$caption .= "🗺 [Google Maps'da ochish]({$mapsLink})";

// ---- 9. Telegram ga yuborish ----
$locResult = tgRequest('sendLocation', [
    'chat_id'             => CHAT_ID,
    'latitude'            => $lat,
    'longitude'           => $lon,
    'horizontal_accuracy' => min((float)$accuracy, 1500.0), // Telegram API chegarasi
]);

$msgResult = tgRequest('sendMessage', [
    'chat_id'                  => CHAT_ID,
    'text'                     => $caption,
    'parse_mode'               => 'Markdown',
    'disable_web_page_preview' => true,
]);

if ($locResult['ok'] && $msgResult['ok']) {
    jsonResponse(200, ['ok' => true]);
}

logEvent('error', 'Telegram yuborishda xato', [
    'sendLocation' => $locResult,
    'sendMessage'  => $msgResult,
]);
jsonResponse(502, ['ok' => false, 'error' => 'Telegram error']);
