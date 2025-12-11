// src/services/onboarding.service.js
// 功能：引导页状态管理

import userService from './user.service';
import settingsService from './settings.service';
import { useAuthStore } from '@/stores/auth.store';
import { showError, showSuccess, showInfo } from '@/utils/notify';
import { formatDate } from '@/utils/formatter';

class OnboardingService {
  constructor() {
    this.authStore = useAuthStore();
    this.localStorageKey = 'readmemo_onboarding';
    this.localStorageFirstLaunchKey = 'readmemo_first_launch';
    this.localStorageOnboardingDataKey = 'readmemo_onboarding_data';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小时缓存
  }

  /**
   * 检查用户是否已完成引导
   * @returns {Promise<boolean>} 是否已完成引导
   */
  async checkOnboardingStatus() {
    try {
      // 1. 检查缓存
      const cached = this._getFromCache('onboarding_status');
      if (cached !== undefined) {
        return cached;
      }

      // 2. 如果用户已登录，检查服务器上的用户偏好设置
      if (this.authStore.isAuthenticated) {
        try {
          const userProfile = await userService.getUserProfile();
          
          // 检查用户偏好设置中是否有引导完成标记
          if (userProfile.preferences && userProfile.preferences.onboardingCompleted) {
            // 更新本地存储以保持同步
            this._setLocalOnboardingStatus(true);
            this._setToCache('onboarding_status', true);
            return true;
          }
        } catch (error) {
          console.warn('获取服务器引导状态失败，使用本地状态:', error);
        }
      }
      
      // 3. 检查本地存储
      const localStatus = this._getLocalOnboardingStatus();
      this._setToCache('onboarding_status', localStatus);
      return localStatus;
    } catch (error) {
      console.error('检查引导状态失败:', error);
      // 出错时返回本地存储状态
      return this._getLocalOnboardingStatus();
    }
  }

  /**
   * 标记引导完成
   * @param {Object} [options] - 选项
   * @param {boolean} [options.silent=false] - 是否静默模式（不显示通知）
   * @returns {Promise<boolean>} 是否成功标记
   */
  async markOnboardingCompleted(options = {}) {
    const { silent = false } = options;
    
    try {
      // 1. 更新本地存储
      this._setLocalOnboardingStatus(true);
      
      // 2. 记录引导完成数据
      const onboardingData = {
        completed: true,
        completedAt: new Date().toISOString(),
        appVersion: this._getAppVersion(),
        deviceInfo: this._getDeviceInfo()
      };
      this._setLocalOnboardingData(onboardingData);
      
      // 3. 如果用户已登录，更新服务器上的用户偏好设置
      if (this.authStore.isAuthenticated) {
        try {
          // 更新用户偏好设置
          await userService.updateUserPreferences({
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
            lastOnboardingVersion: this._getAppVersion()
          });
          
          // 更新应用设置中的首次使用标记
          await settingsService.updateSettings({
            firstLaunchCompleted: true,
            firstLaunchDate: new Date().toISOString()
          });
          
          console.log('引导完成状态已同步到服务器');
        } catch (serverError) {
          console.warn('同步引导状态到服务器失败，但本地已保存:', serverError);
          // 即使服务器更新失败，本地状态也已保存，所以不抛出错误
        }
      }
      
      // 4. 记录首次启动完成
      this._markFirstLaunchCompleted();
      
      // 5. 清除缓存
      this.cache.delete('onboarding_status');
      
      // 6. 显示成功通知（如果不是静默模式）
      if (!silent) {
        showSuccess('欢迎使用阅记星！开始你的英语学习之旅吧！');
      }
      
      return true;
    } catch (error) {
      console.error('标记引导完成失败:', error);
      if (!silent) {
        showError('保存引导状态失败');
      }
      return false;
    }
  }

  /**
   * 重置引导状态（用于测试）
   * @param {Object} [options] - 选项
   * @param {boolean} [options.clearServerData=false] - 是否清除服务器数据
   * @returns {Promise<boolean>} 是否成功重置
   */
  async resetOnboarding(options = {}) {
    const { clearServerData = false } = options;
    
    try {
      // 1. 清除本地存储中的引导状态
      localStorage.removeItem(this.localStorageKey);
      localStorage.removeItem(this.localStorageFirstLaunchKey);
      localStorage.removeItem(this.localStorageOnboardingDataKey);
      
      // 2. 清除缓存
      this.cache.clear();
      
      // 3. 如果用户已登录且需要清除服务器数据，清除服务器上的引导标记
      if (this.authStore.isAuthenticated && clearServerData) {
        try {
          await userService.updateUserPreferences({
            onboardingCompleted: false,
            onboardingCompletedAt: null,
            lastOnboardingVersion: null
          });
          
          await settingsService.updateSettings({
            firstLaunchCompleted: false,
            firstLaunchDate: null
          });
          
          console.log('引导状态已在服务器重置');
        } catch (serverError) {
          console.warn('重置服务器引导状态失败:', serverError);
        }
      }
      
      showInfo('引导状态已重置，下次启动将显示引导页');
      return true;
    } catch (error) {
      console.error('重置引导状态失败:', error);
      showError('重置引导状态失败');
      return false;
    }
  }

  /**
   * 检查是否是首次启动应用
   * @returns {boolean} 是否是首次启动
   */
  isFirstLaunch() {
    try {
      const firstLaunch = localStorage.getItem(this.localStorageFirstLaunchKey);
      return firstLaunch === null;
    } catch (error) {
      console.error('检查首次启动状态失败:', error);
      return true; // 如果出错，假设是首次启动
    }
  }

  /**
   * 获取引导配置（引导页的内容和顺序）
   * @returns {Array} 引导页配置数组
   */
  getOnboardingConfig() {
    return [
      {
        id: 'welcome',
        title: '欢迎来到阅记星！',
        description: '你的智能英语学习伴侣，让英语学习变得简单有趣',
        icon: '🎉',
        image: null,
        color: '#FF6B8B', // 粉色
        buttonText: '开始探索',
        features: ['智能阅读', '单词记忆', '科学复习']
      },
      {
        id: 'ocr',
        title: 'OCR数字化',
        description: '拍照上传纸质文档，智能转换为可编辑文本，告别手动输入',
        icon: '📸',
        image: null,
        color: '#118AB2', // 蓝色
        buttonText: '下一步',
        features: ['拍照识别', '文字提取', '格式保留']
      },
      {
        id: 'lookup',
        title: '即点即查',
        description: '点击任何单词，立即查看释义、发音和例句，学习更高效',
        icon: '🔍',
        image: null,
        color: '#06D6A0', // 绿色
        buttonText: '下一步',
        features: ['实时翻译', '发音示范', '语境例句']
      },
      {
        id: 'vocabulary',
        title: '智能生词本',
        description: '自动收集生词，根据记忆曲线智能安排复习，记忆更牢固',
        icon: '📚',
        image: null,
        color: '#FFD166', // 黄色
        buttonText: '下一步',
        features: ['自动收集', '智能分类', '进度跟踪']
      },
      {
        id: 'review',
        title: '科学复习系统',
        description: '基于艾宾浩斯记忆曲线，帮你高效记忆单词，告别遗忘',
        icon: '🧠',
        image: null,
        color: '#9C27B0', // 紫色
        buttonText: '立即体验',
        features: ['记忆曲线', '智能提醒', '效果评估']
      }
    ];
  }

  /**
   * 获取引导页总数
   * @returns {number} 引导页总数
   */
  getOnboardingPageCount() {
    return this.getOnboardingConfig().length;
  }

  /**
   * 获取特定引导页配置
   * @param {number} index - 引导页索引
   * @returns {Object|null} 引导页配置或null
   */
  getOnboardingPage(index) {
    const config = this.getOnboardingConfig();
    if (index >= 0 && index < config.length) {
      return config[index];
    }
    return null;
  }

  /**
   * 获取引导统计数据
   * @returns {Promise<Object>} 引导统计数据
   */
  async getOnboardingStats() {
    try {
      // 检查缓存
      const cached = this._getFromCache('onboarding_stats');
      if (cached !== undefined) {
        return cached;
      }

      const stats = {
        totalUsersCompleted: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        lastUpdated: null
      };

      // 如果是已登录用户，尝试从服务器获取统计数据
      if (this.authStore.isAuthenticated) {
        try {
          // 这里可以调用API获取全局统计数据
          // const response = await api.getOnboardingStats();
          // stats = response.data;
          
          // 暂时使用模拟数据
          stats.totalUsersCompleted = 12543;
          stats.averageCompletionTime = 2.5; // 分钟
          stats.completionRate = 87.5; // 百分比
          stats.lastUpdated = new Date().toISOString();
        } catch (error) {
          console.warn('获取服务器引导统计数据失败:', error);
        }
      }

      // 获取本地数据
      const localData = this._getLocalOnboardingData();
      if (localData) {
        stats.localCompletionTime = this._calculateCompletionTime(localData);
        stats.localCompletedAt = localData.completedAt;
      }

      this._setToCache('onboarding_stats', stats);
      return stats;
    } catch (error) {
      console.error('获取引导统计数据失败:', error);
      return {
        totalUsersCompleted: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        lastUpdated: null
      };
    }
  }

  /**
   * 检查是否需要显示引导页
   * @returns {Promise<boolean>} 是否需要显示引导页
   */
  async shouldShowOnboarding() {
    // 1. 检查是否是首次启动
    if (this.isFirstLaunch()) {
      return true;
    }
    
    // 2. 检查是否已完成引导
    const completed = await this.checkOnboardingStatus();
    return !completed;
  }

  /**
   * 跳过引导
   * @param {Object} [options] - 选项
   * @param {string} [options.reason] - 跳过原因
   * @returns {Promise<boolean>} 是否成功跳过
   */
  async skipOnboarding(options = {}) {
    const { reason = 'user_skipped' } = options;
    
    try {
      // 记录跳过原因
      const skipData = {
        skipped: true,
        skippedAt: new Date().toISOString(),
        reason: reason,
        appVersion: this._getAppVersion()
      };
      this._setLocalOnboardingData({ ...skipData, completed: false });
      
      // 标记引导完成（用户选择跳过）
      const result = await this.markOnboardingCompleted({ silent: true });
      
      if (result) {
        showInfo('已跳过引导，你可以随时在设置中重新查看功能介绍');
        
        // 记录分析事件（如果有分析服务）
        this._trackOnboardingEvent('skipped', { reason });
      }
      
      return result;
    } catch (error) {
      console.error('跳过引导失败:', error);
      showError('跳过引导失败');
      return false;
    }
  }

  /**
   * 获取引导进度
   * @returns {Promise<Object>} 引导进度
   */
  async getOnboardingProgress() {
    try {
      const localData = this._getLocalOnboardingData();
      const status = await this.checkOnboardingStatus();
      
      return {
        completed: status,
        lastPageViewed: localData?.lastPageViewed || 0,
        totalPages: this.getOnboardingPageCount(),
        startedAt: localData?.startedAt,
        completedAt: localData?.completedAt,
        skipped: localData?.skipped || false,
        skipReason: localData?.reason
      };
    } catch (error) {
      console.error('获取引导进度失败:', error);
      return {
        completed: false,
        lastPageViewed: 0,
        totalPages: this.getOnboardingPageCount(),
        startedAt: null,
        completedAt: null,
        skipped: false,
        skipReason: null
      };
    }
  }

  /**
   * 保存引导进度（记录当前查看的页面）
   * @param {number} pageIndex - 当前页面索引
   * @returns {Promise<boolean>} 是否成功保存
   */
  async saveOnboardingProgress(pageIndex) {
    try {
      const currentData = this._getLocalOnboardingData() || {};
      const updatedData = {
        ...currentData,
        lastPageViewed: pageIndex,
        updatedAt: new Date().toISOString()
      };
      
      // 如果是第一次记录，添加开始时间
      if (!currentData.startedAt) {
        updatedData.startedAt = new Date().toISOString();
      }
      
      this._setLocalOnboardingData(updatedData);
      return true;
    } catch (error) {
      console.error('保存引导进度失败:', error);
      return false;
    }
  }

  /**
   * 检查是否需要显示新功能引导
   * @param {string} featureId - 功能ID
   * @returns {Promise<boolean>} 是否需要显示
   */
  async shouldShowFeatureGuide(featureId) {
    try {
      const userProfile = await userService.getUserProfile();
      const lastVersion = userProfile.preferences?.lastOnboardingVersion;
      const currentVersion = this._getAppVersion();
      
      // 如果用户从未完成引导，或者版本不同，显示新功能引导
      if (!lastVersion || lastVersion !== currentVersion) {
        return true;
      }
      
      // 检查特定功能是否已显示过
      const shownFeatures = userProfile.preferences?.shownFeatureGuides || [];
      return !shownFeatures.includes(featureId);
    } catch (error) {
      console.error('检查功能引导状态失败:', error);
      return true; // 出错时默认显示
    }
  }

  /**
   * 标记功能引导已显示
   * @param {string} featureId - 功能ID
   * @returns {Promise<boolean>} 是否成功标记
   */
  async markFeatureGuideShown(featureId) {
    try {
      if (this.authStore.isAuthenticated) {
        const userProfile = await userService.getUserProfile();
        const shownFeatures = userProfile.preferences?.shownFeatureGuides || [];
        
        if (!shownFeatures.includes(featureId)) {
          shownFeatures.push(featureId);
          
          await userService.updateUserPreferences({
            shownFeatureGuides: shownFeatures,
            lastOnboardingVersion: this._getAppVersion()
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('标记功能引导失败:', error);
      return false;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取本地存储中的引导状态
   * @returns {boolean} 本地引导状态
   * @private
   */
  _getLocalOnboardingStatus() {
    try {
      const status = localStorage.getItem(this.localStorageKey);
      return status === 'completed';
    } catch (error) {
      console.error('读取本地存储失败:', error);
      return false;
    }
  }

  /**
   * 设置本地存储中的引导状态
   * @param {boolean} completed - 是否完成
   * @private
   */
  _setLocalOnboardingStatus(completed) {
    try {
      if (completed) {
        localStorage.setItem(this.localStorageKey, 'completed');
      } else {
        localStorage.removeItem(this.localStorageKey);
      }
    } catch (error) {
      console.error('写入本地存储失败:', error);
    }
  }

  /**
   * 标记首次启动已完成
   * @private
   */
  _markFirstLaunchCompleted() {
    try {
      localStorage.setItem(this.localStorageFirstLaunchKey, 'completed');
    } catch (error) {
      console.error('标记首次启动失败:', error);
    }
  }

  /**
   * 获取本地引导数据
   * @returns {Object|null} 引导数据
   * @private
   */
  _getLocalOnboardingData() {
    try {
      const data = localStorage.getItem(this.localStorageOnboardingDataKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('读取本地引导数据失败:', error);
      return null;
    }
  }

  /**
   * 设置本地引导数据
   * @param {Object} data - 引导数据
   * @private
   */
  _setLocalOnboardingData(data) {
    try {
      localStorage.setItem(this.localStorageOnboardingDataKey, JSON.stringify(data));
    } catch (error) {
      console.error('写入本地引导数据失败:', error);
    }
  }

  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @returns {any|undefined} 缓存的数据或undefined
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    
    const { data, timestamp } = cached;
    const now = Date.now();
    
    if (now - timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return data;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   * @private
   */
  _setToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取应用版本
   * @returns {string} 应用版本
   * @private
   */
  _getAppVersion() {
    // 可以从package.json或环境变量中获取
    return process.env.VUE_APP_VERSION || '1.0.0';
  }

  /**
   * 获取设备信息
   * @returns {Object} 设备信息
   * @private
   */
  _getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio
    };
  }

  /**
   * 计算完成时间
   * @param {Object} data - 引导数据
   * @returns {number} 完成时间（分钟）
   * @private
   */
  _calculateCompletionTime(data) {
    if (!data.startedAt || !data.completedAt) {
      return 0;
    }
    
    const startTime = new Date(data.startedAt).getTime();
    const endTime = new Date(data.completedAt).getTime();
    const durationMs = endTime - startTime;
    
    return Math.round(durationMs / (1000 * 60) * 10) / 10; // 转换为分钟，保留一位小数
  }

  /**
   * 跟踪引导事件
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   * @private
   */
  _trackOnboardingEvent(event, data = {}) {
    // 这里可以集成分析服务，如Google Analytics、Mixpanel等
    console.log(`引导事件: ${event}`, data);
    
    // 示例：发送到分析服务
    // if (window.gtag) {
    //   window.gtag('event', event, {
    //     event_category: 'onboarding',
    //     ...data
    //   });
    // }
  }

  /**
   * 清除所有缓存
   * @private
   */
  _clearAllCache() {
    this.cache.clear();
  }
}

// 创建单例实例
const onboardingService = new OnboardingService();

export default onboardingService;