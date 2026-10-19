-- ============================================================================
-- 010_feedback_box.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- Suggestion box and complaint box on the website. They share the contact
-- messages table: `kind` says which box it came from, and `is_anonymous` rows
-- store no name and no email at all (full_name is the word 'Anonymous').
-- No IP address or account is stored for anonymous rows.
-- ============================================================================
ALTER TABLE `contact_messages`
  ADD COLUMN IF NOT EXISTS `kind` ENUM('message','suggestion','complaint') NOT NULL DEFAULT 'message' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `is_anonymous` TINYINT(1) NOT NULL DEFAULT 0 AFTER `kind`;

ALTER TABLE `contact_messages`
  ADD KEY IF NOT EXISTS `idx_contact_kind` (`kind`);
