// src/utils/error-handler.js
/**
 * 错误处理工具
 * 提供统一的错误处理、日志记录和用户反馈
 */

import { showError, showWarning, showInfo } from './notify';

/**
 * 错误类型枚举
 */
export const ErrorType = {
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  VALIDATION_ERROR: 'validation_error',
  AUTH_ERROR: 'auth_error',
  PERMISSION_ERROR: 'permission_error',
  NOT_FOUND_ERROR: 'not_found_error',
  TIMEOUT_ERROR: 'timeout_error',
  CLIENT_ERROR: 'client_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN_ERROR, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * 错误处理器配置
 */
const defaultConfig = {
  enableLogging: true,
  enableReporting: true,
  showUserMessages: true,
  logLevel: 'error',
  reportUrl: null,
  appName: 'EnglishLearningApp',
  appVersion: '1.0.0'
};

let config = { ...defaultConfig };

/**
 * 配置错误处理器
 * @param {Object} newConfig - 新配置
 */
export function configureErrorHandler(newConfig) {
  config = { ...config, ...newConfig };
}

/**
 * 创建错误对象
 * @param {Error|string} error - 原始错误或错误消息
 * @param {Object} context - 错误上下文
 * @returns {AppError} 标准化的错误对象
 */
export function createError(error, context = {}) {
  let errorType = ErrorType.UNKNOWN_ERROR;
  let message = '发生未知错误';
  let details = null;
  
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
    
    // 根据错误特征确定类型
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      errorType = ErrorType.NETWORK_ERROR;
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        errorType = ErrorType.AUTH_ERROR;
      } else if (status === 404) {
        errorType = ErrorType.NOT_FOUND_ERROR;
      } else if (status === 422) {
        errorType = ErrorType.VALIDATION_ERROR;
      } else if (status >= 500) {
        errorType = ErrorType.SERVER_ERROR;
      } else if (status >= 400) {
        errorType = ErrorType.CLIENT_ERROR;
      }
    }
    
    details = {
      name: error.name,
      stack: error.stack,
      ...context
    };
  }
  
  return new AppError(message, errorType, details);
}

/**
 * 处理错误
 * @param {Error|string} error - 错误对象或消息
 * @param {Object} options - 处理选项
 * @returns {Object} 处理结果
 */
export function handleError(error, options = {}) {
  const {
    showMessage = true,
    logError = true,
    reportError = true,
    userMessage = null,
    context = {},
    fallback = null
  } = options;
  
  // 创建标准化的错误对象
  const appError = createError(error, context);
  
  // 记录错误日志
  if (logError && config.enableLogging) {
    logErrorToConsole(appError);
  }
  
  // 上报错误
  if (reportError && config.enableReporting && config.reportUrl) {
    reportErrorToServer(appError);
  }
  
  // 显示用户消息
  if (showMessage && config.showUserMessages) {
    showErrorMessage(appError, userMessage);
  }
  
  // 返回处理结果
  return {
    error: appError,
    handled: true,
    fallback,
    timestamp: new Date().toISOString()
  };
}

/**
 * 记录错误到控制台
 * @param {AppError} error - 错误对象
 * @private
 */
function logErrorToConsole(error) {
  const logLevel = config.logLevel || 'error';
  
  const logEntry = {
    timestamp: error.timestamp,
    type: error.type,
    message: error.message,
    details: error.details,
    stack: error.stack
  };
  
  switch (logLevel) {
    case 'debug':
      console.debug('🔍 [DEBUG]', logEntry);
      break;
    case 'info':
      console.info('ℹ️ [INFO]', logEntry);
      break;
    case 'warn':
      console.warn('⚠️ [WARN]', logEntry);
      break;
    case 'error':
    default:
      console.error('❌ [ERROR]', logEntry);
      break;
  }
}

/**
 * 上报错误到服务器
 * @param {AppError} error - 错误对象
 * @private
 */
function reportErrorToServer(error) {
  if (!config.reportUrl) return;
  
  const reportData = {
    app: config.appName,
    version: config.appVersion,
    error: error.toJSON(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  // 使用sendBeacon或fetch上报
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(reportData)], { type: 'application/json' });
    navigator.sendBeacon(config.reportUrl, blob);
  } else {
    fetch(config.reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData),
      keepalive: true // 确保在页面卸载时也能发送
    }).catch(() => {
      // 静默失败
    });
  }
}

/**
 * 显示错误消息给用户
 * @param {AppError} error - 错误对象
 * @param {string} customMessage - 自定义消息
 * @private
 */
function showErrorMessage(error, customMessage = null) {
  let message = customMessage;
  
  if (!message) {
    // 根据错误类型显示不同的消息
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        message = '网络连接失败，请检查网络设置';
        break;
      case ErrorType.SERVER_ERROR:
        message = '服务器内部错误，请稍后重试';
        break;
      case ErrorType.VALIDATION_ERROR:
        message = '数据验证失败，请检查输入';
        break;
      case ErrorType.AUTH_ERROR:
        message = '请先登录';
        break;
      case ErrorType.PERMISSION_ERROR:
        message = '没有权限执行此操作';
        break;
      case ErrorType.NOT_FOUND_ERROR:
        message = '请求的资源不存在';
        break;
      case ErrorType.TIMEOUT_ERROR:
        message = '请求超时，请稍后重试';
        break;
      case ErrorType.CLIENT_ERROR:
        message = error.message || '操作失败';
        break;
      default:
        message = '发生未知错误，请稍后重试';
    }
  }
  
  // 显示通知
  showError(message);
}

/**
 * 包装异步函数，自动处理错误
 * @param {Function} asyncFn - 异步函数
 * @param {Object} options - 处理选项
 * @returns {Function} 包装后的函数
 */
export function withErrorHandling(asyncFn, options = {}) {
  return async function(...args) {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const result = handleError(error, options);
      
      // 如果有fallback，返回fallback值
      if (result.fallback !== undefined) {
        return result.fallback;
      }
      
      // 否则重新抛出错误
      throw result.error;
    }
  };
}

/**
 * 创建错误边界组件（React/Vue适用）
 * @param {Object} options - 配置选项
 * @returns {Object} 错误边界配置
 */
export function createErrorBoundary(options = {}) {
  const {
    onError = null,
    fallback = null,
    resetOnChange = []
  } = options;
  
  return {
    onError,
    fallback,
    resetOnChange,
    
    // React风格的错误边界
    componentDidCatch(error, errorInfo) {
      const appError = createError(error, { errorInfo });
      
      if (onError) {
        onError(appError);
      }
      
      handleError(appError, {
        showMessage: false,
        logError: true,
        reportError: true
      });
    },
    
    // Vue风格的错误处理
    errorCaptured(error, vm, info) {
      const appError = createError(error, { vm, info });
      
      if (onError) {
        onError(appError);
      }
      
      handleError(appError, {
        showMessage: false,
        logError: true,
        reportError: true
      });
      
      return false; // 阻止错误继续向上传播
    }
  };
}

/**
 * 验证错误处理
 * @param {Object} validationResult - 验证结果
 * @param {Object} options - 处理选项
 * @returns {Object} 处理结果
 */
export function handleValidationError(validationResult, options = {}) {
  const {
    showFirstError = true,
    showAllErrors = false,
    fieldLabels = {}
  } = options;
  
  if (validationResult.isValid) {
    return { isValid: true, errors: [] };
  }
  
  const errors = validationResult.errors;
  
  // 显示错误消息
  if (showFirstError && errors.length > 0) {
    const firstError = errors[0];
    const fieldName = fieldLabels[firstError.field] || firstError.field;
    const message = firstError.message.replace(
      `字段 ${firstError.field}`,
      fieldName
    );
    
    showError(message);
  }
  
  if (showAllErrors) {
    errors.forEach(error => {
      const fieldName = fieldLabels[error.field] || error.field;
      const message = error.message.replace(
        `字段 ${error.field}`,
        fieldName
      );
      
      showError(message);
    });
  }
  
  return {
    isValid: false,
    errors,
    message: errors.length > 0 ? errors[0].message : '验证失败'
  };
}

/**
 * 网络错误处理
 * @param {Error} error - 网络错误
 * @param {Object} options - 处理选项
 * @returns {Object} 处理结果
 */
export function handleNetworkError(error, options = {}) {
  const {
    retryCount = 3,
    retryDelay = 1000,
    onRetry = null
  } = options;
  
  const appError = createError(error);
  appError.type = ErrorType.NETWORK_ERROR;
  
  // 显示网络错误消息
  showErrorMessage(appError, '网络连接失败，请检查网络设置');
  
  // 重试逻辑
  const retry = async (fn, count = retryCount) => {
    for (let i = 0; i < count; i++) {
      try {
        if (onRetry) onRetry(i + 1, count);
        
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * (i + 1))
        );
        
        return await fn();
      } catch (retryError) {
        if (i === count - 1) {
          throw retryError;
        }
      }
    }
  };
  
  return {
    error: appError,
    retry,
    handled: true
  };
}

/**
 * 认证错误处理
 * @param {Error} error - 认证错误
 * @param {Object} options - 处理选项
 * @returns {Object} 处理结果
 */
export function handleAuthError(error, options = {}) {
  const {
    redirectToLogin = true,
    loginUrl = '/login',
    clearToken = true
  } = options;
  
  const appError = createError(error);
  appError.type = ErrorType.AUTH_ERROR;
  
  // 清除认证token
  if (clearToken) {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
  
  // 显示认证错误消息
  showErrorMessage(appError, '登录已过期，请重新登录');
  
  // 重定向到登录页
  if (redirectToLogin) {
    setTimeout(() => {
      window.location.href = loginUrl + '?redirect=' + encodeURIComponent(window.location.pathname);
    }, 1500);
  }
  
  return {
    error: appError,
    redirectToLogin,
    handled: true
  };
}

/**
 * 全局错误监听器
 */
export function setupGlobalErrorHandlers() {
  // 全局未捕获的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    
    handleError(event.reason, {
      showMessage: true,
      logError: true,
      reportError: true,
      context: { type: 'unhandledrejection' }
    });
  });
  
  // 全局JavaScript错误
  window.addEventListener('error', (event) => {
    event.preventDefault();
    
    const error = new Error(event.message);
    error.filename = event.filename;
    error.lineno = event.lineno;
    error.colno = event.colno;
    
    handleError(error, {
      showMessage: false, // 避免重复显示
      logError: true,
      reportError: true,
      context: { type: 'global_error' }
    });
  });
  
  // Vue错误处理
  if (window.Vue) {
    window.Vue.config.errorHandler = (error, vm, info) => {
      handleError(error, {
        showMessage: true,
        logError: true,
        reportError: true,
        context: { vm, info, type: 'vue_error' }
      });
    };
  }
  
  console.log('✅ 全局错误处理器已设置');
}

/**
 * 获取错误统计
 * @returns {Object} 错误统计信息
 */
export function getErrorStats() {
  const stats = JSON.parse(localStorage.getItem('error_stats') || '{}');
  
  return {
    totalErrors: stats.totalErrors || 0,
    lastError: stats.lastError || null,
    errorTypes: stats.errorTypes || {},
    ...stats
  };
}

/**
 * 清除错误统计
 */
export function clearErrorStats() {
  localStorage.removeItem('error_stats');
}

/**
 * 错误恢复策略
 * @param {Function} operation - 要执行的操作
 * @param {Object} strategies - 恢复策略
 * @returns {Promise<any>} 操作结果
 */
export async function withRecovery(operation, strategies = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackValue = null,
    shouldRetry = null,
    onRetry = null,
    onFallback = null
  } = strategies;
  
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0 && onRetry) {
        onRetry(attempt, maxRetries, lastError);
      }
      
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 检查是否应该重试
      if (attempt < maxRetries && (!shouldRetry || shouldRetry(error))) {
        continue;
      }
      
      // 使用fallback值
      if (fallbackValue !== undefined) {
        if (onFallback) {
          onFallback(error, fallbackValue);
        }
        
        return fallbackValue;
      }
      
      throw error;
    }
  }
}

export default {
  ErrorType,
  AppError,
  configureErrorHandler,
  createError,
  handleError,
  withErrorHandling,
  createErrorBoundary,
  handleValidationError,
  handleNetworkError,
  handleAuthError,
  setupGlobalErrorHandlers,
  getErrorStats,
  clearErrorStats,
  withRecovery
};