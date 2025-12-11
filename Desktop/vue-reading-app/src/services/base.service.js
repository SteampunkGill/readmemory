// src/services/base.service.js

import { showError, showSuccess, showWarning, showInfo } from '@/utils/notify';
import { formatDate, formatTime, formatDateTime } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';
import { throttle } from '@/utils/throttle';

// 临时验证函数，后续会迁移到validator.js
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (value) => {
  return value !== undefined && value !== null && value !== '';
};

/**
 * 基础服务类
 * 提供所有服务共用的功能：缓存管理、错误处理、API调用、数据验证等
 */
class BaseService {
  constructor(serviceName, options = {}) {
    // 1. 基础配置
    this.serviceName = serviceName;
    this.options = {
      cacheEnabled: true,
      cacheExpiry: 30 * 60 * 1000, // 30分钟
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000,
      maxCacheSize: 100, // 最大缓存条目数
      enableLogging: process.env.NODE_ENV !== 'production',
      enableMetrics: true,
      ...options
    };
    
    // 2. 缓存系统
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now()
    };
    
    // 3. 请求管理
    this.requestQueue = new Map();
    this.pendingRequests = new Set();
    this.concurrentRequests = 0;
    this.maxConcurrentRequests = 5;
    
    // 4. 状态跟踪
    this.isInitialized = false;
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
    
    // 5. 初始化
    this._initEventListeners();
    this._setupCacheCleanup();
    
    this._log('info', `服务 ${serviceName} 已创建`);
  }
  
  // ==================== 公共方法 ====================
  
  /**
   * 初始化服务
   * @param {Object} config - 配置对象
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize(config = {}) {
    try {
      if (this.isInitialized) {
        this._log('info', '服务已经初始化');
        return true;
      }
      
      // 合并配置
      this.options = { ...this.options, ...config };
      
      // 初始化缓存
      await this._initCache();
      
      // 标记为已初始化
      this.isInitialized = true;
      this.lastSyncTime = Date.now();
      
      this._log('info', '服务初始化完成');
      return true;
    } catch (error) {
      this._log('error', '服务初始化失败', error);
      throw error;
    }
  }
  
  /**
   * 统一的API调用方法
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Promise<any>} 响应数据
   */
  async callApi(endpoint, options = {}) {
    const requestId = `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // 1. 检查网络状态
      if (!this.isOnline) {
        throw new Error('网络连接不可用，请检查网络设置');
      }
      
      // 2. 并发控制
      await this._waitForSlot(requestId);
      
      // 3. 构建请求配置
      const requestOptions = this._buildRequestOptions(endpoint, options);
      
      // 4. 发送请求
      const response = await this._sendRequest(requestOptions);
      
      // 5. 处理响应
      const processedData = await this._processResponse(response, options);
      
      // 6. 更新指标
      this._updateMetrics(true, Date.now() - startTime);
      
      // 7. 记录成功日志
      this._log('info', `API调用成功: ${endpoint}`, {
        method: requestOptions.method,
        duration: Date.now() - startTime
      });
      
      return processedData;
    } catch (error) {
      // 8. 错误处理
      const handledError = await this.handleError(error, {
        endpoint,
        requestId,
        options,
        duration: Date.now() - startTime
      });
      
      // 9. 更新指标
      this._updateMetrics(false, Date.now() - startTime);
      
      throw handledError;
    } finally {
      // 10. 清理请求队列
      this._releaseSlot(requestId);
    }
  }
  
  /**
   * 获取缓存数据
   * @param {string|Object} key - 缓存键
   * @param {Object} options - 选项
   * @returns {Promise<any|null>} 缓存数据或null
   */
  async getCachedData(key, options = {}) {
    const cacheKey = this._generateCacheKey(key, options);
    
    // 检查缓存是否启用
    if (!this.options.cacheEnabled) {
      this.cacheStats.misses++;
      return null;
    }
    
    // 获取缓存
    const cachedItem = this.cache.get(cacheKey);
    
    if (!cachedItem) {
      this.cacheStats.misses++;
      return null;
    }
    
    // 检查缓存是否过期
    if (!this._isCacheValid(cachedItem)) {
      this.cache.delete(cacheKey);
      this.cacheStats.misses++;
      return null;
    }
    
    // 更新缓存命中统计
    this.cacheStats.hits++;
    
    // 更新访问时间
    cachedItem.lastAccessed = Date.now();
    this.cache.set(cacheKey, cachedItem);
    
    this._log('debug', `缓存命中: ${cacheKey}`);
    return cachedItem.data;
  }
  
  /**
   * 设置缓存数据
   * @param {string|Object} key - 缓存键
   * @param {any} data - 要缓存的数据
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} 是否成功
   */
  async setCachedData(key, data, options = {}) {
    const cacheKey = this._generateCacheKey(key, options);
    const expiry = options.expiry || this.options.cacheExpiry;
    
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiry,
      lastAccessed: Date.now(),
      metadata: options.metadata || {}
    };
    
    // 设置缓存
    this.cache.set(cacheKey, cacheItem);
    
    // 更新缓存大小统计
    this.cacheStats.size = this.cache.size;
    
    // 检查是否需要清理
    if (this.cache.size > this.options.maxCacheSize) {
      this._cleanupCache();
    }
    
    this._log('debug', `缓存设置: ${cacheKey}`);
    return true;
  }
  
  /**
   * 清除缓存
   * @param {string|null} pattern - 匹配模式，为null时清除所有
   * @returns {Promise<boolean>} 是否成功
   */
  async clearCache(pattern = null) {
    if (!pattern) {
      // 清除所有缓存
      this.cache.clear();
      this.cacheStats.size = 0;
      this._log('info', '所有缓存已清除');
    } else {
      // 清除匹配模式的缓存
      let clearedCount = 0;
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          clearedCount++;
        }
      }
      this.cacheStats.size = this.cache.size;
      this._log('info', `清除了 ${clearedCount} 个匹配模式 "${pattern}" 的缓存项`);
    }
    
    return true;
  }
  
  /**
   * 错误处理
   * @param {Error} error - 原始错误
   * @param {Object} context - 错误上下文
   * @returns {Promise<Object>} 处理后的错误信息
   */
  async handleError(error, context = {}) {
    const errorInfo = {
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      context,
      originalError: error
    };
    
    // 错误分类
    let errorType = 'unknown';
    let userMessage = '操作失败，请稍后重试';
    let shouldRetry = false;
    let retryAfter = null;
    
    if (error.response) {
      // 服务器响应错误
      const status = error.response.status;
      
      switch (status) {
        case 400:
          errorType = 'bad_request';
          userMessage = error.response.data?.message || '请求参数错误';
          break;
        case 401:
          errorType = 'unauthorized';
          userMessage = '请先登录';
          // 触发重新登录
          this._triggerReauth();
          break;
        case 403:
          errorType = 'forbidden';
          userMessage = '没有权限执行此操作';
          break;
        case 404:
          errorType = 'not_found';
          userMessage = '请求的资源不存在';
          break;
        case 409:
          errorType = 'conflict';
          userMessage = '数据冲突，请检查后重试';
          break;
        case 422:
          errorType = 'validation_error';
          userMessage = '数据验证失败';
          break;
        case 429:
          errorType = 'rate_limit';
          userMessage = '请求过于频繁，请稍后重试';
          shouldRetry = true;
          retryAfter = error.response.headers['retry-after'] || 60;
          break;
        case 500:
          errorType = 'server_error';
          userMessage = '服务器内部错误';
          shouldRetry = true;
          break;
        case 502:
        case 503:
        case 504:
          errorType = 'service_unavailable';
          userMessage = '服务暂时不可用';
          shouldRetry = true;
          break;
        default:
          errorType = 'server_error';
          userMessage = `服务器错误: ${status}`;
      }
    } else if (error.request) {
      // 请求发送但无响应
      errorType = 'network_error';
      userMessage = '网络连接失败，请检查网络设置';
      shouldRetry = true;
    } else if (error.message === 'Network Error') {
      // 网络错误
      errorType = 'network_error';
      userMessage = '网络连接失败，请检查网络设置';
      shouldRetry = true;
    } else if (error.name === 'AbortError') {
      // 请求被取消
      errorType = 'aborted';
      userMessage = '请求已取消';
    } else if (error.message === '网络连接不可用，请检查网络设置') {
      // 离线错误
      errorType = 'offline';
      userMessage = '网络连接不可用，请检查网络设置';
      shouldRetry = true;
    } else {
      // 其他错误
      errorType = 'client_error';
      userMessage = error.message || '操作失败';
    }
    
    // 记录错误日志
    this._log('error', `错误类型: ${errorType}`, {
      message: error.message,
      stack: error.stack,
      context,
      userMessage
    });
    
    // 显示用户友好的错误提示
    if (this.options.enableLogging && userMessage) {
      // 根据错误类型显示不同的通知
      switch (errorType) {
        case 'unauthorized':
          showWarning(userMessage);
          break;
        case 'network_error':
        case 'offline':
          showError(userMessage, { timeout: 5000 });
          break;
        case 'rate_limit':
          showWarning(userMessage);
          break;
        default:
          showError(userMessage);
      }
    }
    
    // 返回处理后的错误
    return {
      type: errorType,
      message: userMessage,
      originalError: error,
      shouldRetry,
      retryAfter,
      context
    };
  }
  
  /**
   * 数据验证
   * @param {Object} data - 要验证的数据
   * @param {Object} schema - 验证模式
   * @returns {Promise<Object>} 验证结果
   */
  async validateData(data, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const { type, message, ...ruleOptions } = rule;
        
        let isValid = true;
        
        switch (type) {
          case 'required':
            isValid = validateRequired(value);
            break;
          case 'email':
            isValid = validateEmail(value);
            break;
          case 'password':
            isValid = validatePassword(value);
            break;
          case 'minLength':
            isValid = value && value.length >= ruleOptions.min;
            break;
          case 'maxLength':
            isValid = value && value.length <= ruleOptions.max;
            break;
          case 'min':
            isValid = value >= ruleOptions.min;
            break;
          case 'max':
            isValid = value <= ruleOptions.max;
            break;
          case 'pattern':
            isValid = new RegExp(ruleOptions.pattern).test(value);
            break;
          case 'custom':
            isValid = ruleOptions.validator ? ruleOptions.validator(value, data) : true;
            break;
          default:
            this._log('warn', `未知的验证规则类型: ${type}`);
        }
        
        if (!isValid) {
          errors.push({
            field,
            message: message || `字段 ${field} 验证失败`,
            rule: type,
            value
          });
          break; // 一个字段一个错误
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  }
  
  /**
   * 批量处理数据
   * @param {Array} items - 数据项数组
   * @param {Function} processor - 处理函数
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 处理结果
   */
  async batchProcess(items, processor, options = {}) {
    const {
      batchSize = 10,
      delay = 100,
      stopOnError = false
    } = options;
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(item => processor(item))
        );
        results.push(...batchResults);
        
        // 批次间延迟
        if (i + batchSize < items.length && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        errors.push({
          batchIndex: Math.floor(i / batchSize),
          error: error.message
        });
        
        if (stopOnError) {
          throw error;
        }
      }
    }
    
    return {
      results,
      errors,
      total: items.length,
      successful: results.length,
      failed: errors.length
    };
  }
  
  // ==================== 私有方法 ====================
  
  /**
   * 初始化事件监听
   * @private
   */
  _initEventListeners() {
    // 网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      this._onNetworkChange('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this._onNetworkChange('offline');
    });
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this._onAppVisibilityChange(document.visibilityState);
    });
    
    // 存储事件（跨标签页同步）
    window.addEventListener('storage', (event) => {
      this._onStorageChange(event);
    });
    
    this._log('debug', '事件监听器已初始化');
  }
  
  /**
   * 设置缓存清理定时器
   * @private
   */
  _setupCacheCleanup() {
    // 每5分钟清理一次过期缓存
    this.cacheCleanupInterval = setInterval(() => {
      this._cleanupCache();
    }, 5 * 60 * 1000);
    
    this._log('debug', '缓存清理定时器已设置');
  }
  
  /**
   * 初始化缓存
   * @private
   * @returns {Promise<void>}
   */
  async _initCache() {
    try {
      // 尝试从localStorage加载持久化缓存
      const savedCache = localStorage.getItem(`${this.serviceName}_cache`);
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        const now = Date.now();
        
        // 只加载未过期的缓存
        for (const [key, item] of Object.entries(parsedCache)) {
          if (now - item.timestamp < item.expiry) {
            this.cache.set(key, item);
          }
        }
        
        this.cacheStats.size = this.cache.size;
        this._log('info', `从持久化存储加载了 ${this.cache.size} 个缓存项`);
      }
    } catch (error) {
      this._log('warn', '加载持久化缓存失败', error);
    }
    
    // 设置缓存保存定时器
    this.cacheSaveInterval = setInterval(() => {
      this._saveCacheToStorage();
    }, 60 * 1000); // 每分钟保存一次
    
    this._log('info', '缓存系统初始化完成');
  }
  
  /**
   * 保存缓存到持久化存储
   * @private
   */
  _saveCacheToStorage() {
    try {
      const cacheObj = {};
      for (const [key, item] of this.cache.entries()) {
        cacheObj[key] = item;
      }
      
      localStorage.setItem(`${this.serviceName}_cache`, JSON.stringify(cacheObj));
    } catch (error) {
      this._log('warn', '保存缓存到持久化存储失败', error);
    }
  }
  
  /**
   * 等待请求槽位
   * @private
   * @param {string} requestId - 请求ID
   * @returns {Promise<void>}
   */
  async _waitForSlot(requestId) {
    this.pendingRequests.add(requestId);
    
    while (this.concurrentRequests >= this.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.concurrentRequests++;
    this._log('debug', `请求 ${requestId} 获得槽位，当前并发: ${this.concurrentRequests}`);
  }
  
  /**
   * 释放请求槽位
   * @private
   * @param {string} requestId - 请求ID
   */
  _releaseSlot(requestId) {
    this.concurrentRequests = Math.max(0, this.concurrentRequests - 1);
    this.pendingRequests.delete(requestId);
    
    this._log('debug', `请求 ${requestId} 释放槽位，当前并发: ${this.concurrentRequests}`);
  }
  
  /**
   * 构建请求选项
   * @private
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @returns {Object} 构建后的请求选项
   */
  _buildRequestOptions(endpoint, options) {
    // 获取认证token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': this.serviceName,
        'X-Request-ID': `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      timeout: this.options.timeout,
      retryCount: this.options.retryCount,
      retryDelay: this.options.retryDelay
    };
    
    // 添加认证头
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 处理请求体
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
    
    return {
      ...defaultOptions,
      ...options,
      url: endpoint
    };
  }
  
  /**
   * 发送请求
   * @private
   * @param {Object} options - 请求选项
   * @returns {Promise<Response>} 响应对象
   */
  async _sendRequest(options) {
    const { retryCount, retryDelay, ...requestOptions } = options;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
        
        this._log('debug', `发送请求: ${requestOptions.url} (尝试 ${attempt + 1}/${retryCount + 1})`, {
          method: requestOptions.method,
          headers: requestOptions.headers
        });
        
        const response = await fetch(requestOptions.url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // 创建错误对象，包含响应信息
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = response;
          error.status = response.status;
          throw error;
        }
        
        return response;
      } catch (error) {
        if (attempt === retryCount) {
          this._log('error', `请求失败，已达到最大重试次数: ${requestOptions.url}`, error);
          throw error;
        }
        
        // 等待后重试
        const delay = retryDelay * (attempt + 1);
        this._log('warn', `请求失败，${delay}ms后重试: ${requestOptions.url}`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * 处理响应
   * @private
   * @param {Response} response - 响应对象
   * @param {Object} options - 选项
   * @returns {Promise<any>} 处理后的数据
   */
  async _processResponse(response, options) {
    const contentType = response.headers.get('content-type');
    
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      data = await response.text();
    } else if (contentType && contentType.includes('image/')) {
      data = await response.blob();
    } else {
      data = await response.arrayBuffer();
    }
    
    // 格式化数据
    if (options.format !== false) {
      data = this._formatResponseData(data, options);
    }
    
    return data;
  }
  
  /**
   * 格式化响应数据
   * @private
   * @param {any} data - 原始数据
   * @param {Object} options - 选项
   * @returns {any} 格式化后的数据
   */
  _formatResponseData(data, options) {
    // 基本的数据格式化
    // 可以在这里添加通用的数据处理逻辑
    
    if (Array.isArray(data)) {
      return data.map(item => this._formatItem(item));
    } else if (data && typeof data === 'object' && !(data instanceof Blob) && !(data instanceof ArrayBuffer)) {
      return this._formatItem(data);
    }
    
    return data;
  }
  
  /**
   * 格式化单个数据项
   * @private
   * @param {Object} item - 数据项
   * @returns {Object} 格式化后的数据项
   */
  _formatItem(item) {
    // 通用的数据项格式化
    // 例如：格式化日期字段
    
    const formatted = { ...item };
    
    // 格式化日期字段
    const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'timestamp', 'date', 'time'];
    
    dateFields.forEach(field => {
      if (formatted[field]) {
        try {
          const date = new Date(formatted[field]);
          if (!isNaN(date.getTime())) {
            formatted[`${field}Formatted`] = formatDateTime(date);
            formatted[`${field}Relative`] = this._getRelativeTime(date);
          }
        } catch (error) {
          // 忽略日期解析错误
        }
      }
    });
    
    return formatted;
  }
  
  /**
   * 获取相对时间
   * @private
   * @param {Date} date - 日期
   * @returns {string} 相对时间字符串
   */
  _getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return '刚刚';
    } else if (diffMin < 60) {
      return `${diffMin}分钟前`;
    } else if (diffHour < 24) {
      return `${diffHour}小时前`;
    } else if (diffDay < 7) {
      return `${diffDay}天前`;
    } else {
      return formatDate(date);
    }
  }
  
  /**
   * 更新指标
   * @private
   * @param {boolean} success - 是否成功
   * @param {number} responseTime - 响应时间
   */
  _updateMetrics(success, responseTime) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // 更新平均响应时间
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
    
    // 定期记录指标
    if (this.metrics.totalRequests % 10 === 0) {
      this._log('info', '服务指标更新', {
        totalRequests: this.metrics.totalRequests,
        successRate: (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%',
        averageResponseTime: this.metrics.averageResponseTime.toFixed(2) + 'ms'
      });
    }
  }
  
  /**
   * 生成缓存键
   * @private
   * @param {string|Object} key - 原始键
   * @param {Object} options - 选项
   * @returns {string} 缓存键
   */
  _generateCacheKey(key, options = {}) {
    const prefix = options.prefix || this.serviceName;
    const suffix = options.suffix || '';
    
    if (typeof key === 'object') {
      key = JSON.stringify(key);
    }
    
    return `${prefix}:${key}${suffix}`;
  }
  
  /**
   * 检查缓存是否有效
   * @private
   * @param {Object} cacheItem - 缓存项
   * @returns {boolean} 是否有效
   */
  _isCacheValid(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp) {
      return false;
    }
    
    const now = Date.now();
    const age = now - cacheItem.timestamp;
    
    return age < cacheItem.expiry;
  }
  
  /**
   * 清理缓存
   * @private
   */
  _cleanupCache() {
    const now = Date.now();
    let cleanedCount = 0;
    let lruCleanedCount = 0;
    
    // 清理过期缓存
    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp;
      
      if (age > item.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    // 如果缓存仍然过大，使用LRU策略清理
    if (this.cache.size > this.options.maxCacheSize) {
      // 按最后访问时间排序
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // 删除最久未访问的项
      const toRemove = entries.slice(0, this.cache.size - this.options.maxCacheSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
        lruCleanedCount++;
      }
    }
    
    if (cleanedCount > 0 || lruCleanedCount > 0) {
      this._log('info', `缓存清理完成: 过期 ${cleanedCount} 项, LRU ${lruCleanedCount} 项`);
    }
    
    this.cacheStats.size = this.cache.size;
    this.cacheStats.lastCleanup = now;
  }
  
  /**
   * 触发重新认证
   * @private
   */
  _triggerReauth() {
    // 触发全局认证事件
    const event = new CustomEvent('auth:required', {
      detail: { service: this.serviceName }
    });
    window.dispatchEvent(event);
    
    this._log('info', '触发重新认证');
  }
  
  /**
   * 网络变化处理
   * @private
   * @param {string} status - 网络状态
   */
  _onNetworkChange(status) {
    this._log('info', `网络状态变化: ${status}`);
    
    if (status === 'online') {
      // 网络恢复，可以执行同步操作
      showSuccess('网络已恢复');
      this._log('info', '网络已恢复，可以执行同步操作');
      
      // 触发网络恢复事件
      const event = new CustomEvent('network:online', {
        detail: { service: this.serviceName }
      });
      window.dispatchEvent(event);
    } else {
      showWarning('网络连接已断开');
      
      // 触发网络断开事件
      const event = new CustomEvent('network:offline', {
        detail: { service: this.serviceName }
      });
      window.dispatchEvent(event);
    }
  }
  
  /**
   * 应用可见性变化处理
   * @private
   * @param {string} state - 可见性状态
   */
  _onAppVisibilityChange(state) {
    this._log('debug', `应用可见性变化: ${state}`);
    
    if (state === 'visible') {
      // 应用变为可见，可以执行一些更新操作
      this._log('info', '应用变为可见，执行更新检查');
      
      // 触发应用可见事件
      const event = new CustomEvent('app:visible', {
        detail: { service: this.serviceName }
      });
      window.dispatchEvent(event);
    }
  }
  
  /**
   * 存储变化处理
   * @private
   * @param {StorageEvent} event - 存储事件
   */
  _onStorageChange(event) {
    // 处理跨标签页的存储变化
    if (event.key && event.key.startsWith(`${this.serviceName}_`)) {
      this._log('debug', `存储变化: ${event.key}`, {
        oldValue: event.oldValue,
        newValue: event.newValue
      });
      
      // 触发存储变化事件
      const customEvent = new CustomEvent('storage:changed', {
        detail: {
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue,
          service: this.serviceName
        }
      });
      window.dispatchEvent(customEvent);
    }
  }
  
  /**
   * 日志记录
   * @private
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {any} data - 日志数据
   */
  _log(level, message, data = null) {
    if (!this.options.enableLogging) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: this.serviceName,
      level,
      message,
      data
    };
    
    // 根据环境决定日志级别
    const logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    const currentLevel = logLevels[level] || 0;
    const maxLevel = process.env.NODE_ENV === 'production' ? 1 : 3; // 生产环境只记录错误和警告
    
    if (currentLevel <= maxLevel) {
      switch (level) {
        case 'error':
          console.error(logEntry);
          break;
        case 'warn':
          console.warn(logEntry);
          break;
        case 'info':
          console.info(logEntry);
          break;
        default:
          console.log(logEntry);
      }
    }
  }
  
  // ==================== 工具方法 ====================
  
  /**
   * 防抖请求
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间
   * @returns {Function} 防抖后的函数
   */
  _debounceRequest(func, wait = 300) {
    return debounce(func, wait);
  }
  
  /**
   * 节流请求
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 限制时间
   * @returns {Function} 节流后的函数
   */
  _throttleRequest(func, limit = 1000) {
    return throttle(func, limit);
  }
  
  /**
   * 获取服务状态
   * @returns {Object} 服务状态
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      cacheStats: { ...this.cacheStats },
      metrics: { ...this.metrics },
      lastSyncTime: this.lastSyncTime,
      options: { ...this.options },
      pendingRequests: this.pendingRequests.size,
      concurrentRequests: this.concurrentRequests
    };
  }
  
  /**
   * 重置服务
   * @returns {Promise<boolean>} 是否成功
   */
  async reset() {
    // 清除缓存
    await this.clearCache();
    
    // 清除定时器
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    if (this.cacheSaveInterval) {
      clearInterval(this.cacheSaveInterval);
    }
    
    // 重置状态
    this.isInitialized = false;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
    
    this.pendingRequests.clear();
    this.concurrentRequests = 0;
    
    this._log('info', '服务已重置');
    return true;
  }
  
  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return {
      ...this.cacheStats,
      hitRate: total > 0 ? (this.cacheStats.hits / total * 100).toFixed(2) + '%' : '0%',
      efficiency: total > 0 ? (this.cacheStats.hits / total).toFixed(3) : 0
    };
  }
  
  /**
   * 获取性能指标
   * @returns {Object} 性能指标
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      successRate,
      averageResponseTime: this.metrics.averageResponseTime.toFixed(2) + 'ms'
    };
  }
  
  /**
   * 销毁服务
   * @returns {Promise<boolean>} 是否成功
   */
  async destroy() {
    // 保存缓存
    this._saveCacheToStorage();
    
    // 清除定时器
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    if (this.cacheSaveInterval) {
      clearInterval(this.cacheSaveInterval);
    }
    
    // 移除事件监听器
    window.removeEventListener('online', this._onNetworkChange);
    window.removeEventListener('offline', this._onNetworkChange);
    document.removeEventListener('visibilitychange', this._onAppVisibilityChange);
    window.removeEventListener('storage', this._onStorageChange);
    
    // 清理缓存
    this.cache.clear();
    
    this._log('info', '服务已销毁');
    return true;
  }
}

export default BaseService;