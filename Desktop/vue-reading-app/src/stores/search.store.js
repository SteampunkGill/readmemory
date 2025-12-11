import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSearchStore = defineStore('search', () => {
  // 状态定义
  const searchResults = ref({});
  const documentResults = ref({});
  const vocabularyResults = ref({});
  const advancedResults = ref({});
  const searchHistory = ref([]);
  const savedSearches = ref([]);
  const searching = ref(false);
  const voiceSearching = ref(false);
  const voiceSearchResult = ref(null);
  const currentKeyword = ref('');
  const currentType = ref('all');

  // 计算属性
  const hasSearchResults = computed(() => {
    return searchResults.value.items && searchResults.value.items.length > 0;
  });

  const hasDocumentResults = computed(() => {
    return documentResults.value.items && documentResults.value.items.length > 0;
  });

  const hasVocabularyResults = computed(() => {
    return vocabularyResults.value.items && vocabularyResults.value.items.length > 0;
  });

  const hasAdvancedResults = computed(() => {
    return advancedResults.value.items && advancedResults.value.items.length > 0;
  });

  // 动作
  const setSearchResults = (results) => {
    searchResults.value = results;
  };

  const setDocumentResults = (results) => {
    documentResults.value = results;
  };

  const setVocabularyResults = (results) => {
    vocabularyResults.value = results;
  };

  const setAdvancedResults = (results) => {
    advancedResults.value = results;
  };

  const setSearchHistory = (history) => {
    searchHistory.value = history;
  };

  const addSearchHistory = (record) => {
    // 避免重复
    const index = searchHistory.value.findIndex(
      item => item.keyword === record.keyword && item.type === record.type
    );
    if (index !== -1) {
      searchHistory.value.splice(index, 1);
    }
    searchHistory.value.unshift(record);
    // 限制数量
    if (searchHistory.value.length > 50) {
      searchHistory.value = searchHistory.value.slice(0, 50);
    }
  };

  const clearSearchHistory = () => {
    searchHistory.value = [];
  };

  const setSavedSearches = (saved) => {
    savedSearches.value = saved;
  };

  const addSavedSearch = (saved) => {
    savedSearches.value.push(saved);
  };

  const removeSavedSearch = (savedSearchId) => {
    const index = savedSearches.value.findIndex(item => item.id === savedSearchId);
    if (index !== -1) {
      savedSearches.value.splice(index, 1);
    }
  };

  const setSearching = (isSearching) => {
    searching.value = isSearching;
  };

  const setVoiceSearching = (isVoiceSearching) => {
    voiceSearching.value = isVoiceSearching;
  };

  const setVoiceSearchResult = (result) => {
    voiceSearchResult.value = result;
  };

  const setCurrentKeyword = (keyword) => {
    currentKeyword.value = keyword;
  };

  const setCurrentType = (type) => {
    currentType.value = type;
  };

  return {
    // 状态
    searchResults,
    documentResults,
    vocabularyResults,
    advancedResults,
    searchHistory,
    savedSearches,
    searching,
    voiceSearching,
    voiceSearchResult,
    currentKeyword,
    currentType,

    // 计算属性
    hasSearchResults,
    hasDocumentResults,
    hasVocabularyResults,
    hasAdvancedResults,

    // 动作
    setSearchResults,
    setDocumentResults,
    setVocabularyResults,
    setAdvancedResults,
    setSearchHistory,
    addSearchHistory,
    clearSearchHistory,
    setSavedSearches,
    addSavedSearch,
    removeSavedSearch,
    setSearching,
    setVoiceSearching,
    setVoiceSearchResult,
    setCurrentKeyword,
    setCurrentType,
  };
});