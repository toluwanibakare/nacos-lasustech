-- ============================================================================
-- 014_message_replies.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- Admins can reply to messages, suggestions and complaints from the admin.
--  * reply_email_enc: an anonymous sender may leave an email to get a reply. It is
--    encrypted by the backend BEFORE it reaches this database, so the database and
--    the admin screens only ever hold ciphertext.
--  * contact_replies: every reply that was sent.
-- ============================================================================
ALTER TABLE `contact_messages`
  ADD COLUMN IF NOT EXISTS `reply_email_enc` TEXT NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `replied_at` DATETIME NULL AFTER `is_read`;

CREATE TABLE IF NOT EXISTS `contact_replies` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `message_id` INT(11) NOT NULL,
  `reply_text` TEXT NOT NULL,
  `sent_by` VARCHAR(120) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_replies_message` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
