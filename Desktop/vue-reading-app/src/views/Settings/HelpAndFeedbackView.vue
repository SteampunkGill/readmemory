<template>
  <div class="help-feedback-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">❓ 帮助与反馈</h1>
      <p class="page-subtitle">有问题？我们来帮你！</p>
    </div>

    <!-- 帮助中心 -->
    <div class="help-center">
      <h2 class="section-title">📚 帮助中心</h2>
      
      <div class="search-help">
        <input
          v-model="helpSearchQuery"
          type="text"
          class="help-search-input"
          placeholder="🔍 搜索帮助主题..."
          @input="searchHelpTopics"
        />
      </div>
      
      <div class="help-categories">
        <div
          v-for="category in helpCategories"
          :key="category.id"
          class="category-card"
          @click="toggleCategory(category.id)"
        >
          <div class="category-header">
            <span class="category-icon">{{ category.icon }}</span>
            <h3 class="category-title">{{ category.title }}</h3>
            <span class="category-toggle">{{ expandedCategory === category.id ? '−' : '+' }}</span>
          </div>
          
          <div v-if="expandedCategory === category.id" class="category-content">
            <div
              v-for="topic in category.topics"
              :key="topic.id"
              class="topic-item"
              @click.stop="openTopic(topic)"
            >
              <span class="topic-icon">📄</span>
              <div class="topic-content">
                <h4 class="topic-title">{{ topic.title }}</h4>
                <p class="topic-description">{{ topic.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常见问题 -->
    <div class="faq-section">
      <h2 class="section-title">❓ 常见问题</h2>
      
      <div class="faq-list">
        <div
          v-for="faq in filteredFAQs"
          :key="faq.id"
          class="faq-item"
          @click="toggleFAQ(faq.id)"
        >
          <div class="faq-question">
            <span class="faq-icon">{{ expandedFAQ === faq.id ? '−' : '+' }}</span>
            <h3 class="faq-title">{{ faq.question }}</h3>
          </div>
          
          <div v-if="expandedFAQ === faq.id" class="faq-answer">
            <p>{{ faq.answer }}</p>
            
            <div v-if="faq.steps" class="faq-steps">
              <h4>步骤：</h4>
              <ol>
                <li v-for="(step, index) in faq.steps" :key="index">{{ step }}</li>
              </ol>
            </div>
            
            <div v-if="faq.tips" class="faq-tips">
              <h4>💡 提示：</h4>
              <ul>
                <li v-for="(tip, index) in faq.tips" :key="index">{{ tip }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 联系客服 -->
    <div class="contact-section">
      <h2 class="section-title">📞 联系客服</h2>
      
      <div class="contact-options">
        <div class="contact-card">
          <div class="contact-icon">📧</div>
          <h3 class="contact-title">电子邮件</h3>
          <p class="contact-info">support@readmemo.com</p>
          <p class="contact-response">通常在24小时内回复</p>
          <button class="contact-btn" @click="sendEmail">
            发送邮件
          </button>
        </div>
        
        <div class="contact-card">
          <div class="contact-icon">💬</div>
          <h3 class="contact-title">在线客服</h3>
          <p class="contact-info">周一至周五 9:00-18:00</p>
          <p class="contact-response">实时在线支持</p>
          <button class="contact-btn" @click="openLiveChat">
            开始聊天
          </button>
        </div>
        
        <div class="contact-card">
          <div class="contact-icon">📱</div>
          <h3 class="contact-title">电话支持</h3>
          <p class="contact-info">400-123-4567</p>
          <p class="contact-response">工作日 9:00-18:00</p>
          <button class="contact-btn" @click="callSupport">
            拨打电话
          </button>
        </div>
      </div>
    </div>

    <!-- 反馈表单 -->
    <div class="feedback-section">
      <h2 class="section-title">💬 提交反馈</h2>
      
      <div class="feedback-form">
        <div class="form-group">
          <label class="form-label">反馈类型</label>
          <div class="feedback-types">
            <button
              v-for="type in feedbackTypes"
              :key="type.id"
              :class="['type-option', { active: feedbackData.type === type.id }]"
              @click="feedbackData.type = type.id"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">标题</label>
          <input
            v-model="feedbackData.title"
            type="text"
            class="form-input"
            placeholder="请简要描述问题"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">详细描述</label>
          <textarea
            v-model="feedbackData.description"
            class="form-textarea"
            rows="5"
            placeholder="请详细描述您遇到的问题，包括操作步骤、期望结果和实际结果..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">截图（可选）</label>
          <div class="screenshot-upload">
            <input
              type="file"
              ref="screenshotInput"
              @change="handleScreenshotUpload"
              accept="image/*"
              style="display: none"
            />
            <button class="upload-btn" @click="triggerScreenshotInput">
              📷 上传截图
            </button>
            
            <div v-if="feedbackData.screenshot" class="screenshot-preview">
              <img :src="feedbackData.screenshot" alt="截图预览" />
              <button class="remove-btn" @click="removeScreenshot">
                ✕
              </button>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">联系方式</label>
          <input
            v-model="feedbackData.contact"
            type="text"
            class="form-input"
            placeholder="邮箱或电话（可选）"
          />
        </div>
        
        <div class="form-actions">
          <button
            class="submit-btn"
            @click="submitFeedback"
            :disabled="!canSubmitFeedback"
          >
            📤 提交反馈
          </button>
          
          <button
            class="reset-btn"
            @click="resetFeedbackForm"
          >
            🔄 重置
          </button>
        </div>
      </div>
    </div>

    <!-- 帮助主题详情模态框 -->
    <AppModal
      v-if="selectedTopic"
      :title="selectedTopic.title"
      :show-close="true"
      :show-footer="false"
      size="lg"
      @close="selectedTopic = null"
    >
      <div class="topic-detail">
        <div class="topic-header">
          <span class="topic-category">{{ getCategoryName(selectedTopic.categoryId) }}</span>
          <span class="topic-difficulty">{{ selectedTopic.difficulty }}</span>
        </div>
        
        <div class="topic-content">
          <div v-html="selectedTopic.content"></div>
          
          <div v-if="selectedTopic.relatedTopics" class="related-topics">
            <h4>相关主题：</h4>
            <div class="related-list">
              <button
                v-for="related in selectedTopic.relatedTopics"
                :key="related.id"
                class="related-item"
                @click="openRelatedTopic(related)"
              >
                {{ related.title }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- 反馈提交成功模态框 -->
    <AppModal
      v-if="showFeedbackSuccess"
      title="✅ 反馈提交成功"
      :show-close="true"
      :show-footer="false"
      @close="showFeedbackSuccess = false"
    >
      <div class="success-message">
        <div class="success-icon">🎉</div>
        <h3>感谢您的反馈！</h3>
        <p>我们已经收到您的反馈，会尽快处理。</p>
        <p>反馈编号：<strong>{{ feedbackId }}</strong></p>
        <p>您可以通过此编号查询处理进度。</p>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import feedbackService from '@/services/feedback.service'
import { formatDate } from '@/utils/formatter'
import AppModal from '@/components/common/AppModal.vue'

// 搜索状态
const helpSearchQuery = ref('')
const expandedCategory = ref('getting-started')
const expandedFAQ = ref(null)
const selectedTopic = ref(null)
const showFeedbackSuccess = ref(false)

// 反馈数据
const feedbackData = reactive({
  type: 'bug',
  title: '',
  description: '',
  screenshot: null,
  contact: '',
  deviceInfo: {}
})

const feedbackId = ref('')

// 帮助分类数据
const helpCategories = ref([
  {
    id: 'getting-started',
    title: '入门指南',
    icon: '🚀',
    topics: [
      {
        id: 'create-account',
        title: '如何创建账户',
        description: '学习如何注册阅记星账户',
        categoryId: 'getting-started',
        difficulty: '简单',
        content: `
          <h3>创建阅记星账户</h3>
          <p>创建账户非常简单，只需几个步骤：</p>
          <ol>
            <li>打开阅记星应用</li>
            <li>点击"注册"按钮</li>
            <li>输入您的邮箱地址</li>
            <li>设置一个安全的密码</li>
            <li>阅读并同意用户协议</li>
            <li>点击"创建账户"</li>
            <li>检查您的邮箱，点击验证链接</li>
          </ol>
          <p>完成这些步骤后，您就可以开始使用阅记星了！</p>
        `
      },
      {
        id: 'first-document',
        title: '上传第一个文档',
        description: '学习如何上传和数字化文档',
        categoryId: 'getting-started',
        difficulty: '简单',
        content: `
          <h3>上传您的第一个文档</h3>
          <p>上传文档是阅记星的核心功能之一：</p>
          <ol>
            <li>点击主页面上的"上传"按钮</li>
            <li>选择要上传的文件（支持PDF、图片等格式）</li>
            <li>填写文档信息（标题、作者、语言等）</li>
            <li>点击"开始处理"</li>
            <li>等待OCR处理完成</li>
            <li>开始阅读和学习！</li>
          </ol>
          <p>💡 提示：首次上传可能需要一些时间处理，请耐心等待。</p>
        `
      }
    ]
  },
  {
    id: 'reading',
    title: '阅读功能',
    icon: '📖',
    topics: [
      {
        id: 'word-lookup',
        title: '即点即查功能',
        description: '学习如何使用单词查询功能',
        categoryId: 'reading',
        difficulty: '简单',
        content: `
          <h3>即点即查功能</h3>
          <p>阅记星的即点即查功能让学习英语变得轻松：</p>
          <ol>
            <li>在阅读器中点击任意单词</li>
            <li>查看弹出的单词释义和例句</li>
            <li>点击发音按钮听单词读音</li>
            <li>点击"添加到生词本"保存单词</li>
            <li>点击"更多详情"查看完整词典信息</li>
          </ol>
          <p>💡 提示：您可以在设置中调整翻译显示位置和自动播放发音。</p>
        `
      },
      {
        id: 'highlight-notes',
        title: '高亮和笔记功能',
        description: '学习如何添加高亮和笔记',
        categoryId: 'reading',
        difficulty: '中等',
        content: `
          <h3>高亮和笔记功能</h3>
          <p>高亮和笔记功能帮助您更好地学习和复习：</p>
          <h4>添加高亮：</h4>
          <ol>
            <li>选择要标记的文本</li>
            <li>点击弹出的高亮按钮</li>
            <li>选择高亮颜色</li>
            <li>高亮会自动保存</li>
          </ol>
          <h4>添加笔记：</h4>
          <ol>
            <li>选择要注释的文本</li>
            <li>点击弹出的笔记按钮</li>
            <li>输入您的笔记内容</li>
            <li>点击保存</li>
          </ol>
          <p>💡 提示：您可以在侧边栏中查看所有高亮和笔记。</p>
        `
      }
    ]
  },
  {
    id: 'vocabulary',
    title: '词汇管理',
    icon: '📚',
    topics: [
      {
        id: 'vocabulary-book',
        title: '使用生词本',
        description: '学习如何管理您的生词',
        categoryId: 'vocabulary',
        difficulty: '简单',
        content: `
          <h3>生词本使用指南</h3>
          <p>生词本帮助您系统地学习新单词：</p>
          <h4>添加单词：</h4>
          <ol>
            <li>在阅读器中点击单词</li>
            <li>点击"添加到生词本"</li>
            <li>选择标签和难度</li>
            <li>添加个人笔记（可选）</li>
          </ol>
          <h4>复习单词：</h4>
          <ol>
            <li>进入生词本页面</li>
            <li>选择要复习的单词</li>
            <li>根据记忆情况选择"认识"或"不认识"</li>
            <li>系统会根据您的选择安排下次复习时间</li>
          </ol>
        `
      }
    ]
  }
])

// 常见问题数据
const faqs = ref([
  {
    id: 'upload-failed',
    question: '文档上传失败怎么办？',
    answer: '文档上传失败可能有多种原因，请尝试以下解决方案：',
    steps: [
      '检查网络连接是否正常',
      '确认文件格式是否支持（支持PDF、JPG、PNG等格式）',
      '检查文件大小是否超过限制（最大100MB）',
      '尝试重新上传',
      '如果问题持续，请联系客服'
    ],
    tips: [
      '建议使用稳定的Wi-Fi网络上传大文件',
      '上传前可以压缩图片文件',
      '确保应用是最新版本'
    ],
    category: 'upload'
  },
  {
    id: 'ocr-slow',
    question: 'OCR处理速度很慢怎么办？',
    answer: 'OCR处理速度受多种因素影响，您可以尝试以下方法：',
    steps: [
      '检查网络连接速度',
      '确认文档清晰度',
      '尝试在Wi-Fi环境下处理',
      '关闭其他占用网络的应用'
    ],
    tips: [
      '复杂文档可能需要更长时间处理',
      '处理过程中请保持应用打开',
      '您可以在后台处理时进行其他操作'
    ],
    category: 'ocr'
  },
  {
    id: 'word-not-found',
    question: '查词时显示"未找到该单词"怎么办？',
    answer: '如果查词时显示未找到，可能是以下原因：',
    steps: [
      '检查单词拼写是否正确',
      '尝试查询单词的不同形式',
      '确认词典是否已下载',
      '检查网络连接'
    ],
    tips: [
      '某些专业词汇可能不在基础词典中',
      '您可以手动添加单词释义',
      '建议保持词典更新'
    ],
    category: 'dictionary'
  }
])

// 反馈类型选项
const feedbackTypes = ref([
  { id: 'bug', label: '报告错误', icon: '🐛' },
  { id: 'suggestion', label: '功能建议', icon: '💡' },
  { id: 'question', label: '使用问题', icon: '❓' },
  { id: 'other', label: '其他反馈', icon: '📝' }
])

// 计算属性
const filteredFAQs = computed(() => {
  if (!helpSearchQuery.value) return faqs.value
  
  const query = helpSearchQuery.value.toLowerCase()
  return faqs.value.filter(faq => 
    faq.question.toLowerCase().includes(query) ||
    faq.answer.toLowerCase().includes(query)
  )
})

const canSubmitFeedback = computed(() => {
  return feedbackData.title.trim() !== '' && 
         feedbackData.description.trim() !== ''
})

// 方法
const searchHelpTopics = () => {
  // 搜索帮助主题的逻辑
  console.log('搜索帮助主题:', helpSearchQuery.value)
}

const toggleCategory = (categoryId) => {
  expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
}

const toggleFAQ = (faqId) => {
  expandedFAQ.value = expandedFAQ.value === faqId ? null : faqId
}

const openTopic = (topic) => {
  selectedTopic.value = topic
}

const openRelatedTopic = (related) => {
  // 打开相关主题的逻辑
  console.log('打开相关主题:', related)
}

const getCategoryName = (categoryId) => {
  const category = helpCategories.value.find(c => c.id === categoryId)
  return category ? category.title : '未知分类'
}

const sendEmail = () => {
  window.location.href = 'mailto:support@readmemo.com'
}

const openLiveChat = () => {
  // 打开在线聊天的逻辑
  console.log('打开在线聊天')
}

const callSupport = () => {
  window.location.href = 'tel:4001234567'
}

const handleScreenshotUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      feedbackData.screenshot = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const triggerScreenshotInput = () => {
  const input = document.querySelector('input[type="file"]')
  if (input) {
    input.click()
  }
}

const removeScreenshot = () => {
  feedbackData.screenshot = null
}

const submitFeedback = async () => {
  try {
    // 收集设备信息
    feedbackData.deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      appVersion: process.env.VUE_APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    }
    
    // 提交反馈
    const result = await feedbackService.submitFeedback(feedbackData)
    
    // 生成反馈ID
    feedbackId.value = `FB${Date.now().toString().slice(-8)}`
    
    // 显示成功消息
    showFeedbackSuccess.value = true
    
    // 重置表单
    resetFeedbackForm()
    
  } catch (err) {
    console.error('提交反馈失败:', err)
    alert('提交反馈失败，请稍后重试')
  }
}

const resetFeedbackForm = () => {
  feedbackData.title = ''
  feedbackData.description = ''
  feedbackData.screenshot = null
  feedbackData.contact = ''
  feedbackData.type = 'bug'
}

// 收集设备信息
const collectDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    appVersion: process.env.VUE_APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  }
}

// 生命周期
onMounted(() => {
  // 初始化设备信息
  feedbackData.deviceInfo = collectDeviceInfo()
})
</script>

<style scoped>
.help-feedback-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9f7f7 0%, #e8f4f8 100%);
  padding: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
}

.page-title {
  font-family: 'Kalam', cursive;
  font-size: 48px;
  color: #ff6b9d;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #666;
  margin: 8px 0 0;
}

.help-center,
.faq-section,
.contact-section,
.feedback-section {
  background: white;
  border-radius: 32px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
}

.section-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.search-help {
  margin-bottom: 24px;
}

.help-search-input {
  width: 100%;
  padding: 16px 24px;
  border-radius: 25px;
  border: 3px solid #ffd591;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  background: #fffaf0;
  transition: all 0.3s ease;
}

.help-search-input:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
}

.help-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-card {
  background: #f9f9f9;
  border-radius: 24px;
  border: 2px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  border-color: #ffd591;
  transform: translateY(-2px);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.category-icon {
  font-size: 24px;
}

.category-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  margin: 0;
  flex: 1;
}

.category-toggle {
  font-size: 20px;
  color: #666;
  font-weight: bold;
}

.category-content {
  padding: 0 20px 20px;
}

.topic-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.topic-item:hover {
  border-color: #ffd591;
  transform: translateX(4px);
}

.topic-icon {
  font-size: 20px;
  margin-top: 2px;
}

.topic-content {
  flex: 1;
}

.topic-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  margin: 0 0 4px;
}

.topic-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-item {
  background: #f9f9f9;
  border-radius: 24px;
  border: 2px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: #ffd591;
}

.faq-question {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.faq-icon {
  font-size: 20px;
  color: #666;
  font-weight: bold;
}

.faq-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  margin: 0;
  flex: 1;
}

.faq-answer {
  padding: 0 20px 20px;
}

.faq-answer p {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  margin: 0 0 16px;
  line-height: 1.6;
}

.faq-steps,
.faq-tips {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 20px;
}

.faq-steps h4,
.faq-tips h4 {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  margin: 0 0 12px;
}

.faq-steps ol,
.faq-tips ul {
  margin: 0;
  padding-left: 20px;
}

.faq-steps li,
.faq-tips li {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 8px 0;
  line-height: 1.5;
}

.contact-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.contact-card {
  background: #f9f9f9;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ffd591;
}

.contact-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.contact-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 20px;
  color: #333;
  margin: 0 0 8px;
}

.contact-info {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  margin: 0 0 4px;
}

.contact-response {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #999;
  margin: 0 0 20px;
}

.contact-btn {
  padding: 12px 24px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.contact-btn:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.feedback-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.feedback-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.type-option {
  flex: 1;
  min-width: 150px;
  padding: 12px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.type-option:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.type-option.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  border-color: #ff6b9d;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 20px;
  border: 2px solid #ddd;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  background: white;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.screenshot-upload {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-btn {
  padding: 12px 24px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
}

.upload-btn:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.screenshot-preview {
  position: relative;
  max-width: 300px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e8e8e8;
}

.screenshot-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 71, 87, 0.9);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #ff4757;
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.submit-btn,
.reset-btn {
  flex: 1;
  padding: 16px 24px;
  border-radius: 24px;
  border: none;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn {
  background: white;
  color: #666;
  border: 3px solid #ffd591;
}

.reset-btn:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.topic-detail {
  padding: 16px;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.topic-category {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
}

.topic-difficulty {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: white;
  background: #ff6b9d;
  padding: 4px 12px;
  border-radius: 12px;
}

.topic-content {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}

.topic-content h3 {
  color: #ff6b9d;
  margin: 24px 0 16px;
}

.topic-content ol {
  margin: 16px 0;
  padding-left: 20px;
}

.topic-content li {
  margin: 8px 0;
}

.related-topics {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 2px dashed #e8e8e8;
}

.related-topics h4 {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  margin: 0 0 16px;
}

.related-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.related-item {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-item:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.success-message {
  text-align: center;
  padding: 24px;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.success-message h3 {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0 0 12px;
}

.success-message p {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  margin: 8px 0;
  line-height: 1.5;
}

.success-message strong {
  color: #333;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .contact-options {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .help-feedback-view {
    padding: 16px;
  }
  
  .page-header,
  .help-center,
  .faq-section,
  .contact-section,
  .feedback-section {
    padding: 20px;
  }
  
  .contact-options {
    grid-template-columns: 1fr;
  }
  
  .feedback-types {
    flex-direction: column;
  }
  
  .type-option {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 36px;
  }
  
  .section-title {
    font-size: 24px;
  }
}
</style>