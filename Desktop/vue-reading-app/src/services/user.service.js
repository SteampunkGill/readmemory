// src/services/user.service.js
// 功能：用户信息管理、学习统计、成就获取

import { api } from '@/api/user';
import { useUserStore } from '@/stores/user.store';
import { useAuthStore } from '@/stores/auth.store';
import { showError, showSuccess, showWarning } from '@/utils/notify';
import { formatDate, formatDuration, formatFileSize, formatPercentage } from '@/utils/formatter';
import { validateImageFile } from '@/utils/file-validator';
import { debounce } from '@/utils/debounce';

class UserService {
  constructor() {
    this.userStore = useUserStore();
    this.authStore = useAuthStore();
    this.cache = new Map(); // 用户数据缓存
    this.cacheExpiry = 30 * 60 * 1000; // 缓存30分钟
    
    // 防抖的统计更新函数
    this.updateStatsDebounced = debounce(this._updateStats.bind(this), 2000);
  }

  /**
   * 获取用户信息
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile(forceRefresh = false) {
    try {
      // 1. 生成缓存键
      const cacheKey = 'user_profile';
      
      // 2. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取用户信息');
        return cachedData;
      }
      
      // 3. API调用
      const response = await api.getUserProfile();
      
      // 4. 数据处理
      const userProfile = this._formatUserProfile(response.data);
      
      // 5. 状态更新
      this.userStore.setProfile(userProfile);
      
      // 6. 更新缓存
      this._setCache(cacheKey, userProfile);
      
      return userProfile;
    } catch (error) {
      // 错误处理
      this._handleGetProfileError(error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {Object} data - 更新数据
   * @param {string} [data.nickname] - 昵称
   * @param {string} [data.bio] - 个人简介
   * @param {string} [data.location] - 所在地
   * @param {string} [data.website] - 个人网站
   * @param {Object} [data.preferences] - 用户偏好设置
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateUserProfile(data) {
    let originalProfile = null; // 将变量声明移到try块外部
    
    try {
      // 1. 参数验证
      this._validateProfileData(data);
      
      // 2. 获取原始用户信息（用于乐观更新）
      originalProfile = this.userStore.profile || 
                       this.cache.get('user_profile')?.data;
      
      // 3. 乐观更新：先更新本地状态
      if (originalProfile) {
        const updatedProfile = { ...originalProfile, ...data, updatedAt: new Date().toISOString() };
        this.userStore.setProfile(updatedProfile);
      }
      
      // 4. API调用
      const response = await api.updateUserProfile(data);
      
      // 5. 数据处理
      const userProfile = this._formatUserProfile(response.data);
      
      // 6. 更新本地状态
      this.userStore.setProfile(userProfile);
      
      // 7. 更新缓存
      this._setCache('user_profile', userProfile);
      
      // 8. 更新认证store中的用户信息
      this.authStore.setUser({
        ...this.authStore.user,
        nickname: userProfile.nickname,
        avatar: userProfile.avatar
      });
      
      // 9. 用户反馈
      showSuccess('个人信息更新成功');
      
      return userProfile;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (originalProfile) {
        this.userStore.setProfile(originalProfile);
      }
      this._handleUpdateProfileError(error);
      throw error;
    }
  }

  /**
   * 获取学习统计
   * @param {Object} params - 统计参数
   * @param {string} [params.period='week'] - 统计周期
   * @param {string} [params.language] - 语言筛选
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 学习统计
   */
  async getLearningStats(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateStatsParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateStatsCacheKey(queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取学习统计');
        return cachedData;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getLearningStats(queryParams);
      
      // 5. 数据处理
      const stats = this._formatLearningStats(response.data);
      
      // 6. 状态更新
      this.userStore.setLearningStats(stats);
      
      // 7. 更新缓存
      this._setCache(cacheKey, stats);
      
      return stats;
    } catch (error) {
      // 错误处理
      this._handleGetStatsError(error);
      throw error;
    }
  }

  /**
   * 获取用户成就
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Array>} 成就列表
   */
  async getUserAchievements(forceRefresh = false) {
    try {
      // 1. 生成缓存键
      const cacheKey = 'user_achievements';
      
      // 2. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取用户成就');
        return cachedData;
      }
      
      // 3. API调用
      const response = await api.getUserAchievements();
      
      // 4. 数据处理
      const achievements = this._formatAchievements(response.data);
      
      // 5. 状态更新
      this.userStore.setAchievements(achievements);
      
      // 6. 更新缓存
      this._setCache(cacheKey, achievements);
      
      return achievements;
    } catch (error) {
      // 错误处理
      this._handleGetAchievementsError(error);
      throw error;
    }
  }

  /**
   * 更新头像
   * @param {File} file - 头像文件
   * @param {Function} [onProgress] - 上传进度回调
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateAvatar(file, onProgress = null) {
    let originalProfile = null; // 将变量声明移到try块外部
    
    try {
      // 1. 参数验证
      if (!file || !(file instanceof File)) {
        throw new Error('请选择头像文件');
      }
      
      // 2. 验证图片文件
      const isValid = await validateImageFile(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        maxWidth: 2048,
        maxHeight: 2048
      });
      
      if (!isValid) {
        throw new Error('图片文件无效，请选择小于5MB的JPG、PNG或GIF图片');
      }
      
      // 3. 获取原始用户信息（用于乐观更新）
      originalProfile = this.userStore.profile || 
                       this.cache.get('user_profile')?.data;
      
      // 4. 乐观更新：先更新本地状态（使用临时URL）
      const tempAvatarUrl = URL.createObjectURL(file);
      if (originalProfile) {
        const updatedProfile = { 
          ...originalProfile, 
          avatar: tempAvatarUrl,
          updatedAt: new Date().toISOString() 
        };
        this.userStore.setProfile(updatedProfile);
      }
      
      // 5. API调用（带进度监控）- 使用对象参数
      const response = await api.updateAvatar({
        file,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress && typeof onProgress === 'function') {
            onProgress(progress);
          }
        }
      });
      
      // 6. 数据处理
      const userProfile = this._formatUserProfile(response.data);
      
      // 7. 更新本地状态
      this.userStore.setProfile(userProfile);
      
      // 8. 更新缓存
      this._setCache('user_profile', userProfile);
      
      // 9. 更新认证store中的用户信息
      this.authStore.setUser({
        ...this.authStore.user,
        avatar: userProfile.avatar
      });
      
      // 10. 清理临时URL
      URL.revokeObjectURL(tempAvatarUrl);
      
      // 11. 用户反馈
      showSuccess('头像更新成功');
      
      return userProfile;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (originalProfile) {
        this.userStore.setProfile(originalProfile);
      }
      this._handleUpdateAvatarError(error);
      throw error;
    }
  }

  /**
   * 获取用户活动日志
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @param {string} [params.type] - 活动类型筛选
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 活动日志数据
   */
  async getUserActivity(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateActivityParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateActivityCacheKey(queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取用户活动日志');
        return cachedData;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getUserActivity(queryParams);
      
      // 5. 数据处理
      const activityData = this._formatUserActivity(response.data);
      
      // 6. 状态更新
      this.userStore.setActivity(activityData.activities);
      this.userStore.setActivityPagination(activityData.pagination);
      
      // 7. 更新缓存
      this._setCache(cacheKey, activityData);
      
      return activityData;
    } catch (error) {
      // 错误处理
      this._handleGetActivityError(error);
      throw error;
    }
  }

  /**
   * 获取学习报告
   * @param {Object} params - 报告参数
   * @param {string} [params.period='month'] - 报告周期
   * @param {string} [params.language] - 语言筛选
   * @returns {Promise<Object>} 学习报告
   */
  async getLearningReport(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateReportParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateReportCacheKey(queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取学习报告');
        return cachedData;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getLearningReport(queryParams);
      
      // 5. 数据处理
      const report = this._formatLearningReport(response.data);
      
      // 6. 状态更新
      this.userStore.setLearningReport(report);
      
      // 7. 更新缓存
      this._setCache(cacheKey, report);
      
      return report;
    } catch (error) {
      // 错误处理
      this._handleGetReportError(error);
      throw error;
    }
  }

  /**
   * 更新用户偏好设置
   * @param {Object} preferences - 偏好设置
   * @param {Object} [preferences.reading] - 阅读偏好
   * @param {Object} [preferences.review] - 复习偏好
   * @param {Object} [preferences.notification] - 通知偏好
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateUserPreferences(preferences) {
    try {
      // 1. 参数验证
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('偏好设置不能为空');
      }
      
      // 2. API调用 - 使用对象参数
      const response = await api.updateUserPreferences(preferences);
      
      // 3. 数据处理
      const userProfile = this._formatUserProfile(response.data);
      
      // 4. 状态更新
      this.userStore.setProfile(userProfile);
      
      // 5. 更新缓存
      this._setCache('user_profile', userProfile);
      
      // 6. 用户反馈
      showSuccess('偏好设置已更新');
      
      return userProfile;
    } catch (error) {
      // 错误处理
      this._handleUpdatePreferencesError(error);
      throw error;
    }
  }

  /**
   * 获取用户积分和等级
   * @returns {Promise<Object>} 积分等级信息
   */
  async getUserPointsAndLevel() {
    try {
      // 1. 生成缓存键
      const cacheKey = 'user_points_level';
      
      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用
      const response = await api.getUserPointsAndLevel();
      
      // 4. 数据处理
      const pointsData = this._formatPointsAndLevel(response.data);
      
      // 5. 状态更新
      this.userStore.setPointsAndLevel(pointsData);
      
      // 6. 更新缓存
      this._setCache(cacheKey, pointsData);
      
      return pointsData;
    } catch (error) {
      // 错误处理
      this._handleGetPointsError(error);
      throw error;
    }
  }

  /**
   * 获取用户学习日历
   * @param {Object} params - 查询参数
   * @param {number} [params.year] - 年份
   * @param {number} [params.month] - 月份
   * @returns {Promise<Object>} 学习日历数据
   */
  async getUserLearningCalendar(params = {}) {
    try {
      // 1. 参数验证
      const queryParams = this._validateCalendarParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCalendarCacheKey(queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getUserLearningCalendar(queryParams);
      
      // 5. 数据处理
      const calendar = this._formatLearningCalendar(response.data);
      
      // 6. 状态更新
      this.userStore.setLearningCalendar(calendar);
      
      // 7. 更新缓存
      this._setCache(cacheKey, calendar);
      
      return calendar;
    } catch (error) {
      // 错误处理
      this._handleGetCalendarError(error);
      throw error;
    }
  }

  /**
   * 导出用户数据
   * @param {Object} params - 导出参数
   * @param {string} [params.format='json'] - 导出格式
   * @param {Array} [params.dataTypes] - 数据类型
   * @returns {Promise<Object>} 导出数据
   */
  async exportUserData(params = {}) {
    try {
      // 1. 参数验证
      const exportParams = this._validateExportParams(params);
      
      // 2. 确认导出
      const confirmed = window.confirm('确定要导出用户数据吗？这可能需要一些时间。');
      if (!confirmed) {
        return { success: false, message: '用户取消导出' };
      }
      
      // 3. API调用 - 使用对象参数
      const response = await api.exportUserData(exportParams);
      
      // 4. 数据处理
      const exportData = this._formatExportData(response.data);
      
      // 5. 用户反馈
      showSuccess('用户数据导出请求已提交，请稍后查看下载链接');
      
      return exportData;
    } catch (error) {
      // 错误处理
      this._handleExportError(error);
      throw error;
    }
  }

  /**
   * 清除用户缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('已清除所有用户数据缓存');
  }

  // ==================== 私有方法 ====================

  /**
   * 验证用户信息数据
   * @param {Object} data - 用户信息数据
   * @private
   */
  _validateProfileData(data) {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('更新数据不能为空');
    }
    
    // 验证昵称长度
    if (data.nickname && (data.nickname.length < 2 || data.nickname.length > 30)) {
      throw new Error('昵称长度必须在2-30个字符之间');
    }
    
    // 验证个人简介长度
    if (data.bio && data.bio.length > 500) {
      throw new Error('个人简介不能超过500个字符');
    }
    
    // 验证网址格式
    if (data.website && !this._isValidUrl(data.website)) {
      throw new Error('个人网站网址格式无效');
    }
  }

  /**
   * 验证统计参数
   * @param {Object} params - 统计参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateStatsParams(params) {
    const defaultParams = {
      period: 'week'
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证周期
    const validPeriods = ['day', 'week', 'month', 'year', 'all'];
    if (!validPeriods.includes(validatedParams.period)) {
      validatedParams.period = 'week';
    }
    
    return validatedParams;
  }

  /**
   * 验证活动参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateActivityParams(params) {
    const defaultParams = {
      page: 1,
      pageSize: 20
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证页码
    if (validatedParams.page < 1) {
      validatedParams.page = 1;
    }
    
    // 验证每页数量
    if (validatedParams.pageSize < 1 || validatedParams.pageSize > 100) {
      validatedParams.pageSize = 20;
    }
    
    return validatedParams;
  }

  /**
   * 验证报告参数
   * @param {Object} params - 报告参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateReportParams(params) {
    const defaultParams = {
      period: 'month'
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证周期
    const validPeriods = ['week', 'month', 'quarter', 'year'];
    if (!validPeriods.includes(validatedParams.period)) {
      validatedParams.period = 'month';
    }
    
    return validatedParams;
  }

  /**
   * 验证日历参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateCalendarParams(params) {
    const now = new Date();
    const defaultParams = {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证年份
    if (validatedParams.year < 2000 || validatedParams.year > 2100) {
      validatedParams.year = now.getFullYear();
    }
    
    // 验证月份
    if (validatedParams.month < 1 || validatedParams.month > 12) {
      validatedParams.month = now.getMonth() + 1;
    }
    
    return validatedParams;
  }

  /**
   * 验证导出参数
   * @param {Object} params - 导出参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateExportParams(params) {
    const defaultParams = {
      format: 'json',
      dataTypes: ['profile', 'documents', 'vocabulary', 'reviews']
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证导出格式
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!validFormats.includes(validatedParams.format)) {
      validatedParams.format = 'json';
    }
    
    return validatedParams;
  }

  /**
   * 生成统计缓存键
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateStatsCacheKey(params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `learning_stats_${paramString}`;
  }

  /**
   * 生成活动缓存键
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateActivityCacheKey(params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `user_activity_${paramString}`;
  }

  /**
   * 生成报告缓存键
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateReportCacheKey(params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `learning_report_${paramString}`;
  }

  /**
   * 生成日历缓存键
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateCalendarCacheKey(params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `learning_calendar_${paramString}`;
  }

  /**
   * 检查缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 缓存是否有效
   * @private
   */
  _checkCache(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const cachedItem = this.cache.get(key);
    const now = Date.now();
    
    // 检查是否过期
    if (cachedItem.expiry && cachedItem.expiry < now) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} [expiry] - 过期时间（毫秒）
   * @private
   */
  _setCache(key, value, expiry = null) {
    const cacheItem = {
      data: value,
      timestamp: Date.now(),
      expiry: expiry || (Date.now() + this.cacheExpiry)
    };
    
    this.cache.set(key, cacheItem);
  }

  /**
   * 验证URL格式
   * @param {string} url - URL字符串
   * @returns {boolean} 是否有效
   * @private
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 更新统计
   * @private
   */
  async _updateStats() {
    try {
      await this.getLearningStats({ forceRefresh: true });
    } catch (error) {
      console.error('更新学习统计失败:', error);
    }
  }

  /**
   * 格式化用户信息
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的用户信息
   * @private
   */
  _formatUserProfile(apiData) {
    const userData = apiData.user || apiData;
    
    return {
      id: userData.id || userData.user_id,
      username: userData.username,
      email: userData.email,
      nickname: userData.nickname || userData.username,
      avatar: userData.avatar_url || userData.avatar,
      bio: userData.bio || userData.description || '',
      location: userData.location || '',
      website: userData.website || '',
      joinDate: formatDate(userData.created_at || userData.join_date),
      lastLogin: formatDate(userData.last_login_at || userData.last_login),
      isVerified: userData.is_verified || userData.isVerified || false,
      preferences: userData.preferences || {
        reading: {
          fontSize: 16,
          theme: 'light',
          lineHeight: 1.6
        },
        review: {
          dailyGoal: 20,
          reminderTime: '20:00'
        },
        notification: {
          email: true,
          push: true
        }
      },
      privacySettings: userData.privacy_settings || userData.privacySettings || {
        profileVisibility: 'public',
        activityVisibility: 'friends',
        dataSharing: 'limited'
      }
    };
  }

  /**
   * 格式化学习统计
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的学习统计
   * @private
   */
  _formatLearningStats(apiData) {
    const stats = apiData.stats || apiData;
    
    return {
      totalReadingTime: stats.total_reading_time || stats.totalReadingTime || 0,
      formattedReadingTime: formatDuration(stats.total_reading_time || 0),
      documentsRead: stats.documents_read || stats.documentsRead || 0,
      wordsLearned: stats.words_learned || stats.wordsLearned || 0,
      reviewsCompleted: stats.reviews_completed || stats.reviewsCompleted || 0,
      reviewAccuracy: stats.review_accuracy || stats.reviewAccuracy || 0,
      formattedReviewAccuracy: formatPercentage(stats.review_accuracy || 0, 100, 1),
      streakDays: stats.streak_days || stats.streakDays || 0,
      longestStreak: stats.longest_streak || stats.longestStreak || 0,
      todayProgress: stats.today_progress || stats.todayProgress || {
        readingTime: 0,
        wordsLearned: 0,
        reviewsCompleted: 0
      },
      weeklyProgress: stats.weekly_progress || stats.weeklyProgress || {
        readingTime: 0,
        wordsLearned: 0,
        reviewsCompleted: 0
      },
      monthlyProgress: stats.monthly_progress || stats.monthlyProgress || {
        readingTime: 0,
        wordsLearned: 0,
        reviewsCompleted: 0
      },
      byLanguage: stats.by_language || stats.byLanguage || {},
      achievementsUnlocked: stats.achievements_unlocked || stats.achievementsUnlocked || 0,
      totalAchievements: stats.total_achievements || stats.totalAchievements || 0
    };
  }

  /**
   * 格式化用户成就
   * @param {Object} apiData - API返回的数据
   * @returns {Array} 格式化后的成就列表
   * @private
   */
  _formatAchievements(apiData) {
    const achievements = apiData.achievements || apiData;
    
    return achievements.map(achievement => ({
      id: achievement.id || achievement.achievement_id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon_url || achievement.icon,
      unlocked: achievement.unlocked || false,
      unlockedAt: formatDate(achievement.unlocked_at || achievement.unlockedAt),
      progress: achievement.progress || 0,
      total: achievement.total || 1,
      formattedProgress: formatPercentage(achievement.progress || 0, achievement.total || 1, 0),
      category: achievement.category || 'general',
      points: achievement.points || 0,
      rarity: achievement.rarity || 'common'
    }));
  }

  /**
   * 格式化用户活动
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的活动数据
   * @private
   */
  _formatUserActivity(apiData) {
    const activities = (apiData.activities || apiData).map(activity => ({
      id: activity.id || activity.activity_id,
      type: activity.type,
      action: activity.action,
      targetType: activity.target_type || activity.targetType,
      targetId: activity.target_id || activity.targetId,
      targetName: activity.target_name || activity.targetName,
      details: activity.details || {},
      timestamp: formatDate(activity.created_at || activity.timestamp),
      formattedTime: this._formatRelativeTime(activity.created_at || activity.timestamp)
    }));
    
    const pagination = {
      page: apiData.page || 1,
      pageSize: apiData.page_size || apiData.limit || 20,
      total: apiData.total || apiData.total_count || 0,
      totalPages: apiData.total_pages || Math.ceil((apiData.total || 0) / (apiData.page_size || 20))
    };
    
    return { activities, pagination };
  }

  /**
   * 格式化学习报告
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的学习报告
   * @private
   */
  _formatLearningReport(apiData) {
    const report = apiData.report || apiData;
    
    return {
      period: report.period,
      startDate: formatDate(report.start_date || report.startDate),
      endDate: formatDate(report.end_date || report.endDate),
      summary: report.summary || {
        totalReadingTime: 0,
        documentsRead: 0,
        wordsLearned: 0,
        reviewsCompleted: 0
      },
      dailyBreakdown: report.daily_breakdown || report.dailyBreakdown || [],
      topWords: report.top_words || report.topWords || [],
      readingPatterns: report.reading_patterns || report.readingPatterns || {},
      recommendations: report.recommendations || [],
      generatedAt: formatDate(report.generated_at || report.generatedAt)
    };
  }

  /**
   * 格式化积分等级信息
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的积分等级信息
   * @private
   */
  _formatPointsAndLevel(apiData) {
    const data = apiData.points || apiData;
    
    return {
      totalPoints: data.total_points || data.totalPoints || 0,
      currentLevel: data.current_level || data.currentLevel || 1,
      levelName: data.level_name || data.levelName || '初学者',
      nextLevelPoints: data.next_level_points || data.nextLevelPoints || 100,
      currentLevelPoints: data.current_level_points || data.currentLevelPoints || 0,
      progressToNextLevel: data.progress_to_next_level || data.progressToNextLevel || 0,
      formattedProgress: formatPercentage(data.progress_to_next_level || 0, 100, 1),
      levelIcon: data.level_icon || data.levelIcon,
      badges: data.badges || [],
      pointsHistory: data.points_history || data.pointsHistory || []
    };
  }

  /**
   * 格式化学习日历
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的学习日历
   * @private
   */
  _formatLearningCalendar(apiData) {
    const calendar = apiData.calendar || apiData;
    
    return {
      year: calendar.year,
      month: calendar.month,
      days: calendar.days || [],
      totalStudyDays: calendar.total_study_days || calendar.totalStudyDays || 0,
      longestStreak: calendar.longest_streak || calendar.longestStreak || 0,
      currentStreak: calendar.current_streak || calendar.currentStreak || 0,
      heatmapData: calendar.heatmap_data || calendar.heatmapData || {},
      monthlyStats: calendar.monthly_stats || calendar.monthlyStats || {
        totalReadingTime: 0,
        documentsRead: 0,
        wordsLearned: 0
      }
    };
  }

  /**
   * 格式化导出数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的导出数据
   * @private
   */
  _formatExportData(apiData) {
    return {
      requestId: apiData.request_id || apiData.requestId,
      status: apiData.status || 'processing',
      format: apiData.format || 'json',
      estimatedSize: apiData.estimated_size ? formatFileSize(apiData.estimated_size) : '未知',
      downloadUrl: apiData.download_url || apiData.downloadUrl,
      expiresAt: formatDate(apiData.expires_at || apiData.expiresAt),
      createdAt: formatDate(apiData.created_at || apiData.createdAt)
    };
  }

  /**
   * 格式化相对时间
   * @param {string|Date} date - 日期
   * @returns {string} 相对时间字符串
   * @private
   */
  _formatRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now - targetDate;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return '刚刚';
    } else if (diffMin < 60) {
      return `${diffMin}分钟前`;
    } else if (diffHour < 24) {
      return `${diffHour}小时前`;
    } else if (diffDay < 7) {
      return `${diffDay}天前`;
    } else {
      return formatDate(date, 'MM-DD');
    }
  }

  /**
   * 处理获取用户信息错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetProfileError(error) {
    let message = '获取用户信息失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看用户信息';
          break;
        case 404:
          message = '用户不存在';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `获取失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理更新用户信息错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleUpdateProfileError(error) {
    let message = '更新用户信息失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '更新数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新用户信息';
          break;
        case 409:
          message = '用户名或邮箱已被使用';
          break;
        case 422:
          message = '数据验证失败';
          break;
        default:
          message = `更新失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取统计错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetStatsError(error) {
    let message = '获取学习统计失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看学习统计';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `获取失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取成就错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetAchievementsError(error) {
    let message = '获取用户成就失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看用户成就';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `获取失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理更新头像错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleUpdateAvatarError(error) {
    let message = '更新头像失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '图片文件无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新头像';
          break;
        case 413:
          message = '图片文件太大';
          break;
        case 422:
          message = '图片格式不支持';
          break;
        default:
          message = `更新失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取活动错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetActivityError(error) {
    let message = '获取用户活动日志失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看活动日志';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `获取失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取报告错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetReportError(error) {
    let message = '获取学习报告失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看学习报告';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `获取失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理更新偏好设置错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleUpdatePreferencesError(error) {
    let message = '更新偏好设置失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '偏好设置数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新偏好设置';
          break;
        case 422:
          message = '数据验证失败';
          break;
        default:
          message = `更新失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取积分错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetPointsError(error) {
    console.error('获取用户积分等级失败:', error);
    showError('获取积分等级信息失败');
  }

  /**
   * 处理获取日历错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetCalendarError(error) {
    console.error('获取学习日历失败:', error);
    showError('获取学习日历失败');
  }

  /**
   * 处理导出错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleExportError(error) {
    let message = '导出用户数据失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '导出参数无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有导出权限';
          break;
        case 429:
          message = '导出请求过于频繁';
          break;
        default:
          message = `导出失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }
}

// 创建单例实例
const userService = new UserService();

// 导出实例
export default userService;