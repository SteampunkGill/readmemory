-- 确保 users 表包含 preferences 和 privacy_settings 字段
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `preferences` JSON DEFAULT NULL AFTER `is_verified`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `privacy_settings` JSON DEFAULT NULL AFTER `preferences`;

-- 确保 users 表包含 bio, location, website 字段（如果之前 update_db.sql 执行失败）
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `bio` TEXT AFTER `avatar_url`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `location` VARCHAR(100) AFTER `bio`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `website` VARCHAR(255) AFTER `location`;