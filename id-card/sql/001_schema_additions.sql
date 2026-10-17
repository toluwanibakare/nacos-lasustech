-- ============================================================================
-- 001_schema_additions.sql   (NACOS LASUSTECH central DB: tmbitcom_nacosid)
-- ----------------------------------------------------------------------------
-- ADDITIVE ONLY. Safe to run before the session rollover. Re-runnable except
-- the three FOREIGN KEY statements (see notes at each), which error harmlessly
-- if the constraint already exists. It changes no student data except adding
-- columns with defaults.
--
-- Target: MariaDB 11.4 (per the dump header). Run in phpMyAdmin > SQL tab on
-- the live database AFTER taking a full export backup.
--
-- Baseline: tmbitcom_nacosid.sql (students.id is int(11) signed, tables are
-- latin1 / InnoDB; the new tables use utf8mb4 so names and emails are safe).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. students: department, alumni level, rollover audit columns
-- ---------------------------------------------------------------------------
ALTER TABLE `students`
  MODIFY `level` ENUM('100','200','300','400','alumni') NOT NULL,
  ADD COLUMN IF NOT EXISTS `department` VARCHAR(60) NOT NULL DEFAULT 'Computer Science' AFTER `level`,
  ADD COLUMN IF NOT EXISTS `prev_level` VARCHAR(10) NULL DEFAULT NULL AFTER `post`,
  ADD COLUMN IF NOT EXISTS `prev_post` VARCHAR(255) NULL DEFAULT NULL AFTER `prev_level`,
  ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) NOT NULL DEFAULT 0 AFTER `email`;

-- Allowed department values (enforced in PHP/Node, not by an ENUM so new
-- departments never need a schema change):
--   'Computer Science' | 'Software Engineering' | 'Artificial Intelligence'
-- Allowed students.post values used for role tagging:
--   'Student' | 'HOC' | 'Assistant HOC' | 'admin' | executive titles
--   ('President', 'Vice President', 'Treasurer', ...)

ALTER TABLE `students`
  ADD KEY IF NOT EXISTS `idx_students_level_dept` (`level`, `department`),
  ADD KEY IF NOT EXISTS `idx_students_post` (`post`),
  ADD KEY IF NOT EXISTS `idx_students_email` (`email`);

-- ---------------------------------------------------------------------------
-- 2. freshers: new 100L students who have NO matric number yet.
--    They self-register (name, email, password), verify email with an OTP,
--    pay, and later the admin assigns a matric number. Kept separate from
--    `students` because students.matric_no and students.image_path are
--    NOT NULL and live code depends on that.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `freshers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `department` VARCHAR(60) NOT NULL DEFAULT 'Computer Science',
  `whatsapp_number` VARCHAR(20) DEFAULT NULL,
  `gender` VARCHAR(10) DEFAULT NULL,
  `birthday` DATE DEFAULT NULL,
  `image_path` VARCHAR(255) DEFAULT NULL,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `otp_code` VARCHAR(10) DEFAULT NULL,
  `otp_expiry` DATETIME DEFAULT NULL,
  `matric_no` VARCHAR(100) DEFAULT NULL,
  `student_id` INT(11) DEFAULT NULL COMMENT 'set when promoted into students',
  `status` ENUM('pending_verification','active','promoted','disabled') NOT NULL DEFAULT 'pending_verification',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_fresher_email` (`email`),
  UNIQUE KEY `uniq_fresher_matric` (`matric_no`),
  KEY `idx_fresher_dept` (`department`),
  KEY `idx_fresher_status` (`status`),
  CONSTRAINT `freshers_student_fk` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. payments: support freshers, sessions and HOC items
--    Revenue is read from payments WHERE status = 'success' (never from
--    request tables).
-- ---------------------------------------------------------------------------
ALTER TABLE `payments`
  ADD COLUMN IF NOT EXISTS `fresher_id` INT(11) NULL DEFAULT NULL AFTER `student_id`,
  ADD COLUMN IF NOT EXISTS `session` VARCHAR(9) NULL DEFAULT NULL AFTER `payment_type`,
  ADD COLUMN IF NOT EXISTS `hoc_item_id` INT(11) NULL DEFAULT NULL AFTER `session`;

-- ---------------------------------------------------------------------------
-- 4. hoc_items: books / manuals / practical workbooks posted by an HOC or
--    Assistant HOC for their own level.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hoc_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `level` ENUM('100','200','300','400') NOT NULL,
  `department` VARCHAR(60) DEFAULT NULL COMMENT 'NULL = every department in that level',
  `title` VARCHAR(255) NOT NULL,
  `course_code` VARCHAR(30) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `session` VARCHAR(9) NOT NULL,
  `status` ENUM('active','archived') NOT NULL DEFAULT 'active',
  `created_by` INT(11) DEFAULT NULL COMMENT 'students.id of the HOC / assistant HOC',
  `notified_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hoc_items_level` (`level`, `status`),
  KEY `idx_hoc_items_creator` (`created_by`),
  CONSTRAINT `hoc_items_creator_fk` FOREIGN KEY (`created_by`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- payments foreign keys (added after hoc_items / freshers exist)
ALTER TABLE `payments`
  ADD KEY IF NOT EXISTS `idx_payments_fresher` (`fresher_id`),
  ADD KEY IF NOT EXISTS `idx_payments_hoc_item` (`hoc_item_id`),
  ADD KEY IF NOT EXISTS `idx_payments_type_session` (`payment_type`, `session`, `status`);

-- Foreign keys: plain ADD CONSTRAINT (MariaDB has no IF NOT EXISTS here). These
-- are the only statements in this file that are not re-runnable; once a
-- constraint exists, running it again errors with "Duplicate key on write or
-- update" / "already exists", which is harmless: skip that statement.
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_fresher_fk` FOREIGN KEY (`fresher_id`) REFERENCES `freshers` (`id`);
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_hoc_item_fk` FOREIGN KEY (`hoc_item_id`) REFERENCES `hoc_items` (`id`);

-- ---------------------------------------------------------------------------
-- 5. id_card_requests: allow freshers and record the fee charged
-- ---------------------------------------------------------------------------
ALTER TABLE `id_card_requests`
  ADD COLUMN IF NOT EXISTS `fresher_id` INT(11) NULL DEFAULT NULL AFTER `student_id`,
  ADD COLUMN IF NOT EXISTS `fee_amount` DECIMAL(10,2) NULL DEFAULT NULL AFTER `emergency_contact`,
  MODIFY `matric_number` VARCHAR(100) NULL;

ALTER TABLE `id_card_requests`
  ADD CONSTRAINT `id_card_requests_fresher_fk` FOREIGN KEY (`fresher_id`) REFERENCES `freshers` (`id`);

-- ---------------------------------------------------------------------------
-- 6. email_campaigns: admin email manager (history + delivery counts)
--    audience_type: all | fresher | stalite | level | department | level_department
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `email_campaigns` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `subject` VARCHAR(255) NOT NULL,
  `body` MEDIUMTEXT NOT NULL,
  `audience_type` VARCHAR(30) NOT NULL,
  `audience_level` VARCHAR(10) DEFAULT NULL,
  `audience_department` VARCHAR(60) DEFAULT NULL,
  `total_students` INT(11) NOT NULL DEFAULT 0 COMMENT 'people matched by the filter',
  `with_email` INT(11) NOT NULL DEFAULT 0 COMMENT 'matched people that have an email on record',
  `sent_count` INT(11) NOT NULL DEFAULT 0,
  `failed_count` INT(11) NOT NULL DEFAULT 0,
  `status` ENUM('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
  `sent_by` VARCHAR(160) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email_campaigns_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. session_rollovers: guard so the rollover in 002 can only ever run once
--    per session label.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `session_rollovers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `session_label` VARCHAR(9) NOT NULL,
  `students_affected` INT(11) NOT NULL DEFAULT 0,
  `ran_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_rollover_session` (`session_label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. Admin-editable fees and settings (site_settings, group 'fees').
--    INSERT IGNORE: never overwrites a value an admin has already changed.
--    Amounts are in naira. Dues amount is a placeholder; set the real one
--    from the admin dashboard.
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('fee_id_card_stalite', '1000', 'fees'),
  ('fee_id_card_fresher', '1500', 'fees'),
  ('fee_dues',            '2000', 'fees'),
  ('welcome_message',     'Welcome to the 2026/2027 session! We are glad to have you back.', 'academic'),
  ('departments',         'Computer Science,Software Engineering,Artificial Intelligence', 'academic');

-- ---------------------------------------------------------------------------
-- 9. Tag the pre-rollover payments with the session they belong to, so
--    2026/2027 dues start from zero. RUN THIS FILE BEFORE GO-LIVE ONLY: once
--    new-session payments exist with a NULL session, re-running would
--    mislabel them. (Assumes all existing payment rows are
--    from the 2025/2026 session. Check: SELECT MIN(created_at), MAX(created_at)
--    FROM payments;)
-- ---------------------------------------------------------------------------
UPDATE `payments` SET `session` = '2025/2026' WHERE `session` IS NULL;
