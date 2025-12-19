package com.vue.readingapp.config;

import org.springframework.stereotype.Component;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * 全局请求日志过滤器
 * 
 * 这是一个拦截器，它会在每一个 HTTP 请求到达具体的控制器（Controller）之前运行。
 * 主要用于在控制台打印请求的基本信息，方便开发者监控 API 的调用情况。
 */
@Component
public class GlobalRequestLogFilter implements Filter {

    /**
     * 核心过滤逻辑
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        // 将通用的 ServletRequest 转换为更具体的 HttpServletRequest 以获取更多信息
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        // 获取请求的路径（如 /api/v1/auth/login）
        String url = httpRequest.getRequestURI();
        // 获取请求的方法（如 GET, POST）
        String method = httpRequest.getMethod();
        
        // 在控制台打印日志
        System.out.println(">>> [全局请求日志] " + method + " " + url);
        
        // 将请求传递给过滤链中的下一个环节（如果不调用此方法，请求将被拦截，无法到达 Controller）
        chain.doFilter(request, response);
    }
}