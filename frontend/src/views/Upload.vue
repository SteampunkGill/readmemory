<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="upload-page">
    <header class="header">
      <button class="btn-back" @click="goBack">← 返回书架</button>
      <h1>上传文档</h1>
      <div class="header-info">
        <span class="info-icon">ℹ️</span>
        <span>支持 PDF, DOCX, TXT, JPG, PNG</span>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在上传文档...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <span class="error-icon">⚠️</span>
      <span>{{ errorMessage }}</span>
      <button class="btn-close-error" @click="errorMessage = ''">×</button>
    </div>

    <main class="main">
      <!-- 拖拽上传区域 -->
      <div
        class="drop-zone"
        :class="{ 'drag-over': dragOver }"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <div class="drop-content">
          <div class="upload-icon">📤</div>
          <h3>拖拽文件到此处或点击选择</h3>
          <p>最大文件大小：50MB</p>
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            multiple
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
            hidden
          />
          <button class="btn-primary">选择文件</button>
        </div>
      </div>

      <!-- 上传队列 -->
      <div class="upload-queue" v-if="files.length > 0">
        <h3>上传队列 ({{ files.length }})</h3>
        <div class="file-list">
          <div v-for="(file, index) in files" :key="index" class="file-item">
            <div class="file-info">
              <span class="file-icon">{{ getFileIcon(file.name) }}</span>
              <div class="file-details">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
            <div class="file-actions">
              <div class="progress" v-if="file.progress < 100">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ file.progress }}%</span>
              </div>
              <span class="status success" v-else>✅ 上传完成</span>
              <button class="btn-remove" @click="removeFile(index)" :disabled="file.progress < 100">
                ✖
              </button>
            </div>
          </div>
        </div>

        <!-- 文档信息表单 -->
        <div class="document-form" v-if="files.some(f => f.progress === 100)">
          <h3>文档信息</h3>
          <div class="form-grid">
            <div class="input-group">
              <label for="title">标题 *</label>
              <input id="title" v-model="document.title" placeholder="输入文档标题" required />
            </div>
            <div class="input-group">
              <label for="author">描述</label>
              <input id="author" v-model="document.author" placeholder="输入描述" />
            </div>
            <div class="input-group">
              <label for="tags">标签</label>
              <input id="tags" v-model="document.tags" placeholder="用逗号分隔，如：小说, 经典" />
            </div>
            <div class="input-group">
              <label for="language">语言</label>
              <select id="language" v-model="document.language">
                <option value="zh">中文</option>
                <option value="en">英文</option>
                <option value="ja">日文</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="resetForm">重置</button>
            <button class="btn-primary" @click="startProcessing" :disabled="processing">
              {{ processing ? '处理中...' : '开始处理' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div class="empty-tip" v-else>
        <p>还没有选择文件？试试拖拽一个文件到上方区域，或点击"选择文件"按钮。</p>
      </div>
    </main>

    <!-- 模拟处理完成提示 -->
    <div v-if="showSuccess" class="success-modal">
      <div class="modal-content">
        <div class="success-icon">🎉</div>
        <h2>处理完成！</h2>
        <p>文档已成功上传并处理，现在可以开始阅读了。</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="goToBookshelf">返回书架</button>
          <button class="btn-outline" @click="goToReader">立即阅读</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/utils/auth'
import { API_BASE_URL } from '@/config'

const router = useRouter()
const fileInput = ref(null)
const dragOver = ref(false)
const processing = ref(false)
const showSuccess = ref(false)
const loading = ref(false)
const errorMessage = ref('')

// 文件队列
const files = ref([])

// 文档信息
const document = reactive({
  title: '',
  author: '',
  tags: '',
  language: 'zh'
})


const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
}

const handleDragOver = (event) => {
  dragOver.value = true
  event.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = () => {
  dragOver.value = false
}

const handleDrop = (event) => {
  dragOver.value = false
  const droppedFiles = Array.from(event.dataTransfer.files)
  addFiles(droppedFiles)
}

const addFiles = (fileList) => {
  fileList.forEach(file => {
    // 检查文件类型
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']
    const fileType = file.type
    if (!allowedTypes.some(type => fileType.includes(type.replace('*', '')))) {
      alert(`文件 ${file.name} 类型不支持`)
      return
    }

    // 检查文件大小 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert(`文件 ${file.name} 超过50MB限制`)
      return
    }

    files.value.push({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      completed: false
    })

    // 模拟上传进度
    simulateUpload(files.value.length - 1)
  })
}

const simulateUpload = (index) => {
  const interval = setInterval(() => {
    if (files.value[index].progress >= 100) {
      clearInterval(interval)
      files.value[index].completed = true
      return
    }
    files.value[index].progress += 10
  }, 200)
}

const removeFile = (index) => {
  if (files.value[index].progress < 100) {
    if (!confirm('文件正在上传，确定取消吗？')) return
  }
  files.value.splice(index, 1)
}

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (ext === 'pdf') return '📕'
  if (ext === 'docx') return '📘'
  if (ext === 'txt') return '📄'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️'
  return '📎'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const resetForm = () => {
  document.title = ''
  document.author = ''
  document.tags = ''
  document.language = 'zh'
}

// 清除认证状态并跳转到登录页
const clearAuthAndRedirect = () => {
  // 显示提示消息
  errorMessage.value = '登录已过期，正在跳转到登录页...'
  
  // 清除所有认证相关的存储
  auth.clearToken()
  
  // 延迟跳转到登录页，让用户有时间阅读提示
  setTimeout(() => {
    router.push('/login')
  }, 2000)
}

const startProcessing = async () => {
  if (!document.title.trim()) {
    alert('请输入文档标题')
    return
  }

  // 获取已上传完成的文件
  const uploadedFiles = files.value.filter(f => f.progress === 100)
  if (uploadedFiles.length === 0) {
    alert('请等待文件上传完成')
    return
  }

  processing.value = true
  loading.value = true
  errorMessage.value = ''

  try {
    // 使用第一个上传完成的文件进行实际API请求
    const fileToUpload = uploadedFiles[0]
    const formData = new FormData()
    formData.append('file', fileToUpload.file)
    formData.append('title', document.title)
    formData.append('description', document.author) // 使用author字段作为description
    formData.append('tags', document.tags)
    formData.append('language', document.language)

    // 从localStorage获取token（假设登录后token存储在localStorage）
    const token = sessionStorage.getItem('token') || localStorage.getItem('token') || ''

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      // 尝试解析错误响应
      const errorText = await response.text()
      let errorMsg = `HTTP错误! 状态码: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.message || errorMsg
      } catch (e) {
        // 如果不是JSON，则使用文本
        errorMsg = errorText || errorMsg
      }
      
      if (response.status === 401) {
        errorMsg = '登录已过期，请重新登录'
        // 清除认证状态并跳转到登录页
        clearAuthAndRedirect()
        return
      } else if (response.status === 500) {
        errorMsg = '服务器内部错误，请稍后重试'
      }
      
      throw new Error(errorMsg)
    }

    const result = await response.json()
    if (result.success) {
      // 使用后端返回的真实数据
      console.log('上传成功，返回数据:', result.data)
      showSuccess.value = true
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    
    // 根据错误类型显示不同的提示
    if (error.message.includes('登录已过期') || error.message.includes('请先登录')) {
      errorMessage.value = '登录已过期，请重新登录'
      // 清除认证状态并跳转到登录页
      clearAuthAndRedirect()
      return
    } else if (error.message.includes('服务器内部错误')) {
      errorMessage.value = '服务器内部错误，请稍后重试'
    } else {
      errorMessage.value = `上传失败: ${error.message}`
    }
  } finally {
    processing.value = false
    loading.value = false
  }
}

const goBack = () => {
  router.push('/bookshelf')
}

const goToBookshelf = () => {
  router.push('/bookshelf')
}

const goToReader = () => {
  router.push('/reader/1')
}
</script>
<style scoped>
/* 定义CSS变量 - 童趣风格 */
.upload-page {
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
.upload-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.upload-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(135, 206, 235, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 头部区域 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  border: 4px wavy var(--accent-pink);
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.btn-back {
  background-color: var(--accent-yellow);
  border: 3px solid var(--accent-yellow);
  color: var(--text-color-dark);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  transition: var(--transition-smooth);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
}

.btn-back:hover {
  background-color: #ffcc00;
  transform: translateX(-5px) scale(1.05);
  box-shadow: 0 8px 16px rgba(255, 215, 0, 0.4);
}

.btn-back:active {
  transform: translateX(-2px) scale(0.98);
}

.header h1 {
  font-size: 2.8rem;
  color: var(--primary-dark);
  margin: 0;
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
  letter-spacing: 1px;
  position: relative;
  display: inline-block;
}

.header h1::after {
  content: "📄";
  position: absolute;
  right: -50px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  animation: bounce 2s infinite alternate;
}

@keyframes bounce {
  0% { transform: translateY(-50%) scale(1); }
  100% { transform: translateY(-60%) scale(1.2); }
}

.header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--primary-light);
  color: var(--text-color-dark);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-weight: 600;
  font-size: 1.1rem;
  border: 3px dashed var(--primary-color);
}

.info-icon {
  font-size: 1.3rem;
  animation: spin 4s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 主要内容区域 */
.main {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(252, 248, 232, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border: 8px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1.5s var(--transition-bounce) infinite;
  margin-bottom: var(--spacing-lg);
}

.loading-overlay p {
  font-size: 1.8rem;
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 错误提示 */
.error-message {
  background-color: var(--accent-pink);
  color: var(--text-color-dark);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  border: 3px solid #ff9eb5;
  box-shadow: var(--shadow-soft);
  position: relative;
  animation: shake 0.5s var(--transition-bounce);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-icon {
  font-size: 1.5rem;
}

.btn-close-error {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  margin-left: auto;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition-smooth);
}

.btn-close-error:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* 拖拽上传区域 */
.drop-zone {
  border: 6px dashed var(--primary-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  background-color: var(--surface-color);
  transition: var(--transition-smooth);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
}

.drop-zone::before {
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

.drop-zone:hover::before {
  opacity: 1;
}

.drop-zone.drag-over {
  border-color: var(--accent-yellow);
  background-color: rgba(255, 215, 0, 0.1);
  transform: scale(1.02);
  box-shadow: var(--shadow-medium);
}

.drop-zone.drag-over::before {
  opacity: 1;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  z-index: 1;
}

.upload-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-sm);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

.drop-content h3 {
  font-size: 2rem;
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
}

.drop-content p {
  color: var(--text-color-medium);
  font-size: 1.2rem;
  font-weight: 500;
  padding: var(--spacing-sm);
  background-color: rgba(173, 216, 230, 0.2);
  border-radius: var(--border-radius-md);
  border: 2px dashed var(--accent-yellow);
}

/* 上传队列 */
.upload-queue h3 {
  font-size: 2rem;
  margin-bottom: var(--spacing-lg);
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
  position: relative;
  display: inline-block;
}

.upload-queue h3::after {
  content: "📋";
  position: absolute;
  right: -40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.8rem;
  animation: bounce 2s infinite alternate;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  border: 4px solid var(--primary-light);
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
}

.file-item:hover {
  border-color: var(--accent-yellow);
  transform: translateY(-5px) scale(1.01);
  box-shadow: var(--shadow-hard);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.file-icon {
  font-size: 2.5rem;
  transition: var(--transition-smooth);
}

.file-item:hover .file-icon {
  transform: scale(1.2) rotate(10deg);
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.file-name {
  font-weight: 700;
  color: var(--text-color-dark);
  font-size: 1.3rem;
  font-family: 'Quicksand', sans-serif;
}

.file-size {
  font-size: 0.95rem;
  color: var(--text-color-light);
  font-weight: 500;
}

/* 文件操作 */
.file-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 220px;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background-color: var(--border-color);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  border: 2px solid var(--primary-color);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-green));
  border-radius: var(--border-radius-xl);
  transition: width 0.5s var(--transition-bounce);
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

.progress-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-dark);
  min-width: 45px;
  text-align: center;
}

.status.success {
  color: var(--accent-green);
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-remove {
  background-color: transparent;
  border: none;
  color: #ff7675;
  font-size: 1.8rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition-smooth);
}

.btn-remove:hover:not(:disabled) {
  background-color: rgba(255, 118, 117, 0.1);
  transform: scale(1.2) rotate(90deg);
}

.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 文档信息表单 */
.document-form {
  background-color: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 4px solid var(--accent-yellow);
  box-shadow: var(--shadow-hard);
  position: relative;
  overflow: hidden;
}

.document-form::before {
  content: "📝";
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 4rem;
  opacity: 0.1;
  transform: rotate(30deg);
}

.document-form h3 {
  font-size: 2rem;
  margin-bottom: var(--spacing-lg);
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
  position: relative;
}

.document-form h3::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 80px;
  height: 6px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-yellow));
  border-radius: 3px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-group label {
  font-weight: 700;
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  padding-left: var(--spacing-xs);
}

.input-group input,
.input-group select {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 3px solid var(--primary-color);
  font-size: 1.1rem;
  font-family: 'Quicksand', sans-serif;
  transition: var(--transition-smooth);
  background-color: var(--background-color);
  color: var(--text-color-dark);
  box-shadow: var(--shadow-soft);
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: var(--accent-yellow);
  box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3);
  transform: translateY(-2px);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

/* 按钮样式 */
.btn-primary, .btn-secondary, .btn-outline {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-size: 1.2rem;
  transition: var(--transition-smooth);
  font-family: 'Quicksand', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-secondary {
  background-color: var(--primary-light);
  color: var(--text-color-dark);
  box-shadow: 0 4px 8px rgba(173, 216, 230, 0.3);
}

.btn-secondary:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-outline {
  background-color: transparent;
  border: 3px solid var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.2);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.3);
}

/* 按钮涟漪效果 */
.btn-primary::after,
.btn-secondary::after,
.btn-outline::after {
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

.btn-primary:focus:not(:active)::after,
.btn-secondary:focus:not(:active)::after,
.btn-outline:focus:not(:active)::after {
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

/* 空状态提示 */
.empty-tip {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-color-light);
  font-size: 1.3rem;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 4px dashed var(--primary-color);
  box-shadow: var(--shadow-soft);
}

/* 成功模态框 */
.success-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal-content {
  background-color: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  text-align: center;
  max-width: 500px;
  width: 90%;
  border: 6px solid var(--accent-green);
  box-shadow: var(--shadow-hard);
  animation: popIn 0.5s var(--transition-bounce);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.8) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.success-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
  animation: celebrate 2s infinite alternate;
}

@keyframes celebrate {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.2) rotate(10deg); }
}

.modal-content h2 {
  font-size: 2.5rem;
  color: var(--accent-green);
  margin-bottom: var(--spacing-md);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(144, 238, 144, 0.3);
}

.modal-content p {
  font-size: 1.3rem;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-xl);
  line-height: 1.8;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-page {
    padding: var(--spacing-md);
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .header h1 {
    font-size: 2.2rem;
  }
  
  .header h1::after {
    display: none;
  }
  
  .drop-zone {
    padding: var(--spacing-lg);
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .file-actions {
    width: 100%;
  }
  
  .progress {
    min-width: auto;
    width: 100%;
  }
  
  .modal-content {
    padding: var(--spacing-lg);
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 1.8rem;
  }
  
  .btn-primary, .btn-secondary, .btn-outline {
    width: 100%;
    margin-bottom: var(--spacing-sm);
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>