// src/api/reader.js
import { apiClient } from './index';

/**
 * 阅读器模块 API
 * 实现了阅读器相关的完整CRUD操作
 */

// 1. 获取文档页面内容
export const getDocumentPage = (documentId, pageNumber) => {
  return apiClient.get(`/documents/${documentId}/pages/${pageNumber}`);
};

// 2. 更新阅读进度
export const updateReadingProgress = (documentId, data) => {
  return apiClient.put(`/documents/${documentId}/reading-progress`, data);
};

// 3. 添加高亮 (Create)
export const addHighlight = (documentId, data) => {
  return apiClient.post(`/documents/${documentId}/highlights`, data);
};

// 4. 获取文档所有高亮 (Read - List) - 文档中未明确列出，但通常需要
export const getHighlights = (documentId, params = {}) => {
  return apiClient.get(`/documents/${documentId}/highlights`, { params });
};

// 5. 获取单个高亮详情 (Read - Single) - 文档中未明确列出，但通常需要
export const getHighlightById = (documentId, highlightId) => {
  return apiClient.get(`/documents/${documentId}/highlights/${highlightId}`);
};

// 6. 更新高亮 (Update) - 文档中未明确列出，但通常需要
export const updateHighlight = (documentId, highlightId, data) => {
  return apiClient.put(`/documents/${documentId}/highlights/${highlightId}`, data);
};

// 7. 删除高亮 (Delete) - 文档中未明确列出，但通常需要
export const deleteHighlight = (documentId, highlightId) => {
  return apiClient.delete(`/documents/${documentId}/highlights/${highlightId}`);
};

// 8. 批量操作高亮 - 文档中未明确列出，但通常需要
export const batchUpdateHighlights = (documentId, highlightIds, updates) => {
  return apiClient.put(`/documents/${documentId}/highlights/batch`, {
    highlightIds,
    ...updates,
  });
};

// 9. 添加笔记 (Create)
export const addNote = (documentId, data) => {
  return apiClient.post(`/documents/${documentId}/notes`, data);
};

// 10. 获取文档所有笔记 (Read - List) - 文档中未明确列出，但通常需要
export const getNotes = (documentId, params = {}) => {
  return apiClient.get(`/documents/${documentId}/notes`, { params });
};

// 11. 获取单个笔记详情 (Read - Single) - 文档中未明确列出，但通常需要
export const getNoteById = (documentId, noteId) => {
  return apiClient.get(`/documents/${documentId}/notes/${noteId}`);
};

// 12. 更新笔记 (Update) - 文档中未明确列出，但通常需要
export const updateNote = (documentId, noteId, data) => {
  return apiClient.put(`/documents/${documentId}/notes/${noteId}`, data);
};

// 13. 删除笔记 (Delete) - 文档中未明确列出，但通常需要
export const deleteNote = (documentId, noteId) => {
  return apiClient.delete(`/documents/${documentId}/notes/${noteId}`);
};

// 14. 搜索文档内容
export const searchDocumentContent = (documentId, query, params = {}) => {
  return apiClient.get(`/documents/${documentId}/search`, {
    params: { query, ...params },
  });
};

// 15. 获取文档目录/大纲 - 文档中未明确列出，但通常需要
export const getDocumentOutline = (documentId) => {
  return apiClient.get(`/documents/${documentId}/outline`);
};

// 16. 添加书签 - 文档中未明确列出，但通常需要
export const addBookmark = (documentId, pageNumber) => {
  return apiClient.post(`/documents/${documentId}/bookmarks`, { pageNumber });
};

// 17. 获取书签列表 - 文档中未明确列出，但通常需要
export const getBookmarks = (documentId) => {
  return apiClient.get(`/documents/${documentId}/bookmarks`);
};

// 18. 删除书签 - 文档中未明确列出，但通常需要
export const deleteBookmark = (documentId, bookmarkId) => {
  return apiClient.delete(`/documents/${documentId}/bookmarks/${bookmarkId}`);
};

// 19. 获取阅读历史 - 文档中未明确列出，但通常需要
export const getReadingHistory = (documentId, limit = 10) => {
  return apiClient.get(`/documents/${documentId}/reading-history`, {
    params: { limit },
  });
};

// 20. 清空阅读历史 - 文档中未明确列出，但通常需要
export const clearReadingHistory = (documentId) => {
  return apiClient.delete(`/documents/${documentId}/reading-history`);
};
export const lookupWord = (word, language = 'en') => {
  if (!word) {
    return Promise.reject(new Error('查询的单词不能为空'));
  }
  return apiClient.get('/dictionary/lookup', {
    params: {
      word,
      language,
    },
  });
};

/**
 * 对外暴露的阅读器API接口
 * 提供了完整的阅读器相关CRUD操作集合
 */
export default {
  // 页面和进度
  getDocumentPage,
  updateReadingProgress,
  
  // 高亮操作
  addHighlight,
  getHighlights,
  getHighlightById,
  updateHighlight,
  deleteHighlight,
  batchUpdateHighlights,
  
  // 笔记操作
  addNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  
  // 搜索和导航
  searchDocumentContent,
  getDocumentOutline,
  
  // 书签和历史
  addBookmark,
  getBookmarks,
  deleteBookmark,
  getReadingHistory,
  clearReadingHistory,
  lookupWord, 
};