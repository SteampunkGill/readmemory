<template>
  <div class="reader-view">
    <!-- 阅读器布局容器 -->
    <div class="reader-container">
      <!-- 顶部工具栏 -->
      <div class="reader-toolbar">
        <!-- 返回按钮 -->
        <button 
          class="toolbar-btn back-btn" 
          @click="goBack"
          :style="toolbarButtonStyle"
        >
          <span class="btn-icon">←</span>
          <span class="btn-text">返回书架</span>
        </button>

        <!-- 文档标题 -->
        <div class="document-title">
          <h1>{{ documentTitle }}</h1>
          <div class="document-info">
            <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
            <span class="progress-info">已读 {{ readingProgress }}%</span>
          </div>
        </div>

        <!-- 工具栏按钮组 -->
        <div class="toolbar-actions">
          <!-- 目录按钮 -->
          <button 
            class="toolbar-btn" 
            @click="toggleOutline"
            :class="{ active: showOutline }"
            :style="toolbarButtonStyle"
          >
            <span class="btn-icon">📖</span>
            <span class="btn-text">目录</span>
          </button>

          <!-- 高亮/笔记侧边栏按钮 -->
          <button 
            class="toolbar-btn" 
            @click="toggleHighlights"
            :class="{ active: showHighlights }"
            :style="toolbarButtonStyle"
          >
            <span class="btn-icon">✏️</span>
            <span class="btn-text">笔记</span>
            <span v-if="highlightsCount > 0" class="badge">{{ highlightsCount }}</span>
          </button>

          <!-- 搜索按钮 -->
          <button 
            class="toolbar-btn" 
            @click="toggleSearch"
            :class="{ active: showSearch }"
            :style="toolbarButtonStyle"
          >
            <span class="btn-icon">🔍</span>
            <span class="btn-text">搜索</span>
          </button>

          <!-- 设置按钮 -->
          <button 
            class="toolbar-btn" 
            @click="toggleSettings"
            :class="{ active: showSettings }"
            :style="toolbarButtonStyle"
          >
            <span class="btn-icon">⚙️</span>
            <span class="btn-text">设置</span>
          </button>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="reader-content-area">
        <!-- 左侧目录侧边栏 -->
        <transition name="slide-left">
          <div v-if="showOutline" class="sidebar outline-sidebar">
            <div class="sidebar-header">
              <h3>文档目录</h3>
              <button class="close-btn" @click="showOutline = false">×</button>
            </div>
            <div class="sidebar-content">
              <div v-if="outlineLoading" class="loading">加载中...</div>
              <div v-else-if="outline.length === 0" class="empty-state">
                <p>暂无目录</p>
              </div>
              <ul v-else class="outline-list">
                <li 
                  v-for="item in outline" 
                  :key="item.id || item.title"
                  :class="`outline-level-${item.level}`"
                  @click="jumpToPage(item.page)"
                >
                  {{ item.title }}
                </li>
              </ul>
            </div>
          </div>
        </transition>

        <!-- 阅读内容区域 -->
        <div class="content-wrapper" :class="{ 'with-sidebar': showOutline || showHighlights }">
          <!-- 翻页按钮 -->
          <button 
            v-if="currentPage > 1"
            class="page-nav-btn prev-btn"
            @click="goToPage(currentPage - 1)"
            :style="navButtonStyle"
          >
            ← 上一页
          </button>

          <!-- 文档内容 -->
          <div 
            class="document-content"
            ref="contentRef"
            @click="handleContentClick"
            @mouseup="handleTextSelection"
            v-html="currentPageContent"
          ></div>

          <!-- 翻页按钮 -->
          <button 
            v-if="currentPage < totalPages"
            class="page-nav-btn next-btn"
            @click="goToPage(currentPage + 1)"
            :style="navButtonStyle"
          >
            下一页 →
          </button>

          <!-- 页面底部信息 -->
          <div class="page-footer">
            <div class="reading-stats">
              <span class="stat-item">
                <span class="stat-icon">⏱️</span>
                <span class="stat-text">阅读时间: {{ formatReadingTime }}</span>
              </span>
              <span class="stat-item">
                <span class="stat-icon">📖</span>
                <span class="stat-text">字数: {{ wordCount }}</span>
              </span>
            </div>
            <div class="page-controls">
              <input 
                type="number" 
                v-model.number="jumpPageNumber"
                min="1"
                :max="totalPages"
                class="page-input"
                @keyup.enter="jumpToPage(jumpPageNumber)"
              />
              <button 
                class="jump-btn"
                @click="jumpToPage(jumpPageNumber)"
                :style="toolbarButtonStyle"
              >
                跳转
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧高亮/笔记侧边栏 -->
        <transition name="slide-right">
          <div v-if="showHighlights" class="sidebar highlights-sidebar">
            <div class="sidebar-header">
              <h3>笔记与高亮</h3>
              <button class="close-btn" @click="showHighlights = false">×</button>
            </div>
            <div class="sidebar-content">
              <!-- 高亮颜色选择器 -->
              <div class="color-picker">
                <span class="color-label">高亮颜色:</span>
                <div class="color-options">
                  <button 
                    v-for="color in highlightColors"
                    :key="color.name"
                    class="color-option"
                    :class="{ active: selectedColor === color.name }"
                    :style="{ backgroundColor: color.value }"
                    @click="selectedColor = color.name"
                  ></button>
                </div>
              </div>

              <!-- 高亮列表 -->
              <div class="highlights-section">
                <h4>高亮列表</h4>
                <div v-if="highlightsLoading" class="loading">加载中...</div>
                <div v-else-if="filteredHighlights.length === 0" class="empty-state">
                  <p>暂无高亮</p>
                </div>
                <div v-else class="highlights-list">
                  <div 
                    v-for="highlight in filteredHighlights"
                    :key="highlight.id"
                    class="highlight-item"
                    :style="{ borderLeftColor: getColorValue(highlight.color) }"
                    @click="jumpToHighlight(highlight)"
                  >
                    <div class="highlight-text">{{ highlight.text }}</div>
                    <div class="highlight-meta">
                      <span class="page">第 {{ highlight.page }} 页</span>
                      <span class="actions">
                        <button @click.stop="editHighlight(highlight)" class="action-btn">编辑</button>
                        <button @click.stop="deleteHighlight(highlight.id)" class="action-btn delete">删除</button>
                      </span>
                    </div>
                    <div v-if="highlight.note" class="highlight-note">{{ highlight.note }}</div>
                  </div>
                </div>
              </div>

              <!-- 笔记列表 -->
              <div class="notes-section">
                <h4>笔记列表</h4>
                <div v-if="notesLoading" class="loading">加载中...</div>
                <div v-else-if="filteredNotes.length === 0" class="empty-state">
                  <p>暂无笔记</p>
                </div>
                <div v-else class="notes-list">
                  <div 
                    v-for="note in filteredNotes"
                    :key="note.id"
                    class="note-item"
                    @click="jumpToNote(note)"
                  >
                    <div class="note-content">{{ note.content }}</div>
                    <div class="note-meta">
                      <span class="page">第 {{ note.page }} 页</span>
                      <span class="actions">
                        <button @click.stop="editNote(note)" class="action-btn">编辑</button>
                        <button @click.stop="deleteNote(note.id)" class="action-btn delete">删除</button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 底部进度条 -->
      <div class="reader-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ 
              width: `${readingProgress}%`,
              backgroundColor: '#5d6afb'
            }"
          ></div>
        </div>
        <div class="progress-labels">
          <span>开始</span>
          <span>{{ readingProgress }}%</span>
          <span>完成</span>
        </div>
      </div>
    </div>

    <!-- 单词查询弹窗 -->
    <div v-if="showWordPopup" class="word-popup-overlay" @click="closeWordPopup">
      <div 
        class="word-popup" 
        :style="popupStyle"
        @click.stop
      >
        <div class="popup-header">
          <h3>{{ selectedWord }}</h3>
          <button class="close-btn" @click="closeWordPopup">×</button>
        </div>
        <div class="popup-content">
          <div v-if="wordLoading" class="loading">查询中...</div>
          <div v-else-if="wordError" class="error">{{ wordError }}</div>
          <div v-else-if="wordDetail" class="word-detail">
            <!-- 音标和发音 -->
            <div class="phonetic-section">
              <span class="phonetic">{{ wordDetail.phonetic || '暂无音标' }}</span>
              <button 
                v-if="wordDetail.audioUrl"
                class="pronounce-btn"
                @click="playPronunciation"
                :style="toolbarButtonStyle"
              >
                🔊 发音
              </button>
            </div>

            <!-- 词性和释义 -->
            <div class="definition-section">
              <h4>释义</h4>
              <div v-if="wordDetail.definitions && wordDetail.definitions.length > 0">
                <div 
                  v-for="(def, index) in wordDetail.definitions"
                  :key="index"
                  class="definition-item"
                >
                  <span class="part-of-speech">{{ def.partOfSpeech || wordDetail.partOfSpeech }}</span>
                  <span class="definition">{{ def.definition || def }}</span>
                </div>
              </div>
              <div v-else class="empty">暂无释义</div>
            </div>

            <!-- 例句 -->
            <div v-if="wordDetail.examples && wordDetail.examples.length > 0" class="examples-section">
              <h4>例句</h4>
              <ul class="examples-list">
                <li 
                  v-for="(example, index) in wordDetail.examples.slice(0, 3)"
                  :key="index"
                  class="example-item"
                >
                  {{ example }}
                </li>
              </ul>
            </div>

            <!-- 同义词 -->
            <div v-if="wordDetail.synonyms && wordDetail.synonyms.length > 0" class="synonyms-section">
              <h4>同义词</h4>
              <div class="synonyms-list">
                <span 
                  v-for="synonym in wordDetail.synonyms.slice(0, 5)"
                  :key="synonym"
                  class="synonym-tag"
                  @click="lookupWord(synonym)"
                >
                  {{ synonym }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="popup-actions">
          <button 
            class="action-btn primary"
            @click="addToVocabulary"
            :disabled="!wordDetail || isInVocabulary"
            :style="primaryButtonStyle"
          >
            {{ isInVocabulary ? '已在生词本' : '添加到生词本' }}
          </button>
          <button 
            class="action-btn secondary"
            @click="closeWordPopup"
            :style="secondaryButtonStyle"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <div v-if="showSearch" class="search-overlay" @click="showSearch = false">
      <div class="search-modal" @click.stop :style="modalStyle">
        <div class="search-header">
          <h3>搜索文档内容</h3>
          <button class="close-btn" @click="showSearch = false">×</button>
        </div>
        <div class="search-input-group">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="输入关键词搜索..."
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button 
            class="search-btn"
            @click="performSearch"
            :style="primaryButtonStyle"
          >
            搜索
          </button>
        </div>
        <div class="search-results">
          <div v-if="searchLoading" class="loading">搜索中...</div>
          <div v-else-if="searchError" class="error">{{ searchError }}</div>
          <div v-else-if="searchResults && searchResults.matches && searchResults.matches.length > 0">
            <h4>搜索结果 ({{ searchResults.total }} 个匹配)</h4>
            <div class="results-list">
              <div 
                v-for="(match, index) in searchResults.matches"
                :key="index"
                class="result-item"
                @click="jumpToSearchResult(match)"
              >
                <div class="result-page">第 {{ match.page }} 页</div>
                <div class="result-text" v-html="highlightSearchText(match.text)"></div>
                <div class="result-context" v-if="match.context">{{ match.context }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="searchQuery" class="empty-state">
            <p>未找到匹配的内容</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-overlay" @click="showSettings = false">
      <div class="settings-modal" @click.stop :style="modalStyle">
        <div class="settings-header">
          <h3>阅读设置</h3>
          <button class="close-btn" @click="showSettings = false">×</button>
        </div>
        <div class="settings-content">
          <!-- 字体设置 -->
          <div class="setting-group">
            <h4>字体设置</h4>
            <div class="setting-options">
              <div class="setting-option">
                <label>字体大小</label>
                <div class="font-size-controls">
                  <button 
                    class="size-btn"
                    @click="decreaseFontSize"
                    :style="toolbarButtonStyle"
                  >
                    A-
                  </button>
                  <span class="current-size">{{ fontSize }}px</span>
                  <button 
                    class="size-btn"
                    @click="increaseFontSize"
                    :style="toolbarButtonStyle"
                  >
                    A+
                  </button>
                </div>
              </div>
              <div class="setting-option">
                <label>字体类型</label>
                <select v-model="fontFamily" class="font-select">
                  <option value="'Comfortaa', sans-serif">Comfortaa (默认)</option>
                  <option value="'Quicksand', sans-serif">Quicksand</option>
                  <option value="'Caveat', cursive">Caveat (手写体)</option>
                  <option value="'Arial', sans-serif">Arial</option>
                </select>
              </div>
              <div class="setting-option">
                <label>行高</label>
                <input 
                  type="range" 
                  v-model.number="lineHeight"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  class="line-height-slider"
                />
                <span class="slider-value">{{ lineHeight }}</span>
              </div>
            </div>
          </div>

          <!-- 主题设置 -->
          <div class="setting-group">
            <h4>主题设置</h4>
            <div class="theme-options">
              <button 
                v-for="theme in themes"
                :key="theme.name"
                class="theme-option"
                :class="{ active: currentTheme === theme.name }"
                @click="changeTheme(theme.name)"
                :style="{
                  backgroundColor: theme.background,
                  color: theme.text
                }"
              >
                {{ theme.label }}
              </button>
            </div>
          </div>

          <!-- 阅读模式 -->
          <div class="setting-group">
            <h4>阅读模式</h4>
            <div class="mode-options">
              <button 
                class="mode-option"
                :class="{ active: readingMode === 'scroll' }"
                @click="readingMode = 'scroll'"
                :style="toolbarButtonStyle"
              >
                📜 滚动模式
              </button>
              <button 
                class="mode-option"
                :class="{ active: readingMode === 'page' }"
                @click="readingMode = 'page'"
                :style="toolbarButtonStyle"
              >
                📄 翻页模式
              </button>
            </div>
          </div>
        </div>
        <div class="settings-actions">
          <button 
            class="action-btn primary"
            @click="applySettings"
            :style="primaryButtonStyle"
          >
            应用设置
          </button>
          <button 
            class="action-btn secondary"
            @click="resetSettings"
            :style="secondaryButtonStyle"
          >
            恢复默认
          </button>
        </div>
      </div>
    </div>

    <!-- 高亮/笔记编辑弹窗 -->
    <div v-if="showEditPopup" class="edit-overlay" @click="closeEditPopup">
      <div class="edit-modal" @click.stop :style="modalStyle">
        <div class="edit-header">
          <h3>{{ editMode === 'highlight' ? '编辑高亮' : '编辑笔记' }}</h3>
          <button class="close-btn" @click="closeEditPopup">×</button>
        </div>
        <div class="edit-content">
          <!-- 高亮文本预览 -->
          <div v-if="editMode === 'highlight'" class="highlight-preview">
            <div class="preview-label">高亮文本:</div>
            <div class="preview-text">{{ editingItem.text }}</div>
          </div>

          <!-- 颜色选择器 -->
          <div v-if="editMode === 'highlight'" class="color-selector">
            <div class="selector-label">选择颜色:</div>
            <div class="color-options">
              <button 
                v-for="color in highlightColors"
                :key="color.name"
                class="color-option"
                :class="{ active: editingItem.color === color.name }"
                :style="{ backgroundColor: color.value }"
                @click="editingItem.color = color.name"
              ></button>
            </div>
          </div>

          <!-- 笔记输入框 -->
          <div class="note-input">
            <label for="note-text">{{ editMode === 'highlight' ? '高亮笔记' : '笔记内容' }}</label>
            <textarea 
              id="note-text"
              v-model="editingItem.note"
              :placeholder="editMode === 'highlight' ? '添加高亮笔记...' : '输入笔记内容...'"
              rows="4"
              class="note-textarea"
            ></textarea>
          </div>
        </div>
        <div class="edit-actions">
          <button 
            class="action-btn primary"
            @click="saveEdit"
            :style="primaryButtonStyle"
          >
            保存
          </button>
          <button 
            class="action-btn secondary"
            @click="closeEditPopup"
            :style="secondaryButtonStyle"
          >
            取消
          </button>
          <button 
            v-if="editMode === 'highlight'"
            class="action-btn delete"
            @click="deleteHighlight(editingItem.id)"
            :style="deleteButtonStyle"
          >
            删除高亮
          </button>
          <button 
            v-if="editMode === 'note'"
            class="action-btn delete"
            @click="deleteNote(editingItem.id)"
            :style="deleteButtonStyle"
          >
            删除笔记
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReaderStore } from '@/stores/reader.store'
import { useDocumentStore } from '@/stores/document.store'
import { useVocabularyStore } from '@/stores/vocabulary.store'
import readerService from '@/services/reader.service'
import vocabularyService from '@/services/vocabulary.service'
import { showSuccess, showError, showWarning } from '@/utils/notify'

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const readerStore = useReaderStore()
const documentStore = useDocumentStore()
const vocabularyStore = useVocabularyStore()

// 响应式数据
const documentId = ref(route.params.id || '')
const currentPage = ref(parseInt(route.query.page) || 1)
const totalPages = ref(1)
const documentTitle = ref('')
const currentPageContent = ref('')
const contentRef = ref(null)

// 侧边栏状态
const showOutline = ref(false)
const showHighlights = ref(false)
const showSearch = ref(false)
const showSettings = ref(false)

// 单词查询相关
const showWordPopup = ref(false)
const selectedWord = ref('')
const wordDetail = ref(null)
const wordLoading = ref(false)
const wordError = ref('')
const isInVocabulary = ref(false)

// 搜索相关
const searchQuery = ref('')
const searchResults = ref(null)
const searchLoading = ref(false)
const searchError = ref('')

// 目录相关
const outline = ref([])
const outlineLoading = ref(false)

// 高亮和笔记相关
const highlightsCount = computed(() => readerStore.highlights.length)
const notesCount = computed(() => readerStore.notes.length)
const highlightsLoading = ref(false)
const notesLoading = ref(false)

// 编辑相关
const showEditPopup = ref(false)
const editMode = ref('highlight') // 'highlight' 或 'note'
const editingItem = ref({})

// 阅读设置
const fontSize = ref(16)
const fontFamily = ref("'Comfortaa', sans-serif")
const lineHeight = ref(1.6)
const currentTheme = ref('light')
const readingMode = ref('scroll')

// 高亮颜色选项
const highlightColors = ref([
  { name: 'yellow', value: '#FFEB3B' },
  { name: 'pink', value: '#FF7EB3' },
  { name: 'blue', value: '#5d6afb' },
  { name: 'green', value: '#4cd964' },
  { name: 'orange', value: '#FF9800' }
])
const selectedColor = ref('yellow')

// 主题选项
const themes = ref([
  { name: 'light', label: '白天模式', background: '#ffffff', text: '#333333' },
  { name: 'dark', label: '夜间模式', background: '#1a1a1a', text: '#f0f0f0' },
  { name: 'sepia', label: '护眼模式', background: '#f8f0e3', text: '#5c4636' }
])

// 计算属性
const readingProgress = computed(() => {
  if (totalPages.value === 0) return 0
  return Math.round((currentPage.value / totalPages.value) * 100)
})

const formatReadingTime = computed(() => {
  const seconds = readerStore.readingTime
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
})

const wordCount = computed(() => {
  if (!currentPageContent.value) return 0
  const text = currentPageContent.value.replace(/<[^>]*>/g, '')
  return text.split(/\s+/).length
})

const filteredHighlights = computed(() => {
  return readerStore.highlights.filter(h => h.documentId === documentId.value)
})

const filteredNotes = computed(() => {
  return readerStore.notes.filter(n => n.documentId === documentId.value)
})

// UI样式计算属性
const toolbarButtonStyle = computed(() => ({
  borderRadius: '20px',
  backgroundColor: '#8a94ff',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)'
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}))

const navButtonStyle = computed(() => ({
  borderRadius: '25px',
  backgroundColor: '#5d6afb',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 8px rgba(93, 106, 251, 0.3)'
}))

const primaryButtonStyle = computed(() => ({
  borderRadius: '20px',
  backgroundColor: '#5d6afb',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer'
}))

const secondaryButtonStyle = computed(() => ({
  borderRadius: '20px',
  backgroundColor: '#f0f0f0',
  color: '#333',
  border: 'none',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer'
}))

const deleteButtonStyle = computed(() => ({
  borderRadius: '20px',
  backgroundColor: '#ff7eb3',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer'
}))

const popupStyle = computed(() => ({
  borderRadius: '30px',
  backgroundColor: 'white',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  maxWidth: '500px',
  width: '90%'
}))

const modalStyle = computed(() => ({
  borderRadius: '30px',
  backgroundColor: 'white',
  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.25)',
  maxWidth: '600px',
  width: '90%'
}))

// 方法
const getColorValue = (colorName) => {
  const color = highlightColors.value.find(c => c.name === colorName)
  return color ? color.value : '#FFEB3B'
}

// 加载文档内容
const loadDocumentContent = async () => {
  try {
    if (!documentId.value) {
      showError('文档ID无效')
      router.push('/dashboard')
      return
    }

    // 从文档store获取文档信息
    const document = documentStore.documents.find(doc => doc.id === documentId.value)
    if (document) {
      documentTitle.value = document.title
      totalPages.value = document.pageCount || 1
    }

    // 加载页面内容
    const pageContent = await readerService.getPageContent(documentId.value, currentPage.value)
    currentPageContent.value = pageContent.htmlContent || pageContent.content
    
    // 更新阅读进度
    await updateReadingProgress()
    
    // 加载高亮和笔记
    loadHighlightsAndNotes()
    
    // 加载目录
    loadDocumentOutline()
    
    // 开始阅读计时
    readerService.startReadingSession(documentId.value)
    
  } catch (error) {
    console.error('加载文档内容失败:', error)
    showError('加载文档内容失败')
  }
}

// 更新阅读进度
const updateReadingProgress = async () => {
  try {
    await readerService.updateReadingProgress(documentId.value, {
      page: currentPage.value,
      percentage: readingProgress.value
    })
  } catch (error) {
    console.error('更新阅读进度失败:', error)
  }
}

// 加载高亮和笔记
const loadHighlightsAndNotes = async () => {
  try {
    highlightsLoading.value = true
    notesLoading.value = true
    
    await Promise.all([
      readerService.getDocumentHighlights(documentId.value),
      readerService.getDocumentNotes(documentId.value)
    ])
    
  } catch (error) {
    console.error('加载高亮和笔记失败:', error)
  } finally {
    highlightsLoading.value = false
    notesLoading.value = false
  }
}

// 加载文档目录
const loadDocumentOutline = async () => {
  try {
    outlineLoading.value = true
    const outlineData = await readerService.getDocumentOutline(documentId.value)
    outline.value = outlineData
  } catch (error) {
    console.error('加载目录失败:', error)
  } finally {
    outlineLoading.value = false
  }
}

// 跳转到指定页面
const goToPage = async (pageNumber) => {
  if (pageNumber < 1 || pageNumber > totalPages.value) {
    return
  }
  
  currentPage.value = pageNumber
  
  // 更新URL
  router.replace({
    query: { ...route.query, page: pageNumber }
  })
  
  // 加载新页面内容
  await loadDocumentContent()
  
  // 滚动到顶部
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
}

// 跳转到指定页码
const jumpPageNumber = ref(1)
const jumpToPage = (pageNumber) => {
  if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages.value) {
    goToPage(pageNumber)
  }
}

// 处理内容点击
const handleContentClick = (event) => {
  // 如果点击的是高亮区域，不触发单词查询
  if (event.target.classList.contains('highlight')) {
    return
  }
  
  // 获取选中的文本
  const selection = window.getSelection()
  const selectedText = selection.toString().trim()
  
  if (selectedText && selectedText.length > 0) {
    // 显示高亮选项
    showHighlightOptions(selectedText, event)
  }
}

// 处理文本选择
const handleTextSelection = () => {
  const selection = window.getSelection()
  const selectedText = selection.toString().trim()
  
  if (selectedText && selectedText.length > 0) {
    // 延迟显示单词查询弹窗，避免与高亮选项冲突
    setTimeout(() => {
      if (!showWordPopup.value) {
        lookupWord(selectedText)
      }
    }, 100)
  }
}

// 显示高亮选项
const showHighlightOptions = (text, event) => {
  // 在实际应用中，这里可以显示一个浮动工具栏
  // 这里简化为直接添加高亮
  addHighlight(text)
}

// 添加高亮
const addHighlight = async (text) => {
  try {
    const highlightData = {
      text: text,
      page: currentPage.value,
      position: {}, // 在实际应用中需要计算位置
      color: selectedColor.value,
      note: ''
    }
    
    await readerService.addHighlight(documentId.value, highlightData)
    showSuccess('已添加高亮')
    
  } catch (error) {
    console.error('添加高亮失败:', error)
    showError('添加高亮失败')
  }
}

// 编辑高亮
const editHighlight = (highlight) => {
  editMode.value = 'highlight'
  editingItem.value = { ...highlight }
  showEditPopup.value = true
}

// 删除高亮
const deleteHighlight = async (highlightId) => {
  try {
    const confirmed = confirm('确定要删除这个高亮吗？')
    if (!confirmed) return
    
    await readerService.deleteHighlight(documentId.value, highlightId)
    showSuccess('高亮已删除')
    
    if (showEditPopup.value) {
      closeEditPopup()
    }
    
  } catch (error) {
    console.error('删除高亮失败:', error)
    showError('删除高亮失败')
  }
}

// 跳转到高亮位置
const jumpToHighlight = (highlight) => {
  goToPage(highlight.page)
  // 在实际应用中，这里还需要滚动到高亮的具体位置
}

// 添加笔记
const addNote = async () => {
  try {
    const noteData = {
      content: editingItem.value.note || '',
      page: currentPage.value,
      position: {}
    }
    
    await readerService.addNote(documentId.value, noteData)
    showSuccess('笔记已添加')
    closeEditPopup()
    
  } catch (error) {
    console.error('添加笔记失败:', error)
    showError('添加笔记失败')
  }
}

// 编辑笔记
const editNote = (note) => {
  editMode.value = 'note'
  editingItem.value = { ...note }
  showEditPopup.value = true
}

// 删除笔记
const deleteNote = async (noteId) => {
  try {
    const confirmed = confirm('确定要删除这个笔记吗？')
    if (!confirmed) return
    
    await readerService.deleteNote(documentId.value, noteId)
    showSuccess('笔记已删除')
    
    if (showEditPopup.value) {
      closeEditPopup()
    }
    
  } catch (error) {
    console.error('删除笔记失败:', error)
    showError('删除笔记失败')
  }
}

// 跳转到笔记位置
const jumpToNote = (note) => {
  goToPage(note.page)
  // 在实际应用中，这里还需要滚动到笔记的具体位置
}

// 查询单词
const lookupWord = async (word) => {
  try {
    selectedWord.value = word
    wordLoading.value = true
    wordError.value = ''
    wordDetail.value = null
    
    // 查询单词详情
    const detail = await vocabularyService.lookupWord(word)
    wordDetail.value = detail
    
    // 检查是否已在生词本中
    checkIfInVocabulary(word)
    
    // 显示弹窗
    showWordPopup.value = true
    
  } catch (error) {
    console.error('查询单词失败:', error)
    wordError.value = error.message || '查询单词失败'
  } finally {
    wordLoading.value = false
  }
}

// 检查单词是否在生词本中
const checkIfInVocabulary = (word) => {
  const normalizedWord = word.toLowerCase()
  const existingItem = vocabularyStore.items.find(
    item => item.word === normalizedWord
  )
  isInVocabulary.value = !!existingItem
}

// 添加到生词本
const addToVocabulary = async () => {
  try {
    if (!wordDetail.value) return
    
    const vocabData = {
      word: selectedWord.value,
      definition: wordDetail.value.definitions?.[0]?.definition || wordDetail.value.definitions?.[0] || '',
      example: wordDetail.value.examples?.[0] || '',
      language: 'en',
      source: documentId.value,
      sourcePage: currentPage.value
    }
    
    await vocabularyService.addToVocabulary(vocabData)
    showSuccess(`单词 "${selectedWord.value}" 已添加到生词本`)
    isInVocabulary.value = true
    
  } catch (error) {
    console.error('添加到生词本失败:', error)
    showError('添加到生词本失败')
  }
}

// 播放发音
const playPronunciation = () => {
  if (wordDetail.value && wordDetail.value.audioUrl) {
    const audio = new Audio(wordDetail.value.audioUrl)
    audio.play().catch(error => {
      console.error('播放发音失败:', error)
      showError('播放发音失败')
    })
  }
}

// 关闭单词弹窗
const closeWordPopup = () => {
  showWordPopup.value = false
  selectedWord.value = ''
  wordDetail.value = null
  wordError.value = ''
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    showWarning('请输入搜索关键词')
    return
  }
  
  try {
    searchLoading.value = true
    searchError.value = ''
    
    const results = await readerService.searchDocumentContent(
      documentId.value,
      searchQuery.value
    )
    
    searchResults.value = results
    
  } catch (error) {
    console.error('搜索失败:', error)
    searchError.value = error.message || '搜索失败'
  } finally {
    searchLoading.value = false
  }
}

// 高亮搜索文本
const highlightSearchText = (text) => {
  if (!searchQuery.value || !text) return text
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 跳转到搜索结果
const jumpToSearchResult = (result) => {
  goToPage(result.page)
  showSearch.value = false
  // 在实际应用中，这里还需要滚动到搜索结果的具体位置
}

// 切换目录侧边栏
const toggleOutline = () => {
  showOutline.value = !showOutline.value
  if (showOutline.value && outline.value.length === 0) {
    loadDocumentOutline()
  }
}

// 切换高亮/笔记侧边栏
const toggleHighlights = () => {
  showHighlights.value = !showHighlights.value
  if (showHighlights.value) {
    loadHighlightsAndNotes()
  }
}

// 切换搜索
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) {
    searchQuery.value = ''
    searchResults.value = null
  }
}

// 切换设置
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 关闭编辑弹窗
const closeEditPopup = () => {
  showEditPopup.value = false
  editingItem.value = {}
}

// 保存编辑
const saveEdit = async () => {
  try {
    if (editMode.value === 'highlight') {
      await readerService.updateHighlight(
        documentId.value,
        editingItem.value.id,
        {
          color: editingItem.value.color,
          note: editingItem.value.note
        }
      )
      showSuccess('高亮已更新')
    } else {
      await readerService.updateNote(
        documentId.value,
        editingItem.value.id,
        {
          content: editingItem.value.note
        }
      )
      showSuccess('笔记已更新')
    }
    
    closeEditPopup()
    
  } catch (error) {
    console.error('保存失败:', error)
    showError('保存失败')
  }
}

// 字体大小控制
const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value += 2
    applyFontSettings()
  }
}

const decreaseFontSize = () => {
  if (fontSize.value > 12) {
    fontSize.value -= 2
    applyFontSettings()
  }
}

// 应用字体设置
const applyFontSettings = () => {
  if (contentRef.value) {
    contentRef.value.style.fontSize = `${fontSize.value}px`
    contentRef.value.style.fontFamily = fontFamily.value
    contentRef.value.style.lineHeight = lineHeight.value
  }
}

// 更改主题
const changeTheme = (themeName) => {
  currentTheme.value = themeName
  applyTheme()
}

// 应用主题
const applyTheme = () => {
  const theme = themes.value.find(t => t.name === currentTheme.value)
  if (theme && contentRef.value) {
    contentRef.value.style.backgroundColor = theme.background
    contentRef.value.style.color = theme.text
  }
}

// 应用设置
const applySettings = () => {
  applyFontSettings()
  applyTheme()
  showSettings.value = false
  showSuccess('设置已应用')
}

// 重置设置
const resetSettings = () => {
  fontSize.value = 16
  fontFamily.value = "'Comfortaa', sans-serif"
  lineHeight.value = 1.6
  currentTheme.value = 'light'
  readingMode.value = 'scroll'
  
  applySettings()
}

// 返回书架
const goBack = async () => {
  // 结束阅读会话
  await readerService.endReadingSession(documentId.value)
  router.push('/dashboard')
}

// 生命周期钩子
onMounted(() => {
  loadDocumentContent()
  
  // 监听路由变化
  watch(() => route.query.page, (newPage) => {
    if (newPage && parseInt(newPage) !== currentPage.value) {
      currentPage.value = parseInt(newPage)
      loadDocumentContent()
    }
  })
})

onUnmounted(async () => {
  // 组件卸载时结束阅读会话
  await readerService.endReadingSession(documentId.value)
})
</script>

<style scoped>
.reader-view {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7ff 0%, #e3e6ff 100%);
  font-family: 'Comfortaa', cursive;
}

.reader-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

/* 顶部工具栏样式 */
.reader-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 30px;
  padding: 15px 25px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.15);
  border: 3px solid #8a94ff;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 20px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Comfortaa', cursive;
  position: relative;
  overflow: hidden;
}

.toolbar-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 25px rgba(93, 106, 251, 0.3);
}

.toolbar-btn:active {
  transform: translateY(0) scale(0.98);
}

.toolbar-btn.active {
  background: linear-gradient(135deg, #ff7eb3 0%, #ff9ec5 100%);
  box-shadow: 0 6px 15px rgba(255, 126, 179, 0.3);
}

.back-btn {
  background: linear-gradient(135deg, #4cd964 0%, #6de382 100%);
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  font-size: 14px;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff7eb3;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-title {
  text-align: center;
  flex-grow: 1;
  margin: 0 20px;
}

.document-title h1 {
  margin: 0;
  font-size: 24px;
  color: #5d6afb;
  font-weight: bold;
  font-family: 'Caveat', cursive;
}

.document-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 5px;
  font-size: 14px;
  color: #666;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

/* 主要内容区域 */
.reader-content-area {
  display: flex;
  flex: 1;
  gap: 20px;
  position: relative;
}

.sidebar {
  background: white;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 3px solid #8a94ff;
  overflow: hidden;
  width: 300px;
  min-width: 300px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-family: 'Caveat', cursive;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-content {
  padding: 20px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.outline-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.outline-list li {
  padding: 12px 15px;
  margin: 5px 0;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  border-left: 5px solid transparent;
}

.outline-list li:hover {
  background: #f0f2ff;
  transform: translateX(5px);
  border-left-color: #5d6afb;
}

.outline-level-1 {
  font-weight: bold;
  font-size: 16px !important;
}

.outline-level-2 {
  padding-left: 20px !important;
  font-size: 14px !important;
}

.outline-level-3 {
  padding-left: 35px !important;
  font-size: 13px !important;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 25px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 3px solid #8a94ff;
  position: relative;
  overflow: hidden;
}

.content-wrapper.with-sidebar {
  margin: 0 10px;
}

.document-content {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  padding: 20px;
  overflow-y: auto;
  border-radius: 20px;
  background: #fafaff;
  border: 2px dashed #8a94ff;
  font-family: 'Quicksand', sans-serif;
}

.document-content :deep(.highlight) {
  background: #FFEB3B;
  padding: 2px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.document-content :deep(.highlight:hover) {
  background: #FFD600;
}

.document-content :deep(.search-highlight) {
  background: #ff7eb3;
  color: white;
  padding: 2px 4px;
  border-radius: 8px;
}

.page-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  border-radius: 25px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  border: none;
  padding: 15px 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Comfortaa', cursive;
  box-shadow: 0 6px 15px rgba(93, 106, 251, 0.3);
}

.page-nav-btn:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 10px 25px rgba(93, 106, 251, 0.4);
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px dashed #8a94ff;
}

.reading-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.stat-icon {
  font-size: 16px;
}

.page-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-input {
  width: 80px;
  padding: 10px 15px;
  border: 2px solid #8a94ff;
  border-radius: 15px;
  font-size: 14px;
  text-align: center;
  font-family: 'Comfortaa', cursive;
  outline: none;
  transition: border-color 0.3s;
}

.page-input:focus {
  border-color: #5d6afb;
  box-shadow: 0 0 0 3px rgba(93, 106, 251, 0.1);
}

.jump-btn {
  border-radius: 15px;
  background: linear-gradient(135deg, #4cd964 0%, #6de382 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Comfortaa', cursive;
}

.jump-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 217, 100, 0.3);
}

/* 进度条样式 */
.reader-progress {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.15);
  border: 3px solid #8a94ff;
}

.progress-bar {
  height: 20px;
  background: #f0f2ff;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
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

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

/* 弹窗样式 */
.word-popup-overlay,
.search-overlay,
.settings-overlay,
.edit-overlay {
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

.word-popup,
.search-modal,
.settings-modal,
.edit-modal {
  background: white;
  border-radius: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: popup-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes popup-appear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.popup-header,
.search-header,
.settings-header,
.edit-header {
  padding: 25px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h3,
.search-header h3,
.settings-header h3,
.edit-header h3 {
  margin: 0;
  font-size: 22px;
  font-family: 'Caveat', cursive;
}

.popup-content,
.search-content,
.settings-content,
.edit-content {
  padding: 25px;
  max-height: 60vh;
  overflow-y: auto;
}

.word-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.phonetic-section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f0f2ff;
  border-radius: 15px;
}

.phonetic {
  font-size: 18px;
  color: #5d6afb;
  font-weight: bold;
}

.pronounce-btn {
  border-radius: 15px;
  background: linear-gradient(135deg, #ff7eb3 0%, #ff9ec5 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Comfortaa', cursive;
}

.pronounce-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 126, 179, 0.3);
}

.definition-section,
.examples-section,
.synonyms-section {
  padding: 15px;
  background: #fafaff;
  border-radius: 15px;
  border: 2px solid #e3e6ff;
}

.definition-section h4,
.examples-section h4,
.synonyms-section h4 {
  margin: 0 0 15px 0;
  color: #5d6afb;
  font-family: 'Caveat', cursive;
  font-size: 18px;
}

.definition-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background: white;
  border-radius: 10px;
  border-left: 4px solid #8a94ff;
}

.part-of-speech {
  font-size: 12px;
  color: #ff7eb3;
  font-weight: bold;
  background: #fff0f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.examples-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.example-item {
  padding: 10px 15px;
  margin: 8px 0;
  background: white;
  border-radius: 10px;
  border-left: 4px solid #4cd964;
  font-style: italic;
}

.synonyms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.synonym-tag {
  padding: 6px 12px;
  background: #e3e6ff;
  color: #5d6afb;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.synonym-tag:hover {
  background: #5d6afb;
  color: white;
  transform: translateY(-2px);
  border-color: #8a94ff;
}

.popup-actions,
.settings-actions,
.edit-actions {
  display: flex;
  gap: 15px;
  padding: 20px 25px;
  background: #fafaff;
  border-top: 2px solid #e3e6ff;
}

.action-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Comfortaa', cursive;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
}

.action-btn.secondary {
  background: #f0f2ff;
  color: #5d6afb;
  border: 2px solid #8a94ff;
}

.action-btn.delete {
  background: linear-gradient(135deg, #ff7eb3 0%, #ff9ec5 100%);
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 搜索样式 */
.search-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 15px 20px;
  border: 3px solid #8a94ff;
  border-radius: 20px;
  font-size: 16px;
  font-family: 'Comfortaa', cursive;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #5d6afb;
  box-shadow: 0 0 0 4px rgba(93, 106, 251, 0.2);
}

.search-btn {
  padding: 15px 30px;
  border-radius: 20px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  border: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Comfortaa', cursive;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.3);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-item {
  padding: 15px;
  background: #fafaff;
  border-radius: 15px;
  border: 2px solid #e3e6ff;
  cursor: pointer;
  transition: all 0.3s;
}

.result-item:hover {
  transform: translateX(5px);
  border-color: #5d6afb;
  box-shadow: 0 6px 15px rgba(93, 106, 251, 0.15);
}

.result-page {
  font-size: 12px;
  color: #ff7eb3;
  font-weight: bold;
  margin-bottom: 8px;
}

.result-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.result-context {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

/* 设置样式 */
.setting-group {
  margin-bottom: 25px;
  padding: 20px;
  background: #fafaff;
  border-radius: 20px;
  border: 2px solid #e3e6ff;
}

.setting-group h4 {
  margin: 0 0 15px 0;
  color: #5d6afb;
  font-family: 'Caveat', cursive;
  font-size: 20px;
}

.setting-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-option label {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.size-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8a94ff 0%, #a5adff 100%);
  color: white;
  border: none;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 15px rgba(138, 148, 255, 0.3);
}

.current-size {
  font-size: 16px;
  color: #5d6afb;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.font-select {
  padding: 10px 15px;
  border: 2px solid #8a94ff;
  border-radius: 15px;
  font-size: 14px;
  font-family: 'Comfortaa', cursive;
  outline: none;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
}

.font-select:focus {
  border-color: #5d6afb;
  box-shadow: 0 0 0 3px rgba(93, 106, 251, 0.1);
}

.line-height-slider {
  flex: 1;
  margin: 0 15px;
  -webkit-appearance: none;
  height: 8px;
  background: #e3e6ff;
  border-radius: 4px;
  outline: none;
}

.line-height-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-value {
  font-size: 14px;
  color: #5d6afb;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.theme-options,
.mode-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-option,
.mode-option {
  flex: 1;
  min-width: 120px;
  padding: 15px;
  border-radius: 15px;
  border: 3px solid transparent;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Comfortaa', cursive;
  text-align: center;
}

.theme-option:hover,
.mode-option:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.theme-option.active,
.mode-option.active {
  border-color: #5d6afb;
  box-shadow: 0 6px 15px rgba(93, 106, 251, 0.3);
}

/* 高亮/笔记侧边栏样式 */
.highlights-sidebar {
  background: white;
}

.color-picker {
  margin-bottom: 20px;
  padding: 15px;
  background: #fafaff;
  border-radius: 15px;
}

.color-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.color-options {
  display: flex;
  gap: 10px;
}

.color-option {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.color-option:hover {
  transform: scale(1.2);
}

.color-option.active {
  border-color: #333;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #333;
}

.highlights-section,
.notes-section {
  margin-bottom: 25px;
}

.highlights-section h4,
.notes-section h4 {
  margin: 0 0 15px 0;
  color: #5d6afb;
  font-family: 'Caveat', cursive;
  font-size: 18px;
}

.highlights-list,
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.highlight-item,
.note-item {
  padding: 15px;
  background: #fafaff;
  border-radius: 15px;
  border-left: 5px solid #FFEB3B;
  cursor: pointer;
  transition: all 0.3s;
}

.highlight-item:hover,
.note-item:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.highlight-text,
.note-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.4;
}

.highlight-meta,
.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.page {
  font-weight: bold;
  color: #ff7eb3;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.action-btn:not(.delete) {
  background: #e3e6ff;
  color: #5d6afb;
}

.action-btn.delete {
  background: #ffe6ee;
  color: #ff7eb3;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.highlight-note {
  margin-top: 10px;
  padding: 10px;
  background: white;
  border-radius: 10px;
  font-size: 13px;
  color: #666;
  border: 1px dashed #8a94ff;
}

/* 编辑弹窗样式 */
.edit-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.highlight-preview {
  padding: 15px;
  background: #fafaff;
  border-radius: 15px;
  border: 2px solid #e3e6ff;
}

.preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.preview-text {
  font-size: 14px;
  color: #333;
  font-style: italic;
  background: #FFEB3B;
  padding: 8px 12px;
  border-radius: 10px;
  display: inline-block;
}

.color-selector {
  padding: 15px;
  background: #fafaff;
  border-radius: 15px;
}

.selector-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.note-input label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.note-textarea {
  width: 100%;
  padding: 15px;
  border: 3px solid #8a94ff;
  border-radius: 15px;
  font-size: 14px;
  font-family: 'Comfortaa', cursive;
  outline: none;
  resize: vertical;
  transition: border-color 0.3s;
}

.note-textarea:focus {
  border-color: #5d6afb;
  box-shadow: 0 0 0 3px rgba(93, 106, 251, 0.1);
}

/* 过渡动画 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 加载和空状态样式 */
.loading,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
}

.loading {
  color: #5d6afb;
}

.error {
  text-align: center;
  padding: 20px;
  color: #ff7eb3;
  font-size: 14px;
  background: #fff0f5;
  border-radius: 15px;
  border: 2px solid #ff7eb3;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .reader-container {
    padding: 15px;
  }
  
  .reader-toolbar {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .toolbar-actions {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .content-wrapper.with-sidebar {
    margin: 0;
  }
}

@media (max-width: 768px) {
  .reader-content-area {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    min-width: auto;
    margin-bottom: 20px;
  }
  
  .page-nav-btn {
    position: static;
    transform: none;
    margin: 10px;
  }
  
  .prev-btn,
  .next-btn {
    position: static;
  }
  
  .page-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .theme-option,
  .mode-option {
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .reader-toolbar {
    padding: 10px 15px;
  }
  
  .toolbar-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .document-title h1 {
    font-size: 18px;
  }
  
  .document-info {
    font-size: 12px;
  }
  
  .content-wrapper {
    padding: 15px;
  }
  
  .document-content {
    padding: 10px;
    font-size: 14px;
  }
}
</style>