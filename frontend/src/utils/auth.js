/**
 * 认证管理工具类
 * 统一处理 Token 的存储、获取和清除，支持 localStorage 和 sessionStorage
 */

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const EXPIRES_IN_KEY = 'expiresIn';
const AUTH_STATUS_KEY = 'isAuthenticated';

export const auth = {
  /**
   * 获取 Access Token
   * 优先从 localStorage 获取，如果没有则从 sessionStorage 获取
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
  },

  /**
   * 获取 Refresh Token
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || '';
  },

  /**
   * 保存认证信息
   * @param {string} accessToken 
   * @param {string} refreshToken 
   * @param {number|string} expiresIn 
   * @param {boolean} remember 是否记住登录状态
   */
  saveToken(accessToken, refreshToken, expiresIn, remember = false) {
    // 先清除旧数据，防止冲突
    this.clearToken();

    const storage = remember ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    storage.setItem(EXPIRES_IN_KEY, expiresIn);
    storage.setItem(AUTH_STATUS_KEY, 'true');

    // 如果是记住登录，在 localStorage 额外备份状态，确保跨标签页一致性
    if (remember) {
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
    }
  },

  /**
   * 清除认证信息
   */
  clearToken() {
    const keys = [TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_IN_KEY, AUTH_STATUS_KEY];
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },

  /**
   * 判断是否已认证
   */
  isAuthenticated() {
    return (
      localStorage.getItem(AUTH_STATUS_KEY) === 'true' ||
      sessionStorage.getItem(AUTH_STATUS_KEY) === 'true'
    );
  }
};

export default auth;