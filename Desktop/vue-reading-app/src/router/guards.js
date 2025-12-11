// src/router/guards.js
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'

/**
 * 设置路由守卫
 * @param {Router} router - Vue Router 实例
 */
export function setupGuards(router) {
  // 全局前置守卫
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const settingsStore = useSettingsStore()
    
    // 检查是否需要认证
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    
    // 如果路由需要认证但用户未登录
    if (requiresAuth && !authStore.isAuthenticated) {
      // 尝试检查认证状态
      await authStore.checkAuthStatus()
      
      if (!authStore.isAuthenticated) {
        // 保存目标路由，登录后重定向
        const redirectUrl = to.fullPath !== '/welcome' ? to.fullPath : undefined
        
        // 跳转到登录页
        next({
          name: 'login',
          query: redirectUrl ? { redirect: redirectUrl } : {}
        })
        return
      }
    }
    
    // 如果用户已登录但访问认证页面（如登录、注册）
    if (authStore.isAuthenticated && to.matched.some(record => record.meta.publicOnly)) {
      // 跳转到仪表盘
      next({ name: 'dashboard' })
      return
    }
    
    // 检查用户权限（如果有权限控制）
    if (to.meta.permissions) {
      const userPermissions = authStore.user?.permissions || []
      const hasPermission = to.meta.permissions.some(permission => 
        userPermissions.includes(permission)
      )
      
      if (!hasPermission) {
        // 没有权限，跳转到403页面或仪表盘
        next({ name: 'dashboard' })
        return
      }
    }
    
    // 检查是否需要加载设置
    if (requiresAuth && !settingsStore.hasSettings) {
      try {
        await settingsStore.getSettings()
      } catch (error) {
        console.warn('加载设置失败:', error)
      }
    }
    
    // 继续导航
    next()
  })
  
  // 全局解析守卫
  router.beforeResolve(async (to, from, next) => {
    // 可以在这里添加数据预加载逻辑
    next()
  })
  
  // 全局后置守卫
  router.afterEach((to, from) => {
    // 可以在这里添加页面切换后的逻辑
  })
  
  // 错误处理
  router.onError((error) => {
    console.error('路由错误:', error)
    
    // 如果是Chunk加载错误，可以尝试重新加载
    if (/Loading chunk (\d)+ failed/.test(error.message)) {
      const isConfirmed = window.confirm(
        '页面资源加载失败，可能是网络问题。是否重新加载页面？'
      )
      
      if (isConfirmed) {
        window.location.reload()
      }
    }
  })
}

// 导出单个函数
export default setupGuards