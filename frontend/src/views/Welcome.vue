<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="welcome-page">
    <!-- 背景动画元素 -->
    <div class="bg-shapes">
      <div class="shape shape-1 float"></div>
      <div class="shape shape-2 bounce"></div>
      <div class="shape shape-3 float" style="animation-delay: 1s"></div>
      <div class="shape shape-4 bounce" style="animation-delay: 0.5s"></div>
      <div class="shape shape-5 float" style="animation-delay: 2s"></div>
    </div>

    <div class="content">
      <!-- Logo -->
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="阅记星 Logo" class="logo bounce">
        <h1 class="app-name">阅记星</h1>
        <p class="tagline">让阅读更有趣，让单词更好记</p>
      </div>

      <!-- 标语 -->
      <div class="slogan">
        <h2>你的智能阅读伙伴</h2>
        <p>OCR 即点即查 · 生词本 · 智能复习</p>
      </div>

      <!-- 动作按钮 -->
      <div class="actions">
        <button class="btn-primary btn-lg" @click="goToOnboarding">
          开始探索
        </button>
        <button class="btn-outline btn-lg" @click="skipToLogin">
          跳过引导
        </button>
      </div>

      <!-- 倒计时提示 -->
      <div class="countdown">
        <p>{{ countdown }} 秒后自动进入</p>
        <div class="progress-bar">
          <div class="progress" :style="{ width: progressWidth }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(3)
const progressWidth = ref('0%')
let timer = null

const goToOnboarding = () => {
  clearInterval(timer)
  router.push('/onboarding')
}

const skipToLogin = () => {
  clearInterval(timer)
  // 模拟已登录状态，直接跳转到书架
  localStorage.setItem('isAuthenticated', 'true')
  router.push('/bookshelf')
}

onMounted(() => {
  // 启动倒计时
  let seconds = 3
  const updateProgress = () => {
    countdown.value = seconds
    progressWidth.value = `${(3 - seconds) * 33.33}%`
    if (seconds <= 0) {
      goToOnboarding()
      return
    }
    seconds--
  }
  updateProgress()
  timer = setInterval(updateProgress, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
<style scoped>
/* 导入字体 */
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Quicksand:wght@400;500;700&display=swap');

/* CSS 变量定义 - 完全遵循童趣风格指南 */
:root {
  /* 色彩方案 */
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色卡片 */
  --primary-color: #87CEEB; /* 天蓝色 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333;
  --text-color-medium: #666666;
  --text-color-light: #999999;
  --border-color: #e0e0e0;
  
  /* 圆角大小 - 超大圆角 */
  --border-radius-sm: 8px;
  --border-radius-md: 16px;
  --border-radius-lg: 24px;
  --border-radius-xl: 40px;
  
  /* 间距 - 宽敞布局 */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  /* 字体 */
  --font-heading: 'Kalam', cursive;
  --font-body: 'Quicksand', sans-serif;
  
  /* 阴影 */
  --shadow-sm: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, 
    rgba(255, 182, 193, 0.2) 0%, 
    rgba(173, 216, 230, 0.3) 50%, 
    rgba(144, 238, 144, 0.2) 100%);
  font-family: var(--font-body);
  animation: gradient-shift 15s ease infinite alternate;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 背景动画形状 */
.bg-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
  filter: blur(2px);
}

.shape-1 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--primary-color), var(--primary-light));
  top: 10%;
  left: 5%;
  box-shadow: 0 0 40px rgba(135, 206, 235, 0.5);
}

.shape-2 {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, var(--accent-yellow), #ffed4e);
  bottom: 15%;
  right: 10%;
  box-shadow: 0 0 30px rgba(255, 214, 0, 0.5);
}

.shape-3 {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--accent-pink), #ffd1dc);
  top: 50%;
  left: 80%;
  box-shadow: 0 0 20px rgba(255, 182, 193, 0.5);
}

.shape-4 {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, var(--accent-green), #a8e6a8);
  bottom: 40%;
  left: 15%;
  box-shadow: 0 0 25px rgba(144, 238, 144, 0.5);
}

.shape-5 {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, var(--primary-light), #d4f1f9);
  top: 70%;
  right: 20%;
  box-shadow: 0 0 15px rgba(173, 216, 230, 0.5);
}

/* 浮动动画 */
@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  50% { 
    transform: translateY(-20px) rotate(5deg); 
  }
}

.float {
  animation: float 6s ease-in-out infinite;
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 100% { 
    transform: translateY(0) scale(1); 
  }
  50% { 
    transform: translateY(-15px) scale(1.05); 
  }
}

.bounce {
  animation: bounce 4s ease-in-out infinite;
}

/* 主要内容区域 */
.content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  background-color: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 6px solid var(--primary-color);
  animation: content-appear 0.8s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes content-appear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Logo 区域 */
.logo-container {
  margin-bottom: var(--spacing-xl);
}

.logo {
  width: 140px;
  height: 140px;
  margin-bottom: var(--spacing-md);
  border-radius: 50%;
  border: 5px solid var(--accent-yellow);
  box-shadow: 
    0 0 30px rgba(255, 214, 0, 0.4),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
  transition: all 0.5s ease;
}

.logo:hover {
  transform: rotate(360deg) scale(1.1);
  border-color: var(--accent-pink);
}

.app-name {
  font-family: var(--font-heading);
  font-size: 64px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
  text-shadow: 
    3px 3px 0 var(--accent-yellow),
    6px 6px 0 rgba(0, 0, 0, 0.1);
  letter-spacing: 2px;
  animation: text-glow 3s ease-in-out infinite alternate;
}

@keyframes text-glow {
  from { 
    text-shadow: 
      3px 3px 0 var(--accent-yellow),
      6px 6px 0 rgba(0, 0, 0, 0.1);
  }
  to { 
    text-shadow: 
      3px 3px 0 var(--accent-pink),
      6px 6px 0 rgba(0, 0, 0, 0.1),
      0 0 20px rgba(255, 182, 193, 0.5);
  }
}

.tagline {
  font-size: 24px;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-lg);
  font-weight: 500;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 标语区域 */
.slogan {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, 
    rgba(173, 216, 230, 0.2), 
    rgba(255, 214, 0, 0.1));
  border-radius: var(--border-radius-lg);
  border: 4px dashed var(--accent-green);
}

.slogan h2 {
  font-family: var(--font-heading);
  font-size: 36px;
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.slogan p {
  font-size: 20px;
  color: var(--text-color-dark);
  line-height: 1.6;
  font-weight: 500;
}

/* 动作按钮区域 */
.actions {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.btn-lg {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: 20px;
  border-radius: var(--border-radius-xl);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  min-width: 200px;
  box-shadow: var(--shadow-md);
  font-family: var(--font-body);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-green));
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary-dark), #7cd87c);
}

.btn-outline {
  background: transparent;
  color: var(--primary-dark);
  border: 3px solid var(--primary-color);
  position: relative;
  overflow: hidden;
}

.btn-outline::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(135, 206, 235, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-outline:hover::before {
  left: 100%;
}

.btn-outline:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background-color: rgba(135, 206, 235, 0.1);
  border-color: var(--primary-dark);
}

/* 倒计时区域 */
.countdown {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(255, 214, 0, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-yellow);
}

.countdown p {
  font-size: 18px;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
}

.progress-bar {
  width: 300px;
  height: 16px;
  background-color: rgba(173, 216, 230, 0.3);
  border-radius: var(--border-radius-xl);
  margin: 0 auto;
  overflow: hidden;
  border: 2px solid var(--primary-light);
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--primary-color), 
    var(--accent-green),
    var(--accent-yellow));
  border-radius: var(--border-radius-xl);
  transition: width 1s linear;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-page {
    padding: var(--spacing-md);
  }
  
  .content {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }
  
  .app-name {
    font-size: 48px;
  }
  
  .logo {
    width: 100px;
    height: 100px;
  }
  
  .tagline {
    font-size: 20px;
  }
  
  .slogan h2 {
    font-size: 28px;
  }
  
  .slogan p {
    font-size: 18px;
  }
  
  .actions {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .btn-lg {
    min-width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 18px;
  }
  
  .progress-bar {
    width: 200px;
  }
}

@media (max-width: 480px) {
  .app-name {
    font-size: 36px;
  }
  
  .tagline {
    font-size: 18px;
  }
  
  .slogan h2 {
    font-size: 24px;
  }
  
  .slogan p {
    font-size: 16px;
  }
  
  .btn-lg {
    font-size: 16px;
    padding: var(--spacing-md);
  }
  
  .progress-bar {
    width: 150px;
    height: 12px;
  }
}

/* 添加一些额外的趣味效果 */
@keyframes sparkle {
  0%, 100% { 
    opacity: 0; 
    transform: scale(0) rotate(0deg); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1) rotate(180deg); 
  }
}

.content::after {
  content: '✨';
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 32px;
  animation: sparkle 2s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255, 214, 0, 0.8));
}

.content::before {
  content: '⭐';
  position: absolute;
  bottom: -20px;
  left: -20px;
  font-size: 32px;
  animation: sparkle 2s ease-in-out infinite reverse;
  animation-delay: 1s;
  filter: drop-shadow(0 0 8px rgba(255, 182, 193, 0.8));
}
</style>