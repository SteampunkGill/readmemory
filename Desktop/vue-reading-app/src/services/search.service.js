// src/services/search.service.js
// ✅ 使用默认导入
import api from '@/api/search';  
import { useSearchStore } from '@/stores/search.store';
import { useDocumentStore } from '@/stores/document.store';
import { useVocabularyStore } from '@/stores/vocabulary.store';
import { showError, showSuccess } from '@/utils/notify';
import { debounce } from '@/utils/debounce';
import { formatDate } from '@/utils/formatter';

class SearchService {
  constructor() {
    this.searchStore = useSearchStore();
    this.documentStore = useDocumentStore();
    this.vocabularyStore = useVocabularyStore();
    
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10分钟缓存
    this.suggestionCacheExpiry = 5 * 60 * 1000; // 5分钟建议缓存
    // 添加命名空间
    this.cacheNamespace = 'search_'; 
    
    this.cacheKeys = {
      SEARCH_RESULTS: `${this.cacheNamespace}results_`,
      SEARCH_SUGGESTIONS: `${this.cacheNamespace}suggestions_`,
      RECENT_SEARCHES: `${this.cacheNamespace}recent_searches`,
      POPULAR_SEARCHES: `${this.cacheNamespace}popular_searches`,
      SEARCH_HISTORY: `${this.cacheNamespace}history`
    };
    
    // 防抖搜索函数
    this.debouncedSearch = debounce(this._performSearch.bind(this), 300);
    this.debouncedGetSuggestions = debounce(this._getSuggestions.bind(this), 200);
  }

  /**
   * 全局搜索
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async globalSearch(keyword, options = {}) {
    try {
      const {
        type = 'all',
        page = 1,
        pageSize = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        filters = {},
        forceRefresh = false
      } = options;

      // 1. 参数验证
      this._validateSearchParams(keyword, options);

      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey(keyword, options);

      // 3. 检查缓存
      if (!forceRefresh) {
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 4. 保存搜索历史
      this._saveSearchHistory(keyword, type);

      // 5. 更新Store状态
      this.searchStore.setSearching(true);
      this.searchStore.setCurrentKeyword(keyword);
      this.searchStore.setCurrentType(type);

      // 6. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.globalSearch({
        query: keyword,
        type,
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      });

      // 7. 数据格式化
      const formattedResults = this._formatSearchResults(response.data, type);

      // 8. 更新Store
      this.searchStore.setSearchResults(formattedResults);
      this.searchStore.setSearching(false);

      // 9. 设置缓存
      this._setToCache(cacheKey, formattedResults);

      // 10. 更新搜索统计
      this._updateSearchStatistics(keyword);

      return formattedResults;
    } catch (error) {
      this.searchStore.setSearching(false);
      this._handleError(error, '搜索失败');
      // 返回空结果作为降级
      return this._getEmptySearchResults();
    }
  }

  /**
   * 文档搜索
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 文档搜索结果
   */
  async searchDocuments(keyword, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        filters = {},
        forceRefresh = false
      } = options;

      // 1. 参数验证
      this._validateSearchParams(keyword, options);

      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey(keyword, { ...options, type: 'documents' });

      // 3. 检查缓存
      if (!forceRefresh) {
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 4. 保存搜索历史
      this._saveSearchHistory(keyword, 'documents');

      // 5. 更新Store状态
      this.searchStore.setSearching(true);

      // 6. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.searchDocuments({
        query: keyword,
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      });

      // 7. 数据格式化
      const formattedResults = this._formatDocumentResults(response.data);

      // 8. 更新Store
      this.searchStore.setDocumentResults(formattedResults);
      this.searchStore.setSearching(false);

      // 9. 设置缓存
      this._setToCache(cacheKey, formattedResults);

      // 10. 更新搜索统计
      this._updateSearchStatistics(keyword);

      return formattedResults;
    } catch (error) {
      this.searchStore.setSearching(false);
      this._handleError(error, '文档搜索失败');
      return this._getEmptyDocumentResults();
    }
  }

  /**
   * 词汇搜索
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 词汇搜索结果
   */
  async searchVocabulary(keyword, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        filters = {},
        forceRefresh = false
      } = options;

      // 1. 参数验证
      this._validateSearchParams(keyword, options);

      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey(keyword, { ...options, type: 'vocabulary' });

      // 3. 检查缓存
      if (!forceRefresh) {
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 4. 保存搜索历史
      this._saveSearchHistory(keyword, 'vocabulary');

      // 5. 更新Store状态
      this.searchStore.setSearching(true);

      // 6. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.searchVocabulary({
        query: keyword,
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      });

      // 7. 数据格式化
      const formattedResults = this._formatVocabularyResults(response.data);

      // 8. 更新Store
      this.searchStore.setVocabularyResults(formattedResults);
      this.searchStore.setSearching(false);

      // 9. 设置缓存
      this._setToCache(cacheKey, formattedResults);

      // 10. 更新搜索统计
      this._updateSearchStatistics(keyword);

      return formattedResults;
    } catch (error) {
      this.searchStore.setSearching(false);
      this._handleError(error, '词汇搜索失败');
      return this._getEmptyVocabularyResults();
    }
  }

  /**
   * 高级搜索
   * @param {Object} filters - 搜索过滤器
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 高级搜索结果
   */
  async advancedSearch(filters, options = {}) {
    try {
      const {
        type = 'all',
        page = 1,
        pageSize = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        forceRefresh = false
      } = options;

      // 1. 参数验证
      this._validateAdvancedSearchParams(filters);

      // 2. 生成缓存键
      const cacheKey = this._generateAdvancedCacheKey(filters, options);

      // 3. 检查缓存
      if (!forceRefresh) {
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 4. 更新Store状态
      this.searchStore.setSearching(true);

      // 5. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.advancedSearch({
        filters,
        type,
        page,
        pageSize,
        sortBy,
        sortOrder
      });

      // 6. 数据格式化
      const formattedResults = this._formatSearchResults(response.data, type);

      // 7. 更新Store
      this.searchStore.setAdvancedResults(formattedResults);
      this.searchStore.setSearching(false);

      // 8. 设置缓存
      this._setToCache(cacheKey, formattedResults);

      return formattedResults;
    } catch (error) {
      this.searchStore.setSearching(false);
      this._handleError(error, '高级搜索失败');
      return this._getEmptySearchResults();
    }
  }

  /**
   * 获取搜索建议（防抖）
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 建议选项
   * @returns {Promise<Array>} 搜索建议列表
   */
  async getSearchSuggestions(keyword, options = {}) {
    try {
      const { type = 'all', limit = 10 } = options;

      if (!keyword || keyword.trim().length < 1) {
        return this._getDefaultSuggestions();
      }

      // 1. 生成缓存键
      const cacheKey = `${this.cacheKeys.SEARCH_SUGGESTIONS}${keyword}_${type}_${limit}`;

      // 2. 检查缓存
      const cached = this._getFromCache(cacheKey, this.suggestionCacheExpiry);
      if (cached) {
        return cached;
      }

      // 3. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.getSearchSuggestions({
        query: keyword,
        type,
        limit
      });

      // 4. 数据格式化
      const suggestions = this._formatSuggestions(response.data);

      // 5. 设置缓存
      this._setToCache(cacheKey, suggestions, this.suggestionCacheExpiry);

      return suggestions;
    } catch (error) {
      console.warn('获取搜索建议失败:', error);
      // 返回本地建议作为降级
      return this._getLocalSuggestions(keyword, options);
    }
  }

  /**
   * 获取最近搜索
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 最近搜索列表
   */
  async getRecentSearches(limit = 10) {
    try {
      // 1. 检查缓存
      const cacheKey = `${this.cacheKeys.RECENT_SEARCHES}_${limit}`;
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 2. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.getRecentSearches({ limit });

      // 3. 数据格式化
      const recentSearches = this._formatRecentSearches(response.data);

      // 4. 设置缓存
      this._setToCache(cacheKey, recentSearches);

      return recentSearches;
    } catch (error) {
      console.warn('获取最近搜索失败:', error);
      // 从本地存储获取作为降级
      return this._getLocalRecentSearches(limit);
    }
  }

  /**
   * 获取热门搜索
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 热门搜索列表
   */
  async getPopularSearches(options = {}) {
    try {
      const { limit = 10, timeRange = 'week' } = options;

      // 1. 检查缓存
      const cacheKey = `${this.cacheKeys.POPULAR_SEARCHES}_${limit}_${timeRange}`;
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 2. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.getPopularSearches({ limit, timeRange });

      // 3. 数据格式化
      const popularSearches = this._formatPopularSearches(response.data);

      // 4. 设置缓存
      this._setToCache(cacheKey, popularSearches);

      return popularSearches;
    } catch (error) {
      console.warn('获取热门搜索失败:', error);
      return [];
    }
  }

  /**
   * 获取搜索历史
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 搜索历史列表
   */
  async getSearchHistory(options = {}) {
    try {
      const { page = 1, pageSize = 20, sortBy = 'timestamp', sortOrder = 'desc' } = options;

      // 1. 检查缓存
      const cacheKey = `${this.cacheKeys.SEARCH_HISTORY}_${page}_${pageSize}`;
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 2. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.getSearchHistory({
        page,
        pageSize,
        sortBy,
        sortOrder
      });

      // 3. 数据格式化
      const history = this._formatSearchHistory(response.data);

      // 4. 设置缓存
      this._setToCache(cacheKey, history);

      return history;
    } catch (error) {
      console.warn('获取搜索历史失败:', error);
      return this._getLocalSearchHistory(options);
    }
  }

  /**
   * 清除搜索历史
   * @param {Object} options - 清除选项
   * @returns {Promise<boolean>} 是否清除成功
   */
  async clearSearchHistory(options = {}) {
    try {
      const { type = 'all', beforeDate = null } = options;

      // 1. API调用 - ✅ 使用正确的函数名和对象参数
      await api.clearSearchHistory({ type, beforeDate });

      // 2. 清除本地缓存
      this._clearSearchHistoryCache();

      // 3. 更新Store
      this.searchStore.clearSearchHistory();

      // 4. 显示成功通知
      showSuccess('搜索历史已清除');

      return true;
    } catch (error) {
      this._handleError(error, '清除搜索历史失败');
      throw error;
    }
  }

  /**
   * 保存搜索结果（收藏/保存）
   * @param {string} searchId - 搜索ID
   * @param {Object} data - 保存数据
   * @returns {Promise<Object>} 保存的搜索结果
   */
  async saveSearchResult(searchId, data = {}) {
    try {
      if (!searchId) {
        throw new Error('搜索ID不能为空');
      }

      // ✅ 使用正确的函数名和对象参数
      const response = await api.saveSearchResult({ searchId, data });
      const savedResult = this._formatSavedSearch(response.data);

      // 更新Store
      this.searchStore.addSavedSearch(savedResult);

      showSuccess('搜索结果已保存');
      return savedResult;
    } catch (error) {
      this._handleError(error, '保存搜索结果失败');
      throw error;
    }
  }

  /**
   * 获取保存的搜索
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 保存的搜索列表
   */
  async getSavedSearches(options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;

      // ✅ 使用正确的函数名和对象参数
      const response = await api.getSavedSearches({ page, pageSize });
      const savedSearches = this._formatSavedSearches(response.data);

      // 更新Store
      this.searchStore.setSavedSearches(savedSearches);

      return savedSearches;
    } catch (error) {
      this._handleError(error, '获取保存的搜索失败');
      return [];
    }
  }

  /**
   * 删除保存的搜索
   * @param {string} savedSearchId - 保存的搜索ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteSavedSearch(savedSearchId) {
    try {
      if (!savedSearchId) {
        throw new Error('保存的搜索ID不能为空');
      }

      // ✅ 使用正确的函数名和对象参数
      await api.deleteSavedSearch({ savedSearchId });

      // 更新Store
      this.searchStore.removeSavedSearch(savedSearchId);

      showSuccess('已删除保存的搜索');
      return true;
    } catch (error) {
      this._handleError(error, '删除保存的搜索失败');
      throw error;
    }
  }

  /**
   * 搜索联想（实时搜索建议）
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 联想选项
   * @returns {Promise<Array>} 联想结果
   */
  async searchAutocomplete(keyword, options = {}) {
    try {
      const { type = 'all', limit = 5 } = options;

      if (!keyword || keyword.trim().length < 2) {
        return [];
      }

      // ✅ 使用正确的函数名和对象参数
      const response = await api.searchAutocomplete({
        query: keyword,
        type,
        limit
      });
      
      return this._formatAutocompleteResults(response.data);
    } catch (error) {
      console.warn('搜索联想失败:', error);
      return [];
    }
  }

  /**
   * 语音搜索
   * @param {Blob} audioBlob - 音频数据
   * @param {Object} options - 语音搜索选项
   * @returns {Promise<Object>} 语音搜索结果
   */
  async voiceSearch(audioBlob, options = {}) {
    try {
      if (!audioBlob || !(audioBlob instanceof Blob)) {
        throw new Error('无效的音频数据');
      }

      const { language = 'zh-CN', maxResults = 1 } = options;

      // 1. 更新Store状态
      this.searchStore.setVoiceSearching(true);

      // 2. API调用 - ✅ 使用正确的函数名和对象参数
      const response = await api.voiceSearch({
        audioBlob,
        language,
        maxResults
      });

      // 3. 提取文本并搜索
      const text = response.data.text;
      if (text && text.trim()) {
        const searchResults = await this.globalSearch(text, options);
        
        // 4. 更新Store
        this.searchStore.setVoiceSearchResult({
          text,
          results: searchResults
        });
        
        return {
          text,
          results: searchResults
        };
      } else {
        throw new Error('未能识别语音内容');
      }
    } catch (error) {
      this._handleError(error, '语音搜索失败');
      throw error;
    } finally {
      this.searchStore.setVoiceSearching(false);
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 执行搜索（防抖内部方法）
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async _performSearch(keyword, options) {
    return this.globalSearch(keyword, options);
  }

  /**
   * 获取建议（防抖内部方法）
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 建议选项
   * @returns {Promise<Array>} 搜索建议
   */
  async _getSuggestions(keyword, options) {
    return this.getSearchSuggestions(keyword, options);
  }

  /**
   * 格式化搜索结果
   * @param {Object} apiData - API返回的数据
   * @param {string} type - 搜索类型
   * @returns {Object} 格式化后的搜索结果
   */
  _formatSearchResults(apiData, type) {
    const results = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: [],
      facets: apiData.facets || {},
      queryTime: Number(apiData.queryTime) || 0,
      type: type
    };

    if (Array.isArray(apiData.items)) {
      results.items = apiData.items.map(item => {
        switch (type) {
          case 'documents':
            return this._formatDocumentItem(item);
          case 'vocabulary':
            return this._formatVocabularyItem(item);
          case 'tags':
            return this._formatTagItem(item);
          case 'users':
            return this._formatUserItem(item);
          default:
            return this._formatGenericItem(item);
        }
      });
    }

    return results;
  }

  /**
   * 格式化文档搜索结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的文档结果
   */
  _formatDocumentResults(apiData) {
    const results = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: [],
      facets: apiData.facets || {},
      queryTime: Number(apiData.queryTime) || 0,
      type: 'documents'
    };

    if (Array.isArray(apiData.items)) {
      results.items = apiData.items.map(item => this._formatDocumentItem(item));
    }

    return results;
  }

  /**
   * 格式化词汇搜索结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的词汇结果
   */
  _formatVocabularyResults(apiData) {
    const results = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: [],
      facets: apiData.facets || {},
      queryTime: Number(apiData.queryTime) || 0,
      type: 'vocabulary'
    };

    if (Array.isArray(apiData.items)) {
      results.items = apiData.items.map(item => this._formatVocabularyItem(item));
    }

    return results;
  }

  /**
   * 格式化文档项
   * @param {Object} item - 文档数据
   * @returns {Object} 格式化后的文档项
   */
  _formatDocumentItem(item) {
    return {
      id: item.id || '',
      type: 'document',
      title: item.title || '未命名文档',
      content: item.content || '',
      excerpt: item.excerpt || '',
      author: item.author || '',
      tags: item.tags || [],
      language: item.language || 'en',
      wordCount: Number(item.wordCount) || 0,
      difficulty: item.difficulty || 'medium',
      relevance: Number(item.relevance) || 0,
      highlight: item.highlight || {},
      createdAt: item.createdAt ? formatDate(item.createdAt) : null,
      updatedAt: item.updatedAt ? formatDate(item.updatedAt) : null,
      thumbnail: item.thumbnail || null,
      url: item.url || `/documents/${item.id}`
    };
  }

  /**
   * 格式化词汇项
   * @param {Object} item - 词汇数据
   * @returns {Object} 格式化后的词汇项
   */
  _formatVocabularyItem(item) {
    return {
      id: item.id || '',
      type: 'vocabulary',
      word: item.word || '',
      phonetic: item.phonetic || '',
      definition: item.definition || '',
      translation: item.translation || '',
      examples: item.examples || [],
      tags: item.tags || [],
      difficulty: item.difficulty || 'medium',
      relevance: Number(item.relevance) || 0,
      highlight: item.highlight || {},
      createdAt: item.createdAt ? formatDate(item.createdAt) : null,
      updatedAt: item.updatedAt ? formatDate(item.updatedAt) : null,
      audioUrl: item.audioUrl || null,
      url: item.url || `/vocabulary/${item.id}`
    };
  }

  /**
   * 格式化标签项
   * @param {Object} item - 标签数据
   * @returns {Object} 格式化后的标签项
   */
  _formatTagItem(item) {
    return {
      id: item.id || '',
      type: 'tag',
      name: item.name || '',
      color: item.color || '#666666',
      description: item.description || '',
      documentCount: Number(item.documentCount) || 0,
      relevance: Number(item.relevance) || 0,
      url: item.url || `/tags/${item.id}`
    };
  }

  /**
   * 格式化用户项
   * @param {Object} item - 用户数据
   * @returns {Object} 格式化后的用户项
   */
  _formatUserItem(item) {
    return {
      id: item.id || '',
      type: 'user',
      username: item.username || '',
      displayName: item.displayName || '',
      avatar: item.avatar || null,
      bio: item.bio || '',
      relevance: Number(item.relevance) || 0,
      url: item.url || `/users/${item.id}`
    };
  }

  /**
   * 格式化通用项
   * @param {Object} item - 通用数据
   * @returns {Object} 格式化后的通用项
   */
  _formatGenericItem(item) {
    return {
      id: item.id || '',
      type: item.type || 'unknown',
      title: item.title || item.name || '',
      content: item.content || item.description || '',
      excerpt: item.excerpt || '',
      relevance: Number(item.relevance) || 0,
      highlight: item.highlight || {},
      url: item.url || '#'
    };
  }

  /**
   * 格式化搜索建议
   * @param {Array} apiData - API返回的建议数据
   * @returns {Array} 格式化后的建议列表
   */
  _formatSuggestions(apiData) {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.map(suggestion => ({
      id: suggestion.id || suggestion.keyword || '',
      keyword: suggestion.keyword || '',
      type: suggestion.type || 'all',
      count: Number(suggestion.count) || 0,
      relevance: Number(suggestion.relevance) || 0,
      icon: suggestion.icon || this._getSuggestionIcon(suggestion.type)
    }));
  }

  /**
   * 格式化最近搜索
   * @param {Array} apiData - API返回的数据
   * @returns {Array} 格式化后的最近搜索列表
   */
  _formatRecentSearches(apiData) {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.map(search => ({
      id: search.id || search.keyword || '',
      keyword: search.keyword || '',
      type: search.type || 'all',
      timestamp: search.timestamp ? formatDate(search.timestamp) : null,
      resultCount: Number(search.resultCount) || 0
    }));
  }

  /**
   * 格式化热门搜索
   * @param {Array} apiData - API返回的数据
   * @returns {Array} 格式化后的热门搜索列表
   */
  _formatPopularSearches(apiData) {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.map(search => ({
      id: search.id || search.keyword || '',
      keyword: search.keyword || '',
      type: search.type || 'all',
      searchCount: Number(search.searchCount) || 0,
      trend: search.trend || 'stable' // rising, falling, stable
    }));
  }

  /**
   * 格式化搜索历史
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的搜索历史
   */
  _formatSearchHistory(apiData) {
    const history = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: []
    };

    if (Array.isArray(apiData.items)) {
      history.items = apiData.items.map(item => ({
        id: item.id || '',
        keyword: item.keyword || '',
        type: item.type || 'all',
        timestamp: item.timestamp ? formatDate(item.timestamp) : null,
        resultCount: Number(item.resultCount) || 0,
        filters: item.filters || {},
        success: Boolean(item.success !== false)
      }));
    }

    return history;
  }

  /**
   * 格式化保存的搜索
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的保存搜索
   */
  _formatSavedSearch(apiData) {
    return {
      id: apiData.id || '',
      keyword: apiData.keyword || '',
      type: apiData.type || 'all',
      filters: apiData.filters || {},
      createdAt: apiData.createdAt ? formatDate(apiData.createdAt) : null,
      updatedAt: apiData.updatedAt ? formatDate(apiData.updatedAt) : null,
      note: apiData.note || '',
      tags: apiData.tags || []
    };
  }

  /**
   * 格式化保存的搜索列表
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的保存搜索列表
   */
  _formatSavedSearches(apiData) {
    const savedSearches = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: []
    };

    if (Array.isArray(apiData.items)) {
      savedSearches.items = apiData.items.map(item => this._formatSavedSearch(item));
    }

    return savedSearches;
  }

  /**
   * 格式化联想结果
   * @param {Array} apiData - API返回的数据
   * @returns {Array} 格式化后的联想结果
   */
  _formatAutocompleteResults(apiData) {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.map(result => ({
      id: result.id || '',
      text: result.text || '',
      type: result.type || 'suggestion',
      relevance: Number(result.relevance) || 0,
      prefix: result.prefix || '',
      suffix: result.suffix || ''
    }));
  }

  /**
   * 获取建议图标
   * @param {string} type - 建议类型
   * @returns {string} 图标名称
   */
  _getSuggestionIcon(type) {
    const iconMap = {
      document: 'document-text',
      vocabulary: 'book-open',
      tag: 'tag',
      user: 'user',
      all: 'search'
    };
    
    return iconMap[type] || 'search';
  }

  /**
   * 验证搜索参数
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   */
  _validateSearchParams(keyword, options) {
    if (!keyword || keyword.trim() === '') {
      throw new Error('搜索关键词不能为空');
    }

    if (keyword.length > 200) {
      throw new Error('搜索关键词不能超过200个字符');
    }

    const validTypes = ['all', 'documents', 'vocabulary', 'tags', 'users'];
    if (options.type && !validTypes.includes(options.type)) {
      throw new Error(`无效的搜索类型，必须是: ${validTypes.join(', ')}`);
    }

    if (options.page && (options.page < 1 || !Number.isInteger(options.page))) {
      throw new Error('页码必须是大于0的整数');
    }

    if (options.pageSize && (options.pageSize < 1 || options.pageSize > 100)) {
      throw new Error('每页数量必须在1-100之间');
    }

    const validSortOrders = ['asc', 'desc'];
    if (options.sortOrder && !validSortOrders.includes(options.sortOrder)) {
      throw new Error(`无效的排序顺序，必须是: ${validSortOrders.join(', ')}`);
    }
  }

  /**
   * 验证高级搜索参数
   * @param {Object} filters - 搜索过滤器
   */
  _validateAdvancedSearchParams(filters) {
    if (!filters || typeof filters !== 'object') {
      throw new Error('搜索过滤器不能为空');
    }

    // 验证日期格式
    if (filters.dateFrom && !this._isValidDate(filters.dateFrom)) {
      throw new Error('起始日期格式不正确');
    }

    if (filters.dateTo && !this._isValidDate(filters.dateTo)) {
      throw new Error('结束日期格式不正确');
    }

    // 验证数值范围
    if (filters.minWordCount && (filters.minWordCount < 0 || !Number.isInteger(filters.minWordCount))) {
      throw new Error('最小单词数必须是大于等于0的整数');
    }

    if (filters.maxWordCount && (filters.maxWordCount < 0 || !Number.isInteger(filters.maxWordCount))) {
      throw new Error('最大单词数必须是大于等于0的整数');
    }

    if (filters.minWordCount && filters.maxWordCount && filters.minWordCount > filters.maxWordCount) {
      throw new Error('最小单词数不能大于最大单词数');
    }
  }

  /**
   * 检查是否为有效日期
   * @param {string} dateString - 日期字符串
   * @returns {boolean} 是否为有效日期
   */
  _isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * 生成缓存键
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {string} 缓存键
   */
  _generateCacheKey(keyword, options) {
    const { type, page, pageSize, sortBy, sortOrder } = options;
    return `${this.cacheKeys.SEARCH_RESULTS}${keyword}_${type}_${page}_${pageSize}_${sortBy}_${sortOrder}`;
  }

  /**
   * 生成高级搜索缓存键
   * @param {Object} filters - 搜索过滤器
   * @param {Object} options - 搜索选项
   * @returns {string} 缓存键
   */
  _generateAdvancedCacheKey(filters, options) {
    const filterStr = JSON.stringify(filters);
    const { type, page, pageSize } = options;
    return `${this.cacheKeys.SEARCH_RESULTS}advanced_${type}_${page}_${pageSize}_${filterStr}`;
  }

  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @param {number} expiry - 过期时间（毫秒）
   * @returns {any|null} 缓存的数据或null
   */
  _getFromCache(key, expiry = null) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const now = Date.now();
    const cacheExpiry = expiry || this.cacheExpiry;
    
    if (now - timestamp > cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   * @param {number} expiry - 过期时间（毫秒）
   */
  _setToCache(key, data, expiry = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.cacheExpiry
    });
  }

  /**
   * 保存搜索历史
   * @param {string} keyword - 搜索关键词
   * @param {string} type - 搜索类型
   */
  _saveSearchHistory(keyword, type) {
    try {
      // 保存到Store
      this.searchStore.addSearchHistory({
        keyword,
        type,
        timestamp: new Date().toISOString()
      });

      // 保存到本地存储（降级方案）
      this._saveToLocalStorage(keyword, type);
    } catch (error) {
      console.warn('保存搜索历史失败:', error);
    }
  }

  /**
   * 保存到本地存储
   * @param {string} keyword - 搜索关键词
   * @param {string} type - 搜索类型
   */
  _saveToLocalStorage(keyword, type) {
    try {
      const historyKey = `${this.cacheNamespace}history_local`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // 移除重复项
      const newHistory = history.filter(
        item => !(item.keyword === keyword && item.type === type)
      );
      
      // 添加新记录
      newHistory.unshift({
        keyword,
        type,
        timestamp: new Date().toISOString()
      });
      
      // 限制数量
      if (newHistory.length > 50) {
        newHistory.length = 50;
      }
      
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
    } catch (error) {
      console.warn('保存到本地存储失败:', error);
    }
  }

  /**
   * 更新搜索统计
   * @param {string} keyword - 搜索关键词
   */
  _updateSearchStatistics(keyword) {
    try {
      // 这里可以调用API更新搜索统计
      // 或者更新本地统计
      const statsKey = `${this.cacheNamespace}stats`;
      const stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
      
      if (!stats[keyword]) {
        stats[keyword] = 0;
      }
      
      stats[keyword]++;
      localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (error) {
      console.warn('更新搜索统计失败:', error);
    }
  }

  /**
   * 清除搜索历史缓存
   */
  _clearSearchHistoryCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.cacheNamespace)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取默认建议
   * @returns {Array} 默认建议列表
   */
  _getDefaultSuggestions() {
    return [
      { id: '1', keyword: '英语学习', type: 'all', count: 100, icon: 'book-open' },
      { id: '2', keyword: '技术文档', type: 'documents', count: 50, icon: 'document-text' },
      { id: '3', keyword: '商务英语', type: 'vocabulary', count: 30, icon: 'briefcase' },
      { id: '4', keyword: '阅读技巧', type: 'all', count: 25, icon: 'academic-cap' }
    ];
  }

  /**
   * 获取本地建议（降级方案）
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 建议选项
   * @returns {Array} 本地建议
   */
  _getLocalSuggestions(keyword, options) {
    const { limit = 10 } = options;
    const searchTerm = keyword.toLowerCase().trim();
    
    // 从本地存储获取历史记录
    const historyKey = `${this.cacheNamespace}history_local`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // 过滤匹配的历史记录
    const matchedHistory = history
      .filter(item => item.keyword.toLowerCase().includes(searchTerm))
      .slice(0, limit)
      .map(item => ({
        id: `local_${item.timestamp}`,
        keyword: item.keyword,
        type: item.type,
        count: 1,
        relevance: 0.5,
        icon: this._getSuggestionIcon(item.type)
      }));
    
    return matchedHistory;
  }

  /**
   * 获取本地最近搜索（降级方案）
   * @param {number} limit - 返回数量
   * @returns {Array} 最近搜索列表
   */
  _getLocalRecentSearches(limit = 10) {
    try {
      const historyKey = `${this.cacheNamespace}history_local`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      return history
        .slice(0, limit)
        .map(item => ({
          id: `local_${item.timestamp}`,
          keyword: item.keyword,
          type: item.type,
          timestamp: formatDate(item.timestamp),
          resultCount: 0
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取本地搜索历史（降级方案）
   * @param {Object} options - 查询选项
   * @returns {Object} 搜索历史
   */
  _getLocalSearchHistory(options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;
      const historyKey = `${this.cacheNamespace}history_local`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedHistory = history.slice(startIndex, endIndex);
      
      return {
        total: history.length,
        page,
        pageSize,
        totalPages: Math.ceil(history.length / pageSize),
        items: paginatedHistory.map(item => ({
          id: `local_${item.timestamp}`,
          keyword: item.keyword,
          type: item.type,
          timestamp: formatDate(item.timestamp),
          resultCount: 0,
          filters: {},
          success: true
        }))
      };
    } catch (error) {
      return {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        items: []
      };
    }
  }

  /**
   * 获取空搜索结果
   * @returns {Object} 空搜索结果
   */
  _getEmptySearchResults() {
    return {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      items: [],
      facets: {},
      queryTime: 0,
      type: 'all'
    };
  }

  /**
   * 获取空文档结果
   * @returns {Object} 空文档结果
   */
  _getEmptyDocumentResults() {
    return {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      items: [],
      facets: {},
      queryTime: 0,
      type: 'documents'
    };
  }

  /**
   * 获取空词汇结果
   * @returns {Object} 空词汇结果
   */
  _getEmptyVocabularyResults() {
    return {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      items: [],
      facets: {},
      queryTime: 0,
      type: 'vocabulary'
    };
  }

  /**
   * 错误处理
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  _handleError(error, context) {
    console.error(`${context}:`, error);
    
    if (error.response) {
      const status = error.response.status;
      let message = context;
      
      switch (status) {
        case 400:
          message = error.response.data?.message || '搜索参数错误';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有搜索权限';
          break;
        case 429:
          message = '搜索频率过高，请稍后再试';
          break;
        case 500:
          message = '搜索服务暂时不可用';
          break;
        case 503:
          message = '搜索服务维护中';
          break;
      }
      
      showError(message);
    } else if (error.request) {
      showError('网络连接失败，请检查网络设置');
    } else {
      showError(error.message || context);
    }
  }
}

// 创建单例实例
const searchService = new SearchService();

export default searchService;