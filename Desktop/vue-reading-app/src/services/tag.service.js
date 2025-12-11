/**
 * 服务聚合文件
 * 统一导出所有服务和工具函数
 */

// ======================== 服务导入 ========================
// 基础服务类
export { default as BaseService } from './base.service';

// 核心服务 (假设这些服务默认导出)
export { default as authService } from './auth.service';
export { default as documentService } from './document.service';
export { default as readerService } from './reader.service';
export { default as vocabularyService } from './vocabulary.service';
export { default as reviewService } from './review.service';
export { default as userService } from './user.service';
export { default as notificationService } from './notification.service';
export { default as settingsService } from './settings.service';
export { default as tagService } from './tag.service';
export { default as searchService } from './search.service';
export { default as feedbackService } from './feedback.service';
export { default as offlineService } from './offline.service';
export { default as exportService } from './export.service';

// ======================== 工具函数导入 ========================
// formatter.js (命名导出)
export { formatDate, formatNumber } from '../utils/formatter';

// file-validator.js (命名导出)
export { validateFile } from '../utils/file-validator';

// debounce.js (命名导出)
export { debounce } from '../utils/debounce';

// throttle.js (命名导出)
export { throttle } from '../utils/throttle';

// validator.js (命名导出)
export { validator } from '../utils/validator';

// request-queue.js (默认导出 requestQueue 实例)
export { requestQueue } from '../utils/request-queue';

// data-formatter.js (默认导出)
export { default as dataFormatter } from '../utils/data-formatter';

// error-handler.js (命名导出)
export { configureGlobalErrorHandlers, handleError } from '../utils/error-handler';

// cache-manager.js (命名导出 CacheManager 类，以及 getCacheManager 函数)
export { CacheManager, getCacheManager } from '../utils/cache-manager'; // 导入 CacheManager 类和 getCacheManager 函数


// ======================== 管理函数 ========================

/**
 * 初始化所有服务
 * @param {Object} config - 配置对象
 * @returns {Promise<Object>} 初始化结果
 */
export async function initializeServices(config = {}) {
  const services = {
    authService,
    documentService,
    readerService,
    vocabularyService,
    reviewService,
    userService,
    notificationService,
    settingsService,
    tagService,
    searchService,
    feedbackService,
    offlineService,
    exportService
  };

  const results = {};
  const errors = [];

  // 按依赖顺序初始化
  const initOrder = [
    'authService',      // 认证服务最先初始化
    'settingsService',  // 设置服务
    'userService',      // 用户服务 (可能依赖认证)
    'offlineService',   // 离线服务 (可能依赖设置)
    'documentService',  // 文档服务
    'vocabularyService', // 词汇服务
    'readerService',    // 阅读器服务 (可能依赖文档, 词汇)
    'reviewService',    // 复习服务 (可能依赖词汇)
    'notificationService', // 通知服务
    'tagService',       // 标签服务
    'searchService',    // 搜索服务
    'feedbackService',  // 反馈服务
    'exportService'     // 导出服务
  ];

  for (const serviceName of initOrder) {
    const service = services[serviceName];
    // 确保服务存在且有 initialize 方法
    if (service && typeof service.initialize === 'function') {
      try {
        const serviceConfig = config[serviceName] || {};
        // 传递必要的配置，例如API实例或全局设置
        const initializationResult = await service.initialize(serviceConfig);
        results[serviceName] = {
          success: true,
          result: initializationResult // 存储初始化返回的结果
        };
        console.log(`✅ ${serviceName} 初始化成功`);
      } catch (error) {
        results[serviceName] = {
          success: false,
          error: error.message
        };
        errors.push({ serviceName, error: error.message });
        console.error(`❌ ${serviceName} 初始化失败:`, error.message);
        // 根据需要决定是否中断初始化流程
        // if (serviceName === 'authService') {
        //   console.error("关键服务认证失败，后续服务可能无法正常工作。");
        //   break; // 示例：如果认证失败，中断后续初始化
        // }
      }
    } else {
       // 处理没有 initialize 方法的服务或不存在的服务
       results[serviceName] = {
         success: false,
         error: '服务不存在或没有 initialize 方法'
       };
       errors.push({ serviceName, error: '服务不存在或没有 initialize 方法' });
       console.warn(`⚠️ ${serviceName} 无法初始化 (未找到 initialize 方法或服务不存在)`);
    }
  }

  // 设置全局错误处理器
  try {
    // 使用 import 动态导入 error-handler.js
    const errorHandlerModule = await import('../utils/error-handler');
    if (errorHandlerModule.configureGlobalErrorHandlers) {
      errorHandlerModule.configureGlobalErrorHandlers();
      console.log('✅ 全局错误处理器已设置');
    } else {
      console.warn('⚠️ error-handler.js 中未找到 configureGlobalErrorHandlers 函数');
    }
  } catch (error) {
    console.warn('⚠️ 全局错误处理器设置失败:', error.message);
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取所有服务状态
 * @returns {Object} 服务状态
 */
export function getServicesStatus() {
  // 假设所有服务都通过默认导出
  const services = {
    authService,
    documentService,
    readerService,
    vocabularyService,
    reviewService,
    userService,
    notificationService,
    settingsService,
    tagService,
    searchService,
    feedbackService,
    offlineService,
    exportService
  };

  const status = {};

  for (const [name, service] of Object.entries(services)) {
    // 检查服务是否存在且有 getStatus 方法
    if (service && typeof service.getStatus === 'function') {
      try {
        status[name] = service.getStatus();
      } catch (error) {
        status[name] = {
          initialized: false, // 假设如果 getStatus 抛错，则服务未健康运行
          healthCheck: {
            healthy: false,
            error: error.message
          }
        };
        console.error(`❌ ${name} 获取状态时出错:`, error.message);
      }
    } else {
      // 提供默认状态，表示服务未准备好或无状态检查方法
      status[name] = {
        initialized: false,
        healthCheck: {
          healthy: false,
          error: '服务未找到或不支持状态检查'
        }
      };
    }
  }

  return status;
}

/**
 * 重置所有服务
 * @returns {Promise<Object>} 重置结果
 */
export async function resetServices() {
  // 假设所有服务都通过默认导出
  const services = {
    authService,
    documentService,
    readerService,
    vocabularyService,
    reviewService,
    userService,
    notificationService,
    settingsService,
    tagService,
    searchService,
    feedbackService,
    offlineService,
    exportService
  };

  const results = {};

  for (const [name, service] of Object.entries(services)) {
    // 检查服务是否存在且有 reset 方法
    if (service && typeof service.reset === 'function') {
      try {
        await service.reset();
        results[name] = { success: true };
        console.log(`✅ ${name} 重置成功`);
      } catch (error) {
        results[name] = { success: false, error: error.message };
        console.error(`❌ ${name} 重置失败:`, error.message);
      }
    } else {
       results[name] = { success: false, error: '服务不存在或没有 reset 方法' };
       console.warn(`⚠️ ${name} 无法重置 (未找到 reset 方法或服务不存在)`);
    }
  }

  return {
    success: Object.values(results).every(r => r.success),
    results,
    timestamp: new Date().toISOString()
  };
}

/**
 * 销毁所有服务
 * @returns {Promise<Object>} 销毁结果
 */
export async function destroyServices() {
  // 假设所有服务都通过默认导出
  const services = {
    authService,
    documentService,
    readerService,
    vocabularyService,
    reviewService,
    userService,
    notificationService,
    settingsService,
    tagService,
    searchService,
    feedbackService,
    offlineService,
    exportService
  };

  const results = {};

  // 按依赖顺序反向销毁
  const destroyOrder = [
    'exportService',
    'feedbackService',
    'searchService',
    'tagService',
    'notificationService',
    'reviewService',
    'readerService',
    'vocabularyService',
    'documentService',
    'userService',
    'offlineService',
    'settingsService',
    'authService'
  ];

  for (const serviceName of destroyOrder) {
    const service = services[serviceName];
    // 检查服务是否存在且有 destroy 方法
    if (service && typeof service.destroy === 'function') {
      try {
        // 添加资源清理确认 (如果服务提供了 confirmDestroy 方法)
        if (typeof service.confirmDestroy === 'function') {
          const confirmed = await service.confirmDestroy();
          if (!confirmed) {
            results[serviceName] = { success: false, message: '用户取消销毁' };
            console.warn(`⚠️ ${serviceName} 销毁被用户取消`);
            continue; // 跳过此服务的销毁
          }
        }

        await service.destroy();
        results[serviceName] = { success: true };
        console.log(`✅ ${serviceName} 销毁成功`);
      } catch (error) {
        results[serviceName] = { success: false, error: error.message };
        console.error(`❌ ${serviceName} 销毁失败:`, error.message);
      }
    } else {
      results[serviceName] = { success: false, error: '服务不存在或没有 destroy 方法' };
      console.warn(`⚠️ ${serviceName} 无法销毁 (未找到 destroy 方法或服务不存在)`);
    }
  }

  return {
    success: Object.values(results).every(r => r.success),
    results,
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取缓存管理器实例 (通过 getCacheManager 函数)
 * @returns {CacheManager} 缓存管理器实例
 */
export function getCacheManager() {
  // 使用 import 导入 getCacheManager 函数，并调用以获取实例
  // 假设 getCacheManager 是从 cache-manager.js 默认导出的
  const cacheManager = require('../utils/cache-manager'); // 导入整个模块
  return cacheManager.getCacheManager(); // 调用函数获取实例
}

/**
 * 获取错误处理器 (configureGlobalErrorHandlers 和 handleError)
 * @returns {Object} 错误处理器相关函数
 */
export function getErrorHandler() {
  // 使用 import 导入 error-handler.js 中的函数
  const errorHandler = require('../utils/error-handler');
  return {
    configureGlobalErrorHandlers: errorHandler.configureGlobalErrorHandlers,
    handleError: errorHandler.handleError
  };
}

/**
 * 获取数据格式化工具 (默认导出)
 * @returns {Object} 数据格式化工具对象
 */
export function getDataFormatter() {
  // 使用 import 导入 data-formatter.js 的默认导出
  const dataFormatter = require('../utils/data-formatter');
  return dataFormatter;
}

// ======================== 默认导出所有服务和管理函数 ========================
export default {
  // 基础服务类
  BaseService,

  // 核心服务 (假设都是默认导出)
  authService,
  documentService,
  readerService,
  vocabularyService,
  reviewService,
  userService,
  notificationService,
  settingsService,
  tagService,
  searchService,
  feedbackService,
  offlineService,
  exportService,

  // 工具函数 (明确导出)
  formatDate,
  formatNumber,
  validateFile,
  debounce,
  throttle,
  validator,
  requestQueue,
  dataFormatter,
  configureGlobalErrorHandlers, // 从 error-handler.js 命名导出
  handleError,                  // 从 error-handler.js 命名导出
  // CacheManager 类已命名导出，getCacheManager 函数也已单独导出
  // CacheManager, // 不直接导出类，通过 getCacheManager 获取实例

  // 管理函数
  initializeServices,
  getServicesStatus,
  resetServices,
  destroyServices,
  getCacheManager,
  getErrorHandler,
  getDataFormatter
};