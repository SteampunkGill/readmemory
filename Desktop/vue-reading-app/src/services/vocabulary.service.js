// src/services/vocabulary.service.js
// 功能：单词查询、生词本管理、学习状态更新

import { api } from '@/api/vocabulary';
import { useVocabularyStore } from '@/stores/vocabulary.store';
import { showError, showSuccess, showWarning } from '@/utils/notify';
import { formatDate, formatDuration } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';
import { requestQueue } from '@/utils/request-queue';

// 添加缺失的工具函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

class VocabularyService {
  constructor() {
    this.vocabularyStore = useVocabularyStore();
    this.cache = new Map(); // 单词查询缓存
    this.wordCache = new Map(); // 单词详情缓存
    this.cacheExpiry = 30 * 60 * 1000; // 缓存30分钟
    
    // 防抖的批量更新函数
    this.batchUpdateDebounced = debounce(this._batchUpdateVocabulary.bind(this), 3000);
    
    // 批量更新队列
    this.batchUpdateQueue = new Map();
  }

  /**
   * 查询单词
   * @param {string} word - 单词
   * @param {string} [language='en'] - 语言
   * @param {Object} [options] - 选项
   * @param {boolean} [options.forceRefresh=false] - 是否强制刷新
   * @param {boolean} [options.addToHistory=true] - 是否添加到查询历史
   * @returns {Promise<Object>} 单词详情
   */
  async lookupWord(word, language = 'en', options = {}) {
    try {
      // 1. 参数验证
      if (!word || word.trim() === '') {
        throw new Error('单词不能为空');
      }
      
      const normalizedWord = word.trim().toLowerCase();
      
      // 2. 生成缓存键
      const cacheKey = this._generateWordCacheKey(normalizedWord, language);
      
      // 3. 检查缓存
      if (!options.forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log(`从缓存获取单词 "${normalizedWord}" 详情`);
        return cachedData;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.lookupWord({ word: normalizedWord, language });
      
      // 5. 数据处理
      const wordDetail = this._formatWordDetail(response.data, language);
      
      // 6. 状态更新
      this.vocabularyStore.setCurrentWord(wordDetail);
      
      // 7. 添加到查询历史
      if (options.addToHistory !== false) {
        this._addToSearchHistory(normalizedWord, wordDetail);
      }
      
      // 8. 更新缓存
      this._setCache(cacheKey, wordDetail);
      
      return wordDetail;
    } catch (error) {
      // 错误处理
      this._handleLookupError(error, word);
      throw error;
    }
  }

  /**
   * 批量查询单词
   * @param {Array<string>} words - 单词数组
   * @param {string} [language='en'] - 语言
   * @returns {Promise<Array>} 单词详情列表
   */
  async batchLookupWords(words, language = 'en') {
    try {
      // 1. 参数验证
      if (!words || !Array.isArray(words) || words.length === 0) {
        throw new Error('单词列表不能为空');
      }
      
      if (words.length > 50) {
        throw new Error('批量查询最多支持50个单词');
      }
      
      // 2. 去重和规范化
      const normalizedWords = [...new Set(words.map(w => w.trim().toLowerCase()))];
      
      // 3. 检查缓存中已有的单词
      const cachedResults = [];
      const wordsToFetch = [];
      
      normalizedWords.forEach(word => {
        const cacheKey = this._generateWordCacheKey(word, language);
        if (this._checkCache(cacheKey)) {
          cachedResults.push(this.cache.get(cacheKey).data);
        } else {
          wordsToFetch.push(word);
        }
      });
      
      // 4. 如果所有单词都在缓存中，直接返回
      if (wordsToFetch.length === 0) {
        return cachedResults;
      }
      
      // 5. API调用（批量查询）- 使用对象参数
      const response = await api.batchLookupWords({ words: wordsToFetch, language });
      
      // 6. 数据处理
      const fetchedResults = (response.data.words || response.data).map(wordData => 
        this._formatWordDetail(wordData, language)
      );
      
      // 7. 更新缓存
      fetchedResults.forEach(wordDetail => {
        const cacheKey = this._generateWordCacheKey(wordDetail.word, language);
        this._setCache(cacheKey, wordDetail);
      });
      
      // 8. 合并结果
      const allResults = [...cachedResults, ...fetchedResults];
      
      return allResults;
    } catch (error) {
      // 错误处理
      this._handleBatchLookupError(error);
      throw error;
    }
  }

  /**
   * 添加到生词本
   * @param {Object} data - 生词数据
   * @param {string} data.word - 单词
   * @param {string} [data.definition] - 释义
   * @param {string} [data.example] - 例句
   * @param {Array} [data.tags] - 标签
   * @param {string} [data.language='en'] - 语言
   * @param {string} [data.source] - 来源（文档ID等）
   * @param {number} [data.sourcePage] - 来源页码
   * @returns {Promise<Object>} 添加的生词
   */
  async addToVocabulary(data) {
    let tempId = null; // 将变量声明移到try块外部
    
    try {
      // 1. 参数验证
      this._validateVocabularyItem(data);
      
      // 2. 检查是否已存在
      const existingItem = this.vocabularyStore.items.find(
        item => item.word === data.word.toLowerCase() && item.language === (data.language || 'en')
      );
      
      if (existingItem) {
        showWarning(`单词 "${data.word}" 已在生词本中`);
        return existingItem;
      }
      
      // 3. 生成临时ID（用于乐观更新）
      tempId = `temp_vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempItem = {
        id: tempId,
        ...data,
        word: data.word.toLowerCase(),
        language: data.language || 'en',
        status: 'new',
        masteryLevel: 0,
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSynced: false
      };
      
      // 4. 乐观更新：先添加到本地状态
      this.vocabularyStore.addItem(tempItem);
      
      // 5. API调用
      const response = await api.addToVocabulary(data);
      
      // 6. 数据处理
      const vocabularyItem = this._formatVocabularyItem(response.data);
      
      // 7. 更新本地状态（替换临时数据）
      this.vocabularyStore.updateItem(tempId, vocabularyItem);
      
      // 8. 更新缓存
      this._updateVocabularyCache(vocabularyItem);
      
      // 9. 用户反馈
      showSuccess(`单词 "${data.word}" 已添加到生词本`);
      
      return vocabularyItem;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (tempId) {
        this.vocabularyStore.removeItem(tempId);
      }
      this._handleAddVocabularyError(error, data.word);
      throw error;
    }
  }

  /**
   * 获取生词本列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=50] - 每页数量
   * @param {string} [params.status] - 状态筛选
   * @param {Array} [params.tags] - 标签筛选
   * @param {string} [params.language] - 语言筛选
   * @param {string} [params.sortBy='created_at'] - 排序字段
   * @param {string} [params.sortOrder='desc'] - 排序方向
   * @param {string} [params.search] - 搜索关键词
   * @returns {Promise<Object>} 生词本列表数据
   */
  async getVocabularyList(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateVocabularyParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateListCacheKey('vocabulary', queryParams);
      
      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取生词本列表');
        return cachedData;
      }
      
      // 4. API调用 - 使用对象参数
      const response = await api.getVocabularyList(queryParams);
      
      // 5. 数据处理
      const formattedData = this._formatVocabularyList(response.data);
      
      // 6. 状态更新
      this.vocabularyStore.setItems(formattedData.items);
      this.vocabularyStore.setPagination(formattedData.pagination);
      
      // 7. 更新缓存
      this._setCache(cacheKey, formattedData);
      
      return formattedData;
    } catch (error) {
      // 错误处理
      this._handleGetVocabularyError(error);
      throw error;
    }
  }

  /**
   * 获取生词详情
   * @param {string|number} id - 生词ID
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Object>} 生词详情
   */
  async getVocabularyItem(id, forceRefresh = false) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('生词ID不能为空');
      }
      
      // 2. 生成缓存键
      const cacheKey = `vocab_item_${id}`;
      
      // 3. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log(`从缓存获取生词详情 ID: ${id}`);
        return cachedData;
      }
      
      // 4. API调用
      const response = await api.getVocabularyItem(id);
      
      // 5. 数据处理
      const item = this._formatVocabularyItem(response.data);
      
      // 6. 状态更新
      this.vocabularyStore.setCurrentItem(item);
      
      // 7. 更新缓存
      this._setCache(cacheKey, item);
      
      return item;
    } catch (error) {
      // 错误处理
      this._handleGetItemError(error, id);
      throw error;
    }
  }

  /**
   * 更新生词状态
   * @param {string|number} id - 生词ID
   * @param {Object} data - 更新数据
   * @param {string} [data.status] - 新状态
   * @param {number} [data.masteryLevel] - 掌握程度
   * @param {Array} [data.tags] - 新标签
   * @param {string} [data.notes] - 笔记
   * @param {boolean} [immediate=true] - 是否立即更新
   * @returns {Promise<Object>} 更新后的生词
   */
  async updateVocabularyItem(id, data, immediate = true) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('生词ID不能为空');
      }
      
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('更新数据不能为空');
      }
      
      // 2. 获取原始生词
      const originalItem = this.vocabularyStore.items.find(item => item.id === id) ||
                          this.cache.get(`vocab_item_${id}`);
      
      if (!originalItem) {
        throw new Error('生词不存在');
      }
      
      // 3. 立即更新或加入批量队列
      if (immediate) {
        return await this._updateSingleVocabularyItem(id, data, originalItem);
      } else {
        // 加入批量更新队列
        this._addToBatchQueue(id, data, originalItem);
        
        // 乐观更新本地状态
        const updatedItem = { ...originalItem, ...data, updatedAt: new Date().toISOString() };
        this.vocabularyStore.updateItem(id, updatedItem);
        
        return updatedItem;
      }
    } catch (error) {
      // 错误处理
      this._handleUpdateVocabularyError(error, id);
      throw error;
    }
  }

  /**
   * 删除生词
   * @param {string|number} id - 生词ID
   * @param {boolean} [confirm=true] - 是否需要确认
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteVocabularyItem(id, confirm = true) {
    let item = null; // 将变量声明移到try块外部
    
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('生词ID不能为空');
      }
      
      // 2. 获取生词信息
      item = this.vocabularyStore.items.find(item => item.id === id) ||
             this.cache.get(`vocab_item_${id}`);
      
      // 3. 确认删除
      if (confirm && item) {
        const confirmed = window.confirm(`确定要从生词本中删除单词 "${item.word}" 吗？`);
        if (!confirmed) {
          return false;
        }
      }
      
      // 4. 乐观更新：先从本地状态移除
      this.vocabularyStore.removeItem(id);
      
      // 5. API调用
      await api.deleteVocabularyItem(id);
      
      // 6. 清除缓存
      this._removeVocabularyFromCache(id);
      
      // 7. 用户反馈
      showSuccess('生词已删除');
      
      return true;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (item) {
        this.vocabularyStore.addItem(item);
      }
      this._handleDeleteVocabularyError(error, id);
      throw error;
    }
  }

  /**
   * 批量操作生词
   * @param {string} action - 操作类型
   * @param {Array} ids - 生词ID数组
   * @param {Object} [data] - 操作数据
   * @returns {Promise<Object>} 批量操作结果
   */
  async batchVocabularyAction(action, ids, data = {}) {
    try {
      // 1. 参数验证
      if (!action) {
        throw new Error('操作类型不能为空');
      }
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('生词ID列表不能为空');
      }
      
      // 2. 确认批量操作
      const confirmed = window.confirm(`确定要对 ${ids.length} 个生词执行 "${action}" 操作吗？`);
      if (!confirmed) {
        return { success: false, message: '用户取消操作' };
      }
      
      // 3. API调用 - 使用对象参数
      const response = await api.batchVocabularyAction({ action, user_vocab_ids: ids, ...data });
      
      // 4. 数据处理
      const result = this._formatBatchResult(response.data);
      
      // 5. 状态更新
      if (action === 'delete') {
        ids.forEach(id => {
          this.vocabularyStore.removeItem(id);
          this._removeVocabularyFromCache(id);
        });
      } else if (action === 'update') {
        // 需要重新获取更新后的生词
        await this.getVocabularyList({ forceRefresh: true });
      }
      
      // 6. 清除列表缓存
      this._clearListCache();
      
      // 7. 用户反馈
      showSuccess(`成功对 ${ids.length} 个生词执行 ${action} 操作`);
      
      return result;
    } catch (error) {
      // 错误处理
      this._handleBatchActionError(error, action);
      throw error;
    }
  }

  /**
   * 获取学习统计
   * @param {Object} [params] - 统计参数
   * @param {string} [params.period] - 统计周期
   * @param {string} [params.language] - 语言筛选
   * @returns {Promise<Object>} 学习统计
   */
  async getLearningStats(params = {}) {
    try {
      // 1. 生成缓存键
      const cacheKey = this._generateStatsCacheKey(params);
      
      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用 - 使用对象参数
      const response = await api.getLearningStats(params);
      
      // 4. 数据处理
      const stats = this._formatLearningStats(response.data);
      
      // 5. 更新缓存
      this._setCache(cacheKey, stats);
      
      return stats;
    } catch (error) {
      // 错误处理
      this._handleGetStatsError(error);
      throw error;
    }
  }

  /**
   * 获取复习统计
   * @returns {Promise<Object>} 复习统计
   */
  async getReviewStats() {
    try {
      // 1. API调用
      const response = await api.getReviewStats();
      
      // 2. 数据处理
      const stats = this._formatReviewStats(response.data);
      
      return stats;
    } catch (error) {
      // 错误处理
      this._handleGetReviewStatsError(error);
      throw error;
    }
  }

  /**
   * 获取生词本导出数据
   * @param {Object} [params] - 导出参数
   * @param {string} [params.format='csv'] - 导出格式
   * @param {Array} [params.fields] - 导出字段
   * @returns {Promise<Object>} 导出数据
   */
  async exportVocabulary(params = {}) {
    try {
      // 1. 参数验证
      const exportParams = this._validateExportParams(params);
      
      // 2. API调用 - 使用对象参数
      const response = await api.exportVocabulary(exportParams);
      
      // 3. 数据处理
      const exportData = this._formatExportData(response.data);
      
      // 4. 用户反馈
      showSuccess('生词本导出成功');
      
      return exportData;
    } catch (error) {
      // 错误处理
      this._handleExportError(error);
      throw error;
    }
  }

  /**
   * 获取搜索历史
   * @returns {Array} 搜索历史
   */
  getSearchHistory() {
    const history = JSON.parse(localStorage.getItem('vocabulary_search_history') || '[]');
    return history.slice(0, 50); // 最多返回50条
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory() {
    localStorage.removeItem('vocabulary_search_history');
    showSuccess('搜索历史已清除');
  }

  /**
   * 清除词汇缓存
   * @param {string|number} [id] - 生词ID（可选，不传则清除所有）
   */
  clearCache(id = null) {
    if (id) {
      // 清除指定生词的缓存
      for (const key of this.cache.keys()) {
        if (key.includes(`_${id}_`) || key.endsWith(`_${id}`)) {
          this.cache.delete(key);
        }
      }
      console.log(`已清除生词 ${id} 的缓存`);
    } else {
      // 清除所有缓存
      this.cache.clear();
      this.wordCache.clear();
      console.log('已清除所有词汇缓存');
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 验证生词数据
   * @param {Object} data - 生词数据
   * @private
   */
  _validateVocabularyItem(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('生词数据不能为空');
    }
    
    if (!data.word || data.word.trim() === '') {
      throw new Error('单词不能为空');
    }
    
    // 验证语言代码
    if (data.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(data.language)) {
      throw new Error('语言代码格式无效');
    }
  }

  /**
   * 验证词汇查询参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateVocabularyParams(params) {
    const defaultParams = {
      page: 1,
      pageSize: 50,
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证页码
    if (validatedParams.page < 1) {
      validatedParams.page = 1;
    }
    
    // 验证每页数量
    if (validatedParams.pageSize < 1 || validatedParams.pageSize > 200) {
      validatedParams.pageSize = 50;
    }
    
    // 验证排序方向
    if (!['asc', 'desc'].includes(validatedParams.sortOrder)) {
      validatedParams.sortOrder = 'desc';
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
      format: 'csv',
      fields: ['word', 'definition', 'status', 'masteryLevel', 'createdAt']
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证导出格式
    const validFormats = ['csv', 'json', 'txt', 'xlsx'];
    if (!validFormats.includes(validatedParams.format)) {
      validatedParams.format = 'csv';
    }
    
    return validatedParams;
  }

  /**
   * 生成单词缓存键
   * @param {string} word - 单词
   * @param {string} language - 语言
   * @returns {string} 缓存键
   * @private
   */
  _generateWordCacheKey(word, language) {
    return `word_${language}_${word}`;
  }

  /**
   * 生成列表缓存键
   * @param {string} prefix - 前缀
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateListCacheKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `${prefix}_${paramString}`;
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
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `stats_${paramString}`;
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
   * 更新词汇缓存
   * @param {Object} item - 生词数据
   * @private
   */
  _updateVocabularyCache(item) {
    const cacheKey = `vocab_item_${item.id}`;
    this.cache.set(cacheKey, { data: item, timestamp: Date.now() });
  }

  /**
   * 从缓存中移除生词
   * @param {string|number} id - 生词ID
   * @private
   */
  _removeVocabularyFromCache(id) {
    const cacheKey = `vocab_item_${id}`;
    this.cache.delete(cacheKey);
  }

  /**
   * 清除列表缓存
   * @private
   */
  _clearListCache() {
    // 清除所有以'vocabulary_'开头的缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith('vocabulary_')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 添加到搜索历史
   * @param {string} word - 单词
   * @param {Object} wordDetail - 单词详情
   * @private
   */
  _addToSearchHistory(word, wordDetail) {
    try {
      const history = JSON.parse(localStorage.getItem('vocabulary_search_history') || '[]');
      
      // 移除重复项
      const filteredHistory = history.filter(item => item.word !== word);
      
      // 添加新记录到开头
      const historyItem = {
        word,
        language: wordDetail.language,
        definition: wordDetail.definitions?.[0] || '',
        timestamp: Date.now(),
        date: new Date().toISOString()
      };
      
      filteredHistory.unshift(historyItem);
      
      // 限制历史记录数量
      const limitedHistory = filteredHistory.slice(0, 100);
      
      localStorage.setItem('vocabulary_search_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }

  /**
   * 添加到批量更新队列
   * @param {string|number} id - 生词ID
   * @param {Object} data - 更新数据
   * @param {Object} originalItem - 原始生词数据
   * @private
   */
  _addToBatchQueue(id, data, originalItem) {
    this.batchUpdateQueue.set(id, {
      id,
      data,
      originalItem,
      timestamp: Date.now()
    });
    
    // 触发防抖批量更新
    this.batchUpdateDebounced();
  }

  /**
   * 实际批量更新
   * @private
   */
  async _batchUpdateVocabulary() {
    if (this.batchUpdateQueue.size === 0) {
      return;
    }
    
    try {
      const batchItems = Array.from(this.batchUpdateQueue.values());
      
      // 准备批量更新数据
      const batchData = batchItems.map(item => ({
        id: item.id,
        ...item.data
      }));
      
      // API调用 - 使用对象参数
      const response = await api.batchUpdateVocabulary({ items: batchData });
      
      // 处理响应
      const results = response.data.results || [];
      
      // 更新本地状态
      results.forEach(result => {
        if (result.success) {
          const updatedItem = this._formatVocabularyItem(result.data);
          this.vocabularyStore.updateItem(result.id, updatedItem);
          this._updateVocabularyCache(updatedItem);
        } else {
          // 更新失败，恢复原始状态
          const originalItem = batchItems.find(item => item.id === result.id)?.originalItem;
          if (originalItem) {
            this.vocabularyStore.updateItem(result.id, originalItem);
          }
        }
      });
      
      // 清空队列
      this.batchUpdateQueue.clear();
      
      console.log(`批量更新完成，成功 ${results.filter(r => r.success).length} 项`);
    } catch (error) {
      console.error('批量更新失败:', error);
      // 批量更新失败，不清空队列，等待下次重试
    }
  }

  /**
   * 更新单个生词
   * @param {string|number} id - 生词ID
   * @param {Object} data - 更新数据
   * @param {Object} originalItem - 原始生词数据
   * @returns {Promise<Object>} 更新后的生词
   * @private
   */
  async _updateSingleVocabularyItem(id, data, originalItem) {
    // 乐观更新：先更新本地状态
    const updatedItem = { ...originalItem, ...data, updatedAt: new Date().toISOString() };
    this.vocabularyStore.updateItem(id, updatedItem);
    
    // API调用
    const response = await api.updateVocabularyItem(id, data);
    
    // 数据处理
    const vocabularyItem = this._formatVocabularyItem(response.data);
    
    // 更新本地状态
    this.vocabularyStore.updateItem(id, vocabularyItem);
    
    // 更新缓存
    this._updateVocabularyCache(vocabularyItem);
    
    // 用户反馈
    showSuccess('生词状态已更新');
    
    return vocabularyItem;
  }

  /**
   * 格式化单词详情
   * @param {Object} apiData - API返回的数据
   * @param {string} language - 语言
   * @returns {Object} 格式化后的单词详情
   * @private
   */
  _formatWordDetail(apiData, language) {
    const wordData = apiData.word || apiData;
    
    return {
      word: wordData.word || wordData.text,
      language: wordData.language || language,
      phonetic: wordData.phonetic || wordData.pronunciation,
      definitions: wordData.definitions || [],
      examples: wordData.examples || wordData.sentences || [],
      synonyms: wordData.synonyms || [],
      antonyms: wordData.antonyms || [],
      partOfSpeech: wordData.part_of_speech || wordData.pos,
      frequency: wordData.frequency || 0,
      difficulty: wordData.difficulty || 'medium',
      audioUrl: wordData.audio_url || wordData.pronunciation_audio,
      source: wordData.source || 'dictionary',
      metadata: wordData.metadata || {}
    };
  }

  /**
   * 格式化生词数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的生词
   * @private
   */
  _formatVocabularyItem(apiData) {
    const itemData = apiData.item || apiData;
    
    return {
      id: itemData.id || itemData.vocabulary_id,
      word: itemData.word,
      language: itemData.language || 'en',
      definition: itemData.definition || '',
      example: itemData.example || itemData.sentence || '',
      notes: itemData.notes || '',
      tags: itemData.tags || [],
      status: itemData.status || 'new',
      masteryLevel: itemData.mastery_level || itemData.masteryLevel || 0,
      reviewCount: itemData.review_count || itemData.reviewCount || 0,
      lastReviewedAt: formatDate(itemData.last_reviewed_at || itemData.lastReviewedAt),
      nextReviewAt: formatDate(itemData.next_review_at || itemData.nextReviewAt),
      source: itemData.source || '',
      sourcePage: itemData.source_page || itemData.sourcePage || 0,
      createdAt: formatDate(itemData.created_at || itemData.createdAt),
      updatedAt: formatDate(itemData.updated_at || itemData.updatedAt)
    };
  }

  /**
   * 格式化生词列表
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的列表数据
   * @private
   */
  _formatVocabularyList(apiData) {
    const items = (apiData.items || apiData.vocabulary || []).map(item => 
      this._formatVocabularyItem(item)
    );
    
    const pagination = {
      page: apiData.page || 1,
      pageSize: apiData.page_size || apiData.limit || 50,
      total: apiData.total || apiData.total_count || 0,
      totalPages: apiData.total_pages || Math.ceil((apiData.total || 0) / (apiData.page_size || 50))
    };
    
    return { items, pagination };
  }

  /**
   * 格式化批量操作结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的结果
   * @private
   */
  _formatBatchResult(apiData) {
    return {
      success: apiData.success || false,
      message: apiData.message || '',
      processedCount: apiData.processed_count || apiData.count || 0,
      failedCount: apiData.failed_count || 0,
      failedItems: apiData.failed_items || []
    };
  }

  /**
   * 格式化学习统计
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的统计
   * @private
   */
  _formatLearningStats(apiData) {
    const stats = apiData.stats || apiData;
    
    return {
      totalWords: stats.total_words || stats.totalWords || 0,
      masteredWords: stats.mastered_words || stats.masteredWords || 0,
      learningWords: stats.learning_words || stats.learningWords || 0,
      newWords: stats.new_words || stats.newWords || 0,
      todayAdded: stats.today_added || stats.todayAdded || 0,
      todayReviewed: stats.today_reviewed || stats.todayReviewed || 0,
      weeklyProgress: stats.weekly_progress || stats.weeklyProgress || 0,
      monthlyProgress: stats.monthly_progress || stats.monthlyProgress || 0,
      byLanguage: stats.by_language || stats.byLanguage || {},
      byStatus: stats.by_status || stats.byStatus || {},
      streakDays: stats.streak_days || stats.streakDays || 0
    };
  }

  /**
   * 格式化复习统计
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的统计
   * @private
   */
  _formatReviewStats(apiData) {
    const stats = apiData.stats || apiData;
    
    return {
      dueToday: stats.due_today || stats.dueToday || 0,
      dueTomorrow: stats.due_tomorrow || stats.dueTomorrow || 0,
      dueThisWeek: stats.due_this_week || stats.dueThisWeek || 0,
      totalDue: stats.total_due || stats.totalDue || 0,
      reviewAccuracy: stats.review_accuracy || stats.reviewAccuracy || 0,
      averageMastery: stats.average_mastery || stats.averageMastery || 0,
      lastReviewDate: formatDate(stats.last_review_date || stats.lastReviewDate),
      reviewHistory: stats.review_history || stats.reviewHistory || []
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
      data: apiData.data || apiData.content,
      format: apiData.format || 'csv',
      fileName: apiData.file_name || apiData.filename || 'vocabulary_export',
      fileSize: apiData.file_size ? formatFileSize(apiData.file_size) : '未知',
      downloadUrl: apiData.download_url || apiData.url,
      expiresAt: formatDate(apiData.expires_at || apiData.expiresAt)
    };
  }

  /**
   * 处理查询单词错误
   * @param {Error} error - 错误对象
   * @param {string} word - 单词
   * @private
   */
  _handleLookupError(error, word) {
    let message = `查询单词 "${word}" 失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '单词格式无效';
          break;
        case 404:
          message = `未找到单词 "${word}"`;
          break;
        case 429:
          message = '查询过于频繁，请稍后再试';
          break;
        default:
          message = `查询失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理批量查询错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleBatchLookupError(error) {
    let message = '批量查询单词失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '单词列表格式无效';
          break;
        case 413:
          message = '单词列表太大';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `批量查询失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理添加生词错误
   * @param {Error} error - 错误对象
   * @param {string} word - 单词
   * @private
   */
  _handleAddVocabularyError(error, word) {
    let message = `添加单词 "${word}" 到生词本失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '生词数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限添加生词';
          break;
        case 409:
          message = '单词已在生词本中';
          break;
        case 422:
          message = '生词数据验证失败';
          break;
        default:
          message = `添加失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取生词列表错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetVocabularyError(error) {
    let message = '获取生词本列表失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看生词本';
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
   * 处理获取生词详情错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 生词ID
   * @private
   */
  _handleGetItemError(error, id) {
    let message = `获取生词详情失败 (ID: ${id})`;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看此生词';
          break;
        case 404:
          message = '生词不存在或已被删除';
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
   * 处理更新生词错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 生词ID
   * @private
   */
  _handleUpdateVocabularyError(error, id) {
    let message = `更新生词失败 (ID: ${id})`;
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '更新数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新此生词';
          break;
        case 404:
          message = '生词不存在或已被删除';
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
   * 处理删除生词错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 生词ID
   * @private
   */
  _handleDeleteVocabularyError(error, id) {
    let message = `删除生词失败 (ID: ${id})`;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限删除此生词';
          break;
        case 404:
          message = '生词不存在或已被删除';
          break;
        default:
          message = `删除失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理批量操作错误
   * @param {Error} error - 错误对象
   * @param {string} action - 操作类型
   * @private
   */
  _handleBatchActionError(error, action) {
    let message = `批量${action}操作失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '操作数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限执行此操作';
          break;
        case 429:
          message = '操作过于频繁，请稍后再试';
          break;
        default:
          message = `操作失败 (${error.response.status})`;
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
    console.error('获取学习统计失败:', error);
    showError('获取统计信息失败');
  }

  /**
   * 处理获取复习统计错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetReviewStatsError(error) {
    console.error('获取复习统计失败:', error);
    showError('获取复习统计失败');
  }

  /**
   * 处理导出错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleExportError(error) {
    let message = '生词本导出失败';
    
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
const vocabularyService = new VocabularyService();

// 导出实例
export default vocabularyService;