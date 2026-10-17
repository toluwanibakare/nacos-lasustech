-- ============================================================================
-- 002_session_rollover_2026_2027.sql
-- ----------------------------------------------------------------------------
-- DESTRUCTIVE. RUN EXACTLY ONCE, AFTER 001_schema_additions.sql.
--
--   BEFORE RUNNING: export a full backup of tmbitcom_nacosid from phpMyAdmin.
--
--   100 -> 200,  200 -> 300,  300 -> 400,  400 -> alumni
--   HOC / Assistant HOC posts reset to 'Student' (new HOCs are assigned from
--   the admin dashboard for the new session)
--   current_session -> 2026/2027, semester -> First Semester
--
-- The first INSERT hits a UNIQUE key, so running this a second time FAILS at
-- that statement and nothing else executes (leave phpMyAdmin's "Ignore errors"
-- unticked).
--
-- Expected result against tmbitcom_nacosid.sql as dumped (levels counted from
-- the INSERTs): alumni 48 | 400: 177 | 300: 89 | 200: 117 | 100: 0.
-- Run the verification SELECTs at the bottom and compare.
-- ============================================================================

START TRANSACTION;

-- Guard: fails with duplicate-key if this session was already rolled over.
INSERT INTO `session_rollovers` (`session_label`, `students_affected`)
VALUES ('2026/2027', (SELECT COUNT(*) FROM `students` WHERE `level` IN ('100','200','300','400')));

-- One statement, so there is no ordering/collision problem between levels.
UPDATE `students`
SET `prev_level` = `level`,
    `prev_post`  = `post`,
    `level` = CASE `level`
                WHEN '400' THEN 'alumni'
                WHEN '300' THEN '400'
                WHEN '200' THEN '300'
                WHEN '100' THEN '200'
              END
WHERE `level` IN ('100','200','300','400');

-- HOC roles are per class per session: clear them, admin reassigns.
UPDATE `students`
SET `post` = 'Student'
WHERE `post` IN ('HOC', 'Assistant HOC');

-- Archive last session's HOC items (table is empty on first run).
UPDATE `hoc_items` SET `status` = 'archived' WHERE `session` <> '2026/2027';

-- New session.
INSERT INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('current_session',  '2026/2027',      'academic'),
  ('current_semester', 'First Semester', 'academic')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification (read-only). Compare with the expected counts above.
-- ---------------------------------------------------------------------------
SELECT `level`, COUNT(*) AS total FROM `students` GROUP BY `level` ORDER BY `level`;
SELECT `prev_level`, `level`, COUNT(*) AS total FROM `students` GROUP BY `prev_level`, `level` ORDER BY `prev_level`;
SELECT `setting_key`, `setting_value` FROM `site_settings` WHERE `setting_group` IN ('academic','fees');
SELECT `post`, COUNT(*) AS total FROM `students` GROUP BY `post`;

-- ---------------------------------------------------------------------------
-- EMERGENCY UNDO (only if you have NOT run anything else since, and only if
-- the numbers above are wrong). Uncomment and run as one block:
--
-- START TRANSACTION;
-- UPDATE `students` SET `level` = `prev_level`, `post` = `prev_post` WHERE `prev_level` IS NOT NULL;
-- UPDATE `students` SET `prev_level` = NULL, `prev_post` = NULL;
-- DELETE FROM `session_rollovers` WHERE `session_label` = '2026/2027';
-- UPDATE `site_settings` SET `setting_value` = '2025/2026' WHERE `setting_key` = 'current_session';
-- COMMIT;
-- ---------------------------------------------------------------------------
