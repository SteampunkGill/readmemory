<template>
  <div class="vocabulary-home">
    <div class="header">
      <button class="back-btn" @click="$router.push('/bookshelf')">
        <span class="icon">←</span> 返回书架
      </button>
      <h1>词汇学习中心</h1>
      <p>提升你的词汇量，掌握更多表达</p>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="loading" class="stats-card">
      <div class="stat-item" style="width: 100%;">
        <span class="label">正在同步学习进度...</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-else class="stats-card">
      <div class="stat-item">
        <span class="label">已掌握</span>
        <span class="value">{{ knownWordsCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">今日收藏</span>
        <span class="value">{{ dueCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">总词汇</span>
        <span class="value">{{ totalWords }}</span>
      </div>
    </div>

    <!-- 复习计划设置 (已简化为只复习今日收藏) -->
    <div class="plan-settings-card">
      <h3>复习模式</h3>
      <div class="settings-row">
        <div class="setting-group">
          <p style="color: var(--primary-color); font-weight: bold;">✨ 当前模式：只复习今天收藏的单词</p>
        </div>
      </div>
    </div>

    <!-- 功能网格 -->
    <div class="function-grid">
      <div class="function-card" @click="startReview('/vocabulary/en-zh')">
        <div class="icon">🔤</div>
        <h3>看英选意</h3>
        <p>根据英文单词选择正确的中文释义</p>
      </div>
      <div class="function-card" @click="startReview('/vocabulary/zh-en')">
        <div class="icon">🇨🇳</div>
        <h3>看意选英</h3>
        <p>根据中文释义选择正确的英文单词</p>
      </div>
      <div class="function-card" @click="startReview('/vocabulary/fill-blanks')">
        <div class="icon">📝</div>
        <h3>选词填空</h3>
        <p>在语境中应用单词，强化记忆</p>
      </div>
      <div class="function-card" @click="$router.push('/vocabulary/list')">
        <div class="icon">📚</div>
        <h3>生词列表</h3>
        <p>查看并管理您的所有生词</p>
      </div>
    </div>

    <!-- 近期学习单词区域 -->
    <div class="recent-words">
      <h3>{{ loading ? '加载中...' : '最近学习' }}</h3>
      <div v-if="recentWords.length > 0" class="word-list">
        <div v-for="word in recentWords" :key="word.id" class="word-tag" @click="$router.push(`/dictionary/${word.word}`)">
          {{ word.word }}
        </div>
      </div>
      <p v-else-if="!loading" style="color: var(--text-color-light);">暂无近期学习记录</p>
    </div>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/config';
import { auth } from '@/utils/auth';

export default {
  name: 'VocabularyHome',
  data() {
    return {
      loading: false,
      vocabularyList: [],
      totalWords: 0,
      dueCount: 0,
      knownWordsCount: 0,
      reviewMode: 'spaced',
      selectedDate: '',
      availableDates: [],
    };
  },
  computed: {
    recentWords() {
      return this.vocabularyList.slice(0, 5);
    }
  },
  methods: {
    async fetchHomeData() {
      this.loading = true;
      const token = auth.getToken();

      try {
        // 1. 获取统计信息和待复习单词
        const response = await fetch(`${API_BASE_URL}/review/due-words?limit=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.vocabularyList = result.data.words || [];
            this.totalWords = result.data.total || 0;
            this.dueCount = result.data.due_count || 0;
            this.knownWordsCount = Math.max(0, this.totalWords - this.dueCount);
          }
        }

        // 2. 获取有单词记录的日期列表
        const datesResponse = await fetch(`${API_BASE_URL}/vocabulary/dates`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (datesResponse.ok) {
          const datesResult = await datesResponse.json();
          if (datesResult.success) {
            this.availableDates = datesResult.data || [];
            if (this.availableDates.length > 0 && !this.selectedDate) {
              this.selectedDate = this.availableDates[0].date;
            }
          }
        }

      } catch (error) {
        console.error('获取后端数据失败:', error);
        // 移除模拟数据回退逻辑，保持数据为空
        this.vocabularyList = [];
        this.totalWords = 0;
        this.dueCount = 0;
        this.knownWordsCount = 0;
      } finally {
        this.loading = false;
      }
    },

    startReview(path) {
      // 强制使用 spaced 模式，后端已修改该模式下只返回今日收藏
      const query = { mode: 'spaced' };
      this.$router.push({ path, query });
    }
  },
  created() {
    this.fetchHomeData();
  }
};
</script>

<style scoped>
/* --- 主体布局 --- */
.vocabulary-home {
  background-color: var(--background-color);
  padding: var(--spacing-xl) var(--spacing-md);
  max-width: 900px;
  margin: 0 auto;
}

/* --- 头部 --- */
.header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.header h1 {
  font-size: 3.5rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.header p {
  color: var(--text-color-medium);
  font-size: 1.2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  background: var(--surface-color);
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
  padding: 8px 16px;
  border-radius: var(--border-radius-lg);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: var(--spacing-md);
}

.back-btn:hover {
  background: var(--primary-color);
  color: white;
}

/* --- 统计卡片 --- */
.stats-card {
  display: flex;
  justify-content: space-around;
  background: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-medium);
  margin-bottom: var(--spacing-xl);
  border: 3px solid var(--primary-light);
}

/* --- 复习计划设置卡片 --- */
.plan-settings-card {
  background: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  margin-bottom: var(--spacing-xl);
  border: 2px solid var(--accent-yellow);
}

.plan-settings-card h3 {
  margin-bottom: var(--spacing-md);
  color: var(--primary-dark);
  font-size: 1.4rem;
}

.settings-row {
  display: flex;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-group label {
  font-weight: bold;
  color: var(--text-color-medium);
}

.styled-select {
  padding: 8px 12px;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-color);
  background: white;
  font-size: 1rem;
  color: var(--text-color-dark);
  cursor: pointer;
  outline: none;
  transition: var(--transition-smooth);
}

.styled-select:focus {
  border-color: var(--primary-color);
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  display: block;
  color: var(--text-color-medium);
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-body);
}

.stat-item .value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: var(--font-title);
}

/* --- 功能网格 --- */
.function-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.function-card {
  background: var(--surface-color);
  padding: var(--spacing-xl) var(--spacing-lg);
  border-radius: var(--border-radius-xl);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-smooth), transform 0.3s var(--transition-bounce);
  box-shadow: var(--shadow-soft);
  border: 4px solid transparent;
}

.function-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: var(--shadow-hard);
}

.function-card:nth-child(1):hover { border-color: var(--primary-color); }
.function-card:nth-child(2):hover { border-color: var(--accent-pink); }
.function-card:nth-child(3):hover { border-color: var(--accent-green); }
.function-card:nth-child(4):hover { border-color: var(--accent-yellow); }

.function-card .icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  display: block;
}

.function-card h3 {
  margin-bottom: var(--spacing-sm);
  color: var(--text-color-dark);
  font-size: 1.8rem;
}

.function-card p {
  color: var(--text-color-medium);
  font-size: 1.1rem;
}

/* --- 近期学习单词区域 --- */
.recent-words {
  background: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-soft);
  border: 3px dashed var(--border-color);
}

.recent-words h3 {
  margin-bottom: var(--spacing-md);
  font-size: 1.8rem;
  color: var(--primary-dark);
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.word-tag {
  background: var(--primary-light);
  padding: 10px 20px;
  border-radius: var(--border-radius-xl);
  color: var(--text-color-dark);
  font-size: 1.1rem;
  font-family: var(--font-body);
  transition: var(--transition-smooth);
  cursor: pointer;
  border: 2px solid transparent;
}

.word-tag:hover {
  background: var(--accent-yellow);
  transform: translateY(-3px) rotate(2deg);
  border-color: var(--primary-color);
}

/* --- 响应式设计 --- */
@media (max-width: 600px) {
  .function-grid {
    grid-template-columns: 1fr;
  }
  .header h1 {
    font-size: 2.5em;
  }
  .stats-card {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .stat-item .value {
    font-size: 1.8em;
  }
  .back-btn {
    position: static;
    margin-bottom: 20px;
  }
}
</style>