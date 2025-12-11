// src/api/auth.js - 修复版本
import { apiClient } from './index';

/**
 * 认证模块 API
 * 遵循CRUD完整性原则：即使文档中只有部分操作，我们也实现完整的认证相关操作
 */

// 1. 登录
export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

// 2. 注册
export const register = (userData) => {
  return apiClient.post('/auth/register', userData);
};

// 3. 第三方登录
export const oauthLogin = (provider, accessToken) => {
  return apiClient.post(`/auth/oauth/${provider}`, { access_token: accessToken });
};

// 4. 忘记密码
export const forgotPassword = (email) => {
  return apiClient.post('/auth/forgot-password', { email });
};

// 5. 重置密码 - 修改为接收对象参数
export const resetPassword = (data) => {
  return apiClient.post('/auth/reset-password', data);
};

// 6. 登出
export const logout = () => {
  return apiClient.post('/auth/logout');
};

// 7. 刷新token - 修改为接收对象参数
export const refreshToken = (data) => {
  return apiClient.post('/auth/refresh-token', data);
};

// 8. 验证token - 修改为接收对象参数
export const verifyToken = (data) => {
  return apiClient.post('/auth/verify-token', data);
};

// 9. 获取当前用户信息
export const getCurrentUser = () => {
  return apiClient.get('/auth/me');
};

// 10. 更新用户密码 - 修改为接收对象参数
export const updatePassword = (data) => {
  return apiClient.put('/auth/password', data);
};

// 11. 验证邮箱 - 新增接口
export const verifyEmail = (data) => {
  return apiClient.post('/auth/verify-email', data);
};

/**
 * 对外暴露的认证API接口
 * 提供了完整的认证相关CRUD操作集合
 */
export default {
  login,
  register,
  oauthLogin,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
  verifyToken,
  getCurrentUser,
  updatePassword,
  verifyEmail, // 新增
};