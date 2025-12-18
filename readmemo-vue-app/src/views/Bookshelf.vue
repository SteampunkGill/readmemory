<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="bookshelf-page">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo">
        <img src="@/assets/logo.png" alt="Logo" class="logo-img">
        <span class="logo-text">阅记星</span>
      </div>
      <div class="search-bar" @click="goToSearch">
        <input type="text" placeholder="搜索文档、生词、笔记..." readonly>
        <button class="search-icon">🔍</button>
      </div>
      <div class="header-actions">
        <button class="btn-upload" @click="goToUpload">
          <span class="icon">📤</span> 上传
        </button>
        <div class="user-avatar" @click="goToUserCenter">
          <img :src="user.avatarUrl || user.avatar" alt="用户头像">
        </div>
      </div>
    </header>

    <main class="main">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载文档...</p>
      </div>

      <!-- 筛选选项卡 -->
      <div class="filters" v-if="!loading">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }} ({{ tab.count }})
        </button>
      </div>

      <!-- 文档网格 -->
      <div class="document-grid" v-if="!loading">
        <div
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="document-card"
          :class="getDocumentStatus(doc)"
        >
          <div class="card-header">
            <img :src="doc.thumbnail || 'https://picsum.photos/seed/book/300/200'" :alt="doc.title" class="cover">
            <div class="status-badge">{{ getStatusText(doc) }}</div>
            <div class="card-actions">
              <button class="icon-btn" @click="editDocument(doc)" title="编辑">✏️</button>
              <button class="icon-btn" @click="deleteDocument(doc.id)" title="删除">🗑️</button>
              <!-- 手动触发OCR处理按钮 -->
              <button 
                class="icon-btn" 
                @click="triggerOCR(doc.id)" 
                :disabled="doc.processingStatus === 'processing'"
                :title="doc.processingStatus === 'processing' ? '正在处理中' : '手动触发OCR处理'"
              >
                🔄
              </button>
            </div>
          </div>
          <div class="card-body">
            <h3 class="title">{{ doc.title }}</h3>
            <p class="author">{{ doc.uploader || doc.author || '未知作者' }}</p>
            <div class="tags">
              <span v-for="tag in doc.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="progress-section">
              <div class="progress-info">
                <span>阅读进度</span>
                <span>{{ doc.readProgress || 0 }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (doc.readProgress || 0) + '%' }"></div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn-continue" @click="continueReading(doc)" v-if="doc.readProgress && doc.readProgress > 0">
                继续阅读
              </button>
              <button class="btn-start" @click="startReading(doc)" v-else>
                开始阅读
              </button>
              <button class="btn-details" @click="showDetails(doc)">
                详情
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-if="filteredDocuments.length === 0 && !loading">
          <div class="empty-icon">📚</div>
          <h3>暂无文档</h3>
          <p>上传你的第一份文档开始阅读吧！</p>
          <button class="btn-primary" @click="goToUpload">上传文档</button>
        </div>
      </div>
    </main>

    <!-- 全局通知 Toast -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mockDocumentAPI, mockUserAPI } from '@/mock/api.js'

const router = useRouter()

// 清除认证状态并跳转到登录页
const clearAuthAndRedirect = () => {
  showToast('登录已过期，正在跳转到登录页...', 'warning')
  
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('expiresIn')
  localStorage.removeItem('isAuthenticated')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('expiresIn')
  sessionStorage.removeItem('isAuthenticated')
  
  setTimeout(() => {
    router.push('/login')
  }, 2000)
}

// 用户数据
const user = reactive({
  avatar: 'https://picsum.photos/seed/avatar/100/100',
  avatarUrl: '',
  name: '',
  nickname: ''
})

// 文档数据
const documents = ref([])
const activeTab = ref('all')
const loading = ref(false)

const tabs = [
  { id: 'all', label: '全部', count: 0 },
  { id: 'unprocessed', label: '未处理', count: 0 },
  { id: 'processing', label: '处理中', count: 0 },
  { id: 'processed', label: '已处理', count: 0 },
  { id: 'reading', label: '阅读中', count: 0 },
  { id: 'completed', label: '已完成', count: 0 }
]

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

// 计算筛选后的文档
const filteredDocuments = computed(() => {
  if (activeTab.value === 'all') return documents.value
  return documents.value.filter(doc => getDocumentStatus(doc) === activeTab.value)
})

// 更新选项卡计数
const updateTabCounts = () => {
  tabs.forEach(tab => {
    if (tab.id === 'all') {
      tab.count = documents.value.length
    } else {
      tab.count = documents.value.filter(doc => getDocumentStatus(doc) === tab.id).length
    }
  })
}

// 从后端API获取文档数据
const fetchDocumentsFromAPI = async () => {
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    
    if (!token) {
      throw new Error('未找到认证令牌，请重新登录')
    }

    const response = await fetch('http://localhost:8080/api/v1/documents', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthAndRedirect()
        return
      }
      throw new Error(`HTTP错误! 状态码: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      documents.value = result.data.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        language: doc.language,
        pageCount: doc.pageCount,
        readProgress: doc.readProgress,
        tags: doc.tags || [],
        isPublic: doc.isPublic,
        isFavorite: doc.isFavorite,
        uploader: doc.uploader,
        author: doc.author,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        thumbnail: doc.thumbnail,
        processingStatus: doc.processingStatus || doc.processing_status || 'pending'
      }))
      
      updateTabCounts()
      showToast('文档加载成功', 'success')
    } else {
      throw new Error(result.message || '获取文档失败')
    }
  } catch (error) {
    console.error('从API获取文档失败:', error)
    await fetchMockDocuments()
    showToast(`使用模拟数据: ${error.message}`, 'warning')
  }
}

// 从后端API获取用户信息
const fetchUserFromAPI = async () => {
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    
    if (!token) {
      throw new Error('未找到认证令牌')
    }

    const response = await fetch('http://localhost:8080/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthAndRedirect()
        return
      }
      throw new Error(`HTTP错误! 状态码: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      const userData = result.data.currentUser
      user.avatarUrl = userData.avatarUrl || userData.avatar_url
      user.name = userData.nickname || userData.username
      user.nickname = userData.nickname
    } else {
      throw new Error(result.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('从API获取用户信息失败:', error)
    await fetchMockUserProfile()
    showToast(`使用模拟用户数据: ${error.message}`, 'warning')
  }
}

// 模拟获取数据（作为后备方案）
const fetchMockDocuments = async () => {
  try {
    const data = await mockDocumentAPI.fetchAll()
    documents.value = data
    updateTabCounts()
  } catch (error) {
    console.error('模拟数据获取失败:', error)
    showToast('获取文档失败', 'error')
  }
}

const fetchMockUserProfile = async () => {
  try {
    const profile = await mockUserAPI.getProfile()
    user.avatar = profile.avatar
    user.name = profile.name
  } catch (error) {
    console.error('模拟用户数据获取失败:', error)
  }
}

// 手动触发OCR处理
const triggerOCR = async (documentId) => {
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token') || ''
    if (!token) {
      throw new Error('未找到认证令牌')
    }

    const response = await fetch('http://localhost:8080/api/documents/trigger-ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        showToast('已成功触发OCR处理，请稍后查看状态', 'success')
        // 更新文档状态为处理中
        const docIndex = documents.value.findIndex(doc => doc.id === documentId)
        if (docIndex !== -1) {
          documents.value[docIndex].processingStatus = 'processing'
          updateTabCounts()
        }
      } else {
        throw new Error(result.message || '触发OCR处理失败')
      }
    } else {
      if (response.status === 401) {
        clearAuthAndRedirect()
        return
      }
      const errorData = await response.json()
      throw new Error(errorData.message || '触发OCR处理失败')
    }
  } catch (error) {
    console.error('触发OCR处理失败:', error)
    showToast('触发OCR处理失败: ' + error.message, 'error')
  }
}

// 获取所有数据
const fetchAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchDocumentsFromAPI(),
      fetchUserFromAPI()
    ])
  } catch (error) {
    console.error('数据获取失败:', error)
  } finally {
    loading.value = false
  }
}

// 交互函数
const goToSearch = () => {
  router.push('/search')
}

const goToUpload = () => {
  router.push('/upload')
}

const goToUserCenter = () => {
  router.push('/user')
}

const editDocument = (doc) => {
  showToast(`编辑文档: ${doc.title}`, 'info')
}

const deleteDocument = async (id) => {
  if (confirm('确定删除此文档吗？')) {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token') || ''
      if (!token) {
        throw new Error('未找到认证令牌')
      }

      const response = await fetch(`http://localhost:8080/api/v1/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        documents.value = documents.value.filter(doc => doc.id !== id)
        updateTabCounts()
        showToast('文档已删除', 'success')
      } else {
        if (response.status === 401) {
          clearAuthAndRedirect()
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.message || '删除失败')
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      try {
        await mockDocumentAPI.deleteDocument(id)
        documents.value = documents.value.filter(doc => doc.id !== id)
        updateTabCounts()
        showToast('文档已删除（模拟）', 'success')
      } catch (mockError) {
        showToast('删除失败: ' + error.message, 'error')
      }
    }
  }
}

const continueReading = (doc) => {
  router.push(`/reader/${doc.id}`)
}

const startReading = (doc) => {
  router.push(`/reader/${doc.id}`)
}

const showDetails = (doc) => {
  router.push(`/document/${doc.id}`)
}

onMounted(() => {
  fetchAllData()
  setTimeout(() => {
    showToast('欢迎使用阅记星！', 'info')
  }, 1500)
})
</script>
<style scoped>
.bookshelf-page {
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

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-heading);
  font-weight: bold;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.logo-img {
  width: 40px;
  height: 40px;
}

.search-bar {
  flex: 1;
  max-width: 500px;
  margin: 0 2rem;
  position: relative;
  cursor: pointer;
}

.search-bar input {
  width: 100%;
  padding: 12px 20px;
  padding-right: 50px;
  border-radius: var(--radius-large);
  border: 3px solid var(--color-secondary);
  background-color: #f9f9f9;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-upload {
  background-color: var(--color-accent);
  color: var(--color-text);
  padding: 10px 20px;
  border-radius: var(--radius-large);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-primary);
  cursor: pointer;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main {
  padding: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab {
  padding: 10px 20px;
  border-radius: var(--radius-large);
  border: 3px solid var(--color-secondary);
  background-color: white;
  color: var(--color-text);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s var(--transition-bounce);
}

.tab.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tab:hover {
  transform: translateY(-4px);
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.document-card {
  background-color: white;
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  border: 3px solid transparent;
  transition: all 0.3s var(--transition-bounce);
}

.document-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-medium);
  border-color: var(--color-primary);
}

.card-header {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: var(--color-primary);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-small);
  font-size: 0.8rem;
  font-weight: bold;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: white;
  transform: scale(1.1);
}

.card-body {
  padding: 1.5rem;
}

.title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  color: var(--color-text-light);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tag {
  background-color: var(--color-secondary);
  color: var(--color-text);
  padding: 4px 10px;
  border-radius: var(--radius-small);
  font-size: 0.8rem;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
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

.card-footer {
  display: flex;
  gap: 0.5rem;
}

.card-footer button {
  flex: 1;
  padding: 8px 12px;
  font-size: 0.9rem;
}

.btn-continue {
  background-color: var(--color-primary);
  color: white;
}

.btn-start {
  background-color: var(--color-success);
  color: white;
}

.btn-details {
  background-color: transparent;
  border: 2px solid var(--color-secondary);
  color: var(--color-text);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: var(--radius-large);
  border: 3px dashed var(--color-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite var(--transition-bounce);
}

.empty-state h3 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.empty-state p {
  color: var(--color-text-light);
  margin-bottom: 2rem;
  font-size: 1.1rem;
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
  .header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .search-bar {
    max-width: 100%;
    margin: 0;
  }
  
  .filters {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}
</style>