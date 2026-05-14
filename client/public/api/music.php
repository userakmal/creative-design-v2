<?php
// ============================================================================
// /api/music.php
//   GET            → list all music
//   DELETE ?id=NNN → delete a track
//   PUT    ?id=NNN → rename (body: { title, author })
// ============================================================================
require __DIR__ . '/_bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    send_json(read_json(MUSIC_JSON));
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    send_error('id parametri talab qilinadi', 400);
}

$list  = read_json(MUSIC_JSON);
$index = null;
foreach ($list as $i => $m) {
    if ((int)($m['id'] ?? 0) === $id) { $index = $i; break; }
}
if ($index === null) {
    send_error('Musiqa topilmadi', 404);
}

if ($method === 'DELETE') {
    $music = $list[$index];
    delete_public_file($music['url'] ?? null);
    array_splice($list, $index, 1);
    write_json(MUSIC_JSON, $list);
    send_json([
        'success'    => true,
        'message'    => '"' . ($music['title'] ?? '') . '" ochirildi',
        'deletedId'  => $id,
        'totalMusic' => count($list),
    ]);
}

if ($method === 'PUT') {
    $body   = read_json_body();
    $title  = trim((string)($body['title']  ?? ''));
    $author = trim((string)($body['author'] ?? ''));
    if ($title !== '')  $list[$index]['title']  = $title;
    if ($author !== '') $list[$index]['author'] = $author;
    write_json(MUSIC_JSON, $list);
    send_json([
        'success' => true,
        'message' => 'Musiqa yangilandi',
        'data'    => $list[$index],
    ]);
}

send_error('Method not allowed', 405);
