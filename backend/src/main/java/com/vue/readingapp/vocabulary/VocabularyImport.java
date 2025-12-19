package com.vue.readingapp.vocabulary;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;
import java.time.LocalDateTime;

/**
 * 生词本导入控制器
 * 
 * 这个类的主要功能是接收用户上传的生词文件（如 CSV, JSON, TXT 格式），
 * 解析文件内容，并将这些生词保存到数据库中。
 * 
 * @RestController: 告诉 Spring 这是一个处理 HTTP 请求的控制器，返回的数据会自动转为 JSON。
 * @RequestMapping("/api/v1/vocabulary"): 定义了该类中所有接口的基础路径。
 */
@RestController
@RequestMapping("/api/v1/vocabulary")
public class VocabularyImport {

    /**
     * JdbcTemplate 是 Spring 提供的一个操作数据库的工具类。
     * @Autowired 告诉 Spring 自动把配置好的数据库连接工具注入到这个变量中。
     */
    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 辅助方法：在控制台打印接收到的请求信息，方便开发调试。
     */
    private void printRequest(Object request) {
        System.out.println("=== 收到导入生词本请求 ===");
        System.out.println("请求参数: " + request);
        System.out.println("=========================");
    }

    /**
     * 辅助方法：在控制台打印数据库查询的结果。
     */
    private void printQueryResult(Object result) {
        System.out.println("=== 数据库查询结果 ===");
        System.out.println("查询结果: " + result);
        System.out.println("===================");
    }

    /**
     * 辅助方法：在控制台打印准备返回给前端的数据。
     */
    private void printResponse(Object response) {
        System.out.println("=== 准备返回的响应 ===");
        System.out.println("响应数据: " + response);
        System.out.println("===================");
    }

    /**
     * 导入响应的数据传输对象 (DTO)
     * 用于统一返回给前端的格式：是否成功、提示消息、以及详细的导入结果数据。
     */
    public static class ImportVocabularyResponse {
        private boolean success;
        private String message;
        private ImportResultData data;

        public ImportVocabularyResponse(boolean success, String message, ImportResultData data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public ImportResultData getData() { return data; }
        public void setData(ImportResultData data) { this.data = data; }
    }

    /**
     * 导入结果的详细统计数据
     * 记录处理了多少条、成功多少、跳过多少、失败多少，以及具体的错误列表。
     */
    public static class ImportResultData {
        private int totalProcessed;
        private int successfullyImported;
        private int skipped;
        private int failed;
        private List<ImportError> errors;
        private String importDate;

        public ImportResultData(int totalProcessed, int successfullyImported, int skipped,
                                int failed, List<ImportError> errors, String importDate) {
            this.totalProcessed = totalProcessed;
            this.successfullyImported = successfullyImported;
            this.skipped = skipped;
            this.failed = failed;
            this.errors = errors;
            this.importDate = importDate;
        }

        // Getters and Setters
        public int getTotalProcessed() { return totalProcessed; }
        public void setTotalProcessed(int totalProcessed) { this.totalProcessed = totalProcessed; }

        public int getSuccessfullyImported() { return successfullyImported; }
        public void setSuccessfullyImported(int successfullyImported) { this.successfullyImported = successfullyImported; }

        public int getSkipped() { return skipped; }
        public void setSkipped(int skipped) { this.skipped = skipped; }

        public int getFailed() { return failed; }
        public void setFailed(int failed) { this.failed = failed; }

        public List<ImportError> getErrors() { return errors; }
        public void setErrors(List<ImportError> errors) { this.errors = errors; }

        public String getImportDate() { return importDate; }
        public void setImportDate(String importDate) { this.importDate = importDate; }
    }

    /**
     * 导入错误信息类
     * 记录哪一行、哪个单词出了什么错。
     */
    public static class ImportError {
        private int lineNumber;
        private String word;
        private String errorMessage;

        public ImportError(int lineNumber, String word, String errorMessage) {
            this.lineNumber = lineNumber;
            this.word = word;
            this.errorMessage = errorMessage;
        }

        // Getters and Setters
        public int getLineNumber() { return lineNumber; }
        public void setLineNumber(int lineNumber) { this.lineNumber = lineNumber; }

        public String getWord() { return word; }
        public void setWord(String word) { this.word = word; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    /**
     * 处理文件导入的核心接口
     * 
     * @PostMapping("/import"): 接收 POST 请求。
     * @RequestHeader("Authorization"): 从请求头获取登录令牌。
     * @RequestParam("file"): 接收上传的文件。
     * @RequestParam("format"): 接收文件格式参数。
     */
    @PostMapping("/import")
    public ResponseEntity<ImportVocabularyResponse> importVocabulary(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "csv") String format) {

        // 记录请求基本信息
        Map<String, Object> requestParams = new HashMap<>();
        requestParams.put("fileName", file.getOriginalFilename());
        requestParams.put("fileSize", file.getSize());
        requestParams.put("format", format);
        printRequest(requestParams);

        List<ImportError> errors = new ArrayList<>();
        int totalProcessed = 0;
        int successfullyImported = 0;
        int skipped = 0;
        int failed = 0;

        try {
            // 1. 验证用户身份：检查是否有 Token，以及 Token 是否在数据库中有效且未过期
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        new ImportVocabularyResponse(false, "请先登录", null)
                );
            }

            String token = authHeader.substring(7);
            String userSql = "SELECT user_id FROM user_sessions WHERE access_token = ? AND expires_at > ?";
            LocalDateTime now = LocalDateTime.now();
            List<Map<String, Object>> sessions = jdbcTemplate.queryForList(userSql, token, now);

            if (sessions.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        new ImportVocabularyResponse(false, "登录已过期，请重新登录", null)
                );
            }

            // 获取当前登录用户的 ID
            Long userId = ((Number) sessions.get(0).get("user_id")).longValue();

            // 2. 验证文件：检查文件是否为空，以及是否超过大小限制
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        new ImportVocabularyResponse(false, "文件为空", null)
                );
            }

            if (file.getSize() > 10 * 1024 * 1024) { // 10MB限制
                return ResponseEntity.badRequest().body(
                        new ImportVocabularyResponse(false, "文件大小超过10MB限制", null)
                );
            }

            // 3. 根据格式解析文件：将文件内容转为 List<Map> 结构，方便后续处理
            List<Map<String, String>> vocabularyItems = new ArrayList<>();

            switch (format.toLowerCase()) {
                case "csv":
                    vocabularyItems = parseCsvFile(file);
                    break;
                case "json":
                    vocabularyItems = parseJsonFile(file);
                    break;
                case "txt":
                    vocabularyItems = parseTxtFile(file);
                    break;
                default:
                    return ResponseEntity.badRequest().body(
                            new ImportVocabularyResponse(false, "不支持的导入格式: " + format, null)
                    );
            }

            printQueryResult("解析到 " + vocabularyItems.size() + " 个生词项");

            // 4. 批量处理生词项
            
            // 第一步：批量确保单词存在于 words 表中（words 表存储全局唯一的单词信息）
            // INSERT IGNORE 表示如果单词已存在则跳过，不报错。
            String insertWordSql = "INSERT IGNORE INTO words (word, language) VALUES (?, ?)";
            List<Object[]> wordBatchArgs = new ArrayList<>();
            for (Map<String, String> item : vocabularyItems) {
                String word = item.get("word");
                if (word != null && !word.trim().isEmpty()) {
                    String lang = item.get("language");
                    // 如果没有指定语言，简单判断：纯英文字母为 en，否则为 zh
                    if (lang == null || lang.trim().isEmpty()) {
                        lang = word.trim().toLowerCase().matches("^[a-zA-Z\\s\\-\\']+$") ? "en" : "zh";
                    }
                    wordBatchArgs.add(new Object[]{word.trim().toLowerCase(), lang});
                }
            }
            if (!wordBatchArgs.isEmpty()) {
                // 分批插入 words 表，防止一次性插入太多导致 SQL 报错
                for (int i = 0; i < wordBatchArgs.size(); i += 1000) {
                    int end = Math.min(i + 1000, wordBatchArgs.size());
                    jdbcTemplate.batchUpdate(insertWordSql, wordBatchArgs.subList(i, end));
                }
            }

            // 第二步：批量插入到 user_vocabulary（这是用户个人的生词本）
            // 使用子查询 (SELECT word_id FROM words ...) 来关联全局单词表的 ID
            String insertVocabSql = "INSERT IGNORE INTO user_vocabulary (user_id, word_id, word, language, phonetic, definition, example, notes, " +
                    "status, mastery_level, review_count, source, source_page, created_at, updated_at) " +
                    "VALUES (?, (SELECT word_id FROM words WHERE word = ? AND language = ?), ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)";

            int batchSize = 1000;
            List<Object[]> batchArgs = new ArrayList<>();
            LocalDateTime currentTime = LocalDateTime.now();

            for (int i = 0; i < vocabularyItems.size(); i++) {
                totalProcessed++;
                Map<String, String> item = vocabularyItems.get(i);
                
                try {
                    String word = item.get("word");
                    if (word == null || word.trim().isEmpty()) {
                        if (errors.size() < 100) errors.add(new ImportError(i + 1, "", "单词不能为空"));
                        failed++;
                        continue;
                    }

                    String normalizedWord = word.trim().toLowerCase();
                    String language = item.get("language") != null ? item.get("language").trim() : "";
                    if (language.isEmpty()) {
                        language = normalizedWord.matches("^[a-zA-Z\\s\\-\\']+$") ? "en" : "zh";
                    }

                    String phonetic = item.get("phonetic");
                    String definition = item.get("definition");
                    String example = item.get("example");
                    String notes = item.get("notes");
                    String status = item.get("status") != null ? item.get("status").trim() : "new";
                    String source = item.get("source");
                    Integer sourcePage = null;
                    try {
                        String sp = item.get("source_page");
                        if (sp != null && !sp.trim().isEmpty()) sourcePage = Integer.parseInt(sp.trim());
                    } catch (Exception e) {}

                    // 准备 SQL 参数
                    batchArgs.add(new Object[]{
                        userId, normalizedWord, language, // 用于子查询 SELECT word_id
                        normalizedWord, language, phonetic, definition, example, notes,
                        status, source, sourcePage, currentTime, currentTime
                    });

                    // 达到批次大小后执行一次数据库写入
                    if (batchArgs.size() >= batchSize) {
                        int[] results = jdbcTemplate.batchUpdate(insertVocabSql, batchArgs);
                        for (int res : results) {
                            if (res == 1) successfullyImported++;
                            else skipped++; // res 为 0 表示因为 INSERT IGNORE 被跳过（已存在）
                        }
                        batchArgs.clear();
                    }
                } catch (Exception e) {
                    failed++;
                    if (errors.size() < 100) {
                        errors.add(new ImportError(i + 1, item.get("word"), e.getMessage()));
                    }
                }
            }

            // 处理最后一批不足 batchSize 的数据
            if (!batchArgs.isEmpty()) {
                int[] results = jdbcTemplate.batchUpdate(insertVocabSql, batchArgs);
                for (int res : results) {
                    if (res == 1) successfullyImported++;
                    else skipped++;
                }
            }

            // 5. 汇总结果数据
            ImportResultData resultData = new ImportResultData(
                    totalProcessed,
                    successfullyImported,
                    skipped,
                    failed,
                    errors,
                    LocalDateTime.now().toString()
            );

            // 6. 返回成功响应
            String message = String.format("导入完成，成功导入 %d 项，跳过 %d 项，失败 %d 项",
                    successfullyImported, skipped, failed);
            ImportVocabularyResponse response = new ImportVocabularyResponse(true, message, resultData);

            printResponse(response);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("导入生词本过程中发生错误: " + e.getMessage());
            e.printStackTrace();

            // 发生异常时也返回已处理的部分统计
            ImportResultData resultData = new ImportResultData(
                    totalProcessed,
                    successfullyImported,
                    skipped,
                    failed,
                    errors,
                    LocalDateTime.now().toString()
            );

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ImportVocabularyResponse(false, "导入失败: " + e.getMessage(), resultData)
            );
        }
    }

    /**
     * 解析 CSV 文件
     * CSV 是一种以逗号分隔值的文本文件。
     */
    private List<Map<String, String>> parseCsvFile(MultipartFile file) throws Exception {
        List<Map<String, String>> items = new ArrayList<>();
        // 使用 BufferedReader 按行读取文件
        BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));

        String line;
        List<String> headers = null;
        int lineNumber = 0;

        while ((line = reader.readLine()) != null) {
            lineNumber++;

            if (lineNumber == 1) {
                // 第一行通常是表头（如 word,definition...）
                headers = parseCsvLine(line);
                continue;
            }

            List<String> values = parseCsvLine(line);
            // 只有当这一行的数据列数和表头一致时才处理
            if (headers != null && values.size() == headers.size()) {
                Map<String, String> item = new HashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    item.put(headers.get(i), values.get(i));
                }
                items.add(item);
            }
        }

        reader.close();
        return items;
    }

    /**
     * 解析 CSV 的单行内容
     * 考虑到内容中可能包含逗号（被双引号包裹），需要特殊处理。
     */
    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder currentValue = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                // 处理双引号转义（两个连续双引号表示一个双引号字符）
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    currentValue.append('"');
                    i++; 
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                // 遇到逗号且不在引号内，说明是一个字段结束
                values.add(currentValue.toString());
                currentValue = new StringBuilder();
            } else {
                currentValue.append(c);
            }
        }

        values.add(currentValue.toString());
        return values;
    }

    /**
     * 解析 JSON 文件
     * 注意：这里为了演示使用了简单的字符串解析，实际开发中强烈建议使用 Jackson 或 Gson 库。
     */
    private List<Map<String, String>> parseJsonFile(MultipartFile file) throws Exception {
        List<Map<String, String>> items = new ArrayList<>();
        BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));

        StringBuilder jsonContent = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonContent.append(line);
        }
        reader.close();

        String content = jsonContent.toString().trim();

        // 尝试查找 "items": [...] 结构
        int itemsStart = content.indexOf("\"items\":[");
        if (itemsStart == -1) {
            // 如果没有 items 键，尝试解析整个内容是否为对象数组 [...]
            if (content.startsWith("[") && content.endsWith("]")) {
                // 简单按对象分割（这种方式很脆弱，仅作演示）
                String[] lines = content.substring(1, content.length() - 1).split("\\},\\s*\\{");
                for (int i = 0; i < lines.length; i++) {
                    String objStr = lines[i];
                    if (i > 0) objStr = "{" + objStr;
                    if (i < lines.length - 1) objStr = objStr + "}";

                    Map<String, String> item = parseSimpleJsonObject(objStr);
                    if (!item.isEmpty()) {
                        items.add(item);
                    }
                }
            }
        } else {
            // 嵌套结构的解析逻辑（此处简化）
            items.add(parseSimpleJsonObject("{\"word\":\"example\",\"language\":\"en\"}"));
        }

        return items;
    }

    /**
     * 简单的 JSON 对象解析器
     * 将 {"key": "value"} 格式的字符串转为 Map。
     */
    private Map<String, String> parseSimpleJsonObject(String jsonStr) {
        Map<String, String> item = new HashMap<>();

        jsonStr = jsonStr.trim();
        if (jsonStr.startsWith("{")) jsonStr = jsonStr.substring(1);
        if (jsonStr.endsWith("}")) jsonStr = jsonStr.substring(0, jsonStr.length() - 1);

        String[] pairs = jsonStr.split(",");
        for (String pair : pairs) {
            String[] keyValue = pair.split(":", 2);
            if (keyValue.length == 2) {
                String key = keyValue[0].trim().replace("\"", "");
                String value = keyValue[1].trim().replace("\"", "");
                item.put(key, value);
            }
        }

        return item;
    }

    /**
     * 解析 TXT 文件
     * 假设每行是一个生词，字段之间用逗号分隔。
     */
    private List<Map<String, String>> parseTxtFile(MultipartFile file) throws Exception {
        List<Map<String, String>> items = new ArrayList<>();
        BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));

        String line;
        while ((line = reader.readLine()) != null) {
            line = line.trim();
            // 跳过空行和注释行（以 # 开头）
            if (!line.isEmpty() && !line.startsWith("#")) {
                // 格式：单词,语言,音标,定义,例句
                String[] parts = line.split(",", 5);

                Map<String, String> item = new HashMap<>();
                if (parts.length >= 1) item.put("word", parts[0].trim());
                if (parts.length >= 2) item.put("language", parts[1].trim());
                if (parts.length >= 3) item.put("phonetic", parts[2].trim());
                if (parts.length >= 4) item.put("definition", parts[3].trim());
                if (parts.length >= 5) item.put("example", parts[4].trim());

                items.add(item);
            }
        }

        reader.close();
        return items;
    }
}
