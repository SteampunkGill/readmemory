// src/stores/vocabulary.store.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useVocabularyStore = defineStore('vocabulary', () => {
  // 状态
  const currentWord = ref(null); // 当前查询的单词详情
  const items = ref([]); // 生词本列表
  const currentItem = ref(null); // 当前选中的生词
  const pagination = ref({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  });
  const loading = ref(false);
  const error = ref(null);
  const searchHistory = ref([]); // 搜索历史

  // 计算属性
  const masteredWords = computed(() => 
    items.value.filter(item => item.status === 'mastered').length
  );
  
  const learningWords = computed(() => 
    items.value.filter(item => item.status === 'learning').length
  );
  
  const newWords = computed(() => 
    items.value.filter(item => item.status === 'new').length
  );
  
  const totalWords = computed(() => items.value.length);
  
  const dueForReview = computed(() => 
    items.value.filter(item => {
      if (!item.nextReviewAt) return false;
      const nextReview = new Date(item.nextReviewAt);
      const today = new Date();
      return nextReview <= today;
    }).length
  );

  // 动作
  const setCurrentWord = (word) => {
    currentWord.value = word;
  };

  const setItems = (newItems) => {
    items.value = newItems;
  };

  const setCurrentItem = (item) => {
    currentItem.value = item;
  };

  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination };
  };

  const addItem = (item) => {
    // 检查是否已存在
    const existingIndex = items.value.findIndex(i => i.id === item.id);
    if (existingIndex !== -1) {
      items.value[existingIndex] = item;
    } else {
      items.value.unshift(item);
    }
  };

  const updateItem = (id, updates) => {
    const index = items.value.findIndex(item => item.id === id);
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates };
    }
  };

  const removeItem = (id) => {
    const index = items.value.findIndex(item => item.id === id);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  };

  const setLoading = (isLoading) => {
    loading.value = isLoading;
  };

  const setError = (err) => {
    error.value = err;
  };

  const clearError = () => {
    error.value = null;
  };

  const addToSearchHistory = (word, language = 'en') => {
    // 移除重复项
    searchHistory.value = searchHistory.value.filter(
      item => !(item.word === word && item.language === language)
    );
    
    // 添加到开头
    searchHistory.value.unshift({
      word,
      language,
      timestamp: Date.now(),
      date: new Date().toISOString()
    });
    
    // 限制历史记录数量
    if (searchHistory.value.length > 100) {
      searchHistory.value = searchHistory.value.slice(0, 100);
    }
    
    // 保存到本地存储
    localStorage.setItem('vocabulary_search_history', JSON.stringify(searchHistory.value));
  };

  const clearSearchHistory = () => {
    searchHistory.value = [];
    localStorage.removeItem('vocabulary_search_history');
  };

  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem('vocabulary_search_history');
      if (saved) {
        searchHistory.value = JSON.parse(saved);
      }
    } catch (err) {
      console.error('加载搜索历史失败:', err);
      searchHistory.value = [];
    }
  };

  const getWordById = (id) => {
    return items.value.find(item => item.id === id);
  };

  const getWordsByStatus = (status) => {
    return items.value.filter(item => item.status === status);
  };

  const getWordsByTag = (tag) => {
    return items.value.filter(item => item.tags.includes(tag));
  };

  const getWordsByLanguage = (language) => {
    return items.value.filter(item => item.language === language);
  };

  const searchWords = (query) => {
    if (!query) return items.value;
    
    const lowerQuery = query.toLowerCase();
    return items.value.filter(item => 
      item.word.toLowerCase().includes(lowerQuery) ||
      item.definition?.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  const reset = () => {
    currentWord.value = null;
    items.value = [];
    currentItem.value = null;
    pagination.value = {
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0
    };
    loading.value = false;
    error.value = null;
  };

  // 初始化时加载搜索历史
  loadSearchHistory();

  return {
    // 状态
    currentWord,
    items,
    currentItem,
    pagination,
    loading,
    error,
    searchHistory,
    
    // 计算属性
    masteredWords,
    learningWords,
    newWords,
    totalWords,
    dueForReview,
    
    // 动作
    setCurrentWord,
    setItems,
    setCurrentItem,
    setPagination,
    addItem,
    updateItem,
    removeItem,
    setLoading,
    setError,
    clearError,
    addToSearchHistory,
    clearSearchHistory,
    loadSearchHistory,
    getWordById,
    getWordsByStatus,
    getWordsByTag,
    getWordsByLanguage,
    searchWords,
    reset
  };
});

export default useVocabularyStore;