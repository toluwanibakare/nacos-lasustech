# Backend on Render: how email works

Render auto-deploys the backend from GitHub (`main`). Its settings live in the Render dashboard
(service > Environment); they are not in git.

## The problem
Render's free plan blocks outbound traffic on ports 25, 465 and 587 (see render.com/docs/free). Gmail's mail
server only works on those ports, so the backend cannot send email itself: no password reset codes, fresher
verification codes, receipts, admin email manager or HOC announcements.

## The setup: the cPanel PHP API sends the email
The backend (Render) asks the PHP API on the cPanel server (nacosid.tmb.it.com, over normal HTTPS) to send each
email, and the PHP API sends it through a mailbox on that server. Render handles everything else.

### On the cPanel server (once)
1. phpMyAdmin: run `id-card/sql/008_email_log.sql` (a log of every email, also used for the hourly cap).
2. cPanel > Email Accounts > Create a mailbox, for example `noreply@your-domain`. Pick a domain whose DNS you control.
3. cPanel > Email Deliverability: make sure SPF and DKIM show "Valid" for that domain. If your DNS is managed
   somewhere else, cPanel shows the records to copy into that DNS panel. Without them mail lands in spam.
4. In the folder that holds `config.php`, create `mail_config.php` (copy `mail_config.sample.php` from the repo and fill
   in the mailbox address and password). It is never overwritten by an upload and never goes in git.
5. Upload the updated `cpanel-api` package (`api.php` and the `lib` folder).

### In the Render dashboard
- Add `EMAIL_TRANSPORT` = `central`
- Add `MAIL_DAILY_LIMIT` = about 80% of what your host allows in a day (used for the big-send warning)
- The `SMTP_*` and `MAIL_FROM` settings are not used in this mode; leave them or delete them.
- Make sure `ID_SYSTEM_API_KEY` matches the key in the cPanel `config.php` (it already does today).

### Check it
Sign in to the admin > Email > "Test email connection". It reports which mailbox is used and how many emails went out
in the last hour out of the allowed cap. If it fails, the message says what is wrong ("mail_config.php is missing",
"the mail server rejected the username or password", and so on).

## Limits to know
- The PHP API refuses to send more than `hourly_limit` emails an hour (set in `mail_config.php`, default 200). A big
  announcement that reaches the cap just pauses and carries on when the hour rolls over. Nobody is skipped or sent twice.
- Shared cPanel hosting usually has its own hourly limit (often 100 to 500). Ask your host and set `hourly_limit` a little lower.
- **Protect `ID_SYSTEM_API_KEY`.** Anyone who has it can ask the PHP API to send email as your mailbox. The key was in
  this repo's early history, so rotate it: change `API_KEY` in the cPanel `config.php` and `ID_SYSTEM_API_KEY` in Render
  together. Every send is recorded in the `email_log` table.

## Fallback: a mail provider on port 2525
If you would rather not use the cPanel mailbox, a provider that listens on port 2525 (Brevo: free, 300 emails a day)
works from Render. Do not set `EMAIL_TRANSPORT`; set `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=2525`, `SMTP_USER`,
`SMTP_PASS` and `MAIL_FROM` (a sender you verified in Brevo), and `MAIL_DAILY_LIMIT=300`.

## Local development
Gmail works on your own computer (port 587 is not blocked there): keep `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587` and
your Gmail app password in `backend/.env`, and do not set `EMAIL_TRANSPORT`.
