// src/stores/offline.store.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useOfflineStore = defineStore('offline', () => {
  // ==================== 状态定义 ====================
  
  // 离线文档列表
  const offlineDocuments = ref([]);
  
  // 离线词汇列表
  const offlineVocabulary = ref([]);
  
  // 离线复习记录
  const offlineReviews = ref([]);
  
  // 离线笔记
  const offlineNotes = ref([]);
  
  // 离线高亮
  const offlineHighlights = ref([]);
  
  // 同步队列
  const syncQueue = ref([]);
  
  // 同步状态
  const syncStatus = ref({
    isSyncing: false,
    lastSyncTime: null,
    syncProgress: 0,
    syncError: null,
    pendingOperations: 0
  });
  
  // 离线设置
  const offlineSettings = ref({
    offlineMode: false,
    autoSync: true,
    syncInterval: 5, // 分钟
    storageLimit: 1024, // MB
    wifiOnly: true
  });
  
  // 离线统计
  const offlineStats = ref({
    totalSize: 0,
    documentCount: 0,
    vocabularyCount: 0,
    reviewCount: 0,
    noteCount: 0,
    highlightCount: 0
  });
  
  // 加载状态
  const loading = ref(false);
  
  // 错误信息
  const error = ref(null);
  
  // ==================== 计算属性 ====================
  
  // 离线数据总量
  const totalOfflineData = computed(() => 
    offlineStats.value.totalSize
  );
  
  // 未同步操作数量
  const unsyncedOperations = computed(() => 
    syncQueue.value.filter(op => !op.isSynced).length
  );
  
  // 离线模式状态
  const isOfflineMode = computed(() => 
    offlineSettings.value.offlineMode
  );
  
  // 自动同步状态
  const isAutoSync = computed(() => 
    offlineSettings.value.autoSync
  );
  
  // 存储使用率
  const storageUsage = computed(() => {
    const limit = offlineSettings.value.storageLimit * 1024 * 1024; // 转换为字节
    return limit > 0 ? (offlineStats.value.totalSize / limit) * 100 : 0;
  });
  
  // 存储是否已满
  const isStorageFull = computed(() => 
    storageUsage.value >= 95
  );
  
  // ==================== 动作方法 ====================
  
  /**
   * 设置离线文档列表
   * @param {Array} documents - 文档列表
   */
  const setOfflineDocuments = (documents) => {
    offlineDocuments.value = Array.isArray(documents) ? documents : [];
    offlineStats.value.documentCount = offlineDocuments.value.length;
  };
  
  /**
   * 添加离线文档
   * @param {Object} document - 文档对象
   */
  const addOfflineDocument = (document) => {
    if (document) {
      offlineDocuments.value.unshift(document);
      offlineStats.value.documentCount = offlineDocuments.value.length;
    }
  };
  
  /**
   * 更新离线文档
   * @param {string} documentId - 文档ID
   * @param {Object} updateData - 更新数据
   */
  const updateOfflineDocument = (documentId, updateData) => {
    const index = offlineDocuments.value.findIndex(doc => doc.id === documentId);
    if (index !== -1) {
      offlineDocuments.value[index] = { 
        ...offlineDocuments.value[index], 
        ...updateData 
      };
    }
  };
  
  /**
   * 删除离线文档
   * @param {string} documentId - 文档ID
   */
  const removeOfflineDocument = (documentId) => {
    offlineDocuments.value = offlineDocuments.value.filter(doc => doc.id !== documentId);
    offlineStats.value.documentCount = offlineDocuments.value.length;
  };
  
  /**
   * 清除所有离线文档
   */
  const clearOfflineDocuments = () => {
    offlineDocuments.value = [];
    offlineStats.value.documentCount = 0;
  };
  
  /**
   * 设置离线词汇列表
   * @param {Array} vocabulary - 词汇列表
   */
  const setOfflineVocabulary = (vocabulary) => {
    offlineVocabulary.value = Array.isArray(vocabulary) ? vocabulary : [];
    offlineStats.value.vocabularyCount = offlineVocabulary.value.length;
  };
  
  /**
   * 添加离线词汇
   * @param {Object} vocabulary - 词汇对象
   */
  const addOfflineVocabulary = (vocabulary) => {
    if (vocabulary) {
      offlineVocabulary.value.unshift(vocabulary);
      offlineStats.value.vocabularyCount = offlineVocabulary.value.length;
    }
  };
  
  /**
   * 更新离线词汇
   * @param {string} vocabularyId - 词汇ID
   * @param {Object} updateData - 更新数据
   */
  const updateOfflineVocabulary = (vocabularyId, updateData) => {
    const index = offlineVocabulary.value.findIndex(voc => voc.id === vocabularyId);
    if (index !== -1) {
      offlineVocabulary.value[index] = { 
        ...offlineVocabulary.value[index], 
        ...updateData 
      };
    }
  };
  
  /**
   * 清除所有离线词汇
   */
  const clearOfflineVocabulary = () => {
    offlineVocabulary.value = [];
    offlineStats.value.vocabularyCount = 0;
  };
  
  /**
   * 设置离线复习记录
   * @param {Array} reviews - 复习记录列表
   */
  const setOfflineReviews = (reviews) => {
    offlineReviews.value = Array.isArray(reviews) ? reviews : [];
    offlineStats.value.reviewCount = offlineReviews.value.length;
  };
  
  /**
   * 添加离线复习记录
   * @param {Object} review - 复习记录对象
   */
  const addOfflineReview = (review) => {
    if (review) {
      offlineReviews.value.unshift(review);
      offlineStats.value.reviewCount = offlineReviews.value.length;
    }
  };
  
  /**
   * 更新离线复习记录
   * @param {string} reviewId - 复习记录ID
   * @param {Object} updateData - 更新数据
   */
  const updateOfflineReview = (reviewId, updateData) => {
    const index = offlineReviews.value.findIndex(rev => rev.id === reviewId);
    if (index !== -1) {
      offlineReviews.value[index] = { 
        ...offlineReviews.value[index], 
        ...updateData 
      };
    }
  };
  
  /**
   * 清除所有离线复习记录
   */
  const clearOfflineReviews = () => {
    offlineReviews.value = [];
    offlineStats.value.reviewCount = 0;
  };
  
  /**
   * 设置离线笔记
   * @param {Array} notes - 笔记列表
   */
  const setOfflineNotes = (notes) => {
    offlineNotes.value = Array.isArray(notes) ? notes : [];
    offlineStats.value.noteCount = offlineNotes.value.length;
  };
  
  /**
   * 添加离线笔记
   * @param {Object} note - 笔记对象
   */
  const addOfflineNote = (note) => {
    if (note) {
      offlineNotes.value.unshift(note);
      offlineStats.value.noteCount = offlineNotes.value.length;
    }
  };
  
  /**
   * 更新离线笔记
   * @param {string} noteId - 笔记ID
   * @param {Object} updateData - 更新数据
   */
  const updateOfflineNote = (noteId, updateData) => {
    const index = offlineNotes.value.findIndex(n => n.id === noteId);
    if (index !== -1) {
      offlineNotes.value[index] = { 
        ...offlineNotes.value[index], 
        ...updateData 
      };
    }
  };
  
  /**
   * 清除所有离线笔记
   */
  const clearOfflineNotes = () => {
    offlineNotes.value = [];
    offlineStats.value.noteCount = 0;
  };
  
  /**
   * 设置离线高亮
   * @param {Array} highlights - 高亮列表
   */
  const setOfflineHighlights = (highlights) => {
    offlineHighlights.value = Array.isArray(highlights) ? highlights : [];
    offlineStats.value.highlightCount = offlineHighlights.value.length;
  };
  
  /**
   * 添加离线高亮
   * @param {Object} highlight - 高亮对象
   */
  const addOfflineHighlight = (highlight) => {
    if (highlight) {
      offlineHighlights.value.unshift(highlight);
      offlineStats.value.highlightCount = offlineHighlights.value.length;
    }
  };
  
  /**
   * 更新离线高亮
   * @param {string} highlightId - 高亮ID
   * @param {Object} updateData - 更新数据
   */
  const updateOfflineHighlight = (highlightId, updateData) => {
    const index = offlineHighlights.value.findIndex(h => h.id === highlightId);
    if (index !== -1) {
      offlineHighlights.value[index] = { 
        ...offlineHighlights.value[index], 
        ...updateData 
      };
    }
  };
  
  /**
   * 清除所有离线高亮
   */
  const clearOfflineHighlights = () => {
    offlineHighlights.value = [];
    offlineStats.value.highlightCount = 0;
  };
  
  /**
   * 设置同步队列
   * @param {Array} queue - 同步队列
   */
  const setSyncQueue = (queue) => {
    syncQueue.value = Array.isArray(queue) ? queue : [];
    syncStatus.value.pendingOperations = syncQueue.value.length;
  };
  
  /**
   * 添加到同步队列
   * @param {Object} operation - 同步操作
   */
  const addToSyncQueue = (operation) => {
    if (operation) {
      syncQueue.value.push(operation);
      syncStatus.value.pendingOperations = syncQueue.value.length;
    }
  };
  
  /**
   * 从同步队列移除
   * @param {string} operationId - 操作ID
   */
  const removeFromSyncQueue = (operationId) => {
    syncQueue.value = syncQueue.value.filter(op => op.id !== operationId);
    syncStatus.value.pendingOperations = syncQueue.value.length;
  };
  
  /**
   * 清除同步队列
   */
  const clearSyncQueue = () => {
    syncQueue.value = [];
    syncStatus.value.pendingOperations = 0;
  };
  
  /**
   * 设置同步状态
   * @param {Object} status - 同步状态
   */
  const setSyncStatus = (status) => {
    syncStatus.value = { ...syncStatus.value, ...status };
  };
  
  /**
   * 设置同步中状态
   * @param {boolean} isSyncing - 是否正在同步
   */
  const setSyncing = (isSyncing) => {
    syncStatus.value.isSyncing = isSyncing;
  };
  
  /**
   * 设置最后同步时间
   * @param {string} time - 时间字符串
   */
  const setLastSyncTime = (time) => {
    syncStatus.value.lastSyncTime = time;
  };
  
  /**
   * 设置同步进度
   * @param {number} progress - 进度百分比
   */
  const setSyncProgress = (progress) => {
    syncStatus.value.syncProgress = progress;
  };
  
  /**
   * 设置同步错误
   * @param {string|null} error - 错误信息
   */
  const setSyncError = (error) => {
    syncStatus.value.syncError = error;
  };
  
  /**
   * 设置离线设置
   * @param {Object} settings - 离线设置
   */
  const setOfflineSettings = (settings) => {
    offlineSettings.value = { ...offlineSettings.value, ...settings };
  };
  
  /**
   * 设置离线模式
   * @param {boolean} enabled - 是否启用离线模式
   */
  const setOfflineMode = (enabled) => {
    offlineSettings.value.offlineMode = enabled;
  };
  
  /**
   * 设置自动同步
   * @param {boolean} enabled - 是否启用自动同步
   */
  const setAutoSync = (enabled) => {
    offlineSettings.value.autoSync = enabled;
  };
  
  /**
   * 设置同步间隔
   * @param {number} minutes - 同步间隔（分钟）
   */
  const setSyncInterval = (minutes) => {
    offlineSettings.value.syncInterval = minutes;
  };
  
  /**
   * 设置存储限制
   * @param {number} limitMB - 存储限制（MB）
   */
  const setStorageLimit = (limitMB) => {
    offlineSettings.value.storageLimit = limitMB;
  };
  
  /**
   * 设置离线统计
   * @param {Object} stats - 离线统计
   */
  const setOfflineStats = (stats) => {
    offlineStats.value = { ...offlineStats.value, ...stats };
  };
  
  /**
   * 设置离线数据大小
   * @param {number} size - 数据大小（字节）
   */
  const setOfflineDataSize = (size) => {
    offlineStats.value.totalSize = size;
  };
  
  /**
   * 设置待处理操作数量
   * @param {number} count - 操作数量
   */
  const setPendingOperations = (count) => {
    syncStatus.value.pendingOperations = count;
  };
  
  /**
   * 设置在线状态
   * @param {boolean} isOnline - 是否在线
   */
  const setOnline = (isOnline) => {
    console.log('网络状态变化:', isOnline ? '在线' : '离线');
  };
  
  /**
   * 设置加载状态
   * @param {boolean} isLoading - 是否加载中
   */
  const setLoading = (isLoading) => {
    loading.value = isLoading;
  };
  
  /**
   * 设置错误信息
   * @param {string|null} err - 错误信息
   */
  const setError = (err) => {
    error.value = err;
  };
  
  /**
   * 重置Store状态
   */
  const reset = () => {
    offlineDocuments.value = [];
    offlineVocabulary.value = [];
    offlineReviews.value = [];
    offlineNotes.value = [];
    offlineHighlights.value = [];
    syncQueue.value = [];
    syncStatus.value = {
      isSyncing: false,
      lastSyncTime: null,
      syncProgress: 0,
      syncError: null,
      pendingOperations: 0
    };
    offlineSettings.value = {
      offlineMode: false,
      autoSync: true,
      syncInterval: 5,
      storageLimit: 1024,
      wifiOnly: true
    };
    offlineStats.value = {
      totalSize: 0,
      documentCount: 0,
      vocabularyCount: 0,
      reviewCount: 0,
      noteCount: 0,
      highlightCount: 0
    };
    loading.value = false;
    error.value = null;
  };
  
  return {
    // ==================== 状态 ====================
    offlineDocuments,
    offlineVocabulary,
    offlineReviews,
    offlineNotes,
    offlineHighlights,
    syncQueue,
    syncStatus,
    offlineSettings,
    offlineStats,
    loading,
    error,
    
    // ==================== 计算属性 ====================
    totalOfflineData,
    unsyncedOperations,
    isOfflineMode,
    isAutoSync,
    storageUsage,
    isStorageFull,
    
    // ==================== 动作方法 ====================
    // 文档管理
    setOfflineDocuments,
    addOfflineDocument,
    updateOfflineDocument,
    removeOfflineDocument,
    clearOfflineDocuments,
    
    // 词汇管理
    setOfflineVocabulary,
    addOfflineVocabulary,
    updateOfflineVocabulary,
    clearOfflineVocabulary,
    
    // 复习记录管理
    setOfflineReviews,
    addOfflineReview,
    updateOfflineReview,
    clearOfflineReviews,
    
    // 笔记管理
    setOfflineNotes,
    addOfflineNote,
    updateOfflineNote,
    clearOfflineNotes,
    
    // 高亮管理
    setOfflineHighlights,
    addOfflineHighlight,
    updateOfflineHighlight,
    clearOfflineHighlights,
    
    // 同步管理
    setSyncQueue,
    addToSyncQueue,
    removeFromSyncQueue,
    clearSyncQueue,
    setSyncStatus,
    setSyncing,
    setLastSyncTime,
    setSyncProgress,
    setSyncError,
    
    // 设置管理
    setOfflineSettings,
    setOfflineMode,
    setAutoSync,
    setSyncInterval,
    setStorageLimit,
    
    // 统计管理
    setOfflineStats,
    setOfflineDataSize,
    setPendingOperations,
    
    // 通用管理
    setOnline,
    setLoading,
    setError,
    reset,
  };
});