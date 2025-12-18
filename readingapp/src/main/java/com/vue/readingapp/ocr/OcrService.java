package com.vue.readingapp.ocr;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class OcrService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean processDocument(Integer documentId) {
        // 假设我们只处理第一页作为示例
        Integer page = 1;
        String taskId = "ocr_task_" + UUID.randomUUID().toString().substring(0, 8);
        LocalDateTime now = LocalDateTime.now();

        // 异步执行OCR处理
        new Thread(() -> {
            try {
                // 1. 检查并创建 ocr_tasks 表 (如果不存在)
                ensureOcrTasksTableExists();

                // 2. 插入 OCR 任务记录
                String insertTaskSql = "INSERT INTO ocr_tasks (task_id, document_id, page_number, status, progress, options_json, estimated_time, started_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(insertTaskSql, taskId, documentId, page, "processing", 0, "{}", 30, now, now, now);

                System.out.println("INFO: Started OCR processing for document_id: " + documentId);

                // 确保 documents 表包含必要的 OCR 列
                ensureDocumentsColumnsExist();

                // 3. 模拟OCR处理过程
                Thread.sleep(5000); // 模拟5秒处理时间

                // 4. 生成模拟的OCR结果
                Map<String, Object> ocrResultMap = new HashMap<>();
                ocrResultMap.put("text", "这是文档 " + documentId + " 的自动OCR识别文本内容。\n模拟处理完成。");
                ocrResultMap.put("confidence", 95.0);
                String resultJson = objectMapper.writeValueAsString(ocrResultMap);

                // 5. 更新任务状态为完成，并保存结果
                String completeTaskSql = "UPDATE ocr_tasks SET status = 'completed', progress = 100, result_json = ?, completed_at = ?, updated_at = ? WHERE task_id = ?";
                jdbcTemplate.update(completeTaskSql, resultJson, LocalDateTime.now(), LocalDateTime.now(), taskId);

                System.out.println("INFO: Completed OCR processing for document_id: " + documentId);

                // 6. 更新文档表的状态
                String updateDocSql = "UPDATE documents SET is_processed = 1, processing_status = 'completed', processing_progress = 100, processing_completed_at = ? WHERE document_id = ?";
                jdbcTemplate.update(updateDocSql, LocalDateTime.now(), documentId);

                // 7. (可选) 将结果保存到 document_ocr_results 表
                saveOcrResultToDatabase(documentId, page, ocrResultMap);

            } catch (Exception e) {
                System.err.println("ERROR: OCR processing failed for document_id: " + documentId + " - " + e.getMessage());
                e.printStackTrace();

                // 更新任务为失败状态
                String failTaskSql = "UPDATE ocr_tasks SET status = 'failed', error_message = ?, updated_at = ? WHERE task_id = ?";
                jdbcTemplate.update(failTaskSql, e.getMessage(), LocalDateTime.now(), taskId);

                // 更新文档表的状态
                String updateDocSql = "UPDATE documents SET processing_status = 'failed', processing_error = ? WHERE document_id = ?";
                jdbcTemplate.update(updateDocSql, e.getMessage(), documentId);
            }
        }).start();
        return false;
    }

    private void ensureDocumentsColumnsExist() {
        try {
            String[] columns = {
                "is_processed TINYINT(1) DEFAULT 0",
                "processing_status VARCHAR(50) DEFAULT 'pending'",
                "processing_progress INT(11) DEFAULT 0",
                "processing_error TEXT",
                "processing_started_at TIMESTAMP NULL DEFAULT NULL",
                "processing_completed_at TIMESTAMP NULL DEFAULT NULL"
            };

            for (String colDef : columns) {
                String colName = colDef.split(" ")[0];
                try {
                    String checkColSql = "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'documents' AND column_name = ?";
                    Integer count = jdbcTemplate.queryForObject(checkColSql, Integer.class, colName);
                    if (count == null || count == 0) {
                        String addColSql = "ALTER TABLE documents ADD COLUMN " + colDef;
                        jdbcTemplate.execute(addColSql);
                        System.out.println("INFO: Added missing column '" + colName + "' to 'documents' table.");
                    }
                } catch (Exception e) {
                    System.err.println("ERROR: Failed to add column '" + colName + "': " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to ensure documents columns exist: " + e.getMessage());
        }
    }

    private void ensureOcrTasksTableExists() {
        try {
            String checkTaskTableSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ocr_tasks'";
            Integer taskTableCount = jdbcTemplate.queryForObject(checkTaskTableSql, Integer.class);

            if (taskTableCount == null || taskTableCount == 0) {
                String createTaskTableSql = "CREATE TABLE ocr_tasks (" +
                        "task_id VARCHAR(50) PRIMARY KEY," +
                        "document_id INT NOT NULL," +
                        "page_number INT," +
                        "status VARCHAR(20) NOT NULL," +
                        "progress INT DEFAULT 0," +
                        "options_json TEXT," +
                        "result_json TEXT," +
                        "error_message TEXT," +
                        "estimated_time INT," +
                        "started_at TIMESTAMP," +
                        "completed_at TIMESTAMP," +
                        "created_at TIMESTAMP," +
                        "updated_at TIMESTAMP" +
                        ")";
                jdbcTemplate.execute(createTaskTableSql);
                System.out.println("INFO: Created 'ocr_tasks' table.");
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to check/create ocr_tasks table: " + e.getMessage());
        }
    }

    private void saveOcrResultToDatabase(Integer documentId, Integer page, Map<String, Object> ocrResultMap) {
        try {
            String ocrResultId = "ocr_" + UUID.randomUUID().toString().substring(0, 8);
            LocalDateTime now = LocalDateTime.now();

            // 检查表是否存在
            String checkTableSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'document_ocr_results'";
            Integer tableCount = jdbcTemplate.queryForObject(checkTableSql, Integer.class);

            if (tableCount == null || tableCount == 0) {
                // 创建表
                String createTableSql = "CREATE TABLE document_ocr_results (" +
                        "ocr_id VARCHAR(50) PRIMARY KEY," +
                        "document_id INT NOT NULL," +
                        "page_number INT NOT NULL," +
                        "ocr_text TEXT," +
                        "confidence DOUBLE," +
                        "created_at TIMESTAMP," +
                        "updated_at TIMESTAMP" +
                        ")";
                jdbcTemplate.execute(createTableSql);
                System.out.println("INFO: Created 'document_ocr_results' table.");
            }

            String insertSql = "INSERT INTO document_ocr_results (ocr_id, document_id, page_number, ocr_text, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(insertSql,
                    ocrResultId,
                    documentId,
                    page,
                    ocrResultMap.get("text"),
                    ocrResultMap.get("confidence"),
                    now,
                    now
            );
            System.out.println("INFO: OCR result saved to document_ocr_results for document_id: " + documentId);
        } catch (Exception e) {
            System.err.println("ERROR: Failed to save OCR result to database for document_id: " + documentId + " - " + e.getMessage());
        }
    }
}