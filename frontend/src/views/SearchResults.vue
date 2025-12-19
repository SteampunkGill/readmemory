<template>
  <div class="search-results">
    <header class="header">
      <div class="search-bar">
        <input
          type="text"
          v-model="query"
          placeholder="搜索文档、生词、笔记..."
          @keyup.enter="handleSearch"
        />
        <button class="btn-search" @click="handleSearch">🔍</button>
      </div>
      <div class="filters">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          :class="{ active: activeFilter === filter.value }"
          @click="setFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>

    <div class="results-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="illustration">⌛</div>
        <p>正在努力搜索中...</p>
      </div>

      <!-- 无结果状态 -->
      <div v-else-if="!hasResults" class="no-results">
        <div class="illustration">🔍</div>
        <h3>未找到结果</h3>
        <p>尝试其他关键词或调整筛选条件</p>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else>
        <section class="result-section" v-if="filteredDocuments.length > 0">
          <h2>📄 文档 ({{ filteredDocuments.length }})</h2>
          <div class="document-list">
            <div
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="document-card"
              @click="openDocument(doc)"
            >
              <div class="doc-icon">📄</div>
              <div class="doc-info">
                <h4>{{ doc.title }}</h4>
                <p>{{ doc.author }} · {{ doc.date }}</p>
                <p class="snippet">{{ doc.snippet }}</p>
              </div>
              <div class="doc-status" :class="doc.status">{{ doc.status }}</div>
            </div>
          </div>
        </section>

        <section class="result-section" v-if="filteredWords.length > 0">
          <h2>📝 生词 ({{ filteredWords.length }})</h2>
          <div class="word-list">
            <div
              v-for="word in filteredWords"
              :key="word.id"
              class="word-card"
              @click="openWord(word)"
            >
              <div class="word">{{ word.word }}</div>
              <div class="phonetic">/{{ word.phonetic || '...' }}/</div>
              <div class="meaning">{{ word.meaning }}</div>
              <div class="source">来自: {{ word.source }}</div>
            </div>
          </div>
        </section>

        <section class="result-section" v-if="filteredNotes.length > 0">
          <h2>📒 笔记 ({{ filteredNotes.length }})</h2>
          <div class="note-list">
            <div
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-card"
              @click="openNote(note)"
            >
              <div class="note-content">
                <p>{{ note.content }}</p>
                <div class="note-meta">
                  <span>📌 {{ note.document }}</span>
                  <span>📅 {{ note.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/multi-word-component-names */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '@/config'

const router = useRouter()
const route = useRoute()

// 模拟数据，用于后端接口不可用时
const mockResults = {
  documents: [
    { id: 1, title: '模拟文档 1', author: '作者 A', date: '2025-12-19', snippet: '这是模拟文档的内容片段...', status: '已导入' }
  ],
  words: [
    { id: 1, word: 'test', phonetic: 'test', meaning: '测试', source: '模拟文档 1' }
  ],
  notes: [
    { id: 1, content: '这是一条模拟笔记', document: '模拟文档 1', date: '2025-12-19' }
  ]
}

const query = ref(route.query.q || '')
const activeFilter = ref('all')
const loading = ref(false)

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '文档', value: 'documents' },
  { label: '生词', value: 'words' },
  { label: '笔记', value: 'notes' }
]

// 组件实际展示的数据
const results = ref({
  documents: [],
  words: [],
  notes: []
})

// 计算是否有任何结果
const hasResults = computed(() => {
  return results.value.documents.length > 0 ||
         results.value.words.length > 0 ||
         results.value.notes.length > 0
})

// UI 过滤逻辑（基于当前 results 状态）
const filteredDocuments = computed(() => {
  return (activeFilter.value === 'all' || activeFilter.value === 'documents') ? results.value.documents : []
})

const filteredWords = computed(() => {
  return (activeFilter.value === 'all' || activeFilter.value === 'words') ? results.value.words : []
})

const filteredNotes = computed(() => {
  return (activeFilter.value === 'all' || activeFilter.value === 'notes') ? results.value.notes : []
})

// 发送 API 搜索请求
const performSearch = async () => {
  if (!query.value.trim()) {
    results.value = { documents: [], words: [], notes: [] }
    return
  }

  loading.value = true
  
  try {
    // 处理前端 filter 到后端 type 的映射 (例如 words -> vocabulary)
    let apiType = activeFilter.value
    if (apiType === 'words') apiType = 'vocabulary'
    
    // 构建 URL
    const url = new URL(`${API_BASE_URL}/search`)
    url.searchParams.append('query', query.value)
    url.searchParams.append('type', apiType)
    url.searchParams.append('pageSize', '20')

    const token = localStorage.getItem('token')

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const json = await response.json()
    
    if (json.success && json.data && json.data.items) {
      // 解析后端 items 并分类存入 results
      const items = json.data.items
      
      results.value = {
        documents: items.filter(i => i.type === 'document').map(i => ({
          id: i.id.replace('doc_', ''),
          title: i.title,
          author: i.author || '未知',
          date: i.createdAt || '最近',
          snippet: i.excerpt || '',
          status: i.status || '已导入'
        })),
        words: items.filter(i => i.type === 'vocabulary').map(i => ({
          id: i.id.replace('word_', ''),
          word: i.word,
          phonetic: i.phonetic || '',
          meaning: i.translation || i.definition || '',
          source: i.source || '未知'
        })),
        notes: items.filter(i => i.type === 'notes' || i.type === 'note').map(i => ({
          id: i.id.replace('note_', ''),
          content: i.content || i.excerpt || '',
          document: i.documentTitle || '关联文档',
          documentId: i.documentId,
          date: i.createdAt || '最近'
        }))
      }
    } else {
      results.value = { documents: [], words: [], notes: [] }
    }
  } catch (error) {
    console.error('搜索请求失败，回退到模拟数据:', error)
    results.value = mockResults
  } finally {
    loading.value = false
  }
}

// 按钮点击处理
const handleSearch = () => {
  if (query.value.trim() === '') {
    results.value = { documents: [], words: [], notes: [] }
    return
  }
  performSearch()
}

const setFilter = (filter) => {
  activeFilter.value = filter
  // 切换筛选时如果已有查询关键词，则重新请求
  if (query.value) {
    performSearch()
  }
}

const openDocument = (doc) => {
  router.push(`/reader/${doc.id}`)
}

const openWord = (word) => {
  router.push(`/dictionary/${word.word}`)
}

const openNote = (note) => {
  if (note.documentId) {
    router.push(`/reader/${note.documentId}`)
  } else {
    console.warn('笔记未关联文档 ID')
  }
}

// 监听路由参数变化
watch(() => route.query.q, (newQ) => {
  if (newQ) {
    query.value = newQ
    performSearch()
  }
})

// 初始化
onMounted(() => {
  if (query.value) {
    performSearch()
  }
})
</script>
<style scoped>
/* 导入字体 */
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Quicksand:wght@400;500;700&display=swap');

/* CSS 变量定义 */
:root {
  /* 色彩方案 */
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色卡片 */
  --primary-color: #87CEEB; /* 天蓝色 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333;
  --text-color-medium: #666666;
  --text-color-light: #999999;
  --border-color: #e0e0e0;
  
  /* 圆角大小 */
  --border-radius-sm: 8px;
  --border-radius-md: 16px;
  --border-radius-lg: 24px;
  --border-radius-xl: 40px;
  
  /* 间距 */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  /* 字体 */
  --font-heading: 'Kalam', cursive;
  --font-body: 'Quicksand', sans-serif;
  
  /* 阴影 */
  --shadow-sm: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.search-results {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: var(--spacing-xl);
  font-family: var(--font-body);
}

/* 头部区域 */
.header {
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 4px solid var(--accent-pink);
  animation: slide-down 0.5s ease-out;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  position: relative;
}

.search-bar input {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 3px solid var(--primary-color);
  border-radius: var(--border-radius-xl);
  font-size: 20px;
  font-family: var(--font-body);
  background-color: var(--surface-color);
  color: var(--text-color-dark);
  outline: none;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.search-bar input:focus {
  box-shadow: 0 0 0 6px rgba(135, 206, 235, 0.4);
  transform: scale(1.02);
  border-color: var(--primary-dark);
}

.search-bar input::placeholder {
  color: var(--text-color-light);
  font-style: italic;
}

.btn-search {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-green));
  border: none;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  color: white;
}

.btn-search:hover {
  transform: translateY(-3px) scale(1.1);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary-dark), #7cd87c);
}

.btn-search:active {
  transform: translateY(0) scale(0.95);
}

/* 筛选器 */
.filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.filters button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 3px solid var(--accent-yellow);
  border-radius: var(--border-radius-lg);
  background-color: var(--surface-color);
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-color-dark);
  position: relative;
  overflow: hidden;
}

.filters button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.filters button:hover::before {
  left: 100%;
}

.filters button:hover {
  transform: translateY(-3px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.filters button.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-dark);
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

/* 结果容器 */
.results-container {
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  border: 4px dashed var(--accent-green);
  box-shadow: var(--shadow-md);
  min-height: 500px;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: var(--spacing-xl);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.loading .illustration {
  font-size: 80px;
  margin-bottom: var(--spacing-md);
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading p {
  font-size: 24px;
  color: var(--primary-color);
  font-weight: bold;
  font-family: var(--font-heading);
}

/* 无结果状态 */
.no-results {
  text-align: center;
  padding: var(--spacing-xl);
}

.no-results .illustration {
  font-size: 80px;
  margin-bottom: var(--spacing-md);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.no-results h3 {
  font-family: var(--font-heading);
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
}

.no-results p {
  font-size: 20px;
  color: var(--text-color-medium);
  max-width: 400px;
  margin: 0 auto;
}

/* 结果区块 */
.result-section {
  margin-bottom: var(--spacing-xl);
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-section h2 {
  font-family: var(--font-heading);
  font-size: 28px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 3px solid var(--accent-yellow);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.result-section h2::after {
  content: '';
  flex: 1;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-yellow), transparent);
  margin-left: var(--spacing-sm);
}

/* 文档列表 */
.document-list,
.word-list,
.note-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 文档卡片 */
.document-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: rgba(173, 216, 230, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--primary-light);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.document-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-yellow));
}

.document-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
  background-color: rgba(135, 206, 235, 0.2);
}

.doc-icon {
  font-size: 48px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-yellow);
  border-radius: 50%;
  color: var(--text-color-dark);
  transition: transform 0.3s ease;
}

.document-card:hover .doc-icon {
  transform: rotate(15deg) scale(1.1);
}

.doc-info {
  flex: 1;
}

.doc-info h4 {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
}

.doc-info p {
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-xs);
  font-size: 16px;
}

.snippet {
  font-style: italic;
  color: var(--text-color-light);
  background-color: rgba(255, 255, 255, 0.5);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid var(--accent-green);
}

.doc-status {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  font-weight: bold;
  font-size: 16px;
  background: linear-gradient(135deg, var(--accent-green), #7cd87c);
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: var(--shadow-sm);
  min-width: 100px;
  text-align: center;
}

/* 生词卡片 */
.word-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: rgba(255, 214, 0, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-yellow);
  cursor: pointer;
  transition: all 0.3s ease;
}

.word-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
  background-color: rgba(255, 214, 0, 0.2);
}

.word {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: bold;
  color: var(--primary-dark);
  min-width: 120px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.phonetic {
  font-size: 18px;
  color: var(--text-color-medium);
  font-style: italic;
  min-width: 120px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.5);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
}

.meaning {
  flex: 1;
  font-size: 20px;
  color: var(--text-color-dark);
  line-height: 1.5;
}

.source {
  font-size: 16px;
  color: var(--text-color-light);
  background-color: rgba(144, 238, 144, 0.3);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  border: 2px dotted var(--accent-green);
}

/* 笔记卡片 */
.note-card {
  padding: var(--spacing-lg);
  background-color: rgba(255, 182, 193, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-pink);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.note-card::before {
  content: '📝';
  position: absolute;
  top: -15px;
  left: -15px;
  font-size: 24px;
  background-color: var(--surface-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--accent-pink);
}

.note-card:hover {
  transform: translateY(-5px) rotate(-1deg);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
  background-color: rgba(255, 182, 193, 0.2);
}

.note-content p {
  font-size: 20px;
  color: var(--text-color-dark);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
  padding-left: var(--spacing-md);
  border-left: 4px solid var(--primary-color);
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color-medium);
  font-size: 16px;
  padding-top: var(--spacing-sm);
  border-top: 2px dashed var(--border-color);
}

.note-meta span {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: rgba(255, 255, 255, 0.5);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-results {
    padding: var(--spacing-md);
  }
  
  .header {
    padding: var(--spacing-md);
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .btn-search {
    width: 100%;
    height: 60px;
    border-radius: var(--border-radius-lg);
  }
  
  .filters {
    gap: var(--spacing-xs);
  }
  
  .filters button {
    flex: 1;
    min-width: calc(50% - var(--spacing-xs));
    font-size: 16px;
    padding: var(--spacing-sm);
  }
  
  .document-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
  
  .doc-icon {
    width: 60px;
    height: 60px;
    font-size: 32px;
  }
  
  .word-card {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
  
  .word,
  .phonetic {
    min-width: auto;
  }
  
  .note-meta {
    flex-direction: column;
    gap: var(--spacing-xs);
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .result-section h2 {
    font-size: 24px;
  }
  
  .doc-info h4 {
    font-size: 20px;
  }
  
  .word {
    font-size: 28px;
  }
  
  .meaning {
    font-size: 18px;
  }
  
  .note-content p {
    font-size: 18px;
  }
}
</style>