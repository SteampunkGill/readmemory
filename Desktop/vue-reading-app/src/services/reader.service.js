// src/services/reader.service.js
// 功能：页面内容获取、阅读进度更新、高亮和笔记管理

import { api } from '@/api/reader';
import { useReaderStore } from '@/stores/reader.store';
import { useDocumentStore } from '@/stores/document.store';
import { showError, showSuccess, showWarning } from '@/utils/notify';
import { formatDate, formatDuration } from '@/utils/formatter';
import { debounce } from '@/utils/debounce';

class ReaderService {
  constructor() {
    this.readerStore = useReaderStore();
    this.documentStore = useDocumentStore();
    this.cache = new Map(); // 页面内容缓存
    this.highlightCache = new Map(); // 高亮缓存
    this.noteCache = new Map(); // 笔记缓存
    this.cacheExpiry = 10 * 60 * 1000; // 缓存10分钟
    
    // 防抖的进度更新函数
    this.updateProgressDebounced = debounce(this._updateProgress.bind(this), 2000);
    
    // 阅读计时器
    this.readingTimer = null;
    this.startTime = null;
    this.totalReadingTime = 0;
  }

  /**
   * 获取文档页面内容
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @param {Object} [options] - 选项
   * @param {boolean} [options.forceRefresh=false] - 是否强制刷新
   * @param {boolean} [options.withHighlights=true] - 是否包含高亮
   * @param {boolean} [options.withNotes=true] - 是否包含笔记
   * @returns {Promise<Object>} 页面内容
   */
  async getPageContent(documentId, pageNumber, options = {}) {
    try {
      // 1. 参数验证
      this._validatePageParams(documentId, pageNumber);
      
      // 2. 生成缓存键
      const cacheKey = this._generatePageCacheKey(documentId, pageNumber, options);
      
      // 3. 检查缓存
      if (!options.forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey).data;
        console.log(`从缓存获取页面 ${pageNumber} 内容`);
        return cachedData;
      }
      
      // 4. API调用 - 使用正确的函数名和参数
      const response = await api.getDocumentPage(documentId, pageNumber);
      
      // 5. 数据处理
      const pageContent = this._formatPageContent(response.data, documentId, pageNumber);
      
      // 6. 状态更新
      this.readerStore.setCurrentPage(pageContent);
      this.readerStore.setCurrentDocumentId(documentId);
      this.readerStore.setCurrentPageNumber(pageNumber);
      
      // 7. 更新缓存
      this._setCache(cacheKey, pageContent);
      
      // 8. 开始阅读计时（如果是第一页）
      if (pageNumber === 1) {
        this._startReadingTimer(documentId);
      }
      
      return pageContent;
    } catch (error) {
      // 错误处理
      this._handleGetPageError(error, documentId, pageNumber);
      throw error;
    }
  }

  /**
   * 更新阅读进度
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 进度数据
   * @param {number} data.page - 当前页码
   * @param {number} [data.percentage] - 阅读百分比
   * @param {number} [data.readingTime] - 阅读时间（秒）
   * @param {boolean} [immediate=false] - 是否立即更新（不防抖）
   * @returns {Promise<Object>} 更新结果
   */
  async updateReadingProgress(documentId, data, immediate = false) {
    try {
      // 1. 参数验证
      this._validateProgressParams(documentId, data);
      
      // 2. 立即更新或防抖更新
      if (immediate) {
        return await this._updateProgress(documentId, data);
      } else {
        // 存储进度数据，防抖更新
        this.updateProgressDebounced(documentId, data);
        
        // 立即更新本地状态
        this._updateLocalProgress(documentId, data);
        
        return { success: true, message: '进度已保存（延迟同步）' };
      }
    } catch (error) {
      // 错误处理
      this._handleUpdateProgressError(error, documentId);
      throw error;
    }
  }

  /**
   * 添加高亮
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 高亮数据
   * @param {string} data.text - 高亮文本
   * @param {number} data.page - 所在页码
   * @param {Object} data.position - 位置信息
   * @param {string} [data.color='yellow'] - 高亮颜色
   * @param {string} [data.note] - 高亮笔记
   * @returns {Promise<Object>} 高亮数据
   */
  async addHighlight(documentId, data) {
    let tempId;
    
    try {
      // 1. 参数验证
      this._validateHighlightParams(documentId, data);
      
      // 2. 生成临时ID（用于乐观更新）
      tempId = `temp_highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempHighlight = {
        id: tempId,
        ...data,
        documentId,
        createdAt: new Date().toISOString(),
        isSynced: false
      };
      
      // 3. 乐观更新：先添加到本地状态
      this.readerStore.addHighlight(tempHighlight);
      
      // 4. API调用 - 使用正确的函数名
      const response = await api.addHighlight(documentId, data);
      
      // 5. 数据处理
      const highlight = this._formatHighlight(response.data);
      
      // 6. 更新本地状态（替换临时数据）
      this.readerStore.updateHighlight(tempId, highlight);
      
      // 7. 更新缓存
      this._updateHighlightCache(documentId, highlight);
      
      // 8. 用户反馈
      showSuccess('高亮已添加');
      
      return highlight;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (tempId) {
        this.readerStore.removeHighlight(tempId);
      }
      this._handleAddHighlightError(error, documentId);
      throw error;
    }
  }

  /**
   * 更新高亮
   * @param {string|number} documentId - 文档ID
   * @param {string|number} highlightId - 高亮ID
   * @param {Object} data - 更新数据
   * @param {string} [data.color] - 新颜色
   * @param {string} [data.note] - 新笔记
   * @returns {Promise<Object>} 更新后的高亮
   */
  async updateHighlight(documentId, highlightId, data) {
    let originalHighlight;
    
    try {
      // 1. 参数验证
      if (!highlightId) {
        throw new Error('高亮ID不能为空');
      }
      
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('更新数据不能为空');
      }
      
      // 2. 获取原始高亮
      originalHighlight = this.readerStore.highlights.find(h => h.id === highlightId);
      if (!originalHighlight) {
        throw new Error('高亮不存在');
      }
      
      // 3. 乐观更新：先更新本地状态
      const updatedHighlight = { ...originalHighlight, ...data };
      this.readerStore.updateHighlight(highlightId, updatedHighlight);
      
      // 4. API调用 - 使用正确的函数名
      const response = await api.updateHighlight(documentId, highlightId, data);
      
      // 5. 数据处理
      const highlight = this._formatHighlight(response.data);
      
      // 6. 更新本地状态
      this.readerStore.updateHighlight(highlightId, highlight);
      
      // 7. 更新缓存
      this._updateHighlightCache(documentId, highlight);
      
      // 8. 用户反馈
      showSuccess('高亮已更新');
      
      return highlight;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (originalHighlight) {
        this.readerStore.updateHighlight(highlightId, originalHighlight);
      }
      this._handleUpdateHighlightError(error, documentId, highlightId);
      throw error;
    }
  }

  /**
   * 删除高亮
   * @param {string|number} documentId - 文档ID
   * @param {string|number} highlightId - 高亮ID
   * @param {boolean} [confirm=true] - 是否需要确认
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteHighlight(documentId, highlightId, confirm = true) {
    let highlight;
    
    try {
      // 1. 参数验证
      if (!highlightId) {
        throw new Error('高亮ID不能为空');
      }
      
      // 2. 获取高亮信息
      highlight = this.readerStore.highlights.find(h => h.id === highlightId);
      
      // 3. 确认删除
      if (confirm && highlight) {
        const confirmed = window.confirm('确定要删除这个高亮吗？');
        if (!confirmed) {
          return false;
        }
      }
      
      // 4. 乐观更新：先从本地状态移除
      this.readerStore.removeHighlight(highlightId);
      
      // 5. API调用 - 使用正确的函数名
      await api.deleteHighlight(documentId, highlightId);
      
      // 6. 清除缓存
      this._removeHighlightFromCache(documentId, highlightId);
      
      // 7. 用户反馈
      showSuccess('高亮已删除');
      
      return true;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (highlight) {
        this.readerStore.addHighlight(highlight);
      }
      this._handleDeleteHighlightError(error, documentId, highlightId);
      throw error;
    }
  }

  /**
   * 获取文档的所有高亮
   * @param {string|number} documentId - 文档ID
   * @param {Object} [params] - 查询参数
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Array>} 高亮列表
   */
  async getDocumentHighlights(documentId, params = {}, forceRefresh = false) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      // 2. 生成缓存键
      const cacheKey = `highlights_${documentId}_${JSON.stringify(params)}`;
      
      // 3. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用正确的函数名
      const response = await api.getHighlights(documentId, params);
      
      // 5. 数据处理
      const highlights = (response.data.highlights || response.data || []).map(h => 
        this._formatHighlight(h)
      );
      
      // 6. 状态更新
      this.readerStore.setHighlights(highlights);
      
      // 7. 更新缓存
      this._setCache(cacheKey, highlights);
      
      return highlights;
    } catch (error) {
      // 错误处理
      this._handleGetHighlightsError(error, documentId);
      throw error;
    }
  }

  /**
   * 添加笔记
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 笔记数据
   * @param {string} data.content - 笔记内容
   * @param {number} data.page - 所在页码
   * @param {Object} [data.position] - 位置信息
   * @param {string} [data.highlightId] - 关联的高亮ID
   * @returns {Promise<Object>} 笔记数据
   */
  async addNote(documentId, data) {
    let tempId;
    
    try {
      // 1. 参数验证
      this._validateNoteParams(documentId, data);
      
      // 2. 生成临时ID（用于乐观更新）
      tempId = `temp_note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempNote = {
        id: tempId,
        ...data,
        documentId,
        createdAt: new Date().toISOString(),
        isSynced: false
      };
      
      // 3. 乐观更新：先添加到本地状态
      this.readerStore.addNote(tempNote);
      
      // 4. API调用 - 使用正确的函数名
      const response = await api.addNote(documentId, data);
      
      // 5. 数据处理
      const note = this._formatNote(response.data);
      
      // 6. 更新本地状态（替换临时数据）
      this.readerStore.updateNote(tempId, note);
      
      // 7. 更新缓存
      this._updateNoteCache(documentId, note);
      
      // 8. 用户反馈
      showSuccess('笔记已添加');
      
      return note;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (tempId) {
        this.readerStore.removeNote(tempId);
      }
      this._handleAddNoteError(error, documentId);
      throw error;
    }
  }

  /**
   * 更新笔记
   * @param {string|number} documentId - 文档ID
   * @param {string|number} noteId - 笔记ID
   * @param {Object} data - 更新数据
   * @param {string} [data.content] - 新内容
   * @returns {Promise<Object>} 更新后的笔记
   */
  async updateNote(documentId, noteId, data) {
    let originalNote;
    
    try {
      // 1. 参数验证
      if (!noteId) {
        throw new Error('笔记ID不能为空');
      }
      
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('更新数据不能为空');
      }
      
      // 2. 获取原始笔记
      originalNote = this.readerStore.notes.find(n => n.id === noteId);
      if (!originalNote) {
        throw new Error('笔记不存在');
      }
      
      // 3. 乐观更新：先更新本地状态
      const updatedNote = { ...originalNote, ...data };
      this.readerStore.updateNote(noteId, updatedNote);
      
      // 4. API调用 - 使用正确的函数名
      const response = await api.updateNote(documentId, noteId, data);
      
      // 5. 数据处理
      const note = this._formatNote(response.data);
      
      // 6. 更新本地状态
      this.readerStore.updateNote(noteId, note);
      
      // 7. 更新缓存
      this._updateNoteCache(documentId, note);
      
      // 8. 用户反馈
      showSuccess('笔记已更新');
      
      return note;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (originalNote) {
        this.readerStore.updateNote(noteId, originalNote);
      }
      this._handleUpdateNoteError(error, documentId, noteId);
      throw error;
    }
  }

  /**
   * 删除笔记
   * @param {string|number} documentId - 文档ID
   * @param {string|number} noteId - 笔记ID
   * @param {boolean} [confirm=true] - 是否需要确认
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteNote(documentId, noteId, confirm = true) {
    let note;
    
    try {
      // 1. 参数验证
      if (!noteId) {
        throw new Error('笔记ID不能为空');
      }
      
      // 2. 获取笔记信息
      note = this.readerStore.notes.find(n => n.id === noteId);
      
      // 3. 确认删除
      if (confirm && note) {
        const confirmed = window.confirm('确定要删除这个笔记吗？');
        if (!confirmed) {
          return false;
        }
      }
      
      // 4. 乐观更新：先从本地状态移除
      this.readerStore.removeNote(noteId);
      
      // 5. API调用 - 使用正确的函数名
      await api.deleteNote(documentId, noteId);
      
      // 6. 清除缓存
      this._removeNoteFromCache(documentId, noteId);
      
      // 7. 用户反馈
      showSuccess('笔记已删除');
      
      return true;
    } catch (error) {
      // 错误处理：回滚乐观更新
      if (note) {
        this.readerStore.addNote(note);
      }
      this._handleDeleteNoteError(error, documentId, noteId);
      throw error;
    }
  }

  /**
   * 获取文档的所有笔记
   * @param {string|number} documentId - 文档ID
   * @param {Object} [params] - 查询参数
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Array>} 笔记列表
   */
  async getDocumentNotes(documentId, params = {}, forceRefresh = false) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      // 2. 生成缓存键
      const cacheKey = `notes_${documentId}_${JSON.stringify(params)}`;
      
      // 3. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      // 4. API调用 - 使用正确的函数名
      const response = await api.getNotes(documentId, params);
      
      // 5. 数据处理
      const notes = (response.data.notes || response.data || []).map(n => 
        this._formatNote(n)
      );
      
      // 6. 状态更新
      this.readerStore.setNotes(notes);
      
      // 7. 更新缓存
      this._setCache(cacheKey, notes);
      
      return notes;
    } catch (error) {
      // 错误处理
      this._handleGetNotesError(error, documentId);
      throw error;
    }
  }

  /**
   * 搜索文档内容
   * @param {string|number} documentId - 文档ID
   * @param {string} query - 搜索关键词
   * @param {Object} [params] - 搜索参数
   * @returns {Promise<Object>} 搜索结果
   */
  async searchDocumentContent(documentId, query, params = {}) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      if (!query || query.trim() === '') {
        throw new Error('搜索关键词不能为空');
      }
      
      // 2. API调用 - 使用正确的函数名
      const response = await api.searchDocumentContent(documentId, query, params);
      
      // 3. 数据处理
      const searchResults = this._formatSearchResults(response.data);
      
      return searchResults;
    } catch (error) {
      // 错误处理
      this._handleSearchError(error, documentId, query);
      throw error;
    }
  }

  /**
   * 获取文档目录/大纲
   * @param {string|number} documentId - 文档ID
   * @returns {Promise<Array>} 目录列表
   */
  async getDocumentOutline(documentId) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      // 2. API调用 - 使用正确的函数名
      const response = await api.getDocumentOutline(documentId);
      
      // 3. 数据处理
      const outline = this._formatOutline(response.data);
      
      return outline;
    } catch (error) {
      // 错误处理
      this._handleGetOutlineError(error, documentId);
      throw error;
    }
  }

  /**
   * 添加书签
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @returns {Promise<Object>} 书签数据
   */
  async addBookmark(documentId, pageNumber) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      if (!pageNumber || pageNumber < 1) {
        throw new Error('页码必须大于0');
      }
      
      // 2. API调用 - 使用正确的函数名
      const response = await api.addBookmark(documentId, pageNumber);
      
      // 3. 数据处理
      const bookmark = this._formatBookmark(response.data);
      
      // 4. 用户反馈
      showSuccess('书签已添加');
      
      return bookmark;
    } catch (error) {
      // 错误处理
      this._handleAddBookmarkError(error, documentId, pageNumber);
      throw error;
    }
  }

  /**
   * 获取书签列表
   * @param {string|number} documentId - 文档ID
   * @returns {Promise<Array>} 书签列表
   */
  async getBookmarks(documentId) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      // 2. API调用 - 使用正确的函数名
      const response = await api.getBookmarks(documentId);
      
      // 3. 数据处理
      const bookmarks = (response.data.bookmarks || response.data || []).map(b => 
        this._formatBookmark(b)
      );
      
      return bookmarks;
    } catch (error) {
      // 错误处理
      this._handleGetBookmarksError(error, documentId);
      throw error;
    }
  }

  /**
   * 删除书签
   * @param {string|number} documentId - 文档ID
   * @param {string|number} bookmarkId - 书签ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteBookmark(documentId, bookmarkId) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      if (!bookmarkId) {
        throw new Error('书签ID不能为空');
      }
      
      // 2. API调用 - 使用正确的函数名
      await api.deleteBookmark(documentId, bookmarkId);
      
      // 3. 用户反馈
      showSuccess('书签已删除');
      
      return true;
    } catch (error) {
      // 错误处理
      this._handleDeleteBookmarkError(error, documentId, bookmarkId);
      throw error;
    }
  }

  /**
   * 获取阅读历史
   * @param {string|number} documentId - 文档ID
   * @param {number} [limit=10] - 限制数量
   * @returns {Promise<Array>} 阅读历史
   */
  async getReadingHistory(documentId, limit = 10) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      // 2. API调用 - 使用正确的函数名
      const response = await api.getReadingHistory(documentId, limit);
      
      // 3. 数据处理
      const history = this._formatReadingHistory(response.data);
      
      return history;
    } catch (error) {
      // 错误处理
      this._handleGetHistoryError(error, documentId);
      throw error;
    }
  }

  /**
   * 清空阅读历史
   * @param {string|number} documentId - 文档ID
   * @returns {Promise<boolean>} 是否清空成功
   */
  async clearReadingHistory(documentId) {
    try {
      // 1. 参数验证
      if (!documentId) {
        throw new Error('文档ID不能为空');
      }
      
      // 2. API调用 - 使用正确的函数名
      await api.clearReadingHistory(documentId);
      
      // 3. 用户反馈
      showSuccess('阅读历史已清空');
      
      return true;
    } catch (error) {
      // 错误处理
      this._handleClearHistoryError(error, documentId);
      throw error;
    }
  }

  /**
   * 开始阅读会话
   * @param {string|number} documentId - 文档ID
   */
  startReadingSession(documentId) {
    this._startReadingTimer(documentId);
  }

  /**
   * 结束阅读会话
   * @param {string|number} documentId - 文档ID
   * @returns {Promise<Object>} 阅读会话结果
   */
  async endReadingSession(documentId) {
    try {
      // 1. 停止计时器
      this._stopReadingTimer();
      
      // 2. 如果有阅读时间，更新到服务器
      if (this.totalReadingTime > 0) {
        const data = {
          readingTime: this.totalReadingTime,
          endTime: new Date().toISOString()
        };
        
        // 更新阅读进度
        await this.updateReadingProgress(documentId, {
          page: this.readerStore.currentPageNumber || 1,
          readingTime: this.totalReadingTime
        }, true);
        
        // 3. 重置阅读时间
        this.totalReadingTime = 0;
        this.readerStore.setReadingTime(0);
        
        return { success: true, readingTime: data.readingTime };
      }
      
      return { success: true, readingTime: 0 };
    } catch (error) {
      console.error('结束阅读会话失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 清除阅读器缓存
   * @param {string|number} [documentId] - 文档ID（可选，不传则清除所有）
   */
  clearCache(documentId = null) {
    if (documentId) {
      // 清除指定文档的缓存
      for (const key of this.cache.keys()) {
        if (key.includes(`_${documentId}_`) || key.endsWith(`_${documentId}`)) {
          this.cache.delete(key);
        }
      }
      console.log(`已清除文档 ${documentId} 的阅读器缓存`);
    } else {
      // 清除所有缓存
      this.cache.clear();
      this.highlightCache.clear();
      this.noteCache.clear();
      console.log('已清除所有阅读器缓存');
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 验证页面参数
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @private
   */
  _validatePageParams(documentId, pageNumber) {
    if (!documentId) {
      throw new Error('文档ID不能为空');
    }
    
    if (!pageNumber || pageNumber < 1) {
      throw new Error('页码必须大于0');
    }
  }

  /**
   * 验证进度参数
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 进度数据
   * @private
   */
  _validateProgressParams(documentId, data) {
    if (!documentId) {
      throw new Error('文档ID不能为空');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('进度数据不能为空');
    }
    
    if (!data.page || data.page < 1) {
      throw new Error('页码必须大于0');
    }
  }

  /**
   * 验证高亮参数
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 高亮数据
   * @private
   */
  _validateHighlightParams(documentId, data) {
    if (!documentId) {
      throw new Error('文档ID不能为空');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('高亮数据不能为空');
    }
    
    if (!data.text || data.text.trim() === '') {
      throw new Error('高亮文本不能为空');
    }
    
    if (!data.page || data.page < 1) {
      throw new Error('页码必须大于0');
    }
  }

  /**
   * 验证笔记参数
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 笔记数据
   * @private
   */
  _validateNoteParams(documentId, data) {
    if (!documentId) {
      throw new Error('文档ID不能为空');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('笔记数据不能为空');
    }
    
    if (!data.content || data.content.trim() === '') {
      throw new Error('笔记内容不能为空');
    }
    
    if (!data.page || data.page < 1) {
      throw new Error('页码必须大于0');
    }
  }

  /**
   * 生成页面缓存键
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @param {Object} options - 选项
   * @returns {string} 缓存键
   * @private
   */
  _generatePageCacheKey(documentId, pageNumber, options) {
    const optionStr = Object.keys(options)
      .sort()
      .map(key => `${key}=${options[key]}`)
      .join('&');
    
    return `page_${documentId}_${pageNumber}_${optionStr}`;
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
   * 更新高亮缓存
   * @param {string|number} documentId - 文档ID
   * @param {Object} highlight - 高亮数据
   * @private
   */
  _updateHighlightCache(documentId, highlight) {
    const cacheKey = `highlight_${documentId}_${highlight.id}`;
    this.highlightCache.set(cacheKey, highlight);
  }

  /**
   * 从缓存中移除高亮
   * @param {string|number} documentId - 文档ID
   * @param {string|number} highlightId - 高亮ID
   * @private
   */
  _removeHighlightFromCache(documentId, highlightId) {
    const cacheKey = `highlight_${documentId}_${highlightId}`;
    this.highlightCache.delete(cacheKey);
  }

  /**
   * 更新笔记缓存
   * @param {string|number} documentId - 文档ID
   * @param {Object} note - 笔记数据
   * @private
   */
  _updateNoteCache(documentId, note) {
    const cacheKey = `note_${documentId}_${note.id}`;
    this.noteCache.set(cacheKey, note);
  }

  /**
   * 从缓存中移除笔记
   * @param {string|number} documentId - 文档ID
   * @param {string|number} noteId - 笔记ID
   * @private
   */
  _removeNoteFromCache(documentId, noteId) {
    const cacheKey = `note_${documentId}_${noteId}`;
    this.noteCache.delete(cacheKey);
  }

  /**
   * 实际更新进度
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 进度数据
   * @returns {Promise<Object>} 更新结果
   * @private
   */
  async _updateProgress(documentId, data) {
    try {
      // 添加阅读时间
      const progressData = {
        ...data,
        readingTime: this.totalReadingTime
      };
      
      // API调用 - 使用正确的函数名
      const response = await api.updateReadingProgress(documentId, progressData);
      
      // 更新文档store中的进度
      this.documentStore.updateDocumentProgress(documentId, {
        readProgress: data.percentage || this._calculatePercentage(data.page, documentId),
        currentPage: data.page,
        lastReadAt: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新本地进度
   * @param {string|number} documentId - 文档ID
   * @param {Object} data - 进度数据
   * @private
   */
  _updateLocalProgress(documentId, data) {
    // 更新阅读器store
    this.readerStore.setCurrentPageNumber(data.page);
    
    // 更新文档store
    const percentage = data.percentage || this._calculatePercentage(data.page, documentId);
    this.documentStore.updateDocumentProgress(documentId, {
      readProgress: percentage,
      currentPage: data.page
    });
  }

  /**
   * 计算阅读百分比
   * @param {number} currentPage - 当前页码
   * @param {string|number} documentId - 文档ID
   * @returns {number} 百分比
   * @private
   */
  _calculatePercentage(currentPage, documentId) {
    const document = this.documentStore.documents.find(doc => doc.id === documentId) ||
                    this.documentStore.currentDocument;
    
    if (!document || !document.pageCount || document.pageCount === 0) {
      return 0;
    }
    
    return Math.round((currentPage / document.pageCount) * 100);
  }

  /**
   * 开始阅读计时器
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _startReadingTimer(documentId) {
    if (this.readingTimer) {
      this._stopReadingTimer();
    }
    
    this.startTime = Date.now();
    
    // 每分钟更新一次阅读时间
    this.readingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.totalReadingTime += elapsed;
      this.startTime = Date.now();
      
      // 更新本地阅读时间
      this.readerStore.setReadingTime(this.totalReadingTime);
    }, 60000); // 每分钟更新一次
  }

  /**
   * 停止阅读计时器
   * @private
   */
  _stopReadingTimer() {
    if (this.readingTimer) {
      clearInterval(this.readingTimer);
      this.readingTimer = null;
      
      // 计算最后一段时间的阅读
      if (this.startTime) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.totalReadingTime += elapsed;
        this.startTime = null;
      }
    }
  }

  /**
   * 格式化页面内容
   * @param {Object} apiData - API返回的数据
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @returns {Object} 格式化后的页面内容
   * @private
   */
  _formatPageContent(apiData, documentId, pageNumber) {
    const pageData = apiData.page || apiData;
    
    return {
      id: pageData.id || `page_${documentId}_${pageNumber}`,
      documentId,
      pageNumber,
      content: pageData.content || pageData.text || '',
      htmlContent: pageData.html_content || pageData.html || '',
      wordCount: pageData.word_count || 0,
      characterCount: pageData.character_count || 0,
      hasImages: pageData.has_images || false,
      images: pageData.images || [],
      highlights: (pageData.highlights || []).map(h => this._formatHighlight(h)),
      notes: (pageData.notes || []).map(n => this._formatNote(n)),
      metadata: pageData.metadata || {},
      nextPage: pageData.next_page || pageNumber + 1,
      prevPage: pageData.prev_page || (pageNumber > 1 ? pageNumber - 1 : null)
    };
  }

  /**
   * 格式化高亮数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的高亮
   * @private
   */
  _formatHighlight(apiData) {
    const highlight = apiData.highlight || apiData;
    
    return {
      id: highlight.id || highlight.highlight_id,
      documentId: highlight.document_id || highlight.documentId,
      text: highlight.text,
      page: highlight.page || highlight.page_number,
      position: highlight.position || {},
      color: highlight.color || 'yellow',
      note: highlight.note || '',
      createdAt: formatDate(highlight.created_at || highlight.createdAt),
      updatedAt: formatDate(highlight.updated_at || highlight.updatedAt)
    };
  }

  /**
   * 格式化笔记数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的笔记
   * @private
   */
  _formatNote(apiData) {
    const note = apiData.note || apiData;
    
    return {
      id: note.id || note.note_id,
      documentId: note.document_id || note.documentId,
      content: note.content,
      page: note.page || note.page_number,
      position: note.position || {},
      highlightId: note.highlight_id || note.highlightId,
      createdAt: formatDate(note.created_at || note.createdAt),
      updatedAt: formatDate(note.updated_at || note.updatedAt)
    };
  }

  /**
   * 格式化搜索结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的搜索结果
   * @private
   */
  _formatSearchResults(apiData) {
    const results = apiData.results || apiData;
    
    return {
      query: results.query || '',
      total: results.total || results.total_count || 0,
      matches: (results.matches || results.results || []).map(match => ({
        page: match.page || match.page_number,
        text: match.text || match.content,
        context: match.context || '',
        highlights: match.highlights || []
      }))
    };
  }

  /**
   * 格式化文档目录
   * @param {Object} apiData - API返回的数据
   * @returns {Array} 格式化后的目录
   * @private
   */
  _formatOutline(apiData) {
    const outline = apiData.outline || apiData;
    
    return (outline || []).map(item => ({
      level: item.level || 1,
      title: item.title || '',
      page: item.page || item.page_number,
      children: item.children ? this._formatOutline(item.children) : []
    }));
  }

  /**
   * 格式化书签数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的书签
   * @private
   */
  _formatBookmark(apiData) {
    const bookmark = apiData.bookmark || apiData;
    
    return {
      id: bookmark.id || bookmark.bookmark_id,
      documentId: bookmark.document_id || bookmark.documentId,
      page: bookmark.page || bookmark.page_number,
      title: bookmark.title || `第 ${bookmark.page} 页`,
      createdAt: formatDate(bookmark.created_at || bookmark.createdAt)
    };
  }

  /**
   * 格式化阅读历史
   * @param {Object} apiData - API返回的数据
   * @returns {Array} 格式化后的阅读历史
   * @private
   */
  _formatReadingHistory(apiData) {
    const history = apiData.history || apiData;
    
    return (history || []).map(record => ({
      id: record.id || record.history_id,
      documentId: record.document_id || record.documentId,
      page: record.page || record.page_number,
      readingTime: record.reading_time || 0,
      date: formatDate(record.date || record.created_at || record.createdAt)
    }));
  }

  /**
   * 处理获取页面错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @private
   */
  _handleGetPageError(error, documentId, pageNumber) {
    let message = `获取页面 ${pageNumber} 内容失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看此文档';
          break;
        case 404:
          message = '页面不存在';
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
   * 处理更新进度错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleUpdateProgressError(error, documentId) {
    let message = '更新阅读进度失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新此文档的进度';
          break;
        case 404:
          message = '文档不存在';
          break;
        default:
          message = `更新失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    console.error(message, error);
    // 不显示错误提示，因为进度更新是后台操作
  }

  /**
   * 处理添加高亮错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleAddHighlightError(error, documentId) {
    let message = '添加高亮失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限添加高亮';
          break;
        case 404:
          message = '文档不存在';
          break;
        case 422:
          message = '高亮数据无效';
          break;
        default:
          message = `添加失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理更新高亮错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {string|number} highlightId - 高亮ID
   * @private
   */
  _handleUpdateHighlightError(error, documentId, highlightId) {
    let message = '更新高亮失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新高亮';
          break;
        case 404:
          message = '高亮不存在';
          break;
        case 422:
          message = '更新数据无效';
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
   * 处理删除高亮错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {string|number} highlightId - 高亮ID
   * @private
   */
  _handleDeleteHighlightError(error, documentId, highlightId) {
    let message = '删除高亮失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限删除高亮';
          break;
        case 404:
          message = '高亮不存在';
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
   * 处理添加笔记错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleAddNoteError(error, documentId) {
    let message = '添加笔记失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限添加笔记';
          break;
        case 404:
          message = '文档不存在';
          break;
        case 422:
          message = '笔记数据无效';
          break;
        default:
          message = `添加失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理更新笔记错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {string|number} noteId - 笔记ID
   * @private
   */
  _handleUpdateNoteError(error, documentId, noteId) {
    let message = '更新笔记失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限更新笔记';
          break;
        case 404:
          message = '笔记不存在';
          break;
        case 422:
          message = '更新数据无效';
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
   * 处理删除笔记错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {string|number} noteId - 笔记ID
   * @private
   */
  _handleDeleteNoteError(error, documentId, noteId) {
    let message = '删除笔记失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限删除笔记';
          break;
        case 404:
          message = '笔记不存在';
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
   * 处理获取高亮错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleGetHighlightsError(error, documentId) {
    let message = '获取高亮列表失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看高亮';
          break;
        case 404:
          message = '文档不存在';
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
   * 处理获取笔记错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleGetNotesError(error, documentId) {
    let message = '获取笔记列表失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看笔记';
          break;
        case 404:
          message = '文档不存在';
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
   * 处理搜索错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {string} query - 搜索关键词
   * @private
   */
  _handleSearchError(error, documentId, query) {
    let message = `搜索 "${query}" 失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '搜索关键词无效';
          break;
        case 401:
          message = '请先登录';
          break;
        case 429:
          message = '搜索过于频繁，请稍后再试';
          break;
        default:
          message = `搜索失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取目录错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleGetOutlineError(error, documentId) {
    console.error(`获取文档 ${documentId} 的目录失败:`, error);
    showError('获取目录失败');
  }

  /**
   * 处理添加书签错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {number} pageNumber - 页码
   * @private
   */
  _handleAddBookmarkError(error, documentId, pageNumber) {
    let message = `在第 ${pageNumber} 页添加书签失败`;
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限添加书签';
          break;
        case 404:
          message = '文档不存在';
          break;
        case 409:
          message = '该页已有书签';
          break;
        default:
          message = `添加失败 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    showError(message);
  }

  /**
   * 处理获取书签错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleGetBookmarksError(error, documentId) {
    let message = '获取书签列表失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限查看书签';
          break;
        case 404:
          message = '文档不存在';
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
   * 处理删除书签错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @param {string|number} bookmarkId - 书签ID
   * @private
   */
  _handleDeleteBookmarkError(error, documentId, bookmarkId) {
    let message = '删除书签失败';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录';
          break;
        case 403:
          message = '没有权限删除书签';
          break;
        case 404:
          message = '书签不存在';
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
   * 处理获取阅读历史错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleGetHistoryError(error, documentId) {
    console.error(`获取文档 ${documentId} 的阅读历史失败:`, error);
    showError('获取阅读历史失败');
  }

  /**
   * 处理清空阅读历史错误
   * @param {Error} error - 错误对象
   * @param {string|number} documentId - 文档ID
   * @private
   */
  _handleClearHistoryError(error, documentId) {
    console.error(`清空文档 ${documentId} 的阅读历史失败:`, error);
    showError('清空阅读历史失败');
  }
}




// 创建单例实例
const readerService = new ReaderService();

// 导出实例
export default readerService;