// src/services/auth.service.js
import { BaseService } from './base.service';
import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { validateEmail, validatePassword } from '@/utils/validators';

/**
 * 认证服务
 */
export class AuthService extends BaseService {
  constructor() {
    super('auth');
    this.authStore = useAuthStore();
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} 用户数据
   */
  async login(credentials) {
    try {
      // 1. 验证输入
      if (!credentials.email || !credentials.password) {
        throw new Error('邮箱和密码不能为空');
      }

      if (!validateEmail(credentials.email)) {
        throw new Error('邮箱格式不正确');
      }

      // 2. 调用API
      const response = await api.auth.login({
        email: credentials.email,
        password: credentials.password
      });

      // 3. 保存token
      const { access_token, refresh_token, expires_in } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('token_expires_at', Date.now() + expires_in * 1000);

      // 4. 更新store状态
      this.authStore.setToken(access_token);
      this.authStore.setRefreshToken(refresh_token);

      // 5. 获取并保存用户信息
      const userData = await this.getCurrentUser(true);
      
      // 6. 显示成功提示
      this.showSuccess('登录成功');
      
      return userData;
    } catch (error) {
      const message = this.handleError(error, '登录失败', '登录');
      throw new Error(message);
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    try {
      // 1. 验证必填字段
      const requiredFields = ['email', 'password', 'username'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          throw new Error(`${field}不能为空`);
        }
      }

      // 2. 验证邮箱格式
      if (!validateEmail(userData.email)) {
        throw new Error('邮箱格式不正确');
      }

      // 3. 验证密码强度
      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // 4. 验证密码确认
      if (userData.password !== userData.password_confirmation) {
        throw new Error('两次输入的密码不一致');
      }

      // 5. 调用API
      const response = await api.auth.register({
        email: userData.email,
        password: userData.password,
        username: userData.username,
        nickname: userData.nickname || userData.username
      });

      // 6. 自动登录
      const loginResult = await this.login({
        email: userData.email,
        password: userData.password
      });

      // 7. 显示成功提示
      this.showSuccess('注册成功，已自动登录');
      
      return {
        ...response.data,
        user: loginResult
      };
    } catch (error) {
      const message = this.handleError(error, '注册失败', '注册');
      throw new Error(message);
    }
  }

  /**
   * 获取当前用户信息
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 用户数据
   */
  async getCurrentUser(forceRefresh = false) {
    try {
      // 检查是否已登录
      const token = localStorage.getItem('access_token');
      if (!token) {
        this.authStore.clearUser();
        return null;
      }

      // 检查token是否过期
      const expiresAt = localStorage.getItem('token_expires_at');
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        // token过期，尝试刷新
        try {
          await this.refreshToken();
        } catch (refreshError) {
          // 刷新失败，清除登录状态
          this.logout();
          return null;
        }
      }

      // 使用缓存获取用户信息
      const userData = await this.withCache(
        'current_user',
        async () => {
          const response = await api.user.getUserProfile();
          return this.formatFromApi(response.data);
        },
        { forceRefresh }
      );

      // 更新store状态
      this.authStore.setUser(userData);
      
      return userData;
    } catch (error) {
      // 如果获取用户信息失败，清除登录状态
      if (error.response?.status === 401) {
        this.logout();
      }
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 刷新访问令牌
   * @returns {Promise<boolean>} 是否刷新成功
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('刷新令牌不存在');
      }

      const response = await api.auth.refreshToken({
        refresh_token: refreshToken
      });

      const { access_token, expires_in } = response.data;
      
      // 更新本地存储
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_expires_at', Date.now() + expires_in * 1000);
      
      // 更新store
      this.authStore.setToken(access_token);
      
      return true;
    } catch (error) {
      console.error('刷新token失败:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // 调用登出API
      await api.auth.logout();
    } catch (error) {
      console.warn('登出API调用失败:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      
      // 重置store状态
      this.authStore.logout();
      
      // 清除缓存
      this.clearCache('current_user');
      
      // 显示登出提示
      this.showSuccess('已安全登出');
    }
  }

  /**
   * 发送密码重置邮件
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 发送结果
   */
  async sendPasswordResetEmail(email) {
    try {
      if (!validateEmail(email)) {
        throw new Error('邮箱格式不正确');
      }

      const response = await api.auth.forgotPassword({ email });
      this.showSuccess('重置密码邮件已发送，请查收');
      return response.data;
    } catch (error) {
      const message = this.handleError(error, '发送重置邮件失败', '发送重置邮件');
      throw new Error(message);
    }
  }

  /**
   * 重置密码
   * @param {Object} data - 重置密码数据
   * @returns {Promise<Object>} 重置结果
   */
  async resetPassword(data) {
    try {
      const { token, email, password, password_confirmation } = data;

      // 验证必填字段
      if (!token || !email || !password || !password_confirmation) {
        throw new Error('所有字段都必须填写');
      }

      // 验证密码强度
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // 验证密码确认
      if (password !== password_confirmation) {
        throw new Error('两次输入的密码不一致');
      }

      const response = await api.auth.resetPassword({
        token,
        email,
        password,
        password_confirmation
      });

      this.showSuccess('密码重置成功，请使用新密码登录');
      return response.data;
    } catch (error) {
      const message = this.handleError(error, '重置密码失败', '重置密码');
      throw new Error(message);
    }
  }
}