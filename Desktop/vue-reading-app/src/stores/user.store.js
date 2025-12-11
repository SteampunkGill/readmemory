// src/stores/user.store.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  // 状态
  const profile = ref(null); // 用户信息
  const learningStats = ref(null); // 学习统计
  const achievements = ref([]); // 用户成就
  const activity = ref([]); // 用户活动日志
  const activityPagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const learningReport = ref(null); // 学习报告
  const pointsAndLevel = ref(null); // 积分等级信息
  const learningCalendar = ref(null); // 学习日历
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const isPremium = computed(() => {
    if (!profile.value) return false;
    return profile.value.subscription?.type === 'premium' || 
           profile.value.subscription?.status === 'active';
  });

  const joinDuration = computed(() => {
    if (!profile.value?.joinDate) return '';
    const joinDate = new Date(profile.value.joinDate);
    const now = new Date();
    const diffMs = now - joinDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays}天`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}个月`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years}年${remainingMonths > 0 ? `${remainingMonths}个月` : ''}`;
    }
  });

  const todayActivity = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return activity.value.filter(item => 
      item.timestamp && item.timestamp.includes(today)
    );
  });

  const unlockedAchievementsCount = computed(() => 
    achievements.value.filter(a => a.unlocked).length
  );

  const totalAchievementsCount = computed(() => achievements.value.length);

  const achievementProgress = computed(() => {
    if (totalAchievementsCount.value === 0) return 0;
    return (unlockedAchievementsCount.value / totalAchievementsCount.value) * 100;
  });

  // 动作
  const setProfile = (userProfile) => {
    profile.value = userProfile;
  };

  const setLearningStats = (stats) => {
    learningStats.value = stats;
  };

  const setAchievements = (achievementList) => {
    achievements.value = achievementList;
  };

  const setActivity = (activities) => {
    activity.value = activities;
  };

  const setActivityPagination = (pagination) => {
    activityPagination.value = { ...activityPagination.value, ...pagination };
  };

  const setLearningReport = (report) => {
    learningReport.value = report;
  };

  const setPointsAndLevel = (pointsData) => {
    pointsAndLevel.value = pointsData;
  };

  const setLearningCalendar = (calendar) => {
    learningCalendar.value = calendar;
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

  const updateProfileField = (field, value) => {
    if (profile.value) {
      profile.value[field] = value;
    }
  };

  const updatePreferences = (preferences) => {
    if (profile.value) {
      profile.value.preferences = { ...profile.value.preferences, ...preferences };
    }
  };

  const reset = () => {
    profile.value = null;
    learningStats.value = null;
    achievements.value = [];
    activity.value = [];
    activityPagination.value = {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    };
    learningReport.value = null;
    pointsAndLevel.value = null;
    learningCalendar.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    // 状态
    profile,
    learningStats,
    achievements,
    activity,
    activityPagination,
    learningReport,
    pointsAndLevel,
    learningCalendar,
    loading,
    error,

    // 计算属性
    isPremium,
    joinDuration,
    todayActivity,
    unlockedAchievementsCount,
    totalAchievementsCount,
    achievementProgress,

    // 动作
    setProfile,
    setLearningStats,
    setAchievements,
    setActivity,
    setActivityPagination,
    setLearningReport,
    setPointsAndLevel,
    setLearningCalendar,
    setLoading,
    setError,
    clearError,
    updateProfileField,
    updatePreferences,
    reset
  };
});

export default useUserStore;