import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  // 状态定义
  const settings = ref({});
  const readingSettings = ref({});
  const reviewSettings = ref({});
  const notificationSettings = ref({});
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const hasSettings = computed(() => Object.keys(settings.value).length > 0);
  const hasReadingSettings = computed(() => Object.keys(readingSettings.value).length > 0);
  const hasReviewSettings = computed(() => Object.keys(reviewSettings.value).length > 0);
  const hasNotificationSettings = computed(() => Object.keys(notificationSettings.value).length > 0);

  // 动作
  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  const updateReadingSettings = (newReadingSettings) => {
    readingSettings.value = { ...readingSettings.value, ...newReadingSettings };
  };

  const updateReviewSettings = (newReviewSettings) => {
    reviewSettings.value = { ...reviewSettings.value, ...newReviewSettings };
  };

  const updateNotificationSettings = (newNotificationSettings) => {
    notificationSettings.value = { ...notificationSettings.value, ...newNotificationSettings };
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

  // 重置所有设置
  const resetAllSettings = () => {
    settings.value = {};
    readingSettings.value = {};
    reviewSettings.value = {};
    notificationSettings.value = {};
  };

  return {
    // 状态
    settings,
    readingSettings,
    reviewSettings,
    notificationSettings,
    loading,
    error,

    // 计算属性
    hasSettings,
    hasReadingSettings,
    hasReviewSettings,
    hasNotificationSettings,

    // 动作
    updateSettings,
    updateReadingSettings,
    updateReviewSettings,
    updateNotificationSettings,
    setLoading,
    setError,
    clearError,
    resetAllSettings,
  };
});