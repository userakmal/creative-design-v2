<?php
// ============================================================================
// /api/upload.php  — Video + thumbnail upload (admin only).
// Multipart form fields: video, image, title, password
// ============================================================================
require __DIR__ . '/_bootstrap.php';
require_method('POST');

check_password($_POST['password'] ?? null);

if (empty($_FILES['video']['name']) || empty($_FILES['image']['name'])) {
    send_error('Video va rasm fayllarini yuklang', 400);
}

$title = trim((string)($_POST['title'] ?? ''));

$videoUrl = move_upload($_FILES['video'], 'video', VIDEO_DIR, VIDEO_URL_PREFIX);
$imageUrl = move_upload($_FILES['image'], 'image', IMAGE_DIR, IMAGE_URL_PREFIX);

$videos = read_json(VIDEOS_JSON);
$id     = next_id($videos);

$newVideo = [
    'id'         => $id,
    'title'      => $title !== '' ? $title : "Dizayn $id",
    'image'      => $imageUrl,
    'videoUrl'   => $videoUrl,
    'uploadedAt' => date('c'),
    'size'       => format_size((int)$_FILES['video']['size'] + (int)$_FILES['image']['size']),
];

$videos[] = $newVideo;
write_json(VIDEOS_JSON, $videos);

send_json([
    'success'     => true,
    'message'     => '"' . $newVideo['title'] . '" muvaffaqiyatli yuklandi!',
    'data'        => $newVideo,
    'totalVideos' => count($videos),
]);
