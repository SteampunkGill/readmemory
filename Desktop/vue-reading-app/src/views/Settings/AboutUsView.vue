<template>
  <div class="about-us-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">🌟 关于阅记星</h1>
      <p class="page-subtitle">让英语学习变得简单有趣</p>
    </div>

    <!-- 应用介绍 -->
    <div class="intro-section">
      <div class="intro-content">
        <div class="intro-text">
          <h2 class="intro-title">阅记星是什么？</h2>
          <p class="intro-description">
            阅记星是一款专为英语学习者设计的智能阅读应用。我们通过先进的OCR技术，
            将纸质文档数字化，并结合智能查词、生词本、个性化复习等功能，
            为您打造沉浸式的英语学习体验。
          </p>
          <p class="intro-mission">
            我们的使命是让每个人都能轻松、高效地学习英语，
            无论您是在校学生、职场人士，还是英语爱好者。
          </p>
        </div>
        
        <div class="intro-image">
          <div class="image-placeholder">
            <span class="image-icon">📚</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 核心功能 -->
    <div class="features-section">
      <h2 class="section-title">✨ 核心功能</h2>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3 class="feature-title">智能OCR</h3>
          <p class="feature-description">
            将纸质文档快速数字化，支持多种文件格式和语言识别
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📖</div>
          <h3 class="feature-title">即点即查</h3>
          <p class="feature-description">
            点击任意单词查看释义、例句和发音，学习更高效
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3 class="feature-title">智能生词本</h3>
          <p class="feature-description">
            自动收集生词，根据记忆曲线安排复习，记得更牢
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3 class="feature-title">个性化复习</h3>
          <p class="feature-description">
            基于您的学习进度和记忆情况，智能安排复习计划
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3 class="feature-title">学习统计</h3>
          <p class="feature-description">
            详细的学习数据和分析，帮助您了解学习进度和效果
          </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3 class="feature-title">多端同步</h3>
          <p class="feature-description">
            支持手机、平板、电脑多端同步，随时随地学习
          </p>
        </div>
      </div>
    </div>

    <!-- 团队介绍 -->
    <div class="team-section">
      <h2 class="section-title">👥 我们的团队</h2>
      
      <div class="team-grid">
        <div class="team-card">
          <div class="team-avatar">
            <span class="avatar-emoji">👨‍💻</span>
          </div>
          <h3 class="team-name">张明</h3>
          <p class="team-role">创始人 & CEO</p>
          <p class="team-bio">
            前Google工程师，10年机器学习经验，
            致力于用技术改变教育
          </p>
        </div>
        
        <div class="team-card">
          <div class="team-avatar">
            <span class="avatar-emoji">👩‍🎨</span>
          </div>
          <h3 class="team-name">李雪</h3>
          <p class="team-role">产品总监</p>
          <p class="team-bio">
            资深产品设计师，专注于用户体验，
            让学习变得更加愉悦
          </p>
        </div>
        
        <div class="team-card">
          <div class="team-avatar">
            <span class="avatar-emoji">👨‍🏫</span>
          </div>
          <h3 class="team-name">王强</h3>
          <p class="team-role">教育总监</p>
          <p class="team-bio">
            英语教育专家，20年教学经验，
            负责课程设计和学习效果评估
          </p>
        </div>
        
        <div class="team-card">
          <div class="team-avatar">
            <span class="avatar-emoji">👩‍💼</span>
          </div>
          <h3 class="team-name">陈静</h3>
          <p class="team-role">运营总监</p>
          <p class="team-bio">
            互联网运营专家，擅长用户增长和社区运营，
            让学习更有温度
          </p>
        </div>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-section">
      <h2 class="section-title">📱 版本信息</h2>
      
      <div class="version-info">
        <div class="version-item">
          <span class="version-label">应用名称:</span>
          <span class="version-value">阅记星 (ReadMemo)</span>
        </div>
        
        <div class="version-item">
          <span class="version-label">当前版本:</span>
          <span class="version-value">{{ appVersion }}</span>
        </div>
        
        <div class="version-item">
          <span class="version-label">发布日期:</span>
          <span class="version-value">{{ releaseDate }}</span>
        </div>
        
        <div class="version-item">
          <span class="version-label">更新内容:</span>
          <div class="version-changelog">
            <ul>
              <li v-for="(change, index) in changelog" :key="index">{{ change }}</li>
            </ul>
          </div>
        </div>
        
        <div class="version-item">
          <span class="version-label">技术支持:</span>
          <span class="version-value">support@readmemo.com</span>
        </div>
        
        <div class="version-item">
          <span class="version-label">官方网站:</span>
          <a href="https://www.readmemo.com" class="version-link">www.readmemo.com</a>
        </div>
      </div>
    </div>

    <!-- 隐私政策和使用条款 -->
    <div class="legal-section">
      <h2 class="section-title">⚖️ 法律信息</h2>
      
      <div class="legal-links">
        <button class="legal-link" @click="openPrivacyPolicy">
          🔒 隐私政策
        </button>
        
        <button class="legal-link" @click="openTermsOfService">
          📄 用户协议
        </button>
        
        <button class="legal-link" @click="openCookiePolicy">
          🍪 Cookie政策
        </button>
        
        <button class="legal-link" @click="openOpenSource">
          💻 开源协议
        </button>
      </div>
    </div>

    <!-- 应用信息 -->
    <div class="app-info-section">
      <h2 class="section-title">ℹ️ 应用信息</h2>
      
      <div class="app-info-grid">
        <div class="info-card">
          <h3 class="info-title">📊 数据统计</h3>
          <div class="info-content">
            <div class="info-item">
              <span class="item-label">用户数量:</span>
              <span class="item-value">{{ formatNumber(userCount) }}</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">处理文档:</span>
              <span class="item-value">{{ formatNumber(documentCount) }}</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">学习单词:</span>
              <span class="item-value">{{ formatNumber(vocabularyCount) }}</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">复习次数:</span>
              <span class="item-value">{{ formatNumber(reviewCount) }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-card">
          <h3 class="info-title">🌍 国际化</h3>
          <div class="info-content">
            <div class="info-item">
              <span class="item-label">支持语言:</span>
              <span class="item-value">{{ supportedLanguages.length }} 种</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">覆盖国家:</span>
              <span class="item-value">{{ countryCount }} 个</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">用户分布:</span>
              <span class="item-value">{{ topCountries.join(', ') }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-card">
          <h3 class="info-title">🔧 技术栈</h3>
          <div class="info-content">
            <div class="info-item">
              <span class="item-label">前端框架:</span>
              <span class="item-value">Vue 3 + Pinia</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">后端技术:</span>
              <span class="item-value">Node.js + Express</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">数据库:</span>
              <span class="item-value">MongoDB + Redis</span>
            </div>
            
            <div class="info-item">
              <span class="item-label">AI技术:</span>
              <span class="item-value">OCR + NLP</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 联系信息 -->
    <div class="contact-section">
      <h2 class="section-title">📞 联系我们</h2>
      
      <div class="contact-grid">
        <div class="contact-card">
          <div class="contact-icon">📧</div>
          <h3 class="contact-title">商务合作</h3>
          <p class="contact-email">business@readmemo.com</p>
          <p class="contact-description">寻求合作机会</p>
        </div>
        
        <div class="contact-card">
          <div class="contact-icon">💼</div>
          <h3 class="contact-title">媒体联系</h3>
          <p class="contact-email">media@readmemo.com</p>
          <p class="contact-description">采访和报道</p>
        </div>
        
        <div class="contact-card">
          <div class="contact-icon">👥</div>
          <h3 class="contact-title">加入我们</h3>
          <p class="contact-email">careers@readmemo.com</p>
          <p class="contact-description">招聘信息</p>
        </div>
        
        <div class="contact-card">
          <div class="contact-icon">💡</div>
          <h3 class="contact-title">产品建议</h3>
          <p class="contact-email">feedback@readmemo.com</p>
          <p class="contact-description">功能建议和反馈</p>
        </div>
      </div>
    </div>

    <!-- 社交媒体 -->
    <div class="social-section">
      <h2 class="section-title">🌐 关注我们</h2>
      
      <div class="social-links">
        <button class="social-link" @click="openWeChat">
          <span class="social-icon">💬</span>
          <span class="social-label">微信公众号</span>
        </button>
        
        <button class="social-link" @click="openWeibo">
          <span class="social-icon">🐦</span>
          <span class="social-label">微博</span>
        </button>
        
        <button class="social-link" @click="openZhihu">
          <span class="social-icon">📚</span>
          <span class="social-label">知乎专栏</span>
        </button>
        
        <button class="social-link" @click="openBilibili">
          <span class="social-icon">🎬</span>
          <span class="social-label">B站</span>
        </button>
        
        <button class="social-link" @click="openGitHub">
          <span class="social-icon">💻</span>
          <span class="social-label">GitHub</span>
        </button>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="copyright-section">
      <p class="copyright-text">
        © {{ currentYear }} 阅记星 (ReadMemo) 版权所有
      </p>
      <p class="copyright-subtext">
        本应用受中华人民共和国著作权法和国际公约保护
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatNumber } from '@/utils/formatter'

// 应用信息
const appVersion = ref('2.5.0')
const releaseDate = ref('2024-01-15')

const changelog = ref([
  '新增离线模式，支持无网络环境下学习',
  '优化OCR识别准确率，提升20%',
  '新增智能复习算法，学习更高效',
  '改进用户界面，提升使用体验',
  '修复已知问题，提升应用稳定性'
])

// 统计数据
const userCount = ref(125000)
const documentCount = ref(450000)
const vocabularyCount = ref(3800000)
const reviewCount = ref(12500000)

// 国际化信息
const supportedLanguages = ref(['中文', '英语', '日语', '韩语', '法语', '德语', '西班牙语'])
const countryCount = ref(35)
const topCountries = ref(['中国', '美国', '日本', '韩国', '英国'])

// 当前年份
const currentYear = computed(() => {
  return new Date().getFullYear()
})

// 方法
const openPrivacyPolicy = () => {
  window.open('/privacy-policy', '_blank')
}

const openTermsOfService = () => {
  window.open('/terms-of-service', '_blank')
}

const openCookiePolicy = () => {
  window.open('/cookie-policy', '_blank')
}

const openOpenSource = () => {
  window.open('/open-source', '_blank')
}

const openWeChat = () => {
  alert('请搜索微信公众号：阅记星')
}

const openWeibo = () => {
  window.open('https://weibo.com/readmemo', '_blank')
}

const openZhihu = () => {
  window.open('https://zhuanlan.zhihu.com/readmemo', '_blank')
}

const openBilibili = () => {
  window.open('https://space.bilibili.com/readmemo', '_blank')
}

const openGitHub = () => {
  window.open('https://github.com/readmemo', '_blank')
}
</script>

<style scoped>
.about-us-view {
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

.intro-section,
.features-section,
.team-section,
.version-section,
.legal-section,
.app-info-section,
.contact-section,
.social-section {
  background: white;
  border-radius: 32px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
}

.intro-content {
  display: flex;
  align-items: center;
  gap: 40px;
}

.intro-text {
  flex: 1;
}

.intro-title {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  color: #ff6b9d;
  margin: 0 0 16px;
}

.intro-description,
.intro-mission {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px;
}

.intro-image {
  flex: 0 0 200px;
}

.image-placeholder {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.image-icon {
  font-size: 80px;
}

.section-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.features-grid,
.team-grid,
.app-info-grid,
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card,
.team-card,
.info-card,
.contact-card {
  background: #f9f9f9;
  border-radius: 24px;
  padding: 20px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
  text-align: center;
}

.feature-card:hover,
.team-card:hover,
.info-card:hover,
.contact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ffd591;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-title,
.team-name,
.info-title,
.contact-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  margin: 0 0 8px;
}

.feature-description,
.team-bio,
.contact-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.team-avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #118ab2 0%, #06d6a0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-emoji {
  font-size: 40px;
}

.team-role {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #ff6b9d;
  font-weight: 600;
  margin: 0 0 12px;
}

.version-info {
  background: #f9f9f9;
  border-radius: 24px;
  padding: 20px;
}

.version-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #ddd;
}

.version-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* 继续CSS部分 */

.version-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  font-weight: 600;
  min-width: 100px;
  flex-shrink: 0;
}

.version-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  margin-left: 12px;
}

.version-changelog {
  margin-left: 12px;
  flex: 1;
}

.version-changelog ul {
  margin: 0;
  padding-left: 20px;
}

.version-changelog li {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.version-link {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #87CEEB;
  text-decoration: none;
  margin-left: 12px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.version-link:hover {
  color: #6495ED;
  text-decoration: underline;
}

.legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.legal-link {
  background: linear-gradient(135deg, #87CEEB 0%, #ADD8E6 100%);
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.legal-link:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 20px rgba(135, 206, 235, 0.4);
}

.legal-link:active {
  transform: translateY(0) scale(0.98);
}

.app-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.info-card {
  background: #f9f9f9;
  border-radius: 25px;
  padding: 20px;
  border: 3px solid #e0e0e0;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #FFD700;
}

.info-title {
  font-family: 'Kalam', cursive;
  font-size: 20px;
  color: #87CEEB;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px dashed #e0e0e0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e0e0e0;
}

.info-item:last-child {
  border-bottom: none;
}

.item-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.item-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.contact-card {
  background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
  border-radius: 25px;
  padding: 24px;
  text-align: center;
  border: 3px solid #90EE90;
  transition: all 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(144, 238, 144, 0.3);
  border-color: #FFB6C1;
}

.contact-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.contact-title {
  font-family: 'Kalam', cursive;
  font-size: 20px;
  color: #87CEEB;
  margin: 0 0 8px;
}

.contact-email {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  margin: 0 0 8px;
  word-break: break-all;
}

.contact-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #666;
  margin: 0;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.social-link {
  background: linear-gradient(135deg, #FFD700 0%, #FFB6C1 100%);
  border: none;
  border-radius: 25px;
  padding: 16px 24px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.social-link:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4);
}

.social-link:active {
  transform: translateY(0) scale(0.98);
}

.social-icon {
  font-size: 20px;
}

.social-label {
  font-family: 'Kalam', cursive;
  font-size: 16px;
}

.copyright-section {
  text-align: center;
  padding: 32px 24px;
  background: white;
  border-radius: 25px;
  margin-top: 24px;
  border: 3px dashed #87CEEB;
}

.copyright-text {
  font-family: 'Kalam', cursive;
  font-size: 18px;
  color: #87CEEB;
  margin: 0 0 8px;
  font-weight: 600;
}

.copyright-subtext {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #666;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-us-view {
    padding: 16px;
  }
  
  .page-title {
    font-size: 36px;
  }
  
  .intro-content {
    flex-direction: column;
    text-align: center;
  }
  
  .intro-image {
    margin-top: 24px;
  }
  
  .features-grid,
  .team-grid,
  .app-info-grid,
  .contact-grid {
    grid-template-columns: 1fr;
  }
  
  .legal-links,
  .social-links {
    flex-direction: column;
    align-items: stretch;
  }
  
  .legal-link,
  .social-link {
    justify-content: center;
  }
  
  .version-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .version-value,
  .version-link {
    margin-left: 0;
    margin-top: 4px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 28px;
  }
  
  .page-subtitle {
    font-size: 16px;
  }
  
  .intro-title,
  .section-title {
    font-size: 24px;
  }
  
  .intro-section,
  .features-section,
  .team-section,
  .version-section,
  .legal-section,
  .app-info-section,
  .contact-section,
  .social-section {
    padding: 20px;
    border-radius: 20px;
  }
  
  .feature-card,
  .team-card,
  .info-card,
  .contact-card {
    padding: 16px;
  }
}

/* 动画效果 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.image-placeholder {
  animation: bounce 3s ease-in-out infinite;
}

.feature-card:hover .feature-icon,
.contact-card:hover .contact-icon {
  animation: bounce 0.5s ease;
}

/* 添加一些装饰性元素 */
.about-us-view::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(255, 214, 0, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 90% 30%, rgba(135, 206, 235, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 50% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 20%);
  pointer-events: none;
  z-index: -1;
}

/* 滚动条样式 */
.about-us-view::-webkit-scrollbar {
  width: 12px;
}

.about-us-view::-webkit-scrollbar-track {
  background: #f9f7f7;
  border-radius: 10px;
}

.about-us-view::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #87CEEB 0%, #FFD700 100%);
  border-radius: 10px;
  border: 3px solid #f9f7f7;
}

.about-us-view::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #6495ED 0%, #FFB6C1 100%);
}
</style>