<template>
  <div class="forgot-password-page">
    <div class="container">
      <!-- 品牌 -->
      <div class="brand">
        <img src="@/assets/logo.png" alt="Logo" class="logo">
        <h1>重置密码</h1>
        <p v-if="!showVerification && !showResetForm">输入你的邮箱，我们将发送验证码</p>
        <p v-if="showVerification">请输入验证码验证邮箱</p>
        <p v-if="showResetForm">设置新密码</p>
      </div>

      <!-- 邮箱输入表单 -->
      <form @submit.prevent="handleSubmit" class="form" v-if="!showVerification && !showResetForm">
        <div class="input-group">
          <label for="email">邮箱地址</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="your@email.com"
            required
            :class="{ error: error }"
          />
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>

        <button type="submit" class="btn-primary btn-block" :disabled="loading">
          <span v-if="loading">发送中...</span>
          <span v-else>发送验证码</span>
        </button>

        <!-- 返回登录 -->
        <div class="back-link">
          <router-link to="/login">← 返回登录</router-link>
        </div>
      </form>

      <!-- 验证码输入 -->
      <div class="verification-form" v-if="showVerification && !showResetForm">
        <div class="success-icon">📧</div>
        <h2>验证邮箱</h2>
        <p>我们已向 <strong>{{ email }}</strong> 发送了验证码。</p>
        <p>请输入您收到的验证码：</p>
        
        <div class="input-group">
          <label for="verification-code">验证码</label>
          <input
            id="verification-code"
            type="text"
            v-model="verificationCode"
            placeholder="请输入验证码"
            maxlength="6"
            required
            :class="{ error: verificationError }"
          />
          <p v-if="verificationError" class="error-message">{{ verificationError }}</p>
        </div>
        
        <div class="actions">
          <button class="btn-primary" @click="verifyCode" :disabled="verifying">
            <span v-if="verifying">验证中...</span>
            <span v-else>验证</span>
          </button>
          <button class="btn-outline" @click="resendCode" :disabled="resendCooldown > 0">
            <span v-if="resendCooldown > 0">{{ resendCooldown }}秒后重发</span>
            <span v-else>重新发送</span>
          </button>
          <button class="btn-text" @click="resetForm">返回修改邮箱</button>
        </div>
        
        <p class="tip">没有收到验证码？请检查邮箱地址是否正确，或稍后重试。</p>
      </div>

      <!-- 重置密码表单 -->
      <form @submit.prevent="handleResetPassword" class="form" v-if="showResetForm">
        <div class="success-icon">✅</div>
        <h2>设置新密码</h2>
        <p>邮箱验证已通过，请设置您的新密码。</p>
        
        <div class="input-group">
          <label for="new-password">新密码</label>
          <input
            id="new-password"
            type="password"
            v-model="newPassword"
            placeholder="请输入新密码"
            required
            :class="{ error: resetError }"
          />
          <p class="input-hint">密码长度至少6位</p>
        </div>
        
        <div class="input-group">
          <label for="confirm-password">确认密码</label>
          <input
            id="confirm-password"
            type="password"
            v-model="confirmPassword"
            placeholder="请再次输入新密码"
            required
            :class="{ error: resetError }"
          />
        </div>
        
        <p v-if="resetError" class="error-message">{{ resetError }}</p>
        <p v-if="resetSuccess" class="success-message">{{ resetSuccess }}</p>
        
        <div class="actions">
          <button type="submit" class="btn-primary" :disabled="resetting">
            <span v-if="resetting">重置中...</span>
            <span v-else>重置密码</span>
          </button>
          <button type="button" class="btn-outline" @click="goToLogin">返回登录</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const resetToken = ref('') // 存储验证成功后后端返回的token

// 状态控制
const error = ref('')
const verificationError = ref('')
const resetError = ref('')
const resetSuccess = ref('')
const loading = ref(false)
const verifying = ref(false)
const resetting = ref(false)
const showVerification = ref(false)
const showResetForm = ref(false)
const resendCooldown = ref(0)
let resendTimer = null

// 清理定时器
onUnmounted(() => {
  if (resendTimer) {
    clearInterval(resendTimer)
  }
})

// 发送验证码请求
const handleSubmit = async () => {
  if (!email.value) {
    error.value = '请输入邮箱地址'
    return
  }
  if (!/\S+@\S+\.\S+/.test(email.value)) {
    error.value = '邮箱格式不正确'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      showVerification.value = true
      // 开始重发倒计时
      startResendCooldown()
    } else {
      error.value = data.message || '发送失败，请重试'
    }
    
  } catch (err) {
    console.error('请求失败:', err)
    error.value = '网络请求失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

// 验证验证码
const verifyCode = async () => {
  if (!verificationCode.value) {
    verificationError.value = '请输入验证码'
    return
  }

  verifying.value = true
  verificationError.value = ''

  try {
    // 这里应该调用验证码验证接口
    // 假设验证成功后后端会返回一个重置token
    const response = await fetch('http://localhost:8080/api/v1/auth/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        code: verificationCode.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      // 保存重置token（根据您的后端实际返回字段调整）
      resetToken.value = data.token || verificationCode.value
      showVerification.value = false
      showResetForm.value = true
    } else {
      verificationError.value = data.message || '验证码错误，请重试'
    }
    
  } catch (err) {
    console.error('验证失败:', err)
    verificationError.value = '网络请求失败，请重试'
  } finally {
    verifying.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  // 验证密码
  if (!newPassword.value || !confirmPassword.value) {
    resetError.value = '请输入新密码和确认密码'
    return
  }
  
  if (newPassword.value.length < 6) {
    resetError.value = '密码长度不能少于6位'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    resetError.value = '两次输入的密码不一致'
    return
  }
  
  resetting.value = true
  resetError.value = ''
  resetSuccess.value = ''

  try {
    const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken.value,
        email: email.value,
        password: newPassword.value,
        password_confirmation: confirmPassword.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      resetSuccess.value = data.message || '密码重置成功！'
      // 3秒后跳转到登录页
      setTimeout(() => {
        goToLogin()
      }, 3000)
    } else {
      resetError.value = data.message || '密码重置失败，请重试'
    }
    
  } catch (err) {
    console.error('重置密码失败:', err)
    resetError.value = '网络请求失败，请检查网络连接'
  } finally {
    resetting.value = false
  }
}

// 重新发送验证码
const resendCode = async () => {
  if (resendCooldown.value > 0) return
  
  loading.value = true
  try {
    const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      // 重新开始倒计时
      startResendCooldown()
      verificationError.value = '验证码已重新发送'
    } else {
      verificationError.value = data.message || '发送失败，请重试'
    }
    
  } catch (err) {
    console.error('重发验证码失败:', err)
    verificationError.value = '网络请求失败，请重试'
  } finally {
    loading.value = false
  }
}

// 开始重发倒计时
const startResendCooldown = () => {
  resendCooldown.value = 60
  resendTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(resendTimer)
    }
  }, 1000)
}

// 返回修改邮箱
const resetForm = () => {
  showVerification.value = false
  showResetForm.value = false
  verificationCode.value = ''
  verificationError.value = ''
  resetToken.value = ''
}

const goToLogin = () => {
  router.push('/login')
}
</script>
<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  background-color: var(--background-color, #fcf8e8);
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(255, 214, 0, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 20%);
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
}

.container {
  width: 100%;
  max-width: 500px;
  background-color: var(--surface-color, #ffffff);
  border-radius: var(--border-radius-xl, 35px);
  padding: var(--spacing-xl, 48px) var(--spacing-lg, 32px);
  box-shadow: 
    0 15px 35px rgba(135, 206, 235, 0.15),
    0 5px 15px rgba(255, 182, 193, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 4px dashed var(--accent-yellow, #FFD700);
  position: relative;
  overflow: hidden;
}

.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(90deg, 
    var(--accent-yellow, #FFD700),
    var(--accent-pink, #FFB6C1),
    var(--primary-color, #87CEEB),
    var(--accent-green, #90EE90));
  border-radius: var(--border-radius-xl, 35px) var(--border-radius-xl, 35px) 0 0;
}

.container::after {
  content: '✨';
  position: absolute;
  top: -15px;
  right: 30px;
  font-size: 2rem;
  animation: twinkle 2s ease-in-out infinite;
}

.brand {
  text-align: center;
  margin-bottom: var(--spacing-lg, 32px);
}

.logo {
  width: 100px;
  height: 100px;
  margin-bottom: var(--spacing-md, 24px);
  filter: 
    drop-shadow(0 4px 8px rgba(135, 206, 235, 0.3))
    drop-shadow(0 2px 4px rgba(255, 182, 193, 0.2));
  animation: bounce 2s ease-in-out infinite;
}

.brand h1 {
  font-size: 2.8rem;
  color: var(--primary-color, #87CEEB);
  margin-bottom: var(--spacing-sm, 16px);
  font-family: 'Kalam', 'Caveat', cursive;
  font-weight: 700;
  text-shadow: 
    2px 2px 0 var(--primary-light, #ADD8E6),
    4px 4px 0 rgba(0, 0, 0, 0.05);
  letter-spacing: -0.5px;
}

.brand p {
  color: var(--text-color-medium, #666666);
  font-size: 1.2rem;
  line-height: 1.8;
  font-weight: 500;
}

.form, .verification-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 24px);
}

.input-group label {
  display: block;
  margin-bottom: var(--spacing-xs, 8px);
  font-weight: 700;
  color: var(--primary-dark, #6495ED);
  font-size: 1.1rem;
  font-family: 'Kalam', cursive;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8);
}

.input-group input {
  width: 100%;
  padding: 18px 22px;
  border: 3px solid var(--primary-light, #ADD8E6);
  border-radius: var(--border-radius-lg, 22px);
  font-size: 1.1rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-color-dark, #333333);
  font-family: 'Quicksand', sans-serif;
  font-weight: 500;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.05),
    0 4px 8px rgba(135, 206, 235, 0.1);
}

.input-group input::placeholder {
  color: var(--text-color-light, #999999);
  font-style: italic;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color, #87CEEB);
  background: white;
  box-shadow: 
    0 0 0 6px rgba(135, 206, 235, 0.3),
    0 8px 16px rgba(135, 206, 235, 0.2);
  transform: translateY(-3px) scale(1.02);
}

.input-group input.error {
  border-color: #ff6b6b;
  background: #fff5f5;
  animation: shake 0.5s ease-in-out;
}

.input-hint {
  font-size: 0.95rem;
  color: var(--accent-green, #90EE90);
  margin-top: var(--spacing-xs, 8px);
  font-weight: 600;
  padding-left: 12px;
  position: relative;
}

.input-hint::before {
  content: '💡';
  position: absolute;
  left: -5px;
}

.error-message {
  color: #ff6b6b;
  font-size: 1rem;
  margin-top: var(--spacing-xs, 8px);
  font-weight: 600;
  padding: 8px 12px;
  background: #fff5f5;
  border-radius: var(--border-radius-md, 14px);
  border-left: 4px solid #ff6b6b;
  animation: slideIn 0.3s ease-out;
}

.success-message {
  color: var(--accent-green, #90EE90);
  font-size: 1rem;
  margin-top: var(--spacing-xs, 8px);
  font-weight: 600;
  padding: 12px 16px;
  background: #f0fff4;
  border-radius: var(--border-radius-lg, 22px);
  border: 2px dashed var(--accent-green, #90EE90);
  text-align: center;
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-primary {
  background: linear-gradient(135deg, 
    var(--primary-color, #87CEEB) 0%,
    var(--primary-light, #ADD8E6) 100%);
  color: white;
  border: none;
  padding: 18px 32px;
  border-radius: var(--border-radius-xl, 28px);
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  font-family: 'Kalam', cursive;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 
    0 8px 20px rgba(135, 206, 235, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 
    0 15px 30px rgba(135, 206, 235, 0.5),
    0 5px 15px rgba(255, 182, 193, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  background: linear-gradient(135deg, 
    var(--primary-dark, #6495ED) 0%,
    var(--primary-color, #87CEEB) 100%);
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

.btn-outline {
  background-color: transparent;
  color: var(--accent-pink, #FFB6C1);
  border: 3px solid var(--accent-pink, #FFB6C1);
  padding: 16px 28px;
  border-radius: var(--border-radius-lg, 22px);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Quicksand', sans-serif;
  position: relative;
  overflow: hidden;
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--accent-pink, #FFB6C1);
  color: white;
  transform: translateY(-3px) scale(1.03);
  box-shadow: 
    0 10px 25px rgba(255, 182, 193, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-color-medium, #666666);
  font-size: 1rem;
  cursor: pointer;
  padding: 10px 16px;
  transition: all 0.3s ease;
  border-radius: var(--border-radius-md, 14px);
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  position: relative;
}

.btn-text:hover {
  color: var(--primary-color, #87CEEB);
  background: rgba(135, 206, 235, 0.1);
  text-decoration: none;
  transform: translateX(5px);
}

.btn-text::after {
  content: '👈';
  position: absolute;
  right: -25px;
  opacity: 0;
  transition: all 0.3s ease;
}

.btn-text:hover::after {
  opacity: 1;
  right: -30px;
}

.btn-block {
  width: 100%;
  padding: 20px;
  font-size: 1.3rem;
}

.back-link {
  text-align: center;
  margin-top: var(--spacing-lg, 32px);
  padding-top: var(--spacing-md, 24px);
  border-top: 3px dotted var(--border-color, #e0e0e0);
}

.back-link a {
  color: var(--primary-color, #87CEEB);
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  font-family: 'Kalam', cursive;
  padding: 8px 16px;
  border-radius: var(--border-radius-md, 14px);
  background: rgba(135, 206, 235, 0.1);
}

.back-link a:hover {
  color: var(--primary-dark, #6495ED);
  background: rgba(135, 206, 235, 0.2);
  transform: translateX(-5px);
  text-decoration: none;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-md, 24px);
  text-align: center;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(255, 214, 0, 0.3));
}

.verification-form h2,
.form h2 {
  text-align: center;
  font-size: 2.5rem;
  color: var(--accent-pink, #FFB6C1);
  margin-bottom: var(--spacing-sm, 16px);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 
    2px 2px 0 rgba(255, 255, 255, 0.8),
    4px 4px 0 rgba(255, 182, 193, 0.2);
}

.verification-form p,
.form p {
  text-align: center;
  color: var(--text-color-medium, #666666);
  margin-bottom: var(--spacing-sm, 16px);
  line-height: 1.8;
  font-size: 1.15rem;
  font-weight: 500;
}

.verification-form strong {
  color: var(--primary-color, #87CEEB);
  font-weight: 700;
  background: linear-gradient(120deg, 
    rgba(135, 206, 235, 0.2) 0%,
    rgba(135, 206, 235, 0.1) 100%);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm, 10px);
}

.actions {
  display: flex;
  gap: var(--spacing-sm, 16px);
  justify-content: center;
  margin: var(--spacing-lg, 32px) 0;
  flex-wrap: wrap;
}

.tip {
  font-size: 1rem;
  color: var(--text-color-light, #999999);
  margin-top: var(--spacing-lg, 32px);
  text-align: center;
  padding: var(--spacing-md, 24px);
  background: rgba(255, 214, 0, 0.1);
  border-radius: var(--border-radius-lg, 22px);
  border: 2px solid var(--accent-yellow, #FFD700);
  font-weight: 600;
  position: relative;
}

.tip::before {
  content: '💭';
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  50% { 
    transform: translateY(-15px) rotate(5deg); 
  }
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(0) scale(1); 
  }
  50% { 
    transform: translateY(-10px) scale(1.05); 
  }
}

@keyframes twinkle {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.6; 
    transform: scale(1.2); 
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes popIn {
  0% { 
    opacity: 0; 
    transform: scale(0.8) rotate(-5deg); 
  }
  70% { 
    opacity: 1; 
    transform: scale(1.1) rotate(2deg); 
  }
  100% { 
    transform: scale(1) rotate(0); 
  }
}

@media (max-width: 768px) {
  .container {
    padding: var(--spacing-lg, 32px) var(--spacing-md, 24px);
    margin: var(--spacing-sm, 16px);
    border-radius: var(--border-radius-lg, 25px);
    border-width: 3px;
  }
  
  .brand h1 {
    font-size: 2.3rem;
  }
  
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-primary,
  .btn-outline {
    width: 100%;
    text-align: center;
  }
  
  .forgot-password-page {
    padding: var(--spacing-sm, 16px);
  }
  
  .success-icon {
    font-size: 4rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: var(--spacing-md, 24px) var(--spacing-sm, 16px);
    border-radius: var(--border-radius-lg, 22px);
  }
  
  .brand h1 {
    font-size: 2rem;
  }
  
  .input-group input {
    padding: 16px 20px;
    font-size: 1rem;
  }
  
  .btn-primary,
  .btn-outline {
    padding: 16px 24px;
    font-size: 1.1rem;
  }
  
  .verification-form h2,
  .form h2 {
    font-size: 2rem;
  }
}
</style>