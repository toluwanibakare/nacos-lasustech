# Putting the backend on cPanel (Node.js app)

Render's free plan is gone, so the backend now runs on your cPanel hosting, next to the PHP API.
Everything below is done once. After that, updates are "upload, extract, restart".

The bundle is `nacos-backend-cpanel.tar.gz` (kept in the project folder, git-ignored because it holds your live settings).

> Use the .tar.gz, not a .zip. cPanel's antivirus flags ANY zip that contains JavaScript files
> ("Sanesecurity.Foxhole.JS_Zip_1.UNOFFICIAL"). That is a broad false positive, not a real virus.

## What the bundle contains
`app.js` (the startup file), `index.js`, `package.json`, `package-lock.json`, `middleware/`, `routes/`, `services/`,
`data/`, `uploads/`, and `.env` (your live settings, with the Korapay keys left for you to paste).
It does NOT contain `node_modules` (cPanel installs those), the old database scripts, or anything for Render or Vercel.

## 1. Create the app
cPanel > **Setup Node.js App** > **Create Application**
- **Node.js version**: 20 or newer (22 is fine).
- **Application mode**: Production.
- **Application root**: a NEW folder that nothing else uses, for example `nacos-backend`.
  (Do not use the folder of a subdomain. That is what caused "Specified directory already used".)
- **Application URL**: the address you want, for example `api.nacos.tmb.it.com` (the subdomain must exist
  in cPanel > Domains first, and point to this server).
- **Application startup file**: `app.js`

Click **Create**. Do not start it yet.

## 2. Upload the files
1. File Manager > open the application root (`nacos-backend`) > **Upload** `nacos-backend-cpanel.tar.gz`.
2. Right-click it > **Extract** (into the same folder). The files should now sit directly in `nacos-backend`
   (`app.js`, `index.js`, `routes`, and so on, not inside another folder).
3. Delete `nacos-backend-cpanel.tar.gz` from the server (it holds your passwords).
4. In File Manager, tick **Show Hidden Files** and open `.env`. Replace the two Korapay lines with your
   **live** keys (`sk_live_...` and `pk_live_...`). Check `BACKEND_URL` is the address from step 1.

## 3. Install and start
Back in **Setup Node.js App**, open the app:
1. Click **Run NPM Install** (takes a minute or two; it installs from `package.json`).
2. Click **Restart** (or **Start**).
3. Open `https://YOUR-BACKEND-ADDRESS/api/health`. It should say the backend is up.
   If it does not, open `stderr.log` in the application root: the last lines say what is wrong.

## 4. Point everything at the new address
Do these once the health check works.
1. **Vercel** (the website) > Project > Settings > Environment Variables: set `VITE_API_URL` to
   `https://YOUR-BACKEND-ADDRESS/api` for Production, then **Redeploy**. Until you do this the website still
   talks to Render.
2. **Korapay** dashboard (live mode) > webhook / notification URL: `https://YOUR-BACKEND-ADDRESS/api/payments/webhook`.
3. **GitHub**: the "Keep backend awake" workflow only pinged Render. Turn it off (Actions > Keep backend awake > ... > Disable workflow),
   or it will fail every 5 minutes and email you.
4. Sign in to the admin and try: Email > "Test email connection", then send yourself a test message.

## Settings in `.env`
`NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, KORAPAY_PUBLIC_KEY, KORAPAY_SECRET_KEY, KORAPAY_BASE_URL, BACKEND_URL, FRONTEND_URL,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL, CENTRAL_API_URL, ID_SYSTEM_API_KEY, ADMIN_USERNAME, ADMIN_PASSWORD`
- `JWT_SECRET`: use the SAME value that was on Render. Receipt QR codes already printed are checked with it, so a new
  value would make old receipts fail to verify (and everyone would be signed out).
- `FEEDBACK_ENCRYPTION_KEY`: if you set one on Render, add the same line here, or anonymous reply emails saved earlier
  cannot be read.
- Email goes straight out through Gmail (cPanel allows port 587). To send through the PHP relay instead, add `EMAIL_TRANSPORT=central`.
- Do not add `PORT`. cPanel chooses it.

## Updating later
Ask for an **update bundle**: the same files without `.env`, so your live settings stay as they are.
Upload it, extract over the old files, **Run NPM Install** only if `package.json` changed, then **Restart**.
(Extracting this first, full bundle again would replace your `.env`, including the live Korapay keys.)
