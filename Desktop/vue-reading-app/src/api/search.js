import { apiClient } from './index';

/**
 * 搜索模块 API
 * 实现了搜索功能的完整CRUD操作
 */

// ==================== 通用搜索接口 ====================

// 1. 全局搜索
export const globalSearch = (params = {}) => {
  return apiClient.get('/search', { params });
};

// 2. 搜索文档 - 修改为对象参数
export const searchDocuments = (params) => {
  const { query, ...restParams } = params;
  return apiClient.get('/search/documents', {
    params: { query, ...restParams },
  });
};

// 3. 搜索词汇 - 修改为对象参数
export const searchVocabulary = (params) => {
  const { query, ...restParams } = params;
  return apiClient.get('/search/vocabulary', {
    params: { query, ...restParams },
  });
};

// 4. 搜索笔记 - 修改为对象参数
export const searchNotes = (params) => {
  const { query, ...restParams } = params;
  return apiClient.get('/search/notes', {
    params: { query, ...restParams },
  });
};

// 5. 搜索高亮 - 修改为对象参数
export const searchHighlights = (params) => {
  const { query, ...restParams } = params;
  return apiClient.get('/search/highlights', {
    params: { query, ...restParams },
  });
};

// 6. 高级搜索 - 修改为对象参数
export const advancedSearch = (params) => {
  const { filters, ...restParams } = params;
  return apiClient.post('/search/advanced', {
    filters,
    ...restParams,
  });
};

// 7. 保存搜索记录 - 修改为对象参数
export const saveSearch = (params) => {
  const { query, searchType = 'global' } = params;
  return apiClient.post('/search/history', {
    query,
    search_type: searchType,
  });
};

// 8. 获取搜索历史
export const getSearchHistory = (params = {}) => {
  return apiClient.get('/search/history', { params });
};

// 9. 删除搜索历史 - 修改为对象参数
export const deleteSearchHistory = (params) => {
  const { searchId } = params;
  return apiClient.delete(`/search/history/${searchId}`);
};

// 10. 清空搜索历史
export const clearSearchHistory = (params = {}) => {
  return apiClient.delete('/search/history', { params });
};

// 11. 获取热门搜索 - 修改为对象参数
export const getPopularSearches = (params) => {
  const { limit = 10, ...restParams } = params;
  return apiClient.get('/search/popular', {
    params: { limit, ...restParams },
  });
};

// 12. 获取搜索建议 - 修改为对象参数
export const getSearchSuggestions = (params) => {
  const { query, limit = 5, ...restParams } = params;
  return apiClient.get('/search/suggestions', {
    params: { query, limit, ...restParams },
  });
};

// 13. 获取搜索统计
export const getSearchStats = (params = {}) => {
  return apiClient.get('/search/stats', { params });
};

// 14. 创建搜索过滤器 - 修改为对象参数
export const createSearchFilter = (params) => {
  const { data } = params;
  return apiClient.post('/search/filters', data);
};

// 15. 获取搜索过滤器
export const getSearchFilters = (params = {}) => {
  return apiClient.get('/search/filters', { params });
};

// ==================== 新增功能（服务层需要） ====================

// 16. 获取最近搜索
export const getRecentSearches = (params) => {
  const { limit = 10 } = params;
  return apiClient.get('/search/recent', {
    params: { limit },
  });
};

// 17. 保存搜索结果
export const saveSearchResult = (params) => {
  const { searchId, data } = params;
  return apiClient.post(`/search/save/${searchId}`, data);
};

// 18. 获取保存的搜索
export const getSavedSearches = (params = {}) => {
  return apiClient.get('/search/saved', { params });
};

// 19. 删除保存的搜索
export const deleteSavedSearch = (params) => {
  const { savedSearchId } = params;
  return apiClient.delete(`/search/saved/${savedSearchId}`);
};

// 20. 搜索联想
export const searchAutocomplete = (params) => {
  const { query, type = 'all', limit = 5 } = params;
  return apiClient.get('/search/autocomplete', {
    params: { query, type, limit },
  });
};

// 21. 语音搜索
export const voiceSearch = (params) => {
  const { audioBlob, language = 'zh-CN', maxResults = 1 } = params;
  const formData = new FormData();
  formData.append('audio', audioBlob);
  formData.append('language', language);
  formData.append('maxResults', maxResults);
  return apiClient.post('/search/voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 对外暴露的搜索模块API接口
 * 提供了完整的搜索功能CRUD操作集合
 */
export default {
  // 搜索功能
  globalSearch,
  searchDocuments,
  searchVocabulary,
  searchNotes,
  searchHighlights,
  advancedSearch,
  
  // 搜索历史
  saveSearch,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  
  // 搜索辅助
  getPopularSearches,
  getSearchSuggestions,
  getSearchStats,
  
  // 搜索过滤器
  createSearchFilter,
  getSearchFilters,
  
  // 新增功能
  getRecentSearches,
  saveSearchResult,
  getSavedSearches,
  deleteSavedSearch,
  searchAutocomplete,
  voiceSearch,
};