// src/stores/reader.store.js
import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';

/**
 * 阅读器状态管理
 * 管理当前阅读的文档、页面、高亮、笔记等
 */
export const useReaderStore = defineStore('reader', () => {
  // ==================== 状态定义 ====================
  
  // 当前文档ID
  const currentDocumentId = ref(null);
  
  // 当前页面内容
  const currentPage = ref(null);
  
  // 当前页码
  const currentPageNumber = ref(1);
  
  // 高亮列表
  const highlights = ref([]);
  
  // 笔记列表
  const notes = ref([]);
  
  // 阅读时间（秒）
  const readingTime = ref(0);
  
  // 加载状态
  const loading = ref(false);
  
  // 错误信息
  const error = ref(null);
  
  // 阅读设置
  const settings = reactive({
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    fontFamily: 'system-ui',
    showHighlights: true,
    showNotes: true,
    autoScroll: false,
    scrollSpeed: 1
  });

  // ==================== 计算属性 ====================
  
  /**
   * 当前页面的高亮
   */
  const currentPageHighlights = computed(() => {
    if (!currentPageNumber.value || !highlights.value.length) {
      return [];
    }
    
    return highlights.value.filter(highlight => 
      highlight.page === currentPageNumber.value
    );
  });
  
  /**
   * 当前页面的笔记
   */
  const currentPageNotes = computed(() => {
    if (!currentPageNumber.value || !notes.value.length) {
      return [];
    }
    
    return notes.value.filter(note => 
      note.page === currentPageNumber.value
    );
  });
  
  /**
   * 当前文档的所有高亮数量
   */
  const totalHighlights = computed(() => highlights.value.length);
  
  /**
   * 当前文档的所有笔记数量
   */
  const totalNotes = computed(() => notes.value.length);
  
  /**
   * 格式化的阅读时间
   */
  const formattedReadingTime = computed(() => {
    const hours = Math.floor(readingTime.value / 3600);
    const minutes = Math.floor((readingTime.value % 3600) / 60);
    const seconds = readingTime.value % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  });

  // ==================== Actions ====================
  
  /**
   * 设置当前文档ID
   * @param {string|number} id - 文档ID
   */
  const setCurrentDocumentId = (id) => {
    currentDocumentId.value = id;
  };
  
  /**
   * 设置当前页面内容
   * @param {Object} page - 页面内容
   */
  const setCurrentPage = (page) => {
    currentPage.value = page;
  };
  
  /**
   * 设置当前页码
   * @param {number} pageNumber - 页码
   */
  const setCurrentPageNumber = (pageNumber) => {
    currentPageNumber.value = pageNumber;
  };
  
  /**
   * 设置高亮列表
   * @param {Array} highlightList - 高亮数组
   */
  const setHighlights = (highlightList) => {
    highlights.value = Array.isArray(highlightList) ? highlightList : [];
  };
  
  /**
   * 添加高亮
   * @param {Object} highlight - 高亮对象
   */
  const addHighlight = (highlight) => {
    if (highlight && highlight.id) {
      highlights.value.push(highlight);
    }
  };
  
  /**
   * 更新高亮
   * @param {string|number} highlightId - 高亮ID
   * @param {Object} updates - 更新数据
   */
  const updateHighlight = (highlightId, updates) => {
    const index = highlights.value.findIndex(h => h.id === highlightId);
    if (index >= 0) {
      highlights.value[index] = { ...highlights.value[index], ...updates };
    }
  };
  
  /**
   * 删除高亮
   * @param {string|number} highlightId - 高亮ID
   */
  const removeHighlight = (highlightId) => {
    const index = highlights.value.findIndex(h => h.id === highlightId);
    if (index >= 0) {
      highlights.value.splice(index, 1);
    }
  };
  
  /**
   * 设置笔记列表
   * @param {Array} noteList - 笔记数组
   */
  const setNotes = (noteList) => {
    notes.value = Array.isArray(noteList) ? noteList : [];
  };
  
  /**
   * 添加笔记
   * @param {Object} note - 笔记对象
   */
  const addNote = (note) => {
    if (note && note.id) {
      notes.value.push(note);
    }
  };
  
  /**
   * 更新笔记
   * @param {string|number} noteId - 笔记ID
   * @param {Object} updates - 更新数据
   */
  const updateNote = (noteId, updates) => {
    const index = notes.value.findIndex(n => n.id === noteId);
    if (index >= 0) {
      notes.value[index] = { ...notes.value[index], ...updates };
    }
  };
  
  /**
   * 删除笔记
   * @param {string|number} noteId - 笔记ID
   */
  const removeNote = (noteId) => {
    const index = notes.value.findIndex(n => n.id === noteId);
    if (index >= 0) {
      notes.value.splice(index, 1);
    }
  };
  
  /**
   * 设置阅读时间
   * @param {number} time - 阅读时间（秒）
   */
  const setReadingTime = (time) => {
    readingTime.value = time;
  };
  
  /**
   * 设置加载状态
   * @param {boolean} status - 加载状态
   */
  const setLoading = (status) => {
    loading.value = status;
  };
  
  /**
   * 设置错误信息
   * @param {string|null} errorMessage - 错误信息
   */
  const setError = (errorMessage) => {
    error.value = errorMessage;
  };
  
  /**
   * 更新阅读设置
   * @param {Object} newSettings - 新设置
   */
  const updateSettings = (newSettings) => {
    Object.assign(settings, newSettings);
  };
  
  /**
   * 重置阅读器状态
   */
  const resetReader = () => {
    currentDocumentId.value = null;
    currentPage.value = null;
    currentPageNumber.value = 1;
    highlights.value = [];
    notes.value = [];
    readingTime.value = 0;
    loading.value = false;
    error.value = null;
  };
  
  /**
   * 获取指定页面的高亮
   * @param {number} pageNumber - 页码
   * @returns {Array} 高亮数组
   */
  const getHighlightsByPage = (pageNumber) => {
    return highlights.value.filter(highlight => highlight.page === pageNumber);
  };
  
  /**
   * 获取指定页面的笔记
   * @param {number} pageNumber - 页码
   * @returns {Array} 笔记数组
   */
  const getNotesByPage = (pageNumber) => {
    return notes.value.filter(note => note.page === pageNumber);
  };
  
  /**
   * 获取指定高亮的笔记
   * @param {string|number} highlightId - 高亮ID
   * @returns {Array} 笔记数组
   */
  const getNotesByHighlight = (highlightId) => {
    return notes.value.filter(note => note.highlightId === highlightId);
  };

  // ==================== 返回 ====================
  
  return {
    // 状态
    currentDocumentId,
    currentPage,
    currentPageNumber,
    highlights,
    notes,
    readingTime,
    loading,
    error,
    settings,
    
    // 计算属性
    currentPageHighlights,
    currentPageNotes,
    totalHighlights,
    totalNotes,
    formattedReadingTime,
    
    // Actions
    setCurrentDocumentId,
    setCurrentPage,
    setCurrentPageNumber,
    setHighlights,
    addHighlight,
    updateHighlight,
    removeHighlight,
    setNotes,
    addNote,
    updateNote,
    removeNote,
    setReadingTime,
    setLoading,
    setError,
    updateSettings,
    resetReader,
    getHighlightsByPage,
    getNotesByPage,
    getNotesByHighlight,
  };
});

// 导出默认实例
export default useReaderStore;