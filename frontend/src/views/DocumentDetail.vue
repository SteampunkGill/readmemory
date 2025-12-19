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
/* 定义CSS变量 - 童趣风格 */
.document-detail-page {
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色表面 */
  --primary-color: #87CEEB; /* 天蓝色主色调 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333; /* 深灰文本 */
  --text-color-medium: #666666; /* 中灰文本 */
  --text-color-light: #999999; /* 浅灰文本 */
  --border-color: #e0e0e0; /* 柔和边框色 */
  
  --border-radius-sm: 12px;
  --border-radius-md: 20px;
  --border-radius-lg: 30px;
  --border-radius-xl: 50px;
  
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  --shadow-soft: 0 6px 15px rgba(135, 206, 235, 0.1);
  --shadow-medium: 0 10px 25px rgba(135, 206, 235, 0.2);
  --shadow-hard: 0 15px 35px rgba(135, 206, 235, 0.3);
  
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 字体定义 */
  font-family: 'Quicksand', 'Comfortaa', 'Varela Round', sans-serif;
  line-height: 1.6;
}

/* 整体页面 */
.document-detail-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: var(--spacing-xl);
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(173, 216, 230, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 20%);
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-soft);
  border-bottom: 6px wavy var(--accent-pink);
  position: sticky;
  top: 0;
  z-index: 100;
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.btn-back {
  background-color: var(--accent-yellow);
  border: 3px solid var(--accent-yellow);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 700;
  color: var(--text-color-dark);
  cursor: pointer;
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 1.2rem;
  transition: var(--transition-smooth);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.btn-back:hover {
  transform: translateX(-5px) scale(1.05);
  background-color: #ffcc00;
  box-shadow: 0 8px 16px rgba(255, 215, 0, 0.4);
}

.btn-back:active {
  transform: translateX(-2px) scale(0.98);
}

.page-title {
  font-size: 2.2rem;
  color: var(--primary-dark);
  margin: 0;
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
  letter-spacing: 1px;
  position: relative;
  display: inline-block;
}

.page-title::after {
  content: "📚";
  position: absolute;
  right: -40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.8rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(-50%) rotate(0deg); }
  50% { transform: translateY(-60%) rotate(10deg); }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.theme-toggle {
  background: var(--surface-color);
  border: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  padding: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-soft);
}

.theme-toggle:hover {
  transform: rotate(30deg) scale(1.1);
  border-color: var(--accent-yellow);
  background: var(--primary-light);
  box-shadow: 0 8px 20px rgba(135, 206, 235, 0.3);
}

.btn-action {
  background-color: var(--primary-color);
  border: none;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 700;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition-smooth);
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

.btn-action:hover {
  transform: translateY(-4px) scale(1.05);
  background-color: var(--primary-dark);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.4);
}

.btn-action:active {
  transform: translateY(-1px) scale(0.98);
}

/* 主要内容区域 */
.main {
  padding: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 卡片样式 */
.card {
  background-color: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  border: 4px solid transparent;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, 
    var(--primary-color) 0%, 
    var(--accent-yellow) 25%, 
    var(--accent-pink) 50%, 
    var(--accent-green) 75%, 
    var(--primary-light) 100%);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}

.card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-medium);
  transform: translateY(-5px);
}

/* 文档基本信息 */
.document-header {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
}

.cover-container {
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
  aspect-ratio: 3/4;
  border: 6px solid var(--primary-color);
  transition: var(--transition-smooth);
}

.cover-container:hover {
  transform: rotate(2deg) scale(1.02);
  border-color: var(--accent-yellow);
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
  padding: var(--spacing-md);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity 0.3s;
}

.cover-container:hover .cover-overlay {
  opacity: 1;
}

.btn-read, .btn-continue {
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-weight: 700;
  cursor: pointer;
  border: none;
  width: 100%;
  font-size: 1rem;
  font-family: 'Quicksand', sans-serif;
  transition: var(--transition-smooth);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-read {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

.btn-read:hover {
  background-color: var(--primary-dark);
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.4);
}

.btn-continue {
  background-color: var(--accent-yellow);
  color: var(--text-color-dark);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.btn-continue:hover {
  background-color: #ffcc00;
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(255, 215, 0, 0.4);
}

.document-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.title {
  font-size: 2.8rem;
  color: var(--primary-dark);
  margin: 0;
  line-height: 1.2;
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.2);
  position: relative;
  padding-bottom: var(--spacing-sm);
}

.title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100px;
  height: 6px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-yellow));
  border-radius: 3px;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.2rem;
}

.label {
  color: var(--text-color-medium);
  font-weight: 600;
  min-width: 80px;
  font-family: 'Quicksand', sans-serif;
}

.value {
  color: var(--text-color-dark);
  font-weight: 500;
}

.status-badge {
  padding: 6px 16px;
  border-radius: var(--border-radius-xl);
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Quicksand', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  border: 2px solid;
  transition: var(--transition-smooth);
}

.status-badge:hover {
  transform: scale(1.1) rotate(5deg);
}

.status-badge.unprocessed { 
  background-color: var(--accent-pink); 
  color: white;
  border-color: #ff9eb5;
}

.status-badge.processing { 
  background-color: var(--accent-yellow); 
  color: var(--text-color-dark);
  border-color: #ffcc00;
}

.status-badge.processed { 
  background-color: var(--primary-light); 
  color: var(--text-color-dark);
  border-color: var(--primary-color);
}

.status-badge.reading { 
  background-color: var(--primary-color); 
  color: white;
  border-color: var(--primary-dark);
}

.status-badge.completed { 
  background-color: var(--accent-green); 
  color: var(--text-color-dark);
  border-color: #7ce07c;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 3px dotted var(--border-color);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-sm);
  background-color: rgba(173, 216, 230, 0.1);
  border-radius: var(--border-radius-md);
  transition: var(--transition-smooth);
}

.meta-item:hover {
  background-color: rgba(173, 216, 230, 0.2);
  transform: translateY(-3px);
}

.meta-label {
  font-size: 0.9rem;
  color: var(--text-color-light);
  font-weight: 600;
}

.meta-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color-dark);
}

/* 进度和统计 */
.section-title {
  font-size: 1.8rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-md);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
}

.section-title::before {
  content: "✨";
  font-size: 1.5rem;
  animation: twinkle 2s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.stat-card {
  text-align: center;
  padding: var(--spacing-lg);
  background-color: var(--background-color);
  border-radius: var(--border-radius-lg);
  transition: var(--transition-smooth);
  border: 3px solid transparent;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(135, 206, 235, 0.1) 0%, 
    rgba(255, 215, 0, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.05);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-medium);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
  font-family: 'Kalam', cursive;
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 1rem;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.progress-bar {
  height: 12px;
  background-color: var(--border-color);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-yellow));
  border-radius: var(--border-radius-xl);
  transition: width 1s var(--transition-bounce);
  position: relative;
}

.progress-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 标签区域 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 8px 18px;
  border-radius: var(--border-radius-xl);
  font-size: 1rem;
  font-weight: 600;
  transition: var(--transition-smooth);
  border: 2px solid transparent;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.tag::before {
  content: "#";
  margin-right: 4px;
  color: var(--primary-color);
}

.tag:hover {
  background-color: var(--accent-yellow);
  transform: translateY(-3px) rotate(2deg);
  border-color: var(--primary-color);
  box-shadow: 0 6px 12px rgba(255, 215, 0, 0.3);
}

/* 描述区域 */
.description {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-color-medium);
  white-space: pre-line;
  padding: var(--spacing-md);
  background-color: rgba(173, 216, 230, 0.05);
  border-radius: var(--border-radius-md);
  border-left: 6px solid var(--accent-green);
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.action-buttons button {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-size: 1.1rem;
  transition: var(--transition-smooth);
  font-family: 'Quicksand', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-buttons button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.action-buttons button:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-secondary {
  background-color: var(--accent-pink);
  color: white;
  box-shadow: 0 6px 12px rgba(255, 182, 193, 0.3);
}

.btn-secondary:hover {
  background-color: #ff9eb5;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 24px rgba(255, 182, 193, 0.4);
}

.btn-outline {
  background-color: transparent;
  border: 3px solid var(--primary-color) !important;
  color: var(--primary-color);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.2);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.3);
}

.btn-danger {
  background-color: #ff7675;
  color: white;
  box-shadow: 0 6px 12px rgba(255, 118, 117, 0.3);
}

.btn-danger:hover {
  background-color: #ff5252;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 24px rgba(255, 118, 117, 0.4);
}

.action-buttons button:active {
  transform: translateY(-2px) scale(0.98);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) * 3;
  color: var(--text-color-light);
  min-height: 50vh;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border: 8px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1.5s var(--transition-bounce) infinite;
  margin-bottom: var(--spacing-lg);
  position: relative;
}

.loading-spinner::before {
  content: "📖";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  animation: bounce 2s infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

.loading-state p {
  font-size: 1.3rem;
  font-family: 'Kalam', cursive;
  color: var(--primary-dark);
  margin-top: var(--spacing-md);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 全局通知 Toast */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-hard);
  z-index: 1000;
  animation: slideUp 0.5s var(--transition-bounce);
  font-weight: 700;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  text-align: center;
  min-width: 300px;
  max-width: 90%;
  border: 4px solid;
}

.toast.info { 
  background-color: var(--primary-light); 
  color: var(--primary-dark); 
  border-color: var(--primary-color);
}

.toast.success { 
  background-color: var(--accent-green); 
  color: var(--text-color-dark); 
  border-color: #7ce07c;
}

.toast.error { 
  background-color: var(--accent-pink); 
  color: var(--text-color-dark); 
  border-color: #ff9eb5;
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateX(-50%) translateY(30px) scale(0.9); 
  }
  to { 
    opacity: 1; 
    transform: translateX(-50%) translateY(0) scale(1); 
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .document-header { 
    grid-template-columns: 1fr; 
    gap: var(--spacing-lg);
  }
  
  .cover-container { 
    max-width: 220px; 
    margin: 0 auto; 
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
  
  .header { 
    padding: var(--spacing-md); 
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .header-left {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .page-title::after {
    display: none;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .main {
    padding: var(--spacing-md);
  }
  
  .title {
    font-size: 2.2rem;
  }
  
  .stat-value {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .stats-grid { 
    grid-template-columns: 1fr; 
  }
  
  .meta-grid { 
    grid-template-columns: 1fr; 
  }
  
  .action-buttons button {
    min-width: auto;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .card {
    padding: var(--spacing-md);
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
}

/* 禁用状态 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

button:disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}
</style>