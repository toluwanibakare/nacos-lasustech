-- ============================================================================
-- 003_id_card_flow.sql   (run after 001; safe to re-run)
-- ----------------------------------------------------------------------------
-- Supports the in-website ID card application: photo crop settings (so the
-- card renders exactly what the student arranged in the editor), payment-first
-- status flow, and fresher applications.
-- ============================================================================

-- Photo crop = what the student arranged in the photo editor.
--   photo_zoom : 1.000 .. 5.000   (1 = the full short side of the photo)
--   photo_cx   : 0..1  horizontal centre of the visible square, as a fraction of photo width
--   photo_cy   : 0..1  vertical centre of the visible square, as a fraction of photo height
-- NULL on all three = legacy behaviour (centred square, nudged up for portraits),
-- so cards for existing students render exactly as before.
ALTER TABLE `students`
  ADD COLUMN IF NOT EXISTS `photo_zoom` DECIMAL(5,3) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `photo_cx`   DECIMAL(6,5) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `photo_cy`   DECIMAL(6,5) NULL DEFAULT NULL;

ALTER TABLE `freshers`
  ADD COLUMN IF NOT EXISTS `photo_zoom` DECIMAL(5,3) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `photo_cx`   DECIMAL(6,5) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `photo_cy`   DECIMAL(6,5) NULL DEFAULT NULL;

-- Application status: awaiting_payment -> pending (paid) -> processing -> ready -> collected
ALTER TABLE `id_card_requests`
  MODIFY `status` ENUM('awaiting_payment','pending','processing','ready','collected') NOT NULL DEFAULT 'awaiting_payment',
  ADD COLUMN IF NOT EXISTS `account_type` ENUM('student','fresher') NOT NULL DEFAULT 'student' AFTER `fresher_id`,
  ADD COLUMN IF NOT EXISTS `payment_reference` VARCHAR(100) NULL DEFAULT NULL AFTER `fee_amount`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `id_card_requests`
  ADD KEY IF NOT EXISTS `idx_idreq_status` (`status`),
  ADD KEY IF NOT EXISTS `idx_idreq_ref` (`payment_reference`);
