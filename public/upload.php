<?php
// upload.php - Securely upload nominee photos to cPanel persistent storage.

// Enable CORS so the admin panel can talk to it
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
    exit();
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No image file provided."]);
    exit();
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Only images (JPG, PNG, GIF, WEBP) are allowed."]);
    exit();
}

// Ensure uploads folder exists
$targetDir = __DIR__ . '/uploads/';
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// Generate unique file name
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = 'nominee_' . time() . '_' . rand(1000, 9999) . '.' . $extension;
$targetFile = $targetDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    // Return the absolute public URL of the uploaded image
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $imageUrl = $protocol . "://" . $host . "/uploads/" . $fileName;
    
    echo json_encode([
        "status" => "success",
        "path" => $imageUrl // This goes straight into nomineeForm.photo_url!
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save file on cPanel server."]);
}
