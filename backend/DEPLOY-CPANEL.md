# Deploying the backend to cPanel (Node.js app)

Upload `backend-update.zip` (made from this folder) into the live backend folder and extract it.

## What the zip contains (and replaces)
`index.js`, `package.json`, `middleware/`, `routes/`, `services/`

## What it never touches
`.env`, `uploads/`, `public/`, `tmp/`, `.htaccess`, `db.js`, `init-db.js`, `migrate*.js`, `seed.js`, `stderr.log`

## Steps
1. Back up first: download `.env`, and zip the current `index.js`, `package.json`, `middleware`, `routes`, `services`.
2. Upload the zip to the backend folder, then Extract (choose to overwrite).
3. Edit `.env` (values are in your local `backend/.env`, never in git). It needs all of:
   `PORT, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, KORAPAY_PUBLIC_KEY, KORAPAY_SECRET_KEY, KORAPAY_BASE_URL,
   BACKEND_URL, FRONTEND_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL, ID_SYSTEM_API_KEY,
   ADMIN_USERNAME, ADMIN_PASSWORD`
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD` are NEW. Without them admin sign-in is disabled.
   - `FRONTEND_URL` must be the live website address: Korapay sends people back to `FRONTEND_URL/dashboard`.
   - `BACKEND_URL` must be this backend's public address (Korapay calls `BACKEND_URL/api/payments/webhook`).
4. cPanel > Setup Node.js App > open the app > Run NPM Install (package.json changed) > Restart.
5. Check: open `<backend address>/api/health` (should say "up"), then sign in at /admin.
