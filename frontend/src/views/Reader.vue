<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- 
    阅读器主页面容器 
    :data-theme="theme" 用于动态切换主题（如日间、夜间、护眼模式）
  -->
  <div class="reader-page" :data-theme="theme">
    
    <!-- 加载状态提示：当 isLoading 为 true 时显示，覆盖在页面上 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader">正在加载文档内容...</div>
    </div>

    <!-- 顶部工具栏：包含返回、目录、笔记、搜索、设置和主题切换按钮 -->
    <header class="toolbar" :class="{ hidden: toolbarHidden }">
      <div class="toolbar-left">
        <button class="icon-btn" @click="goBack" title="返回">←</button>
        <button class="icon-btn" @click="toggleSidebar('toc')" title="目录">📖</button>
        <button class="icon-btn" @click="toggleSidebar('notes')" title="笔记">📝</button>
      </div>
      <div class="toolbar-center">
        <!-- 显示当前阅读的文档标题 -->
        <h2 class="document-title">{{ docData.title }}</h2>
      </div>
      <div class="toolbar-right">
        <button class="icon-btn" @click="toggleSearch" title="搜索">🔍</button>
        <button class="icon-btn" @click="toggleSettings" title="设置">⚙️</button>
        <button class="icon-btn" @click="toggleTheme" title="切换主题">
          {{ theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>
    </header>

    <!-- 搜索栏：点击搜索图标后展开，支持全文搜索 -->
    <div class="search-bar" v-if="showSearch">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索文档内容..."
        @input="performSearch"
      />
      <button class="btn-close-search" @click="toggleSearch">✖</button>
      <!-- 搜索结果列表 -->
      <div class="search-results" v-if="searchResults.length > 0">
        <div
          v-for="(result, index) in searchResults"
          :key="index"
          class="search-result"
          @click="jumpToResult(result)"
        >
          <div class="result-page">第 {{ result.page }} 页</div>
          <!-- 使用 v-html 显示带有高亮标记的搜索结果 -->
          <span v-html="highlightText(result.context || result.text)"></span>
        </div>
      </div>
    </div>

    <div class="reader-container">
      <!-- 目录侧边栏：显示文档章节结构 -->
      <aside class="sidebar sidebar-toc" :class="{ open: sidebarOpen.toc }">
        <div class="sidebar-header">
          <h3>目录</h3>
          <button class="btn-close-sidebar" @click="toggleSidebar('toc')">✖</button>
        </div>
        <div class="sidebar-content">
          <ul class="toc-list">
            <li
              v-for="chapter in flattenedToc"
              :key="chapter.page"
              :class="{ active: currentChapter === chapter.page }"
              @click="jumpToChapter(chapter.page)"
            >
              <!-- 根据目录层级设置缩进 -->
              <span :style="{ paddingLeft: (chapter.level - 1) * 15 + 'px' }">
                {{ chapter.title }}
              </span>
              <span class="page-number">{{ chapter.page }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <!-- 笔记侧边栏：显示用户在本文档中记录的所有笔记和高亮 -->
      <aside class="sidebar sidebar-notes" :class="{ open: sidebarOpen.notes }">
        <div class="sidebar-header">
          <h3>笔记与高亮</h3>
          <button class="btn-close-sidebar" @click="toggleSidebar('notes')">✖</button>
        </div>
        <div class="sidebar-content">
          <div class="notes-list">
            <div
              v-for="note in notes"
              :key="note.id"
              class="note-item"
              @click="jumpToNote(note)"
            >
              <div class="note-content-wrapper">
                <div class="note-text">{{ note.content || note.text }}</div>
                <button class="btn-delete-note" @click.stop="deleteNote(note)" title="删除">🗑️</button>
              </div>
              <div class="note-meta">
                <span class="note-type" :class="note.type || 'note'" :style="note.color ? { backgroundColor: getHighlightColorValue(note.color) } : {}">
                  {{ (note.highlightId || note.type === 'highlight') ? '高亮' : '笔记' }}
                </span>
                <span class="note-page">第 {{ note.page }} 页</span>
              </div>
            </div>
          </div>
          <button class="btn-add-note" @click="addNote">+ 添加笔记</button>
        </div>
      </aside>

      <!-- 主阅读区域：显示文档正文 -->
      <main class="reading-area" @click="onReadingAreaClick">
        <div class="content-wrapper" :style="contentStyle">
          <div class="content" ref="contentEl">
            <!-- 遍历段落 -->
            <div v-for="(para, pIdx) in processedParagraphs" :key="pIdx" class="paragraph">
              <!-- 遍历段落中的每个词或符号 -->
              <span
                v-for="(token, tIdx) in para"
                :key="tIdx"
                :class="['word-token', { 'is-word': token.isWord, 'has-highlight': token.highlightColor }]"
                :style="token.highlightColor ? { backgroundColor: getHighlightColorValue(token.highlightColor) } : {}"
                @click.stop="token.isWord ? handleWordClick($event, token.text) : null"
              >
                {{ token.text }}
              </span>
            </div>
          </div>
        </div>

        <!-- 查词弹窗：点击单词时弹出，显示释义、发音和收藏功能 -->
        <div v-if="wordPopup.show" class="word-popup" :style="wordPopup.style" :class="{ 'not-found': wordPopup.notFound }">
          <div class="popup-header">
            <strong>{{ wordPopup.word }}</strong>
            <button class="btn-close-popup" @click="closeWordPopup">✖</button>
          </div>
          <div class="popup-body">
            <!-- 查到单词时显示的内容 -->
            <template v-if="!wordPopup.notFound">
              <div class="phonetic" v-if="wordPopup.phonetic">/{{ wordPopup.phonetic }}/</div>
              <div class="popup-actions">
                <button class="btn-speak" @click="speakWord">🔊 发音</button>
                <button class="btn-add-to-vocab" @click="addToVocabulary">📚 收藏</button>
              </div>
              <div class="definition">
                <span class="pos" v-if="wordPopup.partOfSpeech">{{ wordPopup.partOfSpeech }}</span>
                {{ wordPopup.definition }}
              </div>
              <div class="example" v-if="wordPopup.example">
                <div class="example-label">例句：</div>
                {{ wordPopup.example }}
              </div>
            </template>
            <!-- 未查到单词时的提示 -->
            <template v-else>
              <div class="not-found-message">
                <div class="not-found-icon">🔍</div>
                <p>{{ wordPopup.definition }}</p>
                <button class="btn-search-external" @click="searchExternal">尝试在线搜索</button>
              </div>
            </template>
          </div>
        </div>
        <!-- 文本选择操作菜单 -->
        <div v-if="selectionMenu.show" class="selection-menu" :style="selectionMenu.style">
          <button class="menu-btn" @click="createHighlight('yellow')">🟨 高亮</button>
          <button class="menu-btn" @click="createHighlight('green')">🟩 高亮</button>
          <button class="menu-btn" @click="createHighlight('pink')">🟥 高亮</button>
          <div class="menu-divider"></div>
          <button class="menu-btn" @click="addNoteFromSelection">📝 笔记</button>
        </div>

      </main>
    </div>

    <!-- 底部进度条：显示页码、百分比进度，并提供翻页按钮 -->
    <footer class="footer">
      <div class="progress-container">
        <div class="progress-info">
          <button class="nav-btn" @click="changePage(-1)" :disabled="currentPage <= 1">上一页</button>
          <div class="progress-text">
            第 {{ currentPage }} 页 / 共 {{ docData.pageCount || '?' }} 页 ({{ docData.readProgress || progress }}%)
          </div>
          <button class="nav-btn" @click="changePage(1)">下一页</button>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar">
            <!-- 进度条填充部分 -->
            <div class="progress-fill" :style="{ width: (docData.readProgress || progress) + '%' }"></div>
          </div>
        </div>
      </div>
    </footer>

    <!-- 设置弹窗：调整字体大小、行高和主题 -->
    <div v-if="showSettings" class="settings-modal" @click.self="toggleSettings">
      <div class="modal-content card">
        <h3>阅读设置</h3>
        <div class="setting-group">
          <label>字体大小</label>
          <div class="control-row">
            <button class="circle-btn" @click="decreaseFontSize">A-</button>
            <span class="value-display">{{ fontSize }}px</span>
            <button class="circle-btn" @click="increaseFontSize">A+</button>
          </div>
        </div>
        <div class="setting-group">
          <label>行高</label>
          <div class="control-row">
            <input type="range" min="1.2" max="2.5" step="0.1" v-model="lineHeight" />
            <span class="value-display">{{ lineHeight }}</span>
          </div>
        </div>
        <div class="setting-group">
          <label>主题</label>
          <div class="theme-selector">
            <button
              v-for="t in themes"
              :key="t.id"
              :class="['theme-btn', t.id, { active: theme === t.id }]"
              @click="setTheme(t.id)"
            >
              {{ t.name }}
            </button>
          </div>
        </div>
        <button class="btn-primary w-full" @click="toggleSettings">完成</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 阅读器逻辑处理部分
 * 使用 Vue 3 的 Composition API (script setup)
 */
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { mockDocumentAPI } from '@/mock/api'
import { API_BASE_URL } from '@/config'

// 获取路由信息（用于获取 URL 中的文档 ID）和路由跳转工具
const route = useRoute()
const router = useRouter()
const docId = parseInt(route.params.id) || 1

// --- 响应式状态变量 ---
const isLoading = ref(false) // 是否正在加载
const token = ref(sessionStorage.getItem('token') || localStorage.getItem('token') || '') // 登录令牌
const BASE_URL = API_BASE_URL.replace('/api/v1', '') // 后端基础地址

// 文档元数据（标题、作者、总页数等）
const docData = reactive({
  title: '加载中...',
  author: '',
  uploader: '',
  readProgress: 0,
  pageCount: 0
})

const currentPage = ref(1) // 当前页码
// 当前页的具体内容
const currentPageData = reactive({
  content: '',
  htmlContent: '',
  nextPage: null,
  prevPage: null
})

// UI 显示控制状态
const toolbarHidden = ref(false)
const showSearch = ref(false)
const showSettings = ref(false)
const sidebarOpen = reactive({ toc: false, notes: false })

// 用户偏好设置（从本地存储读取，实现持久化）
const fontSize = ref(parseInt(localStorage.getItem('reader-font-size')) || 18)
const theme = ref(localStorage.getItem('reader-theme') || 'light')
const lineHeight = ref(parseFloat(localStorage.getItem('reader-line-height')) || 1.8)
const progress = ref(0) // 进度百分比
const currentChapter = ref(1) // 当前所在章节

const toc = ref([]) // 目录数据
const notes = ref([]) // 笔记数据
const searchResults = ref([]) // 搜索结果
const searchQuery = ref('') // 搜索关键词

// 查词弹窗的状态数据
const wordPopup = reactive({
  show: false, word: '', phonetic: '', partOfSpeech: '',
  definition: '', example: '', contextExample: '', style: {}, notFound: false
})

// 文本选择菜单状态
const selectionMenu = reactive({
  show: false,
  text: '',
  style: {},
  range: null
})

// 可选主题列表
const themes = [
  { id: 'light', name: '日间' },
  { id: 'dark', name: '夜间' },
  { id: 'sepia', name: '护眼' }
]

/**
 * 计算属性：处理正文文本
 * 将纯文本拆分为段落，再将段落拆分为一个个单词或符号。
 * 这样可以实现点击单个单词进行查词的功能。
 */
const processedParagraphs = computed(() => {
  const content = currentPageData.content || ''
  if (!content) return []
  
  // 获取当前页的所有高亮文本
  const pageHighlights = notes.value.filter(n => n.highlightId || n.type === 'highlight')

  return content.split(/\n+/).map(para => {
    const tokens = para.match(/(\w+|[^\w\s]+|\s+)/g) || []
    return tokens.map(token => {
      const isWord = /^\w+$/.test(token)
      
      // 检查该 token 是否属于任何高亮区域
      const highlight = pageHighlights.find(h => {
        const hText = h.text || h.content || ''
        return hText.includes(token.trim()) && token.trim().length > 0
      })

      return {
        text: token,
        isWord,
        highlightColor: highlight ? highlight.color : null
      }
    })
  })
})

/**
 * 获取高亮颜色的具体 CSS 值
 */
const getHighlightColorValue = (color) => {
  const colorMap = {
    'yellow': 'rgba(255, 255, 0, 0.4)',
    'green': 'rgba(0, 255, 0, 0.3)',
    'pink': 'rgba(255, 192, 203, 0.5)',
    'blue': 'rgba(173, 216, 230, 0.5)'
  }
  return colorMap[color] || colorMap['yellow']
}

/**
 * 计算属性：阅读区域的动态样式
 */
const contentStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: lineHeight.value,
  fontFamily: 'var(--font-body)'
}))

// --- 监听器：当变量改变时执行特定逻辑 ---

// 监听主题变化，更新 HTML 根元素的属性并保存到本地
watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('reader-theme', newTheme)
})

// 监听设置变化并保存
watch(fontSize, (newSize) => localStorage.setItem('reader-font-size', newSize))
watch(lineHeight, (newHeight) => localStorage.setItem('reader-line-height', newHeight))

// --- API 请求函数：与后端进行数据交互 ---

/**
 * 获取文档的基本信息（元数据）
 */
const fetchDocumentMeta = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/documents/${docId}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const json = await response.json()
    if (json.data) {
      Object.assign(docData, json.data)
    }
  } catch (e) {
    console.error('获取文档信息失败:', e)
  }
  
  // 如果有阅读进度，计算初始页码
  if (docData.readProgress && !currentPage.value) {
    currentPage.value = Math.floor((docData.readProgress / 100) * (docData.pageCount || 1)) || 1
  }
}

/**
 * 获取文档目录（大纲）
 */
const fetchTOC = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/outline`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const json = await response.json()
    if (json.data && json.data.outline) toc.value = json.data.outline
  } catch (e) {
    console.error('获取目录失败', e)
  }
}

/**
 * 获取指定页码的内容
 */
const fetchPageContent = async (pageNumber) => {
  if (pageNumber < 1) return
  isLoading.value = true
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/pages/${pageNumber}`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const json = await response.json()
    if (json.data) {
      Object.assign(currentPageData, json.data)
      currentPage.value = pageNumber
      if (json.data.notes) notes.value = json.data.notes
      
      // 更新本地进度百分比
      if (docData.pageCount) {
        progress.value = Math.round((pageNumber / docData.pageCount) * 100)
      }
    }
  } catch (e) {
    console.error('获取页面内容失败', e)
  } finally {
    isLoading.value = false
  }
}

/**
 * 获取该文档下的所有笔记
 */
const fetchAllNotes = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/notes`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const json = await response.json()
    if (json.data) notes.value = json.data
  } catch (e) {
    console.error('获取笔记失败', e)
  }
}

/**
 * 执行全文搜索
 */
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/search?query=${encodeURIComponent(searchQuery.value)}&page=1&pageSize=20`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    const json = await response.json()
    if (json.data && json.data.matches) {
      searchResults.value = json.data.matches
    }
  } catch (e) {
    console.error('搜索失败', e)
  }
}

/**
 * 查词功能：调用后端词典接口
 * @param word 要查询的单词
 * @param x 鼠标点击的 X 坐标（用于定位弹窗）
 * @param y 鼠标点击的 Y 坐标
 */
const lookupWord = async (word, x, y) => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/dictionary/lookup?word=${word}&language=en`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    })
    
    const json = await response.json()

    if (response.ok && json.data) {
      const data = json.data
      const def = data.definitions?.[0] || {}
      wordPopup.word = data.word || word
      wordPopup.phonetic = data.phonetic || ''
      wordPopup.partOfSpeech = def.partOfSpeech || ''
      wordPopup.definition = def.definition || '暂无释义'
      wordPopup.example = data.examples?.[0]?.example || ''
      wordPopup.notFound = false
      
      // 计算弹窗位置，确保不超出屏幕边界
      const popupWidth = 320
      const popupHeight = 200
      let left = x - popupWidth / 2
      let top = y - popupHeight - 20
      
      if (left < 10) left = 10
      if (left + popupWidth > window.innerWidth - 10) left = window.innerWidth - popupWidth - 10
      if (top < 10) top = y + 20
      
      wordPopup.style = { left: left + 'px', top: top + 'px' }
      wordPopup.show = true
    } else {
      // 未找到单词时的处理
      wordPopup.word = word
      wordPopup.phonetic = ''
      wordPopup.partOfSpeech = ''
      wordPopup.definition = json.message || '未查询到该单词的详细释义'
      wordPopup.example = ''
      wordPopup.notFound = true
      
      const popupWidth = 320
      const popupHeight = 180
      let left = x - popupWidth / 2
      let top = y - popupHeight - 20
      
      if (left < 10) left = 10
      if (left + popupWidth > window.innerWidth - 10) left = window.innerWidth - popupWidth - 10
      if (top < 10) top = y + 20
      
      wordPopup.style = { left: left + 'px', top: top + 'px' }
      wordPopup.show = true
    }
  } catch (e) {
    console.error('查词请求发生异常:', e)
    alert('查词服务暂时不可用')
  }
}

/**
 * 同步阅读进度到后端
 */
const syncProgress = async (page, percent) => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/reading-progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page: page,
        percentage: percent,
        readingTime: 0 
      })
    })
    if (!response.ok) throw new Error(`API response not ok: ${response.status}`)
  } catch (e) {
    console.warn('进度同步失败，更新Mock数据', e)
    await mockDocumentAPI.updateProgress(docId, percent)
  }
}

// --- 交互逻辑函数 ---

/**
 * 处理单词点击事件
 */
const handleWordClick = (event, word) => {
  // 获取包含该单词的段落文本作为上下文例句
  const paragraphText = event.target.parentElement.innerText
  wordPopup.contextExample = paragraphText
  lookupWord(word, event.clientX, event.clientY)
}

/**
 * 点击阅读区域时，处理弹窗关闭和文本选择
 */
const onReadingAreaClick = () => {
  if (wordPopup.show) closeWordPopup()
  
  // 延迟处理选择，确保浏览器已完成选择操作
  setTimeout(() => {
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()
    
    if (selectedText && selectedText.length > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      selectionMenu.text = selectedText
      selectionMenu.range = range
      selectionMenu.style = {
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + window.scrollY - 50}px`
      }
      selectionMenu.show = true
    } else {
      selectionMenu.show = false
    }
  }, 10)
}

/**
 * 创建高亮
 */
const createHighlight = async (color) => {
  if (!selectionMenu.text) return
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/highlights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: selectionMenu.text,
        page: currentPage.value,
        color: color,
        position: {} // 简化处理，实际可存储更精确的位置信息
      })
    })
    
    if (response.ok) {
      // 重新获取笔记和高亮列表
      fetchAllNotes()
      // 清除选择
      window.getSelection().removeAllRanges()
      selectionMenu.show = false
      alert('已添加高亮')
    }
  } catch (e) {
    console.error('添加高亮失败', e)
    alert('添加高亮失败')
  }
}

/**
 * 从选择内容添加笔记
 */
const addNoteFromSelection = async () => {
  const noteContent = prompt('为选中的文本添加笔记:', '')
  if (noteContent === null) return
  
  try {
    // 1. 先创建高亮
    const hlResponse = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/highlights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: selectionMenu.text,
        page: currentPage.value,
        color: 'yellow',
        note: noteContent
      })
    })
    
    if (hlResponse.ok) {
      const hlResult = await hlResponse.json()
      const highlightId = hlResult.data.id
      
      // 2. 创建关联笔记
      await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: noteContent,
          page: currentPage.value,
          highlightId: highlightId
        })
      })
      
      fetchAllNotes()
      window.getSelection().removeAllRanges()
      selectionMenu.show = false
      alert('笔记已保存')
    }
  } catch (e) {
    console.error('保存笔记失败', e)
  }
}

/**
 * 删除笔记或高亮
 */
const deleteNote = async (note) => {
  if (!confirm('确定要删除这条记录吗？')) return
  
  try {
    // 如果是高亮或有关联高亮，先删除高亮
    if (note.highlightId || note.type === 'highlight') {
      const hlId = note.highlightId || note.id
      await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/highlights/${hlId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
    }
    
    // 如果是笔记，删除笔记
    if (note.id && note.type !== 'highlight') {
      await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/notes/${note.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token.value}` }
      })
    }
    
    fetchAllNotes()
    alert('已删除')
  } catch (e) {
    console.error('删除失败', e)
  }
}

/**
 * 将当前查询的单词添加到生词本
 */
const addToVocabulary = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/vocabulary`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: wordPopup.word,
        phonetic: wordPopup.phonetic,
        definition: wordPopup.definition,
        // 优先使用从原文摘取的上下文例句
        example: wordPopup.contextExample || wordPopup.example,
        language: 'en',
        source: docData.title,
        sourcePage: currentPage.value,
        notes: `摘自书籍: ${docData.title}`
      })
    })
    if (response.ok) {
      alert(`已添加 "${wordPopup.word}" 到生词本`)
      closeWordPopup()
    }
  } catch (e) {
    alert('添加失败')
  }
}

/**
 * 添加阅读笔记
 */
const addNote = async () => {
  const content = prompt('输入笔记内容')
  if (!content) return
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reader/documents/${docId}/notes`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, page: currentPage.value })
    })
    if (response.ok) fetchAllNotes()
  } catch (e) {
    alert('笔记保存失败')
  }
}

/**
 * 翻页逻辑
 * @param delta 变化量，1 为下一页，-1 为上一页
 */
const changePage = (delta) => {
  const targetPage = currentPage.value + delta
  if (targetPage >= 1 && (!docData.pageCount || targetPage <= docData.pageCount)) {
    fetchPageContent(targetPage)
    const newProgress = docData.pageCount ? Math.min(100, Math.round((targetPage / docData.pageCount) * 100)) : 0
    docData.readProgress = newProgress 
    syncProgress(targetPage, newProgress)
  }
}

// 跳转到指定章节
const jumpToChapter = (page) => {
  fetchPageContent(page)
  sidebarOpen.toc = false
}

// 跳转到搜索结果所在页
const jumpToResult = (result) => {
  fetchPageContent(result.page)
  showSearch.value = false
}

// 跳转到笔记所在页
const jumpToNote = (note) => {
  fetchPageContent(note.page)
  sidebarOpen.notes = false
}

// 返回书架
const goBack = () => router.push('/bookshelf')

// 切换搜索栏显示
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) { searchQuery.value = ''; searchResults.value = [] }
}

// 切换设置弹窗显示
const toggleSettings = () => showSettings.value = !showSettings.value

/**
 * 切换侧边栏显示
 * @param type 'toc' (目录) 或 'notes' (笔记)
 */
const toggleSidebar = (type) => {
  sidebarOpen[type] = !sidebarOpen[type]
  // 打开一个时关闭另一个
  sidebarOpen[type === 'toc' ? 'notes' : 'toc'] = false
}

const closeWordPopup = () => wordPopup.show = false

// 在必应词典中在线搜索单词
const searchExternal = () => {
  window.open(`https://www.bing.com/dict/search?q=${encodeURIComponent(wordPopup.word)}`, '_blank')
}

// 使用浏览器自带的语音合成引擎朗读单词
const speakWord = () => {
  const utterance = new SpeechSynthesisUtterance(wordPopup.word)
  utterance.lang = 'en-US'
  window.speechSynthesis.speak(utterance)
}

const increaseFontSize = () => fontSize.value = Math.min(fontSize.value + 2, 36)
const decreaseFontSize = () => fontSize.value = Math.max(fontSize.value - 2, 12)
const setTheme = (tId) => theme.value = tId

// 循环切换主题
const toggleTheme = () => {
  const currentIndex = themes.findIndex(t => t.id === theme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  setTheme(themes[nextIndex].id)
}

/**
 * 搜索结果高亮处理
 */
const highlightText = (text) => {
  if (!searchQuery.value) return text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 计算属性：将嵌套的目录结构扁平化，方便在列表中循环显示
 */
const flattenedToc = computed(() => {
  const result = []
  const traverse = (items) => {
    items.forEach(item => {
      result.push({ level: item.level || 1, title: item.title, page: item.page })
      if (item.children && item.children.length > 0) traverse(item.children)
    })
  }
  traverse(toc.value)
  return result
})

/**
 * 生命周期钩子：组件挂载时执行
 */
onMounted(async () => {
  // 初始化主题
  document.documentElement.setAttribute('data-theme', theme.value)
  isLoading.value = true
  
  // 并行获取所有必要数据，提高加载速度
  await Promise.all([
    fetchDocumentMeta(),
    fetchTOC(),
    fetchAllNotes()
  ])
  
  // 获取当前页内容
  await fetchPageContent(currentPage.value)
  
  // 如果是新文档，同步初始进度
  if (docData.readProgress === 0) {
    const initialPercent = docData.pageCount ? Math.max(1, Math.round((currentPage.value / docData.pageCount) * 100)) : 1
    syncProgress(currentPage.value, initialPercent)
    docData.readProgress = initialPercent
  }

  // 路由守卫：离开页面前同步最后一次进度
  onBeforeRouteLeave(async (to, from, next) => {
    await syncProgress(currentPage.value, docData.readProgress)
    next()
  })

  // 处理浏览器关闭或刷新时的进度保存
  const handleBeforeUnload = () => {
    syncProgress(currentPage.value, docData.readProgress)
  }
  window.addEventListener('beforeunload', handleBeforeUnload)

  // 组件卸载时移除事件监听，防止内存泄漏
  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
})
</script>

<style scoped>
/**
 * 阅读器样式部分
 * 使用 CSS 变量实现主题切换
 */
.reader-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  color: var(--text-color-dark);
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow: hidden;
}

/* 顶部工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
  background-color: var(--surface-color);
  box-shadow: var(--shadow-soft);
  z-index: 100;
  transition: transform 0.3s ease;
  border-bottom: 2px solid var(--border-color);
}

.toolbar.hidden {
  transform: translateY(-100%);
}

.icon-btn {
  background: transparent;
  border: none;
  font-size: 1.4rem;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.icon-btn:hover {
  background-color: var(--primary-light);
  transform: scale(1.1);
}

.document-title {
  font-size: 1.2rem;
  color: var(--primary-dark);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}

/* 搜索栏样式 */
.search-bar {
  padding: 1rem 2rem;
  background-color: var(--surface-color);
  border-bottom: 2px solid var(--primary-color);
  position: relative;
  z-index: 90;
}

.search-bar input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-color);
}

.btn-close-search {
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
}

/* 侧边栏通用样式 */
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 300px;
  background-color: var(--surface-color);
  box-shadow: var(--shadow-hard);
  z-index: 200;
  transition: transform 0.3s var(--transition-bounce);
}

.sidebar-toc { left: 0; transform: translateX(-100%); }
.sidebar-notes { right: 0; transform: translateX(100%); }
.sidebar.open { transform: translateX(0); }

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-content {
  padding: 1rem;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.toc-list { list-style: none; padding: 0; }
.toc-list li {
  padding: 0.8rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.toc-list li:hover { background-color: var(--primary-light); }
.toc-list li.active { background-color: var(--primary-color); color: white; }

/* 主阅读区域布局 */
.reader-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.reading-area {
  flex: 1;
  padding: 2rem 1rem;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  max-width: 800px;
  width: 100%;
  padding: 2rem;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-soft);
  height: fit-content;
  min-height: 100%;
}

.paragraph {
  margin-bottom: 1.5em;
  text-align: justify;
}

.word-token {
  display: inline;
  transition: background-color 0.2s;
  border-radius: 3px;
}

.word-token.is-word {
  cursor: pointer;
}

.word-token.is-word:hover {
  background-color: var(--accent-yellow);
  color: black;
}

/* 查词弹窗样式 */
.word-popup {
  position: fixed;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-hard);
  border: 3px solid var(--primary-color);
  padding: 1.2rem;
  width: 320px;
  z-index: 300;
  animation: popIn 0.3s var(--transition-bounce);
}

.word-popup.not-found {
  border-color: var(--text-color-medium);
}

.not-found-message {
  text-align: center;
  padding: 1rem 0;
}

.not-found-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.btn-search-external {
  margin-top: 1rem;
  width: 100%;
  background-color: var(--primary-color);
  color: white;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 1.3rem;
  color: var(--primary-dark);
}

.popup-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-speak, .btn-add-to-vocab {
  flex: 1;
  padding: 6px;
  font-size: 0.9rem;
}

.definition {
  background-color: var(--background-color);
  padding: 0.8rem;
  border-radius: var(--border-radius-sm);
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
}

.pos {
  font-weight: bold;
  color: var(--primary-dark);
  margin-right: 0.5rem;
  font-style: italic;
}

.example {

/* 文本选择菜单样式 */
.selection-menu {
  position: fixed;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-hard);
  display: flex;
  padding: 5px;
  z-index: 1000;
  border: 1px solid var(--border-color);
  transform: translateX(-50%);
  animation: fadeIn 0.2s ease;
}

.menu-btn {
  background: transparent;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
}

.menu-btn:hover {
  background-color: var(--primary-light);
}

.menu-divider {
  width: 1px;
  background-color: var(--border-color);
  margin: 0 5px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

  font-size: 0.85rem;
  color: var(--text-color-medium);
  border-left: 3px solid var(--accent-pink);
  padding-left: 0.8rem;
}

.example-label {
  font-weight: bold;
  font-size: 0.8rem;
  margin-bottom: 2px;
}

/* 底部页码与进度条样式 */
.footer {
  padding: 0.8rem 1.5rem;
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
}

.progress-container {
  max-width: 800px;
  margin: 0 auto;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 0.9rem;
  color: var(--text-color-medium);
}

.nav-btn {
  padding: 6px 15px;
  font-size: 0.9rem;
  background-color: var(--primary-light);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-bar-wrapper {
  height: 6px;
  background-color: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

/* 设置弹窗样式 */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  padding: 2rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.circle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 0;
  background-color: var(--primary-light);
}

.value-display {
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.theme-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 0.5rem;
}

.theme-btn {
  padding: 10px 5px;
  font-size: 0.9rem;
  border: 2px solid transparent;
}

.theme-btn.light { background-color: #fcf8e8; color: #333; }
.theme-btn.dark { background-color: #1a1c2c; color: #f1f2f6; }
.theme-btn.sepia { background-color: #f4ecd8; color: #5b4636; }

.theme-btn.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 10px var(--primary-light);
}

/* 弹窗动画 */
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .toolbar-center { display: none; }
  .content-wrapper { padding: 1.5rem 1rem; border-radius: 0; }
  .reading-area { padding: 0; }
  .sidebar { width: 80%; }
}
</style>