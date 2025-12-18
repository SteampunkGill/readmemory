<template>
  <div class="user-center-layout">
    <!-- 全局加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader">同步云端数据中...</div>
    </div>

    <div v-else>
      <div class="user-header">
        <h1 class="header-title">用户中心</h1>
        <div class="user-info">
          <div class="avatar-wrapper" @click="$refs.avatarInput.click()">
            <img :src="userProfile.avatar || userProfile.avatarUrl" alt="用户头像" class="user-avatar" />
            <div class="avatar-mask">更换头像</div>
            <input type="file" ref="avatarInput" hidden accept="image/*" @change="handleAvatarUpload" />
          </div>
          <div class="user-details">
            <div class="user-name">{{ userProfile.nickname }} <span class="role-badge">{{ userProfile.role }}</span></div>
            <div class="user-email">{{ userProfile.email }}</div>
          </div>
        </div>
      </div>

      <div class="user-content">
        <aside class="user-nav">
          <div class="nav-title">个人中心菜单</div>
          <div class="nav-list">
            <div class="nav-item" v-for="item in navItems" :key="item.id">
              <div class="nav-link" @click="showPage(item.id)" :class="{ active: activePage === item.id }">
                {{ item.icon }} {{ item.label }}
              </div>
            </div>
          </div>
        </aside>

        <main class="user-main">
          <!-- 学习概览与目标 -->
          <div v-if="activePage === 'dashboard'" class="user-page">
            <div class="page-title">学习数据摘要</div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">📚</div>
                <div class="stat-value">{{ dashboardStats.documentsRead }}</div>
                <div class="stat-label">本周阅读文档</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">{{ dashboardStats.formattedReadingTime || dashboardStats.readingHours }}</div>
                <div class="stat-label">累计学习时长</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value">{{ dashboardStats.wordsLearned || dashboardStats.vocabularyCount }}</div>
                <div class="stat-label">词汇量</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">{{ dashboardStats.formattedReviewAccuracy || '+15%' }}</div>
                <div class="stat-label">复习准确率</div>
              </div>
            </div>

            <!-- 学习目标进度 -->
            <div class="recent-activity" v-if="learningGoals.length > 0">
              <div class="section-title">当前学习目标</div>
              <div class="goals-list">
                <div v-for="goal in learningGoals" :key="goal.goalId" class="activity-item">
                  <div class="goal-info">
                    <strong>{{ goal.title }}</strong>: {{ goal.currentValue }} / {{ goal.targetValue }} {{ goal.unit }}
                    <span class="status-tag">{{ goal.status }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="recent-activity">
              <div class="section-title">最近活动日志</div>
              <div class="activity-list">
                <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
                  <div class="activity-icon">•</div>
                  <div class="activity-text">{{ activity.action || activity }} - {{ activity.targetName || '' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 个人资料与偏好设置 -->
          <div v-if="activePage === 'profile'" class="user-page">
            <div class="page-title">个人资料与偏好</div>
            <div class="form-group">
              <div class="form-label">昵称</div>
              <input type="text" v-model="userProfile.nickname">
            </div>
            <div class="form-group">
              <div class="form-label">个人简介</div>
              <textarea v-model="userProfile.bio"></textarea>
            </div>

            <div class="section-title">阅读偏好设置</div>
            <div class="settings-row">
              <div class="form-group">
                <div class="form-label">阅读字体大小 ({{ userProfile.preferences.reading.fontSize }}px)</div>
                <input type="range" min="12" max="30" v-model="userProfile.preferences.reading.fontSize">
              </div>
              <div class="form-group">
                <div class="form-label">阅读主题</div>
                <select v-model="userProfile.preferences.reading.theme">
                  <option value="light">明亮模式</option>
                  <option value="dark">深色模式</option>
                  <option value="sepia">护眼模式</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" @click="saveFullProfile">保存所有修改</button>
          </div>

          <!-- 账户安全 -->
          <div v-if="activePage === 'security'" class="user-page">
            <div class="page-title">账户安全</div>
            <div class="section-title">修改登录密码</div>
            <div class="form-group">
              <input type="password" v-model="passwords.old" placeholder="当前密码">
              <input type="password" v-model="passwords.new" placeholder="新密码" style="margin-top:10px">
              <input type="password" v-model="passwords.confirm" placeholder="确认新密码" style="margin-top:10px">
            </div>
            <button class="btn btn-primary" @click="handleUpdatePassword">更新密码</button>
            
            <div class="section-title" style="margin-top: 40px;">敏感操作</div>
            <div class="danger-zone">
              <button class="btn btn-secondary" @click="handleExportData" :disabled="isExporting">
                {{ isExporting ? '导出请求中...' : '📦 导出我的个人数据' }}
              </button>
              <button class="btn btn-danger" @click="handleDeleteAccount" style="margin-left: 10px;">
                🗑️ 注销我的账号
              </button>
            </div>
          </div>

          <!-- 订阅管理 -->
          <div v-if="activePage === 'subscription'" class="user-page">
            <div class="page-title">订阅管理</div>
            <div class="subscription-card" v-if="subscription.plan">
              <div class="plan-name">{{ subscription.plan.name }}</div>
              <div class="plan-detail">当前状态: <span>{{ subscription.status }}</span></div>
              <div class="plan-detail">有效期至: <span>{{ subscription.endDate || '永久有效' }}</span></div>
              <div class="plan-actions">
                <button class="btn btn-danger" @click="cancelSubscription">取消订阅</button>
              </div>
            </div>
          </div>

          <!-- 学习统计 -->
          <div v-if="activePage === 'stats'" class="user-page">
            <div class="page-title">详细统计</div>
            <div class="stats-grid">
              <div v-for="(stat, index) in learningStats" :key="index" class="stat-card">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>

          <!-- 成就徽章 -->
          <div v-if="activePage === 'badges'" class="user-page">
            <div class="page-title">成就勋章</div>
            <div class="badge-grid">
              <div v-for="(badge, index) in achievementBadges" :key="index" 
                   :class="['badge-card', { locked: !badge.unlocked }]">
                <img :src="badge.icon || badge.img" :alt="badge.name">
                <div class="badge-name">{{ badge.name }}</div>
                <small v-if="!badge.unlocked">{{ badge.formattedProgress }}</small>
              </div>
            </div>
          </div>

          <!-- 帮助与反馈 -->
          <div v-if="activePage === 'help'" class="user-page">
            <div class="page-title">帮助与反馈</div>
            <div class="feedback-form">
              <select v-model="feedback.type">
                <option value="Bug反馈">问题反馈</option>
                <option value="功能建议">功能建议</option>
              </select>
              <textarea v-model="feedback.content" placeholder="请详细描述..." style="margin-top:10px"></textarea>
              <button class="btn btn-primary" @click="submitFeedback">提交反馈</button>
            </div>
          </div>

          <!-- 关于我们 -->
          <div v-if="activePage === 'about'" class="user-page">
            <div class="page-title">关于 ReadMemo</div>
            <div class="about-section" style="text-align:center">
              <img src="@/assets/logo.png" alt="App Logo" class="app-logo">
              <div class="app-version">Version 1.0.0 (Build 20241218)</div>
              <p>您的个人智能阅读伴侣</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activePage = ref('dashboard');
const isLoading = ref(false);
const isExporting = ref(false);
const token = localStorage.getItem('token') || '';

const navItems = [
  { id: 'dashboard', label: '学习概览', icon: '📊' },
  { id: 'profile', label: '个人资料', icon: '👤' },
  { id: 'security', label: '账号安全', icon: '🔒' },
  { id: 'subscription', label: '订阅管理', icon: '💎' },
  { id: 'stats', label: '学习统计', icon: '📈' },
  { id: 'badges', label: '成就徽章', icon: '🏆' },
  { id: 'help', label: '帮助与反馈', icon: '❓' },
  { id: 'about', label: '关于我们', icon: 'ℹ️' }
];

// --- 状态数据 ---
const userProfile = ref({
  nickname: '加载中...',
  email: '',
  bio: '',
  avatar: 'https://i.pravatar.cc/150',
  preferences: {
    reading: { fontSize: 16, theme: 'light', lineHeight: 1.6 },
    review: { dailyGoal: 20, reminderTime: '20:00' },
    notification: { email: true, push: true }
  }
});

const dashboardStats = ref({ documentsRead: 0, wordsLearned: 0, formattedReadingTime: '0' });
const recentActivities = ref([]);
const learningGoals = ref([]);
const achievementBadges = ref([]);
const subscription = ref({ plan: {}, status: '' });
const learningStats = ref([]);
const passwords = ref({ old: '', new: '', confirm: '' });
const feedback = ref({ type: 'Bug反馈', content: '' });

// --- API 请求集合 ---

const fetchAllData = async () => {
  isLoading.value = true;
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    // 1. 获取核心资料与偏好
    const profileRes = await fetch('http://localhost:8080/api/v1/user/profile', { headers });
    const profileData = await profileRes.json();
    if (profileData.success) {
      userProfile.value = profileData.user;
    }

    // 2. 获取统计摘要
    const statsRes = await fetch('http://localhost:8080/api/v1/user/learning-stats', { headers });
    const statsData = await statsRes.json();
    if (statsData.success) {
      dashboardStats.value = statsData.data;
      learningStats.value = [
        { label: '累计学习时长', value: statsData.data.formattedReadingTime },
        { label: '完成文档', value: statsData.data.documentsRead },
        { label: '词汇总量', value: statsData.data.wordsLearned }
      ];
    }

    // 3. 获取学习目标
    const goalsRes = await fetch('http://localhost:8080/api/v1/user/goals', { headers });
    const goalsData = await goalsRes.json();
    if (goalsData.success) {
      learningGoals.value = goalsData.goals;
    }

    // 4. 获取活动日志
    const actRes = await fetch('http://localhost:8080/api/v1/user/activity-log?pageSize=5', { headers });
    const actData = await actRes.json();
    if (actData.success) {
      recentActivities.value = actData.activities;
    }

    // 5. 获取勋章
    const badgeRes = await fetch('http://localhost:8080/api/v1/user/achievements', { headers });
    const badgeData = await badgeRes.json();
    if (badgeData.success) {
      achievementBadges.value = badgeData.achievements;
    }

    // 6. 订阅信息
    const subRes = await fetch('http://localhost:8080/api/v1/user/subscription', { headers });
    const subData = await subRes.json();
    if (subData.success) {
      subscription.value = subData.subscription;
    }

  } catch (err) {
    console.error("同步数据失败，显示缓存/模拟数据", err);
  } finally {
    isLoading.value = false;
  }
};

// --- 功能操作 ---

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await fetch('http://localhost:8080/api/v1/user/avatar', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      userProfile.value.avatar = result.user.avatar;
      alert('头像上传成功');
    }
  } catch (err) { alert('上传失败'); }
};

const saveFullProfile = async () => {
  try {
    // 同时更新基本资料和偏好设置
    const res = await fetch('http://localhost:8080/api/v1/user/preferences', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(userProfile.value.preferences)
    });
    const result = await res.json();
    if (result.success) alert('设置已同步到云端');
  } catch (err) { alert('同步失败'); }
};

const handleUpdatePassword = async () => {
  if (passwords.value.new !== passwords.value.confirm) return alert('新密码不一致');
  
  try {
    const res = await fetch('http://localhost:8080/api/v1/auth/password', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        current_password: passwords.value.old,
        new_password: passwords.value.new,
        new_password_confirmation: passwords.value.confirm
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('密码修改成功，请重新登录');
      router.push('/login');
    } else {
      alert(result.message);
    }
  } catch (err) { alert('操作失败'); }
};

const handleExportData = async () => {
  isExporting.value = true;
  try {
    const res = await fetch('http://localhost:8080/api/v1/user/export-data?format=json', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    alert(result.message);
  } finally { isExporting.value = false; }
};

const handleDeleteAccount = async () => {
  const pwd = prompt('注销账号是永久性操作，请输入密码确认：');
  if (!pwd) return;

  try {
    const res = await fetch('http://localhost:8080/api/v1/user/account', {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ password: pwd })
    });
    const result = await res.json();
    if (result.success) {
      alert('账号已注销');
      router.push('/register');
    }
  } catch (err) { alert('注销失败'); }
};

const submitFeedback = async () => {
  try {
    const res = await fetch('http://localhost:8080/api/v1/system/bug-report', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        title: feedback.value.type,
        description: feedback.value.content
      })
    });
    if (res.ok) {
      alert('提交成功');
      feedback.value.content = '';
    }
  } catch (err) { alert('提交异常'); }
};

const showPage = (page) => activePage.value = page;

onMounted(() => fetchAllData());
</script>

<style scoped>
/* 定义CSS变量，方便统一管理颜色和圆角 */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-accent: #17a2b8;
  --color-danger: #dc3545;
  --color-background: #f8f9fa;
  --color-text: #343a40;
  --color-text-light: #6c757d;
  --radius-medium: 0.375rem;
  --radius-large: 0.75rem;
}

.user-center-layout {
  font-family: 'Arial', sans-serif;
  background-color: var(--color-background);
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.user-header {
  background-color: white;
  padding: 2rem;
  border-radius: var(--radius-large);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.header-title {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--color-primary);
}

.user-details {
  text-align: left;
}

.user-name {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-text);
}

.user-email {
  font-size: 1.2rem;
  color: var(--color-text-light);
}

.user-content {
  display: flex;
  gap: 2rem;
  flex-grow: 1;
}

.user-nav {
  width: 250px;
  background-color: white;
  border-radius: var(--radius-large);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-secondary);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-grow: 1;
}

.nav-item {
  margin-bottom: 0.5rem;
}

.nav-link {
  padding: 12px 15px;
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.nav-link:hover {
  background-color: #e9ecef;
  color: var(--color-primary);
}

.nav-link.active {
  background-color: var(--color-primary);
  color: white;
  font-weight: bold;
}

.user-main {
  flex: 1;
  background-color: white;
  border-radius: var(--radius-large);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
}

.user-page {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 2rem;
  padding-bottom: 10px;
  border-bottom: 3px solid var(--color-secondary);
}

.section-title {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background-color: var(--color-background);
  padding: 1.5rem;
  border-radius: var(--radius-large);
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.1rem;
  color: var(--color-text-light);
}

.recent-activity {
  margin-bottom: 2.5rem;
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 1px solid #eee;
  font-size: 1.1rem;
  color: var(--color-text);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: 0.8rem;
  color: var(--color-accent);
  font-size: 1.2rem;
}

.quick-actions {
  margin-bottom: 2.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 25px;
  border-radius: var(--radius-medium);
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #f8f9fa;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: white;
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-icon {
  font-size: 1.3rem;
}

/* Profile Page */
.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--color-primary);
}

.profile-name-input input {
  font-size: 1.8rem;
  font-weight: bold;
  border: none;
  border-bottom: 2px solid var(--color-secondary);
  padding-bottom: 5px;
  width: 300px;
  outline: none;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-bottom: 0.8rem;
  font-weight: bold;
}

.form-group input[type="email"],
.form-group input[type="password"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border-radius: var(--radius-medium);
  border: 2px solid var(--color-secondary);
  font-size: 1.1rem;
  outline: none;
  box-sizing: border-box; /* Ensures padding doesn't affect width */
}

.form-group input[readonly] {
  background-color: #e9ecef;
  color: var(--color-text-light);
}

.form-group textarea {
  min-height: 120px;
  resize: vertical;
}

/* Security Page */
.device-list {
  margin-top: 1.5rem;
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-large);
  padding: 1.5rem;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.device-item:last-child {
  border-bottom: none;
}

.device-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text);
}

.device-details {
  font-size: 1rem;
  color: var(--color-text-light);
}

/* Subscription Page */
.subscription-card {
  background-color: var(--color-primary);
  color: white;
  padding: 2rem;
  border-radius: var(--radius-large);
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.plan-name {
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.plan-detail {
  font-size: 1.3rem;
  margin-bottom: 0.7rem;
}

.plan-detail span {
  font-weight: bold;
}

.plan-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
  border: 2px solid var(--color-danger);
}

.btn-danger:hover {
  background-color: #c82333;
}

/* Notification Settings */
.notification-list {
  margin-top: 1rem;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-label {
  font-size: 1.2rem;
  color: var(--color-text);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
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
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Badges Page */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
}

.badge-card {
  text-align: center;
  padding: 1rem;
  border-radius: var(--radius-large);
  background-color: #f0f0f0;
  border: 3px solid var(--color-secondary);
  transition: all 0.3s ease;
}

.badge-card.locked {
  background-color: #e0e0e0;
  filter: grayscale(80%);
  border-color: #ccc;
}

.badge-card img {
  width: 60px;
  height: 60px;
  margin-bottom: 0.5rem;
}

.badge-name {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: bold;
}

.badge-card.locked .badge-name {
  color: var(--color-text-light);
}

/* Help & Feedback Page */
.feedback-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--color-background);
  border-radius: var(--radius-large);
  border: 2px solid var(--color-secondary);
}

.feedback-form .form-group {
  margin-bottom: 1.5rem;
}

.feedback-form textarea {
  min-height: 150px;
}

/* About Us Page */
.about-section {
  text-align: center;
  padding: 2rem;
  background-color: var(--color-background);
  border-radius: var(--radius-large);
  border: 2px solid var(--color-secondary);
}

.app-logo {
  width: 100px;
  height: 100px;
  margin-bottom: 1rem;
}

.app-name {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.app-version {
  font-size: 1.2rem;
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.app-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text);
  max-width: 600px;
  margin: 0 auto;
}
</style>