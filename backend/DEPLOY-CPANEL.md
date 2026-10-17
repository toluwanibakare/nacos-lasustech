# Deploying the backend to cPanel (Node.js app)

Upload `backend-update.tar.gz` (kept in the project folder, git-ignored) into the live backend folder and extract it.

> Use the .tar.gz, not a .zip. cPanel's antivirus flags ANY zip that contains JavaScript files
> ("Sanesecurity.Foxhole.JS_Zip_1.UNOFFICIAL"). That is a broad false positive, not a real virus.

## What the bundle contains
- `index.js`, `package.json`, `middleware/`, `routes/`, `services/` (replaced)
- `.env`: the LIVE settings. It REPLACES the `.env` on the server.

## What it never touches
`uploads/`, `public/`, `tmp/`, `.htaccess`, `db.js`, `init-db.js`, `migrate*.js`, `seed.js`, `stderr.log`

## Steps
1. Back up first: download the current `.env` (the bundle replaces it), and zip the current
   `index.js`, `package.json`, `middleware`, `routes`, `services`.
2. File Manager > upload `backend-update.tar.gz` into the backend folder > Extract > overwrite.
3. If your old `.env` had a line the new one lacks (for example `PORT`), copy that line across.
4. Delete `backend-update.tar.gz` from the server (it holds the secrets).
5. Setup Node.js App > open the app > Restart.
   (Run NPM Install is not needed for this update: the only new package line, `form-data`,
   is already installed because `axios` depends on it.)
6. Check: open `https://api.nacos.tmb.it.com/api/health` (should say "up"), then sign in at /admin.
   If it does not start, the end of `stderr.log` says why.

## Settings the live `.env` must have
`NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, KORAPAY_PUBLIC_KEY, KORAPAY_SECRET_KEY, KORAPAY_BASE_URL,
BACKEND_URL, FRONTEND_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL,
ID_SYSTEM_API_KEY, ADMIN_USERNAME, ADMIN_PASSWORD`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: without them admin sign-in is disabled.
- `FRONTEND_URL`: the live website. Korapay sends customers back to `FRONTEND_URL/dashboard`.
- `BACKEND_URL`: this backend's public address. Korapay calls `BACKEND_URL/api/payments/webhook`.
