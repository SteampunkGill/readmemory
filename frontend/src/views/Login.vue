<template>
  <div class="login-page">
    <div class="container">
      <!-- Logo 和标题 -->
      <div class="brand">
        <img src="@/assets/logo.png" alt="Logo" class="logo">
        <h1>欢迎回来</h1>
        <p>登录你的阅记星账户，继续你的阅读之旅</p>
      </div>

      <!-- 加载状态提示 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>正在登录中...</p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleLogin" class="form">
        <div class="input-group">
          <label for="email">邮箱或用户名</label>
          <input
            id="email"
            type="text"
            v-model="form.email"
            placeholder="your@email.com"
            required
            :class="{ error: errors.email }"
          />
          <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
        </div>

        <div class="input-group">
          <label for="password">密码</label>
          <input
            id="password"
            :type="showPassword ? 'text' : 'password'"
            v-model="form.password"
            placeholder="输入密码"
            required
            :class="{ error: errors.password }"
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
          <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
        </div>

        <div class="options">
          <label class="checkbox">
            <input type="checkbox" v-model="form.remember">
            <span>记住我</span>
          </label>
          <router-link to="/forgot-password" class="link">忘记密码？</router-link>
        </div>

        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          <span v-if="loading">登录中...</span>
          <span v-else>登录</span>
        </button>

        <!-- 注册链接 -->
        <div class="register-link">
          <p>还没有账户？ <router-link to="/register">注册新账号</router-link></p>
        </div>
      </form>
    </div>

    <!-- 登录成功/失败提示 -->
    <div v-if="message.show" class="message" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const form = reactive({
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)

// 消息提示
const message = ref({
  show: false,
  text: '',
  type: 'success' // success, error, info
})

// 表单验证
const validate = () => {
  let valid = true
  errors.email = ''
  errors.password = ''

  if (!form.email) {
    errors.email = '请输入邮箱或用户名'
    valid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email) && form.email.length < 3) {
    errors.email = '请输入有效的邮箱或用户名'
    valid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少6位'
    valid = false
  }

  return valid
}

import { auth } from '@/utils/auth'

// 存储token到本地存储
const storeTokens = (accessToken, refreshToken, expiresIn) => {
  auth.saveToken(accessToken, refreshToken, expiresIn, form.remember)
}


// 真实登录请求
const handleLogin = async () => {
  if (!validate()) return

  loading.value = true
  message.value.show = false

  try {
    // 发送 API 请求到后端
    const response = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password
      })
    })

    const data = await response.json()

    if (data.success) {
      // 请求成功，使用后端返回的真实数据
      const loginData = data.data
      
      message.value = {
        show: true,
        text: data.message || '登录成功！正在跳转...',
        type: 'success'
      }
      
      // 存储 token 到本地存储
      storeTokens(
        loginData.accessToken,
        loginData.refreshToken,
        loginData.expiresIn
      )
      
      // 跳转到书架
      setTimeout(() => {
        router.push('/bookshelf')
      }, 1500)
    } else {
      // 后端返回失败，显示错误信息
      message.value = {
        show: true,
        text: data.message || '登录失败，请检查邮箱和密码',
        type: 'error'
      }
      
      // 如果后端返回特定错误码，可以在这里处理
      if (data.message && data.message.includes('邮箱/用户名或密码错误')) {
        errors.email = '邮箱或密码错误'
        errors.password = '邮箱或密码错误'
      }
    }
  } catch (error) {
    console.error('登录请求失败:', error)
    
    // 网络错误或其他错误，使用模拟数据
    message.value = {
      show: true,
      text: '网络错误，使用模拟数据登录',
      type: 'info'
    }
    
    // 回退到模拟登录
    mockLogin()
  } finally {
    loading.value = false
  }
}

/**
 * 模拟登录逻辑
 */
const mockLogin = () => {
  storeTokens('mock_access_token', 'mock_refresh_token', 3600)
  message.value = {
    show: true,
    text: '模拟登录成功！正在跳转...',
    type: 'success'
  }
  setTimeout(() => {
    router.push('/bookshelf')
  }, 1500)
}

</script>
<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md, 24px);
  background-color: var(--background-color, #fcf8e8);
  background-image: 
    radial-gradient(circle at 15% 15%, rgba(255, 214, 0, 0.15) 0%, transparent 25%),
    radial-gradient(circle at 85% 85%, rgba(135, 206, 235, 0.15) 0%, transparent 25%),
    repeating-linear-gradient(45deg, 
      transparent, 
      transparent 10px, 
      rgba(255, 182, 193, 0.05) 10px, 
      rgba(255, 182, 193, 0.05) 20px);
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '📚 ✨ 🎈';
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 1.8rem;
  opacity: 0.3;
  animation: float 4s ease-in-out infinite;
}

.container {
  width: 100%;
  max-width: 500px;
  background-color: var(--surface-color, #ffffff);
  border-radius: var(--border-radius-xl, 35px);
  padding: var(--spacing-xl, 48px) var(--spacing-lg, 32px);
  box-shadow: 
    0 20px 40px rgba(135, 206, 235, 0.2),
    0 8px 20px rgba(255, 182, 193, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 0 4px var(--accent-yellow, #FFD700);
  border: 6px double var(--primary-color, #87CEEB);
  position: relative;
  z-index: 1;
  animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.container::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(135deg, 
    var(--accent-yellow, #FFD700),
    var(--accent-pink, #FFB6C1),
    var(--primary-color, #87CEEB));
  border-radius: var(--border-radius-xl, 40px);
  z-index: -1;
  opacity: 0.1;
  filter: blur(10px);
}

.brand {
  text-align: center;
  margin-bottom: var(--spacing-lg, 32px);
}

.logo {
  width: 120px;
  height: 120px;
  margin-bottom: var(--spacing-md, 24px);
  filter: 
    drop-shadow(0 6px 12px rgba(135, 206, 235, 0.4))
    drop-shadow(0 3px 6px rgba(255, 182, 193, 0.3));
  animation: bounce 2.5s ease-in-out infinite;
  transform-origin: center;
}

.brand h1 {
  font-size: 3rem;
  color: var(--primary-color, #87CEEB);
  margin-bottom: var(--spacing-sm, 16px);
  font-family: 'Kalam', 'Caveat', cursive;
  font-weight: 700;
  text-shadow: 
    3px 3px 0 var(--primary-light, #ADD8E6),
    6px 6px 0 rgba(0, 0, 0, 0.05);
  letter-spacing: -1px;
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 30%,
    var(--accent-pink, #FFB6C1) 70%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand p {
  color: var(--text-color-medium, #666666);
  font-size: 1.3rem;
  line-height: 1.8;
  font-weight: 600;
  padding: 0 var(--spacing-md, 24px);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-xl, 35px);
  z-index: 10;
  animation: fadeIn 0.3s ease;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid var(--primary-light, #ADD8E6);
  border-top-color: var(--accent-yellow, #FFD700);
  border-right-color: var(--accent-pink, #FFB6C1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md, 24px);
}

.loading-overlay p {
  color: var(--primary-color, #87CEEB);
  font-size: 1.2rem;
  font-weight: 700;
  font-family: 'Kalam', cursive;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 24px);
}

.input-group {
  position: relative;
}

.input-group label {
  display: block;
  margin-bottom: var(--spacing-xs, 8px);
  font-weight: 700;
  color: var(--primary-dark, #6495ED);
  font-size: 1.2rem;
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.8);
  padding-left: 8px;
}

.input-group input {
  width: 100%;
  padding: 20px 24px;
  border: 4px solid var(--primary-light, #ADD8E6);
  border-radius: var(--border-radius-lg, 25px);
  font-size: 1.2rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-color-dark, #333333);
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.05),
    0 6px 12px rgba(135, 206, 235, 0.15);
}

.input-group input::placeholder {
  color: var(--text-color-light, #999999);
  font-style: italic;
  font-weight: 500;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color, #87CEEB);
  background: white;
  box-shadow: 
    0 0 0 8px rgba(135, 206, 235, 0.25),
    0 12px 24px rgba(135, 206, 235, 0.2);
  transform: translateY(-4px) scale(1.02);
}

.input-group input.error {
  border-color: #ff6b6b;
  background: #fff5f5;
  animation: shake 0.5s ease-in-out;
  box-shadow: 
    inset 0 4px 8px rgba(255, 107, 107, 0.1),
    0 6px 12px rgba(255, 107, 107, 0.15);
}

.error-message {
  color: #ff6b6b;
  font-size: 1rem;
  margin-top: var(--spacing-xs, 8px);
  font-weight: 600;
  padding: 10px 16px;
  background: #fff5f5;
  border-radius: var(--border-radius-md, 16px);
  border-left: 5px solid #ff6b6b;
  animation: slideIn 0.3s ease-out;
}

.toggle-password {
  position: absolute;
  right: 16px;
  top: 52px;
  background: var(--primary-light, #ADD8E6);
  border: 3px solid var(--primary-color, #87CEEB);
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 8px rgba(135, 206, 235, 0.3);
}

.toggle-password:hover {
  background: var(--primary-color, #87CEEB);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.4);
}

.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-xs, 8px);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
  color: var(--primary-dark, #6495ED);
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.checkbox:hover {
  transform: translateX(5px);
}

.checkbox input {
  width: 24px;
  height: 24px;
  border: 3px solid var(--primary-color, #87CEEB);
  border-radius: var(--border-radius-sm, 10px);
  cursor: pointer;
  appearance: none;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox input:checked {
  background-color: var(--accent-yellow, #FFD700);
  border-color: var(--accent-yellow, #FFD700);
}

.checkbox input:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.link {
  color: var(--accent-pink, #FFB6C1);
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: var(--border-radius-md, 16px);
  background: rgba(255, 182, 193, 0.1);
  transition: all 0.3s ease;
  font-family: 'Kalam', cursive;
}

.link:hover {
  background: var(--accent-pink, #FFB6C1);
  color: white;
  transform: translateY(-3px);
  text-decoration: none;
  box-shadow: 0 6px 12px rgba(255, 182, 193, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    var(--accent-pink, #FFB6C1) 100%);
  color: white;
  border: none;
  padding: 20px 36px;
  border-radius: var(--border-radius-xl, 30px);
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  box-shadow: 
    0 10px 25px rgba(135, 206, 235, 0.4),
    0 5px 15px rgba(255, 182, 193, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.3), 
    transparent);
  transition: left 0.7s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 
    0 20px 40px rgba(135, 206, 235, 0.5),
    0 10px 25px rgba(255, 182, 193, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.btn-primary:hover:not(:disabled)::before {
  left: 100%;
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.3);
}

.btn-block {
  width: 100%;
  padding: 22px;
  font-size: 1.5rem;
  margin-top: var(--spacing-sm, 16px);
}

.register-link {
  text-align: center;
  margin-top: var(--spacing-lg, 32px);
  padding-top: var(--spacing-md, 24px);
  border-top: 3px dashed var(--primary-light, #ADD8E6);
  color: var(--text-color-medium, #666666);
  font-size: 1.1rem;
  font-weight: 600;
}

.register-link a {
  color: var(--primary-color, #87CEEB);
  font-weight: 700;
  text-decoration: none;
  font-family: 'Kalam', cursive;
  padding: 6px 12px;
  border-radius: var(--border-radius-md, 14px);
  background: rgba(135, 206, 235, 0.1);
  transition: all 0.3s ease;
}

.register-link a:hover {
  background: var(--primary-color, #87CEEB);
  color: white;
  text-decoration: none;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.message {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 20px 32px;
  border-radius: var(--border-radius-xl, 30px);
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.2),
    0 5px 15px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  font-size: 1.2rem;
  text-align: center;
  min-width: 300px;
  max-width: 90%;
  border: 4px solid;
}

.message.success {
  background: linear-gradient(135deg, 
    var(--accent-green, #90EE90) 0%,
    #c8f7c5 100%);
  color: var(--text-color-dark, #333333);
  border-color: #6daa2c;
}

.message.error {
  background: linear-gradient(135deg, 
    #ff6b6b 0%,
    #ffcccc 100%);
  color: var(--text-color-dark, #333333);
  border-color: #cc474a;
}

.message.info {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    #c2e7ff 100%);
  color: var(--text-color-dark, #333333);
  border-color: #0a6ebd;
}

@keyframes popIn {
  0% { 
    opacity: 0; 
    transform: scale(0.8) rotate(-5deg); 
  }
  70% { 
    opacity: 1; 
    transform: scale(1.05) rotate(2deg); 
  }
  100% { 
    transform: scale(1) rotate(0); 
  }
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  25% { 
    transform: translateY(-12px) rotate(-2deg); 
  }
  75% { 
    transform: translateY(-8px) rotate(2deg); 
  }
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  33% { 
    transform: translateY(-10px) rotate(5deg); 
  }
  66% { 
    transform: translateY(5px) rotate(-5deg); 
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(-15px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateX(-50%) translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(-50%) translateY(0); 
  }
}

@media (max-width: 768px) {
  .container {
    padding: var(--spacing-lg, 32px) var(--spacing-md, 24px);
    margin: var(--spacing-sm, 16px);
    border-radius: var(--border-radius-lg, 28px);
    border-width: 4px;
  }
  
  .brand h1 {
    font-size: 2.5rem;
  }
  
  .brand p {
    font-size: 1.1rem;
    padding: 0;
  }
  
  .login-page {
    padding: var(--spacing-sm, 16px);
  }
  
  .logo {
    width: 100px;
    height: 100px;
  }
  
  .message {
    min-width: 280px;
    padding: 16px 24px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: var(--spacing-md, 24px) var(--spacing-sm, 16px);
    border-radius: var(--border-radius-lg, 25px);
  }
  
  .brand h1 {
    font-size: 2.2rem;
  }
  
  .input-group input {
    padding: 18px 22px;
    font-size: 1.1rem;
  }
  
  .btn-primary,
  .btn-block {
    padding: 18px 28px;
    font-size: 1.3rem;
  }
  
  .toggle-password {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    top: 48px;
  }
}
</style>