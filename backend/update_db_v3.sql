-- 为 user_vocabulary 添加更多词典字段
ALTER TABLE `user_vocabulary` ADD COLUMN `translation_pos` TEXT AFTER `definition`;
ALTER TABLE `user_vocabulary` ADD COLUMN `collins` TEXT AFTER `translation_pos`;
ALTER TABLE `user_vocabulary` ADD COLUMN `oxford` TEXT AFTER `collins`;
ALTER TABLE `user_vocabulary` ADD COLUMN `tag` TEXT AFTER `oxford`;
ALTER TABLE `user_vocabulary` ADD COLUMN `bnc` TEXT AFTER `tag`;
ALTER TABLE `user_vocabulary` ADD COLUMN `frq` INT DEFAULT NULL AFTER `bnc`;
ALTER TABLE `user_vocabulary` ADD COLUMN `exchange` TEXT AFTER `frq`;
ALTER TABLE `user_vocabulary` ADD COLUMN `detail` TEXT AFTER `exchange`;
ALTER TABLE `user_vocabulary` ADD COLUMN `audio` VARCHAR(255) AFTER `detail`;
ALTER TABLE `user_vocabulary` ADD COLUMN `metric` INT DEFAULT NULL AFTER `audio`;

-- 同时也为全局 words 表添加这些字段
ALTER TABLE `words` ADD COLUMN `translation_pos` TEXT AFTER `phonetic`;
ALTER TABLE `words` ADD COLUMN `collins` TEXT AFTER `translation_pos`;
ALTER TABLE `words` ADD COLUMN `oxford` TEXT AFTER `collins`;
ALTER TABLE `words` ADD COLUMN `tag` TEXT AFTER `oxford`;
ALTER TABLE `words` ADD COLUMN `bnc` TEXT AFTER `tag`;
ALTER TABLE `words` ADD COLUMN `frq` INT DEFAULT NULL AFTER `bnc`;
ALTER TABLE `words` ADD COLUMN `exchange` TEXT AFTER `frq`;
ALTER TABLE `words` ADD COLUMN `detail` TEXT AFTER `exchange`;
ALTER TABLE `words` ADD COLUMN `audio` VARCHAR(255) AFTER `detail`;
ALTER TABLE `words` ADD COLUMN `metric` INT DEFAULT NULL AFTER `audio`;