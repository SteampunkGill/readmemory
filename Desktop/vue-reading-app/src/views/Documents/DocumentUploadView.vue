<template>
  <div class="document-upload-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">📄 上传文档</h1>
      <p class="page-subtitle">将您的纸质文档数字化，开始智能英语学习之旅</p>
    </div>

    <!-- 上传区域 -->
    <div class="upload-container">
      <!-- 拖拽上传区域 -->
      <div 
        class="dropzone" 
        :class="{ 
          'is-dragover': isDragOver,
          'has-files': files.length > 0,
          'is-uploading': isUploading
        }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <!-- 上传图标 -->
        <div class="upload-icon">
          <div class="icon-wrapper">
            <span class="icon-cloud">☁️</span>
            <span class="icon-arrow">⬆️</span>
          </div>
        </div>

        <!-- 上传提示 -->
        <div class="upload-prompt">
          <h3 v-if="!isUploading">拖拽文件到此处或点击上传</h3>
          <h3 v-else>正在上传文档...</h3>
          <p class="upload-hint">
            支持 PDF、Word、TXT、图片等格式，最大 100MB
          </p>
        </div>

        <!-- 选择文件按钮 -->
        <input
          ref="fileInputRef"
          type="file"
          class="file-input"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
          @change="handleFileSelect"
          style="display: none"
        />

        <!-- 上传进度 -->
        <div v-if="isUploading" class="upload-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <div class="progress-info">
            <span class="progress-text">{{ uploadProgress }}%</span>
            <span class="progress-speed" v-if="uploadSpeed > 0">
              {{ formatSpeed(uploadSpeed) }}
            </span>
          </div>
        </div>

        <!-- 上传状态 -->
        <div v-if="uploadStatus" class="upload-status">
          <div 
            class="status-message" 
            :class="{
              'success': uploadStatus.type === 'success',
              'error': uploadStatus.type === 'error',
              'warning': uploadStatus.type === 'warning'
            }"
          >
            <span class="status-icon">
              {{ getStatusIcon(uploadStatus.type) }}
            </span>
            <span class="status-text">{{ uploadStatus.message }}</span>
          </div>
        </div>
      </div>

      <!-- 上传选项 -->
      <div class="upload-options">
        <div class="option-group">
          <h3 class="option-title">📸 其他上传方式</h3>
          <div class="option-buttons">
            <button 
              class="option-btn camera-btn"
              @click="openCamera"
              :style="optionButtonStyle"
            >
              <span class="btn-icon">📷</span>
              <span class="btn-text">拍照上传</span>
            </button>
            <button 
              class="option-btn scan-btn"
              @click="openScanner"
              :style="optionButtonStyle"
            >
              <span class="btn-icon">🖨️</span>
              <span class="btn-text">扫描上传</span>
            </button>
            <button 
              class="option-btn folder-btn"
              @click="openFolder"
              :style="optionButtonStyle"
            >
              <span class="btn-icon">📁</span>
              <span class="btn-text">选择文件夹</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传列表 -->
    <div v-if="files.length > 0" class="upload-list-container">
      <div class="list-header">
        <h3 class="list-title">📋 上传列表 ({{ files.length }})</h3>
        <div class="list-actions">
          <button 
            class="action-btn clear-btn"
            @click="clearFiles"
            :style="secondaryButtonStyle"
          >
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">清空列表</span>
          </button>
          <button 
            class="action-btn start-btn"
            @click="startUpload"
            :disabled="isUploading || files.length === 0"
            :style="primaryButtonStyle"
          >
            <span class="btn-icon">🚀</span>
            <span class="btn-text">开始上传</span>
          </button>
        </div>
      </div>

      <div class="upload-list">
        <div 
          v-for="(file, index) in files" 
          :key="file.id"
          class="upload-item"
          :class="{
            'uploading': file.status === 'uploading',
            'completed': file.status === 'completed',
            'error': file.status === 'error',
            'paused': file.status === 'paused'
          }"
        >
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-icon">
              <span class="icon">{{ getFileIcon(file.type) }}</span>
            </div>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-type">{{ getFileType(file.type) }}</span>
              </div>
            </div>
          </div>

          <!-- 上传状态 -->
          <div class="file-status">
            <div v-if="file.status === 'pending'" class="status-pending">
              <span class="status-icon">⏳</span>
              <span class="status-text">等待上传</span>
            </div>
            <div v-else-if="file.status === 'uploading'" class="status-uploading">
              <div class="upload-progress-mini">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${file.progress}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ file.progress }}%</span>
            </div>
            <div v-else-if="file.status === 'completed'" class="status-completed">
              <span class="status-icon">✅</span>
              <span class="status-text">上传完成</span>
            </div>
            <div v-else-if="file.status === 'error'" class="status-error">
              <span class="status-icon">❌</span>
              <span class="status-text">{{ file.errorMessage || '上传失败' }}</span>
            </div>
            <div v-else-if="file.status === 'paused'" class="status-paused">
              <span class="status-icon">⏸️</span>
              <span class="status-text">已暂停</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="file-actions">
            <button 
              v-if="file.status === 'pending' || file.status === 'paused'"
              class="action-btn start-btn"
              @click="uploadSingleFile(index)"
              :style="smallButtonStyle"
            >
              <span class="btn-icon">▶️</span>
            </button>
            <button 
              v-if="file.status === 'uploading'"
              class="action-btn pause-btn"
              @click="pauseUpload(index)"
              :style="smallButtonStyle"
            >
              <span class="btn-icon">⏸️</span>
            </button>
            <button 
              class="action-btn remove-btn"
              @click="removeFile(index)"
              :style="deleteButtonStyle"
            >
              <span class="btn-icon">🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档信息表单 -->
    <div v-if="files.length > 0 && !isUploading" class="document-form-container">
      <div class="form-header">
        <h3 class="form-title">📝 文档信息</h3>
        <p class="form-subtitle">为上传的文档添加详细信息</p>
      </div>

      <div class="document-form">
        <!-- 文档标题 -->
        <div class="form-group">
          <label for="document-title" class="form-label">
            <span class="label-icon">📌</span>
            文档标题
          </label>
          <input
            id="document-title"
            v-model="documentInfo.title"
            type="text"
            class="form-input"
            placeholder="请输入文档标题"
            :style="inputStyle"
          />
          <div v-if="formErrors.title" class="form-error">
            {{ formErrors.title }}
          </div>
        </div>

        <!-- 文档描述 -->
        <div class="form-group">
          <label for="document-description" class="form-label">
            <span class="label-icon">📝</span>
            文档描述
          </label>
          <textarea
            id="document-description"
            v-model="documentInfo.description"
            class="form-textarea"
            placeholder="请输入文档描述（可选）"
            rows="3"
            :style="textareaStyle"
          ></textarea>
        </div>

        <!-- 语言选择 -->
        <div class="form-group">
          <label for="document-language" class="form-label">
            <span class="label-icon">🌐</span>
            文档语言
          </label>
          <select
            id="document-language"
            v-model="documentInfo.language"
            class="form-select"
            :style="selectStyle"
          >
            <option value="en">English (英语)</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="fr">Français (法语)</option>
            <option value="de">Deutsch (德语)</option>
            <option value="es">Español (西班牙语)</option>
          </select>
        </div>

        <!-- 标签输入 -->
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🏷️</span>
            文档标签
          </label>
          <div class="tags-input">
            <div class="selected-tags">
              <span 
                v-for="(tag, index) in documentInfo.tags" 
                :key="index"
                class="tag"
                :style="tagStyle"
              >
                {{ tag }}
                <button 
                  class="tag-remove"
                  @click="removeTag(index)"
                >
                  ×
                </button>
              </span>
            </div>
            <input
              v-model="newTag"
              type="text"
              class="tag-input"
              placeholder="输入标签后按回车"
              @keyup.enter="addTag"
              @keyup.space="addTag"
              :style="inputStyle"
            />
            <div class="tag-hint">按回车或空格添加标签</div>
          </div>
        </div>

        <!-- 上传选项 -->
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">⚙️</span>
            上传选项
          </label>
          <div class="upload-options-grid">
            <div class="option-item">
              <input
                id="auto-process"
                v-model="uploadOptions.autoProcess"
                type="checkbox"
                class="option-checkbox"
              />
              <label for="auto-process" class="option-label">
                自动开始OCR处理
              </label>
            </div>
            <div class="option-item">
              <input
                id="public-document"
                v-model="uploadOptions.isPublic"
                type="checkbox"
                class="option-checkbox"
              />
              <label for="public-document" class="option-label">
                设为公开文档
              </label>
            </div>
            <div class="option-item">
              <input
                id="favorite-document"
                v-model="uploadOptions.isFavorite"
                type="checkbox"
                class="option-checkbox"
              />
              <label for="favorite-document" class="option-label">
                添加到收藏夹
              </label>
            </div>
          </div>
        </div>

        <!-- 表单操作 -->
        <div class="form-actions">
          <button 
            class="action-btn cancel-btn"
            @click="cancelUpload"
            :style="secondaryButtonStyle"
          >
            <span class="btn-icon">←</span>
            <span class="btn-text">取消</span>
          </button>
          <button 
            class="action-btn submit-btn"
            @click="submitUpload"
            :disabled="!isFormValid"
            :style="primaryButtonStyle"
          >
            <span class="btn-icon">📤</span>
            <span class="btn-text">确认上传</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 拍照/扫描弹窗 -->
    <div v-if="showCameraModal" class="camera-modal-overlay" @click="closeCameraModal">
      <div class="camera-modal" @click.stop :style="modalStyle">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ cameraMode === 'photo' ? '📷 拍照上传' : '🖨️ 扫描上传' }}
          </h3>
          <button class="close-btn" @click="closeCameraModal">×</button>
        </div>
        
        <div class="modal-content">
          <!-- 摄像头预览 -->
          <div v-if="cameraStream" class="camera-preview">
            <video
              ref="cameraVideoRef"
              class="camera-video"
              autoplay
              playsinline
            ></video>
          </div>
          
          <!-- 拍照/扫描控制 -->
          <div class="camera-controls">
            <button 
              class="control-btn capture-btn"
              @click="captureImage"
              :style="primaryButtonStyle"
            >
              <span class="btn-icon">
                {{ cameraMode === 'photo' ? '📸' : '🖨️' }}
              </span>
              <span class="btn-text">
                {{ cameraMode === 'photo' ? '拍照' : '扫描' }}
              </span>
            </button>
            
            <button 
              class="control-btn switch-btn"
              @click="switchCamera"
              :style="secondaryButtonStyle"
            >
              <span class="btn-icon">🔄</span>
              <span class="btn-text">切换摄像头</span>
            </button>
          </div>
          
          <!-- 预览区域 -->
          <div v-if="capturedImage" class="capture-preview">
            <img :src="capturedImage" class="preview-image" alt="预览" />
            <div class="preview-actions">
              <button 
                class="action-btn retake-btn"
                @click="retakeImage"
                :style="secondaryButtonStyle"
              >
                <span class="btn-icon">🔄</span>
                <span class="btn-text">重拍</span>
              </button>
              <button 
                class="action-btn confirm-btn"
                @click="confirmCapture"
                :style="primaryButtonStyle"
              >
                <span class="btn-icon">✅</span>
                <span class="btn-text">确认使用</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传完成弹窗 -->
    <div v-if="showUploadCompleteModal" class="complete-modal-overlay" @click="closeUploadCompleteModal">
      <div class="complete-modal" @click.stop :style="modalStyle">
        <div class="modal-header">
          <h3 class="modal-title">🎉 上传完成！</h3>
          <button class="close-btn" @click="closeUploadCompleteModal">×</button>
        </div>
        
        <div class="modal-content">
          <div class="success-animation">
            <div class="checkmark">✓</div>
          </div>
          
          <div class="upload-summary">
            <h4 class="summary-title">上传摘要</h4>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">上传文件数：</span>
                <span class="stat-value">{{ uploadSummary.totalFiles }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功：</span>
                <span class="stat-value success">{{ uploadSummary.successCount }}</span>
              </div>
              <div class="stat-item" v-if="uploadSummary.failedCount > 0">
                <span class="stat-label">失败：</span>
                <span class="stat-value error">{{ uploadSummary.failedCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总大小：</span>
                <span class="stat-value">{{ formatFileSize(uploadSummary.totalSize) }}</span>
              </div>
            </div>
          </div>
          
          <div class="next-actions">
            <h4 class="actions-title">下一步操作</h4>
            <div class="action-buttons">
              <button 
                class="action-btn view-btn"
                @click="viewDocuments"
                :style="primaryButtonStyle"
              >
                <span class="btn-icon">📚</span>
                <span class="btn-text">查看文档</span>
              </button>
              <button 
                class="action-btn upload-more-btn"
                @click="uploadMore"
                :style="secondaryButtonStyle"
              >
                <span class="btn-icon">➕</span>
                <span class="btn-text">继续上传</span>
              </button>
              <button 
                class="action-btn process-btn"
                @click="startProcessing"
                v-if="uploadOptions.autoProcess"
                :style="accentButtonStyle"
              >
                <span class="btn-icon">⚡</span>
                <span class="btn-text">开始处理</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 帮助提示 -->
    <div class="help-section">
      <div class="help-card" :style="helpCardStyle">
        <div class="help-icon">💡</div>
        <div class="help-content">
          <h4 class="help-title">上传小贴士</h4>
          <ul class="help-tips">
            <li>确保文档清晰可读，以获得最佳的OCR识别效果</li>
            <li>支持批量上传，可一次性选择多个文件</li>
            <li>上传后系统会自动进行OCR处理，请耐心等待</li>
            <li>可以为文档添加标签，方便后续查找和管理</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '@/stores/document.store'
import documentService from '@/services/document.service'
import { showSuccess, showError, showWarning } from '@/utils/notify'
import { validateFileType, validateFileSize } from '@/utils/file-validator'

// 路由和状态管理
const router = useRouter()
const documentStore = useDocumentStore()

// 响应式数据
const fileInputRef = ref(null)
const cameraVideoRef = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadSpeed = ref(0)
const uploadStartTime = ref(null)

// 文件列表
const files = ref([])
const newTag = ref('')

// 文档信息
const documentInfo = ref({
  title: '',
  description: '',
  language: 'en',
  tags: []
})

// 上传选项
const uploadOptions = ref({
  autoProcess: true,
  isPublic: false,
  isFavorite: false
})

// 表单错误
const formErrors = ref({
  title: ''
})

// 模态框状态
const showCameraModal = ref(false)
const showUploadCompleteModal = ref(false)
const cameraMode = ref('photo') // 'photo' 或 'scan'
const cameraStream = ref(null)
const capturedImage = ref(null)

// 上传摘要
const uploadSummary = ref({
  totalFiles: 0,
  successCount: 0,
  failedCount: 0,
  totalSize: 0
})

// 计算属性
const isFormValid = computed(() => {
  return documentInfo.value.title.trim() !== ''
})

const totalFileSize = computed(() => {
  return files.value.reduce((total, file) => total + file.size, 0)
})

const completedCount = computed(() => {
  return files.value.filter(file => file.status === 'completed').length
})

const failedCount = computed(() => {
  return files.value.filter(file => file.status === 'error').length
})

// UI样式计算属性
const primaryButtonStyle = computed(() => ({
  borderRadius: '20px',
  background: 'linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%)',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(93, 106, 251, 0.3)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(93, 106, 251, 0.4)'
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none'
  }
}))

const secondaryButtonStyle = computed(() => ({
  borderRadius: '20px',
  background: '#f0f2ff',
  color: '#5d6afb',
  border: '2px solid #8a94ff',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: '#e3e6ff',
    transform: 'translateY(-2px)'
  }
}))

const accentButtonStyle = computed(() => ({
  borderRadius: '20px',
  background: 'linear-gradient(135deg, #ff7eb3 0%, #ff9ec5 100%)',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(255, 126, 179, 0.3)'
}))

const deleteButtonStyle = computed(() => ({
  borderRadius: '15px',
  background: 'linear-gradient(135deg, #ff7eb3 0%, #ff9ec5 100%)',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
}))

const smallButtonStyle = computed(() => ({
  borderRadius: '15px',
  background: 'linear-gradient(135deg, #4cd964 0%, #6de382 100%)',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
}))

const optionButtonStyle = computed(() => ({
  borderRadius: '20px',
  background: 'linear-gradient(135deg, #8a94ff 0%, #a5adff 100%)',
  color: 'white',
  border: 'none',
  padding: '15px 25px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(138, 148, 255, 0.3)',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 16px rgba(138, 148, 255, 0.4)'
  }
}))

const inputStyle = computed(() => ({
  borderRadius: '15px',
  border: '3px solid #8a94ff',
  padding: '12px 16px',
  fontSize: '16px',
  fontFamily: "'Comfortaa', cursive",
  outline: 'none',
  transition: 'all 0.3s ease',
  '&:focus': {
    borderColor: '#5d6afb',
    boxShadow: '0 0 0 4px rgba(93, 106, 251, 0.1)'
  }
}))

const textareaStyle = computed(() => ({
  ...inputStyle.value,
  resize: 'vertical',
  minHeight: '100px'
}))

const selectStyle = computed(() => ({
  ...inputStyle.value,
  cursor: 'pointer'
}))

const tagStyle = computed(() => ({
  borderRadius: '15px',
  background: 'linear-gradient(135deg, #8a94ff 0%, #a5adff 100%)',
  color: 'white',
  padding: '6px 12px',
  fontSize: '14px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  margin: '4px'
}))

const modalStyle = computed(() => ({
  borderRadius: '30px',
  background: 'white',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  maxWidth: '600px',
  width: '90%'
}))

const helpCardStyle = computed(() => ({
  borderRadius: '25px',
  background: 'linear-gradient(135deg, #f0f2ff 0%, #e3e6ff 100%)',
  border: '3px solid #8a94ff',
  padding: '25px'
}))

// 方法
// 触发文件选择
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInputRef.value.click()
  }
}

// 处理文件选择
const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
  event.target.value = '' // 重置input
}

// 添加文件到列表
const addFiles = (fileList) => {
  const allowedTypes = [
    'application/pdf',
    'application/epub+zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/html',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  const maxSize = 100 * 1024 * 1024 // 100MB

  fileList.forEach(file => {
    // 验证文件类型
    if (!validateFileType(file, allowedTypes)) {
      showError(`不支持的文件类型: ${file.name}`)
      return
    }

    // 验证文件大小
    if (!validateFileSize(file, maxSize)) {
      showError(`文件太大: ${file.name} (最大100MB)`)
      return
    }

    // 检查是否已存在
    const existingFile = files.value.find(f => 
      f.name === file.name && f.size === file.size
    )

    if (!existingFile) {
      files.value.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        errorMessage: ''
      })
    }
  })
}

// 移除文件
const removeFile = (index) => {
  files.value.splice(index, 1)
}

// 清空文件列表
const clearFiles = () => {
  if (files.value.length > 0) {
    const confirmed = confirm(`确定要清空 ${files.value.length} 个文件吗？`)
    if (confirmed) {
      files.value = []
    }
  }
}

// 开始上传
const startUpload = async () => {
  if (files.value.length === 0) {
    showWarning('请先选择要上传的文件')
    return
  }

  if (!isFormValid.value) {
    showError('请输入文档标题')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  uploadSpeed.value = 0
  uploadStartTime.value = Date.now()

  // 准备上传数据
  const metadata = {
    title: documentInfo.value.title,
    description: documentInfo.value.description,
    tags: documentInfo.value.tags,
    language: documentInfo.value.language,
    ...uploadOptions.value
  }

  // 上传每个文件
  let completed = 0
  const totalFiles = files.value.length

  for (let i = 0; i < files.value.length; i++) {
    const fileItem = files.value[i]
    
    try {
      // 更新文件状态
      fileItem.status = 'uploading'
      
      // 上传文件
      const document = await documentService.uploadDocument(
        fileItem.file,
        metadata,
        (progress) => {
          // 更新单个文件进度
          fileItem.progress = progress
          
          // 计算总进度
          const totalProgress = files.value.reduce((sum, f) => sum + f.progress, 0)
          uploadProgress.value = Math.round(totalProgress / files.value.length)
          
          // 计算上传速度
          if (uploadStartTime.value) {
            const elapsed = (Date.now() - uploadStartTime.value) / 1000 // 秒
            const uploadedBytes = files.value.reduce((sum, f) => 
              sum + (f.size * f.progress / 100), 0
            )
            uploadSpeed.value = elapsed > 0 ? uploadedBytes / elapsed : 0
          }
        }
      )

      // 更新文件状态
      fileItem.status = 'completed'
      fileItem.documentId = document.id
      completed++

    } catch (error) {
      console.error('上传文件失败:', error)
      fileItem.status = 'error'
      fileItem.errorMessage = error.message || '上传失败'
    }
  }

  // 上传完成
  isUploading.value = false
  
  // 更新上传摘要
  uploadSummary.value = {
    totalFiles: files.value.length,
    successCount: files.value.filter(f => f.status === 'completed').length,
    failedCount: files.value.filter(f => f.status === 'error').length,
    totalSize: totalFileSize.value
  }

  // 显示上传完成弹窗
  showUploadCompleteModal.value = true
}

// 上传单个文件
const uploadSingleFile = async (index) => {
  const fileItem = files.value[index]
  
  if (!isFormValid.value) {
    showError('请输入文档标题')
    return
  }

  try {
    fileItem.status = 'uploading'
    
    const metadata = {
      title: documentInfo.value.title,
      description: documentInfo.value.description,
      tags: documentInfo.value.tags,
      language: documentInfo.value.language,
      ...uploadOptions.value
    }

    const document = await documentService.uploadDocument(
      fileItem.file,
      metadata,
      (progress) => {
        fileItem.progress = progress
      }
    )

    fileItem.status = 'completed'
    fileItem.documentId = document.id

  } catch (error) {
    console.error('上传文件失败:', error)
    fileItem.status = 'error'
    fileItem.errorMessage = error.message || '上传失败'
  }
}

// 暂停上传
const pauseUpload = (index) => {
  const fileItem = files.value[index]
  fileItem.status = 'paused'
  // 在实际应用中，这里需要实际暂停上传请求
}

// 提交上传
const submitUpload = () => {
  startUpload()
}

// 取消上传
const cancelUpload = () => {
  if (files.value.length > 0) {
    const confirmed = confirm('确定要取消上传吗？已选择的文件将被清空。')
    if (confirmed) {
      files.value = []
      resetForm()
    }
  } else {
    router.push('/dashboard')
  }
}

// 重置表单
const resetForm = () => {
  documentInfo.value = {
    title: '',
    description: '',
    language: 'en',
    tags: []
  }
  
  uploadOptions.value = {
    autoProcess: true,
    isPublic: false,
    isFavorite: false
  }
  
  formErrors.value = {
    title: ''
  }
}

// 拖拽事件处理
const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (isUploading.value) {
    showWarning('当前正在上传，请等待上传完成')
    return
  }
  
  const droppedFiles = Array.from(event.dataTransfer.files)
  addFiles(droppedFiles)
}

// 标签处理
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !documentInfo.value.tags.includes(tag)) {
    documentInfo.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index) => {
  documentInfo.value.tags.splice(index, 1)
}

// 格式化和工具函数
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond < 1024) {
    return `${Math.round(bytesPerSecond)} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }
}

const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return '📕'
  if (fileType.includes('word') || fileType.includes('document')) return '📘'
  if (fileType.includes('text')) return '📄'
  if (fileType.includes('image')) return '🖼️'
  return '📁'
}

const getFileType = (fileType) => {
  if (fileType.includes('pdf')) return 'PDF文档'
  if (fileType.includes('word') || fileType.includes('document')) return 'Word文档'
  if (fileType.includes('text')) return '文本文件'
  if (fileType.includes('image')) return '图片文件'
  return '其他文件'
}

const getStatusIcon = (statusType) => {
  switch (statusType) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    default: return 'ℹ️'
  }
}

// 拍照/扫描功能
const openCamera = () => {
  cameraMode.value = 'photo'
  showCameraModal.value = true
  startCamera()
}

const openScanner = () => {
  cameraMode.value = 'scan'
  showCameraModal.value = true
  startCamera()
}

const openFolder = () => {
  // 在实际应用中，这里需要调用文件选择API选择文件夹
  // 这里简化为触发文件选择
  triggerFileInput()
}

// 启动摄像头
const startCamera = async () => {
  try {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // 后置摄像头
      }
    }
    
    cameraStream.value = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (cameraVideoRef.value) {
      cameraVideoRef.value.srcObject = cameraStream.value
    }
  } catch (error) {
    console.error('启动摄像头失败:', error)
    showError('无法访问摄像头，请检查权限设置')
  }
}

// 拍照/扫描
const captureImage = () => {
  if (!cameraVideoRef.value) return
  
  const canvas = document.createElement('canvas')
  const video = cameraVideoRef.value
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const context = canvas.getContext('2d')
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.8)
}

// 重拍
const retakeImage = () => {
  capturedImage.value = null
}

// 确认使用拍摄的图片
const confirmCapture = () => {
  if (!capturedImage.value) return
  
  // 将base64转换为Blob
  const byteString = atob(capturedImage.value.split(',')[1])
  const mimeString = capturedImage.value.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  
  const blob = new Blob([ab], { type: mimeString })
  const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' })
  
  addFiles([file])
  closeCameraModal()
}

// 切换摄像头
const switchCamera = () => {
  if (!cameraStream.value) return
  
  // 停止当前摄像头
  cameraStream.value.getTracks().forEach(track => track.stop())
  
  // 切换前后摄像头
  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: cameraStream.value.getVideoTracks()[0].getSettings().facingMode === 'user' 
        ? 'environment' 
        : 'user'
    }
  }
  
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      cameraStream.value = stream
      if (cameraVideoRef.value) {
        cameraVideoRef.value.srcObject = stream
      }
    })
    .catch(error => {
      console.error('切换摄像头失败:', error)
      showError('切换摄像头失败')
    })
}

// 关闭摄像头模态框
const closeCameraModal = () => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    cameraStream.value = null
  }
  
  capturedImage.value = null
  showCameraModal.value = false
}

// 上传完成后的操作
const viewDocuments = () => {
  router.push('/dashboard')
}

const uploadMore = () => {
  files.value = []
  resetForm()
  showUploadCompleteModal.value = false
}

const startProcessing = () => {
  // 在实际应用中，这里可以开始OCR处理
  showSuccess('文档处理已开始')
  router.push('/dashboard')
}

// 关闭上传完成弹窗
const closeUploadCompleteModal = () => {
  showUploadCompleteModal.value = false
}

// 上传状态
const uploadStatus = ref(null)

// 监听文件列表变化
watch(files, (newFiles) => {
  // 如果有文件正在上传，更新总进度
  if (isUploading.value) {
    const totalProgress = newFiles.reduce((sum, f) => sum + f.progress, 0)
    uploadProgress.value = Math.round(totalProgress / newFiles.length)
  }
}, { deep: true })

// 监听文档标题变化
watch(() => documentInfo.value.title, (newTitle) => {
  if (newTitle.trim() === '') {
    formErrors.value.title = '文档标题不能为空'
  } else {
    formErrors.value.title = ''
  }
})

// 生命周期钩子
onMounted(() => {
  // 添加键盘快捷键
  const handleKeyDown = (event) => {
    // Ctrl/Cmd + U 触发上传
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
      event.preventDefault()
      triggerFileInput()
    }
    
    // Escape 取消上传
    if (event.key === 'Escape') {
      if (showCameraModal.value) {
        closeCameraModal()
      } else if (showUploadCompleteModal.value) {
        closeUploadCompleteModal()
      } else if (files.value.length > 0) {
        cancelUpload()
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 清理摄像头
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
.document-upload-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Comfortaa', cursive;
  background: linear-gradient(135deg, #f5f7ff 0%, #e3e6ff 100%);
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 30px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.15);
  border: 3px solid #8a94ff;
}

.page-title {
  font-size: 36px;
  color: #5d6afb;
  margin: 0;
  font-family: 'Caveat', cursive;
  margin-bottom: 10px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 上传容器 */
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 40px;
}

/* 拖拽上传区域 */
.dropzone {
  background: white;
  border-radius: 30px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 4px dashed #8a94ff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(93, 106, 251, 0.1);
}

.dropzone:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(93, 106, 251, 0.2);
  border-color: #5d6afb;
}

.dropzone.is-dragover {
  background: linear-gradient(135deg, #f0f2ff 0%, #e3e6ff 100%);
  border-color: #ff7eb3;
  border-style: solid;
  animation: pulse 1.5s infinite;
}

.dropzone.has-files {
  padding: 40px;
}

.dropzone.is-uploading {
  background: linear-gradient(135deg, #f8f9ff 0%, #eef0ff 100%);
}

@keyframes pulse {
  0% {
    border-color: #ff7eb3;
    box-shadow: 0 0 0 0 rgba(255, 126, 179, 0.4);
  }
  70% {
    border-color: #ff7eb3;
    box-shadow: 0 0 0 10px rgba(255, 126, 179, 0);
  }
  100% {
    border-color: #ff7eb3;
    box-shadow: 0 0 0 0 rgba(255, 126, 179, 0);
  }
}

.upload-icon {
  margin-bottom: 25px;
}

.icon-wrapper {
  position: relative;
  display: inline-block;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #8a94ff 0%, #a5adff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;
}

.icon-cloud {
  font-size: 60px;
  display: block;
}

.icon-arrow {
  position: absolute;
  bottom: 15px;
  right: 15px;
  font-size: 30px;
  animation: bounce 2s infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.upload-prompt h3 {
  font-size: 24px;
  color: #5d6afb;
  margin: 0 0 15px 0;
  font-family: 'Caveat', cursive;
}

.upload-hint {
  font-size: 14px;
  color: #888;
  margin: 0;
}

/* 上传进度 */
.upload-progress {
  margin-top: 30px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  height: 20px;
  background: #f0f2ff;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
  border: 2px solid #8a94ff;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5d6afb 0%, #8a94ff 50%, #5d6afb 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  transition: width 0.3s ease;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.progress-text {
  font-weight: bold;
  color: #5d6afb;
}

.progress-speed {
  color: #4cd964;
}

/* 上传状态 */
.upload-status {
  margin-top: 20px;
}

.status-message {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  animation: slideIn 0.5s ease;
}

.status-message.success {
  background: linear-gradient(135deg, #4cd964 0%, #6de382 100%);
  color: white;
}

.status-message.error {
  background: linear-gradient(135deg, #ff7eb3 0%, #ff9ec5 100%);
  color: white;
}

.status-message.warning {
  background: linear-gradient(135deg, #ffeb3b 0%, #fff176 100%);
  color: #333;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 上传选项 */
.upload-options {
  background: white;
  border-radius: 25px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.15);
  border: 3px solid #8a94ff;
}

.option-title {
  font-size: 20px;
  color: #5d6afb;
  margin: 0 0 20px 0;
  font-family: 'Caveat', cursive;
}

.option-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
  justify-content: center;
}

/* 上传列表 */
.upload-list-container {
  background: white;
  border-radius: 25px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.15);
  border: 3px solid #8a94ff;
  margin-bottom: 40px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px dashed #8a94ff;
}

.list-title {
  font-size: 22px;
  color: #5d6afb;
  margin: 0;
  font-family: 'Caveat', cursive;
}

.list-actions {
  display: flex;
  gap: 15px;
}

.upload-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.upload-list::-webkit-scrollbar {
  width: 8px;
}

.upload-list::-webkit-scrollbar-track {
  background: #f0f2ff;
  border-radius: 4px;
}

.upload-list::-webkit-scrollbar-thumb {
  background: #8a94ff;
  border-radius: 4px;
}

.upload-list::-webkit-scrollbar-thumb:hover {
  background: #5d6afb;
}

.upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #fafaff;
  border-radius: 20px;
  border: 2px solid #e3e6ff;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease;
}

.upload-item:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 15px rgba(93, 106, 251, 0.15);
}

.upload-item.uploading {
  border-color: #5d6afb;
  background: linear-gradient(135deg, #f0f2ff 0%, #e3e6ff 100%);
}

.upload-item.completed {
  border-color: #4cd964;
  background: linear-gradient(135deg, #f0fff2 0%, #e3ffe6 100%);
}

.upload-item.error {
  border-color: #ff7eb3;
  background: linear-gradient(135deg, #fff0f5 0%, #ffe6ee 100%);
}

.upload-item.paused {
  border-color: #ffeb3b;
  background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.file-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #8a94ff 0%, #a5adff 100%);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #888;
}

.file-size {
  font-weight: bold;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
  justify-content: center;
}

.status-pending,
.status-completed,
.status-error,
.status-paused {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending {
  background: #fff3e0;
  color: #ff9800;
}

.status-completed {
  background: #e8f5e9;
  color: #4caf50;
}

.status-error {
  background: #ffebee;
  color: #f44336;
}

.status-paused {
  background: #fffde7;
  color: #ffc107;
}

.upload-progress-mini {
  width: 80px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.file-actions {
  display: flex;
  gap: 8px;
}

/* 文档信息表单 */
.document-form-container {
  background: white;
  border-radius: 25px;
  padding: 30px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.15);
  border: 3px solid #8a94ff;
  margin-bottom: 40px;
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-title {
  font-size: 24px;
  color: #5d6afb;
  margin: 0 0 10px 0;
  font-family: 'Caveat', cursive;
}

.form-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.document-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-size: 16px;
  font-weight: bold;
  color: #5d6afb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 18px;
}

.form-input,
.form-textarea,
.form-select {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  padding: 12px 16px;
  border: 3px solid #8a94ff;
  border-radius: 15px;
  outline: none;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #5d6afb;
  box-shadow: 0 0 0 4px rgba(93, 106, 251, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-select {
  cursor: pointer;
}

.form-error {
  color: #ff7eb3;
  font-size: 14px;
  margin-top: 5px;
  font-weight: bold;
}

/* 标签输入 */
.tags-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 10px;
  background: #fafaff;
  border-radius: 15px;
  border: 2px solid #e3e6ff;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #8a94ff 0%, #a5adff 100%);
  color: white;
  border-radius: 15px;
  font-size: 14px;
  font-weight: bold;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-input {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  padding: 12px 16px;
  border: 3px solid #8a94ff;
  border-radius: 15px;
  outline: none;
  transition: all 0.3s ease;
}

.tag-input:focus {
  border-color: #5d6afb;
  box-shadow: 0 0 0 4px rgba(93, 106, 251, 0.1);
}

.tag-hint {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

/* 上传选项网格 */
.upload-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #fafaff;
  border-radius: 15px;
  border: 2px solid #e3e6ff;
  transition: all 0.3s ease;
}

.option-item:hover {
  background: #f0f2ff;
  transform: translateY(-2px);
}

.option-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #5d6afb;
}

.option-label {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  font-weight: bold;
}

/* 表单操作 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 25px;
  border-top: 2px dashed #8a94ff;
}

/* 模态框 */
.camera-modal-overlay,
.complete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.camera-modal,
.complete-modal {
  animation: modalAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  border-radius: 30px 30px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 22px;
  font-family: 'Caveat', cursive;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 25px;
}

.camera-preview {
  width: 100%;
  height: 300px;
  background: #000;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
  justify-content: center;
}

.capture-preview {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 上传完成弹窗 */
.success-animation {
  text-align: center;
  margin-bottom: 30px;
}

.checkmark {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4cd964 0%, #6de382 100%);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  animation: checkmark 0.5s ease;
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.upload-summary,
.next-actions {
  margin-bottom: 30px;
}

.summary-title,
.actions-title {
  font-size: 18px;
  color: #5d6afb;
  margin: 0 0 15px 0;
  font-family: 'Caveat', cursive;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafaff;
  border-radius: 15px;
  border: 2px solid #e3e6ff;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
}

.stat-value.success {
  color: #4cd964;
}

.stat-value.error {
  color: #ff7eb3;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

/* 帮助提示 */
.help-section {
  margin-top: 40px;
}

.help-card {
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.help-icon {
  font-size: 40px;
  text-align: center;
  margin-bottom: 15px;
}

.help-content {
  text-align: center;
}

.help-title {
  font-size: 20px;
  color: #5d6afb;
  margin: 0 0 15px 0;
  font-family: 'Caveat', cursive;
}

.help-tips {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  display: inline-block;
}

.help-tips li {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  position: relative;
  padding-left: 25px;
}

.help-tips li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4cd964;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .document-upload-view {
    padding: 20px 15px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .dropzone {
    padding: 40px 20px;
  }
  
  .icon-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .icon-cloud {
    font-size: 50px;
  }
  
  .upload-prompt h3 {
    font-size: 20px;
  }
  
  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .list-actions {
    justify-content: center;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .option-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .option-btn {
    width: 100%;
  }
  
  .upload-options-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .upload-container {
    gap: 20px;
  }
  
  .upload-item {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .file-info {
    flex-direction: column;
    text-align: center;
  }
  
  .file-meta {
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>