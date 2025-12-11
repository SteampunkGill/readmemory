<template>
  <div class="user-profile-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">个人资料</h1>
      <p class="page-subtitle">管理您的个人信息和学习设置</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="clearError" class="error-retry-btn">重试</button>
    </div>

    <!-- 主要内容 -->
    <div v-if="!loading && !error && profile" class="profile-content">
      <!-- 基本信息卡片 -->
      <div class="profile-card basic-info-card">
        <div class="card-header">
          <h2 class="card-title">基本信息</h2>
          <button
            @click="toggleEditMode"
            class="edit-btn"
            :class="{ 'editing': isEditing }"
          >
            {{ isEditing ? '取消编辑' : '编辑资料' }}
          </button>
        </div>

        <div class="card-body">
          <!-- 头像区域 -->
          <div class="avatar-section">
            <div class="avatar-container">
              <img
                :src="profile.avatar || '/default-avatar.png'"
                :alt="profile.nickname"
                class="avatar-image"
              />
              <div v-if="isEditing" class="avatar-overlay">
                <label for="avatar-upload" class="avatar-upload-label">
                  <span class="upload-icon">📷</span>
                  <span class="upload-text">更换头像</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  @change="handleAvatarUpload"
                  class="avatar-upload-input"
                />
              </div>
            </div>

            <!-- 头像上传进度 -->
            <div v-if="avatarUploadProgress > 0" class="upload-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: avatarUploadProgress + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ avatarUploadProgress }}%</span>
            </div>
          </div>

          <!-- 基本信息表单 -->
          <form @submit.prevent="handleProfileUpdate" class="info-form">
            <div class="form-grid">
              <!-- 用户名（不可编辑） -->
              <div class="form-group">
                <label class="form-label">用户名</label>
                <div class="form-static">{{ profile.username }}</div>
                <p class="form-hint">用户名不可更改</p>
              </div>

              <!-- 邮箱（不可编辑） -->
              <div class="form-group">
                <label class="form-label">邮箱</label>
                <div class="form-static">{{ profile.email }}</div>
                <p class="form-hint">邮箱不可更改</p>
              </div>

              <!-- 昵称 -->
              <div class="form-group">
                <label for="nickname" class="form-label">昵称</label>
                <input
                  v-if="isEditing"
                  id="nickname"
                  v-model="editForm.nickname"
                  type="text"
                  class="form-input"
                  placeholder="请输入昵称"
                  maxlength="30"
                />
                <div v-else class="form-static">{{ profile.nickname }}</div>
                <p v-if="isEditing" class="form-hint">昵称长度2-30个字符</p>
              </div>

              <!-- 个人简介 -->
              <div class="form-group">
                <label for="bio" class="form-label">个人简介</label>
                <textarea
                  v-if="isEditing"
                  id="bio"
                  v-model="editForm.bio"
                  class="form-textarea"
                  placeholder="介绍一下自己吧..."
                  maxlength="500"
                  rows="3"
                ></textarea>
                <div v-else class="form-static">{{ profile.bio || '暂无简介' }}</div>
                <p v-if="isEditing" class="form-hint">最多500个字符</p>
              </div>

              <!-- 所在地 -->
              <div class="form-group">
                <label for="location" class="form-label">所在地</label>
                <input
                  v-if="isEditing"
                  id="location"
                  v-model="editForm.location"
                  type="text"
                  class="form-input"
                  placeholder="请输入所在地"
                />
                <div v-else class="form-static">{{ profile.location || '未设置' }}</div>
              </div>

              <!-- 个人网站 -->
              <div class="form-group">
                <label for="website" class="form-label">个人网站</label>
                <input
                  v-if="isEditing"
                  id="website"
                  v-model="editForm.website"
                  type="url"
                  class="form-input"
                  placeholder="https://example.com"
                />
                <div v-else class="form-static">
                  <a v-if="profile.website" :href="profile.website" target="_blank" class="website-link">
                    {{ profile.website }}
                  </a>
                  <span v-else>未设置</span>
                </div>
              </div>

              <!-- 加入时间 -->
              <div class="form-group">
                <label class="form-label">加入时间</label>
                <div class="form-static">{{ profile.joinDate }}</div>
                <p class="form-hint">已加入 {{ joinDuration }}</p>
              </div>

              <!-- 最后登录 -->
              <div class="form-group">
                <label class="form-label">最后登录</label>
                <div class="form-static">{{ profile.lastLogin }}</div>
              </div>
            </div>

            <!-- 编辑模式下的操作按钮 -->
            <div v-if="isEditing" class="form-actions">
              <button type="submit" class="save-btn" :disabled="isSaving">
                {{ isSaving ? '保存中...' : '保存更改' }}
              </button>
              <button type="button" @click="cancelEdit" class="cancel-btn">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 学习统计卡片 -->
      <div class="profile-card stats-card">
        <div class="card-header">
          <h2 class="card-title">学习统计</h2>
          <button @click="refreshStats" class="refresh-btn" :disabled="refreshingStats">
            {{ refreshingStats ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <div class="card-body">
          <div v-if="learningStats" class="stats-grid">
            <!-- 总阅读时间 -->
            <div class="stat-item">
              <div class="stat-icon">⏱️</div>
              <div class="stat-content">
                <div class="stat-value">{{ learningStats.formattedReadingTime }}</div>
                <div class="stat-label">总阅读时间</div>
              </div>
            </div>

            <!-- 已读文档 -->
            <div class="stat-item">
              <div class="stat-icon">📚</div>
              <div class="stat-content">
                <div class="stat-value">{{ formatNumber(learningStats.documentsRead) }}</div>
                <div class="stat-label">已读文档</div>
              </div>
            </div>

            <!-- 已学单词 -->
            <div class="stat-item">
              <div class="stat-icon">🔤</div>
              <div class="stat-content">
                <div class="stat-value">{{ formatNumber(learningStats.wordsLearned) }}</div>
                <div class="stat-label">已学单词</div>
              </div>
            </div>

            <!-- 完成复习 -->
            <div class="stat-item">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">{{ formatNumber(learningStats.reviewsCompleted) }}</div>
                <div class="stat-label">完成复习</div>
              </div>
            </div>

            <!-- 复习准确率 -->
            <div class="stat-item">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <div class="stat-value">{{ learningStats.formattedReviewAccuracy }}</div>
                <div class="stat-label">复习准确率</div>
              </div>
            </div>

            <!-- 连续学习 -->
            <div class="stat-item">
              <div class="stat-icon">🔥</div>
              <div class="stat-content">
                <div class="stat-value">{{ learningStats.streakDays }} 天</div>
                <div class="stat-label">连续学习</div>
              </div>
            </div>

            <!-- 解锁成就 -->
            <div class="stat-item">
              <div class="stat-icon">🏆</div>
              <div class="stat-content">
                <div class="stat-value">{{ learningStats.achievementsUnlocked }}/{{ learningStats.totalAchievements }}</div>
                <div class="stat-label">解锁成就</div>
              </div>
            </div>

            <!-- 今日进度 -->
            <div class="stat-item full-width">
              <div class="stat-icon">📅</div>
              <div class="stat-content">
                <div class="stat-label">今日进度</div>
                <div class="today-progress">
                  <div class="progress-item">
                    <span class="progress-label">阅读时间</span>
                    <span class="progress-value">{{ formatDuration(learningStats.todayProgress.readingTime) }}</span>
                  </div>
                  <div class="progress-item">
                    <span class="progress-label">学习单词</span>
                    <span class="progress-value">{{ learningStats.todayProgress.wordsLearned }} 个</span>
                  </div>
                  <div class="progress-item">
                    <span class="progress-label">完成复习</span>
                    <span class="progress-value">{{ learningStats.todayProgress.reviewsCompleted }} 个</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-stats">
            <p>暂无学习统计</p>
            <button @click="loadStats" class="load-stats-btn">加载统计</button>
          </div>
        </div>
      </div>

      <!-- 成就卡片 -->
      <div class="profile-card achievements-card">
        <div class="card-header">
          <h2 class="card-title">成就徽章</h2>
          <div class="achievement-progress">
            <span class="progress-text">{{ unlockedAchievementsCount }}/{{ totalAchievementsCount }}</span>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: achievementProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="card-body">
          <div v-if="achievements.length > 0" class="achievements-grid">
            <div
              v-for="achievement in achievements"
              :key="achievement.id"
              class="achievement-item"
              :class="{ 'unlocked': achievement.unlocked }"
            >
              <div class="achievement-icon">
                <span v-if="achievement.icon">{{ achievement.icon }}</span>
                <span v-else>🏆</span>
              </div>
              <div class="achievement-content">
                <h4 class="achievement-name">{{ achievement.name }}</h4>
                <p class="achievement-desc">{{ achievement.description }}</p>
                <div v-if="achievement.unlocked" class="achievement-unlocked">
                  <span class="unlocked-date">{{ achievement.unlockedAt }}</span>
                </div>
                <div v-else class="achievement-progress">
                  <span class="progress-text">{{ achievement.formattedProgress }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-achievements">
            <p>暂无成就</p>
            <button @click="loadAchievements" class="load-achievements-btn">加载成就</button>
          </div>
        </div>
      </div>

      <!-- 最近活动卡片 -->
      <div class="profile-card activity-card">
        <div class="card-header">
          <h2 class="card-title">最近活动</h2>
          <button @click="loadActivity" class="load-more-btn" :disabled="loadingActivity">
            {{ loadingActivity ? '加载中...' : '查看更多' }}
          </button>
        </div>

        <div class="card-body">
          <div v-if="activity.length > 0" class="activity-list">
            <div
              v-for="item in activity.slice(0, 5)"
              :key="item.id"
              class="activity-item"
            >
              <div class="activity-icon">
                <span v-if="item.type === 'document_read'">📖</span>
                <span v-else-if="item.type === 'word_learned'">🔤</span>
                <span v-else-if="item.type === 'review_completed'">✅</span>
                <span v-else>📝</span>
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ item.action }}</p>
                <p class="activity-time">{{ item.formattedTime }}</p>
              </div>
            </div>
          </div>

          <div v-else class="no-activity">
            <p>暂无活动记录</p>
          </div>
        </div>
      </div>

      <!-- 偏好设置卡片 -->
      <div class="profile-card preferences-card">
        <div class="card-header">
          <h2 class="card-title">偏好设置</h2>
        </div>

        <div class="card-body">
          <div v-if="profile.preferences" class="preferences-form">
            <!-- 阅读偏好 -->
            <div class="preference-section">
              <h3 class="section-title">阅读设置</h3>
              <div class="preference-item">
                <label class="preference-label">字体大小</label>
                <input
                  v-model="preferencesForm.reading.fontSize"
                  type="range"
                  min="12"
                  max="24"
                  class="preference-slider"
                />
                <span class="preference-value">{{ preferencesForm.reading.fontSize }}px</span>
              </div>
              <div class="preference-item">
                <label class="preference-label">主题</label>
                <select v-model="preferencesForm.reading.theme" class="preference-select">
                  <option value="light">明亮</option>
                  <option value="dark">暗黑</option>
                  <option value="sepia">护眼</option>
                </select>
              </div>
              <div class="preference-item">
                <label class="preference-label">行高</label>
                <input
                  v-model="preferencesForm.reading.lineHeight"
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  class="preference-slider"
                />
                <span class="preference-value">{{ preferencesForm.reading.lineHeight }}</span>
              </div>
            </div>

            <!-- 复习偏好 -->
            <div class="preference-section">
              <h3 class="section-title">复习设置</h3>
              <div class="preference-item">
                <label class="preference-label">每日目标</label>
                <input
                  v-model="preferencesForm.review.dailyGoal"
                  type="number"
                  min="5"
                  max="100"
                  class="preference-input"
                />
                <span class="preference-unit">个单词</span>
              </div>
              <div class="preference-item">
                <label class="preference-label">提醒时间</label>
                <input
                  v-model="preferencesForm.review.reminderTime"
                  type="time"
                  class="preference-input"
                />
              </div>
            </div>

            <!-- 通知偏好 -->
            <div class="preference-section">
              <h3 class="section-title">通知设置</h3>
              <div class="preference-item">
                <label class="preference-label">
                  <input
                    v-model="preferencesForm.notification.email"
                    type="checkbox"
                    class="preference-checkbox"
                  />
                  邮件通知
                </label>
              </div>
              <div class="preference-item">
                <label class="preference-label">
                  <input
                    v-model="preferencesForm.notification.push"
                    type="checkbox"
                    class="preference-checkbox"
                  />
                  推送通知
                </label>
              </div>
            </div>

            <!-- 保存按钮 -->
            <div class="preference-actions">
              <button
                @click="savePreferences"
                class="save-preferences-btn"
                :disabled="savingPreferences"
              >
                {{ savingPreferences ? '保存中...' : '保存设置' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 账户操作卡片 -->
      <div class="profile-card account-card">
        <div class="card-header">
          <h2 class="card-title">账户操作</h2>
        </div>
        <div class="card-body">
          <div class="account-actions">
            <!-- 导出数据 -->
            <button @click="exportUserData" class="account-btn export-btn">
              <span class="btn-icon">📥</span>
              <span class="btn-text">导出用户数据</span>
            </button>

            <!-- 清除缓存 -->
            <button @click="clearCache" class="account-btn clear-btn">
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">清除缓存</span>
            </button>

            <!-- 注销账户 -->
            <button @click="showDeleteConfirm = true" class="account-btn delete-btn">
              <span class="btn-icon">⚠️</span>
              <span class="btn-text">注销账户</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 积分等级卡片 -->
      <div v-if="pointsAndLevel" class="profile-card points-card">
        <div class="card-header">
          <h2 class="card-title">积分等级</h2>
          <div class="level-badge">
            <span class="level-icon">⭐</span>
            <span class="level-text">Lv.{{ pointsAndLevel.currentLevel }}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="points-info">
            <!-- 等级进度 -->
            <div class="level-progress">
              <div class="progress-header">
                <span class="progress-label">{{ pointsAndLevel.levelName }}</span>
                <span class="progress-percentage">{{ pointsAndLevel.formattedProgress }}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: pointsAndLevel.progressToNextLevel + '%' }"
                ></div>
              </div>
              <div class="progress-numbers">
                <span class="current-points">{{ formatNumber(pointsAndLevel.currentLevelPoints) }}</span>
                <span class="next-points">{{ formatNumber(pointsAndLevel.nextLevelPoints) }}</span>
              </div>
            </div>

            <!-- 总积分 -->
            <div class="total-points">
              <div class="points-icon">🏅</div>
              <div class="points-content">
                <div class="points-value">{{ formatNumber(pointsAndLevel.totalPoints) }}</div>
                <div class="points-label">总积分</div>
              </div>
            </div>

            <!-- 徽章展示 -->
            <div v-if="pointsAndLevel.badges && pointsAndLevel.badges.length > 0" class="badges-section">
              <h3 class="section-title">已获徽章</h3>
              <div class="badges-grid">
                <div
                  v-for="badge in pointsAndLevel.badges.slice(0, 6)"
                  :key="badge.id"
                  class="badge-item"
                  :title="badge.name + ': ' + badge.description"
                >
                  <div class="badge-icon">{{ badge.icon || '🏆' }}</div>
                  <div class="badge-name">{{ badge.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习日历卡片 -->
      <div v-if="learningCalendar" class="profile-card calendar-card">
        <div class="card-header">
          <h2 class="card-title">学习日历</h2>
          <div class="calendar-stats">
            <span class="stat-item">
              <span class="stat-icon">🔥</span>
              <span class="stat-text">{{ learningCalendar.currentStreak }} 天</span>
            </span>
            <span class="stat-item">
              <span class="stat-icon">📊</span>
              <span class="stat-text">{{ learningCalendar.totalStudyDays }} 天</span>
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="calendar-container">
            <!-- 日历标题 -->
            <div class="calendar-header">
              <button @click="prevMonth" class="calendar-nav-btn prev-btn">◀</button>
              <h3 class="calendar-title">{{ learningCalendar.year }}年{{ learningCalendar.month }}月</h3>
              <button @click="nextMonth" class="calendar-nav-btn next-btn">▶</button>
            </div>

            <!-- 星期标题 -->
            <div class="weekdays">
              <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="weekday">
                {{ day }}
              </div>
            </div>

            <!-- 日期网格 -->
            <div class="calendar-grid">
              <div
                v-for="day in calendarDays"
                :key="day.date"
                class="calendar-day"
                :class="{
                  'empty': !day.day,
                  'today': day.isToday,
                  'studied': day.studied,
                  'current-month': day.isCurrentMonth
                }"
                :title="day.tooltip"
              >
                <div v-if="day.day" class="day-number">{{ day.day }}</div>
                <div v-if="day.studied" class="study-indicator"></div>
              </div>
            </div>

            <!-- 图例 -->
            <div class="calendar-legend">
              <div class="legend-item">
                <div class="legend-color studied"></div>
                <span class="legend-text">已学习</span>
              </div>
              <div class="legend-item">
                <div class="legend-color today"></div>
                <span class="legend-text">今天</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习报告卡片 -->
      <div v-if="learningReport" class="profile-card report-card">
        <div class="card-header">
          <h2 class="card-title">学习报告</h2>
          <div class="report-period">
            <span class="period-text">{{ learningReport.period }}报告</span>
            <span class="period-dates">{{ learningReport.startDate }} - {{ learningReport.endDate }}</span>
          </div>
        </div>
        <div class="card-body">
          <!-- 报告摘要 -->
          <div class="report-summary">
            <h3 class="section-title">学习摘要</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-icon">⏱️</div>
                <div class="summary-content">
                  <div class="summary-value">{{ formatDuration(learningReport.summary.totalReadingTime) }}</div>
                  <div class="summary-label">总阅读时间</div>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-icon">📚</div>
                <div class="summary-content">
                  <div class="summary-value">{{ formatNumber(learningReport.summary.documentsRead) }}</div>
                  <div class="summary-label">阅读文档</div>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-icon">🔤</div>
                <div class="summary-content">
                  <div class="summary-value">{{ formatNumber(learningReport.summary.wordsLearned) }}</div>
                  <div class="summary-label">学习单词</div>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-icon">✅</div>
                <div class="summary-content">
                  <div class="summary-value">{{ formatNumber(learningReport.summary.reviewsCompleted) }}</div>
                  <div class="summary-label">完成复习</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门单词 -->
          <div v-if="learningReport.topWords && learningReport.topWords.length > 0" class="top-words-section">
            <h3 class="section-title">热门单词</h3>
            <div class="top-words-list">
              <div
                v-for="(word, index) in learningReport.topWords.slice(0, 5)"
                :key="word.id || index"
                class="word-item"
              >
                <span class="word-rank">#{{ index + 1 }}</span>
                <span class="word-text">{{ word.word }}</span>
                <span class="word-meaning">{{ word.meaning }}</span>
                <span class="word-count">{{ word.count }}次</span>
              </div>
            </div>
          </div>

          <!-- 学习建议 -->
          <div v-if="learningReport.recommendations && learningReport.recommendations.length > 0" class="recommendations-section">
            <h3 class="section-title">学习建议</h3>
            <div class="recommendations-list">
              <div
                v-for="(rec, index) in learningReport.recommendations"
                :key="index"
                class="recommendation-item"
              >
                <div class="rec-icon">💡</div>
                <div class="rec-content">{{ rec }}</div>
              </div>
            </div>
          </div>

          <!-- 报告生成时间 -->
          <div class="report-footer">
            <span class="generated-text">报告生成时间: {{ learningReport.generatedAt }}</span>
          </div>
        </div>
      </div>

      <!-- 隐私设置卡片 -->
      <div v-if="profile && profile.privacySettings" class="profile-card privacy-card">
        <div class="card-header">
          <h2 class="card-title">隐私设置</h2>
        </div>
        <div class="card-body">
          <div class="privacy-settings">
            <!-- 个人资料可见性 -->
            <div class="privacy-section">
              <h3 class="section-title">个人资料可见性</h3>
              <div class="privacy-options">
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.profileVisibility"
                    value="public"
                    class="privacy-radio"
                  />
                  <span class="option-label">公开</span>
                  <span class="option-desc">所有用户可见</span>
                </label>
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.profileVisibility"
                    value="friends"
                    class="privacy-radio"
                  />
                  <span class="option-label">仅好友</span>
                  <span class="option-desc">仅好友可见</span>
                </label>
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.profileVisibility"
                    value="private"
                    class="privacy-radio"
                  />
                  <span class="option-label">私密</span>
                  <span class="option-desc">仅自己可见</span>
                </label>
              </div>
            </div>

            <!-- 活动可见性 -->
            <div class="privacy-section">
              <h3 class="section-title">活动可见性</h3>
              <div class="privacy-options">
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.activityVisibility"
                    value="public"
                    class="privacy-radio"
                  />
                  <span class="option-label">公开</span>
                  <span class="option-desc">所有用户可见</span>
                </label>
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.activityVisibility"
                    value="friends"
                    class="privacy-radio"
                  />
                  <span class="option-label">仅好友</span>
                  <span class="option-desc">仅好友可见</span>
                </label>
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.activityVisibility"
                    value="private"
                    class="privacy-radio"
                  />
                  <span class="option-label">私密</span>
                  <span class="option-desc">仅自己可见</span>
                </label>
              </div>
            </div>

            <!-- 数据共享 -->
            <div class="privacy-section">
              <h3 class="section-title">数据共享</h3>
              <div class="privacy-options">
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.dataSharing"
                    value="full"
                    class="privacy-radio"
                  />
                  <span class="option-label">完全共享</span>
                  <span class="option-desc">用于改进产品和服务</span>
                </label>
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.dataSharing"
                    value="limited"
                    class="privacy-radio"
                  />
                  <span class="option-label">有限共享</span>
                  <span class="option-desc">仅用于必要功能</span>
                </label>
                <label class="privacy-option">
                  <input
                    type="radio"
                    v-model="privacyForm.dataSharing"
                    value="none"
                    class="privacy-radio"
                  />
                  <span class="option-label">不共享</span>
                  <span class="option-desc">仅用于个人使用</span>
                </label>
              </div>
            </div>

            <!-- 保存按钮 -->
            <div class="privacy-actions">
              <button
                @click="savePrivacySettings"
                class="save-privacy-btn"
                :disabled="savingPrivacy"
              >
                {{ savingPrivacy ? '保存中...' : '保存隐私设置' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 删除账户确认模态框 -->
      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal-content">
          <h3 class="modal-title">确认注销账户</h3>
          <p class="modal-text">
            此操作将永久删除您的账户和所有相关数据，包括文档、单词、笔记等。此操作不可恢复。
          </p>

          <!-- 密码验证 -->
          <div class="password-verify">
            <label for="delete-password" class="password-label">请输入密码确认：</label>
            <input
              id="delete-password"
              v-model="deletePassword"
              type="password"
              class="password-input"
              placeholder="请输入您的密码"
            />
            <p v-if="deletePasswordError" class="password-error">{{ deletePasswordError }}</p>
          </div>

          <div class="modal-actions">
            <button
              @click="confirmDeleteAccount"
              class="modal-btn confirm-btn"
              :disabled="deletingAccount || !deletePassword"
            >
              {{ deletingAccount ? '删除中...' : '确认删除' }}
            </button>
            <button @click="cancelDelete" class="modal-btn cancel-btn">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import userService from '@/services/user.service'
import { useUserStore } from '@/stores/user.store'
import { formatNumber, formatDate, formatDuration } from '@/utils/formatter'
import { validateEmail, validateUrl } from '@/utils/validator'

// 状态管理
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const error = ref(null)
const isEditing = ref(false)
const isSaving = ref(false)
const refreshingStats = ref(false)
const loadingActivity = ref(false)
const savingPreferences = ref(false)
const deletingAccount = ref(false)
const showDeleteConfirm = ref(false)
const avatarUploadProgress = ref(0)

// 新增响应式数据
const pointsAndLevel = computed(() => userStore.pointsAndLevel)
const learningCalendar = computed(() => userStore.learningCalendar)
const learningReport = computed(() => userStore.learningReport)

const calendarDays = ref([])
const currentCalendarYear = ref(new Date().getFullYear())
const currentCalendarMonth = ref(new Date().getMonth() + 1)

const privacyForm = reactive({
  profileVisibility: 'public',
  activityVisibility: 'friends',
  dataSharing: 'limited'
})

const deletePassword = ref('')
const deletePasswordError = ref('')
const savingPrivacy = ref(false)

// 计算属性
const profile = computed(() => userStore.profile)
const learningStats = computed(() => userStore.learningStats)
const achievements = computed(() => userStore.achievements)
const activity = computed(() => userStore.activity)
const joinDuration = computed(() => userStore.joinDuration)
const unlockedAchievementsCount = computed(() => userStore.unlockedAchievementsCount)
const totalAchievementsCount = computed(() => userStore.totalAchievementsCount)
const achievementProgress = computed(() => userStore.achievementProgress)

// 表单数据
const editForm = reactive({
  nickname: '',
  bio: '',
  location: '',
  website: ''
})

const preferencesForm = reactive({
  reading: {
    fontSize: 16,
    theme: 'light',
    lineHeight: 1.6
  },
  review: {
    dailyGoal: 20,
    reminderTime: '20:00'
  },
  notification: {
    email: true,
    push: true
  }
})

// 监听profile变化，初始化表单数据
watch(profile, (newProfile) => {
  if (newProfile) {
    editForm.nickname = newProfile.nickname || ''
    editForm.bio = newProfile.bio || ''
    editForm.location = newProfile.location || ''
    editForm.website = newProfile.website || ''

    if (newProfile.preferences) {
      preferencesForm.reading = { ...preferencesForm.reading, ...newProfile.preferences.reading }
      preferencesForm.review = { ...preferencesForm.review, ...newProfile.preferences.review }
      preferencesForm.notification = { ...preferencesForm.notification, ...newProfile.preferences.notification }
    }
  }
}, { immediate: true })

// 监听隐私设置变化
watch(() => profile.value?.privacySettings, (newSettings) => {
  if (newSettings) {
    privacyForm.profileVisibility = newSettings.profileVisibility || 'public'
    privacyForm.activityVisibility = newSettings.activityVisibility || 'friends'
    privacyForm.dataSharing = newSettings.dataSharing || 'limited'
  }
}, { immediate: true })

// 生命周期钩子
onMounted(() => {
  loadUserData()
})

// 方法
const loadUserData = async () => {
  try {
    loading.value = true
    error.value = null

    // 并行加载所有用户数据
    await Promise.all([
      userService.getUserProfile(),
      userService.getLearningStats(),
      userService.getUserAchievements(),
      userService.getUserActivity({ page: 1, pageSize: 10 }),
      userService.getUserPointsAndLevel(),
      userService.getUserLearningCalendar(),
      userService.getLearningReport({ period: 'month' })
    ])

  } catch (err) {
    error.value = err.message || '加载用户数据失败'
    console.error('加载用户数据失败:', err)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    refreshingStats.value = true
    await userService.getLearningStats({ forceRefresh: true })
  } catch (err) {
    console.error('加载学习统计失败:', err)
  } finally {
    refreshingStats.value = false
  }
}

const refreshStats = loadStats

const loadAchievements = async () => {
  try {
    await userService.getUserAchievements(true)
  } catch (err) {
    console.error('加载成就失败:', err)
  }
}

const loadActivity = async () => {
  try {
    loadingActivity.value = true
    const currentPage = userStore.activityPagination.page
    await userService.getUserActivity({ page: currentPage + 1, pageSize: 10 })
  } catch (err) {
    console.error('加载活动失败:', err)
  } finally {
    loadingActivity.value = false
  }
}

const toggleEditMode = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    // 取消编辑时重置表单
    if (profile.value) {
      editForm.nickname = profile.value.nickname || ''
      editForm.bio = profile.value.bio || ''
      editForm.location = profile.value.location || ''
      editForm.website = profile.value.website || ''
    }
  }
}

const cancelEdit = () => {
  isEditing.value = false
  if (profile.value) {
    editForm.nickname = profile.value.nickname || ''
    editForm.bio = profile.value.bio || ''
    editForm.location = profile.value.location || ''
    editForm.website = profile.value.website || ''
  }
}

const handleProfileUpdate = async () => {
  try {
    isSaving.value = true

    // 表单验证
    if (editForm.website && !validateUrl(editForm.website)) {
      throw new Error('个人网站网址格式无效')
    }

    if (editForm.nickname && (editForm.nickname.length < 2 || editForm.nickname.length > 30)) {
      throw new Error('昵称长度必须在2-30个字符之间')
    }

    if (editForm.bio && editForm.bio.length > 500) {
      throw new Error('个人简介不能超过500个字符')
    }

    // 过滤空值
    const updateData = {}
    Object.keys(editForm).forEach(key => {
      if (editForm[key] !== undefined && editForm[key] !== null && editForm[key] !== '') {
        updateData[key] = editForm[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      throw new Error('没有要更新的数据')
    }

    await userService.updateUserProfile(updateData)
    isEditing.value = false

  } catch (err) {
    error.value = err.message || '更新个人信息失败'
    console.error('更新个人信息失败:', err)
  } finally {
    isSaving.value = false
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    avatarUploadProgress.value = 0

    const onProgress = (progress) => {
      avatarUploadProgress.value = progress
    }

    await userService.updateAvatar(file, onProgress)

  } catch (err) {
    error.value = err.message || '上传头像失败'
    console.error('上传头像失败:', err)
  } finally {
    avatarUploadProgress.value = 0
    // 清空input值，以便再次选择同一文件
    event.target.value = ''
  }
}

const savePreferences = async () => {
  try {
    savingPreferences.value = true
    await userService.updateUserPreferences(preferencesForm)
  } catch (err) {
    error.value = err.message || '保存偏好设置失败'
    console.error('保存偏好设置失败:', err)
  } finally {
    savingPreferences.value = false
  }
}

const exportUserData = async () => {
  try {
    await userService.exportUserData({
      format: 'json',
      dataTypes: ['profile', 'documents', 'vocabulary', 'reviews']
    })
  } catch (err) {
    error.value = err.message || '导出数据失败'
    console.error('导出数据失败:', err)
  }
}

const clearCache = () => {
  userService.clearCache()
  // 重新加载数据
  loadUserData()
}

// 新增方法
const loadPointsAndLevel = async () => {
  try {
    await userService.getUserPointsAndLevel()
  } catch (err) {
    console.error('加载积分等级失败:', err)
  }
}

const loadLearningCalendar = async (year = null, month = null) => {
  try {
    const params = {
      year: year || currentCalendarYear.value,
      month: month || currentCalendarMonth.value
    }
    await userService.getUserLearningCalendar(params)
    generateCalendarDays()
  } catch (err) {
    console.error('加载学习日历失败:', err)
  }
}

const loadLearningReport = async () => {
  try {
    await userService.getLearningReport({ period: 'month' })
  } catch (err) {
    console.error('加载学习报告失败:', err)
  }
}

const generateCalendarDays = () => {
  if (!learningCalendar.value) return

  const days = []
  const { year, month } = learningCalendar.value

  // 获取当月第一天是星期几
  const firstDay = new Date(year, month - 1, 1)
  const firstDayWeek = firstDay.getDay()

  // 获取当月天数
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // 获取上个月最后几天
  const prevMonthLastDay = new Date(year, month - 1, 0)
  const daysInPrevMonth = prevMonthLastDay.getDate()

  // 填充上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    days.push({
      day,
      date: `${year}-${month - 1 || 12}-${day}`,
      isCurrentMonth: false,
      studied: false
    })
  }

  // 填充当月日期
  const today = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1

  for (let i = 1; i <= daysInMonth; i++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
    const studied = learningCalendar.value.days?.includes(i) || false
    const isToday = isCurrentMonth && i === today.getDate()

    days.push({
      day: i,
      date,
      isCurrentMonth: true,
      studied,
      isToday,
      tooltip: studied ? `${date}: 已学习` : `${date}: 未学习`
    })
  }

  // 填充下个月的日期
  const totalCells = 42 // 6行 * 7列
  const remainingCells = totalCells - days.length

  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    days.push({
      day: i,
      date: `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
      isCurrentMonth: false,
      studied: false
    })
  }

  calendarDays.value = days
}

const prevMonth = () => {
  if (currentCalendarMonth.value === 1) {
    currentCalendarMonth.value = 12
    currentCalendarYear.value--
  } else {
    currentCalendarMonth.value--
  }
  loadLearningCalendar(currentCalendarYear.value, currentCalendarMonth.value)
}

const nextMonth = () => {
  if (currentCalendarMonth.value === 12) {
    currentCalendarMonth.value = 1
    currentCalendarYear.value++
  } else {
    currentCalendarMonth.value++
  }
  loadLearningCalendar(currentCalendarYear.value, currentCalendarMonth.value)
}

const savePrivacySettings = async () => {
  try {
    savingPrivacy.value = true

    // 这里需要调用更新隐私设置的API
    // 由于user.service.js中没有直接的方法，我们可以使用updateUserProfile
    await userService.updateUserProfile({
      privacySettings: {
        profileVisibility: privacyForm.profileVisibility,
        activityVisibility: privacyForm.activityVisibility,
        dataSharing: privacyForm.dataSharing
      }
    })

  } catch (err) {
    error.value = err.message || '保存隐私设置失败'
    console.error('保存隐私设置失败:', err)
  } finally {
    savingPrivacy.value = false
  }
}

const confirmDeleteAccount = async () => {
  try {
    deletingAccount.value = true
    deletePasswordError.value = ''

    // 这里需要调用删除账户的API
    // 由于user.service.js中没有deleteAccount方法，我们需要直接调用API
    // 这里使用模拟调用
    console.log('删除账户请求已发送，密码:', deletePassword.value)

    // 实际应该调用：await api.deleteAccount({ password: deletePassword.value })

    // 模拟成功
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 成功后清除本地状态
    userStore.reset()

    // 跳转到首页
    window.location.href = '/'

  } catch (err) {
    deletePasswordError.value = err.message || '密码验证失败'
    console.error('删除账户失败:', err)
  } finally {
    deletingAccount.value = false
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  deletePassword.value = ''
  deletePasswordError.value = ''
}

const clearError = () => {
  error.value = null
}
</script>

<style scoped>
.user-profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Quicksand', 'Comfortaa', sans-serif;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 48px;
  color: #FF6B8B;
  margin-bottom: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #FFD166;
  border-top-color: #FF6B8B;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  color: #666;
}

/* 错误提示 */
.error-container {
  background: #FFE5E5;
  border: 2px solid #FF6B8B;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 18px;
  color: #D32F2F;
  margin-bottom: 20px;
}

.error-retry-btn {
  background: #FF6B8B;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-retry-btn:hover {
  background: #FF4A6E;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 139, 0.3);
}

/* 卡片通用样式 */
.profile-card {
  background: white;
  border-radius: 32px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 2px solid #FFD166;
  transition: all 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 3px dashed #FFD166;
}

.card-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 32px;
  color: #06D6A0;
  margin: 0;
}

/* 按钮样式 */
.edit-btn, .refresh-btn, .save-btn, .cancel-btn,
.load-more-btn, .save-preferences-btn, .account-btn {
  border: none;
  border-radius: 50px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Quicksand', sans-serif;
}

.edit-btn {
  background: #118AB2;
  color: white;
}

.edit-btn:hover {
  background: #0A6D8C;
  transform: translateY(-2px);
}

.edit-btn.editing {
  background: #EF476F;
}

.refresh-btn {
  background: #FFD166;
  color: #333;
}

.refresh-btn:hover:not(:disabled) {
  background: #FFC233;
  transform: translateY(-2px);
}

.save-btn {
  background: #06D6A0;
  color: white;
  margin-right: 12px;
}

.save-btn:hover:not(:disabled) {
  background: #04B486;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #EF476F;
  color: white;
}

.cancel-btn:hover {
  background: #D32F5B;
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 头像区域 */
.avatar-section {
  text-align: center;
  margin-bottom: 32px;
}

.avatar-container {
  position: relative;
  display: inline-block;
  width: 160px;
  height: 160px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 6px solid #FFD166;
  box-shadow: 0 8px 24px rgba(255, 209, 102, 0.4);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-upload-label {
  color: white;
  cursor: pointer;
  text-align: center;
}

.upload-icon {
  display: block;
  font-size: 32px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  font-weight: bold;
}

.avatar-upload-input {
  display: none;
}

/* 上传进度 */
.upload-progress {
  margin-top: 16px;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  height: 12px;
  background: #E0E0E0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B8B, #FFD166);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

/* 表单样式 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  font-size: 16px;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid #FFD166;
  border-radius: 20px;
  font-size: 16px;
  font-family: 'Quicksand', sans-serif;
  transition: all 0.3s ease;
  background: #FFFBF0;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #06D6A0;
  box-shadow: 0 0 0 3px rgba(6, 214, 160, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-static {
  padding: 14px 20px;
  background: #F8F9FA;
  border-radius: 20px;
  border: 2px solid #E9ECEF;
  font-size: 16px;
  color: #333;
}

.form-hint {
  font-size: 14px;
  color: #666;
  margin-top: 6px;
  margin-bottom: 0;
}

.website-link {
  color: #118AB2;
  text-decoration: none;
  font-weight: bold;
}

.website-link:hover {
  text-decoration: underline;
  color: #0A6D8C;
}

.form-actions {
  margin-top: 32px;
  text-align: center;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.stat-item {
  background: linear-gradient(135deg, #FFFBF0, #FFF5E6);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.stat-item:hover {
  border-color: #FFD166;
  transform: translateY(-4px);
}

.stat-item.full-width {
  grid-column: 1 / -1;
}

.stat-icon {
  font-size: 40px;
  margin-right: 20px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #06D6A0;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

.today-progress {
  display: flex;
  gap: 32px;
  margin-top: 12px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-radius: 20px;
  border: 2px solid #E9ECEF;
}

.progress-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.progress-value {
  font-size: 18px;
  font-weight: bold;
  color: #118AB2;
}

.no-stats, .no-achievements, .no-activity {
  text-align: center;
  padding: 40px 0;
  color: #666;
}

.load-stats-btn, .load-achievements-btn {
  background: #118AB2;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.3s ease;
}

.load-stats-btn:hover, .load-achievements-btn:hover {
  background: #0A6D8C;
  transform: translateY(-2px);
}

/* 成就网格 */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.achievement-item {
  background: white;
  border: 3px solid #E9ECEF;
  border-radius: 24px;
  padding: 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.achievement-item.unlocked {
  border-color: #FFD166;
  background: linear-gradient(135deg, #FFFBF0, #FFF5E6);
}

.achievement-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.achievement-icon {
  font-size: 40px;
  margin-right: 20px;
  flex-shrink: 0;
}

.achievement-content {
  flex: 1;
}

.achievement-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.achievement-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.achievement-unlocked, .achievement-progress {
  font-size: 13px;
  color: #888;
}

.unlocked-date {
  font-weight: bold;
  color: #06D6A0;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.achievement-progress .progress-bar {
  flex: 1;
  height: 8px;
  margin: 0;
}

.achievement-progress .progress-text {
  font-size: 13px;
  font-weight: bold;
  color: #118AB2;
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 20px;
  border: 2px solid #E9ECEF;
  transition: all 0.3s ease;
}

.activity-item:hover {
  border-color: #FFD166;
  background: white;
}

.activity-icon {
  font-size: 32px;
  margin-right: 16px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 14px;
  color: #888;
}

/* 偏好设置 */
.preferences-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.preference-section {
  padding: 24px;
  background: #F8F9FA;
  border-radius: 24px;
  border: 2px solid #E9ECEF;
}

.section-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #118AB2;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px dashed #FFD166;
}

.preference-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.preference-label {
  min-width: 120px;
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.preference-slider {
  flex: 1;
  height: 12px;
  -webkit-appearance: none;
  background: #E0E0E0;
  border-radius: 6px;
  outline: none;
}

.preference-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: #06D6A0;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.preference-value {
  min-width: 60px;
  font-weight: bold;
  color: #118AB2;
  font-size: 16px;
}

.preference-select {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #FFD166;
  border-radius: 20px;
  font-size: 16px;
  background: white;
  cursor: pointer;
}

.preference-input {
  width: 80px;
  padding: 12px;
  border: 2px solid #FFD166;
  border-radius: 20px;
  font-size: 16px;
  text-align: center;
}

.preference-unit {
  font-size: 16px;
  color: #666;
}

.preference-checkbox {
  margin-right: 8px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.preference-actions {
  text-align: center;
  margin-top: 20px;
}

.save-preferences-btn {
  background: #06D6A0;
  color: white;
  padding: 14px 40px;
  font-size: 18px;
}

.save-preferences-btn:hover:not(:disabled) {
  background: #04B486;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(6, 214, 160, 0.3);
}

/* 账户操作 */
.account-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.account-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 24px;
  border: 3px solid;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.account-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.export-btn {
  border-color: #118AB2;
  color: #118AB2;
}

.export-btn:hover {
  background: #E3F2FD;
}

.clear-btn {
  border-color: #FFD166;
  color: #B38B00;
}

.clear-btn:hover {
  background: #FFFBF0;
}

.delete-btn {
  border-color: #EF476F;
  color: #EF476F;
}

.delete-btn:hover {
  background: #FFE5E5;
}

.btn-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.btn-text {
  font-size: 16px;
  font-weight: bold;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 32px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  border: 4px solid #FFD166;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 32px;
  color: #EF476F;
  margin-bottom: 16px;
  text-align: center;
}

.modal-text {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32px;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.modal-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.confirm-btn {
  background: #EF476F;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #D32F5B;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #E0E0E0;
  color: #333;
}

.cancel-btn:hover {
  background: #D0D0D0;
  transform: translateY(-2px);
}

/* 积分等级卡片 */
.points-card {
  background: linear-gradient(135deg, #FFFBF0 0%, #FFF5E6 100%);
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFD166;
  border-radius: 50px;
  padding: 8px 20px;
}

.level-icon {
  font-size: 20px;
}

.level-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.level-progress {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #FFD166;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-label {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.progress-percentage {
  font-size: 18px;
  font-weight: bold;
  color: #06D6A0;
}

.progress-bar {
  height: 16px;
  background: #E0E0E0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B8B, #FFD166);
  border-radius: 8px;
  transition: width 0.5s ease;
}

.progress-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.total-points {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #06D6A0;
}

.points-icon {
  font-size: 48px;
}

.points-content {
  flex: 1;
}

.points-value {
  font-size: 36px;
  font-weight: bold;
  color: #06D6A0;
  margin-bottom: 4px;
}

.points-label {
  font-size: 16px;
  color: #666;
}

.badges-section {
  margin-top: 24px;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 20px;
  border: 2px solid #E9ECEF;
  transition: all 0.3s ease;
  cursor: pointer;
}

.badge-item:hover {
  transform: translateY(-4px);
  border-color: #FFD166;
  box-shadow: 0 8px 24px rgba(255, 209, 102, 0.2);
}

.badge-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.badge-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  text-align: center;
}

/* 学习日历卡片 */
.calendar-card {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.calendar-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 20px;
  padding: 8px 16px;
  border: 2px solid #118AB2;
}

.stat-icon {
  font-size: 18px;
}

.stat-text {
  font-size: 16px;
  font-weight: bold;
  color: #118AB2;
}

.calendar-container {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #118AB2;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-nav-btn {
  background: #118AB2;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-nav-btn:hover {
  background: #0A6D8C;
  transform: scale(1.1);
}

.calendar-title {
  font-size: 24px;
  font-weight: bold;
  color: #118AB2;
  margin: 0;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.weekday {
  text-align: center;
  font-weight: bold;
  color: #666;
  padding: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  position: relative;
  transition: all 0.3s ease;
}

.calendar-day.empty {
  background: transparent;
}

.calendar-day.current-month {
  background: #F8F9FA;
  border: 2px solid #E9ECEF;
}

.calendar-day.studied {
  background: #C8F7DC;
  border-color: #06D6A0;
}

.calendar-day.today {
  background: #FFE5E5;
  border-color: #FF6B8B;
}

.calendar-day:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.day-number {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.study-indicator {
  position: absolute;
  bottom: 4px;
  width: 8px;
  height: 8px;
  background: #06D6A0;
  border-radius: 50%;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 6px;
}

.legend-color.studied {
  background: #C8F7DC;
  border: 2px solid #06D6A0;
}

.legend-color.today {
  background: #FFE5E5;
  border: 2px solid #FF6B8B;
}

.legend-text {
  font-size: 14px;
  color: #666;
}

/* 学习报告卡片 */
.report-card {
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E9 100%);
}

.report-period {
  text-align: right;
}

.period-text {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #FF6B8B;
  margin-bottom: 4px;
}

.period-dates {
  font-size: 14px;
  color: #888;
}

.report-summary {
  margin-bottom: 32px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid #FF6B8B;
  transition: all 0.3s ease;
}

.summary-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 107, 139, 0.2);
}

.summary-icon {
  font-size: 32px;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #FF6B8B;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.top-words-section,
.recommendations-section {
  margin-bottom: 32px;
}

.top-words-list {
  background: white;
  border-radius: 20px;
  border: 2px solid #FFD166;
  overflow: hidden;
  margin-top: 16px;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 2px dashed #FFD166;
  transition: all 0.3s ease;
}

.word-item:last-child {
  border-bottom: none;
}

.word-item:hover {
  background: #FFFBF0;
}

.word-rank {
  font-size: 18px;
  font-weight: bold;
  color: #FF6B8B;
  min-width: 40px;
}

.word-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.word-meaning {
  font-size: 14px;
  color: #666;
  flex: 2;
  margin: 0 16px;
}

.word-count {
  font-size: 14px;
  color: #888;
  font-weight: bold;
}

.recommendations-list {
  background: white;
  border-radius: 20px;
  border: 2px solid #06D6A0;
  overflow: hidden;
  margin-top: 16px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px dashed #06D6A0;
}

.recommendation-item:last-child {
  border-bottom: none;
}

.rec-icon {
  font-size: 24px;
  margin-right: 16px;
  color: #06D6A0;
}

.rec-content {
  font-size: 16px;
  color: #333;
  line-height: 1.5;
}

.report-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 2px dashed #FFD166;
}

.generated-text {
  font-size: 14px;
  color: #888;
}

/* 隐私设置卡片 */
.privacy-card {
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
}

.privacy-settings {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.privacy-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #9C27B0;
}

.privacy-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.privacy-option {
  flex: 1;
  min-width: 200px;
  background: #F8F9FA;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid #E9ECEF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.privacy-option:hover {
  border-color: #9C27B0;
  background: #F3E5F5;
}

.privacy-radio {
  margin-right: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.option-label {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.option-desc {
  display: block;
  font-size: 14px;
  color: #666;
}

.privacy-actions {
  text-align: center;
}

.save-privacy-btn {
  background: #9C27B0;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px 40px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-privacy-btn:hover:not(:disabled) {
  background: #7B1FA2;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(156, 39, 176, 0.3);
}

/* 模态框中的密码验证 */
.password-verify {
  margin: 24px 0;
}

.password-label {
  display: block;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.password-input {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid #FF6B8B;
  border-radius: 20px;
  font-size: 16px;
  font-family: 'Quicksand', sans-serif;
  transition: all 0.3s ease;
  background: #FFFBF0;
}

.password-input:focus {
  outline: none;
  border-color: #EF476F;
  box-shadow: 0 0 0 3px rgba(239, 71, 111, 0.2);
}

.password-error {
  color: #EF476F;
  font-size: 14px;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-profile-view {
    padding: 16px;
  }

  .page-title {
    font-size: 36px;
  }

  .card-title {
    font-size: 24px;
  }

  .profile-card {
    padding: 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .today-progress {
    flex-direction: column;
    gap: 12px;
  }

  .account-actions {
    grid-template-columns: 1fr;
  }

  .modal-content {
    padding: 24px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }

  .privacy-option {
    min-width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .word-item {
    flex-wrap: wrap;
  }

  .word-meaning {
    order: 3;
    width: 100%;
    margin: 8px 0 0 0;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 20px;
  }

  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .preference-label {
    min-width: auto;
  }

  .preference-slider,
  .preference-select,
  .preference-input {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .calendar-stats {
    flex-direction: column;
    gap: 8px;
  }

  .stat-item {
    justify-content: center;
  }
}
</style>