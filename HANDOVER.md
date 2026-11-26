# Handover Notes

## Latest Changes (Nov 26, 2026)

### 1. Executive Sessions & Class Rep Promotion (`src/data/executives.ts`)
- Moved the 2025/2026 Executive Council (including the 2025/2026 400L HOC and Assistant HOC) into the `2025/2026` session archive (`executiveSessions`).
- Set up the `2026/2027` current session:
  - Top Leadership & Core Executives are empty pending unveiling of the newly elected council.
  - Promoted HOCs and Assistant HOCs: 300L -> 400L (`Adegoke Muhammed`, `Matti Jadesola`), 200L -> 300L (`Osho Aishat`, `Samuel John`), 100L -> 200L (`Ayara Michael`, `Olatunji Oyindamola Barakat`), and 100L marked `vacant: true`.
- Added `hallOfFameByPosition` grouping all past Executive Council posts plus the graduated 400L HOC and Assistant HOC (`2025/2026` onward).

### 2. 3D Executives Hall of Fame (`src/components/ExecutivesHallOfFame3D.tsx`)
- Added a first-person POV walkable Three.js 3D corridor shown when switching to the `2025/2026 (Hall of Fame)` session tab (or `#hall-of-fame`) on `/executives`.
- Each executive position has its own physical wall bay with the position title mounted above the portraits, framed portraits, and name/session plaques underneath. Visitors can watch the cinematic Auto Tour slide smoothly from one person to another, enter Fullscreen, listen to the looping Hall of Fame instrumental (`src/assets/The_Script_-_Hall_of_Fame_Instrumental_(mp3.pm).mp3`) with Mute/Unmute, click any wall frame to walk to it, drag to look around, use WASD/Arrow keys, toggle Grid view, and view/toggle **Views & Likes** counters.
- Added `/api/content/hall-of-fame/stats`, `/api/content/hall-of-fame/view`, and `/api/content/hall-of-fame/like` in `backend/routes/content.routes.js` & `backend/services/admin.service.js` (with `localStorage` fallback).

### 3. Home, Executives & Admin Email (`src/pages/Index.tsx`, `src/pages/Executives.tsx`, `src/components/ExecutiveCard.tsx`, `src/components/admin/EmailManager.tsx`)
- Updated `Executives.tsx` with mobile-friendly `2026/2027 (Current)` and `2025/2026 (Hall of Fame)` session tabs; switching to `2025/2026` displays the 3D Executives Hall of Fame and the `2025/2026` council roster.
- Added the `2025/2026 Hall of Fame & Appreciation` quick-fill email template in `src/components/admin/EmailManager.tsx` targeting Everyone (`all`).
- Added failed-recipient tracking and `POST /api/admin/email/campaigns/:id/resend-failed` (`backend/services/campaign.service.js`, `backend/routes/admin.routes.js`, `backend/services/admin.service.js`) with a **Resend failed** button per campaign row in `EmailManager.tsx`.
- Updated `Index.tsx` Executive Council preview to announce the `2026/2027` council transition, show the promoted `2026/2027` Heads of Class, and link to the `2025/2026` archive and Hall of Fame.
- Added `vacant` state support to `ExecutiveCard.tsx`.

## Previous Changes (Nov 20, 2026)

### 1. Database & SQL Migration (`id-card/sql/017_reset_paid_cards_and_promote_freshers.sql`)
- Promotes every fresher who has a matric number into the `students` table:
  - 100 level for regular freshers (`level = '100'`).
  - 200 level for Direct Entry freshers (`level = '200'`).
  - Links `freshers.student_id` to the new `students.id` and sets `status = 'promoted'`.
  - Re-links `payments.student_id` and `id_card_requests.student_id` (sets `account_type = 'student'`).
  - Freshers without a matric number remain as active freshers.
- Resets all paid ID card requests back to `pending` (paid and awaiting generation):
  - Affects all requests that are `processing`, `ready`, or `collected`, or were paid via `payments` / `payment_reference`.
  - Resets `students.is_generated = 0` so the cards can be generated in batch.
  - Keeps unpaid requests as `awaiting_payment`.

### 2. cPanel PHP API (`cpanel-api/api.php`)
- Updated `promote_fresher()` to also set `account_type = 'student'` on `id_card_requests` upon promotion.
- Packaged clean deployment zip at `cpanel-api-update.zip` (excluding sensitive config files like `mail_config.php`).

### 3. Admin ID Cards Filter (`src/components/admin/IdCards.tsx`)
- Changed level dropdown filter option from "Freshers" to "100 level".
- Filtering by "100 level" displays only students who have a matric number and have paid for their ID card (`status !== 'awaiting_payment'`).

### 4. Student Portal Notice (`src/pages/Dashboard.tsx`)
- Added a prominent top warning banner on the student portal for any fresher without a matric number, instructing them to update their matric number immediately so they can be placed into their class and receive their ID card.
