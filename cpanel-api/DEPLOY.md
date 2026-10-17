# cpanel-api: what goes on the cPanel server

This folder is the API-only replacement for the live `nacosid.tmb.it.com` app.
After this, nobody opens that site in a browser; only our Node backend calls it
(with `X-API-KEY`). The ID form, payments and the ID admin live on the main
NACOS website.

## Order (staging first if you have one; otherwise live)
1. Export a full backup of `tmbitcom_nacosid` from phpMyAdmin.
2. Run `id-card/sql/001_schema_additions.sql`, then `003_id_card_flow.sql`, then `004_content_and_admin_access.sql`, then `005_seed_content.sql`, then `006_executives_by_session.sql`, then `007_materials_library.sql`.
   (`002_session_rollover_2026_2027.sql` is the one-time rollover: already run.)
   `005` copies the current executives and events into the database. It is safe to re-run.
3. Upload the new zip BEFORE deploying the new Node backend: the backend now reads executives, events,
   blogs and flags from the database through these PHP actions.
4. Upload this folder's contents into the live `nacosid` web root:
   - `api.php`  (replaces the old one; keep a copy of the old file as `api.php.bak` outside the web root)
   - `lib/`     (new folder)
5. Do NOT upload or overwrite: `config.php`, `uploads/`, `assets/` (already live and correct).

## Delete from the live server once the new site is in use
Public pages and the old admin: `index.php`, `process.php`, `lookup_student.php`,
`generate.php`, `tmp_check_students.php`, `admin/`, `api/`, `assets/style.css`,
`assets/script.js`, and the guideline images (`accepted*.png`, `unaccepted*.png`,
`id_reference.png`). Keep in `assets/`: `Id_card_design.png`, `arial.ttf`,
`arialbd.ttf`, `ariblk.ttf`, `impact.ttf`.

## Housekeeping on config.php (live file, not in this repo)
- It creates a default admin account with a hardcoded password on every request;
  `admin_users` is no longer used, so remove that block and delete the row.
- Rotate `API_KEY` and the DB password (both were visible in the old files / docs),
  then set the same key as `ID_SYSTEM_API_KEY` in the Node backend env.
- `uploads/` should serve images only (no PHP execution).
