// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 导入全局样式
import './assets/global.css'

// 创建应用实例
const app = createApp(App)

// 使用Pinia
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')

// 移除加载动画
window.addEventListener('load', () => {
  const loadingElement = document.getElementById('app-loading')
  if (loadingElement) {
    loadingElement.style.opacity = '0'
    loadingElement.style.transition = 'opacity 0.5s ease'
    setTimeout(() => {
      loadingElement.style.display = 'none'
    }, 500)
  }
})

// 错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err)
  console.error('组件:', vm)
  console.error('信息:', info)
  
  // 可以在这里发送错误到服务器
  // sendErrorToServer(err, vm, info)
}

// 性能监控
if (import.meta.env.DEV) {
  // 开发环境性能监控
  const startTime = performance.now()
  app.config.performance = true
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Vue 警告:', msg)
    console.warn('追踪:', trace)
  }
  
  // 记录应用启动时间
  app.config.globalProperties.$appStartTime = startTime
}