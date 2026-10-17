-- ============================================================================
-- 006_executives_by_session.sql   (run after 004 and 005; safe to re-run)
-- ----------------------------------------------------------------------------
-- Executives belong to a session. Everyone already in the table (the 2025/2026
-- council) is kept exactly as is, including their level text, and tagged
-- 2025/2026. A new session starts with no executives until the admin adds them.
-- ============================================================================
ALTER TABLE `executives`
  ADD COLUMN IF NOT EXISTS `session` VARCHAR(9) NOT NULL DEFAULT '2025/2026' AFTER `level`;

ALTER TABLE `executives`
  ADD KEY IF NOT EXISTS `idx_executives_session` (`session`, `is_active`, `sort_order`);

-- ── Corrections for a database seeded with the first version of 005 ─────────
-- (that version had 19 executives from an old store file). These do nothing if
-- 005 was run in its current form.
INSERT IGNORE INTO `executives` (`id`, `name`, `post`, `level`, `image_url`, `description`, `sort_order`, `is_active`, `session`)
VALUES (20, 'Akinrinade Moses Imisioluwa', 'Director of Studies', '', 'uploads/dir_studies.JPG', 'Oversees the department''s academic programs, curriculum and student''s academic progress.', 11, 1, '2025/2026');

UPDATE `executives` SET `name` = 'Toluwani Moses Bakare'
WHERE `post` = 'Vice President' AND `name` = 'Bakare Toluwani Moses';
