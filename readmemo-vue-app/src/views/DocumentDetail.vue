<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="document-detail-page">
    <!-- 顶部导航栏 -->
    <header class="header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1 class="page-title">文档详情</h1>
      <div class="header-actions">
        <button class="btn-action" @click="editDocument">✏️ 编辑</button>
        <button class="btn-action" @click="shareDocument">📤 分享</button>
      </div>
    </header>

    <main class="main" v-if="document">
      <!-- 文档封面和基本信息 -->
      <div class="document-header">
        <div class="cover-container">
          <img :src="document.thumbnail || 'https://picsum.photos/seed/book/400/500'" :alt="document.title" class="cover">
          <div class="cover-overlay">
            <button class="btn-read" @click="startReading">开始阅读</button>
            <button class="btn-continue" v-if="document.readProgress > 0" @click="continueReading">
              继续阅读 ({{ document.readProgress }}%)
            </button>
          </div>
        </div>
        
        <div class="document-info">
          <h1 class="title">{{ document.title }}</h1>
          <div class="author-section">
            <span class="label">作者：</span>
            <span class="value">{{ document.author || document.uploader || '未知作者' }}</span>
          </div>
          <div class="uploader-section">
            <span class="label">上传者：</span>
            <span class="value">{{ document.uploader || '未知' }}</span>
          </div>
          <div class="status-section">
            <span class="label">状态：</span>
            <span class="status-badge" :class="getStatusClass(document)">{{ getStatusText(document) }}</span>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">文件类型</span>
              <span class="meta-value">{{ document.fileType || 'PDF' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">文件大小</span>
              <span class="meta-value">{{ formatFileSize(document.fileSize) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">页数</span>
              <span class="meta-value">{{ document.pageCount || '未知' }} 页</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">语言</span>
              <span class="meta-value">{{ document.language || '中文' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">上传时间</span>
              <span class="meta-value">{{ formatDate(document.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">最后更新</span>
              <span class="meta-value">{{ formatDate(document.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度和统计 -->
      <div class="stats-section">
        <h2 class="section-title">阅读统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ document.readProgress || 0 }}%</div>
            <div class="stat-label">阅读进度</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (document.readProgress || 0) + '%' }"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ document.wordCount || '0' }}</div>
            <div class="stat-label">总字数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ document.noteCount || '0' }}</div>
            <div class="stat-label">笔记数量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ document.highlightCount || '0' }}</div>
            <div class="stat-label">高亮数量</div>
          </div>
        </div>
      </div>

      <!-- 标签 -->
      <div class="tags-section" v-if="document.tags && document.tags.length > 0">
        <h2 class="section-title">标签</h2>
        <div class="tags-container">
          <span v-for="tag in document.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <!-- 描述 -->
      <div class="description-section" v-if="document.description">
        <h2 class="section-title">描述</h2>
        <p class="description">{{ document.description }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <h2 class="section-title">操作</h2>
        <div class="action-buttons">
          <button class="btn-primary" @click="startReading">
            {{ document.readProgress > 0 ? '继续阅读' : '开始阅读' }}
          </button>
          <button class="btn-secondary" @click="toggleFavorite">
            {{ document.isFavorite ? '取消收藏' : '添加到收藏' }}
          </button>
          <button class="btn-secondary" @click="exportDocument">导出文档</button>
          <button class="btn-secondary" @click="showNotes">查看笔记</button>
          <button class="btn-danger" @click="deleteDocument">删除文档</button>
        </div>
      </div>
    </main>

    <!-- 加载状态 -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载文档详情...</p>
    </div>

    <!-- 全局通知 Toast -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 清除认证状态并跳转到登录页
const clearAuthAndRedirect = () => {
  // 显示提示消息
  showToast('登录已过期，正在跳转到登录页...', 'warning')
  
  // 清除所有认证相关的存储
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('expiresIn')
  localStorage.removeItem('isAuthenticated')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('expiresIn')
  sessionStorage.removeItem('isAuthenticated')
  
  // 延迟跳转到登录页，让用户有时间阅读提示
  setTimeout(() => {
    router.push('/login')
  }, 2000)
}

// 文档数据
const document = ref(null)
const isLoading = ref(true)

// 模拟 Toast
const toast = reactive({
  show: false,
  message: '',
  type: 'info'
})

const showToast = (message, type = 'info') => {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

// 根据文档状态获取状态文本
const getStatusText = (doc) => {
  const status = getDocumentStatus(doc)
  const statusMap = {
    unprocessed: '未处理',
    processing: '处理中',
    processed: '已处理',
    reading: '阅读中',
    completed: '已完成'
  }
  return statusMap[status] || '未知状态'
}

// 根据文档状态获取CSS类
const getStatusClass = (doc) => {
  const status = getDocumentStatus(doc)
  return status
}

// 根据文档属性计算状态
const getDocumentStatus = (doc) => {
  if (doc.processing_status === 'pending' || doc.processingStatus === 'pending') return 'unprocessed'
  if (doc.processing_status === 'processing' || doc.processingStatus === 'processing') return 'processing'
  if (doc.processing_status === 'completed' || doc.processingStatus === 'completed') {
    if (doc.readProgress === 100) return 'completed'
    if (doc.readProgress > 0) return 'reading'
    return 'processed'
  }
  return 'unprocessed'
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '未知'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  } catch {
    return dateString
  }
}

// 交互函数
const goBack = () => {
  router.push('/bookshelf')
}

const startReading = () => {
  if (document.value) {
    router.push(`/reader/${document.value.id}`)
  }
}

const continueReading = () => {
  if (document.value) {
    router.push(`/reader/${document.value.id}`)
  }
}

const editDocument = () => {
  showToast('编辑功能开发中', 'info')
}

const shareDocument = () => {
  showToast('分享功能开发中', 'info')
}

const toggleFavorite = () => {
  if (document.value) {
    document.value.isFavorite = !document.value.isFavorite
    showToast(document.value.isFavorite ? '已添加到收藏' : '已取消收藏', 'success')
  }
}

const exportDocument = () => {
  showToast('导出功能开发中', 'info')
}

const showNotes = () => {
  if (document.value) {
    router.push(`/reader/${document.value.id}?tab=notes`)
  }
}

const deleteDocument = () => {
  if (document.value && confirm(`确定删除文档 "${document.value.title}" 吗？`)) {
    showToast('文档已删除', 'success')
    setTimeout(() => {
      router.push('/bookshelf')
    }, 1000)
  }
}

// 模拟数据
const getMockDocumentDetail = () => {
  return {
    id: route.params.id,
    title: '了不起的盖茨比',
    author: 'F. Scott Fitzgerald',
    uploader: '张三',
    description: '《了不起的盖茨比》是美国作家弗朗西斯·斯科特·基·菲茨杰拉德创作的一部以20世纪20年代的纽约市及长岛为背景的中篇小说，出版于1925年。',
    fileName: 'the-great-gatsby.pdf',
    fileSize: 2457600, // 2.4MB
    fileType: 'PDF',
    language: '英文',
    pageCount: 180,
    readProgress: 45,
    wordCount: 50000,
    noteCount: 12,
    highlightCount: 25,
    tags: ['小说', '经典', '美国文学', '爱情', '悲剧'],
    isPublic: true,
    isFavorite: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-20T14:45:00Z',
    thumbnail: 'https://picsum.photos/seed/gatsby/400/500',
    processingStatus: 'completed'
  }
}

// 获取文档详情
const fetchDocumentDetail = async () => {
  try {
    isLoading.value = true
    
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录')
    }
    
    const response = await fetch(`http://localhost:8080/api/v1/documents/${route.params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // 清除认证状态并跳转到登录页
        clearAuthAndRedirect()
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      document.value = result.data
      showToast('文档详情加载成功', 'success')
    } else {
      throw new Error(result.message || '获取文档详情失败')
    }
  } catch (error) {
    console.error('获取文档详情失败:', error)
    showToast('加载文档详情失败，使用模拟数据', 'error')
    // 使用模拟数据
    document.value = getMockDocumentDetail()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDocumentDetail()
})
</script>
<style scoped>
.document-detail-page {
  min-height: 100vh;
  background-color: var(--color-background);
  padding-bottom: 2rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: var(--shadow-soft);
  border-bottom: 5px solid var(--color-primary);
  border-radius: 0 0 var(--radius-large) var(--radius-large);
}

.btn-back {
  background-color: transparent;
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-medium);
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: var(--color-secondary);
}

.page-title {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background-color: var(--color-secondary);
  border: none;
  border-radius: var(--radius-medium);
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.document-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
  background-color: white;
  padding: 2rem;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-soft);
}

.cover-container {
  position: relative;
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-read, .btn-continue {
  padding: 10px 20px;
  border-radius: var(--radius-medium);
  font-weight: bold;
  cursor: pointer;
  border: none;
  width: 100%;
}

.btn-read {
  background-color: var(--color-primary);
  color: white;
}

.btn-continue {
  background-color: var(--color-accent);
  color: var(--color-text);
}

.document-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.title {
  font-size: 2.5rem;
  color: var(--color-text);
  margin: 0;
}

.author-section, .uploader-section, .status-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.label {
  color: var(--color-text-light);
  font-weight: bold;
}

.value {
  color: var(--color-text);
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--radius-small);
  font-size: 0.9rem;
  font-weight: bold;
}

.status-badge.unprocessed {
  background-color: var(--color-error);
  color: white;
}

.status-badge.processing {
  background-color: var(--color-warning);
  color: white;
}

.status-badge.processed {
  background-color: var(--color-info);
  color: white;
}

.status-badge.reading {
  background-color: var(--color-primary);
  color: white;
}

.status-badge.completed {
  background-color: var(--color-success);
  color: white;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--color-secondary);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.meta-label {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.meta-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-text);
}

.stats-section, .tags-section, .description-section, .actions-section {
  background-color: white;
  padding: 2rem;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-soft);
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.8rem;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid var(--color-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-large);
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background-color: var(--color-secondary);
  color: var(--color-text);
  padding: 8px 16px;
  border-radius: var(--radius-large);
  font-size: 0.9rem;
}

.description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-buttons button {
  padding: 12px 24px;
  border-radius: var(--radius-large);
  font-weight: bold;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.action-buttons button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid var(--color-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-hard);
  z-index: 1000;
  animation: slideUp 0.5s var(--transition-bounce);
}

.toast.info {
  background-color: var(--color-info);
  color: white;
  border: 3px solid #0a6ebd;
}

.toast.success {
  background-color: var(--color-success);
  color: white;
  border: 3px solid #6daa2c;
}

.toast.error {
  background-color: var(--color-error);
  color: white;
  border: 3px solid #cc474a;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 768px) {
  .document-header {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .meta-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons button {
    width: 100%;
  }
}
</style>