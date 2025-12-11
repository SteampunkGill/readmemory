// src/stores/document.store.js
import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import documentService from '@/services/document.service';

/**
 * 文档状态管理
 * 管理文档列表、当前文档、搜索状态、上传状态等
 */
export const useDocumentStore = defineStore('document', () => {
  // ==================== 状态定义 ====================
  
  // 文档列表
  const documents = ref([]);
  
  // 当前选中的文档
  const currentDocument = ref(null);
  
  // 搜索结果的文档列表
  const searchResults = ref([]);
  
  // 分页信息
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  
  // 搜索分页信息
  const searchPagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  
  // 加载状态
  const loading = ref(false);
  
  // 上传状态
  const uploading = ref(false);
  
  // 错误信息
  const error = ref(null);
  
  // 筛选条件
  const filters = reactive({
    search: '',
    tags: [],
    language: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  // 文档统计信息
  const stats = ref(null);
  
  // 上传队列
  const uploadQueue = ref([]);

  // ==================== 计算属性 ====================
  
  /**
   * 当前页的文档
   */
  const currentPageDocuments = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return documents.value.slice(start, end);
  });
  
  /**
   * 当前页的搜索结果
   */
  const currentPageSearchResults = computed(() => {
    const start = (searchPagination.page - 1) * searchPagination.pageSize;
    const end = start + searchPagination.pageSize;
    return searchResults.value.slice(start, end);
  });
  
  /**
   * 是否有更多文档
   */
  const hasMoreDocuments = computed(() => {
    return pagination.page < pagination.totalPages;
  });
  
  /**
   * 是否有更多搜索结果
   */
  const hasMoreSearchResults = computed(() => {
    return searchPagination.page < searchPagination.totalPages;
  });
  
  /**
   * 文档总数
   */
  const totalDocuments = computed(() => pagination.total);
  
  /**
   * 搜索结果总数
   */
  const totalSearchResults = computed(() => searchPagination.total);
  
  /**
   * 所有标签（去重）
   */
  const allTags = computed(() => {
    const tagSet = new Set();
    documents.value.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  });
  
  /**
   * 所有语言（去重）
   */
  const allLanguages = computed(() => {
    const langSet = new Set();
    documents.value.forEach(doc => {
      if (doc.language) {
        langSet.add(doc.language);
      }
    });
    return Array.from(langSet);
  });
  
  /**
   * 按标签分组的文档
   */
  const documentsByTag = computed(() => {
    const grouped = {};
    documents.value.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => {
          if (!grouped[tag]) {
            grouped[tag] = [];
          }
          grouped[tag].push(doc);
        });
      }
    });
    return grouped;
  });
  
  /**
   * 按语言分组的文档
   */
  const documentsByLanguage = computed(() => {
    const grouped = {};
    documents.value.forEach(doc => {
      const lang = doc.language || 'unknown';
      if (!grouped[lang]) {
        grouped[lang] = [];
      }
      grouped[lang].push(doc);
    });
    return grouped;
  });
  
  /**
   * 最近上传的文档
   */
  const recentDocuments = computed(() => {
    return [...documents.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  });
  
  /**
   * 收藏的文档
   */
  const favoriteDocuments = computed(() => {
    return documents.value.filter(doc => doc.isFavorite);
  });
  
  /**
   * 公开的文档
   */
  const publicDocuments = computed(() => {
    return documents.value.filter(doc => doc.isPublic);
  });

  // ==================== Actions ====================
  
  /**
   * 设置文档列表
   * @param {Array} docs - 文档数组
   */
  const setDocuments = (docs) => {
    documents.value = Array.isArray(docs) ? docs : [];
  };
  
  /**
   * 添加文档
   * @param {Object} doc - 文档对象
   */
  const addDocument = (doc) => {
    if (doc && doc.id) {
      // 检查是否已存在
      const existingIndex = documents.value.findIndex(d => d.id === doc.id);
      if (existingIndex >= 0) {
        documents.value[existingIndex] = doc;
      } else {
        documents.value.unshift(doc);
      }
    }
  };
  
  /**
   * 更新文档
   * @param {Object} doc - 更新后的文档对象
   */
  const updateDocument = (doc) => {
    if (doc && doc.id) {
      const index = documents.value.findIndex(d => d.id === doc.id);
      if (index >= 0) {
        documents.value[index] = doc;
      }
      
      // 如果当前文档是更新的文档，也更新它
      if (currentDocument.value && currentDocument.value.id === doc.id) {
        currentDocument.value = doc;
      }
    }
  };
  
  /**
   * 删除文档
   * @param {string|number} id - 文档ID
   */
  const removeDocument = (id) => {
    const index = documents.value.findIndex(doc => doc.id === id);
    if (index >= 0) {
      documents.value.splice(index, 1);
    }
    
    // 如果当前文档是被删除的文档，清空它
    if (currentDocument.value && currentDocument.value.id === id) {
      currentDocument.value = null;
    }
  };
  
  /**
   * 设置当前文档
   * @param {Object} doc - 文档对象
   */
  const setCurrentDocument = (doc) => {
    currentDocument.value = doc;
  };
  
  /**
   * 清除当前文档
   */
  const clearCurrentDocument = () => {
    currentDocument.value = null;
  };
  
  /**
   * 设置搜索结果
   * @param {Array} results - 搜索结果数组
   */
  const setSearchResults = (results) => {
    searchResults.value = Array.isArray(results) ? results : [];
  };
  
  /**
   * 清除搜索结果
   */
  const clearSearchResults = () => {
    searchResults.value = [];
    searchPagination.page = 1;
    searchPagination.total = 0;
    searchPagination.totalPages = 0;
  };
  
  /**
   * 设置分页信息
   * @param {Object} paginationData - 分页数据
   */
  const setPagination = (paginationData) => {
    if (paginationData) {
      pagination.page = paginationData.page || 1;
      pagination.pageSize = paginationData.pageSize || 20;
      pagination.total = paginationData.total || 0;
      pagination.totalPages = paginationData.totalPages || 0;
    }
  };
  
  /**
   * 设置搜索分页信息
   * @param {Object} paginationData - 分页数据
   */
  const setSearchPagination = (paginationData) => {
    if (paginationData) {
      searchPagination.page = paginationData.page || 1;
      searchPagination.pageSize = paginationData.pageSize || 20;
      searchPagination.total = paginationData.total || 0;
      searchPagination.totalPages = paginationData.totalPages || 0;
    }
  };
  
  /**
   * 设置加载状态
   * @param {boolean} status - 加载状态
   */
  const setLoading = (status) => {
    loading.value = status;
  };
  
  /**
   * 设置上传状态
   * @param {boolean} status - 上传状态
   */
  const setUploading = (status) => {
    uploading.value = status;
  };
  
  /**
   * 设置错误信息
   * @param {string|null} errorMessage - 错误信息
   */
  const setError = (errorMessage) => {
    error.value = errorMessage;
  };
  
  /**
   * 设置筛选条件
   * @param {Object} newFilters - 新的筛选条件
   */
  const setFilters = (newFilters) => {
    if (newFilters) {
      Object.assign(filters, newFilters);
    }
  };
  
  /**
   * 重置筛选条件
   */
  const resetFilters = () => {
    filters.search = '';
    filters.tags = [];
    filters.language = '';
    filters.status = '';
    filters.sortBy = 'created_at';
    filters.sortOrder = 'desc';
  };
  
  /**
   * 设置统计信息
   * @param {Object} statsData - 统计信息
   */
  const setStats = (statsData) => {
    stats.value = statsData;
  };
  
  /**
   * 设置上传队列
   * @param {Array} queue - 上传队列
   */
  const setUploadQueue = (queue) => {
    uploadQueue.value = Array.isArray(queue) ? queue : [];
  };
  
  /**
   * 更新文档阅读进度
   * @param {string|number} id - 文档ID
   * @param {number} progress - 阅读进度 (0-100)
   * @param {number} [currentPage] - 当前页码
   */
  const updateDocumentProgress = (id, progress, currentPage = null) => {
    const index = documents.value.findIndex(doc => doc.id === id);
    if (index >= 0) {
      documents.value[index].readProgress = progress;
      if (currentPage !== null) {
        documents.value[index].currentPage = currentPage;
      }
    }
    
    // 如果当前文档是更新的文档，也更新它
    if (currentDocument.value && currentDocument.value.id === id) {
      currentDocument.value.readProgress = progress;
      if (currentPage !== null) {
        currentDocument.value.currentPage = currentPage;
      }
    }
  };
  
  /**
   * 切换文档收藏状态
   * @param {string|number} id - 文档ID
   */
  const toggleDocumentFavorite = (id) => {
    const index = documents.value.findIndex(doc => doc.id === id);
    if (index >= 0) {
      documents.value[index].isFavorite = !documents.value[index].isFavorite;
    }
    
    // 如果当前文档是更新的文档，也更新它
    if (currentDocument.value && currentDocument.value.id === id) {
      currentDocument.value.isFavorite = !currentDocument.value.isFavorite;
    }
  };
  
  /**
   * 切换文档公开状态
   * @param {string|number} id - 文档ID
   */
  const toggleDocumentPublic = (id) => {
    const index = documents.value.findIndex(doc => doc.id === id);
    if (index >= 0) {
      documents.value[index].isPublic = !documents.value[index].isPublic;
    }
    
    // 如果当前文档是更新的文档，也更新它
    if (currentDocument.value && currentDocument.value.id === id) {
      currentDocument.value.isPublic = !currentDocument.value.isPublic;
    }
  };
  
  /**
   * 为文档添加标签
   * @param {string|number} id - 文档ID
   * @param {string|Array} tags - 标签或标签数组
   */
  const addDocumentTags = (id, tags) => {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const index = documents.value.findIndex(doc => doc.id === id);
    
    if (index >= 0) {
      if (!documents.value[index].tags) {
        documents.value[index].tags = [];
      }
      
      tagArray.forEach(tag => {
        if (!documents.value[index].tags.includes(tag)) {
          documents.value[index].tags.push(tag);
        }
      });
    }
    
    // 如果当前文档是更新的文档，也更新它
    if (currentDocument.value && currentDocument.value.id === id) {
      if (!currentDocument.value.tags) {
        currentDocument.value.tags = [];
      }
      
      tagArray.forEach(tag => {
        if (!currentDocument.value.tags.includes(tag)) {
          currentDocument.value.tags.push(tag);
        }
      });
    }
  };
  
  /**
   * 从文档移除标签
   * @param {string|number} id - 文档ID
   * @param {string|Array} tags - 标签或标签数组
   */
  const removeDocumentTags = (id, tags) => {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const index = documents.value.findIndex(doc => doc.id === id);
    
    if (index >= 0 && documents.value[index].tags) {
      documents.value[index].tags = documents.value[index].tags.filter(
        tag => !tagArray.includes(tag)
      );
    }
    
    // 如果当前文档是更新的文档，也更新它
    if (currentDocument.value && currentDocument.value.id === id && currentDocument.value.tags) {
      currentDocument.value.tags = currentDocument.value.tags.filter(
        tag => !tagArray.includes(tag)
      );
    }
  };
  
  /**
   * 获取文档详情
   * @param {string|number} id - 文档ID
   * @returns {Object|null} 文档对象
   */
  const getDocumentById = (id) => {
    return documents.value.find(doc => doc.id === id) || null;
  };
  
  /**
   * 根据标题搜索文档
   * @param {string} title - 文档标题
   * @returns {Array} 匹配的文档
   */
  const searchDocumentsByTitle = (title) => {
    if (!title) return [];
    
    const searchTerm = title.toLowerCase();
    return documents.value.filter(doc => 
      doc.title && doc.title.toLowerCase().includes(searchTerm)
    );
  };
  
  /**
   * 根据标签搜索文档
   * @param {string|Array} tags - 标签或标签数组
   * @returns {Array} 匹配的文档
   */
  const searchDocumentsByTags = (tags) => {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    if (tagArray.length === 0) return [];
    
    return documents.value.filter(doc => 
      doc.tags && tagArray.some(tag => doc.tags.includes(tag))
    );
  };
  
  /**
   * 清空所有文档状态
   */
  const clearAll = () => {
    documents.value = [];
    currentDocument.value = null;
    searchResults.value = [];
    pagination.page = 1;
    pagination.total = 0;
    pagination.totalPages = 0;
    searchPagination.page = 1;
    searchPagination.total = 0;
    searchPagination.totalPages = 0;
    loading.value = false;
    uploading.value = false;
    error.value = null;
    stats.value = null;
    uploadQueue.value = [];
    resetFilters();
  };
  
  /**
   * 刷新文档列表
   * @returns {Promise<Object>} 文档列表数据
   */
  const refreshDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search,
        tags: filters.tags,
        language: filters.language,
        status: filters.status
      };
      
      const result = await documentService.getDocuments(params);
      return result;
    } catch (err) {
      setError(err.message || '刷新文档列表失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载更多文档
   * @returns {Promise<Object>} 更多文档数据
   */
  const loadMoreDocuments = async () => {
    if (!hasMoreDocuments.value) {
      return { documents: [], pagination };
    }
    
    try {
      setLoading(true);
      
      const nextPage = pagination.page + 1;
      const params = {
        page: nextPage,
        pageSize: pagination.pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search,
        tags: filters.tags,
        language: filters.language,
        status: filters.status
      };
      
      const result = await documentService.getDocuments(params);
      
      // 合并文档列表
      documents.value = [...documents.value, ...result.documents];
      
      // 更新分页信息
      setPagination(result.pagination);
      
      return result;
    } catch (err) {
      setError(err.message || '加载更多文档失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载更多搜索结果
   * @returns {Promise<Object>} 更多搜索结果
   */
  const loadMoreSearchResults = async (query) => {
    if (!hasMoreSearchResults.value) {
      return { documents: [], pagination: searchPagination };
    }
    
    try {
      setLoading(true);
      
      const nextPage = searchPagination.page + 1;
      const params = {
        page: nextPage,
        pageSize: searchPagination.pageSize
      };
      
      const result = await documentService.searchDocuments(query, params);
      
      // 合并搜索结果
      searchResults.value = [...searchResults.value, ...result.documents];
      
      // 更新分页信息
      setSearchPagination(result.pagination);
      
      return result;
    } catch (err) {
      setError(err.message || '加载更多搜索结果失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==================== 返回 ====================
  
  return {
    // 状态
    documents,
    currentDocument,
    searchResults,
    pagination,
    searchPagination,
    loading,
    uploading,
    error,
    filters,
    stats,
    uploadQueue,
    
    // 计算属性
    currentPageDocuments,
    currentPageSearchResults,
    hasMoreDocuments,
    hasMoreSearchResults,
    totalDocuments,
    totalSearchResults,
    allTags,
    allLanguages,
    documentsByTag,
    documentsByLanguage,
    recentDocuments,
    favoriteDocuments,
    publicDocuments,
    
    // Actions
    setDocuments,
    addDocument,
    updateDocument,
    removeDocument,
    setCurrentDocument,
    clearCurrentDocument,
    setSearchResults,
    clearSearchResults,
    setPagination,
    setSearchPagination,
    setLoading,
    setUploading,
    setError,
    setFilters,
    resetFilters,
    setStats,
    setUploadQueue,
    updateDocumentProgress,
    toggleDocumentFavorite,
    toggleDocumentPublic,
    addDocumentTags,
    removeDocumentTags,
    getDocumentById,
    searchDocumentsByTitle,
    searchDocumentsByTags,
    clearAll,
    refreshDocuments,
    loadMoreDocuments,
    loadMoreSearchResults,
  };
});

// 导出默认实例
export default useDocumentStore;