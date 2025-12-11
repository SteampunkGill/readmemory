// src/utils/token.js

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'remember_me';

/**
 * 存储token
 * @param {string} token - token值
 * @param {boolean} rememberMe - 是否记住我
 */
export function setToken(token, rememberMe = false) {
  if (rememberMe) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

/**
 * 获取token
 * @returns {string|null} token值
 */
export function getToken() {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  if (rememberMe) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } else {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
}

/**
 * 移除token
 */
export function removeToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
}

/**
 * 存储刷新token
 * @param {string} token - 刷新token
 * @param {boolean} rememberMe - 是否记住我
 */
export function setRefreshToken(token, rememberMe = false) {
  if (rememberMe) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/**
 * 获取刷新token
 * @returns {string|null} 刷新token
 */
export function getRefreshToken() {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  if (rememberMe) {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } else {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * 移除刷新token
 */
export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * 清除所有token
 */
export function clearAllTokens() {
  removeToken();
  removeRefreshToken();
}