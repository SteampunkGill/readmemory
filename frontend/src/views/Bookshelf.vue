<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- 书架主页面容器 -->
  <div class="bookshelf-page">
    <!-- 顶部导航栏：包含 Logo、搜索框、功能按钮和用户头像 -->
    <header class="header">
      <div class="logo" @click="$router.push('/')">
        <img src="@/assets/logo.png" alt="Logo" class="logo-img">
        <span class="logo-text">阅记星</span>
      </div>
      <!-- 搜索框：点击后跳转到搜索页面 -->
      <div class="search-bar" @click="goToSearch">
        <input type="text" placeholder="搜索文档、生词、笔记..." readonly>
        <button class="search-icon">🔍</button>
      </div>
      <div class="header-actions">
        <!-- 背单词按钮 -->
        <button class="btn-vocabulary" @click="goToVocabulary">
          <span class="icon">🔤</span> 背单词
        </button>
        <!-- 上传文档按钮 -->
        <button class="btn-upload" @click="goToUpload">
          <span class="icon">📤</span> 上传
        </button>
        <!-- 导入词典按钮：点击后触发隐藏的文件选择框 -->
        <button class="btn-import" @click="triggerImport">
          <span class="icon">📥</span> 导入词典
        </button>
        <!-- 查看词典列表按钮 -->
        <button class="btn-dictionary" @click="$router.push('/vocabulary/list')">
          <span class="icon">📖</span> 查看词典
        </button>
        <!-- 隐藏的文件上传控件，用于导入词典文件 -->
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept=".csv,.json,.txt"
          @change="handleFileChange"
        >
        <!-- 用户头像：点击进入个人中心 -->
        <div class="user-avatar" @click="goToUserCenter">
          <img :src="user.avatarUrl || DEFAULT_AVATAR" alt="用户头像">
        </div>
      </div>
    </header>

    <main class="main">
      <!-- 加载状态：数据获取中显示转圈动画 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载文档...</p>
      </div>

      <!-- 筛选选项卡：按处理状态或阅读进度过滤文档 -->
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

      <!-- 文档网格：展示所有文档卡片 -->
      <div class="document-grid" v-if="!loading">
        <div
          v-for="doc in filteredDocuments"
          :key="doc.id"
          class="document-card"
          :class="getDocumentStatus(doc)"
        >
          <div class="card-header">
            <!-- 文档封面图 -->
            <img :src="doc.thumbnail || DEFAULT_BOOK_COVER" :alt="doc.title" class="cover">
            <!-- 状态标签（如：未处理、阅读中） -->
            <div class="status-badge">{{ getStatusText(doc) }}</div>
            <!-- 卡片右上角的快捷操作按钮 -->
            <div class="card-actions">
              <button class="icon-btn" @click.stop="editDocument(doc)" title="编辑">✏️</button>
              <button class="icon-btn" @click.stop="deleteDocument(doc.id)" title="删除">🗑️</button>
              <!-- 手动触发 OCR 处理按钮（如果文档未自动处理成功） -->
              <button
                class="icon-btn"
                @click.stop="triggerOCR(doc.id)"
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
            <!-- 文档标签 -->
            <div class="tags">
              <span v-for="tag in doc.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <!-- 阅读进度条 -->
            <div class="progress-section">
              <div class="progress-info">
                <span>阅读进度</span>
                <span>{{ doc.readProgress || 0 }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (doc.readProgress || 0) + '%' }"></div>
              </div>
            </div>
            <!-- 卡片底部主操作按钮 -->
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

        <!-- 空状态：当没有文档时显示 -->
        <div class="empty-state" v-if="filteredDocuments.length === 0 && !loading">
          <div class="empty-icon">📚</div>
          <h3>暂无文档</h3>
          <p>上传你的第一份文档开始阅读吧！</p>
          <button class="btn-primary" @click="goToUpload">上传文档</button>
        </div>
      </div>
    </main>

    <!-- 全局通知组件：用于显示成功或错误提示 -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
/**
 * 书架页面逻辑
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/utils/auth'
import { API_BASE_URL, DEFAULT_AVATAR, DEFAULT_BOOK_COVER } from '@/config'

const router = useRouter()
const fileInput = ref(null) // 引用文件上传控件

/**
 * 清除登录状态并重定向到登录页
 * 通常在 Token 过期或接口返回 401 时调用
 */
const clearAuthAndRedirect = () => {
  showToast('登录已过期，正在跳转到登录页...', 'warning')
  auth.clearToken()
  setTimeout(() => {
    router.push('/login')
  }, 2000)
}

// 用户信息状态
const user = reactive({
  avatarUrl: '',
  name: '',
  nickname: ''
})

// 文档列表及 UI 状态
const documents = ref([])
const activeTab = ref('all') // 当前选中的筛选标签
const loading = ref(false) // 是否正在加载数据

// 筛选标签配置
const tabs = reactive([
  { id: 'all', label: '全部', count: 0 },
  { id: 'unprocessed', label: '未处理', count: 0 },
  { id: 'processing', label: '处理中', count: 0 },
  { id: 'processed', label: '已处理', count: 0 },
  { id: 'reading', label: '阅读中', count: 0 },
  { id: 'completed', label: '已完成', count: 0 }
])

// Toast 通知状态
const toast = reactive({
  show: false,
  message: '',
  type: 'info'
})

/**
 * 显示通知消息
 * @param message 消息内容
 * @param type 类型：info, success, warning, error
 */
const showToast = (message, type = 'info') => {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

/**
 * 获取文档状态的中文描述
 */
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

/**
 * 根据文档的各种属性计算其当前状态
 * 逻辑：先看 OCR 处理状态，再看阅读进度
 */
const getDocumentStatus = (doc) => {
  const status = (doc.processingStatus || doc.processing_status || '').toLowerCase();

  if (status === 'pending') return 'unprocessed'
  if (status === 'processing') return 'processing'
  // 如果处理成功，再根据阅读进度细分
  if (status === 'completed' || status === 'success' || status === 'finished') {
    if (doc.readProgress === 100) return 'completed'
    if (doc.readProgress > 0) return 'reading'
    return 'processed'
  }
  return 'unprocessed'
}

/**
 * 计算属性：根据当前选中的标签过滤文档列表
 */
const filteredDocuments = computed(() => {
  if (activeTab.value === 'all') return documents.value
  return documents.value.filter(doc => getDocumentStatus(doc) === activeTab.value)
})

/**
 * 更新每个标签下的文档数量统计
 */
const updateTabCounts = () => {
  tabs.forEach(tab => {
    if (tab.id === 'all') {
      tab.count = documents.value.length
    } else {
      tab.count = documents.value.filter(doc => getDocumentStatus(doc) === tab.id).length
    }
  })
}

/**
 * 从后端 API 获取文档列表
 */
const fetchDocumentsFromAPI = async () => {
  try {
    const token = auth.getToken()

    if (!token) {
      throw new Error('未找到认证令牌，请重新登录')
    }

    const response = await fetch(`${API_BASE_URL}/documents`, {
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
      // 将后端返回的数据映射到前端模型
      documents.value = result.data.documents.map(doc => ({
        ...doc,
        processingStatus: doc.processingStatus || doc.processing_status || 'pending'
      }))

      updateTabCounts()
      checkAndStartPolling()
    } else {
      throw new Error(result.message || '获取文档失败')
    }
  } catch (error) {
    console.error('从API获取文档失败:', error)
    showToast(`获取文档失败: ${error.message}`, 'error')
  }
}

/**
 * 获取当前登录用户信息
 */
const fetchUserFromAPI = async () => {
  try {
    const token = auth.getToken()
    if (!token) return

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 轮询定时器：用于定期检查文档处理状态
let pollingTimer = null

/**
 * 检查是否有正在处理中的文档，如果有则启动轮询
 */
const checkAndStartPolling = () => {
  const hasProcessing = documents.value.some(doc => getDocumentStatus(doc) === 'processing')
  if (hasProcessing && !pollingTimer) {
    pollingTimer = setInterval(() => {
      fetchDocumentsFromAPI()
    }, 5000) // 每 5 秒刷新一次列表
  } else if (!hasProcessing && pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

/**
 * 手动触发文档的 OCR 文字识别处理
 */
const triggerOCR = async (documentId) => {
  try {
    const token = auth.getToken()
    const response = await fetch(`${API_BASE_URL}/documents/trigger-ocr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId })
    })

    if (response.ok) {
      showToast('已成功触发OCR处理，请稍后查看状态', 'success')
      // 立即将状态改为处理中，并启动轮询
      const doc = documents.value.find(d => d.id === documentId)
      if (doc) {
        doc.processingStatus = 'processing'
        updateTabCounts()
        checkAndStartPolling()
      }
    }
  } catch (error) {
    showToast('触发OCR失败: ' + error.message, 'error')
  }
}

/**
 * 初始化加载所有数据
 */
const fetchAllData = async () => {
  loading.value = true
  await Promise.all([
    fetchDocumentsFromAPI(),
    fetchUserFromAPI()
  ])
  loading.value = false
}

// --- 页面跳转与交互函数 ---

const goToSearch = () => router.push('/search')
const goToVocabulary = () => router.push('/vocabulary')
const goToUpload = () => router.push('/upload')
const goToUserCenter = () => router.push('/user')

// 触发文件选择框
const triggerImport = () => fileInput.value.click()

/**
 * 处理词典文件导入
 */
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  
  // 根据后缀名自动识别格式
  let format = 'csv'
  if (file.name.endsWith('.json')) format = 'json'
  else if (file.name.endsWith('.txt')) format = 'txt'
  formData.append('format', format)

  loading.value = true
  showToast('正在导入词典...', 'info')

  try {
    const token = auth.getToken()
    const response = await fetch(`${API_BASE_URL}/vocabulary/import`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    const result = await response.json()
    if (result.success) {
      const { successfullyImported, skipped, failed } = result.data
      showToast(`导入完成: 成功 ${successfullyImported}, 跳过 ${skipped}, 失败 ${failed}`, 'success')
    } else {
      showToast(result.message || '导入失败', 'error')
    }
  } catch (error) {
    showToast('导入出错: ' + error.message, 'error')
  } finally {
    loading.value = false
    event.target.value = '' // 重置 input
  }
}

const editDocument = (doc) => showToast(`编辑功能开发中: ${doc.title}`, 'info')

/**
 * 删除文档
 */
const deleteDocument = async (id) => {
  if (!confirm('确定删除此文档吗？')) return
  try {
    const token = auth.getToken()
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.ok) {
      documents.value = documents.value.filter(doc => doc.id !== id)
      updateTabCounts()
      showToast('文档已删除', 'success')
    }
  } catch (error) {
    showToast('删除失败', 'error')
  }
}

// 跳转到阅读器页面
const continueReading = (doc) => router.push(`/reader/${doc.id}`)
const startReading = (doc) => router.push(`/reader/${doc.id}`)
const showDetails = (doc) => router.push(`/document/${doc.id}`)

/**
 * 生命周期钩子：组件挂载后执行
 */
onMounted(() => {
  fetchAllData()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
/**
 * 书架页面样式
 */
.bookshelf-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: 2rem;
  color: var(--text-color-dark);
}

/* 顶部导航栏样式 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--surface-color);
  box-shadow: var(--shadow-soft);
  border-bottom: 5px solid var(--primary-color);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-title);
  font-weight: bold;
  font-size: 1.5rem;
  color: var(--primary-color);
  cursor: pointer;
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
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--border-color);
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

/* 按钮通用样式 */
.btn-vocabulary, .btn-upload, .btn-continue, .btn-start, .btn-details, .btn-primary, .btn-import, .btn-dictionary {
  padding: 10px 20px;
  border-radius: var(--border-radius-lg);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-vocabulary { background-color: var(--primary-color); }
.btn-upload { background-color: var(--accent-yellow); }
.btn-import { background-color: #4a90e2; color: white; }
.btn-dictionary { background-color: #6daa2c; color: white; }
.btn-primary { background-color: var(--primary-color); }

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--primary-color);
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

/* 筛选标签样式 */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab {
  padding: 10px 20px;
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--border-color);
  background-color: var(--surface-color);
  color: var(--text-color-medium);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s var(--transition-bounce);
}

.tab.active {
  background-color: var(--primary-color);
  color: var(--text-color-dark);
  border-color: var(--primary-color);
}

.tab:hover {
  transform: translateY(-4px);
}

/* 文档网格布局 */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

/* 文档卡片样式 */
.document-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  border: 3px solid transparent;
  transition: all 0.3s var(--transition-bounce);
}

.document-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-medium);
  border-color: var(--primary-color);
}

.card-header {
  position: relative;
  height: 180px;
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
  background-color: var(--primary-color);
  color: var(--text-color-dark);
  padding: 4px 12px;
  border-radius: var(--border-radius-sm);
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
}

.card-body {
  padding: 1.5rem;
}

.title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  color: var(--text-color-medium);
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
  background-color: var(--primary-light);
  padding: 4px 10px;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
}

/* 进度条样式 */
.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.5s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 4px;
  color: var(--text-color-medium);
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

.btn-continue { background-color: var(--primary-color); }
.btn-start { background-color: var(--accent-green); }
.btn-details { background-color: transparent; border: 2px solid var(--border-color); }

/* 空状态样式 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 3px dashed var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Toast 通知样式 */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-hard);
  z-index: 1000;
}

.toast.info { background-color: var(--primary-light); border: 3px solid var(--primary-color); }
.toast.success { background-color: var(--accent-green); border: 3px solid #6daa2c; }
.toast.error { background-color: var(--accent-pink); border: 3px solid #cc474a; }

/* 响应式适配 */
@media (max-width: 768px) {
  .header { flex-direction: column; gap: 1rem; padding: 1rem; }
  .search-bar { max-width: 100%; margin: 0; }
  .document-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
}
</style>