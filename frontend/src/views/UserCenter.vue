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
            <img :src="userProfile.avatar || 'https://i.pravatar.cc/150'" alt="用户头像" class="user-avatar" />
            <div class="avatar-mask">更换头像</div>
            <input type="file" ref="avatarInput" hidden accept="image/*" @change="handleAvatarUpload" />
          </div>
          <div class="user-details">
            <div class="user-name">{{ userProfile.nickname }} <span class="role-badge">{{ userProfile.role || '普通用户' }}</span></div>
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
          <!-- 1. 学习概览 (Dashboard) -->
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
                <div class="stat-value">{{ dashboardStats.formattedReadingTime }}</div>
                <div class="stat-label">累计学习时长</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value">{{ dashboardStats.wordsLearned }}</div>
                <div class="stat-label">词汇量</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">{{ dashboardStats.formattedReviewAccuracy }}</div>
                <div class="stat-label">复习准确率</div>
              </div>
            </div>

            <div class="recent-activity">
              <div class="section-title">最近活动日志</div>
              <div class="activity-list">
                <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
                  <div class="activity-icon">•</div>
                  <div class="activity-text">
                    {{ activity.action || '进行阅读' }} - {{ activity.targetName || activity.description || '' }}
                    <small style="color:#999; margin-left:10px">{{ activity.createdAt || '' }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 个人资料与偏好设置 (Profile) -->
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
            <button class="btn btn-primary" @click="saveFullProfile" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存所有修改' }}
            </button>
          </div>

          <!-- 3. 账户安全 (Security) -->
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

          <!-- 4. 订阅管理 (Subscription) -->
          <div v-if="activePage === 'subscription'" class="user-page">
            <div class="page-title">订阅管理</div>
            <div class="subscription-card" v-if="subscription.planName || subscription.status">
              <div class="plan-name">{{ subscription.planName || '免费版' }}</div>
              <div class="plan-detail">当前状态: <span>{{ subscription.status }}</span></div>
              <div class="plan-detail">有效期至: <span>{{ subscription.endDate || '永久有效' }}</span></div>
              <div class="plan-actions" v-if="subscription.status !== '已取消'">
                <button class="btn btn-danger" @click="cancelSubscription">取消订阅</button>
              </div>
            </div>
            <div v-else class="empty-state">暂无订阅信息</div>
          </div>

          <!-- 5. 详细统计 (Stats) -->
          <div v-if="activePage === 'stats'" class="user-page">
            <div class="page-title">详细统计</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ dashboardStats.totalReadingTime || 0 }} min</div>
                <div class="stat-label">总学习时长</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ dashboardStats.reviewsCompleted || 0 }}</div>
                <div class="stat-label">完成复习数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ dashboardStats.streakDays || 0 }}</div>
                <div class="stat-label">连续学习天数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ dashboardStats.longestStreak || 0 }}</div>
                <div class="stat-label">历史最高连胜</div>
              </div>
            </div>
          </div>

          <!-- 6. 成就徽章 (Badges) -->
          <div v-if="activePage === 'badges'" class="user-page">
            <div class="page-title">成就勋章</div>
            <div class="badge-grid">
              <div v-for="(badge, index) in achievementBadges" :key="index" 
                   :class="['badge-card', { locked: !badge.unlocked }]">
                <img :src="badge.icon" :alt="badge.name">
                <div class="badge-name">{{ badge.name }}</div>
                <small v-if="!badge.unlocked">{{ badge.formattedProgress }}</small>
                <div v-else style="color: gold; font-size: 0.8rem;">已达成</div>
              </div>
            </div>
          </div>

          <!-- 7. 帮助与反馈 (Help) -->
          <div v-if="activePage === 'help'" class="user-page">
            <div class="page-title">帮助与反馈</div>
            <div class="feedback-form">
              <div class="form-group">
                <div class="form-label">反馈类型</div>
                <select v-model="feedback.type">
                  <option value="Bug反馈">问题反馈</option>
                  <option value="功能建议">功能建议</option>
                </select>
              </div>
              <div class="form-group">
                <div class="form-label">详细描述</div>
                <textarea v-model="feedback.content" placeholder="请详细描述您遇到的问题或建议..."></textarea>
              </div>
              <button class="btn btn-primary" @click="submitFeedback">提交反馈</button>
            </div>
          </div>

          <!-- 8. 关于我们 (About) -->
          <div v-if="activePage === 'about'" class="user-page">
            <div class="page-title">关于 ReadMemo</div>
            <div class="about-section" style="text-align:center">
              <img src="@/assets/logo.png" alt="App Logo" class="app-logo">
              <div class="app-version">Version 1.0.0 (Build 20241218)</div>
              <p>您的个人智能阅读伴侣</p>
              <div class="app-description">
                ReadMemo 致力于通过 AI 技术提升您的外语阅读效率，记录您的每一个词汇成长轨迹。
              </div>
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
import { auth } from '@/utils/auth';

const router = useRouter();
const activePage = ref('dashboard');
const isLoading = ref(false);
const isExporting = ref(false);
const isSaving = ref(false);
const token = auth.getToken();

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

// --- 初始状态数据（兼做请求失败时的回退数据） ---
const userProfile = ref({
  nickname: '加载中...',
  email: 'user@readmemo.com',
  bio: '这家伙很懒，什么都没有留下。',
  avatar: 'https://i.pravatar.cc/150',
  role: '免费会员',
  preferences: {
    reading: { fontSize: 16, theme: 'light', lineHeight: 1.6 },
    review: { dailyGoal: 20, reminderTime: '20:00' },
    notification: { email: true, push: true }
  }
});

const dashboardStats = ref({ 
  documentsRead: 12, 
  wordsLearned: 450, 
  formattedReadingTime: '12h 30m',
  formattedReviewAccuracy: '88%',
  totalReadingTime: 750,
  reviewsCompleted: 128,
  streakDays: 7,
  longestStreak: 15
});

const recentActivities = ref([
  { action: '阅读文档', targetName: 'The Old Man and the Sea', createdAt: '2024-12-18' },
  { action: '复习词汇', targetName: 'GRE Essential 3000', createdAt: '2024-12-17' }
]);

const learningGoals = ref([
  { goalId: 1, title: '每日阅读', currentValue: 15, targetValue: 30, unit: '分钟', status: '进行中' }
]);

const achievementBadges = ref([
  { name: '初出茅庐', icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', unlocked: true, formattedProgress: '100%' },
  { name: '书虫', icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', unlocked: false, formattedProgress: '45%' }
]);

const subscription = ref({ planName: '专业版', status: '活跃', endDate: '2025-12-31' });
const passwords = ref({ old: '', new: '', confirm: '' });
const feedback = ref({ type: 'Bug反馈', content: '' });

// --- 统一请求 Header ---
const getHeaders = (contentType = 'application/json') => {
  const headers = { 'Authorization': `Bearer ${token}` };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
};

// --- API 请求集合 ---

const fetchAllData = async () => {
  isLoading.value = true;
  
  try {
    // 1. 获取个人资料 (UserGetProfile)
    const profileRes = await fetch('http://localhost:8080/api/v1/user/profile', { headers: getHeaders() });
    const profileData = await profileRes.json();
    if (profileData.success) {
      userProfile.value = profileData.user;
    }

    // 2. 获取统计摘要 (UserGetLearningStats)
    const statsRes = await fetch('http://localhost:8080/api/v1/user/learning-stats', { headers: getHeaders() });
    const statsData = await statsRes.json();
    if (statsData.success) {
      dashboardStats.value = statsData.data;
    }

    // 3. 获取学习目标 (UserGetLearningGoals)
    const goalsRes = await fetch('http://localhost:8080/api/v1/user/goals', { headers: getHeaders() });
    const goalsData = await goalsRes.json();
    if (goalsData.success) {
      learningGoals.value = goalsData.data || goalsData.goals;
    }

    // 4. 获取活动日志 (UserGetActivityLog)
    const actRes = await fetch('http://localhost:8080/api/v1/user/activity-log', { headers: getHeaders() });
    const actData = await actRes.json();
    if (actData.success) {
      recentActivities.value = actData.data || actData.activities;
    }

    // 5. 获取勋章 (UserGetAchievements)
    const badgeRes = await fetch('http://localhost:8080/api/v1/user/achievements', { headers: getHeaders() });
    const badgeData = await badgeRes.json();
    if (badgeData.success) {
      achievementBadges.value = badgeData.data || badgeData.achievements;
    }

    // 6. 订阅信息 (UserGetSubscriptionInfo)
    const subRes = await fetch('http://localhost:8080/api/v1/user/subscription', { headers: getHeaders() });
    const subData = await subRes.json();
    if (subData.success) {
      subscription.value = subData.data || subData.subscription;
    }

  } catch (err) {
    console.warn("API同步失败，保留模拟数据作为降级展示", err);
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
      headers: { 'Authorization': `Bearer ${token}` }, // Multipart 不需要手动设 Content-Type
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      userProfile.value.avatar = result.user?.avatar || result.data?.avatar;
      alert('头像更新成功');
    }
  } catch (err) { alert('头像上传异常'); }
};

const saveFullProfile = async () => {
  isSaving.value = true;
  try {
    // 1. 更新基本资料 (UserUpdateProfile)
    const profileRes = await fetch('http://localhost:8080/api/v1/user/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        nickname: userProfile.value.nickname,
        bio: userProfile.value.bio
      })
    });

    // 2. 更新偏好设置 (UserUpdatePreferences)
    const prefRes = await fetch('http://localhost:8080/api/v1/user/preferences', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userProfile.value.preferences)
    });

    const pJson = await profileRes.json();
    const prefJson = await prefRes.json();

    if (pJson.success && prefJson.success) {
      alert('所有个人设置已更新');
    }
  } catch (err) { 
    alert('保存失败，请检查网络'); 
  } finally {
    isSaving.value = false;
  }
};

const handleUpdatePassword = async () => {
  if (!passwords.value.old) return alert('请输入当前密码');
  if (passwords.value.new !== passwords.value.confirm) return alert('两次输入的新密码不一致');
  
  try {
    const res = await fetch('http://localhost:8080/api/v1/auth/password', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        current_password: passwords.value.old,
        new_password: passwords.value.new,
        new_password_confirmation: passwords.value.confirm
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('密码修改成功，请重新登录');
      localStorage.removeItem('token');
      router.push('/login');
    } else {
      alert(result.message || '修改失败');
    }
  } catch (err) { alert('操作异常'); }
};

const handleExportData = async () => {
  isExporting.value = true;
  try {
    const res = await fetch('http://localhost:8080/api/v1/user/export-data', {
      headers: getHeaders()
    });
    const result = await res.json();
    alert(result.message || '导出任务已提交，请查看您的邮箱');
  } catch (err) { 
    alert('导出请求失败'); 
  } finally { 
    isExporting.value = false; 
  }
};

const handleDeleteAccount = async () => {
  const pwd = prompt('注销账号是永久性操作，所有数据将被清空。请输入密码确认：');
  if (!pwd) return;

  try {
    const res = await fetch('http://localhost:8080/api/v1/user/account', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ password: pwd })
    });
    const result = await res.json();
    if (result.success) {
      alert('账号注销成功');
      router.push('/register');
    } else {
      alert(result.message || '注销验证失败');
    }
  } catch (err) { alert('注销流程异常'); }
};

const submitFeedback = async () => {
  if (!feedback.value.content) return alert('请填写反馈内容');
  try {
    const res = await fetch('http://localhost:8080/api/v1/feedback/submit', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: feedback.value.type,
        content: feedback.value.content
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('感谢您的反馈，我们会尽快处理！');
      feedback.value.content = '';
    }
  } catch (err) { alert('提交失败'); }
};

const cancelSubscription = async () => {
  if (!confirm('确定要取消当前的自动续费订阅吗？')) return;
  alert('功能开发中，请联系客服处理');
};

const showPage = (page) => activePage.value = page;

onMounted(() => {
  if (!token) {
    alert('登录已过期，请重新登录');
    router.push('/login');
    return;
  }
  fetchAllData();
});
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
}

.user-center-layout {
  min-height: 100vh;
  background-color: var(--background-color);
  font-family: var(--font-body);
  padding: var(--spacing-xl);
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loader {
  font-family: var(--font-heading);
  font-size: 28px;
  color: var(--primary-color);
  font-weight: bold;
  animation: bounce 1s infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

/* 用户头部区域 */
.user-header {
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 4px solid var(--accent-pink);
  animation: slide-down 0.5s ease-out;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-title {
  font-family: var(--font-heading);
  font-size: 36px;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  justify-content: center;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.1);
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--primary-color);
  box-shadow: var(--shadow-lg);
  object-fit: cover;
  transition: all 0.3s ease;
}

.avatar-wrapper:hover .user-avatar {
  border-color: var(--accent-yellow);
  transform: rotate(5deg);
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}

.user-details {
  text-align: left;
}

.user-name {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.role-badge {
  background: linear-gradient(135deg, var(--accent-yellow), #ffed4e);
  color: var(--text-color-dark);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-xl);
  font-size: 14px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--shadow-sm);
}

.user-email {
  font-size: 18px;
  color: var(--text-color-medium);
  background-color: rgba(173, 216, 230, 0.2);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-lg);
  display: inline-block;
}

/* 主要内容区域 */
.user-content {
  display: flex;
  gap: var(--spacing-xl);
  min-height: 600px;
}

/* 左侧导航栏 */
.user-nav {
  width: 280px;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 4px solid var(--accent-green);
  position: sticky;
  top: var(--spacing-xl);
  height: fit-content;
}

.nav-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  text-align: center;
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

/* 右侧主内容区 */
.user-main {
  flex: 1;
  background-color: var(--surface-color);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 4px dashed var(--primary-color);
}

.user-page {
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
  font-size: 32px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
  border-bottom: 4px solid var(--accent-yellow);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-title::before {
  content: '📊';
  font-size: 28px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.2), rgba(255, 214, 0, 0.2));
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--primary-color);
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.stat-card:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  font-size: 36px;
  margin-bottom: var(--spacing-sm);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 32px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 16px;
  color: var(--text-color-medium);
  font-weight: bold;
}

/* 最近活动 */
.section-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--primary-color);
  margin: var(--spacing-lg) 0 var(--spacing-md);
  padding-left: var(--spacing-md);
  border-left: 4px solid var(--accent-pink);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.activity-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background-color: rgba(144, 238, 144, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--accent-green);
  transition: all 0.3s ease;
}

.activity-item:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-sm);
  background-color: rgba(144, 238, 144, 0.2);
}

.activity-icon {
  font-size: 20px;
  color: var(--accent-yellow);
  margin-right: var(--spacing-sm);
}

.activity-text {
  font-size: 16px;
  color: var(--text-color-dark);
  flex: 1;
}

/* 表单样式 */
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

/* 设置行 */
.settings-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary-dark), #7cd87c);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: linear-gradient(135deg, var(--accent-yellow), #ffed4e);
  color: var(--text-color-dark);
}

.btn-secondary:hover:not(:disabled) {
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

/* 危险区域 */
.danger-zone {
  padding: var(--spacing-lg);
  background-color: rgba(255, 107, 107, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px dashed #ff6b6b;
  margin-top: var(--spacing-md);
}

/* 订阅卡片 */
.subscription-card {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.2), rgba(255, 182, 193, 0.2));
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

.plan-detail {
  font-size: 18px;
  color: var(--text-color-dark);
  margin-bottom: var(--spacing-sm);
}

.plan-detail span {
  font-weight: bold;
  color: var(--primary-color);
}

.plan-actions {
  margin-top: var(--spacing-lg);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-color-light);
  font-size: 18px;
  background-color: rgba(173, 216, 230, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px dashed var(--border-color);
}

/* 徽章网格 */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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

.badge-card:hover:not(.locked) {
  transform: translateY(-5px) rotate(5deg);
  box-shadow: var(--shadow-lg);
}

.badge-card.locked {
  filter: grayscale(1);
  opacity: 0.6;
  border-color: var(--border-color);
  cursor: not-allowed;
}

.badge-card img {
  width: 60px;
  height: 60px;
  margin-bottom: var(--spacing-sm);
  transition: transform 0.3s ease;
}

.badge-card:not(.locked):hover img {
  transform: scale(1.2);
}

.badge-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
}

/* 反馈表单 */
.feedback-form {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  background-color: rgba(173, 216, 230, 0.1);
  border-radius: var(--border-radius-lg);
  border: 3px solid var(--primary-light);
}

/* 关于我们 */
.about-section {
  text-align: center;
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.1), rgba(255, 182, 193, 0.1));
  border-radius: var(--border-radius-lg);
  border: 4px dashed var(--primary-color);
  max-width: 500px;
  margin: 0 auto;
}

.app-logo {
  width: 100px;
  height: 100px;
  margin-bottom: var(--spacing-lg);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.app-name {
  font-family: var(--font-heading);
  font-size: 28px;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
}

.app-version {
  font-size: 16px;
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
  .user-content {
    flex-direction: column;
  }
  
  .user-nav {
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
  .user-center-layout {
    padding: var(--spacing-md);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .badge-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .settings-row {
    grid-template-columns: 1fr;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }
  
  .nav-link {
    font-size: 16px;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: 16px;
  }
  
  .stat-card {
    padding: var(--spacing-md);
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>