import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useFeedbackStore = defineStore('feedback', () => {
  // ==================== 状态定义 ====================
  
  // 反馈列表
  const feedbackList = ref([]);
  
  // 我的反馈列表
  const myFeedback = ref([]);
  
  // 当前查看的反馈详情
  const currentFeedback = ref(null);
  
  // 反馈类型列表
  const feedbackTypes = ref([]);
  
  // 反馈统计
  const statistics = ref({});
  
  // 加载状态
  const loading = ref(false);
  
  // 错误信息
  const error = ref(null);
  
  // ==================== 计算属性 ====================
  
  // 反馈总数
  const totalCount = computed(() => feedbackList.value.length);
  
  // 我的反馈数量
  const myFeedbackCount = computed(() => myFeedback.value.length);
  
  // 待处理反馈数量
  const pendingCount = computed(() => 
    feedbackList.value.filter(f => f.status === 'pending').length
  );
  
  // 进行中反馈数量
  const inProgressCount = computed(() => 
    feedbackList.value.filter(f => f.status === 'in_progress').length
  );
  
  // 已完成反馈数量
  const completedCount = computed(() => 
    feedbackList.value.filter(f => f.status === 'completed').length
  );
  
  // 按类型统计
  const countByType = computed(() => {
    const counts = {};
    feedbackList.value.forEach(feedback => {
      counts[feedback.type] = (counts[feedback.type] || 0) + 1;
    });
    return counts;
  });
  
  // ==================== 动作方法 ====================
  
  /**
   * 设置反馈列表
   * @param {Array} list - 反馈列表
   */
  const setFeedbackList = (list) => {
    feedbackList.value = Array.isArray(list) ? list : [];
  };
  
  /**
   * 设置我的反馈列表
   * @param {Array} list - 我的反馈列表
   */
  const setMyFeedback = (list) => {
    myFeedback.value = Array.isArray(list) ? list : [];
  };
  
  /**
   * 添加反馈
   * @param {Object} feedback - 反馈对象
   */
  const addFeedback = (feedback) => {
    if (feedback) {
      feedbackList.value.unshift(feedback);
      myFeedback.value.unshift(feedback);
    }
  };
  
  /**
   * 更新反馈
   * @param {string} feedbackId - 反馈ID
   * @param {Object} updateData - 更新数据
   */
  const updateFeedback = (feedbackId, updateData) => {
    if (!feedbackId || !updateData) return;
    
    // 更新反馈列表中的对应项
    const index = feedbackList.value.findIndex(f => f.id === feedbackId);
    if (index !== -1) {
      feedbackList.value[index] = { 
        ...feedbackList.value[index], 
        ...updateData,
        updatedAt: new Date().toISOString()
      };
    }
    
    // 更新我的反馈列表中的对应项
    const myIndex = myFeedback.value.findIndex(f => f.id === feedbackId);
    if (myIndex !== -1) {
      myFeedback.value[myIndex] = { 
        ...myFeedback.value[myIndex], 
        ...updateData,
        updatedAt: new Date().toISOString()
      };
    }
    
    // 更新当前查看的反馈
    if (currentFeedback.value?.id === feedbackId) {
      currentFeedback.value = { 
        ...currentFeedback.value, 
        ...updateData,
        updatedAt: new Date().toISOString()
      };
    }
  };
  
  /**
   * 删除反馈
   * @param {string} feedbackId - 反馈ID
   */
  const removeFeedback = (feedbackId) => {
    if (!feedbackId) return;
    
    // 从反馈列表中移除
    feedbackList.value = feedbackList.value.filter(f => f.id !== feedbackId);
    
    // 从我的反馈列表中移除
    myFeedback.value = myFeedback.value.filter(f => f.id !== feedbackId);
    
    // 如果当前查看的是被删除的反馈，清空当前反馈
    if (currentFeedback.value?.id === feedbackId) {
      currentFeedback.value = null;
    }
  };
  
  /**
   * 根据ID获取反馈
   * @param {string} feedbackId - 反馈ID
   * @returns {Object|null} 反馈对象
   */
  const getFeedbackById = (feedbackId) => {
    if (!feedbackId) return null;
    
    // 先从当前列表查找
    let feedback = feedbackList.value.find(f => f.id === feedbackId);
    
    // 如果没找到，从我的反馈中查找
    if (!feedback) {
      feedback = myFeedback.value.find(f => f.id === feedbackId);
    }
    
    return feedback || null;
  };
  
  /**
   * 设置当前查看的反馈
   * @param {Object} feedback - 反馈对象
   */
  const setCurrentFeedback = (feedback) => {
    currentFeedback.value = feedback;
  };
  
  /**
   * 添加评论到反馈
   * @param {string} feedbackId - 反馈ID
   * @param {Object} comment - 评论对象
   */
  const addComment = (feedbackId, comment) => {
    if (!feedbackId || !comment) return;
    
    const feedback = getFeedbackById(feedbackId);
    if (feedback) {
      // 初始化评论数组
      if (!feedback.comments) {
        feedback.comments = [];
      }
      
      // 添加评论
      feedback.comments.push(comment);
      
      // 更新反馈
      updateFeedback(feedbackId, { 
        comments: feedback.comments,
        commentCount: feedback.comments.length
      });
    }
  };
  
  /**
   * 设置反馈类型列表
   * @param {Array} types - 反馈类型列表
   */
  const setFeedbackTypes = (types) => {
    feedbackTypes.value = Array.isArray(types) ? types : [];
  };
  
  /**
   * 设置反馈统计
   * @param {Object} stats - 统计对象
   */
  const setStatistics = (stats) => {
    statistics.value = stats || {};
  };
  
  /**
   * 清除错误信息
   */
  const clearError = () => {
    error.value = null;
  };
  
  /**
   * 设置加载状态
   * @param {boolean} isLoading - 是否加载中
   */
  const setLoading = (isLoading) => {
    loading.value = isLoading;
  };
  
  /**
   * 设置错误信息
   * @param {string|Error} err - 错误信息或对象
   */
  const setError = (err) => {
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = err;
    }
  };
  
  /**
   * 重置Store状态
   */
  const reset = () => {
    feedbackList.value = [];
    myFeedback.value = [];
    currentFeedback.value = null;
    feedbackTypes.value = [];
    statistics.value = {};
    loading.value = false;
    error.value = null;
  };
  
  /**
   * 投票反馈
   * @param {string} feedbackId - 反馈ID
   * @param {string} voteType - 投票类型（upvote/downvote）
   * @param {string} userId - 用户ID
   */
  const voteFeedback = (feedbackId, voteType, userId) => {
    if (!feedbackId || !voteType || !userId) return;
    
    const feedback = getFeedbackById(feedbackId);
    if (!feedback) return;
    
    let updatedFeedback = { ...feedback };
    
    if (voteType === 'upvote') {
      // 如果之前投了反对票，先移除
      if (updatedFeedback.downvotedBy?.includes(userId)) {
        updatedFeedback.downvotedBy = updatedFeedback.downvotedBy.filter(id => id !== userId);
        updatedFeedback.downvotes = Math.max(0, (updatedFeedback.downvotes || 0) - 1);
      }
      
      // 如果还没投赞成票，添加
      if (!updatedFeedback.upvotedBy?.includes(userId)) {
        updatedFeedback.upvotedBy = [...(updatedFeedback.upvotedBy || []), userId];
        updatedFeedback.upvotes = (updatedFeedback.upvotes || 0) + 1;
      }
    } else if (voteType === 'downvote') {
      // 如果之前投了赞成票，先移除
      if (updatedFeedback.upvotedBy?.includes(userId)) {
        updatedFeedback.upvotedBy = updatedFeedback.upvotedBy.filter(id => id !== userId);
        updatedFeedback.upvotes = Math.max(0, (updatedFeedback.upvotes || 0) - 1);
      }
      
      // 如果还没投反对票，添加
      if (!updatedFeedback.downvotedBy?.includes(userId)) {
        updatedFeedback.downvotedBy = [...(updatedFeedback.downvotedBy || []), userId];
        updatedFeedback.downvotes = (updatedFeedback.downvotes || 0) + 1;
      }
    }
    
    // 更新反馈
    updateFeedback(feedbackId, updatedFeedback);
  };
  
  /**
   * 过滤反馈列表
   * @param {Object} filters - 过滤条件
   * @returns {Array} 过滤后的列表
   */
  const filterFeedback = (filters = {}) => {
    let filtered = [...feedbackList.value];
    
    // 按类型过滤
    if (filters.type) {
      filtered = filtered.filter(f => f.type === filters.type);
    }
    
    // 按状态过滤
    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }
    
    // 按优先级过滤
    if (filters.priority) {
      filtered = filtered.filter(f => f.priority === filters.priority);
    }
    
    // 按搜索关键词过滤
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(searchTerm) ||
        f.content.toLowerCase().includes(searchTerm) ||
        f.userName.toLowerCase().includes(searchTerm)
      );
    }
    
    // 排序
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        if (a[filters.sortBy] < b[filters.sortBy]) return -1 * sortOrder;
        if (a[filters.sortBy] > b[filters.sortBy]) return 1 * sortOrder;
        return 0;
      });
    }
    
    return filtered;
  };
  
  return {
    // ==================== 状态 ====================
    feedbackList,
    myFeedback,
    currentFeedback,
    feedbackTypes,
    statistics,
    loading,
    error,
    
    // ==================== 计算属性 ====================
    totalCount,
    myFeedbackCount,
    pendingCount,
    inProgressCount,
    completedCount,
    countByType,
    
    // ==================== 动作方法 ====================
    setFeedbackList,
    setMyFeedback,
    addFeedback,
    updateFeedback,
    removeFeedback,
    getFeedbackById,
    setCurrentFeedback,
    addComment,
    setFeedbackTypes,
    setStatistics,
    clearError,
    setLoading,
    setError,
    reset,
    voteFeedback,
    filterFeedback,
  };
});