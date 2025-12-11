// src/api/user.js
import { apiClient } from './index';

/**
 * 用户中心模块 API
 * 实现了用户资源的完整CRUD操作
 */

// 1. 获取用户信息 (Read)
export const getUserProfile = () => {
  return apiClient.get('/user/profile');
};

// 2. 更新用户信息 (Update)
export const updateUserProfile = (data) => {
  return apiClient.put('/user/profile', data);
};

// 3. 获取学习统计 (Read)
export const getLearningStats = (params = {}) => {
  return apiClient.get('/user/learning-stats', { params });
};

// 4. 获取用户成就 (Read)
export const getUserAchievements = () => {
  return apiClient.get('/user/achievements');
};

// 5. 删除用户账户 (Delete)
export const deleteAccount = (data) => {
  const { password } = data;
  return apiClient.delete('/user/account', {
    data: { password },
  });
};

// 6. 更新用户头像
export const updateAvatar = (data) => {
  const { file, onUploadProgress } = data;
  const formData = new FormData();
  formData.append('avatar', file);
  
  return apiClient.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress
  });
};

// 7. 获取用户活动日志
export const getUserActivityLog = (params = {}) => {
  return apiClient.get('/user/activity-log', { params });
};

// 8. 获取用户活动（别名，与getUserActivityLog相同）
export const getUserActivity = (params = {}) => {
  return getUserActivityLog(params);
};

// 9. 获取学习报告
export const getLearningReport = (params = {}) => {
  return apiClient.get('/user/learning-report', { params });
};

// 10. 更新用户偏好设置
export const updateUserPreferences = (data) => {
  return apiClient.put('/user/preferences', data);
};

// 11. 获取用户积分和等级
export const getUserPointsAndLevel = () => {
  return apiClient.get('/user/points-level');
};

// 12. 获取用户学习日历
export const getUserLearningCalendar = (params = {}) => {
  return apiClient.get('/user/learning-calendar', { params });
};

// 13. 导出用户数据
export const exportUserData = (params = {}) => {
  const { format = 'json' } = params;
  return apiClient.get('/user/export-data', {
    params: { format },
    responseType: 'blob',
  });
};

// 14. 获取用户订阅信息
export const getSubscriptionInfo = () => {
  return apiClient.get('/user/subscription');
};

// 15. 更新订阅计划
export const updateSubscription = (data) => {
  const { plan_id } = data;
  return apiClient.put('/user/subscription', { plan_id });
};

// 16. 取消订阅
export const cancelSubscription = () => {
  return apiClient.delete('/user/subscription');
};

// 17. 获取学习目标
export const getLearningGoals = () => {
  return apiClient.get('/user/goals');
};

// 18. 设置学习目标
export const setLearningGoal = (data) => {
  return apiClient.post('/user/goals', data);
};

// 19. 更新学习目标
export const updateLearningGoal = (data) => {
  const { goalId, ...updateData } = data;
  return apiClient.put(`/user/goals/${goalId}`, updateData);
};

/**
 * 对外暴露的用户中心API接口
 * 提供了完整的用户CRUD操作集合
 */
export default {
  // 用户信息
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  deleteAccount,
  
  // 学习数据
  getLearningStats,
  getUserAchievements,
  getUserActivityLog,
  getUserActivity,
  getLearningReport,
  
  // 偏好设置
  updateUserPreferences,
  
  // 订阅和积分
  getSubscriptionInfo,
  updateSubscription,
  cancelSubscription,
  getUserPointsAndLevel,
  
  // 学习目标
  getLearningGoals,
  setLearningGoal,
  updateLearningGoal,
  
  // 日历和数据导出
  getUserLearningCalendar,
  exportUserData,
};