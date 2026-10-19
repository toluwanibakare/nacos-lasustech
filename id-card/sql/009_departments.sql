-- ============================================================================
-- 009_departments.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- The departments NACOS now has: Computer Science, Software Engineering and
-- Cyber Security. This replaces the old list that had Artificial Intelligence.
--
-- Students already saved under another department (for example Artificial
-- Intelligence) are NOT changed. They keep their department, and an admin can
-- move them from the Students page.
-- ============================================================================
INSERT INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('departments', 'Computer Science,Software Engineering,Cyber Security', 'academic')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Check: who is under a department that is no longer on the list
SELECT `department`, COUNT(*) AS total FROM `students` GROUP BY `department` ORDER BY total DESC;
