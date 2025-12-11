<template>
  <!-- 阅读器工具栏 -->
  <div class="reader-toolbar" :class="{ 'is-visible': isVisible, 'is-collapsed': isCollapsed }">
    <!-- 主工具栏 -->
    <div class="toolbar-main">
      <!-- 左侧功能区 -->
      <div class="toolbar-left">
        <!-- 返回书架按钮 -->
        <button class="toolbar-btn back-btn" @click="goBack" title="返回书架">
          <span class="btn-icon">📚</span>
          <span class="btn-text">书架</span>
        </button>

        <!-- 文档标题 -->
        <div class="document-title">
          <h2 class="title-text">{{ documentTitle }}</h2>
          <span v-if="currentPage" class="page-info">
            第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
        </div>
      </div>

      <!-- 中间功能区 -->
      <div class="toolbar-center">
        <!-- 阅读进度 -->
        <div class="reading-progress">
          <div class="progress-bar" @click="handleProgressClick">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ progressPercentage }}%</span>
        </div>

        <!-- 页面导航 -->
        <div class="page-navigation">
          <button class="nav-btn prev-btn" @click="goToPreviousPage" :disabled="!hasPreviousPage">
            <span class="nav-icon">◀</span>
          </button>
          
          <div class="page-input-container">
            <input
              type="number"
              v-model="pageInput"
              @keyup.enter="goToPage"
              @blur="goToPage"
              min="1"
              :max="totalPages"
              class="page-input"
              :title="`跳转到第 1-${totalPages} 页`"
            />
            <span class="page-slash">/</span>
            <span class="total-pages">{{ totalPages }}</span>
          </div>
          
          <button class="nav-btn next-btn" @click="goToNextPage" :disabled="!hasNextPage">
            <span class="nav-icon">▶</span>
          </button>
        </div>
      </div>

      <!-- 右侧功能区 -->
      <div class="toolbar-right">
        <!-- 搜索按钮 -->
        <button class="toolbar-btn search-btn" @click="toggleSearch" :class="{ 'is-active': showSearch }" title="搜索">
          <span class="btn-icon">🔍</span>
        </button>

        <!-- 目录按钮 -->
        <button class="toolbar-btn toc-btn" @click="toggleToc" :class="{ 'is-active': showToc }" title="目录">
          <span class="btn-icon">📑</span>
        </button>

        <!-- 高亮按钮 -->
        <button class="toolbar-btn highlight-btn" @click="toggleHighlightMode" :class="{ 'is-active': isHighlightMode }" title="高亮">
          <span class="btn-icon">🖍️</span>
        </button>

        <!-- 笔记按钮 -->
        <button class="toolbar-btn note-btn" @click="toggleNoteMode" :class="{ 'is-active': isNoteMode }" title="笔记">
          <span class="btn-icon">📝</span>
        </button>

        <!-- 书签按钮 -->
        <button class="toolbar-btn bookmark-btn" @click="toggleBookmark" :class="{ 'is-active': isBookmarked }" title="书签">
          <span class="btn-icon">{{ isBookmarked ? '🔖' : '📌' }}</span>
        </button>

        <!-- 设置按钮 -->
        <button class="toolbar-btn settings-btn" @click="toggleSettings" :class="{ 'is-active': showSettings }" title="设置">
          <span class="btn-icon">⚙️</span>
        </button>

        <!-- 折叠/展开按钮 -->
        <button class="toolbar-btn collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开工具栏' : '折叠工具栏'">
          <span class="collapse-icon">{{ isCollapsed ? '▲' : '▼' }}</span>
        </button>
      </div>
    </div>

    <!-- 搜索面板 -->
    <div v-if="showSearch" class="toolbar-panel search-panel">
      <div class="panel-header">
        <h3 class="panel-title">搜索文档</h3>
        <button class="panel-close" @click="closeSearch">✕</button>
      </div>
      
      <div class="search-input-container">
        <input
          type="text"
          v-model="searchQuery"
          @keyup.enter="performSearch"
          placeholder="输入关键词搜索..."
          class="search-input"
        />
        <button class="search-submit" @click="performSearch" :disabled="!searchQuery.trim()">
          <span class="submit-icon">🔍</span>
        </button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span class="results-count">找到 {{ searchResults.length }} 个结果</span>
          <button class="clear-results" @click="clearSearch">清除</button>
        </div>
        
        <div class="results-list">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="result-item"
            @click="goToSearchResult(result)"
          >
            <div class="result-page">第 {{ result.page }} 页</div>
            <div class="result-text" v-html="result.highlightedText"></div>
          </div>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0 && searchResults.length === 0" class="search-history">
        <div class="history-header">
          <span class="history-title">搜索历史</span>
          <button class="clear-history" @click="clearSearchHistory">清除</button>
        </div>
        
        <div class="history-list">
          <div
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="searchFromHistory(item)"
          >
            <span class="history-query">{{ item.query }}</span>
            <span class="history-date">{{ formatDate(item.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 目录面板 -->
    <div v-if="showToc" class="toolbar-panel toc-panel">
      <div class="panel-header">
        <h3 class="panel-title">目录</h3>
        <button class="panel-close" @click="closeToc">✕</button>
      </div>
      
      <div v-if="outline.length > 0" class="toc-list">
        <div
          v-for="(item, index) in outline"
          :key="index"
          class="toc-item"
          :class="{
            'is-active': item.page === currentPage,
            [`level-${item.level}`]: true
          }"
          @click="goToOutlinePage(item)"
        >
          <span class="toc-indicator" :style="{ marginLeft: (item.level - 1) * 20 + 'px' }"></span>
          <span class="toc-title">{{ item.title }}</span>
          <span class="toc-page">{{ item.page }}</span>
        </div>
      </div>
      
      <div v-else class="toc-empty">
        <div class="empty-icon">📄</div>
        <p class="empty-text">暂无目录信息</p>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="toolbar-panel settings-panel">
      <div class="panel-header">
        <h3 class="panel-title">阅读设置</h3>
        <button class="panel-close" @click="closeSettings">✕</button>
      </div>
      
      <div class="settings-sections">
        <!-- 字体设置 -->
        <div class="settings-section">
          <h4 class="section-title">字体设置</h4>
          
          <div class="setting-item">
            <label class="setting-label">字体大小</label>
            <div class="setting-control">
              <button class="control-btn minus" @click="decreaseFontSize" :disabled="settings.fontSize <= 12">
                <span class="control-icon">−</span>
              </button>
              
              <div class="font-size-display">{{ settings.fontSize }}px</div>
              
              <button class="control-btn plus" @click="increaseFontSize" :disabled="settings.fontSize >= 32">
                <span class="control-icon">+</span>
              </button>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">行高</label>
            <div class="setting-control">
              <input
                type="range"
                v-model="settings.lineHeight"
                min="1.2"
                max="2.5"
                step="0.1"
                class="slider"
                @input="updateLineHeight"
              />
              <span class="slider-value">{{ settings.lineHeight.toFixed(1) }}</span>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">字体</label>
            <div class="setting-control">
              <select v-model="settings.fontFamily" @change="updateFontFamily" class="font-select">
                <option value="system-ui">系统字体</option>
                <option value="'Comfortaa', cursive">Comfortaa</option>
                <option value="'Quicksand', sans-serif">Quicksand</option>
                <option value="'Varela Round', sans-serif">Varela Round</option>
                <option value="'Kalam', cursive">Kalam</option>
                <option value="'Caveat', cursive">Caveat</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 主题设置 -->
        <div class="settings-section">
          <h4 class="section-title">主题</h4>
          
          <div class="theme-options">
            <button
              v-for="theme in themes"
              :key="theme.id"
              class="theme-option"
              :class="{ 'is-active': settings.theme === theme.id }"
              @click="changeTheme(theme.id)"
              :style="{ backgroundColor: theme.bgColor, color: theme.textColor }"
            >
              <span class="theme-icon">{{ theme.icon }}</span>
              <span class="theme-name">{{ theme.name }}</span>
            </button>
          </div>
        </div>

        <!-- 其他设置 -->
        <div class="settings-section">
          <h4 class="section-title">其他设置</h4>
          
          <div class="setting-item toggle-item">
            <label class="toggle-label">
              <span class="toggle-text">显示高亮</span>
              <input
                type="checkbox"
                v-model="settings.showHighlights"
                @change="updateShowHighlights"
                class="toggle-checkbox"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item toggle-item">
            <label class="toggle-label">
              <span class="toggle-text">显示笔记</span>
              <input
                type="checkbox"
                v-model="settings.showNotes"
                @change="updateShowNotes"
                class="toggle-checkbox"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item toggle-item">
            <label class="toggle-label">
              <span class="toggle-text">自动滚动</span>
              <input
                type="checkbox"
                v-model="settings.autoScroll"
                @change="updateAutoScroll"
                class="toggle-checkbox"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div v-if="settings.autoScroll" class="setting-item">
            <label class="setting-label">滚动速度</label>
            <div class="setting-control">
              <input
                type="range"
                v-model="settings.scrollSpeed"
                min="0.5"
                max="3"
                step="0.1"
                class="slider"
                @input="updateScrollSpeed"
              />
              <span class="slider-value">{{ settings.scrollSpeed.toFixed(1) }}x</span>
            </div>
          </div>
        </div>

        <!-- 重置按钮 -->
        <div class="settings-actions">
          <button class="reset-btn" @click="resetSettings">重置设置</button>
        </div>
      </div>
    </div>

    <!-- 高亮颜色选择器 -->
    <div v-if="showColorPicker" class="color-picker">
      <div class="color-options">
        <button
          v-for="color in highlightColors"
          :key="color.id"
          class="color-option"
          :class="{ 'is-active': selectedColor === color.id }"
          :style="{ backgroundColor: color.value }"
          @click="selectColor(color.id)"
          :title="color.name"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import readerService from '@/services/reader.service'
import documentService from '@/services/document.service'
import { useReaderStore } from '@/stores/reader.store'
import { useDocumentStore } from '@/stores/document.store'
import { formatDate } from '@/utils/formatter'

// 路由和状态管理
const router = useRouter()
const readerStore = useReaderStore()
const documentStore = useDocumentStore()

// 组件状态
const isVisible = ref(true)
const isCollapsed = ref(false)
const isLoading = ref(false)
const error = ref(null)

// 面板状态
const showSearch = ref(false)
const showToc = ref(false)
const showSettings = ref(false)
const showColorPicker = ref(false)

// 搜索相关
const searchQuery = ref('')
const searchResults = ref([])
const searchHistory = ref([])

// 高亮相关
const isHighlightMode = ref(false)
const isNoteMode = ref(false)
const selectedColor = ref('yellow')

// 页面导航
const pageInput = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const documentTitle = ref('')

// 主题选项
const themes = [
  { id: 'light', name: '白天', icon: '☀️', bgColor: '#ffffff', textColor: '#333333' },
  { id: 'dark', name: '夜间', icon: '🌙', bgColor: '#1a1a1a', textColor: '#ffffff' },
  { id: 'sepia', name: '护眼', icon: '👁️', bgColor: '#f4ecd8', textColor: '#5b4636' },
  { id: 'blue', name: '蓝光', icon: '💙', bgColor: '#e8f4f8', textColor: '#0066cc' }
]

// 高亮颜色选项
const highlightColors = [
  { id: 'yellow', name: '黄色', value: '#ffeb3b' },
  { id: 'pink', name: '粉色', value: '#ff69b4' },
  { id: 'blue', name: '蓝色', value: '#4dabf7' },
  { id: 'green', name: '绿色', value: '#51cf66' },
  { id: 'orange', name: '橙色', value: '#ff922b' },
  { id: 'purple', name: '紫色', value: '#9775fa' }
]

// 计算属性
const settings = computed(() => readerStore.settings)

const progressPercentage = computed(() => {
  if (!currentPage.value || !totalPages.value) return 0
  return Math.round((currentPage.value / totalPages.value) * 100)
})

const hasPreviousPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

const isBookmarked = computed(() => {
  // 这里需要从书签服务或存储中检查当前页是否已添加书签
  // 暂时返回false，实际实现时需要集成书签服务
  return false
})

// 监听当前文档和页面变化
watch(() => readerStore.currentDocumentId, async (newDocumentId) => {
  if (newDocumentId) {
    await loadDocumentInfo(newDocumentId)
  }
})

watch(() => readerStore.currentPageNumber, (newPageNumber) => {
  currentPage.value = newPageNumber
  pageInput.value = newPageNumber.toString()
})

// 方法
/**
 * 加载文档信息
 * @param {string|number} documentId - 文档ID
 */
const loadDocumentInfo = async (documentId) => {
  try {
    isLoading.value = true
    
    // 获取文档详情
    const document = await documentService.getDocumentDetail(documentId)
    documentTitle.value = document.title
    totalPages.value = document.pageCount || 1
    
    // 获取文档目录
    await loadDocumentOutline(documentId)
    
    // 加载搜索历史
    loadSearchHistory()
    
  } catch (err) {
    console.error('加载文档信息失败:', err)
    error.value = err.message || '加载文档信息失败'
  } finally {
    isLoading.value = false
  }
}

/**
 * 加载文档目录
 * @param {string|number} documentId - 文档ID
 */
const loadDocumentOutline = async (documentId) => {
  try {
    const outline = await readerService.getDocumentOutline(documentId)
    // 这里需要将目录数据存储到readerStore或本地状态
    console.log('加载目录:', outline)
  } catch (err) {
    console.error('加载目录失败:', err)
  }
}

/**
 * 返回书架
 */
const goBack = () => {
  router.push('/dashboard')
}

/**
 * 跳转到上一页
 */
const goToPreviousPage = () => {
  if (hasPreviousPage.value) {
    const newPage = currentPage.value - 1
    goToPage(newPage)
  }
}

/**
 * 跳转到下一页
 */
const goToNextPage = () => {
  if (hasNextPage.value) {
    const newPage = currentPage.value + 1
    goToPage(newPage)
  }
}

/**
 * 跳转到指定页面
 * @param {number|string} page - 页码
 */
const goToPage = (page) => {
  let targetPage = page
  
  if (typeof page === 'string') {
    targetPage = parseInt(page)
  }
  
  if (!targetPage || targetPage < 1) {
    targetPage = 1
  }
  
  if (targetPage > totalPages.value) {
    targetPage = totalPages.value
  }
  
  // 更新阅读器状态
  readerStore.setCurrentPageNumber(targetPage)
  
  // 调用阅读器服务获取页面内容
  if (readerStore.currentDocumentId) {
    readerService.getPageContent(readerStore.currentDocumentId, targetPage)
  }
}

/**
 * 处理进度条点击
 * @param {Event} event - 点击事件
 */
const handleProgressClick = (event) => {
  const progressBar = event.currentTarget
  const rect = progressBar.getBoundingClientRect()
  const clickPosition = event.clientX - rect.left
  const percentage = clickPosition / rect.width
  const targetPage = Math.round(percentage * totalPages.value)
  
  goToPage(targetPage)
}

/**
 * 切换搜索面板
 */
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    // 关闭其他面板
    showToc.value = false
    showSettings.value = false
  }
}

/**
 * 关闭搜索面板
 */
const closeSearch = () => {
  showSearch.value = false
}

/**
 * 执行搜索
 */
const performSearch = async () => {
  if (!searchQuery.value.trim() || !readerStore.currentDocumentId) return
  
  try {
    isLoading.value = true
    
    const results = await readerService.searchDocumentContent(
      readerStore.currentDocumentId,
      searchQuery.value
    )
    
    searchResults.value = results.matches || []
    
    // 添加到搜索历史
    addToSearchHistory(searchQuery.value)
    
  } catch (err) {
    console.error('搜索失败:', err)
    error.value = err.message || '搜索失败'
  } finally {
    isLoading.value = false
  }
}

/**
 * 清除搜索结果
 */
const clearSearch = () => {
  searchResults.value = []
  searchQuery.value = ''
}

/**
 * 跳转到搜索结果
 * @param {Object} result - 搜索结果
 */
const goToSearchResult = (result) => {
  if (result.page) {
    goToPage(result.page)
    closeSearch()
  }
}

/**
 * 添加到搜索历史
 * @param {string} query - 搜索关键词
 */
const addToSearchHistory = (query) => {
  const historyItem = {
    query,
    date: new Date().toISOString()
  }
  
  // 移除重复项
  searchHistory.value = searchHistory.value.filter(item => item.query !== query)
  
  // 添加到开头
  searchHistory.value.unshift(historyItem)
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  
  // 保存到本地存储
  saveSearchHistory()
}

/**
 * 从历史记录搜索
 * @param {Object} historyItem - 历史记录项
 */
const searchFromHistory = (historyItem) => {
  searchQuery.value = historyItem.query
  performSearch()
}

/**
 * 清除搜索历史
 */
const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('reader_search_history')
}

/**
 * 加载搜索历史
 */
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem('reader_search_history')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('加载搜索历史失败:', err)
  }
}

/**
 * 保存搜索历史
 */
const saveSearchHistory = () => {
  try {
    localStorage.setItem('reader_search_history', JSON.stringify(searchHistory.value))
  } catch (err) {
    console.error('保存搜索历史失败:', err)
  }
}

/**
 * 切换目录面板
 */
const toggleToc = () => {
  showToc.value = !showToc.value
  if (showToc.value) {
    // 关闭其他面板
    showSearch.value = false
    showSettings.value = false
  }
}

/**
 * 关闭目录面板
 */
const closeToc = () => {
  showToc.value = false
}

/**
 * 跳转到目录项页面
 * @param {Object} item - 目录项
 */
const goToOutlinePage = (item) => {
  if (item.page) {
    goToPage(item.page)
    closeToc()
  }
}

/**
 * 切换设置面板
 */
const toggleSettings = () => {
  showSettings.value = !showSettings.value
  if (showSettings.value) {
    // 关闭其他面板
    showSearch.value = false
    showToc.value = false
  }
}

/**
 * 关闭设置面板
 */
const closeSettings = () => {
  showSettings.value = false
}

/**
 * 增加字体大小
 */
const increaseFontSize = () => {
  if (settings.value.fontSize < 32) {
    readerStore.updateSettings({ fontSize: settings.value.fontSize + 1 })
  }
}

/**
 * 减小字体大小
 */
const decreaseFontSize = () => {
  if (settings.value.fontSize > 12) {
    readerStore.updateSettings({ fontSize: settings.value.fontSize - 1 })
  }
}

/**
 * 更新行高
 */
const updateLineHeight = () => {
  readerStore.updateSettings({ lineHeight: parseFloat(settings.value.lineHeight) })
}

/**
 * 更新字体
 */
const updateFontFamily = () => {
  readerStore.updateSettings({ fontFamily: settings.value.fontFamily })
}

/**
 * 切换主题
 * @param {string} themeId - 主题ID
 */
const changeTheme = (themeId) => {
  readerStore.updateSettings({ theme: themeId })
}

/**
 * 更新显示高亮设置
 */
const updateShowHighlights = () => {
  readerStore.updateSettings({ showHighlights: settings.value.showHighlights })
}

/**
 * 更新显示笔记设置
 */
const updateShowNotes = () => {
  readerStore.updateSettings({ showNotes: settings.value.showNotes })
}

/**
 * 更新自动滚动设置
 */
const updateAutoScroll = () => {
  readerStore.updateSettings({ autoScroll: settings.value.autoScroll })
}

/**
 * 更新滚动速度
 */
const updateScrollSpeed = () => {
  readerStore.updateSettings({ scrollSpeed: parseFloat(settings.value.scrollSpeed) })
}

/**
 * 重置设置
 */
const resetSettings = () => {
  const defaultSettings = {
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    fontFamily: 'system-ui',
    showHighlights: true,
    showNotes: true,
    autoScroll: false,
    scrollSpeed: 1
  }
  
  readerStore.updateSettings(defaultSettings)
}

/**
 * 切换高亮模式
 */
const toggleHighlightMode = () => {
  isHighlightMode.value = !isHighlightMode.value
  if (isHighlightMode.value) {
    // 关闭笔记模式
    isNoteMode.value = false
    // 显示颜色选择器
    showColorPicker.value = true
  } else {
    // 隐藏颜色选择器
    showColorPicker.value = false
  }
}

/**
 * 切换笔记模式
 */
const toggleNoteMode = () => {
  isNoteMode.value = !isNoteMode.value
  if (isNoteMode.value) {
    // 关闭高亮模式
    isHighlightMode.value = false
    // 隐藏颜色选择器
    showColorPicker.value = false
  }
}

/**
 * 选择高亮颜色
 * @param {string} colorId - 颜色ID
 */
const selectColor = (colorId) => {
  selectedColor.value = colorId
  // 这里可以触发高亮操作
}

/**
 * 切换书签
 */
const toggleBookmark = async () => {
  try {
    if (isBookmarked.value) {
      // 删除书签
      // await readerService.deleteBookmark(readerStore.currentDocumentId, currentPage.value)
    } else {
      // 添加书签
      // await readerService.addBookmark(readerStore.currentDocumentId, currentPage.value)
    }
  } catch (err) {
    console.error('书签操作失败:', err)
    error.value = err.message || '书签操作失败'
  }
}

/**
 * 切换工具栏折叠状态
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 键盘事件处理
const handleKeydown = (event) => {
  // 左右箭头翻页
  if (event.key === 'ArrowLeft') {
    goToPreviousPage()
  } else if (event.key === 'ArrowRight') {
    goToNextPage()
  }
  
  // ESC键关闭所有面板
  if (event.key === 'Escape') {
    showSearch.value = false
    showToc.value = false
    showSettings.value = false
    showColorPicker.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // 初始化页面输入
  pageInput.value = currentPage.value.toString()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法给父组件
defineExpose({
  toggleSearch,
  toggleToc,
  toggleSettings,
  toggleCollapse,
  goToPage,
  goToPreviousPage,
  goToNextPage
})
</script>

<style scoped>
.reader-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-bottom: 3px solid #ff69b4;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: translateY(0);
  border-radius: 0 0 32px 32px;
}

.reader-toolbar.is-collapsed {
  transform: translateY(-100%);
}

.reader-toolbar.is-visible {
  transform: translateY(0);
}

/* 主工具栏 */
.toolbar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  height: 80px;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 返回按钮 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff69b4 0%, #ff8ac6 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 24px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 105, 180, 0.4);
}

.back-btn:active {
  transform: translateY(0);
}

/* 文档标题 */
.document-title {
  display: flex;
  flex-direction: column;
  margin-left: 16px;
}

.title-text {
  font-family: 'Kalam', cursive;
  font-size: 24px;
  color: #333;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.page-info {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

/* 阅读进度 */
.reading-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 300px;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 2px solid #dee2e6;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4dabf7 0%, #339af0 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: #339af0;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(51, 154, 240, 0.4);
  cursor: pointer;
}

.progress-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  font-weight: bold;
  color: #339af0;
  min-width: 50px;
}

/* 页面导航 */
.page-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 24px;
  border: 2px solid #e9ecef;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #495057;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-btn:hover:not(:disabled) {
  background: #4dabf7;
  color: white;
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 60px;
  height: 40px;
  border: 2px solid #dee2e6;
  border-radius: 20px;
  padding: 0 12px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  text-align: center;
  background: white;
  transition: all 0.3s ease;
}

.page-input:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}

.page-slash {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #868e96;
}

.total-pages {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #495057;
  font-weight: bold;
}

/* 工具栏按钮 */
.toolbar-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #495057;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toolbar-btn:hover {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.toolbar-btn:active {
  transform: translateY(-1px);
}

.toolbar-btn.is-active {
  background: linear-gradient(135deg, #ffd166 0%, #ffc043 100%);
  color: #333;
  box-shadow: 0 4px 12px rgba(255, 193, 67, 0.3);
}

.collapse-btn {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.collapse-btn:hover {
  background: linear-gradient(135deg, #dee2e6 0%, #ced4da 100%);
}

/* 面板样式 */
.toolbar-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 0 0 32px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 3px solid #ff69b4;
  border-top: none;
  animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  max-height: 400px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 2px dashed #e9ecef;
}

.panel-title {
  font-family: 'Caveat', cursive;
  font-size: 28px;
  color: #ff69b4;
  margin: 0;
}

.panel-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f8f9fa;
  color: #868e96;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.panel-close:hover {
  background: #ff69b4;
  color: white;
  transform: rotate(90deg);
}

/* 搜索面板 */
.search-panel {
  padding: 24px;
}

.search-input-container {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  height: 48px;
  border: 3px solid #e9ecef;
  border-radius: 24px;
  padding: 0 20px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}

.search-submit {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-submit:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

.search-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 搜索结果 */
.search-results {
  margin-top: 16px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.results-count {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #868e96;
}

.clear-results {
  background: none;
  border: none;
  color: #ff6b6b;
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.clear-results:hover {
  background: #ffe3e3;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 20px;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  border-color: #4dabf7;
}

.result-page {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #4dabf7;
  font-weight: bold;
  margin-bottom: 8px;
}

.result-text {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
}

.result-text :deep(.highlight) {
  background: #fff3bf;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

/* 搜索历史 */
.search-history {
  margin-top: 24px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.history-title {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #495057;
  font-weight: bold;
}

.clear-history {
  background: none;
  border: none;
  color: #868e96;
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.clear-history:hover {
  background: #f8f9fa;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: #e9ecef;
}

.history-query {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #495057;
}

.history-date {
  font-family: 'Comfortaa', cursive;
  font-size: 12px;
  color: #868e96;
}

/* 目录面板 */
.toc-panel {
  padding: 24px;
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toc-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.toc-item:hover {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.toc-item.is-active {
  background: linear-gradient(135deg, #e8f4f8 0%, #d0e7f4 100%);
  border-color: #4dabf7;
}

.toc-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4dabf7;
  margin-right: 12px;
}

.toc-title {
  flex: 1;
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #495057;
}

.toc-item.level-1 .toc-title {
  font-weight: bold;
}

.toc-item.level-2 .toc-title {
  padding-left: 8px;
}

.toc-item.level-3 .toc-title {
  padding-left: 16px;
  font-size: 13px;
  color: #868e96;
}

.toc-page {
  font-family: 'Comfortaa', cursive;
  font-size: 12px;
  color: #868e96;
  background: white;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.toc-empty {
  text-align: center;
  padding: 40px 0;
}

.toc-empty .empty-icon {
  font-size: 48px;
  color: #e9ecef;
  margin-bottom: 16px;
}

.toc-empty .empty-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #868e96;
  margin: 0;
}

/* 设置面板 */
.settings-panel {
  padding: 24px;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  border-bottom: 2px dashed #e9ecef;
  padding-bottom: 24px;
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #ff69b4;
  margin: 0 0 20px 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.setting-label {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #495057;
  font-weight: bold;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #dee2e6;
  background: white;
  color: #495057;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) {
  border-color: #4dabf7;
  background: #4dabf7;
  color: white;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-size-display {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #495057;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

/* 滑块 */
.slider {
  width: 150px;
  height: 8px;
  border-radius: 4px;
  background: #e9ecef;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4dabf7;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4dabf7;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.slider-value {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #868e96;
  min-width: 40px;
  text-align: center;
}

/* 字体选择器 */
.font-select {
  width: 180px;
  height: 40px;
  border: 2px solid #dee2e6;
  border-radius: 20px;
  padding: 0 16px;
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.font-select:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 3px rgba(77, 171, 247, 0.2);
}

/* 主题选项 */
.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.theme-option {
  flex: 1;
  min-width: 120px;
  height: 60px;
  border: 3px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.theme-option:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-option.is-active {
  border-color: #ff69b4;
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
}

.theme-icon {
  font-size: 20px;
}

.theme-name {
  font-family: 'Comfortaa', cursive;
  font-size: 12px;
  font-weight: bold;
}

/* 开关按钮 */
.toggle-item {
  margin-bottom: 16px;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  width: 100%;
}

.toggle-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #495057;
}

.toggle-checkbox {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 26px;
  background: #e9ecef;
  border-radius: 13px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-checkbox:checked + .toggle-slider {
  background: #4dabf7;
}

.toggle-checkbox:checked + .toggle-slider::before {
  transform: translateX(24px);
}

/* 设置操作按钮 */
.settings-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.reset-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
}

.reset-btn:active {
  transform: translateY(0);
}

/* 颜色选择器 */
.color-picker {
  position: absolute;
  top: 100%;
  right: 120px;
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 3px solid #ff69b4;
  animation: slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1000;
}

.color-options {
  display: flex;
  gap: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.color-option:hover {
  transform: scale(1.2);
}

.color-option.is-active {
  border-color: #333;
  box-shadow: 0 0 0 2px white, 0 0 0 5px rgba(255, 105, 180, 0.3);
}

/* 动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .toolbar-main {
    padding: 12px 16px;
    height: 70px;
  }
  
  .title-text {
    font-size: 20px;
    max-width: 200px;
  }
  
  .reading-progress {
    min-width: 200px;
  }
  
  .toolbar-btn {
    width: 42px;
    height: 42px;
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .toolbar-center {
    display: none;
  }
  
  .toolbar-left,
  .toolbar-right {
    gap: 8px;
  }
  
  .document-title {
    margin-left: 8px;
  }
  
  .title-text {
    font-size: 18px;
    max-width: 150px;
  }
  
  .back-btn .btn-text {
    display: none;
  }
  
  .back-btn {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .toolbar-main {
    padding: 8px 12px;
    height: 60px;
  }
  
  .title-text {
    font-size: 16px;
    max-width: 120px;
  }
  
  .toolbar-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .panel-header {
    padding: 16px;
  }
  
  .panel-title {
    font-size: 24px;
  }
}
</style>