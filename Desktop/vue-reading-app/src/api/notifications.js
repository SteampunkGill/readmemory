// src/api/notifications.js
import { apiClient } from './index';

/**
 * 通知模块 API
 * 实现了通知资源的完整CRUD操作
 */

// 1. 获取通知列表 (Read - List)
export const getNotifications = (params = {}) => {
  return apiClient.get('/notifications', { params });
};

// 2. 标记通知为已读 (Update) - 修改为接收对象参数
export const markNotificationAsRead = (params) => {
  const { notificationId } = params;
  return apiClient.put(`/notifications/${notificationId}/read`);
};

// 3. 标记所有通知为已读 (Update)
export const markAllNotificationsAsRead = () => {
  return apiClient.put('/notifications/read-all');
};

// 4. 删除通知 (Delete) - 修改为接收对象参数
export const deleteNotification = (params) => {
  const { notificationId } = params;
  return apiClient.delete(`/notifications/${notificationId}`);
};

// 5. 获取单个通知详情 (Read - Single) - 文档中未明确列出，但通常需要 - 修改为接收对象参数
export const getNotificationById = (params) => {
  const { notificationId } = params;
  return apiClient.get(`/notifications/${notificationId}`);
};

// 6. 创建通知 (Create) - 文档中未明确列出，但通常需要（用于测试）
export const createNotification = (data) => {
  return apiClient.post('/notifications', data);
};

// 7. 批量删除通知 (Delete) - 文档中未明确列出，但通常需要 - 修改为接收对象参数
export const batchDeleteNotifications = (params) => {
  const { notificationIds } = params;
  return apiClient.delete('/notifications/batch', {
    data: { notification_ids: notificationIds },
  });
};

// 8. 获取未读通知数量 (Read) - 文档中未明确列出，但通常需要
export const getUnreadCount = () => {
  return apiClient.get('/notifications/unread-count');
};

// 9. 获取通知设置 (Read) - 文档中未明确列出，但通常需要
export const getNotificationSettings = () => {
  return apiClient.get('/notifications/settings');
};

// 10. 更新通知设置 (Update) - 文档中未明确列出，但通常需要
export const updateNotificationSettings = (data) => {
  return apiClient.put('/notifications/settings', data);
};

// 11. 订阅通知频道 (Create) - 文档中未明确列出，但通常需要 - 修改为接收对象参数
export const subscribeToChannel = (params) => {
  const { channel, deviceToken } = params;
  return apiClient.post('/notifications/subscribe', {
    channel,
    device_token: deviceToken,
  });
};

// 12. 取消订阅通知频道 (Delete) - 文档中未明确列出，但通常需要 - 修改为接收对象参数
export const unsubscribeFromChannel = (params) => {
  const { channel } = params;
  return apiClient.delete('/notifications/unsubscribe', {
    data: { channel },
  });
};

// 13. 获取通知历史 (Read) - 文档中未明确列出，但通常需要
export const getNotificationHistory = (params = {}) => {
  return apiClient.get('/notifications/history', { params });
};

// 14. 清空通知历史 (Delete) - 文档中未明确列出，但通常需要
export const clearNotificationHistory = () => {
  return apiClient.delete('/notifications/history');
};

// 15. 测试通知发送 (Create) - 文档中未明确列出，但通常需要（用于测试）
export const testNotification = (data) => {
  return apiClient.post('/notifications/test', data);
};

// ----- 添加缺失的函数 -----

// 批量标记通知为已读
export const batchMarkAsRead = (data) => {
  return apiClient.put('/notifications/batch-read', data);
};

// 获取通知统计数据
export const getNotificationStats = () => {
  return apiClient.get('/notifications/stats');
};

// ----- 为现有函数添加别名（保持向后兼容） -----

// 标记通知为已读 (别名)
export const markAsRead = (params) => {
  return markNotificationAsRead(params);
};

// 标记所有通知为已读 (别名)
export const markAllAsRead = () => {
  return markAllNotificationsAsRead();
};

// 清空通知历史 (别名)
export const clearAllNotifications = () => {
  return clearNotificationHistory();
};


/**
 * 对外暴露的通知模块API接口
 * 提供了完整的通知CRUD操作集合
 */
export default {
  // 核心通知操作
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationById,
  createNotification,
  batchDeleteNotifications,
  batchMarkAsRead, // 新增
  
  // 通知统计
  getUnreadCount,
  getNotificationStats, // 新增
  
  // 通知设置
  getNotificationSettings,
  updateNotificationSettings,
  
  // 订阅管理
  subscribeToChannel,
  unsubscribeFromChannel,
  
  // 历史记录
  getNotificationHistory,
  clearNotificationHistory,
  
  // 测试功能
  testNotification,
  
  // 别名 (用于向后兼容)
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
};