<template>
  <div class="global-search-view">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-input-container">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="🔍 搜索文档、词汇、笔记..."
          @input="handleSearchInput"
          @keyup.enter="performSearch"
        />
        <button class="search-clear" @click="clearSearch" v-if="searchQuery">
          ✕
        </button>
      </div>
      
      <div class="search-filters">
        <div class="filter-group">
          <label class="filter-label">搜索类型:</label>
          <div class="filter-options">
            <button
              v-for="type in searchTypes"
              :key="type.id"
              :class="['filter-option', { active: selectedType === type.id }]"
              @click="selectSearchType(type.id)"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">排序方式:</label>
          <select v-model="sortBy" class="sort-select" @change="updateSearch">
            <option value="relevance">相关度</option>
            <option value="date">日期</option>
            <option value="title">标题</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>搜索中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>搜索失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="performSearch">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !error && searchResults.total === 0 && searchQuery" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>未找到相关结果</h3>
        <p>尝试不同的关键词或调整搜索类型</p>
        <div class="suggestions">
          <p>建议：</p>
          <ul>
            <li>检查拼写是否正确</li>
            <li>使用更通用的关键词</li>
            <li>尝试不同的搜索类型</li>
          </ul>
        </div>
      </div>

      <!-- 搜索结果统计 -->
      <div v-if="searchResults.total > 0" class="results-stats">
        <p class="stats-text">
          找到 <span class="highlight">{{ searchResults.total }}</span> 个结果
          <span v-if="searchQuery">，关键词: <span class="query-highlight">{{ searchQuery }}</span></span>
          <span class="query-time"> ({{ searchResults.queryTime }}秒)</span>
        </p>
      </div>

      <!-- 搜索结果列表 -->
      <div v-if="searchResults.total > 0" class="results-container">
        <!-- 文档结果 -->
        <div v-if="searchResults.items.length > 0" class="results-section">
          <h3 class="section-title">📄 文档</h3>
          <div class="results-grid">
            <div
              v-for="item in searchResults.items"
              :key="item.id"
              class="result-card"
              @click="openResult(item)"
            >
              <div class="result-header">
                <h4 class="result-title">{{ item.title }}</h4>
                <span class="result-type">{{ item.type }}</span>
              </div>
              
              <div class="result-content">
                <p class="result-excerpt" v-html="highlightText(item.excerpt, searchQuery)"></p>
                
                <div class="result-meta">
                  <span class="meta-item">
                    <span class="meta-icon">👤</span>
                    {{ item.author || '未知作者' }}
                  </span>
                  <span class="meta-item">
                    <span class="meta-icon">📅</span>
                    {{ formatDate(item.updatedAt) }}
                  </span>
                  <span class="meta-item">
                    <span class="meta-icon">🔤</span>
                    {{ item.wordCount }} 词
                  </span>
                </div>
                
                <div class="result-tags">
                  <span
                    v-for="tag in item.tags.slice(0, 3)"
                    :key="tag"
                    class="tag"
                    :style="{ backgroundColor: getTagColor(tag) }"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              
              <div class="result-footer">
                <span class="relevance-score">
                  相关度: {{ (item.relevance * 100).toFixed(1) }}%
                </span>
                <button class="action-btn" @click.stop="saveSearchResult(item)">
                  💾
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="searchResults.totalPages > 1" class="pagination">
          <button
            class="page-btn"
            :disabled="searchResults.page === 1"
            @click="goToPage(searchResults.page - 1)"
          >
            ← 上一页
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="['page-number', { active: searchResults.page === page }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            
            <span v-if="showEllipsis" class="ellipsis">...</span>
          </div>
          
          <button
            class="page-btn"
            :disabled="searchResults.page === searchResults.totalPages"
            @click="goToPage(searchResults.page + 1)"
          >
            下一页 →
          </button>
        </div>
      </div>

      <!-- 搜索建议 -->
      <div v-if="searchSuggestions.length > 0 && !searchQuery" class="search-suggestions">
        <h3 class="suggestions-title">💡 搜索建议</h3>
        <div class="suggestions-grid">
          <button
            v-for="suggestion in searchSuggestions"
            :key="suggestion.id"
            class="suggestion-card"
            @click="useSuggestion(suggestion)"
          >
            <span class="suggestion-icon">{{ suggestion.icon }}</span>
            <span class="suggestion-keyword">{{ suggestion.keyword }}</span>
            <span class="suggestion-count">{{ suggestion.count }} 次</span>
          </button>
        </div>
      </div>

      <!-- 最近搜索 -->
      <div v-if="recentSearches.length > 0" class="recent-searches">
        <div class="recent-header">
          <h3 class="recent-title">🕐 最近搜索</h3>
          <button class="clear-recent" @click="clearRecentSearches">
            清除
          </button>
        </div>
        
        <div class="recent-list">
          <button
            v-for="search in recentSearches"
            :key="search.id"
            class="recent-item"
            @click="useRecentSearch(search)"
          >
            <span class="recent-keyword">{{ search.keyword }}</span>
            <span class="recent-time">{{ formatRelativeTime(search.timestamp) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 保存的搜索 -->
    <div v-if="savedSearches.length > 0" class="saved-searches">
      <div class="saved-header">
        <h3 class="saved-title">⭐ 保存的搜索</h3>
      </div>
      
      <div class="saved-list">
        <div
          v-for="saved in savedSearches"
          :key="saved.id"
          class="saved-item"
        >
          <div class="saved-content">
            <h4 class="saved-keyword">{{ saved.keyword }}</h4>
            <p class="saved-note" v-if="saved.note">{{ saved.note }}</p>
            <div class="saved-tags">
              <span
                v-for="tag in saved.tags"
                :key="tag"
                class="saved-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div class="saved-actions">
            <button class="saved-action-btn" @click="useSavedSearch(saved)">
              🔍
            </button>
            <button class="saved-action-btn" @click="deleteSavedSearch(saved.id)">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import searchService from '@/services/search.service'
import { formatDate, formatRelativeTime } from '@/utils/formatter'

const router = useRouter()

// 搜索状态
const searchQuery = ref('')
const selectedType = ref('all')
const sortBy = ref('relevance')
const loading = ref(false)
const error = ref(null)

// 搜索结果
const searchResults = reactive({
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  items: [],
  facets: {},
  queryTime: 0,
  type: 'all'
})

// 搜索建议
const searchSuggestions = ref([])
const recentSearches = ref([])
const savedSearches = ref([])

// 搜索类型选项
const searchTypes = [
  { id: 'all', label: '全部', icon: '🔍' },
  { id: 'documents', label: '文档', icon: '📄' },
  { id: 'vocabulary', label: '词汇', icon: '📖' },
  { id: 'notes', label: '笔记', icon: '📝' },
  { id: 'tags', label: '标签', icon: '🏷️' }
]

// 计算属性
const visiblePages = computed(() => {
  const current = searchResults.page
  const total = searchResults.totalPages
  const delta = 2
  const range = []
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }
  
  if (current - delta > 2) {
    range.unshift('...')
  }
  
  if (current + delta < total - 1) {
    range.push('...')
  }
  
  range.unshift(1)
  if (total > 1) {
    range.push(total)
  }
  
  return range
})

const showEllipsis = computed(() => {
  return searchResults.totalPages > 5
})

// 生命周期
onMounted(async () => {
  await loadRecentSearches()
  await loadSavedSearches()
  await loadSearchSuggestions()
})

// 方法
const handleSearchInput = () => {
  if (searchQuery.value.length >= 2) {
    debouncedSearch()
  }
}

const debouncedSearch = debounce(() => {
  performSearch()
}, 300)

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const results = await searchService.globalSearch(searchQuery.value, {
      type: selectedType.value,
      page: searchResults.page,
      pageSize: searchResults.pageSize,
      sortBy: sortBy.value,
      sortOrder: 'desc'
    })
    
    Object.assign(searchResults, results)
    
    // 保存搜索历史
    await saveSearchHistory()
    
  } catch (err) {
    console.error('搜索失败:', err)
    error.value = err.message || '搜索失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const updateSearch = () => {
  searchResults.page = 1
  performSearch()
}

const selectSearchType = (type) => {
  selectedType.value = type
  updateSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.total = 0
  searchResults.items = []
}

const openResult = (item) => {
  switch (item.type) {
    case 'document':
      router.push(`/documents/${item.id}`)
      break
    case 'vocabulary':
      router.push(`/vocabulary/${item.id}`)
      break
    case 'note':
      router.push(`/notes/${item.id}`)
      break
    case 'tag':
      router.push(`/tags/${item.id}`)
      break
    default:
      console.warn('未知的结果类型:', item.type)
  }
}

const highlightText = (text, query) => {
  if (!text || !query) return text
  
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark class="highlight-match">$1</mark>')
}

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getTagColor = (tag) => {
  const colors = [
    '#FF6B8B', '#118AB2', '#06D6A0', '#FFD166', '#9C27B0',
    '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#00BCD4'
  ]
  
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

const saveSearchResult = async (item) => {
  try {
    await searchService.saveSearchResult(item.id, {
      note: `保存于 ${formatDate(new Date().toISOString())}`,
      tags: ['重要']
    })
    
    await loadSavedSearches()
  } catch (err) {
    console.error('保存搜索结果失败:', err)
  }
}

const useSuggestion = (suggestion) => {
  searchQuery.value = suggestion.keyword
  performSearch()
}

const useRecentSearch = (search) => {
  searchQuery.value = search.keyword
  selectedType.value = search.type
  performSearch()
}

const useSavedSearch = (saved) => {
  searchQuery.value = saved.keyword
  selectedType.value = saved.type
  performSearch()
}

const deleteSavedSearch = async (id) => {
  try {
    await searchService.deleteSavedSearch(id)
    await loadSavedSearches()
  } catch (err) {
    console.error('删除保存的搜索失败:', err)
  }
}

const goToPage = (page) => {
  if (page < 1 || page > searchResults.totalPages || page === searchResults.page) {
    return
  }
  
  searchResults.page = page
  performSearch()
}

const loadRecentSearches = async () => {
  try {
    const searches = await searchService.getRecentSearches(10)
    recentSearches.value = searches
  } catch (err) {
    console.error('加载最近搜索失败:', err)
  }
}

const loadSavedSearches = async () => {
  try {
    const searches = await searchService.getSavedSearches()
    savedSearches.value = searches.items
  } catch (err) {
    console.error('加载保存的搜索失败:', err)
  }
}

const loadSearchSuggestions = async () => {
  try {
    const suggestions = await searchService.getSearchSuggestions('', { limit: 6 })
    searchSuggestions.value = suggestions
  } catch (err) {
    console.error('加载搜索建议失败:', err)
  }
}

const saveSearchHistory = async () => {
  try {
    await searchService.saveSearchHistory(searchQuery.value, selectedType.value)
  } catch (err) {
    console.error('保存搜索历史失败:', err)
  }
}

const clearRecentSearches = async () => {
  try {
    await searchService.clearSearchHistory()
    recentSearches.value = []
  } catch (err) {
    console.error('清除最近搜索失败:', err)
  }
}

// 防抖函数
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
</script>

<style scoped>
.global-search-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9f7f7 0%, #e8f4f8 100%);
  padding: 24px;
}

.search-header {
  background: white;
  border-radius: 32px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
}

.search-input-container {
  position: relative;
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 16px 24px;
  padding-right: 50px;
  border-radius: 25px;
  border: 3px solid #ffd591;
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  background: #fffaf0;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
}

.search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.search-clear:hover {
  background: #f0f0f0;
  color: #ff4757;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  font-weight: 600;
}

.filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-option {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-option:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.filter-option.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  border-color: #ff6b9d;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.sort-select {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: #ff6b9d;
}

.search-results {
  background: white;
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
  min-height: 400px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 12px 24px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.suggestions {
  margin-top: 24px;
  text-align: left;
  max-width: 400px;
}

.suggestions ul {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.suggestions li {
  padding: 8px 0;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
}

.results-stats {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.stats-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  margin: 0;
}

.highlight {
  color: #ff6b9d;
  font-weight: 600;
}

.query-highlight {
  background: #fff5e6;
  padding: 2px 8px;
  border-radius: 12px;
  color: #ff9800;
  font-weight: 600;
}

.query-time {
  color: #999;
  font-size: 14px;
}

.results-section {
  margin-bottom: 32px;
}

.section-title {
  font-family: 'Kalam', cursive;
  font-size: 24px;
  color: #ff6b9d;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #e8e8e8;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.result-card {
  background: #f9f9f9;
  border-radius: 24px;
  padding: 20px;
  border: 2px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ffd591;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.result-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.result-type {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: white;
  background: #ff6b9d;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.result-content {
  flex: 1;
}

.result-excerpt {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px;
}

.highlight-match {
  background: #fff5e6;
  color: #ff9800;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 4px;
}

.result-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
}

.meta-icon {
  font-size: 14px;
}

.result-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-family: 'Quicksand', sans-serif;
  font-size: 11px;
  color: white;
  font-weight: 600;
}

.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.relevance-score {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 12px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px dashed #e8e8e8;
}

.page-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #fff5e6;
  transform: translateY(-2px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
  align-items: center;
}

.page-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover {
  background: #fff5e6;
}

.page-number.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  border-color: #ff6b9d;
}

.ellipsis {
  color: #999;
  font-size: 14px;
}

.search-suggestions,
.recent-searches,
.saved-searches {
  margin-top: 32px;
  background: white;
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
}

.suggestions-title,
.recent-title,
.saved-title {
  font-family: 'Kalam', cursive;
  font-size: 24px;
  color: #ff6b9d;
  margin: 0 0 16px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.suggestion-card {
  background: #f9f9f9;
  border-radius: 20px;
  padding: 16px;
  border: 2px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.suggestion-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ffd591;
}

.suggestion-icon {
  font-size: 24px;
}

.suggestion-keyword {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  text-align: center;
}

.suggestion-count {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
}

.recent-header,
.saved-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.clear-recent {
  padding: 6px 12px;
  border-radius: 16px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-recent:hover {
  background: #fff5e6;
}

.recent-list,
.saved-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item,
.saved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 20px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.recent-item:hover,
.saved-item:hover {
  border-color: #ffd591;
  transform: translateX(4px);
}

.recent-keyword,
.saved-keyword {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.recent-time {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
}

.saved-content {
  flex: 1;
}

.saved-note {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.saved-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.saved-tag {
  padding: 2px 8px;
  border-radius: 10px;
  background: #e8e8e8;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 11px;
}

.saved-actions {
  display: flex;
  gap: 8px;
}

.saved-action-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.saved-action-btn:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .global-search-view {
    padding: 16px;
  }
  
  .search-header,
  .search-results {
    padding: 20px;
  }
  
  .search-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .suggestions-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 576px) {
  .search-input {
    font-size: 16px;
    padding: 14px 20px;
    padding-right: 45px;
  }
  
  .filter-options {
    flex-direction: column;
  }
  
  .filter-option {
    width: 100%;
  }
}
</style>