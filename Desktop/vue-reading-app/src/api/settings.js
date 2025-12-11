import { apiClient } from './index';

/**
 * 系统设置模块 API
 * 实现了系统设置的完整CRUD操作
 */

// 1. 获取用户设置 (Read) - 通用获取
export const getSettings = () => {
  return apiClient.get('/user/settings');
};

// 2. 更新用户设置 (Update) - 通用更新
export const updateSettings = (data) => {
  return apiClient.put('/user/settings', data);
};

// 3. 获取阅读设置 (Read)
export const getReadingSettings = () => {
  return apiClient.get('/user/settings/reading');
};

// 4. 更新阅读设置 (Update)
export const updateReadingSettings = (data) => {
  return apiClient.put('/user/settings/reading', data);
};

// 5. 获取复习设置 (Read)
export const getReviewSettings = () => {
  return apiClient.get('/user/settings/review');
};

// 6. 更新复习设置 (Update)
export const updateReviewSettings = (data) => {
  return apiClient.put('/user/settings/review', data);
};

// 7. 获取通知设置 (Read)
export const getNotificationSettings = () => {
  return apiClient.get('/user/settings/notifications');
};

// 8. 更新通知设置 (Update)
export const updateNotificationSettings = (data) => {
  return apiClient.put('/user/settings/notifications', data);
};

// 9. 获取所有设置 (Read) - 一次性获取所有设置
export const getAllSettings = () => {
  return apiClient.get('/user/settings/all');
};

// 10. 更新通用设置 (Update)
export const updateGeneralSettings = (data) => {
  return apiClient.put('/user/settings/general', data);
};

// 11. 更新隐私设置 (Update)
export const updatePrivacySettings = (data) => {
  return apiClient.put('/user/settings/privacy', data);
};

// 12. 重置所有设置为默认值 (Delete)
export const resetSettingsToDefault = () => {
  return apiClient.delete('/user/settings');
};

// 13. 获取主题设置 (Read)
export const getThemeSettings = () => {
  return apiClient.get('/user/settings/theme');
};

// 14. 更新主题设置 (Update) - 修改为对象参数
export const updateThemeSettings = (params) => {
  const { theme } = params;
  return apiClient.put('/user/settings/theme', { theme });
};

// 15. 获取字体设置 (Read)
export const getFontSettings = () => {
  return apiClient.get('/user/settings/font');
};

// 16. 更新字体设置 (Update) - 修改为对象参数
export const updateFontSettings = (params) => {
  return apiClient.put('/user/settings/font', params);
};

// 17. 获取语言设置 (Read)
export const getLanguageSettings = () => {
  return apiClient.get('/user/settings/language');
};

// 18. 更新语言设置 (Update) - 修改为对象参数
export const updateLanguageSettings = (params) => {
  const { language } = params;
  return apiClient.put('/user/settings/language', { language });
};

// 19. 获取备份设置 (Read)
export const getBackupSettings = () => {
  return apiClient.get('/user/settings/backup');
};

// 20. 更新备份设置 (Update) - 修改为对象参数
export const updateBackupSettings = (params) => {
  return apiClient.put('/user/settings/backup', params);
};

// 21. 导出设置 (Export)
export const exportSettings = () => {
  return apiClient.get('/user/settings/export', {
    responseType: 'blob',
  });
};

// 22. 导入设置 (Import) - 修改为对象参数
export const importSettings = (params) => {
  const { file } = params;
  const formData = new FormData();
  formData.append('file', file);
  
  return apiClient.post('/user/settings/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 保持向后兼容的别名
export const getUserSettings = getSettings;

/**
 * 对外暴露的系统设置API接口
 * 提供了完整的系统设置CRUD操作集合
 */
export default {
  // 核心设置
  getSettings,
  updateSettings,
  getReadingSettings,
  updateReadingSettings,
  getReviewSettings,
  updateReviewSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getAllSettings,
  
  // 特定设置
  updateGeneralSettings,
  updatePrivacySettings,
  resetSettingsToDefault,
  
  // 主题和外观
  getThemeSettings,
  updateThemeSettings,
  getFontSettings,
  updateFontSettings,
  
  // 语言和备份
  getLanguageSettings,
  updateLanguageSettings,
  getBackupSettings,
  updateBackupSettings,
  
  // 导入导出
  exportSettings,
  importSettings,
  
  // 向后兼容
  getUserSettings,
};