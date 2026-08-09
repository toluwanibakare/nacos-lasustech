# Admin Dashboard Setup

## 1. Frontend env

Use [.env.voting.example](/c:/Users/DELL/Documents/GitHub/NACOS-website/.env.voting.example) as the frontend env template:

```env
VITE_API_URL=http://localhost:5000/api
VITE_VOTING_API_URL=http://localhost:5050/api
```

## 2. Main backend env

Use [backend/.env.example](/c:/Users/DELL/Documents/GitHub/NACOS-website/backend/.env.example) and fill:

- `DB_*` for the main website admin database
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `ID_SYSTEM_API_KEY`

## 3. Main backend SQL

Run:

- [backend/sql/admin_dashboard.sql](/c:/Users/DELL/Documents/GitHub/NACOS-website/backend/sql/admin_dashboard.sql)

This creates:

- `site_settings`
- `student_flags`
- `executives`
- `events`
- `event_gallery_images`
- `blogs`

## 4. Voting backend env

Use [voting-backend/.env.example](/c:/Users/DELL/Documents/GitHub/NACOS-website/voting-backend/.env.example) and fill:

- `DB_*` for the voting database
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `KORAPAY_PUBLIC_KEY`
- `KORAPAY_SECRET_KEY`

## 5. Voting SQL

Run:

- [voting-backend/sql/schema.sql](/c:/Users/DELL/Documents/GitHub/NACOS-website/voting-backend/sql/schema.sql)

This now also creates:

- `voting_settings`
- `voting_sections`

## 6. API.php

No mandatory `API.php` change is required for this admin dashboard to work in its current architecture.

Why:

- student login, profile, payments, and student list still proxy through your existing central PHP API
- admin flags, academic session, executives, blogs, events, galleries, and voting control are now handled by the Node backends

## 7. Optional API.php improvement

If you want your central PHP API to always return a clear role field on login, make sure your login response includes:

```php
echo json_encode([
  "status" => "success",
  "user" => [
    "id" => $student["id"],
    "full_name" => $student["full_name"],
    "matric_number" => $student["matric_number"],
    "email" => $student["email"],
    "role" => $student["post"] ?? "student",
    "post" => $student["post"] ?? "student"
  ]
]);
```

## 8. Flyer folder

Upload voting section flyer assets into:

- [public/voting-section-flyers](/c:/Users/DELL/Documents/GitHub/NACOS-website/public/voting-section-flyers)

Then use those paths in the admin voting section form, for example:

- `/voting-section-flyers/special-awards.jpg`
- `/voting-section-flyers/social-personality.jpg`
