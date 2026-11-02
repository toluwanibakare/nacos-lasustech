-- ============================================================================
-- 015_id_card_flags_and_fresher_levels.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- 1. Freshers choose a level when they register: 100 (new student) or 200
--    (direct entry). Everyone who registered before this keeps 100.
-- 2. ID card flags. An admin can flag an ID card request. A flagged person pays
--    the flag fee (setting fee_id_flag, default 2000) instead of the normal card
--    fee, and cannot use the portal until it is paid. Paying clears the flag and
--    puts the request back in the queue so a new card can be generated.
--      flag_prev_status keeps the status the request had before it was flagged,
--      so an admin who flags by mistake can undo it.
-- 3. WhatsApp class group for 100 level (only filled in when it was empty).
-- ============================================================================
ALTER TABLE `freshers`
  ADD COLUMN IF NOT EXISTS `level` ENUM('100','200') NOT NULL DEFAULT '100' AFTER `department`;

ALTER TABLE `id_card_requests`
  ADD COLUMN IF NOT EXISTS `flagged` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `flag_reason` VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `flagged_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `flag_prev_status` VARCHAR(20) NULL DEFAULT NULL;

INSERT IGNORE INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('fee_id_flag', '2000', 'fees');

INSERT INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('whatsapp_class_link_100', 'https://chat.whatsapp.com/Iexj1k6N7xXGK0Udxjgh3W?s=sw&p=a&mlu=0', 'academic')
ON DUPLICATE KEY UPDATE `setting_value` = IF(`setting_value` = '', VALUES(`setting_value`), `setting_value`);
