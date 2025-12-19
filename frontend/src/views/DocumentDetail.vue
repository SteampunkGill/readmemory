<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="document-detail-page">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">← 返回</button>
        <h1 class="page-title">文档详情</h1>
      </div>
      <div class="header-actions">
        <button @click="toggleTheme" class="theme-toggle" :title="isDark ? '切换到日间模式' : '切换到夜间模式'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <button class="btn-action" @click="editDocument">✏️ 编辑</button>
        <button class="btn-action" @click="shareDocument">📤 分享</button>
      </div>
    </header>

    <main class="main" v-if="docData">
      <!-- 文档基本信息 -->
      <div class="document-header card">
        <div class="document-info">
          <h1 class="title">{{ docData.title }}</h1>
          <div class="info-rows">
            <div class="info-row">
              <span class="label">作者：</span>
              <span class="value">{{ docData.author || docData.uploader || '未知作者' }}</span>
            </div>
            <div class="info-row">
              <span class="label">上传者：</span>
              <span class="value">{{ docData.uploader || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="label">状态：</span>
              <span class="status-badge" :class="getStatusClass(docData)">{{ getStatusText(docData) }}</span>
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">文件类型</span>
              <span class="meta-value">{{ docData.fileType || 'PDF' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">文件大小</span>
              <span class="meta-value">{{ formatFileSize(docData.fileSize) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">页数</span>
              <span class="meta-value">{{ docData.pageCount || '未知' }} 页</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">语言</span>
              <span class="meta-value">{{ docData.language || '中文' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">上传时间</span>
              <span class="meta-value">{{ formatDate(docData.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">最后更新</span>
              <span class="meta-value">{{ formatDate(docData.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 进度和统计 -->
      <div class="stats-section card">
        <h2 class="section-title">阅读统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ docData.readProgress || 0 }}%</div>
            <div class="stat-label">阅读进度</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (docData.readProgress || 0) + '%' }"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ docData.wordCount || '0' }}</div>
            <div class="stat-label">总字数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ docData.noteCount || '0' }}</div>
            <div class="stat-label">笔记数量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ docData.highlightCount || '0' }}</div>
            <div class="stat-label">高亮数量</div>
          </div>
        </div>
      </div>

      <!-- 标签 -->
      <div class="tags-section card" v-if="docData.tags && docData.tags.length > 0">
        <h2 class="section-title">标签</h2>
        <div class="tags-container">
          <span v-for="tag in docData.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <!-- 描述 -->
      <div class="description-section card" v-if="docData.description">
        <h2 class="section-title">描述</h2>
        <p class="description">{{ docData.description }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section card">
        <h2 class="section-title">操作</h2>
        <div class="action-buttons">
          <button class="btn-primary" @click="startReading">
            {{ docData.readProgress > 0 ? '继续阅读' : '开始阅读' }}
          </button>
          <button class="btn-secondary" @click="toggleFavorite">
            {{ docData.isFavorite ? '取消收藏' : '添加到收藏' }}
          </button>
          <button class="btn-outline" @click="exportDocument">导出文档</button>
          <button class="btn-outline" @click="showNotes">查看笔记</button>
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
import { auth } from '@/utils/auth'

import { API_BASE_URL } from '@/config'

const route = useRoute()
const router = useRouter()

// 主题管理
const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  window.document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

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
const docData = ref(null)
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
  if (docData.value) {
    router.push(`/reader/${docData.value.id}`)
  }
}

const editDocument = () => {
  showToast('编辑功能开发中', 'info')
}

const shareDocument = () => {
  showToast('分享功能开发中', 'info')
}

const toggleFavorite = () => {
  if (docData.value) {
    docData.value.isFavorite = !docData.value.isFavorite
    showToast(docData.value.isFavorite ? '已添加到收藏' : '已取消收藏', 'success')
  }
}

const exportDocument = () => {
  showToast('导出功能开发中', 'info')
}

const showNotes = () => {
  if (docData.value) {
    router.push(`/reader/${docData.value.id}?tab=notes`)
  }
}

const deleteDocument = () => {
  if (docData.value && confirm(`确定删除文档 "${docData.value.title}" 吗？`)) {
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
    
    const token = auth.getToken()
    if (!token) {
      throw new Error('未登录')
    }
    
    const response = await fetch(`${API_BASE_URL}/documents/${route.params.id}`, {
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
      docData.value = result.data
      showToast('文档详情加载成功', 'success')
    } else {
      throw new Error(result.message || '获取文档详情失败')
    }
  } catch (error) {
    console.error('获取文档详情失败:', error)
    showToast('加载文档详情失败，使用模拟数据', 'error')
    // 使用模拟数据
    docData.value = getMockDocumentDetail()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDocumentDetail()
  
  // 初始化主题状态
  const savedTheme = localStorage.getItem('theme') || 'light'
  isDark.value = savedTheme === 'dark'
  window.document.documentElement.setAttribute('data-theme', savedTheme)
  
  // 验证主题状态和CSS变量应用
  console.log('[Debug] 当前主题状态:', savedTheme)
  const bgColor = getComputedStyle(window.document.documentElement).getPropertyValue('--text-color-dark')
  console.log('[Debug] --text-color-dark 变量值:', bgColor)
})
</script>

<style scoped>
.document-detail-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: 3rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--surface-color);
  box-shadow: var(--shadow-soft);
  border-bottom: 4px dashed var(--accent-pink);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-back {
  background-color: var(--primary-light);
  border: none;
  border-radius: var(--border-radius-md);
  padding: 8px 16px;
  font-weight: bold;
  color: var(--text-color-dark);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-back:hover {
  background-color: var(--primary-color);
  transform: translateX(-4px);
}

.page-title {
  font-size: 1.8rem;
  color: var(--primary-dark);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-soft);
}

.theme-toggle:hover {
  transform: rotate(15deg) scale(1.1);
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.btn-action {
  background-color: var(--accent-yellow);
  border: none;
  border-radius: var(--border-radius-md);
  padding: 8px 16px;
  font-weight: bold;
  color: var(--text-color-dark);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--transition-smooth);
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.main {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  border: 2px solid transparent;
  transition: var(--transition-smooth);
}

.card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-medium);
}

.document-header {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2.5rem;
}

.cover-container {
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  aspect-ratio: 3/4;
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
  padding: 1.2rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.cover-container:hover .cover-overlay {
  opacity: 1;
}

.btn-read, .btn-continue {
  padding: 10px;
  border-radius: var(--border-radius-md);
  font-weight: bold;
  cursor: pointer;
  border: none;
  width: 100%;
  font-size: 0.9rem;
}

.btn-read {
  background-color: var(--primary-color);
  color: var(--text-color-dark);
}

.btn-continue {
  background-color: var(--accent-yellow);
  color: var(--text-color-dark);
}

.document-info {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.title {
  font-size: 2.2rem;
  color: var(--primary-dark);
  margin: 0;
  line-height: 1.2;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.1rem;
}

.label {
  color: var(--text-color-light);
  font-weight: bold;
  min-width: 70px;
}

.value {
  color: var(--text-color-dark);
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  font-weight: bold;
}

.status-badge.unprocessed { background-color: var(--accent-pink); color: white; }
.status-badge.processing { background-color: var(--accent-yellow); color: var(--text-color-dark); }
.status-badge.processed { background-color: var(--primary-light); color: var(--text-color-dark); }
.status-badge.reading { background-color: var(--primary-color); color: var(--text-color-dark); }
.status-badge.completed { background-color: var(--accent-green); color: var(--text-color-dark); }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 2px dashed var(--border-color);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.meta-label {
  font-size: 0.85rem;
  color: var(--text-color-light);
}

.meta-value {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-color-dark);
}

.section-title {
  font-size: 1.5rem;
  color: var(--primary-dark);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '✨';
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.2rem;
}

.stat-card {
  text-align: center;
  padding: 1.2rem;
  background-color: var(--background-color);
  border-radius: var(--border-radius-md);
  transition: var(--transition-smooth);
}

.stat-card:hover {
  transform: translateY(-5px);
  background-color: var(--primary-light);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-dark);
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-medium);
  margin-bottom: 0.8rem;
}

.progress-bar {
  height: 10px;
  background-color: var(--border-color);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 5px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.tag {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 6px 14px;
  border-radius: var(--border-radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition-smooth);
}

.tag:hover {
  background-color: var(--accent-yellow);
  transform: scale(1.05);
}

.description {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text-color-medium);
  white-space: pre-line;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-buttons button {
  padding: 12px 24px;
  border-radius: var(--border-radius-md);
  font-weight: bold;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  transition: var(--transition-smooth);
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--text-color-dark);
}

.btn-secondary {
  background-color: var(--accent-pink);
  color: var(--text-color-dark);
}

.btn-outline {
  background-color: transparent;
  border: 2px solid var(--primary-color) !important;
  color: var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-danger {
  background-color: #ff7675;
  color: white;
}

.action-buttons button:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-medium);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  color: var(--text-color-light);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
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
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-hard);
  z-index: 1000;
  animation: slideUp 0.5s var(--transition-bounce);
  font-weight: bold;
}

.toast.info { background-color: var(--primary-light); color: var(--primary-dark); border: 2px solid var(--primary-color); }
.toast.success { background-color: var(--accent-green); color: var(--text-color-dark); border: 2px solid #76c776; }
.toast.error { background-color: var(--accent-pink); color: var(--text-color-dark); border: 2px solid #ff9aa8; }

@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@media (max-width: 768px) {
  .document-header { grid-template-columns: 1fr; }
  .cover-container { max-width: 200px; margin: 0 auto; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .meta-grid { grid-template-columns: repeat(2, 1fr); }
  .action-buttons { flex-direction: column; }
  .action-buttons button { width: 100%; }
  .header { padding: 1rem; }
  .page-title { font-size: 1.4rem; }
}
</style>