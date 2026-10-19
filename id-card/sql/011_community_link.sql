-- ============================================================================
-- 011_community_link.sql   (safe to re-run)
-- ----------------------------------------------------------------------------
-- The WhatsApp community members join from their portal. An admin can change it
-- later in Admin > Academic, so this only sets it when it has never been set.
-- ============================================================================
INSERT IGNORE INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`) VALUES
  ('whatsapp_community_link', 'https://chat.whatsapp.com/I0Bl1vQUE5yCK9hm2dxSfH', 'academic');
