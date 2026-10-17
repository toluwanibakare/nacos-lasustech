<?php
/**
 * Shared bootstrap for api.php.
 * config.php is the LIVE file already on the server (DB credentials + API_KEY).
 * It sits one folder above lib/ and is never part of this repo folder.
 */
declare(strict_types=1);

@ini_set('display_errors', '0');
require_once dirname(__DIR__) . '/config.php'; // gives $pdo and API_KEY
header('Content-Type: application/json; charset=utf-8');

const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
const UPLOAD_MIMES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const DEPARTMENTS_FALLBACK = ['Computer Science', 'Software Engineering', 'Artificial Intelligence'];

function json_out($data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400): never
{
    json_out(['error' => $message, 'message' => $message], $code);
}

function require_api_key(): void
{
    $provided = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($provided === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strtolower($name) === 'x-api-key') {
                $provided = $value;
            }
        }
    }
    if (!hash_equals((string) API_KEY, (string) $provided)) {
        fail('Unauthorized Access', 403);
    }
}

/** JSON body if sent as JSON, otherwise form fields. */
function input(): array
{
    static $data = null;
    if ($data !== null) return $data;
    $raw = file_get_contents('php://input');
    $decoded = ($raw !== '' && $raw !== false) ? json_decode($raw, true) : null;
    $data = is_array($decoded) ? $decoded : $_POST;
    return $data;
}

/** Strips password / OTP fields so they never leave the server. */
function public_row(array $row): array
{
    unset($row['password'], $row['otp_code'], $row['otp_expiry']);
    return $row;
}

function setting(PDO $pdo, string $key, string $default = ''): string
{
    $stmt = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : (string) $value;
}

function current_session(PDO $pdo): string
{
    return setting($pdo, 'current_session', '2026/2027');
}

function allowed_departments(PDO $pdo): array
{
    $list = array_values(array_filter(array_map('trim', explode(',', setting($pdo, 'departments', '')))));
    return $list ?: DEPARTMENTS_FALLBACK;
}

function id_card_fee(PDO $pdo, string $accountType): float
{
    $key = $accountType === 'fresher' ? 'fee_id_card_fresher' : 'fee_id_card_stalite';
    return (float) setting($pdo, $key, $accountType === 'fresher' ? '1500' : '1000');
}

function find_student_by_matric(PDO $pdo, string $matric): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM students WHERE matric_no = ? LIMIT 1');
    $stmt->execute([trim($matric)]);
    return $stmt->fetch() ?: null;
}

function find_student_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM students WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function find_fresher(PDO $pdo, $id = null, ?string $email = null): ?array
{
    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM freshers WHERE id = ? LIMIT 1');
        $stmt->execute([(int) $id]);
    } elseif ($email) {
        $stmt = $pdo->prepare('SELECT * FROM freshers WHERE email = ? LIMIT 1');
        $stmt->execute([strtolower(trim($email))]);
    } else {
        return null;
    }
    return $stmt->fetch() ?: null;
}

function new_otp(): string
{
    return sprintf('%06d', random_int(0, 999999));
}

/** Validates an uploaded photo and stores it in uploads/. Returns the stored filename. */
function store_photo(array $file, string $prefix): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail('Image upload failed. Please try again.');
    }
    if ((int) $file['size'] > UPLOAD_MAX_BYTES) {
        fail('Image is too large. Maximum size is 2MB.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset(UPLOAD_MIMES[$mime])) {
        fail('Invalid image format. Use JPG, PNG or WEBP.');
    }
    $dims = @getimagesize($file['tmp_name']);
    if (!$dims || min($dims[0], $dims[1]) < 300) {
        fail('Photo is too small. Use an image that is at least 300px on its shorter side.');
    }
    $dir = dirname(__DIR__) . '/uploads';
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        fail('Could not store the photo.', 500);
    }
    $name = preg_replace('/[^A-Za-z0-9]/', '', $prefix) . '_' . time() . '.' . UPLOAD_MIMES[$mime];
    if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
        fail('Could not store the photo.', 500);
    }
    return $name;
}

function delete_photo(?string $filename): void
{
    if (!$filename) return;
    $path = dirname(__DIR__) . '/uploads/' . basename($filename);
    if (is_file($path)) {
        @unlink($path);
    }
}
