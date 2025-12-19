<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="onboarding-page">
    <div class="header">
      <h1>发现阅记星的强大功能</h1>
      <p>滑动了解如何让阅读变得更轻松有趣</p>
    </div>

    <!-- 幻灯片容器 -->
    <div class="slides-container">
      <div class="slides" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
        <div v-for="(slide, index) in slides" :key="index" class="slide">
          <div class="slide-content">
            <div class="illustration">
              <div class="icon" :class="slide.icon" :style="{ backgroundColor: slide.color }">
                {{ slide.emoji }}
              </div>
            </div>
            <h2>{{ slide.title }}</h2>
            <p class="description">{{ slide.description }}</p>
            <ul v-if="slide.features" class="features">
              <li v-for="(feature, i) in slide.features" :key="i">{{ feature }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页指示器 -->
    <div class="pagination">
      <button
        v-for="(slide, index) in slides"
        :key="index"
        class="dot"
        :class="{ active: currentIndex === index }"
        @click="currentIndex = index"
        :aria-label="`转到第 ${index + 1} 页`"
      ></button>
    </div>

    <!-- 导航按钮 -->
    <div class="navigation">
      <button class="btn-outline" @click="skip" v-if="currentIndex !== slides.length - 1">
        跳过
      </button>
      <div class="nav-buttons">
        <button class="btn-secondary" @click="prev" :disabled="currentIndex === 0">
          上一步
        </button>
        <button class="btn-primary" @click="next">
          {{ currentIndex === slides.length - 1 ? '立即体验' : '下一步' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 模拟幻灯片数据
const slides = ref([
  {
    icon: 'icon-ocr',
    emoji: '📸',
    color: '#FF9E9E',
    title: '智能 OCR 识别',
    description: '拍照或上传文档，瞬间将图片文字转换为可编辑文本',
    features: [
      '支持 PDF、图片、扫描件',
      '高精度文字识别',
      '多语言支持'
    ]
  },
  {
    icon: 'icon-lookup',
    emoji: '🔍',
    color: '#A3E4D7',
    title: '即点即查',
    description: '阅读时点击任意单词，立即显示释义、发音和例句',
    features: [
      '内置权威词典',
      '真人发音',
      '语境例句'
    ]
  },
  {
    icon: 'icon-vocab',
    emoji: '📚',
    color: '#FFD166',
    title: '智能生词本',
    description: '自动收集生词，按记忆曲线智能安排复习',
    features: [
      '自动分类整理',
      '多维度复习模式',
      '进度可视化'
    ]
  },
  {
    icon: 'icon-review',
    emoji: '🧠',
    color: '#8AC926',
    title: '科学复习系统',
    description: '基于艾宾浩斯遗忘曲线，帮你牢固记忆每一个单词',
    features: [
      '自适应复习计划',
      '多种练习题型',
      '学习报告分析'
    ]
  }
])

const currentIndex = ref(0)

const next = () => {
  if (currentIndex.value < slides.value.length - 1) {
    currentIndex.value++
  } else {
    // 跳转到登录页
    router.push('/login')
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const skip = () => {
  router.push('/login')
}
</script>
<style scoped>
/* 定义CSS变量 - 童趣风格 */
.onboarding-page {
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

/* 整体页面 */
.onboarding-page {
  min-height: 100vh;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, 
    rgba(135, 206, 235, 0.15) 0%, 
    rgba(255, 215, 0, 0.1) 25%, 
    rgba(255, 182, 193, 0.1) 50%, 
    rgba(144, 238, 144, 0.1) 75%, 
    rgba(173, 216, 230, 0.15) 100%);
  position: relative;
  overflow: hidden;
}

.onboarding-page::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(135, 206, 235, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(255, 182, 193, 0.2) 0%, transparent 50%);
  animation: floatBackground 20s linear infinite;
  z-index: 0;
}

@keyframes floatBackground {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 头部区域 */
.header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  position: relative;
  z-index: 1;
}

.header h1 {
  font-size: 3.5rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
  letter-spacing: 1px;
  position: relative;
  display: inline-block;
}

.header h1::after {
  content: "🌟";
  position: absolute;
  right: -60px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { 
    transform: translateY(-50%) scale(1) rotate(0deg); 
    opacity: 1;
  }
  50% { 
    transform: translateY(-60%) scale(1.2) rotate(20deg); 
    opacity: 0.8;
  }
}

.header p {
  font-size: 1.4rem;
  color: var(--text-color-medium);
  font-weight: 500;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-sm);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: var(--border-radius-md);
  border: 3px dashed var(--accent-yellow);
}

/* 幻灯片容器 */
.slides-container {
  width: 100%;
  max-width: 900px;
  overflow: hidden;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-hard);
  background-color: var(--surface-color);
  border: 6px solid var(--primary-color);
  position: relative;
  z-index: 1;
}

.slides-container::before {
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
  animation: gradientBorder 3s ease infinite;
}

@keyframes gradientBorder {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.slides {
  display: flex;
  transition: transform 0.6s var(--transition-bounce);
}

.slide {
  min-width: 100%;
  padding: var(--spacing-xl);
}

.slide-content {
  text-align: center;
  padding: var(--spacing-lg);
}

/* 插画区域 */
.illustration {
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.icon {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  box-shadow: var(--shadow-hard);
  margin-bottom: var(--spacing-md);
  border: 8px solid white;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.icon::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle at center, 
    rgba(255, 255, 255, 0.4) 0%, 
    transparent 70%);
  transform: rotate(45deg);
  animation: shine 3s linear infinite;
}

@keyframes shine {
  0% { transform: rotate(45deg) translateX(-100%); }
  100% { transform: rotate(45deg) translateX(100%); }
}

.icon:hover {
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

/* 幻灯片标题 */
.slide h2 {
  font-size: 2.8rem;
  margin-bottom: var(--spacing-md);
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
  position: relative;
  display: inline-block;
}

.slide h2::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 6px;
  background: linear-gradient(90deg, 
    var(--primary-color), 
    var(--accent-yellow));
  border-radius: 3px;
}

/* 描述文本 */
.description {
  font-size: 1.5rem;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-lg);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
  padding: var(--spacing-md);
  background-color: rgba(173, 216, 230, 0.1);
  border-radius: var(--border-radius-md);
  border-left: 6px solid var(--accent-green);
}

/* 功能列表 */
.features {
  list-style: none;
  padding: 0;
  margin: var(--spacing-xl) auto;
  max-width: 500px;
  text-align: left;
}

.features li {
  padding: var(--spacing-sm) 0;
  font-size: 1.3rem;
  position: relative;
  padding-left: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
  color: var(--text-color-dark);
  font-weight: 500;
  transition: var(--transition-smooth);
}

.features li:hover {
  transform: translateX(10px);
  color: var(--primary-dark);
}

.features li:before {
  content: '✨';
  position: absolute;
  left: 0;
  font-size: 1.5rem;
  animation: bounce 1s infinite alternate;
}

@keyframes bounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(-5px); }
}

/* 分页指示器 */
.pagination {
  display: flex;
  gap: var(--spacing-sm);
  margin: var(--spacing-xl) 0;
  position: relative;
  z-index: 1;
}

.dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--primary-light);
  border: 3px solid transparent;
  padding: 0;
  cursor: pointer;
  transition: var(--transition-smooth);
  position: relative;
}

.dot::before {
  content: "";
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border-radius: 50%;
  border: 2px dashed var(--primary-color);
  opacity: 0;
  transition: opacity 0.3s;
}

.dot:hover {
  transform: scale(1.3);
  background-color: var(--accent-yellow);
}

.dot:hover::before {
  opacity: 1;
}

.dot.active {
  background-color: var(--primary-color);
  transform: scale(1.5);
  border-color: white;
  box-shadow: 0 0 0 4px var(--primary-light);
}

/* 导航区域 */
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 900px;
  margin-top: var(--spacing-xl);
  position: relative;
  z-index: 1;
}

.btn-outline {
  background-color: transparent;
  border: 3px solid var(--primary-color);
  color: var(--primary-color);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 1.2rem;
  transition: var(--transition-smooth);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(135, 206, 235, 0.3);
}

.btn-outline:active {
  transform: translateY(-1px) scale(0.98);
}

.nav-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.btn-secondary, .btn-primary {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-size: 1.3rem;
  transition: var(--transition-smooth);
  font-family: 'Quicksand', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-secondary {
  background-color: var(--accent-pink);
  color: white;
  box-shadow: 0 6px 12px rgba(255, 182, 193, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background-color: #ff9eb5;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 24px rgba(255, 182, 193, 0.4);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-secondary:active, .btn-primary:active {
  transform: translateY(-1px) scale(0.98);
}

/* 按钮涟漪效果 */
.btn-secondary::after, .btn-primary::after, .btn-outline::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn-secondary:focus:not(:active)::after,
.btn-primary:focus:not(:active)::after,
.btn-outline:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

/* 禁用状态 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

button:disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .onboarding-page {
    padding: var(--spacing-md);
  }
  
  .header h1 {
    font-size: 2.5rem;
  }
  
  .header h1::after {
    display: none;
  }
  
  .header p {
    font-size: 1.2rem;
    padding: var(--spacing-sm);
  }
  
  .slide {
    padding: var(--spacing-lg);
  }
  
  .icon {
    width: 120px;
    height: 120px;
    font-size: 3.5rem;
    border-width: 6px;
  }
  
  .slide h2 {
    font-size: 2.2rem;
  }
  
  .description {
    font-size: 1.2rem;
    padding: var(--spacing-sm);
  }
  
  .features li {
    font-size: 1.1rem;
    padding-left: var(--spacing-lg);
  }
  
  .navigation {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .nav-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .btn-secondary, .btn-primary {
    min-width: 120px;
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 1.1rem;
  }
  
  .btn-outline {
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .header p {
    font-size: 1rem;
  }
  
  .icon {
    width: 100px;
    height: 100px;
    font-size: 2.8rem;
  }
  
  .slide h2 {
    font-size: 1.8rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .features li {
    font-size: 0.95rem;
  }
  
  .btn-secondary, .btn-primary {
    min-width: 100px;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 1rem;
  }
  
  .dot {
    width: 16px;
    height: 16px;
  }
}
</style>