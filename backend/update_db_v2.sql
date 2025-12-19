-- 为 user_vocabulary 的 created_at 添加索引，优化按日期查询
CREATE INDEX idx_user_vocabulary_created_at ON user_vocabulary(created_at);

-- 扩展 review_settings 表以支持更复杂的复习计划
-- 如果表不存在则创建（兼容逻辑）
CREATE TABLE IF NOT EXISTS `review_settings` (
    `setting_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL UNIQUE,
    `review_mode` VARCHAR(50) DEFAULT 'spaced', -- 'spaced', 'daily', 'custom'
    `custom_days` INT DEFAULT 7,
    `review_difficulty` VARCHAR(50) DEFAULT 'normal',
    `cards_per_session` INT DEFAULT 20,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 如果表已存在，尝试添加新字段
SET @dbname = DATABASE();
SET @tablename = 'review_settings';
SET @columnname = 'review_mode';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE review_settings ADD COLUMN review_mode VARCHAR(50) DEFAULT "spaced", ADD COLUMN custom_days INT DEFAULT 7'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;