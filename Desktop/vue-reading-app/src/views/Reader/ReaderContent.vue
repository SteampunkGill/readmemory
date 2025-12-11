<template>
  <!-- 阅读器内容容器 -->
  <div class="reader-content" ref="contentContainer">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
        <div class="spinner-text">加载中...</div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">😢</div>
      <div class="error-message">{{ error }}</div>
      <AppButton 
        @click="retryLoadContent" 
        class="retry-button"
        variant="primary"
        size="medium"
      >
        重试
      </AppButton>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!currentPage?.content" class="empty-container">
      <div class="empty-icon">📄</div>
      <div class="empty-message">暂无内容</div>
    </div>

    <!-- 内容区域 -->
    <div 
      v-else
      class="content-area"
      :class="contentClasses"
      :style="contentStyles"
      ref="contentArea"
      @click="handleContentClick"
      @mouseup="handleTextSelection"
      @scroll="handleScroll"
    >
      <!-- 页面标题 -->
      <div v-if="showPageTitle" class="page-title">
        <h2>{{ pageTitle }}</h2>
      </div>

      <!-- 内容渲染 -->
      <div 
        v-if="currentPage.htmlContent"
        class="html-content"
        v-html="currentPage.htmlContent"
        ref="htmlContent"
      ></div>
      <div 
        v-else
        class="text-content"
        ref="textContent"
      >
        <div 
          v-for="(paragraph, index) in formattedParagraphs" 
          :key="index"
          class="paragraph"
          :data-paragraph-index="index"
        >
          {{ paragraph }}
        </div>
      </div>

      <!-- 高亮覆盖层 -->
      <div 
        v-if="currentPageHighlights.length > 0 && readerSettings.showHighlights"
        class="highlights-overlay"
        ref="highlightsOverlay"
      >
        <div 
          v-for="highlight in currentPageHighlights" 
          :key="highlight.id"
          class="highlight-element"
          :data-highlight-id="highlight.id"
          :style="getHighlightStyle(highlight)"
          @click.stop="handleHighlightClick(highlight)"
          :title="highlight.note || '点击查看详情'"
        ></div>
      </div>

      <!-- 笔记标记 -->
      <div 
        v-if="currentPageNotes.length > 0 && readerSettings.showNotes"
        class="notes-marker-overlay"
        ref="notesMarkerOverlay"
      >
        <div 
          v-for="note in currentPageNotes" 
          :key="note.id"
          class="note-marker"
          :data-note-id="note.id"
          :style="getNoteMarkerStyle(note)"
          @click.stop="handleNoteMarkerClick(note)"
          :title="'笔记: ' + (note.content.length > 20 ? note.content.substring(0, 20) + '...' : note.content)"
        >
          <span class="marker-icon">📝</span>
        </div>
      </div>

      <!-- 选择工具栏 -->
      <div 
        v-if="showSelectionToolbar"
        class="selection-toolbar"
        :style="selectionToolbarStyle"
        ref="selectionToolbar"
      >
        <div class="toolbar-content">
          <button 
            class="toolbar-button highlight-button"
            @click="addHighlightFromSelection"
            title="添加高亮"
          >
            <span class="button-icon">🖍️</span>
            <span class="button-text">高亮</span>
          </button>
          
          <button 
            class="toolbar-button note-button"
            @click="addNoteFromSelection"
            title="添加笔记"
          >
            <span class="button-icon">📝</span>
            <span class="button-text">笔记</span>
          </button>
          
          <button 
            class="toolbar-button lookup-button"
            @click="lookupSelectedText"
            title="查词"
          >
            <span class="button-icon">🔍</span>
            <span class="button-text">查词</span>
          </button>
          
          <button 
            class="toolbar-button close-button"
            @click="clearSelection"
            title="关闭"
          >
            <span class="button-icon">✕</span>
          </button>
        </div>
      </div>

      <!-- 页面导航 -->
      <div v-if="showPageNavigation" class="page-navigation">
        <button 
          v-if="currentPage.prevPage"
          class="nav-button prev-button"
          @click="goToPage(currentPage.prevPage)"
          :disabled="loading"
        >
          <span class="nav-icon">←</span>
          <span class="nav-text">上一页</span>
        </button>
        
        <div class="page-info">
          <span class="current-page">第 {{ currentPageNumber }} 页</span>
          <span v-if="totalPages" class="total-pages">/ {{ totalPages }} 页</span>
        </div>
        
        <button 
          v-if="currentPage.nextPage"
          class="nav-button next-button"
          @click="goToPage(currentPage.nextPage)"
          :disabled="loading"
        >
          <span class="nav-text">下一页</span>
          <span class="nav-icon">→</span>
        </button>
      </div>
    </div>

    <!-- 阅读进度条 -->
    <div v-if="showProgressBar" class="reading-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: readingProgress + '%' }"
        ></div>
      </div>
      <div class="progress-text">
        {{ readingProgress }}% 已读
      </div>
    </div>

    <!-- 词典查询弹窗 -->
    <AppModal
      v-if="showDictionaryModal"
      :show="showDictionaryModal"
      @close="closeDictionaryModal"
      :title="`词典查询 - ${lookupWord}`"
      size="medium"
    >
      <template #default>
        <div class="dictionary-modal-content">
          <div v-if="dictionaryLoading" class="dictionary-loading">
            <div class="loading-spinner small"></div>
            <div>查询中...</div>
          </div>
          <div v-else-if="dictionaryError" class="dictionary-error">
            <div class="error-icon">😕</div>
            <div>{{ dictionaryError }}</div>
          </div>
          <div v-else-if="dictionaryResult" class="dictionary-result">
            <!-- 使用实际的词典查询结果 -->
            <div v-if="dictionaryResult.word" class="word-header">
              <h3 class="word">{{ dictionaryResult.word }}</h3>
              <div v-if="dictionaryResult.phonetic" class="phonetic">
                {{ dictionaryResult.phonetic }}
              </div>
              <button 
                class="pronounce-button"
                @click="pronounceWord(dictionaryResult.word)"
                title="发音"
              >
                🔊
              </button>
            </div>
            
            <div v-if="dictionaryResult.definitions?.length" class="definitions">
              <div 
                v-for="(definition, index) in dictionaryResult.definitions" 
                :key="index"
                class="definition-item"
              >
                <div v-if="definition.partOfSpeech" class="part-of-speech">
                  {{ definition.partOfSpeech }}
                </div>
                <div v-if="definition.meaning" class="meaning">
                  {{ definition.meaning }}
                </div>
                <div v-if="definition.example" class="example">
                  "{{ definition.example }}"
                </div>
              </div>
            </div>
            
            <div v-if="dictionaryResult.synonyms?.length" class="synonyms">
              <strong>同义词:</strong>
              <span class="synonym-list">
                {{ dictionaryResult.synonyms.join(', ') }}
              </span>
            </div>
            
            <div v-if="dictionaryResult.examples?.length" class="examples">
              <strong>例句:</strong>
              <div 
                v-for="(example, index) in dictionaryResult.examples" 
                :key="index"
                class="example-item"
              >
                {{ example }}
              </div>
            </div>
            
            <div class="dictionary-actions">
              <AppButton 
                @click="addToVocabulary(dictionaryResult.word)"
                variant="secondary"
                size="small"
              >
                📚 添加到生词本
              </AppButton>
              <AppButton 
                @click="closeDictionaryModal"
                variant="outline"
                size="small"
              >
                关闭
              </AppButton>
            </div>
          </div>
          <div v-else class="dictionary-empty">
            <div class="empty-icon">📖</div>
            <div>未找到该单词的释义</div>
          </div>
        </div>
      </template>
    </AppModal>

    <!-- 笔记编辑弹窗 -->
    <AppModal
      v-if="showNoteEditor"
      :show="showNoteEditor"
      @close="closeNoteEditor"
      :title="editingNote ? '编辑笔记' : '添加笔记'"
      size="small"
    >
      <template #default>
        <div class="note-editor-content">
          <div class="selected-text" v-if="selectedText">
            <strong>选中的文本:</strong>
            <div class="text-preview">"{{ selectedText }}"</div>
          </div>
          
          <div class="form-group">
            <label for="note-content">笔记内容:</label>
            <textarea
              id="note-content"
              v-model="noteContent"
              placeholder="输入你的笔记..."
              rows="4"
              class="note-textarea"
            ></textarea>
          </div>
          
          <div class="form-group" v-if="!editingNote">
            <label>关联高亮:</label>
            <div class="highlight-options">
              <label class="option">
                <input
                  type="radio"
                  v-model="noteOptions.attachToHighlight"
                  :value="true"
                >
                创建新高亮
              </label>
              <label class="option">
                <input
                  type="radio"
                  v-model="noteOptions.attachToHighlight"
                  :value="false"
                >
                仅添加笔记
              </label>
            </div>
          </div>
          
          <div class="editor-actions">
            <AppButton 
              @click="saveNote"
              variant="primary"
              :disabled="!noteContent.trim()"
            >
              {{ editingNote ? '更新' : '保存' }}
            </AppButton>
            <AppButton 
              @click="closeNoteEditor"
              variant="outline"
            >
              取消
            </AppButton>
            <AppButton 
              v-if="editingNote"
              @click="deleteNote"
              variant="danger"
              size="small"
            >
              删除
            </AppButton>
          </div>
        </div>
      </template>
    </AppModal>

    <!-- 高亮详情弹窗 -->
    <AppModal
      v-if="showHighlightDetail"
      :show="showHighlightDetail"
      @close="closeHighlightDetail"
      title="高亮详情"
      size="small"
    >
      <template #default>
        <div class="highlight-detail-content">
          <div class="highlighted-text">
            <div class="text-label">高亮文本:</div>
            <div class="text-content">{{ selectedHighlight?.text }}</div>
          </div>
          
          <div class="highlight-note" v-if="selectedHighlight?.note">
            <div class="note-label">笔记:</div>
            <div class="note-content">{{ selectedHighlight.note }}</div>
          </div>
          
          <div class="highlight-info">
            <div class="info-item">
              <span class="info-label">颜色:</span>
              <span class="color-indicator" :style="{ backgroundColor: selectedHighlight?.color }"></span>
              <span class="color-name">{{ getColorName(selectedHighlight?.color) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间:</span>
              <span>{{ selectedHighlight?.createdAt }}</span>
            </div>
          </div>
          
          <div class="highlight-actions">
            <AppButton 
              @click="editHighlightNote"
              variant="secondary"
              size="small"
            >
              📝 编辑笔记
            </AppButton>
            <AppButton 
              @click="deleteHighlight"
              variant="danger"
              size="small"
            >
              删除
            </AppButton>
            <AppButton 
              @click="closeHighlightDetail"
              variant="outline"
              size="small"
            >
              关闭
            </AppButton>
          </div>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import readerService from '@/services/reader.service.js'
import vocabularyService from '@/services/vocabulary.service.js' // 导入词汇服务
import { useReaderStore } from '@/stores/reader.store.js'
import { useVocabularyStore } from '@/stores/vocabulary.store.js'
import { formatDate } from '@/utils/formatter.js'

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const readerStore = useReaderStore()
const vocabularyStore = useVocabularyStore()

// 响应式引用
const contentContainer = ref(null)
const contentArea = ref(null)
const htmlContent = ref(null)
const textContent = ref(null)
const highlightsOverlay = ref(null)
const notesMarkerOverlay = ref(null)
const selectionToolbar = ref(null)

// 状态
const loading = ref(false)
const error = ref(null)
const showSelectionToolbar = ref(false)
const selectionToolbarStyle = ref({})
const selectedText = ref('')
const selectionRange = ref(null)

// 弹窗状态
const showDictionaryModal = ref(false)
const dictionaryLoading = ref(false)
const dictionaryError = ref(null)
const dictionaryResult = ref(null)
const lookupWord = ref('')

const showNoteEditor = ref(false)
const noteContent = ref('')
const editingNote = ref(null)
const noteOptions = ref({
  attachToHighlight: true
})

const showHighlightDetail = ref(false)
const selectedHighlight = ref(null)

// 计算属性
const currentPage = computed(() => readerStore.currentPage)
const currentPageNumber = computed(() => readerStore.currentPageNumber)
const currentDocumentId = computed(() => readerStore.currentDocumentId)
const currentPageHighlights = computed(() => readerStore.currentPageHighlights)
const currentPageNotes = computed(() => readerStore.currentPageNotes)
const readerSettings = computed(() => readerStore.settings)

const contentClasses = computed(() => ({
  'theme-light': readerSettings.value.theme === 'light',
  'theme-dark': readerSettings.value.theme === 'dark',
  'theme-sepia': readerSettings.value.theme === 'sepia',
  'show-highlights': readerSettings.value.showHighlights,
  'show-notes': readerSettings.value.showNotes
}))

const contentStyles = computed(() => ({
  fontSize: `${readerSettings.value.fontSize}px`,
  lineHeight: readerSettings.value.lineHeight,
  fontFamily: readerSettings.value.fontFamily
}))

const formattedParagraphs = computed(() => {
  if (!currentPage.value?.content) return []
  return currentPage.value.content.split('\n').filter(p => p.trim())
})

const pageTitle = computed(() => {
  const doc = readerStore.currentDocument
  return doc?.title ? `${doc.title} - 第 ${currentPageNumber.value} 页` : `第 ${currentPageNumber.value} 页`
})

const showPageTitle = computed(() => readerSettings.value.showPageTitle !== false)
const showPageNavigation = computed(() => readerSettings.value.showNavigation !== false)
const showProgressBar = computed(() => readerSettings.value.showProgressBar !== false)

const readingProgress = computed(() => {
  const doc = readerStore.currentDocument
  return doc?.readProgress || Math.round((currentPageNumber.value / (doc?.pageCount || 100)) * 100)
})

const totalPages = computed(() => {
  const doc = readerStore.currentDocument
  return doc?.pageCount || 0
})

// 方法
const loadPageContent = async (pageNumber = null) => {
  try {
    loading.value = true
    error.value = null
    
    const documentId = route.params.documentId || currentDocumentId.value
    const page = pageNumber || parseInt(route.params.page) || 1
    
    if (!documentId) {
      throw new Error('文档ID不存在')
    }
    
    await readerService.getPageContent(documentId, page)
    
  } catch (err) {
    error.value = err.message || '加载内容失败'
    console.error('加载页面内容失败:', err)
  } finally {
    loading.value = false
  }
}

const retryLoadContent = () => {
  loadPageContent()
}

const goToPage = async (pageNumber) => {
  if (pageNumber < 1) return
  
  const documentId = route.params.documentId || currentDocumentId.value
  if (!documentId) return
  
  // 更新路由
  router.push({
    name: 'Reader',
    params: { 
      documentId,
      page: pageNumber 
    }
  })
  
  // 加载新页面内容
  await loadPageContent(pageNumber)
  
  // 滚动到顶部
  if (contentArea.value) {
    contentArea.value.scrollTop = 0
  }
}

const handleContentClick = (event) => {
  // 如果点击的是链接，阻止默认行为并处理
  if (event.target.tagName === 'A') {
    event.preventDefault()
    const href = event.target.getAttribute('href')
    if (href) {
      // 处理内部链接（如锚点）
      if (href.startsWith('#')) {
        const anchor = href.substring(1)
        scrollToAnchor(anchor)
      }
    }
  }
}

const handleTextSelection = () => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) {
    clearSelection()
    return
  }
  
  const selectedTextStr = selection.toString().trim()
  if (!selectedTextStr || selectedTextStr.length < 1) {
    clearSelection()
    return
  }
  
  selectedText.value = selectedTextStr
  selectionRange.value = selection.getRangeAt(0)
  
  // 计算工具栏位置
  updateSelectionToolbarPosition()
  showSelectionToolbar.value = true
}

const updateSelectionToolbarPosition = () => {
  if (!selectionRange.value || !selectionToolbar.value) return
  
  const rangeRect = selectionRange.value.getBoundingClientRect()
  const containerRect = contentContainer.value.getBoundingClientRect()
  
  // 计算工具栏位置（在选中文本上方）
  const top = rangeRect.top - containerRect.top - 50
  const left = rangeRect.left - containerRect.left + (rangeRect.width / 2) - 100
  
  selectionToolbarStyle.value = {
    top: `${Math.max(10, top)}px`,
    left: `${Math.max(10, Math.min(left, containerRect.width - 220))}px`
  }
}

const clearSelection = () => {
  window.getSelection().removeAllRanges()
  showSelectionToolbar.value = false
  selectedText.value = ''
  selectionRange.value = null
}

const addHighlightFromSelection = async () => {
  if (!selectedText.value || !selectionRange.value) return
  
  try {
    const documentId = currentDocumentId.value
    const page = currentPageNumber.value
    
    // 获取选中文本的位置信息
    const position = getSelectionPosition(selectionRange.value)
    
    await readerService.addHighlight(documentId, {
      text: selectedText.value,
      page,
      position,
      color: 'yellow' // 默认颜色
    })
    
    clearSelection()
  } catch (err) {
    console.error('添加高亮失败:', err)
  }
}

const addNoteFromSelection = () => {
  if (!selectedText.value) return
  
  noteContent.value = ''
  editingNote.value = null
  showNoteEditor.value = true
}

const lookupSelectedText = async () => {
  if (!selectedText.value) return
  
  // 提取单词（只取第一个单词）
  const words = selectedText.value.split(/\s+/)
  const word = words[0].replace(/[^\w'-]/g, '')
  
  if (!word) return
  
  await lookupWordInDictionary(word)
  clearSelection()
}

const lookupWordInDictionary = async (word) => {
  try {
    dictionaryLoading.value = true
    dictionaryError.value = null
    lookupWord.value = word
    
    // 使用实际的词典查询服务 - vocabularyService.lookupWord
    const wordDetail = await vocabularyService.lookupWord(word, 'en', {
      forceRefresh: false,
      addToHistory: true
    })
    
    // 格式化词典查询结果
    dictionaryResult.value = {
      word: wordDetail.word,
      phonetic: wordDetail.phonetic || '',
      definitions: wordDetail.definitions?.map(def => ({
        partOfSpeech: def.partOfSpeech || '',
        meaning: def.meaning || def.definition || '',
        example: def.example || ''
      })) || [],
      synonyms: wordDetail.synonyms || [],
      examples: wordDetail.examples || []
    }
    
    showDictionaryModal.value = true
  } catch (err) {
    dictionaryError.value = err.message || '查询失败'
    console.error('词典查询失败:', err)
  } finally {
    dictionaryLoading.value = false
  }
}

const pronounceWord = (word) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  } else {
    alert('您的浏览器不支持语音合成功能')
  }
}

const addToVocabulary = async (word) => {
  try {
    // 使用词汇服务添加单词
    await vocabularyService.addToVocabulary({
      word: word,
      definition: dictionaryResult.value?.definitions[0]?.meaning || '',
      example: dictionaryResult.value?.examples?.[0] || '',
      phonetic: dictionaryResult.value?.phonetic || '',
      source: '阅读器查词',
      sourceDocumentId: currentDocumentId.value,
      sourcePage: currentPageNumber.value,
      tags: ['reading']
    })
    
    // 显示成功提示
    alert(`"${word}" 已添加到生词本！`)
  } catch (err) {
    console.error('添加到生词本失败:', err)
    alert('添加到生词本失败，请重试')
  }
}

const saveNote = async () => {
  if (!noteContent.value.trim()) return
  
  try {
    const documentId = currentDocumentId.value
    const page = currentPageNumber.value
    
    if (editingNote.value) {
      // 更新现有笔记
      await readerService.updateNote(documentId, editingNote.value.id, {
        content: noteContent.value
      })
    } else {
      // 创建新笔记
      const noteData = {
        content: noteContent.value,
        page
      }
      
      // 如果有选中文本，添加位置信息
      if (selectedText.value && selectionRange.value) {
        noteData.position = getSelectionPosition(selectionRange.value)
      }
      
      // 如果关联高亮，先创建高亮
      if (noteOptions.value.attachToHighlight && selectedText.value) {
        const highlight = await readerService.addHighlight(documentId, {
          text: selectedText.value,
          page,
          position: noteData.position,
          color: 'blue',
          note: noteContent.value // 将笔记内容也保存到高亮中
        })
        noteData.highlightId = highlight.id
      }
      
      await readerService.addNote(documentId, noteData)
    }
    
    closeNoteEditor()
    clearSelection()
  } catch (err) {
    console.error('保存笔记失败:', err)
    alert('保存笔记失败，请重试')
  }
}

const deleteNote = async () => {
  if (!editingNote.value) return
  
  if (confirm('确定要删除这个笔记吗？')) {
    try {
      await readerService.deleteNote(currentDocumentId.value, editingNote.value.id)
      closeNoteEditor()
    } catch (err) {
      console.error('删除笔记失败:', err)
      alert('删除笔记失败，请重试')
    }
  }
}

const handleHighlightClick = (highlight) => {
  selectedHighlight.value = highlight
  showHighlightDetail.value = true
}

const editHighlightNote = async () => {
  if (!selectedHighlight.value) return
  
  try {
    const newNote = prompt('请输入新的笔记内容:', selectedHighlight.value.note || '')
    if (newNote !== null) {
      await readerService.updateHighlight(
        currentDocumentId.value,
        selectedHighlight.value.id,
        { note: newNote }
      )
      
      // 更新本地状态
      readerStore.updateHighlight(selectedHighlight.value.id, {
        note: newNote
      })
      
      alert('笔记已更新')
      closeHighlightDetail()
    }
  } catch (err) {
    console.error('更新高亮笔记失败:', err)
    alert('更新失败，请重试')
  }
}

const deleteHighlight = async () => {
  if (!selectedHighlight.value) return
  
  if (confirm('确定要删除这个高亮吗？')) {
    try {
      await readerService.deleteHighlight(currentDocumentId.value, selectedHighlight.value.id)
      closeHighlightDetail()
    } catch (err) {
      console.error('删除高亮失败:', err)
      alert('删除失败，请重试')
    }
  }
}

const handleNoteMarkerClick = (note) => {
  // 跳转到笔记位置
  if (note.position) {
    scrollToPosition(note.position)
  }
  
  // 显示笔记详情
  editingNote.value = note
  noteContent.value = note.content
  showNoteEditor.value = true
}

const getHighlightStyle = (highlight) => {
  const colorMap = {
    yellow: 'rgba(255, 235, 59, 0.3)',
    blue: 'rgba(33, 150, 243, 0.3)',
    green: 'rgba(76, 175, 80, 0.3)',
    pink: 'rgba(233, 30, 99, 0.3)',
    orange: 'rgba(255, 152, 0, 0.3)',
    purple: 'rgba(156, 39, 176, 0.3)'
  }
  
  const color = colorMap[highlight.color] || colorMap.yellow
  
  if (highlight.position) {
    return {
      position: 'absolute',
      top: `${highlight.position.top || 0}px`,
      left: `${highlight.position.left || 0}px`,
      width: `${highlight.position.width || 100}px`,
      height: `${highlight.position.height || 20}px`,
      backgroundColor: color,
      border: `2px solid ${color.replace('0.3', '0.7')}`,
      borderRadius: '8px',
      pointerEvents: 'auto',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }
  
  return { backgroundColor: color }
}

const getNoteMarkerStyle = (note) => {
  if (note.position) {
    return {
      position: 'absolute',
      top: `${note.position.top || 0}px`,
      left: `${note.position.left || 0}px`,
      cursor: 'pointer',
      zIndex: 5
    }
  }
  
  return {}
}

const getColorName = (color) => {
  const colorNames = {
    yellow: '黄色',
    blue: '蓝色',
    green: '绿色',
    pink: '粉色',
    orange: '橙色',
    purple: '紫色'
  }
  
  return colorNames[color] || color
}

const getSelectionPosition = (range) => {
  if (!contentArea.value) return {}
  
  const rect = range.getBoundingClientRect()
  const containerRect = contentArea.value.getBoundingClientRect()
  
  return {
    top: rect.top - containerRect.top,
    left: rect.left - containerRect.left,
    width: rect.width,
    height: rect.height
  }
}

const scrollToAnchor = (anchorId) => {
  const element = document.getElementById(anchorId)
  if (element && contentArea.value) {
    contentArea.value.scrollTop = element.offsetTop - 20
  }
}

const scrollToPosition = (position) => {
  if (contentArea.value && position?.top) {
    contentArea.value.scrollTop = position.top - 50
  }
}

const handleScroll = () => {
  // 自动保存阅读位置
  if (contentArea.value) {
    const scrollPercent = (contentArea.value.scrollTop / (contentArea.value.scrollHeight - contentArea.value.clientHeight)) * 100
    
    // 防抖处理，避免频繁调用
    if (scrollPercent > 0 && currentDocumentId.value) {
      debouncedSaveScrollPosition(scrollPercent)
    }
  }
}

const saveScrollPosition = async (scrollPercent) => {
  try {
    await readerService.updateReadingProgress(currentDocumentId.value, {
      page: currentPageNumber.value,
      percentage: Math.round(scrollPercent),
      readingTime: readerStore.readingTime
    }, false) // 不立即更新，使用防抖
  } catch (err) {
    console.error('保存阅读进度失败:', err)
  }
}

// 防抖函数
const debouncedSaveScrollPosition = debounce(saveScrollPosition, 1000)

const closeDictionaryModal = () => {
  showDictionaryModal.value = false
  dictionaryResult.value = null
  lookupWord.value = ''
}

const closeNoteEditor = () => {
  showNoteEditor.value = false
  noteContent.value = ''
  editingNote.value = null
}

const closeHighlightDetail = () => {
  showHighlightDetail.value = false
  selectedHighlight.value = null
}

// 生命周期
onMounted(() => {
  loadPageContent()
  
  // 监听路由变化
  watch(
    () => route.params.page,
    (newPage) => {
      if (newPage) {
        loadPageContent(parseInt(newPage))
      }
    }
  )
  
  // 监听窗口大小变化，更新工具栏位置
  window.addEventListener('resize', updateSelectionToolbarPosition)
  window.addEventListener('scroll', updateSelectionToolbarPosition)
  
  // 点击其他地方关闭选择工具栏
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSelectionToolbarPosition)
  window.removeEventListener('scroll', updateSelectionToolbarPosition)
  document.removeEventListener('click', handleDocumentClick)
  
  // 结束阅读会话
  if (currentDocumentId.value) {
    readerService.endReadingSession(currentDocumentId.value)
  }
})

// 工具函数
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

function handleDocumentClick(event) {
  // 如果点击的不是选择工具栏或内容区域，关闭工具栏
  if (showSelectionToolbar.value && 
      !selectionToolbar.value?.contains(event.target) &&
      !contentArea.value?.contains(event.target)) {
    clearSelection()
  }
}
</script>

<style scoped>
.reader-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-background);
  border-radius: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.loading-spinner {
  text-align: center;
}

.spinner-circle {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border: 4px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-text {
  font-family: 'Comfortaa', cursive;
  color: var(--color-text-secondary);
  font-size: 18px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 32px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.error-message {
  font-family: 'Comfortaa', cursive;
  font-size: 20px;
  color: var(--color-error);
  margin-bottom: 32px;
  max-width: 400px;
}

.retry-button {
  padding: 12px 32px;
  font-size: 18px;
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-message {
  font-family: 'Comfortaa', cursive;
  font-size: 24px;
  color: var(--color-text-secondary);
}

/* 内容区域 */
.content-area {
  position: relative;
  width: 100%;
  height: calc(100% - 60px);
  overflow-y: auto;
  padding: 32px;
  transition: all 0.3s ease;
}

.content-area.theme-light {
  background-color: #ffffff;
  color: #333333;
}

.content-area.theme-dark {
  background-color: #1a1a1a;
  color: #f0f0f0;
}

.content-area.theme-sepia {
  background-color: #f8f0e3;
  color: #5c4b37;
}

/* 页面标题 */
.page-title {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 3px dashed var(--color-primary-light);
}

.page-title h2 {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  color: var(--color-primary);
  margin: 0;
}

/* 文本内容 */
.text-content {
  line-height: inherit;
}

.paragraph {
  margin-bottom: 24px;
  text-align: justify;
  transition: background-color 0.2s ease;
}

.paragraph:hover {
  background-color: rgba(var(--color-primary-rgb), 0.05);
}

/* HTML 内容 */
.html-content {
  line-height: inherit;
}

.html-content :deep(p) {
  margin-bottom: 24px;
  text-align: justify;
}

.html-content :deep(h1),
.html-content :deep(h2),
.html-content :deep(h3) {
  font-family: 'Kalam', cursive;
  color: var(--color-primary);
  margin-top: 32px;
  margin-bottom: 16px;
}

.html-content :deep(a) {
  color: var(--color-secondary);
  text-decoration: none;
  border-bottom: 2px dotted var(--color-secondary-light);
  transition: all 0.2s ease;
}

.html-content :deep(a:hover) {
  color: var(--color-secondary-dark);
  border-bottom-style: solid;
}

/* 高亮覆盖层 */
.highlights-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.highlight-element {
  position: absolute;
  border-radius: 8px;
  transition: all 0.2s ease;
  z-index: 2;
}

.highlight-element:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 笔记标记 */
.notes-marker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.note-marker {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  z-index: 4;
}

.marker-icon {
  font-size: 24px;
  display: block;
  transition: all 0.2s ease;
}

.marker-icon:hover {
  transform: scale(1.2) rotate(10deg);
}

/* 选择工具栏 */
.selection-toolbar {
  position: absolute;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 1000;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 16px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toolbar-button.highlight-button:hover {
  background-color: rgba(255, 235, 59, 0.2);
  color: #f57c00;
}

.toolbar-button.note-button:hover {
  background-color: rgba(33, 150, 243, 0.2);
  color: #1976d2;
}

.toolbar-button.lookup-button:hover {
  background-color: rgba(76, 175, 80, 0.2);
  color: #388e3c;
}

.toolbar-button.close-button {
  padding: 8px;
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.toolbar-button.close-button:hover {
  background-color: rgba(244, 67, 54, 0.2);
}

.button-icon {
  margin-right: 6px;
  font-size: 16px;
}

/* 页面导航 */
.page-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 2px dashed var(--color-border);
}

.nav-button {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  background-color: var(--color-primary-light);
  color: white;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-button:hover:not(:disabled) {
  background-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.3);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 20px;
  margin: 0 8px;
}

.page-info {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: var(--color-text-secondary);
}

.current-page {
  font-weight: bold;
  color: var(--color-primary);
}

/* 阅读进度条 */
.reading-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: white;
  border-top: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 32px;
  z-index: 10;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background-color: var(--color-background);
  border-radius: 6px;
  overflow: hidden;
  margin-right: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary-light), var(--color-primary));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: var(--color-text-secondary);
  min-width: 100px;
  text-align: right;
}

/* 词典弹窗 */
.dictionary-modal-content {
  padding: 20px;
}

.dictionary-loading,
.dictionary-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.dictionary-loading .loading-spinner.small {
  width: 40px;
  height: 40px;
  border-width: 3px;
  margin-bottom: 16px;
}

.dictionary-error .error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.word-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
}

.word {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  margin: 0;
  margin-right: 16px;
  color: var(--color-primary);
}

.phonetic {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: var(--color-text-secondary);
  margin-right: 16px;
}

.pronounce-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.pronounce-button:hover {
  background-color: var(--color-background);
  transform: scale(1.1);
}

.definitions {
  margin-bottom: 24px;
}

.definition-item {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--color-background);
  border-radius: 16px;
  border-left: 4px solid var(--color-secondary);
}

.part-of-speech {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: var(--color-secondary);
  margin-bottom: 8px;
  font-size: 16px;
}

.meaning {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.example {
  font-style: italic;
  color: var(--color-text-secondary);
  padding-left: 12px;
  border-left: 2px solid var(--color-border);
}

.synonyms {
  margin-bottom: 24px;
  padding: 16px;
  background-color: rgba(var(--color-success-rgb), 0.1);
  border-radius: 16px;
}

.synonym-list {
  margin-left: 12px;
  font-family: 'Comfortaa', cursive;
}

.dictionary-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 笔记编辑器 */
.note-editor-content {
  padding: 20px;
}

.selected-text {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--color-background);
  border-radius: 16px;
  border: 2px dashed var(--color-border);
}

.text-preview {
  margin-top: 8px;
  padding: 12px;
  background-color: white;
  border-radius: 12px;
  font-style: italic;
  color: var(--color-text-secondary);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--color-text);
}

.note-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--color-border);
  border-radius: 20px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  resize: vertical;
  transition: all 0.2s ease;
}

.note-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.highlight-options {
  display: flex;
  gap: 20px;
}

.option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: 'Comfortaa', cursive;
}

.option input {
  margin-right: 8px;
}

.editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 高亮详情 */
.highlight-detail-content {
  padding: 20px;
}

.highlighted-text,
.highlight-note {
  margin-bottom: 24px;
  padding: 20px;
  background-color: var(--color-background);
  border-radius: 20px;
}

.text-label,
.note-label {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  font-size: 14px;
}

.text-content {
  font-size: 18px;
  line-height: 1.6;
  padding: 12px;
  background-color: white;
  border-radius: 12px;
  border-left: 4px solid var(--color-warning);
}

.note-content {
  font-size: 16px;
  line-height: 1.6;
  padding: 12px;
  background-color: white;
  border-radius: 12px;
}

.highlight-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
}

.info-label {
  font-weight: bold;
  color: var(--color-text-secondary);
  min-width: 80px;
}

.color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
}

.color-name {
  font-weight: bold;
}

.highlight-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-area {
    padding: 20px;
  }
  
  .page-title h2 {
    font-size: 24px;
  }
  
  .page-navigation {
    flex-direction: column;
    gap: 16px;
  }
  
  .nav-button {
    width: 100%;
    justify-content: center;
  }
  
  .reading-progress {
    padding: 0 20px;
  }
  
  .progress-text {
    min-width: 80px;
    font-size: 14px;
  }
  
  .selection-toolbar {
    transform: scale(0.9);
    transform-origin: bottom center;
  }
  
  .toolbar-content {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 16px;
  }
  
  .page-title h2 {
    font-size: 20px;
  }
  
  .reading-progress {
    flex-direction: column;
    height: 80px;
    justify-content: center;
    gap: 8px;
  }
  
  .progress-bar {
    width: 100%;
    margin-right: 0;
  }
  
  .progress-text {
    text-align: center;
  }
}
</style>