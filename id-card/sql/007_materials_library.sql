-- ============================================================================
-- 007_materials_library.sql   (run after 001 and 006; safe to re-run)
-- ----------------------------------------------------------------------------
-- Course materials become two things:
--   FREE library files   kind = notes | pdf | past_questions   (a file is uploaded, price 0)
--   PAID items           kind = manual | workbook | textbook   (no file; students pay, then
--                                                              collect it from the HOC)
-- and the HOC can mark each payment as "received" (collected) to keep a collection list.
-- ============================================================================

ALTER TABLE `hoc_items`
  ADD COLUMN IF NOT EXISTS `kind` ENUM('notes','pdf','past_questions','manual','workbook','textbook') NOT NULL DEFAULT 'workbook' AFTER `department`,
  ADD COLUMN IF NOT EXISTS `file_path` VARCHAR(255) NULL DEFAULT NULL AFTER `description`,
  ADD COLUMN IF NOT EXISTS `file_name` VARCHAR(255) NULL DEFAULT NULL AFTER `file_path`,
  ADD COLUMN IF NOT EXISTS `file_size` INT UNSIGNED NULL DEFAULT NULL AFTER `file_name`,
  ADD COLUMN IF NOT EXISTS `file_type` VARCHAR(120) NULL DEFAULT NULL AFTER `file_size`;

ALTER TABLE `hoc_items`
  ADD KEY IF NOT EXISTS `idx_hoc_items_class_kind` (`level`, `department`, `kind`, `status`);

-- Collection tracking: when the HOC hands the item over they mark the payment as received.
ALTER TABLE `payments`
  ADD COLUMN IF NOT EXISTS `received_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `received_by` VARCHAR(160) NULL DEFAULT NULL;
