// src/services/notification.service.js
// 功能：通知列表获取、标记已读、删除通知

// 修改API导入方式
import api from '@/api/notifications';  // ✅ 使用默认导入

import { useNotificationStore } from '@/stores/notification.store';
import { showError, showSuccess, showWarning } from '@/utils/notify';
import { formatDate, formatRelativeTime } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';

class NotificationService {
  constructor() {
    this.notificationStore = useNotificationStore();
    this.cache = new Map(); // 通知数据缓存
    this.cacheExpiry = 5 * 60 * 1000; // 缓存5分钟
    
    // 防抖的批量操作函数
    this.batchMarkAsReadDebounced = debounce(this._batchMarkAsRead.bind(this), 1000);
    
    // 实时通知相关
    this.realtimeEnabled = false;
    this.realtimeConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // 批量操作队列
    this.batchReadQueue = new Set();
    this.batchDeleteQueue = new Set();
  }

  /**
   * 获取通知列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @param {string} [params.type] - 通知类型筛选
   * @param {boolean} [params.unreadOnly=false] - 是否只获取未读通知
   * @param {string} [params.sortBy='created_at'] - 排序字段
   * @param {string} [params.sortOrder='desc'] - 排序方向
   * @param {boolean} [params.forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Object>} 通知列表数据
   */
  async getNotifications(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateNotificationParams(params);
      
      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('notifications', queryParams);
      
      // 3. 检查缓存
      if (!params.forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log('从缓存获取通知列表');
        return cachedData;
      }
      
      // 4. API调用
      const response = await api.getNotifications(queryParams);
      
      // 5. 数据处理
      const formattedData = this._formatNotificationList(response.data);
      
      // 6. 状态更新
      this.notificationStore.setNotifications(formattedData.notifications);
      this.notificationStore.setPagination(formattedData.pagination);
      
      // 7. 更新缓存
      this._setCache(cacheKey, formattedData);
      
      return formattedData;
    } catch (error) {
      // 错误处理
      this._handleGetNotificationsError(error);
      throw error;
    }
  }

  /**
   * 获取未读通知数量
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<number>} 未读通知数量
   */
  async getUnreadCount(forceRefresh = false) {
    try {
      // 1. 生成缓存键
      const cacheKey = 'unread_count';
      
      // 2. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用
      const response = await api.getUnreadCount();
      
      // 4. 数据处理
      const count = response.data.count || response.data.unread_count || 0;
      
      // 5. 状态更新
      this.notificationStore.setUnreadCount(count);
      
      // 6. 更新缓存
      this._setCache(cacheKey, count);
      
      return count;
    } catch (error) {
      // 错误处理
      this._handleGetUnreadCountError(error);
      throw error;
    }
  }

  /**
   * 标记通知为已读
   * @param {string|number} id - 通知ID
   * @param {boolean} [immediate=true] - 是否立即更新
   * @returns {Promise<Object>} 更新结果
   */
  async markAsRead(id, immediate = true) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('通知ID不能为空');
      }
      
      // 2. 获取原始通知（用于乐观更新）
      const originalNotification = this.notificationStore.notifications.find(n => n.id === id);
      
      // 3. 立即更新或加入批量队列
      if (immediate) {
        return await this._markSingleAsRead(id, originalNotification);
      } else {
        // 加入批量队列
        this.batchReadQueue.add(id);
        
        // 乐观更新本地状态
        if (originalNotification) {
          const updatedNotification = { 
            ...originalNotification, 
            read: true,
            readAt: new Date().toISOString()
          };
          this.notificationStore.updateNotification(id, updatedNotification);
        }
        
        // 触发防抖批量更新
        this.batchMarkAsReadDebounced();
        
        return { success: true, message: '通知已标记为已读（延迟同步）' };
      }
    } catch (error) {
      // 错误处理
      this._handleMarkAsReadError(error, id);
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   * @returns {Promise<Object>} 更新结果
   */
  async markAllAsRead() {
    try {
      // 1. 确认操作
      const confirmed = window.confirm('确定要将所有通知标记为已读吗？');
      if (!confirmed) {
        return { success: false, message: '用户取消操作' };
      }
      
      // 2. 乐观更新：将所有通知标记为已读
      const notifications = this.notificationStore.notifications;
      notifications.forEach(notification => {
        if (!notification.read) {
          const updatedNotification = {
            ...notification,
            read: true,
            readAt: new Date().toISOString()
          };
          this.notificationStore.updateNotification(notification.id, updatedNotification);
        }
      });
      
      // 3. API调用
      const response = await api.markAllAsRead();
      
      // 4. 数据处理
      const result = this._formatMarkAllResult(response.data);
      
      // 5. 更新未读计数
      await this.getUnreadCount(true);
      
      // 6. 用户反馈
      showSuccess('所有通知已标记为已读');
      
      return result;
    } catch (error) {
      // 错误处理
      this._handleMarkAllAsReadError(error);
      throw error;
    }
  }

  /**
   * 删除通知
   * @param {string|number} id - 通知ID
   * @param {boolean} [confirm=true] - 是否需要确认
   * @param {boolean} [immediate=true] - 是否立即删除
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteNotification(id, confirm = true, immediate = true) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('通知ID不能为空');
      }
      
      // 2. 获取通知信息
      const notification = this.notificationStore.notifications.find(n => n.id === id);
      
      // 3. 确认删除
      if (confirm && notification) {
        const confirmed = window.confirm('确定要删除这条通知吗？');
        if (!confirmed) {
          return false;
        }
      }
      
      // 4. 立即删除或加入批量队列
      if (immediate) {
        return await this._deleteSingleNotification(id, notification);
      } else {
        // 加入批量队列
        this.batchDeleteQueue.add(id);
        
        // 乐观更新：先从本地状态移除
        this.notificationStore.removeNotification(id);
        
        // 触发防抖批量删除
        this.batchDeleteDebounced();
        
        return true;
      }
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (notification) {
        this.notificationStore.addNotification(notification);
      }
      this._handleDeleteNotificationError(error, id);
      throw error;
    }
  }

  /**
   * 批量删除通知
   * @param {Array} ids - 通知ID数组
   * @returns {Promise<Object>} 批量删除结果
   */
  async batchDeleteNotifications(ids) {
    try {
      // 1. 参数验证
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('通知ID列表不能为空');
      }
      
      // 2. 确认批量删除
      const confirmed = window.confirm(`确定要删除 ${ids.length} 条通知吗？`);
      if (!confirmed) {
        return { success: false, message: '用户取消操作' };
      }
      
      // 3. 乐观更新：先从本地状态移除
      ids.forEach(id => {
        this.notificationStore.removeNotification(id);
      });
      
      // 4. API调用
      const response = await api.batchDeleteNotifications({ notificationIds: ids });
      
      // 5. 数据处理
      const result = this._formatBatchResult(response.data);
      
      // 6. 更新未读计数
      await this.getUnreadCount(true);
      
      // 7. 用户反馈
      showSuccess(`成功删除 ${ids.length} 条通知`);
      
      return result;
    } catch (error) {
      // 错误处理：需要重新获取通知列表
      await this.getNotifications({ forceRefresh: true });
      this._handleBatchDeleteError(error);
      throw error;
    }
  }

  /**
   * 获取通知设置
   * @returns {Promise<Object>} 通知设置
   */
  async getNotificationSettings() {
    try {
      // 1. 生成缓存键
      const cacheKey = 'notification_settings';
      
      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用
      const response = await api.getNotificationSettings();
      
      // 4. 数据处理
      const settings = this._formatNotificationSettings(response.data);
      
      // 5. 更新缓存
      this._setCache(cacheKey, settings);
      
      return settings;
    } catch (error) {
      // 错误处理
      this._handleGetSettingsError(error);
      throw error;
    }
  }

  /**
   *更新通知设置
   * @param {Object} settings - 通知设置
   * @returns {Promise<Object>} 更新后的设置
   */
  async updateNotificationSettings(settings) {
    try {
      // 1. 参数验证
      if (!settings || typeof settings !== 'object') {
        throw new Error('通知设置不能为空');
      }
      
      // 2. API调用
      const response = await api.updateNotificationSettings(settings);
      
      // 3. 数据处理
      const updatedSettings = this._formatNotificationSettings(response.data);
      
      // 4. 清除缓存
      this.cache.delete('notification_settings');
      
      // 5. 用户反馈
      showSuccess('通知设置已更新');
      
      return updatedSettings;
    } catch (error) {
      // 错误处理
      this._handleUpdateSettingsError(error);
      throw error;
    }
  }

  /**
   * 启用实时通知
   * @param {Object} options - 连接选项
   * @returns {Promise<boolean>} 是否启用成功
   */
  async enableRealtimeNotifications(options = {}) {
    try {
      if (this.realtimeEnabled) {
        console.warn('实时通知已启用');
        return true;
      }
      
      // 1. 建立WebSocket连接
      const connection = await this._establishRealtimeConnection(options);
      
      // 2. 设置消息处理器
      this._setupRealtimeHandlers(connection);
      
      // 3. 更新状态
      this.realtimeEnabled = true;
      this.realtimeConnection = connection;
      this.reconnectAttempts = 0;
      
      console.log('实时通知已启用');
      return true;
    } catch (error) {
      console.error('启用实时通知失败:', error);
      return false;
    }
  }

  /**
   * 禁用实时通知
   */
  disableRealtimeNotifications() {
    if (this.realtimeConnection) {
      this.realtimeConnection.close();
      this.realtimeConnection = null;
    }
    
    this.realtimeEnabled = false;
    console.log('实时通知已禁用');
  }

  /**
   * 清除所有通知
   * @returns {Promise<Object>} 清除结果
   */
  async clearAllNotifications() {
    try {
      // 1. 确认操作
      const confirmed = window.confirm('确定要清除所有通知吗？此操作不可恢复。');
      if (!confirmed) {
        return { success: false, message: '用户取消操作' };
      }
      
      // 2. API调用
      const response = await api.clearAllNotifications();
      
      // 3. 数据处理
      const result = this._formatClearAllResult(response.data);
      
      // 4. 清空本地状态
      this.notificationStore.clearNotifications();
      
      // 5. 更新未读计数
      this.notificationStore.setUnreadCount(0);
      
      // 6. 用户反馈
      showSuccess('所有通知已清除');
      
      return result;
    } catch (error) {
      // 错误处理
      this._handleClearAllError(error);
      throw error;
    }
  }

  /**
   * 获取通知统计
   * @returns {Promise<Object>} 通知统计
   */
  async getNotificationStats() {
    try {
      // 1. 生成缓存键
      const cacheKey = 'notification_stats';
      
      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 3. API调用
      const response = await api.getNotificationStats();
      
      // 4. 数据处理
      const stats = this._formatNotificationStats(response.data);
      
      // 5. 更新缓存
      this._setCache(cacheKey, stats);
      
      return stats;
    } catch (error) {
      // 错误处理
      this._handleGetStatsError(error);
      throw error;
    }
  }

  /**
   * 清除通知缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('已清除所有通知缓存');
  }

  // ==================== 私有方法 ====================

  /**
   * 验证通知查询参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateNotificationParams(params) {
    const defaultParams = {
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
      unreadOnly: false
    };
    
    const validatedParams = { ...defaultParams, ...params };
    
    // 验证页码
    if (validatedParams.page < 1) {
      validatedParams.page = 1;
    }
    
    // 验证每页数量
    if (validatedParams.pageSize < 1 || validatedParams.pageSize > 100) {
      validatedParams.pageSize = 20;
    }
    
    // 验证排序方向
    if (!['asc', 'desc'].includes(validatedParams.sortOrder)) {
      validatedParams.sortOrder = 'desc';
    }
    
    return validatedParams;
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 缓存前缀
   * @param {Object} params - 参数
   * @returns {string} 缓存键
   * @private
   */
  _generateCacheKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `${prefix}_${paramString}`;
  }

  /**
   * 检查缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 缓存是否有效
   * @private
   */
  _checkCache(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const cachedItem = this.cache.get(key);
    const now = Date.now();
    
    // 检查是否过期
    if (cachedItem.expiry && cachedItem.expiry < now) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} [expiry] - 过期时间（毫秒）
   * @private
   */
  _setCache(key, value, expiry = null) {
    const cacheItem = {
      data: value,
      timestamp: Date.now(),
      expiry: expiry || (Date.now() + this.cacheExpiry)
    };
    
    this.cache.set(key, cacheItem);
  }

  /**
   * 批量标记为已读
   * @private
   */
  async _batchMarkAsRead() {
    if (this.batchReadQueue.size === 0) {
      return;
    }
    
    try {
      const ids = Array.from(this.batchReadQueue);
      
      // API调用
      const response = await api.batchMarkAsRead({ ids }); // 修改API调用
      
      // 清空队列
      this.batchReadQueue.clear();
      
      // 更新未读计数
      await this.getUnreadCount(true);
      
      console.log(`批量标记 ${ids.length} 条通知为已读`);
      // Optionally handle response.data here if needed
    } catch (error) {
      console.error('批量标记为已读失败:', error);
      // 失败后重新加入队列，等待下次重试
      const failedIds = Array.from(this.batchReadQueue);
      this.batchReadQueue.clear();
      failedIds.forEach(id => this.batchReadQueue.add(id));
    }
  }

  /**
   * 标记单个通知为已读
   * @param {string|number} id - 通知ID
   * @param {Object} originalNotification - 原始通知
   * @returns {Promise<Object>} 更新结果
   * @private
   */
  async _markSingleAsRead(id, originalNotification) {
    // 乐观更新：先更新本地状态
    if (originalNotification) {
      const updatedNotification = { 
        ...originalNotification, 
        read: true,
        readAt: new Date().toISOString()
      };
      this.notificationStore.updateNotification(id, updatedNotification);
    }
    
    // API调用
    const response = await api.markAsRead({ notificationId: id }); // 修改API调用
    
    // 数据处理
    const result = this._formatMarkAsReadResult(response.data);
    
    // 更新未读计数
    await this.getUnreadCount(true);
    
    return result;
  }

  /**
   * 删除单个通知
   * @param {string|number} id - 通知ID
   * @param {Object} notification - 通知信息
   * @returns {Promise<boolean>} 是否删除成功
   * @private
   */
  async _deleteSingleNotification(id, notification) {
    // API调用
    await api.deleteNotification({ notificationId: id }); // 修改API调用
    
    // 更新未读计数
    await this.getUnreadCount(true);
    
    // 用户反馈
    showSuccess('通知已删除');
    
    return true;
  }

  /**
   * 建立实时连接
   * @param {Object} options - 连接选项
   * @returns {Promise<WebSocket>} WebSocket连接
   * @private
   */
  async _establishRealtimeConnection(options) {
    return new Promise((resolve, reject) => {
      const wsUrl = options.url || this._getWebSocketUrl();
      const connection = new WebSocket(wsUrl);
      
      connection.onopen = () => {
        console.log('实时通知连接已建立');
        resolve(connection);
      };
      
      connection.onerror = (error) => {
        console.error('实时通知连接错误:', error);
        reject(error);
      };
      
      // 设置超时
      setTimeout(() => {
        if (connection.readyState !== WebSocket.OPEN) {
          connection.close();
          reject(new Error('连接超时'));
        }
      }, options.timeout || 10000);
    });
  }

  /**
   * 获取WebSocket URL
   * @returns {string} WebSocket URL
   * @private
   */
  _getWebSocketUrl() {
    // 根据当前环境构建WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/notifications`;
  }

  /**
   * 设置实时处理器
   * @param {WebSocket} connection - WebSocket连接
   * @private
   */
  _setupRealtimeHandlers(connection) {
    connection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleRealtimeMessage(data);
      } catch (error) {
        console.error('处理实时消息失败:', error);
      }
    };
    
    connection.onclose = (event) => {
      console.log('实时通知连接关闭', event.code, event.reason);
      this.realtimeEnabled = false;
      this.realtimeConnection = null;
      
      // 尝试重新连接
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.enableRealtimeNotifications().catch(() => {
            console.error('重新连接失败');
          });
        }, 3000 * this.reconnectAttempts); // 指数退避
      }
    };
  }

  /**
   * 处理实时消息
   * @param {Object} message - 实时消息
   * @private
   */
  _handleRealtimeMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'new_notification':
        this._handleNewNotification(data);
        break;
      case 'notification_read':
        this._handleNotificationRead(data);
        break;
      case 'notification_deleted':
        this._handleNotificationDeleted(data);
        break;
      case 'unread_count_update':
        this._handleUnreadCountUpdate(data);
        break;
      default:
        console.warn('未知的实时消息类型:', type);
    }
  }

  /**
   * 处理新通知
   * @param {Object} notification - 新通知数据
   * @private
   */
  _handleNewNotification(notification) {
    // 格式化通知
    const formattedNotification = this._formatNotification(notification);
    
    // 添加到本地状态
    this.notificationStore.addNotification(formattedNotification);
    
    // 更新未读计数
    this.notificationStore.incrementUnreadCount();
    
    // 显示桌面通知（如果允许）
    this._showDesktopNotification(formattedNotification);
    
    console.log('收到新通知:', formattedNotification);
  }

  /**
   * 处理通知已读
   * @param {Object} data - 已读数据
   * @private
   */
  _handleNotificationRead(data) {
    const { id } = data;
    
    // 更新本地状态
    const notification = this.notificationStore.notifications.find(n => n.id === id);
    if (notification) {
      const updatedNotification = {
        ...notification,
        read: true,
        readAt: new Date().toISOString()
      };
      this.notificationStore.updateNotification(id, updatedNotification);
    }
    
    // 更新未读计数
    this.notificationStore.decrementUnreadCount();
  }

  /**
   * 处理通知删除
   * @param {Object} data - 删除数据
   * @private
   */
  _handleNotificationDeleted(data) {
    const { id } = data;
    
    // 从本地状态移除
    this.notificationStore.removeNotification(id);
  }

  /**
   * 处理未读计数更新
   * @param {Object} data - 未读计数数据
   * @private
   */
  _handleUnreadCountUpdate(data) {
    const { count } = data;
    
    // 更新未读计数
    this.notificationStore.setUnreadCount(count);
  }

  /**
   * 显示桌面通知
   * @param {Object} notification - 通知数据
   * @private
   */
  _showDesktopNotification(notification) {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      return;
    }
    
    // 检查用户是否已授权
    if (Notification.permission === 'granted') {
      this._createDesktopNotification(notification);
    } else if (Notification.permission !== 'denied') {
      // 请求权限
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this._createDesktopNotification(notification);
        }
      });
    }
  }

  /**
   * 创建桌面通知
   * @param {Object} notification - 通知数据
   * @private
   */
  _createDesktopNotification(notification) {
    const { title, message, icon } = notification;
    
    const options = {
      body: message,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'vocabulary_notification',
      requireInteraction: false
    };
    
    const desktopNotification = new Notification(title || '新通知', options);
    
    // 点击通知时跳转到相关页面
    desktopNotification.onclick = () => {
      window.focus();
      this._handleNotificationClick(notification);
      desktopNotification.close();
    };
    
    // 自动关闭通知
    setTimeout(() => {
      desktopNotification.close();
    }, 5000);
  }

  /**
   * 处理通知点击
   * @param {Object} notification - 通知数据
   * @private
   */
  _handleNotificationClick(notification) {
    const { type, targetId, targetType } = notification;
    
    // 根据通知类型跳转到不同页面
    switch (type) {
      case 'document_shared':
        // 跳转到文档页面
        window.location.href = `/documents/${targetId}`;
        break;
      case 'review_reminder':
        // 跳转到复习页面
        window.location.href = '/review';
        break;
      case 'achievement_unlocked':
        // 跳转到成就页面
        window.location.href = '/profile/achievements';
        break;
      default:
        // 跳转到通知中心
        window.location.href = '/notifications';
    }
  }

  /**
   * 格式化通知列表
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的通知列表数据
   * @private
   */
  _formatNotificationList(apiData) {
    const notifications = (apiData.notifications || apiData).map(notification => 
      this._formatNotification(notification)
    );
    
    const pagination = {
      page: apiData.page || 1,
      pageSize: apiData.page_size || apiData.limit || 20,
      total: apiData.total || apiData.total_count || 0,
      totalPages: apiData.total_pages || Math.ceil((apiData.total || 0) / (apiData.page_size || 20))
    };
    
    return { notifications, pagination };
  }

  /**
   * 格式化单个通知
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的通知
   * @private
   */
  _formatNotification(apiData) {
    const notification = apiData.notification || apiData;
    
    return {
      id: notification.id || notification.notification_id,
      type: notification.type,
      title: notification.title,
      message: notification.message || notification.content,
      icon: notification.icon_url || notification.icon,
      image: notification.image_url || notification.image,
      read: notification.read || false,
      readAt: formatDate(notification.read_at || notification.readAt),
      createdAt: formatDate(notification.created_at || notification.createdAt),
      relativeTime: formatRelativeTime(notification.created_at || notification.createdAt),
      actionUrl: notification.action_url || notification.actionUrl,
      targetType: notification.target_type || notification.targetType,
      targetId: notification.target_id || notification.targetId,
      metadata: notification.metadata || {}
    };
  }

  /**
   * 格式化标记为已读结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的结果
   * @private
   */
  _formatMarkAsReadResult(apiData) {
    return {
      success: apiData.success || false,
      message: apiData.message || '',
      notificationId: apiData.notification_id || apiData.id,
      readAt: formatDate(apiData.read_at || apiData.readAt)
    };
  }

  /**
   * 格式化标记所有为已读结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的结果
   * @private
   */
  _formatMarkAllResult(apiData) {
    return {
      success: apiData.success || false,
      message: apiData.message || '',
      markedCount: apiData.marked_count || apiData.count || 0,
      timestamp: formatDate(apiData.timestamp || apiData.updated_at)
    };
  }

  /**
   * 格式化批量操作结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的结果
   * @private
   */
  _formatBatchResult(apiData) {
    return {
      success: apiData.success || false,
      message: apiData.message || '',
      processedCount: apiData.processed_count || apiData.count || 0,
      failedCount: apiData.failed_count || 0,
      failedItems: apiData.failed_items || []
    };
  }

  /**
   * 格式化清除所有结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的结果
   * @private
   */
  _formatClearAllResult(apiData) {
    return {
      success: apiData.success || false,
      message: apiData.message || '',
      clearedCount: apiData.cleared_count || apiData.count || 0,
      timestamp: formatDate(apiData.timestamp || apiData.cleared_at)
    };
  }

  /**
   * 格式化通知设置
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的通知设置
   * @private
   */
  _formatNotificationSettings(apiData) {
    const settings = apiData.settings || apiData;
    
    return {
      email: settings.email || false,
      push: settings.push || false,
      desktop: settings.desktop || false,
      frequency: settings.frequency || 'immediate',
      quietHours: settings.quiet_hours || settings.quietHours || {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      types: settings.types || {
        document_shared: true,
        review_reminder: true,
        achievement_unlocked: true,
        system_update: true,
        promotional: false
      },
      updatedAt: formatDate(settings.updated_at || settings.updatedAt)
    };
  }

  /**
   * 格式化通知统计
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的通知统计
   * @private
   */
  _formatNotificationStats(apiData) {
    const stats = apiData.stats || apiData;
    
    return {
      totalNotifications: stats.total_notifications || stats.totalNotifications || 0,
      unreadCount: stats.unread_count || stats.unreadCount || 0,
      readRate: stats.read_rate || stats.readRate || 0,
      formattedReadRate: formatPercentage(stats.read_rate || 0, 100, 1), // Assuming formatPercentage is defined elsewhere
      byType: stats.by_type || stats.byType || {},
      byDay: stats.by_day || stats.byDay || {},
      averageDailyNotifications: stats.average_daily_notifications || stats.averageDailyNotifications || 0,
      lastNotificationAt: formatDate(stats.last_notification_at || stats.lastNotificationAt)
    };
  }

  /**
   * 处理获取通知列表错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetNotificationsError(error) {
    let message = '获取通知列表失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看通知';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        default:
          message = `获取失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取未读计数错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetUnreadCountError(error) {
    console.error('获取未读通知数量失败:', error);
    // 不显示错误提示，因为这不是关键功能
  }

  /**
   * 处理标记为已读错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 通知ID
   * @private
   */
  _handleMarkAsReadError(error, id) {
    let message = `标记通知为已读失败 (ID: ${id})`;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限标记通知';
          break;
        case 404:
          message = '通知不存在';
          break;
        default:
          message = `标记失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理标记所有为已读错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleMarkAllAsReadError(error) {
    let message = '标记所有通知为已读失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限标记通知';
          break;
        case 429:
          message = '操作过于频繁，请稍后再试';
          break;
        default:
          message = `标记失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理删除通知错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 通知ID
   * @private
   */
  _handleDeleteNotificationError(error, id) {
    let message = `删除通知失败 (ID: ${id})`;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限删除通知';
          break;
        case 404:
          message = '通知不存在';
          break;
        default:
          message = `删除失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理批量删除错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleBatchDeleteError(error) {
    let message = '批量删除通知失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '删除数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限删除通知';
          break;
        case 429:
          message = '操作过于频繁，请稍后再试';
          break;
        default:
          message = `删除失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取设置错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetSettingsError(error) {
    console.error('获取通知设置失败:', error);
    showError('获取通知设置失败');
  }

  /**
   * 处理更新设置错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleUpdateSettingsError(error) {
    let message = '更新通知设置失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '设置数据无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新设置';
          break;
        case 422:
          message = '数据验证失败';
          break;
        default:
          message = `更新失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取统计错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetStatsError(error) {
    console.error('获取通知统计失败:', error);
    showError('获取通知统计失败');
  }

  /**
   * 处理清除所有错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleClearAllError(error) {
    let message = '清除所有通知失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限清除通知';
          break;
        case 429:
          message = '操作过于频繁，请稍后再试';
          break;
        default:
          message = `清除失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }
}

// 创建单例实例
const notificationService = new NotificationService();

// 导出实例
export default notificationService;