<?php
// Ushbu skript saytning online (jonli) serverida (FTP orqali) ishlashi uchun mo'ljallangan
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Ruxsat etilmagan metod. Faqat POST qabul qilinadi."]);
    exit;
}

// Ixtiyoriy parolni tekshirish (frontend-dan jo'natilganmi?)
$password = isset($_POST['password']) ? $_POST['password'] : '';
if ($password !== 'creative2026') {
    echo json_encode(["error" => "Parol noto'g'ri yoki ruxsat yo'q"]);
    exit;
}

$title = isset($_POST['title']) ? $_POST['title'] : 'Yangi video';

// Papkalar (dist ichidagi public -> root hisobida)
// Upload.php qayerda turadi? /api/upload.php da.
// Videolar esa /videos/ va rasmlar /image/ da.
$videoDir = '../videos/';
$imageDir = '../image/';
$dataDir = '../data/';
$dataFile = $dataDir . 'videos.json';

// Papkalar yo'q bo'lsa yaratamiz
if (!file_exists($videoDir)) mkdir($videoDir, 0777, true);
if (!file_exists($imageDir)) mkdir($imageDir, 0777, true);
if (!file_exists($dataDir)) mkdir($dataDir, 0777, true);

if (!isset($_FILES['video']) || !isset($_FILES['image'])) {
    echo json_encode(["error" => "Iltimos, video va rasmni to'liq yuklang."]);
    exit;
}

$vidExt = strtolower(pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION));
$imgExt = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));

// Xavfsizlik: faqat ruxsat etilgan formatlar
$allowedVids = ['mp4', 'mov', 'webm'];
$allowedImgs = ['jpg', 'jpeg', 'png', 'webp'];

if (!in_array($vidExt, $allowedVids) || !in_array($imgExt, $allowedImgs)) {
    echo json_encode(["error" => "Fayl formati noto'g'ri. (Faqat mp4, mov, jpg, png)"]);
    exit;
}

$unique = date("U") . rand(1000, 9999);
$vidName = "v_" . $unique . "." . $vidExt;
$imgName = "i_" . $unique . "." . $imgExt;

if (move_uploaded_file($_FILES['video']['tmp_name'], $videoDir . $vidName) &&
    move_uploaded_file($_FILES['image']['tmp_name'], $imageDir . $imgName)) {

    $videoUrl = "/videos/" . $vidName;
    $imageUrl = "/image/" . $imgName;

    // JSON dan o'qish
    $videos = [];
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $videos = $decoded;
        }
    }

    $maxId = 48; // Asosiy configdagi oxirgi ID
    foreach ($videos as $v) {
        if (isset($v['id']) && $v['id'] > $maxId) {
            $maxId = $v['id'];
        }
    }
    $newId = $maxId + 1;

    $newVideo = [
        "id" => $newId,
        "title" => $title,
        "image" => $imageUrl,
        "videoUrl" => $videoUrl
    ];

    $videos[] = $newVideo;
    file_put_contents($dataFile, json_encode($videos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(["success" => true, "message" => "Video muvaffaqiyatli saqlandi!", "data" => $newVideo]);
} else {
    echo json_encode(["error" => "Serverga faylni saqlashda xatolik yuz berdi. Papkani yozishga ruxsati bormi (chmod 777)?"]);
}
?>
