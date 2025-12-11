<!-- src/views/Auth/ResetPasswordView.vue -->
<!-- 重置密码页面 - 用户通过邮件链接进入，设置新密码 -->
<template>
    <div class="reset-password-view">
        <!-- 背景装饰元素 -->
        <div class="decoration-cloud cloud-1">☁️</div>
        <div class="decoration-cloud cloud-2">☁️</div>
        <div class="decoration-star star-1">⭐</div>
        <div class="decoration-star star-2">⭐</div>
        <div class="decoration-key">🔑</div>

        <!-- 主内容卡片 -->
        <div class="reset-card">
            <!-- 顶部Logo区域 -->
            <div class="logo-section">
                <div class="logo-icon">📚</div>
                <h1 class="logo-text">阅记星</h1>
                <p class="logo-subtitle">智能英语学习伴侣</p>
            </div>

            <!-- 重置密码表单 -->
            <div class="reset-form">
                <h2 class="reset-title">设置新密码</h2>
                <p class="reset-subtitle">请为您的账户设置一个新的安全密码</p>

                <!-- 表单区域 -->
                <form @submit.prevent="handleResetPassword">
                    <!-- 重置令牌（隐藏字段） -->
                    <input type="hidden" v-model="formData.token" />

                    <!-- 邮箱输入 -->
                    <div class="form-group">
                        <label for="email" class="form-label">
                            <span class="label-icon">📧</span>
                            邮箱地址
                        </label>
                        <div class="input-wrapper">
                            <input id="email" v-model="formData.email" type="email" placeholder="请输入您的邮箱地址"
                                :class="['form-input', { 'error': emailError }]" @input="validateEmail"
                                @blur="validateEmail" />
                            <div v-if="emailError" class="error-message">
                                {{ emailError }}
                            </div>
                        </div>
                    </div>

                    <!-- 新密码输入 -->
                    <div class="form-group">
                        <label for="password" class="form-label">
                            <span class="label-icon">🔒</span>
                            新密码
                        </label>
                        <div class="input-wrapper">
                            <input id="password" v-model="formData.password" :type="showPassword ? 'text' : 'password'"
                                placeholder="请输入新密码（至少6位）" :class="['form-input', { 'error': passwordError }]"
                                @input="validatePassword" @blur="validatePassword" />
                            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                                {{ showPassword ? '🙈' : '👁️' }}
                            </button>
                            <div v-if="passwordError" class="error-message">
                                {{ passwordError }}
                            </div>

                            <!-- 密码强度指示器 -->
                            <div v-if="formData.password" class="password-strength">
                                <div class="strength-label">密码强度：</div>
                                <div class="strength-meter">
                                    <div class="strength-bar" :class="passwordStrengthClass"
                                        :style="{ width: passwordStrength + '%' }"></div>
                                </div>
                                <div class="strength-text">{{ passwordStrengthText }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 确认密码输入 -->
                    <div class="form-group">
                        <label for="confirmPassword" class="form-label">
                            <span class="label-icon">🔐</span>
                            确认密码
                        </label>
                        <div class="input-wrapper">
                            <input id="confirmPassword" v-model="formData.confirmPassword"
                                :type="showConfirmPassword ? 'text' : 'password'" placeholder="请再次输入新密码"
                                :class="['form-input', { 'error': confirmPasswordError }]"
                                @input="validateConfirmPassword" @blur="validateConfirmPassword" />
                            <button type="button" class="password-toggle"
                                @click="showConfirmPassword = !showConfirmPassword">
                                {{ showConfirmPassword ? '🙈' : '👁️' }}
                            </button>
                            <div v-if="confirmPasswordError" class="error-message">
                                {{ confirmPasswordError }}
                            </div>
                        </div>
                    </div>

                    <!-- 提交按钮 -->
                    <button type="submit" class="reset-btn" :disabled="!isFormValid || isLoading">
                        <span v-if="isLoading" class="loading-spinner"></span>
                        <span v-else>重置密码</span>
                    </button>

                    <!-- 返回登录链接 -->
                    <div class="back-to-login">
                        <router-link to="/login" class="back-link">
                            <span class="back-icon">←</span>
                            返回登录
                        </router-link>
                    </div>
                </form>
            </div>

            <!-- 成功重置提示 -->
            <div v-if="resetSuccess" class="success-message">
                <div class="success-icon">✅</div>
                <h3 class="success-title">密码重置成功！</h3>
                <p class="success-text">您的密码已成功更新，请使用新密码登录。</p>
                <router-link to="/login" class="success-btn">
                    立即登录
                </router-link>
            </div>
        </div>

        <!-- 页脚 -->
        <div class="auth-footer">
            <p class="footer-text">
                © 2023 阅记星 - 智能英语学习平台
                <span class="footer-separator">|</span>
                <router-link to="/privacy" class="footer-link">隐私政策</router-link>
                <span class="footer-separator">|</span>
                <router-link to="/terms" class="footer-link">用户协议</router-link>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateEmail as validateEmailFormat, validatePassword as validatePasswordStrength } from '@/utils/validator'
import { showSuccess, showError } from '@/utils/notify'

// 导入认证服务
import authService from '@/services/auth.service'

const route = useRoute()
const router = useRouter()

// 响应式数据
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const resetSuccess = ref(false)

// 表单数据
const formData = reactive({
    token: '',
    email: '',
    password: '',
    confirmPassword: ''
})

// 错误信息
const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

// 计算属性
const isFormValid = computed(() => {
    return (
        formData.email &&
        formData.password &&
        formData.confirmPassword &&
        !emailError.value &&
        !passwordError.value &&
        !confirmPasswordError.value
    )
})

// 密码强度相关计算属性
const passwordStrength = computed(() => {
    if (!formData.password) return 0

    const validation = validatePasswordStrength(formData.password)
    return validation.score
})

const passwordStrengthClass = computed(() => {
    const strength = passwordStrength.value

    if (strength >= 80) return 'strength-strong'
    if (strength >= 60) return 'strength-medium'
    if (strength >= 40) return 'strength-weak'
    return 'strength-very-weak'
})

const passwordStrengthText = computed(() => {
    const strength = passwordStrength.value

    if (strength >= 80) return '很强'
    if (strength >= 60) return '中等'
    if (strength >= 40) return '较弱'
    return '很弱'
})

// 方法
const validateEmail = () => {
    if (!formData.email) {
        emailError.value = '邮箱地址不能为空'
        return false
    }

    if (!validateEmailFormat(formData.email)) {
        emailError.value = '请输入有效的邮箱地址'
        return false
    }

    emailError.value = ''
    return true
}

const validatePassword = () => {
    if (!formData.password) {
        passwordError.value = '密码不能为空'
        return false
    }

    if (formData.password.length < 6) {
        passwordError.value = '密码长度至少为6位'
        return false
    }

    const validation = validatePasswordStrength(formData.password)
    if (!validation.isValid) {
        passwordError.value = validation.errors[0] || '密码不符合要求'
        return false
    }

    passwordError.value = ''
    return true
}

const validateConfirmPassword = () => {
    if (!formData.confirmPassword) {
        confirmPasswordError.value = '请确认密码'
        return false
    }

    if (formData.password !== formData.confirmPassword) {
        confirmPasswordError.value = '两次输入的密码不一致'
        return false
    }

    confirmPasswordError.value = ''
    return true
}

const handleResetPassword = async () => {
    // 验证所有字段
    const isEmailValid = validateEmail()
    const isPasswordValid = validatePassword()
    const isConfirmPasswordValid = validateConfirmPassword()

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
        return
    }

    isLoading.value = true

    try {
        // 调用认证服务的重置密码方法
        await authService.resetPassword({
            token: formData.token,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.confirmPassword
        })

        // 重置成功
        resetSuccess.value = true
        showSuccess('密码重置成功！')

        // 3秒后自动跳转到登录页
        setTimeout(() => {
            router.push('/login')
        }, 3000)

    } catch (error) {
        console.error('重置密码失败:', error)

        // 根据错误类型显示不同的错误信息
        let errorMessage = '重置密码失败，请稍后重试'

        if (error.message) {
            errorMessage = error.message
        } else if (error.response) {
            switch (error.response.status) {
                case 400:
                    errorMessage = '请求参数无效，请检查输入'
                    break
                case 401:
                    errorMessage = '重置链接已过期或无效'
                    break
                case 404:
                    errorMessage = '用户不存在'
                    break
                case 422:
                    errorMessage = '数据验证失败，请检查输入'
                    break
                default:
                    errorMessage = `重置失败 (${error.response.status})`
            }
        }

        showError(errorMessage)
    } finally {
        isLoading.value = false
    }
}

// 从URL参数中获取token和email
const extractTokenFromUrl = () => {
    const token = route.query.token
    const email = route.query.email

    if (token) {
        formData.token = token
    } else {
        // 如果没有token，显示错误并重定向
        showError('重置链接无效，缺少必要的参数')
        setTimeout(() => {
            router.push('/forgot-password')
        }, 2000)
    }

    if (email) {
        formData.email = email
    }
}

// 生命周期钩子
onMounted(() => {
    extractTokenFromUrl()
})
</script>

<style scoped>
.reset-password-view {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e3e9ff 0%, #f5f7ff 100%);
    padding: 20px;
    position: relative;
    overflow: hidden;
    font-family: 'Quicksand', 'Comfortaa', sans-serif;
}

/* 装饰元素样式 */
.decoration-cloud {
    position: absolute;
    font-size: 80px;
    opacity: 0.3;
    animation: float 6s ease-in-out infinite;
    z-index: 0;
}

.cloud-1 {
    top: 10%;
    left: 5%;
    animation-delay: 0s;
}

.cloud-2 {
    bottom: 15%;
    right: 8%;
    animation-delay: 2s;
}

.decoration-star {
    position: absolute;
    font-size: 40px;
    opacity: 0.4;
    animation: twinkle 3s ease-in-out infinite;
}

.star-1 {
    top: 20%;
    right: 15%;
    animation-delay: 1s;
}

.star-2 {
    bottom: 25%;
    left: 12%;
    animation-delay: 1.5s;
}

.decoration-key {
    position: absolute;
    font-size: 60px;
    opacity: 0.2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: rotate 20s linear infinite;
}

/* 主卡片样式 */
.reset-card {
    width: 100%;
    max-width: 480px;
    background: white;
    border-radius: 40px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(93, 106, 251, 0.15);
    border: 4px solid #8a94ff;
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
}

.reset-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 25px 70px rgba(93, 106, 251, 0.2);
}

/* Logo区域样式 */
.logo-section {
    text-align: center;
    margin-bottom: 30px;
}

.logo-icon {
    font-size: 60px;
    margin-bottom: 10px;
    animation: bounce 2s infinite;
}

.logo-text {
    font-family: 'Caveat', cursive;
    font-size: 48px;
    color: #5d6afb;
    margin: 0 0 5px 0;
    background: linear-gradient(45deg, #5d6afb, #8a94ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.logo-subtitle {
    font-size: 16px;
    color: #8a94ff;
    margin: 0;
    font-weight: 500;
}

/* 重置表单样式 */
.reset-form {
    margin-bottom: 20px;
}

.reset-title {
    font-family: 'Caveat', cursive;
    font-size: 36px;
    color: #5d6afb;
    margin: 0 0 10px 0;
    text-align: center;
}

.reset-subtitle {
    font-size: 16px;
    color: #666;
    text-align: center;
    margin: 0 0 30px 0;
    line-height: 1.5;
}

/* 表单组样式 */
.form-group {
    margin-bottom: 25px;
}

.form-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 10px;
}

.label-icon {
    font-size: 20px;
}

.input-wrapper {
    position: relative;
}

.form-input {
    width: 100%;
    padding: 16px 50px 16px 20px;
    border: 3px solid #e3e9ff;
    border-radius: 25px;
    font-size: 16px;
    font-family: 'Quicksand', sans-serif;
    background: #f8faff;
    color: #333;
    transition: all 0.3s ease;
}

.form-input:focus {
    outline: none;
    border-color: #5d6afb;
    box-shadow: 0 0 0 4px rgba(93, 106, 251, 0.1);
    background: white;
}

.form-input.error {
    border-color: #ff7eb3;
    background: #fff5f8;
}

.form-input.error:focus {
    box-shadow: 0 0 0 4px rgba(255, 126, 179, 0.1);
}

.password-toggle {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.3s ease;
    color: #8a94ff;
}

.password-toggle:hover {
    background: #e3e9ff;
    transform: translateY(-50%) scale(1.1);
}

.error-message {
    color: #ff7eb3;
    font-size: 14px;
    margin-top: 8px;
    padding-left: 5px;
    animation: slideIn 0.3s ease;
}

/* 密码强度指示器样式 */
.password-strength {
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.strength-label {
    font-size: 14px;
    color: #666;
}

.strength-meter {
    flex: 1;
    height: 8px;
    background: #e3e9ff;
    border-radius: 4px;
    overflow: hidden;
}

.strength-bar {
    height: 100%;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.strength-very-weak {
    background: linear-gradient(90deg, #ff7eb3, #ff5d9e);
}

.strength-weak {
    background: linear-gradient(90deg, #ffb347, #ff7f00);
}

.strength-medium {
    background: linear-gradient(90deg, #ffd700, #ffaa00);
}

.strength-strong {
    background: linear-gradient(90deg, #4cd964, #2ecc71);
}

.strength-text {
    font-size: 14px;
    font-weight: 600;
    min-width: 40px;
}

.strength-very-weak+.strength-text {
    color: #ff7eb3;
}

.strength-weak+.strength-text {
    color: #ff7f00;
}

.strength-medium+.strength-text {
    color: #ffaa00;
}

.strength-strong+.strength-text {
    color: #4cd964;
}

/* 重置按钮样式 */
.reset-btn {
    width: 100%;
    padding: 18px;
    background: linear-gradient(135deg, #5d6afb, #8a94ff);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 20px rgba(93, 106, 251, 0.3);
    position: relative;
    overflow: hidden;
}

.reset-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(93, 106, 251, 0.4);
}

.reset-btn:active:not(:disabled) {
    transform: translateY(-1px);
}

.reset-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 4px 15px rgba(93, 106, 251, 0.2);
}

.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
}

/* 返回登录链接样式 */
.back-to-login {
    text-align: center;
    margin-top: 25px;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #8a94ff;
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.back-link:hover {
    color: #5d6afb;
    transform: translateX(-5px);
}

.back-icon {
    font-size: 18px;
}

/* 成功消息样式 */
.success-message {
    text-align: center;
    padding: 30px 20px;
    background: linear-gradient(135deg, #f0f7ff, #e3f2ff);
    border-radius: 30px;
    border: 3px dashed #4cd964;
    animation: fadeIn 0.5s ease;
}

.success-icon {
    font-size: 60px;
    margin-bottom: 20px;
    animation: bounce 1s;
}

.success-title {
    font-family: 'Caveat', cursive;
    font-size: 32px;
    color: #4cd964;
    margin: 0 0 10px 0;
}

.success-text {
    font-size: 16px;
    color: #666;
    margin: 0 0 25px 0;
    line-height: 1.5;
}

.success-btn {
    display: inline-block;
    padding: 12px 30px;
    background: linear-gradient(135deg, #4cd964, #2ecc71);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(76, 217, 100, 0.3);
}

.success-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(76, 217, 100, 0.4);
}

/* 页脚样式 */
.auth-footer {
    margin-top: 30px;
    text-align: center;
    color: #8a94ff;
    font-size: 14px;
    position: relative;
    z-index: 1;
}

.footer-text {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

.footer-separator {
    opacity: 0.5;
}

.footer-link {
    color: #8a94ff;
    text-decoration: none;
    transition: all 0.3s ease;
}

.footer-link:hover {
    color: #5d6afb;
    text-decoration: underline;
}

/* 动画定义 */
@keyframes float {

    0%,
    100% {
        transform: translateY(0) translateX(0);
    }

    50% {
        transform: translateY(-20px) translateX(10px);
    }
}

@keyframes twinkle {

    0%,
    100% {
        opacity: 0.4;
        transform: scale(1);
    }

    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}

@keyframes rotate {
    0% {
        transform: translate(-50%, -50%) rotate(0deg);
    }

    100% {
        transform: translate(-50%, -50%) rotate(360deg);
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
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

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .reset-card {
        padding: 30px 25px;
        border-radius: 35px;
    }

    .logo-text {
        font-size: 40px;
    }

    .reset-title {
        font-size: 32px;
    }

    .form-input {
        padding: 14px 45px 14px 18px;
    }

    .reset-btn {
        padding: 16px;
    }
}

@media (max-width: 480px) {
    .reset-password-view {
        padding: 15px;
    }

    .reset-card {
        padding: 25px 20px;
        border-radius: 30px;
        border-width: 3px;
    }

    .logo-icon {
        font-size: 50px;
    }

    .logo-text {
        font-size: 36px;
    }

    .reset-title {
        font-size: 28px;
    }

    .footer-text {
        flex-direction: column;
        gap: 5px;
    }

    .footer-separator {
        display: none;
    }

    .decoration-cloud {
        font-size: 60px;
    }

    .decoration-star {
        font-size: 30px;
    }

    .decoration-key {
        font-size: 50px;
    }
}
</style>