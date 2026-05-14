<?php
// ============================================================================
// /api/upload-music.php  — Music upload (admin only).
// Multipart form fields: music, title, author, password
// ============================================================================
require __DIR__ . '/_bootstrap.php';
require_method('POST');

check_password($_POST['password'] ?? null);

if (empty($_FILES['music']['name'])) {
    send_error('Musiqa faylni yuklang', 400);
}

$title  = trim((string)($_POST['title']  ?? ''));
$author = trim((string)($_POST['author'] ?? ''));

$musicUrl = move_upload($_FILES['music'], 'music', MUSIC_DIR, MUSIC_URL_PREFIX);

$list = read_json(MUSIC_JSON);
$id   = next_id($list);

$newMusic = [
    'id'         => $id,
    'title'      => $title  !== '' ? $title  : 'Yangi musiqa',
    'author'     => $author !== '' ? $author : "Nomalum",
    'duration'   => '0:00',
    'url'        => $musicUrl,
    'uploadedAt' => date('c'),
    'size'       => format_size((int)$_FILES['music']['size']),
];

$list[] = $newMusic;
write_json(MUSIC_JSON, $list);

send_json([
    'success'    => true,
    'message'    => '"' . $newMusic['title'] . '" muvaffaqiyatli yuklandi!',
    'data'       => $newMusic,
    'totalMusic' => count($list),
]);
