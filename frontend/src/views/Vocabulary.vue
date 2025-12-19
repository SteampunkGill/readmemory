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
.vocabulary-layout {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: var(--spacing-lg) var(--spacing-md);
  padding-bottom: 60px;
  box-sizing: border-box;
}

/* 优化过渡效果，使其更符合童趣活泼的风格 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s var(--transition-bounce), transform 0.3s var(--transition-bounce);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 当子页面渲染时，也可以考虑给其外层容器应用圆角 */
/* 如果子页面组件本身没有全局样式，可以考虑在这里添加一个包裹层 */
/* 例如：
.vocabulary-layout > div {
  border-radius: var(--border-radius-lg);
  background-color: #ffffff; // 表面元素色
  padding: var(--spacing-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); // 柔和阴影
}
*/
</style>