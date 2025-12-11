// src/api/review.js
import { apiClient } from './index';

/**
 * 复习系统模块 API
 * 实现了复习系统的完整CRUD操作
 */

// 1. 获取待复习单词
export const getDueWords = (params = {}) => {
  return apiClient.get('/review/due-words', { params });
};

// 2. 获取智能复习单词
export const getSmartReviewWords = (params = {}) => {
  return apiClient.get('/review/smart-words', { params });
};

// 3. 提交复习结果 (Create)
export const submitReview = (data) => {
  return apiClient.post('/review/submit', data);
};

// 4. 获取复习统计 (Read)
export const getReviewStats = (params = {}) => {
  return apiClient.get('/review/stats', { params });
};

// 5. 获取复习历史 (Read - List)
export const getReviewHistory = (params = {}) => {
  return apiClient.get('/review/history', { params });
};

// 6. 获取单个复习会话详情 (Read - Single)
export const getReviewSession = (sessionId) => {
  return apiClient.get(`/review/sessions/${sessionId}`);
};

// 7. 删除复习历史 (Delete)
export const deleteReviewHistory = (sessionId) => {
  return apiClient.delete(`/review/sessions/${sessionId}`);
};

// 8. 清空所有复习历史 (Delete)
export const clearAllReviewHistory = () => {
  return apiClient.delete('/review/history');
};

// 9. 获取复习计划
export const getReviewPlan = () => {
  return apiClient.get('/review/plan');
};

// 10. 更新复习计划
export const updateReviewPlan = (data) => {
  return apiClient.put('/review/plan', data);
};

// 11. 跳过复习
export const skipReview = (userVocabId) => {
  return apiClient.post(`/review/skip/${userVocabId}`);
};

// 12. 重置复习进度
export const resetReviewProgress = (userVocabId) => {
  return apiClient.put(`/review/reset/${userVocabId}`);
};

// 13. 获取复习提醒设置
export const getReviewReminders = () => {
  return apiClient.get('/review/reminders');
};

// 14. 设置复习提醒
export const setReviewReminder = (data) => {
  return apiClient.post('/review/reminders', data);
};

// 15. 获取复习日历
export const getReviewCalendar = (params = {}) => {
  return apiClient.get('/review/calendar', { params });
};

// 16. 批量提交复习结果
export const batchSubmitReview = (data) => {
  return apiClient.post('/review/batch-submit', data);
};

// 17. 获取复习进度
export const getReviewProgress = () => {
  return apiClient.get('/review/progress');
};

// 18. 获取每日目标
export const getDailyGoal = () => {
  return apiClient.get('/review/daily-goal');
};

// 19. 更新每日目标
export const updateDailyGoal = (data) => {
  return apiClient.put('/review/daily-goal', data);
};

/**
 * 对外暴露的复习系统API接口
 * 提供了完整的复习系统CRUD操作集合
 */
export default {
  // 核心复习功能
  getDueWords,
  getSmartReviewWords,
  submitReview,
  batchSubmitReview,
  
  // 统计和历史
  getReviewStats,
  getReviewHistory,
  getReviewSession,
  deleteReviewHistory,
  clearAllReviewHistory,
  
  // 计划和管理
  getReviewPlan,
  updateReviewPlan,
  skipReview,
  resetReviewProgress,
  
  // 提醒和日历
  getReviewReminders,
  setReviewReminder,
  getReviewCalendar,

  // 进度和目标
  getReviewProgress,
  getDailyGoal,
  updateDailyGoal,
};