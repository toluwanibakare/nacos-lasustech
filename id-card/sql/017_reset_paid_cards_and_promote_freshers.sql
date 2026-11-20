-- ============================================================================
-- 017_reset_paid_cards_and_promote_freshers.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- 1. Promotes every fresher who has a matric number into the `students` table:
--    - 100 level for regular freshers, 200 level for Direct Entry freshers.
--    - Links `freshers.student_id` and marks `freshers.status = 'promoted'`.
--    - Updates `payments.student_id` and `id_card_requests.student_id`.
--    - Freshers without a matric number remain in `freshers`.
-- 2. Resets ID card requests for everyone who has paid:
--    - Moves all paid requests (whether previously generated or printed) back
--      to 'pending' (paid and awaiting generation).
--    - Resets `students.is_generated = 0` so cards can be re-batched.
--    - Keeps unpaid requests as 'awaiting_payment'.
-- ============================================================================

-- Step 1: Promote freshers who already have a matric number into students
INSERT INTO `students` (
  `full_name`,
  `level`,
  `department`,
  `email`,
  `email_verified`,
  `whatsapp_number`,
  `gender`,
  `birthday`,
  `post`,
  `matric_no`,
  `image_path`,
  `password`,
  `photo_zoom`,
  `photo_cx`,
  `photo_cy`,
  `account_status`
)
SELECT
  f.full_name,
  CASE WHEN f.level = '200' THEN '200' ELSE '100' END AS level,
  f.department,
  f.email,
  1 AS email_verified,
  f.whatsapp_number,
  f.gender,
  f.birthday,
  'Student' AS post,
  TRIM(f.matric_no) AS matric_no,
  COALESCE(f.image_path, '') AS image_path,
  f.password,
  f.photo_zoom,
  f.photo_cx,
  f.photo_cy,
  'active' AS account_status
FROM `freshers` f
LEFT JOIN `students` s ON s.matric_no = TRIM(f.matric_no)
WHERE f.matric_no IS NOT NULL 
  AND TRIM(f.matric_no) <> ''
  AND f.student_id IS NULL
  AND s.id IS NULL;

-- Step 2: Link fresher records to their student row
UPDATE `freshers` f
JOIN `students` s ON s.matric_no = TRIM(f.matric_no)
SET f.student_id = s.id,
    f.status = 'promoted'
WHERE f.matric_no IS NOT NULL 
  AND TRIM(f.matric_no) <> ''
  AND (f.student_id IS NULL OR f.status <> 'promoted');

-- Step 3: Link payments from freshers to their student row
UPDATE `payments` p
JOIN `freshers` f ON f.id = p.fresher_id
SET p.student_id = f.student_id
WHERE p.fresher_id IS NOT NULL 
  AND f.student_id IS NOT NULL
  AND (p.student_id IS NULL OR p.student_id <> f.student_id);

-- Step 4: Link ID card requests from freshers to their student row
UPDATE `id_card_requests` r
JOIN `freshers` f ON f.id = r.fresher_id
SET r.student_id = f.student_id,
    r.matric_number = f.matric_no,
    r.account_type = 'student'
WHERE r.fresher_id IS NOT NULL 
  AND f.student_id IS NOT NULL;

-- Step 5: Reset all paid ID card requests back to 'pending' (paid and awaiting generation)
-- Leaves unpaid requests as 'awaiting_payment'
UPDATE `id_card_requests`
SET `status` = 'pending'
WHERE `status` IN ('processing', 'ready', 'collected')
   OR (`status` = 'awaiting_payment' AND (
        (`payment_reference` IS NOT NULL AND `payment_reference` <> '')
        OR `student_id` IN (SELECT `student_id` FROM `payments` WHERE `payment_type` = 'id_card' AND `status` = 'success')
        OR `fresher_id` IN (SELECT `fresher_id` FROM `payments` WHERE `payment_type` = 'id_card' AND `status` = 'success')
   ));

-- Step 6: Mark students as ungenerated so all paid cards can be generated
UPDATE `students`
SET `is_generated` = 0
WHERE `id` IN (
  SELECT `student_id` FROM `id_card_requests` WHERE `status` = 'pending' AND `student_id` IS NOT NULL
);
