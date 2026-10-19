-- ============================================================================
-- 012_class_group_link.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- WhatsApp class groups, one per level (keys whatsapp_class_link_100 .. _400).
-- Right now only 200 level has one. Admin > Academic can set the others, so this
-- only sets 200 level when it has never been set.
-- ============================================================================
INSERT IGNORE INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('whatsapp_class_link_200', 'https://chat.whatsapp.com/JIAHGDA390i8IVcdJ7fCS4?s=cl&p=a&mlu=0', 'academic');
