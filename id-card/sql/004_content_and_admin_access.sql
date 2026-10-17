-- ============================================================================
-- 004_content_and_admin_access.sql   (run after 001 and 003)
-- ----------------------------------------------------------------------------
-- 1. Upgrades the live executives / events / blogs tables (the simple versions
--    from the original dump) to what the admin dashboard needs, so the admin
--    saves them in MySQL instead of a JSON file on the Node server.
-- 2. Lets student flags be resolved more than once per student.
-- 3. Adds admin_access: sub-admins (a student + the admin pages they may use).
-- Re-runnable: every statement uses IF NOT EXISTS / IF EXISTS.
-- ============================================================================

-- ── executives ──────────────────────────────────────────────────────────────
ALTER TABLE `executives`
  MODIFY `name` VARCHAR(255) NOT NULL,
  MODIFY `post` VARCHAR(180) NOT NULL,
  MODIFY `level` VARCHAR(120) NOT NULL,
  ADD COLUMN IF NOT EXISTS `sort_order` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ── events ──────────────────────────────────────────────────────────────────
-- The old columns event_date / image_url stay (event_date is now optional);
-- the dashboard uses start_date / end_date / cover_image_url.
ALTER TABLE `events`
  MODIFY `event_date` DATE NULL,
  ADD COLUMN IF NOT EXISTS `slug` VARCHAR(180) NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `event_status` ENUM('upcoming','current','past') NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS `start_date` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `end_date` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `cover_image_url` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `registration_url` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `flyer_folder` VARCHAR(180) NULL,
  ADD COLUMN IF NOT EXISTS `sort_order` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `events`
  ADD UNIQUE KEY IF NOT EXISTS `uniq_events_slug` (`slug`);

-- ── blogs ───────────────────────────────────────────────────────────────────
ALTER TABLE `blogs`
  MODIFY `content` LONGTEXT NOT NULL,
  MODIFY `author` VARCHAR(180) NULL DEFAULT 'NACOS LASUSTECH',
  ADD COLUMN IF NOT EXISTS `slug` VARCHAR(180) NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `blogs`
  ADD UNIQUE KEY IF NOT EXISTS `uniq_blogs_slug` (`slug`);

-- ── student flags: a student can be flagged and resolved many times ─────────
ALTER TABLE `student_flags`
  DROP INDEX IF EXISTS `uniq_student_flag_active`;

ALTER TABLE `student_flags`
  ADD KEY IF NOT EXISTS `idx_flag_matric_status` (`matric_number`, `status`);

-- ── sub-admins ──────────────────────────────────────────────────────────────
-- permissions: comma-separated page keys, any of
--   students, freshers, idcards, payments, email, settings, executives, events, blogs, messages
-- The super admin (set in the backend environment) is not stored here and can
-- always do everything, including managing this table.
CREATE TABLE IF NOT EXISTS `admin_access` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `student_id` INT(11) NOT NULL,
  `permissions` VARCHAR(255) NOT NULL,
  `created_by` VARCHAR(160) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admin_student` (`student_id`),
  CONSTRAINT `admin_access_student_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
