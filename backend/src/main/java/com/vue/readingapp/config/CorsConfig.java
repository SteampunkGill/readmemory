package com.vue.readingapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 跨域资源共享 (CORS) 配置类
 * 
 * 由于前端 (Vue) 和后端 (Spring Boot) 通常运行在不同的端口或域名下，
 * 浏览器出于安全考虑会限制跨域请求。这个配置类用于允许前端访问后端的接口。
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    /**
     * 配置跨域映射规则
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 允许所有路径 ("/**") 的跨域请求
        registry.addMapping("/**")
                // 允许来自任何源的请求（生产环境建议指定具体的域名）
                .allowedOriginPatterns("*")
                // 允许的 HTTP 请求方法
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // 允许的请求头
                .allowedHeaders("*")
                // 是否允许发送 Cookie 等凭证信息
                .allowCredentials(true)
                // 预检请求（OPTIONS）的缓存时间（秒）
                .maxAge(3600);
    }
}