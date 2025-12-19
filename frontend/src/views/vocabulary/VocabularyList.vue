<template>
  <div class="vocabulary-list-page">
    <header class="list-header">
      <div class="header-left">
        <button class="btn-back" @click="$router.push('/vocabulary')">← 返回</button>
        <h2>我的生词本</h2>
      </div>
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索单词或释义..." 
          @input="handleSearch"
        >
        <span class="search-icon">🔍</span>
      </div>
    </header>

    <div class="filter-bar">
      <div class="filter-group">
        <label>状态：</label>
        <select v-model="filters.status" @change="fetchList">
          <option value="">全部</option>
          <option value="new">新词</option>
          <option value="reviewing">复习中</option>
          <option value="mastered">已掌握</option>
        </select>
      </div>
      <div class="filter-group">
        <label>排序：</label>
        <select v-model="filters.sortBy" @change="fetchList">
          <option value="created_at">添加时间</option>
          <option value="word">字母顺序</option>
          <option value="mastery_level">掌握程度</option>
        </select>
      </div>
    </div>

    <main class="list-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载单词...</p>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-icon">📖</div>
        <p>生词本空空如也，快去阅读并添加新词吧！</p>
      </div>

      <div v-else class="word-grid">
        <div v-for="item in items" :key="item.id" class="word-card" @click="viewDetail(item.word)">
          <div class="word-main">
            <h3 class="word-text">{{ item.word }}</h3>
            <span class="phonetic">{{ item.phonetic }}</span>
          </div>
          <p class="definition">{{ item.definition }}</p>
          <div class="word-footer">
            <span class="status-tag" :class="item.status">{{ getStatusLabel(item.status) }}</span>
            <span class="date">{{ formatDate(item.lastReviewedAt) }}</span>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="pagination.totalPages > 1">
        <button 
          :disabled="pagination.page === 1" 
          @click="changePage(pagination.page - 1)"
        >上一页</button>
        <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
        <button 
          :disabled="pagination.page === pagination.totalPages" 
          @click="changePage(pagination.page + 1)"
        >下一页</button>
      </div>
    </main>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/config';
import { auth } from '@/utils/auth';

export default {
  name: 'VocabularyList',
  data() {
    return {
      loading: false,
      searchQuery: '',
      items: [],
      filters: {
        status: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      searchTimeout: null
    }
  },
  methods: {
    async fetchList() {
      this.loading = true;
      const token = auth.getToken();
      
      let url = `${API_BASE_URL}/vocabulary?page=${this.pagination.page}&pageSize=${this.pagination.pageSize}`;
      url += `&sortBy=${this.filters.sortBy}&sortOrder=${this.filters.sortOrder}`;
      if (this.filters.status) url += `&status=${this.filters.status}`;
      if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          this.items = result.data.items;
          this.pagination = result.data.pagination;
        }
      } catch (error) {
        console.error('获取生词列表失败:', error);
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchList();
      }, 500);
    },
    changePage(page) {
      this.pagination.page = page;
      this.fetchList();
    },
    viewDetail(word) {
      this.$router.push(`/dictionary/${word}`);
    },
    getStatusLabel(status) {
      const labels = {
        'new': '新词',
        'reviewing': '复习中',
        'mastered': '已掌握'
      };
      return labels[status] || status;
    },
    formatDate(dateStr) {
      if (!dateStr) return '从未复习';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}-${date.getDate()}`;
    }
  },
  mounted() {
    this.fetchList();
  }
}
</script>

<style scoped>
.vocabulary-list-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.btn-back {
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back:hover {
  background: var(--primary-color);
  color: #f1f2f6;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--border-color);
  font-size: 1rem;
  background: var(--surface-color);
  color: var(--text-color-dark);
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-light);
}

.filter-bar {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: var(--surface-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-soft);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group select {
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color-dark);
}

.word-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.word-card {
  background: var(--surface-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.word-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-medium);
}

.word-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.word-text {
  font-size: 1.4rem;
  color: var(--primary-dark);
  margin: 0;
  font-family: var(--font-title);
}

.phonetic {
  font-size: 0.9rem;
  color: var(--text-color-light);
}

.definition {
  font-size: 1rem;
  color: var(--text-color-medium);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.word-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

.status-tag.new { background: #e3f2fd; color: #1976d2; }
.status-tag.reviewing { background: #fff3e0; color: #f57c00; }
.status-tag.mastered { background: #e8f5e9; color: #388e3c; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.pagination button {
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-color-dark);
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-light);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>