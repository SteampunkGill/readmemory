// src/api/export.js
import { apiClient } from './index';

/**
 * 数据导出模块 API
 * 根据服务层需求调整函数名和参数格式
 */

// 1. 导出文档（复数形式，匹配服务层调用）
export const exportDocuments = (params) => {
  const { documentIds, format = 'pdf', template = null, includeNotes = true, includeHighlights = true } = params;
  return apiClient.post('/export/documents/batch', {
    document_ids: documentIds,
    format,
    template,
    include_notes: includeNotes,
    include_highlights: includeHighlights
  }, {
    responseType: 'blob',
  });
};

// 2. 导出生词本（保持原函数名）
export const exportVocabulary = (params) => {
  const { vocabularyIds, format = 'xlsx', template = null, includeExamples = true, includeStatistics = true } = params;
  return apiClient.post('/export/vocabulary/batch', {
    vocabulary_ids: vocabularyIds,
    format,
    template,
    include_examples: includeExamples,
    include_statistics: includeStatistics
  }, {
    responseType: 'blob',
  });
};

// 3. 导出复习记录（新增函数）
export const exportReviews = (params) => {
  const { reviewIds, format = 'csv', template = null, dateRange = null } = params;
  return apiClient.post('/export/reviews/batch', {
    review_ids: reviewIds,
    format,
    template,
    date_range: dateRange
  }, {
    responseType: 'blob',
  });
};

// 4. 导出学习统计（新增函数）
export const exportStatistics = (params) => {
  const { format = 'pdf', template = null, dateRange = 'all', includeCharts = true } = params;
  return apiClient.get('/export/statistics', {
    params: {
      format,
      template,
      date_range: dateRange,
      include_charts: includeCharts
    },
    responseType: 'blob',
  });
};

// 5. 批量导出多种类型数据（新增函数）
export const batchExport = (params) => {
  const { types, format = 'zip', template = null } = params;
  return apiClient.post('/export/batch', {
    types,
    format,
    template
  }, {
    responseType: 'blob',
  });
};

// 6. 导出所有数据（完整备份）（新增函数）
export const exportAllData = (params) => {
  const { format = 'json', encrypt = false } = params;
  return apiClient.get('/export/all', {
    params: {
      format,
      encrypt
    },
    responseType: 'blob',
  });
};

// 7. 获取导出历史（新增函数）
export const getExportHistory = (params) => {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  return apiClient.get('/export/history', {
    params: {
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder
    }
  });
};

// 8. 获取导出模板（新增函数）
export const getExportTemplates = () => {
  return apiClient.get('/export/templates');
};

// 9. 获取支持的导出格式（调整参数格式）
export const getSupportedFormats = (params) => {
  const { exportType } = params;
  return apiClient.get('/export/formats', {
    params: { type: exportType }
  });
};

// 10. 创建导出模板（新增函数）
export const createExportTemplate = (params) => {
  return apiClient.post('/export/templates', params);
};

// 11. 删除导出历史记录（新增函数）
export const deleteExportHistory = (params) => {
  const { historyId } = params;
  return apiClient.delete(`/export/history/${historyId}`);
};

// 12. 导出为Anki卡片格式（新增函数）
export const exportToAnki = (params) => {
  const { vocabularyIds, deckName = '语言学习', includeAudio = true, includeImages = true } = params;
  return apiClient.post('/export/anki', {
    vocabulary_ids: vocabularyIds,
    deck_name: deckName,
    include_audio: includeAudio,
    include_images: includeImages
  }, {
    responseType: 'blob',
  });
};

// 13. 导出为Excel学习计划（新增函数）
export const exportStudyPlan = (params) => {
  const { startDate, endDate = null, dailyGoal = 20, includeProgress = true } = params;
  return apiClient.post('/export/study-plan', {
    start_date: startDate,
    end_date: endDate,
    daily_goal: dailyGoal,
    include_progress: includeProgress
  }, {
    responseType: 'blob',
  });
};

// 14. 导出笔记（保持原函数）
export const exportNotes = (params) => {
  const { noteIds, format = 'pdf', template = null } = params;
  return apiClient.post('/export/notes/batch', {
    note_ids: noteIds,
    format,
    template
  }, {
    responseType: 'blob',
  });
};

// 15. 导出高亮（保持原函数，调整参数格式）
export const exportHighlights = (params) => {
  const { documentId, format = 'json' } = params;
  return apiClient.get(`/export/documents/${documentId}/highlights`, {
    params: { format },
    responseType: 'blob',
  });
};

// 16. 导出阅读历史（保持原函数，调整参数格式）
export const exportReadingHistory = (params) => {
  const { format = 'csv' } = params;
  return apiClient.get('/export/reading-history', {
    params: { format },
    responseType: 'blob',
  });
};

// 17. 获取导出统计（保持原函数）
export const getExportStats = () => {
  return apiClient.get('/export/stats');
};

// 18. 清理过期导出文件（保持原函数）
export const cleanupExportFiles = () => {
  return apiClient.delete('/export/cleanup');
};

/**
 * 对外暴露的数据导出API接口
 * 根据服务层需求重新组织
 */
export default {
  // 核心导出功能
  exportDocuments,
  exportVocabulary,
  exportReviews,
  exportStatistics,
  batchExport,
  exportAllData,
  exportNotes,
  exportHighlights,
  exportReadingHistory,
  exportToAnki,
  exportStudyPlan,
  
  // 导出管理功能
  getExportHistory,
  getExportTemplates,
  getSupportedFormats,
  createExportTemplate,
  deleteExportHistory,
  getExportStats,
  cleanupExportFiles
};