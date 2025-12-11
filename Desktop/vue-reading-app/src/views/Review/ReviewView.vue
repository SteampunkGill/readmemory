<!-- src/views/Review/ReviewView.vue -->
<template>
  <DefaultLayout>
    <!-- 复习页面主容器 -->
    <div class="review-page">
      <!-- 顶部复习进度和统计区域 -->
      <div class="review-header">
        <!-- 复习进度卡片 -->
        <div class="progress-card">
          <div class="progress-header">
            <h2 class="progress-title">📚 今日复习</h2>
            <div class="progress-badge" :class="progressBadgeClass">
              {{ progressBadgeText }}
            </div>
          </div>
          
          <!-- 进度条 -->
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${dailyProgress}%` }"
              ></div>
            </div>
            <div class="progress-text">
              <span class="progress-count">
                {{ dailyCompleted }}/{{ dailyGoal.targetWords }} 个单词
              </span>
              <span class="progress-percentage">
                {{ Math.round(dailyProgress) }}%
              </span>
            </div>
          </div>
          
          <!-- 复习统计 -->
          <div class="review-stats">
            <div class="stat-item">
              <div class="stat-icon">🔥</div>
              <div class="stat-content">
                <div class="stat-value">{{ dailyGoal.streakDays }}</div>
                <div class="stat-label">连续复习</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats?.averageAccuracy || 0 }}%</div>
                <div class="stat-label">平均正确率</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏱️</div>
              <div class="stat-content">
                <div class="stat-value">{{ formatDuration(stats?.averageDuration || 0) }}</div>
                <div class="stat-label">平均用时</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 复习设置和模式选择 -->
        <div class="review-controls">
          <div class="control-group">
            <h3 class="control-title">复习模式</h3>
            <div class="mode-buttons">
              <button 
                v-for="mode in reviewModes" 
                :key="mode.id"
                class="mode-button"
                :class="{ active: currentMode === mode.id }"
                @click="changeReviewMode(mode.id)"
              >
                <span class="mode-icon">{{ mode.icon }}</span>
                <span class="mode-name">{{ mode.name }}</span>
              </button>
            </div>
          </div>
          
          <div class="control-group">
            <h3 class="control-title">复习设置</h3>
            <div class="setting-buttons">
              <button class="setting-button" @click="showSettingsModal">
                <span class="setting-icon">⚙️</span>
                <span>复习设置</span>
              </button>
              <button class="setting-button" @click="showGoalModal">
                <span class="setting-icon">🎯</span>
                <span>每日目标</span>
              </button>
              <button class="setting-button" @click="showHistoryModal">
                <span class="setting-icon">📊</span>
                <span>复习历史</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 复习卡片区域 -->
      <div class="review-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-animation">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
          <p class="loading-text">正在准备复习卡片...</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!currentWord && !loading" class="empty-state">
          <div class="empty-illustration">🎉</div>
          <h3 class="empty-title">太棒了！</h3>
          <p class="empty-description">
            今天已经完成了所有复习任务！
          </p>
          <div class="empty-actions">
            <button class="empty-action-button primary" @click="startNewSession">
              <span class="button-icon">🔄</span>
              <span>开始新的复习</span>
            </button>
            <button class="empty-action-button secondary" @click="goToVocabulary">
              <span class="button-icon">📖</span>
              <span>查看生词本</span>
            </button>
          </div>
        </div>
        
        <!-- 复习卡片 -->
        <div v-else class="review-card-container">
          <!-- 复习进度指示 -->
          <div class="session-progress">
            <div class="session-info">
              <span class="session-mode">{{ currentModeLabel }}</span>
              <span class="session-count">
                第 {{ currentIndex + 1 }} / {{ sessionWords.length }} 个
              </span>
            </div>
            <div class="session-timer">
              <span class="timer-icon">⏱️</span>
              <span class="timer-text">{{ formatSessionDuration }}</span>
            </div>
          </div>
          
          <!-- 复习卡片 -->
          <div 
            class="review-card" 
            :class="{ flipped: isCardFlipped }"
            @click="toggleCard"
          >
            <!-- 卡片正面 -->
            <div class="card-front">
              <div class="card-header">
                <div class="word-difficulty" :class="currentWord.difficulty">
                  {{ difficultyLabels[currentWord.difficulty] }}
                </div>
                <div class="word-tags">
                  <span 
                    v-for="tag in currentWord.tags" 
                    :key="tag"
                    class="word-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              
              <div class="card-content">
                <div class="word-display">
                  <h2 class="word-text">{{ currentWord.word }}</h2>
                  <div class="word-phonetic">
                    <span class="phonetic-text">{{ currentWord.phonetic }}</span>
                    <button 
                      class="pronounce-button"
                      @click.stop="pronounceWord(currentWord.word)"
                    >
                      🔊
                    </button>
                  </div>
                </div>
                
                <div class="card-hint">
                  <span class="hint-icon">👆</span>
                  <span class="hint-text">点击卡片查看释义</span>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="word-source">
                  <span class="source-icon">📚</span>
                  <span class="source-text">{{ currentWord.source || '未知来源' }}</span>
                </div>
                <div class="review-count">
                  <span class="count-icon">🔄</span>
                  <span class="count-text">已复习 {{ currentWord.reviewCount }} 次</span>
                </div>
              </div>
            </div>
            
            <!-- 卡片背面 -->
            <div class="card-back">
              <div class="card-header">
                <div class="back-title">单词释义</div>
                <button class="flip-back-button" @click.stop="toggleCard">
                  ↩️
                </button>
              </div>
              
              <div class="card-content">
                <div class="definition-section">
                  <div class="part-of-speech">
                    {{ currentWord.partOfSpeech }}
                  </div>
                  <p class="definition-text">
                    {{ currentWord.definition }}
                  </p>
                </div>
                
                <div v-if="currentWord.example" class="example-section">
                  <div class="example-label">例句</div>
                  <p class="example-text">
                    "{{ currentWord.example }}"
                  </p>
                </div>
                
                <div class="mastery-section">
                  <div class="mastery-label">掌握程度</div>
                  <div class="mastery-level">
                    <div 
                      class="mastery-bar"
                      :style="{ width: `${currentWord.masteryLevel * 20}%` }"
                    ></div>
                    <div class="mastery-stars">
                      <span 
                        v-for="i in 5" 
                        :key="i"
                        class="mastery-star"
                        :class="{ filled: i <= currentWord.masteryLevel }"
                      >
                        ★
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="review-dates">
                  <div class="date-item">
                    <span class="date-label">上次复习：</span>
                    <span class="date-value">{{ currentWord.lastReviewedAt || '从未' }}</span>
                  </div>
                  <div class="date-item">
                    <span class="date-label">下次复习：</span>
                    <span class="date-value">{{ currentWord.nextReviewAt || '待定' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 复习操作按钮 -->
          <div class="review-actions">
            <button 
              class="action-button wrong" 
              @click="submitReview(false)"
              :disabled="isSubmitting"
            >
              <span class="action-icon">❌</span>
              <span class="action-text">不认识</span>
            </button>
            
            <button 
              class="action-button skip" 
              @click="skipWord"
              :disabled="isSubmitting"
            >
              <span class="action-icon">⏭️</span>
              <span class="action-text">跳过</span>
            </button>
            
            <button 
              class="action-button correct" 
              @click="submitReview(true)"
              :disabled="isSubmitting"
            >
              <span class="action-icon">✅</span>
              <span class="action-text">认识</span>
            </button>
          </div>
          
          <!-- 快速操作 -->
          <div class="quick-actions">
            <button 
              class="quick-action-button"
              @click="addToVocabulary"
              :title="isInVocabulary ? '已在生词本中' : '添加到生词本'"
              :disabled="isInVocabulary"
            >
              <span class="quick-action-icon">
                {{ isInVocabulary ? '📚' : '➕' }}
              </span>
              <span class="quick-action-text">
                {{ isInVocabulary ? '已收藏' : '收藏' }}
              </span>
            </button>
            
            <button 
              class="quick-action-button"
              @click="showMoreInfo"
              title="查看详细释义"
            >
              <span class="quick-action-icon">🔍</span>
              <span class="quick-action-text">详情</span>
            </button>
            
            <button 
              class="quick-action-button"
              @click="toggleAutoFlip"
              :title="autoFlip ? '关闭自动翻转' : '开启自动翻转'"
            >
              <span class="quick-action-icon">
                {{ autoFlip ? '⏸️' : '▶️' }}
              </span>
              <span class="quick-action-text">
                {{ autoFlip ? '自动' : '手动' }}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 复习完成弹窗 -->
      <AppModal 
        v-if="showCompletionModal" 
        @close="showCompletionModal = false"
        title="🎉 复习完成！"
      >
        <div class="completion-modal">
          <div class="completion-stats">
            <div class="completion-stat">
              <div class="stat-value">{{ sessionResults.correctWords }}</div>
              <div class="stat-label">正确</div>
            </div>
            <div class="completion-stat">
              <div class="stat-value">{{ sessionResults.incorrectWords }}</div>
              <div class="stat-label">错误</div>
            </div>
            <div class="completion-stat">
              <div class="stat-value">{{ sessionResults.accuracy }}%</div>
              <div class="stat-label">正确率</div>
            </div>
            <div class="completion-stat">
              <div class="stat-value">{{ formatDuration(sessionResults.duration) }}</div>
              <div class="stat-label">用时</div>
            </div>
          </div>
          
          <div class="completion-message">
            <p v-if="sessionResults.accuracy >= 80" class="message-text">
              太棒了！你的表现非常出色！继续保持！
            </p>
            <p v-else-if="sessionResults.accuracy >= 60" class="message-text">
              不错！继续努力，下次会更好！
            </p>
            <p v-else class="message-text">
              没关系，学习需要时间。多复习几次就会记住的！
            </p>
          </div>
          
          <div class="completion-actions">
            <button class="completion-button primary" @click="startNewSession">
              继续复习
            </button>
            <button class="completion-button secondary" @click="goToDashboard">
              返回书架
            </button>
          </div>
        </div>
      </AppModal>
      
      <!-- 复习设置弹窗 -->
      <AppModal 
        v-if="showSettingsModal" 
        @close="showSettingsModal = false"
        title="⚙️ 复习设置"
      >
        <div class="settings-modal">
          <div class="settings-section">
            <h4 class="settings-title">复习模式</h4>
            <div class="settings-options">
              <label 
                v-for="mode in reviewModes" 
                :key="mode.id"
                class="settings-option"
              >
                <input 
                  type="radio" 
                  :value="mode.id" 
                  v-model="currentMode"
                  @change="updateReviewSettings"
                >
                <span class="option-icon">{{ mode.icon }}</span>
                <span class="option-text">{{ mode.name }}</span>
                <span class="option-description">{{ mode.description }}</span>
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h4 class="settings-title">复习数量</h4>
            <div class="settings-slider">
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                v-model.number="reviewSettings.wordCount"
                @change="updateReviewSettings"
                class="slider-input"
              >
              <div class="slider-labels">
                <span class="slider-label">5</span>
                <span class="slider-value">{{ reviewSettings.wordCount }}</span>
                <span class="slider-label">50</span>
              </div>
            </div>
          </div>
          
          <div class="settings-section">
            <h4 class="settings-title">自动翻转</h4>
            <div class="settings-toggle">
              <label class="toggle-label">
                <input 
                  type="checkbox" 
                  v-model="reviewSettings.autoFlip"
                  @change="updateReviewSettings"
                  class="toggle-input"
                >
                <span class="toggle-slider"></span>
                <span class="toggle-text">
                  {{ reviewSettings.autoFlip ? '开启' : '关闭' }}
                </span>
              </label>
              <p class="toggle-description">
                开启后，卡片会在显示单词后自动翻转显示释义
              </p>
            </div>
          </div>
          
          <div class="settings-actions">
            <button 
              class="settings-button primary" 
              @click="saveSettings"
            >
              保存设置
            </button>
            <button 
              class="settings-button secondary" 
              @click="showSettingsModal = false"
            >
              取消
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AppModal from '@/components/common/AppModal.vue'
import reviewService from '@/services/review.service.js'
import { useReviewStore } from '@/stores/review.store'
import { useVocabularyStore } from '@/stores/vocabulary.store'
import { formatDuration, formatPercentage } from '@/utils/formatters'
import { showSuccess, showError, showWarning } from '@/utils/notify'

const router = useRouter()
const reviewStore = useReviewStore()
const vocabularyStore = useVocabularyStore()

// 响应式数据
const loading = ref(false)
const isSubmitting = ref(false)
const isCardFlipped = ref(false)
const autoFlip = ref(false)
const showCompletionModal = ref(false)
const showSettingsModal = ref(false)
const showGoalModal = ref(false)
const showHistoryModal = ref(false)

// 复习会话数据
const sessionWords = ref([])
const currentIndex = ref(0)
const sessionStartTime = ref(null)
const sessionResults = ref({
  correctWords: 0,
  incorrectWords: 0,
  accuracy: 0,
  duration: 0
})

// 复习设置
const currentMode = ref('recognition')
const reviewSettings = ref({
  wordCount: 20,
  autoFlip: false,
  difficulty: 'all',
  language: 'en'
})

// 复习模式配置
const reviewModes = ref([
  {
    id: 'recognition',
    name: '识别模式',
    icon: '👁️',
    description: '看单词，回忆释义'
  },
  {
    id: 'recall',
    name: '回忆模式',
    icon: '🧠',
    description: '看释义，回忆单词'
  },
  {
    id: 'listening',
    name: '听力模式',
    icon: '👂',
    description: '听发音，识别单词'
  },
  {
    id: 'spelling',
    name: '拼写模式',
    icon: '✍️',
    description: '听发音，拼写单词'
  }
])

// 难度标签
const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

// 计算属性
const currentWord = computed(() => {
  return sessionWords.value[currentIndex.value]
})

const currentModeLabel = computed(() => {
  const mode = reviewModes.value.find(m => m.id === currentMode.value)
  return mode ? mode.name : '识别模式'
})

const dailyGoal = computed(() => {
  return reviewStore.dailyGoal || { targetWords: 20, completedToday: 0 }
})

const dailyCompleted = computed(() => {
  return dailyGoal.value.completedToday || 0
})

const dailyProgress = computed(() => {
  if (!dailyGoal.value.targetWords) return 0
  return (dailyCompleted.value / dailyGoal.value.targetWords) * 100
})

const progressBadgeClass = computed(() => {
  if (dailyProgress.value >= 100) return 'badge-excellent'
  if (dailyProgress.value >= 70) return 'badge-good'
  if (dailyProgress.value >= 30) return 'badge-fair'
  return 'badge-poor'
})

const progressBadgeText = computed(() => {
  if (dailyProgress.value >= 100) return '超额完成！'
  if (dailyProgress.value >= 70) return '进展顺利'
  if (dailyProgress.value >= 30) return '继续加油'
  return '开始复习'
})

const stats = computed(() => reviewStore.stats)

const formatSessionDuration = computed(() => {
  if (!sessionStartTime.value) return '0:00'
  const duration = Math.floor((Date.now() - sessionStartTime.value) / 1000)
  return formatDuration(duration)
})

const isInVocabulary = computed(() => {
  if (!currentWord.value) return false
  return vocabularyStore.items.some(item => item.word === currentWord.value.word)
})

// 生命周期钩子
onMounted(async () => {
  await loadInitialData()
  await startNewSession()
})

onUnmounted(() => {
  // 清理自动翻转定时器
  if (autoFlipTimer.value) {
    clearTimeout(autoFlipTimer.value)
  }
})

// 自动翻转定时器
const autoFlipTimer = ref(null)

// 方法
const loadInitialData = async () => {
  try {
    loading.value = true
    await Promise.all([
      reviewService.getDailyGoal(),
      reviewService.getReviewStats(),
      reviewService.getReviewProgress()
    ])
  } catch (error) {
    showError('加载复习数据失败')
    console.error('加载复习数据失败:', error)
  } finally {
    loading.value = false
  }
}

const startNewSession = async () => {
  try {
    loading.value = true
    showCompletionModal.value = false
    
    // 获取待复习单词
    const words = await reviewService.getDueWords({
      limit: reviewSettings.value.wordCount,
      language: reviewSettings.value.language,
      difficulty: reviewSettings.value.difficulty === 'all' ? null : reviewSettings.value.difficulty
    })
    
    if (words.length === 0) {
      showWarning('当前没有需要复习的单词')
      return
    }
    
    // 初始化会话
    sessionWords.value = words
    currentIndex.value = 0
    sessionStartTime.value = Date.now()
    isCardFlipped.value = false
    
    // 开始复习会话
    await reviewService.startReviewSession({
      mode: currentMode.value,
      wordCount: words.length,
      language: reviewSettings.value.language
    })
    
    showSuccess(`开始复习会话，共 ${words.length} 个单词`)
  } catch (error) {
    showError('开始复习会话失败')
    console.error('开始复习会话失败:', error)
  } finally {
    loading.value = false
  }
}

const toggleCard = () => {
  isCardFlipped.value = !isCardFlipped.value
}

const submitReview = async (isCorrect) => {
  if (!currentWord.value || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    // 记录复习结果
    reviewService.recordWordReview(
      currentWord.value.id,
      isCorrect,
      {
        reviewType: currentMode.value,
        responseTime: 1000 // 模拟响应时间，实际应该计算
      }
    )
    
    // 更新统计
    if (isCorrect) {
      sessionResults.value.correctWords++
    } else {
      sessionResults.value.incorrectWords++
    }
    
    // 计算准确率
    const total = sessionResults.value.correctWords + sessionResults.value.incorrectWords
    sessionResults.value.accuracy = total > 0 
      ? Math.round((sessionResults.value.correctWords / total) * 100)
      : 0
    
    // 移动到下一个单词
    await nextWord()
  } catch (error) {
    showError('提交复习结果失败')
    console.error('提交复习结果失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const skipWord = async () => {
  if (!currentWord.value || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    await nextWord()
  } catch (error) {
    showError('跳过单词失败')
    console.error('跳过单词失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const nextWord = async () => {
  // 重置卡片状态
  isCardFlipped.value = false
  
  // 检查是否还有下一个单词
  if (currentIndex.value < sessionWords.value.length - 1) {
    currentIndex.value++
    
    // 如果开启自动翻转，设置定时器
    if (autoFlip.value) {
      autoFlipTimer.value = setTimeout(() => {
        isCardFlipped.value = true
      }, 2000) // 2秒后自动翻转
    }
  } else {
    // 复习完成，结束会话
    await endSession()
  }
}

const endSession = async () => {
  try {
    // 计算会话时长
    const duration = Math.floor((Date.now() - sessionStartTime.value) / 1000)
    sessionResults.value.duration = duration
    
    // 结束会话
    const endedSession = await reviewService.endReviewSession()
    
    if (endedSession) {
      // 显示完成弹窗
      showCompletionModal.value = true
      
      // 刷新统计数据
      await reviewService.getReviewStats({ forceRefresh: true })
      await reviewService.getDailyGoal()
    }
  } catch (error) {
    console.error('结束复习会话失败:', error)
  }
}

const changeReviewMode = (modeId) => {
  currentMode.value = modeId
  // 重新开始会话以应用新模式
  startNewSession()
}

const toggleAutoFlip = () => {
  autoFlip.value = !autoFlip.value
  reviewSettings.value.autoFlip = autoFlip.value
}

const addToVocabulary = async () => {
  if (!currentWord.value || isInVocabulary.value) return
  
  try {
    await vocabularyStore.addItem({
      word: currentWord.value.word,
      definition: currentWord.value.definition,
      example: currentWord.value.example,
      phonetic: currentWord.value.phonetic,
      partOfSpeech: currentWord.value.partOfSpeech,
      source: currentWord.value.source,
      tags: currentWord.value.tags
    })
    
    showSuccess('已添加到生词本')
  } catch (error) {
    showError('添加到生词本失败')
    console.error('添加到生词本失败:', error)
  }
}

const pronounceWord = (word) => {
  // 使用Web Speech API发音
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    speechSynthesis.speak(utterance)
  } else {
    showWarning('您的浏览器不支持语音合成')
  }
}

const showMoreInfo = () => {
  if (currentWord.value) {
    router.push({
      name: 'VocabularyDetail',
      params: { id: currentWord.value.id }
    })
  }
}

const updateReviewSettings = () => {
  // 更新自动翻转状态
  autoFlip.value = reviewSettings.value.autoFlip
}

const saveSettings = async () => {
  try {
    // 保存每日目标
    await reviewService.updateDailyGoal({
      targetWords: reviewSettings.value.wordCount
    })
    
    showSuccess('设置已保存')
    showSettingsModal.value = false
    
    // 重新开始会话以应用新设置
    await startNewSession()
  } catch (error) {
    showError('保存设置失败')
    console.error('保存设置失败:', error)
  }
}

const goToVocabulary = () => {
  router.push({ name: 'Vocabulary' })
}

const goToDashboard = () => {
  router.push({ name: 'Dashboard' })
}
</script>

<style scoped>
.review-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 头部样式 */
.review-header {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .review-header {
    grid-template-columns: 1fr;
  }
}

/* 进度卡片 */
.progress-card {
  background: linear-gradient(135deg, #ffd6e7 0%, #c1f0ff 100%);
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffb8d9;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.progress-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0;
}

.progress-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  color: white;
}

.badge-excellent {
  background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
}

.badge-good {
  background: linear-gradient(135deg, #ffcc00 0%, #ff9500 100%);
}

.badge-fair {
  background: linear-gradient(135deg, #ff9500 0%, #ff3b30 100%);
}

.badge-poor {
  background: linear-gradient(135deg, #ff3b30 0%, #ff2d55 100%);
}

/* 进度条 */
.progress-bar-container {
  margin-bottom: 24px;
}

.progress-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: #666;
}

/* 复习统计 */
.review-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b9d;
}

.stat-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 复习控制 */
.review-controls {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0fff4 100%);
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #a8e6cf;
}

.control-group {
  margin-bottom: 24px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #36cfc9;
  margin: 0 0 16px 0;
}

/* 模式按钮 */
.mode-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mode-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: white;
  border: 3px solid #d9f7be;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Quicksand', sans-serif;
}

.mode-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.mode-button.active {
  background: linear-gradient(135deg, #b5f5ec 0%, #d9f7be 100%);
  border-color: #36cfc9;
}

.mode-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

/* 设置按钮 */
.setting-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.setting-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: white;
  border: 2px solid #ffccc7;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Quicksand', sans-serif;
}

.setting-button:hover {
  background: #fff2e8;
  transform: scale(1.05);
}

.setting-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

/* 复习内容区域 */
.review-content {
  min-height: 500px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-animation {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.loading-dot {
  width: 20px;
  height: 20px;
  background: #ff6b9d;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-illustration {
  font-size: 80px;
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.empty-title {
  font-family: 'Kalam', cursive;
  font-size: 36px;
  color: #ff6b9d;
  margin-bottom: 16px;
}

.empty-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #666;
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.empty-action-button {
  padding: 16px 32px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.empty-action-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.empty-action-button.secondary {
  background: white;
  color: #666;
  border: 3px solid #d9f7be;
}

.empty-action-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 复习卡片容器 */
.review-card-container {
  max-width: 600px;
  margin: 0 auto;
}

/* 会话进度 */
.session-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  border-radius: 25px;
  border: 3px dashed #bae7ff;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-mode {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #36cfc9;
}

.session-count {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
}

.session-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #ff6b9d;
  font-weight: 600;
}

/* 复习卡片 */
.review-card {
  position: relative;
  width: 100%;
  height: 400px;
  perspective: 1000px;
  cursor: pointer;
  margin-bottom: 32px;
}

.review-card.flipped .card-front {
  transform: rotateY(180deg);
}

.review-card.flipped .card-back {
  transform: rotateY(0deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 32px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-front {
  background: linear-gradient(135deg, #fff2e8 0%, #f6ffed 100%);
  border: 4px solid #ffd591;
}

.card-back {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0fff4 100%);
  border: 4px solid #91d5ff;
  transform: rotateY(180deg);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.word-difficulty {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.word-difficulty.easy {
  background: linear-gradient(135deg, #73d13d 0%, #52c41a 100%);
}

.word-difficulty.medium {
  background: linear-gradient(135deg, #ffa940 0%, #fa8c16 100%);
}

.word-difficulty.hard {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
}

.word-tags {
  display: flex;
  gap: 8px;
}

.word-tag {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  font-size: 12px;
  color: #666;
  border: 1px solid #d9d9d9;
}

.back-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #1890ff;
}

.flip-back-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.flip-back-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 卡片内容 */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.word-display {
  text-align: center;
  margin-bottom: 32px;
}

.word-text {
  font-family: 'Caveat', cursive;
  font-size: 64px;
  color: #ff6b9d;
  margin: 0 0 16px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.word-phonetic {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}

.phonetic-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 24px;
  color: #666;
  font-style: italic;
}

.pronounce-button {
  background: rgba(255, 107, 157, 0.1);
  border: 2px solid #ff6b9d;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pronounce-button:hover {
  background: #ff6b9d;
  color: white;
  transform: scale(1.1);
}

.card-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  border: 2px dashed #ffcc00;
}

.hint-icon {
  font-size: 20px;
}

.hint-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 2px dashed rgba(0, 0, 0, 0.1);
}

.word-source,
.review-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

.source-icon,
.count-icon {
  font-size: 16px;
}

/* 卡片背面内容 */
.definition-section {
  margin-bottom: 32px;
  text-align: center;
}

.part-of-speech {
  display: inline-block;
  padding: 4px 12px;
  background: #bae7ff;
  border-radius: 15px;
  font-size: 14px;
  color: #1890ff;
  margin-bottom: 16px;
  font-weight: 600;
}

.definition-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 24px;
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.example-section {
  margin-bottom: 32px;
  text-align: center;
}

.example-label {
  font-family: 'Caveat', cursive;
  font-size: 20px;
  color: #36cfc9;
  margin-bottom: 8px;
}

.example-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #666;
  font-style: italic;
  line-height: 1.6;
  margin: 0;
  padding: 0 20px;
}

.mastery-section {
  text-align: center;
}

.mastery-label {
  font-family: 'Caveat', cursive;
  font-size: 20px;
  color: #ff6b9d;
  margin-bottom: 12px;
}

.mastery-level {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.mastery-bar {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #ffcc00 0%, #ff6b9d 100%);
  border-radius: 12px;
  transition: width 1s ease;
}

.mastery-stars {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.mastery-star {
  font-size: 24px;
  color: #ddd;
  transition: color 0.3s ease;
}

.mastery-star.filled {
  color: #ffcc00;
}

.review-dates {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
}

.date-item {
  display: flex;
  gap: 4px;
}

.date-label {
  color: #888;
}

.date-value {
  color: #333;
  font-weight: 600;
}

/* 复习操作按钮 */
.review-actions {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
}

.action-button {
  padding: 20px 40px;
  border-radius: 30px;
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.action-button:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.wrong {
  background: linear-gradient(135deg, #ffccc7 0%, #ffa39e 100%);
  color: #cf1322;
  border: 3px solid #ff7875;
}

.action-button.skip {
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  color: #d46b08;
  border: 3px solid #ffc069;
}

.action-button.correct {
  background: linear-gradient(135deg, #d9f7be 0%, #b7eb8f 100%);
  color: #389e0d;
  border: 3px solid #73d13d;
}

.action-icon {
  font-size: 24px;
}

/* 快速操作 */
.quick-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.quick-action-button {
  padding: 12px 24px;
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-action-button:hover:not(:disabled) {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-action-icon {
  font-size: 16px;
}

/* 完成弹窗 */
.completion-modal {
  padding: 24px;
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.completion-stat {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  border-radius: 20px;
  border: 2px solid #bae7ff;
}

.completion-stat .stat-value {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  color: #ff6b9d;
  margin-bottom: 8px;
}

.completion-stat .stat-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.completion-message {
  text-align: center;
  margin-bottom: 32px;
}

.message-text {
  font-family: 'Comfortaa', cursive;
  font-size: 20px;
  color: #333;
  line-height: 1.6;
}

.completion-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.completion-button {
  padding: 16px 32px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.completion-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.completion-button.secondary {
  background: white;
  color: #666;
  border: 3px solid #d9f7be;
}

.completion-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 设置弹窗 */
.settings-modal {
  padding: 24px;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-title {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  color: #36cfc9;
  margin: 0 0 16px 0;
}

.settings-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.settings-option {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: white;
  border: 2px solid #d9f7be;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.settings-option:hover {
  border-color: #36cfc9;
  transform: translateY(-2px);
}

.settings-option input[type="radio"] {
  position: absolute;
  opacity: 0;
}

.settings-option input[type="radio"]:checked + .option-icon {
  background: #b5f5ec;
}

.option-icon {
  font-size: 24px;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 50%;
  background: #f0f0f0;
  display: inline-block;
  width: 40px;
  height: 40px;
  text-align: center;
  line-height: 24px;
}

.option-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.option-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #888;
}

/* 滑块 */
.settings-slider {
  padding: 16px;
  background: white;
  border: 2px solid #ffccc7;
  border-radius: 20px;
}

.slider-input {
  width: 100%;
  height: 20px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, #ffccc7 0%, #ff6b9d 100%);
  border-radius: 10px;
  outline: none;
  margin-bottom: 12px;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  border: 3px solid #ff6b9d;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
}

.slider-value {
  font-family: 'Kalam', cursive;
  font-size: 24px;
  color: #ff6b9d;
  font-weight: bold;
}

/* 开关 */
.settings-toggle {
  padding: 16px;
  background: white;
  border: 2px solid #d9f7be;
  border-radius: 20px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 60px;
  height: 30px;
  background: #ddd;
  border-radius: 15px;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 26px;
  height: 26px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: #36cfc9;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(30px);
}

.toggle-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.toggle-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
  margin-top: 8px;
  margin-left: 72px;
}

/* 设置按钮 */
.settings-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
}

.settings-button {
  padding: 12px 24px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.settings-button.primary {
  background: linear-gradient(135deg, #36cfc9 0%, #73d13d 100%);
  color: white;
}

.settings-button.secondary {
  background: white;
  color: #666;
  border: 2px solid #d9d9d9;
}

.settings-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .review-page {
    padding: 16px;
  }
  
  .progress-title {
    font-size: 24px;
  }
  
  .word-text {
    font-size: 48px;
  }
  
  .definition-text {
    font-size: 20px;
  }
  
  .review-actions {
    gap: 16px;
  }
  
  .action-button {
    padding: 16px 24px;
    font-size: 16px;
  }
  
  .review-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .mode-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .setting-buttons {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .review-stats {
    grid-template-columns: 1fr;
  }
  
  .mode-buttons {
    grid-template-columns: 1fr;
  }
  
  .setting-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .review-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
}
</style>