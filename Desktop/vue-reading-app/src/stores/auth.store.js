// src/stores/auth.store.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import authService from '@/services/auth.service';
import { getToken } from '@/utils/token';

/**
 * 认证状态管理
 * 管理用户登录状态、用户信息、token等
 */
export const useAuthStore = defineStore('auth', () => {
  // ==================== 状态定义 ====================
  
  // 用户信息
  const user = ref(null);
  
  // 访问令牌
  const token = ref(null);
  
  // 登录状态
  const isLoggedIn = ref(false);
  
  // 加载状态
  const loading = ref(false);
  
  // 错误信息
  const error = ref(null);
  
  // 记住我状态
  const rememberMe = ref(false);
  
  // 用户偏好设置
  const preferences = ref({
    theme: 'light',
    language: 'zh-CN',
    notificationEnabled: true,
    autoSave: true,
    readingMode: 'normal',
    fontSize: 16,
    lineHeight: 1.6,
  });

  // ==================== 计算属性 ====================
  
  /**
   * 用户ID
   */
  const userId = computed(() => user.value?.id || null);
  
  /**
   * 用户名
   */
  const username = computed(() => user.value?.username || '');
  
  /**
   * 用户邮箱
   */
  const email = computed(() => user.value?.email || '');
  
  /**
   * 用户昵称
   */
  const nickname = computed(() => user.value?.nickname || user.value?.username || '');
  
  /**
   * 用户头像
   */
  const avatar = computed(() => user.value?.avatar || '');
  
  /**
   * 用户角色
   */
  const role = computed(() => user.value?.role || 'user');
  
  /**
   * 是否已验证邮箱
   */
  const isVerified = computed(() => user.value?.isVerified || false);
  
  /**
   * 是否管理员
   */
  const isAdmin = computed(() => role.value === 'admin');
  
  /**
   * 是否VIP用户
   */
  const isVip = computed(() => role.value === 'vip' || role.value === 'admin');
  
  /**
   * 用户创建时间
   */
  const createdAt = computed(() => user.value?.createdAt || null);
  
  /**
   * 最后登录时间
   */
  const lastLoginAt = computed(() => user.value?.lastLoginAt || null);

  // ==================== Actions ====================
  
  /**
   * 设置用户信息
   * @param {Object} userData - 用户数据
   */
  const setUser = (userData) => {
    if (!userData) {
      user.value = null;
      return;
    }
    
    user.value = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      nickname: userData.nickname || userData.username,
      avatar: userData.avatar || '',
      role: userData.role || 'user',
      isVerified: userData.isVerified || false,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
      preferences: {
        ...preferences.value,
        ...(userData.preferences || {})
      }
    };
    
    // 更新偏好设置
    if (userData.preferences) {
      preferences.value = {
        ...preferences.value,
        ...userData.preferences
      };
    }
  };
  
  /**
   * 清除用户信息
   */
  const clearUser = () => {
    user.value = null;
    token.value = null;
    isLoggedIn.value = false;
    error.value = null;
  };
  
  /**
   * 设置token
   * @param {string} newToken - 访问令牌
   */
  const setToken = (newToken) => {
    token.value = newToken;
  };
  
  /**
   * 设置登录状态
   * @param {boolean} status - 登录状态
   */
  const setLoggedIn = (status) => {
    isLoggedIn.value = status;
  };
  
  /**
   * 设置记住我状态
   * @param {boolean} status - 记住我状态
   */
  const setRememberMe = (status) => {
    rememberMe.value = status;
  };
  
  /**
   * 设置加载状态
   * @param {boolean} status - 加载状态
   */
  const setLoading = (status) => {
    loading.value = status;
  };
  
  /**
   * 设置错误信息
   * @param {string|null} errorMessage - 错误信息
   */
  const setError = (errorMessage) => {
    error.value = errorMessage;
  };
  
  /**
   * 更新用户偏好设置
   * @param {Object} newPreferences - 新的偏好设置
   */
  const updatePreferences = (newPreferences) => {
    preferences.value = {
      ...preferences.value,
      ...newPreferences
    };
    
    // 如果用户已登录，同时更新用户对象中的偏好设置
    if (user.value) {
      user.value.preferences = preferences.value;
    }
  };
  
  /**
   * 更新用户信息
   * @param {Object} updates - 要更新的字段
   */
  const updateUser = (updates) => {
    if (!user.value) return;
    
    user.value = {
      ...user.value,
      ...updates
    };
  };
  
  /**
   * 更新用户头像
   * @param {string} avatarUrl - 头像URL
   */
  const updateAvatar = (avatarUrl) => {
    if (!user.value) return;
    
    user.value.avatar = avatarUrl;
  };
  
  /**
   * 更新用户昵称
   * @param {string} newNickname - 新昵称
   */
  const updateNickname = (newNickname) => {
    if (!user.value) return;
    
    user.value.nickname = newNickname;
  };
  
  /**
   * 初始化认证状态
   * 从本地存储恢复token和用户信息
   */
  const initAuth = async () => {
    try {
      setLoading(true);
      
      // 检查本地是否有token
      const localToken = getToken();
      if (localToken) {
        token.value = localToken;
        isLoggedIn.value = true;
        
        // 尝试获取用户信息
        await authService.getCurrentUser();
      }
    } catch (error) {
      console.warn('初始化认证状态失败:', error);
      clearUser();
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {boolean} remember - 记住我
   * @returns {Promise<Object>} 用户数据
   */
  const login = async (credentials, remember = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 设置记住我状态
      setRememberMe(remember);
      
      // 调用服务层登录
      const userData = await authService.login(credentials, remember);
      
      // 更新状态
      setUser(userData);
      setLoggedIn(true);
      
      return userData;
    } catch (err) {
      setError(err.message || '登录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message || '注册失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 用户登出
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.warn('登出失败:', err);
    } finally {
      clearUser();
      setLoading(false);
    }
  };
  
  /**
   * 忘记密码
   * @param {string} email - 邮箱
   * @returns {Promise<Object>} 重置结果
   */
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.forgotPassword(email);
      return result;
    } catch (err) {
      setError(err.message || '发送重置邮件失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 重置密码
   * @param {Object} data - 重置密码数据
   * @returns {Promise<Object>} 重置结果
   */
  const resetPassword = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.resetPassword(data);
      return result;
    } catch (err) {
      setError(err.message || '重置密码失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 刷新用户信息
   * @returns {Promise<Object>} 用户信息
   */
  const refreshUser = async () => {
    try {
      setLoading(true);
      
      const userData = await authService.getCurrentUser(true);
      setUser(userData);
      
      return userData;
    } catch (err) {
      setError(err.message || '刷新用户信息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 检查登录状态
   * @returns {boolean} 是否已登录
   */
  const checkLoginStatus = () => {
    return authService.checkLoginStatus();
  };

  // ==================== 返回 ====================
  
  return {
    // 状态
    user,
    token,
    isLoggedIn,
    loading,
    error,
    rememberMe,
    preferences,
    
    // 计算属性
    userId,
    username,
    email,
    nickname,
    avatar,
    role,
    isVerified,
    isAdmin,
    isVip,
    createdAt,
    lastLoginAt,
    
    // Actions
    setUser,
    clearUser,
    setToken,
    setLoggedIn,
    setRememberMe,
    setLoading,
    setError,
    updatePreferences,
    updateUser,
    updateAvatar,
    updateNickname,
    initAuth,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
    checkLoginStatus,
  };
});

// 导出默认实例
export default useAuthStore;