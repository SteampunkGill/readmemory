// src/services/review.service.js
// 功能：获取待复习单词、提交复习结果、复习统计

import { api } from '@/api/review';
import { useReviewStore } from '@/stores/review.store';
import { useVocabularyStore } from '@/stores/vocabulary.store';
import { showError, showSuccess, showWarning } from '@/utils/notify';
import { formatDate, formatDuration, formatPercentage } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';

class ReviewService {
  constructor() {
    this.reviewStore = useReviewStore();
    this.vocabularyStore = useVocabularyStore();
    this.cache = new Map(); // 复习数据缓存
    this.sessionCache = new Map(); // 复习会话缓存
    this.cacheExpiry = 15 * 60 * 1000; // 缓存15分钟
    
    // 防抖的统计更新函数
    this.updateStatsDebounced = debounce(this._updateStats.bind(this), 1000);
    
    // 复习会话状态
    this.currentSession = null;
    this.sessionStartTime = null;
    this.sessionWords = [];
    this.sessionResults = [];
  }

  /**
   * 获取待复习单词
   * @param {Object} params - 查询参数
   * @param {number} [params.limit=20] - 单词数量
   * @param {string} [params.language] - 语言筛选
   * @param {Array} [params.tags] - 标签筛选
   * @param {string} [params.difficulty] - 难度筛选
   * @param {boolean} [params.forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Array>} 待复习单词列表
   */
  async getDueWords(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateDueWordsParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('due_words', queryParams);
      
      // 3. 检查缓存
      if (!params.forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取待复习单词');
        return cachedData;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getDueWords(queryParams);
      
      // 5. 数据处理
      const dueWords = this._formatDueWords(response.data);
      
      // 6. 状态更新
      this.reviewStore.setDueWords(dueWords);
      
      // 7. 更新缓存
      this._setCache(cacheKey, dueWords);
      
      return dueWords;
    } catch (error) {
      // 错误处理
      this._handleGetDueWordsError(error);
      throw error;
    }
  }

  /**
   * 获取智能复习单词（基于算法推荐）
   * @param {Object} params - 查询参数
   * @param {number} [params.limit=20] - 单词数量
   * @param {string} [params.language] - 语言筛选
   * @param {string} [params.algorithm='spaced_repetition'] - 复习算法
   * @returns {Promise<Array>} 智能复习单词列表
   */
  async getSmartReviewWords(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateSmartReviewParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('smart_review', queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getSmartReviewWords(queryParams);
      
      // 5. 数据处理
      const reviewWords = this._formatSmartReviewWords(response.data);
      
      // 6. 更新缓存
      this._setCache(cacheKey, reviewWords);
      
      return reviewWords;
    } catch (error) {
      // 错误处理
      this._handleGetSmartReviewError(error);
      throw error;
    }
  }

  /**
   * 提交复习结果
   * @param {Object} data - 复习结果数据
   * @param {Array} data.results - 复习结果数组
   * @param {string} data.sessionId - 复习会话ID
   * @param {number} [data.duration] - 复习时长（秒）
   * @param {string} [data.mode='review'] - 复习模式
   * @returns {Promise<Object>} 复习结果
   */
  async submitReview(data) {
    try {
      // 1. 参数验证
      this._validateReviewData(data);
      
      // 2. 计算复习时长
      const reviewData = {
        ...data,
        duration: data.duration || this._calculateSessionDuration()
      };
      
      // 3. API调用
      const response = await api.submitReview(reviewData);
      
      // 4. 数据处理
      const result = this._formatReviewResult(response.data);
      
      // 5. 更新本地词汇状态
      this._updateVocabularyAfterReview(result);
      
      // 6. 清除相关缓存
      this._clearReviewCache();
      
      // 7. 触发统计更新
      this.updateStatsDebounced();
      
      // 8. 用户反馈
      showSuccess(`复习完成！正确率：${result.accuracy}%`);
      
      return result;
    } catch (error) {
      // 错误处理
      this._handleSubmitReviewError(error);
      throw error;
    }
  }

  /**
   * 提交单个单词复习结果
   * @param {Object} data - 单个单词复习数据
   * @param {string|number} data.wordId - 单词ID
   * @param {boolean} data.correct - 是否正确
   * @param {number} [data.responseTime] - 响应时间（毫秒）
   * @param {string} [data.reviewType='recognition'] - 复习类型
   * @returns {Promise<Object>} 复习结果
   */
  async submitSingleReview(data) {
    try {
      // 1. 参数验证
      if (!data.wordId) {
        throw new Error('单词ID不能为空');
      }
      
      // 2. 准备复习数据
      const reviewData = {
        results: [{
          wordId: data.wordId,
          correct: data.correct,
          responseTime: data.responseTime,
          reviewType: data.reviewType || 'recognition'
        }],
        sessionId: `single_${Date.now()}`,
        mode: 'single'
      };
      
      // 3. 提交复习
      return await this.submitReview(reviewData);
    } catch (error) {
      // 错误处理
      this._handleSingleReviewError(error, data.wordId);
      throw error;
    }
  }

  /**
   * 获取复习统计
   * @param {Object} params - 统计参数
   * @param {string} [params.period='week'] - 统计周期
   * @param {string} [params.language] - 语言筛选
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @returns {Promise<Object>} 复习统计
   */
  async getReviewStats(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateStatsParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('review_stats', queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getReviewStats(queryParams);
      
      // 5. 数据处理
      const stats = this._formatReviewStats(response.data);
      
      // 6. 状态更新
      this.reviewStore.setStats(stats);
      
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
   * 获取复习历史
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @param {string} [params.language] - 语言筛选
   * @returns {Promise<Object>} 复习历史数据
   */
  async getReviewHistory(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateHistoryParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('review_history', queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getReviewHistory(queryParams);
      
      // 5. 数据处理
      const historyData = this._formatReviewHistory(response.data);
      
      // 6. 状态更新
      this.reviewStore.setHistory(historyData.sessions);
      this.reviewStore.setHistoryPagination(historyData.pagination);
      
      // 7. 更新缓存
      this._setCache(cacheKey, historyData);
      
      return historyData;
    } catch (error) {
      // 错误处理
      this._handleGetHistoryError(error);
      throw error;
    }
  }

  /**
   * 获取复习进度
   * @returns {Promise<Object>} 复习进度
   */
  async getReviewProgress() {
    try {
      // 1. 生成缓存键
      const cacheKey = 'review_progress';
      
      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用
      const response = await api.getReviewProgress();
      
      // 4. 数据处理
      const progress = this._formatReviewProgress(response.data);
      
      // 5. 更新缓存
      this._setCache(cacheKey, progress);
      
      return progress;
    } catch (error) {
      // 错误处理
      this._handleGetProgressError(error);
      throw error;
    }
  }

  /**
   * 开始复习会话
   * @param {Object} options - 会话选项
   * @param {string} [options.mode='review'] - 复习模式
   * @param {number} [options.wordCount=20] - 单词数量
   * @param {string} [options.language] - 语言
   * @returns {Promise<Object>} 复习会话
   */
  async startReviewSession(options = {}) {
    try {
      // 1. 结束当前会话（如果有）
      if (this.currentSession) {
        await this.endReviewSession();
      }
      
      // 2. 参数验证
      const sessionOptions = this._validateSessionOptions(options);
      
      // 3. 获取复习单词
      const dueWords = await this.getDueWords({
        limit: sessionOptions.wordCount,
        language: sessionOptions.language,
        forceRefresh: true
      });
      
      if (dueWords.length === 0) {
        showWarning('当前没有需要复习的单词');
        return null;
      }
      
      // 4. 创建会话
      this.currentSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mode: sessionOptions.mode,
        language: sessionOptions.language,
        startTime: new Date().toISOString(),
        wordCount: dueWords.length,
        words: dueWords,
        results: []
      };
      
      this.sessionStartTime = Date.now();
      this.sessionWords = dueWords;
      this.sessionResults = [];
      
      // 5. 状态更新
      this.reviewStore.setCurrentSession(this.currentSession);
      
      // 6. 用户反馈
      showSuccess(`开始复习会话，共 ${dueWords.length} 个单词`);
      
      return this.currentSession;
    } catch (error) {
      // 错误处理
      this._handleStartSessionError(error);
      throw error;
    }
  }

  /**
   * 结束复习会话
   * @returns {Promise<Object>} 会话结果
   */
  async endReviewSession() {
    try {
      if (!this.currentSession) {
        return null;
      }
      
      // 1. 如果有未提交的结果，自动提交
      if (this.sessionResults.length > 0) {
        const reviewData = {
          results: this.sessionResults,
          sessionId: this.currentSession.id,
          duration: this._calculateSessionDuration(),
          mode: this.currentSession.mode
        };
        
        await this.submitReview(reviewData);
      }
      
      // 2. 清理会话状态
      const endedSession = { ...this.currentSession };
      
      this.currentSession = null;
      this.sessionStartTime = null;
      this.sessionWords = [];
      this.sessionResults = [];
      
      // 3. 状态更新
      this.reviewStore.clearCurrentSession();
      
      return endedSession;
    } catch (error) {
      console.error('结束复习会话失败:', error);
      return null;
    }
  }

  /**
   * 记录单词复习结果
   * @param {string|number} wordId - 单词ID
   * @param {boolean} correct - 是否正确
   * @param {Object} [options] - 选项
   * @param {number} [options.responseTime] - 响应时间
   * @param {string} [options.reviewType] - 复习类型
   */
  recordWordReview(wordId, correct, options = {}) {
    if (!this.currentSession) {
      console.warn('没有活动的复习会话');
      return;
    }
    
    const reviewResult = {
      wordId,
      correct,
      responseTime: options.responseTime,
      reviewType: options.reviewType || 'recognition',
      timestamp: Date.now()
    };
    
    this.sessionResults.push(reviewResult);
    
    // 更新会话状态
    this.currentSession.results.push(reviewResult);
    this.reviewStore.updateCurrentSession(this.currentSession);
  }

  /**
   * 获取今日复习目标
   * @returns {Promise<Object>} 今日复习目标
   */
  async getDailyGoal() {
    try {
      // 1. 生成缓存键
      const cacheKey = 'daily_goal';
      
      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用
      const response = await api.getDailyGoal();
      
      // 4. 数据处理
      const goal = this._formatDailyGoal(response.data);
      
      // 5. 更新缓存
      this._setCache(cacheKey, goal);
      
      return goal;
    } catch (error) {
      // 错误处理
      this._handleGetGoalError(error);
      throw error;
    }
  }

  /**
   * 更新每日目标
   * @param {Object} data - 目标数据
   * @param {number} data.targetWords - 目标单词数
   * @returns {Promise<Object>} 更新后的目标
   */
  async updateDailyGoal(data) {
    try {
      // 1. 参数验证
      if (!data || typeof data !== 'object') {
        throw new Error('目标数据不能为空');
      }
      
      if (!data.targetWords || data.targetWords < 1) {
        throw new Error('目标单词数必须大于0');
      }
      
      // 2. API调用
      const response = await api.updateDailyGoal(data);
      
      // 3. 数据处理
      const goal = this._formatDailyGoal(response.data);
      
      // 4. 清除缓存
      this.cache.delete('daily_goal');
      
      // 5. 用户反馈
      showSuccess('每日目标已更新');
      
      return goal;
    } catch (error) {
      // 错误处理
      this._handleUpdateGoalError(error);
      throw error;
    }
  }

  /**
   * 获取复习日历
   * @param {Object} params - 查询参数
   * @param {number} [params.year] - 年份
   * @param {number} [params.month] - 月份
   * @returns {Promise<Object>} 复习日历数据
   */
  async getReviewCalendar(params = {}) {
    try {
      // 1. 参数验证
      const queryParams = this._validateCalendarParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('review_calendar', queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getReviewCalendar(queryParams);
      
      // 5. 数据处理
      const calendar = this._formatReviewCalendar(response.data);
      
      // 6. 更新缓存
      this._setCache(cacheKey, calendar);
      
      return calendar;
    } catch (error) {
      // 错误处理
      this._handleGetCalendarError(error);
      throw error;
    }
  }

  /**
   * 清除复习缓存
   */
  clearCache() {
    this.cache.clear();
    this.sessionCache.clear();
    console.log('已清除所有复习缓存');
  }

  // ==================== 私有方法 ====================

  /**
   * 验证待复习单词参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateDueWordsParams(params) {
    const defaultParams = {
      limit: 20
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证数量限制
    if (validatedParams.limit < 1 || validatedParams.limit > 100) {
      validatedParams.limit = 20;
    }
    
    return validatedParams;
  }

  /**
   * 验证智能复习参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateSmartReviewParams(params) {
    const defaultParams = {
      limit: 20,
      algorithm: 'spaced_repetition'
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证数量限制
    if (validatedParams.limit < 1 || validatedParams.limit > 50) {
      validatedParams.limit = 20;
    }
    
    // 验证算法
    const validAlgorithms = ['spaced_repetition', 'adaptive', 'random'];
    if (!validAlgorithms.includes(validatedParams.algorithm)) {
      validatedParams.algorithm = 'spaced_repetition';
    }
    
    return validatedParams;
  }

  /**
   * 验证复习数据
   * @param {Object} data - 复习数据
   * @private
   */
  _validateReviewData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('复习数据不能为空');
    }
    
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      throw new Error('复习结果不能为空');
    }
    
    if (!data.sessionId) {
      throw new Error('会话ID不能为空');
    }
    
    // 验证每个结果
    data.results.forEach((result, index) => {
      if (!result.wordId) {
        throw new Error(`第 ${index + 1} 个结果缺少单词ID`);
      }
      
      if (typeof result.correct !== 'boolean') {
        throw new Error(`第 ${index + 1} 个结果缺少正确性标识`);
      }
    });
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
   * 验证历史参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateHistoryParams(params) {
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
   * 验证会话选项
   * @param {Object} options - 会话选项
   * @returns {Object} 验证后的选项
   * @private
   */
  _validateSessionOptions(options) {
    const defaultOptions = {
      mode: 'review',
      wordCount: 20,
      language: null
    };
    
    const validatedOptions = { ...defaultOptions, ...options };
    
    // 验证单词数量
    if (validatedOptions.wordCount < 1 || validatedOptions.wordCount > 100) {
      validatedOptions.wordCount = 20;
    }
    
    // 验证模式
    const validModes = ['review', 'test', 'practice'];
    if (!validModes.includes(validatedOptions.mode)) {
      validatedOptions.mode = 'review';
    }
    
    return validatedOptions;
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
   * 生成缓存键
   * @param {string} prefix - 缓存前缀
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateCacheKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `${prefix}_${paramString}`;
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
   * 计算会话时长
   * @returns {number} 会话时长（秒）
   * @private
   */
  _calculateSessionDuration() {
    if (!this.sessionStartTime) {
      return 0;
    }
    
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * 更新统计
   * @private
   */
  async _updateStats() {
    try {
      await this.getReviewStats({ forceRefresh: true });
    } catch (error) {
      console.error('更新复习统计失败:', error);
    }
  }

  /**
   * 清除复习相关缓存
   * @private
   */
  _clearReviewCache() {
    // 清除所有以'review_'开头的缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith('review_') || key.startsWith('due_words')) {
        this.cache.delete(key);
      }
    }
    
    // 清除词汇列表缓存（因为词汇状态已更新）
    for (const key of this.cache.keys()) {
      if (key.startsWith('vocabulary_')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 复习后更新词汇状态
   * @param {Object} reviewResult - 复习结果
   * @private
   */
  _updateVocabularyAfterReview(reviewResult) {
    if (!reviewResult.updatedWords || !Array.isArray(reviewResult.updatedWords)) {
      return;
    }
    
    // 更新词汇store中的单词状态
    reviewResult.updatedWords.forEach(updatedWord => {
      this.vocabularyStore.updateItem(updatedWord.id, updatedWord);
    });
  }

  /**
   * 格式化待复习单词
   * @param {Object} apiData - API返回的数据
   * @returns {Array} 格式化后的待复习单词
   * @private
   */
  _formatDueWords(apiData) {
    const words = apiData.words || apiData.due_words || apiData;
    
    return words.map(word => ({
      id: word.id || word.word_id,
      word: word.word,
      language: word.language || 'en',
      definition: word.definition || '',
      example: word.example || '',
      phonetic: word.phonetic || '',
      partOfSpeech: word.part_of_speech || word.pos,
      masteryLevel: word.mastery_level || 0,
      reviewCount: word.review_count || 0,
      lastReviewedAt: formatDate(word.last_reviewed_at),
      nextReviewAt: formatDate(word.next_review_at),
      difficulty: word.difficulty || 'medium',
      tags: word.tags || [],
      source: word.source || '',
      dueReason: word.due_reason || 'scheduled',
      priority: word.priority || 1
    }));
  }

  /**
   * 格式化智能复习单词
   * @param {Object} apiData - API返回的数据
   * @returns {Array} 格式化后的智能复习单词
   * @private
   */
  _formatSmartReviewWords(apiData) {
    const words = apiData.words || apiData.smart_words || apiData;
    
    return words.map(word => ({
      id: word.id || word.word_id,
      word: word.word,
      language: word.language || 'en',
      definition: word.definition || '',
      example: word.example || '',
      phonetic: word.phonetic || '',
      partOfSpeech: word.part_of_speech || word.pos,
      masteryLevel: word.mastery_level || 0,
      reviewCount: word.review_count || 0,
      lastReviewedAt: formatDate(word.last_reviewed_at),
      nextReviewAt: formatDate(word.next_review_at),
      difficulty: word.difficulty || 'medium',
      tags: word.tags || [],
      source: word.source || '',
      algorithm: word.algorithm || 'spaced_repetition',
      confidence: word.confidence || 0.5,
      recommendedOrder: word.recommended_order || 0
    }));
  }

  /**
   * 格式化复习结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的复习结果
   * @private
   */
  _formatReviewResult(apiData) {
    const result = apiData.result || apiData;
    
    return {
      sessionId: result.session_id || result.sessionId,
      totalWords: result.total_words || result.totalWords || 0,
      correctWords: result.correct_words || result.correctWords || 0,
      incorrectWords: result.incorrect_words || result.incorrectWords || 0,
      accuracy: result.accuracy || 0,
      formattedAccuracy: formatPercentage(result.accuracy || 0, 100, 1),
      duration: result.duration || 0,
      formattedDuration: formatDuration(result.duration || 0),
      averageResponseTime: result.average_response_time || result.avgResponseTime || 0,
      updatedWords: result.updated_words || result.updatedWords || [],
      timestamp: formatDate(result.timestamp || result.created_at)
    };
  }

  /**
   * 格式化复习统计
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的复习统计
   * @private
   */
  _formatReviewStats(apiData) {
    const stats = apiData.stats || apiData;
    
    return {
      totalReviews: stats.total_reviews || stats.totalReviews || 0,
      totalWordsReviewed: stats.total_words_reviewed || stats.totalWordsReviewed || 0,
      averageAccuracy: stats.average_accuracy || stats.averageAccuracy || 0,
      formattedAverageAccuracy: formatPercentage(stats.average_accuracy || 0, 100, 1),
      streakDays: stats.streak_days || stats.streakDays || 0,
      longestStreak: stats.longest_streak || stats.longestStreak || 0,
      todayReviews: stats.today_reviews || stats.todayReviews || 0,
      todayAccuracy: stats.today_accuracy || stats.todayAccuracy || 0,
      formattedTodayAccuracy: formatPercentage(stats.today_accuracy || 0, 100, 1),
      weeklyReviews: stats.weekly_reviews || stats.weeklyReviews || 0,
      weeklyAccuracy: stats.weekly_accuracy || stats.weeklyAccuracy || 0,
      monthlyReviews: stats.monthly_reviews || stats.monthlyReviews || 0,
      monthlyAccuracy: stats.monthly_accuracy || stats.monthlyAccuracy || 0,
      byLanguage: stats.by_language || stats.byLanguage || {},
      byDifficulty: stats.by_difficulty || stats.byDifficulty || {},
      reviewHistory: stats.review_history || stats.reviewHistory || []
    };
  }

  /**
   * 格式化复习历史
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的复习历史
   * @private
   */
  _formatReviewHistory(apiData) {
    const sessions = (apiData.sessions || apiData.history || []).map(session => ({
      id: session.id || session.session_id,
      mode: session.mode || 'review',
      totalWords: session.total_words || session.totalWords || 0,
      correctWords: session.correct_words || session.correctWords || 0,
      accuracy: session.accuracy || 0,
      formattedAccuracy: formatPercentage(session.accuracy || 0, 100, 1),
      duration: session.duration || 0,
      formattedDuration: formatDuration(session.duration || 0),
      language: session.language || 'en',
      completedAt: formatDate(session.completed_at || session.created_at),
      details: session.details || {}
    }));
    
    const pagination = {
      page: apiData.page || 1,
      pageSize: apiData.page_size || apiData.limit || 20,
      total: apiData.total || apiData.total_count || 0,
      totalPages: apiData.total_pages || Math.ceil((apiData.total || 0) / (apiData.page_size || 20))
    };
    
    return { sessions, pagination };
  }

  /**
   * 格式化复习进度
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的复习进度
   * @private
   */
  _formatReviewProgress(apiData) {
    const progress = apiData.progress || apiData;
    
    return {
      dailyGoal: progress.daily_goal || progress.dailyGoal || 0,
      dailyCompleted: progress.daily_completed || progress.dailyCompleted || 0,
      dailyProgress: progress.daily_progress || progress.dailyProgress || 0,
      formattedDailyProgress: formatPercentage(progress.daily_progress || 0, 100, 1),
      weeklyGoal: progress.weekly_goal || progress.weeklyGoal || 0,
      weeklyCompleted: progress.weekly_completed || progress.weeklyCompleted || 0,
      weeklyProgress: progress.weekly_progress || progress.weeklyProgress || 0,
      monthlyGoal: progress.monthly_goal || progress.monthlyGoal || 0,
      monthlyCompleted: progress.monthly_completed || progress.monthlyCompleted || 0,
      monthlyProgress: progress.monthly_progress || progress.monthlyProgress || 0,
      nextMilestone: progress.next_milestone || progress.nextMilestone,
      milestoneProgress: progress.milestone_progress || progress.milestoneProgress || 0
    };
  }

  /**
   * 格式化每日目标
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的每日目标
   * @private
   */
  _formatDailyGoal(apiData) {
    const goal = apiData.goal || apiData;
    
    return {
      targetWords: goal.target_words || goal.targetWords || 20,
      streakDays: goal.streak_days || goal.streakDays || 0,
      completedToday: goal.completed_today || goal.completedToday || 0,
      todayProgress: goal.today_progress || goal.todayProgress || 0,
      formattedTodayProgress: formatPercentage(goal.today_progress || 0, 100, 1),
      averageDailyWords: goal.average_daily_words || goal.averageDailyWords || 0,
      bestDay: goal.best_day || goal.bestDay || 0,
      reminderTime: goal.reminder_time || goal.reminderTime,
      isReminderEnabled: goal.is_reminder_enabled || goal.isReminderEnabled || false
    };
  }

  /**
   * 格式化复习日历
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的复习日历
   * @private
   */
  _formatReviewCalendar(apiData) {
    const calendar = apiData.calendar || apiData;
    
    return {
      year: calendar.year,
      month: calendar.month,
      days: calendar.days || [],
      totalReviews: calendar.total_reviews || calendar.totalReviews || 0,
      averageDailyReviews: calendar.average_daily_reviews || calendar.averageDailyReviews || 0,
      streak: calendar.streak || 0,
      heatmapData: calendar.heatmap_data || calendar.heatmapData || {}
    };
  }

  /**
   * 处理获取待复习单词错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetDueWordsError(error) {
    let message = '获取待复习单词失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限获取复习单词';
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
   * 处理获取智能复习单词错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetSmartReviewError(error) {
    let message = '获取智能复习单词失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限获取智能复习单词';
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
   * 处理提交复习错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleSubmitReviewError(error) {
    let message = '提交复习结果失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '复习数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限提交复习结果';
          break;
        case 422:
          message = '复习数据验证失败';
          break;
        case 429:
          message = '提交过于频繁，请稍后再试';
          break;
        default:
          message = `提交失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理单个单词复习错误
   * @param {Error} error - 错误对象
   * @param {string|number} wordId - 单词ID
   * @private
   */
  _handleSingleReviewError(error, wordId) {
    let message = `提交单词 ${wordId} 复习结果失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '单词复习数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限提交单词复习';
          break;
        case 404:
          message = '单词不存在';
          break;
        default:
          message = `提交失败 (${error.response.status})`;
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
    let message = '获取复习统计失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看复习统计';
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
   * 处理获取历史错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetHistoryError(error) {
    let message = '获取复习历史失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看复习历史';
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
   * 处理获取进度错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetProgressError(error) {
    console.error('获取复习进度失败:', error);
    showError('获取复习进度失败');
  }

  /**
   * 处理开始会话错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleStartSessionError(error) {
    let message = '开始复习会话失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限开始复习会话';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `开始失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取目标错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetGoalError(error) {
    console.error('获取每日目标失败:', error);
    showError('获取每日目标失败');
  }

  /**
   * 处理更新目标错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleUpdateGoalError(error) {
    let message = '更新每日目标失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '目标数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新目标';
          break;
        case 422:
          message = '目标数据验证失败';
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
   * 处理获取日历错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetCalendarError(error) {
    console.error('获取复习日历失败:', error);
    showError('获取复习日历失败');
  }
}

// 创建单例实例
const reviewService = new ReviewService();

// 导出实例
export default reviewService;