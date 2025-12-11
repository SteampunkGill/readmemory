import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  // 状态定义
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  
  // 计算属性
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  );
  
  const recentNotifications = computed(() => 
    notifications.value.slice(0, 5)
  );
  
  const totalCount = computed(() => notifications.value.length);
  
  // 动作
  const setNotifications = (newNotifications) => {
    notifications.value = newNotifications;
  };
  
  const addNotification = (notification) => {
    notifications.value.unshift(notification);
  };
  
  const updateNotification = (id, updates) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index] = { ...notifications.value[index], ...updates };
    }
  };
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };
  
  const clearNotifications = () => {
    notifications.value = [];
  };
  
  const setUnreadCount = (count) => {
    unreadCount.value = count;
  };
  
  const incrementUnreadCount = () => {
    unreadCount.value += 1;
  };
  
  const decrementUnreadCount = () => {
    if (unreadCount.value > 0) {
      unreadCount.value -= 1;
    }
  };
  
  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination };
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
  
  return {
    // 状态
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    
    // 计算属性
    unreadNotifications,
    recentNotifications,
    totalCount,
    
    // 动作
    setNotifications,
    addNotification,
    updateNotification,
    removeNotification,
    clearNotifications,
    setUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    setPagination,
    setLoading,
    setError,
    clearError
  };
});