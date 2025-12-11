// src/services/document.service.js
// 功能：文档CRUD、上传、列表获取、搜索、批量操作

import { api } from '@/api/documents'
import { useDocumentStore } from '@/stores/document.store'
import { useTagStore } from '@/stores/tag.store'
import { showError, showSuccess, showWarning } from '@/utils/notify'
import { formatFileSize, formatDate } from '@/utils/formatter'
import { validateFileType, validateFileSize } from '@/utils/file-validator'
import { requestQueue } from '@/utils/request-queue'

class DocumentService {
  constructor() {
    this.documentStore = useDocumentStore()
    this.tagStore = useTagStore()
    this.cache = new Map() // 文档缓存
    this.uploadQueue = new Map() // 上传队列
    this.cacheExpiry = 5 * 60 * 1000 // 缓存5分钟
  }

  /**
   * 获取文档列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @param {string} [params.sortBy='created_at'] - 排序字段
   * @param {string} [params.sortOrder='desc'] - 排序方向
   * @param {string} [params.search] - 搜索关键词
   * @param {string} [params.status] - 文档状态
   * @param {Array} [params.tags] - 标签筛选
   * @param {string} [params.language] - 语言筛选
   * @returns {Promise<Object>} 文档列表数据
   */
  async getDocuments(params = {}) {
    try {
      // 1. 参数验证和默认值
      const queryParams = this._validateDocumentParams(params)

      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('documents', queryParams)

      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey)
        console.log('从缓存获取文档列表')
        return cachedData
      }

      // 4. API调用
      const response = await api.getDocuments(queryParams)

      // 5. 数据处理
      const formattedData = this._formatDocumentList(response.data)

      // 6. 状态更新
      this.documentStore.setDocuments(formattedData.documents)
      this.documentStore.setPagination(formattedData.pagination)

      // 7. 更新缓存
      this._setCache(cacheKey, formattedData)

      return formattedData
    } catch (error) {
      // 错误处理
      this._handleGetDocumentsError(error)
      throw error
    }
  }

  /**
   * 获取文档详情
   * @param {string|number} id - 文档ID
   * @param {boolean} [forceRefresh=false] - 是否强制刷新
   * @returns {Promise<Object>} 文档详情
   */
  async getDocumentDetail(id, forceRefresh = false) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('文档ID不能为空')
      }

      // 2. 生成缓存键
      const cacheKey = `document_${id}`

      // 3. 检查缓存
      if (!forceRefresh && this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey)
        console.log('从缓存获取文档详情')
        return cachedData
      }

      // 4. API调用
      const response = await api.getDocumentDetail(id)

      // 5. 数据处理
      const document = this._formatDocumentDetail(response.data)

      // 6. 状态更新
      this.documentStore.setCurrentDocument(document)

      // 7. 更新缓存
      this._setCache(cacheKey, document)

      return document
    } catch (error) {
      // 错误处理
      this._handleGetDocumentDetailError(error, id)
      throw error
    }
  }

  /**
   * 上传文档
   * @param {File} file - 文件对象
   * @param {Object} metadata - 文档元数据
   * @param {string} metadata.title - 文档标题
   * @param {string} [metadata.description] - 文档描述
   * @param {Array} [metadata.tags] - 文档标签
   * @param {string} [metadata.language] - 文档语言
   * @param {Function} [onProgress] - 上传进度回调
   * @returns {Promise<Object>} 上传结果
   */
  async uploadDocument(file, metadata = {}, onProgress = null) {
    try {
      // 1. 参数验证
      this._validateUploadParams(file, metadata)

      // 2. 文件验证
      this._validateFile(file)

      // 3. 创建FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', metadata.title)

      if (metadata.description) {
        formData.append('description', metadata.description)
      }

      if (metadata.tags && metadata.tags.length > 0) {
        formData.append('tags', JSON.stringify(metadata.tags))
      }

      if (metadata.language) {
        formData.append('language', metadata.language)
      }

      // 4. 添加上传任务到队列
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.uploadQueue.set(uploadId, {
        file,
        metadata,
        status: 'uploading',
        progress: 0,
      })

      // 5. API调用（带进度监控）
      const response = await api.uploadDocument(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)

          // 更新上传队列状态
          const uploadInfo = this.uploadQueue.get(uploadId)
          if (uploadInfo) {
            uploadInfo.progress = progress
            this.uploadQueue.set(uploadId, uploadInfo)
          }

          // 调用进度回调
          if (onProgress && typeof onProgress === 'function') {
            onProgress(progress)
          }
        },
      })

      // 6. 数据处理
      const document = this._formatDocumentDetail(response.data)

      // 7. 状态更新
      this.documentStore.addDocument(document)

      // 8. 更新上传队列状态
      this.uploadQueue.set(uploadId, {
        ...this.uploadQueue.get(uploadId),
        status: 'completed',
        documentId: document.id,
      })

      // 9. 用户反馈
      showSuccess(`文档 "${document.title}" 上传成功`)

      return document
    } catch (error) {
      // 错误处理
      this._handleUploadError(error, file.name)
      throw error
    }
  }

  /**
   * 更新文档
   * @param {string|number} id - 文档ID
   * @param {Object} data - 更新数据
   * @param {string} [data.title] - 新标题
   * @param {string} [data.description] - 新描述
   * @param {Array} [data.tags] - 新标签
   * @param {string} [data.language] - 新语言
   * @param {boolean} [data.isPublic] - 是否公开
   * @returns {Promise<Object>} 更新后的文档
   */
  async updateDocument(id, data) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('文档ID不能为空')
      }

      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('更新数据不能为空')
      }

      // 2. API调用
      const response = await api.updateDocument(id, data)

      // 3. 数据处理
      const updatedDocument = this._formatDocumentDetail(response.data)

      // 4. 状态更新
      this.documentStore.updateDocument(updatedDocument)

      // 5. 更新缓存
      const cacheKey = `document_${id}`
      this._setCache(cacheKey, updatedDocument)

      // 6. 清除列表缓存
      this._clearListCache()

      // 7. 用户反馈
      showSuccess('文档更新成功')

      return updatedDocument
    } catch (error) {
      // 错误处理
      this._handleUpdateError(error, id)
      throw error
    }
  }

  /**
   * 删除文档
   * @param {string|number} id - 文档ID
   * @param {boolean} [confirm=true] - 是否需要确认
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteDocument(id, confirm = true) {
    try {
      // 1. 参数验证
      if (!id) {
        throw new Error('文档ID不能为空')
      }

      // 2. 确认删除
      if (confirm) {
        const document =
          this.documentStore.documents.find((doc) => doc.id === id) ||
          this.cache.get(`document_${id}`)

        if (document) {
          const confirmed = window.confirm(
            `确定要删除文档 "${document.title}" 吗？此操作不可恢复。`,
          )
          if (!confirmed) {
            return false
          }
        }
      }

      // 3. API调用
      await api.deleteDocument(id)

      // 4. 状态更新
      this.documentStore.removeDocument(id)

      // 5. 清除缓存
      this._clearDocumentCache(id)

      // 6. 用户反馈
      showSuccess('文档删除成功')

      return true
    } catch (error) {
      // 错误处理
      this._handleDeleteError(error, id)
      throw error
    }
  }

  /**
   * 批量操作文档
   * @param {string} action - 操作类型
   * @param {Array} ids - 文档ID数组
   * @param {Object} [data] - 操作数据
   * @returns {Promise<Object>} 批量操作结果
   */
  async batchDocumentAction(action, ids, data = {}) {
    try {
      // 1. 参数验证
      if (!action) {
        throw new Error('操作类型不能为空')
      }

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('文档ID列表不能为空')
      }

      // 2. 确认批量操作
      const confirmed = window.confirm(`确定要对 ${ids.length} 个文档执行 "${action}" 操作吗？`)
      if (!confirmed) {
        return { success: false, message: '用户取消操作' }
      }

      // 3. API调用
      const response = await api.batchDocumentAction(action, { ids, ...data })

      // 4. 数据处理
      const result = this._formatBatchResult(response.data)

      // 5. 状态更新
      if (action === 'delete') {
        ids.forEach((id) => {
          this.documentStore.removeDocument(id)
          this._clearDocumentCache(id)
        })
      } else if (action === 'update') {
        // 需要重新获取更新后的文档
        await this.getDocuments({ forceRefresh: true })
      }

      // 6. 清除列表缓存
      this._clearListCache()

      // 7. 用户反馈
      showSuccess(`成功对 ${ids.length} 个文档执行 ${action} 操作`)

      return result
    } catch (error) {
      // 错误处理
      this._handleBatchActionError(error, action)
      throw error
    }
  }

  /**
   * 搜索文档
   * @param {string} query - 搜索关键词
   * @param {Object} params - 搜索参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.pageSize=20] - 每页数量
   * @param {string} [params.sortBy='relevance'] - 排序字段
   * @returns {Promise<Object>} 搜索结果
   */
  async searchDocuments(query, params = {}) {
    try {
      // 1. 参数验证
      if (!query || query.trim() === '') {
        throw new Error('搜索关键词不能为空')
      }

      // 2. 生成缓存键
      const cacheKey = this._generateCacheKey('search', { query, ...params })

      // 3. 检查缓存
      if (this._checkCache(cacheKey)) {
        const cachedData = this.cache.get(cacheKey)
        console.log('从缓存获取搜索结果')
        return cachedData
      }

      // 4. API调用
      const response = await api.searchDocuments(query, params)

      // 5. 数据处理
      const searchResults = this._formatSearchResults(response.data)

      // 6. 状态更新
      this.documentStore.setSearchResults(searchResults.documents)
      this.documentStore.setSearchPagination(searchResults.pagination)

      // 7. 更新缓存
      this._setCache(cacheKey, searchResults)

      return searchResults
    } catch (error) {
      // 错误处理
      this._handleSearchError(error, query)
      throw error
    }
  }

  /**
   * 获取文档统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getDocumentStats() {
    try {
      // 1. 生成缓存键
      const cacheKey = 'document_stats'

      // 2. 检查缓存
      if (this._checkCache(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // 3. API调用
      const response = await api.getDocumentStats()

      // 4. 数据处理
      const stats = this._formatStats(response.data)

      // 5. 更新缓存
      this._setCache(cacheKey, stats)

      return stats
    } catch (error) {
      // 错误处理
      this._handleStatsError(error)
      throw error
    }
  }

  /**
   * 获取上传队列状态
   * @returns {Array} 上传队列
   */
  getUploadQueue() {
    return Array.from(this.uploadQueue.values())
  }

  /**
   * 获取上传任务状态
   * @param {string} uploadId - 上传任务ID
   * @returns {Object|null} 上传任务状态
   */
  getUploadStatus(uploadId) {
    return this.uploadQueue.get(uploadId) || null
  }

  /**
   * 取消上传任务
   * @param {string} uploadId - 上传任务ID
   * @returns {boolean} 是否取消成功
   */
  cancelUpload(uploadId) {
    if (this.uploadQueue.has(uploadId)) {
      const uploadInfo = this.uploadQueue.get(uploadId)
      if (uploadInfo.status === 'uploading') {
        // 这里需要实际取消上传请求
        // 假设api.uploadDocument返回的Promise有cancel方法
        // 实际实现取决于HTTP客户端
        console.log(`取消上传: ${uploadInfo.file.name}`)
      }

      this.uploadQueue.delete(uploadId)
      showWarning(`已取消上传: ${uploadInfo.file.name}`)
      return true
    }

    return false
  }

  /**
   * 清除文档缓存
   * @param {string|number} id - 文档ID
   */
  clearDocumentCache(id) {
    this._clearDocumentCache(id)
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.cache.clear()
    console.log('已清除所有文档缓存')
  }

  // ==================== 私有方法 ====================

  /**
   * 验证文档查询参数
   * @param {Object} params - 查询参数
   * @returns {Object} 验证后的参数
   * @private
   */
  _validateDocumentParams(params) {
    const defaultParams = {
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }

    const validatedParams = { ...defaultParams, ...params }

    // 验证页码
    if (validatedParams.page < 1) {
      validatedParams.page = 1
    }

    // 验证每页数量
    if (validatedParams.pageSize < 1 || validatedParams.pageSize > 100) {
      validatedParams.pageSize = 20
    }

    // 验证排序方向
    if (!['asc', 'desc'].includes(validatedParams.sortOrder)) {
      validatedParams.sortOrder = 'desc'
    }

    return validatedParams
  }

  /**
   * 验证上传参数
   * @param {File} file - 文件
   * @param {Object} metadata - 元数据
   * @private
   */
  _validateUploadParams(file, metadata) {
    if (!file || !(file instanceof File)) {
      throw new Error('请选择要上传的文件')
    }

    if (!metadata || !metadata.title || metadata.title.trim() === '') {
      throw new Error('文档标题不能为空')
    }
  }

  /**
   * 验证文件
   * @param {File} file - 文件
   * @private
   */
  _validateFile(file) {
    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/epub+zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html',
    ]

    if (!validateFileType(file, allowedTypes)) {
      throw new Error(`不支持的文件类型: ${file.type || '未知类型'}`)
    }

    // 验证文件大小 (最大100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (!validateFileSize(file, maxSize)) {
      throw new Error(`文件大小不能超过 ${formatFileSize(maxSize)}`)
    }
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
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&')

    return `${prefix}_${paramString}`
  }

  /**
   * 检查缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 缓存是否有效
   * @private
   */
  _checkCache(key) {
    if (!this.cache.has(key)) {
      return false
    }

    const cachedItem = this.cache.get(key)
    const now = Date.now()

    // 检查是否过期
    if (cachedItem.expiry && cachedItem.expiry < now) {
      this.cache.delete(key)
      return false
    }

    return true
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
      expiry: expiry || Date.now() + this.cacheExpiry,
    }

    this.cache.set(key, cacheItem)
  }

  /**
   * 清除文档缓存
   * @param {string|number} id - 文档ID
   * @private
   */
  _clearDocumentCache(id) {
    const cacheKey = `document_${id}`
    this.cache.delete(cacheKey)
  }

  /**
   * 清除列表缓存
   * @private
   */
  _clearListCache() {
    // 清除所有以'documents_'或'search_'开头的缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith('documents_') || key.startsWith('search_')) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 格式化文档列表数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的数据
   * @private
   */
  _formatDocumentList(apiData) {
    const documents = (apiData.documents || apiData.items || []).map((doc) => ({
      id: doc.id || doc.document_id,
      title: doc.title,
      description: doc.description || '',
      fileName: doc.file_name || doc.filename,
      fileSize: doc.file_size ? formatFileSize(doc.file_size) : '未知',
      fileType: doc.file_type || doc.mime_type,
      language: doc.language || 'en',
      pageCount: doc.page_count || doc.total_pages || 0,
      readProgress: doc.read_progress || 0,
      tags: doc.tags || [],
      isPublic: doc.is_public || false,
      isFavorite: doc.is_favorite || false,
      uploader: doc.uploader || doc.user,
      createdAt: formatDate(doc.created_at || doc.createdAt),
      updatedAt: formatDate(doc.updated_at || doc.updatedAt),
      thumbnail: doc.thumbnail_url || doc.cover_image,
    }))

    const pagination = {
      page: apiData.page || 1,
      pageSize: apiData.page_size || apiData.limit || 20,
      total: apiData.total || apiData.total_count || 0,
      totalPages:
        apiData.total_pages || Math.ceil((apiData.total || 0) / (apiData.page_size || 20)),
    }

    return { documents, pagination }
  }

  /**
   * 格式化文档详情数据
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的文档详情
   * @private
   */
  _formatDocumentDetail(apiData) {
    const document = apiData.document || apiData

    return {
      id: document.id || document.document_id,
      title: document.title,
      description: document.description || '',
      fileName: document.file_name || document.filename,
      filePath: document.file_path || document.url,
      fileSize: document.file_size ? formatFileSize(document.file_size) : '未知',
      fileType: document.file_type || document.mime_type,
      language: document.language || 'en',
      pageCount: document.page_count || document.total_pages || 0,
      readProgress: document.read_progress || 0,
      currentPage: document.current_page || 1,
      tags: document.tags || [],
      isPublic: document.is_public || false,
      isFavorite: document.is_favorite || false,
      isProcessed: document.is_processed || false,
      processingStatus: document.processing_status || 'pending',
      uploader: document.uploader || document.user,
      createdAt: formatDate(document.created_at || document.createdAt),
      updatedAt: formatDate(document.updated_at || document.updatedAt),
      lastReadAt: formatDate(document.last_read_at || document.lastReadAt),
      thumbnail: document.thumbnail_url || document.cover_image,
      metadata: document.metadata || {},
    }
  }

  /**
   * 格式化搜索结果
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的搜索结果
   * @private
   */
  _formatSearchResults(apiData) {
    const documents = (apiData.results || apiData.documents || []).map((doc) => ({
      id: doc.id || doc.document_id,
      title: doc.title,
      description: doc.description || '',
      fileName: doc.file_name || doc.filename,
      fileSize: doc.file_size ? formatFileSize(doc.file_size) : '未知',
      fileType: doc.file_type || doc.mime_type,
      language: doc.language || 'en',
      pageCount: doc.page_count || doc.total_pages || 0,
      readProgress: doc.read_progress || 0,
      tags: doc.tags || [],
      relevance: doc.relevance || doc.score || 0,
      highlights: doc.highlights || {},
      createdAt: formatDate(doc.created_at || doc.createdAt),
      thumbnail: doc.thumbnail_url || doc.cover_image,
    }))

    const pagination = {
      page: apiData.page || 1,
      pageSize: apiData.page_size || apiData.limit || 20,
      total: apiData.total || apiData.total_count || 0,
      totalPages:
        apiData.total_pages || Math.ceil((apiData.total || 0) / (apiData.page_size || 20)),
    }

    return { documents, pagination }
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
      failedItems: apiData.failed_items || [],
    }
  }

  /**
   * 格式化统计信息
   * @param {Object} apiData - API返回的数据
   * @returns {Object} 格式化后的统计信息
   * @private
   */
  _formatStats(apiData) {
    return {
      totalDocuments: apiData.total_documents || apiData.total || 0,
      totalSize: apiData.total_size ? formatFileSize(apiData.total_size) : '0 B',
      byLanguage: apiData.by_language || {},
      byType: apiData.by_type || {},
      recentUploads: apiData.recent_uploads || [],
      readingStats: apiData.reading_stats || {
        totalReadingTime: 0,
        averageReadingTime: 0,
        completedDocuments: 0,
      },
    }
  }

  /**
   * 处理获取文档列表错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleGetDocumentsError(error) {
    let message = '获取文档列表失败'

    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录'
          break
        case 403:
          message = '没有权限查看文档列表'
          break
        case 429:
          message = '请求过于频繁，请稍后再试'
          break
        default:
          message = `获取失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理获取文档详情错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 文档ID
   * @private
   */
  _handleGetDocumentDetailError(error, id) {
    let message = `获取文档详情失败 (ID: ${id})`

    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录'
          break
        case 403:
          message = '没有权限查看此文档'
          break
        case 404:
          message = '文档不存在或已被删除'
          break
        default:
          message = `获取失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理上传错误
   * @param {Error} error - 错误对象
   * @param {string} fileName - 文件名
   * @private
   */
  _handleUploadError(error, fileName) {
    let message = `上传文件 "${fileName}" 失败`

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '文件格式不支持或文件损坏'
          break
        case 401:
          message = '请先登录'
          break
        case 403:
          message = '没有上传权限'
          break
        case 413:
          message = '文件太大，请压缩后重试'
          break
        case 429:
          message = '上传过于频繁，请稍后再试'
          break
        default:
          message = `上传失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理更新错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 文档ID
   * @private
   */
  _handleUpdateError(error, id) {
    let message = `更新文档失败 (ID: ${id})`

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '更新数据无效'
          break
        case 401:
          message = '请先登录'
          break
        case 403:
          message = '没有权限更新此文档'
          break
        case 404:
          message = '文档不存在或已被删除'
          break
        default:
          message = `更新失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理删除错误
   * @param {Error} error - 错误对象
   * @param {string|number} id - 文档ID
   * @private
   */
  _handleDeleteError(error, id) {
    let message = `删除文档失败 (ID: ${id})`

    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '请先登录'
          break
        case 403:
          message = '没有权限删除此文档'
          break
        case 404:
          message = '文档不存在或已被删除'
          break
        default:
          message = `删除失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理批量操作错误
   * @param {Error} error - 错误对象
   * @param {string} action - 操作类型
   * @private
   */
  _handleBatchActionError(error, action) {
    let message = `批量${action}操作失败`

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '操作数据无效'
          break
        case 401:
          message = '请先登录'
          break
        case 403:
          message = '没有权限执行此操作'
          break
        case 429:
          message = '操作过于频繁，请稍后再试'
          break
        default:
          message = `操作失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理搜索错误
   * @param {Error} error - 错误对象
   * @param {string} query - 搜索关键词
   * @private
   */
  _handleSearchError(error, query) {
    let message = `搜索 "${query}" 失败`

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '搜索关键词无效'
          break
        case 401:
          message = '请先登录'
          break
        case 429:
          message = '搜索过于频繁，请稍后再试'
          break
        default:
          message = `搜索失败 (${error.response.status})`
      }
    } else if (error.message) {
      message = error.message
    }

    showError(message)
  }

  /**
   * 处理统计信息错误
   * @param {Error} error - 错误对象
   * @private
   */
  _handleStatsError(error) {
    console.error('获取文档统计信息失败:', error)
    showError('获取统计信息失败')
  }
}

// 创建单例实例
const documentService = new DocumentService()

// 导出实例
export default documentService
