<?php
/**
 * Email account used by the API to send mail. COPY THIS FILE to mail_config.php (same folder as config.php)
 * on the server and fill it in. mail_config.php holds a password, so it must never be put in git.
 *
 * Create the mailbox first: cPanel > Email Accounts > Create, for example noreply@your-domain.
 * Then check cPanel > Email Deliverability shows "Valid" for SPF and DKIM on that domain, otherwise
 * messages are likely to land in spam.
 */
return [
    // The mail server. "localhost" is fine because the API runs on the same server as the mail account.
    'host' => 'localhost',
    'port' => 587,
    'secure' => 'tls',                         // 'tls' for port 587, 'ssl' for port 465
    'username' => 'noreply@your-domain.example', // the full mailbox address
    'password' => 'the-mailbox-password',

    // The address people see. Use the same mailbox as above.
    'from_email' => 'noreply@your-domain.example',
    'from_name' => 'NACOS LASUSTECH',

    // Safety cap: the API refuses to send more than this many emails in any hour. Set it a little below
    // your host's own hourly limit (ask your host, it is often 100 to 500).
    'hourly_limit' => 200,
];
