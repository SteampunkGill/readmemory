<template>
  <div class="report-page">
    <header class="header">
      <button class="btn-back" @click="$router.push('/review')">⬅️ 返回复习</button>
      <h1>复习成就报告</h1>
    </header>

    <main class="main-content">
      <div v-if="loading" class="loading">正在生成报告...</div>
      <template v-else>
        <div class="summary-card">
          <div class="medal">🏆</div>
          <h2>太棒了！</h2>
          <p>你已经完成了今日的复习任务</p>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.wordsLearned }}</div>
            <div class="stat-label">已学单词总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.reviewAccuracy }}%</div>
            <div class="stat-label">复习准确率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.streakDays || 0 }}</div>
            <div class="stat-label">连续坚持天数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.todayCompleted || 0 }}</div>
            <div class="stat-label">今日复习单词</div>
          </div>
        </div>

        <div class="chart-section">
          <h3>遗忘曲线同步状态</h3>
          <div class="sync-status">
            <div class="status-bar">
              <div class="status-fill" :style="{ width: '85%' }"></div>
            </div>
            <p>记忆稳固度：良好</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn-primary" @click="$router.push('/vocabulary')">去生词本看看</button>
          <button class="btn-secondary" @click="$router.push('/bookshelf')">继续阅读</button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '@/config'
import { auth } from '@/utils/auth'

const stats = ref({})
const loading = ref(true)

const fetchStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/learning-stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    const result = await response.json()
    if (result.success) {
      stats.value = result.data || result
    }
  } catch (error) {
    console.error('获取统计失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<style scoped>
.report-page {
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
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
}

.summary-card {
  background: white;
  border-radius: 30px;
  padding: 40px;
  text-align: center;
  border: 4px solid #FFB6C1;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  margin-bottom: 30px;
}

.medal {
  font-size: 60px;
  margin-bottom: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 20px;
  text-align: center;
  border: 3px solid #87CEEB;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #6495ED;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 30px;
  border: 3px solid #90EE90;
}

.status-bar {
  height: 12px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
  margin: 10px 0;
}

.status-fill {
  height: 100%;
  background: linear-gradient(90deg, #90EE90, #87CEEB);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.btn-primary {
  padding: 15px;
  border-radius: 30px;
  border: none;
  background: #87CEEB;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

.btn-secondary {
  padding: 15px;
  border-radius: 30px;
  border: 2px solid #87CEEB;
  background: white;
  color: #87CEEB;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}
</style>