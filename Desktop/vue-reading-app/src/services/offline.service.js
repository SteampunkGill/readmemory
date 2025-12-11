// src/services/offline.service.js
import { api } from '@/api/offline';
import { useOfflineStore } from '@/stores/offline.store';
import { useDocumentStore } from '@/stores/document.store';
import { useVocabularyStore } from '@/stores/vocabulary.store';
import { useReviewStore } from '@/stores/review.store';
import { useUserStore } from '@/stores/user.store';
import { showError, showSuccess, showWarning, showInfo } from '@/utils/notify';
import { formatDate } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';

class OfflineService {
  constructor() {
    this.offlineStore = useOfflineStore();
    this.documentStore = useDocumentStore();
    this.vocabularyStore = useVocabularyStore();
    this.reviewStore = useReviewStore();
    this.userStore = useUserStore();
    
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    this.syncDebounced = debounce(this._processSyncQueue.bind(this), 1000);
    
    // 初始化事件监听
    this._initEventListeners();
    this._initIndexedDB();
  }

  /**
   * 初始化事件监听
   */
  _initEventListeners() {
    // 网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      this._onNetworkRestored();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this._onNetworkLost();
    });
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this._onPageVisible();
      }
    });
    
    // 应用激活事件
    window.addEventListener('appinstalled', () => {
      this._onAppInstalled();
    });
  }

  /**
   * 初始化IndexedDB
   */
  async _initIndexedDB() {
    try {
      if (!window.indexedDB) {
        console.warn('IndexedDB is not supported');
        return;
      }
      
      // 创建或打开数据库
      const request = indexedDB.open('LanguageLearningDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          documentStore.createIndex('isSynced', 'isSynced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('vocabulary')) {
          const vocabularyStore = db.createObjectStore('vocabulary', { keyPath: 'id' });
          vocabularyStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          vocabularyStore.createIndex('isSynced', 'isSynced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('reviews')) {
          const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
          reviewStore.createIndex('createdAt', 'createdAt', { unique: false });
          reviewStore.createIndex('isSynced', 'isSynced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('documentId', 'documentId', { unique: false });
          noteStore.createIndex('isSynced', 'isSynced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('highlights')) {
          const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' });
          highlightStore.createIndex('documentId', 'documentId', { unique: false });
          highlightStore.createIndex('isSynced', 'isSynced', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('IndexedDB initialized successfully');
        
        // 加载离线数据
        this._loadOfflineData();
      };
      
      request.onerror = (event) => {
        console.error('Failed to initialize IndexedDB:', event.target.error);
      };
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
    }
  }

  /**
   * 检查网络状态
   * @returns {boolean} 是否在线
   */
  checkNetworkStatus() {
    return this.isOnline;
  }

  /**
   * 获取离线状态
   * @returns {Object} 离线状态信息
   */
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      syncQueueSize: this.syncQueue.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.offlineStore.lastSyncTime,
      offlineDataSize: this.offlineStore.offlineDataSize,
      pendingOperations: this.offlineStore.pendingOperations
    };
  }

  /**
   * 保存文档到离线存储
   * @param {Object} document - 文档数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveDocument(document) {
    try {
      if (!document || !document.id) {
        throw new Error('文档数据无效');
      }
      
      // 标记为未同步
      const offlineDocument = {
        ...document,
        isSynced: this.isOnline,
        updatedAt: new Date().toISOString(),
        offlineVersion: (document.offlineVersion || 0) + 1
      };
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('documents', offlineDocument);
      
      // 更新store
      this.offlineStore.addOfflineDocument(offlineDocument);
      
      // 如果离线，添加到同步队列
      if (!this.isOnline) {
        await this._addToSyncQueue({
          type: 'document',
          action: 'save',
          data: offlineDocument,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存文档到离线存储失败:', error);
      return false;
    }
  }

  /**
   * 保存词汇到离线存储
   * @param {Object} vocabulary - 词汇数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveVocabulary(vocabulary) {
    try {
      if (!vocabulary || !vocabulary.id) {
        throw new Error('词汇数据无效');
      }
      
      // 标记为未同步
      const offlineVocabulary = {
        ...vocabulary,
        isSynced: this.isOnline,
        updatedAt: new Date().toISOString(),
        offlineVersion: (vocabulary.offlineVersion || 0) + 1
      };
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('vocabulary', offlineVocabulary);
      
      // 更新store
      this.offlineStore.addOfflineVocabulary(offlineVocabulary);
      
      // 如果离线，添加到同步队列
      if (!this.isOnline) {
        await this._addToSyncQueue({
          type: 'vocabulary',
          action: 'save',
          data: offlineVocabulary,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存词汇到离线存储失败:', error);
      return false;
    }
  }

  /**
   * 保存复习记录到离线存储
   * @param {Object} review - 复习记录
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveReview(review) {
    try {
      if (!review) {
        throw new Error('复习记录无效');
      }
      
      // 生成唯一ID
      const reviewId = review.id || `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 标记为未同步
      const offlineReview = {
        ...review,
        id: reviewId,
        isSynced: this.isOnline,
        createdAt: new Date().toISOString(),
        offlineVersion: 1
      };
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('reviews', offlineReview);
      
      // 更新store
      this.offlineStore.addOfflineReview(offlineReview);
      
      // 如果离线，添加到同步队列
      if (!this.isOnline) {
        await this._addToSyncQueue({
          type: 'review',
          action: 'save',
          data: offlineReview,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存复习记录到离线存储失败:', error);
      return false;
    }
  }

  /**
   * 保存笔记到离线存储
   * @param {Object} note - 笔记数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveNote(note) {
    try {
      if (!note || !note.documentId) {
        throw new Error('笔记数据无效');
      }
      
      // 生成唯一ID
      const noteId = note.id || `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 标记为未同步
      const offlineNote = {
        ...note,
        id: noteId,
        isSynced: this.isOnline,
        createdAt: new Date().toISOString(),
        offlineVersion: 1
      };
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('notes', offlineNote);
      
      // 更新store
      this.offlineStore.addOfflineNote(offlineNote);
      
      // 如果离线，添加到同步队列
      if (!this.isOnline) {
        await this._addToSyncQueue({
          type: 'note',
          action: 'save',
          data: offlineNote,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存笔记到离线存储失败:', error);
      return false;
    }
  }

  /**
   * 保存高亮到离线存储
   * @param {Object} highlight - 高亮数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveHighlight(highlight) {
    try {
      if (!highlight || !highlight.documentId) {
        throw new Error('高亮数据无效');
      }
      
      // 生成唯一ID
      const highlightId = highlight.id || `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 标记为未同步
      const offlineHighlight = {
        ...highlight,
        id: highlightId,
        isSynced: this.isOnline,
        createdAt: new Date().toISOString(),
        offlineVersion: 1
      };
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('highlights', offlineHighlight);
      
      // 更新store
      this.offlineStore.addOfflineHighlight(offlineHighlight);
      
      // 如果离线，添加到同步队列
      if (!this.isOnline) {
        await this._addToSyncQueue({
          type: 'highlight',
          action: 'save',
          data: offlineHighlight,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('保存高亮到离线存储失败:', error);
      return false;
    }
  }

  /**
   * 获取离线文档
   * @param {string} documentId - 文档ID
   * @returns {Promise<Object|null>} 文档数据
   */
  async getOfflineDocument(documentId) {
    try {
      if (!documentId) {
        return null;
      }
      
      const document = await this._getFromIndexedDB('documents', documentId);
      return document || null;
    } catch (error) {
      console.error('获取离线文档失败:', error);
      return null;
    }
  }

  /**
   * 获取所有离线文档
   * @returns {Promise<Array>} 文档列表
   */
  async getAllOfflineDocuments() {
    try {
      const documents = await this._getAllFromIndexedDB('documents');
      return documents || [];
    } catch (error) {
      console.error('获取所有离线文档失败:', error);
      return [];
    }
  }

  /**
   * 获取离线词汇
   * @param {string} vocabularyId - 词汇ID
   * @returns {Promise<Object|null>} 词汇数据
   */
  async getOfflineVocabulary(vocabularyId) {
    try {
      if (!vocabularyId) {
        return null;
      }
      
      const vocabulary = await this._getFromIndexedDB('vocabulary', vocabularyId);
      return vocabulary || null;
    } catch (error) {
      console.error('获取离线词汇失败:', error);
      return null;
    }
  }

  /**
   * 获取所有离线词汇
   * @returns {Promise<Array>} 词汇列表
   */
  async getAllOfflineVocabulary() {
    try {
      const vocabulary = await this._getAllFromIndexedDB('vocabulary');
      return vocabulary || [];
    } catch (error) {
      console.error('获取所有离线词汇失败:', error);
      return [];
    }
  }

  /**
   * 获取离线复习记录
   * @returns {Promise<Array>} 复习记录列表
   */
  async getAllOfflineReviews() {
    try {
      const reviews = await this._getAllFromIndexedDB('reviews');
      return reviews || [];
    } catch (error) {
      console.error('获取离线复习记录失败:', error);
      return [];
    }
  }

  /**
   * 获取文档的离线笔记
   * @param {string} documentId - 文档ID
   * @returns {Promise<Array>} 笔记列表
   */
  async getOfflineNotes(documentId) {
    try {
      if (!documentId) {
        return [];
      }
      
      const notes = await this._getAllFromIndexedDB('notes');
      return notes.filter(note => note.documentId === documentId) || [];
    } catch (error) {
      console.error('获取离线笔记失败:', error);
      return [];
    }
  }

  /**
   * 获取文档的离线高亮
   * @param {string} documentId - 文档ID
   * @returns {Promise<Array>} 高亮列表
   */
  async getOfflineHighlights(documentId) {
    try {
      if (!documentId) {
        return [];
      }
      
      const highlights = await this._getAllFromIndexedDB('highlights');
      return highlights.filter(highlight => highlight.documentId === documentId) || [];
    } catch (error) {
      console.error('获取离线高亮失败:', error);
      return [];
    }
  }

  /**
   * 同步离线数据
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncOfflineData(options = {}) {
    try {
      const {
        force = false,
        background = false,
        onProgress = null
      } = options;

      // 如果正在同步且不是强制同步，则返回
      if (this.isSyncing && !force) {
        return {
          success: false,
          message: '同步正在进行中',
          syncedItems: 0,
          failedItems: 0
        };
      }

      // 如果离线，则返回
      if (!this.isOnline) {
        return {
          success: false,
          message: '网络不可用，无法同步',
          syncedItems: 0,
          failedItems: 0
        };
      }

      // 开始同步
      this.isSyncing = true;
      this.offlineStore.setSyncing(true);

      // 获取同步队列
      const syncQueue = await this._getSyncQueue();
      
      if (syncQueue.length === 0) {
        this.isSyncing = false;
        this.offlineStore.setSyncing(false);
        
        return {
          success: true,
          message: '没有需要同步的数据',
          syncedItems: 0,
          failedItems: 0
        };
      }

      let syncedItems = 0;
      let failedItems = 0;
      const failedOperations = [];

      // 处理同步队列
      for (let i = 0; i < syncQueue.length; i++) {
        const operation = syncQueue[i];
        
        try {
          // 更新进度
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: syncQueue.length,
              operation: operation.type
            });
          }

          // 执行同步操作
          const result = await this._syncOperation(operation);
          
          if (result.success) {
            syncedItems++;
            
            // 从同步队列中移除
            await this._removeFromSyncQueue(operation.id);
            
            // 更新本地数据状态
            await this._markAsSynced(operation);
          } else {
            failedItems++;
            failedOperations.push({
              operation,
              error: result.error
            });
            
            // 更新重试次数
            await this._updateRetryCount(operation.id);
          }
        } catch (error) {
          failedItems++;
          failedOperations.push({
            operation,
            error: error.message
          });
          console.error('同步操作失败:', error);
        }
      }

      // 同步完成
      this.isSyncing = false;
      this.offlineStore.setSyncing(false);
      this.offlineStore.setLastSyncTime(new Date().toISOString());

      // 更新统计数据
      await this._updateOfflineStats();

      // 显示结果
      const message = failedItems === 0
        ? `同步完成，成功同步 ${syncedItems} 条数据`
        : `同步完成，成功 ${syncedItems} 条，失败 ${failedItems} 条`;

      if (!background) {
        if (failedItems === 0) {
          showSuccess(message);
        } else {
          showWarning(message);
        }
      }

      return {
        success: failedItems === 0,
        message,
        syncedItems,
        failedItems,
        failedOperations
      };
    } catch (error) {
      this.isSyncing = false;
      this.offlineStore.setSyncing(false);
      
      console.error('同步离线数据失败:', error);
      
      return {
        success: false,
        message: '同步失败',
        syncedItems: 0,
        failedItems: 0,
        error: error.message
      };
    }
  }

  /**
   * 清除离线缓存
   * @param {Object} options - 清除选项
   * @returns {Promise<boolean>} 是否清除成功
   */
  async clearOfflineCache(options = {}) {
    try {
      const {
        documents = false,
        vocabulary = false,
        reviews = false,
        notes = false,
        highlights = false,
        cache = false,
        all = false
      } = options;

      // 确认清除
      if (!options.skipConfirm) {
        const confirmed = await this._confirmClearCache();
        if (!confirmed) {
          return false;
        }
      }

      // 清除指定类型的数据
      if (all || documents) {
        await this._clearObjectStore('documents');
        this.offlineStore.clearOfflineDocuments();
      }
      
      if (all || vocabulary) {
        await this._clearObjectStore('vocabulary');
        this.offlineStore.clearOfflineVocabulary();
      }
      
      if (all || reviews) {
        await this._clearObjectStore('reviews');
        this.offlineStore.clearOfflineReviews();
      }
      
      if (all || notes) {
        await this._clearObjectStore('notes');
        this.offlineStore.clearOfflineNotes();
      }
      
      if (all || highlights) {
        await this._clearObjectStore('highlights');
        this.offlineStore.clearOfflineHighlights();
      }
      
      if (all || cache) {
        await this._clearObjectStore('cache');
      }

      // 更新统计数据
      await this._updateOfflineStats();

      showSuccess('离线缓存已清除');
      
      return true;
    } catch (error) {
      console.error('清除离线缓存失败:', error);
      showError('清除离线缓存失败');
      return false;
    }
  }

  /**
   * 导出离线数据
   * @param {Object} options - 导出选项
   * @returns {Promise<Blob>} 导出的数据文件
   */
  async exportOfflineData(options = {}) {
    try {
      const {
        format = 'json',
        includeDocuments = true,
        includeVocabulary = true,
        includeReviews = true,
        includeNotes = true,
        includeHighlights = true
      } = options;

      // 收集数据
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId: this.userStore.user?.id,
          appVersion: process.env.VUE_APP_VERSION || '1.0.0'
        },
        data: {}
      };

      if (includeDocuments) {
        exportData.data.documents = await this.getAllOfflineDocuments();
      }
      
      if (includeVocabulary) {
        exportData.data.vocabulary = await this.getAllOfflineVocabulary();
      }
      
      if (includeReviews) {
        exportData.data.reviews = await this.getAllOfflineReviews();
      }
      
      if (includeNotes) {
        const allNotes = await this._getAllFromIndexedDB('notes');
        exportData.data.notes = allNotes;
      }
      
      if (includeHighlights) {
        const allHighlights = await this._getAllFromIndexedDB('highlights');
        exportData.data.highlights = allHighlights;
      }

      // 根据格式处理数据
      let dataBlob;
      let mimeType;
      let fileExtension;

      if (format === 'json') {
        const jsonString = JSON.stringify(exportData, null, 2);
        dataBlob = new Blob([jsonString], { type: 'application/json' });
        mimeType = 'application/json';
        fileExtension = 'json';
      } else if (format === 'csv') {
        // 简化版CSV导出，实际项目中可能需要更复杂的处理
        const csvData = this._convertToCSV(exportData);
        dataBlob = new Blob([csvData], { type: 'text/csv' });
        mimeType = 'text/csv';
        fileExtension = 'csv';
      } else {
        throw new Error(`不支持的导出格式: ${format}`);
      }

      // 创建下载链接
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `offline_data_${dateStr}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('离线数据导出成功');
      
      return dataBlob;
    } catch (error) {
      console.error('导出离线数据失败:', error);
      showError('导出离线数据失败');
      throw error;
    }
  }

  /**
   * 导入离线数据
   * @param {File} file - 导入文件
   * @param {Object} options - 导入选项
   * @returns {Promise<Object>} 导入结果
   */
  async importOfflineData(file, options = {}) {
    try {
      const {
        format = 'auto',
        merge = true,
        clearExisting = false
      } = options;

      if (!file) {
        throw new Error('请选择要导入的文件');
      }

      // 读取文件
      const fileContent = await this._readFile(file);
      
      // 解析数据
      let importData;
      const detectedFormat = format === 'auto' ? this._detectFileFormat(file) : format;
      
      if (detectedFormat === 'json') {
        importData = JSON.parse(fileContent);
      } else if (detectedFormat === 'csv') {
        importData = this._parseCSV(fileContent);
      } else {
        throw new Error('不支持的文件格式');
      }

      // 验证数据格式
      this._validateImportData(importData);

      // 确认导入
      if (!options.skipConfirm) {
        const confirmed = await this._confirmImport(importData);
        if (!confirmed) {
          return {
            success: false,
            message: '用户取消导入',
            importedItems: 0
          };
        }
      }

      // 清除现有数据（如果选择）
      if (clearExisting) {
        await this.clearOfflineCache({ all: true, skipConfirm: true });
      }

      let importedItems = 0;

      // 导入数据
      if (importData.data.documents) {
        for (const document of importData.data.documents) {
          await this.saveDocument(document);
          importedItems++;
        }
      }
      
      if (importData.data.vocabulary) {
        for (const vocabulary of importData.data.vocabulary) {
          await this.saveVocabulary(vocabulary);
          importedItems++;
        }
      }
      
      if (importData.data.reviews) {
        for (const review of importData.data.reviews) {
          await this.saveReview(review);
          importedItems++;
        }
      }
      
      if (importData.data.notes) {
        for (const note of importData.data.notes) {
          await this.saveNote(note);
          importedItems++;
        }
      }
      
      if (importData.data.highlights) {
        for (const highlight of importData.data.highlights) {
          await this.saveHighlight(highlight);
          importedItems++;
        }
      }

      // 更新统计数据
      await this._updateOfflineStats();

      showSuccess(`成功导入 ${importedItems} 条数据`);
      
      return {
        success: true,
        message: `成功导入 ${importedItems} 条数据`,
        importedItems
      };
    } catch (error) {
      console.error('导入离线数据失败:', error);
      showError('导入离线数据失败');
      
      return {
        success: false,
        message: error.message,
        importedItems: 0
      };
    }
  }

  /**
   * 设置离线模式
   * @param {boolean} enabled - 是否启用离线模式
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setOfflineMode(enabled) {
    try {
      this.offlineStore.setOfflineMode(enabled);
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('settings', {
        key: 'offlineMode',
        value: enabled,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('设置离线模式失败:', error);
      return false;
    }
  }

  /**
   * 获取离线模式状态
   * @returns {Promise<boolean>} 是否启用离线模式
   */
  async getOfflineMode() {
    try {
      const setting = await this._getFromIndexedDB('settings', 'offlineMode');
      return setting ? setting.value : false;
    } catch (error) {
      console.error('获取离线模式失败:', error);
      return false;
    }
  }

  /**
   * 设置自动同步
   * @param {boolean} enabled - 是否启用自动同步
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setAutoSync(enabled) {
    try {
      this.offlineStore.setAutoSync(enabled);
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('settings', {
        key: 'autoSync',
        value: enabled,
        updatedAt: new Date().toISOString()
      });
      
      // 启动或停止同步定时器
      if (enabled) {
        this._startAutoSync();
      } else {
        this._stopAutoSync();
      }
      
      return true;
    } catch (error) {
      console.error('设置自动同步失败:', error);
      return false;
    }
  }

  /**
   * 获取自动同步状态
   * @returns {Promise<boolean>} 是否启用自动同步
   */
  async getAutoSync() {
    try {
      const setting = await this._getFromIndexedDB('settings', 'autoSync');
      return setting ? setting.value : true; // 默认启用
    } catch (error) {
      console.error('获取自动同步失败:', error);
      return true;
    }
  }

  /**
   * 设置同步间隔
   * @param {number} minutes - 同步间隔（分钟）
   * @returns {Promise<boolean>} 是否设置成功
   */
  async setSyncInterval(minutes) {
    try {
      if (minutes < 1 || minutes > 1440) {
        throw new Error('同步间隔必须在1-1440分钟之间');
      }
      
      this.offlineStore.setSyncInterval(minutes);
      
      // 保存到IndexedDB
      await this._saveToIndexedDB('settings', {
        key: 'syncInterval',
        value: minutes,
        updatedAt: new Date().toISOString()
      });
      
      // 重启自动同步
      const autoSync = await this.getAutoSync();
      if (autoSync) {
        this._stopAutoSync();
        this._startAutoSync();
      }
      
      return true;
    } catch (error) {
      console.error('设置同步间隔失败:', error);
      return false;
    }
  }

  /**
   * 获取同步间隔
   * @returns {Promise<number>} 同步间隔（分钟）
   */
  async getSyncInterval() {
    try {
      const setting = await this._getFromIndexedDB('settings', 'syncInterval');
      return setting ? setting.value : 5; // 默认5分钟
    } catch (error) {
      console.error('获取同步间隔失败:', error);
      return 5;
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 网络恢复时的处理
   */
  async _onNetworkRestored() {
    console.log('网络已恢复');
    showInfo('网络已恢复，开始同步数据...');
    
    // 更新store状态
    this.offlineStore.setOnline(true);
    
    // 开始同步
    const autoSync = await this.getAutoSync();
    if (autoSync) {
      this.syncOfflineData({ background: true }).catch(error => {
        console.error('自动同步失败:', error);
      });
    }
  }

  /**
   * 网络断开时的处理
   */
  _onNetworkLost() {
    console.log('网络已断开');
    showWarning('网络已断开，正在使用离线模式');
    
    // 更新store状态
    this.offlineStore.setOnline(false);
  }

  /**
   * 页面可见时的处理
   */
  async _onPageVisible() {
    console.log('页面变为可见');
    
    // 检查网络状态
    if (this.isOnline) {
      const autoSync = await this.getAutoSync();
      if (autoSync) {
        // 延迟一点时间再同步，避免影响用户体验
        setTimeout(() => {
          this.syncOfflineData({ background: true }).catch(error => {
            console.error('页面可见时同步失败:', error);
          });
        }, 3000);
      }
    }
  }

  /**
   * 应用安装时的处理
   */
  _onAppInstalled() {
    console.log('应用已安装');
    
    // 可以在这里执行一些安装后的初始化操作
    // 例如：预缓存重要数据、设置默认配置等
  }

  /**
   * 加载离线数据
   */
  async _loadOfflineData() {
    try {
      // 加载文档
      const documents = await this.getAllOfflineDocuments();
      this.offlineStore.setOfflineDocuments(documents);
      
      // 加载词汇
      const vocabulary = await this.getAllOfflineVocabulary();
      this.offlineStore.setOfflineVocabulary(vocabulary);
      
      // 加载复习记录
      const reviews = await this.getAllOfflineReviews();
      this.offlineStore.setOfflineReviews(reviews);
      
      // 加载设置
      const offlineMode = await this.getOfflineMode();
      this.offlineStore.setOfflineMode(offlineMode);
      
      const autoSync = await this.getAutoSync();
      this.offlineStore.setAutoSync(autoSync);
      
      const syncInterval = await this.getSyncInterval();
      this.offlineStore.setSyncInterval(syncInterval);
      
      // 启动自动同步
      if (autoSync && this.isOnline) {
        this._startAutoSync();
      }
      
      // 更新统计数据
      await this._updateOfflineStats();
      
      console.log('离线数据加载完成');
    } catch (error) {
      console.error('加载离线数据失败:', error);
    }
  }

  /**
   * 保存到IndexedDB
   * @param {string} storeName - 存储名称
   * @param {Object} data - 要保存的数据
   * @returns {Promise<void>}
   */
  async _saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB未初始化'));
        return;
      }
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 从IndexedDB获取数据
   * @param {string} storeName - 存储名称
   * @param {string} key - 数据键
   * @returns {Promise<Object|null>} 数据
   */
  async _getFromIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }
      
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = (event) => resolve(event.target.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 从IndexedDB获取所有数据
   * @param {string} storeName - 存储名称
   * @returns {Promise<Array>} 数据列表
   */
  async _getAllFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = (event) => resolve(event.target.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 清除对象存储
   * @param {string} storeName - 存储名称
   * @returns {Promise<void>}
   */
  async _clearObjectStore(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 添加到同步队列
   * @param {Object} operation - 操作数据
   * @returns {Promise<void>}
   */
  async _addToSyncQueue(operation) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const queueItem = {
        ...operation,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };
      
      const request = store.add(queueItem);
      
      request.onsuccess = () => {
        this.syncQueue.push(queueItem);
        this.offlineStore.addPendingOperation(queueItem);
        resolve();
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 获取同步队列
   * @returns {Promise<Array>} 同步队列
   */
  async _getSyncQueue() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('status');
      const request = index.getAll('pending');
      
      request.onsuccess = (event) => resolve(event.target.result || []);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 从同步队列移除
   * @param {number} id - 操作ID
   * @returns {Promise<void>}
   */
  async _removeFromSyncQueue(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);
      
      request.onsuccess = () => {
        this.syncQueue = this.syncQueue.filter(item => item.id !== id);
        this.offlineStore.removePendingOperation(id);
        resolve();
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 更新重试次数
   * @param {number} id - 操作ID
   * @returns {Promise<void>}
   */
  async _updateRetryCount(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const operation = event.target.result;
        if (operation) {
          operation.retryCount = (operation.retryCount || 0) + 1;
          
          if (operation.retryCount >= this.maxRetries) {
            operation.status = 'failed';
          }
          
          const updateRequest = store.put(operation);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (updateEvent) => reject(updateEvent.target.error);
        } else {
          resolve();
        }
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 标记为已同步
   * @param {Object} operation - 操作数据
   * @returns {Promise<void>}
   */
  async _markAsSynced(operation) {
    const { type, data } = operation;
    
    switch (type) {
      case 'document':
        await this._updateDocumentSyncStatus(data.id, true);
        break;
      case 'vocabulary':
        await this._updateVocabularySyncStatus(data.id, true);
        break;
      case 'review':
        await this._updateReviewSyncStatus(data.id, true);
        break;
      case 'note':
        await this._updateNoteSyncStatus(data.id, true);
        break;
      case 'highlight':
        await this._updateHighlightSyncStatus(data.id, true);
        break;
    }
  }

  /**
   * 更新文档同步状态
   * @param {string} documentId - 文档ID
   * @param {boolean} isSynced - 是否已同步
   * @returns {Promise<void>}
   */
  async _updateDocumentSyncStatus(documentId, isSynced) {
    const document = await this.getOfflineDocument(documentId);
    if (document) {
      document.isSynced = isSynced;
      document.updatedAt = new Date().toISOString();
      await this._saveToIndexedDB('documents', document);
      
      // 更新store
      this.offlineStore.updateOfflineDocument(documentId, document);
    }
  }

  /**
   * 更新词汇同步状态
   * @param {string} vocabularyId - 词汇ID
   * @param {boolean} isSynced - 是否已同步
   * @returns {Promise<void>}
   */
  async _updateVocabularySyncStatus(vocabularyId, isSynced) {
    const vocabulary = await this.getOfflineVocabulary(vocabularyId);
    if (vocabulary) {
      vocabulary.isSynced = isSynced;
      vocabulary.updatedAt = new Date().toISOString();
      await this._saveToIndexedDB('vocabulary', vocabulary);
      
      // 更新store
      this.offlineStore.updateOfflineVocabulary(vocabularyId, vocabulary);
    }
  }

  /**
   * 更新复习记录同步状态
   * @param {string} reviewId - 复习记录ID
   * @param {boolean} isSynced - 是否已同步
   * @returns {Promise<void>}
   */
  async _updateReviewSyncStatus(reviewId, isSynced) {
    const review = await this._getFromIndexedDB('reviews', reviewId);
    if (review) {
      review.isSynced = isSynced;
      await this._saveToIndexedDB('reviews', review);
      
      // 更新store
      this.offlineStore.updateOfflineReview(reviewId, review);
    }
  }

  /**
   * 更新笔记同步状态
   * @param {string} noteId - 笔记ID
   * @param {boolean} isSynced - 是否已同步
   * @returns {Promise<void>}
   */
  async _updateNoteSyncStatus(noteId, isSynced) {
    const note = await this._getFromIndexedDB('notes', noteId);
    if (note) {
      note.isSynced = isSynced;
      await this._saveToIndexedDB('notes', note);
      
      // 更新store
      this.offlineStore.updateOfflineNote(noteId, note);
    }
  }

  /**
   * 更新高亮同步状态
   * @param {string} highlightId - 高亮ID
   * @param {boolean} isSynced - 是否已同步
   * @returns {Promise<void>}
   */
  async _updateHighlightSyncStatus(highlightId, isSynced) {
    const highlight = await this._getFromIndexedDB('highlights', highlightId);
    if (highlight) {
      highlight.isSynced = isSynced;
      await this._saveToIndexedDB('highlights', highlight);
      
      // 更新store
      this.offlineStore.updateOfflineHighlight(highlightId, highlight);
    }
  }

  /**
   * 处理同步队列
   */
  async _processSyncQueue() {
    if (this.isOnline && !this.isSyncing) {
      await this.syncOfflineData({ background: true });
    }
  }

  /**
   * 开始自动同步
   */
  _startAutoSync() {
    this._stopAutoSync();
    
    this.getSyncInterval().then(interval => {
      const intervalMs = interval * 60 * 1000;
      
      this.syncInterval = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncOfflineData({ background: true }).catch(error => {
            console.error('自动同步失败:', error);
          });
        }
      }, intervalMs);
      
      console.log(`自动同步已启动，间隔: ${interval}分钟`);
    });
  }

  /**
   * 停止自动同步
   */
  _stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('自动同步已停止');
    }
  }

  /**
   * 更新离线统计
   */
  async _updateOfflineStats() {
    try {
      // 获取各存储的数据量
      const documents = await this.getAllOfflineDocuments();
      const vocabulary = await this.getAllOfflineVocabulary();
      const reviews = await this.getAllOfflineReviews();
      const notes = await this._getAllFromIndexedDB('notes');
      const highlights = await this._getAllFromIndexedDB('highlights');
      
      // 计算未同步的数据
      const unsyncedDocuments = documents.filter(doc => !doc.isSynced).length;
      const unsyncedVocabulary = vocabulary.filter(voc => !voc.isSynced).length;
      const unsyncedReviews = reviews.filter(rev => !rev.isSynced).length;
      const unsyncedNotes = notes.filter(note => !note.isSynced).length;
      const unsyncedHighlights = highlights.filter(h => !h.isSynced).length;
      
      // 计算总数据大小（估算）
      const totalSize = JSON.stringify(documents).length +
                       JSON.stringify(vocabulary).length +
                       JSON.stringify(reviews).length +
                       JSON.stringify(notes).length +
                       JSON.stringify(highlights).length;
      
      // 更新store
      this.offlineStore.setOfflineDataSize(totalSize);
      this.offlineStore.setPendingOperations(
        unsyncedDocuments + unsyncedVocabulary + unsyncedReviews + 
        unsyncedNotes + unsyncedHighlights
      );
    } catch (error) {
      console.error('更新离线统计失败:', error);
    }
  }

  /**
   * 同步操作
   * @param {Object} operation - 操作数据
   * @returns {Promise<Object>} 同步结果
   */
  async _syncOperation(operation) {
    const { type, action, data } = operation;
    
    try {
      let result;
      
      switch (type) {
        case 'document':
          if (action === 'save') {
            // API 调用需要传递对象参数
            result = await api.syncDocument({ document: data });
          }
          break;
          
        case 'vocabulary':
          if (action === 'save') {
            // API 调用需要传递对象参数
            result = await api.syncVocabulary({ vocabulary: data });
          }
          break;
          
        case 'review':
          if (action === 'save') {
            // API 调用需要传递对象参数
            result = await api.syncReview({ review: data });
          }
          break;
          
        case 'note':
          if (action === 'save') {
            // API 调用需要传递对象参数
            result = await api.syncNote({ note: data });
          }
          break;
          
        case 'highlight':
          if (action === 'save') {
            // API 调用需要传递对象参数
            result = await api.syncHighlight({ highlight: data });
          }
          break;
          
        default:
          throw new Error(`未知的操作类型: ${type}`);
      }
      
      return {
        success: true,
        data: result?.data
      };
    } catch (error) {
      console.error(`同步操作失败 (${type}.${action}):`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 确认清除缓存
   * @returns {Promise<boolean>} 用户是否确认
   */
  async _confirmClearCache() {
    return new Promise((resolve) => {
      const confirmed = window.confirm('确定要清除所有离线缓存吗？此操作不可撤销。');
      resolve(confirmed);
    });
  }

  /**
   * 确认导入
   * @param {Object} importData - 导入数据
   * @returns {Promise<boolean>} 用户是否确认
   */
  async _confirmImport(importData) {
    return new Promise((resolve) => {
      const itemCount = Object.values(importData.data || {}).reduce(
        (total, items) => total + (items?.length || 0), 0
      );
      
      const message = `确定要导入 ${itemCount} 条数据吗？`;
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  /**
   * 读取文件
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件内容
   */
  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * 检测文件格式
   * @param {File} file - 文件对象
   * @returns {string} 文件格式
   */
  _detectFileFormat(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      return 'json';
    } else if (fileName.endsWith('.csv')) {
      return 'csv';
    } else {
      // 根据内容猜测
      return 'json'; // 默认
    }
  }

  /**
   * 转换为CSV
   * @param {Object} data - 数据对象
   * @returns {string} CSV字符串
   */
  _convertToCSV(data) {
    // 简化实现，实际项目中可能需要更复杂的CSV转换
    const rows = [];
    
    // 添加标题行
    rows.push('type,id,title,createdAt,updatedAt');
    
    // 添加数据行
    if (data.data.documents) {
      data.data.documents.forEach(doc => {
        rows.push(`document,${doc.id},"${doc.title}",${doc.createdAt},${doc.updatedAt}`);
      });
    }
    
    if (data.data.vocabulary) {
      data.data.vocabulary.forEach(voc => {
        rows.push(`vocabulary,${voc.id},"${voc.word}",${voc.createdAt},${voc.updatedAt}`);
      });
    }
    
    return rows.join('\n');
  }

  /**
   * 解析CSV
   * @param {string} csvString - CSV字符串
   * @returns {Object} 解析后的数据
   */
  _parseCSV(csvString) {
    // 简化实现，实际项目中可能需要更复杂的CSV解析
    const lines = csvString.split('\n');
    const headers = lines[0].split(',');
    
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        source: 'csv_import'
      },
      data: {
        documents: [],
        vocabulary: []
      }
    };
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
      });
      
      if (row.type === 'document') {
        data.data.documents.push({
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      } else if (row.type === 'vocabulary') {
        data.data.vocabulary.push({
          id: row.id,
          word: row.title,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        });
      }
    }
    
    return data;
  }

  /**
   * 验证导入数据
   * @param {Object} data - 导入数据
   */
  _validateImportData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('导入数据格式无效');
    }
    
    if (!data.data || typeof data.data !== 'object') {
      throw new Error('导入数据缺少data字段');
    }
    
    // 验证各数据类型的格式
    const validTypes = ['documents', 'vocabulary', 'reviews', 'notes', 'highlights'];
    
    for (const type of validTypes) {
      if (data.data[type] && !Array.isArray(data.data[type])) {
        throw new Error(`${type}数据必须是数组`);
      }
    }
  }

  /**
   * 错误处理
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  _handleError(error, context) {
    console.error(`${context}:`, error);
    
    if (error.response) {
      const status = error.response.status;
      let message = context;
      
      switch (status) {
        case 400:
          message = error.response.data?.message || '请求参数错误';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限执行此操作';
          break;
        case 404:
          message = '资源不存在';
          break;
        case 409:
          message = '数据冲突';
          break;
        case 422:
          message = '数据格式错误';
          break;
        case 500:
          message = '服务器错误，请稍后重试';
          break;
        case 503:
          message = '服务暂时不可用';
          break;
      }
      
      showError(message);
    } else if (error.request) {
      showError('网络连接失败，请检查网络设置');
    } else {
      showError(error.message || context);
    }
  }
}

// 创建单例实例
const offlineService = new OfflineService();

export default offlineService;