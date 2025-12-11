<!-- src/components/common/AppModal.vue -->
<template>
  <transition name="modal">
    <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
      <div class="modal-container" :class="sizeClass" :style="modalStyle">
        <!-- 关闭按钮 -->
        <button v-if="showClose" class="modal-close" @click="close">
          <span class="close-icon">×</span>
        </button>
        
        <!-- 标题 -->
        <div v-if="title" class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
        </div>
        
        <!-- 内容 -->
        <div class="modal-content">
          <slot></slot>
        </div>
        
        <!-- 底部按钮 -->
        <div v-if="hasFooter" class="modal-footer">
          <slot name="footer">
            <button class="modal-button secondary" @click="close">
              取消
            </button>
            <button class="modal-button primary" @click="confirm">
              确定
            </button>
          </slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  // 是否显示
  visible: {
    type: Boolean,
    default: false
  },
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 尺寸：sm, md, lg, xl
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  // 宽度（自定义）
  width: {
    type: String,
    default: ''
  },
  // 高度（自定义）
  height: {
    type: String,
    default: ''
  },
  // 是否显示关闭按钮
  showClose: {
    type: Boolean,
    default: true
  },
  // 点击遮罩层是否关闭
  closeOnClickOverlay: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'confirm'])

// 计算属性
const sizeClass = computed(() => `modal-${props.size}`)

const modalStyle = computed(() => {
  const style = {}
  if (props.width) style.width = props.width
  if (props.height) style.height = props.height
  return style
})

const hasFooter = computed(() => {
  return props.showFooter || !!slots.footer
})

// 方法
const close = () => {
  emit('update:visible', false)
  emit('close')
}

const confirm = () => {
  emit('confirm')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    close()
  }
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 阻止背景滚动
    document.body.style.overflow = 'hidden'
  } else {
    // 恢复背景滚动
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  border: 4px solid #ffd591;
  overflow: hidden;
}

/* 尺寸 */
.modal-sm {
  width: 400px;
}

.modal-md {
  width: 600px;
}

.modal-lg {
  width: 800px;
}

.modal-xl {
  width: 1000px;
}

/* 关闭按钮 */
.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.close-icon {
  font-size: 24px;
  color: #666;
  font-weight: bold;
}

/* 头部 */
.modal-header {
  padding: 32px 32px 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.modal-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0;
  text-align: center;
}

/* 内容 */
.modal-content {
  padding: 24px 32px;
  flex: 1;
  overflow-y: auto;
}

/* 底部 */
.modal-footer {
  padding: 16px 32px;
  border-top: 2px dashed #e8e8e8;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: #fafafa;
}

.modal-button {
  padding: 12px 24px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 100px;
}

.modal-button.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.modal-button.secondary {
  background: white;
  color: #666;
  border: 2px solid #d9d9d9;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    width: 90vw;
    max-width: 400px;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 20px;
  }
}
</style>