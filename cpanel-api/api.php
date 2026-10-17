<?php
/**
 * NACOS central API (cPanel). Called only by the Node backend with X-API-KEY.
 * This file replaces the old api.php. Run id-card/sql/001, 002 (at go-live) and
 * 003 before deploying it.
 *
 * Every response that returns a student/fresher row has password / OTP fields
 * removed (the old api.php returned them).
 */
declare(strict_types=1);

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/crop.php';

require_api_key();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

function need_post(string $method): void
{
    if ($method !== 'POST') fail('POST required.', 405);
}

function normalise_email($value): string
{
    $email = strtolower(trim((string) $value));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address.');
    return $email;
}

function validate_password($value): string
{
    $password = (string) $value;
    if (strlen($password) < 8) fail('Password must be at least 8 characters.');
    return $password;
}

/** Resolves ['type' => student|fresher, 'row' => ...] from request identifiers. */
function resolve_person(PDO $pdo, array $in): array
{
    $type = ($in['account_type'] ?? 'student') === 'fresher' ? 'fresher' : 'student';
    if ($type === 'fresher') {
        $row = find_fresher($pdo, $in['fresher_id'] ?? null, $in['email'] ?? null);
        if (!$row) fail('Fresher account not found.', 404);
        return ['type' => 'fresher', 'row' => $row];
    }
    $matric = (string) ($in['matric_number'] ?? $in['matric_no'] ?? $in['matric'] ?? '');
    $row = $matric !== '' ? find_student_by_matric($pdo, $matric) : null;
    if (!$row) fail('Student not found.', 404);
    if (($row['level'] ?? '') === 'alumni') fail('Alumni cannot use the portal.', 403);
    return ['type' => 'student', 'row' => $row];
}

function person_key(array $person): array
{
    // [column, id] for payments / id_card_requests
    return $person['type'] === 'fresher'
        ? ['fresher_id', (int) $person['row']['id']]
        : ['student_id', (int) $person['row']['id']];
}

function fresher_view(array $f): array
{
    $f = public_row($f);
    $f['account_type'] = 'fresher';
    $f['level'] = '100';
    $f['post'] = 'Fresher';
    return $f;
}

function student_view(array $s): array
{
    $s = public_row($s);
    $s['account_type'] = 'student';
    return $s;
}

// ─── Reads for the admin / dashboards ────────────────────────────────────────

if ($method === 'GET' && $action === 'get_all_students') {
    $rows = $pdo->query('SELECT * FROM students ORDER BY full_name ASC')->fetchAll();
    json_out(array_map('student_view', $rows));
}

if ($method === 'GET' && $action === 'get_all_freshers') {
    $rows = $pdo->query('SELECT * FROM freshers ORDER BY created_at DESC')->fetchAll();
    json_out(array_map('fresher_view', $rows));
}

if ($method === 'GET' && $action === 'get_all_payments') {
    json_out($pdo->query(
        "SELECT p.*, COALESCE(s.full_name, f.full_name) AS full_name,
                COALESCE(s.matric_no, f.matric_no) AS matric_no,
                IF(p.fresher_id IS NOT NULL AND p.student_id IS NULL, 'fresher', 'student') AS account_type,
                h.title AS item_title
         FROM payments p
         LEFT JOIN students s ON s.id = p.student_id
         LEFT JOIN freshers f ON f.id = p.fresher_id
         LEFT JOIN hoc_items h ON h.id = p.hoc_item_id
         ORDER BY p.id DESC"
    )->fetchAll());
}

if ($method === 'GET' && $action === 'get_messages') {
    json_out($pdo->query('SELECT * FROM contact_messages ORDER BY id DESC')->fetchAll());
}

if ($method === 'GET' && $action === 'get_fees') {
    json_out([
        'session' => current_session($pdo),
        'semester' => setting($pdo, 'current_semester', 'First Semester'),
        'id_card_stalite' => id_card_fee($pdo, 'student'),
        'id_card_fresher' => id_card_fee($pdo, 'fresher'),
        'dues' => (float) setting($pdo, 'fee_dues', '2000'),
        'departments' => allowed_departments($pdo),
        'welcome_message' => setting($pdo, 'welcome_message', ''),
    ]);
}

if ($action === 'set_fees') {
    need_post($method);
    $in = input();
    $map = [
        'id_card_stalite' => ['fee_id_card_stalite', 'fees'],
        'id_card_fresher' => ['fee_id_card_fresher', 'fees'],
        'dues' => ['fee_dues', 'fees'],
    ];
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value, setting_group) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ($map as $field => [$key, $group]) {
        if (!array_key_exists($field, $in)) continue;
        if (!is_numeric($in[$field]) || (float) $in[$field] < 0) fail("Invalid amount for $field.");
        $stmt->execute([$key, (string) (float) $in[$field], $group]);
    }
    json_out(['status' => 'success']);
}

// Session / semester / welcome message / departments (admin "Academic" screen).
if ($action === 'update_academic_settings') {
    need_post($method);
    $in = input();
    $fields = [
        'session' => ['current_session', '/^\d{4}\/\d{4}$/', 'Session must look like 2026/2027.'],
        'semester' => ['current_semester', '/^(First|Second) Semester$/', 'Semester must be "First Semester" or "Second Semester".'],
    ];
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value, setting_group) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ($fields as $field => [$key, $pattern, $message]) {
        if (!array_key_exists($field, $in)) continue;
        $value = trim((string) $in[$field]);
        if (!preg_match($pattern, $value)) fail($message);
        $stmt->execute([$key, $value, 'academic']);
    }
    if (array_key_exists('welcome_message', $in)) {
        $stmt->execute(['welcome_message', mb_substr(trim((string) $in['welcome_message']), 0, 500), 'academic']);
    }
    json_out(['status' => 'success']);
}

// ─── Stalite (existing student) auth ─────────────────────────────────────────

if ($action === 'login') {
    need_post($method);
    $in = input();
    $student = find_student_by_matric($pdo, (string) ($in['matric_number'] ?? ''));
    if (!$student) fail('Student not found in Central ID System', 404);

    if (($student['level'] ?? '') === 'alumni') {
        fail('Alumni accounts cannot sign in to the portal.', 403);
    }

    $password = (string) ($in['password'] ?? '');
    $ok = false;
    if (!empty($student['password'])) {
        $ok = password_verify($password, $student['password']);
    }
    if (!$ok) {
        // Legacy first-login convention: password = first name word of the record.
        $first = strtolower(explode(' ', trim($student['full_name']))[0]);
        $ok = $password !== '' && strtolower($password) === $first;
    }
    if (!$ok) fail('Invalid credentials.', 401);

    $view = student_view($student);
    $view['has_password'] = !empty($student['password']);
    json_out($view);
}

if ($method === 'GET' && $action === 'dashboard') {
    $student = find_student_by_matric($pdo, (string) ($_GET['matric'] ?? ''));
    json_out([
        'profile' => $student ? student_view($student) : null,
        'activities' => [['type' => 'Portal Login', 'status' => 'Done', 'activity_date' => date('Y-m-d')]],
    ]);
}

if ($action === 'request_otp') {
    need_post($method);
    $in = input();
    $student = find_student_by_matric($pdo, (string) ($in['matric_number'] ?? ''));
    if (!$student) fail('Student not found', 404);
    if (($student['level'] ?? '') === 'alumni') fail('Alumni accounts cannot use the portal.', 403);

    $provided = strtolower(trim((string) ($in['email'] ?? '')));
    if (empty($student['email']) || strtolower($student['email']) !== $provided) {
        fail('The email provided does not match our records.');
    }
    $otp = new_otp();
    $pdo->prepare('UPDATE students SET otp_code = ?, otp_expiry = ? WHERE id = ?')
        ->execute([$otp, date('Y-m-d H:i:s', time() + 900), $student['id']]);
    // The Node backend emails the OTP; it is never shown to the end user.
    json_out(['status' => 'success', 'email' => $student['email'], 'otp' => $otp]);
}

if ($action === 'verify_otp') {
    need_post($method);
    $in = input();
    $stmt = $pdo->prepare('SELECT id FROM students WHERE matric_no = ? AND otp_code = ? AND otp_expiry > NOW()');
    $stmt->execute([(string) ($in['matric_number'] ?? ''), (string) ($in['otp'] ?? '')]);
    if ($stmt->fetch()) json_out(['status' => 'success']);
    fail('Invalid/Expired OTP');
}

if ($action === 'reset_password') {
    need_post($method);
    $in = input();
    $hash = password_hash(validate_password($in['new_password'] ?? ''), PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'UPDATE students SET password = ?, otp_code = NULL, otp_expiry = NULL
         WHERE matric_no = ? AND otp_code = ? AND otp_expiry > NOW()'
    );
    $stmt->execute([$hash, (string) ($in['matric_number'] ?? ''), (string) ($in['otp'] ?? '')]);
    if ($stmt->rowCount() === 0) fail('Invalid/Expired OTP');
    json_out(['status' => 'success']);
}

if ($action === 'change_password') {
    need_post($method);
    $in = input();
    $student = find_student_by_matric($pdo, (string) ($in['matric_number'] ?? ''));
    if (!$student) fail('Student not found', 404);
    $old = (string) ($in['old_password'] ?? $in['current_password'] ?? '');
    $first = strtolower(explode(' ', trim($student['full_name']))[0]);
    $ok = !empty($student['password']) ? password_verify($old, $student['password']) : (strtolower($old) === $first);
    if (!$ok) fail('Current password is incorrect.', 401);
    $pdo->prepare('UPDATE students SET password = ? WHERE id = ?')
        ->execute([password_hash(validate_password($in['new_password'] ?? ''), PASSWORD_DEFAULT), $student['id']]);
    json_out(['status' => 'success']);
}

if ($action === 'update_profile') {
    need_post($method);
    $in = input();
    $matric = (string) ($in['matric_number'] ?? $in['matric_no'] ?? '');
    $student = find_student_by_matric($pdo, $matric);
    if (!$student) fail('Student not found', 404);
    // level, matric, post and department are admin-controlled; the student cannot change them here.
    $pdo->prepare(
        'UPDATE students SET full_name = COALESCE(?, full_name), email = COALESCE(?, email),
           whatsapp_number = COALESCE(?, whatsapp_number), gender = COALESCE(?, gender),
           birthday = COALESCE(?, birthday) WHERE id = ?'
    )->execute([
        $in['full_name'] ?? null, $in['email'] ?? null, $in['whatsapp_number'] ?? null,
        $in['gender'] ?? null, $in['birthday'] ?? null, $student['id'],
    ]);
    json_out(['status' => 'success']);
}

// ─── Fresher accounts (new 100L, no matric yet) ──────────────────────────────

if ($action === 'fresher_register') {
    need_post($method);
    $in = input();
    $name = trim((string) ($in['full_name'] ?? ''));
    if (strlen($name) < 3) fail('Enter your full name.');
    $email = normalise_email($in['email'] ?? '');
    $hash = password_hash(validate_password($in['password'] ?? ''), PASSWORD_DEFAULT);
    $dept = trim((string) ($in['department'] ?? ''));
    if (!in_array($dept, allowed_departments($pdo), true)) fail('Select a valid department.');

    $existing = find_fresher($pdo, null, $email);
    $otp = new_otp();
    $expiry = date('Y-m-d H:i:s', time() + 900);

    if ($existing) {
        if ((int) $existing['email_verified'] === 1) fail('An account with this email already exists. Please sign in.', 409);
        // Unverified: let them re-submit, refresh details and OTP.
        $pdo->prepare('UPDATE freshers SET full_name = ?, password = ?, department = ?, otp_code = ?, otp_expiry = ? WHERE id = ?')
            ->execute([$name, $hash, $dept, $otp, $expiry, $existing['id']]);
    } else {
        $pdo->prepare('INSERT INTO freshers (full_name, email, password, department, otp_code, otp_expiry) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$name, $email, $hash, $dept, $otp, $expiry]);
    }
    json_out(['status' => 'success', 'email' => $email, 'full_name' => $name, 'otp' => $otp]);
}

if ($action === 'fresher_resend') {
    need_post($method);
    $fresher = find_fresher($pdo, null, (string) (input()['email'] ?? ''));
    if (!$fresher || (int) $fresher['email_verified'] === 1) fail('No pending verification for this email.', 404);
    $otp = new_otp();
    $pdo->prepare('UPDATE freshers SET otp_code = ?, otp_expiry = ? WHERE id = ?')
        ->execute([$otp, date('Y-m-d H:i:s', time() + 900), $fresher['id']]);
    json_out(['status' => 'success', 'email' => $fresher['email'], 'full_name' => $fresher['full_name'], 'otp' => $otp]);
}

if ($action === 'fresher_verify') {
    need_post($method);
    $in = input();
    $fresher = find_fresher($pdo, null, (string) ($in['email'] ?? ''));
    if (!$fresher) fail('Account not found.', 404);
    $stmt = $pdo->prepare(
        "UPDATE freshers SET email_verified = 1, status = 'active', otp_code = NULL, otp_expiry = NULL
         WHERE id = ? AND otp_code = ? AND otp_expiry > NOW()"
    );
    $stmt->execute([$fresher['id'], (string) ($in['otp'] ?? '')]);
    if ($stmt->rowCount() === 0) fail('Invalid or expired code.');
    json_out(['status' => 'success']);
}

if ($action === 'fresher_login') {
    need_post($method);
    $in = input();
    $fresher = find_fresher($pdo, null, (string) ($in['email'] ?? ''));
    if (!$fresher || !password_verify((string) ($in['password'] ?? ''), $fresher['password'])) {
        fail('Invalid email or password.', 401);
    }
    if ((int) $fresher['email_verified'] !== 1) fail('Please verify your email first.', 403);
    if ($fresher['status'] === 'disabled') fail('This account is disabled.', 403);
    // After a matric number is assigned the person signs in as a stalite.
    if ($fresher['status'] === 'promoted' && $fresher['matric_no']) {
        fail('Your matric number has been assigned. Sign in as a Stalite with your matric number.', 409);
    }
    json_out(fresher_view($fresher));
}

if ($action === 'fresher_forgot') {
    need_post($method);
    $fresher = find_fresher($pdo, null, (string) (input()['email'] ?? ''));
    // Same response whether or not the account exists (no account enumeration).
    if (!$fresher || (int) $fresher['email_verified'] !== 1) json_out(['status' => 'success']);
    $otp = new_otp();
    $pdo->prepare('UPDATE freshers SET otp_code = ?, otp_expiry = ? WHERE id = ?')
        ->execute([$otp, date('Y-m-d H:i:s', time() + 900), $fresher['id']]);
    json_out(['status' => 'success', 'email' => $fresher['email'], 'full_name' => $fresher['full_name'], 'otp' => $otp]);
}

if ($action === 'fresher_reset') {
    need_post($method);
    $in = input();
    $hash = password_hash(validate_password($in['new_password'] ?? ''), PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'UPDATE freshers SET password = ?, otp_code = NULL, otp_expiry = NULL
         WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()'
    );
    $stmt->execute([$hash, strtolower(trim((string) ($in['email'] ?? ''))), (string) ($in['otp'] ?? '')]);
    if ($stmt->rowCount() === 0) fail('Invalid or expired code.');
    json_out(['status' => 'success']);
}

if ($method === 'GET' && $action === 'fresher_profile') {
    $fresher = find_fresher($pdo, $_GET['fresher_id'] ?? null, null);
    if (!$fresher) fail('Fresher account not found.', 404);
    json_out(['profile' => fresher_view($fresher)]);
}

// ─── ID card application (multipart: photo + crop + details) ─────────────────

if ($action === 'id_application') {
    need_post($method);
    $in = $_POST ?: input();
    $person = resolve_person($pdo, $in);
    $row = $person['row'];
    [$col, $pid] = person_key($person);
    $table = $person['type'] === 'fresher' ? 'freshers' : 'students';

    $crop = parse_crop($in['photo_zoom'] ?? null, $in['photo_cx'] ?? null, $in['photo_cy'] ?? null);
    if ($crop === null) fail('Photo arrangement is missing or invalid.');

    $hasUpload = isset($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    if (!$hasUpload && empty($row['image_path'])) fail('Upload your passport photograph.');

    // One application per person; editable only until it has been paid and picked up.
    $stmt = $pdo->prepare("SELECT * FROM id_card_requests WHERE $col = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$pid]);
    $existing = $stmt->fetch() ?: null;
    if ($existing && !in_array($existing['status'], ['awaiting_payment', 'pending'], true)) {
        fail('Your ID card is already being processed and can no longer be changed.', 409);
    }

    $oldImage = $row['image_path'] ?? null;
    $image = $oldImage;
    if ($hasUpload) {
        $prefix = $person['type'] === 'fresher' ? 'F' . $pid : (string) $row['matric_no'];
        $image = store_photo($_FILES['image'], $prefix);
    }

    $pdo->prepare("UPDATE $table SET image_path = ?, photo_zoom = ?, photo_cx = ?, photo_cy = ?, is_generated = 0 WHERE id = ?")
        ->execute([$image, $crop['zoom'], $crop['cx'], $crop['cy'], $pid]);
    if ($hasUpload && $oldImage && $oldImage !== $image) {
        delete_photo($oldImage);
    }

    $fee = id_card_fee($pdo, $person['type']);
    $fields = [
        $image,
        $row['full_name'],
        $row['matric_no'] ?? null,
        trim((string) ($in['blood_group'] ?? '')) ?: null,
        ($in['birthday'] ?? '') !== '' ? $in['birthday'] : ($row['birthday'] ?? null),
        trim((string) ($in['emergency_contact'] ?? '')) ?: null,
        $fee,
    ];

    if ($existing) {
        $pdo->prepare('UPDATE id_card_requests SET passport_url = ?, full_name = ?, matric_number = ?, blood_group = ?, birthday = ?, emergency_contact = ?, fee_amount = ? WHERE id = ?')
            ->execute([...$fields, $existing['id']]);
        $requestId = (int) $existing['id'];
        $status = $existing['status'];
    } else {
        $pdo->prepare("INSERT INTO id_card_requests ($col, account_type, passport_url, full_name, matric_number, blood_group, birthday, emergency_contact, fee_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment')")
            ->execute([$pid, $person['type'], ...$fields]);
        $requestId = (int) $pdo->lastInsertId();
        $status = 'awaiting_payment';
    }

    json_out(['status' => 'success', 'request_id' => $requestId, 'request_status' => $status, 'fee' => $fee, 'image_path' => $image]);
}

if ($method === 'GET' && $action === 'id_card_status') {
    $person = resolve_person($pdo, [
        'account_type' => $_GET['account_type'] ?? 'student',
        'matric_number' => $_GET['matric'] ?? '',
        'fresher_id' => $_GET['fresher_id'] ?? null,
    ]);
    [$col, $pid] = person_key($person);
    $stmt = $pdo->prepare("SELECT * FROM id_card_requests WHERE $col = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$pid]);
    $request = $stmt->fetch() ?: null;

    $row = $person['row'];
    $hasMatric = !empty($row['matric_no']);
    $paid = $request && $request['status'] !== 'awaiting_payment';
    json_out([
        'status' => $request ? 'success' : 'Not Registered',
        'request' => $request,
        'fee' => id_card_fee($pdo, $person['type']),
        'photo' => ['image_path' => $row['image_path'] ?? null, 'zoom' => $row['photo_zoom'] ?? null, 'cx' => $row['photo_cx'] ?? null, 'cy' => $row['photo_cy'] ?? null],
        // Freshers pay and arrange their photo now, but the card is only issued once a matric number exists.
        'card_issuable' => $paid && $hasMatric,
        'card_note' => $paid && !$hasMatric ? 'Your card will be issued once your matric number is assigned.' : null,
    ]);
}

if ($method === 'GET' && $action === 'get_id_requests') {
    $rows = $pdo->query(
        "SELECT r.*, COALESCE(s.department, f.department) AS department, COALESCE(s.level, '100') AS level,
                s.is_generated, (COALESCE(s.matric_no, f.matric_no) IS NOT NULL) AS has_matric
         FROM id_card_requests r
         LEFT JOIN students s ON s.id = r.student_id
         LEFT JOIN freshers f ON f.id = r.fresher_id
         ORDER BY r.id DESC"
    )->fetchAll();
    json_out($rows);
}

if ($action === 'set_id_request_status') {
    need_post($method);
    $in = input();
    $status = (string) ($in['status'] ?? '');
    if (!in_array($status, ['pending', 'processing', 'ready', 'collected'], true)) fail('Invalid status.');
    $stmt = $pdo->prepare("UPDATE id_card_requests SET status = ? WHERE id = ? AND status <> 'awaiting_payment'");
    $stmt->execute([$status, (int) ($in['id'] ?? 0)]);
    if ($stmt->rowCount() === 0) fail('Request not found, unpaid, or already in that status.', 404);
    json_out(['status' => 'success']);
}

// ─── Payments ────────────────────────────────────────────────────────────────

if ($method === 'GET' && $action === 'payments') {
    $person = resolve_person($pdo, [
        'account_type' => $_GET['account_type'] ?? 'student',
        'matric_number' => $_GET['matric'] ?? '',
        'fresher_id' => $_GET['fresher_id'] ?? null,
    ]);
    [$col, $pid] = person_key($person);
    $stmt = $pdo->prepare("SELECT id, amount, reference, status, payment_type, session, hoc_item_id, created_at FROM payments WHERE $col = ? ORDER BY id DESC");
    $stmt->execute([$pid]);
    json_out($stmt->fetchAll());
}

if ($action === 'log_payment_pending') {
    need_post($method);
    $in = input();
    $person = resolve_person($pdo, $in);
    [$col, $pid] = person_key($person);
    $reference = trim((string) ($in['reference'] ?? ''));
    $amount = $in['amount'] ?? null;
    if ($reference === '' || !is_numeric($amount) || (float) $amount <= 0) fail('reference and a positive amount are required.');

    $type = (string) ($in['payment_type'] ?? 'dues');
    $hocItem = $type === 'hoc_item' ? (int) ($in['hoc_item_id'] ?? 0) : null;
    $pdo->prepare("INSERT IGNORE INTO payments ($col, amount, reference, status, payment_type, session, hoc_item_id) VALUES (?, ?, ?, 'pending', ?, ?, ?)")
        ->execute([$pid, (float) $amount, $reference, $type, current_session($pdo), $hocItem ?: null]);
    json_out(['status' => 'success']);
}

if ($action === 'log_payment_success') {
    need_post($method);
    $in = input();
    $reference = trim((string) ($in['reference'] ?? ''));
    $stmt = $pdo->prepare('SELECT * FROM payments WHERE reference = ? LIMIT 1');
    $stmt->execute([$reference]);
    $payment = $stmt->fetch();

    if (!$payment) fail('Unknown payment reference. Log the payment as pending first.', 404);
    if ($payment['status'] === 'success') json_out(['status' => 'success', 'already' => true]);

    // The paid amount must match what was initialised.
    if (isset($in['amount']) && abs((float) $in['amount'] - (float) $payment['amount']) > 0.009) {
        fail('Paid amount does not match the initialised amount.', 422);
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE payments SET status = 'success' WHERE id = ?")->execute([$payment['id']]);
        if ($payment['payment_type'] === 'id_card') {
            $col = $payment['fresher_id'] ? 'fresher_id' : 'student_id';
            $pid = $payment['fresher_id'] ?: $payment['student_id'];
            $pdo->prepare("UPDATE id_card_requests SET status = 'pending', payment_reference = ? WHERE $col = ? AND status = 'awaiting_payment'")
                ->execute([$reference, $pid]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        fail('Could not record the payment.', 500);
    }
    json_out(['status' => 'success']);
}

// ─── Admin: assign a matric number to a fresher ──────────────────────────────

if ($action === 'assign_fresher_matric') {
    need_post($method);
    $in = input();
    $fresher = find_fresher($pdo, $in['fresher_id'] ?? null, null);
    if (!$fresher) fail('Fresher not found.', 404);
    if ($fresher['status'] === 'promoted') fail('This fresher already has a matric number.', 409);

    $matric = strtoupper(trim((string) ($in['matric_no'] ?? '')));
    if (!preg_match('/^[A-Z0-9\/-]{6,100}$/', $matric)) fail('Enter a valid matric number.');
    if (find_student_by_matric($pdo, $matric)) fail('That matric number already belongs to a student.', 409);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            "INSERT INTO students (full_name, level, department, email, email_verified, whatsapp_number, gender, birthday, post, matric_no, image_path, password, photo_zoom, photo_cx, photo_cy)
             VALUES (?, '100', ?, ?, 1, ?, ?, ?, 'Student', ?, ?, ?, ?, ?, ?)"
        )->execute([
            $fresher['full_name'], $fresher['department'], $fresher['email'], $fresher['whatsapp_number'],
            $fresher['gender'], $fresher['birthday'], $matric, $fresher['image_path'] ?? '', $fresher['password'],
            $fresher['photo_zoom'], $fresher['photo_cx'], $fresher['photo_cy'],
        ]);
        $studentId = (int) $pdo->lastInsertId();
        $pdo->prepare("UPDATE freshers SET matric_no = ?, student_id = ?, status = 'promoted' WHERE id = ?")->execute([$matric, $studentId, $fresher['id']]);
        $pdo->prepare('UPDATE payments SET student_id = ? WHERE fresher_id = ?')->execute([$studentId, $fresher['id']]);
        $pdo->prepare('UPDATE id_card_requests SET student_id = ?, matric_number = ? WHERE fresher_id = ?')->execute([$studentId, $matric, $fresher['id']]);
        $pdo->commit();
    } catch (PDOException $e) {
        $pdo->rollBack();
        fail($e->getCode() === '23000' ? 'That matric number is already in use.' : 'Could not assign the matric number.', $e->getCode() === '23000' ? 409 : 500);
    }
    json_out(['status' => 'success', 'student_id' => $studentId, 'matric_no' => $matric]);
}

// ─── Card generation (admin triggers this through the Node backend) ──────────

if ($action === 'generate_cards') {
    need_post($method);
    require_once __DIR__ . '/lib/card.php';
    @ini_set('memory_limit', '1024M');
    @set_time_limit(0);

    $in = input();
    $ids = array_values(array_unique(array_filter(array_map('intval', (array) ($in['ids'] ?? [])))));
    if (!$ids) fail('No students selected.');

    $marks = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM students WHERE id IN ($marks) AND matric_no <> '' AND level <> 'alumni' ORDER BY level, full_name");
    $stmt->execute($ids);
    $students = $stmt->fetchAll();
    if (!$students) fail('No eligible students (a matric number is required).');

    $template = @imagecreatefrompng(__DIR__ . '/assets/Id_card_design.png');
    $fonts = card_fonts(__DIR__);
    if (!$template || !$fonts['bold']) fail('Card template or fonts are missing on the server.', 500);

    $files = [];
    foreach ($students as $s) {
        $tmp = sys_get_temp_dir() . '/id_' . $s['id'] . '_' . uniqid() . '.png';
        if (card_render($s, $tmp, $template, $fonts, __DIR__)) {
            $pdo->prepare('UPDATE students SET is_generated = 1 WHERE id = ?')->execute([$s['id']]);
            $files[] = ['path' => $tmp, 'name' => preg_replace('/[^A-Za-z0-9_-]/', '_', $s['matric_no']) . '.png'];
        }
    }
    imagedestroy($template);
    if (!$files) fail('Could not generate any cards (check photos exist).', 500);

    while (ob_get_level() > 0) ob_end_clean();
    if (count($files) === 1) {
        $f = $files[0];
        register_shutdown_function(static fn() => @unlink($f['path']));
        header('Content-Type: image/png');
        header('Content-Disposition: attachment; filename="' . $f['name'] . '"');
        header('Content-Length: ' . filesize($f['path']));
        readfile($f['path']);
        exit;
    }

    $zipPath = sys_get_temp_dir() . '/id_cards_' . uniqid() . '.zip';
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) fail('Could not build ZIP.', 500);
    foreach ($files as $f) $zip->addFile($f['path'], $f['name']);
    $zip->close();
    register_shutdown_function(static function () use ($files, $zipPath) {
        foreach ($files as $f) @unlink($f['path']);
        @unlink($zipPath);
    });
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="id_cards_' . date('Ymd_His') . '.zip"');
    header('Content-Length: ' . filesize($zipPath));
    readfile($zipPath);
    exit;
}

// ─── Birthdays (daily cron in Node) ──────────────────────────────────────────

if ($method === 'GET' && $action === 'get_birthdays') {
    $rows = $pdo->query(
        "SELECT full_name, level, gender, whatsapp_number, birthday,
                (DATE_FORMAT(birthday, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d')) AS is_today
         FROM students
         WHERE birthday IS NOT NULL AND level <> 'alumni'
           AND DATE_FORMAT(birthday, '%m-%d') IN (DATE_FORMAT(CURDATE(), '%m-%d'), DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '%m-%d'))"
    )->fetchAll();
    foreach ($rows as &$r) $r['is_today'] = (bool) $r['is_today'];
    json_out(['students' => $rows]);
}

// ─── Admin: roles and student fields ─────────────────────────────────────────

if ($action === 'set_student_post') {
    need_post($method);
    $in = input();
    $post = trim((string) ($in['post'] ?? ''));
    if ($post === '' || mb_strlen($post) > 60) fail('Enter a role (up to 60 characters).');
    // 'admin' in students.post would grant the admin console; it is never assignable here.
    if (strtolower($post) === 'admin') fail('That role cannot be assigned.');
    $stmt = $pdo->prepare('UPDATE students SET post = ? WHERE id = ?');
    $stmt->execute([$post, (int) ($in['id'] ?? 0)]);
    if ($stmt->rowCount() === 0 && !find_student_by_id($pdo, (int) ($in['id'] ?? 0))) fail('Student not found.', 404);
    json_out(['status' => 'success']);
}

if ($action === 'set_student_fields') {
    need_post($method);
    $in = input();
    $id = (int) ($in['id'] ?? 0);
    if (!find_student_by_id($pdo, $id)) fail('Student not found.', 404);
    $sets = [];
    $args = [];
    if (array_key_exists('department', $in)) {
        if (!in_array((string) $in['department'], allowed_departments($pdo), true)) fail('Select a valid department.');
        $sets[] = 'department = ?';
        $args[] = $in['department'];
    }
    if (array_key_exists('level', $in)) {
        if (!in_array((string) $in['level'], ['100', '200', '300', '400', 'alumni'], true)) fail('Select a valid level.');
        $sets[] = 'level = ?';
        $args[] = $in['level'];
    }
    if (!$sets) fail('Nothing to update.');
    $args[] = $id;
    $pdo->prepare('UPDATE students SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    json_out(['status' => 'success']);
}

if ($method === 'GET' && $action === 'hoc_profile') {
    $student = find_student_by_matric($pdo, (string) ($_GET['matric'] ?? ''));
    if (!$student) fail('Student not found.', 404);
    $isHoc = in_array($student['post'], ['HOC', 'Assistant HOC'], true) && $student['level'] !== 'alumni';
    json_out([
        'id' => (int) $student['id'],
        'full_name' => $student['full_name'],
        'level' => $student['level'],
        'department' => $student['department'] ?? null,
        'post' => $student['post'],
        'is_hoc' => $isHoc,
    ]);
}

// ─── HOC items (books / manuals / workbooks) ─────────────────────────────────

function hoc_item_view(array $row): array
{
    $row['id'] = (int) $row['id'];
    $row['price'] = (float) $row['price'];
    return $row;
}

if ($method === 'GET' && $action === 'hoc_items_list') {
    $level = (string) ($_GET['level'] ?? '');
    if (!in_array($level, ['100', '200', '300', '400'], true)) fail('Select a valid level.');
    $includeArchived = ($_GET['include_archived'] ?? '') === '1';

    $sql = "SELECT h.*,
              (SELECT COUNT(*) FROM payments p WHERE p.hoc_item_id = h.id AND p.status = 'success') AS buyers,
              (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.hoc_item_id = h.id AND p.status = 'success') AS revenue
            FROM hoc_items h WHERE h.level = ?" . ($includeArchived ? '' : " AND h.status = 'active'") . ' ORDER BY h.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$level]);
    $items = $stmt->fetchAll();

    // Optional: mark which items this person has already paid for.
    $paid = [];
    if (!empty($_GET['matric']) || !empty($_GET['fresher_id'])) {
        $person = resolve_person($pdo, [
            'account_type' => $_GET['account_type'] ?? 'student',
            'matric_number' => $_GET['matric'] ?? '',
            'fresher_id' => $_GET['fresher_id'] ?? null,
        ]);
        [$col, $pid] = person_key($person);
        $stmt = $pdo->prepare("SELECT DISTINCT hoc_item_id FROM payments WHERE $col = ? AND status = 'success' AND hoc_item_id IS NOT NULL");
        $stmt->execute([$pid]);
        $paid = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    }
    foreach ($items as &$item) {
        $item = hoc_item_view($item);
        $item['buyers'] = (int) $item['buyers'];
        $item['revenue'] = (float) $item['revenue'];
        $item['paid'] = in_array($item['id'], $paid, true);
    }
    json_out($items);
}

if ($method === 'GET' && $action === 'hoc_item_get') {
    $stmt = $pdo->prepare('SELECT * FROM hoc_items WHERE id = ?');
    $stmt->execute([(int) ($_GET['id'] ?? 0)]);
    $item = $stmt->fetch();
    if (!$item) fail('Item not found.', 404);
    json_out(hoc_item_view($item));
}

if ($action === 'hoc_item_save') {
    need_post($method);
    $in = input();
    $level = (string) ($in['level'] ?? '');
    if (!in_array($level, ['100', '200', '300', '400'], true)) fail('Select a valid level.');
    $title = trim((string) ($in['title'] ?? ''));
    if ($title === '' || mb_strlen($title) > 255) fail('Enter the item name.');
    if (!is_numeric($in['price'] ?? null) || (float) $in['price'] <= 0) fail('Enter a price above zero.');
    $dept = trim((string) ($in['department'] ?? ''));
    if ($dept !== '' && !in_array($dept, allowed_departments($pdo), true)) fail('Select a valid department.');
    $values = [
        $level, $dept !== '' ? $dept : null, $title,
        trim((string) ($in['course_code'] ?? '')) ?: null,
        trim((string) ($in['description'] ?? '')) ?: null,
        (float) $in['price'],
    ];
    $id = (int) ($in['id'] ?? 0);
    if ($id > 0) {
        // Editing never changes who owns the item or its level's sales history.
        $pdo->prepare('UPDATE hoc_items SET level = ?, department = ?, title = ?, course_code = ?, description = ?, price = ? WHERE id = ?')
            ->execute([...$values, $id]);
    } else {
        $pdo->prepare('INSERT INTO hoc_items (level, department, title, course_code, description, price, session, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([...$values, current_session($pdo), (int) ($in['created_by'] ?? 0) ?: null]);
        $id = (int) $pdo->lastInsertId();
    }
    $stmt = $pdo->prepare('SELECT * FROM hoc_items WHERE id = ?');
    $stmt->execute([$id]);
    json_out(hoc_item_view($stmt->fetch()));
}

if ($action === 'hoc_item_status') {
    need_post($method);
    $in = input();
    $status = (string) ($in['status'] ?? '');
    if (!in_array($status, ['active', 'archived'], true)) fail('Invalid status.');
    $pdo->prepare('UPDATE hoc_items SET status = ? WHERE id = ?')->execute([$status, (int) ($in['id'] ?? 0)]);
    json_out(['status' => 'success']);
}

if ($method === 'GET' && $action === 'hoc_item_sales') {
    $stmt = $pdo->prepare(
        "SELECT COALESCE(s.full_name, f.full_name) AS full_name, COALESCE(s.matric_no, f.matric_no) AS matric_no,
                p.amount, p.reference, p.created_at
         FROM payments p
         LEFT JOIN students s ON s.id = p.student_id
         LEFT JOIN freshers f ON f.id = p.fresher_id
         WHERE p.hoc_item_id = ? AND p.status = 'success' ORDER BY p.id DESC"
    );
    $stmt->execute([(int) ($_GET['id'] ?? 0)]);
    json_out($stmt->fetchAll());
}

// ─── Email manager ───────────────────────────────────────────────────────────

/**
 * Builds the recipient query for an audience. Returns [sql, args] producing
 * rows of (name, email) from both students and verified freshers.
 * Audience types: all | alumni | fresher | stalite | level | department | level_department
 */
function audience_sql(array $a): array
{
    $type = (string) ($a['type'] ?? 'all');
    $level = (string) ($a['level'] ?? '');
    $dept = (string) ($a['department'] ?? '');
    if (!in_array($type, ['all', 'alumni', 'fresher', 'stalite', 'level', 'department', 'level_department'], true)) {
        fail('Unknown audience.');
    }
    if (in_array($type, ['level', 'level_department'], true) && !in_array($level, ['100', '200', '300', '400'], true)) fail('Select a level.');
    if (in_array($type, ['department', 'level_department'], true) && $dept === '') fail('Select a department.');

    $studentWhere = ["email IS NOT NULL", "email <> ''"];
    $studentArgs = [];
    $fresherWhere = ["email_verified = 1", "status <> 'disabled'", "status <> 'promoted'"];
    $fresherArgs = [];
    $includeStudents = true;
    $includeFreshers = true;

    switch ($type) {
        case 'alumni':
            $studentWhere[] = "level = 'alumni'";
            $includeFreshers = false;
            break;
        case 'fresher':
            $includeStudents = false;
            break;
        case 'stalite':
            $studentWhere[] = "level <> 'alumni'";
            $includeFreshers = false;
            break;
        default:
            $studentWhere[] = "level <> 'alumni'";
    }
    if (in_array($type, ['level', 'level_department'], true)) {
        $studentWhere[] = 'level = ?';
        $studentArgs[] = $level;
        // Freshers are 100L.
        if ($level !== '100') $includeFreshers = false;
    }
    if (in_array($type, ['department', 'level_department'], true)) {
        $studentWhere[] = 'department = ?';
        $studentArgs[] = $dept;
        $fresherWhere[] = 'department = ?';
        $fresherArgs[] = $dept;
    }

    $parts = [];
    $args = [];
    if ($includeStudents) {
        $parts[] = 'SELECT full_name AS name, LOWER(TRIM(email)) AS email FROM students WHERE ' . implode(' AND ', $studentWhere);
        $args = array_merge($args, $studentArgs);
    }
    if ($includeFreshers) {
        $parts[] = 'SELECT full_name AS name, LOWER(TRIM(email)) AS email FROM freshers WHERE ' . implode(' AND ', $fresherWhere);
        $args = array_merge($args, $fresherArgs);
    }
    return [$parts ? implode(' UNION ALL ', $parts) : "SELECT NULL AS name, NULL AS email FROM students WHERE 1 = 0", $args];
}

/** People matched by the audience, regardless of whether they have an email. */
function audience_total(PDO $pdo, array $a): int
{
    $type = (string) ($a['type'] ?? 'all');
    $level = (string) ($a['level'] ?? '');
    $dept = (string) ($a['department'] ?? '');
    $sw = [];
    $sa = [];
    $fw = ["status <> 'disabled'", "status <> 'promoted'"];
    $fa = [];
    $students = $type !== 'fresher';
    $freshers = !in_array($type, ['alumni', 'stalite'], true);
    if ($type === 'alumni') $sw[] = "level = 'alumni'"; else $sw[] = "level <> 'alumni'";
    if (in_array($type, ['level', 'level_department'], true)) {
        $sw[] = 'level = ?'; $sa[] = $level;
        if ($level !== '100') $freshers = false;
    }
    if (in_array($type, ['department', 'level_department'], true)) {
        $sw[] = 'department = ?'; $sa[] = $dept;
        $fw[] = 'department = ?'; $fa[] = $dept;
    }
    $total = 0;
    if ($students) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM students WHERE ' . implode(' AND ', $sw));
        $stmt->execute($sa);
        $total += (int) $stmt->fetchColumn();
    }
    if ($freshers) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM freshers WHERE ' . implode(' AND ', $fw));
        $stmt->execute($fa);
        $total += (int) $stmt->fetchColumn();
    }
    return $total;
}

function audience_counts(PDO $pdo, array $a): array
{
    [$sql, $args] = audience_sql($a);
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT email) FROM ($sql) t");
    $stmt->execute($args);
    return ['total' => audience_total($pdo, $a), 'with_email' => (int) $stmt->fetchColumn()];
}

if ($action === 'email_audience_counts') {
    need_post($method);
    json_out(audience_counts($pdo, (array) (input()['audience'] ?? [])));
}

if ($action === 'email_recipients') {
    need_post($method);
    $in = input();
    [$sql, $args] = audience_sql((array) ($in['audience'] ?? []));
    $limit = max(1, min(100, (int) ($in['limit'] ?? 20)));
    $offset = max(0, (int) ($in['offset'] ?? 0));
    $stmt = $pdo->prepare("SELECT MIN(name) AS name, email FROM ($sql) t GROUP BY email ORDER BY email LIMIT $limit OFFSET $offset");
    $stmt->execute($args);
    json_out(['recipients' => $stmt->fetchAll()]);
}

if ($action === 'email_campaign_create') {
    need_post($method);
    $in = input();
    $audience = (array) ($in['audience'] ?? []);
    $subject = trim((string) ($in['subject'] ?? ''));
    $body = trim((string) ($in['body'] ?? ''));
    if ($subject === '' || mb_strlen($subject) > 255) fail('Enter a subject.');
    if ($body === '') fail('Write a message.');
    $counts = audience_counts($pdo, $audience);
    if ($counts['with_email'] === 0) fail('No one in this audience has an email address on record.');
    $pdo->prepare(
        "INSERT INTO email_campaigns (subject, body, audience_type, audience_level, audience_department, total_students, with_email, status, sent_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'sending', ?)"
    )->execute([
        $subject, $body, (string) ($audience['type'] ?? 'all'),
        ($audience['level'] ?? '') ?: null, ($audience['department'] ?? '') ?: null,
        $counts['total'], $counts['with_email'], mb_substr((string) ($in['sent_by'] ?? ''), 0, 160) ?: null,
    ]);
    json_out(['id' => (int) $pdo->lastInsertId(), 'total' => $counts['total'], 'with_email' => $counts['with_email']]);
}

if ($action === 'email_campaign_progress') {
    need_post($method);
    $in = input();
    $id = (int) ($in['id'] ?? 0);
    $pdo->prepare('UPDATE email_campaigns SET sent_count = sent_count + ?, failed_count = failed_count + ? WHERE id = ?')
        ->execute([max(0, (int) ($in['sent'] ?? 0)), max(0, (int) ($in['failed'] ?? 0)), $id]);
    if (!empty($in['done'])) {
        $pdo->prepare("UPDATE email_campaigns SET status = IF(sent_count = 0, 'failed', 'sent'), sent_at = NOW() WHERE id = ?")->execute([$id]);
    }
    $stmt = $pdo->prepare('SELECT * FROM email_campaigns WHERE id = ?');
    $stmt->execute([$id]);
    json_out($stmt->fetch() ?: []);
}

if ($method === 'GET' && $action === 'email_campaign_get') {
    $stmt = $pdo->prepare('SELECT * FROM email_campaigns WHERE id = ?');
    $stmt->execute([(int) ($_GET['id'] ?? 0)]);
    $row = $stmt->fetch();
    if (!$row) fail('Campaign not found.', 404);
    json_out($row);
}

if ($method === 'GET' && $action === 'email_campaigns') {
    json_out($pdo->query('SELECT id, subject, audience_type, audience_level, audience_department, total_students, with_email, sent_count, failed_count, status, sent_by, created_at, sent_at FROM email_campaigns ORDER BY id DESC LIMIT 100')->fetchAll());
}

// ─── Website content: executives, events (+gallery), blogs ───────────────────

function slugify_text(string $value): string
{
    $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(trim($value))), '-');
    return $slug !== '' ? $slug : 'item';
}

function unique_slug(PDO $pdo, string $table, string $base, int $ignoreId = 0): string
{
    $slug = $base;
    for ($n = 2; $n < 500; $n++) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE slug = ? AND id <> ?");
        $stmt->execute([$slug, $ignoreId]);
        if ((int) $stmt->fetchColumn() === 0) return $slug;
        $slug = $base . '-' . $n;
    }
    return $base . '-' . bin2hex(random_bytes(3));
}

function to_datetime($value): ?string
{
    $value = trim((string) $value);
    if ($value === '') return null;
    $time = strtotime($value);
    return $time ? date('Y-m-d H:i:s', $time) : null;
}

function flag_int($value): int
{
    return ($value === false || $value === 0 || $value === '0' || $value === 'false') ? 0 : 1;
}

function text_or_null($value): ?string
{
    $value = trim((string) ($value ?? ''));
    return $value === '' ? null : $value;
}

if ($method === 'GET' && $action === 'executives_list') {
    // session = '2026/2027' -> that session; 'all' -> every session (admin);
    // omitted -> the public view: the current session, or the latest session that has executives.
    $session = trim((string) ($_GET['session'] ?? ''));
    $includeInactive = ($_GET['include_inactive'] ?? '') === '1';
    $where = [];
    $args = [];
    if ($session === '') {
        $current = current_session($pdo);
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM executives WHERE session = ? AND is_active = 1');
        $stmt->execute([$current]);
        if ((int) $stmt->fetchColumn() > 0) {
            $session = $current;
        } else {
            $latest = $pdo->query('SELECT session FROM executives WHERE is_active = 1 ORDER BY session DESC LIMIT 1')->fetchColumn();
            $session = $latest ?: $current;
        }
    }
    if ($session !== 'all') {
        $where[] = 'session = ?';
        $args[] = $session;
    }
    if (!$includeInactive) $where[] = 'is_active = 1';
    $stmt = $pdo->prepare(
        'SELECT id, name, post, level, session, description, image_url, sort_order, is_active FROM executives'
        . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY session DESC, sort_order ASC, id ASC'
    );
    $stmt->execute($args);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['sort_order'] = (int) $r['sort_order'];
        $r['is_active'] = (int) $r['is_active'];
    }
    json_out($rows);
}

if ($method === 'GET' && $action === 'executive_sessions') {
    $current = current_session($pdo);
    $sessions = $pdo->query('SELECT DISTINCT session FROM executives ORDER BY session DESC')->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array($current, $sessions, true)) $sessions[] = $current;
    rsort($sessions);
    json_out(['current' => $current, 'sessions' => array_values($sessions)]);
}

if ($action === 'executive_save') {
    need_post($method);
    $in = input();
    $name = trim((string) ($in['name'] ?? ''));
    $post = trim((string) ($in['post'] ?? ''));
    if ($name === '' || $post === '') fail('Name and post are required.');
    $session = trim((string) ($in['session'] ?? '')) ?: current_session($pdo);
    if (!preg_match('/^\d{4}\/\d{4}$/', $session)) fail('Session must look like 2026/2027.');
    $values = [
        $name, $post, trim((string) ($in['level'] ?? '')), $session, text_or_null($in['description'] ?? null),
        text_or_null($in['image_url'] ?? null), (int) ($in['sort_order'] ?? 0), flag_int($in['is_active'] ?? true),
    ];
    $id = (int) ($in['id'] ?? 0);
    if ($id > 0) {
        $pdo->prepare('UPDATE executives SET name = ?, post = ?, level = ?, session = ?, description = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?')
            ->execute([...$values, $id]);
    } else {
        $pdo->prepare('INSERT INTO executives (name, post, level, session, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute($values);
        $id = (int) $pdo->lastInsertId();
    }
    json_out(['status' => 'success', 'id' => $id]);
}

if ($action === 'executive_delete') {
    need_post($method);
    $pdo->prepare('DELETE FROM executives WHERE id = ?')->execute([(int) (input()['id'] ?? 0)]);
    json_out(['status' => 'success']);
}

if ($method === 'GET' && $action === 'events_list') {
    $sql = 'SELECT id, slug, title, event_status, start_date, end_date, location, description, cover_image_url, registration_url, flyer_folder, sort_order, is_active FROM events'
        . (($_GET['include_inactive'] ?? '') === '1' ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order ASC, id ASC';
    $events = $pdo->query($sql)->fetchAll();
    $gallery = [];
    foreach ($pdo->query('SELECT id, event_id, image_url, caption, sort_order FROM event_gallery_images ORDER BY event_id, sort_order, id')->fetchAll() as $img) {
        $gallery[(int) $img['event_id']][] = ['id' => (int) $img['id'], 'image_url' => $img['image_url'], 'caption' => $img['caption'] ?? '', 'sort_order' => (int) $img['sort_order']];
    }
    foreach ($events as &$e) {
        $e['id'] = (int) $e['id'];
        $e['sort_order'] = (int) $e['sort_order'];
        $e['is_active'] = (int) $e['is_active'];
        $e['gallery'] = $gallery[$e['id']] ?? [];
        // The admin form uses datetime-local, which wants "YYYY-MM-DDTHH:MM".
        foreach (['start_date', 'end_date'] as $f) {
            $e[$f] = $e[$f] ? str_replace(' ', 'T', substr($e[$f], 0, 16)) : '';
        }
    }
    json_out($events);
}

if ($action === 'event_save') {
    need_post($method);
    $in = input();
    $title = trim((string) ($in['title'] ?? ''));
    if ($title === '') fail('Event title is required.');
    $status = (string) ($in['event_status'] ?? 'upcoming');
    if (!in_array($status, ['upcoming', 'current', 'past'], true)) fail('Invalid event status.');
    $id = (int) ($in['id'] ?? 0);
    $slug = unique_slug($pdo, 'events', slugify_text(trim((string) ($in['slug'] ?? '')) ?: $title), $id);
    $values = [
        $slug, $title, $status, to_datetime($in['start_date'] ?? ''), to_datetime($in['end_date'] ?? ''),
        text_or_null($in['location'] ?? null), text_or_null($in['description'] ?? null), text_or_null($in['cover_image_url'] ?? null),
        text_or_null($in['registration_url'] ?? null), text_or_null($in['flyer_folder'] ?? null),
        (int) ($in['sort_order'] ?? 0), flag_int($in['is_active'] ?? true),
    ];
    if ($id > 0) {
        $pdo->prepare('UPDATE events SET slug = ?, title = ?, event_status = ?, start_date = ?, end_date = ?, location = ?, description = ?, cover_image_url = ?, registration_url = ?, flyer_folder = ?, sort_order = ?, is_active = ? WHERE id = ?')
            ->execute([...$values, $id]);
    } else {
        $pdo->prepare('INSERT INTO events (slug, title, event_status, start_date, end_date, location, description, cover_image_url, registration_url, flyer_folder, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute($values);
        $id = (int) $pdo->lastInsertId();
    }
    json_out(['status' => 'success', 'id' => $id, 'slug' => $slug]);
}

if ($action === 'event_delete') {
    need_post($method);
    $id = (int) (input()['id'] ?? 0);
    $pdo->prepare('DELETE FROM event_gallery_images WHERE event_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM events WHERE id = ?')->execute([$id]);
    json_out(['status' => 'success']);
}

if ($action === 'event_gallery_add') {
    need_post($method);
    $in = input();
    $url = trim((string) ($in['image_url'] ?? ''));
    if ($url === '') fail('Image is required.');
    $stmt = $pdo->prepare('SELECT id FROM events WHERE id = ?');
    $stmt->execute([(int) ($in['event_id'] ?? 0)]);
    if (!$stmt->fetch()) fail('Event not found.', 404);
    $pdo->prepare('INSERT INTO event_gallery_images (event_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)')
        ->execute([(int) $in['event_id'], $url, text_or_null($in['caption'] ?? null), (int) ($in['sort_order'] ?? 0)]);
    json_out(['status' => 'success', 'id' => (int) $pdo->lastInsertId()]);
}

if ($action === 'event_gallery_delete') {
    need_post($method);
    $pdo->prepare('DELETE FROM event_gallery_images WHERE id = ?')->execute([(int) (input()['id'] ?? 0)]);
    json_out(['status' => 'success']);
}

if ($method === 'GET' && $action === 'blogs_list') {
    $sql = 'SELECT id, slug, title, excerpt, content, author, category, image_url, is_published, published_at FROM blogs'
        . (($_GET['include_drafts'] ?? '') === '1' ? '' : ' WHERE is_published = 1') . ' ORDER BY published_at DESC, id DESC';
    $rows = $pdo->query($sql)->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['is_published'] = (int) $r['is_published'];
    }
    json_out($rows);
}

if ($action === 'blog_save') {
    need_post($method);
    $in = input();
    $title = trim((string) ($in['title'] ?? ''));
    $content = trim((string) ($in['content'] ?? ''));
    if ($title === '' || $content === '') fail('Title and content are required.');
    $id = (int) ($in['id'] ?? 0);
    $slug = unique_slug($pdo, 'blogs', slugify_text(trim((string) ($in['slug'] ?? '')) ?: $title), $id);
    $values = [
        $slug, $title, text_or_null($in['excerpt'] ?? null), $content,
        trim((string) ($in['author'] ?? '')) ?: 'NACOS LASUSTECH', text_or_null($in['category'] ?? null),
        text_or_null($in['image_url'] ?? null), flag_int($in['is_published'] ?? true),
    ];
    if ($id > 0) {
        $pdo->prepare('UPDATE blogs SET slug = ?, title = ?, excerpt = ?, content = ?, author = ?, category = ?, image_url = ?, is_published = ? WHERE id = ?')
            ->execute([...$values, $id]);
        $when = to_datetime($in['published_at'] ?? '');
        if ($when) $pdo->prepare('UPDATE blogs SET published_at = ? WHERE id = ?')->execute([$when, $id]);
    } else {
        $pdo->prepare('INSERT INTO blogs (slug, title, excerpt, content, author, category, image_url, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([...$values, to_datetime($in['published_at'] ?? '') ?? date('Y-m-d H:i:s')]);
        $id = (int) $pdo->lastInsertId();
    }
    json_out(['status' => 'success', 'id' => $id, 'slug' => $slug]);
}

if ($action === 'blog_delete') {
    need_post($method);
    $pdo->prepare('DELETE FROM blogs WHERE id = ?')->execute([(int) (input()['id'] ?? 0)]);
    json_out(['status' => 'success']);
}

// ─── Student flags (notices shown on a student's dashboard) ──────────────────

if ($method === 'GET' && $action === 'flags_list') {
    json_out($pdo->query('SELECT * FROM student_flags ORDER BY id DESC')->fetchAll());
}

if ($method === 'GET' && $action === 'flag_get') {
    $stmt = $pdo->prepare("SELECT * FROM student_flags WHERE matric_number = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
    $stmt->execute([trim((string) ($_GET['matric'] ?? ''))]);
    json_out($stmt->fetch() ?: null);
}

if ($action === 'flag_upsert') {
    need_post($method);
    $in = input();
    $matric = trim((string) ($in['matric_number'] ?? ''));
    $reason = trim((string) ($in['reason'] ?? ''));
    $message = trim((string) ($in['message'] ?? ''));
    if ($matric === '' || $reason === '' || $message === '') fail('Matric number, reason and message are required.');
    $stmt = $pdo->prepare("SELECT id FROM student_flags WHERE matric_number = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$matric]);
    $existing = $stmt->fetchColumn();
    $name = text_or_null($in['student_name'] ?? null);
    $by = text_or_null($in['flagged_by'] ?? null);
    if ($existing) {
        $pdo->prepare('UPDATE student_flags SET student_name = ?, reason = ?, message = ?, flagged_by = ? WHERE id = ?')
            ->execute([$name, mb_substr($reason, 0, 180), $message, $by, $existing]);
        $id = (int) $existing;
    } else {
        $pdo->prepare("INSERT INTO student_flags (matric_number, student_name, reason, message, status, flagged_by) VALUES (?, ?, ?, ?, 'active', ?)")
            ->execute([$matric, $name, mb_substr($reason, 0, 180), $message, $by]);
        $id = (int) $pdo->lastInsertId();
    }
    $stmt = $pdo->prepare('SELECT * FROM student_flags WHERE id = ?');
    $stmt->execute([$id]);
    json_out($stmt->fetch());
}

if ($action === 'flag_clear') {
    need_post($method);
    $pdo->prepare("UPDATE student_flags SET status = 'resolved' WHERE id = ?")->execute([(int) (input()['id'] ?? 0)]);
    json_out(['status' => 'success']);
}

// ─── Sub-admins: a student plus the admin pages they may use ─────────────────

const ADMIN_PAGES = ['students', 'freshers', 'idcards', 'payments', 'email', 'settings', 'executives', 'events', 'blogs', 'messages'];

function permissions_array(?string $csv): array
{
    return array_values(array_filter(array_map('trim', explode(',', (string) $csv))));
}

if ($method === 'GET' && $action === 'admin_access_list') {
    $rows = $pdo->query(
        'SELECT a.id, a.student_id, s.full_name, s.matric_no, s.level, s.department, a.permissions, a.created_by, a.created_at
         FROM admin_access a JOIN students s ON s.id = a.student_id ORDER BY s.full_name'
    )->fetchAll();
    foreach ($rows as &$r) $r['permissions'] = permissions_array($r['permissions']);
    json_out($rows);
}

if ($method === 'GET' && $action === 'admin_access_get') {
    $stmt = $pdo->prepare(
        "SELECT a.student_id, a.permissions, s.full_name, s.level FROM admin_access a
         JOIN students s ON s.id = a.student_id WHERE s.matric_no = ? LIMIT 1"
    );
    $stmt->execute([trim((string) ($_GET['matric'] ?? ''))]);
    $row = $stmt->fetch();
    // Alumni lose admin access automatically.
    $allowed = $row && $row['level'] !== 'alumni';
    json_out([
        'permissions' => $allowed ? permissions_array($row['permissions']) : [],
        'student_id' => $allowed ? (int) $row['student_id'] : null,
        'full_name' => $allowed ? $row['full_name'] : null,
    ]);
}

if ($action === 'admin_access_set') {
    need_post($method);
    $in = input();
    $student = find_student_by_matric($pdo, (string) ($in['matric_no'] ?? ''));
    if (!$student) fail('No student has that matric number.', 404);
    if ($student['level'] === 'alumni') fail('Alumni cannot be admins.');
    $perms = array_values(array_unique(array_map('strval', (array) ($in['permissions'] ?? []))));
    foreach ($perms as $perm) {
        if (!in_array($perm, ADMIN_PAGES, true)) fail("Unknown page: $perm");
    }
    if (!$perms) fail('Choose at least one page this admin can access.');
    $pdo->prepare(
        'INSERT INTO admin_access (student_id, permissions, created_by) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)'
    )->execute([$student['id'], implode(',', $perms), text_or_null($in['created_by'] ?? null)]);
    json_out(['status' => 'success', 'student_id' => (int) $student['id'], 'full_name' => $student['full_name']]);
}

if ($action === 'admin_access_remove') {
    need_post($method);
    $pdo->prepare('DELETE FROM admin_access WHERE student_id = ?')->execute([(int) (input()['student_id'] ?? 0)]);
    json_out(['status' => 'success']);
}

fail('Unknown action.', 404);
