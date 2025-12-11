<template>
  <div class="welcome-view">
    <!-- 背景装饰元素 -->
    <div class="background-elements">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="star star-1">⭐</div>
      <div class="star star-2">🌟</div>
      <div class="star star-3">✨</div>
    </div>

    <!-- 主要内容 -->
    <div class="welcome-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-icon">📚</div>
          <h1 class="logo-text">阅记星</h1>
        </div>
        <p class="logo-subtitle">ReadMemo</p>
      </div>

      <!-- 标语区域 -->
      <div class="slogan-section">
        <h2 class="slogan">智能英语学习伴侣</h2>
        <p class="description">让阅读变得有趣，让记忆变得简单</p>
      </div>

      <!-- 插画区域 -->
      <div class="illustration-section">
        <div class="illustration">
          <div class="book-emoji">📖</div>
          <div class="lightbulb-emoji">💡</div>
          <div class="heart-emoji">❤️</div>
        </div>
      </div>

      <!-- 按钮区域 -->
      <div class="button-section">
        <AppButton 
          class="start-button"
          @click="handleStart"
          :loading="loading"
        >
          <span class="button-content">
            <span class="button-icon">🚀</span>
            <span class="button-text">开始探索</span>
          </span>
        </AppButton>
        
        <p class="auto-redirect" v-if="showCountdown">
          {{ countdown }}秒后自动进入
        </p>
      </div>

      <!-- 底部信息 -->
      <div class="footer-section">
        <p class="version">版本 {{ appVersion }}</p>
        <p class="copyright">© 2023 阅记星团队</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import onboardingService from '@/services/onboarding.service'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const showCountdown = ref(true)
const countdown = ref(3)
const appVersion = ref(onboardingService._getAppVersion())

// 倒计时定时器
let countdownTimer = null

// 组件挂载时开始倒计时
onMounted(() => {
  startCountdown()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

/**
 * 开始倒计时
 */
const startCountdown = () => {
  countdownTimer = setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      handleAutoRedirect()
    }
  }, 1000)
}

/**
 * 处理自动跳转
 */
const handleAutoRedirect = async () => {
  loading.value = true
  
  try {
    // 检查是否需要显示引导页
    const shouldShow = await onboardingService.shouldShowOnboarding()
    
    if (shouldShow) {
      // 跳转到引导页
      router.push('/onboarding')
    } else {
      // 跳转到仪表盘
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('自动跳转失败:', error)
    // 出错时默认跳转到仪表盘
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

/**
 * 处理开始按钮点击
 */
const handleStart = async () => {
  loading.value = true
  
  // 清除倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer)
    showCountdown.value = false
  }
  
  // 等待一小段时间让用户看到按钮反馈
  setTimeout(async () => {
    await handleAutoRedirect()
    loading.value = false
  }, 300)
}
</script>

<style scoped>
.welcome-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFE6E6 0%, #E6F7FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* 背景装饰元素 */
.background-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: #FF6B8B;
  top: -150px;
  right: -150px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: #118AB2;
  bottom: -100px;
  left: -100px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: #06D6A0;
  top: 50%;
  left: 10%;
}

.star {
  position: absolute;
  font-size: 32px;
  opacity: 0.2;
  animation: float 3s ease-in-out infinite;
}

.star-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.star-2 {
  top: 60%;
  right: 15%;
  animation-delay: 1s;
}

.star-3 {
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 主要内容 */
.welcome-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
  z-index: 1;
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo区域 */
.logo-section {
  margin-bottom: 40px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 64px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.logo-text {
  font-family: 'Kalam', cursive;
  font-size: 48px;
  font-weight: 700;
  color: #FF6B8B;
  margin: 0;
  text-shadow: 3px 3px 0 rgba(255, 107, 139, 0.2);
}

.logo-subtitle {
  font-family: 'Comfortaa', cursive;
  font-size: 24px;
  color: #118AB2;
  margin: 0;
  opacity: 0.8;
}

/* 标语区域 */
.slogan-section {
  margin-bottom: 50px;
}

.slogan {
  font-family: 'Caveat', cursive;
  font-size: 36px;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.description {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #666;
  margin: 0;
  opacity: 0.9;
}

/* 插画区域 */
.illustration-section {
  margin-bottom: 50px;
}

.illustration {
  display: flex;
  justify-content: center;
  gap: 30px;
  animation: slideIn 1s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.book-emoji,
.lightbulb-emoji,
.heart-emoji {
  font-size: 48px;
  animation: pulse 2s infinite;
}

.book-emoji {
  animation-delay: 0s;
  color: #118AB2;
}

.lightbulb-emoji {
  animation-delay: 0.5s;
  color: #FFD166;
}

.heart-emoji {
  animation-delay: 1s;
  color: #FF6B8B;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 按钮区域 */
.button-section {
  margin-bottom: 40px;
}

.start-button {
  background: linear-gradient(135deg, #FF6B8B 0%, #FF8E53 100%);
  border: none;
  border-radius: 32px;
  padding: 20px 40px;
  font-size: 20px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(255, 107, 139, 0.3);
  margin-bottom: 20px;
  min-width: 200px;
}

.start-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(255, 107, 139, 0.4);
}

.start-button:active {
  transform: translateY(-2px);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.button-icon {
  font-size: 24px;
}

.button-text {
  font-family: 'Comfortaa', cursive;
}

.auto-redirect {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #888;
  margin: 0;
  animation: fadeInOut 2s infinite;
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 底部信息 */
.footer-section {
  margin-top: 30px;
}

.version,
.copyright {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #999;
  margin: 5px 0;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .logo-icon {
    font-size: 48px;
  }
  
  .logo-text {
    font-size: 36px;
  }
  
  .logo-subtitle {
    font-size: 20px;
  }
  
  .slogan {
    font-size: 28px;
  }
  
  .description {
    font-size: 16px;
  }
  
  .book-emoji,
  .lightbulb-emoji,
  .heart-emoji {
    font-size: 36px;
  }
  
  .start-button {
    padding: 16px 32px;
    font-size: 18px;
  }
}

@media (max-width: 400px) {
  .illustration {
    gap: 20px;
  }
  
  .book-emoji,
  .lightbulb-emoji,
  .heart-emoji {
    font-size: 32px;
  }
}
</style>