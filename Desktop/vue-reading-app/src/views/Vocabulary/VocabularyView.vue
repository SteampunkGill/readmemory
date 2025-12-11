<template>
  <div class="vocabulary-view">
    <!-- 顶部装饰性元素 -->
    <div class="decoration-stars">
      <div class="star star-1">⭐</div>
      <div class="star star-2">✨</div>
      <div class="star star-3">🌟</div>
    </div>

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="title-section">
        <h1 class="page-title">
          <span class="title-icon">📚</span>
          我的生词本
        </h1>
        <p class="page-subtitle">在这里管理你收藏的所有单词，让学习变得更有趣！</p>
      </div>
      
      <!-- 学习统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card stat-card-1">
          <div class="stat-icon">📖</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalWords || 0 }}</div>
            <div class="stat-label">总单词数</div>
          </div>
        </div>
        <div class="stat-card stat-card-2">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.masteredWords || 0 }}</div>
            <div class="stat-label">已掌握</div>
          </div>
        </div>
        <div class="stat-card stat-card-3">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-value">{{ reviewStats.dueToday || 0 }}</div>
            <div class="stat-label">今日复习</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制区域 -->
    <div class="control-section">
      <!-- 搜索和筛选 -->
      <div class="search-filter-section">
        <div class="search-box">
          <div class="search-icon">🔍</div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索单词或释义..."
            class="search-input"
            @input="handleSearch"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
            ✕
          </button>
        </div>

        <div class="filter-controls">
          <!-- 状态筛选 -->
          <div class="filter-group">
            <label class="filter-label">状态:</label>
            <div class="filter-buttons">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                @click="toggleStatusFilter(status.value)"
                :class="['status-btn', `status-${status.value}`, { active: filters.status.includes(status.value) }]"
              >
                {{ status.label }}
              </button>
            </div>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-group">
            <label class="filter-label">标签:</label>
            <div class="tag-selector">
              <div class="selected-tags">
                <span
                  v-for="tag in selectedTags"
                  :key="tag"
                  class="selected-tag"
                  @click="removeTag(tag)"
                >
                  {{ tag }} ×
                </span>
              </div>
              <select v-model="newTag" @change="addTag" class="tag-select">
                <option value="">选择标签...</option>
                <option v-for="tag in availableTags" :key="tag" :value="tag">
                  {{ tag }}
                </option>
              </select>
            </div>
          </div>

          <!-- 排序选项 -->
          <div class="filter-group">
            <label class="filter-label">排序:</label>
            <select v-model="sortBy" @change="handleSortChange" class="sort-select">
              <option value="created_at">添加时间</option>
              <option value="word">单词字母</option>
              <option value="mastery_level">掌握程度</option>
              <option value="review_count">复习次数</option>
            </select>
            <button @click="toggleSortOrder" class="sort-order-btn">
              {{ sortOrder === 'desc' ? '↓' : '↑' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="startReview" class="action-btn review-btn">
          <span class="btn-icon">🔄</span>
          开始复习
        </button>
        <button @click="exportVocabulary" class="action-btn export-btn">
          <span class="btn-icon">📤</span>
          导出生词
        </button>
        <button @click="showBatchActions = !showBatchActions" class="action-btn batch-btn">
          <span class="btn-icon">⚙️</span>
          批量操作
        </button>
      </div>

      <!-- 批量操作面板 -->
      <div v-if="showBatchActions" class="batch-actions-panel">
        <div class="batch-header">
          <h3>批量操作</h3>
          <button @click="selectAll" class="select-all-btn">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </button>
        </div>
        <div class="batch-buttons">
          <button @click="batchUpdateStatus('mastered')" class="batch-btn mastered-btn">
            标记为已掌握
          </button>
          <button @click="batchUpdateStatus('learning')" class="batch-btn learning-btn">
            标记为学习中
          </button>
          <button @click="batchDelete" class="batch-btn delete-btn">
            删除选中
          </button>
        </div>
      </div>
    </div>

    <!-- 生词列表 -->
    <div class="vocabulary-list-section">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载生词本...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="vocabularyList.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3 class="empty-title">生词本空空如也</h3>
        <p class="empty-description">
          {{ searchQuery ? '没有找到匹配的单词，试试其他搜索词吧！' : '快去阅读文档，收藏有趣的单词吧！' }}
        </p>
        <button v-if="!searchQuery" @click="goToReader" class="empty-action-btn">
          <span class="btn-icon">📖</span>
          开始阅读
        </button>
      </div>

      <!-- 生词列表 -->
      <div v-else class="vocabulary-list">
        <div
          v-for="item in vocabularyList"
          :key="item.id"
          :class="['vocabulary-card', `status-${item.status}`]"
        >
          <!-- 选择框 -->
          <div class="card-select">
            <input
              type="checkbox"
              :id="`select-${item.id}`"
              v-model="selectedItems"
              :value="item.id"
              class="select-checkbox"
            />
            <label :for="`select-${item.id}`" class="select-label"></label>
          </div>

          <!-- 单词信息 -->
          <div class="card-content" @click="viewDetail(item)">
            <div class="word-header">
              <h3 class="word-text">{{ item.word }}</h3>
              <div class="word-meta">
                <span class="phonetic">{{ item.phonetic || '暂无音标' }}</span>
                <button @click.stop="playAudio(item)" class="audio-btn" :disabled="!item.audioUrl">
                  🔊
                </button>
              </div>
            </div>

            <div class="word-definition">
              {{ truncateText(item.definition || '暂无释义', 100) }}
            </div>

            <!-- 标签 -->
            <div v-if="item.tags && item.tags.length > 0" class="word-tags">
              <span
                v-for="tag in item.tags.slice(0, 3)"
                :key="tag"
                class="tag"
                @click.stop="filterByTag(tag)"
              >
                {{ tag }}
              </span>
              <span v-if="item.tags.length > 3" class="tag-more">
                +{{ item.tags.length - 3 }}
              </span>
            </div>

            <!-- 状态和操作 -->
            <div class="card-footer">
              <div class="status-info">
                <span :class="['status-badge', `status-${item.status}`]">
                  {{ getStatusLabel(item.status) }}
                </span>
                <span class="mastery-level">
                  掌握度: 
                  <div class="mastery-bar">
                    <div
                      class="mastery-fill"
                      :style="{ width: `${item.masteryLevel * 10}%` }"
                    ></div>
                  </div>
                </span>
              </div>

              <div class="card-actions">
                <button @click.stop="quickReview(item)" class="action-icon review-icon" title="复习">
                  🔄
                </button>
                <button @click.stop="editItem(item)" class="action-icon edit-icon" title="编辑">
                  ✏️
                </button>
                <button @click.stop="deleteItem(item)" class="action-icon delete-icon" title="删除">
                  🗑️
                </button>
              </div>
            </div>

            <!-- 来源信息 -->
            <div v-if="item.source" class="source-info">
              <span class="source-icon">📄</span>
              来自: {{ item.source }}
              <span v-if="item.sourcePage" class="page-info">第{{ item.sourcePage }}页</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="pagination-btn prev-btn"
        >
          ← 上一页
        </button>
        
        <div class="page-numbers">
          <span
            v-for="page in visiblePages"
            :key="page"
            @click="changePage(page)"
            :class="['page-number', { active: page === pagination.page }]"
          >
            {{ page }}
          </span>
          <span v-if="showEllipsis" class="page-ellipsis">...</span>
        </div>
        
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="pagination-btn next-btn"
        >
          下一页 →
        </button>
      </div>
    </div>

    <!-- 生词详情模态框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="detail-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ currentDetail.word }}</h2>
          <button @click="closeDetailModal" class="modal-close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <!-- 单词基本信息 -->
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">音标:</span>
              <span class="detail-value phonetic">{{ currentDetail.phonetic || '暂无' }}</span>
              <button @click="playAudio(currentDetail)" class="audio-btn-large" :disabled="!currentDetail.audioUrl">
                🔊 播放
              </button>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">词性:</span>
              <span class="detail-value part-of-speech">{{ currentDetail.partOfSpeech || '未知' }}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">难度:</span>
              <span :class="['detail-value', `difficulty-${currentDetail.difficulty}`]">
                {{ getDifficultyLabel(currentDetail.difficulty) }}
              </span>
            </div>
          </div>

          <!-- 释义 -->
          <div class="detail-section">
            <h3 class="section-title">释义</h3>
            <div class="definitions">
              <div
                v-for="(def, index) in currentDetail.definitions"
                :key="index"
                class="definition-item"
              >
                <span class="definition-index">{{ index + 1 }}.</span>
                <span class="definition-text">{{ def }}</span>
              </div>
            </div>
          </div>

          <!-- 例句 -->
          <div v-if="currentDetail.examples && currentDetail.examples.length > 0" class="detail-section">
            <h3 class="section-title">例句</h3>
            <div class="examples">
              <div
                v-for="(example, index) in currentDetail.examples"
                :key="index"
                class="example-item"
              >
                <span class="example-text">{{ example }}</span>
              </div>
            </div>
          </div>

          <!-- 同义词/反义词 -->
          <div v-if="currentDetail.synonyms || currentDetail.antonyms" class="detail-section">
            <div class="word-relations">
              <div v-if="currentDetail.synonyms" class="relation-group">
                <h4 class="relation-title">同义词</h4>
                <div class="relation-tags">
                  <span
                    v-for="synonym in currentDetail.synonyms.slice(0, 5)"
                    :key="synonym"
                    class="relation-tag synonym-tag"
                  >
                    {{ synonym }}
                  </span>
                </div>
              </div>
              
              <div v-if="currentDetail.antonyms" class="relation-group">
                <h4 class="relation-title">反义词</h4>
                <div class="relation-tags">
                  <span
                    v-for="antonym in currentDetail.antonyms.slice(0, 5)"
                    :key="antonym"
                    class="relation-tag antonym-tag"
                  >
                    {{ antonym }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 学习信息 -->
          <div class="detail-section">
            <h3 class="section-title">学习信息</h3>
            <div class="learning-info">
              <div class="info-item">
                <span class="info-label">状态:</span>
                <span :class="['info-value', `status-${currentDetail.status}`]">
                  {{ getStatusLabel(currentDetail.status) }}
                </span>
              </div>
              
              <div class="info-item">
                <span class="info-label">掌握程度:</span>
                <div class="mastery-display">
                  <div class="mastery-bar-large">
                    <div
                      class="mastery-fill-large"
                      :style="{ width: `${currentDetail.masteryLevel * 10}%` }"
                    ></div>
                  </div>
                  <span class="mastery-percentage">{{ currentDetail.masteryLevel * 10 }}%</span>
                </div>
              </div>
              
              <div class="info-item">
                <span class="info-label">复习次数:</span>
                <span class="info-value">{{ currentDetail.reviewCount }} 次</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">添加时间:</span>
                <span class="info-value">{{ formatDate(currentDetail.createdAt) }}</span>
              </div>
              
              <div v-if="currentDetail.lastReviewedAt" class="info-item">
                <span class="info-label">上次复习:</span>
                <span class="info-value">{{ formatDate(currentDetail.lastReviewedAt) }}</span>
              </div>
              
              <div v-if="currentDetail.nextReviewAt" class="info-item">
                <span class="info-label">下次复习:</span>
                <span class="info-value">{{ formatDate(currentDetail.nextReviewAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="startReviewWithCurrent" class="modal-btn review-btn">
            🔄 开始复习
          </button>
          <button @click="editCurrentItem" class="modal-btn edit-btn">
            ✏️ 编辑
          </button>
          <button @click="deleteCurrentItem" class="modal-btn delete-btn">
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 底部装饰 -->
    <div class="bottom-decoration">
      <div class="cloud cloud-1">☁️</div>
      <div class="cloud cloud-2">☁️</div>
      <div class="cloud cloud-3">☁️</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import vocabularyService from '@/services/vocabulary.service'
import { formatDate, truncateText } from '@/utils/formatter'
import { showSuccess, showError, showConfirm } from '@/utils/notify'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const filters = ref({
  status: [],
  tags: []
})
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const vocabularyList = ref([])
const selectedItems = ref([])
const showBatchActions = ref(false)
const showDetailModal = ref(false)
const currentDetail = ref({})
const stats = ref({})
const reviewStats = ref({})
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 状态选项
const statusOptions = [
  { value: 'new', label: '新单词', color: '#FFB74D' },
  { value: 'learning', label: '学习中', color: '#4FC3F7' },
  { value: 'reviewing', label: '复习中', color: '#9575CD' },
  { value: 'mastered', label: '已掌握', color: '#81C784' }
]

// 可用标签（示例）
const availableTags = ref(['高频词', '动词', '名词', '形容词', '副词', '专业词汇', '生活用语'])

// 计算属性
const selectedTags = computed(() => filters.value.tags)
const isAllSelected = computed(() => {
  return selectedItems.value.length === vocabularyList.value.length && vocabularyList.value.length > 0
})

const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages = []
  
  // 显示当前页前后各2页
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  
  return pages
})

const showEllipsis = computed(() => {
  return pagination.value.totalPages > 5 && 
         pagination.value.page + 2 < pagination.value.totalPages
})

// 方法
const loadVocabularyList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      search: searchQuery.value,
      status: filters.value.status.length > 0 ? filters.value.status.join(',') : undefined,
      tags: filters.value.tags.length > 0 ? filters.value.tags.join(',') : undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }
    
    const response = await vocabularyService.getVocabularyList(params)
    vocabularyList.value = response.items
    pagination.value = response.pagination
    
    // 加载统计信息
    await loadStats()
  } catch (error) {
    showError('加载生词本失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    stats.value = await vocabularyService.getLearningStats()
    reviewStats.value = await vocabularyService.getReviewStats()
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadVocabularyList()
}

const clearSearch = () => {
  searchQuery.value = ''
  handleSearch()
}

const toggleStatusFilter = (status) => {
  const index = filters.value.status.indexOf(status)
  if (index > -1) {
    filters.value.status.splice(index, 1)
  } else {
    filters.value.status.push(status)
  }
  loadVocabularyList()
}

const addTag = () => {
  if (newTag.value && !filters.value.tags.includes(newTag.value)) {
    filters.value.tags.push(newTag.value)
    newTag.value = ''
    loadVocabularyList()
  }
}

const removeTag = (tag) => {
  const index = filters.value.tags.indexOf(tag)
  if (index > -1) {
    filters.value.tags.splice(index, 1)
    loadVocabularyList()
  }
}

const filterByTag = (tag) => {
  if (!filters.value.tags.includes(tag)) {
    filters.value.tags.push(tag)
    loadVocabularyList()
  }
}

const handleSortChange = () => {
  loadVocabularyList()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  loadVocabularyList()
}

const selectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = vocabularyList.value.map(item => item.id)
  }
}

const batchUpdateStatus = async (status) => {
  if (selectedItems.value.length === 0) {
    showError('请先选择要操作的单词')
    return
  }
  
  try {
    await vocabularyService.batchVocabularyAction('update', selectedItems.value, { status })
    showSuccess(`已更新 ${selectedItems.value.length} 个单词的状态`)
    selectedItems.value = []
    loadVocabularyList()
  } catch (error) {
    showError('批量更新失败: ' + error.message)
  }
}

const batchDelete = async () => {
  if (selectedItems.value.length === 0) {
    showError('请先选择要删除的单词')
    return
  }
  
  const confirmed = await showConfirm(
    `确定要删除选中的 ${selectedItems.value.length} 个单词吗？`,
    '删除确认'
  )
  
  if (!confirmed) return
  
  try {
    await vocabularyService.batchVocabularyAction('delete', selectedItems.value)
    showSuccess(`已删除 ${selectedItems.value.length} 个单词`)
    selectedItems.value = []
    loadVocabularyList()
  } catch (error) {
    showError('批量删除失败: ' + error.message)
  }
}

const viewDetail = async (item) => {
  try {
    const detail = await vocabularyService.getVocabularyItem(item.id)
    currentDetail.value = detail
    showDetailModal.value = true
  } catch (error) {
    showError('获取单词详情失败: ' + error.message)
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  currentDetail.value = {}
}

const playAudio = (item) => {
  if (item.audioUrl) {
    const audio = new Audio(item.audioUrl)
    audio.play().catch(e => console.error('播放音频失败:', e))
  }
}

const quickReview = (item) => {
  router.push({
    path: '/review',
    query: { wordId: item.id }
  })
}

const editItem = (item) => {
  // 这里可以跳转到编辑页面或打开编辑模态框
  console.log('编辑单词:', item)
  showSuccess('编辑功能开发中...')
}

const deleteItem = async (item) => {
  const confirmed = await showConfirm(
    `确定要删除单词 "${item.word}" 吗？`,
    '删除确认'
  )
  
  if (!confirmed) return
  
  try {
    await vocabularyService.deleteVocabularyItem(item.id)
    showSuccess(`已删除单词 "${item.word}"`)
    loadVocabularyList()
  } catch (error) {
    showError('删除失败: ' + error.message)
  }
}

const startReview = () => {
  router.push('/review')
}

const startReviewWithCurrent = () => {
  if (currentDetail.value.id) {
    router.push({
      path: '/review',
      query: { wordId: currentDetail.value.id }
    })
  } else {
    startReview()
  }
}

const editCurrentItem = () => {
  editItem(currentDetail.value)
}

const deleteCurrentItem = async () => {
  await deleteItem(currentDetail.value)
  closeDetailModal()
}

const exportVocabulary = async () => {
  try {
    const exportData = await vocabularyService.exportVocabulary({
      format: 'csv',
      fields: ['word', 'definition', 'status', 'masteryLevel', 'createdAt', 'tags']
    })
    
    // 创建下载链接
    const blob = new Blob([exportData.data], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = exportData.fileName || 'vocabulary_export.csv'
    link.click()
    
    showSuccess('生词本导出成功！')
  } catch (error) {
    showError('导出失败: ' + error.message)
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    loadVocabularyList()
  }
}

const goToReader = () => {
  router.push('/reader')
}

const getStatusLabel = (status) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option ? option.label : status
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

// 监听器
watch([() => filters.value.status, () => filters.value.tags], () => {
  pagination.value.page = 1
  loadVocabularyList()
})

// 生命周期
onMounted(() => {
  loadVocabularyList()
})
</script>

<style scoped>
.vocabulary-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  position: relative;
  overflow-x: hidden;
}

/* 装饰性元素 */
.decoration-stars {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1;
}

.star {
  font-size: 24px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

.star-1 { animation-delay: 0s; }
.star-2 { animation-delay: 1s; }
.star-3 { animation-delay: 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(10deg); }
}

/* 页面标题区域 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.title-section {
  flex: 1;
  min-width: 300px;
}

.page-title {
  font-family: 'Kalam', cursive;
  font-size: 3rem;
  color: #5D4037;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-icon {
  font-size: 3.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.page-subtitle {
  font-family: 'Comfortaa', cursive;
  font-size: 1.2rem;
  color: #795548;
  margin: 0;
  opacity: 0.8;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border-radius: 25px;
  padding: 20px;
  min-width: 150px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.15);
}

.stat-card-1 { border-left: 8px solid #FFB74D; }
.stat-card-2 { border-left: 8px solid #4FC3F7; }
.stat-card-3 { border-left: 8px solid #9575CD; }

.stat-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: 'Comfortaa', cursive;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 0.9rem;
  color: #666;
}

/* 控制区域 */
.control-section {
  background: white;
  border-radius: 30px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.search-filter-section {
  margin-bottom: 25px;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: #667eea;
}

.search-input {
  width: 100%;
  padding: 18px 60px 18px 60px;
  border: 3px solid #E0E0E0;
  border-radius: 50px;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  outline: none;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  transition: color 0.3s ease;
}

.clear-search-btn:hover {
  color: #ff6b6b;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #5D4037;
  white-space: nowrap;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-btn {
  padding: 8px 20px;
  border: 2px solid transparent;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f5f5f5;
  color: #666;
}

.status-btn.active {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.status-new.active { background: #FFE0B2; color: #E65100; border-color: #FFB74D; }
.status-learning.active { background: #E1F5FE; color: #0277BD; border-color: #4FC3F7; }
.status-reviewing.active { background: #F3E5F5; color: #4527A0; border-color: #9575CD; }
.status-mastered.active { background: #E8F5E9; color: #2E7D32; border-color: #81C784; }

.tag-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.selected-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 15px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.selected-tag:hover {
  transform: scale(1.05);
}

.tag-select,
.sort-select {
  padding: 10px 20px;
  border: 2px solid #E0E0E0;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  outline: none;
  transition: border-color 0.3s ease;
}

.tag-select:focus,
.sort-select:focus {
  border-color: #667eea;
}

.sort-order-btn {
  padding: 10px 20px;
  border: 2px solid #E0E0E0;
  border-radius: 25px;
  background: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-order-btn:hover {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 30px;
  font-family: 'Comfortaa', cursive;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.review-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.export-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.batch-btn {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

.btn-icon {
  font-size: 1.3rem;
}

/* 批量操作面板 */
.batch-actions-panel {
  background: #FFF8E1;
  border-radius: 25px;
  padding: 20px;
  margin-top: 20px;
  border: 3px dashed #FFB74D;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.batch-header h3 {
  font-family: 'Comfortaa', cursive;
  color: #5D4037;
  margin: 0;
}

.select-all-btn {
  padding: 8px 20px;
  background: #FFE0B2;
  border: 2px solid #FFB74D;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-all-btn:hover {
  background: #FFB74D;
  color: white;
}

.batch-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.batch-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mastered-btn {
  background: #C8E6C9;
  color: #2E7D32;
}

.mastered-btn:hover {
  background: #81C784;
  color: white;
}

.learning-btn {
  background: #B3E5FC;
  color: #0277BD;
}

.learning-btn:hover {
  background: #4FC3F7;
  color: white;
}

.delete-btn {
  background: #FFCDD2;
  color: #C62828;
}

.delete-btn:hover {
  background: #EF9A9A;
  color: white;
}

/* 生词列表区域 */
.vocabulary-list-section {
  background: white;
  border-radius: 30px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Comfortaa', cursive;
  font-size: 1.2rem;
  color: #667eea;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.empty-title {
  font-family: 'Comfortaa', cursive;
  font-size: 2rem;
  color: #5D4037;
  margin-bottom: 10px;
}

.empty-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  color: #795548;
  margin-bottom: 30px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.empty-action-btn {
  padding: 15px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-family: 'Comfortaa', cursive;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
}

.empty-action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

/* 生词卡片 */
.vocabulary-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.vocabulary-card {
  background: white;
  border-radius: 25px;
  padding: 20px;
  box-shadow: 0 6px 15px rgba(0,0,0,0.08);
  display: flex;
  gap: 15px;
  transition: all 0.3s ease;
  border-left: 8px solid #E0E0E0;
  position: relative;
  overflow: hidden;
}

.vocabulary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.15);
}

.vocabulary-card.status-new { border-left-color: #FFB74D; }
.vocabulary-card.status-learning { border-left-color: #4FC3F7; }
.vocabulary-card.status-reviewing { border-left-color: #9575CD; }
.vocabulary-card.status-mastered { border-left-color: #81C784; }

.card-select {
  flex-shrink: 0;
}

.select-checkbox {
  display: none;
}

.select-label {
  display: block;
  width: 24px;
  height: 24px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.select-checkbox:checked + .select-label {
  background: #667eea;
  border-color: #667eea;
}

.select-checkbox:checked + .select-label::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.card-content {
  flex: 1;
  cursor: pointer;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.word-text {
  font-family: 'Comfortaa', cursive;
  font-size: 1.8rem;
  color: #333;
  margin: 0;
}

.word-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.phonetic {
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  color: #666;
  font-style: italic;
}

.audio-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.audio-btn:hover:not(:disabled) {
  background: #f0f0f0;
  transform: scale(1.1);
}

.audio-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.word-definition {
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 15px;
  min-height: 48px;
}

.word-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.tag {
  background: #E3F2FD;
  color: #1976D2;
  padding: 4px 12px;
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag:hover {
  background: #BBDEFB;
  transform: scale(1.05);
}

.tag-more {
  background: #F5F5F5;
  color: #666;
  padding: 4px 12px;
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.85rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 15px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.status-new { background: #FFE0B2; color: #E65100; }
.status-badge.status-learning { background: #E1F5FE; color: #0277BD; }
.status-badge.status-reviewing { background: #F3E5F5; color: #4527A0; }
.status-badge.status-mastered { background: #E8F5E9; color: #2E7D32; }

.mastery-level {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.9rem;
  color: #666;
}

.mastery-bar {
  width: 60px;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.action-icon:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.review-icon:hover { color: #667eea; }
.edit-icon:hover { color: #FF9800; }
.delete-icon:hover { color: #F44336; }

.source-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #E0E0E0;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.85rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-icon {
  font-size: 1rem;
}

.page-info {
  background: #F5F5F5;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #F0F0F0;
}

.pagination-btn {
  padding: 10px 25px;
  border: 2px solid #E0E0E0;
  border-radius: 25px;
  background: white;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #F5F5F5;
  color: #666;
}

.page-number:hover {
  background: #E0E0E0;
}

.page-number.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.1);
}

.page-ellipsis {
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: #999;
}

/* 模态框 */
.modal-overlay {
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-modal {
  background: white;
  border-radius: 35px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  animation: modalSlideUp 0.4s ease;
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 3px solid #F0F0F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 35px 35px 0 0;
}

.modal-title {
  font-family: 'Kalam', cursive;
  font-size: 2.5rem;
  color: white;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 2.5rem;
  color: white;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 30px;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.detail-label {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #5D4037;
  min-width: 100px;
}

.detail-value {
  font-family: 'Quicksand', sans-serif;
  color: #333;
}

.phonetic {
  font-size: 1.2rem;
  font-style: italic;
  color: #666;
}

.part-of-speech {
  background: #E3F2FD;
  color: #1976D2;
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: 600;
}

.difficulty-easy { color: #4CAF50; }
.difficulty-medium { color: #FF9800; }
.difficulty-hard { color: #F44336; }

.audio-btn-large {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.audio-btn-large:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.audio-btn-large:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.section-title {
  font-family: 'Comfortaa', cursive;
  font-size: 1.5rem;
  color: #5D4037;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #F0F0F0;
}

.definitions,
.examples {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.definition-item,
.example-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #F9F9F9;
  border-radius: 15px;
  border-left: 5px solid #667eea;
}

.definition-index {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #667eea;
  min-width: 25px;
}

.definition-text,
.example-text {
  font-family: 'Quicksand', sans-serif;
  color: #333;
  line-height: 1.5;
}

.word-relations {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.relation-group {
  flex: 1;
  min-width: 200px;
}

.relation-title {
  font-family: 'Comfortaa', cursive;
  font-size: 1.2rem;
  color: #5D4037;
  margin: 0 0 10px 0;
}

.relation-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.relation-tag {
  padding: 6px 15px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
}

.synonym-tag {
  background: #E8F5E9;
  color: #2E7D32;
  border: 2px solid #81C784;
}

.antonym-tag {
  background: #FFEBEE;
  color: #C62828;
  border: 2px solid #EF9A9A;
}

.learning-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #F5F5F5;
  border-radius: 15px;
}

.info-label {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #5D4037;
  min-width: 80px;
}

.mastery-display {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.mastery-bar-large {
  flex: 1;
  height: 12px;
  background: #E0E0E0;
  border-radius: 6px;
  overflow: hidden;
}

.mastery-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.mastery-percentage {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #4CAF50;
  min-width: 50px;
}

.modal-footer {
  padding: 25px 30px;
  border-top: 3px solid #F0F0F0;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  background: #F9F9F9;
  border-radius: 0 0 35px 35px;
}

.modal-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
}

/* 底部装饰 */
.bottom-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  overflow: hidden;
  z-index: -1;
}

.cloud {
  position: absolute;
  font-size: 3rem;
  opacity: 0.3;
  animation: cloudFloat 20s linear infinite;
}

.cloud-1 {
  bottom: 20px;
  left: 10%;
  animation-delay: 0s;
}

.cloud-2 {
  bottom: 40px;
  left: 40%;
  animation-delay: 5s;
}

.cloud-3 {
  bottom: 10px;
  left: 70%;
  animation-delay: 10s;
}

@keyframes cloudFloat {
  0% { transform: translateX(-100px); }
  100% { transform: translateX(calc(100vw + 100px)); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .stats-cards {
    width: 100%;
    justify-content: center;
  }
  
  .stat-card {
    min-width: 120px;
  }
  
  .page-title {
    font-size: 2.5rem;
  }
  
  .title-icon {
    font-size: 3rem;
  }
  
  .vocabulary-list {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .learning-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .vocabulary-view {
    padding: 10px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .stat-card {
    min-width: 100px;
    padding: 15px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .action-btn {
    padding: 12px 20px;
    font-size: 1rem;
  }
  
  .detail-modal {
    width: 95%;
  }
  
  .modal-title {
    font-size: 2rem;
  }
}
</style>