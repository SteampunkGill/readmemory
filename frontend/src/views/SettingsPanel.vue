<template>
  <div class="settings-layout">
    <div class="settings-nav">
      <div class="nav-title">设置</div>
      <div class="nav-list">
        <div class="nav-item"><div class="nav-link" @click="showPage('profile')" :class="{ active: activePage === 'profile' }">个人资料</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('security')" :class="{ active: activePage === 'security' }">账户安全</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('subscription')" :class="{ active: activePage === 'subscription' }">订阅管理</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('notifications')" :class="{ active: activePage === 'notifications' }">通知设置</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('stats')" :class="{ active: activePage === 'stats' }">学习统计</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('badges')" :class="{ active: activePage === 'badges' }">成就徽章</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('help')" :class="{ active: activePage === 'help' }">帮助与反馈</div></div>
        <div class="nav-item"><div class="nav-link" @click="showPage('about')" :class="{ active: activePage === 'about' }">关于我们</div></div>
      </div>
    </div>

    <div class="settings-content">
      <!-- 个人资料 -->
      <div v-if="activePage === 'profile'" class="settings-page">
        <div class="page-title">个人资料</div>
        <div class="profile-header">
            <img :src="userProfile.avatar" alt="Avatar" class="profile-avatar">
            <div>
                <input type="text" v-model="userProfile.nickname">
            </div>
        </div>
        <div class="form-group">
            <div class="form-label">电子邮箱</div>
            <input type="email" :value="userProfile.email" readonly>
        </div>
        <div class="form-group">
            <div class="form-label">个人简介</div>
            <textarea v-model="userProfile.bio"></textarea>
        </div>
        <div class="btn btn-primary" @click="saveProfile">保存</div>
      </div>

      <!-- 账户安全 -->
      <div v-if="activePage === 'security'" class="settings-page">
        <div class="page-title">账户安全</div>
        <div class="section-title">修改密码</div>
        <div class="form-group">
            <div class="form-label">旧密码</div>
            <input type="password" v-model="passwords.old">
        </div>
        <div class="form-group">
            <div class="form-label">新密码</div>
            <input type="password" v-model="passwords.new">
        </div>
        <div class="form-group">
            <div class="form-label">确认密码</div>
            <input type="password" v-model="passwords.confirm">
        </div>
        <div class="btn btn-primary" @click="updatePassword">更新密码</div>
        <div class="section-title" style="margin-top: 40px;">登录设备管理</div>
        <div class="device-list">
           <div v-for="(device, index) in loginDevices" :key="index" class="device-item">
              <div>
                  <div class="device-name">{{ device.device }}</div>
                  <div class="device-info">{{ device.location }} - {{ device.time }}</div>
              </div>
              <div class="btn btn-secondary">下线</div>
          </div>
        </div>
      </div>

      <!-- 订阅管理 -->
      <div v-if="activePage === 'subscription'" class="settings-page">
        <div class="page-title">订阅管理</div>
        <div class="subscription-card">
             <div class="plan-name">{{ subscription.plan }}</div>
             <div>到期日期: <span>{{ subscription.expiry }}</span></div>
             <div>价格: <span>{{ subscription.price }}</span>/月</div>
             <div class="btn btn-primary" @click="switchPlan">切换计划</div>
             <div class="btn btn-danger" @click="cancelSubscription">取消订阅</div>
        </div>
      </div>
      
      <!-- 通知设置 -->
      <div v-if="activePage === 'notifications'" class="settings-page">
          <div class="page-title">通知设置</div>
          <div class="notification-item">
              <div>邮件通知</div>
              <div class="switch"><input type="checkbox" v-model="notificationSettings.email"><div class="slider"></div></div>
          </div>
           <div class="notification-item">
              <div>系统推送</div>
              <div class="switch"><input type="checkbox" v-model="notificationSettings.push"><div class="slider"></div></div>
          </div>
           <div class="notification-item">
              <div>活动提醒</div>
              <div class="switch"><input type="checkbox" v-model="notificationSettings.activity"><div class="slider"></div></div>
          </div>
      </div>

      <!-- 学习统计 -->
      <div v-if="activePage === 'stats'" class="settings-page">
        <div class="page-title">学习统计</div>
        <div class="stats-grid">
            <div v-for="(stat, index) in learningStats" :key="index" class="stat-card">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
            </div>
        </div>
      </div>

      <!-- 成就徽章 -->
      <div v-if="activePage === 'badges'" class="settings-page">
          <div class="page-title">成就徽章</div>
          <div class="badge-grid">
              <div v-for="(badge, index) in achievementBadges" :key="index" :class="['badge-card', { locked: !badge.acquired }]">
                  <img :src="badge.img" :alt="badge.name">
                  <div>{{ badge.name }}</div>
              </div>
          </div>
      </div>

      <!-- 帮助与反馈 -->
      <div v-if="activePage === 'help'" class="settings-page">
        <div class="page-title">帮助与反馈</div>
        <div @submit.prevent="submitFeedback">
            <div class="form-group">
                <div class="form-label">问题类型</div>
                <select v-model="feedback.type">
                    <option>功能建议</option>
                    <option>Bug反馈</option>
                    <option>内容错误</option>
                    <option>其他</option>
                </select>
            </div>
            <div class="form-group">
                <div class="form-label">反馈内容</div>
                <textarea v-model="feedback.content" required></textarea>
            </div>
            <div class="btn btn-primary" @click="submitFeedback">提交</div>
        </div>
      </div>

      <!-- 关于我们 -->
      <div v-if="activePage === 'about'" class="settings-page">
        <div class="page-title">关于我们</div>
        <div class="about-section">
            <img src="https://vuejs.org/images/logo.png" alt="App Logo">
            <div class="app-name">ReadMemo App</div>
            <div class="app-version">版本 V1.0.0</div>
            <div class="app-description">这是一款致力于帮助用户高效阅读和记忆的应用程序。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const activePage = ref('profile');

const showPage = (page) => {
  activePage.value = page;
};

// --- 示例数据 ---

// 1. 个人资料
const userProfile = ref({
    nickname: '爱学习的小明',
    email: 'xiaoming@example.com',
    bio: '一名热爱阅读和编程的前端开发者。',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
});
const saveProfile = () => {
    alert('资料已保存');
};

// 2. 账户安全
const passwords = ref({ old: '', new: '', confirm: '' });
const loginDevices = ref([
    { device: 'Chrome on Windows', location: '上海', time: '2025-12-16 10:30' },
    { device: 'iPhone 15 Pro', location: '北京', time: '2025-12-15 20:05' },
    { device: 'Safari on MacBook Pro', location: '上海', time: '2025-12-14 11:12' }
]);
const updatePassword = () => {
    passwords.value = { old: '', new: '', confirm: '' };
    alert('密码更新成功');
};

// 3. 订阅管理
const subscription = ref({
    plan: '高级会员',
    expiry: '2026-12-31',
    price: '¥25'
});
const switchPlan = () => alert('切换计划功能暂未开放。');
const cancelSubscription = () => alert('您已取消订阅。');


// 4. 通知设置
const notificationSettings = ref({
    email: true,
    push: true,
    activity: false
});

// 5. 学习统计
const learningStats = ref([
    { label: '累计学习时长', value: '128 小时' },
    { label: '完成课程数', value: '32 门' },
    { label: '连续学习天数', value: '78 天' }
]);

// 6. 成就徽章
const achievementBadges = ref([
    { name: '初学者', img: 'https://img.icons8.com/color/96/000000/laurel-wreath.png', acquired: true },
    { name: '阅读达人', img: 'https://img.icons8.com/color/96/000000/medal2.png', acquired: true },
    { name: '学霸', img: 'https://img.icons8.com/color/96/000000/trophy.png', acquired: true },
    { name: '评论家', img: 'https://img.icons8.com/color/96/000000/filled-star.png', acquired: true },
    { name: '夜猫子', img: 'https://img.icons8.com/color/96/000000/crescent-moon.png', acquired: false },
    { name: '全勤奖', img: 'https://img.icons8.com/color/96/000000/calendar-plus.png', acquired: false }
]);

// 7. 帮助与反馈
const feedback = ref({ type: '功能建议', content: '' });
const submitFeedback = () => {
    feedback.value = { type: '功能建议', content: '' };
    alert('反馈已提交，感谢您的支持！');
};

</script>

<style scoped>
/* 导入字体 */
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Quicksand:wght@400;500;700&display=swap');

/* CSS 变量定义 */
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
  
  /* 圆角大小 */
  --border-radius-sm: 8px;
  --border-radius-md: 16px;
  --border-radius-lg: 24px;
  --border-radius-xl: 40px;
  
  /* 间距 */
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
}

.settings-layout {
  min-height: 100vh;
  background-color: var(--background-color);
  display: flex;
  font-family: var(--font-body);
  padding: var(--spacing-xl);
  gap: var(--spacing-xl);
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 左侧导航栏 */
.settings-nav {
  width: 280px;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 4px solid var(--accent-pink);
  position: sticky;
  top: var(--spacing-xl);
  height: fit-content;
}

.nav-title {
  font-family: var(--font-heading);
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  padding-bottom: var(--spacing-sm);
  border-bottom: 3px dashed var(--accent-yellow);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-link {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  font-size: 18px;
  font-weight: 500;
  color: var(--text-color-dark);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: rgba(173, 216, 230, 0.1);
  border: 2px solid transparent;
  position: relative;
  z-index: 1;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
  z-index: -1;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  transform: translateX(10px) scale(1.05);
  background-color: var(--primary-light);
  color: var(--primary-dark);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.nav-link.active {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-green));
  color: white;
  font-weight: bold;
  border-color: var(--primary-dark);
  transform: translateX(5px);
  box-shadow: var(--shadow-md);
}

.nav-link.active::after {
  content: '✨';
  position: absolute;
  right: var(--spacing-md);
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 右侧内容区域 */
.settings-content {
  flex: 1;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 4px dashed var(--accent-green);
  min-height: 600px;
}

.settings-page {
  animation: slide-up 0.4s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  font-family: var(--font-heading);
  font-size: 36px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 4px solid var(--accent-yellow);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-title::before {
  content: '⚙️';
  font-size: 32px;
  animation: spin-slow 10s linear infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 个人资料页面 */
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(255, 214, 0, 0.1));
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--primary-color);
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--accent-pink);
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease;
}

.profile-header input[type="text"] {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-dark);
  background: none;
  border: 3px solid var(--accent-yellow);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  outline: none;
  transition: all 0.3s ease;
}

.profile-header input[type="text"]:focus {
  box-shadow: 0 0 0 4px rgba(255, 214, 0, 0.4);
  transform: scale(1.02);
}

/* 表单通用样式 */
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.form-label::before {
  content: '📝';
}

input, textarea, select {
  width: 100%;
  padding: var(--spacing-md);
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

input:focus, textarea:focus, select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 6px rgba(135, 206, 235, 0.4);
  transform: scale(1.02);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

input[readonly] {
  background-color: rgba(173, 216, 230, 0.2);
  border-color: var(--border-color);
  color: var(--text-color-medium);
  cursor: not-allowed;
}

/* 按钮样式 */
.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-green));
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary-dark), #7cd87c);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--accent-yellow), #ffed4e);
  color: var(--text-color-dark);
}

.btn-secondary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, #e6c200, #ffed4e);
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  color: white;
}

.btn-danger:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, #ff5252, #ff7b7b);
}

/* 账户安全页面 */
.section-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--primary-color);
  margin: var(--spacing-lg) 0 var(--spacing-md);
  padding-left: var(--spacing-md);
  border-left: 4px solid var(--accent-pink);
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: rgba(144, 238, 144, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-green);
  transition: all 0.3s ease;
}

.device-item:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-sm);
  background-color: rgba(144, 238, 144, 0.2);
}

.device-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.device-info {
  font-size: 14px;
  color: var(--text-color-medium);
}

/* 订阅管理页面 */
.subscription-card {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.2), rgba(255, 214, 0, 0.2));
  border-radius: var(--border-radius-lg);
  border: 4px solid var(--primary-color);
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: var(--shadow-lg);
}

.plan-name {
  font-family: var(--font-heading);
  font-size: 32px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-md);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.subscription-card div {
  font-size: 18px;
  color: var(--text-color-dark);
  margin-bottom: var(--spacing-sm);
}

.subscription-card span {
  font-weight: bold;
  color: var(--primary-color);
}

.subscription-card .btn {
  margin: var(--spacing-sm);
  min-width: 180px;
}

/* 通知设置页面 */
.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: rgba(255, 182, 193, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-pink);
  margin-bottom: var(--spacing-md);
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateX(5px);
  background-color: rgba(255, 182, 193, 0.2);
}

.notification-item div:first-child {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-dark);
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 70px;
  height: 38px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: var(--border-radius-xl);
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 30px;
  width: 30px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .slider {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-green));
}

input:checked + .slider:before {
  transform: translateX(32px);
}

/* 学习统计页面 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.stat-card {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.2), rgba(255, 214, 0, 0.2));
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--primary-color);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: var(--shadow-lg);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 36px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 16px;
  color: var(--text-color-medium);
  font-weight: bold;
}

/* 成就徽章页面 */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.badge-card {
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(255, 214, 0, 0.2), rgba(144, 238, 144, 0.2));
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-yellow);
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.badge-card:hover {
  transform: translateY(-5px) rotate(5deg);
  box-shadow: var(--shadow-lg);
}

.badge-card.locked {
  filter: grayscale(1);
  opacity: 0.6;
  border-color: var(--border-color);
}

.badge-card.locked:hover {
  transform: none;
  cursor: not-allowed;
}

.badge-card img {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-sm);
  transition: transform 0.3s ease;
}

.badge-card:not(.locked):hover img {
  transform: scale(1.2);
}

.badge-card div {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-dark);
}

/* 关于我们页面 */
.about-section {
  text-align: center;
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(255, 182, 193, 0.1));
  border-radius: var(--border-radius-lg);
  border: 4px dashed var(--primary-color);
  max-width: 500px;
  margin: 0 auto;
}

.about-section img {
  width: 120px;
  height: 120px;
  margin-bottom: var(--spacing-lg);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.app-name {
  font-family: var(--font-heading);
  font-size: 32px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
}

.app-version {
  font-size: 18px;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-lg);
  background-color: rgba(255, 214, 0, 0.2);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  display: inline-block;
}

.app-description {
  font-size: 18px;
  color: var(--text-color-dark);
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .settings-layout {
    flex-direction: column;
    padding: var(--spacing-md);
  }
  
  .settings-nav {
    width: 100%;
    position: static;
  }
  
  .nav-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-link {
    min-width: 140px;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .badge-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .device-item {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 28px;
  }
  
  .nav-link {
    font-size: 16px;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 16px;
  }
}
</style>