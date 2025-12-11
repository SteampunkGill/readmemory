<template>
  <div class="login-view">
    <!-- 背景装饰元素 -->
    <div class="decoration-cloud cloud-1">☁️</div>
    <div class="decoration-cloud cloud-2">☁️</div>
    <div class="decoration-star star-1">⭐</div>
    <div class="decoration-star star-2">⭐</div>
    <div class="decoration-star star-3">⭐</div>
    
    <!-- 返回按钮（仅在需要时显示） -->
    <button 
      v-if="showBackButton" 
      @click="goBack" 
      class="back-button"
      aria-label="返回上一页"
    >
      <span class="back-icon">←</span>
      返回
    </button>
    
    <!-- 主登录容器 -->
    <div class="login-container">
      <!-- Logo和标题区域 -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <div class="logo-circle">
            <span class="logo-icon">📚</span>
          </div>
        </div>
        <h1 class="app-title">阅记星</h1>
        <p class="app-subtitle">智能英语学习伴侣</p>
      </div>
      
      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 邮箱输入 -->
        <div class="form-group">
          <label for="email" class="form-label">
            <span class="label-icon">📧</span>
            邮箱地址
          </label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="请输入您的邮箱"
              :class="['form-input', { 'has-error': errors.email }]"
              @input="clearError('email')"
              @focus="clearError('email')"
              required
            />
            <div class="input-decoration"></div>
          </div>
          <div v-if="errors.email" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.email }}
          </div>
        </div>
        
        <!-- 密码输入 -->
        <div class="form-group">
          <div class="password-header">
            <label for="password" class="form-label">
              <span class="label-icon">🔒</span>
              密码
            </label>
            <router-link to="/auth/forgot-password" class="forgot-password">
              忘记密码？
            </router-link>
          </div>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入您的密码"
              :class="['form-input', { 'has-error': errors.password }]"
              @input="clearError('password')"
              @focus="clearError('password')"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="password-toggle"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            >
              <span class="toggle-icon">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </button>
            <div class="input-decoration"></div>
          </div>
          <div v-if="errors.password" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.password }}
          </div>
        </div>
        
        <!-- 记住我选项 -->
        <div class="remember-me">
          <label class="checkbox-label">
            <input
              v-model="form.rememberMe"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">记住我</span>
          </label>
        </div>
        
        <!-- 登录按钮 -->
        <button
          type="submit"
          :disabled="loading"
          :class="['login-button', { 'is-loading': loading }]"
        >
          <span v-if="!loading" class="button-content">
            <span class="button-icon">🚀</span>
            登录
          </span>
          <span v-else class="loading-spinner"></span>
        </button>
        
        <!-- 分隔线 -->
        <div class="divider">
          <span class="divider-text">或者使用以下方式登录</span>
        </div>
        
        <!-- 第三方登录 -->
        <div class="social-login">
          <button
            type="button"
            @click="loginWithGoogle"
            class="social-button google-button"
            :disabled="loading"
          >
            <span class="social-icon">G</span>
            <span class="social-text">Google</span>
          </button>
          
          <button
            type="button"
            @click="loginWithWeChat"
            class="social-button wechat-button"
            :disabled="loading"
          >
            <span class="social-icon">W</span>
            <span class="social-text">微信</span>
          </button>
          
          <button
            type="button"
            @click="loginWithGitHub"
            class="social-button github-button"
            :disabled="loading"
          >
            <span class="social-icon">G</span>
            <span class="social-text">GitHub</span>
          </button>
        </div>
        
        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号？
          <router-link to="/auth/register" class="link-text">
            立即注册
          </router-link>
        </div>
      </form>
    </div>
    
    <!-- 成功提示 -->
    <div v-if="showSuccessToast" class="success-toast">
      <div class="toast-content">
        <span class="toast-icon">🎉</span>
        <span class="toast-text">登录成功！正在跳转...</span>
      </div>
    </div>
    
    <!-- 页脚 -->
    <footer class="login-footer">
      <p class="footer-text">© 2023 阅记星 - 让英语学习变得有趣</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { showError, showSuccess } from '@/utils/notify'
import { validateEmail, validatePassword } from '@/utils/validators'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const showPassword = ref(false)
const showSuccessToast = ref(false)
const showBackButton = ref(false)

// 表单验证
const validateForm = () => {
  let isValid = true
  
  // 清空之前的错误
  errors.email = ''
  errors.password = ''
  
  // 验证邮箱
  if (!form.email.trim()) {
    errors.email = '邮箱地址不能为空'
    isValid = false
  } else if (!validateEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }
  
  // 验证密码
  if (!form.password) {
    errors.password = '密码不能为空'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码长度至少6位'
    isValid = false
  }
  
  return isValid
}

// 清除错误信息
const clearError = (field) => {
  if (errors[field]) {
    errors[field] = ''
  }
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    // 调用认证服务
    const credentials = {
      email: form.email.trim(),
      password: form.password
    }
    
    // 使用authStore的login方法
    await authStore.login(credentials, form.rememberMe)
    
    // 显示成功提示
    showSuccessToast.value = true
    
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      // 检查是否有重定向路径
      const redirectPath = route.query.redirect || '/dashboard'
      router.push(redirectPath)
    }, 1500)
    
  } catch (error) {
    // 处理登录错误
    let errorMessage = '登录失败，请检查邮箱和密码'
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = '邮箱或密码错误'
          break
        case 403:
          errorMessage = '账户已被禁用'
          break
        case 404:
          errorMessage = '用户不存在'
          break
        case 429:
          errorMessage = '尝试次数过多，请稍后再试'
          break
        default:
          errorMessage = `登录失败 (${error.response.status})`
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showError(errorMessage)
    
    // 根据错误类型设置具体字段错误
    if (errorMessage.includes('邮箱')) {
      errors.email = errorMessage
    } else if (errorMessage.includes('密码')) {
      errors.password = errorMessage
    }
    
  } finally {
    loading.value = false
  }
}

// 第三方登录方法
const loginWithGoogle = async () => {
  try {
    loading.value = true
    // 这里应该调用第三方登录API
    // await authService.loginWithGoogle()
    showSuccess('正在跳转到Google登录...')
    // 实际开发中这里会重定向到OAuth授权页面
  } catch (error) {
    showError('Google登录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loginWithWeChat = async () => {
  try {
    loading.value = true
    // await authService.loginWithWeChat()
    showSuccess('正在跳转到微信登录...')
  } catch (error) {
    showError('微信登录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loginWithGitHub = async () => {
  try {
    loading.value = true
    // await authService.loginWithGitHub()
    showSuccess('正在跳转到GitHub登录...')
  } catch (error) {
    showError('GitHub登录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 检查是否需要显示返回按钮
const checkBackButton = () => {
  // 如果有referrer或者从其他页面跳转过来，显示返回按钮
  if (document.referrer && document.referrer.includes(window.location.hostname)) {
    showBackButton.value = true
  }
}

// 检查是否已登录
const checkAuthStatus = () => {
  if (authStore.isLoggedIn) {
    // 如果已登录，直接跳转到仪表板
    router.push('/dashboard')
  }
}

// 填充测试数据（开发环境）
const fillTestData = () => {
  if (process.env.NODE_ENV === 'development') {
    form.email = 'test@example.com'
    form.password = 'password123'
  }
}

// 生命周期钩子
onMounted(() => {
  checkAuthStatus()
  checkBackButton()
  fillTestData()
})
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  font-family: 'Comfortaa', 'Quicksand', sans-serif;
}

/* 装饰元素 */
.decoration-cloud,
.decoration-star {
  position: absolute;
  font-size: 2rem;
  opacity: 0.7;
  animation: float 6s ease-in-out infinite;
  z-index: 0;
}

.cloud-1 {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.cloud-2 {
  top: 20%;
  right: 10%;
  animation-delay: 2s;
}

.star-1 {
  top: 15%;
  right: 20%;
  animation-delay: 1s;
}

.star-2 {
  bottom: 25%;
  left: 15%;
  animation-delay: 3s;
}

.star-3 {
  bottom: 15%;
  right: 25%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  font-size: 1rem;
  color: #5d6afb;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(93, 106, 251, 0.2);
  z-index: 10;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(93, 106, 251, 0.3);
}

.back-icon {
  font-size: 1.2rem;
}

/* 登录容器 */
.login-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: inline-block;
  margin-bottom: 20px;
}

.logo-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 10px 25px rgba(93, 106, 251, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.logo-icon {
  font-size: 3rem;
}

.app-title {
  font-family: 'Caveat', 'Kalam', cursive;
  font-size: 3rem;
  color: #5d6afb;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #5d6afb 0%, #ff7eb3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 1.1rem;
  color: #888;
  margin: 0;
  font-weight: 300;
}

/* 表单样式 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 1rem;
  color: #555;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-icon {
  font-size: 1.2rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 18px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  font-size: 1rem;
  font-family: 'Comfortaa', sans-serif;
  transition: all 0.3s ease;
  background: #f9f9f9;
  color: #333;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #5d6afb;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(93, 106, 251, 0.1);
}

.form-input.has-error {
  border-color: #ff6b6b;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.input-decoration {
  position: absolute;
  bottom: -2px;
  left: 10%;
  width: 80%;
  height: 3px;
  background: linear-gradient(90deg, #5d6afb, #8a94ff);
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.form-input:focus ~ .input-decoration {
  opacity: 1;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  color: #888;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #5d6afb;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.error-icon {
  font-size: 1rem;
}

/* 记住我 */
.remember-me {
  margin-top: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #666;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 22px;
  height: 22px;
  border: 2px solid #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #5d6afb;
  border-color: #5d6afb;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
}

.checkbox-text {
  user-select: none;
}

/* 登录按钮 */
.login-button {
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 18px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 20px rgba(93, 106, 251, 0.3);
  font-family: 'Comfortaa', sans-serif;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(93, 106, 251, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-button.is-loading {
  background: linear-gradient(135deg, #8a94ff 0%, #5d6afb 100%);
}

.button-icon {
  font-size: 1.2rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  margin: 15px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ddd, transparent);
}

.divider-text {
  padding: 0 15px;
  color: #aaa;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 第三方登录 */
.social-login {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.social-button {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Comfortaa', sans-serif;
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-button {
  background: #fff;
  color: #555;
  border: 2px solid #ddd;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.google-button:hover:not(:disabled) {
  background: #f8f8f8;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.wechat-button {
  background: #07c160;
  color: white;
  border: 2px solid #07c160;
  box-shadow: 0 4px 10px rgba(7, 193, 96, 0.2);
}

.wechat-button:hover:not(:disabled) {
  background: #06ad56;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(7, 193, 96, 0.3);
}

.github-button {
  background: #333;
  color: white;
  border: 2px solid #333;
  box-shadow: 0 4px 10px rgba(51, 51, 51, 0.2);
}

.github-button:hover:not(:disabled) {
  background: #444;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(51, 51, 51, 0.3);
}

.social-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

/* 注册链接 */
.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 0.95rem;
}

.link-text {
  color: #5d6afb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.link-text:hover {
  color: #8a94ff;
  text-decoration: underline;
}

/* 忘记密码链接 */
.forgot-password {
  color: #888;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #5d6afb;
  text-decoration: underline;
}

/* 成功提示 */
.success-toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
  color: white;
  padding: 15px 25px;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(76, 217, 100, 0.3);
  animation: slideDown 0.5s ease-out, fadeOut 0.5s ease-out 2.5s forwards;
  z-index: 1000;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -30px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-icon {
  font-size: 1.3rem;
}

.toast-text {
  font-weight: 600;
}

/* 页脚 */
.login-footer {
  margin-top: 40px;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  position: relative;
  z-index: 1;
}

.footer-text {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 30px 25px;
    border-radius: 30px;
  }
  
  .logo-circle {
    width: 80px;
    height: 80px;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .app-title {
    font-size: 2.5rem;
  }
  
  .social-login {
    flex-direction: column;
  }
  
  .social-button {
    padding: 14px;
  }
  
  .decoration-cloud,
  .decoration-star {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-view {
    padding: 15px;
  }
  
  .login-container {
    padding: 25px 20px;
    border-radius: 25px;
  }
  
  .app-title {
    font-size: 2.2rem;
  }
  
  .form-input {
    padding: 16px 18px;
  }
  
  .back-button {
    top: 15px;
    left: 15px;
    padding: 8px 15px;
    font-size: 0.9rem;
  }
}
</style>