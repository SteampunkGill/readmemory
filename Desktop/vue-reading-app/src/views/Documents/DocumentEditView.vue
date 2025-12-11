<!-- src/views/Documents/DocumentEditView.vue -->
<template>
  <DefaultLayout>
    <div class="document-edit-page">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-animation">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <p class="loading-text">正在加载文档信息...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">😢</div>
        <h3 class="error-title">加载失败</h3>
        <p class="error-message">{{ error }}</p>
        <div class="error-actions">
          <button class="error-button primary" @click="retry">
            重试
          </button>
          <button class="error-button secondary" @click="goBack">
            返回
          </button>
        </div>
      </div>
      
      <!-- 编辑表单 -->
      <div v-else class="edit-form-container">
        <!-- 顶部操作栏 -->
        <div class="edit-header">
          <button class="back-button" @click="goBack">
            <span class="back-icon">←</span>
            <span class="back-text">返回</span>
          </button>
          
          <h1 class="edit-title">
            {{ isNewDocument ? '创建新文档' : '编辑文档' }}
          </h1>
          
          <div class="header-actions">
            <button class="header-action-button" @click="saveDraft">
              <span class="action-icon">💾</span>
              <span class="action-text">保存草稿</span>
            </button>
          </div>
        </div>
        
        <!-- 表单内容 -->
        <div class="edit-form">
          <!-- 封面上传 -->
          <div class="form-section">
            <h3 class="section-title">📷 文档封面</h3>
            <div class="cover-upload-area">
              <div 
                class="upload-preview"
                :class="{ 'has-image': previewImage }"
                @click="triggerFileInput"
              >
                <img 
                  v-if="previewImage" 
                  :src="previewImage" 
                  alt="封面预览"
                  class="preview-image"
                />
                <div v-else class="upload-placeholder">
                  <span class="placeholder-icon">📁</span>
                  <span class="placeholder-text">点击上传封面</span>
                </div>
                
                <div class="upload-overlay">
                  <span class="overlay-icon">📷</span>
                  <span class="overlay-text">更换封面</span>
                </div>
              </div>
              
              <input 
                ref="fileInput"
                type="file" 
                accept="image/*"
                @change="handleCoverUpload"
                class="file-input"
              />
              
              <div class="upload-hint">
                <p>支持 JPG、PNG、GIF 格式，建议尺寸 800×600 像素</p>
                <p>最大文件大小：5MB</p>
              </div>
            </div>
          </div>
          
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">📋 基本信息</h3>
            
            <div class="form-grid">
              <!-- 标题 -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">📝</span>
                  <span class="label-text">文档标题</span>
                  <span class="label-required">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="formData.title"
                  placeholder="请输入文档标题"
                  class="form-input"
                  :class="{ error: errors.title }"
                />
                <div v-if="errors.title" class="error-message">
                  {{ errors.title }}
                </div>
              </div>
              
              <!-- 作者 -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">✍️</span>
                  <span class="label-text">作者</span>
                </label>
                <input 
                  type="text" 
                  v-model="formData.author"
                  placeholder="请输入作者姓名"
                  class="form-input"
                />
              </div>
              
              <!-- 语言 -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">🌐</span>
                  <span class="label-text">语言</span>
                  <span class="label-required">*</span>
                </label>
                <select 
                  v-model="formData.language"
                  class="form-select"
                  :class="{ error: errors.language }"
                >
                  <option value="">请选择语言</option>
                  <option value="en">英语</option>
                  <option value="zh">中文</option>
                  <option value="ja">日语</option>
                  <option value="ko">韩语</option>
                  <option value="fr">法语</option>
                  <option value="de">德语</option>
                  <option value="es">西班牙语</option>
                </select>
                <div v-if="errors.language" class="error-message">
                  {{ errors.language }}
                </div>
              </div>
              
              <!-- 分类 -->
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">📂</span>
                  <span class="label-text">分类</span>
                </label>
                <select 
                  v-model="formData.category"
                  class="form-select"
                >
                  <option value="">请选择分类</option>
                  <option value="literature">文学</option>
                  <option value="technology">科技</option>
                  <option value="education">教育</option>
                  <option value="news">新闻</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- 标签管理 -->
          <div class="form-section">
            <h3 class="section-title">🏷️ 标签管理</h3>
            
            <div class="tags-manager">
              <!-- 现有标签 -->
              <div class="existing-tags">
                <div class="tags-list">
                  <span 
                    v-for="tag in formData.tags" 
                    :key="tag"
                    class="tag-item"
                  >
                    {{ tag }}
                    <button 
                      class="tag-remove"
                      @click="removeTag(tag)"
                    >
                      ×
                    </button>
                  </span>
                </div>
                
                <div v-if="formData.tags.length === 0" class="no-tags">
                  <span class="no-tags-icon">🏷️</span>
                  <span class="no-tags-text">暂无标签，添加一些吧！</span>
                </div>
              </div>
              
              <!-- 添加标签 -->
              <div class="add-tags">
                <div class="add-tags-input">
                  <input 
                    type="text" 
                    v-model="newTag"
                    placeholder="输入标签，按回车添加"
                    @keyup.enter="addTag"
                    class="tag-input"
                  />
                  <button 
                    class="tag-add-button"
                    @click="addTag"
                  >
                    ➕
                  </button>
                </div>
                
                <div class="suggested-tags">
                  <span class="suggested-label">推荐标签：</span>
                  <button 
                    v-for="tag in suggestedTags" 
                    :key="tag"
                    class="suggested-tag"
                    @click="addSuggestedTag(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 描述 -->
          <div class="form-section">
            <h3 class="section-title">📝 文档描述</h3>
            
            <div class="form-group">
              <textarea 
                v-model="formData.description"
                placeholder="请输入文档描述（可选）"
                rows="4"
                class="form-textarea"
              ></textarea>
              <div class="textarea-counter">
                {{ formData.description?.length || 0 }}/500
              </div>
            </div>
          </div>
          
          <!-- 分享设置 -->
          <div class="form-section">
            <h3 class="section-title">🔗 分享设置</h3>
            
            <div class="share-settings">
              <div class="setting-item">
                <label class="setting-label">
                  <input 
                    type="checkbox" 
                    v-model="formData.isPublic"
                    class="setting-checkbox"
                  >
                  <span class="setting-text">公开分享</span>
                </label>
                <p class="setting-description">
                  其他人可以通过链接查看此文档
                </p>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input 
                    type="checkbox" 
                    v-model="formData.allowDownload"
                    class="setting-checkbox"
                  >
                  <span class="setting-text">允许下载</span>
                </label>
                <p class="setting-description">
                  允许其他人下载此文档
                </p>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <input 
                    type="checkbox" 
                    v-model="formData.allowComments"
                    class="setting-checkbox"
                  >
                  <span class="setting-text">允许评论</span>
                </label>
                <p class="setting-description">
                  允许其他人对此文档发表评论
                </p>
              </div>
            </div>
          </div>
          
          <!-- 表单操作 -->
          <div class="form-actions">
            <button 
              class="action-button secondary" 
              @click="goBack"
              :disabled="isSubmitting"
            >
              取消
            </button>
            
            <button 
              class="action-button primary" 
              @click="submitForm"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="button-loading"></span>
              <span v-else class="button-text">
                {{ isNewDocument ? '创建文档' : '保存修改' }}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 保存成功弹窗 -->
      <AppModal 
        v-if="showSuccessModal" 
        title="🎉 保存成功"
        @close="handleSuccessClose"
      >
        <div class="success-modal">
          <div class="success-icon">✅</div>
          <p class="success-message">
            {{ isNewDocument ? '文档创建成功！' : '文档修改已保存！' }}
          </p>
          <div class="success-actions">
            <button class="success-button primary" @click="viewDocument">
              查看文档
            </button>
            <button class="success-button secondary" @click="goBack">
              返回书架
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AppModal from '@/components/common/AppModal.vue'
import documentService from '@/services/document.service.js'
import { useDocumentStore } from '@/stores/document.store'
import { validateImageFile } from '@/utils/file-validator'
import { showSuccess, showError } from '@/utils/notify'

const route = useRoute()
const router = useRouter()
const documentStore = useDocumentStore()

// 响应式数据
const loading = ref(true)
const error = ref(null)
const isSubmitting = ref(false)
const showSuccessModal = ref(false)

// 表单数据
const formData = ref({
  title: '',
  author: '',
  language: '',
  category: '',
  tags: [],
  description: '',
  isPublic: false,
  allowDownload: true,
  allowComments: false
})

// 表单错误
const errors = ref({})

// 封面相关
const fileInput = ref(null)
const previewImage = ref(null)
const newTag = ref('')

// 推荐标签
const suggestedTags = ref([
  '英语学习', '文学', '科技', '教育', '新闻',
  '小说', '散文', '诗歌', '文档', '教程'
])

// 计算属性
const isNewDocument = computed(() => {
  return route.params.id === 'new' || !route.params.id
})

const documentId = computed(() => {
  return isNewDocument.value ? null : route.params.id
})

// 生命周期钩子
onMounted(async () => {
  if (!isNewDocument.value) {
    await loadDocument()
  } else {
    loading.value = false
  }
})

// 方法
const loadDocument = async () => {
  try {
    loading.value = true
    error.value = null
    
    const doc = await documentService.getDocumentById(documentId.value)
    
    // 填充表单数据
    formData.value = {
      title: doc.title || '',
      author: doc.author || '',
      language: doc.language || '',
      category: doc.category || '',
      tags: doc.tags || [],
      description: doc.description || '',
      isPublic: doc.isPublic || false,
      allowDownload: doc.allowDownload !== false,
      allowComments: doc.allowComments || false
    }
    
    // 设置预览图片
    if (doc.coverUrl) {
      previewImage.value = doc.coverUrl
    }
  } catch (err) {
    error.value = err.message || '加载文档失败'
    showError(error.value)
  } finally {
    loading.value = false
  }
}

const retry = () => {
  if (isNewDocument.value) {
    loading.value = false
  } else {
    loadDocument()
  }
}

const goBack = () => {
  router.back()
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleCoverUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    // 验证图片文件
    const isValid = await validateImageFile(file)
    if (!isValid) {
      showError('图片格式不支持或文件过大')
      return
    }
    
    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    // 重置文件输入
    event.target.value = ''
  } catch (err) {
    showError('上传图片失败')
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (!tag) return
  
  if (!formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
  }
  
  newTag.value = ''
}

const addSuggestedTag = (tag) => {
  if (!formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
  }
}

const removeTag = (tag) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

const saveDraft = () => {
  // 保存草稿到本地存储
  const draft = {
    ...formData.value,
    savedAt: new Date().toISOString()
  }
  
  localStorage.setItem('document_draft', JSON.stringify(draft))
  showSuccess('草稿已保存')
}

const validateForm = () => {
  errors.value = {}
  
  // 验证标题
  if (!formData.value.title.trim()) {
    errors.value.title = '文档标题不能为空'
  } else if (formData.value.title.length > 100) {
    errors.value.title = '标题不能超过100个字符'
  }
  
  // 验证语言
  if (!formData.value.language) {
    errors.value.language = '请选择文档语言'
  }
  
  // 验证标签数量
  if (formData.value.tags.length > 10) {
    errors.value.tags = '标签数量不能超过10个'
  }
  
  // 验证描述长度
  if (formData.value.description && formData.value.description.length > 500) {
    errors.value.description = '描述不能超过500个字符'
  }
  
  return Object.keys(errors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm()) {
    showError('请检查表单填写是否正确')
    return
  }
  
  try {
    isSubmitting.value = true
    
    if (isNewDocument.value) {
      // 创建新文档
      const result = await documentService.uploadDocument({
        ...formData.value,
        file: null // 这里需要实际的文件上传
      })
      
      documentStore.addDocument(result)
      showSuccessModal.value = true
    } else {
      // 更新现有文档
      const result = await documentService.updateDocument(
        documentId.value,
        formData.value
      )
      
      documentStore.updateDocument(result)
      documentStore.setCurrentDocument(result)
      showSuccessModal.value = true
    }
  } catch (err) {
    showError(err.message || '保存失败')
  } finally {
    isSubmitting.value = false
  }
}

const handleSuccessClose = () => {
  showSuccessModal.value = false
  goBack()
}

const viewDocument = () => {
  if (!isNewDocument.value) {
    router.push({
      name: 'DocumentDetail',
      params: { id: documentId.value }
    })
  }
}
</script>

<style scoped>
.document-edit-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
}

.loading-animation {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.loading-dot {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #666;
}

/* 错误状态 */
.error-container {
  text-align: center;
  padding: 100px 20px;
}

.error-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.error-title {
  font-family: 'Kalam', cursive;
  font-size: 36px;
  color: #ff6b9d;
  margin-bottom: 16px;
}

.error-message {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #666;
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.error-button {
  padding: 16px 32px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.error-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.error-button.secondary {
  background: white;
  color: #666;
  border: 3px solid #d9f7be;
}

.error-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 编辑头部 */
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  border-radius: 25px;
  border: 3px dashed #bae7ff;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #ffccc7;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
}

.back-button:hover {
  background: #fff2e8;
  transform: translateX(-4px);
}

.back-icon {
  font-size: 20px;
}

.edit-title {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  color: #ff6b9d;
  margin: 0;
  text-align: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #d9f7be;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
}

.header-action-button:hover {
  background: #f6ffed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 编辑表单 */
.edit-form {
  background: white;
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  border: 4px solid #ffd591;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #36cfc9;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 封面上传 */
.cover-upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-preview {
  width: 300px;
  height: 200px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 3px dashed #bae7ff;
  transition: all 0.3s ease;
}

.upload-preview:hover {
  border-color: #ff6b9d;
  transform: scale(1.02);
}

.upload-preview.has-image:hover .upload-overlay {
  opacity: 1;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.placeholder-icon {
  font-size: 48px;
  color: #999;
}

.placeholder-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #999;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-icon {
  font-size: 32px;
  color: white;
}

.overlay-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: white;
  font-weight: 600;
}

.file-input {
  display: none;
}

.upload-hint {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
  line-height: 1.4;
}

.upload-hint p {
  margin: 4px 0;
}

/* 表单网格 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  font-weight: 600;
}

.label-icon {
  font-size: 18px;
}

.label-required {
  color: #ff4d4f;
}

.form-input,
.form-select,
.form-textarea {
  padding: 16px;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  background: white;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #36cfc9;
  box-shadow: 0 0 0 3px rgba(54, 207, 201, 0.1);
}

.form-input.error,
.form-select.error {
  border-color: #ff4d4f;
}

.error-message {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #ff4d4f;
  margin-top: 4px;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.textarea-counter {
  text-align: right;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
}

/* 标签管理 */
.tags-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.existing-tags {
  min-height: 60px;
  padding: 16px;
  background: #fafafa;
  border-radius: 20px;
  border: 2px dashed #d9f7be;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ffccc7 0%, #ffd591 100%);
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  border: 1px solid #ffb8d9;
}

.tag-remove {
  background: none;
  border: none;
  font-size: 18px;
  color: #ff6b9d;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.tag-remove:hover {
  background: rgba(255, 107, 157, 0.1);
  transform: scale(1.1);
}

.no-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
}

.no-tags-icon {
  font-size: 24px;
}

.no-tags-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #999;
}

/* 添加标签 */
.add-tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-tags-input {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  background: white;
  transition: all 0.3s ease;
}

.tag-input:focus {
  outline: none;
  border-color: #36cfc9;
}

.tag-add-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #36cfc9 0%, #73d13d 100%);
  border: none;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-add-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(54, 207, 201, 0.3);
}

/* 推荐标签 */
.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.suggested-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

.suggested-tag {
  padding: 6px 12px;
  background: white;
  border: 1px solid #d9f7be;
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggested-tag:hover {
  background: #f6ffed;
  transform: translateY(-2px);
}

/* 分享设置 */
.share-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 20px;
  border: 2px dashed #d9f7be;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
}

.setting-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #36cfc9;
  cursor: pointer;
}

.setting-text {
  user-select: none;
}

.setting-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
  margin: 0 0 0 32px;
}

/* 表单操作 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 32px;
  border-top: 2px dashed #e8e8e8;
}

.action-button {
  padding: 16px 32px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 120px;
}

.action-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.action-button.secondary {
  background: white;
  color: #666;
  border: 2px solid #d9d9d9;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 成功弹窗 */
.success-modal {
  padding: 20px;
  text-align: center;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
  animation: bounceIn 0.5s ease;
}

@keyframes bounceIn {
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

.success-message {
  font-family: 'Comfortaa', cursive;
  font-size: 20px;
  color: #666;
  margin-bottom: 32px;
}

.success-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.success-button {
  padding: 12px 24px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 120px;
}

.success-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.success-button.secondary {
  background: white;
  color: #666;
  border: 2px solid #d9d9d9;
}

.success-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>