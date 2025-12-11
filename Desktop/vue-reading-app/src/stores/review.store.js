// src/stores/review.store.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useReviewStore = defineStore('review', () => {
  // 状态
  const dueWords = ref([]); // 待复习单词列表
  const currentSession = ref(null); // 当前复习会话
  const stats = ref(null); // 复习统计
  const history = ref([]); // 复习历史
  const historyPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const dueWordsCount = computed(() => dueWords.value.length);
  const todayStats = computed(() => {
    if (!stats.value) return null;
    return {
      reviews: stats.value.todayReviews,
      accuracy: stats.value.todayAccuracy
    };
  });
  const weeklyStats = computed(() => {
    if (!stats.value) return null;
    return {
      reviews: stats.value.weeklyReviews,
      accuracy: stats.value.weeklyAccuracy
    };
  });

  // 动作
  const setDueWords = (words) => {
    dueWords.value = words;
  };

  const setCurrentSession = (session) => {
    currentSession.value = session;
  };

  const updateCurrentSession = (updates) => {
    if (currentSession.value) {
      currentSession.value = { ...currentSession.value, ...updates };
    }
  };

  const clearCurrentSession = () => {
    currentSession.value = null;
  };

  const setStats = (newStats) => {
    stats.value = newStats;
  };

  const setHistory = (sessions) => {
    history.value = sessions;
  };

  const setHistoryPagination = (pagination) => {
    historyPagination.value = { ...historyPagination.value, ...pagination };
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

  const reset = () => {
    dueWords.value = [];
    currentSession.value = null;
    stats.value = null;
    history.value = [];
    historyPagination.value = {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    };
    loading.value = false;
    error.value = null;
  };

  return {
    // 状态
    dueWords,
    currentSession,
    stats,
    history,
    historyPagination,
    loading,
    error,

    // 计算属性
    dueWordsCount,
    todayStats,
    weeklyStats,

    // 动作
    setDueWords,
    setCurrentSession,
    updateCurrentSession,
    clearCurrentSession,
    setStats,
    setHistory,
    setHistoryPagination,
    setLoading,
    setError,
    clearError,
    reset
  };
});

export default useReviewStore;