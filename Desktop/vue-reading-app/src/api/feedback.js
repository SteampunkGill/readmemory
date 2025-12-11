import { apiClient } from './index';

// 1. 提交反馈 (Create)
export const submitFeedback = (data) => {
  return apiClient.post('/feedback', data);
};

// 2. 获取反馈列表 (Read)
export const getFeedbackList = (params = {}) => {
  return apiClient.get('/feedback', { params });
};

// 3. 获取反馈详情 (Read)
export const getFeedbackById = (params) => {
  const { feedbackId } = params;
  return apiClient.get(`/feedback/${feedbackId}`);
};

// 4. 更新反馈状态 (Update)
export const updateFeedbackStatus = (feedbackId, status) => {
  return apiClient.put(`/feedback/${feedbackId}/status`, { status });
};

// 5. 删除反馈 (Delete)
export const deleteFeedback = (feedbackId) => {
  return apiClient.delete(`/feedback/${feedbackId}`);
};

// 6. 回复反馈 (Create)
export const replyToFeedback = (feedbackId, message) => {
  return apiClient.post(`/feedback/${feedbackId}/reply`, { message });
};

// 7. 获取反馈回复 (Read)
export const getFeedbackReplies = (feedbackId) => {
  return apiClient.get(`/feedback/${feedbackId}/replies`);
};

// 8. 标记反馈为已读 (Update)
export const markFeedbackAsRead = (feedbackId) => {
  return apiClient.put(`/feedback/${feedbackId}/read`);
};

// 9. 标记反馈为已处理 (Update)
export const markFeedbackAsResolved = (feedbackId) => {
  return apiClient.put(`/feedback/${feedbackId}/resolve`);
};

// 10. 批量操作反馈 (Update/Delete)
export const batchFeedbackAction = (action, feedbackIds, data = {}) => {
  return apiClient.post('/feedback/batch', {
    action,
    feedback_ids: feedbackIds,
    ...data,
  });
};

// 11. 获取反馈统计 (Read)
export const getFeedbackStats = (params = {}) => {
  return apiClient.get('/feedback/stats', { params });
};

// 12. 获取反馈类型列表 (Read)
export const getFeedbackCategories = () => {
  return apiClient.get('/feedback/categories');
};

// 13. 创建反馈类型 (Create)
export const createFeedbackCategory = (data) => {
  return apiClient.post('/feedback/categories', data);
};

// 14. 更新反馈类型 (Update)
export const updateFeedbackCategory = (categoryId, data) => {
  return apiClient.put(`/feedback/categories/${categoryId}`, data);
};

// 15. 删除反馈类型 (Delete)
export const deleteFeedbackCategory = (categoryId) => {
  return apiClient.delete(`/feedback/categories/${categoryId}`);
};

// ==================== 新增函数（服务层需要） ====================

// 16. 添加评论到反馈 (Create) - 服务层需要
export const addComment = (feedbackId, commentData) => {
  return apiClient.post(`/feedback/${feedbackId}/comments`, commentData);
};

// 17. 投票反馈 (Update) - 服务层需要
export const voteFeedback = (feedbackId, voteType) => {
  return apiClient.post(`/feedback/${feedbackId}/vote`, { voteType });
};

// 18. 搜索反馈 (Read) - 服务层需要
export const searchFeedback = (keyword, options = {}) => {
  return apiClient.get('/feedback/search', {
    params: { keyword, ...options }
  });
};

// 19. 导出反馈数据 (Read) - 服务层需要
export const exportFeedback = (options = {}) => {
  return apiClient.get('/feedback/export', {
    params: options,
    responseType: 'blob'
  });
};

// ==================== 别名函数（保持向后兼容） ====================

// 20. getFeedbackById 的别名（服务层使用）
export const getFeedbackDetail = (params) => {
  return getFeedbackById(params);
};

// 21. updateFeedbackStatus 的扩展（服务层使用）
export const updateFeedback = (feedbackId, updateData) => {
  // 如果只更新状态，调用原有函数
  if (updateData.status && Object.keys(updateData).length === 1) {
    return updateFeedbackStatus(feedbackId, updateData.status);
  }
  // 否则调用新的更新接口
  return apiClient.put(`/feedback/${feedbackId}`, updateData);
};

// 22. getFeedbackStats 的别名（服务层使用）
export const getFeedbackStatistics = (params = {}) => {
  return getFeedbackStats(params);
};

// 23. getFeedbackCategories 的别名（服务层使用）
export const getFeedbackTypes = () => {
  return getFeedbackCategories();
};

/**
 * 对外暴露的反馈模块API接口
 * 提供了完整的反馈CRUD操作集合
 */
export default {
  // 基本反馈操作
  submitFeedback,
  getFeedbackList,
  getFeedbackById,
  getFeedbackDetail,
  updateFeedbackStatus,
  updateFeedback,
  deleteFeedback,
  
  // 反馈交互
  replyToFeedback,
  getFeedbackReplies,
  markFeedbackAsRead,
  markFeedbackAsResolved,
  addComment,
  voteFeedback,
  
  // 批量操作
  batchFeedbackAction,
  
  // 统计和分类
  getFeedbackStats,
  getFeedbackStatistics,
  getFeedbackCategories,
  getFeedbackTypes,
  createFeedbackCategory,
  updateFeedbackCategory,
  deleteFeedbackCategory,
  
  // 搜索和导出
  searchFeedback,
  exportFeedback,
};