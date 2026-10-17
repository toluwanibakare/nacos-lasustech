-- ============================================================================
-- 008_email_log.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- A record of every email the API sends for the backend: who, what subject, sent or failed and why.
-- The API also uses it to enforce its hourly sending cap. Handy for answering "did my email go out?".
-- ============================================================================
CREATE TABLE IF NOT EXISTS `email_log` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `to_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `status` ENUM('sent','failed') NOT NULL,
  `error` VARCHAR(255) DEFAULT NULL,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_log_time` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
