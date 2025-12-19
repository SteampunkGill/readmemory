<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="register-page">
    <div class="container">
      <!-- 品牌 -->
      <div class="brand">
        <img src="@/assets/logo.png" alt="Logo" class="logo">
        <h1>加入阅记星</h1>
        <p>开启你的智能阅读之旅</p>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleRegister" class="form">
        <div class="input-group">
          <label for="username">用户名</label>
          <input
            id="username"
            type="text"
            v-model="form.username"
            placeholder="输入用户名"
            required
            :class="{ error: errors.username }"
          />
          <p v-if="errors.username" class="error-message">{{ errors.username }}</p>
        </div>

        <div class="input-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            type="email"
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
            placeholder="至少6位字符"
            required
            @input="updatePasswordStrength"
            :class="{ error: errors.password }"
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
          <!-- 密码强度指示器 -->
          <div class="password-strength">
            <div class="strength-bar" :style="{ width: strength.width }" :class="strength.class"></div>
            <span class="strength-text">{{ strength.text }}</span>
          </div>
          <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
        </div>

        <div class="input-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="form.confirmPassword"
            placeholder="再次输入密码"
            required
            :class="{ error: errors.confirmPassword }"
          />
          <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? '🙈' : '👁️' }}
          </button>
          <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
        </div>

        <div class="input-group checkbox-group">
          <label class="checkbox">
            <input type="checkbox" v-model="form.agreeTerms" required>
            <span>我已阅读并同意 <a href="#" @click.prevent>服务条款</a> 和 <a href="#" @click.prevent>隐私政策</a></span>
          </label>
          <p v-if="errors.agreeTerms" class="error-message">{{ errors.agreeTerms }}</p>
        </div>

        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          <span v-if="loading">注册中...</span>
          <span v-else>注册</span>
        </button>

        <!-- 已有账号 -->
        <div class="login-link">
          <p>已有账户？ <router-link to="/login">去登录</router-link></p>
        </div>
      </form>
    </div>

    <!-- 模拟注册成功提示 -->
    <div v-if="message.show" class="message" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

// 密码强度
const strength = reactive({
  width: '0%',
  class: 'weak',
  text: '密码强度'
})

// 消息提示
const message = ref({
  show: false,
  text: '',
  type: 'success'
})

// 计算密码强度
const updatePasswordStrength = () => {
  const pass = form.password
  let score = 0
  if (pass.length >= 6) score++
  if (pass.length >= 8) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++

  let width = '0%'
  let cls = 'weak'
  let text = '弱'

  if (score <= 1) {
    width = '25%'
    cls = 'weak'
    text = '弱'
  } else if (score <= 3) {
    width = '50%'
    cls = 'medium'
    text = '中'
  } else if (score <= 4) {
    width = '75%'
    cls = 'good'
    text = '强'
  } else {
    width = '100%'
    cls = 'excellent'
    text = '非常强'
  }

  strength.width = width
  strength.class = cls
  strength.text = text
}

// 表单验证
const validate = () => {
  let valid = true
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.agreeTerms = ''

  if (!form.username) {
    errors.username = '请输入用户名'
    valid = false
  } else if (form.username.length < 3) {
    errors.username = '用户名至少3位'
    valid = false
  }

  if (!form.email) {
    errors.email = '请输入邮箱'
    valid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = '邮箱格式不正确'
    valid = false
  }

  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少6位'
    valid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    valid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次密码不一致'
    valid = false
  }

  if (!form.agreeTerms) {
    errors.agreeTerms = '请同意服务条款和隐私政策'
    valid = false
  }

  return valid
}

// 模拟注册改为真实 API 调用
const handleRegister = async () => {
  if (!validate()) return

  loading.value = true

  try {
    // 准备请求数据
    const registerData = {
      email: form.email,
      password: form.password,
      username: form.username,
      nickname: form.username // 如果没有昵称字段，使用用户名
    }

    // 发送注册请求到后端
    const response = await fetch('http://localhost:8080/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    })

    // 解析响应数据
    const result = await response.json()

    // 根据响应状态处理
    if (response.ok && result.success) {
      // 注册成功
      message.value = {
        show: true,
        text: result.message || '注册成功！正在跳转到登录页...',
        type: 'success'
      }

      // 3秒后跳转到登录页
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)

    } else {
      // 注册失败
      message.value = {
        show: true,
        text: result.message || '注册失败，请稍后重试',
        type: 'error'
      }
    }

  } catch (error) {
    // 网络错误或其他异常
    console.error('注册请求失败:', error)
    message.value = {
      show: true,
      text: '网络连接失败，请检查网络后重试',
      type: 'error'
    }
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
/* 导入字体 */
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Quicksand:wght@400;500;700&display=swap');

/* CSS 变量定义 - 完全遵循童趣风格指南 */
:root {
  /* 色彩方案 */
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色卡片 */
  --primary-color: #87CEEB; /* 天蓝色 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333;
  --text-color-medium: #666666;
  --text-color-light: #999999;
  --border-color: #e0e0e0;
  
  /* 圆角大小 - 超大圆角 */
  --border-radius-sm: 8px;
  --border-radius-md: 16px;
  --border-radius-lg: 24px;
  --border-radius-xl: 40px;
  
  /* 间距 - 宽敞布局 */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  /* 字体 */
  --font-heading: 'Kalam', cursive;
  --font-body: 'Quicksand', sans-serif;
  
  /* 阴影 */
  --shadow-sm: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.2);
  
  /* 错误颜色 */
  --color-error: #ff6b6b;
  --color-warning: #ffa726;
  --color-success: #66bb6a;
  --color-info: #42a5f5;
}

.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, 
    rgba(173, 216, 230, 0.3) 0%, 
    rgba(255, 248, 232, 0.8) 50%, 
    rgba(255, 214, 0, 0.2) 100%);
  font-family: var(--font-body);
  animation: gradient-shift 20s ease infinite alternate;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 背景装饰元素 */
.register-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, 
    rgba(255, 214, 0, 0.1) 0%, 
    rgba(135, 206, 235, 0.1) 50%, 
    transparent 70%);
  animation: rotate 60s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.container {
  width: 100%;
  max-width: 500px;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  border: 6px solid var(--primary-color);
  position: relative;
  z-index: 1;
  animation: container-appear 0.8s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes container-appear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 品牌区域 */
.brand {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 4px dashed var(--accent-yellow);
}

.logo {
  width: 100px;
  height: 100px;
  margin-bottom: var(--spacing-md);
  border-radius: 50%;
  border: 5px solid var(--accent-pink);
  box-shadow: 
    0 0 30px rgba(255, 182, 193, 0.4),
    inset 0 0 20px rgba(255, 255, 255, 0.5);
  animation: logo-bounce 3s ease-in-out infinite;
}

@keyframes logo-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.05); }
}

.brand h1 {
  font-family: var(--font-heading);
  font-size: 36px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.brand p {
  font-size: 18px;
  color: var(--text-color-medium);
  font-weight: 500;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 表单区域 */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.input-group {
  position: relative;
}

.input-group label {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.input-group label::before {
  content: '📝';
  font-size: 14px;
}

.input-group input {
  width: 100%;
  padding: var(--spacing-md);
  padding-right: 60px;
  border: 3px solid var(--primary-light);
  border-radius: var(--border-radius-lg);
  font-family: var(--font-body);
  font-size: 16px;
  background-color: var(--surface-color);
  color: var(--text-color-dark);
  outline: none;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.input-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 6px rgba(135, 206, 235, 0.4);
  transform: scale(1.02);
}

.input-group input.error {
  border-color: var(--color-error);
  background-color: rgba(255, 107, 107, 0.1);
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-message {
  color: var(--color-error);
  font-size: 14px;
  margin-top: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  animation: fade-in 0.3s ease;
}

.error-message::before {
  content: '⚠️';
  font-size: 12px;
}

/* 密码切换按钮 */
.toggle-password {
  position: absolute;
  right: 12px;
  top: 42px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  color: var(--text-color-medium);
}

.toggle-password:hover {
  background-color: rgba(173, 216, 230, 0.2);
  transform: scale(1.1);
  color: var(--primary-dark);
}

/* 密码强度指示器 */
.password-strength {
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.strength-bar {
  flex: 1;
  height: 12px;
  border-radius: var(--border-radius-xl);
  transition: all 0.5s ease;
  background: linear-gradient(90deg, 
    var(--color-error), 
    var(--color-warning), 
    var(--color-success), 
    var(--color-info));
  background-size: 400% 100%;
  animation: strength-gradient 3s ease infinite;
}

@keyframes strength-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.strength-bar.weak {
  background: linear-gradient(90deg, var(--color-error), #ff8a80);
  background-size: 25% 100%;
}

.strength-bar.medium {
  background: linear-gradient(90deg, var(--color-error), var(--color-warning));
  background-size: 50% 100%;
}

.strength-bar.good {
  background: linear-gradient(90deg, var(--color-error), var(--color-warning), var(--color-success));
  background-size: 75% 100%;
}

.strength-bar.excellent {
  background: linear-gradient(90deg, var(--color-error), var(--color-warning), var(--color-success), var(--color-info));
  background-size: 100% 100%;
}

.strength-text {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-color-medium);
  min-width: 80px;
  text-align: right;
}

/* 复选框区域 */
.checkbox-group {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: rgba(144, 238, 144, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-green);
}

.checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-color-dark);
}

.checkbox input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--primary-color);
  transform: scale(1.2);
  transition: all 0.3s ease;
}

.checkbox input:checked {
  accent-color: var(--accent-green);
}

.checkbox a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: bold;
  border-bottom: 2px dotted var(--primary-color);
  transition: all 0.3s ease;
}

.checkbox a:hover {
  color: var(--primary-dark);
  border-bottom-style: solid;
}

/* 按钮样式 */
.btn-block {
  width: 100%;
  padding: var(--spacing-lg);
  font-size: 20px;
  border-radius: var(--border-radius-xl);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
  font-family: var(--font-body);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-green));
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary-dark), #7cd87c);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 登录链接 */
.login-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 3px dashed var(--border-color);
}

.login-link p {
  font-size: 16px;
  color: var(--text-color-medium);
}

.login-link a {
  color: var(--primary-color);
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.login-link a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--accent-yellow);
  transition: width 0.3s ease;
}

.login-link a:hover {
  color: var(--primary-dark);
}

.login-link a:hover::after {
  width: 100%;
}

/* 消息提示 */
.message {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slide-up 0.5s ease-out;
  font-weight: bold;
  font-size: 16px;
  text-align: center;
  min-width: 300px;
  max-width: 90%;
  backdrop-filter: blur(10px);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.message.success {
  background: linear-gradient(135deg, var(--accent-green), #a8e6a8);
  color: var(--text-color-dark);
  border: 4px solid #66bb6a;
}

.message.error {
  background: linear-gradient(135deg, var(--color-error), #ff8a80);
  color: white;
  border: 4px solid #ff5252;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-page {
    padding: var(--spacing-md);
  }
  
  .container {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }
  
  .brand h1 {
    font-size: 28px;
  }
  
  .logo {
    width: 80px;
    height: 80px;
  }
  
  .btn-block {
    padding: var(--spacing-md);
    font-size: 18px;
  }
  
  .message {
    min-width: 250px;
    padding: var(--spacing-sm) var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .brand h1 {
    font-size: 24px;
  }
  
  .brand p {
    font-size: 16px;
  }
  
  .input-group input {
    padding: var(--spacing-sm);
    padding-right: 50px;
  }
  
  .toggle-password {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }
  
  .strength-text {
    min-width: 60px;
    font-size: 12px;
  }
}

/* 添加一些趣味装饰 */
.container::before {
  content: '✨';
  position: absolute;
  top: -20px;
  left: -20px;
  font-size: 32px;
  animation: sparkle 2s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255, 214, 0, 0.8));
  z-index: 2;
}

.container::after {
  content: '⭐';
  position: absolute;
  bottom: -20px;
  right: -20px;
  font-size: 32px;
  animation: sparkle 2s ease-in-out infinite reverse;
  animation-delay: 1s;
  filter: drop-shadow(0 0 8px rgba(255, 182, 193, 0.8));
  z-index: 2;
}

@keyframes sparkle {
  0%, 100% { 
    opacity: 0.5; 
    transform: scale(0.8) rotate(0deg); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1.2) rotate(180deg); 
  }
}
</style>