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

