-- 修复 document_processing_queue 表，添加缺失的字段
ALTER TABLE document_processing_queue 
ADD COLUMN IF NOT EXISTS error_message TEXT AFTER priority,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- 确保 status 字段长度足够
ALTER TABLE document_processing_queue 
MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';