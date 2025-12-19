<template>
  <div class="dictionary-page">
    <header class="header">
      <button class="btn-back" @click="goBack">← 返回</button>
      <h1>词典详情</h1>
      <div class="header-actions">
        <button class="btn-add" @click="addToVocabulary" :disabled="isLoading">📚 添加到生词本</button>
        <button class="btn-speak" @click="speakWord">🔊 发音</button>
      </div>
    </header>

    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="loading-state">
      <p>正在努力查询中...</p>
    </div>

    <main v-else class="main">
      <!-- 单词标题 -->
      <div class="word-header">
        <h2 class="word">{{ word }}</h2>
        <div class="phonetic">{{ phonetic }}</div>
        <div class="tags">
          <span class="tag level">{{ level }}</span>
          <span class="tag part-of-speech">{{ partOfSpeech }}</span>
          <span class="tag frequency">常用度: {{ frequency }}</span>
        </div>
      </div>

      <!-- 释义 -->
      <section class="section">
        <h3>释义</h3>
        <div class="definitions">
          <!-- 适配后端返回的 String 列表 -->
          <div v-for="(def, idx) in definitions" :key="idx" class="definition-item">
            <div class="def-header">
              <span class="def-index">{{ idx + 1 }}.</span>
              <span class="def-pos" v-if="typeof def === 'object'">{{ def.pos }}</span>
            </div>
            <p class="def-meaning">{{ typeof def === 'string' ? def : def.meaning }}</p>
            
            <!-- 如果是模拟数据，则显示其嵌套例句；如果是后端数据，则不显示此处（后端例句独立返回） -->
            <div class="def-examples" v-if="def.examples">
              <div v-for="(ex, exIdx) in def.examples" :key="exIdx" class="example">
                <span class="example-text">{{ ex.text }}</span>
                <span class="example-translation">{{ ex.translation }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 同义词/反义词 -->
      <section class="section">
        <h3>同义词与反义词</h3>
        <div class="syn-ant-grid">
          <div class="synonyms">
            <h4>同义词</h4>
            <div class="word-list">
              <span v-for="syn in synonyms" :key="syn" class="word-chip" @click="lookupWord(syn)">{{ syn }}</span>
            </div>
          </div>
          <div class="antonyms">
            <h4>反义词</h4>
            <div class="word-list">
              <span v-for="ant in antonyms" :key="ant" class="word-chip" @click="lookupWord(ant)">{{ ant }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 例句 -->
      <section class="section">
        <h3>例句</h3>
        <div class="examples">
          <!-- 适配后端字符串列表或模拟数据对象 -->
          <div v-for="(ex, idx) in exampleSentences" :key="idx" class="example-sentence">
            <div class="sentence-text">{{ typeof ex === 'string' ? ex : ex.text }}</div>
            <div class="sentence-translation" v-if="ex.translation">{{ ex.translation }}</div>
            <div class="sentence-source" v-if="ex.source">来源: {{ ex.source }}</div>
          </div>
        </div>
      </section>

      <!-- 词源 -->
      <section class="section" v-if="etymology">
        <h3>词源</h3>
        <p class="etymology">{{ etymology }}</p>
      </section>

      <!-- 相关词汇 -->
      <section class="section" v-if="relatedWords.length > 0">
        <h3>相关词汇</h3>
        <div class="related-words">
          <span v-for="rel in relatedWords" :key="rel.word" class="related-chip" @click="lookupWord(rel.word)">
            {{ rel.word }} <span class="rel-pos">({{ rel.pos }})</span>
          </span>
        </div>
      </section>
    </main>

    <!-- 底部操作 -->
    <footer class="footer">
      <div class="footer-actions">
        <button class="btn-footer" @click="startReview">开始复习</button>
        <button class="btn-footer" @click="toggleFavorite">
          {{ isFavorite ? '❤️ 已收藏' : '🤍 收藏' }}
        </button>
        <button class="btn-footer" @click="shareWord">分享</button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 状态控制
const isLoading = ref(false)
const isFavorite = ref(false)
const currentWordId = ref(null) // 用于存储后端返回的 word_id

// 响应式数据
const word = ref('')
const phonetic = ref('')
const level = ref('')
const partOfSpeech = ref('')
const frequency = ref('')
const definitions = ref([])
const synonyms = ref([])
const antonyms = ref([])
const exampleSentences = ref([])
const etymology = ref('')
const relatedWords = ref([])
const audioUrl = ref('')

// 1. 模拟数据加载器 (当 API 失败时调用)
const loadMockData = (wordParam) => {
  console.warn('使用模拟数据进行展示')
  word.value = wordParam || 'father'
  phonetic.value = 'ˈfɑːðər'
  level.value = 'CET-6'
  partOfSpeech.value = 'n.'
  frequency.value = '高频'
  definitions.value = [
    {
      pos: 'n.',
      meaning: '父亲；祖先；创始人',
      examples: [
        { text: 'My father gave me some advice.', translation: '我父亲给了我一些建议。' },
        { text: 'He is the father of modern physics.', translation: '他是现代物理学之父。' }
      ]
    },
    {
      pos: 'v.',
      meaning: '成为…的父亲；创立',
      examples: [{ text: 'He fathered three children.', translation: '他生了三个孩子。' }]
    }
  ]
  synonyms.value = ['dad', 'parent', 'progenitor', 'sire']
  antonyms.value = ['mother', 'child']
  exampleSentences.value = [
    { text: 'The father of the bride gave a touching speech.', translation: '新娘的父亲发表了感人的演讲。', source: 'The Great Gatsby' },
    { text: 'He is like a father to me.', translation: '他对我来说就像父亲一样。', source: 'Personal' }
  ]
  etymology.value = '来自古英语 fæder，源自原始日耳曼语 *fadēr...'
  relatedWords.value = [{ word: 'fatherly', pos: 'adj.' }, { word: 'fatherhood', pos: 'n.' }]
}

// 2. Token 获取
const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token') || ''

// 3. 核心 API: 查询单词
const fetchWordDetails = async (wordParam) => {
  isLoading.value = true
  const token = getToken()

  try {
    const response = await fetch(`http://localhost:8080/api/v1/words/lookup?word=${wordParam}&language=en`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('网络响应不佳')

    const result = await response.json()
    if (result.success && result.data) {
      const d = result.data
      // 映射后端数据
      word.value = d.word
      phonetic.value = d.phonetic
      level.value = d.difficulty || 'N/A'
      partOfSpeech.value = d.partOfSpeech
      frequency.value = d.frequency
      definitions.value = d.definitions // List<String>
      exampleSentences.value = d.examples // List<String>
      synonyms.value = d.synonyms
      antonyms.value = d.antonyms
      audioUrl.value = d.audioUrl
      currentWordId.value = d.metadata?.word_id
      etymology.value = '' // 后端示例中未明确此字段，暂留空
      relatedWords.value = []
    } else {
      throw new Error(result.message || '查询失败')
    }
  } catch (error) {
    console.error('API 请求失败:', error)
    loadMockData(wordParam)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const wordParam = route.params.word || 'father'
  fetchWordDetails(wordParam)
})

// 4. API: 添加到生词本
const addToVocabulary = async () => {
  const token = getToken()
  try {
    const response = await fetch('http://localhost:8080/api/v1/vocabulary', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: word.value,
        language: 'en',
        source: '词典详情页',
        tags: ['新词']
      })
    })
    
    if (response.ok) {
      alert(`已添加 "${word.value}" 到生词本`)
    } else {
      alert('添加失败，请稍后重试')
    }
  } catch (error) {
    alert('请求异常，添加失败')
  }
}

// 5. 功能: 发音
const speakWord = () => {
  if (audioUrl.value) {
    const audio = new Audio(audioUrl.value)
    audio.play()
  } else {
    const utterance = new SpeechSynthesisUtterance(word.value)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }
}

// 6. API: 分享功能
const shareWord = async () => {
  if (!currentWordId.value) {
    alert(`分享单词: ${word.value}`)
    return
  }

  const token = getToken()
  try {
    const response = await fetch(`http://localhost:8080/api/v1/documents/${currentWordId.value}/share`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    if (result.shareLink) {
      alert(`分享链接已生成: ${result.shareLink}`)
    } else {
      alert(`分享单词: ${word.value}`)
    }
  } catch (error) {
    alert(`分享单词: ${word.value}`)
  }
}

// 7. 辅助导航
const goBack = () => router.back()
const lookupWord = (w) => {
  router.push(`/dictionary/${w}`)
  fetchWordDetails(w) // 手动触发更新
}
const startReview = () => router.push('/review')
const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
  // 根据需求，此处可对接 PUT /api/v1/documents/{id} 
}
</script>
<style scoped>
/* 定义CSS变量 */
.dictionary-page {
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色表面 */
  --primary-color: #87CEEB; /* 天蓝色主色调 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333; /* 深灰文本 */
  --text-color-medium: #666666; /* 中灰文本 */
  --text-color-light: #999999; /* 浅灰文本 */
  --border-color: #e0e0e0; /* 柔和边框色 */
  
  --border-radius-sm: 8px;
  --border-radius-md: 16px;
  --border-radius-lg: 24px;
  --border-radius-xl: 40px;
  
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  /* 字体定义 */
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
}

/* 整体页面 */
.dictionary-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: var(--spacing-lg);
  transition: all 0.3s ease-in-out;
}

/* 头部区域 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 4px dashed var(--accent-pink);
  box-shadow: 0 8px 20px rgba(135, 206, 235, 0.1);
}

.btn-back {
  background-color: var(--accent-yellow);
  border: 3px solid var(--accent-yellow);
  color: var(--text-color-dark);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  font-family: 'Kalam', cursive;
  font-size: 1.1rem;
  transition: all 0.2s ease-in-out;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.btn-back:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 12px rgba(255, 215, 0, 0.3);
}

.btn-back:active {
  transform: translateY(0) scale(0.98);
}

.header h1 {
  font-size: 2.8rem;
  color: var(--primary-color);
  margin: 0;
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-add, .btn-speak {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  border: none;
  transition: all 0.2s ease-in-out;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.btn-add {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

.btn-add:hover {
  background-color: var(--primary-dark);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.4);
}

.btn-add:active {
  transform: translateY(0) scale(0.98);
}

.btn-speak {
  background-color: var(--accent-green);
  color: var(--text-color-dark);
  box-shadow: 0 4px 8px rgba(144, 238, 144, 0.3);
}

.btn-speak:hover {
  background-color: #7ce07c;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 12px rgba(144, 238, 144, 0.4);
}

.btn-speak:active {
  transform: translateY(0) scale(0.98);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: var(--spacing-xl);
  font-size: 1.5rem;
  color: var(--primary-color);
  font-family: 'Caveat', cursive;
  animation: bounce 1s infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

/* 主要内容区域 */
.main {
  max-width: 900px;
  margin: 0 auto;
}

/* 单词标题区域 */
.word-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 5px solid var(--primary-color);
  box-shadow: 0 10px 25px rgba(135, 206, 235, 0.15);
  position: relative;
  overflow: hidden;
}

.word-header::before {
  content: "✨";
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 1.5rem;
  animation: twinkle 2s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.word {
  font-size: 4.5rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
  letter-spacing: 2px;
}

.phonetic {
  font-size: 2rem;
  color: var(--accent-pink);
  font-style: italic;
  margin-bottom: var(--spacing-md);
  font-family: 'Caveat', cursive;
}

.tags {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.tag {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  font-size: 0.9rem;
  font-family: 'Quicksand', sans-serif;
  transition: all 0.2s ease-in-out;
}

.tag.level {
  background-color: var(--accent-yellow);
  color: var(--text-color-dark);
  border: 2px solid #ffcc00;
}

.tag.part-of-speech {
  background-color: var(--accent-pink);
  color: white;
  border: 2px solid #ff9eb5;
}

.tag.frequency {
  background-color: var(--accent-green);
  color: var(--text-color-dark);
  border: 2px solid #7ce07c;
}

.tag:hover {
  transform: translateY(-2px) scale(1.05);
}

/* 各内容区块 */
.section {
  background-color: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
  border: 3px solid var(--primary-light);
  box-shadow: 0 6px 15px rgba(173, 216, 230, 0.1);
  transition: all 0.3s ease-in-out;
}

.section:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(173, 216, 230, 0.2);
}

.section h3 {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
  border-bottom: 4px dotted var(--accent-yellow);
  padding-bottom: var(--spacing-xs);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 1px 1px 3px rgba(135, 206, 235, 0.2);
}

/* 释义区域 */
.definitions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.definition-item {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  background-color: #f9f9f9;
  border-left: 8px solid var(--primary-color);
  transition: all 0.2s ease-in-out;
}

.definition-item:hover {
  background-color: #f0f8ff;
  transform: translateX(5px);
}

.def-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.def-index {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 1.4rem;
  font-family: 'Kalam', cursive;
}

.def-pos {
  background-color: var(--accent-pink);
  color: white;
  padding: 6px 14px;
  border-radius: var(--border-radius-xl);
  font-size: 0.9rem;
  font-weight: 700;
}

.def-meaning {
  font-size: 1.3rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-color-dark);
  line-height: 1.7;
}

.def-examples {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.example {
  padding: var(--spacing-sm);
  background-color: #f0f8ff;
  border-radius: var(--border-radius-md);
  border-left: 5px solid var(--accent-green);
}

.example-text {
  font-style: italic;
  color: var(--text-color-dark);
  font-size: 1.1rem;
}

.example-translation {
  display: block;
  color: var(--text-color-medium);
  font-size: 0.95rem;
  margin-top: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  border-left: 3px dotted var(--accent-yellow);
}

/* 同义词反义词网格 */
.syn-ant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .syn-ant-grid {
    grid-template-columns: 1fr;
  }
}

.synonyms h4, .antonyms h4 {
  font-size: 1.6rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
  font-family: 'Kalam', cursive;
  font-weight: 700;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.word-chip {
  background-color: var(--primary-light);
  color: var(--text-color-dark);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-weight: 600;
  border: 2px solid var(--primary-color);
}

.word-chip:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.4);
}

/* 例句区域 */
.examples {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.example-sentence {
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  background-color: #f9f9f9;
  border: 3px solid var(--accent-green);
  position: relative;
  overflow: hidden;
}

.example-sentence::before {
  content: "💭";
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  opacity: 0.3;
}

.sentence-text {
  font-size: 1.3rem;
  margin-bottom: var(--spacing-xs);
  color: var(--text-color-dark);
  line-height: 1.6;
}

.sentence-translation {
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  border-left: 3px solid var(--accent-yellow);
}

.sentence-source {
  font-size: 0.9rem;
  color: var(--accent-pink);
  text-align: right;
  font-style: italic;
}

/* 词源区域 */
.etymology {
  font-size: 1.2rem;
  line-height: 1.7;
  color: var(--text-color-dark);
  padding: var(--spacing-md);
  background-color: #f0f8ff;
  border-radius: var(--border-radius-md);
  border: 2px dashed var(--primary-light);
}

/* 相关词汇 */
.related-words {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.related-chip {
  background-color: var(--accent-yellow);
  color: var(--text-color-dark);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  border: 2px solid #ffcc00;
  transition: all 0.2s ease-in-out;
}

.related-chip:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) rotate(2deg);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.4);
}

.rel-pos {
  font-size: 0.8rem;
  opacity: 0.9;
  font-style: italic;
}

/* 底部操作区域 */
.footer {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-xl);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border-top: 6px solid var(--accent-pink);
  box-shadow: 0 -5px 15px rgba(255, 182, 193, 0.1);
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.btn-footer {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  border: none;
  min-width: 160px;
  font-family: 'Quicksand', sans-serif;
  transition: all 0.2s ease-in-out;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.btn-footer::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn-footer:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

.btn-footer:first-child {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.btn-footer:first-child:hover {
  background-color: var(--primary-dark);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 20px rgba(135, 206, 235, 0.4);
}

.btn-footer:nth-child(2) {
  background-color: var(--accent-pink);
  color: white;
  box-shadow: 0 6px 12px rgba(255, 182, 193, 0.3);
}

.btn-footer:nth-child(2):hover {
  background-color: #ff9eb5;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 20px rgba(255, 182, 193, 0.4);
}

.btn-footer:last-child {
  background-color: var(--accent-green);
  color: var(--text-color-dark);
  box-shadow: 0 6px 12px rgba(144, 238, 144, 0.3);
}

.btn-footer:last-child:hover {
  background-color: #7ce07c;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 20px rgba(144, 238, 144, 0.4);
}

.btn-footer:active {
  transform: translateY(0) scale(0.98);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dictionary-page {
    padding: var(--spacing-sm);
  }
  
  .header {
    flex-direction: column;
    text-align: center;
  }
  
  .word {
    font-size: 3.5rem;
  }
  
  .section {
    padding: var(--spacing-md);
  }
  
  .footer-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-footer {
    width: 100%;
    max-width: 300px;
  }
}

/* 禁用状态 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

button:disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}
</style>