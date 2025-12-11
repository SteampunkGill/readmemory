// src/api/vocabulary.js
import { apiClient } from './index'

/**
 * 词汇管理模块 API
 * 实现了词汇资源的完整CRUD操作
 */

// 1. 查询单词
export const lookupWord = (params) => {
  const { word, language = 'en' } = params
  return apiClient.get('/words/lookup', {
    params: { word, language },
  })
}

// 2. 批量查询单词
export const batchLookupWords = (params) => {
  const { words, language = 'en' } = params
  return apiClient.post('/words/batch-lookup', {
    words,
    language,
  })
}

// 3. 添加到生词本 (Create)
export const addToVocabulary = (data) => {
  return apiClient.post('/vocabulary', data)
}

// 4. 获取生词本列表 (Read - List)
export const getVocabularyList = (params = {}) => {
  return apiClient.get('/vocabulary', { params })
}

// 5. 获取单个生词详情 (Read - Single)
export const getVocabularyItem = (userVocabId) => {
  return apiClient.get(`/vocabulary/${userVocabId}`)
}

// 6. 更新生词状态 (Update)
export const updateVocabularyItem = (userVocabId, data) => {
  return apiClient.put(`/vocabulary/${userVocabId}`, data)
}

// 7. 删除生词 (Delete)
export const deleteVocabularyItem = (userVocabId) => {
  return apiClient.delete(`/vocabulary/${userVocabId}`)
}

// 8. 批量操作生词
export const batchVocabularyAction = (params) => {
  const { action, user_vocab_ids } = params
  return apiClient.post('/vocabulary/batch', {
    action,
    user_vocab_ids,
  })
}

// 9. 批量更新生词
export const batchUpdateVocabulary = (data) => {
  return apiClient.put('/vocabulary/batch', data)
}

// 10. 获取生词统计
export const getVocabularyStats = () => {
  return apiClient.get('/vocabulary/stats')
}

// 11. 获取学习统计
export const getLearningStats = (params = {}) => {
  return apiClient.get('/vocabulary/learning-stats', { params })
}

// 12. 获取复习统计
export const getReviewStats = () => {
  return apiClient.get('/vocabulary/review-stats')
}

// 13. 导出生词本
export const exportVocabulary = (params = {}) => {
  const { format = 'csv', ...options } = params
  return apiClient.get('/vocabulary/export', {
    params: { format, ...options },
    responseType: 'blob',
  })
}

// 14. 导入生词本
export const importVocabulary = (file, format = 'csv') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('format', format)

  return apiClient.post('/vocabulary/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 15. 搜索生词本
export const searchVocabulary = (params) => {
  const { query, ...otherParams } = params
  return apiClient.get('/vocabulary/search', {
    params: { query, ...otherParams },
  })
}

// 16. 获取相似单词
export const getSimilarWords = (params) => {
  const { word, language = 'en' } = params
  return apiClient.get('/words/similar', {
    params: { word, language },
  })
}

// 17. 获取单词例句
export const getWordExamples = (params) => {
  const { word, language = 'en', limit = 5 } = params
  return apiClient.get('/words/examples', {
    params: { word, language, limit },
  })
}

// 18. 标记单词为已掌握
export const markAsMastered = (userVocabId) => {
  return apiClient.put(`/vocabulary/${userVocabId}/mastered`)
}

// 19. 重置单词学习状态
export const resetLearningStatus = (userVocabId) => {
  return apiClient.put(`/vocabulary/${userVocabId}/reset`)
}

/**
 * 对外暴露的词汇管理API接口
 * 提供了完整的词汇CRUD操作集合
 */
export default {
  // 单词查询
  lookupWord,
  batchLookupWords,
  getSimilarWords,
  getWordExamples,

  // 生词本CRUD
  addToVocabulary,
  getVocabularyList,
  getVocabularyItem,
  updateVocabularyItem,
  deleteVocabularyItem,

  // 批量操作
  batchVocabularyAction,
  batchUpdateVocabulary,

  // 统计
  getVocabularyStats,
  getLearningStats,
  getReviewStats,

  // 导入导出
  exportVocabulary,
  importVocabulary,

  // 搜索
  searchVocabulary,

  // 学习状态管理
  markAsMastered,
  resetLearningStatus,
}
