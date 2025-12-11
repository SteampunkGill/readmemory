<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component, route }">
      <transition
        :name="route.meta.transition || 'fade'"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @after-enter="onAfterEnter"
      >
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- 全局通知容器 -->
    <div id="notifications"></div>

    <!-- 全局加载指示器 -->
    <div v-if="globalLoading" class="global-loading">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
        <p class="loading-text">加载中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 全局加载状态
const globalLoading = ref(false)

// 监听路由变化，显示/隐藏加载状态
watch(
  () => router.currentRoute.value,
  (to, from) => {
    // 如果路由有loading元数据，显示全局加载
    if (to.meta.loading) {
      globalLoading.value = true
    } else {
      globalLoading.value = false
    }
  }
)

// 路由切换动画钩子
const onBeforeEnter = () => {
  // 可以在这里添加页面切换前的逻辑
  console.log('页面切换开始')
}

const onAfterEnter = () => {
  // 可以在这里添加页面切换后的逻辑
  console.log('页面切换完成')
}

// 初始化应用
const initApp = async () => {
  try {
    // 检查用户登录状态
    await authStore.checkAuthStatus()
    
    // 获取应用设置
    await settingsStore.getSettings()
    
    // 根据登录状态决定初始路由
    if (authStore.isAuthenticated) {
      // 检查是否需要显示引导页
      const onboardingService = (await import('@/services/onboarding.service')).default
      const shouldShow = await onboardingService.shouldShowOnboarding()
      
      if (shouldShow) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } else {
      // 未登录用户显示欢迎页
      router.push('/welcome')
    }
  } catch (error) {
    console.error('应用初始化失败:', error)
    // 出错时默认跳转到欢迎页
    router.push('/welcome')
  }
}

// 应用启动时初始化
initApp()
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Quicksand', 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa;
  color: #333;
}

#app {
  height: 100%;
  width: 100%;
}

/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

/* 全局加载指示器 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  text-align: center;
  animation: bounceIn 0.6s ease-out;
}

.spinner-circle {
  width: 60px;
  height: 60px;
  border: 5px solid #FF6B8B;
  border-top-color: transparent;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-family: 'Comfortaa', cursive;
  font-size: 18px;
  color: #666;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: #FF6B8B;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #FF8E53;
}

/* 全局字体定义 */
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Caveat:wght@400;500;600;700&family=Quicksand:wght@300;400;500;600;700&family=Comfortaa:wght@300;400;500;600;700&family=Varela+Round&display=swap');

/* 全局链接样式 */
a {
  color: #118AB2;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #FF6B8B;
  text-decoration: underline;
}

/* 全局按钮样式重置 */
button {
  font-family: 'Comfortaa', cursive;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.3s ease;
}

/* 全局输入框样式 */
input, textarea, select {
  font-family: 'Quicksand', sans-serif;
  border: 2px solid #ddd;
  border-radius: 20px;
  padding: 12px 16px;
  font-size: 16px;
  transition: all 0.3s ease;
}

input:focus, textarea:focus, select:focus {
  border-color: #FF6B8B;
  box-shadow: 0 0 0 3px rgba(255, 107, 139, 0.2);
  outline: none;
}

/* 全局卡片样式 */
.card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  padding: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .spinner-circle {
    width: 50px;
    height: 50px;
    border-width: 4px;
  }
  
  .loading-text {
    font-size: 16px;
  }
  
  input, textarea, select {
    padding: 10px 14px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .spinner-circle {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }
  
  .loading-text {
    font-size: 14px;
  }
}
</style>