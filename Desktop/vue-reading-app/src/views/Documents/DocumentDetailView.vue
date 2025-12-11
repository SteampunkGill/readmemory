<!-- src/views/Documents/DocumentDetailView.vue -->
<template>
  <DefaultLayout>
    <div class="document-detail-page">
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
            返回书架
          </button>
        </div>
      </div>
      
      <!-- 文档详情内容 -->
      <div v-else-if="document" class="document-detail-content">
        <!-- 顶部操作栏 -->
        <div class="detail-header">
          <button class="back-button" @click="goBack">
            <span class="back-icon">←</span>
            <span class="back-text">返回</span>
          </button>
          
          <div class="header-actions">
            <button class="header-action-button" @click="toggleFavorite">
              <span class="action-icon">
                {{ document.isFavorite ? '❤️' : '🤍' }}
              </span>
              <span class="action-text">
                {{ document.isFavorite ? '已收藏' : '收藏' }}
              </span>
            </button>
            
            <button class="header-action-button" @click="showShareModal = true">
              <span class="action-icon">📤</span>
              <span class="action-text">分享</span>
            </button>
            
            <button class="header-action-button" @click="showDeleteModal = true">
              <span class="action-icon">🗑️</span>
              <span class="action-text">删除</span>
            </button>
          </div>
        </div>
        
        <!-- 文档信息卡片 -->
        <div class="document-info-card">
          <!-- 封面区域 -->
          <div class="document-cover">
            <div v-if="document.coverUrl" class="cover-image">
              <img :src="document.coverUrl" :alt="document.title" />
            </div>
            <div v-else class="cover-placeholder">
              <span class="placeholder-icon">📚</span>
              <span class="placeholder-text">{{ document.title.charAt(0) }}</span>
            </div>
            
            <!-- 状态标签 -->
            <div class="status-badge" :class="document.status">
              {{ statusLabels[document.status] }}
            </div>
          </div>
          
          <!-- 基本信息 -->
          <div class="document-info">
            <h1 class="document-title">{{ document.title }}</h1>
            
            <div class="document-meta">
              <div class="meta-item">
                <span class="meta-icon">✍️</span>
                <span class="meta-label">作者：</span>
                <span class="meta-value">{{ document.author || '未知' }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-icon">🌐</span>
                <span class="meta-label">语言：</span>
                <span class="meta-value">{{ languageLabels[document.language] || document.language }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span class="meta-label">上传时间：</span>
                <span class="meta-value">{{ formatDate(document.createdAt) }}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-icon">📄</span>
                <span class="meta-label">页数：</span>
                <span class="meta-value">{{ document.pageCount || '未知' }}</span>
              </div>
            </div>
            
            <!-- 标签 -->
            <div v-if="document.tags && document.tags.length" class="document-tags">
              <span class="tags-label">标签：</span>
              <span v-for="tag in document.tags" :key="tag" class="tag-item">
                {{ tag }}
              </span>
            </div>
            
            <!-- 描述 -->
            <div v-if="document.description" class="document-description">
              <h3 class="description-title">📝 描述</h3>
              <p class="description-text">{{ document.description }}</p>
            </div>
          </div>
        </div>
        
        <!-- 阅读进度和统计 -->
        <div class="document-stats-section">
          <h2 class="section-title">📊 阅读统计</h2>
          
          <div class="stats-grid">
            <!-- 阅读进度 -->
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-icon">📖</span>
                <span class="stat-title">阅读进度</span>
              </div>
              <div class="stat-content">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${document.readProgress || 0}%` }"
                  ></div>
                </div>
                <div class="progress-text">
                  <span class="progress-value">{{ document.readProgress || 0 }}%</span>
                  <span class="progress-detail">
                    {{ document.currentPage || 0 }}/{{ document.pageCount || '?' }} 页
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 阅读时长 -->
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-icon">⏱️</span>
                <span class="stat-title">阅读时长</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ formatDuration(document.readingTime || 0) }}
                </div>
                <div class="stat-label">
                  累计阅读时间
                </div>
              </div>
            </div>
            
            <!-- 词汇统计 -->
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-icon">🔤</span>
                <span class="stat-title">词汇统计</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ document.vocabularyCount || 0 }}
                </div>
                <div class="stat-label">
                  已标记生词
                </div>
              </div>
            </div>
            
            <!-- 笔记数量 -->
            <div class="stat-card">
              <div class="stat-header">
                <span class="stat-icon">📝</span>
                <span class="stat-title">笔记数量</span>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ document.noteCount || 0 }}
                </div>
                <div class="stat-label">
                  已添加笔记
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons-section">
          <button class="action-button primary" @click="startReading">
            <span class="button-icon">📖</span>
            <span class="button-text">
              {{ document.readProgress > 0 ? '继续阅读' : '开始阅读' }}
            </span>
          </button>
          
          <button class="action-button secondary" @click="editDocument">
            <span class="button-icon">✏️</span>
            <span class="button-text">编辑信息</span>
          </button>
          
          <button class="action-button secondary" @click="downloadDocument">
            <span class="button-icon">⬇️</span>
            <span class="button-text">下载文档</span>
          </button>
        </div>
        
        <!-- 相关词汇 -->
        <div v-if="relatedVocabulary.length" class="related-vocabulary-section">
          <h2 class="section-title">🔤 相关词汇</h2>
          <div class="vocabulary-list">
            <div 
              v-for="word in relatedVocabulary" 
              :key="word.id"
              class="vocabulary-item"
              @click="viewVocabularyDetail(word.id)"
            >
              <div class="word-info">
                <span class="word-text">{{ word.word }}</span>
                <span class="word-phonetic">{{ word.phonetic }}</span>
              </div>
              <div class="word-definition">
                {{ word.definition }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分享弹窗 -->
      <AppModal 
        v-if="showShareModal" 
        title="📤 分享文档"
        @close="showShareModal = false"
      >
        <div class="share-modal">
          <div class="share-options">
            <div class="share-option">
              <button class="share-button" @click="copyShareLink">
                <span class="share-icon">🔗</span>
                <span class="share-text">复制链接</span>
              </button>
            </div>
            
            <div class="share-option">
              <button class="share-button" @click="generateQRCode">
                <span class="share-icon">📱</span>
                <span class="share-text">生成二维码</span>
              </button>
            </div>
            
            <div class="share-option">
              <button class="share-button" @click="shareToSocial">
                <span class="share-icon">🌐</span>
                <span class="share-text">分享到社交平台</span>
              </button>
            </div>
          </div>
          
          <div class="share-settings">
            <h4 class="settings-title">分享设置</h4>
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="shareSettings.isPublic"
                  class="setting-checkbox"
                >
                <span class="setting-text">公开分享</span>
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="shareSettings.allowDownload"
                  class="setting-checkbox"
                >
                <span class="setting-text">允许下载</span>
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="shareSettings.allowComments"
                  class="setting-checkbox"
                >
                <span class="setting-text">允许评论</span>
              </label>
            </div>
          </div>
        </div>
      </AppModal>
      
      <!-- 删除确认弹窗 -->
      <AppModal 
        v-if="showDeleteModal" 
        title="🗑️ 删除文档"
        @close="showDeleteModal = false"
        @confirm="deleteDocument"
      >
        <div class="delete-modal">
          <div class="delete-warning">
            <span class="warning-icon">⚠️</span>
            <p class="warning-text">
              确定要删除文档 <strong>"{{ document?.title }}"</strong> 吗？
            </p>
          </div>
          <p class="delete-note">
            此操作不可撤销，文档相关的所有数据（包括阅读进度、笔记、高亮等）都将被永久删除。
          </p>
        </div>
      </AppModal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AppModal from '@/components/common/AppModal.vue'
import documentService from '@/services/document.service.js'
import { useDocumentStore } from '@/stores/document.store'
import { useReaderStore } from '@/stores/reader.store'
import { formatDate, formatDuration } from '@/utils/formatters'
import { showSuccess, showError, showWarning } from '@/utils/notify'

const route = useRoute()
const router = useRouter()
const documentStore = useDocumentStore()
const readerStore = useReaderStore()

// 响应式数据
const loading = ref(true)
const error = ref(null)
const showShareModal = ref(false)
const showDeleteModal = ref(false)

// 分享设置
const shareSettings = ref({
  isPublic: false,
  allowDownload: true,
  allowComments: false
})

// 状态标签
const statusLabels = {
  processing: '处理中',
  processed: '已处理',
  error: '处理失败',
  pending: '等待处理'
}

// 语言标签
const languageLabels = {
  en: '英语',
  zh: '中文',
  ja: '日语',
  ko: '韩语',
  fr: '法语',
  de: '德语',
  es: '西班牙语'
}

// 计算属性
const document = computed(() => documentStore.currentDocument)

const relatedVocabulary = computed(() => {
  // 这里应该从API获取相关词汇，暂时返回空数组
  return []
})

// 生命周期钩子
onMounted(async () => {
  await loadDocument()
})

// 方法
const loadDocument = async () => {
  try {
    loading.value = true
    error.value = null
    
    const documentId = route.params.id
    if (!documentId) {
      throw new Error('文档ID不能为空')
    }
    
    // 从store中查找文档
    const doc = documentStore.getDocumentById(documentId)
    if (doc) {
      documentStore.setCurrentDocument(doc)
    } else {
      // 如果store中没有，从API获取
      const result = await documentService.getDocumentById(documentId)
      documentStore.setCurrentDocument(result)
      documentStore.addDocument(result)
    }
  } catch (err) {
    error.value = err.message || '加载文档失败'
    showError(error.value)
  } finally {
    loading.value = false
  }
}

const retry = () => {
  loadDocument()
}

const goBack = () => {
  router.push({ name: 'Dashboard' })
}

const toggleFavorite = async () => {
  if (!document.value) return
  
  try {
    const updatedDoc = await documentService.updateDocument(document.value.id, {
      isFavorite: !document.value.isFavorite
    })
    
    documentStore.updateDocument(updatedDoc)
    documentStore.setCurrentDocument(updatedDoc)
    
    showSuccess(
      updatedDoc.isFavorite 
        ? '已添加到收藏' 
        : '已从收藏中移除'
    )
  } catch (err) {
    showError('更新收藏状态失败')
  }
}

const startReading = () => {
  if (!document.value) return
  
  // 设置阅读器文档
  readerStore.setCurrentDocumentId(document.value.id)
  
  // 跳转到阅读器
  router.push({
    name: 'Reader',
    params: { id: document.value.id }
  })
}

const editDocument = () => {
  if (!document.value) return
  
  router.push({
    name: 'DocumentEdit',
    params: { id: document.value.id }
  })
}

const downloadDocument = async () => {
  if (!document.value) return
  
  try {
    showSuccess('开始下载文档...')
    // 这里应该调用下载API
    // await documentService.exportDocument(document.value.id)
  } catch (err) {
    showError('下载文档失败')
  }
}

const deleteDocument = async () => {
  if (!document.value) return
  
  try {
    await documentService.deleteDocument(document.value.id)
    
    // 从store中移除
    documentStore.removeDocument(document.value.id)
    documentStore.clearCurrentDocument()
    
    showSuccess('文档删除成功')
    showDeleteModal.value = false
    
    // 返回书架
    setTimeout(() => {
      router.push({ name: 'Dashboard' })
    }, 1000)
  } catch (err) {
    showError('删除文档失败')
  }
}

const copyShareLink = () => {
  // 生成分享链接
  const shareLink = `${window.location.origin}/share/document/${document.value?.id}`
  
  // 复制到剪贴板
  navigator.clipboard.writeText(shareLink)
    .then(() => {
      showSuccess('分享链接已复制到剪贴板')
    })
    .catch(() => {
      showError('复制失败，请手动复制链接')
    })
}

const generateQRCode = () => {
  showWarning('二维码生成功能开发中')
}

const shareToSocial = () => {
  showWarning('社交分享功能开发中')
}

const viewVocabularyDetail = (wordId) => {
  router.push({
    name: 'VocabularyDetail',
    params: { id: wordId }
  })
}
</script>

<style scoped>
.document-detail-page {
  padding: 24px;
  max-width: 1200px;
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

/* 详情头部 */
.detail-header {
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

/* 文档信息卡片 */
.document-info-card {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 32px;
  background: linear-gradient(135deg, #fff2e8 0%, #f6ffed 100%);
  border-radius: 32px;
  padding: 32px;
  margin-bottom: 32px;
  border: 4px solid #ffd591;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .document-info-card {
    grid-template-columns: 1fr;
  }
}

/* 封面区域 */
.document-cover {
  position: relative;
}

.cover-image {
  width: 100%;
  height: 400px;
  border-radius: 24px;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 400px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ffccc7 0%, #bae7ff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.placeholder-text {
  font-family: 'Kalam', cursive;
  font-size: 48px;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* 状态标签 */
.status-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-badge.processing {
  background: linear-gradient(135deg, #ffcc00 0%, #ff9500 100%);
}

.status-badge.processed {
  background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
}

.status-badge.error {
  background: linear-gradient(135deg, #ff3b30 0%, #ff2d55 100%);
}

.status-badge.pending {
  background: linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%);
}

/* 文档信息 */
.document-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.document-title {
  font-family: 'Kalam', cursive;
  font-size: 48px;
  color: #ff6b9d;
  margin: 0;
  line-height: 1.2;
}

.document-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 2px dashed #d9f7be;
}

@media (max-width: 768px) {
  .document-meta {
    grid-template-columns: 1fr;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
}

.meta-icon {
  font-size: 18px;
}

.meta-label {
  color: #888;
}

.meta-value {
  color: #333;
  font-weight: 600;
}

/* 标签 */
.document-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 2px dashed #bae7ff;
}

.tags-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

.tag-item {
  padding: 6px 12px;
  background: linear-gradient(135deg, #ffccc7 0%, #ffd591 100%);
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  border: 1px solid #ffb8d9;
}

/* 描述 */
.document-description {
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 2px dashed #d9f7be;
}

.description-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #36cfc9;
  margin: 0 0 12px 0;
}

.description-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* 统计区域 */
.document-stats-section {
  margin-bottom: 32px;
}

.section-title {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  color: #ff6b9d;
  margin: 0 0 24px 0;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* 统计卡片 */
.stat-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 3px solid #d9f7be;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-icon {
  font-size: 24px;
}

.stat-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #666;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 进度条 */
.progress-bar {
  height: 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 8px;
  transition: width 1s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-value {
  font-family: 'Kalam', cursive;
  font-size: 24px;
  color: #ff6b9d;
  font-weight: bold;
}

.progress-detail {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

/* 统计值 */
.stat-value {
  font-family: 'Kalam', cursive;
  font-size: 36px;
  color: #ff6b9d;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

/* 操作按钮区域 */
.action-buttons-section {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0fff4 100%);
  border-radius: 32px;
  border: 3px dashed #bae7ff;
}

@media (max-width: 768px) {
  .action-buttons-section {
    flex-direction: column;
    align-items: stretch;
  }
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 40px;
  border-radius: 30px;
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 200px;
}

@media (max-width: 768px) {
  .action-button {
    min-width: auto;
    width: 100%;
  }
}

.action-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.3);
}

.action-button.secondary {
  background: white;
  color: #666;
  border: 3px solid #d9f7be;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.button-icon {
  font-size: 24px;
}

/* 相关词汇区域 */
.related-vocabulary-section {
  margin-bottom: 32px;
}

.vocabulary-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.vocabulary-item {
  background: white;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #d9f7be;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.vocabulary-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ff6b9d;
}

.word-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.word-text {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #ff6b9d;
  font-weight: bold;
}

.word-phonetic {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
  font-style: italic;
}

.word-definition {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 分享弹窗 */
.share-modal {
  padding: 20px;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .share-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .share-options {
    grid-template-columns: 1fr;
  }
}

.share-button {
  width: 100%;
  padding: 20px;
  background: white;
  border: 3px solid #bae7ff;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
}

.share-button:hover {
  background: #e6f7ff;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.share-icon {
  font-size: 32px;
}

.share-text {
  font-weight: 600;
}

/* 分享设置 */
.share-settings {
  padding: 20px;
  background: #fafafa;
  border-radius: 20px;
  border: 2px dashed #d9f7be;
}

.settings-title {
  font-family: 'Caveat', cursive;
  font-size: 20px;
  color: #36cfc9;
  margin: 0 0 16px 0;
}

.setting-item {
  margin-bottom: 12px;
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

/* 删除弹窗 */
.delete-modal {
  padding: 20px;
}

.delete-warning {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #fff2e8 0%, #ffccc7 100%);
  border-radius: 20px;
  border: 3px solid #ff7875;
}

.warning-icon {
  font-size: 40px;
}

.warning-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #cf1322;
  margin: 0;
}

.warning-text strong {
  color: #ff4d4f;
}

.delete-note {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
  text-align: center;
  margin: 0;
  padding: 0 20px;
}
</style>