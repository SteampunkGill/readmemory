 <!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- 书架主页面容器 -->
  <div class="bookshelf-page">
    <!-- 顶部操作栏：包含搜索框和功能按钮 -->
    <div class="action-bar">
      <!-- 搜索框：点击后跳转到搜索页面 -->
      <div class="search-bar" @click="goToSearch">
        <input type="text" placeholder="搜索文档、生词、笔记..." readonly>
        <button class="search-icon">🔍</button>
      </div>
      <div class="header-actions">
        <!-- 上传文档按钮 -->
        <button class="btn-upload btn-accent" @click="goToUpload">
          <span class="icon">📤</span> 上传文档
        </button>
        <!-- 导入词典按钮：点击后触发隐藏的文件选择框 -->
        <button class="btn-import btn-secondary" @click="triggerImport">
          <span class="icon">📥</span> 导入词典
        </button>
        <!-- 隐藏的文件上传控件，用于导入词典文件 -->
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept=".csv,.json,.txt"
          @change="handleFileChange"
        >
      </div>
    </div>

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
          <div class="card-body">
            <div class="card-top">
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
    <!-- 编辑文档对话框 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>编辑文档信息</h2>
          <button class="close-btn" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input v-model="editForm.title" type="text" placeholder="请输入文档标题">
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="editForm.description" rows="3" placeholder="请输入文档描述"></textarea>
          </div>
          <div class="form-group">
            <label>标签 (逗号分隔)</label>
            <input v-model="editForm.tagsString" type="text" placeholder="标签1, 标签2...">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>语言</label>
              <select v-model="editForm.language">
                <option value="zh">中文</option>
                <option value="en">英文</option>
                <option value="ja">日文</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="editForm.isPublic"> 公开文档
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEditModal">取消</button>
          <button class="btn-primary" @click="saveDocument" :disabled="saving">{{ saving ? '保存中...' : '保存更改' }}</button>
        </div>
      </div>
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
import { API_BASE_URL } from '@/config'

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
const goToUpload = () => router.push('/upload')

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

// 编辑文档相关状态
const showEditModal = ref(false)
const saving = ref(false)
const editForm = reactive({
  id: null,
  title: '',
  description: '',
  tagsString: '',
  language: 'zh',
  isPublic: false
})

/**
 * 打开编辑对话框并填充数据
 */
const editDocument = (doc) => {
  editForm.id = doc.id
  editForm.title = doc.title || ''
  editForm.description = doc.description || ''
  editForm.tagsString = (doc.tags || []).join(', ')
  editForm.language = doc.language || 'zh'
  editForm.isPublic = doc.isPublic || false
  showEditModal.value = true
}

/**
 * 关闭编辑对话框
 */
const closeEditModal = () => {
  showEditModal.value = false
  editForm.id = null
}

/**
 * 保存文档更改
 */
const saveDocument = async () => {
  if (!editForm.title.trim()) {
    showToast('标题不能为空', 'warning')
    return
  }

  saving.value = true
  try {
    const token = auth.getToken()
    const tags = editForm.tagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== '')

    const response = await fetch(`${API_BASE_URL}/documents/${editForm.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        tags: tags,
        language: editForm.language,
        isPublic: editForm.isPublic
      })
    })

    const result = await response.json()
    if (result.success) {
      showToast('文档更新成功', 'success')
      // 更新本地列表中的数据
      const index = documents.value.findIndex(d => d.id === editForm.id)
      if (index !== -1) {
        documents.value[index] = {
          ...documents.value[index],
          ...result.data.document
        }
        updateTabCounts()
      }
      closeEditModal()
    } else {
      showToast(result.message || '更新失败', 'error')
    }
  } catch (error) {
    console.error('更新文档失败:', error)
    showToast('更新失败: ' + error.message, 'error')
  } finally {
    saving.value = false
  }
}

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
 * 书架页面样式 - 童趣风格
 */
.bookshelf-page {
  min-height: 100vh;
  background-color: var(--background-color, #fcf8e8);
  background-image: 
    radial-gradient(circle at 5% 10%, rgba(255, 214, 0, 0.1) 0%, transparent 25%),
    radial-gradient(circle at 95% 90%, rgba(135, 206, 235, 0.1) 0%, transparent 25%),
    repeating-linear-gradient(45deg, 
      transparent, 
      transparent 15px, 
      rgba(255, 182, 193, 0.05) 15px, 
      rgba(255, 182, 193, 0.05) 30px);
  padding: var(--spacing-md, 24px);
  color: var(--text-color-dark, #333333);
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
  position: relative;
  overflow-x: hidden;
}

.bookshelf-page::before {
  content: '📖 📚 ✨';
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 2rem;
  opacity: 0.2;
  animation: float 4s ease-in-out infinite;
}

/* 顶部操作栏样式 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg, 32px) var(--spacing-xl, 48px);
  background-color: var(--surface-color, #ffffff);
  border-radius: var(--border-radius-xl, 35px);
  margin-bottom: var(--spacing-xl, 48px);
  box-shadow: 
    0 15px 35px rgba(135, 206, 235, 0.2),
    0 8px 20px rgba(255, 182, 193, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 5px double var(--primary-color, #87CEEB);
  position: relative;
  overflow: hidden;
}

.action-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(90deg, 
    var(--accent-yellow, #FFD700),
    var(--accent-pink, #FFB6C1),
    var(--primary-color, #87CEEB),
    var(--accent-green, #90EE90));
  border-radius: var(--border-radius-xl, 35px) var(--border-radius-xl, 35px) 0 0;
}

.search-bar {
  flex: 1;
  max-width: 500px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-bar:hover {
  transform: scale(1.02);
}

.search-bar input {
  width: 100%;
  padding: 18px 24px;
  padding-right: 60px;
  border-radius: var(--border-radius-xl, 30px);
  border: 4px solid var(--primary-light, #ADD8E6);
  background-color: rgba(255, 255, 255, 0.95);
  font-size: 1.2rem;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.05),
    0 6px 12px rgba(135, 206, 235, 0.15);
  color: var(--text-color-dark, #333333);
}

.search-bar input::placeholder {
  color: var(--text-color-light, #999999);
  font-style: italic;
  font-weight: 500;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--primary-color, #87CEEB);
  background-color: white;
  box-shadow: 
    0 0 0 8px rgba(135, 206, 235, 0.25),
    0 12px 24px rgba(135, 206, 235, 0.2);
  transform: translateY(-4px);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--primary-color, #87CEEB);
  border: 3px solid var(--primary-dark, #6495ED);
  font-size: 1.4rem;
  cursor: pointer;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

.search-icon:hover {
  background: var(--primary-dark, #6495ED);
  transform: translateY(-50%) scale(1.1) rotate(10deg);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.4);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 24px);
}

.btn-upload, .btn-import {
  padding: 16px 28px;
  border-radius: var(--border-radius-xl, 30px);
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Kalam', cursive;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

.btn-upload::before, .btn-import::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.3), 
    transparent);
  transition: left 0.7s ease;
}

.btn-upload:hover::before, .btn-import:hover::before {
  left: 100%;
}

.btn-upload {
  background: linear-gradient(135deg, 
    var(--accent-yellow, #FFD700) 0%,
    #ffec8b 100%);
  color: var(--text-color-dark, #333333);
  box-shadow: 
    0 10px 25px rgba(255, 214, 0, 0.3),
    0 5px 15px rgba(255, 182, 193, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 4px solid var(--accent-yellow, #FFD700);
}

.btn-upload:hover:not(:disabled) {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 
    0 20px 40px rgba(255, 214, 0, 0.4),
    0 10px 25px rgba(255, 182, 193, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.btn-import {
  background: linear-gradient(135deg, 
    var(--accent-green, #90EE90) 0%,
    #c8f7c5 100%);
  color: var(--text-color-dark, #333333);
  box-shadow: 
    0 10px 25px rgba(144, 238, 144, 0.3),
    0 5px 15px rgba(135, 206, 235, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 4px solid var(--accent-green, #90EE90);
}

.btn-import:hover:not(:disabled) {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 
    0 20px 40px rgba(144, 238, 144, 0.4),
    0 10px 25px rgba(135, 206, 235, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.btn-upload .icon, .btn-import .icon {
  font-size: 1.4rem;
  transition: transform 0.3s ease;
}

.btn-upload:hover .icon, .btn-import:hover .icon {
  transform: rotate(15deg) scale(1.2);
}

.main {
  padding: var(--spacing-lg, 32px);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl, 48px);
  background-color: var(--surface-color, #ffffff);
  border-radius: var(--border-radius-xl, 35px);
  border: 4px dashed var(--primary-light, #ADD8E6);
  margin: var(--spacing-xl, 48px) 0;
  animation: pulse 2s ease-in-out infinite;
}

.loading-spinner {
  width: 70px;
  height: 70px;
  border: 6px solid var(--primary-light, #ADD8E6);
  border-top-color: var(--accent-yellow, #FFD700);
  border-right-color: var(--accent-pink, #FFB6C1);
  border-bottom-color: var(--accent-green, #90EE90);
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  margin-bottom: var(--spacing-md, 24px);
}

.loading-state p {
  color: var(--primary-color, #87CEEB);
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Kalam', cursive;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

/* 筛选标签样式 */
.filters {
  display: flex;
  gap: var(--spacing-sm, 16px);
  margin-bottom: var(--spacing-xl, 48px);
  flex-wrap: wrap;
  padding: var(--spacing-md, 24px);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: var(--border-radius-lg, 25px);
  border: 3px solid var(--primary-light, #ADD8E6);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.15);
}

.tab {
  padding: 14px 28px;
  border-radius: var(--border-radius-xl, 30px);
  border: 4px solid var(--border-color, #e0e0e0);
  background-color: white;
  color: var(--text-color-medium, #666666);
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Quicksand', sans-serif;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  text-align: center;
}

.tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent);
  transition: left 0.5s ease;
}

.tab:hover::before {
  left: 100%;
}

.tab:hover {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.25);
  border-color: var(--primary-color, #87CEEB);
}

.tab.active {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    var(--accent-pink, #FFB6C1) 100%);
  color: white;
  border-color: var(--primary-color, #87CEEB);
  box-shadow: 
    0 10px 25px rgba(135, 206, 235, 0.4),
    0 5px 15px rgba(255, 182, 193, 0.3);
}

/* 文档网格布局 */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg, 32px);
  animation: fadeIn 0.8s ease;
}

/* 文档卡片样式 */
.document-card {
  background-color: var(--surface-color, #ffffff);
  border-radius: var(--border-radius-xl, 35px);
  overflow: hidden;
  box-shadow: 
    0 15px 35px rgba(135, 206, 235, 0.2),
    0 8px 20px rgba(255, 182, 193, 0.15);
  border: 5px solid;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  transform-origin: center;
}

.document-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  border-radius: var(--border-radius-xl, 35px) var(--border-radius-xl, 35px) 0 0;
}

.document-card.unprocessed {
  border-color: #ff9999;
}

.document-card.unprocessed::before {
  background: linear-gradient(90deg, #ff9999, #ffcccc);
}

.document-card.processing {
  border-color: var(--accent-yellow, #FFD700);
}

.document-card.processing::before {
  background: linear-gradient(90deg, var(--accent-yellow, #FFD700), #ffec8b);
}

.document-card.processed {
  border-color: var(--primary-color, #87CEEB);
}

.document-card.processed::before {
  background: linear-gradient(90deg, var(--primary-color, #87CEEB), var(--primary-light, #ADD8E6));
}

.document-card.reading {
  border-color: var(--accent-green, #90EE90);
}

.document-card.reading::before {
  background: linear-gradient(90deg, var(--accent-green, #90EE90), #c8f7c5);
}

.document-card.completed {
  border-color: #9999ff;
}

.document-card.completed::before {
  background: linear-gradient(90deg, #9999ff, #ccccff);
}

.document-card:hover {
  transform: translateY(-12px) scale(1.03);
  box-shadow: 
    0 25px 50px rgba(135, 206, 235, 0.3),
    0 15px 35px rgba(255, 182, 193, 0.25);
}

.card-body {
  padding: var(--spacing-lg, 32px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md, 24px);
}

.status-badge {
  padding: 8px 20px;
  border-radius: var(--border-radius-xl, 30px);
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Kalam', cursive;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.document-card.unprocessed .status-badge {
  background: linear-gradient(135deg, #ff9999, #ffcccc);
  color: var(--text-color-dark, #333333);
}

.document-card.processing .status-badge {
  background: linear-gradient(135deg, var(--accent-yellow, #FFD700), #ffec8b);
  color: var(--text-color-dark, #333333);
}

.document-card.processed .status-badge {
  background: linear-gradient(135deg, var(--primary-color, #87CEEB), var(--primary-light, #ADD8E6));
  color: white;
}

.document-card.reading .status-badge {
  background: linear-gradient(135deg, var(--accent-green, #90EE90), #c8f7c5);
  color: var(--text-color-dark, #333333);
}

.document-card.completed .status-badge {
  background: linear-gradient(135deg, #9999ff, #ccccff);
  color: var(--text-color-dark, #333333);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background-color: rgba(255, 255, 255, 0.95);
  border: 3px solid var(--border-color, #e0e0e0);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.icon-btn:hover {
  transform: scale(1.2) rotate(15deg);
  border-color: var(--primary-color, #87CEEB);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.3);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.title {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-xs, 8px);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  color: var(--primary-dark, #6495ED);
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  color: var(--text-color-medium, #666666);
  margin-bottom: var(--spacing-md, 24px);
  font-size: 1rem;
  font-weight: 600;
  font-style: italic;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: var(--spacing-md, 24px);
  flex-wrap: wrap;
}

.tag {
  background-color: var(--primary-light, #ADD8E6);
  padding: 6px 14px;
  border-radius: var(--border-radius-lg, 22px);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-dark, #6495ED);
  border: 2px solid rgba(135, 206, 235, 0.3);
  transition: all 0.3s ease;
}

.tag:hover {
  transform: translateY(-3px);
  background-color: var(--primary-color, #87CEEB);
  color: white;
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

/* 进度条样式 */
.progress-section {
  margin-bottom: var(--spacing-lg, 32px);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 10px;
  color: var(--text-color-medium, #666666);
  font-weight: 600;
}

.progress-bar {
  height: 12px;
  background-color: rgba(135, 206, 235, 0.2);
  border-radius: var(--border-radius-xl, 30px);
  overflow: hidden;
  border: 2px solid var(--primary-light, #ADD8E6);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--primary-color, #87CEEB),
    var(--accent-pink, #FFB6C1));
  border-radius: var(--border-radius-xl, 30px);
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent);
  animation: shimmer 2s infinite;
}

.card-footer {
  display: flex;
  gap: var(--spacing-sm, 16px);
}

.btn-continue, .btn-start, .btn-details {
  flex: 1;
  padding: 14px 20px;
  border-radius: var(--border-radius-lg, 25px);
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Quicksand', sans-serif;
  position: relative;
  overflow: hidden;
}

.btn-continue::before, .btn-start::before, .btn-details::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.3), 
    transparent);
  transition: left 0.5s ease;
}

.btn-continue:hover::before, .btn-start:hover::before, .btn-details:hover::before {
  left: 100%;
}

.btn-continue {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    var(--primary-light, #ADD8E6) 100%);
  color: white;
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.btn-continue:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-start {
  background: linear-gradient(135deg, 
    var(--accent-green, #90EE90) 0%,
    #c8f7c5 100%);
  color: var(--text-color-dark, #333333);
  box-shadow: 0 6px 12px rgba(144, 238, 144, 0.3);
}

.btn-start:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 24px rgba(144, 238, 144, 0.4);
}

.btn-details {
  background: transparent;
  color: var(--primary-color, #87CEEB);
  border: 3px solid var(--primary-light, #ADD8E6);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.2);
}

.btn-details:hover {
  background: var(--primary-light, #ADD8E6);
  color: white;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.3);
}

/* 空状态样式 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-xl, 48px);
  background-color: var(--surface-color, #ffffff);
  border-radius: var(--border-radius-xl, 35px);
  border: 6px dashed var(--primary-light, #ADD8E6);
  animation: pulse 3s ease-in-out infinite;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-md, 24px);
  animation: bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(135, 206, 235, 0.3));
}

.empty-state h3 {
  font-size: 2rem;
  color: var(--primary-color, #87CEEB);
  margin-bottom: var(--spacing-sm, 16px);
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
}

.empty-state p {
  color: var(--text-color-medium, #666666);
  font-size: 1.2rem;
  margin-bottom: var(--spacing-lg, 32px);
  font-weight: 600;
}

.empty-state .btn-primary {
  background: linear-gradient(135deg, 
    var(--accent-yellow, #FFD700) 0%,
    #ffec8b 100%);
  color: var(--text-color-dark, #333333);
  border: 4px solid var(--accent-yellow, #FFD700);
  padding: 16px 32px;
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Kalam', cursive;
  box-shadow: 
    0 10px 25px rgba(255, 214, 0, 0.3),
    0 5px 15px rgba(255, 182, 193, 0.2);
}

.empty-state .btn-primary:hover {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 
    0 20px 40px rgba(255, 214, 0, 0.4),
    0 10px 25px rgba(255, 182, 193, 0.3);
}

/* Toast 通知样式 */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 20px 32px;
  border-radius: var(--border-radius-xl, 30px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.2),
    0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  font-size: 1.2rem;
  text-align: center;
  min-width: 320px;
  max-width: 90%;
  border: 4px solid;
}

.toast.info {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    var(--primary-light, #ADD8E6) 100%);
  color: white;
  border-color: var(--primary-dark, #6495ED);
}

.toast.success {
  background: linear-gradient(135deg, 
    var(--accent-green, #90EE90) 0%,
    #c8f7c5 100%);
  color: var(--text-color-dark, #333333);
  border-color: #6daa2c;
}

.toast.error {
  background: linear-gradient(135deg, 
    #ff6b6b 0%,
    #ffcccc 100%);
  color: var(--text-color-dark, #333333);
  border-color: #cc474a;
}

.toast.warning {
  background: linear-gradient(135deg, 
    var(--accent-yellow, #FFD700) 0%,
    #ffec8b 100%);
  color: var(--text-color-dark, #333333);
  border-color: #ffcc00;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background-color: var(--surface-color, #ffffff);
  width: 90%;
  max-width: 600px;
  border-radius: var(--border-radius-xl, 35px);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 15px 35px rgba(135, 206, 235, 0.3);
  overflow: hidden;
  animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 6px double var(--primary-color, #87CEEB);
}

@keyframes modalIn {
  from { 
    transform: scale(0.8) rotate(-5deg); 
    opacity: 0; 
  }
  to { 
    transform: scale(1) rotate(0); 
    opacity: 1; 
  }
}

.modal-header {
  padding: var(--spacing-lg, 32px);
  border-bottom: 4px dashed var(--primary-light, #ADD8E6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, 
    rgba(135, 206, 235, 0.1) 0%,
    rgba(255, 182, 193, 0.1) 100%);
}

.modal-header h2 {
  margin: 0;
  font-size: 2rem;
  color: var(--primary-color, #87CEEB);
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2.5rem;
  cursor: pointer;
  color: var(--accent-pink, #FFB6C1);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: rgba(255, 182, 193, 0.2);
  transform: rotate(90deg) scale(1.1);
}

.modal-body {
  padding: var(--spacing-xl, 48px);
}

.form-group {
  margin-bottom: var(--spacing-lg, 32px);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs, 8px);
  font-weight: 700;
  color: var(--primary-dark, #6495ED);
  font-size: 1.1rem;
  font-family: 'Kalam', cursive;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 16px 20px;
  border: 4px solid var(--primary-light, #ADD8E6);
  border-radius: var(--border-radius-lg, 25px);
  font-size: 1.1rem;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--text-color-dark, #333333);
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.05);
}

.form-group input[type="text"]:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color, #87CEEB);
  background-color: white;
  box-shadow: 
    0 0 0 6px rgba(135, 206, 235, 0.25),
    inset 0 4px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-3px);
}

.form-row {
  display: flex;
  gap: var(--spacing-md, 24px);
}

.form-row .form-group {
  flex: 1;
}

.checkbox-group {
  display: flex;
  align-items: center;
  padding-top: 10px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 0;
  font-size: 1.1rem;
  color: var(--text-color-medium, #666666);
}

.checkbox-group input[type="checkbox"] {
  width: 24px;
  height: 24px;
  border: 3px solid var(--primary-color, #87CEEB);
  border-radius: var(--border-radius-sm, 10px);
  cursor: pointer;
  appearance: none;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-group input[type="checkbox"]:checked {
  background-color: var(--accent-yellow, #FFD700);
  border-color: var(--accent-yellow, #FFD700);
}

.checkbox-group input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.modal-footer {
  padding: var(--spacing-lg, 32px);
  border-top: 4px dashed var(--primary-light, #ADD8E6);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md, 24px);
  background: linear-gradient(135deg, 
    rgba(255, 182, 193, 0.1) 0%,
    rgba(144, 238, 144, 0.1) 100%);
}

.modal-footer .btn-secondary,
.modal-footer .btn-primary {
  padding: 14px 28px;
  border-radius: var(--border-radius-xl, 30px);
  font-size: 1.2rem;
  font-weight: 700;
  font-family: 'Kalam', cursive;
  border: 4px solid;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.modal-footer .btn-secondary {
  background: transparent;
  color: var(--text-color-medium, #666666);
  border-color: var(--border-color, #e0e0e0);
}

.modal-footer .btn-secondary:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.modal-footer .btn-primary {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    var(--accent-pink, #FFB6C1) 100%);
  color: white;
  border-color: var(--primary-color, #87CEEB);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.3);
}

.modal-footer .btn-primary:hover:not(:disabled) {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 0 16px 32px rgba(135, 206, 235, 0.4);
}

.modal-footer .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 动画定义 */
@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  33% { 
    transform: translateY(-15px) rotate(5deg); 
  }
  66% { 
    transform: translateY(10px) rotate(-5deg); 
  }
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  25% { 
    transform: translateY(-15px) rotate(-3deg); 
  }
  75% { 
    transform: translateY(-8px) rotate(3deg); 
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateX(-50%) translateY(40px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(-50%) translateY(0); 
  }
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.9; 
    transform: scale(1.02); 
  }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: var(--spacing-md, 24px);
    padding: var(--spacing-lg, 32px);
  }
  
  .search-bar {
    max-width: 100%;
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .filters {
    justify-content: center;
  }
  
  .tab {
    min-width: 100px;
    padding: 12px 20px;
    font-size: 1rem;
  }
  
  .modal-content {
    width: 95%;
    max-width: 95%;
  }
  
  .form-row {
    flex-direction: column;
    gap: var(--spacing-sm, 16px);
  }
}

@media (max-width: 480px) {
  .bookshelf-page {
    padding: var(--spacing-sm, 16px);
  }
  
  .main {
    padding: var(--spacing-sm, 16px);
  }
  
  .action-bar {
    padding: var(--spacing-md, 24px);
    border-radius: var(--border-radius-lg, 25px);
  }
  
  .document-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md, 24px);
  }
  
  .btn-upload, .btn-import {
    padding: 14px 20px;
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: var(--spacing-lg, 32px);
  }
  
  .toast {
    min-width: 280px;
    padding: 16px 24px;
    font-size: 1.1rem;
  }
}
</style>