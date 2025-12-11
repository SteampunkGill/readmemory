<template>
  <div class="forgot-password-view">
    <!-- 背景装饰元素 -->
    <div class="decoration-cloud cloud-1">☁️</div>
    <div class="decoration-cloud cloud-2">☁️</div>
    <div class="decoration-key key-1">🔑</div>
    <div class="decoration-key key-2">🔑</div>
    <div class="decoration-lock lock-1">🔒</div>
    
    <!-- 返回按钮 -->
    <button 
      @click="goBack" 
      class="back-button"
      aria-label="返回登录页面"
    >
      <span class="back-icon">←</span>
      返回登录
    </button>
    
    <!-- 主容器 -->
    <div class="forgot-password-container">
      <!-- Logo和标题区域 -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <div class="logo-circle">
            <span class="logo-icon">🔐</span>
          </div>
        </div>
        <h1 class="app-title">找回密码</h1>
        <p class="app-subtitle">输入您的邮箱，我们将发送重置链接</p>
      </div>
      
      <!-- 步骤指示器 -->
      <div class="steps-indicator">
        <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <div class="step-circle">1</div>
          <span class="step-label">输入邮箱</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <div class="step-circle">2</div>
          <span class="step-label">验证邮箱</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: currentStep === 3 }">
          <div class="step-circle">3</div>
          <span class="step-label">重置密码</span>
        </div>
      </div>
      
      <!-- 步骤1：输入邮箱 -->
      <div v-if="currentStep === 1" class="step-content step-1">
        <form @submit.prevent="handleSendResetEmail" class="forgot-password-form">
          <div class="form-group">
            <label for="email" class="form-label">
              <span class="label-icon">📧</span>
              注册邮箱地址
            </label>
            <div class="input-wrapper">
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="请输入您注册时使用的邮箱"
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
            <div v-else class="hint-message">
              <span class="hint-icon">💡</span>
              请输入您注册时使用的邮箱地址，我们将发送重置链接
            </div>
          </div>
          
          <button
            type="submit"
            :disabled="loading"
            :class="['submit-button', { 'is-loading': loading }]"
          >
            <span v-if="!loading" class="button-content">
              <span class="button-icon">✉️</span>
              发送重置链接
            </span>
            <span v-else class="loading-spinner"></span>
          </button>
        </form>
        
        <div class="alternative-options">
          <p class="alternative-text">或者</p>
          <button @click="contactSupport" class="support-button">
            <span class="support-icon">💬</span>
            联系客服协助
          </button>
        </div>
      </div>
      
      <!-- 步骤2：验证邮箱（成功发送后） -->
      <div v-if="currentStep === 2" class="step-content step-2">
        <div class="success-message">
          <div class="success-icon-wrapper">
            <span class="success-icon">✅</span>
          </div>
          <h2 class="success-title">邮件已发送！</h2>
          <p class="success-description">
            我们已向 <strong>{{ form.email }}</strong> 发送了密码重置邮件。
            请检查您的收件箱（包括垃圾邮件文件夹），并点击邮件中的链接继续。
          </p>
          
          <div class="success-actions">
            <button @click="resendEmail" class="action-button resend-button">
              <span class="action-icon">🔄</span>
              重新发送邮件
            </button>
            <button @click="changeEmail" class="action-button change-email-button">
              <span class="action-icon">📝</span>
              更改邮箱地址
            </button>
          </div>
          
          <div class="countdown-timer">
            <span class="timer-icon">⏱️</span>
            邮件链接将在 <strong>{{ countdown }}</strong> 后失效
          </div>
        </div>
      </div>
      
      <!-- 步骤3：重置密码（通过邮件链接进入） -->
      <div v-if="currentStep === 3" class="step-content step-3">
        <div class="reset-token-info">
          <div class="token-icon-wrapper">
            <span class="token-icon">🔗</span>
          </div>
          <p class="token-description">
            您正在为账户 <strong>{{ form.email }}</strong> 重置密码
          </p>
        </div>
        
        <form @submit.prevent="handleResetPassword" class="reset-password-form">
          <div class="form-group">
            <label for="newPassword" class="form-label">
              <span class="label-icon">🔒</span>
              新密码
            </label>
            <div class="input-wrapper">
              <input
                id="newPassword"
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="请输入新密码（至少6位）"
                :class="['form-input', { 'has-error': errors.newPassword }]"
                @input="clearError('newPassword')"
                @focus="clearError('newPassword')"
                required
              />
              <button
                type="button"
                @click="toggleNewPasswordVisibility"
                class="password-toggle"
                :aria-label="showNewPassword ? '隐藏密码' : '显示密码'"
              >
                <span class="toggle-icon">{{ showNewPassword ? '👁️' : '👁️‍🗨️' }}</span>
              </button>
              <div class="input-decoration"></div>
            </div>
            <div v-if="errors.newPassword" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ errors.newPassword }}
            </div>
            <div v-else class="password-strength">
              <div class="strength-label">密码强度：</div>
              <div class="strength-bar" :class="passwordStrengthClass">
                <div class="strength-fill" :style="{ width: passwordStrength + '%' }"></div>
              </div>
              <div class="strength-text">{{ passwordStrengthText }}</div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">
              <span class="label-icon">🔒</span>
              确认新密码
            </label>
            <div class="input-wrapper">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="请再次输入新密码"
                :class="['form-input', { 'has-error': errors.confirmPassword }]"
                @input="clearError('confirmPassword')"
                @focus="clearError('confirmPassword')"
                required
              />
              <button
                type="button"
                @click="toggleConfirmPasswordVisibility"
                class="password-toggle"
                :aria-label="showConfirmPassword ? '隐藏密码' : '显示密码'"
              >
                <span class="toggle-icon">{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</span>
              </button>
              <div class="input-decoration"></div>
            </div>
            <div v-if="errors.confirmPassword" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ errors.confirmPassword }}
            </div>
            <div v-else-if="form.confirmPassword && !passwordsMatch" class="error-message">
              <span class="error-icon">⚠️</span>
              两次输入的密码不一致
            </div>
          </div>
          
          <div class="password-rules">
            <h4 class="rules-title">密码规则：</h4>
            <ul class="rules-list">
              <li :class="{ satisfied: form.newPassword.length >= 6 }">
                <span class="rule-icon">{{ form.newPassword.length >= 6 ? '✅' : '🔲' }}</span>
                至少6个字符
              </li>
              <li :class="{ satisfied: /[A-Z]/.test(form.newPassword) }">
                <span class="rule-icon">{{ /[A-Z]/.test(form.newPassword) ? '✅' : '🔲' }}</span>
                包含大写字母
              </li>
              <li :class="{ satisfied: /[a-z]/.test(form.newPassword) }">
                <span class="rule-icon">{{ /[a-z]/.test(form.newPassword) ? '✅' : '🔲' }}</span>
                包含小写字母
              </li>
              <li :class="{ satisfied: /\d/.test(form.newPassword) }">
                <span class="rule-icon">{{ /\d/.test(form.newPassword) ? '✅' : '🔲' }}</span>
                包含数字
              </li>
            </ul>
          </div>
          
          <button
            type="submit"
            :disabled="loading || !passwordsMatch || !isPasswordValid"
            :class="['submit-button', { 'is-loading': loading, 'is-disabled': !passwordsMatch || !isPasswordValid }]"
          >
            <span v-if="!loading" class="button-content">
              <span class="button-icon">🔄</span>
              重置密码
            </span>
            <span v-else class="loading-spinner"></span>
          </button>
        </form>
      </div>
      
      <!-- 重置成功提示 -->
      <div v-if="showSuccessToast" class="success-toast">
        <div class="toast-content">
          <span class="toast-icon">🎉</span>
          <div class="toast-text">
            <p class="toast-title">密码重置成功！</p>
            <p class="toast-description">正在跳转到登录页面...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 页脚 -->
    <footer class="forgot-password-footer">
      <p class="footer-text">© 2023 阅记星 - 让英语学习变得有趣</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
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
  newPassword: '',
  confirmPassword: '',
  token: ''
})

const errors = reactive({
  email: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const currentStep = ref(1)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const showSuccessToast = ref(false)
const countdown = ref('15:00')
const countdownInterval = ref(null)

// 计算属性
const passwordsMatch = computed(() => {
  return form.newPassword === form.confirmPassword
})

const passwordStrength = computed(() => {
  if (!form.newPassword) return 0
  
  let strength = 0
  
  // 长度检查
  if (form.newPassword.length >= 6) strength += 20
  if (form.newPassword.length >= 8) strength += 10
  
  // 字符类型检查
  if (/[A-Z]/.test(form.newPassword)) strength += 20
  if (/[a-z]/.test(form.newPassword)) strength += 20
  if (/\d/.test(form.newPassword)) strength += 20
  if (/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) strength += 10
  
  return Math.min(strength, 100)
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value < 40) return 'weak'
  if (passwordStrength.value < 70) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value < 40) return '弱'
  if (passwordStrength.value < 70) return '中等'
  return '强'
})

const isPasswordValid = computed(() => {
  return form.newPassword.length >= 6 && passwordStrength.value >= 40
})

// 表单验证
const validateEmailForm = () => {
  let isValid = true
  
  errors.email = ''
  
  if (!form.email.trim()) {
    errors.email = '邮箱地址不能为空'
    isValid = false
  } else if (!validateEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }
  
  return isValid
}

const validateResetForm = () => {
  let isValid = true
  
  errors.newPassword = ''
  errors.confirmPassword = ''
  
  // 验证新密码
  if (!form.newPassword) {
    errors.newPassword = '新密码不能为空'
    isValid = false
  } else if (form.newPassword.length < 6) {
    errors.newPassword = '密码长度至少6位'
    isValid = false
  }
  
  // 验证确认密码
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认新密码'
    isValid = false
  } else if (!passwordsMatch.value) {
    errors.confirmPassword = '两次输入的密码不一致'
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
const toggleNewPasswordVisibility = () => {
  showNewPassword.value = !showNewPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// 发送重置邮件
const handleSendResetEmail = async () => {
  if (!validateEmailForm()) {
    return
  }
  
  loading.value = true
  
  try {
    // 使用authStore的forgotPassword方法
    await authStore.forgotPassword(form.email)
    
    // 切换到步骤2
    currentStep.value = 2
    
    // 启动倒计时
    startCountdown()
    
    // 显示成功提示
    showSuccess('重置邮件已发送，请查收您的邮箱')
    
  } catch (error) {
    // 处理错误
    let errorMessage = '发送重置邮件失败'
    
    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = '该邮箱地址未注册'
          break
        case 429:
          errorMessage = '请求过于频繁，请稍后再试'
          break
        default:
          errorMessage = `发送失败 (${error.response.status})`
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showError(errorMessage)
    
    // 设置具体字段错误
    if (errorMessage.includes('邮箱')) {
      errors.email = errorMessage
    }
    
  } finally {
    loading.value = false
  }
}

// 重新发送邮件
const resendEmail = async () => {
  loading.value = true
  
  try {
    await authStore.forgotPassword(form.email)
    
    // 重置倒计时
    stopCountdown()
    startCountdown()
    
    showSuccess('重置邮件已重新发送')
    
  } catch (error) {
    showError('重新发送失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 更改邮箱地址
const changeEmail = () => {
  currentStep.value = 1
  stopCountdown()
}

// 重置密码
const handleResetPassword = async () => {
  if (!validateResetForm()) {
    return
  }
  
  loading.value = true
  
  try {
    // 构建重置数据
    const resetData = {
      token: form.token || route.query.token || 'demo-token', // 实际应从URL参数获取
      email: form.email,
      password: form.newPassword,
      password_confirmation: form.confirmPassword
    }
    
    // 使用authStore的resetPassword方法
    await authStore.resetPassword(resetData)
    
    // 显示成功提示
    showSuccessToast.value = true
    
    // 延迟跳转到登录页面
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
    
  } catch (error) {
    // 处理错误
    let errorMessage = '重置密码失败'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = '重置链接无效或已过期'
          break
        case 404:
          errorMessage = '用户不存在'
          break
        default:
          errorMessage = `重置失败 (${error.response.status})`
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showError(errorMessage)
    
  } finally {
    loading.value = false
  }
}

// 倒计时功能
const startCountdown = () => {
  let minutes = 15
  let seconds = 0
  
  countdownInterval.value = setInterval(() => {
    if (seconds === 0) {
      if (minutes === 0) {
        stopCountdown()
        return
      }
      minutes--
      seconds = 59
    } else {
      seconds--
    }
    
    countdown.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
}

// 联系客服
const contactSupport = () => {
  showSuccess('客服功能开发中，请稍后...')
  // 实际开发中这里会打开客服聊天窗口或跳转到客服页面
}

// 返回上一页
const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    router.push('/auth/login')
  }
}

// 检查URL参数
const checkUrlParams = () => {
  // 检查是否有token参数（从邮件链接进入）
  const token = route.query.token
  const email = route.query.email
  
  if (token && email) {
    form.token = token
    form.email = email
    currentStep.value = 3
  }
}

// 填充测试数据（开发环境）
const fillTestData = () => {
  if (process.env.NODE_ENV === 'development') {
    form.email = 'test@example.com'
  }
}

// 生命周期钩子
onMounted(() => {
  checkUrlParams()
  fillTestData()
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
.forgot-password-view {
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
.decoration-key,
.decoration-lock {
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

.key-1 {
  top: 15%;
  right: 20%;
  animation-delay: 1s;
}

.key-2 {
  bottom: 25%;
  left: 15%;
  animation-delay: 3s;
}

.lock-1 {
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

/* 主容器 */
.forgot-password-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
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
  margin-bottom: 30px;
}

.logo-wrapper {
  display: inline-block;
  margin-bottom: 15px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff7eb3 0%, #ff758c 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 10px 25px rgba(255, 126, 179, 0.3);
}

.logo-icon {
  font-size: 2.5rem;
}

.app-title {
  font-family: 'Caveat', 'Kalam', cursive;
  font-size: 2.5rem;
  color: #ff7eb3;
  margin: 0 0 8px 0;
}

.app-subtitle {
  font-size: 1rem;
  color: #888;
  margin: 0;
  font-weight: 300;
}

/* 步骤指示器 */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  margin-bottom: 8px;
}

.step.active .step-circle {
  background: linear-gradient(135deg, #5d6afb 0%, #8a94ff 100%);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 5px 15px rgba(93, 106, 251, 0.3);
}

.step.completed .step-circle {
  background: #4cd964;
  color: white;
}

.step-label {
  font-size: 0.9rem;
  color: #888;
  font-weight: 500;
  transition: color 0.3s ease;
}

.step.active .step-label {
  color: #5d6afb;
  font-weight: 600;
}

.step-line {
  width: 60px;
  height: 3px;
  background: #e0e0e0;
  margin: 0 10px;
  position: relative;
  top: -20px;
}

.step.completed + .step-line {
  background: #4cd964;
}

/* 步骤内容 */
.step-content {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单样式 */
.forgot-password-form,
.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

/* 提示信息 */
.hint-message {
  color: #888;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 5px;
}

.hint-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* 错误信息 */
.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  animation: fadeIn 0.3s ease;
}

.error-icon {
  font-size: 1rem;
}

/* 密码强度指示器 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-label {
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
}

.strength-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.strength-bar.weak .strength-fill {
  background: #ff6b6b;
  width: 33%;
}

.strength-bar.medium .strength-fill {
  background: #ffa500;
  width: 66%;
}

.strength-bar.strong .strength-fill {
  background: #4cd964;
  width: 100%;
}

.strength-text {
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 40px;
}

.strength-bar.weak ~ .strength-text {
  color: #ff6b6b;
}

.strength-bar.medium ~ .strength-text {
  color: #ffa500;
}

.strength-bar.strong ~ .strength-text {
  color: #4cd964;
}

/* 密码规则 */
.password-rules {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
}

.rules-title {
  font-size: 1rem;
  color: #555;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.rules-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #888;
}

.rules-list li.satisfied {
  color: #4cd964;
}

.rule-icon {
  font-size: 1rem;
}

/* 提交按钮 */
.submit-button {
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
  margin-top: 10px;
}

.submit-button:hover:not(:disabled):not(.is-disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(93, 106, 251, 0.4);
}

.submit-button:active:not(:disabled):not(.is-disabled) {
  transform: translateY(-1px);
}

.submit-button:disabled,
.submit-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 4px 10px rgba(93, 106, 251, 0.2) !important;
}

.submit-button.is-loading {
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

/* 替代选项 */
.alternative-options {
  margin-top: 30px;
  text-align: center;
}

.alternative-text {
  color: #888;
  font-size: 0.95rem;
  margin: 0 0 15px 0;
  position: relative;
}

.alternative-text::before,
.alternative-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ddd, transparent);
}

.alternative-text::before {
  left: 0;
}

.alternative-text::after {
  right: 0;
}

.support-button {
  background: #fff;
  color: #5d6afb;
  border: 2px solid #5d6afb;
  border-radius: 20px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(93, 106, 251, 0.1);
}

.support-button:hover {
  background: #5d6afb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(93, 106, 251, 0.2);
}

.support-icon {
  font-size: 1.1rem;
}

/* 成功消息 */
.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon-wrapper {
  margin-bottom: 20px;
}

.success-icon {
  font-size: 4rem;
  display: inline-block;
  animation: bounce 1s ease;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.success-title {
  font-family: 'Caveat', cursive;
  font-size: 2.2rem;
  color: #4cd964;
  margin: 0 0 15px 0;
}

.success-description {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 30px 0;
}

.success-description strong {
  color: #5d6afb;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 25px;
}

.action-button {
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.resend-button {
  background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(76, 217, 100, 0.2);
}

.resend-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 217, 100, 0.3);
}

.change-email-button {
  background: #fff;
  color: #5d6afb;
  border: 2px solid #5d6afb;
  box-shadow: 0 4px 10px rgba(93, 106, 251, 0.1);
}

.change-email-button:hover {
  background: #5d6afb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(93, 106, 251, 0.2);
}

.action-icon {
  font-size: 1.1rem;
}

/* 倒计时计时器 */
.countdown-timer {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 15px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: #666;
}

.timer-icon {
  font-size: 1.2rem;
}

.countdown-timer strong {
  color: #ff7eb3;
  font-size: 1.1rem;
}

/* 重置令牌信息 */
.reset-token-info {
  text-align: center;
  margin-bottom: 30px;
}

.token-icon-wrapper {
  margin-bottom: 15px;
}

.token-icon {
  font-size: 3rem;
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.token-description {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
}

.token-description strong {
  color: #5d6afb;
}

/* 成功提示 */
.success-toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(76, 217, 100, 0.3);
  animation: slideDown 0.5s ease-out, fadeOut 0.5s ease-out 2.5s forwards;
  z-index: 1000;
  max-width: 400px;
  width: 90%;
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
  gap: 15px;
}

.toast-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.toast-text {
  text-align: left;
}

.toast-title {
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 0 5px 0;
}

.toast-description {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

/* 页脚 */
.forgot-password-footer {
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
  .forgot-password-container {
    padding: 30px 25px;
    border-radius: 30px;
  }
  
  .logo-circle {
    width: 70px;
    height: 70px;
  }
  
  .logo-icon {
    font-size: 2rem;
  }
  
  .app-title {
    font-size: 2.2rem;
  }
  
  .step-line {
    width: 40px;
  }
  
  .rules-list {
    grid-template-columns: 1fr;
  }
  
  .success-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
  
  .decoration-cloud,
  .decoration-key,
  .decoration-lock {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .forgot-password-view {
    padding: 15px;
  }
  
  .forgot-password-container {
    padding: 25px 20px;
    border-radius: 25px;
  }
  
  .app-title {
    font-size: 2rem;
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
  
  .step-circle {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .step-label {
    font-size: 0.8rem;
  }
}
</style>