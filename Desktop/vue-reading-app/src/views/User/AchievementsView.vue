<template>
  <div class="achievements-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">成就徽章</h1>
      <p class="page-subtitle">解锁成就，记录你的学习旅程</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载成就中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadAchievements" class="error-retry-btn">重试</button>
    </div>

    <!-- 主要内容 -->
    <div v-if="!loading && !error" class="achievements-content">
      <!-- 成就概览卡片 -->
      <div class="overview-card">
        <div class="overview-header">
          <h2 class="overview-title">成就概览</h2>
          <div class="overview-stats">
            <span class="stats-text">已解锁 {{ unlockedCount }}/{{ totalCount }} 个成就</span>
          </div>
        </div>
        
        <div class="overview-body">
          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">总体进度</span>
              <span class="progress-percentage">{{ progressPercentage }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
            <div class="progress-details">
              <div class="detail-item">
                <span class="detail-icon">🏆</span>
                <span class="detail-text">总成就数: {{ totalCount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">✅</span>
                <span class="detail-text">已解锁: {{ unlockedCount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">⏳</span>
                <span class="detail-text">进行中: {{ inProgressCount }}</span>
              </div>
            </div>
          </div>

          <!-- 等级展示 -->
          <div class="level-section">
            <h3 class="section-title">当前等级</h3>
            <div class="level-display">
              <div class="level-icon">⭐</div>
              <div class="level-info">
                <div class="level-name">{{ currentLevelName }}</div>
                <div class="level-number">等级 {{ currentLevel }}</div>
              </div>
              <div class="level-progress">
                <div class="progress-text">
                  {{ currentPoints }}/{{ nextLevelPoints }} 积分
                </div>
                <div class="progress-bar small">
                  <div 
                    class="progress-fill" 
                    :style="{ width: levelProgress + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 最近解锁 -->
          <div v-if="recentAchievements.length > 0" class="recent-section">
            <h3 class="section-title">最近解锁</h3>
            <div class="recent-grid">
              <div 
                v-for="achievement in recentAchievements" 
                :key="achievement.id"
                class="recent-item"
                @click="showAchievementDetail(achievement)"
              >
                <div class="recent-icon">{{ achievement.icon || '🏆' }}</div>
                <div class="recent-content">
                  <h4 class="recent-name">{{ achievement.name }}</h4>
                  <p class="recent-date">{{ achievement.unlockedAt }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 筛选和排序 -->
      <div class="filter-section">
        <div class="filter-group">
          <label class="filter-label">筛选:</label>
          <div class="filter-options">
            <button 
              v-for="filter in filters" 
              :key="filter.value"
              @click="setFilter(filter.value)"
              class="filter-btn"
              :class="{ active: currentFilter === filter.value }"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        
        <div class="sort-group">
          <label class="sort-label">排序:</label>
          <select v-model="currentSort" class="sort-select">
            <option value="date">解锁时间</option>
            <option value="name">名称</option>
            <option value="rarity">稀有度</option>
            <option value="points">积分</option>
          </select>
        </div>
      </div>

      <!-- 成就网格 -->
      <div class="achievements-grid">
        <div 
          v-for="achievement in filteredAchievements" 
          :key="achievement.id"
          class="achievement-card"
          :class="{
            'unlocked': achievement.unlocked,
            'locked': !achievement.unlocked,
            'rare': achievement.rarity === 'rare',
            'epic': achievement.rarity === 'epic',
            'legendary': achievement.rarity === 'legendary'
          }"
          @click="showAchievementDetail(achievement)"
        >
          <!-- 成就图标 -->
          <div class="achievement-icon">
            <span class="icon-symbol">{{ achievement.icon || '🏆' }}</span>
            <div v-if="achievement.unlocked" class="unlocked-badge">✓</div>
          </div>

          <!-- 成就信息 -->
          <div class="achievement-info">
            <h3 class="achievement-name">{{ achievement.name }}</h3>
            <p class="achievement-description">{{ achievement.description }}</p>
            
            <!-- 进度条（如果未解锁） -->
            <div v-if="!achievement.unlocked" class="achievement-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: achievement.formattedProgress }"
                ></div>
              </div>
              <span class="progress-text">
                {{ achievement.progress }}/{{ achievement.total }}
              </span>
            </div>

            <!-- 解锁信息（如果已解锁） -->
            <div v-if="achievement.unlocked" class="achievement-unlocked">
              <span class="unlocked-date">{{ achievement.unlockedAt }}</span>
              <span class="points-badge">{{ achievement.points }} 积分</span>
            </div>

            <!-- 稀有度标签 -->
            <div v-if="achievement.rarity && achievement.rarity !== 'common'" 
                 class="rarity-badge"
                 :class="achievement.rarity">
              {{ getRarityLabel(achievement.rarity) }}
            </div>
          </div>

          <!-- 类别标签 -->
          <div class="category-badge" :class="achievement.category">
            {{ getCategoryLabel(achievement.category) }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAchievements.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3 class="empty-title">暂无成就</h3>
        <p class="empty-text">开始学习，解锁你的第一个成就吧！</p>
        <button @click="goToLearning" class="empty-action-btn">开始学习</button>
      </div>

      <!-- 成就详情模态框 -->
      <div v-if="selectedAchievement" class="modal-overlay" @click.self="closeAchievementDetail">
        <div class="modal-content achievement-detail-modal">
          <!-- 关闭按钮 -->
          <button @click="closeAchievementDetail" class="modal-close-btn">×</button>
          
          <!-- 成就图标 -->
          <div class="detail-icon">
            <span class="icon-symbol">{{ selectedAchievement.icon || '🏆' }}</span>
          </div>

          <!-- 成就信息 -->
          <div class="detail-info">
            <h3 class="detail-name">{{ selectedAchievement.name }}</h3>
            <p class="detail-description">{{ selectedAchievement.description }}</p>
            
            <!-- 解锁状态 -->
            <div v-if="selectedAchievement.unlocked" class="unlocked-status">
              <div class="status-icon">✅</div>
              <div class="status-text">
                <p class="status-title">已解锁</p>
                <p class="status-date">{{ selectedAchievement.unlockedAt }}</p>
              </div>
            </div>
            
            <!-- 进度信息 -->
            <div class="progress-info">
              <div class="progress-item">
                <span class="progress-label">进度:</span>
                <span class="progress-value">
                  {{ selectedAchievement.progress }}/{{ selectedAchievement.total }}
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: selectedAchievement.formattedProgress }"
                ></div>
              </div>
            </div>

            <!-- 奖励信息 -->
            <div class="rewards-section">
              <h4 class="rewards-title">奖励</h4>
              <div class="rewards-grid">
                <div class="reward-item">
                  <span class="reward-icon">⭐</span>
                  <span class="reward-text">{{ selectedAchievement.points }} 积分</span>
                </div>
                <div v-if="selectedAchievement.rarity && selectedAchievement.rarity !== 'common'" 
                     class="reward-item">
                  <span class="reward-icon">✨</span>
                  <span class="reward-text">{{ getRarityLabel(selectedAchievement.rarity) }} 成就</span>
                </div>
              </div>
            </div>

            <!-- 解锁条件 -->
            <div class="conditions-section">
              <h4 class="conditions-title">解锁条件</h4>
              <ul class="conditions-list">
                <li v-if="selectedAchievement.category" class="condition-item">
                  <span class="condition-icon">📁</span>
                  <span class="condition-text">类别: {{ getCategoryLabel(selectedAchievement.category) }}</span>
                </li>
                <li class="condition-item">
                  <span class="condition-icon">🎯</span>
                  <span class="condition-text">需要完成 {{ selectedAchievement.total }} 次</span>
                </li>
                <li v-if="selectedAchievement.requirements" class="condition-item">
                  <span class="condition-icon">📝</span>
                  <span class="condition-text">{{ selectedAchievement.requirements }}</span>
                </li>
              </ul>
            </div>

            <!-- 操作按钮 -->
            <div class="detail-actions">
              <button v-if="!selectedAchievement.unlocked" 
                      @click="shareAchievementProgress" 
                      class="action-btn share-btn">
                <span class="btn-icon">📤</span>
                <span class="btn-text">分享进度</span>
              </button>
              <button v-if="selectedAchievement.unlocked" 
                      @click="shareAchievement" 
                      class="action-btn share-btn">
                <span class="btn-icon">📤</span>
                <span class="btn-text">分享成就</span>
              </button>
              <button @click="closeAchievementDetail" class="action-btn close-btn">
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息卡片 -->
      <div class="stats-cards">
        <!-- 按类别统计 -->
        <div class="stats-card category-stats">
          <h3 class="stats-title">按类别统计</h3>
          <div class="stats-content">
            <div v-for="category in categoryStats" :key="category.name" class="category-item">
              <div class="category-header">
                <span class="category-name">{{ getCategoryLabel(category.name) }}</span>
                <span class="category-count">{{ category.unlocked }}/{{ category.total }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: category.percentage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按稀有度统计 -->
        <div class="stats-card rarity-stats">
          <h3 class="stats-title">按稀有度统计</h3>
          <div class="stats-content">
            <div v-for="rarity in rarityStats" :key="rarity.name" class="rarity-item">
              <div class="rarity-header">
                <span class="rarity-name">{{ getRarityLabel(rarity.name) }}</span>
                <span class="rarity-count">{{ rarity.unlocked }}/{{ rarity.total }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: rarity.percentage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 积分统计 -->
        <div class="stats-card points-stats">
          <h3 class="stats-title">积分统计</h3>
          <div class="stats-content">
            <div class="points-total">
              <span class="points-icon">🏅</span>
              <div class="points-info">
                <div class="points-value">{{ totalPoints }}</div>
                <div class="points-label">总积分</div>
              </div>
            </div>
            <div class="points-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">已解锁成就积分</span>
                <span class="breakdown-value">{{ unlockedPoints }}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">平均每个成就积分</span>
                <span class="breakdown-value">{{ averagePoints }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 成就时间线 -->
      <div v-if="unlockedAchievements.length > 0" class="timeline-section">
        <h3 class="section-title">成就时间线</h3>
        <div class="timeline-container">
          <div class="timeline">
            <div 
              v-for="(achievement, index) in timelineAchievements" 
              :key="achievement.id"
              class="timeline-item"
              :class="{ 'left': index % 2 === 0, 'right': index % 2 !== 0 }"
            >
              <div class="timeline-content">
                <div class="timeline-date">{{ achievement.unlockedAt }}</div>
                <div class="timeline-icon">{{ achievement.icon || '🏆' }}</div>
                <h4 class="timeline-name">{{ achievement.name }}</h4>
                <p class="timeline-description">{{ achievement.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import userService from '@/services/user.service'
import { useUserStore } from '@/stores/user.store'
import { formatDate, formatNumber } from '@/utils/formatter'

// 路由
const router = useRouter()

// 状态管理
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const error = ref(null)
const selectedAchievement = ref(null)
const currentFilter = ref('all')
const currentSort = ref('date')

// 筛选选项
const filters = [
  { label: '全部', value: 'all' },
  { label: '已解锁', value: 'unlocked' },
  { label: '未解锁', value: 'locked' },
  { label: '阅读类', value: 'reading' },
  { label: '词汇类', value: 'vocabulary' },
  { label: '复习类', value: 'review' },
  { label: '坚持类', value: 'streak' }
]

// 计算属性
const achievements = computed(() => userStore.achievements)
const unlockedCount = computed(() => userStore.unlockedAchievementsCount)
const totalCount = computed(() => userStore.totalAchievementsCount)
const progressPercentage = computed(() => userStore.achievementProgress)

const unlockedAchievements = computed(() => 
  achievements.value.filter(a => a.unlocked)
)

const lockedAchievements = computed(() => 
  achievements.value.filter(a => !a.unlocked)
)

const recentAchievements = computed(() => 
  [...unlockedAchievements.value]
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 3)
)

const filteredAchievements = computed(() => {
  let filtered = [...achievements.value]
  
  // 应用筛选
  if (currentFilter.value === 'unlocked') {
    filtered = filtered.filter(a => a.unlocked)
  } else if (currentFilter.value === 'locked') {
    filtered = filtered.filter(a => !a.unlocked)
  } else if (['reading', 'vocabulary', 'review', 'streak'].includes(currentFilter.value)) {
    filtered = filtered.filter(a => a.category === currentFilter.value)
  }
  
  // 应用排序
  filtered.sort((a, b) => {
    switch (currentSort.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'rarity':
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
      case 'points':
        return b.points - a.points
      case 'date':
      default:
        if (a.unlocked && b.unlocked) {
          return new Date(b.unlockedAt) - new Date(a.unlockedAt)
        } else if (a.unlocked && !b.unlocked) {
          return -1
        } else if (!a.unlocked && b.unlocked) {
          return 1
        } else {
          return b.points - a.points
        }
    }
  })
  
  return filtered
})

const inProgressCount = computed(() => 
  achievements.value.filter(a => !a.unlocked && a.progress > 0).length
)

const categoryStats = computed(() => {
  const categories = ['reading', 'vocabulary', 'review', 'streak', 'general']
  return categories.map(category => {
    const categoryAchievements = achievements.value.filter(a => a.category === category)
    const unlocked = categoryAchievements.filter(a => a.unlocked).length
    const total = categoryAchievements.length
    return {
      name: category,
      unlocked,
      total,
      percentage: total > 0 ? (unlocked / total) * 100 : 0
    }
  }).filter(stat => stat.total > 0)
})

const rarityStats = computed(() => {
  const rarities = ['common', 'rare', 'epic', 'legendary']
  return rarities.map(rarity => {
    const rarityAchievements = achievements.value.filter(a => a.rarity === rarity)
    const unlocked = rarityAchievements.filter(a => a.unlocked).length
    const total = rarityAchievements.length
    return {
      name: rarity,
      unlocked,
      total,
      percentage: total > 0 ? (unlocked / total) * 100 : 0
    }
  }).filter(stat => stat.total > 0)
})

const totalPoints = computed(() => 
  achievements.value.reduce((sum, a) => sum + a.points, 0)
)

const unlockedPoints = computed(() => 
  unlockedAchievements.value.reduce((sum, a) => sum + a.points, 0)
)

const averagePoints = computed(() => 
  achievements.value.length > 0 
    ? Math.round(totalPoints.value / achievements.value.length) 
    : 0
)

const currentLevel = computed(() => 
  userStore.pointsAndLevel?.currentLevel || 1
)

const currentLevelName = computed(() => 
  userStore.pointsAndLevel?.levelName || '初学者'
)

const currentPoints = computed(() => 
  userStore.pointsAndLevel?.currentLevelPoints || 0
)

const nextLevelPoints = computed(() => 
  userStore.pointsAndLevel?.nextLevelPoints || 100
)

const levelProgress = computed(() => 
  userStore.pointsAndLevel?.progressToNextLevel || 0
)

const timelineAchievements = computed(() => 
  [...unlockedAchievements.value]
    .sort((a, b) => new Date(a.unlockedAt) - new Date(b.unlockedAt))
    .slice(0, 6)
)

// 生命周期钩子
onMounted(() => {
  loadAchievements()
  loadPointsAndLevel()
})

// 方法
const loadAchievements = async () => {
  try {
    loading.value = true
    error.value = null
    await userService.getUserAchievements(true)
  } catch (err) {
    error.value = err.message || '加载成就失败'
    console.error('加载成就失败:', err)
  } finally {
    loading.value = false
  }
}

const loadPointsAndLevel = async () => {
  try {
    await userService.getUserPointsAndLevel()
  } catch (err) {
    console.error('加载积分等级失败:', err)
  }
}

const setFilter = (filter) => {
  currentFilter.value = filter
}

const getCategoryLabel = (category) => {
  const labels = {
    reading: '阅读',
    vocabulary: '词汇',
    review: '复习',
    streak: '坚持',
    general: '通用'
  }
  return labels[category] || category
}

const getRarityLabel = (rarity) => {
  const labels = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || rarity
}

const showAchievementDetail = (achievement) => {
  selectedAchievement.value = achievement
}

const closeAchievementDetail = () => {
  selectedAchievement.value = null
}

const shareAchievement = () => {
  if (!selectedAchievement.value) return
  
  const achievement = selectedAchievement.value
  const shareText = `我在阅记星解锁了成就「${achievement.name}」！${achievement.description}`
  
  // 这里可以集成社交媒体分享
  if (navigator.share) {
    navigator.share({
      title: '阅记星成就分享',
      text: shareText,
      url: window.location.origin
    }).catch(err => {
      console.error('分享失败:', err)
      fallbackShare(shareText)
    })
  } else {
    fallbackShare(shareText)
  }
}

const fallbackShare = (text) => {
  // 复制到剪贴板
  navigator.clipboard.writeText(text).then(() => {
    alert('成就分享文本已复制到剪贴板！')
  }).catch(err => {
    console.error('复制失败:', err)
    alert('请手动复制分享文本：\n' + text)
  })
}

const shareAchievementProgress = () => {
  if (!selectedAchievement.value) return
  
  const achievement = selectedAchievement.value
  const progressText = `我正在努力解锁成就「${achievement.name}」，当前进度：${achievement.progress}/${achievement.total}`
  
  if (navigator.share) {
    navigator.share({
      title: '阅记星成就进度',
      text: progressText,
      url: window.location.origin
    })
  } else {
    navigator.clipboard.writeText(progressText).then(() => {
      alert('进度分享文本已复制到剪贴板！')
    })
  }
}

const goToLearning = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.achievements-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 48px;
  color: #FFD166;
  margin-bottom: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #FFD166;
  border-top-color: #FF6B8B;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  color: #666;
}

/* 错误提示 */
.error-container {
  background: #FFE5E5;
  border: 2px solid #FF6B8B;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 18px;
  color: #D32F2F;
  margin-bottom: 20px;
}

.error-retry-btn {
  background: #FF6B8B;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-retry-btn:hover {
  background: #FF4A6E;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 139, 0.3);
}

/* 成就概览卡片 */
.overview-card {
  background: linear-gradient(135deg, #FFFBF0 0%, #FFE5B4 100%);
  border-radius: 32px;
  padding: 32px;
  margin-bottom: 32px;
  border: 3px solid #FFD166;
  box-shadow: 0 8px 32px rgba(255, 209, 102, 0.2);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 3px dashed #FFD166;
}

.overview-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 32px;
  color: #E65100;
  margin: 0;
}

.overview-stats {
  background: white;
  border-radius: 20px;
  padding: 12px 24px;
  border: 2px solid #FFD166;
}

.stats-text {
  font-size: 18px;
  font-weight: bold;
  color: #E65100;
}

.overview-body {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 进度条通用样式 */
.progress-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #FFD166;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-label {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.progress-percentage {
  font-size: 24px;
  font-weight: bold;
  color: #06D6A0;
}

.progress-bar {
  height: 16px;
  background: #E0E0E0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar.small {
  height: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B8B, #FFD166);
  border-radius: 8px;
  transition: width 0.5s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  font-size: 20px;
}

.detail-text {
  font-size: 14px;
  color: #666;
}

/* 等级展示 */
.level-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #06D6A0;
}

.section-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #06D6A0;
  margin-bottom: 16px;
}

.level-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.level-icon {
  font-size: 48px;
  color: #FFD166;
}

.level-info {
  flex: 1;
}

.level-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.level-number {
  font-size: 16px;
  color: #666;
}

.level-progress {
  flex: 2;
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

/* 最近解锁 */
.recent-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #118AB2;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 20px;
  border: 2px solid #E9ECEF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-item:hover {
  transform: translateY(-4px);
  border-color: #118AB2;
  box-shadow: 0 8px 24px rgba(17, 138, 178, 0.2);
}

.recent-icon {
  font-size: 32px;
}

.recent-content {
  flex: 1;
}

.recent-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.recent-date {
  font-size: 14px;
  color: #888;
}

/* 筛选和排序 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 20px;
  background: white;
  border-radius: 24px;
  border: 2px solid #E9ECEF;
}

.filter-group,
.sort-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label,
.sort-label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.filter-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #E9ECEF;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #FFD166;
  color: #333;
}

.filter-btn.active {
  background: #FFD166;
  border-color: #FFD166;
  color: #333;
  font-weight: bold;
}

.sort-select {
  padding: 10px 16px;
  border: 2px solid #FFD166;
  border-radius: 20px;
  background: white;
  color: #333;
  font-size: 14px;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: #06D6A0;
  box-shadow: 0 0 0 3px rgba(6, 214, 160, 0.2);
}

/* 成就网格 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.achievement-card {
  position: relative;
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 3px solid;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.achievement-card.unlocked {
  border-color: #06D6A0;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
}

.achievement-card.locked {
  border-color: #E0E0E0;
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
}

.achievement-card.rare {
  border-color: #4FC3F7;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.achievement-card.epic {
  border-color: #AB47BC;
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
}

.achievement-card.legendary {
  border-color: #FFA726;
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
}

.achievement-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.achievement-icon {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}

.icon-symbol {
  display: block;
  font-size: 48px;
  text-align: center;
  line-height: 80px;
}

.unlocked-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: #06D6A0;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  border: 3px solid white;
}

.achievement-info {
  text-align: center;
}

.achievement-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.achievement-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.achievement-progress {
  margin-top: 12px;
}

.achievement-unlocked {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px dashed #E0E0E0;
}

.unlocked-date {
  font-size: 14px;
  color: #888;
}

.points-badge {
  background: #FFD166;
  color: #333;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.rarity-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.rarity-badge.rare {
  background: #4FC3F7;
}

.rarity-badge.epic {
  background: #AB47BC;
}

.rarity-badge.legendary {
  background: #FFA726;
}

.category-badge {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.category-badge.reading {
  background: #FF6B8B;
}

.category-badge.vocabulary {
  background: #118AB2;
}

.category-badge.review {
  background: #06D6A0;
}

.category-badge.streak {
  background: #FFD166;
  color: #333;
}

.category-badge.general {
  background: #9C27B0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 32px;
  border: 3px dashed #FFD166;
  margin: 40px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.empty-action-btn {
  background: #FF6B8B;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px 40px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action-btn:hover {
  background: #FF4A6E;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 139, 0.3);
}

/* 统计信息卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stats-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid;
}

.category-stats {
  border-color: #FF6B8B;
}

.rarity-stats {
  border-color: #4FC3F7;
}

.points-stats {
  border-color: #FFD166;
}

.stats-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: inherit;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px dashed;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item,
.rarity-item {
  padding: 12px;
  background: #F8F9FA;
  border-radius: 16px;
}

.category-header,
.rarity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-name,
.rarity-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.category-count,
.rarity-count {
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

.points-total {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #FFFBF0 0%, #FFE5B4 100%);
  border-radius: 20px;
  border: 2px solid #FFD166;
}

.points-icon {
  font-size: 48px;
}

.points-info {
  flex: 1;
}

.points-value {
  font-size: 36px;
  font-weight: bold;
  color: #E65100;
  margin-bottom: 4px;
}

.points-label {
  font-size: 16px;
  color: #666;
}

.points-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 16px;
}

.breakdown-label {
  font-size: 14px;
  color: #666;
}

.breakdown-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 成就时间线 */
.timeline-section {
  margin-bottom: 40px;
}

.timeline-container {
  background: white;
  border-radius: 32px;
  padding: 32px;
  border: 3px solid #9C27B0;
  overflow: hidden;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #9C27B0;
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
  width: 45%;
}

.timeline-item.left {
  left: 0;
}

.timeline-item.right {
  left: 55%;
}

.timeline-content {
  background: #F3E5F5;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid #9C27B0;
  transition: all 0.3s ease;
}

.timeline-content:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(156, 39, 176, 0.2);
}

.timeline-date {
  font-size: 14px;
  color: #9C27B0;
  font-weight: bold;
  margin-bottom: 8px;
}

.timeline-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.timeline-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.timeline-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 模态框 */
.modal-overlay {
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
  backdrop-filter: blur(4px);
}

.achievement-detail-modal {
  position: relative;
  background: white;
  border-radius: 32px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 4px solid #FFD166;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: #FF6B8B;
  color: white;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  background: #FF4A6E;
  transform: scale(1.1);
}

.detail-icon {
  text-align: center;
  padding: 40px 0 20px;
}

.detail-icon .icon-symbol {
  font-size: 64px;
  line-height: 1;
}

.detail-info {
  padding: 0 32px 32px;
}

.detail-name {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 12px;
}

.detail-description {
  font-size: 16px;
  color: #666;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.6;
}

.unlocked-status {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #E8F5E9;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 24px;
  border: 2px solid #06D6A0;
}

.status-icon {
  font-size: 32px;
}

.status-text {
  flex: 1;
}

.status-title {
  font-size: 18px;
  font-weight: bold;
  color: #06D6A0;
  margin-bottom: 4px;
}

.status-date {
  font-size: 14px;
  color: #666;
}

.progress-info {
  background: #F8F9FA;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  border: 2px solid #FFD166;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.progress-value {
  font-size: 18px;
  font-weight: bold;
  color: #FF6B8B;
}

.rewards-section,
.conditions-section {
  margin-bottom: 24px;
}

.rewards-title,
.conditions-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px dashed #FFD166;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #FFFBF0;
  border-radius: 16px;
  border: 2px solid #FFD166;
}

.reward-icon {
  font-size: 24px;
}

.reward-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.conditions-list {
  list-style: none;
  padding: 0;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 16px;
  margin-bottom: 8px;
}

.condition-icon {
  font-size: 20px;
}

.condition-text {
  font-size: 16px;
  color: #333;
}

.detail-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.share-btn {
  background: #118AB2;
  color: white;
}

.share-btn:hover {
  background: #0A6D8C;
  transform: translateY(-2px);
}

.close-btn {
  background: #E0E0E0;
  color: #333;
}

.close-btn:hover {
  background: #D0D0D0;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .achievements-view {
    padding: 16px;
  }
  
  .page-title {
    font-size: 36px;
  }
  
  .overview-card,
  .timeline-container {
    padding: 24px;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .timeline::before {
    left: 20px;
  }
  
  .timeline-item {
    width: calc(100% - 60px);
    left: 60px !important;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-group,
  .sort-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-options {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 28px;
  }
  
  .overview-title {
    font-size: 24px;
  }
  
  .achievement-card {
    padding: 20px;
  }
  
  .detail-actions {
    flex-direction: column;
  }
}
</style>