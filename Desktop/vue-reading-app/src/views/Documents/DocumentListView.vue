<!-- src/views/Documents/DocumentListView.vue -->
<template>
  <DefaultLayout>
    <div class="document-list-page">
      <!-- 顶部搜索和筛选 -->
      <div class="list-header">
        <div class="header-content">
          <h1 class="page-title">📚 我的书架</h1>
          
          <!-- 搜索框 -->
          <div class="search-container">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                v-model="searchQuery"
                placeholder="搜索文档标题、作者或标签..."
                @input="handleSearch"
                class="search-input"
              />
              <button 
                v-if="searchQuery"
                class="search-clear"
                @click="clearSearch"
              >
                ×
              </button>
            </div>
            
            <button class="search-button" @click="performSearch">
              搜索
            </button>
          </div>
        </div>
        
        <!-- 筛选和排序 -->
        <div class="filter-controls">
          <!-- 视图切换 -->
          <div class="view-toggle">
            <button 
              class="view-button"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <span class="view-icon">⏹️</span>
              <span class="view-text">网格</span>
            </button>
            <button 
              class="view-button"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <span class="view-icon">📋</span>
              <span class="view-text">列表</span>
            </button>
          </div>
          
          <!-- 筛选按钮 -->
          <div class="filter-buttons">
            <button 
              class="filter-button"
              :class="{ active: activeFilter === 'all' }"
              @click="setFilter('all')"
            >
              全部
            </button>
            <button 
              class="filter-button"
              :class="{ active: activeFilter === 'favorites' }"
              @click="setFilter('favorites')"
            >
              <span class="filter-icon">❤️</span>
              收藏
            </button>
            <button 
              class="filter-button"
              :class="{ active: activeFilter === 'recent' }"
              @click="setFilter('recent')"
            >
              <span class="filter-icon">🕒</span>
              最近
            </button>
            <button 
              class="filter-button"
              :class="{ active: activeFilter === 'processing' }"
              @click="setFilter('processing')"
            >
              <span class="filter-icon">⏳</span>
              处理中
            </button>
          </div>
          
          <!-- 排序选择 -->
          <div class="sort-control">
            <label class="sort-label">
              <span class="sort-icon">📊</span>
              <select 
                v-model="sortBy"
                @change="handleSortChange"
                class="sort-select"
              >
                <option value="created_at">上传时间</option>
                <option value="title">标题</option>
                <option value="author">作者</option>
                <option value="read_progress">阅读进度</option>
                <option value="reading_time">阅读时长</option>
              </select>
            </label>
            
            <button 
              class="sort-order-button"
              @click="toggleSortOrder"
            >
              <span class="order-icon">
                {{ sortOrder === 'desc' ? '⬇️' : '⬆️' }}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-animation">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <p class="loading-text">正在加载文档...</p>
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
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="filteredDocuments.length === 0" class="empty-state">
        <div class="empty-illustration">📚</div>
        <h3 class="empty-title">书架空空如也</h3>
        <p class="empty-description">
          {{ searchQuery ? '没有找到匹配的文档' : '还没有上传任何文档，快来添加你的第一份文档吧！' }}
        </p>
        <div class="empty-actions">
          <button 
            v-if="!searchQuery"
            class="empty-action-button primary"
            @click="uploadDocument"
          >
            <span class="button-icon">📤</span>
            <span>上传文档</span>
          </button>
          <button 
            v-else
            class="empty-action-button secondary"
            @click="clearSearch"
          >
            <span class="button-icon">↩️</span>
            <span>清空搜索</span>
          </button>
        </div>
      </div>
      
      <!-- 文档列表 -->
      <div v-else class="document-list-content">
        <!-- 统计信息 -->
        <div class="list-stats">
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-value">{{ filteredDocuments.length }}</span>
            <span class="stat-label">个文档</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ favoriteCount }}</span>
            <span class="stat-label">个收藏</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-icon">📖</span>
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">个已读完</span>
          </div>
        </div>
        
        <!-- 网格视图 -->
        <div 
          v-if="viewMode === 'grid'" 
          class="document-grid"
        >
          <div 
            v-for="doc in paginatedDocuments" 
            :key="doc.id"
            class="document-card"
          >
            <!-- 卡片封面 -->
            <div 
              class="card-cover"
              @click="viewDocument(doc.id)"
            >
              <div v-if="doc.coverUrl" class="cover-image">
                <img :src="doc.coverUrl" :alt="doc.title" />
              </div>
              <div v-else class="cover-placeholder">
                <span class="placeholder-icon">📚</span>
                <span class="placeholder-text">{{ doc.title.charAt(0) }}</span>
              </div>
              
              <!-- 状态标签 -->
              <div class="status-badge" :class="doc.status">
                {{ statusLabels[doc.status] }}
              </div>
              
              <!-- 收藏按钮 -->
              <button 
                class="favorite-button"
                @click.stop="toggleFavorite(doc.id)"
              >
                <span class="favorite-icon">
                  {{ doc.isFavorite ? '❤️' : '🤍' }}
                </span>
              </button>
            </div>
            
            <!-- 卡片内容 -->
            <div class="card-content">
              <h3 
                class="card-title"
                @click="viewDocument(doc.id)"
              >
                {{ doc.title }}
              </h3>
              
              <div class="card-meta">
                <div class="meta-item">
                  <span class="meta-icon">✍️</span>
                  <span class="meta-text">{{ doc.author || '未知' }}</span>
                </div>
                
                <div class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span class="meta-text">{{ formatDate(doc.createdAt) }}</span>
                </div>
              </div>
              
              <!-- 阅读进度 -->
              <div class="card-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    :style="{ width: `${doc.readProgress || 0}%` }"
                  ></div>
                </div>
                <div class="progress-text">
                  <span class="progress-value">{{ doc.readProgress || 0 }}%</span>
                  <span class="progress-detail">
                    {{ doc.currentPage || 0 }}/{{ doc.pageCount || '?' }} 页
                  </span>
                </div>
              </div>
              
              <!-- 标签 -->
              <div v-if="doc.tags && doc.tags.length" class="card-tags">
                <span 
                  v-for="tag in doc.tags.slice(0, 3)" 
                  :key="tag"
                  class="tag-item"
                >
                  {{ tag }}
                </span>
                <span 
                  v-if="doc.tags.length > 3"
                  class="tag-more"
                >
                  +{{ doc.tags.length - 3 }}
                </span>
              </div>
              
              <!-- 操作按钮 -->
              <div class="card-actions">
                <button 
                  class="action-button primary"
                  @click="startReading(doc.id)"
                >
                  <span class="action-icon">📖</span>
                  <span class="action-text">
                    {{ doc.readProgress > 0 ? '继续' : '阅读' }}
                  </span>
                </button>
                
                <button 
                  class="action-button secondary"
                  @click="showDocumentMenu(doc.id)"
                >
                  <span class="action-icon">⋯</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 列表视图 -->
        <div 
          v-else 
          class="document-table"
        >
          <table class="table">
            <thead>
              <tr>
                <th class="table-header">
                  <input 
                    type="checkbox" 
                    v-model="selectAll"
                    class="table-checkbox"
                  />
                </th>
                <th class="table-header">标题</th>
                <th class="table-header">作者</th>
                <th class="table-header">语言</th>
                <th class="table-header">进度</th>
                <th class="table-header">状态</th>
                <th class="table-header">上传时间</th>
                <th class="table-header">操作</th>
              </tr>
            </thead>
            
            <tbody>
              <tr 
                v-for="doc in paginatedDocuments" 
                :key="doc.id"
                class="table-row"
                :class="{ selected: selectedDocuments.includes(doc.id) }"
              >
                <td class="table-cell">
                  <input 
                    type="checkbox" 
                    :value="doc.id"
                    v-model="selectedDocuments"
                    class="table-checkbox"
                  />
                </td>
                
                <td class="table-cell">
                  <div class="cell-title">
                    <div 
                      v-if="doc.coverUrl" 
                      class="title-cover"
                    >
                      <img :src="doc.coverUrl" :alt="doc.title" />
                    </div>
                    <div v-else class="title-placeholder">
                      {{ doc.title.charAt(0) }}
                    </div>
                    <span class="title-text">{{ doc.title }}</span>
                  </div>
                </td>
                
                <td class="table-cell">
                  {{ doc.author || '未知' }}
                </td>
                
                <td class="table-cell">
                  <span class="language-badge">
                    {{ languageLabels[doc.language] || doc.language }}
                  </span>
                </td>
                
                <td class="table-cell">
                  <div class="progress-cell">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill"
                        :style="{ width: `${doc.readProgress || 0}%` }"
                      ></div>
                    </div>
                    <span class="progress-value">
                      {{ doc.readProgress || 0 }}%
                    </span>
                  </div>
                </td>
                
                <td class="table-cell">
                  <span class="status-badge" :class="doc.status">
                    {{ statusLabels[doc.status] }}
                  </span>
                </td>
                
                <td class="table-cell">
                  {{ formatDate(doc.createdAt) }}
                </td>
                
                <td class="table-cell">
                  <div class="action-buttons">
                    <button 
                      class="action-button small"
                      @click="startReading(doc.id)"
                    >
                      📖
                    </button>
                    <button 
                      class="action-button small"
                      @click="editDocument(doc.id)"
                    >
                      ✏️
                    </button>
                    <button 
                      class="action-button small"
                      @click="toggleFavorite(doc.id)"
                    >
                      {{ doc.isFavorite ? '❤️' : '🤍' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="pagination-button"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            ← 上一页
          </button>
          
          <div class="pagination-pages">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              class="pagination-page"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            
            <span 
              v-if="showEllipsis" 
              class="pagination-ellipsis"
            >
              ...
            </span>
          </div>
          
          <button 
            class="pagination-button"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            下一页 →
          </button>
        </div>
        
        <!-- 批量操作栏 -->
        <div 
          v-if="selectedDocuments.length > 0" 
          class="batch-actions-bar"
        >
          <div class="batch-info">
            <span class="batch-count">
              已选择 {{ selectedDocuments.length }} 个文档
            </span>
          </div>
          
          <div class="batch-buttons">
            <button 
              class="batch-button"
              @click="batchAddToFavorites"
            >
              <span class="batch-icon">❤️</span>
              添加到收藏
            </button>
            
            <button 
              class="batch-button"
              @click="batchRemoveFromFavorites"
            >
              <span class="batch-icon">🤍</span>
              从收藏移除
            </button>
            
            <button 
              class="batch-button danger"
              @click="showBatchDeleteModal"
            >
              <span class="batch-icon">🗑️</span>
              批量删除
            </button>
            
            <button 
              class="batch-button secondary"
              @click="clearSelection"
            >
              <span class="batch-icon">✕</span>
              取消选择
            </button>
          </div>
        </div>
      </div>
      
      <!-- 批量删除确认弹窗 -->
      <AppModal 
        v-if="showBatchDeleteModal" 
        title="🗑️ 批量删除文档"
        @close="showBatchDeleteModal = false"
        @confirm="batchDeleteDocuments"
      >
        <div class="batch-delete-modal">
          <div class="delete-warning">
            <span class="warning-icon">⚠️</span>
            <p class="warning-text">
              确定要删除选中的 <strong>{{ selectedDocuments.length }}</strong> 个文档吗？
            </p>
          </div>
          <p class="delete-note">
            此操作不可撤销，所有选中的文档及其相关数据都将被永久删除。
          </p>
        </div>
      </AppModal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AppModal from '@/components/common/AppModal.vue'
import documentService from '@/services/document.service.js'
import { useDocumentStore } from '@/stores/document.store'
import { formatDate } from '@/utils/formatters'
import { showSuccess, showError, showWarning } from '@/utils/notify'

const router = useRouter()
const documentStore = useDocumentStore()

// 响应式数据
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const viewMode = ref('grid')
const activeFilter = ref('all')
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const selectedDocuments = ref([])


// 分页
const currentPage = ref(1)
const pageSize = ref(12)

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
const documents = computed(() => documentStore.documents)

const filteredDocuments = computed(() => {
  let filtered = [...documents.value]
  
  // 应用搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc => 
      (doc.title && doc.title.toLowerCase().includes(query)) ||
      (doc.author && doc.author.toLowerCase().includes(query)) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }
  
  // 应用筛选
  switch (activeFilter.value) {
    case 'favorites':
      filtered = filtered.filter(doc => doc.isFavorite)
      break
    case 'recent':
      filtered = filtered.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 20)
      break
    case 'processing':
      filtered = filtered.filter(doc => 
        doc.status === 'processing' || doc.status === 'pending'
      )
      break
  }
  
  // 应用排序
  filtered.sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy.value) {
      case 'title':
        aValue = a.title || ''
        bValue = b.title || ''
        break
      case 'author':
        aValue = a.author || ''
        bValue = b.author || ''
        break
      case 'read_progress':
        aValue = a.readProgress || 0
        bValue = b.readProgress || 0
        break
      case 'reading_time':
        aValue = a.readingTime || 0
        bValue = b.readingTime || 0
        break
      default:
        aValue = new Date(a.createdAt || 0)
        bValue = new Date(b.createdAt || 0)
    }
    
    if (sortOrder.value === 'desc') {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })
  
  return filtered
})

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDocuments.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredDocuments.value.length / pageSize.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    let start = Math.max(1, currentPage.value - 2)
    let end = Math.min(totalPages.value, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = end - maxVisible + 1
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
})

const showEllipsis = computed(() => {
  return totalPages.value > 5 && 
    (currentPage.value < totalPages.value - 2 || currentPage.value > 3)
})

const favoriteCount = computed(() => {
  return documents.value.filter(doc => doc.isFavorite).length
})

const completedCount = computed(() => {
  return documents.value.filter(doc => doc.readProgress >= 100).length
})

const selectAll = computed({
  get: () => {
    return selectedDocuments.value.length === paginatedDocuments.value.length &&
      paginatedDocuments.value.length > 0
  },
  set: (value) => {
    if (value) {
      selectedDocuments.value = paginatedDocuments.value.map(doc => doc.id)
    } else {
      selectedDocuments.value = []
    }
  }
})

// 生命周期钩子
onMounted(async () => {
  await loadDocuments()
})

// 方法
const loadDocuments = async () => {
  try {
    loading.value = true
    error.value = null
    
    await documentStore.refreshDocuments()
  } catch (err) {
    error.value = err.message || '加载文档失败'
    showError(error.value)
  } finally {
    loading.value = false
  }
}

const retry = () => {
  loadDocuments()
}

const handleSearch = () => {
  // 防抖处理，这里简单实现
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const performSearch = () => {
  currentPage.value = 1
  // 这里可以触发API搜索
}

const setFilter = (filter) => {
  activeFilter.value = filter
  currentPage.value = 1
}

const handleSortChange = () => {
  currentPage.value = 1
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const viewDocument = (documentId) => {
  router.push({
    name: 'DocumentDetail',
    params: { id: documentId }
  })
}

const startReading = (documentId) => {
  router.push({
    name: 'Reader',
    params: { id: documentId }
  })
}

const editDocument = (documentId) => {
  router.push({
    name: 'DocumentEdit',
    params: { id: documentId }
  })
}

const toggleFavorite = async (documentId) => {
  try {
    const doc = documentStore.getDocumentById(documentId)
    if (!doc) return
    
    const updatedDoc = await documentService.updateDocument(documentId, {
      isFavorite: !doc.isFavorite
    })
    
    documentStore.updateDocument(updatedDoc)
    
    showSuccess(
      updatedDoc.isFavorite 
        ? '已添加到收藏' 
        : '已从收藏中移除'
    )
  } catch (err) {
    showError('更新收藏状态失败')
  }
}

const showDocumentMenu = (documentId) => {
  // 显示文档操作菜单
  showWarning('文档菜单功能开发中')
}

const uploadDocument = () => {
  router.push({ name: 'DocumentUpload' })
}

const batchAddToFavorites = async () => {
  try {
    for (const docId of selectedDocuments.value) {
      await documentService.updateDocument(docId, {
        isFavorite: true
      })
    }
    
    // 刷新文档列表
    await loadDocuments()
    clearSelection()
    
    showSuccess('已添加到收藏')
  } catch (err) {
    showError('批量添加到收藏失败')
  }
}

const batchRemoveFromFavorites = async () => {
  try {
    for (const docId of selectedDocuments.value) {
      await documentService.updateDocument(docId, {
        isFavorite: false
      })
    }
    
    // 刷新文档列表
    await loadDocuments()
    clearSelection()
    
    showSuccess('已从收藏中移除')
  } catch (err) {
    showError('批量从收藏移除失败')
  }
}

const showBatchDeleteModal = () => {
  if (selectedDocuments.value.length === 0) {
    showWarning('请先选择要删除的文档')
    return
  }
  
  showBatchDeleteModal.value = true
}

const batchDeleteDocuments = async () => {
  try {
    for (const docId of selectedDocuments.value) {
      await documentService.deleteDocument(docId)
    }
    
    // 刷新文档列表
    await loadDocuments()
    clearSelection()
    showBatchDeleteModal.value = false
    
    showSuccess('批量删除成功')
  } catch (err) {
    showError('批量删除失败')
  }
}

const clearSelection = () => {
  selectedDocuments.value = []
}
</script>

<style scoped>
.document-list-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 列表头部 */
.list-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  border-radius: 25px;
  border: 3px dashed #bae7ff;
}

.page-title {
  font-family: 'Kalam', cursive;
  font-size: 36px;
  color: #ff6b9d;
  margin: 0;
}

/* 搜索容器 */
.search-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 3px solid #d9f7be;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  background: white;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #36cfc9;
  box-shadow: 0 0 0 3px rgba(54, 207, 201, 0.1);
}

.search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.search-clear:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
}

.search-button {
  padding: 16px 32px;
  background: linear-gradient(135deg, #36cfc9 0%, #73d13d 100%);
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(54, 207, 201, 0.3);
}

/* 筛选控制 */
.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-radius: 20px;
  border: 3px solid #ffd591;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.view-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-button:hover {
  border-color: #36cfc9;
  color: #36cfc9;
}

.view-button.active {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0fff4 100%);
  border-color: #36cfc9;
  color: #36cfc9;
}

.view-icon {
  font-size: 16px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-button:hover {
  border-color: #ff6b9d;
  color: #ff6b9d;
}

.filter-button.active {
  background: linear-gradient(135deg, #fff2e8 0%, #ffccc7 100%);
  border-color: #ff6b9d;
  color: #ff6b9d;
}

.filter-icon {
  font-size: 16px;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
}

.sort-icon {
  font-size: 16px;
}

.sort-select {
  padding: 12px 16px;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: #36cfc9;
}

.sort-order-button {
  padding: 12px;
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-order-button:hover {
  border-color: #36cfc9;
}

.order-icon {
  font-size: 16px;
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

.error-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100px 20px;
}

.empty-illustration {
  font-size: 80px;
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.empty-title {
  font-family: 'Kalam', cursive;
  font-size: 36px;
  color: #ff6b9d;
  margin-bottom: 16px;
}

.empty-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #666;
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.empty-action-button {
  padding: 16px 32px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-action-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.empty-action-button.secondary {
  background: white;
  color: #666;
  border: 3px solid #d9f7be;
}

.empty-action-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.button-icon {
  font-size: 20px;
}

/* 统计信息 */
.list-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding: 20px;
  background: linear-gradient(135deg, #fff2e8 0%, #f6ffed 100%);
  border-radius: 20px;
  border: 3px dashed #ffd591;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  font-weight: bold;
}

.stat-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

/* 文档网格 */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* 文档卡片 */
.document-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 3px solid #d9f7be;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.document-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
  border-color: #ff6b9d;
}

/* 卡片封面 */
.card-cover {
  position: relative;
  height: 200px;
  cursor: pointer;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.document-card:hover .cover-image img {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffccc7 0%, #bae7ff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.placeholder-text {
  font-family: 'Kalam', cursive;
  font-size: 36px;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* 状态标签 */
.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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

/* 收藏按钮 */
.favorite-button {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.favorite-button:hover {
  background: white;
  transform: scale(1.1);
}

.favorite-icon {
  font-size: 20px;
}

/* 卡片内容 */
.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #ff6b9d;
  margin: 0;
  cursor: pointer;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-title:hover {
  color: #ff4d4f;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
}

.meta-icon {
  font-size: 14px;
}

/* 阅读进度 */
.card-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #ff6b9d;
  font-weight: 600;
}

.progress-detail {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #888;
}

/* 标签 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  padding: 4px 10px;
  background: linear-gradient(135deg, #ffccc7 0%, #ffd591 100%);
  border-radius: 12px;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #666;
  border: 1px solid #ffb8d9;
}

.tag-more {
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 12px;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  padding: 12px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 16px;
}

/* 列表视图 */
.document-table {
  margin-bottom: 32px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 3px solid #d9f7be;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  padding: 16px;
  text-align: left;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  background: #fafafa;
  border-bottom: 2px solid #e8e8e8;
}

.table-row {
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.table-row:hover {
  background: #fafafa;
}

.table-row.selected {
  background: #e6f7ff;
}

.table-cell {
  padding: 16px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  vertical-align: middle;
}

.table-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #d9d9d9;
  cursor: pointer;
}

/* 单元格标题 */
.cell-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-cover {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.title-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffccc7 0%, #bae7ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Kalam', cursive;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.title-text {
  font-weight: 600;
  color: #333;
}

/* 语言徽章 */
.language-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #d9f7be 0%, #bae7ff 100%);
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

/* 进度单元格 */
.progress-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 3px;
}

.progress-value {
  font-weight: 600;
  color: #ff6b9d;
  min-width: 40px;
  text-align: right;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button.small {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.pagination-button {
  padding: 12px 24px;
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-button:hover:not(:disabled) {
  border-color: #36cfc9;
  color: #36cfc9;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 8px;
}

.pagination-page {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid #d9d9d9;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-page:hover {
  border-color: #ff6b9d;
  color: #ff6b9d;
}

.pagination-page.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  border-color: transparent;
  color: white;
}

.pagination-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #999;
}

/* 批量操作栏 */
.batch-actions-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 25px;
  padding: 16px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 3px solid #ff6b9d;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 600px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.batch-info {
  flex: 1;
}

.batch-count {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #ff6b9d;
}

.batch-buttons {
  display: flex;
  gap: 12px;
}

.batch-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.batch-button:hover {
  border-color: #36cfc9;
  color: #36cfc9;
}

.batch-button.danger {
  border-color: #ff7875;
  color: #ff4d4f;
}

.batch-button.danger:hover {
  background: #fff2f0;
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.batch-button.secondary {
  border-color: #d9d9d9;
  color: #666;
}

.batch-button.secondary:hover {
  background: #fafafa;
  border-color: #bfbfbf;
  color: #333;
}

.batch-icon {
  font-size: 16px;
}

/* 批量删除弹窗 */
.batch-delete-modal {
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .batch-actions-bar {
    min-width: 500px;
  }
}

@media (max-width: 768px) {
  .document-list-page {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .view-toggle,
  .filter-buttons,
  .sort-control {
    justify-content: center;
  }
  
  .document-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .batch-actions-bar {
    min-width: 90vw;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .batch-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .pagination-pages {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .document-grid {
    grid-template-columns: 1fr;
  }
  
  .list-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-item {
    justify-content: center;
  }
  
  .table {
    display: block;
    overflow-x: auto;
  }
  
  .pagination-pages {
    gap: 4px;
  }
  
  .pagination-page {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
  
  .pagination-button {
    padding: 10px 16px;
    font-size: 12px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.document-card {
  animation: fadeIn 0.5s ease forwards;
}

.document-card:nth-child(1) { animation-delay: 0.1s; }
.document-card:nth-child(2) { animation-delay: 0.2s; }
.document-card:nth-child(3) { animation-delay: 0.3s; }
.document-card:nth-child(4) { animation-delay: 0.4s; }
.document-card:nth-child(5) { animation-delay: 0.5s; }
.document-card:nth-child(6) { animation-delay: 0.6s; }
.document-card:nth-child(7) { animation-delay: 0.7s; }
.document-card:nth-child(8) { animation-delay: 0.8s; }
.document-card:nth-child(9) { animation-delay: 0.9s; }
.document-card:nth-child(10) { animation-delay: 1.0s; }
.document-card:nth-child(11) { animation-delay: 1.1s; }
.document-card:nth-child(12) { animation-delay: 1.2s; }

/* 悬停效果增强 */
.document-card:hover .card-title {
  color: #ff4d4f;
}

.document-card:hover .action-button.primary {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff9500 100%);
}

.document-card:hover .action-button.secondary {
  border-color: #ff6b9d;
  color: #ff6b9d;
}

/* 状态徽章动画 */
.status-badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  100% {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

/* 加载动画 */
.loading-dot {
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

/* 空状态动画 */
.empty-illustration {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 批量操作栏动画 */
.batch-actions-bar {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* 过渡效果 */
.document-card,
.table-row,
.action-button,
.filter-button,
.view-button,
.pagination-button,
.batch-button {
  transition: all 0.3s ease;
}

/* 滚动条样式 */
.document-table::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.document-table::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.document-table::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 4px;
}

.document-table::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff9500 100%);
}

/* 打印样式 */
@media print {
  .list-header,
  .filter-controls,
  .batch-actions-bar,
  .action-button {
    display: none !important;
  }
  
  .document-card {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
</style>