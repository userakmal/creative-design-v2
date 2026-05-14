<?php
// ============================================================================
// Creative Design — Shared bootstrap for every API endpoint.
// Included at the top of every *.php file in /api.
// ============================================================================

declare(strict_types=1);

// Robust error handling: never leak HTML stack traces in JSON responses.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// ----------------------------------------------------------------------------
// Paths — everything is anchored to /api/../  (the public_html root).
// ----------------------------------------------------------------------------
define('ROOT_DIR',   dirname(__DIR__));
define('DATA_DIR',   ROOT_DIR . '/data');
define('VIDEO_DIR',  ROOT_DIR . '/videos');
define('IMAGE_DIR',  ROOT_DIR . '/image');
define('MUSIC_DIR',  ROOT_DIR . '/music');
define('VIDEOS_JSON', DATA_DIR . '/videos.json');
define('MUSIC_JSON',  DATA_DIR . '/music.json');

// Public URL prefixes the frontend uses (relative to site root).
define('VIDEO_URL_PREFIX', '/videos');
define('IMAGE_URL_PREFIX', '/image');
define('MUSIC_URL_PREFIX', '/music');

// ----------------------------------------------------------------------------
// Admin credentials — change once on the server, never commit secrets.
// Can also be overridden via cPanel environment variables.
// ----------------------------------------------------------------------------
define('ADMIN_USERNAME', getenv('ADMIN_USERNAME') ?: 'creative2026');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'admin2026');

// ----------------------------------------------------------------------------
// No application-level upload cap — the PHP-FPM limits in /api/.user.ini
// (upload_max_filesize / post_max_size) are the real ceiling. PHP_INT_MAX
// here disables our own byte check so any file PHP accepts will be saved.
// ----------------------------------------------------------------------------
define('MAX_UPLOAD_BYTES', PHP_INT_MAX);

// Allowed file extensions per field name.
const ALLOWED_EXT = [
    'video' => ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    'image' => ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
    'music' => ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac'],
];

// ----------------------------------------------------------------------------
// CORS — frontend lives on creative-design.uz, but allow * so the local
// dev build and admin tools can hit the API too.
// ----------------------------------------------------------------------------
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Make sure directories exist on first run.
foreach ([DATA_DIR, VIDEO_DIR, IMAGE_DIR, MUSIC_DIR] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}
if (!file_exists(VIDEOS_JSON)) file_put_contents(VIDEOS_JSON, '[]');
if (!file_exists(MUSIC_JSON))  file_put_contents(MUSIC_JSON,  '[]');

// ============================================================================
// Helpers
// ============================================================================

function send_json($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function send_error(string $message, int $status = 400): void {
    send_json(['error' => $message], $status);
}

function require_method(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        send_error('Method not allowed', 405);
    }
}

function check_password(?string $given): void {
    if (!is_string($given) || !hash_equals(ADMIN_PASSWORD, $given)) {
        send_error("Parol noto'g'ri", 401);
    }
}

/**
 * Read a JSON file with shared-lock. Returns [] on any failure.
 */
function read_json(string $path): array {
    $fp = @fopen($path, 'r');
    if (!$fp) return [];
    try {
        flock($fp, LOCK_SH);
        $content = stream_get_contents($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }
    if ($content === false || $content === '') return [];
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Atomically write JSON: write to tmp file then rename. Uses exclusive lock
 * on the destination to avoid two requests trampling each other.
 */
function write_json(string $path, array $data): void {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $tmp  = $path . '.tmp';
    $fp   = fopen($path, 'c+');
    if (!$fp) {
        send_error('JSON faylga yozib bolmadi', 500);
    }
    try {
        flock($fp, LOCK_EX);
        file_put_contents($tmp, $json);
        rename($tmp, $path);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }
}

function next_id(array $items): int {
    $max = 999;
    foreach ($items as $item) {
        if (isset($item['id']) && is_numeric($item['id']) && $item['id'] > $max) {
            $max = (int)$item['id'];
        }
    }
    return $max + 1;
}

function format_size(int $bytes): string {
    if ($bytes < 1024)         return $bytes . ' B';
    if ($bytes < 1024 * 1024)  return number_format($bytes / 1024, 1) . ' KB';
    return number_format($bytes / (1024 * 1024), 1) . ' MB';
}

/**
 * Move an uploaded file into the right folder, returning the public URL path
 * (e.g. "/videos/v_1234-567.mp4"). Validates extension against ALLOWED_EXT.
 */
function move_upload(array $file, string $field, string $destDir, string $urlPrefix): string {
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        send_error('Fayl yuklashda xatolik: ' . upload_error_message($file['error'] ?? -1), 400);
    }
    if ($file['size'] <= 0) {
        send_error('Bosh fayl yuklab bolmaydi', 400);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXT[$field] ?? [], true)) {
        send_error("Notogri fayl formati: .$ext", 400);
    }

    $prefix = ['video' => 'v', 'image' => 'i', 'music' => 'm'][$field] ?? 'f';
    $safeName = sprintf('%s_%d-%d.%s', $prefix, (int)(microtime(true) * 1000), random_int(100000000, 999999999), $ext);
    $dest = $destDir . '/' . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        send_error('Faylni saqlashda xatolik', 500);
    }
    @chmod($dest, 0644);
    return $urlPrefix . '/' . $safeName;
}

function upload_error_message(int $code): string {
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Fayl juda katta',
        UPLOAD_ERR_PARTIAL                        => 'Fayl toliq yuklanmadi',
        UPLOAD_ERR_NO_FILE                        => 'Fayl tanlanmagan',
        UPLOAD_ERR_NO_TMP_DIR                     => 'Server tmp papkasi yoq',
        UPLOAD_ERR_CANT_WRITE                     => 'Diskka yozib bolmadi',
        UPLOAD_ERR_EXTENSION                      => 'PHP extension blokladi',
        default                                   => 'Nomalum upload xatosi',
    };
}

/**
 * Delete a public file (path stored in JSON, e.g. "/videos/v_xxx.mp4").
 * Path-traversal safe: only deletes inside our known dirs.
 */
function delete_public_file(?string $publicPath): void {
    if (!$publicPath || str_starts_with($publicPath, 'http')) return;
    $name = basename($publicPath); // strip any "../"
    $dir = match (true) {
        str_starts_with($publicPath, VIDEO_URL_PREFIX) => VIDEO_DIR,
        str_starts_with($publicPath, IMAGE_URL_PREFIX) => IMAGE_DIR,
        str_starts_with($publicPath, MUSIC_URL_PREFIX) => MUSIC_DIR,
        default                                        => null,
    };
    if ($dir === null) return;
    $full = $dir . '/' . $name;
    if (is_file($full)) @unlink($full);
}

/**
 * Parse a JSON request body (used by PUT requests).
 */
function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
