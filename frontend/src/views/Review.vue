<template>
  <div class="review-page">
    <header class="header">
      <h1>智能复习</h1>
      <div class="header-actions">
        <button class="btn-settings" @click="openSettings">⚙️ 设置</button>
        <button class="btn-stats" @click="fetchStats">📊 统计</button>
      </div>
    </header>

    <main class="main">
      <!-- 加载状态显示 -->
      <div v-if="loading" class="loading-state">
        <p>正在同步云端复习进度...</p>
      </div>

      <template v-else>
        <div class="review-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-text">
            今日进度: {{ completed }}/{{ total }} ({{ Math.round(progress) }}%)
          </div>
        </div>

        <div class="review-card" v-if="currentCard">
          <div class="card-front" v-show="!showAnswer">
            <div class="card-content">
              <h2 class="word">{{ currentCard.word }}</h2>
              <div class="hint" v-if="currentCard.hint">提示: {{ currentCard.hint }}</div>
              <button class="btn-flip" @click="flipCard">显示答案</button>
            </div>
          </div>
          <div class="card-back" v-show="showAnswer">
            <div class="card-content">
              <h2 class="word">{{ currentCard.word }}</h2>
              <div class="phonetic">{{ currentCard.phonetic }}</div>
              <div class="meaning">{{ currentCard.meaning }}</div>
              <div class="example" v-if="currentCard.example">
                <strong>例句:</strong> {{ currentCard.example }}
              </div>
              <div class="actions">
                <button class="btn-know" @click="markKnown">认识</button>
                <button class="btn-dont-know" @click="markUnknown">不认识</button>
                <button class="btn-skip" @click="skipCard">跳过</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>今日复习已完成！🎉</p>
          <button class="btn-primary" @click="resetReview">重新开始</button>
        </div>

        <div class="review-controls">
          <button class="btn-control" @click="prevCard" :disabled="cardIndex === 0">上一张</button>
          <button class="btn-control" @click="nextCard" :disabled="cardIndex >= cards.length - 1">下一张</button>
          <button class="btn-control" @click="shuffleCards">🔀 打乱</button>
        </div>
      </template>
    </main>

    <!-- 复习设置弹窗 -->
    <div class="modal" v-if="showSettings">
      <div class="modal-content">
        <h3>复习设置</h3>
        <div class="setting-item">
          <label>每日复习数量</label>
          <input type="number" v-model="dailyLimit" min="1" max="100" />
        </div>
        <div class="setting-item">
          <label>复习模式</label>
          <select v-model="reviewMode">
            <option value="normal">普通模式</option>
            <option value="spaced">间隔重复</option>
            <option value="test">测试模式</option>
          </select>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="autoPlayAudio" />
            自动播放发音
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-save" @click="saveSettings">保存</button>
          <button class="btn-cancel" @click="closeSettings">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/multi-word-component-names */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { defineOptions } from 'vue'
import { API_BASE_URL } from '@/config'
import { auth } from '@/utils/auth'

// 模拟数据，用于后端接口不可用时
const mockCards = [
  { id: 1, word: 'example', phonetic: 'ɪɡˈzæmpl', meaning: '例子', example: 'This is an example.', hint: '常用词' },
  { id: 2, word: 'vocabulary', phonetic: 'vəˈkæbjələri', meaning: '词汇', example: 'Build your vocabulary.', hint: '核心词' }
]

defineOptions({
  name: 'ReviewPage'
})

const router = useRouter()
const cards = ref([])
const cardIndex = ref(0)
const showAnswer = ref(false)
const completed = ref(0)
const total = ref(0)
const loading = ref(true)

// 设置相关
const showSettings = ref(false)
const dailyLimit = ref(20)
const reviewMode = ref('normal')
const autoPlayAudio = ref(true)

const currentCard = computed(() => cards.value[cardIndex.value] || null)
const progress = computed(() => total.value > 0 ? (completed.value / total.value) * 100 : 0)

// 获取 Token 的辅助函数
const getAuthHeader = () => ({
  'Authorization': `Bearer ${auth.getToken()}`,
  'Content-Type': 'application/json'
})

// 获取卡片列表
const fetchCards = async () => {
  loading.value = true
  try {
    // 修改为调用 review/due-words 接口，以获取今日收藏的单词
    const response = await fetch(`${API_BASE_URL}/review/due-words?limit=50&mode=spaced`, {
      method: 'GET',
      headers: getAuthHeader()
    })
    
    if (!response.ok) throw new Error('Fetch failed')
    
    const result = await response.json()
    if (result.success && result.data.words) {
      // 数据映射：将后端字段映射到前端使用的字段
      cards.value = result.data.words.map(item => ({
        id: item.id,
        word: item.word,
        phonetic: item.phonetic || '',
        meaning: item.definition,
        example: item.example,
        hint: item.source ? `来源: ${item.source}` : ''
      }))
      total.value = cards.value.length
    } else {
      cards.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取后端数据失败，使用模拟数据:', error)
    cards.value = [...mockCards]
    total.value = mockCards.length
  } finally {
    loading.value = false
  }
}

// 提交复习进度
const submitProgress = async (cardId, status) => {
  // status 映射: 认识 -> mastered, 不认识 -> learning
  const backendStatus = status === 'known' ? 'mastered' : 'learning'
  
  try {
    await fetch(`${API_BASE_URL}/vocabulary/progress`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        wordId: cardId,
        status: backendStatus
      })
    })
  } catch (error) {
    console.error('进度更新失败:', error)
  }
}

// 获取设置
const fetchReviewSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/settings/review`, {
      method: 'GET',
      headers: getAuthHeader()
    })
    if (response.ok) {
      const data = await response.json()
      dailyLimit.value = data.dailyGoal || 20
      autoPlayAudio.value = data.autoPlayAudioInReview ?? true
    }
  } catch (error) {
    console.warn('获取设置失败')
  }
}

// 交互逻辑
const flipCard = () => {
  showAnswer.value = !showAnswer.value
}

const markKnown = async () => {
  const card = currentCard.value
  await submitProgress(card.id, 'known')
  completed.value++
  nextCard()
}

const markUnknown = async () => {
  const card = currentCard.value
  await submitProgress(card.id, 'reviewing')
  nextCard()
}

const skipCard = () => {
  nextCard()
}

const nextCard = () => {
  showAnswer.value = false
  if (cardIndex.value < cards.value.length - 1) {
    cardIndex.value++
  } else {
    cardIndex.value = cards.value.length // 进入完成状态
    // 自动跳转到统计报告页
    setTimeout(() => {
      router.push('/review/report')
    }, 1500)
  }
}

const prevCard = () => {
  showAnswer.value = false
  if (cardIndex.value > 0) {
    cardIndex.value--
  }
}

const shuffleCards = () => {
  cards.value = [...cards.value].sort(() => Math.random() - 0.5)
  cardIndex.value = 0
}

const resetReview = () => {
  completed.value = 0
  cardIndex.value = 0
  showAnswer.value = false
  fetchCards()
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const saveSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/settings/review`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({
        dailyGoal: dailyLimit.value,
        autoPlayAudioInReview: autoPlayAudio.value
      })
    })
    if (response.ok) {
      alert('设置已保存至云端')
      closeSettings()
    }
  } catch (error) {
    alert('保存设置失败')
  }
}

const fetchStats = () => {
  router.push('/review/stats')
}

// 初始化
onMounted(() => {
  fetchCards()
  fetchReviewSettings()
})
</script>

<style scoped>
/* 定义CSS变量 - 童趣风格 */
.review-page {
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
  
  --border-radius-sm: 12px;
  --border-radius-md: 20px;
  --border-radius-lg: 30px;
  --border-radius-xl: 50px;
  
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  --shadow-soft: 0 6px 15px rgba(135, 206, 235, 0.1);
  --shadow-medium: 0 10px 25px rgba(135, 206, 235, 0.2);
  --shadow-hard: 0 15px 35px rgba(135, 206, 235, 0.3);
  
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 字体定义 */
  font-family: 'Quicksand', 'Comfortaa', 'Varela Round', sans-serif;
  line-height: 1.6;
}

/* 整体页面 */
.review-page {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.review-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(135, 206, 235, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 头部区域 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  border: 4px wavy var(--accent-pink);
  position: relative;
  z-index: 1;
}

.header h1 {
  font-size: 3.2rem;
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
  letter-spacing: 1px;
  position: relative;
  display: inline-block;
}

.header h1::after {
  content: "🧠";
  position: absolute;
  right: -50px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2.2rem;
  animation: bounce 2s infinite alternate;
}

@keyframes bounce {
  0% { transform: translateY(-50%) scale(1); }
  100% { transform: translateY(-60%) scale(1.1); }
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-settings, .btn-stats {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  border: 3px solid var(--primary-color);
  background-color: var(--primary-light);
  font-weight: 700;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-soft);
}

.btn-settings:hover, .btn-stats:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-medium);
}

.btn-settings:active, .btn-stats:active {
  transform: translateY(-1px) scale(0.98);
}

/* 主要内容区域 */
.main {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 4px dashed var(--accent-yellow);
  box-shadow: var(--shadow-soft);
}

.loading-state p {
  font-size: 1.8rem;
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 复习进度 */
.review-progress {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  border: 3px solid var(--primary-light);
}

.progress-bar {
  height: 16px;
  background-color: var(--border-color);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
  border: 2px solid var(--primary-color);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-green));
  border-radius: var(--border-radius-xl);
  transition: width 0.5s var(--transition-bounce);
  position: relative;
}

.progress-fill::after {
  content: "";
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

.progress-text {
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-dark);
  font-family: 'Quicksand', sans-serif;
  padding: var(--spacing-sm);
  background-color: rgba(173, 216, 230, 0.2);
  border-radius: var(--border-radius-md);
  border: 2px dashed var(--primary-color);
}

/* 复习卡片 */
.review-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 6px solid var(--primary-color);
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-hard);
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.review-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(135, 206, 235, 0.1) 0%, 
    rgba(255, 215, 0, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.review-card:hover::before {
  opacity: 1;
}

.review-card:hover {
  transform: translateY(-5px) scale(1.01);
  border-color: var(--accent-yellow);
  box-shadow: 0 20px 40px rgba(135, 206, 235, 0.3);
}

.card-content {
  text-align: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* 卡片正面 */
.card-front {
  animation: fadeIn 0.5s var(--transition-bounce);
}

.word {
  font-size: 4.5rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-md);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
}

.hint {
  font-size: 1.4rem;
  color: var(--accent-pink);
  margin-bottom: var(--spacing-lg);
  font-weight: 600;
  padding: var(--spacing-sm);
  background-color: rgba(255, 182, 193, 0.1);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--accent-pink);
}

.btn-flip {
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--accent-yellow);
  color: var(--text-color-dark);
  border: none;
  border-radius: var(--border-radius-xl);
  font-size: 1.3rem;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  transition: var(--transition-smooth);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: 0 6px 12px rgba(255, 215, 0, 0.3);
}

.btn-flip:hover {
  background-color: #ffcc00;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 20px rgba(255, 215, 0, 0.4);
}

.btn-flip:active {
  transform: translateY(-1px) scale(0.98);
}

/* 卡片背面 */
.card-back {
  animation: fadeIn 0.5s var(--transition-bounce);
}

.phonetic {
  font-size: 2rem;
  color: var(--text-color-medium);
  font-style: italic;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: rgba(173, 216, 230, 0.2);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--accent-green);
}

.meaning {
  font-size: 2.2rem;
  margin-bottom: var(--spacing-lg);
  color: var(--text-color-dark);
  font-weight: 600;
  line-height: 1.8;
  padding: var(--spacing-md);
  background-color: var(--background-color);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-color);
}

.example {
  font-size: 1.4rem;
  color: var(--text-color-light);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(144, 238, 144, 0.1);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--accent-green);
  text-align: left;
}

.example strong {
  color: var(--primary-dark);
  font-weight: 700;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.btn-know, .btn-dont-know, .btn-skip {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-xl);
  border: none;
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  min-width: 140px;
  transition: var(--transition-smooth);
  font-family: 'Quicksand', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-medium);
  position: relative;
  overflow: hidden;
}

.btn-know {
  background-color: var(--accent-green);
  color: var(--text-color-dark);
}

.btn-know:hover {
  background-color: #7ce07c;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(144, 238, 144, 0.4);
}

.btn-dont-know {
  background-color: var(--accent-pink);
  color: var(--text-color-dark);
}

.btn-dont-know:hover {
  background-color: #ff9eb5;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(255, 182, 193, 0.4);
}

.btn-skip {
  background-color: var(--primary-light);
  color: var(--text-color-dark);
}

.btn-skip:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-know:active, .btn-dont-know:active, .btn-skip:active {
  transform: translateY(-1px) scale(0.98);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 5px dashed var(--accent-yellow);
  box-shadow: var(--shadow-soft);
  animation: celebrate 2s var(--transition-bounce);
}

@keyframes celebrate {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.empty-state p {
  font-size: 2.5rem;
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  margin-bottom: var(--spacing-lg);
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.3);
}

.empty-state p::after {
  content: " 🎉";
  animation: party 1s infinite alternate;
}

@keyframes party {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(20deg); }
}

.btn-primary {
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-xl);
  font-size: 1.5rem;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  transition: var(--transition-smooth);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 8px 16px rgba(135, 206, 235, 0.3);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px) scale(0.98);
}

/* 复习控制 */
.review-controls {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.btn-control {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-xl);
  border: 3px solid var(--primary-color);
  background-color: var(--primary-light);
  font-weight: 700;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  transition: var(--transition-smooth);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-soft);
  min-width: 120px;
}

.btn-control:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-medium);
}

.btn-control:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}

.btn-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal-content {
  background-color: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 6px solid var(--primary-color);
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-hard);
  position: relative;
  overflow: hidden;
}

.modal-content::before {
  content: "⚙️";
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 4rem;
  opacity: 0.1;
  transform: rotate(30deg);
}

.modal-content h3 {
  font-size: 2.2rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-lg);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
}

.setting-item {
  margin-bottom: var(--spacing-md);
}

.setting-item label {
  display: block;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
}

.setting-item input, .setting-item select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 3px solid var(--primary-color);
  font-size: 1.1rem;
  font-family: 'Quicksand', sans-serif;
  transition: var(--transition-smooth);
  background-color: var(--background-color);
}

.setting-item input:focus, .setting-item select:focus {
  outline: none;
  border-color: var(--accent-yellow);
  box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3);
}

.setting-item input[type="checkbox"] {
  width: auto;
  transform: scale(1.3);
  margin-right: var(--spacing-sm);
  accent-color: var(--primary-color);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.btn-save, .btn-cancel {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-xl);
  border: none;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  transition: var(--transition-smooth);
  min-width: 100px;
}

.btn-save {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

.btn-save:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.4);
}

.btn-cancel {
  background-color: var(--primary-light);
  color: var(--text-color-dark);
  box-shadow: 0 4px 8px rgba(173, 216, 230, 0.3);
}

.btn-cancel:hover {
  background-color: var(--border-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(224, 224, 224, 0.4);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-page {
    padding: var(--spacing-md);
  }
  
  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .header h1 {
    font-size: 2.5rem;
  }
  
  .header h1::after {
    display: none;
  }
  
  .word {
    font-size: 3.5rem;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-know, .btn-dont-know, .btn-skip {
    width: 100%;
    max-width: 250px;
  }
  
  .review-controls {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .btn-control {
    width: 100%;
    max-width: 250px;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .word {
    font-size: 2.8rem;
  }
  
  .meaning {
    font-size: 1.8rem;
  }
  
  .btn-know, .btn-dont-know, .btn-skip {
    font-size: 1.1rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .modal-content {
    padding: var(--spacing-lg);
  }
}
</style>