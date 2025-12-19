<template>
  <div class="vocabulary-layout">
    <!-- 子页面将在这里渲染 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script>
export default {
  name: 'Vocabulary'
};
</script>

<style scoped>
/* 定义CSS变量 - 童趣风格 */
.vocabulary-layout {
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色表面 */
  --primary-color: #87CEEB; /* 天蓝色主色调 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333; /* 深灰文本 */
  --text-color-medium: #666666; /* 中灰文本 */
  --text-color-light: #999999; /* 浅灰文本 */
  --border-color: #e0e0e0; /* 柔和边框色 */
  
  --border-radius-sm: 12px;
  --border-radius-md: 20px;
  --border-radius-lg: 30px;
  --border-radius-xl: 50px;
  
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  --shadow-soft: 0 6px 15px rgba(135, 206, 235, 0.1);
  --shadow-medium: 0 10px 25px rgba(135, 206, 235, 0.2);
  --shadow-hard: 0 15px 35px rgba(135, 206, 235, 0.3);
  
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 字体定义 */
  font-family: 'Quicksand', 'Comfortaa', 'Varela Round', sans-serif;
  line-height: 1.6;
}

/* 整体布局容器 */
.vocabulary-layout {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: var(--spacing-xl) var(--spacing-lg);
  padding-bottom: 80px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.vocabulary-layout::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(135, 206, 235, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
  animation: floatBackground 20s linear infinite;
}

@keyframes floatBackground {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 为所有子页面添加统一的装饰容器 */
.vocabulary-layout > div {
  position: relative;
  z-index: 1;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-hard);
  border: 6px solid var(--primary-color);
  transition: var(--transition-smooth);
  min-height: 500px;
  overflow: hidden;
}

.vocabulary-layout > div::before {
  content: "📚";
  position: absolute;
  top: -30px;
  right: -30px;
  font-size: 6rem;
  opacity: 0.08;
  transform: rotate(30deg);
  animation: gentleFloat 10s ease-in-out infinite;
}

@keyframes gentleFloat {
  0%, 100% { transform: rotate(30deg) translateY(0); }
  50% { transform: rotate(35deg) translateY(-10px); }
}

/* 装饰性边框效果 */
.vocabulary-layout > div::after {
  content: "";
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  background: linear-gradient(45deg, 
    var(--primary-color), 
    var(--accent-yellow), 
    var(--accent-pink), 
    var(--accent-green));
  border-radius: var(--border-radius-lg);
  z-index: -1;
  opacity: 0.3;
  animation: gradientBorder 6s ease infinite;
}

@keyframes gradientBorder {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 页面过渡动画 - 童趣风格优化 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s var(--transition-bounce), transform 0.4s var(--transition-bounce);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9) rotate(2deg);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9) rotate(-2deg);
}

/* 添加一些装饰性元素 */
.vocabulary-layout::after {
  content: "✨";
  position: absolute;
  top: 50px;
  left: 50px;
  font-size: 2rem;
  opacity: 0.3;
  animation: twinkle 3s infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.2; transform: scale(0.8); }
  100% { opacity: 0.5; transform: scale(1.2); }
}

/* 添加一些浮动的小装饰 */
.vocabulary-layout .floating-decoration {
  position: absolute;
  z-index: 0;
  opacity: 0.1;
  animation: floatAround 20s linear infinite;
}

.vocabulary-layout .floating-decoration:nth-child(1) {
  top: 10%;
  left: 10%;
  font-size: 3rem;
  animation-delay: 0s;
}

.vocabulary-layout .floating-decoration:nth-child(2) {
  top: 20%;
  right: 15%;
  font-size: 2.5rem;
  animation-delay: -5s;
}

.vocabulary-layout .floating-decoration:nth-child(3) {
  bottom: 30%;
  left: 20%;
  font-size: 3.5rem;
  animation-delay: -10s;
}

@keyframes floatAround {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -20px) rotate(90deg);
  }
  50% {
    transform: translate(0, -40px) rotate(180deg);
  }
  75% {
    transform: translate(-30px, -20px) rotate(270deg);
  }
  100% {
    transform: translate(0, 0) rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .vocabulary-layout {
    padding: var(--spacing-md);
    padding-bottom: 60px;
  }
  
  .vocabulary-layout > div {
    padding: var(--spacing-lg);
    border-width: 4px;
  }
  
  .vocabulary-layout > div::before {
    font-size: 4rem;
    top: -20px;
    right: -20px;
  }
}

@media (max-width: 480px) {
  .vocabulary-layout {
    padding: var(--spacing-sm);
    padding-bottom: 50px;
  }
  
  .vocabulary-layout > div {
    padding: var(--spacing-md);
    border-width: 3px;
  }
  
  .vocabulary-layout > div::before {
    font-size: 3rem;
    top: -15px;
    right: -15px;
  }
}
</style>