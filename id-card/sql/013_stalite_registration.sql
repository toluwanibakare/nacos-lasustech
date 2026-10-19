-- ============================================================================
-- 013_stalite_registration.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- Students (stalites) who never had a record can register themselves for the ID
-- card from the website. Their account is created as 'pending_payment' and cannot
-- sign in until the ID card fee is paid; payment flips it to 'active'.
-- Every student that exists today stays 'active'.
-- ============================================================================
ALTER TABLE `students`
  ADD COLUMN IF NOT EXISTS `account_status` ENUM('active','pending_payment') NOT NULL DEFAULT 'active' AFTER `post`;

ALTER TABLE `students`
  ADD KEY IF NOT EXISTS `idx_students_account_status` (`account_status`);
