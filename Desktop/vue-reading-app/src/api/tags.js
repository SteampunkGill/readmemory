import { apiClient } from './index';

/**
 * 标签管理模块 API
 * 实现了标签资源的完整CRUD操作
 */

// ==================== 通用标签接口 ====================

// 1. 获取所有标签（通用）
export const getAllTags = (params = {}) => {
  return apiClient.get('/tags', { params });
};

// 2. 创建标签（通用）
export const createTag = (params) => {
  const { data } = params;
  return apiClient.post('/tags', data);
};

// 3. 更新标签（通用）
export const updateTag = (params) => {
  const { tagId, data } = params;
  return apiClient.put(`/tags/${tagId}`, data);
};

// 4. 删除标签（通用）
export const deleteTag = (params) => {
  const { tagId, force = false } = params;
  return apiClient.delete(`/tags/${tagId}`, { 
    params: { force } 
  });
};

// 5. 获取标签详情（通用）
export const getTagDetail = (params) => {
  const { tagId } = params;
  return apiClient.get(`/tags/${tagId}`);
};

// 6. 搜索标签（通用）- 修改为对象参数
export const searchTags = (params) => {
  const { query, type = 'all' } = params;
  return apiClient.get('/tags/search', {
    params: { query, type },
  });
};

// 7. 获取热门标签（通用）
export const getPopularTags = (params) => {
  const { limit = 10, timeRange = 'month' } = params;
  return apiClient.get('/tags/popular', {
    params: { limit, time_range: timeRange },
  });
};

// 8. 获取标签统计信息（通用）
export const getTagStatistics = (params = {}) => {
  return apiClient.get('/tags/statistics', { params });
};

// 9. 为文档添加标签
export const addTagToDocument = (params) => {
  const { documentId, tagId } = params;
  return apiClient.post(`/documents/${documentId}/tags/${tagId}`);
};

// 10. 从文档移除标签
export const removeTagFromDocument = (params) => {
  const { documentId, tagId } = params;
  return apiClient.delete(`/documents/${documentId}/tags/${tagId}`);
};

// 11. 批量更新文档标签
export const batchUpdateDocumentTags = (params) => {
  const { documentIds, tagIds, operation = 'replace' } = params;
  return apiClient.post('/documents/tags/batch', {
    document_ids: documentIds,
    tag_ids: tagIds,
    operation,
  });
};

// ==================== 文档标签接口（保持向后兼容） ====================

// 12. 获取文档标签列表
export const getDocumentTags = (params = {}) => {
  return apiClient.get('/tags/documents', { params });
};

// 13. 创建文档标签
export const createDocumentTag = (params) => {
  const { data } = params;
  return apiClient.post('/tags/documents', data);
};

// 14. 更新文档标签
export const updateDocumentTag = (params) => {
  const { tagId, data } = params;
  return apiClient.put(`/tags/documents/${tagId}`, data);
};

// 15. 删除文档标签
export const deleteDocumentTag = (params) => {
  const { tagId } = params;
  return apiClient.delete(`/tags/documents/${tagId}`);
};

// 16. 获取单个文档标签详情
export const getDocumentTagById = (params) => {
  const { tagId } = params;
  return apiClient.get(`/tags/documents/${tagId}`);
};

// 17. 批量操作文档标签
export const batchDocumentTags = (params) => {
  const { action, tagIds, data = {} } = params;
  return apiClient.post('/tags/documents/batch', {
    action,
    tag_ids: tagIds,
    ...data,
  });
};

// ==================== 生词标签接口（保持向后兼容） ====================

// 18. 获取生词标签列表
export const getVocabularyTags = (params = {}) => {
  return apiClient.get('/tags/vocabulary', { params });
};

// 19. 创建生词标签
export const createVocabularyTag = (params) => {
  const { data } = params;
  return apiClient.post('/tags/vocabulary', data);
};

// 20. 更新生词标签
export const updateVocabularyTag = (params) => {
  const { tagId, data } = params;
  return apiClient.put(`/tags/vocabulary/${tagId}`, data);
};

// 21. 删除生词标签
export const deleteVocabularyTag = (params) => {
  const { tagId } = params;
  return apiClient.delete(`/tags/vocabulary/${tagId}`);
};

// 22. 获取单个生词标签详情
export const getVocabularyTagById = (params) => {
  const { tagId } = params;
  return apiClient.get(`/tags/vocabulary/${tagId}`);
};

// 23. 批量操作生词标签
export const batchVocabularyTags = (params) => {
  const { action, tagIds, data = {} } = params;
  return apiClient.post('/tags/vocabulary/batch', {
    action,
    tag_ids: tagIds,
    ...data,
  });
};

// 24. 获取标签使用统计
export const getTagStats = (params) => {
  const { tagId } = params;
  return apiClient.get(`/tags/${tagId}/stats`);
};

// 25. 合并标签
export const mergeTags = (params) => {
  const { sourceTagId, targetTagId } = params;
  return apiClient.post('/tags/merge', {
    source_tag_id: sourceTagId,
    target_tag_id: targetTagId,
  });
};

/**
 * 对外暴露的标签管理API接口
 * 提供了完整的标签CRUD操作集合
 */
export default {
  // 通用标签接口
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getTagDetail,
  searchTags,
  getPopularTags,
  getTagStatistics,
  addTagToDocument,
  removeTagFromDocument,
  batchUpdateDocumentTags,
  
  // 文档标签接口（向后兼容）
  getDocumentTags,
  createDocumentTag,
  updateDocumentTag,
  deleteDocumentTag,
  getDocumentTagById,
  batchDocumentTags,
  
  // 生词标签接口（向后兼容）
  getVocabularyTags,
  createVocabularyTag,
  updateVocabularyTag,
  deleteVocabularyTag,
  getVocabularyTagById,
  batchVocabularyTags,
  
  // 其他标签操作
  getTagStats,
  mergeTags,
};