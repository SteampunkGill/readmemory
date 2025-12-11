// src/stores/export.store.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useExportStore = defineStore('export', () => {
  // ==================== 状态定义 ====================
  
  // 导出历史
  const exportHistory = ref([]);
  const historyLoading = ref(false);
  const historyError = ref(null);
  
  // 导出模板
  const exportTemplates = ref([]);
  const templatesLoading = ref(false);
  const templatesError = ref(null);
  
  // 支持的导出格式
  const supportedFormats = ref({});
  const formatsLoading = ref(false);
  const formatsError = ref(null);
  
  // 当前导出任务
  const currentExportTask = ref(null);
  const exportProgress = ref(0);
  const isExporting = ref(false);
  const exportError = ref(null);
  
  // 导出统计
  const exportStats = ref(null);
  const statsLoading = ref(false);
  const statsError = ref(null);
  
  // ==================== 计算属性 ====================
  
  // 导出历史总数
  const totalHistoryCount = computed(() => exportHistory.value.length);
  
  // 最近导出记录
  const recentExports = computed(() => 
    exportHistory.value
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  );
  
  // 导出文件总大小
  const totalExportSize = computed(() => 
    exportHistory.value.reduce((total, item) => total + (item.fileSize || 0), 0)
  );
  
  // 默认模板
  const defaultTemplates = computed(() => 
    exportTemplates.value.filter(template => template.isDefault)
  );
  
  // 用户自定义模板
  const customTemplates = computed(() => 
    exportTemplates.value.filter(template => !template.isDefault)
  );
  
  // 导出任务状态
  const exportStatus = computed(() => {
    if (isExporting.value) {
      return exportProgress.value < 100 ? 'processing' : 'completed';
    }
    return exportError.value ? 'failed' : 'idle';
  });
  
  // ==================== 动作方法 ====================
  
  /**
   * 设置导出历史
   * @param {Array} history - 导出历史数组
   */
  const setExportHistory = (history) => {
    exportHistory.value = Array.isArray(history) ? history : [];
    historyError.value = null;
  };
  
  /**
   * 添加导出历史记录
   * @param {Object} record - 导出记录
   */
  const addExportHistory = (record) => {
    if (record && typeof record === 'object') {
      exportHistory.value.unshift(record);
    }
  };
  
  /**
   * 移除导出历史记录
   * @param {string} historyId - 历史记录ID
   */
  const removeExportHistory = (historyId) => {
    const index = exportHistory.value.findIndex(item => item.id === historyId);
    if (index !== -1) {
      exportHistory.value.splice(index, 1);
    }
  };
  
  /**
   * 清空导出历史
   */
  const clearExportHistory = () => {
    exportHistory.value = [];
    historyError.value = null;
  };
  
  /**
   * 设置导出模板
   * @param {Array} templates - 导出模板数组
   */
  const setExportTemplates = (templates) => {
    exportTemplates.value = Array.isArray(templates) ? templates : [];
    templatesError.value = null;
  };
  
  /**
   * 添加导出模板
   * @param {Object} template - 导出模板
   */
  const addExportTemplate = (template) => {
    if (template && typeof template === 'object') {
      exportTemplates.value.push(template);
    }
  };
  
  /**
   * 移除导出模板
   * @param {string} templateId - 模板ID
   */
  const removeExportTemplate = (templateId) => {
    const index = exportTemplates.value.findIndex(item => item.id === templateId);
    if (index !== -1) {
      exportTemplates.value.splice(index, 1);
    }
  };
  
  /**
   * 设置支持的导出格式
   * @param {Object} formats - 按类型组织的格式对象
   */
  const setSupportedFormats = (formats) => {
    if (formats && typeof formats === 'object') {
      supportedFormats.value = formats;
    } else {
      supportedFormats.value = {};
    }
    formatsError.value = null;
  };
  
  /**
   * 获取特定类型的支持格式
   * @param {string} exportType - 导出类型
   * @returns {Array} 格式列表
   */
  const getFormatsByType = (exportType) => {
    return supportedFormats.value[exportType] || [];
  };
  
  /**
   * 设置当前导出任务
   * @param {Object} task - 导出任务
   */
  const setCurrentExportTask = (task) => {
    currentExportTask.value = task;
    isExporting.value = true;
    exportProgress.value = 0;
    exportError.value = null;
  };
  
  /**
   * 更新导出进度
   * @param {number} progress - 进度百分比
   */
  const updateExportProgress = (progress) => {
    exportProgress.value = Math.min(100, Math.max(0, progress));
  };
  
  /**
   * 完成导出任务
   * @param {Object} result - 导出结果
   */
  const completeExportTask = (result) => {
    isExporting.value = false;
    exportProgress.value = 100;
    currentExportTask.value = null;
    
    // 如果有结果，添加到历史
    if (result && result.filename) {
      addExportHistory({
        id: `export_${Date.now()}`,
        type: currentExportTask.value?.type || 'unknown',
        format: currentExportTask.value?.format || 'unknown',
        filename: result.filename,
        fileSize: result.fileSize || 0,
        itemCount: result.itemCount || 0,
        createdAt: new Date().toISOString(),
        status: 'completed'
      });
    }
  };
  
  /**
   * 取消导出任务
   */
  const cancelExportTask = () => {
    isExporting.value = false;
    exportProgress.value = 0;
    exportError.value = '导出已取消';
    currentExportTask.value = null;
  };
  
  /**
   * 设置导出错误
   * @param {string|Error} error - 错误信息
   */
  const setExportError = (error) => {
    isExporting.value = false;
    exportError.value = error instanceof Error ? error.message : error;
    
    // 记录失败的历史
    if (currentExportTask.value) {
      addExportHistory({
        id: `export_${Date.now()}`,
        type: currentExportTask.value.type || 'unknown',
        format: currentExportTask.value.format || 'unknown',
        filename: '导出失败',
        fileSize: 0,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        status: 'failed',
        errorMessage: exportError.value
      });
    }
    
    currentExportTask.value = null;
  };
  
  /**
   * 设置导出统计
   * @param {Object} stats - 导出统计数据
   */
  const setExportStats = (stats) => {
    exportStats.value = stats && typeof stats === 'object' ? stats : null;
    statsError.value = null;
  };
  
  /**
   * 清空导出错误
   */
  const clearExportError = () => {
    exportError.value = null;
  };
  
  /**
   * 重置导出状态
   */
  const resetExportState = () => {
    isExporting.value = false;
    exportProgress.value = 0;
    exportError.value = null;
    currentExportTask.value = null;
  };
  
  /**
   * 获取导出历史分页
   * @param {number} page - 页码
   * @param {number} pageSize - 每页大小
   * @returns {Array} 分页后的历史记录
   */
  const getPaginatedHistory = (page = 1, pageSize = 10) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return exportHistory.value.slice(startIndex, endIndex);
  };
  
  /**
   * 根据类型筛选导出历史
   * @param {string} type - 导出类型
   * @returns {Array} 筛选后的历史记录
   */
  const filterHistoryByType = (type) => {
    return exportHistory.value.filter(item => item.type === type);
  };
  
  /**
   * 根据日期范围筛选导出历史
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Array} 筛选后的历史记录
   */
  const filterHistoryByDateRange = (startDate, endDate = new Date()) => {
    return exportHistory.value.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };
  
  return {
    // 状态
    exportHistory,
    historyLoading,
    historyError,
    exportTemplates,
    templatesLoading,
    templatesError,
    supportedFormats,
    formatsLoading,
    formatsError,
    currentExportTask,
    exportProgress,
    isExporting,
    exportError,
    exportStats,
    statsLoading,
    statsError,
    
    // 计算属性
    totalHistoryCount,
    recentExports,
    totalExportSize,
    defaultTemplates,
    customTemplates,
    exportStatus,
    
    // 动作方法
    setExportHistory,
    addExportHistory,
    removeExportHistory,
    clearExportHistory,
    setExportTemplates,
    addExportTemplate,
    removeExportTemplate,
    setSupportedFormats,
    getFormatsByType,
    setCurrentExportTask,
    updateExportProgress,
    completeExportTask,
    cancelExportTask,
    setExportError,
    setExportStats,
    clearExportError,
    resetExportState,
    getPaginatedHistory,
    filterHistoryByType,
    filterHistoryByDateRange
  };
});