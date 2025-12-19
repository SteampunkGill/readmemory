/**
 * 前端应用程序的主入口文件 (main.js)
 * 
 * 这个文件负责初始化 Vue 实例，并挂载各种插件（如路由、样式等）。
 */

// 从 vue 库中导入 createApp 函数，用于创建 Vue 应用实例
import { createApp } from 'vue'

// 导入根组件 App.vue，它是所有其他组件的父容器
import App from './App.vue'

// 导入路由配置，负责页面之间的跳转逻辑
import router from './router'

// 导入全局 CSS 样式文件，确保全站风格统一
import './styles/global.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 告诉 Vue 使用路由插件
app.use(router)

// 将应用挂载到 HTML 中 id 为 'app' 的 DOM 元素上
app.mount('#app')
