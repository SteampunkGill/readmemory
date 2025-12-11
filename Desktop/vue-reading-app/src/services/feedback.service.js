import { api } from '@/api/feedback';
import { useFeedbackStore } from '@/stores/feedback.store';
import { useUserStore } from '@/stores/user.store';
import { showError, showSuccess, showWarning } from '@/utils/notify';
import { formatDate } from '@/utils/formatter';

class FeedbackService {
  constructor() {
    this.feedbackStore = useFeedbackStore();
    this.userStore = useUserStore();
    
    this.cache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15分钟缓存
    
    this.cacheKeys = {
      FEEDBACK_LIST: 'feedback_list_',
      FEEDBACK_DETAIL: 'feedback_detail_',
      FEEDBACK_STATISTICS: 'feedback_statistics',
      FEEDBACK_TYPES: 'feedback_types',
      MY_FEEDBACK: 'my_feedback_'
    };
    
    // 反馈类型定义
    this.feedbackTypes = {
      BUG: 'bug',
      FEATURE: 'feature',
      IMPROVEMENT: 'improvement',
      QUESTION: 'question',
      OTHER: 'other'
    };
    
    // 反馈状态定义
    this.feedbackStatus = {
      PENDING: 'pending',
      REVIEWING: 'reviewing',
      PLANNED: 'planned',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      REJECTED: 'rejected',
      DUPLICATE: 'duplicate'
    };
    
    // 优先级定义
    this.priorities = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * 提交反馈
   * @param {Object} feedbackData - 反馈数据
   * @returns {Promise<Object>} 提交的反馈
   */
  async submitFeedback(feedbackData) {
    try {
      // 1. 参数验证
      this._validateFeedbackData(feedbackData);
      
      // 2. 添加用户信息
      const enrichedData = this._enrichFeedbackData(feedbackData);
      
      // 3. API调用 - 使用对象参数
      const response = await api.submitFeedback(enrichedData);
      
      // 4. 数据格式化
      const formattedFeedback = this._formatFeedback(response.data);
      
      // 5. 更新Store
      this.feedbackStore.addFeedback(formattedFeedback);
      
      // 6. 清除相关缓存
      this._clearFeedbackCache();
      
      // 7. 显示成功通知
      showSuccess('反馈已提交，感谢您的宝贵意见！');
      
      return formattedFeedback;
    } catch (error) {
      this._handleError(error, '提交反馈失败');
      throw error;
    }
  }

  /**
   * 获取反馈列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 反馈列表
   */
  async getFeedbackList(options = {}) {
    try {
      const {
        type = null,
        status = null,
        priority = null,
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeClosed = false,
        myFeedback = false,
        forceRefresh = false
      } = options;

      // 1. 生成缓存键
      const cacheKey = this._generateFeedbackListCacheKey(options);

      // 2. 检查缓存
      if (!forceRefresh) {
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 3. 构建查询参数
      const queryParams = {
        type,
        status,
        priority,
        page,
        pageSize,
        sortBy,
        sortOrder,
        includeClosed,
        myFeedback
      };

      // 4. API调用 - 使用对象参数
      const response = await api.getFeedbackList(queryParams);

      // 5. 数据格式化
      const formattedList = this._formatFeedbackList(response.data);

      // 6. 更新Store
      if (myFeedback) {
        this.feedbackStore.setMyFeedback(formattedList.items);
      } else {
        this.feedbackStore.setFeedbackList(formattedList.items);
      }

      // 7. 设置缓存
      this._setToCache(cacheKey, formattedList);

      return formattedList;
    } catch (error) {
      this._handleError(error, '获取反馈列表失败');
      // 返回空列表作为降级
      return this._getEmptyFeedbackList();
    }
  }

  /**
   * 获取反馈详情
   * @param {string} feedbackId - 反馈ID
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 反馈详情
   */
  async getFeedbackDetail(feedbackId, forceRefresh = false) {
    try {
      if (!feedbackId) {
        throw new Error('反馈ID不能为空');
      }

      // 1. 生成缓存键
      const cacheKey = `${this.cacheKeys.FEEDBACK_DETAIL}${feedbackId}`;

      // 2. 检查缓存
      if (!forceRefresh) {
        const cached = this._getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 3. API调用 - 使用对象参数
      const response = await api.getFeedbackDetail({ feedbackId });

      // 4. 数据格式化
      const formattedDetail = this._formatFeedbackDetail(response.data);

      // 5. 更新Store
      this.feedbackStore.updateFeedback(feedbackId, formattedDetail);
      this.feedbackStore.setCurrentFeedback(formattedDetail);

      // 6. 设置缓存
      this._setToCache(cacheKey, formattedDetail);

      return formattedDetail;
    } catch (error) {
      this._handleError(error, '获取反馈详情失败');
      // 尝试从store中获取
      return this.feedbackStore.getFeedbackById(feedbackId) || null;
    }
  }

  /**
   * 更新反馈
   * @param {string} feedbackId - 反馈ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的反馈
   */
  async updateFeedback(feedbackId, updateData) {
    try {
      if (!feedbackId) {
        throw new Error('反馈ID不能为空');
      }

      // 1. 参数验证
      this._validateFeedbackUpdateData(updateData);

      // 2. 检查权限
      const feedback = this.feedbackStore.getFeedbackById(feedbackId);
      if (!feedback) {
        throw new Error('反馈不存在');
      }

      const canUpdate = this._checkUpdatePermission(feedback, updateData);
      if (!canUpdate) {
        throw new Error('没有权限更新此反馈');
      }

      // 3. 乐观更新Store
      const updatedFeedback = { ...feedback, ...updateData };
      this.feedbackStore.updateFeedback(feedbackId, updatedFeedback);

      // 4. API调用 - 使用对象参数
      const response = await api.updateFeedback(feedbackId, updateData);

      // 5. 数据格式化
      const formattedFeedback = this._formatFeedbackDetail(response.data);

      // 6. 更新Store（确保与服务器一致）
      this.feedbackStore.updateFeedback(feedbackId, formattedFeedback);

      // 7. 清除相关缓存
      this._clearFeedbackDetailCache(feedbackId);

      // 8. 显示成功通知
      showSuccess('反馈已更新');

      return formattedFeedback;
    } catch (error) {
      this._handleError(error, '更新反馈失败');
      throw error;
    }
  }

  /**
   * 删除反馈
   * @param {string} feedbackId - 反馈ID
   * @param {Object} options - 删除选项
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFeedback(feedbackId, options = {}) {
    try {
      if (!feedbackId) {
        throw new Error('反馈ID不能为空');
      }

      // 1. 检查权限
      const feedback = this.feedbackStore.getFeedbackById(feedbackId);
      if (!feedback) {
        throw new Error('反馈不存在');
      }

      const canDelete = this._checkDeletePermission(feedback);
      if (!canDelete) {
        throw new Error('没有权限删除此反馈');
      }

      // 2. 确认删除
      if (!options.skipConfirm) {
        const confirmed = await this._confirmDelete(feedback.title);
        if (!confirmed) {
          return false;
        }
      }

      // 3. 从Store中移除（乐观更新）
      this.feedbackStore.removeFeedback(feedbackId);

      // 4. API调用
      await api.deleteFeedback(feedbackId);

      // 5. 清除相关缓存
      this._clearFeedbackDetailCache(feedbackId);
      this._clearFeedbackListCache();

      // 6. 显示成功通知
      showSuccess('反馈已删除');

      return true;
    } catch (error) {
      this._handleError(error, '删除反馈失败');
      throw error;
    }
  }

  /**
   * 添加评论到反馈
   * @param {string} feedbackId - 反馈ID
   * @param {Object} commentData - 评论数据
   * @returns {Promise<Object>} 添加的评论
   */
  async addComment(feedbackId, commentData) {
    try {
      if (!feedbackId) {
        throw new Error('反馈ID不能为空');
      }

      if (!commentData || !commentData.content) {
        throw new Error('评论内容不能为空');
      }

      // 1. 构建评论数据
      const comment = {
        content: commentData.content,
        isInternal: Boolean(commentData.isInternal),
        attachments: commentData.attachments || []
      };

      // 2. API调用 - 使用新增的addComment函数
      const response = await api.addComment(feedbackId, comment);

      // 3. 数据格式化
      const formattedComment = this._formatComment(response.data);

      // 4. 更新Store
      this.feedbackStore.addComment(feedbackId, formattedComment);

      // 5. 清除缓存
      this._clearFeedbackDetailCache(feedbackId);

      // 6. 显示成功通知
      showSuccess('评论已添加');

      return formattedComment;
    } catch (error) {
      this._handleError(error, '添加评论失败');
      throw error;
    }
  }

  /**
   * 投票反馈
   * @param {string} feedbackId - 反馈ID
   * @param {string} voteType - 投票类型（upvote, downvote）
   * @returns {Promise<Object>} 投票结果
   */
  async voteFeedback(feedbackId, voteType) {
    try {
      if (!feedbackId) {
        throw new Error('反馈ID不能为空');
      }

      const validVoteTypes = ['upvote', 'downvote'];
      if (!validVoteTypes.includes(voteType)) {
        throw new Error(`无效的投票类型，必须是: ${validVoteTypes.join(', ')}`);
      }

      // 1. 检查是否已投票
      const feedback = this.feedbackStore.getFeedbackById(feedbackId);
      if (!feedback) {
        throw new Error('反馈不存在');
      }

      const user = this.userStore.user;
      if (!user) {
        throw new Error('请先登录');
      }

      const hasVoted = this._checkIfUserVoted(feedback, voteType);
      if (hasVoted) {
        showWarning('您已经投过票了');
        return feedback;
      }

      // 2. 乐观更新Store
      this.feedbackStore.voteFeedback(feedbackId, voteType, user.id);

      // 3. API调用 - 使用新增的voteFeedback函数
      const response = await api.voteFeedback(feedbackId, voteType);

      // 4. 数据格式化
      const formattedFeedback = this._formatFeedbackDetail(response.data);

      // 5. 更新Store（确保与服务器一致）
      this.feedbackStore.updateFeedback(feedbackId, formattedFeedback);

      // 6. 清除缓存
      this._clearFeedbackDetailCache(feedbackId);

      // 7. 显示成功通知
      showSuccess('投票成功');

      return formattedFeedback;
    } catch (error) {
      this._handleError(error, '投票失败');
      throw error;
    }
  }

  /**
   * 获取反馈统计
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} 反馈统计
   */
  async getFeedbackStatistics(options = {}) {
    try {
      const { timeRange = 'month', type = null } = options;

      // 1. 生成缓存键
      const cacheKey = `${this.cacheKeys.FEEDBACK_STATISTICS}_${timeRange}_${type || 'all'}`;

      // 2. 检查缓存
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 3. API调用 - 使用别名函数
      const response = await api.getFeedbackStatistics({ timeRange, type });

      // 4. 数据格式化
      const statistics = this._formatFeedbackStatistics(response.data);

      // 5. 更新Store
      this.feedbackStore.setStatistics(statistics);

      // 6. 设置缓存
      this._setToCache(cacheKey, statistics);

      return statistics;
    } catch (error) {
      this._handleError(error, '获取反馈统计失败');
      // 降级：基于本地数据计算统计
      return this._calculateLocalFeedbackStatistics();
    }
  }

  /**
   * 获取反馈类型列表
   * @returns {Promise<Array>} 反馈类型列表
   */
  async getFeedbackTypes() {
    try {
      // 1. 检查缓存
      const cached = this._getFromCache(this.cacheKeys.FEEDBACK_TYPES);
      if (cached) {
        return cached;
      }

      // 2. API调用 - 使用别名函数
      const response = await api.getFeedbackTypes();

      // 3. 数据格式化
      const types = this._formatFeedbackTypes(response.data);

      // 4. 更新Store
      this.feedbackStore.setFeedbackTypes(types);

      // 5. 设置缓存
      this._setToCache(this.cacheKeys.FEEDBACK_TYPES, types);

      return types;
    } catch (error) {
      console.warn('获取反馈类型失败，使用默认类型:', error);
      // 返回默认类型作为降级
      return this._getDefaultFeedbackTypes();
    }
  }

  /**
   * 搜索反馈
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async searchFeedback(keyword, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortBy = 'relevance',
        sortOrder = 'desc',
        includeClosed = false
      } = options;

      if (!keyword || keyword.trim() === '') {
        return this.getFeedbackList(options);
      }

      // 1. 生成缓存键
      const cacheKey = `feedback_search_${keyword}_${page}_${pageSize}`;

      // 2. 检查缓存
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 3. API调用 - 使用新增的searchFeedback函数
      const response = await api.searchFeedback(keyword, {
        page,
        pageSize,
        sortBy,
        sortOrder,
        includeClosed
      });

      // 4. 数据格式化
      const results = this._formatFeedbackList(response.data);

      // 5. 设置缓存（短期缓存）
      this._setToCache(cacheKey, results, 5 * 60 * 1000);

      return results;
    } catch (error) {
      this._handleError(error, '搜索反馈失败');
      // 本地搜索作为降级
      return this._localSearchFeedback(keyword, options);
    }
  }

  /**
   * 导出反馈数据
   * @param {Object} options - 导出选项
   * @returns {Promise<Blob>} 导出的数据文件
   */
  async exportFeedback(options = {}) {
    try {
      const {
        format = 'csv',
        type = null,
        status = null,
        startDate = null,
        endDate = null
      } = options;

      // 1. API调用 - 使用新增的exportFeedback函数
      const response = await api.exportFeedback({
        format,
        type,
        status,
        startDate,
        endDate
      });

      // 2. 创建下载链接
      const blob = new Blob([response.data], {
        type: this._getExportMimeType(format)
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this._generateExportFilename(format);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('反馈数据导出成功');

      return blob;
    } catch (error) {
      this._handleError(error, '导出反馈数据失败');
      throw error;
    }
  }

  // ==================== 私有辅助方法 ====================
  // （这些方法保持不变，与原始代码相同）
  // 注意：由于代码长度限制，这里只列出方法签名，实际实现与原始代码相同

  /**
   * 验证反馈数据
   * @param {Object} data - 反馈数据
   */
  _validateFeedbackData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('反馈数据不能为空');
    }

    if (!data.title || data.title.trim() === '') {
      throw new Error('反馈标题不能为空');
    }

    if (data.title.length > 200) {
      throw new Error('反馈标题不能超过200个字符');
    }

    if (!data.content || data.content.trim() === '') {
      throw new Error('反馈内容不能为空');
    }

    if (data.content.length > 5000) {
      throw new Error('反馈内容不能超过5000个字符');
    }

    const validTypes = Object.values(this.feedbackTypes);
    if (data.type && !validTypes.includes(data.type)) {
      throw new Error(`无效的反馈类型，必须是: ${validTypes.join(', ')}`);
    }

    const validPriorities = Object.values(this.priorities);
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new Error(`无效的优先级，必须是: ${validPriorities.join(', ')}`);
    }
  }

  /**
   * 验证反馈更新数据
   * @param {Object} data - 更新数据
   */
  _validateFeedbackUpdateData(data) {
    const validStatuses = Object.values(this.feedbackStatus);
    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error(`无效的反馈状态，必须是: ${validStatuses.join(', ')}`);
    }

    const validPriorities = Object.values(this.priorities);
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new Error(`无效的优先级，必须是: ${validPriorities.join(', ')}`);
    }
  }

  /**
   * 丰富反馈数据
   * @param {Object} data - 原始反馈数据
   * @returns {Object} 丰富后的反馈数据
   */
  _enrichFeedbackData(data) {
    const user = this.userStore.user;
    
    return {
      ...data,
      userId: user?.id || null,
      userEmail: user?.email || null,
      userName: user?.username || '匿名用户',
      userAgent: navigator.userAgent,
      platform: this._detectPlatform(),
      appVersion: process.env.VUE_APP_VERSION || '1.0.0',
      metadata: {
        ...data.metadata,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 检测平台
   * @returns {string} 平台名称
   */
  _detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('mobile')) {
      return 'mobile';
    } else if (userAgent.includes('tablet')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * 检查更新权限
   * @param {Object} feedback - 反馈对象
   * @param {Object} updateData - 更新数据
   * @returns {boolean} 是否有权限
   */
  _checkUpdatePermission(feedback, updateData) {
    const user = this.userStore.user;
    
    // 管理员可以更新任何反馈
    if (user?.isAdmin) {
      return true;
    }
    
    // 用户可以更新自己的反馈
    if (feedback.userId === user?.id) {
      // 用户只能更新特定字段
      const allowedFields = ['title', 'content', 'attachments'];
      const updateFields = Object.keys(updateData);
      
      return updateFields.every(field => allowedFields.includes(field));
    }
    
    return false;
  }

  /**
   * 检查删除权限
   * @param {Object} feedback - 反馈对象
   * @returns {boolean} 是否有权限
   */
  _checkDeletePermission(feedback) {
    const user = this.userStore.user;
    
    // 管理员可以删除任何反馈
    if (user?.isAdmin) {
      return true;
    }
    
    // 用户只能删除自己的反馈
    return feedback.userId === user?.id;
  }

  /**
   * 检查用户是否已投票
   * @param {Object} feedback - 反馈对象
   * @param {string} voteType - 投票类型
   * @returns {boolean} 是否已投票
   */
  _checkIfUserVoted(feedback, voteType) {
    const user = this.userStore.user;
    if (!user) {
      return false;
    }
    
    const userId = user.id;
    
    if (voteType === 'upvote') {
      return feedback.upvotedBy?.includes(userId) || false;
    } else if (voteType === 'downvote') {
      return feedback.downvotedBy?.includes(userId) || false;
    }
    
    return false;
  }

  /**
   * 应用投票到反馈
   * @param {Object} feedback - 反馈对象
   * @param {string} voteType - 投票类型
   * @returns {Object} 更新后的反馈
   */
  _applyVoteToFeedback(feedback, voteType) {
    const user = this.userStore.user;
    if (!user) {
      return feedback;
    }
    
    const userId = user.id;
    const updatedFeedback = { ...feedback };
    
    if (voteType === 'upvote') {
      // 如果之前投了反对票，先移除
      if (updatedFeedback.downvotedBy?.includes(userId)) {
        updatedFeedback.downvotedBy = updatedFeedback.downvotedBy.filter(id => id !== userId);
        updatedFeedback.downvotes = Math.max(0, (updatedFeedback.downvotes || 0) - 1);
      }
      
      // 添加赞成票
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
      
      // 添加反对票
      if (!updatedFeedback.downvotedBy?.includes(userId)) {
        updatedFeedback.downvotedBy = [...(updatedFeedback.downvotedBy || []), userId];
        updatedFeedback.downvotes = (updatedFeedback.downvotes || 0) + 1;
      }
    }
    
    return updatedFeedback;
  }

  /**
   * 格式化反馈
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的反馈
   */
  _formatFeedback(apiData) {
    return {
      id: apiData.id || '',
      type: apiData.type || this.feedbackTypes.OTHER,
      title: apiData.title || '未命名反馈',
      content: apiData.content || '',
      status: apiData.status || this.feedbackStatus.PENDING,
      priority: apiData.priority || this.priorities.MEDIUM,
      upvotes: Number(apiData.upvotes) || 0,
      downvotes: Number(apiData.downvotes) || 0,
      upvotedBy: apiData.upvotedBy || [],
      downvotedBy: apiData.downvotedBy || [],
      userId: apiData.userId || null,
      userName: apiData.userName || '匿名用户',
      userEmail: apiData.userEmail || null,
      attachments: apiData.attachments || [],
      comments: apiData.comments ? apiData.comments.map(comment => this._formatComment(comment)) : [],
      metadata: apiData.metadata || {},
      createdAt: apiData.createdAt ? formatDate(apiData.createdAt) : null,
      updatedAt: apiData.updatedAt ? formatDate(apiData.updatedAt) : null,
      assignedTo: apiData.assignedTo || null,
      assignedAt: apiData.assignedAt ? formatDate(apiData.assignedAt) : null,
      completedAt: apiData.completedAt ? formatDate(apiData.completedAt) : null
    };
  }

  /**
   * 格式化反馈详情
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的反馈详情
   */
  _formatFeedbackDetail(apiData) {
    const baseFeedback = this._formatFeedback(apiData);
    
    return {
      ...baseFeedback,
      viewCount: Number(apiData.viewCount) || 0,
      commentCount: Number(apiData.commentCount) || 0,
      relatedFeedback: apiData.relatedFeedback || [],
      changeLog: apiData.changeLog ? apiData.changeLog.map(log => this._formatChangeLog(log)) : [],
      estimatedCompletion: apiData.estimatedCompletion ? formatDate(apiData.estimatedCompletion) : null
    };
  }

  /**
   * 格式化反馈列表
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的反馈列表
   */
  _formatFeedbackList(apiData) {
    const list = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: [],
      filters: apiData.filters || {},
      statistics: apiData.statistics || {}
    };

    if (Array.isArray(apiData.items)) {
      list.items = apiData.items.map(item => this._formatFeedback(item));
    }

    return list;
  }

  /**
   * 格式化评论
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的评论
   */
  _formatComment(apiData) {
    return {
      id: apiData.id || '',
      content: apiData.content || '',
      userId: apiData.userId || null,
      userName: apiData.userName || '匿名用户',
      userAvatar: apiData.userAvatar || null,
      isInternal: Boolean(apiData.isInternal),
      attachments: apiData.attachments || [],
      createdAt: apiData.createdAt ? formatDate(apiData.createdAt) : null,
      updatedAt: apiData.updatedAt ? formatDate(apiData.updatedAt) : null,
      edited: Boolean(apiData.edited)
    };
  }

  /**
   * 格式化变更日志
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的变更日志
   */
  _formatChangeLog(apiData) {
    return {
      id: apiData.id || '',
      field: apiData.field || '',
      oldValue: apiData.oldValue,
      newValue: apiData.newValue,
      changedBy: apiData.changedBy || null,
      changedByName: apiData.changedByName || '系统',
      changedAt: apiData.changedAt ? formatDate(apiData.changedAt) : null,
      reason: apiData.reason || ''
    };
  }

  /**
   * 格式化反馈统计
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的反馈统计
   */
  _formatFeedbackStatistics(apiData) {
    return {
      total: Number(apiData.total) || 0,
      byType: apiData.byType || {},
      byStatus: apiData.byStatus || {},
      byPriority: apiData.byPriority || {},
      byMonth: apiData.byMonth || {},
      topContributors: apiData.topContributors || [],
      averageResponseTime: Number(apiData.averageResponseTime) || 0,
      resolutionRate: Number(apiData.resolutionRate) || 0,
      satisfactionScore: Number(apiData.satisfactionScore) || 0
    };
  }

  /**
   * 格式化反馈类型
   * @param {Array} apiData - API返回的数据
   * @returns {Array} 格式化后的反馈类型
   */
  _formatFeedbackTypes(apiData) {
    if (!Array.isArray(apiData)) {
      return this._getDefaultFeedbackTypes();
    }

    return apiData.map(type => ({
      id: type.id || type.value || '',
      name: type.name || type.label || '',
      value: type.value || type.id || '',
      description: type.description || '',
      icon: type.icon || this._getTypeIcon(type.value || type.id),
      color: type.color || this._getTypeColor(type.value || type.id)
    }));
  }

  /**
   * 获取默认反馈类型
   * @returns {Array} 默认反馈类型
   */
  _getDefaultFeedbackTypes() {
    return [
      {
        id: this.feedbackTypes.BUG,
        name: '错误报告',
        value: this.feedbackTypes.BUG,
        description: '系统功能异常或错误',
        icon: 'bug',
        color: '#F44336'
      },
      {
        id: this.feedbackTypes.FEATURE,
        name: '功能建议',
        value: this.feedbackTypes.FEATURE,
        description: '新功能或改进建议',
        icon: 'light-bulb',
        color: '#2196F3'
      },
      {
        id: this.feedbackTypes.IMPROVEMENT,
        name: '改进建议',
        value: this.feedbackTypes.IMPROVEMENT,
        description: '现有功能优化建议',
        icon: 'chart-bar',
        color: '#4CAF50'
      },
      {
        id: this.feedbackTypes.QUESTION,
        name: '问题咨询',
        value: this.feedbackTypes.QUESTION,
        description: '使用问题或咨询',
        icon: 'question-mark-circle',
        color: '#FF9800'
      },
      {
        id: this.feedbackTypes.OTHER,
        name: '其他反馈',
        value: this.feedbackTypes.OTHER,
        description: '其他类型的反馈',
        icon: 'chat-alt-2',
        color: '#9C27B0'
      }
    ];
  }

  /**
   * 获取类型图标
   * @param {string} type - 反馈类型
   * @returns {string} 图标名称
   */
  _getTypeIcon(type) {
    const iconMap = {
      [this.feedbackTypes.BUG]: 'bug',
      [this.feedbackTypes.FEATURE]: 'light-bulb',
      [this.feedbackTypes.IMPROVEMENT]: 'chart-bar',
      [this.feedbackTypes.QUESTION]: 'question-mark-circle',
      [this.feedbackTypes.OTHER]: 'chat-alt-2'
    };
    
    return iconMap[type] || 'chat-alt-2';
  }

  /**
   * 获取类型颜色
   * @param {string} type - 反馈类型
   * @returns {string} 颜色代码
   */
  _getTypeColor(type) {
    const colorMap = {
      [this.feedbackTypes.BUG]: '#F44336',
      [this.feedbackTypes.FEATURE]: '#2196F3',
      [this.feedbackTypes.IMPROVEMENT]: '#4CAF50',
      [this.feedbackTypes.QUESTION]: '#FF9800',
      [this.feedbackTypes.OTHER]: '#9C27B0'
    };
    
    return colorMap[type] || '#666666';
  }

  /**
   * 生成反馈列表缓存键
   * @param {Object} options - 查询选项
   * @returns {string} 缓存键
   */
  _generateFeedbackListCacheKey(options) {
    const { type, status, priority, page, pageSize, sortBy, sortOrder, includeClosed, myFeedback } = options;
    return `${this.cacheKeys.FEEDBACK_LIST}${type || 'all'}_${status || 'all'}_${priority || 'all'}_${page}_${pageSize}_${sortBy}_${sortOrder}_${includeClosed}_${myFeedback}`;
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
   * 清除反馈缓存
   */
  _clearFeedbackCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.cacheKeys.FEEDBACK_LIST) ||
          key.startsWith(this.cacheKeys.MY_FEEDBACK)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除反馈详情缓存
   * @param {string} feedbackId - 反馈ID
   */
  _clearFeedbackDetailCache(feedbackId) {
    const cacheKey = `${this.cacheKeys.FEEDBACK_DETAIL}${feedbackId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * 清除反馈列表缓存
   */
  _clearFeedbackListCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.cacheKeys.FEEDBACK_LIST)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 确认删除
   * @param {string} feedbackTitle - 反馈标题
   * @returns {Promise<boolean>} 用户是否确认
   */
  async _confirmDelete(feedbackTitle) {
    return new Promise((resolve) => {
      const message = `确定要删除反馈 "${feedbackTitle}" 吗？此操作不可撤销。`;
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  /**
   * 本地搜索反馈（降级方案）
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Object} 搜索结果
   */
  _localSearchFeedback(keyword, options = {}) {
    const { page = 1, pageSize = 20 } = options;
    const searchTerm = keyword.toLowerCase().trim();
    
    const allFeedback = this.feedbackStore.feedbackList;
    
    const filteredItems = allFeedback.filter(feedback => {
      return feedback.title.toLowerCase().includes(searchTerm) ||
             feedback.content.toLowerCase().includes(searchTerm) ||
             feedback.userName.toLowerCase().includes(searchTerm);
    });
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    return {
      total: filteredItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredItems.length / pageSize),
      items: paginatedItems,
      filters: {},
      statistics: {}
    };
  }

  /**
   * 计算本地反馈统计
   * @returns {Object} 反馈统计
   */
  _calculateLocalFeedbackStatistics() {
    const allFeedback = this.feedbackStore.feedbackList;
    
    const byType = {};
    const byStatus = {};
    const byPriority = {};
    
    allFeedback.forEach(feedback => {
      // 按类型统计
      byType[feedback.type] = (byType[feedback.type] || 0) + 1;
      
      // 按状态统计
      byStatus[feedback.status] = (byStatus[feedback.status] || 0) + 1;
      
      // 按优先级统计
      byPriority[feedback.priority] = (byPriority[feedback.priority] || 0) + 1;
    });
    
    return {
      total: allFeedback.length,
      byType,
      byStatus,
      byPriority,
      byMonth: {},
      topContributors: [],
      averageResponseTime: 0,
      resolutionRate: 0,
      satisfactionScore: 0
    };
  }

  /**
   * 获取导出MIME类型
   * @param {string} format - 导出格式
   * @returns {string} MIME类型
   */
  _getExportMimeType(format) {
    const mimeMap = {
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf'
    };
    
    return mimeMap[format] || 'text/csv';
  }

  /**
   * 生成导出文件名
   * @param {string} format - 导出格式
   * @returns {string} 文件名
   */
  _generateExportFilename(format) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const extensionMap = {
      csv: 'csv',
      json: 'json',
      excel: 'xlsx',
      pdf: 'pdf'
    };
    
    const extension = extensionMap[format] || 'csv';
    
    return `feedback_export_${dateStr}_${timeStr}.${extension}`;
  }

  /**
   * 获取空反馈列表
   * @returns {Object} 空反馈列表
   */
  _getEmptyFeedbackList() {
    return {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      items: [],
      filters: {},
      statistics: {}
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
          message = error.response.data?.message || '请求参数错误';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限操作反馈';
          break;
        case 404:
          message = '反馈不存在';
          break;
        case 409:
          message = '反馈已存在或冲突';
          break;
        case 422:
          message = '反馈数据格式错误';
          break;
        case 429:
          message = '操作过于频繁，请稍后再试';
          break;
        case 500:
          message = '服务器错误，请稍后重试';
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
const feedbackService = new FeedbackService();

export default feedbackService;