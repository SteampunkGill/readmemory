<template>
  <div class="register-view">
    <!-- 背景装饰元素 -->
    <div class="decoration-cloud cloud-1">☁️</div>
    <div class="decoration-cloud cloud-2">☁️</div>
    <div class="decoration-star star-1">⭐</div>
    <div class="decoration-star star-2">⭐</div>
    <div class="decoration-heart heart-1">❤️</div>
    
    <!-- 返回按钮 -->
    <button 
      @click="goBack" 
      class="back-button"
      aria-label="返回登录页面"
    >
      <span class="back-icon">←</span>
      返回登录
    </button>
    
    <!-- 主注册容器 -->
    <div class="register-container">
      <!-- Logo和标题区域 -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <div class="logo-circle">
            <span class="logo-icon">🚀</span>
          </div>
        </div>
        <h1 class="app-title">加入阅记星</h1>
        <p class="app-subtitle">开启智能英语学习之旅</p>
      </div>
      
      <!-- 注册表单 -->
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- 用户名输入 -->
        <div class="form-group">
          <label for="username" class="form-label">
            <span class="label-icon">👤</span>
            用户名
          </label>
          <div class="input-wrapper">
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="请输入用户名（2-30个字符）"
              :class="['form-input', { 
                'has-error': errors.username,
                'has-success': usernameValid && form.username.length > 0 
              }]"
              @input="validateUsername"
              @focus="clearError('username')"
              required
              minlength="2"
              maxlength="30"
            />
            <div class="input-decoration"></div>
            <div v-if="usernameValid && form.username.length > 0" class="success-icon">
              ✅
            </div>
          </div>
          <div v-if="errors.username" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.username }}
          </div>
          <div v-else-if="usernameValidating" class="hint-message">
            <span class="hint-icon">⏳</span>
            正在验证用户名...
          </div>
          <div v-else-if="usernameValid && form.username.length > 0" class="success-message">
            <span class="success-icon">✅</span>
            用户名可用
          </div>
          <div v-else class="hint-message">
            <span class="hint-icon">💡</span>
            用户名将用于登录和显示
          </div>
        </div>
        
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
              :class="['form-input', { 
                'has-error': errors.email,
                'has-success': emailValid && form.email.length > 0 
              }]"
              @input="validateEmail"
              @focus="clearError('email')"
              required
            />
            <div class="input-decoration"></div>
            <div v-if="emailValid && form.email.length > 0" class="success-icon">
              ✅
            </div>
          </div>
          <div v-if="errors.email" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.email }}
          </div>
          <div v-else-if="emailValidating" class="hint-message">
            <span class="hint-icon">⏳</span>
            正在验证邮箱...
          </div>
          <div v-else-if="emailValid && form.email.length > 0" class="success-message">
            <span class="success-icon">✅</span>
            邮箱格式正确
          </div>
          <div v-else class="hint-message">
            <span class="hint-icon">💡</span>
            请输入有效的邮箱地址
          </div>
        </div>
        
        <!-- 密码输入 -->
        <div class="form-group">
          <label for="password" class="form-label">
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码（至少6位）"
              :class="['form-input', { 
                'has-error': errors.password,
                'has-success': passwordValid && form.password.length > 0 
              }]"
              @input="validatePassword"
              @focus="clearError('password')"
              required
              minlength="6"
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
            <div v-if="passwordValid && form.password.length > 0" class="success-icon">
              ✅
            </div>
          </div>
          <div v-if="errors.password" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.password }}
          </div>
          <div v-else class="password-strength">
            <div class="strength-label">密码强度：</div>
            <div class="strength-bar" :class="passwordStrengthClass">
              <div class="strength-fill" :style="{ width: passwordStrength + '%' }"></div>
            </div>
            <div class="strength-text">{{ passwordStrengthText }}</div>
          </div>
        </div>
        
        <!-- 确认密码输入 -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">
            <span class="label-icon">🔒</span>
            确认密码
          </label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              :class="['form-input', { 
                'has-error': errors.confirmPassword || (form.confirmPassword && !passwordsMatch),
                'has-success': passwordsMatch && form.confirmPassword.length > 0 
              }]"
              @input="validateConfirmPassword"
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
            <div v-if="passwordsMatch && form.confirmPassword.length > 0" class="success-icon">
              ✅
            </div>
          </div>
          <div v-if="errors.confirmPassword" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.confirmPassword }}
          </div>
          <div v-else-if="form.confirmPassword && !passwordsMatch" class="error-message">
            <span class="error-icon">⚠️</span>
            两次输入的密码不一致
          </div>
          <div v-else-if="passwordsMatch && form.confirmPassword.length > 0" class="success-message">
            <span class="success-icon">✅</span>
            密码匹配
          </div>
        </div>
        
        <!-- 协议同意 -->
        <div class="agreement-section">
          <label class="checkbox-label">
            <input
              v-model="form.agreedToTerms"
              type="checkbox"
              class="checkbox-input"
              required
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">
              我已阅读并同意
              <router-link to="/terms" class="agreement-link">《用户协议》</router-link>
              和
              <router-link to="/privacy" class="agreement-link">《隐私政策》</router-link>
            </span>
          </label>
          <div v-if="errors.agreedToTerms" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ errors.agreedToTerms }}
          </div>
        </div>
        
        <!-- 注册按钮 -->
        <button
          type="submit"
          :disabled="loading || !isFormValid"
          :class="['register-button', { 
            'is-loading': loading, 
            'is-disabled': !isFormValid 
          }]"
        >
          <span v-if="!loading" class="button-content">
            <span class="button-icon">🎉</span>
            立即注册
          </span>
          <span v-else class="loading-spinner"></span>
        </button>
        
        <!-- 分隔线 -->
        <div class="divider">
          <span class="divider-text">或者使用以下方式注册</span>
        </div>
        
        <!-- 第三方注册 -->
        <div class="social-register">
          <button
            type="button"
            @click="registerWithGoogle"
            class="social-button google-button"
            :disabled="loading"
          >
            <span class="social-icon">G</span>
            <span class="social-text">Google</span>
          </button>
          
          <button
            type="button"
            @click="registerWithWeChat"
            class="social-button wechat-button"
            :disabled="loading"
          >
            <span class="social-icon">W</span>
            <span class="social-text">微信</span>
          </button>
          
          <button
            type="button"
            @click="registerWithGitHub"
            class="social-button github-button"
            :disabled="loading"
          >
            <span class="social-icon">G</span>
            <span class="social-text">GitHub</span>
          </button>
        </div>
        
        <!-- 登录链接 -->
        <div class="login-link">
          已有账号？
          <router-link to="/auth/login" class="link-text">
            立即登录
          </router-link>
        </div>
      </form>
    </div>
    
    <!-- 成功提示 -->
    <div v-if="showSuccessToast" class="success-toast">
      <div class="toast-content">
        <span class="toast-icon">🎉</span>
        <div class="toast-text">
          <p class="toast-title">注册成功！</p>
          <p class="toast-description">正在自动登录并跳转...</p>
        </div>
      </div>
    </div>
    
    <!-- 页脚 -->
    <footer class="register-footer">
      <p class="footer-text">© 2023 阅记星 - 让英语学习变得有趣</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import { showError, showSuccess } from '@/utils/notify'
import { validateEmail, validatePassword } from '@/utils/validators'
import { debounce } from '@/utils/debounce'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()

// 响应式数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreedToTerms: false
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreedToTerms: ''
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showSuccessToast = ref(false)
const usernameValid = ref(false)
const emailValid = ref(false)
const passwordValid = ref(false)
const usernameValidating = ref(false)
const emailValidating = ref(false)

// 计算属性
const passwordsMatch = computed(() => {
  return form.password === form.confirmPassword
})

const passwordStrength = computed(() => {
  if (!form.password) return 0
  
  let strength = 0
  
  // 长度检查
  if (form.password.length >= 6) strength += 20
  if (form.password.length >= 8) strength += 10
  
  // 字符类型检查
  if (/[A-Z]/.test(form.password)) strength += 20
  if (/[a-z]/.test(form.password)) strength += 20
  if (/\d/.test(form.password)) strength += 20
  if (/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) strength += 10
  
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

const isFormValid = computed(() => {
  return (
    usernameValid.value &&
    emailValid.value &&
    passwordValid.value &&
    passwordsMatch.value &&
    form.agreedToTerms
  )
})

// 防抖验证函数
const debouncedValidateUsername = debounce(async () => {
  if (!form.username.trim()) {
    errors.username = '用户名不能为空'
    usernameValid.value = false
    return
  }
  
  if (form.username.length < 2 || form.username.length > 30) {
    errors.username = '用户名长度必须在2-30个字符之间'
    usernameValid.value = false
    return
  }
  
  // 检查用户名是否可用
  usernameValidating.value = true
  try {
    // 这里应该调用userService检查用户名可用性
    // 假设我们有一个checkUsernameAvailability方法
    // const isAvailable = await userService.checkUsernameAvailability(form.username)
    // 暂时模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟检查结果
    const isAvailable = !['admin', 'test', 'user'].includes(form.username.toLowerCase())
    
    if (!isAvailable) {
      errors.username = '该用户名已被使用'
      usernameValid.value = false
    } else {
      errors.username = ''
      usernameValid.value = true
    }
  } catch (error) {
    console.error('验证用户名失败:', error)
    errors.username = '验证用户名失败，请稍后重试'
    usernameValid.value = false
  } finally {
    usernameValidating.value = false
  }
}, 500)

const debouncedValidateEmail = debounce(async () => {
  if (!form.email.trim()) {
    errors.email = '邮箱地址不能为空'
    emailValid.value = false
    return
  }
  
  if (!validateEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    emailValid.value = false
    return
  }
  
  // 检查邮箱是否可用
  emailValidating.value = true
  try {
    // 这里应该调用userService检查邮箱可用性
    // const isAvailable = await userService.checkEmailAvailability(form.email)
    // 暂时模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟检查结果
    const isAvailable = !form.email.includes('existing')
    
    if (!isAvailable) {
      errors.email = '该邮箱已被注册'
      emailValid.value = false
    } else {
      errors.email = ''
      emailValid.value = true
    }
  } catch (error) {
    console.error('验证邮箱失败:', error)
    errors.email = '验证邮箱失败，请稍后重试'
    emailValid.value = false
  } finally {
    emailValidating.value = false
  }
}, 500)

// 表单验证方法
const validateUsername = () => {
  clearError('username')
  debouncedValidateUsername()
}

const validateEmail = () => {
  clearError('email')
  debouncedValidateEmail()
}

const validatePassword = () => {
  clearError('password')
  
  if (!form.password) {
    errors.password = '密码不能为空'
    passwordValid.value = false
    return
  }
  
  if (form.password.length < 6) {
    errors.password = '密码长度至少6位'
    passwordValid.value = false
    return
  }
  
  // 使用提供的validatePassword函数
  const validation = validatePassword(form.password)
  if (!validation.isValid) {
    errors.password = validation.errors[0] || '密码强度不足'
    passwordValid.value = false
  } else {
    errors.password = ''
    passwordValid.value = true
  }
}

const validateConfirmPassword = () => {
  clearError('confirmPassword')
  
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    return
  }
  
  if (!passwordsMatch.value) {
    errors.confirmPassword = '两次输入的密码不一致'
  } else {
    errors.confirmPassword = ''
  }
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

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// 处理注册
const handleRegister = async () => {
  if (!isFormValid.value) {
    // 验证所有字段
    validateUsername()
    validateEmail()
    validatePassword()
    validateConfirmPassword()
    
    if (!form.agreedToTerms) {
      errors.agreedToTerms = '请同意用户协议和隐私政策'
    }
    
    return
  }
  
  loading.value = true
  
  try {
    // 构建注册数据
    const userData = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.confirmPassword,
      nickname: form.username.trim()
    }
    
    // 使用authStore的register方法
    await authStore.register(userData)
    
    // 显示成功提示
    showSuccessToast.value = true
    
    // 延迟跳转到仪表板
    setTimeout(() => {
      const redirectPath = route.query.redirect || '/dashboard'
      router.push(redirectPath)
    }, 2000)
    
  } catch (error) {
    // 处理注册错误
    let errorMessage = '注册失败，请稍后重试'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = '注册数据无效'
          break
        case 409:
          errorMessage = '用户名或邮箱已被使用'
          break
        case 422:
          errorMessage = '数据验证失败'
          break
        case 429:
          errorMessage = '尝试次数过多，请稍后再试'
          break
        default:
          errorMessage = `注册失败 (${error.response.status})`
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showError(errorMessage)
    
    // 根据错误类型设置具体字段错误
    if (errorMessage.includes('用户名')) {
      errors.username = errorMessage
      usernameValid.value = false
    } else if (errorMessage.includes('邮箱')) {
      errors.email = errorMessage
      emailValid.value = false
    } else if (errorMessage.includes('密码')) {
      errors.password = errorMessage
      passwordValid.value = false
    }
    
  } finally {
    loading.value = false
  }
}

// 第三方注册方法
const registerWithGoogle = async () => {
  try {
    loading.value = true
    // 这里应该调用第三方注册API
    // await authService.registerWithGoogle()
    showSuccess('正在跳转到Google注册...')
    // 实际开发中这里会重定向到OAuth授权页面
  } catch (error) {
    showError('Google注册失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const registerWithWeChat = async () => {
  try {
    loading.value = true
    // await authService.registerWithWeChat()
    showSuccess('正在跳转到微信注册...')
  } catch (error) {
    showError('微信注册失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const registerWithGitHub = async () => {
  try {
    loading.value = true
    // await authService.registerWithGitHub()
    showSuccess('正在跳转到GitHub注册...')
  } catch (error) {
    showError('GitHub注册失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/auth/login')
}

// 填充测试数据（开发环境）
const fillTestData = () => {
  if (process.env.NODE_ENV === 'development') {
    form.username = 'testuser'
    form.email = 'test@example.com'
    form.password = 'Password123'
    form.confirmPassword = 'Password123'
    form.agreedToTerms = true
  }
}

// 监听表单变化
watch(() => form.username, () => {
  if (form.username.length > 0) {
    validateUsername()
  }
})

watch(() => form.email, () => {
  if (form.email.length > 0) {
    validateEmail()
  }
})

watch(() => form.password, () => {
  if (form.password.length > 0) {
    validatePassword()
  }
})

watch(() => form.confirmPassword, () => {
  if (form.confirmPassword.length > 0) {
    validateConfirmPassword()
  }
})

// 生命周期钩子
onMounted(() => {
  fillTestData()
})
</script>

<style scoped>
.register-view {
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
.decoration-star,
.decoration-heart {
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

.heart-1 {
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
.register-container {
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
  font-size: 2.5rem;
}

.app-title {
  font-family: 'Caveat', 'Kalam', cursive;
  font-size: 2.5rem;
  color: #5d6afb;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #5d6afb 0%, #ff7eb3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 1rem;
  color: #888;
  margin: 0;
  font-weight: 300;
}

/* 表单样式 */
.register-form {
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

.form-input.has-success {
  border-color: #4cd964;
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

.success-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  color: #4cd964;
}

.password-toggle {
  position: absolute;
  right: 45px;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.error-icon {
  font-size: 1rem;
}

/* 成功信息 */
.success-message {
  color: #4cd964;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.success-icon {
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

/* 协议同意区域 */
.agreement-section {
  margin: 15px 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #666;
  line-height: 1.4;
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
  flex-shrink: 0;
  margin-top: 2px;
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

.agreement-link {
  color: #5d6afb;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.agreement-link:hover {
  color: #8a94ff;
  text-decoration: underline;
}

/* 注册按钮 */
.register-button {
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

.register-button:hover:not(:disabled):not(.is-disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(93, 106, 251, 0.4);
}

.register-button:active:not(:disabled):not(.is-disabled) {
  transform: translateY(-1px);
}

.register-button:disabled,
.register-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 4px 10px rgba(93, 106, 251, 0.2) !important;
}

.register-button.is-loading {
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

/* 第三方注册 */
.social-register {
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

/* 登录链接 */
.login-link {
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
.register-footer {
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
  .register-container {
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
  
  .social-register {
    flex-direction: column;
  }
  
  .social-button {
    padding: 14px;
  }
  
  .decoration-cloud,
  .decoration-star,
  .decoration-heart {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .register-view {
    padding: 15px;
  }
  
  .register-container {
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
}
</style>