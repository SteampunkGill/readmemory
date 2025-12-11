<template>
  <div class="onboarding-view">
    <!-- 进度指示器 -->
    <div class="progress-indicator">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div class="progress-text">
        第 {{ currentPageIndex + 1 }} / {{ totalPages }} 步
      </div>
    </div>

    <!-- 引导内容区域 -->
    <div class="onboarding-content">
      <!-- 图标/插画 -->
      <div class="page-icon" :style="{ color: currentPage.color }">
        {{ currentPage.icon }}
      </div>

      <!-- 标题 -->
      <h1 class="page-title">{{ currentPage.title }}</h1>

      <!-- 描述 -->
      <p class="page-description">{{ currentPage.description }}</p>

      <!-- 功能列表 -->
      <div v-if="currentPage.features && currentPage.features.length" class="features-list">
        <div 
          v-for="(feature, index) in currentPage.features" 
          :key="index"
          class="feature-item"
        >
          <span class="feature-icon">✓</span>
          <span class="feature-text">{{ feature }}</span>
        </div>
      </div>

      <!-- 图片（如果有） -->
      <div v-if="currentPage.image" class="page-image">
        <img :src="currentPage.image" :alt="currentPage.title" />
      </div>

      <!-- 占位插画（如果没有图片） -->
      <div v-else class="placeholder-illustration">
        <div class="illustration-container">
          <div class="floating-shape shape-1" :style="{ backgroundColor: currentPage.color + '20' }"></div>
          <div class="floating-shape shape-2" :style="{ backgroundColor: currentPage.color + '30' }"></div>
          <div class="floating-shape shape-3" :style="{ backgroundColor: currentPage.color + '40' }"></div>
        </div>
      </div>
    </div>

    <!-- 按钮区域 -->
    <div class="button-section">
      <!-- 上一步按钮（不是第一页时显示） -->
      <AppButton
        v-if="currentPageIndex > 0"
        class="prev-button"
        @click="goToPreviousPage"
        variant="outline"
      >
        <span class="button-content">
          <span class="button-icon">⬅️</span>
          <span class="button-text">上一步</span>
        </span>
      </AppButton>

      <!-- 下一步/完成按钮 -->
      <AppButton
        class="next-button"
        @click="handleNext"
        :loading="loading"
        :style="{ backgroundColor: currentPage.color }"
      >
        <span class="button-content">
          <span class="button-text">{{ currentPage.buttonText }}</span>
          <span v-if="!isLastPage" class="button-icon">➡️</span>
          <span v-else class="button-icon">🎉</span>
        </span>
      </AppButton>

      <!-- 跳过按钮（不是最后一页时显示） -->
      <AppButton
        v-if="!isLastPage"
        class="skip-button"
        @click="handleSkip"
        variant="text"
      >
        跳过引导
      </AppButton>
    </div>

    <!-- 分页指示器 -->
    <div class="pagination-dots">
      <button
        v-for="(page, index) in pages"
        :key="page.id"
        class="dot"
        :class="{ active: index === currentPageIndex }"
        @click="goToPage(index)"
        :style="{ backgroundColor: index === currentPageIndex ? currentPage.color : '#ddd' }"
        :aria-label="`跳转到第 ${index + 1} 页`"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import onboardingService from '@/services/onboarding.service'

const router = useRouter()

// 响应式数据
const currentPageIndex = ref(0)
const loading = ref(false)

// 获取引导页配置
const pages = onboardingService.getOnboardingConfig()
const totalPages = pages.length

// 计算属性
const currentPage = computed(() => pages[currentPageIndex.value])
const isLastPage = computed(() => currentPageIndex.value === totalPages - 1)
const progressPercentage = computed(() => ((currentPageIndex.value + 1) / totalPages) * 100)

/**
 * 跳转到下一页
 */
const goToNextPage = async () => {
  if (currentPageIndex.value < totalPages - 1) {
    currentPageIndex.value++
    // 保存进度
    await onboardingService.saveOnboardingProgress(currentPageIndex.value)
  }
}

/**
 * 跳转到上一页
 */
const goToPreviousPage = async () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
    // 保存进度
    await onboardingService.saveOnboardingProgress(currentPageIndex.value)
  }
}

/**
 * 跳转到指定页
 */
const goToPage = async (index) => {
  if (index >= 0 && index < totalPages) {
    currentPageIndex.value = index
    // 保存进度
    await onboardingService.saveOnboardingProgress(currentPageIndex.value)
  }
}

/**
 * 处理下一步/完成按钮点击
 */
const handleNext = async () => {
  if (isLastPage.value) {
    // 最后一页：完成引导
    await handleComplete()
  } else {
    // 不是最后一页：跳转到下一页
    await goToNextPage()
  }
}

/**
 * 处理完成引导
 */
const handleComplete = async () => {
  loading.value = true
  
  try {
    // 标记引导完成
    const success = await onboardingService.markOnboardingCompleted()
    
    if (success) {
      // 跳转到仪表盘
      router.push('/dashboard')
    } else {
      console.error('标记引导完成失败')
      // 即使失败也跳转到仪表盘，避免用户卡在引导页
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('完成引导时出错:', error)
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

/**
 * 处理跳过引导
 */
const handleSkip = async () => {
  if (confirm('确定要跳过引导吗？你可以随时在设置中重新查看。')) {
    loading.value = true
    
    try {
      // 标记引导完成（跳过）
      const success = await onboardingService.skipOnboarding({
        reason: 'user_skipped'
      })
      
      if (success) {
        // 跳转到仪表盘
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('跳过引导时出错:', error)
      router.push('/dashboard')
    } finally {
      loading.value = false
    }
  }
}

// 组件挂载时检查是否已完成引导
onMounted(async () => {
  // 检查是否已完成引导
  const completed = await onboardingService.checkOnboardingStatus()
  
  if (completed) {
    // 如果已完成引导，直接跳转到仪表盘
    router.push('/dashboard')
    return
  }
  
  // 获取之前的进度
  const progress = await onboardingService.getOnboardingProgress()
  if (progress.lastPageViewed > 0 && progress.lastPageViewed < totalPages) {
    currentPageIndex.value = progress.lastPageViewed
  }
  
  // 保存当前进度
  await onboardingService.saveOnboardingProgress(currentPageIndex.value)
})

// 添加键盘导航支持
const handleKeyDown = (event) => {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      goToPreviousPage()
      break
    case 'ArrowRight':
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleNext()
      break
    case 'Escape':
      event.preventDefault()
      handleSkip()
      break
  }
}

// 添加键盘事件监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

// 清理事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.onboarding-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 进度指示器 */
.progress-indicator {
  margin-bottom: 40px;
  max-width: 600px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  height: 12px;
  background-color: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B8B, #118AB2);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  text-align: center;
}

/* 引导内容区域 */
.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.page-icon {
  font-size: 80px;
  margin-bottom: 30px;
  animation: bounceIn 0.8s ease-out;
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

.page-title {
  font-family: 'Caveat', cursive;
  font-size: 42px;
  color: #333;
  margin: 0 0 20px 0;
  line-height: 1.2;
  animation: slideUp 0.6s ease-out 0.2s both;
}

.page-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 20px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 40px 0;
  max-width: 600px;
  animation: slideUp 0.6s ease-out 0.4s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 功能列表 */
.features-list {
  margin: 30px 0 40px 0;
  max-width: 500px;
  width: 100%;
  animation: slideUp 0.6s ease-out 0.6s both;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-3px);
}

.feature-icon {
  font-size: 20px;
  color: #06D6A0;
  font-weight: bold;
}

.feature-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #555;
  text-align: left;
  flex: 1;
}

.page-image {
  margin: 40px 0;
  max-width: 400px;
  width: 100%;
}

.page-image img {
  width: 100%;
  height: auto;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* 占位插画 */
.placeholder-illustration {
  margin: 40px 0;
  width: 300px;
  height: 200px;
  position: relative;
}

.illustration-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  animation: floatShape 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20px;
  left: 50px;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 80px;
  right: 60px;
  animation-delay: 1s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20px;
  left: 100px;
  animation-delay: 2s;
}

@keyframes floatShape {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* 按钮区域 */
.button-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.prev-button,
.next-button,
.skip-button {
  border-radius: 32px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
}

.prev-button {
  background-color: white;
  border: 2px solid #ddd;
  color: #666;
}

.prev-button:hover {
  background-color: #f5f5f5;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.next-button {
  background: linear-gradient(135deg, #FF6B8B 0%, #118AB2 100%);
  border: none;
  color: white;
  box-shadow: 0 8px 20px rgba(255, 107, 139, 0.3);
}

.next-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(255, 107, 139, 0.4);
}

.next-button:active {
  transform: translateY(-2px);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.button-icon {
  font-size: 20px;
}

.skip-button {
  background: none;
  border: none;
  color: #888;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  padding: 10px 20px;
}

.skip-button:hover {
  color: #666;
  text-decoration: underline;
}

/* 分页指示器 */
.pagination-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #ddd;
}

.dot.active {
  transform: scale(1.3);
}

.dot:hover {
  transform: scale(1.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 36px;
  }
  
  .page-description {
    font-size: 18px;
  }
  
  .page-icon {
    font-size: 64px;
  }
  
  .prev-button,
  .next-button {
    padding: 14px 28px;
    font-size: 16px;
    min-width: 140px;
  }
  
  .features-list {
    margin: 20px 0 30px 0;
  }
  
  .feature-item {
    padding: 10px 16px;
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .onboarding-view {
    padding: 15px;
  }
  
  .page-title {
    font-size: 30px;
  }
  
  .page-description {
    font-size: 16px;
  }
  
  .page-icon {
    font-size: 56px;
  }
  
  .button-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .prev-button,
  .next-button {
    width: 100%;
    max-width: 280px;
  }
  
  .placeholder-illustration {
    width: 250px;
    height: 150px;
  }
  
  .features-list {
    max-width: 100%;
  }
}
</style>