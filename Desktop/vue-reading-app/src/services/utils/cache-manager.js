// src/utils/cache-manager.js
/**
 * 缓存管理工具
 * 提供统一的缓存管理、存储策略和缓存同步
 */

/**
 * 缓存存储类型
 */
export const StorageType = {
  MEMORY: 'memory',
  LOCAL_STORAGE: 'localStorage',
  SESSION_STORAGE: 'sessionStorage',
  INDEXED_DB: 'indexedDB'
};

/**
 * 缓存策略
 */
export const CachePolicy = {
  NO_CACHE: 'no_cache',
  CACHE_FIRST: 'cache_first',
  NETWORK_FIRST: 'network_first',
  STALE_WHILE_REVALIDATE: 'stale_while_revalidate'
};

/**
 * 缓存项类
 */
class CacheItem {
  constructor(key, data, options = {}) {
    this.key = key;
    this.data = data;
    this.timestamp = Date.now();
    this.expiry = options.expiry || 30 * 60 * 1000; // 默认30分钟
    this.lastAccessed = Date.now();
    this.metadata = options.metadata || {};
    this.tags = options.tags || [];
    this.version = options.version || '1.0';
  }
  
  get isExpired() {
    return Date.now() - this.timestamp > this.expiry;
  }
  
  get age() {
    return Date.now() - this.timestamp;
  }
  
  get timeToExpire() {
    return Math.max(0, this.expiry - this.age);
  }
  
  toJSON() {
    return {
      key: this.key,
      data: this.data,
      timestamp: this.timestamp,
      expiry: this.expiry,
      lastAccessed: this.lastAccessed,
      metadata: this.metadata,
      tags: this.tags,
      version: this.version
    };
  }
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  constructor(options = {}) {
    this.options = {
      defaultStorage: StorageType.MEMORY,
      defaultExpiry: 30 * 60 * 1000, // 30分钟
      maxSize: 100,
      enableLogging: process.env.NODE_ENV !== 'production',
      cleanupInterval: 5 * 60 * 1000, // 5分钟清理一次
      ...options
    };
    
    // 初始化存储
    this.storages = {
      [StorageType.MEMORY]: new Map(),
      [StorageType.LOCAL_STORAGE]: new LocalStorageAdapter(),
      [StorageType.SESSION_STORAGE]: new SessionStorageAdapter(),
      [StorageType.INDEXED_DB]: new IndexedDBAdapter()
    };
    
    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      lastCleanup: Date.now()
    };
    
    // 初始化
    this._init();
  }
  
  /**
   * 初始化缓存管理器
   * @private
   */
  async _init() {
    // 初始化所有存储适配器
    for (const storage of Object.values(this.storages)) {
      if (typeof storage.init === 'function') {
        await storage.init();
      }
    }
    
    // 设置定时清理
    this._setupCleanupInterval();
    
    this._log('info', '缓存管理器初始化完成');
  }
  
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 缓存数据
   * @param {Object} options - 缓存选项
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, data, options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      // 创建缓存项
      const cacheItem = new CacheItem(key, data, {
        expiry: options.expiry || this.options.defaultExpiry,
        metadata: options.metadata,
        tags: options.tags,
        version: options.version
      });
      
      // 存储缓存项
      await storage.set(key, cacheItem);
      
      // 更新统计
      this.stats.sets++;
      this.stats.size = await this.getSize();
      
      this._log('debug', `缓存设置: ${key}`, { storageType });
      
      return true;
    } catch (error) {
      this._log('error', `缓存设置失败: ${key}`, error);
      return false;
    }
  }
  
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @param {Object} options - 获取选项
   * @returns {Promise<any|null>} 缓存数据或null
   */
  async get(key, options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      // 获取缓存项
      const cacheItem = await storage.get(key);
      
      if (!cacheItem) {
        this.stats.misses++;
        this._log('debug', `缓存未命中: ${key}`);
        return null;
      }
      
      // 检查是否过期
      if (cacheItem.isExpired) {
        await this.delete(key, { storage: storageType });
        this.stats.misses++;
        this._log('debug', `缓存已过期: ${key}`);
        return null;
      }
      
      // 更新最后访问时间
      cacheItem.lastAccessed = Date.now();
      await storage.set(key, cacheItem);
      
      // 更新统计
      this.stats.hits++;
      
      this._log('debug', `缓存命中: ${key}`, { 
        storageType,
        age: cacheItem.age,
        ttl: cacheItem.timeToExpire 
      });
      
      return cacheItem.data;
    } catch (error) {
      this._log('error', `缓存获取失败: ${key}`, error);
      return null;
    }
  }
  
  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @param {Object} options - 删除选项
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(key, options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      await storage.delete(key);
      
      // 更新统计
      this.stats.deletes++;
      this.stats.size = await this.getSize();
      
      this._log('debug', `缓存删除: ${key}`, { storageType });
      
      return true;
    } catch (error) {
      this._log('error', `缓存删除失败: ${key}`, error);
      return false;
    }
  }
  
  /**
   * 清除缓存
   * @param {Object} options - 清除选项
   * @returns {Promise<boolean>} 是否成功
   */
  async clear(options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      await storage.clear();
      
      // 重置统计
      this.stats.size = 0;
      
      this._log('info', `缓存已清除`, { storageType });
      
      return true;
    } catch (error) {
      this._log('error', '缓存清除失败', error);
      return false;
    }
  }
  
  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @param {Object} options - 检查选项
   * @returns {Promise<boolean>} 是否存在
   */
  async has(key, options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      const cacheItem = await storage.get(key);
      
      if (!cacheItem) {
        return false;
      }
      
      // 检查是否过期
      if (cacheItem.isExpired) {
        await this.delete(key, { storage: storageType });
        return false;
      }
      
      return true;
    } catch (error) {
      this._log('error', `检查缓存失败: ${key}`, error);
      return false;
    }
  }
  
  /**
   * 获取缓存键列表
   * @param {Object} options - 获取选项
   * @returns {Promise<Array<string>>} 缓存键列表
   */
  async keys(options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      return await storage.keys();
    } catch (error) {
      this._log('error', '获取缓存键列表失败', error);
      return [];
    }
  }
  
  /**
   * 获取缓存大小
   * @param {Object} options - 获取选项
   * @returns {Promise<number>} 缓存大小
   */
  async getSize(options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      return await storage.size();
    } catch (error) {
      this._log('error', '获取缓存大小失败', error);
      return 0;
    }
  }
  
  /**
   * 根据标签获取缓存
   * @param {string|Array<string>} tags - 标签
   * @param {Object} options - 获取选项
   * @returns {Promise<Array<any>>} 缓存数据数组
   */
  async getByTag(tags, options = {}) {
    try {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      const allKeys = await storage.keys();
      const results = [];
      
      for (const key of allKeys) {
        const cacheItem = await storage.get(key);
        
        if (cacheItem && cacheItem.tags.some(tag => tagArray.includes(tag))) {
          if (!cacheItem.isExpired) {
            results.push(cacheItem.data);
          } else {
            await this.delete(key, { storage: storageType });
          }
        }
      }
      
      return results;
    } catch (error) {
      this._log('error', `根据标签获取缓存失败: ${tags}`, error);
      return [];
    }
  }
  
  /**
   * 根据标签删除缓存
   * @param {string|Array<string>} tags - 标签
   * @param {Object} options - 删除选项
   * @returns {Promise<number>} 删除的缓存项数量
   */
  async deleteByTag(tags, options = {}) {
    try {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      const allKeys = await storage.keys();
      let deletedCount = 0;
      
      for (const key of allKeys) {
        const cacheItem = await storage.get(key);
        
        if (cacheItem && cacheItem.tags.some(tag => tagArray.includes(tag))) {
          await this.delete(key, { storage: storageType });
          deletedCount++;
        }
      }
      
      this._log('info', `根据标签删除缓存: ${tags}`, { deletedCount });
      
      return deletedCount;
    } catch (error) {
      this._log('error', `根据标签删除缓存失败: ${tags}`, error);
      return 0;
    }
  }
  
  /**
   * 使用缓存策略获取数据
   * @param {string} key - 缓存键
   * @param {Function} fetchFn - 数据获取函数
   * @param {Object} options - 策略选项
   * @returns {Promise<any>} 数据
   */
  async getWithStrategy(key, fetchFn, options = {}) {
    const {
      policy = CachePolicy.CACHE_FIRST,
      storage = this.options.defaultStorage,
      expiry = this.options.defaultExpiry,
      ...fetchOptions
    } = options;
    
    switch (policy) {
      case CachePolicy.NO_CACHE:
        // 不使用缓存，直接获取
        return await fetchFn(fetchOptions);
        
      case CachePolicy.CACHE_FIRST:
        // 先检查缓存，缓存不存在再获取
        const cachedData = await this.get(key, { storage });
        
        if (cachedData !== null) {
          return cachedData;
        }
        
        const freshData = await fetchFn(fetchOptions);
        await this.set(key, freshData, { storage, expiry });
        return freshData;
        
      case CachePolicy.NETWORK_FIRST:
        // 先尝试获取，失败时使用缓存
        try {
          const freshData = await fetchFn(fetchOptions);
          await this.set(key, freshData, { storage, expiry });
          return freshData;
        } catch (error) {
          const cachedData = await this.get(key, { storage });
          
          if (cachedData !== null) {
            this._log('warn', `网络获取失败，使用缓存: ${key}`, error);
            return cachedData;
          }
          
          throw error;
        }
        
      case CachePolicy.STALE_WHILE_REVALIDATE:
        // 立即返回缓存（即使过期），同时在后台更新缓存
        const cachedData2 = await this.get(key, { storage });
        
        // 后台更新
        setTimeout(async () => {
          try {
            const freshData = await fetchFn(fetchOptions);
            await this.set(key, freshData, { storage, expiry });
          } catch (error) {
            this._log('error', `后台更新缓存失败: ${key}`, error);
          }
        }, 0);
        
        if (cachedData2 !== null) {
          return cachedData2;
        }
        
        // 如果没有缓存，直接获取
        const freshData2 = await fetchFn(fetchOptions);
        await this.set(key, freshData2, { storage, expiry });
        return freshData2;
        
      default:
        throw new Error(`不支持的缓存策略: ${policy}`);
    }
  }
  
  /**
   * 同步缓存到其他存储
   * @param {string} fromStorage - 源存储类型
   * @param {string} toStorage - 目标存储类型
   * @param {Object} options - 同步选项
   * @returns {Promise<number>} 同步的缓存项数量
   */
  async sync(fromStorage, toStorage, options = {}) {
    try {
      const source = this.storages[fromStorage];
      const target = this.storages[toStorage];
      
      if (!source || !target) {
        throw new Error('不支持的存储类型');
      }
      
      const keys = await source.keys();
      let syncedCount = 0;
      
      for (const key of keys) {
        const cacheItem = await source.get(key);
        
        if (cacheItem && !cacheItem.isExpired) {
          await target.set(key, cacheItem);
          syncedCount++;
        }
      }
      
      this._log('info', `缓存同步完成: ${fromStorage} -> ${toStorage}`, { syncedCount });
      
      return syncedCount;
    } catch (error) {
      this._log('error', '缓存同步失败', error);
      return 0;
    }
  }
  
  /**
   * 导出缓存数据
   * @param {Object} options - 导出选项
   * @returns {Promise<string>} JSON字符串
   */
  async export(options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      const keys = await storage.keys();
      const exportData = {};
      
      for (const key of keys) {
        const cacheItem = await storage.get(key);
        
        if (cacheItem && !cacheItem.isExpired) {
          exportData[key] = cacheItem.toJSON();
        }
      }
      
      const jsonString = JSON.stringify(exportData, null, 2);
      
      this._log('info', `缓存导出完成`, { 
        storageType,
        itemCount: Object.keys(exportData).length 
      });
      
      return jsonString;
    } catch (error) {
      this._log('error', '缓存导出失败', error);
      return '{}';
    }
  }
  
  /**
   * 导入缓存数据
   * @param {string} jsonString - JSON字符串
   * @param {Object} options - 导入选项
   * @returns {Promise<number>} 导入的缓存项数量
   */
  async import(jsonString, options = {}) {
    try {
      const storageType = options.storage || this.options.defaultStorage;
      const storage = this.storages[storageType];
      
      if (!storage) {
        throw new Error(`不支持的存储类型: ${storageType}`);
      }
      
      const importData = JSON.parse(jsonString);
      let importedCount = 0;
      
      for (const [key, data] of Object.entries(importData)) {
        const cacheItem = new CacheItem(
          data.key,
          data.data,
          {
            expiry: data.expiry,
            metadata: data.metadata,
            tags: data.tags,
            version: data.version
          }
        );
        
        // 检查是否过期
        if (!cacheItem.isExpired) {
          await storage.set(key, cacheItem);
          importedCount++;
        }
      }
      
      // 更新统计
      this.stats.size = await this.getSize();
      
      this._log('info', `缓存导入完成`, { 
        storageType,
        importedCount 
      });
      
      return importedCount;
    } catch (error) {
      this._log('error', '缓存导入失败', error);
      return 0;
    }
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      efficiency: hitRate / 100
    };
  }
  
  /**
   * 重置缓存统计
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: await this.getSize(),
      lastCleanup: Date.now()
    };
  }
  
  /**
   * 设置清理定时器
   * @private
   */
  _setupCleanupInterval() {
    setInterval(() => {
      this._cleanup();
    }, this.options.cleanupInterval);
  }
  
  /**
   * 清理过期缓存
   * @private
   */
  async _cleanup() {
    try {
      let totalCleaned = 0;
      
      for (const [storageType, storage] of Object.entries(this.storages)) {
        const keys = await storage.keys();
        let cleaned = 0;
        
        for (const key of keys) {
          const cacheItem = await storage.get(key);
          
          if (cacheItem && cacheItem.isExpired) {
            await storage.delete(key);
            cleaned++;
          }
        }
        
        totalCleaned += cleaned;
        
        if (cleaned > 0) {
          this._log('debug', `清理过期缓存: ${storageType}`, { cleaned });
        }
      }
      
      // 更新统计
      this.stats.size = await this.getSize();
      this.stats.lastCleanup = Date.now();
      
      if (totalCleaned > 0) {
        this._log('info', `缓存清理完成`, { totalCleaned });
      }
    } catch (error) {
      this._log('error', '缓存清理失败', error);
    }
  }
  
  /**
   * 日志记录
   * @private
   */
  _log(level, message, data = null) {
    if (!this.options.enableLogging) {
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    switch (level) {
      case 'error':
        console.error('[CacheManager]', logEntry);
        break;
      case 'warn':
        console.warn('[CacheManager]', logEntry);
        break;
      case 'info':
        console.info('[CacheManager]', logEntry);
        break;
      default:
        console.log('[CacheManager]', logEntry);
    }
  }
}

/**
 * LocalStorage适配器
 */
class LocalStorageAdapter {
  constructor() {
    this.prefix = 'cache_';
  }
  
  async init() {
    // 不需要特殊初始化
  }
  
  async set(key, cacheItem) {
    try {
      const storageKey = this.prefix + key;
      localStorage.setItem(storageKey, JSON.stringify(cacheItem.toJSON()));
      return true;
    } catch (error) {
      // 如果localStorage已满，尝试清理
      if (error.name === 'QuotaExceededError') {
        this._cleanup();
        // 重试一次
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(cacheItem.toJSON()));
          return true;
        } catch (retryError) {
          return false;
        }
      }
      return false;
    }
  }
  
  async get(key) {
    try {
      const storageKey = this.prefix + key;
      const item = localStorage.getItem(storageKey);
      
      if (!item) {
        return null;
      }
      
      const data = JSON.parse(item);
      return new CacheItem(
        data.key,
        data.data,
        {
          expiry: data.expiry,
          metadata: data.metadata,
          tags: data.tags,
          version: data.version
        }
      );
    } catch (error) {
      return null;
    }
  }
  
  async delete(key) {
    try {
      const storageKey = this.prefix + key;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async clear() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async keys() {
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }
  
  async size() {
    return (await this.keys()).length;
  }
  
  _cleanup() {
    // 清理最旧的50%的缓存项
    const items = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          items.push({
            key,
            lastAccessed: item.lastAccessed || 0
          });
        } catch (error) {
          // 忽略解析错误
        }
      }
    }
    
    // 按最后访问时间排序
    items.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // 删除最旧的一半
    const toRemove = items.slice(0, Math.floor(items.length / 2));
    toRemove.forEach(item => localStorage.removeItem(item.key));
  }
}

/**
 * SessionStorage适配器
 */
class SessionStorageAdapter extends LocalStorageAdapter {
  constructor() {
    super();
    this.prefix = 'session_cache_';
  }
  
  async set(key, cacheItem) {
    try {
      const storageKey = this.prefix + key;
      sessionStorage.setItem(storageKey, JSON.stringify(cacheItem.toJSON()));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async get(key) {
    try {
      const storageKey = this.prefix + key;
      const item = sessionStorage.getItem(storageKey);
      
      if (!item) {
        return null;
      }
      
      const data = JSON.parse(item);
      return new CacheItem(
        data.key,
        data.data,
        {
          expiry: data.expiry,
          metadata: data.metadata,
          tags: data.tags,
          version: data.version
        }
      );
    } catch (error) {
      return null;
    }
  }
  
  async delete(key) {
    try {
      const storageKey = this.prefix + key;
      sessionStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async clear() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async keys() {
    const keys = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }
}

/**
 * IndexedDB适配器
 */
class IndexedDBAdapter {
  constructor() {
    this.dbName = 'app_cache_db';
    this.storeName = 'cache_items';
    this.db = null;
    this.prefix = 'idb_cache_';
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiry', 'expiry', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }
  
  async set(key, cacheItem) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const item = {
        key: this.prefix + key,
        ...cacheItem.toJSON()
      };
      
      const request = store.put(item);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
  
  async get(key) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(this.prefix + key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        
        const data = request.result;
        resolve(new CacheItem(
          data.key.substring(this.prefix.length),
          data.data,
          {
            expiry: data.expiry,
            metadata: data.metadata,
            tags: data.tags,
            version: data.version
          }
        ));
      };
    });
  }
  
  async delete(key) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(this.prefix + key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
  
  async clear() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }
  
  async keys() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const keys = request.result.map(key => 
          key.substring(this.prefix.length)
        );
        resolve(keys);
      };
    });
  }
  
  async size() {
    const keys = await this.keys();
    return keys.length;
  }
}

/**
 * 创建缓存管理器实例
 */
let cacheManagerInstance = null;

/**
 * 获取缓存管理器实例（单例模式）
 * @param {Object} options - 配置选项
 * @returns {CacheManager} 缓存管理器实例
 */
export function getCacheManager(options = {}) {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(options);
  }
  
  return cacheManagerInstance;
}

/**
 * 缓存工具函数
 */

/**
 * 记忆化函数（缓存函数结果）
 * @param {Function} fn - 要记忆化的函数
 * @param {Object} options - 缓存选项
 * @returns {Function} 记忆化后的函数
 */
export function memoize(fn, options = {}) {
  const {
    resolver = (...args) => args[0],
    ttl = 5 * 60 * 1000, // 5分钟
    cache = new Map()
  } = options;
  
  return function(...args) {
    const key = resolver(...args);
    const now = Date.now();
    
    if (cache.has(key)) {
      const entry = cache.get(key);
      
      if (now - entry.timestamp < ttl) {
        return entry.value;
      }
      
      cache.delete(key);
    }
    
    const value = fn(...args);
    cache.set(key, { value, timestamp: now });
    
    return value;
  };
}

/**
 * 防抖缓存（延迟执行并缓存结果）
 * @param {Function} fn - 要执行的函数
 * @param {Object} options - 选项
 * @returns {Function} 包装后的函数
 */
export function debounceCache(fn, options = {}) {
  const {
    wait = 300,
    immediate = false,
    ttl = 10 * 60 * 1000 // 10分钟
  } = options;
  
  let timeout = null;
  let cachedResult = null;
  let cacheTimestamp = 0;
  
  return function(...args) {
    const context = this;
    const now = Date.now();
    
    // 检查缓存是否有效
    if (cachedResult !== null && now - cacheTimestamp < ttl) {
      return Promise.resolve(cachedResult);
    }
    
    return new Promise((resolve) => {
      const later = () => {
        timeout = null;
        if (!immediate) {
          fn.apply(context, args).then(result => {
            cachedResult = result;
            cacheTimestamp = Date.now();
            resolve(result);
          });
        }
      };
      
      const callNow = immediate && !timeout;
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) {
        fn.apply(context, args).then(result => {
          cachedResult = result;
          cacheTimestamp = Date.now();
          resolve(result);
        });
      }
    });
  };
}

/**
 * 缓存包装器
 * @param {Function} fn - 要包装的函数
 * @param {Object} options - 缓存选项
 * @returns {Function} 包装后的函数
 */
export function cacheWrapper(fn, options = {}) {
  const {
    key = (...args) => JSON.stringify(args),
    ttl = 5 * 60 * 1000,
    cache = new Map()
  } = options;
  
  return async function(...args) {
    const cacheKey = key(...args);
    const now = Date.now();
    
    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey);
      
      if (now - entry.timestamp < ttl) {
        return entry.value;
      }
      
      cache.delete(cacheKey);
    }
    
    const value = await fn(...args);
    cache.set(cacheKey, { value, timestamp: now });
    
    return value;
  };
}

export default {
  StorageType,
  CachePolicy,
  CacheManager,
  getCacheManager,
  memoize,
  debounceCache,
  cacheWrapper
};