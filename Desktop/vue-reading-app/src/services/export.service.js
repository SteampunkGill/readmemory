// src/services/export.service.js
import { api } from '@/api/export';
import { useExportStore } from '@/stores/export.store';
import { useDocumentStore } from '@/stores/document.store';
import { useVocabularyStore } from '@/stores/vocabulary.store';
import { useReviewStore } from '@/stores/review.store';
import { useUserStore } from '@/stores/user.store';
import { showError, showSuccess, showInfo } from '@/utils/notify';
import { formatDate } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';

class ExportService {
  constructor() {
    this.exportStore = useExportStore();
    this.documentStore = useDocumentStore();
    this.vocabularyStore = useVocabularyStore();
    this.reviewStore = useReviewStore();
    this.userStore = useUserStore();
    
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30分钟缓存
    
    this.cacheKeys = {
      EXPORT_HISTORY: 'export_history_',
      EXPORT_TEMPLATES: 'export_templates',
      EXPORT_FORMATS: 'export_formats'
    };
    
    // 导出格式定义
    this.exportFormats = {
      PDF: 'pdf',
      DOCX: 'docx',
      XLSX: 'xlsx',
      CSV: 'csv',
      JSON: 'json',
      HTML: 'html',
      TXT: 'txt',
      ZIP: 'zip' // 添加ZIP格式
    };
    
    // 导出类型定义
    this.exportTypes = {
      DOCUMENTS: 'documents',
      VOCABULARY: 'vocabulary',
      REVIEWS: 'reviews',
      NOTES: 'notes',
      HIGHLIGHTS: 'highlights',
      STATISTICS: 'statistics',
      ALL: 'all'
    };
  }

  /**
   * 导出文档
   * @param {Object} options - 导出选项
   * @param {Array} options.documentIds - 文档ID数组
   * @param {string} options.format - 导出格式
   * @param {Object} options.template - 导出模板
   * @param {boolean} options.includeNotes - 是否包含笔记
   * @param {boolean} options.includeHighlights - 是否包含高亮
   * @returns {Promise<Blob>} 导出的文件
   */
  async exportDocuments(options = {}) {
    try {
      const {
        documentIds = [],
        format = this.exportFormats.PDF,
        template = null,
        includeNotes = true,
        includeHighlights = true
      } = options;

      // 1. 参数验证
      this._validateExportOptions(options, this.exportTypes.DOCUMENTS);

      // 2. 显示导出开始提示
      showInfo('正在准备导出文档，请稍候...');

      // 3. API调用
      const response = await api.exportDocuments({
        documentIds,
        format,
        template,
        includeNotes,
        includeHighlights
      });

      // 4. 创建下载链接
      const blob = new Blob([response.data], {
        type: this._getMimeType(format)
      });

      const filename = this._generateFilename('documents', format);
      this._downloadFile(blob, filename);

      // 5. 记录导出历史
      await this._recordExportHistory({
        type: this.exportTypes.DOCUMENTS,
        format,
        itemCount: documentIds.length,
        filename
      });

      // 6. 显示成功通知
      showSuccess(`文档导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '导出文档失败');
      throw error;
    }
  }

  /**
   * 导出词汇
   * @param {Object} options - 导出选项
   * @param {Array} options.vocabularyIds - 词汇ID数组
   * @param {string} options.format - 导出格式
   * @param {Object} options.template - 导出模板
   * @param {boolean} options.includeExamples - 是否包含例句
   * @param {boolean} options.includeStatistics - 是否包含统计
   * @returns {Promise<Blob>} 导出的文件
   */
  async exportVocabulary(options = {}) {
    try {
      const {
        vocabularyIds = [],
        format = this.exportFormats.XLSX,
        template = null,
        includeExamples = true,
        includeStatistics = true
      } = options;

      // 1. 参数验证
      this._validateExportOptions(options, this.exportTypes.VOCABULARY);

      // 2. 显示导出开始提示
      showInfo('正在准备导出词汇，请稍候...');

      // 3. API调用
      const response = await api.exportVocabulary({
        vocabularyIds,
        format,
        template,
        includeExamples,
        includeStatistics
      });

      // 4. 创建下载链接
      const blob = new Blob([response.data], {
        type: this._getMimeType(format)
      });

      const filename = this._generateFilename('vocabulary', format);
      this._downloadFile(blob, filename);

      // 5. 记录导出历史
      await this._recordExportHistory({
        type: this.exportTypes.VOCABULARY,
        format,
        itemCount: vocabularyIds.length,
        filename
      });

      // 6. 显示成功通知
      showSuccess(`词汇导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '导出词汇失败');
      throw error;
    }
  }

  /**
   * 导出复习记录
   * @param {Object} options - 导出选项
   * @param {Array} options.reviewIds - 复习记录ID数组
   * @param {string} options.format - 导出格式
   * @param {Object} options.template - 导出模板
   * @param {string} options.dateRange - 日期范围
   * @returns {Promise<Blob>} 导出的文件
   */
  async exportReviews(options = {}) {
    try {
      const {
        reviewIds = [],
        format = this.exportFormats.CSV,
        template = null,
        dateRange = null
      } = options;

      // 1. 参数验证
      this._validateExportOptions(options, this.exportTypes.REVIEWS);

      // 2. 显示导出开始提示
      showInfo('正在准备导出复习记录，请稍候...');

      // 3. API调用
      const response = await api.exportReviews({
        reviewIds,
        format,
        template,
        dateRange
      });

      // 4. 创建下载链接
      const blob = new Blob([response.data], {
        type: this._getMimeType(format)
      });

      const filename = this._generateFilename('reviews', format);
      this._downloadFile(blob, filename);

      // 5. 记录导出历史
      await this._recordExportHistory({
        type: this.exportTypes.REVIEWS,
        format,
        itemCount: reviewIds.length,
        filename
      });

      // 6. 显示成功通知
      showSuccess(`复习记录导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '导出复习记录失败');
      throw error;
    }
  }

  /**
   * 导出学习统计
   * @param {Object} options - 导出选项
   * @param {string} options.format - 导出格式
   * @param {Object} options.template - 导出模板
   * @param {string} options.dateRange - 日期范围
   * @param {boolean} options.includeCharts - 是否包含图表
   * @returns {Promise<Blob>} 导出的文件
   */
  async exportStatistics(options = {}) {
    try {
      const {
        format = this.exportFormats.PDF,
        template = null,
        dateRange = 'all',
        includeCharts = true
      } = options;

      // 1. 参数验证
      this._validateExportOptions(options, this.exportTypes.STATISTICS);

      // 2. 显示导出开始提示
      showInfo('正在准备导出学习统计，请稍候...');

      // 3. API调用
      const response = await api.exportStatistics({
        format,
        template,
        dateRange,
        includeCharts
      });

      // 4. 创建下载链接
      const blob = new Blob([response.data], {
        type: this._getMimeType(format)
      });

      const filename = this._generateFilename('statistics', format);
      this._downloadFile(blob, filename);

      // 5. 记录导出历史
      await this._recordExportHistory({
        type: this.exportTypes.STATISTICS,
        format,
        itemCount: 1,
        filename
      });

      // 6. 显示成功通知
      showSuccess(`学习统计导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '导出学习统计失败');
      throw error;
    }
  }

  /**
   * 批量导出多种类型数据
   * @param {Object} options - 导出选项
   * @param {Array} options.types - 导出类型数组
   * @param {string} options.format - 导出格式
   * @param {Object} options.template - 导出模板
   * @returns {Promise<Blob>} 导出的文件（ZIP格式）
   */
  async batchExport(options = {}) {
    try {
      const {
        types = [this.exportTypes.DOCUMENTS, this.exportTypes.VOCABULARY],
        format = this.exportFormats.ZIP,
        template = null
      } = options;

      // 1. 参数验证
      this._validateBatchExportOptions(options);

      // 2. 显示导出开始提示
      showInfo('正在准备批量导出，请稍候...');

      // 3. API调用
      const response = await api.batchExport({
        types,
        format,
        template
      });

      // 4. 创建下载链接
      const blob = new Blob([response.data], {
        type: 'application/zip'
      });

      const filename = this._generateFilename('batch_export', 'zip');
      this._downloadFile(blob, filename);

      // 5. 记录导出历史
      await this._recordExportHistory({
        type: 'batch',
        format: 'zip',
        itemCount: types.length,
        filename
      });

      // 6. 显示成功通知
      showSuccess(`批量导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '批量导出失败');
      throw error;
    }
  }

  /**
   * 导出所有数据（完整备份）
   * @param {Object} options - 导出选项
   * @param {string} options.format - 导出格式
   * @param {boolean} options.encrypt - 是否加密
   * @returns {Promise<Blob>} 导出的文件
   */
  async exportAllData(options = {}) {
    try {
      const {
        format = this.exportFormats.JSON,
        encrypt = false
      } = options;

      // 1. 确认导出
      const confirmed = await this._confirmFullExport();
      if (!confirmed) {
        return null;
      }

      // 2. 显示导出开始提示
      showInfo('正在准备完整数据导出，这可能需要一些时间，请稍候...');

      // 3. API调用
      const response = await api.exportAllData({
        format,
        encrypt
      });

      // 4. 创建下载链接
      const blob = new Blob([response.data], {
        type: this._getMimeType(format)
      });

      const filename = this._generateFilename('full_backup', format);
      this._downloadFile(blob, filename);

      // 5. 记录导出历史
      await this._recordExportHistory({
        type: this.exportTypes.ALL,
        format,
        itemCount: 1,
        filename,
        isBackup: true
      });

      // 6. 显示成功通知
      showSuccess(`完整数据导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '完整数据导出失败');
      throw error;
    }
  }

  /**
   * 获取导出历史
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {string} options.sortBy - 排序字段
   * @param {string} options.sortOrder - 排序顺序
   * @returns {Promise<Object>} 导出历史列表
   */
  async getExportHistory(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // 1. 生成缓存键
      const cacheKey = `${this.cacheKeys.EXPORT_HISTORY}${page}_${pageSize}_${sortBy}_${sortOrder}`;

      // 2. 检查缓存
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 3. API调用
      const response = await api.getExportHistory({
        page,
        pageSize,
        sortBy,
        sortOrder
      });

      // 4. 数据格式化
      const history = this._formatExportHistory(response.data);

      // 5. 更新Store
      this.exportStore.setExportHistory(history.items);

      // 6. 设置缓存
      this._setToCache(cacheKey, history);

      return history;
    } catch (error) {
      this._handleError(error, '获取导出历史失败');
      // 返回空历史作为降级
      return this._getEmptyExportHistory();
    }
  }

  /**
   * 获取导出模板
   * @returns {Promise<Array>} 导出模板列表
   */
  async getExportTemplates() {
    try {
      // 1. 检查缓存
      const cached = this._getFromCache(this.cacheKeys.EXPORT_TEMPLATES);
      if (cached) {
        return cached;
      }

      // 2. API调用
      const response = await api.getExportTemplates();

      // 3. 数据格式化
      const templates = this._formatExportTemplates(response.data);

      // 4. 设置缓存
      this._setToCache(this.cacheKeys.EXPORT_TEMPLATES, templates);

      return templates;
    } catch (error) {
      console.warn('获取导出模板失败，使用默认模板:', error);
      // 返回默认模板作为降级
      return this._getDefaultTemplates();
    }
  }

  /**
   * 获取支持的导出格式
   * @param {string} exportType - 导出类型
   * @returns {Promise<Array>} 支持的格式列表
   */
  async getSupportedFormats(exportType) {
    try {
      const cacheKey = `${this.cacheKeys.EXPORT_FORMATS}_${exportType}`;
      
      // 1. 检查缓存
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 2. API调用
      const response = await api.getSupportedFormats({ exportType }); // 将参数改为对象

      // 3. 数据格式化
      const formats = this._formatSupportedFormats(response.data);

      // 4. 设置缓存
      this._setToCache(cacheKey, formats);

      return formats;
    } catch (error) {
      console.warn('获取支持的导出格式失败，使用默认格式:', error);
      // 返回默认格式作为降级
      return this._getDefaultFormats(exportType);
    }
  }

  /**
   * 创建导出模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<Object>} 创建的模板
   */
  async createExportTemplate(templateData) {
    try {
      // 1. 参数验证
      this._validateTemplateData(templateData);

      // 2. API调用
      const response = await api.createExportTemplate(templateData);

      // 3. 数据格式化
      const template = this._formatExportTemplate(response.data);

      // 4. 清除模板缓存
      this.cache.delete(this.cacheKeys.EXPORT_TEMPLATES);

      // 5. 显示成功通知
      showSuccess('导出模板创建成功');

      return template;
    } catch (error) {
      this._handleError(error, '创建导出模板失败');
      throw error;
    }
  }

  /**
   * 删除导出历史记录
   * @param {string} historyId - 历史记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteExportHistory(historyId) {
    try {
      if (!historyId) {
        throw new Error('历史记录ID不能为空');
      }

      // 1. API调用
      await api.deleteExportHistory({ historyId }); // 将参数改为对象

      // 2. 更新Store
      this.exportStore.removeExportHistory(historyId);

      // 3. 清除缓存
      this._clearExportHistoryCache();

      // 4. 显示成功通知
      showSuccess('导出历史记录已删除');

      return true;
    } catch (error) {
      this._handleError(error, '删除导出历史记录失败');
      throw error;
    }
  }

  /**
   * 导出为Anki卡片格式
   * @param {Object} options - 导出选项
   * @returns {Promise<Blob>} 导出的Anki包文件
   */
  async exportToAnki(options = {}) {
    try {
      const {
        vocabularyIds = [],
        deckName = '语言学习',
        includeAudio = true,
        includeImages = true
      } = options;

      // 1. 显示导出开始提示
      showInfo('正在准备Anki卡片导出，请稍候...');

      // 2. API调用
      const response = await api.exportToAnki({
        vocabularyIds,
        deckName,
        includeAudio,
        includeImages
      });

      // 3. 创建下载链接
      const blob = new Blob([response.data], {
        type: 'application/apkg'
      });

      const filename = `anki_${deckName}_${Date.now()}.apkg`;
      this._downloadFile(blob, filename);

      // 4. 记录导出历史
      await this._recordExportHistory({
        type: 'anki',
        format: 'apkg',
        itemCount: vocabularyIds.length,
        filename
      });

      // 5. 显示成功通知
      showSuccess(`Anki卡片导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '导出Anki卡片失败');
      throw error;
    }
  }

  /**
   * 导出为Excel学习计划
   * @param {Object} options - 导出选项
   * @returns {Promise<Blob>} 导出的Excel文件
   */
  async exportStudyPlan(options = {}) {
    try {
      const {
        startDate = new Date().toISOString().split('T')[0],
        endDate = null,
        dailyGoal = 20,
        includeProgress = true
      } = options;

      // 1. 显示导出开始提示
      showInfo('正在准备学习计划导出，请稍候...');

      // 2. API调用
      const response = await api.exportStudyPlan({
        startDate,
        endDate,
        dailyGoal,
        includeProgress
      });

      // 3. 创建下载链接
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const filename = `study_plan_${startDate}_${endDate || 'ongoing'}.xlsx`;
      this._downloadFile(blob, filename);

      // 4. 记录导出历史
      await this._recordExportHistory({
        type: 'study_plan',
        format: 'xlsx',
        itemCount: 1,
        filename
      });

      // 5. 显示成功通知
      showSuccess(`学习计划导出成功，已下载 ${filename}`);

      return blob;
    } catch (error) {
      this._handleError(error, '导出学习计划失败');
      throw error;
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 验证导出选项
   * @param {Object} options - 导出选项
   * @param {string} exportType - 导出类型
   */
  _validateExportOptions(options, exportType) {
    const validFormats = Object.values(this.exportFormats);
    
    if (options.format && !validFormats.includes(options.format)) {
      throw new Error(`无效的导出格式，必须是: ${validFormats.join(', ')}`);
    }

    switch (exportType) {
      case this.exportTypes.DOCUMENTS:
        if (!options.documentIds || !Array.isArray(options.documentIds)) {
          throw new Error('文档ID必须是数组');
        }
        
        if (options.documentIds.length === 0) {
          throw new Error('请选择要导出的文档');
        }
        
        if (options.documentIds.length > 100) {
          throw new Error('一次最多导出100个文档');
        }
        break;
        
      case this.exportTypes.VOCABULARY:
        if (!options.vocabularyIds || !Array.isArray(options.vocabularyIds)) {
          throw new Error('词汇ID必须是数组');
        }
        
        if (options.vocabularyIds.length === 0) {
          throw new Error('请选择要导出的词汇');
        }
        
        if (options.vocabularyIds.length > 500) {
          throw new Error('一次最多导出500个词汇');
        }
        break;
        
      case this.exportTypes.REVIEWS:
        if (options.reviewIds && !Array.isArray(options.reviewIds)) {
          throw new Error('复习记录ID必须是数组');
        }
        break;
    }
  }

  /**
   * 验证批量导出选项
   * @param {Object} options - 批量导出选项
   */
  _validateBatchExportOptions(options) {
    if (!options.types || !Array.isArray(options.types)) {
      throw new Error('导出类型必须是数组');
    }
    
    if (options.types.length === 0) {
      throw new Error('请选择要导出的类型');
    }
    
    const validTypes = Object.values(this.exportTypes);
    for (const type of options.types) {
      if (!validTypes.includes(type)) {
        throw new Error(`无效的导出类型: ${type}`);
      }
    }
  }

  /**
   * 验证模板数据
   * @param {Object} templateData - 模板数据
   */
  _validateTemplateData(templateData) {
    if (!templateData || typeof templateData !== 'object') {
      throw new Error('模板数据不能为空');
    }
    
    if (!templateData.name || templateData.name.trim() === '') {
      throw new Error('模板名称不能为空');
    }
    
    if (!templateData.type || !Object.values(this.exportTypes).includes(templateData.type)) {
      throw new Error('无效的模板类型');
    }
    
    if (!templateData.format || !Object.values(this.exportFormats).includes(templateData.format)) {
      throw new Error('无效的模板格式');
    }
    
    if (!templateData.config || typeof templateData.config !== 'object') {
      throw new Error('模板配置不能为空');
    }
  }

  /**
   * 获取MIME类型
   * @param {string} format - 文件格式
   * @returns {string} MIME类型
   */
  _getMimeType(format) {
    const mimeMap = {
      [this.exportFormats.PDF]: 'application/pdf',
      [this.exportFormats.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      [this.exportFormats.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [this.exportFormats.CSV]: 'text/csv',
      [this.exportFormats.JSON]: 'application/json',
      [this.exportFormats.HTML]: 'text/html',
      [this.exportFormats.TXT]: 'text/plain'
    };
    
    return mimeMap[format] || 'application/octet-stream';
  }

  /**
   * 生成文件名
   * @param {string} type - 文件类型
   * @param {string} format - 文件格式
   * @returns {string} 文件名
   */
  _generateFilename(type, format) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const extensionMap = {
      [this.exportFormats.PDF]: 'pdf',
      [this.exportFormats.DOCX]: 'docx',
      [this.exportFormats.XLSX]: 'xlsx',
      [this.exportFormats.CSV]: 'csv',
      [this.exportFormats.JSON]: 'json',
      [this.exportFormats.HTML]: 'html',
      [this.exportFormats.TXT]: 'txt',
      [this.exportFormats.ZIP]: 'zip' // 添加ZIP格式的扩展名
    };
    
    const extension = extensionMap[format] || format;
    
    return `${type}_${dateStr}_${timeStr}.${extension}`;
  }

  /**
   * 下载文件
   * @param {Blob} blob - 文件数据
   * @param {string} filename - 文件名
   */
  _downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * 记录导出历史
   * @param {Object} historyData - 历史数据
   * @returns {Promise<void>}
   */
  async _recordExportHistory(historyData) {
    try {
      const history = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: historyData.type,
        format: historyData.format,
        itemCount: historyData.itemCount,
        filename: historyData.filename,
        fileSize: historyData.fileSize || 0,
        isBackup: Boolean(historyData.isBackup),
        userId: this.userStore.user?.id,
        createdAt: new Date().toISOString(),
        metadata: historyData.metadata || {}
      };

      // 保存到Store
      this.exportStore.addExportHistory(history);

      // 保存到IndexedDB（如果可用）
      // 需要确保 IndexedDB 'export_history' store 已创建
      if (window.indexedDB) {
        const dbRequest = indexedDB.open('ExportDB', 1);
        dbRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('export_history')) {
            db.createObjectStore('export_history', { keyPath: 'id' });
          }
        };
        dbRequest.onsuccess = async (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['export_history'], 'readwrite');
          const store = transaction.objectStore('export_history');
          const putRequest = store.put(history);
          putRequest.onsuccess = () => console.log('Export history recorded in IndexedDB');
          putRequest.onerror = (putEvent) => console.warn('Failed to record export history in IndexedDB:', putEvent.target.error);
        };
        dbRequest.onerror = (event) => console.warn('Failed to open ExportDB for recording history:', event.target.error);
      }

      // 清除历史缓存
      this._clearExportHistoryCache();
    } catch (error) {
      console.warn('记录导出历史失败:', error);
    }
  }

  /**
   * 保存到IndexedDB
   * @param {string} storeName - 存储名称
   * @param {Object} data - 要保存的数据
   * @returns {Promise<void>}
   */
  async _saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(); // IndexedDB not available, do nothing
        return;
      }

      const request = indexedDB.open('ExportDB', 1); // Assuming ExportDB is used for history and templates

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const putRequest = store.put(data);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (putEvent) => reject(putEvent.target.error);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * 格式化导出历史
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的导出历史
   */
  _formatExportHistory(apiData) {
    const history = {
      total: Number(apiData.total) || 0,
      page: Number(apiData.page) || 1,
      pageSize: Number(apiData.pageSize) || 20,
      totalPages: Number(apiData.totalPages) || 1,
      items: []
    };

    if (Array.isArray(apiData.items)) {
      history.items = apiData.items.map(item => ({
        id: item.id || '',
        type: item.type || 'unknown',
        format: item.format || '',
        filename: item.filename || '',
        fileSize: this._formatFileSize(Number(item.fileSize) || 0),
        itemCount: Number(item.itemCount) || 0,
        isBackup: Boolean(item.isBackup),
        userId: item.userId || null,
        createdAt: item.createdAt ? formatDate(item.createdAt) : null,
        downloadUrl: item.downloadUrl || null,
        status: item.status || 'completed',
        errorMessage: item.errorMessage || null
      }));
    }

    return history;
  }

  /**
   * 格式化导出模板
   * @param {Array} apiData - API返回的数据
   * @returns {Array} 格式化后的导出模板
   */
  _formatExportTemplates(apiData) {
    if (!Array.isArray(apiData)) {
      return this._getDefaultTemplates();
    }

    return apiData.map(template => ({
      id: template.id || '',
      name: template.name || '未命名模板',
      type: template.type || this.exportTypes.DOCUMENTS,
      format: template.format || this.exportFormats.PDF,
      description: template.description || '',
      config: template.config || {},
      isDefault: Boolean(template.isDefault),
      isPublic: Boolean(template.isPublic !== false),
      createdBy: template.createdBy || null,
      createdAt: template.createdAt ? formatDate(template.createdAt) : null,
      updatedAt: template.updatedAt ? formatDate(template.updatedAt) : null
    }));
  }

  /**
   * 格式化单个模板
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的模板
   */
  _formatExportTemplate(apiData) {
    return {
      id: apiData.id || '',
      name: apiData.name || '未命名模板',
      type: apiData.type || this.exportTypes.DOCUMENTS,
      format: apiData.format || this.exportFormats.PDF,
      description: apiData.description || '',
      config: apiData.config || {},
      isDefault: Boolean(apiData.isDefault),
      isPublic: Boolean(apiData.isPublic !== false),
      createdBy: apiData.createdBy || null,
      createdAt: apiData.createdAt ? formatDate(apiData.createdAt) : null,
      updatedAt: apiData.updatedAt ? formatDate(apiData.updatedAt) : null
    };
  }

  /**
   * 格式化支持的格式
   * @param {Array} apiData - API返回的数据
   * @returns {Array} 格式化后的格式列表
   */
  _formatSupportedFormats(apiData) {
    if (!Array.isArray(apiData)) {
      return this._getDefaultFormats();
    }

    return apiData.map(format => ({
      value: format.value || '',
      label: format.label || format.value,
      description: format.description || '',
      icon: format.icon || 'document',
      mimeType: format.mimeType || this._getMimeType(format.value),
      extensions: format.extensions || [format.value]
    }));
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取默认模板
   * @returns {Array} 默认模板列表
   */
  _getDefaultTemplates() {
    return [
      {
        id: 'default_pdf',
        name: 'PDF标准模板',
        type: this.exportTypes.DOCUMENTS,
        format: this.exportFormats.PDF,
        description: '标准PDF导出模板，包含文档内容和基本格式',
        config: {
          pageSize: 'A4',
          margin: '2cm',
          fontSize: '12pt',
          includeHeader: true,
          includeFooter: true,
          watermark: false
        },
        isDefault: true,
        isPublic: true
      },
      {
        id: 'default_excel',
        name: 'Excel词汇表',
        type: this.exportTypes.VOCABULARY,
        format: this.exportFormats.XLSX,
        description: '词汇导出Excel模板，包含单词、释义和例句',
        config: {
          includePhonetic: true,
          includeExamples: true,
          includeTags: true,
          includeStatistics: false,
          autoFilter: true,
          freezeHeader: true
        },
        isDefault: true,
        isPublic: true
      }
    ];
  }

  /**
   * 获取默认格式
   * @param {string} exportType - 导出类型
   * @returns {Array} 默认格式列表
   */
  _getDefaultFormats(exportType) {
    const allFormats = [
      { value: this.exportFormats.PDF, label: 'PDF文档', icon: 'document' },
      { value: this.exportFormats.DOCX, label: 'Word文档', icon: 'document-text' },
      { value: this.exportFormats.XLSX, label: 'Excel表格', icon: 'table' },
      { value: this.exportFormats.CSV, label: 'CSV文件', icon: 'document-report' },
      { value: this.exportFormats.JSON, label: 'JSON数据', icon: 'code' },
      { value: this.exportFormats.HTML, label: 'HTML网页', icon: 'globe' },
      { value: this.exportFormats.TXT, label: '纯文本', icon: 'document-text' }
    ];

    // 根据导出类型过滤支持的格式
    switch (exportType) {
      case this.exportTypes.DOCUMENTS:
        return allFormats.filter(f => 
          [this.exportFormats.PDF, this.exportFormats.DOCX, this.exportFormats.HTML, this.exportFormats.TXT].includes(f.value)
        );
      case this.exportTypes.VOCABULARY:
        return allFormats.filter(f => 
          [this.exportFormats.XLSX, this.exportFormats.CSV, this.exportFormats.JSON].includes(f.value)
        );
      case this.exportTypes.REVIEWS:
        return allFormats.filter(f => 
          [this.exportFormats.CSV, this.exportFormats.XLSX, this.exportFormats.JSON].includes(f.value)
        );
      case this.exportTypes.STATISTICS:
        return allFormats.filter(f => 
          [this.exportFormats.PDF, this.exportFormats.XLSX].includes(f.value)
        );
      default:
        return allFormats;
    }
  }

  /**
   * 确认完整导出
   * @returns {Promise<boolean>} 用户是否确认
   */
  async _confirmFullExport() {
    return new Promise((resolve) => {
      const message = '完整数据导出将包含您的所有学习数据，文件可能较大。确定要继续吗？';
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存的数据或null
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const now = Date.now();
    
    if (now - timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   */
  _setToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除导出历史缓存
   */
  _clearExportHistoryCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.cacheKeys.EXPORT_HISTORY)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取空导出历史
   * @returns {Object} 空导出历史
   */
  _getEmptyExportHistory() {
    return {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      items: []
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
          message = error.response.data?.message || '导出参数错误';
          break;
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有导出权限';
          break;
        case 404:
          message = '导出资源不存在';
          break;
        case 422:
          message = '导出数据格式错误';
          break;
        case 429:
          message = '导出频率过高，请稍后再试';
          break;
        case 500:
          message = '导出服务暂时不可用';
          break;
        case 503:
          message = '导出服务维护中';
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
const exportService = new ExportService();

export default exportService;