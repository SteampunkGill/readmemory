-- 补全 users 表缺失的字段
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `bio` TEXT AFTER `avatar_url`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `location` VARCHAR(100) AFTER `bio`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `website` VARCHAR(255) AFTER `location`;

-- 确保 daily_learning_stats 表的字段名与代码/设计一致
ALTER TABLE `daily_learning_stats` CHANGE COLUMN `learning_date` `date` DATE NOT NULL;
ALTER TABLE `daily_learning_stats` CHANGE COLUMN `total_study_time` `reading_time` INT(11) DEFAULT 0;
ALTER TABLE `daily_learning_stats` ADD COLUMN IF NOT EXISTS `documents_read` INT(11) DEFAULT 0 AFTER `date`;
ALTER TABLE `daily_learning_stats` ADD COLUMN IF NOT EXISTS `pages_read` INT(11) DEFAULT 0 AFTER `documents_read`;

-- 针对 UserGetActivityLog 之前的报错，如果需要 reading_history 兼容活动日志字段（不推荐，建议使用我修改后的代码逻辑）
-- 但如果一定要添加字段：
-- ALTER TABLE `reading_history` ADD COLUMN IF NOT EXISTS `type` VARCHAR(50) AFTER `document_id`;
-- ALTER TABLE `reading_history` ADD COLUMN IF NOT EXISTS `action` VARCHAR(50) AFTER `type`;
-- ALTER TABLE `reading_history` ADD COLUMN IF NOT EXISTS `target_type` VARCHAR(50) AFTER `action`;
-- ALTER TABLE `reading_history` ADD COLUMN IF NOT EXISTS `target_id` INT AFTER `target_type`;
-- ALTER TABLE `reading_history` ADD COLUMN IF NOT EXISTS `target_name` VARCHAR(255) AFTER `target_id`;
-- ALTER TABLE `reading_history` ADD COLUMN IF NOT EXISTS `details` JSON AFTER `target_name`;

-- 修复可能缺失的索引以提高性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(access_token);

-- 为 user_vocabulary 增加音标字段
ALTER TABLE `user_vocabulary` ADD COLUMN IF NOT EXISTS `phonetic` VARCHAR(255) AFTER `language`;