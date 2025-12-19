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

            <!-- 学习目标进度 -->
            <div class="recent-activity" v-if="learningGoals.length > 0">
              <div class="section-title">当前学习目标</div>
              <div class="goals-list">
                <div v-for="goal in learningGoals" :key="goal.goalId" class="activity-item">
                  <div class="goal-info">
                    <strong>{{ goal.title }}</strong>: {{ goal.currentValue }} / {{ goal.targetValue }} {{ goal.unit }}
                    <span class="status-tag" :class="goal.status">{{ goal.status }}</span>
                  </div>
                </div>
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
/* 定义CSS变量，方便统一管理颜色和圆角 */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-accent: #17a2b8;
  --color-danger: #dc3545;
  --color-background: #f8f9fa;
  --color-text: #343a40;
  --color-text-light: #6c757d;
  /* --- 调整后的圆角变量 --- */
  --radius-medium: 0.25rem; /* 减小 */
  --radius-large: 0.5rem;  /* 减小 */
}

.user-center-layout {
  font-family: 'Arial', sans-serif;
  background-color: var(--color-background);
  min-height: 100vh;
  padding: 1.5rem; /* 整体内边距减小 */
  display: flex;
  flex-direction: column;
}

.user-header {
  background-color: white;
  padding: 1.5rem; /* 减小内边距 */
  border-radius: var(--radius-large);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 阴影也适当减小 */
  margin-bottom: 1.5rem; /* 减小底部外边距 */
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.header-title {
  font-size: 2rem; /* 减小标题字号 */
  color: var(--color-primary);
  margin-bottom: 1.2rem; /* 减小 */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.2rem; /* 减小 */
}

.user-avatar {
  width: 70px; /* 减小 */
  height: 70px; /* 减小 */
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-primary); /* 边框也适当减小 */
}

.user-details {
  text-align: left;
}

.user-name {
  font-size: 1.6rem; /* 减小 */
  font-weight: bold;
  color: var(--color-text);
}

.user-email {
  font-size: 1.1rem; /* 减小 */
  color: var(--color-text-light);
}

.user-content {
  display: flex;
  gap: 1.5rem; /* 减小 */
  flex-grow: 1;
}

.user-nav {
  width: 220px; /* 减小宽度 */
  background-color: white;
  border-radius: var(--radius-large);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 减小 */
  padding: 1.2rem; /* 减小 */
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-size: 1.3rem; /* 减小 */
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 1.2rem; /* 减小 */
  padding-bottom: 0.4rem; /* 减小 */
  border-bottom: 2px solid var(--color-secondary);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem; /* 减小 */
  flex-grow: 1;
}

.nav-item {
  margin-bottom: 0.4rem; /* 减小 */
}

.nav-link {
  padding: 10px 12px; /* 减小 */
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem; /* 减小 */
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  gap: 0.7rem; /* 减小 */
}

.nav-link:hover {
  background-color: #e9ecef;
  color: var(--color-primary);
}

.nav-link.active {
  background-color: var(--color-primary);
  color: rgb(180, 230, 118);
  font-weight: bold;
}

.user-main {
  flex: 1;
  background-color: white;
  border-radius: var(--radius-large);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 减小 */
  padding: 2rem; /* 减小 */
}

.user-page {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 1.8rem; /* 减小 */
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 1.5rem; /* 减小 */
  padding-bottom: 8px; /* 减小 */
  border-bottom: 2px solid var(--color-secondary); /* 边框也适当减小 */
}

.section-title {
  font-size: 1.4rem; /* 减小 */
  font-weight: bold;
  color: var(--color-text);
  margin-bottom: 1.2rem; /* 减小 */
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* 调整卡片最小宽度 */
  gap: 1.2rem; /* 减小 */
  margin-bottom: 2rem; /* 减小 */
}

.stat-card {
  background-color: var(--color-background);
  padding: 1.2rem; /* 减小 */
  border-radius: var(--radius-large);
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); /* 减小 */
}

.stat-icon {
  font-size: 2rem; /* 减小 */
  margin-bottom: 0.6rem; /* 减小 */
}

.stat-value {
  font-size: 1.8rem; /* 减小 */
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.4rem; /* 减小 */
}

.stat-label {
  font-size: 1rem; /* 减小 */
  color: var(--color-text-light);
}

.recent-activity {
  margin-bottom: 2rem; /* 减小 */
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 0; /* 减小 */
  border-bottom: 1px solid #eee;
  font-size: 1rem; /* 减小 */
  color: var(--color-text);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  margin-right: 0.6rem; /* 减小 */
  color: var(--color-accent);
  font-size: 1.1rem; /* 减小 */
}

.quick-actions {
  margin-bottom: 2rem; /* 减小 */
}

.action-buttons {
  display: flex;
  gap: 0.8rem; /* 减小 */
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px; /* 减小 */
  border-radius: var(--radius-medium);
  font-weight: bold;
  font-size: 1rem; /* 减小 */
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem; /* 减小 */
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
  font-size: 1.2rem; /* 减小 */
}

/* Profile Page */
.profile-header {
  display: flex;
  align-items: center;
  gap: 1.2rem; /* 减小 */
  margin-bottom: 1.5rem; /* 减小 */
}

.profile-avatar {
  width: 90px; /* 减小 */
  height: 90px; /* 减小 */
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-primary); /* 减小 */
}

.profile-name-input input {
  font-size: 1.6rem; /* 减小 */
  font-weight: bold;
  border: none;
  border-bottom: 1px solid var(--color-secondary); /* 边框减小 */
  padding-bottom: 3px; /* 减小 */
  width: 250px; /* 减小 */
  outline: none;
}

.form-group {
  margin-bottom: 1.2rem; /* 减小 */
}

.form-label {
  font-size: 1.1rem; /* 减小 */
  color: var(--color-text);
  margin-bottom: 0.6rem; /* 减小 */
  font-weight: bold;
}

.form-group input[type="email"],
.form-group input[type="password"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px; /* 减小 */
  border-radius: var(--radius-medium);
  border: 1px solid var(--color-secondary); /* 边框减小 */
  font-size: 1rem; /* 减小 */
  outline: none;
  box-sizing: border-box; /* Ensures padding doesn't affect width */
}

.form-group input[readonly] {
  background-color: #e9ecef;
  color: var(--color-text-light);
}

.form-group textarea {
  min-height: 100px; /* 减小 */
  resize: vertical;
}

/* Security Page */
.device-list {
  margin-top: 1.2rem; /* 减小 */
  border: 1px solid var(--color-secondary); /* 边框减小 */
  border-radius: var(--radius-large);
  padding: 1.2rem; /* 减小 */
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0; /* 减小 */
  border-bottom: 1px solid #eee;
}

.device-item:last-child {
  border-bottom: none;
}

.device-name {
  font-size: 1.1rem; /* 减小 */
  font-weight: bold;
  color: var(--color-text);
}

.device-details {
  font-size: 0.9rem; /* 减小 */
  color: var(--color-text-light);
}

/* Subscription Page */
.subscription-card {
  background-color: var(--color-primary);
  color: white;
  padding: 1.5rem; /* 减小 */
  border-radius: var(--radius-large);
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 123, 255, 0.2); /* 减小 */
}

.plan-name {
  font-size: 2rem; /* 减小 */
  font-weight: bold;
  margin-bottom: 0.8rem; /* 减小 */
}

.plan-detail {
  font-size: 1.2rem; /* 减小 */
  margin-bottom: 0.5rem; /* 减小 */
}

.plan-detail span {
  font-weight: bold;
}

.plan-actions {
  margin-top: 1.5rem; /* 减小 */
  display: flex;
  justify-content: center;
  gap: 0.8rem; /* 减小 */
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
  padding: 0.8rem 0; /* 减小 */
  border-bottom: 1px solid #eee;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-label {
  font-size: 1.1rem; /* 减小 */
  color: var(--color-text);
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px; /* 减小 */
  height: 20px; /* 减小 */
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
  height: 14px; /* 减小 */
  width: 14px; /* 减小 */
  left: 3px; /* 减小 */
  bottom: 3px; /* 减小 */
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px); /* 减小 */
}

/* Badges Page */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); /* 调整 */
  gap: 1.2rem; /* 减小 */
}

.badge-card {
  text-align: center;
  padding: 0.8rem; /* 减小 */
  border-radius: var(--radius-large);
  background-color: #f0f0f0;
  border: 2px solid var(--color-secondary); /* 边框减小 */
  transition: all 0.3s ease;
}

.badge-card.locked {
  background-color: #e0e0e0;
  filter: grayscale(80%);
  border-color: #ccc;
}

.badge-card img {
  width: 50px; /* 减小 */
  height: 50px; /* 减小 */
  margin-bottom: 0.4rem; /* 减小 */
}

.badge-name {
  font-size: 0.9rem; /* 减小 */
  color: var(--color-text);
  font-weight: bold;
}

.badge-card.locked .badge-name {
  color: var(--color-text-light);
}

/* Help & Feedback Page */
.feedback-form {
  max-width: 500px; /* 减小 */
  margin: 0 auto;
  padding: 1.5rem; /* 减小 */
  background-color: var(--color-background);
  border-radius: var(--radius-large);
  border: 1px solid var(--color-secondary); /* 边框减小 */
}

.feedback-form .form-group {
  margin-bottom: 1.2rem; /* 减小 */
}

.feedback-form textarea {
  min-height: 120px; /* 减小 */
}

/* About Us Page */
.about-section {
  text-align: center;
  padding: 1.5rem; /* 减小 */
  background-color: var(--color-background);
  border-radius: var(--radius-large);
  border: 1px solid var(--color-secondary); /* 边框减小 */
}

.app-logo {
  width: 80px; /* 减小 */
  height: 80px; /* 减小 */
  margin-bottom: 0.8rem; /* 减小 */
}

.app-name {
  font-size: 2.2rem; /* 减小 */
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 0.4rem; /* 减小 */
}

.app-version {
  font-size: 1.1rem; /* 减小 */
  color: var(--color-text-light);
  margin-bottom: 1.2rem; /* 减小 */
}

.app-description {
  font-size: 1rem; /* 减小 */
  line-height: 1.5; /* 调整行高 */
  color: var(--color-text);
  max-width: 500px; /* 减小 */
  margin: 0 auto;
}
</style>