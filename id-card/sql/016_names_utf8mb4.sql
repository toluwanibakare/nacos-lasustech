-- ============================================================================
-- 016_names_utf8mb4.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- `students` and `id_card_requests` were created as latin1, but `freshers` is
-- utf8mb4. A fresher whose name has a letter latin1 cannot store (for example
-- the dot-below vowels in Yoruba names, such as o, e or s with a dot) could not
-- be copied into `students` when they updated their matric number: the portal
-- said it could not save the matric number. The same letters would also fail
-- in an ID card application.
-- This converts both tables to utf8mb4 (the same collation `freshers` uses).
-- Existing text is kept exactly as it is; latin1 is a subset of utf8mb4.
-- ============================================================================
ALTER TABLE `students` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `id_card_requests` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
