<template>
  <div id="app">
    <!-- 全局通知组件（用于模拟通知） -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <span>{{ notification.message }}</span>
      <button @click="notification.show = false" class="btn-close">×</button>
    </div>

    <!-- 顶部导航栏 -->
    <nav v-if="showNav" class="global-nav">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">📚 阅记星</router-link>
        <div class="nav-links">
          <button @click="toggleTheme" class="theme-toggle" :title="isDark ? '切换到日间模式' : '切换到夜间模式'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <router-link to="/welcome">欢迎</router-link>
          <router-link to="/onboarding">引导</router-link>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
          <router-link to="/bookshelf">书架</router-link>
          <router-link to="/upload">上传</router-link>
          <router-link to="/reader">阅读器</router-link>
          <router-link to="/vocabulary">生词本</router-link>
          <router-link to="/review">复习</router-link>
          <router-link to="/user">用户中心</router-link>
          <router-link to="/settings">设置</router-link>
        </div>
      </div>
    </nav>

    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 主题管理
const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  isDark.value = savedTheme === 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
})

// 模拟全局通知状态
const notification = ref({
  show: false,
  message: '',
  type: 'info' // info, success, warning, error
})

// 模拟显示通知的函数
const showNotification = (message, type = 'info') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 暴露给子组件（通过 provide/inject 或全局属性，这里简化）
window.$notify = showNotification


</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: var(--background-color);
}

/* 顶部导航栏样式 */
.global-nav {
  background-color: var(--surface-color);
  padding: var(--spacing-sm) 0;
  box-shadow: var(--shadow-soft);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 4px dashed var(--accent-pink);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-family: var(--font-title);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.nav-links {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.nav-links a {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--text-color-medium);
  transition: var(--transition-smooth);
  position: relative;
  padding: 4px 0;
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: var(--primary-color);
}

.nav-links a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: var(--accent-yellow);
  border-radius: 2px;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  padding: 16px 24px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-hard);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 400px;
  animation: slideIn 0.5s var(--transition-bounce);
  border: 3px solid;
}

.notification.info {
  background-color: var(--primary-light);
  color: var(--text-color-dark);
  border-color: var(--primary-color);
}

.notification.success {
  background-color: var(--accent-green);
  color: var(--text-color-dark);
  border-color: #76c776;
}

.notification.warning {
  background-color: var(--accent-yellow);
  color: var(--text-color-dark);
  border-color: #e6c300;
}

.notification.error {
  background-color: var(--accent-pink);
  color: var(--text-color-dark);
  border-color: #ff9aa8;
}

.btn-close {
  background: transparent;
  color: inherit;
  border: none;
  font-size: 1.5rem;
  padding: 0;
  margin-left: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-close:hover {
  transform: scale(1.2);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
  .theme-toggle {
    background: var(--surface-color);
    border: 2px solid var(--border-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-smooth);
    box-shadow: var(--shadow-soft);
    margin-right: var(--spacing-sm);
  }

  .theme-toggle:hover {
    transform: rotate(15deg) scale(1.1);
    border-color: var(--primary-color);
    background: var(--primary-light);
  }
</style>
