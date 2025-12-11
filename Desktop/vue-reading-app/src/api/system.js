// src/api/system.js
import { apiClient } from './index';

/**
 * 系统信息模块 API
 * 统一使用对象参数格式
 */

// 1. 获取系统版本信息 (Read)
export const getSystemVersion = () => {
  return apiClient.get('/system/version');
};

// 2. 获取常见问题 (Read)
export const getFAQ = (params = {}) => {
  return apiClient.get('/faq', { params });
};

// 3. 获取系统状态 (Read)
export const getSystemStatus = () => {
  return apiClient.get('/system/status');
};

// 4. 获取服务器时间 (Read)
export const getServerTime = () => {
  return apiClient.get('/system/time');
};

// 5. 获取API文档 (Read)
export const getAPIDocumentation = () => {
  return apiClient.get('/system/api-docs');
};

// 6. 获取更新日志 (Read)
export const getChangelog = () => {
  return apiClient.get('/system/changelog');
};

// 7. 检查更新 (Read)
export const checkForUpdates = () => {
  return apiClient.get('/system/check-update');
};

// 8. 获取系统配置 (Read)
export const getSystemConfig = () => {
  return apiClient.get('/system/config');
};

// 9. 获取使用条款 (Read)
export const getTermsOfService = () => {
  return apiClient.get('/system/terms');
};

// 10. 获取隐私政策 (Read)
export const getPrivacyPolicy = () => {
  return apiClient.get('/system/privacy');
};

// 11. 获取帮助文档 (Read)
export const getHelpDocumentation = () => {
  return apiClient.get('/system/help');
};

// 12. 提交错误报告 (Create)
export const submitBugReport = (params) => {
  const { data } = params;
  return apiClient.post('/system/bug-report', data);
};

// 13. 获取系统公告 (Read)
export const getSystemAnnouncements = () => {
  return apiClient.get('/system/announcements');
};

// 14. 标记公告为已读 (Update) - 修复参数格式
export const markAnnouncementAsRead = (params) => {
  const { announcementId } = params;
  return apiClient.put(`/system/announcements/${announcementId}/read`);
};

// 15. 获取系统资源使用情况 (Read)
export const getSystemResources = () => {
  return apiClient.get('/system/resources');
};

// 16. 获取系统健康状态 (Read) - 新增函数
export const getSystemHealth = () => {
  return apiClient.get('/system/health');
};

// 17. 获取系统统计信息 (Read) - 新增函数
export const getSystemStatistics = (params = {}) => {
  return apiClient.get('/system/statistics', { params });
};

// 18. 清理系统缓存 (Delete) - 新增函数
export const clearSystemCache = (params = {}) => {
  return apiClient.delete('/system/cache', { params });
};

/**
 * 对外暴露的系统信息API接口
 * 统一使用对象参数格式
 */
export default {
  // 系统信息
  getSystemVersion,
  getSystemStatus,
  getServerTime,
  getSystemConfig,
  getSystemResources,
  getSystemHealth,
  getSystemStatistics,
  
  // 文档和帮助
  getFAQ,
  getAPIDocumentation,
  getChangelog,
  getTermsOfService,
  getPrivacyPolicy,
  getHelpDocumentation,
  
  // 更新和公告
  checkForUpdates,
  getSystemAnnouncements,
  markAnnouncementAsRead,
  
  // 系统维护
  submitBugReport,
  clearSystemCache
};