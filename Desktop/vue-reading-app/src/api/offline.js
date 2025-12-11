// src/api/offline.js
import { apiClient } from './index';

/**
 * 离线管理模块 API
 * 实现了离线资源的完整CRUD操作
 */

// 1. 获取离线文档列表 (Read - List)
export const getOfflineDocuments = () => {
  return apiClient.get('/offline/documents');
};

// 2. 下载文档到离线 (Create)
export const downloadDocumentOffline = (params) => {
  const { documentId } = params;
  return apiClient.post(`/offline/documents/${documentId}/download`);
};

// 3. 删除离线文档 (Delete)
export const deleteOfflineDocument = (params) => {
  const { offlineDocId } = params;
  return apiClient.delete(`/offline/documents/${offlineDocId}`);
};

// 4. 获取单个离线文档详情 (Read - Single)
export const getOfflineDocumentById = (params) => {
  const { offlineDocId } = params;
  return apiClient.get(`/offline/documents/${offlineDocId}`);
};

// 5. 更新离线文档信息 (Update)
export const updateOfflineDocument = (params) => {
  const { offlineDocId, data } = params;
  return apiClient.put(`/offline/documents/${offlineDocId}`, data);
};

// 6. 批量下载文档到离线 (Create)
export const batchDownloadOffline = (documentIds) => {
  return apiClient.post('/offline/documents/batch-download', {
    document_ids: documentIds,
  });
};

// 7. 批量删除离线文档 (Delete)
export const batchDeleteOffline = (offlineDocIds) => {
  return apiClient.delete('/offline/documents/batch', {
    data: { offline_doc_ids: offlineDocIds },
  });
};

// 8. 获取离线下载状态 (Read)
export const getOfflineDownloadStatus = (downloadId) => {
  return apiClient.get(`/offline/downloads/${downloadId}/status`);
};

// 9. 取消离线下载 (Delete)
export const cancelOfflineDownload = (downloadId) => {
  return apiClient.delete(`/offline/downloads/${downloadId}`);
};

// 10. 获取离线存储统计 (Read)
export const getOfflineStorageStats = () => {
  return apiClient.get('/offline/stats');
};

// 11. 清理离线缓存 (Delete)
export const clearOfflineCache = () => {
  return apiClient.delete('/offline/cache');
};

// 12. 设置离线存储限制 (Update)
export const setOfflineStorageLimit = (limitMB) => {
  return apiClient.put('/offline/storage-limit', { limit_mb: limitMB });
};

// 13. 获取离线设置 (Read)
export const getOfflineSettings = () => {
  return apiClient.get('/offline/settings');
};

// 14. 更新离线设置 (Update)
export const updateOfflineSettings = (data) => {
  return apiClient.put('/offline/settings', data);
};

// 15. 检查文档是否已离线 (Read)
export const checkDocumentOfflineStatus = (params) => {
  const { documentId } = params;
  return apiClient.get(`/offline/documents/${documentId}/status`);
};

// ==================== 新增同步函数（服务层需要） ====================

// 16. 同步文档数据 (Create/Update)
export const syncDocument = (data) => {
  return apiClient.post('/offline/sync/document', data);
};

// 17. 同步词汇数据 (Create/Update)
export const syncVocabulary = (data) => {
  return apiClient.post('/offline/sync/vocabulary', data);
};

// 18. 同步复习记录 (Create/Update)
export const syncReview = (data) => {
  return apiClient.post('/offline/sync/review', data);
};

// 19. 同步笔记数据 (Create/Update)
export const syncNote = (data) => {
  return apiClient.post('/offline/sync/note', data);
};

// 20. 同步高亮数据 (Create/Update)
export const syncHighlight = (data) => {
  return apiClient.post('/offline/sync/highlight', data);
};

// 21. 获取同步状态 (Read)
export const getSyncStatus = (params = {}) => {
  return apiClient.get('/offline/sync/status', { params });
};

// 22. 开始同步任务 (Create)
export const startSyncTask = (taskType) => {
  return apiClient.post('/offline/sync/task', { taskType });
};

// 23. 取消同步任务 (Delete)
export const cancelSyncTask = (taskId) => {
  return apiClient.delete(`/offline/sync/task/${taskId}`);
};

// 24. 获取同步历史 (Read)
export const getSyncHistory = (params = {}) => {
  return apiClient.get('/offline/sync/history', { params });
};

/**
 * 对外暴露的离线管理API接口
 * 提供了完整的离线管理CRUD操作集合
 */
export default {
  // 离线文档管理
  getOfflineDocuments,
  downloadDocumentOffline,
  deleteOfflineDocument,
  getOfflineDocumentById,
  updateOfflineDocument,
  
  // 批量操作
  batchDownloadOffline,
  batchDeleteOffline,
  
  // 下载管理
  getOfflineDownloadStatus,
  cancelOfflineDownload,
  
  // 存储管理
  getOfflineStorageStats,
  clearOfflineCache,
  setOfflineStorageLimit,
  
  // 设置和状态
  getOfflineSettings,
  updateOfflineSettings,
  checkDocumentOfflineStatus,
  
  // 新增：同步管理
  syncDocument,
  syncVocabulary,
  syncReview,
  syncNote,
  syncHighlight,
  getSyncStatus,
  startSyncTask,
  cancelSyncTask,
  getSyncHistory,
};