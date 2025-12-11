// src/api/index.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    // 如果API返回的格式是 { success: true, data: ... }
    if (response.data && response.data.success === false) {
      const error = response.data.error;
      ElMessage.error(error.message || '请求失败');
      return Promise.reject(error);
    }
    return response.data;
  },
  (error) => {
    // 处理HTTP错误
    let errorMessage = '请求失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = '未授权，请重新登录';
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = '权限不足';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = error.response.data?.message || `HTTP ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络设置';
    } else {
      errorMessage = error.message;
    }
    
    ElMessage.error(errorMessage);
    return Promise.reject({
      code: error.response?.status || 'NETWORK_ERROR',
      message: errorMessage,
    });
  }
);

// 文件上传专用实例
const uploadClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// 为上传实例添加相同的拦截器
uploadClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

uploadClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      const error = response.data.error;
      ElMessage.error(error.message || '上传失败');
      return Promise.reject(error);
    }
    return response.data;
  },
  (error) => {
    ElMessage.error('文件上传失败');
    return Promise.reject(error);
  }
);
// 在 src/api/index.js 中导出所有API模块
export { default as authAPI } from './auth';
export { default as documentsAPI } from './documents';
export { default as readerAPI } from './reader';
export { default as vocabularyAPI } from './vocabulary';
export { default as reviewAPI } from './review';
export { default as userAPI } from './user';
export { default as settingsAPI } from './settings';
export { default as tagsAPI } from './tags';
export { default as searchAPI } from './search';
export { default as notificationsAPI } from './notifications';
export { default as feedbackAPI } from './feedback';
export { default as offlineAPI } from './offline';
export { default as exportAPI } from './export';
export { default as systemAPI } from './system';
export { default as api } from './aggregate';

// 导出axios实例供特殊需求使用
export { apiClient, uploadClient };