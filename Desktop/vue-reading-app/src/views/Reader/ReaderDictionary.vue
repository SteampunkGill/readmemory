<template>
  <!-- 词典查询组件 -->
  <div class="reader-dictionary" :class="{ 'is-visible': isVisible }">
    <!-- 遮罩层 -->
    <div v-if="isVisible" class="dictionary-overlay" @click="closeDictionary"></div>
    
    <!-- 词典面板 -->
    <div class="dictionary-panel" :class="{ 'is-loading': isLoading }">
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeDictionary" aria-label="关闭词典">
        <span class="close-icon">✕</span>
      </button>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在查询单词...</p>
      </div>
      
      <!-- 单词详情 -->
      <div v-else-if="currentWord" class="word-details">
        <!-- 单词标题区域 -->
        <div class="word-header">
          <h2 class="word-title">{{ currentWord.word }}</h2>
          
          <!-- 音标和发音 -->
          <div class="word-pronunciation">
            <span v-if="currentWord.phonetic" class="phonetic">
              /{{ currentWord.phonetic }}/
            </span>
            
            <!-- 发音按钮 -->
            <button 
              v-if="currentWord.audioUrl" 
              class="pronounce-btn"
              @click="playPronunciation"
              :disabled="isPlayingAudio"
              aria-label="播放发音"
            >
              <span class="pronounce-icon">🔊</span>
              <span v-if="isPlayingAudio" class="pronounce-text">播放中...</span>
              <span v-else class="pronounce-text">发音</span>
            </button>
          </div>
        </div>
        
        <!-- 添加到生词本按钮 -->
        <div class="vocabulary-actions">
          <button 
            class="add-to-vocab-btn"
            @click="addToVocabulary"
            :disabled="isAddingToVocabulary || isInVocabulary"
            :class="{ 'is-added': isInVocabulary }"
          >
            <span class="btn-icon">{{ isInVocabulary ? '✓' : '📚' }}</span>
            <span class="btn-text">
              {{ isInVocabulary ? '已在生词本' : '添加到生词本' }}
            </span>
          </button>
          
          <!-- 标记掌握程度 -->
          <div v-if="isInVocabulary" class="mastery-buttons">
            <button 
              v-for="level in masteryLevels" 
              :key="level.value"
              class="mastery-btn"
              :class="{ 
                'is-active': vocabularyItem?.masteryLevel === level.value,
                [`level-${level.value}`]: true
              }"
              @click="updateMasteryLevel(level.value)"
              :title="level.label"
            >
              {{ level.icon }}
            </button>
          </div>
        </div>
        
        <!-- 词性和释义 -->
        <div class="definitions-section">
          <h3 class="section-title">释义</h3>
          
          <div v-if="currentWord.definitions && currentWord.definitions.length > 0" class="definitions-list">
            <div 
              v-for="(definition, index) in currentWord.definitions" 
              :key="index"
              class="definition-item"
            >
              <!-- 词性标签 -->
              <span v-if="definition.partOfSpeech" class="pos-tag">
                {{ definition.partOfSpeech }}
              </span>
              
              <!-- 释义 -->
              <p class="definition-text">{{ definition.text }}</p>
              
              <!-- 例句 -->
              <div v-if="definition.examples && definition.examples.length > 0" class="examples-list">
                <div 
                  v-for="(example, exampleIndex) in definition.examples.slice(0, 2)" 
                  :key="exampleIndex"
                  class="example-item"
                >
                  <span class="example-icon">💬</span>
                  <p class="example-text">{{ example.text }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-definitions">
            <p class="no-data-text">暂无释义</p>
          </div>
        </div>
        
        <!-- 例句 -->
        <div v-if="currentWord.examples && currentWord.examples.length > 0" class="examples-section">
          <h3 class="section-title">例句</h3>
          
          <div class="examples-list">
            <div 
              v-for="(example, index) in currentWord.examples.slice(0, 3)" 
              :key="index"
              class="example-item"
            >
              <p class="example-text">{{ example.text }}</p>
              <p v-if="example.translation" class="example-translation">
                {{ example.translation }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- 同义词和反义词 -->
        <div v-if="hasSynonymsOrAntonyms" class="word-relations">
          <!-- 同义词 -->
          <div v-if="currentWord.synonyms && currentWord.synonyms.length > 0" class="synonyms-section">
            <h4 class="relation-title">同义词</h4>
            <div class="tags-list">
              <span 
                v-for="(synonym, index) in currentWord.synonyms.slice(0, 5)" 
                :key="index"
                class="relation-tag"
                @click="lookupWord(synonym)"
              >
                {{ synonym }}
              </span>
            </div>
          </div>
          
          <!-- 反义词 -->
          <div v-if="currentWord.antonyms && currentWord.antonyms.length > 0" class="antonyms-section">
            <h4 class="relation-title">反义词</h4>
            <div class="tags-list">
              <span 
                v-for="(antonym, index) in currentWord.antonyms.slice(0, 5)" 
                :key="index"
                class="relation-tag antonym"
                @click="lookupWord(antonym)"
              >
                {{ antonym }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 单词信息 -->
        <div class="word-info">
          <div v-if="currentWord.frequency" class="info-item">
            <span class="info-label">使用频率:</span>
            <span class="info-value">{{ formatFrequency(currentWord.frequency) }}</span>
          </div>
          
          <div v-if="currentWord.difficulty" class="info-item">
            <span class="info-label">难度:</span>
            <span class="info-value">{{ formatDifficulty(currentWord.difficulty) }}</span>
          </div>
          
          <div v-if="currentWord.source" class="info-item">
            <span class="info-label">来源:</span>
            <span class="info-value">{{ currentWord.source }}</span>
          </div>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          <p class="error-text">{{ error }}</p>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📖</div>
        <h3 class="empty-title">选择单词查看释义</h3>
        <p class="empty-text">在阅读器中点击或选择单词，即可查看详细释义和例句</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import vocabularyService from '@/services/vocabulary.service'
import { useVocabularyStore } from '@/stores/vocabulary.store'
import { useReaderStore } from '@/stores/reader.store'

// 状态管理
const vocabularyStore = useVocabularyStore()
const readerStore = useReaderStore()

// 组件状态
const isVisible = ref(false)
const isLoading = ref(false)
const isPlayingAudio = ref(false)
const isAddingToVocabulary = ref(false)
const error = ref(null)

// 当前查询的单词
const currentWord = ref(null)

// 掌握程度选项
const masteryLevels = [
  { value: 0, label: '不认识', icon: '😕' },
  { value: 1, label: '有点印象', icon: '🤔' },
  { value: 2, label: '基本掌握', icon: '😊' },
  { value: 3, label: '熟练掌握', icon: '😎' },
  { value: 4, label: '完全掌握', icon: '🌟' }
]

// 计算属性
const isInVocabulary = computed(() => {
  if (!currentWord.value) return false
  return vocabularyStore.items.some(item => 
    item.word === currentWord.value.word.toLowerCase() && 
    item.language === (currentWord.value.language || 'en')
  )
})

const vocabularyItem = computed(() => {
  if (!currentWord.value) return null
  return vocabularyStore.items.find(item => 
    item.word === currentWord.value.word.toLowerCase() && 
    item.language === (currentWord.value.language || 'en')
  )
})

const hasSynonymsOrAntonyms = computed(() => {
  return (currentWord.value?.synonyms?.length > 0) || 
         (currentWord.value?.antonyms?.length > 0)
})

// 监听阅读器选中的单词
watch(() => readerStore.currentWord, async (newWord) => {
  if (newWord) {
    await lookupWord(newWord)
  }
})

// 监听词汇存储的变化
watch(() => vocabularyStore.currentWord, (newWord) => {
  if (newWord) {
    currentWord.value = newWord
  }
})

// 方法
/**
 * 查询单词
 * @param {string} word - 要查询的单词
 */
const lookupWord = async (word) => {
  if (!word || word.trim() === '') return
  
  try {
    isLoading.value = true
    error.value = null
    
    // 调用词汇服务查询单词
    const wordDetail = await vocabularyService.lookupWord(word.trim(), 'en', {
      addToHistory: true
    })
    
    currentWord.value = wordDetail
    isVisible.value = true
    
    // 添加到词汇存储
    vocabularyStore.setCurrentWord(wordDetail)
    
  } catch (err) {
    console.error('查询单词失败:', err)
    error.value = err.message || '查询单词失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

/**
 * 播放单词发音
 */
const playPronunciation = async () => {
  if (!currentWord.value?.audioUrl || isPlayingAudio.value) return
  
  try {
    isPlayingAudio.value = true
    
    const audio = new Audio(currentWord.value.audioUrl)
    
    audio.onended = () => {
      isPlayingAudio.value = false
    }
    
    audio.onerror = () => {
      isPlayingAudio.value = false
      error.value = '发音播放失败'
    }
    
    await audio.play()
    
  } catch (err) {
    console.error('播放发音失败:', err)
    isPlayingAudio.value = false
    error.value = '发音播放失败'
  }
}

/**
 * 添加到生词本
 */
const addToVocabulary = async () => {
  if (!currentWord.value || isAddingToVocabulary.value || isInVocabulary.value) return
  
  try {
    isAddingToVocabulary.value = true
    error.value = null
    
    const vocabularyData = {
      word: currentWord.value.word,
      definition: currentWord.value.definitions?.[0]?.text || '',
      example: currentWord.value.examples?.[0]?.text || '',
      language: currentWord.value.language || 'en',
      tags: ['阅读器添加'],
      source: 'reader',
      sourcePage: readerStore.currentPageNumber || 0
    }
    
    await vocabularyService.addToVocabulary(vocabularyData)
    
    // 更新本地状态
    vocabularyStore.addToSearchHistory(currentWord.value.word, currentWord.value.language || 'en')
    
  } catch (err) {
    console.error('添加到生词本失败:', err)
    error.value = err.message || '添加到生词本失败'
  } finally {
    isAddingToVocabulary.value = false
  }
}

/**
 * 更新掌握程度
 * @param {number} level - 掌握程度等级
 */
const updateMasteryLevel = async (level) => {
  if (!vocabularyItem.value) return
  
  try {
    await vocabularyService.updateVocabularyItem(vocabularyItem.value.id, {
      masteryLevel: level,
      status: level >= 3 ? 'mastered' : 'learning'
    })
    
    // 更新本地状态
    vocabularyStore.updateItem(vocabularyItem.value.id, {
      masteryLevel: level,
      status: level >= 3 ? 'mastered' : 'learning'
    })
    
  } catch (err) {
    console.error('更新掌握程度失败:', err)
    error.value = '更新掌握程度失败'
  }
}

/**
 * 关闭词典面板
 */
const closeDictionary = () => {
  isVisible.value = false
  currentWord.value = null
  error.value = null
}

/**
 * 格式化使用频率
 * @param {number} frequency - 频率值
 * @returns {string} 格式化后的频率
 */
const formatFrequency = (frequency) => {
  if (frequency >= 0.8) return '非常高'
  if (frequency >= 0.6) return '高'
  if (frequency >= 0.4) return '中等'
  if (frequency >= 0.2) return '低'
  return '非常低'
}

/**
 * 格式化难度
 * @param {string} difficulty - 难度等级
 * @returns {string} 格式化后的难度
 */
const formatDifficulty = (difficulty) => {
  const difficultyMap = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难',
    'very_hard': '非常困难'
  }
  
  return difficultyMap[difficulty] || difficulty
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isVisible.value) {
    closeDictionary()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法给父组件
defineExpose({
  lookupWord,
  closeDictionary
})
</script>

<style scoped>
.reader-dictionary {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.reader-dictionary.is-visible {
  pointer-events: auto;
}

.dictionary-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  animation: fadeIn 0.3s ease;
}

.dictionary-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 32px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 4px rgba(255, 105, 180, 0.1);
  padding: 32px;
  overflow-y: auto;
  pointer-events: auto;
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 3px solid #ff69b4;
}

.dictionary-panel.is-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff69b4 0%, #ff8ac6 100%);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.close-btn:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 16px rgba(255, 105, 180, 0.4);
}

.close-btn:active {
  transform: scale(0.95);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e0e7ff;
  border-top: 4px solid #ff69b4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #666;
  margin: 0;
}

/* 单词详情 */
.word-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px dashed #e0e7ff;
}

.word-title {
  font-family: 'Kalam', cursive;
  font-size: 42px;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.2;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.word-pronunciation {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.phonetic {
  font-family: 'Comfortaa', cursive;
  font-size: 20px;
  color: #666;
  background: #f0f4ff;
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid #d0d7ff;
}

.pronounce-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

.pronounce-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(77, 171, 247, 0.4);
}

.pronounce-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.pronounce-icon {
  font-size: 18px;
}

/* 词汇操作 */
.vocabulary-actions {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-to-vocab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  background: linear-gradient(135deg, #ffd166 0%, #ffc043 100%);
  color: #333;
  border: none;
  padding: 16px 24px;
  border-radius: 24px;
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 193, 67, 0.3);
}

.add-to-vocab-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(255, 193, 67, 0.4);
}

.add-to-vocab-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-to-vocab-btn.is-added {
  background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
  color: white;
}

.btn-icon {
  font-size: 20px;
}

.mastery-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.mastery-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #e0e7ff;
  background: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mastery-btn:hover {
  transform: scale(1.1);
  border-color: #ff69b4;
}

.mastery-btn.is-active {
  border-color: #ff69b4;
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
}

.mastery-btn.level-0 { background: #ffe3e3; }
.mastery-btn.level-1 { background: #fff3bf; }
.mastery-btn.level-2 { background: #d3f9d8; }
.mastery-btn.level-3 { background: #a5d8ff; }
.mastery-btn.level-4 { background: #ffc9c9; }

/* 释义部分 */
.definitions-section {
  margin-bottom: 28px;
}

.section-title {
  font-family: 'Caveat', cursive;
  font-size: 28px;
  color: #ff69b4;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #ffd1e8;
}

.definitions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.definition-item {
  background: #f8f9ff;
  padding: 20px;
  border-radius: 20px;
  border: 2px solid #e0e7ff;
  transition: all 0.3s ease;
}

.definition-item:hover {
  border-color: #ff69b4;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.1);
}

.pos-tag {
  display: inline-block;
  background: linear-gradient(135deg, #74c0fc 0%, #4dabf7 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}

.definition-text {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #333;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 16px;
  border: 2px solid #e9ecef;
}

.example-icon {
  font-size: 16px;
  color: #74c0fc;
  flex-shrink: 0;
  margin-top: 2px;
}

.example-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #495057;
  line-height: 1.5;
  margin: 0;
}

.example-translation {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #868e96;
  font-style: italic;
  margin: 4px 0 0 0;
  padding-left: 28px;
}

/* 同义词反义词 */
.word-relations {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.relation-title {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #495057;
  margin: 0 0 12px 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.relation-tag {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  color: #495057;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.relation-tag:hover {
  background: linear-gradient(135deg, #ffd166 0%, #ffc043 100%);
  color: #333;
  transform: translateY(-2px);
  border-color: #ffc043;
}

.relation-tag.antonym:hover {
  background: linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%);
  color: white;
  border-color: #ff6b6b;
}

/* 单词信息 */
.word-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 20px;
  border: 2px solid #e0e7ff;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #868e96;
  font-weight: bold;
}

.info-value {
  font-family: 'Comfortaa', cursive;
  font-size: 14px;
  color: #495057;
  background: white;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

/* 错误信息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #ffe3e3 0%, #ffc9c9 100%);
  padding: 16px 20px;
  border-radius: 20px;
  border: 2px solid #ff6b6b;
  margin-top: 24px;
}

.error-icon {
  font-size: 20px;
  color: #ff6b6b;
}

.error-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #c92a2a;
  margin: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
}

.empty-icon {
  font-size: 64px;
  color: #e0e7ff;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.empty-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #adb5bd;
  margin: 0 0 12px 0;
}

.empty-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #868e96;
  margin: 0;
  line-height: 1.6;
}

.no-definitions,
.no-examples {
  text-align: center;
  padding: 40px 0;
}

.no-data-text {
  font-family: 'Comfortaa', cursive;
  font-size: 16px;
  color: #adb5bd;
  margin: 0;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -40%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dictionary-panel {
    width: 95%;
    padding: 24px;
    border-radius: 24px;
  }
  
  .word-title {
    font-size: 36px;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .definition-text {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .dictionary-panel {
    padding: 20px;
    border-radius: 20px;
  }
  
  .word-title {
    font-size: 32px;
  }
  
  .word-pronunciation {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .vocabulary-actions {
    gap: 12px;
  }
  
  .mastery-buttons {
    gap: 8px;
  }
  
  .mastery-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>