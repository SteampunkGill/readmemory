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
/* 定义CSS变量 - 童趣风格 */
.settings-layout {
  --background-color: #fcf8e8; /* 奶油色背景 */
  --surface-color: #ffffff; /* 白色表面 */
  --primary-color: #87CEEB; /* 天蓝色主色调 */
  --primary-dark: #6495ED; /* 较深蓝色 */
  --primary-light: #ADD8E6; /* 较浅蓝色 */
  --accent-yellow: #FFD700; /* 柠檬黄 */
  --accent-pink: #FFB6C1; /* 桃粉色 */
  --accent-green: #90EE90; /* 草绿色 */
  --text-color-dark: #333333; /* 深灰文本 */
  --text-color-medium: #666666; /* 中灰文本 */
  --text-color-light: #999999; /* 浅灰文本 */
  --border-color: #e0e0e0; /* 柔和边框色 */
  
  --border-radius-sm: 12px;
  --border-radius-md: 20px;
  --border-radius-lg: 30px;
  --border-radius-xl: 50px;
  
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  
  --shadow-soft: 0 6px 15px rgba(135, 206, 235, 0.1);
  --shadow-medium: 0 10px 25px rgba(135, 206, 235, 0.2);
  --shadow-hard: 0 15px 35px rgba(135, 206, 235, 0.3);
  
  --transition-smooth: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 字体定义 */
  font-family: 'Quicksand', 'Comfortaa', 'Varela Round', sans-serif;
  line-height: 1.6;
}

/* 整体布局 */
.settings-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: var(--background-color);
  position: relative;
  overflow: hidden;
}

.settings-layout::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(135, 206, 235, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 左侧导航栏 */
.settings-nav {
  width: 260px;
  flex-shrink: 0;
  background-color: var(--surface-color);
  border-right: 4px wavy var(--accent-pink);
  padding: var(--spacing-lg) 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-soft);
  border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
}

.nav-title {
  font-size: 2rem;
  padding: 0 var(--spacing-lg);
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
  position: relative;
  display: inline-block;
}

.nav-title::after {
  content: "⚙️";
  position: absolute;
  right: var(--spacing-lg);
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.8rem;
  animation: spin 4s linear infinite;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.nav-list {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  gap: var(--spacing-xs);
}

.nav-item {
  display: block;
}

.nav-link {
  display: block;
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--text-color-medium);
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 600;
  transition: var(--transition-smooth);
  cursor: pointer;
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
  border-left: 6px solid transparent;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(135, 206, 235, 0.1) 0%, 
    transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.nav-link:hover {
  color: var(--primary-dark);
  background-color: var(--primary-light);
  transform: translateX(5px);
}

.nav-link:hover::before {
  opacity: 1;
}

.nav-link.active {
  background-color: var(--primary-color);
  color: white;
  font-weight: 700;
  border-left-color: var(--accent-yellow);
  transform: translateX(10px);
  box-shadow: var(--shadow-medium);
}

.nav-link.active::after {
  content: "✨";
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  animation: twinkle 2s infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 右侧内容区域 */
.settings-content {
  flex-grow: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.settings-page {
  animation: slideIn 0.5s var(--transition-bounce);
  max-width: 800px;
  margin: 0 auto;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 页面标题 */
.page-title {
  font-size: 2.5rem;
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  font-weight: 700;
  text-shadow: 3px 3px 6px rgba(135, 206, 235, 0.3);
  position: relative;
  padding-bottom: var(--spacing-sm);
}

.page-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100px;
  height: 6px;
  background: linear-gradient(90deg, 
    var(--primary-color), 
    var(--accent-yellow));
  border-radius: 3px;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  font-weight: 700;
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
  position: relative;
  padding-left: var(--spacing-sm);
}

.section-title::before {
  content: "📌";
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
}

/* 表单组 */
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  padding-left: var(--spacing-xs);
}

/* 输入框样式 */
input[type="text"],
input[type="email"],
input[type="password"],
textarea,
select {
  width: 100%;
  max-width: 500px;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 3px solid var(--primary-color);
  font-size: 1.1rem;
  font-family: 'Quicksand', sans-serif;
  transition: var(--transition-smooth);
  background-color: var(--background-color);
  color: var(--text-color-dark);
  box-shadow: var(--shadow-soft);
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--accent-yellow);
  box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3);
  transform: translateY(-2px);
}

textarea {
  min-height: 150px;
  resize: vertical;
}

/* 按钮样式 */
.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius-xl);
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 700;
  transition: var(--transition-smooth);
  display: inline-block;
  font-family: 'Quicksand', sans-serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  margin-right: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.btn::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 6px 12px rgba(135, 206, 235, 0.3);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-secondary {
  background-color: var(--primary-light);
  color: var(--text-color-dark);
  box-shadow: 0 4px 8px rgba(173, 216, 230, 0.3);
}

.btn-secondary:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(135, 206, 235, 0.4);
}

.btn-danger {
  background-color: #ff7675;
  color: white;
  box-shadow: 0 6px 12px rgba(255, 118, 117, 0.3);
}

.btn-danger:hover {
  background-color: #ff5252;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 24px rgba(255, 118, 117, 0.4);
}

/* 个人资料页面 */
.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 4px solid var(--primary-light);
  box-shadow: var(--shadow-soft);
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-right: var(--spacing-lg);
  border: 6px solid var(--primary-color);
  box-shadow: var(--shadow-medium);
  transition: var(--transition-smooth);
  cursor: pointer;
}

.profile-avatar:hover {
  transform: scale(1.1) rotate(10deg);
  border-color: var(--accent-yellow);
}

/* 账户安全页面 */
.device-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 600px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border: 3px solid var(--primary-light);
  border-radius: var(--border-radius-md);
  background-color: var(--surface-color);
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-soft);
}

.device-item:hover {
  transform: translateX(5px);
  border-color: var(--accent-yellow);
  box-shadow: var(--shadow-medium);
}

.device-name {
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
}

.device-info {
  font-size: 0.9rem;
  color: var(--text-color-light);
}

/* 订阅管理页面 */
.subscription-card {
  background: var(--surface-color);
  border: 4px solid var(--primary-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  max-width: 500px;
  box-shadow: var(--shadow-hard);
  position: relative;
  overflow: hidden;
}

.subscription-card::before {
  content: "👑";
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 4rem;
  opacity: 0.1;
  transform: rotate(30deg);
}

.subscription-card .plan-name {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-md);
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.2);
}

.subscription-card span {
  font-weight: 700;
  color: var(--primary-dark);
}

/* 通知设置页面 */
.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 3px dotted var(--border-color);
  max-width: 500px;
  transition: var(--transition-smooth);
}

.notification-item:hover {
  background-color: rgba(173, 216, 230, 0.1);
  transform: translateX(5px);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item div:first-child {
  font-weight: 600;
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
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
  transition: .4s;
  border-radius: 34px;
  border: 3px solid transparent;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--primary-color);
  border-color: var(--primary-dark);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* 学习统计页面 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  background: var(--surface-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  text-align: center;
  border: 4px solid var(--primary-light);
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.03);
  border-color: var(--accent-yellow);
  box-shadow: var(--shadow-hard);
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(135, 206, 235, 0.1) 0%, 
    rgba(255, 215, 0, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.3);
  position: relative;
  z-index: 1;
}

.stat-label {
  color: var(--text-color-medium);
  font-weight: 600;
  font-size: 1.1rem;
  position: relative;
  z-index: 1;
}

/* 成就徽章页面 */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-lg);
}

.badge-card {
  background: var(--surface-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  text-align: center;
  border: 4px solid var(--primary-light);
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.badge-card:hover {
  transform: translateY(-8px) scale(1.05);
  border-color: var(--accent-yellow);
  box-shadow: var(--shadow-hard);
}

.badge-card img {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-sm);
  transition: var(--transition-smooth);
}

.badge-card:hover img {
  transform: scale(1.1) rotate(5deg);
}

.badge-card div {
  font-weight: 600;
  color: var(--text-color-dark);
  font-family: 'Quicksand', sans-serif;
}

.badge-card.locked {
  filter: grayscale(100%);
  opacity: 0.6;
}

.badge-card.locked::after {
  content: "🔒";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  opacity: 0.8;
}

/* 关于我们页面 */
.about-section {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 4px solid var(--primary-color);
  box-shadow: var(--shadow-hard);
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.about-section::before {
  content: "🌟";
  position: absolute;
  top: -30px;
  left: -30px;
  font-size: 4rem;
  opacity: 0.1;
  transform: rotate(45deg);
}

.about-section img {
  width: 120px;
  margin-bottom: var(--spacing-md);
  border-radius: 50%;
  border: 6px solid var(--accent-yellow);
  box-shadow: var(--shadow-medium);
  transition: var(--transition-smooth);
}

.about-section img:hover {
  transform: rotate(15deg) scale(1.1);
}

.app-name {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--primary-dark);
  font-family: 'Kalam', cursive;
  text-shadow: 2px 2px 4px rgba(135, 206, 235, 0.3);
}

.app-version {
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-lg);
  font-weight: 600;
  font-size: 1.1rem;
}

.app-description {
  color: var(--text-color-medium);
  line-height: 1.8;
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
    border-right: none;
    border-bottom: 4px wavy var(--accent-pink);
    border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  }
  
  .nav-list {
    flex-direction: row;
    overflow-x: auto;
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
  }
  
  .nav-link {
    white-space: nowrap;
    border-radius: var(--border-radius-md);
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  
  .nav-link.active {
    border-bottom-color: var(--accent-yellow);
    transform: translateY(0);
  }
  
  .settings-content {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .stats-grid,
  .badge-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .btn {
    width: 100%;
    margin-right: 0;
    margin-bottom: var(--spacing-sm);
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-avatar {
    margin-right: 0;
    margin-bottom: var(--spacing-md);
  }
  
  .device-item {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
}
</style>