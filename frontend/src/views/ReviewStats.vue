<template>
  <div class="stats-page">
    <header class="header">
      <button class="btn-back" @click="$router.push('/review')">⬅️ 返回</button>
      <h1>复习数据中心</h1>
    </header>

    <main class="main-content">
      <div class="tabs">
        <button 
          v-for="tab in ['日', '周', '月']" 
          :key="tab" 
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab }}统计
        </button>
      </div>

      <div class="stats-overview">
        <div class="stat-card main">
          <div class="label">总复习次数</div>
          <div class="value">{{ stats.totalReviews || 0 }}</div>
          <div class="trend">较上周期 +12% 📈</div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="icon">🎯</div>
            <div class="label">平均准确率</div>
            <div class="value">{{ stats.accuracy || 0 }}%</div>
          </div>
          <div class="stat-card">
            <div class="icon">⏱️</div>
            <div class="label">平均用时</div>
            <div class="value">{{ stats.avgTime || 0 }}s</div>
          </div>
          <div class="stat-card">
            <div class="icon">🔥</div>
            <div class="label">最高连击</div>
            <div class="value">{{ stats.maxCombo || 0 }}</div>
          </div>
          <div class="stat-card">
            <div class="icon">💎</div>
            <div class="label">获得积分</div>
            <div class="value">{{ stats.points || 0 }}</div>
          </div>
        </div>
      </div>

      <div class="chart-placeholder">
        <h3>复习趋势图</h3>
        <div class="bar-chart">
          <div v-for="(val, i) in [40, 60, 80, 50, 90, 70, 85]" :key="i" 
               class="bar" :style="{ height: val + '%' }">
            <span class="bar-val">{{ val }}</span>
          </div>
        </div>
        <div class="chart-labels">
          <span v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="d">{{ d }}</span>
        </div>
      </div>

      <div class="recent-mastered">
        <h3>最近掌握的单词</h3>
        <div class="word-tags">
          <span v-for="word in ['apple', 'banana', 'cherry', 'date', 'elderberry']" :key="word" class="word-tag">
            {{ word }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '@/config'
import { auth } from '@/utils/auth'

const activeTab = ref('周')
const stats = ref({
  totalReviews: 1250,
  accuracy: 92,
  avgTime: 3.5,
  maxCombo: 42,
  points: 850
})

const fetchDetailedStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/learning-stats/detailed`, {
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      }
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        // stats.value = result.data
      }
    }
  } catch (error) {
    console.error('获取详细统计失败', error)
  }
}

onMounted(fetchDetailedStats)
</script>

<style scoped>
.stats-page {
  min-height: 100vh;
  background-color: #fcf8e8;
  padding: 20px;
  font-family: 'Quicksand', sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.btn-back {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #87CEEB;
  background: white;
  cursor: pointer;
  font-weight: bold;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  background: white;
  padding: 5px;
  border-radius: 30px;
  margin-bottom: 25px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  color: #666;
  transition: all 0.3s;
}

.tab-btn.active {
  background: #87CEEB;
  color: white;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 6px 15px rgba(0,0,0,0.05);
  border: 2px solid #eee;
}

.stat-card.main {
  text-align: center;
  margin-bottom: 20px;
  border: 3px solid #FFB6C1;
}

.stat-card.main .value {
  font-size: 48px;
  color: #FF69B4;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card .icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.stat-card .value {
  font-size: 24px;
  font-weight: bold;
  color: #6495ED;
}

.stat-card .label {
  font-size: 14px;
  color: #888;
}

.trend {
  font-size: 14px;
  color: #4CAF50;
  margin-top: 5px;
}

.chart-placeholder {
  background: white;
  padding: 25px;
  border-radius: 25px;
  margin-bottom: 30px;
  border: 3px solid #90EE90;
}

.bar-chart {
  height: 150px;
  display: flex;
  align-items: flex-end;
  gap: 15px;
  margin-top: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}

.bar {
  flex: 1;
  background: #87CEEB;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: height 0.5s;
}

.bar:hover {
  background: #6495ED;
}

.bar-val {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #888;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  color: #999;
  font-size: 12px;
}

.recent-mastered {
  background: white;
  padding: 20px;
  border-radius: 25px;
  border: 3px solid #FFD700;
}

.word-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.word-tag {
  padding: 6px 15px;
  background: #f0f8ff;
  border-radius: 15px;
  color: #4682B4;
  font-weight: 500;
  border: 1px solid #ADD8E6;
}
</style>