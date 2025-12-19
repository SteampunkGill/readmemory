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
.dictionary-page {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-back {
  background-color: transparent;
  border: 2px solid var(--color-secondary);
  color: var(--color-text);
  padding: 10px 20px;
  border-radius: var(--radius-medium);
  font-weight: bold;
  cursor: pointer;
}

.header h1 {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-add, .btn-speak {
  padding: 10px 20px;
  border-radius: var(--radius-medium);
  font-weight: bold;
  cursor: pointer;
}

.btn-add {
  background-color: var(--color-primary);
  color: #f1f2f6;
  border: none;
}

.btn-speak {
  background-color: var(--color-secondary);
  color: var(--color-text);
  border: 2px solid var(--color-secondary);
}

.main {
  max-width: 900px;
  margin: 0 auto;
}

.word-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background-color: #f1f2f6;
  border-radius: var(--radius-large);
  border: 5px solid var(--color-primary);
}

.word {
  font-size: 4rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.phonetic {
  font-size: 1.8rem;
  color: var(--color-text-light);
  font-style: italic;
  margin-bottom: 1rem;
}

.tags {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.tag {
  padding: 8px 16px;
  border-radius: var(--radius-medium);
  font-weight: bold;
  font-size: 0.9rem;
}

.tag.level {
  background-color: var(--color-accent);
  color: #f1f2f6;
}

.tag.part-of-speech {
  background-color: var(--color-info);
  color: #f1f2f6;
}

.tag.frequency {
  background-color: var(--color-success);
  color: #f1f2f6;
}

.section {
  background-color: #f1f2f6;
  padding: 2rem;
  border-radius: var(--radius-large);
  margin-bottom: 2rem;
  border: 3px solid var(--color-secondary);
}

.section h3 {
  font-size: 1.8rem;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  border-bottom: 3px solid var(--color-secondary);
  padding-bottom: 0.5rem;
}

.definitions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.definition-item {
  padding: 1.5rem;
  border-radius: var(--radius-medium);
  background-color: #f9f9f9;
  border-left: 5px solid var(--color-primary);
}

.def-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.def-index {
  font-weight: bold;
  color: var(--color-primary);
  font-size: 1.2rem;
}

.def-pos {
  background-color: var(--color-info);
  color: #f1f2f6;
  padding: 4px 12px;
  border-radius: var(--radius-small);
  font-size: 0.9rem;
}

.def-meaning {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.def-examples {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.example {
  padding: 0.8rem;
  background-color: #f1f2f6;
  border-radius: var(--radius-medium);
  border-left: 3px solid var(--color-secondary);
}

.example-text {
  font-style: italic;
  color: var(--color-text);
}

.example-translation {
  display: block;
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin-top: 0.3rem;
}

.syn-ant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .syn-ant-grid {
    grid-template-columns: 1fr;
  }
}

.synonyms h4, .antonyms h4 {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.word-chip {
  background-color: var(--color-secondary);
  color: var(--color-text);
  padding: 8px 16px;
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.word-chip:hover {
  background-color: var(--color-primary);
  color: #f1f2f6;
  transform: translateY(-2px);
}

.examples {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.example-sentence {
  padding: 1.5rem;
  border-radius: var(--radius-medium);
  background-color: #f9f9f9;
  border: 2px solid var(--color-secondary);
}

.sentence-text {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.sentence-translation {
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.sentence-source {
  font-size: 0.9rem;
  color: var(--color-info);
  text-align: right;
}

.etymology {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text);
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: var(--radius-medium);
}

.related-words {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.related-chip {
  background-color: var(--color-accent);
  color: #f1f2f6;
  padding: 10px 20px;
  border-radius: var(--radius-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.related-chip:hover {
  background-color: var(--color-primary);
}

.rel-pos {
  font-size: 0.8rem;
  opacity: 0.9;
}

.footer {
  margin-top: 3rem;
  padding: 2rem;
  background-color: #f1f2f6;
  border-radius: var(--radius-large);
  border-top: 5px solid var(--color-secondary);
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.btn-footer {
  padding: 15px 30px;
  border-radius: var(--radius-large);
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  border: none;
  min-width: 150px;
}

.btn-footer:first-child {
  background-color: var(--color-primary);
  color: #f1f2f6;
}

.btn-footer:nth-child(2) {
  background-color: var(--color-secondary);
  color: var(--color-text);
}

.btn-footer:last-child {
  background-color: var(--color-accent);
  color: #f1f2f6;
}
</style>