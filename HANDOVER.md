# Handover Notes

## Latest Changes (Nov 20, 2026)

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
