// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

// 布局组件
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ReaderLayout from '@/layouts/ReaderLayout.vue'

// 视图组件
import WelcomeView from '@/views/onboarding/WelcomeView.vue'
import OnboardingView from '@/views/onboarding/OnboardingView.vue'

import LoginView from '@/views/Auth/LoginView.vue'
import RegisterView from '@/views/Auth/RegisterView.vue'
import ForgotPasswordView from '@/views/Auth/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/Auth/ResetPasswordView.vue'

import DashboardView from '@/views/Dashboard/DashboardView.vue'

import DocumentListView from '@/views/Documents/DocumentListView.vue'
import DocumentDetailView from '@/views/Documents/DocumentDetailView.vue'
import DocumentEditView from '@/views/Documents/DocumentEditView.vue'
import DocumentUploadView from '@/views/Documents/DocumentUploadView.vue'

import ReaderView from '@/views/Reader/ReaderView.vue'

import VocabularyView from '@/views/Vocabulary/VocabularyView.vue'
import VocabularyDetailView from '@/views/Vocabulary/VocabularyDetailView.vue'

import ReviewView from '@/views/Review/ReviewView.vue'

import UserProfileView from '@/views/User/UserProfileView.vue'
import AchievementsView from '@/views/User/AchievementsView.vue'
import LearningStatsView from '@/views/User/LearningStatsView.vue'
import UserSettingsView from '@/views/User/UserSettingsView.vue'

import GlobalSearchView from '@/views/Settings/GlobalSearchView.vue'
import OfflineManagementView from '@/views/Settings/OfflineManagementView.vue'
import HelpAndFeedbackView from '@/views/Settings/HelpAndFeedbackView.vue'
import AboutUsView from '@/views/Settings/AboutUsView.vue'

// 路由配置
const routes = [
  // 引导页路由
  {
    path: '/welcome',
    name: 'welcome',
    component: WelcomeView,
    meta: {
      title: '欢迎来到阅记星',
      requiresAuth: false,
      layout: 'none',
      transition: 'fade'
    }
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: OnboardingView,
    meta: {
      title: '功能介绍',
      requiresAuth: false,
      layout: 'none',
      transition: 'slide-left'
    }
  },

  // 认证路由
  {
    path: '/auth',
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: 'login',
        name: 'login',
        component: LoginView,
        meta: {
          title: '登录',
          transition: 'fade'
        }
      },
      {
        path: 'register',
        name: 'register',
        component: RegisterView,
        meta: {
          title: '注册',
          transition: 'fade'
        }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: ForgotPasswordView,
        meta: {
          title: '忘记密码',
          transition: 'fade'
        }
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: ResetPasswordView,
        meta: {
          title: '重置密码',
          transition: 'fade'
        }
      }
    ]
  },

  // 主应用路由（使用默认布局）
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          title: '仪表盘',
          icon: 'dashboard',
          transition: 'fade'
        }
      },
      {
        path: 'documents',
        name: 'documents',
        component: DocumentListView,
        meta: {
          title: '文档列表',
          icon: 'documents',
          transition: 'fade'
        }
      },
      {
        path: 'documents/:id',
        name: 'document-detail',
        component: DocumentDetailView,
        meta: {
          title: '文档详情',
          transition: 'fade',
          hideFromMenu: true
        }
      },
      {
        path: 'documents/:id/edit',
        name: 'document-edit',
        component: DocumentEditView,
        meta: {
          title: '编辑文档',
          transition: 'fade',
          hideFromMenu: true
        }
      },
      {
        path: 'upload',
        name: 'upload',
        component: DocumentUploadView,
        meta: {
          title: '上传文档',
          icon: 'upload',
          transition: 'fade'
        }
      },
      {
        path: 'vocabulary',
        name: 'vocabulary',
        component: VocabularyView,
        meta: {
          title: '生词本',
          icon: 'vocabulary',
          transition: 'fade'
        }
      },
      {
        path: 'vocabulary/:id',
        name: 'vocabulary-detail',
        component: VocabularyDetailView,
        meta: {
          title: '词汇详情',
          transition: 'fade',
          hideFromMenu: true
        }
      },
      {
        path: 'review',
        name: 'review',
        component: ReviewView,
        meta: {
          title: '复习',
          icon: 'review',
          transition: 'fade'
        }
      },
      {
        path: 'profile',
        name: 'profile',
        component: UserProfileView,
        meta: {
          title: '个人资料',
          icon: 'profile',
          transition: 'fade'
        }
      },
      {
        path: 'achievements',
        name: 'achievements',
        component: AchievementsView,
        meta: {
          title: '成就',
          icon: 'achievements',
          transition: 'fade'
        }
      },
      {
        path: 'stats',
        name: 'stats',
        component: LearningStatsView,
        meta: {
          title: '学习统计',
          icon: 'stats',
          transition: 'fade'
        }
      },
      {
        path: 'settings',
        name: 'settings',
        component: UserSettingsView,
        meta: {
          title: '设置',
          icon: 'settings',
          transition: 'fade'
        }
      }
    ]
  },

  // 阅读器路由（使用阅读器布局）
  {
    path: '/reader',
    component: ReaderLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: ':id',
        name: 'reader',
        component: ReaderView,
        meta: {
          title: '阅读器',
          transition: 'fade',
          hideFromMenu: true
        }
      }
    ]
  },

  // 设置相关路由
  {
    path: '/settings',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'search',
        name: 'global-search',
        component: GlobalSearchView,
        meta: {
          title: '全局搜索',
          icon: 'search',
          transition: 'fade'
        }
      },
      {
        path: 'offline',
        name: 'offline-management',
        component: OfflineManagementView,
        meta: {
          title: '离线管理',
          icon: 'offline',
          transition: 'fade'
        }
      },
      {
        path: 'help',
        name: 'help-feedback',
        component: HelpAndFeedbackView,
        meta: {
          title: '帮助与反馈',
          icon: 'help',
          transition: 'fade'
        }
      },
      {
        path: 'about',
        name: 'about-us',
        component: AboutUsView,
        meta: {
          title: '关于我们',
          icon: 'about',
          transition: 'fade'
        }
      }
    ]
  },

  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/dashboard',
    meta: {
      title: '页面未找到',
      requiresAuth: true
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置，则滚动到该位置
    if (savedPosition) {
      return savedPosition
    }
    
    // 如果路由有hash，则滚动到hash元素
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    
    // 否则滚动到顶部
    return { top: 0, behavior: 'smooth' }
  }
})

// 设置路由守卫
setupGuards(router)

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 阅记星`
  } else {
    document.title = '阅记星 - 智能英语学习伴侣'
  }
  
  // 添加页面加载类
  document.body.classList.add('page-loading')
  
  next()
})

// 全局后置守卫
router.afterEach((to, from) => {
  // 移除页面加载类
  document.body.classList.remove('page-loading')
  
  // 滚动到顶部（除了阅读器页面）
  if (to.name !== 'reader') {
    window.scrollTo(0, 0)
  }
  
  // 发送页面浏览事件（用于分析）
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: to.meta.title || '未知页面',
      page_path: to.path,
      page_location: window.location.href
    })
  }
})

// 导出路由实例
export default router