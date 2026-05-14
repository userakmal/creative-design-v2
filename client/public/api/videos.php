<?php
// ============================================================================
// /api/videos.php
//   GET            → list all videos
//   DELETE ?id=NNN → delete a video (no auth header needed; admin panel uses
//                    it directly. If you want to lock this down, add a
//                    password header check here.)
//   PUT    ?id=NNN → rename video (body: { title })
// ============================================================================
require __DIR__ . '/_bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    send_json(read_json(VIDEOS_JSON));
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    send_error('id parametri talab qilinadi', 400);
}

$videos = read_json(VIDEOS_JSON);
$index  = null;
foreach ($videos as $i => $v) {
    if ((int)($v['id'] ?? 0) === $id) { $index = $i; break; }
}
if ($index === null) {
    send_error('Video topilmadi', 404);
}

if ($method === 'DELETE') {
    $video = $videos[$index];
    delete_public_file($video['videoUrl'] ?? null);
    delete_public_file($video['image']    ?? null);
    array_splice($videos, $index, 1);
    write_json(VIDEOS_JSON, $videos);
    send_json([
        'success'     => true,
        'message'     => '"' . ($video['title'] ?? '') . '" ochirildi',
        'deletedId'   => $id,
        'totalVideos' => count($videos),
    ]);
}

if ($method === 'PUT') {
    $body  = read_json_body();
    $title = trim((string)($body['title'] ?? ''));
    if ($title === '') {
        send_error('Nom kiritish kerak', 400);
    }
    $videos[$index]['title'] = $title;
    write_json(VIDEOS_JSON, $videos);
    send_json([
        'success' => true,
        'message' => "Nom ozgartirildi",
        'data'    => $videos[$index],
    ]);
}

send_error('Method not allowed', 405);
