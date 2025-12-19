package com.vue.readingapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 阅记星 (Vue Reading App) 后端应用程序的主入口类
 * 
 * 这个类是整个 Spring Boot 项目的启动点。
 * 
 * @SpringBootApplication: 这是一个复合注解，包含了：
 *   - @Configuration: 标记这是一个配置类。
 *   - @EnableAutoConfiguration: 开启 Spring Boot 的自动配置机制。
 *   - @ComponentScan: 自动扫描并加载项目中的各种组件（如 Controller, Service 等）。
 * 
 * scanBasePackages: 明确指定了需要扫描的包路径，确保各个功能模块都能被 Spring 识别。
 */
@SpringBootApplication(scanBasePackages = {
    "com.vue.readingapp",
    "com.vue.readingapp.auth",
    "com.vue.readingapp.settings",
    "com.vue.readingapp.user",
    "com.vue.readingapp.documents",
    "com.vue.readingapp.notifications",
    "com.vue.readingapp.vocabulary",
    "com.vue.readingapp.review",
    "com.vue.readingapp.search",
    "com.vue.readingapp.ocr",
    "com.vue.readingapp.offline",
    "com.vue.readingapp.reader",
    "com.vue.readingapp.export",
    "com.vue.readingapp.feedback",
    "com.vue.readingapp.system",
    "com.vue.readingapp.tags",
    "com.vue.readingapp.scheduler"
})
@EntityScan(basePackages = "com.vue.readingapp")
@EnableJpaRepositories(basePackages = "com.vue.readingapp")
@EnableScheduling // 开启定时任务支持，例如用于定期清理过期 Token 或发送提醒
public class ReadingAppApplication {

    /**
     * Java 程序的标准 main 方法，作为程序的启动入口。
     */
    public static void main(String[] args) {
        // 在控制台打印启动信息，方便确认服务状态
        System.out.println("=== 阅记星后端服务启动中 ===");
        System.out.println("启动时间: " + java.time.LocalDateTime.now());
        System.out.println("===================================");

        // 启动 Spring Boot 应用
        SpringApplication.run(ReadingAppApplication.class, args);

        System.out.println("=== 阅记星后端服务已启动 ===");
        System.out.println("服务地址: http://localhost:8080");
        System.out.println("API前缀: /api");
        System.out.println("===================================");
    }
}
