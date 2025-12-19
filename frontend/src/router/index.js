/**
 * 路由配置文件 (router/index.js)
 * 
 * 负责定义前端页面的访问路径 (URL) 与 Vue 组件之间的对应关系。
 */
import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/utils/auth'

// 使用懒加载方式导入视图组件，只有在访问该页面时才会加载对应的代码，提高首屏加载速度
const Welcome = () => import('@/views/Welcome.vue')
const Onboarding = () => import('@/views/Onboarding.vue')
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const ForgotPassword = () => import('@/views/ForgotPassword.vue')
const Bookshelf = () => import('@/views/Bookshelf.vue')
const Upload = () => import('@/views/Upload.vue')
const Reader = () => import('@/views/Reader.vue')
const DictionaryDetail = () => import('@/views/DictionaryDetail.vue')
const Vocabulary = () => import('@/views/Vocabulary.vue')
const EnglishToChinese = () => import('@/views/vocabulary/EnglishToChinese.vue')
const ChineseToEnglish = () => import('@/views/vocabulary/ChineseToEnglish.vue')
const FillInBlanks = () => import('@/views/vocabulary/FillInBlanks.vue')
const Review = () => import('@/views/Review.vue')
const ReviewReport = () => import('@/views/ReviewReport.vue')
const ReviewStats = () => import('@/views/ReviewStats.vue')
const UserCenter = () => import('@/views/UserCenter.vue')
const Settings = () => import('@/views/Settings.vue')
const SearchResults = () => import('@/views/SearchResults.vue')
const OfflineManagement = () => import('@/views/OfflineManagement.vue') // eslint-disable-line no-unused-vars
const DocumentDetail = () => import('@/views/DocumentDetail.vue')

// 定义路由规则数组
const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/vocabulary' // 访问根路径时自动跳转到生词本页面
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: Onboarding
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/bookshelf',
    name: 'Bookshelf',
    component: Bookshelf,
    meta: { requiresAuth: true } // 标记该页面需要登录后才能访问
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
    meta: { requiresAuth: true }
  },
  {
    path: '/reader/:id', // :id 是动态参数，代表文档的 ID
    name: 'Reader',
    component: Reader,
    meta: { requiresAuth: true }
  },
  {
    path: '/document/:id',
    name: 'DocumentDetail',
    component: DocumentDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/dictionary/:word',
    name: 'DictionaryDetail',
    component: DictionaryDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/vocabulary',
    component: Vocabulary,
    meta: { requiresAuth: true },
    children: [
      // 嵌套路由：生词本下的子页面
      {
        path: '',
        name: 'VocabularyHome',
        component: () => import('@/views/vocabulary/VocabularyHome.vue')
      },
      {
        path: 'en-zh',
        name: 'EnglishToChinese',
        component: EnglishToChinese
      },
      {
        path: 'zh-en',
        name: 'ChineseToEnglish',
        component: ChineseToEnglish
      },
      {
        path: 'fill-blanks',
        name: 'FillInBlanks',
        component: FillInBlanks
      },
      {
        path: 'list',
        name: 'VocabularyList',
        component: () => import('@/views/vocabulary/VocabularyList.vue')
      }
    ]
  },
  {
    path: '/review',
    name: 'Review',
    component: Review,
    meta: { requiresAuth: true }
  },
  {
    path: '/review/report',
    name: 'ReviewReport',
    component: ReviewReport,
    meta: { requiresAuth: true }
  },
  {
    path: '/review/stats',
    name: 'ReviewStats',
    component: ReviewStats,
    meta: { requiresAuth: true }
  },
  {
    path: '/user',
    name: 'UserCenter',
    component: UserCenter,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'SearchResults',
    component: SearchResults,
    meta: { requiresAuth: true }
  },
  // 404 路由：匹配所有未定义的路径，并重定向到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  // 使用 HTML5 的 History 模式，URL 看起来更自然（没有 #）
  history: createWebHistory(process.env.BASE_URL),
  routes
})

/**
 * 路由守卫 (Navigation Guard)
 * 
 * 在每次页面跳转前执行，用于检查用户是否有权限访问目标页面。
 */
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isAuthenticated = auth.isAuthenticated()
  
  console.log(`[路由守卫] 目标路径: ${to.path}, 是否需要登录: ${!!to.meta.requiresAuth}, 是否已登录: ${isAuthenticated}`);

  // 如果目标页面需要登录，但用户未登录，则强制跳转到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.warn(`[路由守卫] 未经授权访问 ${to.path}，正在跳转到登录页`);
    next('/login')
  } else {
    // 否则允许跳转
    next()
  }
})

export default router