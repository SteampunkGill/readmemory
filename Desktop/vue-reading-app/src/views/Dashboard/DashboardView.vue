<!-- src/views/Dashboard/DashboardView.vue -->
<!-- 书架/主页 - 用户登录后的主要入口 -->
<template>
  <div class="dashboard-view">
    <!-- 顶部导航栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <div class="logo-container">
          <div class="logo-icon">📚</div>
          <h1 class="logo-text">阅记星</h1>
        </div>
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索文档、单词..."
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button
              v-if="searchQuery"
              class="clear-search-btn"
              @click="clearSearch"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <button class="upload-btn" @click="goToUpload">
          <span class="upload-icon">📤</span>
          <span class="upload-text">上传文档</span>
        </button>
        
        <div class="notification-badge" @click="toggleNotifications">
          <span class="bell-icon">🔔</span>
          <span v-if="unreadCount > 0" class="badge-count">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>
        
        <div class="user-avatar" @click="goToProfile">
          <img
            v-if="userProfile.avatar"
            :src="userProfile.avatar"
            :alt="userProfile.nickname"
            class="avatar-img"
          />
          <div v-else class="avatar-placeholder">
            {{ userProfile.nickname?.charAt(0) || 'U' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 通知面板 -->
    <div v-if="showNotifications" class="notifications-panel">
      <div class="notifications-header">
        <h3>通知</h3>
        <button class="mark-all-read-btn" @click="markAllAsRead">
          全部标记为已读
        </button>
      </div>
      <div class="notifications-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-item', { unread: !notification.read }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            {{ getNotificationIcon(notification.type) }}
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ notification.relativeTime }}</div>
          </div>
          <button
            v-if="!notification.read"
            class="mark-read-btn"
            @click.stop="markAsRead(notification.id)"
          >
            标记已读
          </button>
        </div>
        <div v-if="notifications.length === 0" class="empty-notifications">
          <div class="empty-icon">📭</div>
          <div class="empty-text">暂无通知</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="dashboard-content">
      <!-- 左侧边栏 - 筛选和统计 -->
      <div class="sidebar">
        <!-- 学习统计卡片 -->
        <div class="stats-card">
          <h3 class="stats-title">学习统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">⏱️</div>
              <div class="stat-info">
                <div class="stat-value">{{ formattedReadingTime }}</div>
                <div class="stat-label">学习时长</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📖</div>
              <div class="stat-info">
                <div class="stat-value">{{ learningStats.documentsRead }}</div>
                <div class="stat-label">已读文档</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📝</div>
              <div class="stat-info">
                <div class="stat-value">{{ learningStats.wordsLearned }}</div>
                <div class="stat-label">已学单词</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🔥</div>
              <div class="stat-info">
                <div class="stat-value">{{ learningStats.streakDays }}天</div>
                <div class="stat-label">连续学习</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 筛选器 -->
        <div class="filters-card">
          <h3 class="filters-title">筛选文档</h3>
          
          <!-- 状态筛选 -->
          <div class="filter-section">
            <h4 class="filter-section-title">状态</h4>
            <div class="filter-options">
              <label
                v-for="status in statusOptions"
                :key="status.value"
                class="filter-option"
              >
                <input
                  type="checkbox"
                  :value="status.value"
                  v-model="selectedStatuses"
                  @change="applyFilters"
                />
                <span class="filter-label">{{ status.label }}</span>
              </label>
            </div>
          </div>

          <!-- 语言筛选 -->
          <div class="filter-section">
            <h4 class="filter-section-title">语言</h4>
            <div class="filter-options">
              <label
                v-for="lang in languageOptions"
                :key="lang.value"
                class="filter-option"
              >
                <input
                  type="checkbox"
                  :value="lang.value"
                  v-model="selectedLanguages"
                  @change="applyFilters"
                />
                <span class="filter-label">{{ lang.label }}</span>
              </label>
            </div>
          </div>

          <!-- 排序 -->
          <div class="filter-section">
            <h4 class="filter-section-title">排序</h4>
            <select v-model="sortBy" @change="applyFilters" class="sort-select">
              <option value="created_at">上传时间</option>
              <option value="title">标题</option>
              <option value="updated_at">更新时间</option>
              <option value="read_progress">阅读进度</option>
            </select>
            <select v-model="sortOrder" @change="applyFilters" class="sort-order-select">
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-section">
            <h4 class="filter-section-title">标签</h4>
            <div class="tags-container">
              <span
                v-for="tag in popularTags"
                :key="tag"
                class="tag-badge"
                :class="{ active: selectedTags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <button class="clear-filters-btn" @click="clearAllFilters">
            清除所有筛选
          </button>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions">
          <button class="quick-action-btn" @click="goToVocabulary">
            <span class="action-icon">📚</span>
            <span class="action-text">生词本</span>
          </button>
          <button class="quick-action-btn" @click="goToReview">
            <span class="action-icon">🔄</span>
            <span class="action-text">智能复习</span>
          </button>
          <button class="quick-action-btn" @click="goToStats">
            <span class="action-icon">📊</span>
            <span class="action-text">学习报告</span>
          </button>
        </div>
      </div>

      <!-- 右侧主内容区 -->
      <div class="main-content">
        <!-- 文档列表头部 -->
        <div class="documents-header">
          <h2 class="documents-title">
            我的文档
            <span v-if="pagination.total > 0" class="documents-count">
              ({{ pagination.total }})
            </span>
          </h2>
          
          <div class="view-toggle">
            <button
              :class="['view-toggle-btn', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
            >
              <span class="toggle-icon">◼◼◼</span>
            </button>
            <button
              :class="['view-toggle-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
            >
              <span class="toggle-icon">☰</span>
            </button>
          </div>
        </div>

        <!-- 文档列表 -->
        <div v-if="documents.length > 0" :class="['documents-container', viewMode]">
          <div
            v-for="document in documents"
            :key="document.id"
            class="document-card-wrapper"
          >
            <DocumentCard
              :document="document"
              @click="goToReader(document.id)"
              @edit="goToEdit(document.id)"
              @delete="handleDeleteDocument(document.id)"
              @share="handleShareDocument(document)"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-illustration">📚</div>
          <h3 class="empty-title">还没有文档</h3>
          <p class="empty-description">
            上传你的第一份文档，开始智能英语学习之旅吧！
          </p>
          <button class="empty-action-btn" @click="goToUpload">
            <span class="action-icon">📤</span>
            上传文档
          </button>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button
            class="pagination-btn"
            :disabled="pagination.page === 1"
            @click="goToPage(pagination.page - 1)"
          >
            ← 上一页
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="['page-btn', { active: page === pagination.page }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span v-if="showEllipsis" class="ellipsis">...</span>
          </div>
          
          <button
            class="pagination-btn"
            :disabled="pagination.page === pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            下一页 →
          </button>
        </div>

        <!-- 上传队列 -->
        <div v-if="uploadQueue.length > 0" class="upload-queue">
          <h3 class="upload-queue-title">上传队列</h3>
          <div class="upload-items">
            <div
              v-for="upload in uploadQueue"
              :key="upload.uploadId"
              class="upload-item"
            >
              <div class="upload-info">
                <div class="upload-filename">{{ upload.fileName }}</div>
                <div class="upload-progress">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: upload.progress + '%' }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ upload.progress }}%</span>
                </div>
              </div>
              <button
                class="cancel-upload-btn"
                @click="cancelUpload(upload.uploadId)"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
        <div class="spinner-text">加载中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useDocumentStore } from '@/stores/document.store'
import { useNotificationStore } from '@/stores/notification.store'
import documentService from '@/services/document.service'
import userService from '@/services/user.service'
import notificationService from '@/services/notification.service'
import DocumentCard from '@/components/document/DocumentCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const documentStore = useDocumentStore()
const notificationStore = useNotificationStore()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const showNotifications = ref(false)
const viewMode = ref('grid') // 'grid' 或 'list'

// 筛选相关
const selectedStatuses = ref([])
const selectedLanguages = ref([])
const selectedTags = ref([])
const sortBy = ref('created_at')
const sortOrder = ref('desc')

// 分页相关
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0
})

// 数据
const documents = ref([])
const userProfile = ref({})
const learningStats = ref({})
const notifications = ref([])
const uploadQueue = ref([])

// 计算属性
const unreadCount = computed(() => notificationStore.unreadCount)
const formattedReadingTime = computed(() => {
  return learningStats.value.formattedReadingTime || '0分钟'
})

const statusOptions = computed(() => [
  { value: 'processed', label: '已处理' },
  { value: 'processing', label: '处理中' },
  { value: 'pending', label: '待处理' },
  { value: 'error', label: '处理失败' }
])

const languageOptions = computed(() => [
  { value: 'en', label: '英语' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' }
])

const popularTags = computed(() => {
  const tags = new Set()
  documents.value.forEach(doc => {
    doc.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).slice(0, 10)
})

// 分页相关计算属性
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const showEllipsis = computed(() => {
  return pagination.value.totalPages > 7
})

// 方法
const loadDashboardData = async () => {
  loading.value = true
  try {
    // 并行加载所有数据
    await Promise.all([
      loadDocuments(),
      loadUserProfile(),
      loadLearningStats(),
      loadNotifications(),
      loadUploadQueue()
    ])
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadDocuments = async () => {
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: searchQuery.value || undefined,
      status: selectedStatuses.value.length > 0 ? selectedStatuses.value.join(',') : undefined,
      language: selectedLanguages.value.length > 0 ? selectedLanguages.value.join(',') : undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined
    }
    
    const result = await documentService.getDocuments(params)
    documents.value = result.documents
    pagination.value = result.pagination
  } catch (error) {
    console.error('加载文档失败:', error)
  }
}

const loadUserProfile = async () => {
  try {
    userProfile.value = await userService.getUserProfile()
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

const loadLearningStats = async () => {
  try {
    learningStats.value = await userService.getLearningStats()
  } catch (error) {
    console.error('加载学习统计失败:', error)
  }
}

const loadNotifications = async () => {
  try {
    const result = await notificationService.getNotifications({
      pageSize: 5,
      unreadOnly: false
    })
    notifications.value = result.notifications
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

const loadUploadQueue = () => {
  uploadQueue.value = documentService.getUploadQueue()
}

const handleSearch = () => {
  pagination.value.page = 1
  loadDocuments()
}

const clearSearch = () => {
  searchQuery.value = ''
  pagination.value.page = 1
  loadDocuments()
}

const applyFilters = () => {
  pagination.value.page = 1
  loadDocuments()
}

const clearAllFilters = () => {
  selectedStatuses.value = []
  selectedLanguages.value = []
  selectedTags.value = []
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  applyFilters()
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
  applyFilters()
}

const goToPage = (page) => {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) {
    return
  }
  pagination.value.page = page
  loadDocuments()
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const markAsRead = async (notificationId) => {
  try {
    await notificationService.markAsRead(notificationId)
    await loadNotifications()
  } catch (error) {
    console.error('标记通知为已读失败:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationService.markAllAsRead()
    await loadNotifications()
  } catch (error) {
    console.error('标记所有通知为已读失败:', error)
  }
}

const handleNotificationClick = (notification) => {
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
  } else if (notification.targetId && notification.targetType) {
    switch (notification.targetType) {
      case 'document':
        router.push(`/reader/${notification.targetId}`)
        break
      case 'vocabulary':
        router.push(`/vocabulary/${notification.targetId}`)
        break
      case 'review':
        router.push('/review')
        break
    }
  }
  showNotifications.value = false
}

const getNotificationIcon = (type) => {
  const icons = {
    document_shared: '📄',
    review_reminder: '🔄',
    achievement_unlocked: '🏆',
    system_update: '⚙️',
    promotional: '🎁'
  }
  return icons[type] || '🔔'
}

const goToUpload = () => {
  router.push('/upload')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToReader = (documentId) => {
  router.push(`/reader/${documentId}`)
}

const goToEdit = (documentId) => {
  router.push(`/documents/${documentId}/edit`)
}

const goToVocabulary = () => {
  router.push('/vocabulary')
}

const goToReview = () => {
  router.push('/review')
}

const goToStats = () => {
  router.push('/stats')
}

const handleDeleteDocument = async (documentId) => {
  try {
    const confirmed = window.confirm('确定要删除这个文档吗？此操作不可恢复。')
    if (!confirmed) return
    
    await documentService.deleteDocument(documentId)
    await loadDocuments()
  } catch (error) {
    console.error('删除文档失败:', error)
  }
}

const handleShareDocument = (document) => {
  // 这里可以实现分享功能
  console.log('分享文档:', document)
  // 可以显示分享对话框或复制链接到剪贴板
  if (navigator.share) {
    navigator.share({
      title: document.title,
      text: `分享文档: ${document.title}`,
      url: `${window.location.origin}/reader/${document.id}`
    })
  } else {
    // 备用方案：复制链接到剪贴板
    const url = `${window.location.origin}/reader/${document.id}`
    navigator.clipboard.writeText(url)
    alert('链接已复制到剪贴板')
  }
}

const cancelUpload = (uploadId) => {
  const success = documentService.cancelUpload(uploadId)
  if (success) {
    loadUploadQueue()
  }
}

// 监听搜索查询变化，添加防抖
let searchTimeout = null
watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (newQuery.length === 0 || newQuery.length >= 2) {
      handleSearch()
    }
  }, 500)
})

// 生命周期钩子
onMounted(() => {
  loadDashboardData()
  
  // 设置定时刷新
  const refreshInterval = setInterval(() => {
    loadUploadQueue()
    if (showNotifications.value) {
      loadNotifications()
    }
  }, 5000)
  
  // 保存定时器以便清理
  window.dashboardRefreshInterval = refreshInterval
})

onUnmounted(() => {
  if (window.dashboardRefreshInterval) {
    clearInterval(window.dashboardRefreshInterval)
  }
})
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7ff 0%, #e3e9ff 100%);
  padding: 20px;
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
}

/* 顶部导航栏样式 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 30px;
  padding: 15px 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(93, 106, 251, 0.1);
  border: 3px solid #8a94ff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
  flex: 1;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-family: 'Caveat', cursive;
  font-size: 32px;
  color: #5d6afb;
  margin: 0;
  background: linear-gradient(45deg, #5d6afb, #8a94ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-container {
  flex: 1;
  max-width: 500px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 20px;
  font-size: 20px;
  color: #8a94ff;
}

.search-input {
  width: 100%;
  padding: 16px 50px 16px 55px;
  border: 3px solid #e3e9ff;
  border-radius: 25px;
  font-size: 16px;
  font-family: 'Quicksand', sans-serif;
  background: #f8faff;
  color: #333;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #5d6afb;
  box-shadow: 0 0 0 4px rgba(93, 106, 251, 0.1);
  background: white;
}

.clear-search-btn {
  position: absolute;
  right: 15px;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #5d6afb, #8a94ff);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(93, 106, 251, 0.3);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(93, 106, 251, 0.4);
}

.upload-btn:active {
  transform: translateY(0);
}

.notification-badge {
  position: relative;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  background: #f8faff;
  transition: all 0.3s ease;
}

.notification-badge:hover {
  background: #e3e9ff;
  transform: scale(1.1);
}

.bell-icon {
  font-size: 24px;
  color: #5d6afb;
}

.badge-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff7eb3;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  animation: pulse 2s infinite;
}

.user-avatar {
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #8a94ff;
  transition: all 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: #5d6afb;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #5d6afb, #8a94ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

/* 通知面板样式 */
.notifications-panel {
  position: absolute;
  top: 100px;
  right: 30px;
  width: 400px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border: 3px solid #e3e9ff;
  overflow: hidden;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8faff, #e3e9ff);
  border-bottom: 2px dashed #8a94ff;
}

.notifications-header h3 {
  margin: 0;
  color: #5d6afb;
  font-family: 'Caveat', cursive;
  font-size: 28px;
}

.mark-all-read-btn {
  padding: 8px 16px;
  background: #8a94ff;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mark-all-read-btn:hover {
  background: #5d6afb;
  transform: translateY(-2px);
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:hover {
  background: #f8faff;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-icon {
  font-size: 24px;
  margin-right: 15px;
  min-width: 40px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  font-size: 16px;
}

.notification-message {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
  line-height: 1.4;
}

.notification-time {
  color: #999;
  font-size: 12px;
}

.mark-read-btn {
  padding: 6px 12px;
  background: #e3e9ff;
  color: #5d6afb;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mark-read-btn:hover {
  background: #5d6afb;
  color: white;
}

.empty-notifications {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-text {
  color: #999;
  font-size: 16px;
}

/* 主要内容区域样式 */
.dashboard-content {
  display: flex;
  gap: 30px;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* 统计卡片样式 */
.stats-card {
  background: white;
  border-radius: 25px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 8px 25px rgba(93, 106, 251, 0.1);
  border: 3px solid #8a94ff;
}

.stats-title {
  font-family: 'Caveat', cursive;
  font-size: 28px;
  color: #5d6afb;
  margin: 0 0 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8faff;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(93, 106, 251, 0.2);
}

.stat-icon {
  font-size: 28px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #5d6afb;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 筛选卡片样式 */
.filters-card {
  background: white;
  border-radius: 25px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 8px 25px rgba(93, 106, 251, 0.1);
  border: 3px solid #8a94ff;
}

.filters-title {
  font-family: 'Caveat', cursive;
  font-size: 28px;
  color: #5d6afb;
  margin: 0 0 20px 0;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  background: #f8faff;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.filter-option:hover {
  background: #e3e9ff;
}

.filter-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #8a94ff;
  cursor: pointer;
  appearance: none;
  position: relative;
}

.filter-option input[type="checkbox"]:checked {
  background: #5d6afb;
  border-color: #5d6afb;
}

.filter-option input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.filter-label {
  font-size: 14px;
  color: #333;
}

.sort-select,
.sort-order-select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e3e9ff;
  border-radius: 15px;
  font-size: 14px;
  font-family: 'Quicksand', sans-serif;
  background: #f8faff;
  color: #333;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus,
.sort-order-select:focus {
  outline: none;
  border-color: #5d6afb;
  box-shadow: 0 0 0 3px rgba(93, 106, 251, 0.1);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-badge {
  padding: 6px 12px;
  background: #f0f0f0;
  color: #666;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-badge:hover {
  background: #e3e9ff;
  color: #5d6afb;
}

.tag-badge.active {
  background: #5d6afb;
  color: white;
}

.clear-filters-btn {
  width: 100%;
  padding: 12px;
  background: #ff7eb3;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.clear-filters-btn:hover {
  background: #ff5d9e;
  transform: translateY(-2px);
}

/* 快速操作样式 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: white;
  border: 3px solid #8a94ff;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #5d6afb;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.quick-action-btn:hover {
  background: #f8faff;
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(93, 106, 251, 0.2);
}

.action-icon {
  font-size: 24px;
}

/* 文档列表头部样式 */
.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.documents-title {
  font-family: 'Caveat', cursive;
  font-size: 36px;
  color: #5d6afb;
  margin: 0;
}

.documents-count {
  font-size: 24px;
  color: #8a94ff;
}

.view-toggle {
  display: flex;
  gap: 10px;
  background: #f8faff;
  padding: 5px;
  border-radius: 20px;
}

.view-toggle-btn {
  padding: 10px 15px;
  background: transparent;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-toggle-btn.active {
  background: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.toggle-icon {
  font-size: 18px;
  color: #5d6afb;
}

/* 文档列表容器样式 */
.documents-container {
  display: grid;
  gap: 25px;
}

.documents-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.documents-container.list {
  grid-template-columns: 1fr;
}

.document-card-wrapper {
  transition: all 0.3s ease;
}

.document-card-wrapper:hover {
  transform: translateY(-5px);
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 30px;
  border: 3px dashed #8a94ff;
}

.empty-illustration {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.empty-title {
  font-family: 'Caveat', cursive;
  font-size: 36px;
  color: #5d6afb;
  margin: 0 0 15px 0;
}

.empty-description {
  font-size: 18px;
  color: #666;
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.empty-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #5d6afb, #8a94ff);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(93, 106, 251, 0.3);
}

.empty-action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(93, 106, 251, 0.4);
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding: 20px;
  background: white;
  border-radius: 25px;
  border: 3px solid #e3e9ff;
}

.pagination-btn {
  padding: 10px 20px;
  background: #f8faff;
  color: #5d6afb;
  border: 2px solid #8a94ff;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #5d6afb;
  color: white;
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 10px;
}

.page-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8faff;
  color: #5d6afb;
  border: 2px solid #e3e9ff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover {
  background: #e3e9ff;
  transform: scale(1.1);
}

.page-btn.active {
  background: #5d6afb;
  color: white;
  border-color: #5d6afb;
}

.ellipsis {
  color: #999;
  font-size: 18px;
  margin: 0 5px;
}

/* 上传队列样式 */
.upload-queue {
  margin-top: 30px;
  background: white;
  border-radius: 25px;
  padding: 25px;
  border: 3px solid #8a94ff;
  box-shadow: 0 8px 25px rgba(93, 106, 251, 0.1);
}

.upload-queue-title {
  font-family: 'Caveat', cursive;
  font-size: 28px;
  color: #5d6afb;
  margin: 0 0 20px 0;
}

.upload-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.upload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8faff;
  border-radius: 20px;
  border: 2px dashed #8a94ff;
}

.upload-info {
  flex: 1;
}

.upload-filename {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: #e3e9ff;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5d6afb, #8a94ff);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #5d6afb;
  font-weight: 600;
  min-width: 40px;
}

.cancel-upload-btn {
  padding: 8px 16px;
  background: #ff7eb3;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-upload-btn:hover {
  background: #ff5d9e;
  transform: scale(1.05);
}

/* 加载状态样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
}

.spinner-circle {
  width: 60px;
  height: 60px;
  border: 5px solid #e3e9ff;
  border-top-color: #5d6afb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.spinner-text {
  font-size: 18px;
  color: #5d6afb;
  font-family: 'Caveat', cursive;
}

/* 动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  
  .header-left {
    flex-direction: column;
    width: 100%;
    gap: 20px;
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .documents-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .notifications-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .dashboard-view {
    padding: 10px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .documents-container.grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
}
</style>