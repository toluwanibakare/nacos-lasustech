<?php
/**
 * Email sending for the NACOS backend.
 *
 * Render cannot send mail itself (its free plan blocks the SMTP ports), so it asks this API to do it:
 * `send_email` in api.php. The mail goes out through this server's own mail account.
 *
 * The mail account's details live in mail_config.php, next to config.php on the server. That file is
 * never part of an upload, so updating the API never overwrites it. See mail_config.sample.php.
 */
declare(strict_types=1);

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

/** The mail account settings, or a clear error if the server has not been set up yet. */
function mail_settings(): array
{
    static $settings = null;
    if ($settings !== null) return $settings;

    $file = dirname(__DIR__) . '/mail_config.php';
    if (!is_file($file)) {
        fail('Email is not set up on this server yet: mail_config.php is missing. Copy mail_config.sample.php to mail_config.php and fill it in.', 503);
    }
    $loaded = require $file;
    if (!is_array($loaded)) fail('mail_config.php must return an array.', 503);
    foreach (['host', 'port', 'username', 'password', 'from_email'] as $key) {
        if (!isset($loaded[$key]) || $loaded[$key] === '') fail("mail_config.php is missing \"$key\".", 503);
    }
    $loaded['secure'] = $loaded['secure'] ?? 'tls';      // 'tls' = STARTTLS (port 587), 'ssl' = SMTPS (port 465), '' = none
    $loaded['from_name'] = $loaded['from_name'] ?? 'NACOS LASUSTECH';
    $loaded['hourly_limit'] = (int) ($loaded['hourly_limit'] ?? 200);
    return $settings = $loaded;
}

function mail_transport(array $cfg): PHPMailer
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) $cfg['host'];
    $mail->Port = (int) $cfg['port'];
    $mail->SMTPAuth = true;
    $mail->Username = (string) $cfg['username'];
    $mail->Password = (string) $cfg['password'];
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 20;
    $mail->SMTPKeepAlive = false;

    if ($cfg['secure'] === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($cfg['secure'] === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = '';
        $mail->SMTPAutoTLS = false;
    }

    // Talking to this same server by name ("localhost"): its certificate is for the public host name,
    // so the name will not match. The connection never leaves the machine.
    if (in_array(strtolower((string) $cfg['host']), ['localhost', '127.0.0.1', '::1'], true)) {
        $mail->SMTPOptions = ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]];
    }
    return $mail;
}

/** Sends one email. Throws on any problem; the message says why. */
function mail_send(array $cfg, string $to, string $subject, string $html, ?string $text, ?string $fromName, ?string $replyTo): void
{
    $mail = mail_transport($cfg);
    $mail->setFrom((string) $cfg['from_email'], $fromName !== null && $fromName !== '' ? $fromName : (string) $cfg['from_name']);
    $mail->addAddress($to);
    if ($replyTo !== null && $replyTo !== '') $mail->addReplyTo($replyTo);
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $html;
    $mail->AltBody = $text !== null && $text !== '' ? $text : trim(html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $html))));
    $mail->send();
}

/** Connects and logs in without sending anything. Throws if the mail server refuses us. */
function mail_check(array $cfg): void
{
    $mail = mail_transport($cfg);
    $mail->smtpConnect();
    $mail->smtpClose();
}

/** Turns a mail library error into something a person can act on. */
function mail_friendly_error(Throwable $e): string
{
    $m = $e->getMessage();
    if (stripos($m, 'authenticate') !== false || stripos($m, 'Username and Password') !== false) {
        return 'The mail server rejected the username or password in mail_config.php.';
    }
    if (stripos($m, 'connect') !== false) {
        return 'Could not connect to the mail server. Check "host", "port" and "secure" in mail_config.php.';
    }
    if (stripos($m, 'From address') !== false || stripos($m, 'not allowed') !== false || stripos($m, 'sender') !== false) {
        return 'The mail server did not accept the sender address. "from_email" must be the mailbox you log in with.';
    }
    return mb_substr($m, 0, 240);
}
