<template>
  <div class="user-settings-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">📋 用户设置</h1>
      <p class="page-subtitle">个性化你的阅记星学习体验</p>
    </div>

    <!-- 设置内容区域 -->
    <div class="settings-container">
      <!-- 左侧导航栏 -->
      <div class="settings-sidebar">
        <div class="sidebar-header">
          <div class="user-avatar">
            <span class="avatar-emoji">👤</span>
          </div>
          <h3 class="user-name">{{ userStore.user?.username || '用户' }}</h3>
          <p class="user-email">{{ userStore.user?.email || '未设置邮箱' }}</p>
        </div>

        <nav class="sidebar-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['nav-item', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-label">{{ tab.label }}</span>
            <span v-if="tab.badge" class="nav-badge">{{ tab.badge }}</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="reset-btn" @click="showResetConfirm = true">
            🔄 重置所有设置
          </button>
          <button class="export-btn" @click="exportSettings">
            📤 导出设置
          </button>
        </div>
      </div>

      <!-- 右侧设置内容 -->
      <div class="settings-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载设置中...</p>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="error-container">
          <div class="error-icon">⚠️</div>
          <h3>加载设置失败</h3>
          <p>{{ error }}</p>
          <button class="retry-btn" @click="loadSettings">重试</button>
        </div>

        <!-- 基本设置 -->
        <div v-if="activeTab === 'general' && !loading && !error" class="settings-section">
          <h2 class="section-title">⚙️ 基本设置</h2>
          
          <div class="settings-grid">
            <!-- 语言设置 -->
            <div class="setting-card">
              <h3 class="setting-title">🌐 语言</h3>
              <p class="setting-description">选择应用显示语言</p>
              <select 
                v-model="generalSettings.language" 
                class="setting-select"
                @change="updateGeneralSettings"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
                <option value="ko-KR">한국어</option>
              </select>
            </div>

            <!-- 主题设置 -->
            <div class="setting-card">
              <h3 class="setting-title">🎨 主题</h3>
              <p class="setting-description">选择应用主题风格</p>
              <div class="theme-options">
                <button
                  v-for="theme in themes"
                  :key="theme.id"
                  :class="['theme-option', { active: generalSettings.theme === theme.id }]"
                  @click="changeTheme(theme.id)"
                >
                  <span class="theme-icon">{{ theme.icon }}</span>
                  <span class="theme-label">{{ theme.label }}</span>
                </button>
              </div>
            </div>

            <!-- 字体大小 -->
            <div class="setting-card">
              <h3 class="setting-title">🔤 字体大小</h3>
              <p class="setting-description">调整应用字体大小</p>
              <div class="font-size-control">
                <button class="size-btn" @click="decreaseFontSize">➖</button>
                <span class="size-value">{{ generalSettings.fontSize }}px</span>
                <button class="size-btn" @click="increaseFontSize">➕</button>
              </div>
              <div class="font-size-preview">
                <p :style="{ fontSize: generalSettings.fontSize + 'px' }">
                  预览文字：Hello, 阅记星！
                </p>
              </div>
            </div>

            <!-- 时间设置 -->
            <div class="setting-card">
              <h3 class="setting-title">⏰ 时间设置</h3>
              <p class="setting-description">日期和时间格式</p>
              
              <div class="time-setting">
                <label>日期格式</label>
                <select v-model="generalSettings.dateFormat" @change="updateGeneralSettings">
                  <option value="YYYY-MM-DD">2024-01-01</option>
                  <option value="MM/DD/YYYY">01/01/2024</option>
                  <option value="DD/MM/YYYY">01/01/2024</option>
                  <option value="YYYY年MM月DD日">2024年01月01日</option>
                </select>
              </div>

              <div class="time-setting">
                <label>时间格式</label>
                <select v-model="generalSettings.timeFormat" @change="updateGeneralSettings">
                  <option value="24h">24小时制 (14:30)</option>
                  <option value="12h">12小时制 (2:30 PM)</option>
                </select>
              </div>

              <div class="time-setting">
                <label>时区</label>
                <select v-model="generalSettings.timezone" @change="updateGeneralSettings">
                  <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                  <option value="America/New_York">美国东部时间 (UTC-5)</option>
                  <option value="Europe/London">伦敦时间 (UTC+0)</option>
                  <option value="Asia/Tokyo">日本时间 (UTC+9)</option>
                </select>
              </div>
            </div>

            <!-- 自动保存 -->
            <div class="setting-card">
              <h3 class="setting-title">💾 自动保存</h3>
              <p class="setting-description">自动保存你的学习进度</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="generalSettings.autoSave"
                    @change="updateGeneralSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用自动保存</span>
                </label>
              </div>

              <div v-if="generalSettings.autoSave" class="interval-setting">
                <label>保存间隔</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="generalSettings.autoSaveInterval"
                    min="1"
                    max="60"
                    @change="updateGeneralSettings"
                  />
                  <span>{{ generalSettings.autoSaveInterval }} 分钟</span>
                </div>
              </div>
            </div>

            <!-- 数据同步 -->
            <div class="setting-card">
              <h3 class="setting-title">🔄 数据同步</h3>
              <p class="setting-description">同步你的学习数据到云端</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="generalSettings.syncEnabled"
                    @change="updateGeneralSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用云同步</span>
                </label>
              </div>

              <div v-if="generalSettings.syncEnabled" class="interval-setting">
                <label>同步间隔</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="generalSettings.syncInterval"
                    min="1"
                    max="60"
                    @change="updateGeneralSettings"
                  />
                  <span>{{ generalSettings.syncInterval }} 分钟</span>
                </div>
              </div>
            </div>

            <!-- 隐私设置 -->
            <div class="setting-card">
              <h3 class="setting-title">🔒 隐私设置</h3>
              <p class="setting-description">管理你的隐私和数据保留</p>
              
              <div class="privacy-setting">
                <label>隐私级别</label>
                <select v-model="generalSettings.privacyLevel" @change="updateGeneralSettings">
                  <option value="minimal">最小化（仅必要数据）</option>
                  <option value="standard">标准（平衡体验与隐私）</option>
                  <option value="strict">严格（最大隐私保护）</option>
                </select>
              </div>

              <div class="privacy-setting">
                <label>数据保留期限</label>
                <select v-model="generalSettings.dataRetentionDays" @change="updateGeneralSettings">
                  <option value="30">30天</option>
                  <option value="90">90天</option>
                  <option value="180">180天</option>
                  <option value="365">1年</option>
                  <option value="0">永久保留</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 阅读设置 -->
        <div v-if="activeTab === 'reading' && !loading && !error" class="settings-section">
          <h2 class="section-title">📖 阅读设置</h2>
          
          <div class="settings-grid">
            <!-- 字体设置 -->
            <div class="setting-card">
              <h3 class="setting-title">🔤 阅读字体</h3>
              <p class="setting-description">选择阅读器字体</p>
              <select v-model="readingSettings.fontFamily" @change="updateReadingSettings">
                <option value="system-ui">系统默认</option>
                <option value="Quicksand">Quicksand</option>
                <option value="Comfortaa">Comfortaa</option>
                <option value="Varela Round">Varela Round</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>

            <!-- 排版设置 -->
            <div class="setting-card">
              <h3 class="setting-title">📐 排版设置</h3>
              <p class="setting-description">调整阅读排版</p>
              
              <div class="typography-setting">
                <label>字体大小</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.fontSize"
                    min="10"
                    max="32"
                    @change="updateReadingSettings"
                  />
                  <span>{{ readingSettings.fontSize }}px</span>
                </div>
              </div>

              <div class="typography-setting">
                <label>行高</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.lineHeight"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    @change="updateReadingSettings"
                  />
                  <span>{{ readingSettings.lineHeight.toFixed(1) }}</span>
                </div>
              </div>

              <div class="typography-setting">
                <label>段落间距</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.paragraphSpacing"
                    min="0.5"
                    max="3"
                    step="0.1"
                    @change="updateReadingSettings"
                  />
                  <span>{{ readingSettings.paragraphSpacing.toFixed(1) }}em</span>
                </div>
              </div>

              <div class="typography-setting">
                <label>文本对齐</label>
                <div class="alignment-options">
                  <button
                    v-for="align in alignments"
                    :key="align.id"
                    :class="['align-option', { active: readingSettings.textAlign === align.id }]"
                    @click="changeTextAlign(align.id)"
                  >
                    {{ align.icon }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 阅读主题 -->
            <div class="setting-card">
              <h3 class="setting-title">🎨 阅读主题</h3>
              <p class="setting-description">选择阅读器主题</p>
              <div class="reading-theme-options">
                <button
                  v-for="theme in readingThemes"
                  :key="theme.id"
                  :class="['reading-theme-option', { active: readingSettings.theme === theme.id }]"
                  @click="changeReadingTheme(theme.id)"
                  :style="{ backgroundColor: theme.bgColor, color: theme.textColor }"
                >
                  <span class="theme-icon">{{ theme.icon }}</span>
                  <span class="theme-label">{{ theme.label }}</span>
                </button>
              </div>
            </div>

            <!-- 翻译设置 -->
            <div class="setting-card">
              <h3 class="setting-title">🌍 翻译设置</h3>
              <p class="setting-description">管理单词翻译显示</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="readingSettings.showTranslation"
                    @change="updateReadingSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">显示翻译</span>
                </label>
              </div>

              <div v-if="readingSettings.showTranslation" class="translation-setting">
                <label>翻译位置</label>
                <select v-model="readingSettings.translationPosition" @change="updateReadingSettings">
                  <option value="inline">行内显示</option>
                  <option value="sidebar">侧边栏</option>
                  <option value="popup">弹窗显示</option>
                </select>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="readingSettings.doubleClickTranslate"
                    @change="updateReadingSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">双击翻译</span>
                </label>
              </div>
            </div>

            <!-- 音频设置 -->
            <div class="setting-card">
              <h3 class="setting-title">🔊 音频设置</h3>
              <p class="setting-description">管理单词发音</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="readingSettings.autoPlayAudio"
                    @change="updateReadingSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">自动播放发音</span>
                </label>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="readingSettings.showPhonetic"
                    @change="updateReadingSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">显示音标</span>
                </label>
              </div>

              <div class="volume-setting">
                <label>音量</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.audioVolume"
                    min="0"
                    max="1"
                    step="0.1"
                    @change="updateReadingSettings"
                  />
                  <span>{{ Math.round(readingSettings.audioVolume * 100) }}%</span>
                </div>
              </div>
            </div>

            <!-- 高亮和笔记 -->
            <div class="setting-card">
              <h3 class="setting-title">🖍️ 高亮和笔记</h3>
              <p class="setting-description">管理文本高亮和笔记颜色</p>
              
              <div class="color-setting">
                <label>高亮颜色</label>
                <div class="color-options">
                  <button
                    v-for="color in highlightColors"
                    :key="color.id"
                    :class="['color-option', { active: readingSettings.highlightColor === color.value }]"
                    :style="{ backgroundColor: color.value }"
                    @click="changeHighlightColor(color.value)"
                  ></button>
                </div>
              </div>

              <div class="color-setting">
                <label>笔记颜色</label>
                <div class="color-options">
                  <button
                    v-for="color in noteColors"
                    :key="color.id"
                    :class="['color-option', { active: readingSettings.noteColor === color.value }]"
                    :style="{ backgroundColor: color.value }"
                    @click="changeNoteColor(color.value)"
                  ></button>
                </div>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="readingSettings.textSelection"
                    @change="updateReadingSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">允许文本选择</span>
                </label>
              </div>
            </div>

            <!-- 阅读布局 -->
            <div class="setting-card">
              <h3 class="setting-title">📐 阅读布局</h3>
              <p class="setting-description">调整阅读器布局</p>
              
              <div class="layout-setting">
                <label>最大宽度</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.maxWidth"
                    min="400"
                    max="1200"
                    step="50"
                    @change="updateReadingSettings"
                  />
                  <span>{{ readingSettings.maxWidth }}px</span>
                </div>
              </div>

              <div class="layout-setting">
                <label>边距</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.margin"
                    min="0"
                    max="100"
                    step="5"
                    @change="updateReadingSettings"
                  />
                  <span>{{ readingSettings.margin }}px</span>
                </div>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="readingSettings.autoScroll"
                    @change="updateReadingSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">自动滚动</span>
                </label>
              </div>

              <div v-if="readingSettings.autoScroll" class="scroll-setting">
                <label>滚动速度</label>
                <div class="slider-control">
                  <input
                    type="range"
                    v-model="readingSettings.scrollSpeed"
                    min="0.5"
                    max="5"
                    step="0.5"
                    @change="updateReadingSettings"
                  />
                  <span>{{ readingSettings.scrollSpeed.toFixed(1) }}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 复习设置 -->
        <div v-if="activeTab === 'review' && !loading && !error" class="settings-section">
          <h2 class="section-title">🔄 复习设置</h2>
          
          <div class="settings-grid">
            <!-- 每日目标 -->
            <div class="setting-card">
              <h3 class="setting-title">🎯 每日目标</h3>
              <p class="setting-description">设置每日复习单词数量</p>
              
              <div class="goal-setting">
                <label>每日复习目标</label>
                <div class="number-control">
                  <button class="number-btn" @click="decreaseDailyGoal">➖</button>
                  <span class="number-value">{{ reviewSettings.dailyGoal }} 个单词</span>
                  <button class="number-btn" @click="increaseDailyGoal">➕</button>
                </div>
                <p class="goal-hint">建议：20-50个单词/天</p>
              </div>

              <div class="goal-setting">
                <label>每日新词数量</label>
                <div class="number-control">
                  <button class="number-btn" @click="decreaseNewWords">➖</button>
                  <span class="number-value">{{ reviewSettings.newWordsPerDay }} 个新词</span>
                  <button class="number-btn" @click="increaseNewWords">➕</button>
                </div>
              </div>
            </div>

            <!-- 复习时间 -->
            <div class="setting-card">
              <h3 class="setting-title">⏰ 复习时间</h3>
              <p class="setting-description">设置最佳复习时间</p>
              
              <div class="time-setting">
                <label>每日复习时间</label>
                <input
                  type="time"
                  v-model="reviewSettings.reviewTime"
                  @change="updateReviewSettings"
                />
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="reviewSettings.reminderEnabled"
                    @change="updateReviewSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用复习提醒</span>
                </label>
              </div>

              <div v-if="reviewSettings.reminderEnabled" class="time-setting">
                <label>提醒时间</label>
                <input
                  type="time"
                  v-model="reviewSettings.reminderTime"
                  @change="updateReviewSettings"
                />
              </div>
            </div>

            <!-- 复习算法 -->
            <div class="setting-card">
              <h3 class="setting-title">🧠 复习算法</h3>
              <p class="setting-description">选择智能复习算法</p>
              
              <div class="algorithm-options">
                <button
                  v-for="algo in algorithms"
                  :key="algo.id"
                  :class="['algorithm-option', { active: reviewSettings.difficultyAlgorithm === algo.id }]"
                  @click="changeAlgorithm(algo.id)"
                >
                  <span class="algo-icon">{{ algo.icon }}</span>
                  <span class="algo-label">{{ algo.label }}</span>
                  <span class="algo-description">{{ algo.description }}</span>
                </button>
              </div>
            </div>

            <!-- 复习间隔 -->
            <div class="setting-card">
              <h3 class="setting-title">📅 复习间隔</h3>
              <p class="setting-description">调整不同难度单词的复习间隔</p>
              
              <div class="interval-setting">
                <label>不认识</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="reviewSettings.reviewInterval.again"
                    min="1"
                    max="7"
                    @change="updateReviewSettings"
                  />
                  <span>{{ reviewSettings.reviewInterval.again }} 天后复习</span>
                </div>
              </div>

              <div class="interval-setting">
                <label>困难</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="reviewSettings.reviewInterval.hard"
                    min="3"
                    max="30"
                    step="1"
                    @change="updateReviewSettings"
                  />
                  <span>{{ reviewSettings.reviewInterval.hard }} 天后复习</span>
                </div>
              </div>

              <div class="interval-setting">
                <label>一般</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="reviewSettings.reviewInterval.good"
                    min="7"
                    max="90"
                    step="7"
                    @change="updateReviewSettings"
                  />
                  <span>{{ reviewSettings.reviewInterval.good }} 天后复习</span>
                </div>
              </div>

              <div class="interval-setting">
                <label>简单</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="reviewSettings.reviewInterval.easy"
                    min="30"
                    max="365"
                    step="30"
                    @change="updateReviewSettings"
                  />
                  <span>{{ reviewSettings.reviewInterval.easy }} 天后复习</span>
                </div>
              </div>
            </div>

            <!-- 复习选项 -->
            <div class="setting-card">
              <h3 class="setting-title">⚙️ 复习选项</h3>
              <p class="setting-description">自定义复习体验</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="reviewSettings.showExamples"
                    @change="updateReviewSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">显示例句</span>
                </label>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="reviewSettings.showImages"
                    @change="updateReviewSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">显示图片</span>
                </label>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="reviewSettings.autoPlayAudioInReview"
                    @change="updateReviewSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">复习时自动播放发音</span>
                </label>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="reviewSettings.shuffleQuestions"
                    @change="updateReviewSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">随机顺序出题</span>
                </label>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="reviewSettings.enableStreak"
                    @change="updateReviewSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用连续学习天数</span>
                </label>
              </div>

              <div v-if="reviewSettings.enableStreak" class="streak-setting">
                <label>连续学习目标</label>
                <div class="number-control">
                  <button class="number-btn" @click="decreaseStreakGoal">➖</button>
                  <span class="number-value">{{ reviewSettings.streakGoal }} 天</span>
                  <button class="number-btn" @click="increaseStreakGoal">➕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-if="activeTab === 'notification' && !loading && !error" class="settings-section">
          <h2 class="section-title">🔔 通知设置</h2>
          
          <div class="settings-grid">
            <!-- 邮件通知 -->
            <div class="setting-card">
              <h3 class="setting-title">📧 邮件通知</h3>
              <p class="setting-description">管理邮件通知设置</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.emailNotifications.enabled"
                    @change="updateNotificationSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用邮件通知</span>
                </label>
              </div>

              <div v-if="notificationSettings.emailNotifications.enabled" class="notification-options">
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.emailNotifications.dailyDigest"
                      @change="updateNotificationSettings"
                    />
                    每日学习摘要
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.emailNotifications.weeklyReport"
                      @change="updateNotificationSettings"
                    />
                    每周学习报告
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.emailNotifications.achievementUnlocked"
                      @change="updateNotificationSettings"
                    />
                    成就解锁通知
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.emailNotifications.reviewReminder"
                      @change="updateNotificationSettings"
                    />
                    复习提醒
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.emailNotifications.systemUpdates"
                      @change="updateNotificationSettings"
                    />
                    系统更新通知
                  </label>
                </div>
              </div>
            </div>

            <!-- 推送通知 -->
            <div class="setting-card">
              <h3 class="setting-title">📱 推送通知</h3>
              <p class="setting-description">管理应用内推送通知</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.pushNotifications.enabled"
                    @change="updateNotificationSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用推送通知</span>
                </label>
              </div>

              <div v-if="notificationSettings.pushNotifications.enabled" class="notification-options">
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.pushNotifications.reviewReminder"
                      @change="updateNotificationSettings"
                    />
                    复习提醒
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.pushNotifications.dailyGoalReminder"
                      @change="updateNotificationSettings"
                    />
                    每日目标提醒
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.pushNotifications.streakReminder"
                      @change="updateNotificationSettings"
                    />
                    连续学习提醒
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.pushNotifications.newFeature"
                      @change="updateNotificationSettings"
                    />
                    新功能通知
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.pushNotifications.promotional"
                      @change="updateNotificationSettings"
                    />
                    推广通知
                  </label>
                </div>
              </div>
            </div>

            <!-- 应用内通知 -->
            <div class="setting-card">
              <h3 class="setting-title">💬 应用内通知</h3>
              <p class="setting-description">管理应用内通知显示</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.inAppNotifications.enabled"
                    @change="updateNotificationSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用应用内通知</span>
                </label>
              </div>

              <div v-if="notificationSettings.inAppNotifications.enabled" class="notification-options">
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.inAppNotifications.showBadge"
                      @change="updateNotificationSettings"
                    />
                    显示通知角标
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.inAppNotifications.soundEnabled"
                      @change="updateNotificationSettings"
                    />
                    启用声音
                  </label>
                </div>
                <div class="notification-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="notificationSettings.inAppNotifications.vibrationEnabled"
                      @change="updateNotificationSettings"
                    />
                    启用震动
                  </label>
                </div>
              </div>
            </div>

            <!-- 静默时段 -->
            <div class="setting-card">
              <h3 class="setting-title">🌙 静默时段</h3>
              <p class="setting-description">设置免打扰时间段</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="notificationSettings.quietHours.enabled"
                    @change="updateNotificationSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用静默时段</span>
                </label>
              </div>

              <div v-if="notificationSettings.quietHours.enabled" class="quiet-hours-setting">
                <div class="time-range">
                  <label>开始时间</label>
                  <input
                    type="time"
                    v-model="notificationSettings.quietHours.startTime"
                    @change="updateNotificationSettings"
                  />
                </div>
                <div class="time-range">
                  <label>结束时间</label>
                  <input
                    type="time"
                    v-model="notificationSettings.quietHours.endTime"
                    @change="updateNotificationSettings"
                  />
                </div>
                <p class="quiet-hours-hint">
                  在 {{ notificationSettings.quietHours.startTime }} 到 
                  {{ notificationSettings.quietHours.endTime }} 期间不会发送通知
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索设置 -->
        <div v-if="activeTab === 'search' && !loading && !error" class="settings-section">
          <h2 class="section-title">🔍 搜索设置</h2>
          
          <div class="settings-grid">
            <!-- 搜索选项 -->
            <div class="setting-card">
              <h3 class="setting-title">⚙️ 搜索选项</h3>
              <p class="setting-description">自定义搜索行为</p>
              
              <div class="search-option">
                <label>
                  <input
                    type="checkbox"
                    v-model="searchSettings.autoComplete"
                    @change="updateSearchSettings"
                  />
                  启用搜索联想
                </label>
              </div>

              <div class="search-option">
                <label>
                  <input
                    type="checkbox"
                    v-model="searchSettings.instantSearch"
                    @change="updateSearchSettings"
                  />
                  启用实时搜索
                </label>
              </div>

              <div class="search-option">
                <label>
                  <input
                    type="checkbox"
                    v-model="searchSettings.saveHistory"
                    @change="updateSearchSettings"
                  />
                  保存搜索历史
                </label>
              </div>

              <div class="search-option">
                <label>
                  <input
                    type="checkbox"
                    v-model="searchSettings.showSuggestions"
                    @change="updateSearchSettings"
                  />
                  显示搜索建议
                </label>
              </div>
            </div>

            <!-- 搜索范围 -->
            <div class="setting-card">
              <h3 class="setting-title">📚 搜索范围</h3>
              <p class="setting-description">选择默认搜索内容类型</p>
              
              <div class="search-scope-options">
                <button
                  v-for="scope in searchScopes"
                  :key="scope.id"
                  :class="['scope-option', { active: searchSettings.defaultScope === scope.id }]"
                  @click="changeSearchScope(scope.id)"
                >
                  <span class="scope-icon">{{ scope.icon }}</span>
                  <span class="scope-label">{{ scope.label }}</span>
                </button>
              </div>
            </div>

            <!-- 搜索历史 -->
            <div class="setting-card">
              <h3 class="setting-title">📜 搜索历史</h3>
              <p class="setting-description">管理你的搜索历史记录</p>
              
              <div class="search-history-actions">
                <button class="action-btn" @click="clearSearchHistory">
                  🗑️ 清除搜索历史
                </button>
                <button class="action-btn" @click="exportSearchHistory">
                  📤 导出搜索历史
                </button>
              </div>

              <div v-if="searchHistory.length > 0" class="search-history-list">
                <div
                  v-for="item in searchHistory"
                  :key="item.id"
                  class="history-item"
                >
                  <span class="history-keyword">{{ item.keyword }}</span>
                  <span class="history-type">{{ item.type }}</span>
                  <span class="history-time">{{ item.timestamp }}</span>
                  <button class="delete-btn" @click="deleteSearchHistoryItem(item.id)">
                    ×
                  </button>
                </div>
              </div>
              <div v-else class="empty-history">
                <p>暂无搜索历史</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 离线管理 -->
        <div v-if="activeTab === 'offline' && !loading && !error" class="settings-section">
          <h2 class="section-title">📱 离线管理</h2>
          
          <div class="settings-grid">
            <!-- 离线模式 -->
            <div class="setting-card">
              <h3 class="setting-title">🌐 离线模式</h3>
              <p class="setting-description">管理离线使用设置</p>
              
              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="offlineSettings.offlineMode"
                    @change="updateOfflineSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用离线模式</span>
                </label>
              </div>

              <div class="toggle-setting">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    v-model="offlineSettings.autoSync"
                    @change="updateOfflineSettings"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">启用自动同步</span>
                </label>
              </div>

              <div v-if="offlineSettings.autoSync" class="sync-interval-setting">
                <label>同步间隔</label>
                <div class="interval-control">
                  <input
                    type="range"
                    v-model="offlineSettings.syncInterval"
                    min="1"
                    max="1440"
                    step="5"
                    @change="updateOfflineSettings"
                  />
                  <span>{{ offlineSettings.syncInterval }} 分钟</span>
                </div>
              </div>
            </div>

            <!-- 离线数据统计 -->
            <div class="setting-card">
              <h3 class="setting-title">📊 离线数据统计</h3>
              <p class="setting-description">查看离线存储的数据</p>
              
              <div class="offline-stats">
                <div class="stat-item">
                  <span class="stat-label">文档数量</span>
                  <span class="stat-value">{{ offlineStats.documentsCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">词汇数量</span>
                  <span class="stat-value">{{ offlineStats.vocabularyCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">复习记录</span>
                  <span class="stat-value">{{ offlineStats.reviewsCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">数据大小</span>
                  <span class="stat-value">{{ formatFileSize(offlineStats.totalSize) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">待同步操作</span>
                  <span class="stat-value">{{ offlineStats.pendingOperations }}</span>
                </div>
              </div>

              <div class="sync-actions">
                <button 
                  class="sync-btn" 
                  @click="syncOfflineData"
                  :disabled="offlineStore.isSyncing || !isOnline"
                >
                  {{ offlineStore.isSyncing ? '同步中...' : '🔄 立即同步' }}
                </button>
                <button 
                  class="check-btn" 
                  @click="checkNetworkStatus"
                >
                  📶 检查网络
                </button>
              </div>
            </div>

            <!-- 离线缓存管理 -->
            <div class="setting-card">
              <h3 class="setting-title">🗑️ 缓存管理</h3>
              <p class="setting-description">管理离线缓存数据</p>
              
              <div class="cache-options">
                <div class="cache-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="cacheSettings.clearDocuments"
                    />
                    清除文档缓存
                  </label>
                </div>
                <div class="cache-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="cacheSettings.clearVocabulary"
                    />
                    清除词汇缓存
                  </label>
                </div>
                <div class="cache-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="cacheSettings.clearReviews"
                    />
                    清除复习记录
                  </label>
                </div>
                <div class="cache-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="cacheSettings.clearAll"
                      @change="toggleClearAllCache"
                    />
                    清除所有缓存
                  </label>
                </div>
              </div>

              <div class="cache-actions">
                <button 
                  class="clear-btn" 
                  @click="clearOfflineCache"
                  :disabled="!hasCacheSelection"
                >
                  🧹 清除选中缓存
                </button>
                <button class="export-btn" @click="exportOfflineData">
                  📤 导出离线数据
                </button>
                <button class="import-btn" @click="showImportDialog = true">
                  📥 导入离线数据
                </button>
              </div>
            </div>

            <!-- 网络状态 -->
            <div class="setting-card">
              <h3 class="setting-title">📡 网络状态</h3>
              <p class="setting-description">当前网络连接状态</p>
              
              <div class="network-status">
                <div class="status-indicator" :class="{ online: isOnline, offline: !isOnline }">
                  <span class="status-icon">{{ isOnline ? '✅' : '❌' }}</span>
                  <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
                </div>
                
                <div v-if="isOnline" class="network-info">
                  <p>网络连接正常</p>
                  <p>最后同步时间: {{ formatDate(offlineStore.lastSyncTime) }}</p>
                </div>
                <div v-else class="network-info">
                  <p>网络连接已断开</p>
                  <p>正在使用离线模式</p>
                  <p>待同步操作: {{ offlineStore.pendingOperations }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div v-if="activeTab === 'data' && !loading && !error" class="settings-section">
          <h2 class="section-title">💾 数据管理</h2>
          
          <div class="settings-grid">
            <!-- 数据导出 -->
            <div class="setting-card">
              <h3 class="setting-title">📤 数据导出</h3>
              <p class="setting-description">导出你的学习数据</p>
              
              <div class="export-options">
                <div class="export-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="exportSettings.includeDocuments"
                    />
                    包含文档
                  </label>
                </div>
                <div class="export-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="exportSettings.includeVocabulary"
                    />
                    包含词汇
                  </label>
                </div>
                <div class="export-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="exportSettings.includeReviews"
                    />
                    包含复习记录
                  </label>
                </div>
                <div class="export-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="exportSettings.includeNotes"
                    />
                    包含笔记
                  </label>
                </div>
                <div class="export-option">
                  <label>
                    <input
                      type="checkbox"
                      v-model="exportSettings.includeHighlights"
                    />
                    包含高亮
                  </label>
                </div>
              </div>

              <div class="format-options">
                <label>导出格式</label>
                <select v-model="exportSettings.format">
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <button class="export-data-btn" @click="exportUserData">
                📥 导出数据
              </button>
            </div>

            <!-- 数据导入 -->
            <div class="setting-card">
              <h3 class="setting-title">📥 数据导入</h3>
              <p class="setting-description">导入学习数据</p>
              
              <div class="import-options">
                <div class="import-option">
                  <label>
                    <input
                      type="radio"
                      v-model="importSettings.mode"
                      value="merge"
                    />
                    合并数据
                  </label>
                </div>
                <div class="import-option">
                  <label>
                    <input
                      type="radio"
                      v-model="importSettings.mode"
                      value="replace"
                    />
                    替换数据
                  </label>
                </div>
              </div>

              <div class="file-upload">
                <input
                  type="file"
                  ref="importFileInput"
                  @change="handleImportFile"
                  accept=".json,.csv,.pdf"
                  style="display: none"
                />
                <button class="upload-btn" @click="triggerFileInput">
                  📁 选择文件
                </button>
                <p v-if="importSettings.fileName" class="file-name">
                  已选择: {{ importSettings.fileName }}
                </p>
              </div>

              <button 
                class="import-data-btn" 
                @click="importUserData"
                :disabled="!importSettings.file"
              >
                🔄 导入数据
              </button>
            </div>

            <!-- 缓存管理 -->
            <div class="setting-card">
              <h3 class="setting-title">🧹 缓存管理</h3>
              <p class="setting-description">管理应用缓存数据</p>
              
              <div class="cache-info">
                <div class="cache-stat">
                  <span class="stat-label">缓存大小</span>
                  <span class="stat-value">{{ formatFileSize(cacheStats.totalSize) }}</span>
                </div>
                <div class="cache-stat">
                  <span class="stat-label">缓存项目</span>
                  <span class="stat-value">{{ cacheStats.itemCount }}</span>
                </div>
                <div class="cache-stat">
                  <span class="stat-label">最后清理</span>
                  <span class="stat-value">{{ formatDate(cacheStats.lastCleared) }}</span>
                </div>
              </div>

              <div class="cache-actions">
                <button class="clear-cache-btn" @click="clearAppCache">
                  🧼 清除应用缓存
                </button>
                <button class="analyze-cache-btn" @click="analyzeCache">
                  📊 分析缓存
                </button>
              </div>
            </div>

            <!-- 数据备份 -->
            <div class="setting-card">
              <h3 class="setting-title">💽 数据备份</h3>
              <p class="setting-description">备份和恢复学习数据</p>
              
              <div class="backup-info">
                <p>最后备份时间: {{ formatDate(backupInfo.lastBackup) }}</p>
                <p>备份大小: {{ formatFileSize(backupInfo.backupSize) }}</p>
                <p>备份数量: {{ backupInfo.backupCount }}</p>
              </div>

              <div class="backup-actions">
                <button class="backup-btn" @click="createBackup">
                  💾 创建备份
                </button>
                <button class="restore-btn" @click="showRestoreDialog = true">
                  🔄 恢复备份
                </button>
                <button class="manage-backups-btn" @click="manageBackups">
                  📋 管理备份
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <AppModal
      v-if="showResetConfirm"
      title="⚠️ 确认重置"
      :show-close="true"
      :show-footer="true"
      @close="showResetConfirm = false"
      @confirm="resetAllSettings"
    >
      <p>确定要重置所有设置为默认值吗？</p>
      <p class="warning-text">此操作不可撤销，所有自定义设置将被清除。</p>
    </AppModal>

    <!-- 导入对话框 -->
    <AppModal
      v-if="showImportDialog"
      title="📥 导入数据"
      :show-close="true"
      :show-footer="true"
      @close="showImportDialog = false"
      @confirm="importOfflineData"
    >
      <div class="import-dialog">
        <p>选择要导入的数据文件：</p>
        <input
          type="file"
          @change="handleOfflineImportFile"
          accept=".json,.csv"
        />
        <div v-if="importFile" class="import-preview">
          <p>文件: {{ importFile.name }}</p>
          <p>大小: {{ formatFileSize(importFile.size) }}</p>
        </div>
      </div>
    </AppModal>

    <!-- 恢复备份对话框 -->
    <AppModal
      v-if="showRestoreDialog"
      title="🔄 恢复备份"
      :show-close="true"
      :show-footer="true"
      size="lg"
      @close="showRestoreDialog = false"
      @confirm="restoreBackup"
    >
      <div class="restore-dialog">
        <p>选择要恢复的备份：</p>
        <div v-if="backupList.length > 0" class="backup-list">
          <div
            v-for="backup in backupList"
            :key="backup.id"
            class="backup-item"
            :class="{ selected: selectedBackup === backup.id }"
            @click="selectedBackup = backup.id"
          >
            <span class="backup-date">{{ formatDate(backup.date) }}</span>
            <span class="backup-size">{{ formatFileSize(backup.size) }}</span>
            <span class="backup-items">{{ backup.itemCount }} 个项目</span>
          </div>
        </div>
        <div v-else class="no-backups">
          <p>暂无可用备份</p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings.store'
import { useUserStore } from '@/stores/user.store'
import { useOfflineStore } from '@/stores/offline.store'
import settingsService from '@/services/settings.service'
import searchService from '@/services/search.service'
import offlineService from '@/services/offline.service'
import { formatDate, formatFileSize } from '@/utils/formatter'
import AppModal from '@/components/common/AppModal.vue'

// Store
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const offlineStore = useOfflineStore()

// 状态
const loading = ref(true)
const error = ref(null)
const activeTab = ref('general')
const showResetConfirm = ref(false)
const showImportDialog = ref(false)
const showRestoreDialog = ref(false)
const importFile = ref(null)
const selectedBackup = ref(null)

// 设置数据
const generalSettings = reactive({
  language: 'zh-CN',
  theme: 'light',
  fontSize: 14,
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  autoSave: true,
  autoSaveInterval: 30,
  syncEnabled: true,
  syncInterval: 5,
  dataRetentionDays: 90,
  privacyLevel: 'standard'
})

const readingSettings = reactive({
  fontFamily: 'system-ui',
  fontSize: 16,
  lineHeight: 1.6,
  paragraphSpacing: 1.2,
  theme: 'light',
  contrast: 'normal',
  highlightColor: '#FFEB3B',
  noteColor: '#4CAF50',
  autoScroll: false,
  scrollSpeed: 1,
  showTranslation: true,
  translationPosition: 'inline',
  showPhonetic: true,
  showDefinition: true,
  autoPlayAudio: true,
  audioVolume: 0.7,
  textSelection: true,
  doubleClickTranslate: true,
  wordBreak: 'normal',
  textAlign: 'left',
  maxWidth: 800,
  margin: 20
})

const reviewSettings = reactive({
  dailyGoal: 20,
  reviewTime: '09:00',
  reminderEnabled: true,
  reminderTime: '20:00',
  difficultyAlgorithm: 'sm2',
  newWordsPerDay: 10,
  reviewWordsPerDay: 50,
  autoGenerateReviews: true,
  reviewInterval: {
    again: 1,
    hard: 10,
    good: 1,
    easy: 3
  },
  showExamples: true,
  showImages: true,
  autoPlayAudioInReview: true,
  shuffleQuestions: true,
  enableStreak: true,
  streakGoal: 7,
  enableNotifications: true
})

const notificationSettings = reactive({
  emailNotifications: {
    enabled: true,
    dailyDigest: true,
    weeklyReport: true,
    achievementUnlocked: true,
    reviewReminder: true,
    systemUpdates: true
  },
  pushNotifications: {
    enabled: true,
    reviewReminder: true,
    dailyGoalReminder: true,
    streakReminder: true,
    newFeature: true,
    promotional: false
  },
  inAppNotifications: {
    enabled: true,
    showBadge: true,
    soundEnabled: true,
    vibrationEnabled: true
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  }
})

const searchSettings = reactive({
  autoComplete: true,
  instantSearch: true,
  saveHistory: true,
  showSuggestions: true,
  defaultScope: 'all'
})

const offlineSettings = reactive({
  offlineMode: false,
  autoSync: true,
  syncInterval: 5
})

const cacheSettings = reactive({
  clearDocuments: false,
  clearVocabulary: false,
  clearReviews: false,
  clearAll: false
})

const exportSettings = reactive({
  includeDocuments: true,
  includeVocabulary: true,
  includeReviews: true,
  includeNotes: true,
  includeHighlights: true,
  format: 'json'
})

const importSettings = reactive({
  mode: 'merge',
  file: null,
  fileName: ''
})

// 计算属性
const isOnline = computed(() => offlineStore.isOnline)

const offlineStats = computed(() => ({
  documentsCount: offlineStore.offlineDocuments.length,
  vocabularyCount: offlineStore.offlineVocabulary.length,
  reviewsCount: offlineStore.offlineReviews.length,
  totalSize: offlineStore.offlineDataSize,
  pendingOperations: offlineStore.pendingOperations
}))

const cacheStats = reactive({
  totalSize: 0,
  itemCount: 0,
  lastCleared: null
})

const backupInfo = reactive({
  lastBackup: null,
  backupSize: 0,
  backupCount: 0
})

const backupList = ref([])

const searchHistory = ref([])

const hasCacheSelection = computed(() => {
  return cacheSettings.clearDocuments || 
         cacheSettings.clearVocabulary || 
         cacheSettings.clearReviews || 
         cacheSettings.clearAll
})

// 标签页配置
const tabs = [
  { id: 'general', label: '基本设置', icon: '⚙️' },
  { id: 'reading', label: '阅读设置', icon: '📖' },
  { id: 'review', label: '复习设置', icon: '🔄' },
  { id: 'notification', label: '通知设置', icon: '🔔' },
  { id: 'search', label: '搜索设置', icon: '🔍' },
  { id: 'offline', label: '离线管理', icon: '📱' },
  { id: 'data', label: '数据管理', icon: '💾' }
]

// 主题选项
const themes = [
  { id: 'light', label: '明亮', icon: '☀️' },
  { id: 'dark', label: '暗黑', icon: '🌙' },
  { id: 'auto', label: '自动', icon: '🔄' }
]

// 阅读主题选项
const readingThemes = [
  { id: 'light', label: '明亮', icon: '☀️', bgColor: '#ffffff', textColor: '#000000' },
  { id: 'dark', label: '暗黑', icon: '🌙', bgColor: '#1a1a1a', textColor: '#ffffff' },
  { id: 'sepia', label: '护眼', icon: '👁️', bgColor: '#f4ecd8', textColor: '#5b4636' },
  { id: 'night', label: '夜间', icon: '🌃', bgColor: '#0a0a0a', textColor: '#cccccc' }
]

// 对齐选项
const alignments = [
  { id: 'left', label: '左对齐', icon: '⬅️' },
  { id: 'center', label: '居中', icon: '↔️' },
  { id: 'right', label: '右对齐', icon: '➡️' },
  { id: 'justify', label: '两端对齐', icon: '↕️' }
]

// 高亮颜色选项
const highlightColors = [
  { id: 'yellow', value: '#FFEB3B' },
  { id: 'blue', value: '#2196F3' },
  { id: 'green', value: '#4CAF50' },
  { id: 'pink', value: '#E91E63' },
  { id: 'orange', value: '#FF9800' },
  { id: 'purple', value: '#9C27B0' }
]

// 笔记颜色选项
const noteColors = [
  { id: 'green', value: '#4CAF50' },
  { id: 'blue', value: '#2196F3' },
  { id: 'yellow', value: '#FFEB3B' },
  { id: 'red', value: '#F44336' },
  { id: 'purple', value: '#9C27B0' },
  { id: 'teal', value: '#009688' }
]

// 算法选项
const algorithms = [
  { id: 'sm2', label: 'SM2算法', description: '基于遗忘曲线的经典算法', icon: '📈' },
  { id: 'fsrs', label: 'FSRS算法', description: '现代优化算法，更精准', icon: '🎯' },
  { id: 'custom', label: '自定义算法', description: '根据个人习惯调整', icon: '⚙️' }
]

// 搜索范围选项
const searchScopes = [
  { id: 'all', label: '全部', icon: '🔍' },
  { id: 'documents', label: '文档', icon: '📄' },
  { id: 'vocabulary', label: '词汇', icon: '📖' },
  { id: 'notes', label: '笔记', icon: '📝' },
  { id: 'tags', label: '标签', icon: '🏷️' }
]

// 生命周期
onMounted(async () => {
  await loadSettings()
  await loadSearchHistory()
  await loadCacheStats()
  await loadBackupInfo()
})

// 方法
const loadSettings = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 获取所有设置
    const allSettings = await settingsService.getAllSettings()
    
    // 更新基本设置
    Object.assign(generalSettings, allSettings.settings)
    
    // 更新阅读设置
    Object.assign(readingSettings, allSettings.readingSettings)
    
    // 更新复习设置
    Object.assign(reviewSettings, allSettings.reviewSettings)
    
    // 更新通知设置
    Object.assign(notificationSettings, allSettings.notificationSettings)
    
    // 更新离线设置
    const offlineMode = await offlineService.getOfflineMode()
    const autoSync = await offlineService.getAutoSync()
    const syncInterval = await offlineService.getSyncInterval()
    
    offlineSettings.offlineMode = offlineMode
    offlineSettings.autoSync = autoSync
    offlineSettings.syncInterval = syncInterval
    
  } catch (err) {
    console.error('加载设置失败:', err)
    error.value = err.message || '加载设置失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const loadSearchHistory = async () => {
  try {
    const history = await searchService.getSearchHistory({ pageSize: 10 })
    searchHistory.value = history.items
  } catch (err) {
    console.error('加载搜索历史失败:', err)
  }
}

const loadCacheStats = async () => {
  // 模拟缓存统计
  cacheStats.totalSize = 256 * 1024 * 1024 // 256MB
  cacheStats.itemCount = 1245
  cacheStats.lastCleared = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

const loadBackupInfo = async () => {
  // 模拟备份信息
  backupInfo.lastBackup = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  backupInfo.backupSize = 128 * 1024 * 1024 // 128MB
  backupInfo.backupCount = 5
  
  // 模拟备份列表
  backupList.value = [
    {
      id: '1',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      size: 45 * 1024 * 1024,
      itemCount: 456
    },
    {
      id: '2',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      size: 42 * 1024 * 1024,
      itemCount: 423
    },
    {
      id: '3',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      size: 38 * 1024 * 1024,
      itemCount: 398
    }
  ]
}

const updateGeneralSettings = async () => {
  try {
    await settingsService.updateSettings(generalSettings)
  } catch (err) {
    console.error('更新基本设置失败:', err)
  }
}

const updateReadingSettings = async () => {
  try {
    await settingsService.updateReadingSettings(readingSettings)
  } catch (err) {
    console.error('更新阅读设置失败:', err)
  }
}

const updateReviewSettings = async () => {
  try {
    await settingsService.updateReviewSettings(reviewSettings)
  } catch (err) {
    console.error('更新复习设置失败:', err)
  }
}

const updateNotificationSettings = async () => {
  try {
    await settingsService.updateNotificationSettings(notificationSettings)
  } catch (err) {
    console.error('更新通知设置失败:', err)
  }
}

const updateSearchSettings = async () => {
  try {
    // 这里需要调用searchService的更新设置方法
    // 由于search.service.js中没有提供更新设置的方法，我们暂时模拟
    console.log('更新搜索设置:', searchSettings)
  } catch (err) {
    console.error('更新搜索设置失败:', err)
  }
}

const updateOfflineSettings = async () => {
  try {
    await offlineService.setOfflineMode(offlineSettings.offlineMode)
    await offlineService.setAutoSync(offlineSettings.autoSync)
    await offlineService.setSyncInterval(offlineSettings.syncInterval)
  } catch (err) {
    console.error('更新离线设置失败:', err)
  }
}

const changeTheme = (themeId) => {
  generalSettings.theme = themeId
  updateGeneralSettings()
}

const changeReadingTheme = (themeId) => {
  readingSettings.theme = themeId
  updateReadingSettings()
}

const changeTextAlign = (alignId) => {
  readingSettings.textAlign = alignId
  updateReadingSettings()
}

const changeHighlightColor = (color) => {
  readingSettings.highlightColor = color
  updateReadingSettings()
}

const changeNoteColor = (color) => {
  readingSettings.noteColor = color
  updateReadingSettings()
}

const changeAlgorithm = (algoId) => {
  reviewSettings.difficultyAlgorithm = algoId
  updateReviewSettings()
}

const changeSearchScope = (scopeId) => {
  searchSettings.defaultScope = scopeId
  updateSearchSettings()
}

const increaseFontSize = () => {
  if (generalSettings.fontSize < 32) {
    generalSettings.fontSize++
    updateGeneralSettings()
  }
}

const decreaseFontSize = () => {
  if (generalSettings.fontSize > 8) {
    generalSettings.fontSize--
    updateGeneralSettings()
  }
}

const increaseDailyGoal = () => {
  if (reviewSettings.dailyGoal < 200) {
    reviewSettings.dailyGoal++
    updateReviewSettings()
  }
}

const decreaseDailyGoal = () => {
  if (reviewSettings.dailyGoal > 1) {
    reviewSettings.dailyGoal--
    updateReviewSettings()
  }
}

const increaseNewWords = () => {
  if (reviewSettings.newWordsPerDay < 100) {
    reviewSettings.newWordsPerDay++
    updateReviewSettings()
  }
}

const decreaseNewWords = () => {
  if (reviewSettings.newWordsPerDay > 0) {
    reviewSettings.newWordsPerDay--
    updateReviewSettings()
  }
}

const increaseStreakGoal = () => {
  if (reviewSettings.streakGoal < 365) {
    reviewSettings.streakGoal++
    updateReviewSettings()
  }
}

const decreaseStreakGoal = () => {
  if (reviewSettings.streakGoal > 1) {
    reviewSettings.streakGoal--
    updateReviewSettings()
  }
}

const resetAllSettings = async () => {
  try {
    await settingsService.resetSettings()
    await loadSettings()
    showResetConfirm.value = false
  } catch (err) {
    console.error('重置设置失败:', err)
  }
}

const exportSettingsData = async () => {
  try {
    const blob = await settingsService.exportSettings()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `settings_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出设置失败:', err)
  }
}

const clearSearchHistory = async () => {
  try {
    await searchService.clearSearchHistory()
    searchHistory.value = []
  } catch (err) {
    console.error('清除搜索历史失败:', err)
  }
}

const deleteSearchHistoryItem = async (id) => {
  try {
    // 这里需要调用删除单个历史记录的方法
    // 由于search.service.js中没有提供，我们暂时模拟
    searchHistory.value = searchHistory.value.filter(item => item.id !== id)
  } catch (err) {
    console.error('删除搜索历史项失败:', err)
  }
}

const exportSearchHistory = async () => {
  try {
    // 这里需要调用导出搜索历史的方法
    // 由于search.service.js中没有提供，我们暂时模拟
    const historyData = JSON.stringify(searchHistory.value, null, 2)
    const blob = new Blob([historyData], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search_history_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出搜索历史失败:', err)
  }
}

const syncOfflineData = async () => {
  try {
    await offlineService.syncOfflineData()
    await loadSettings() // 重新加载设置以更新状态
  } catch (err) {
    console.error('同步离线数据失败:', err)
  }
}

const checkNetworkStatus = () => {
  const isOnline = offlineService.checkNetworkStatus()
  alert(isOnline ? '网络连接正常' : '网络连接已断开')
}

const clearOfflineCache = async () => {
  try {
    const options = {
      documents: cacheSettings.clearDocuments,
      vocabulary: cacheSettings.clearVocabulary,
      reviews: cacheSettings.clearReviews,
      all: cacheSettings.clearAll
    }
    
    await offlineService.clearOfflineCache(options)
    
    // 重置缓存选择
    Object.keys(cacheSettings).forEach(key => {
      cacheSettings[key] = false
    })
    
    // 重新加载数据
    await loadSettings()
  } catch (err) {
    console.error('清除离线缓存失败:', err)
  }
}

const toggleClearAllCache = () => {
  if (cacheSettings.clearAll) {
    cacheSettings.clearDocuments = true
    cacheSettings.clearVocabulary = true
    cacheSettings.clearReviews = true
  }
}

const exportOfflineData = async () => {
  try {
    await offlineService.exportOfflineData({
      format: 'json',
      includeDocuments: true,
      includeVocabulary: true,
      includeReviews: true
    })
  } catch (err) {
    console.error('导出离线数据失败:', err)
  }
}

const handleOfflineImportFile = (event) => {
  const file = event.target.files[0]
  if (file) {
    importFile.value = file
  }
}

const importOfflineData = async () => {
  try {
    if (!importFile.value) {
      alert('请先选择文件')
      return
    }
    
    await offlineService.importOfflineData(importFile.value, {
      merge: true,
      clearExisting: false
    })
    
    showImportDialog.value = false
    importFile.value = null
    
    // 重新加载数据
    await loadSettings()
  } catch (err) {
    console.error('导入离线数据失败:', err)
  }
}

const exportUserData = async () => {
  try {
    // 这里需要调用user.service.js中的导出数据方法
    // 由于user.service.js中已有exportUserData方法，我们可以直接使用
    const userService = (await import('@/services/user.service.js')).default
    await userService.exportUserData(exportSettings.format)
  } catch (err) {
    console.error('导出用户数据失败:', err)
  }
}

const triggerFileInput = () => {
  const fileInput = document.querySelector('input[type="file"]')
  if (fileInput) {
    fileInput.click()
  }
}

const handleImportFile = (event) => {
  const file = event.target.files[0]
  if (file) {
    importSettings.file = file
    importSettings.fileName = file.name
  }
}

const importUserData = async () => {
  try {
    if (!importSettings.file) {
      alert('请先选择文件')
      return
    }
    
    // 这里需要调用user.service.js中的导入数据方法
    // 由于user.service.js中没有提供导入方法，我们暂时模拟
    console.log('导入用户数据:', importSettings)
    
    // 重置导入设置
    importSettings.file = null
    importSettings.fileName = ''
    
    alert('数据导入成功')
  } catch (err) {
    console.error('导入用户数据失败:', err)
  }
}

const clearAppCache = async () => {
  try {
    // 这里需要调用user.service.js中的清除缓存方法
    const userService = (await import('@/services/user.service.js')).default
    await userService.clearCache()
    
    // 更新缓存统计
    await loadCacheStats()
    
    alert('应用缓存已清除')
  } catch (err) {
    console.error('清除应用缓存失败:', err)
  }
}

const analyzeCache = () => {
  // 模拟缓存分析
  const analysis = {
    documents: { count: 45, size: '45MB' },
    vocabulary: { count: 1200, size: '12MB' },
    images: { count: 89, size: '89MB' },
    other: { count: 110, size: '110MB' }
  }
  
  console.log('缓存分析:', analysis)
  alert('缓存分析完成，请查看控制台')
}

const createBackup = async () => {
  try {
    // 模拟创建备份
    console.log('创建备份...')
    backupInfo.lastBackup = new Date().toISOString()
    backupInfo.backupCount++
    
    alert('备份创建成功')
  } catch (err) {
    console.error('创建备份失败:', err)
  }
}

const restoreBackup = async () => {
  try {
    if (!selectedBackup.value) {
      alert('请先选择要恢复的备份')
      return
    }
    
    // 模拟恢复备份
    console.log('恢复备份:', selectedBackup.value)
    
    showRestoreDialog.value = false
    selectedBackup.value = null
    
    alert('备份恢复成功')
  } catch (err) {
    console.error('恢复备份失败:', err)
  }
}

const manageBackups = () => {
  // 模拟管理备份
  console.log('管理备份...')
  alert('备份管理功能开发中')
}
</script>

<style scoped>
.user-settings-view {
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

.settings-container {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.settings-sidebar {
  flex: 0 0 280px;
  background: white;
  border-radius: 32px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px dashed #e8e8e8;
}

.user-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-emoji {
  font-size: 36px;
}

.user-name {
  font-family: 'Quicksand', sans-serif;
  font-size: 20px;
  color: #333;
  margin: 0;
  font-weight: 600;
}

.user-email {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: none;
  background: transparent;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #666;
  text-align: left;
  position: relative;
}

.nav-item:hover {
  background: #f5f5f5;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  background: #ff4757;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.sidebar-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px dashed #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reset-btn,
.export-btn {
  padding: 12px;
  border-radius: 24px;
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

.reset-btn:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.export-btn:hover {
  background: #e8f4f8;
  transform: translateY(-2px);
}

.settings-content {
  flex: 1;
  background: white;
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
  min-height: 600px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 12px 24px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.settings-section {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-family: 'Kalam', cursive;
  font-size: 32px;
  color: #ff6b9d;
  margin: 0 0 32px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.setting-card {
  background: #f9f9f9;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.setting-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ffd591;
}

.setting-title {
  font-family: 'Quicksand', sans-serif;
  font-size: 18px;
  color: #333;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-description {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 16px;
  line-height: 1.5;
}

.setting-select,
.setting-input {
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  border: 2px solid #ddd;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.setting-select:focus,
.setting-input:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.theme-options,
.reading-theme-options,
.alignment-options,
.algorithm-options,
.search-scope-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.theme-option,
.reading-theme-option,
.align-option,
.algorithm-option,
.scope-option {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  border-radius: 20px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
}

.theme-option:hover,
.reading-theme-option:hover,
.align-option:hover,
.algorithm-option:hover,
.scope-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-option.active,
.reading-theme-option.active,
.align-option.active,
.algorithm-option.active,
.scope-option.active {
  border-color: #ff6b9d;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.theme-icon,
.algo-icon,
.scope-icon {
  font-size: 24px;
}

.algo-description {
  font-size: 12px;
  opacity: 0.8;
  text-align: center;
}

.font-size-control,
.number-control,
.interval-control,
.slider-control {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
}

.size-btn,
.number-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ffd591;
  background: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-btn:hover,
.number-btn:hover {
  background: #fff5e6;
  transform: scale(1.1);
}

.size-value,
.number-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.font-size-preview {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px dashed #ddd;
  text-align: center;
}

.time-setting,
.privacy-setting,
.typography-setting,
.layout-setting,
.scroll-setting,
.volume-setting {
  margin: 16px 0;
}

.time-setting label,
.privacy-setting label,
.typography-setting label,
.layout-setting label,
.scroll-setting label,
.volume-setting label {
  display: block;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

input[type="range"] {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff6b9d;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff6b9d;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.toggle-setting {
  margin: 12px 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
}

.toggle-label input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 26px;
  background: #ddd;
  border-radius: 13px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-label input:checked + .toggle-slider {
  background: #ff6b9d;
}

.toggle-label input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-text {
  flex: 1;
}

.color-setting {
  margin: 16px 0;
}

.color-setting label {
  display: block;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
  transform: scale(1.1);
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.3);
}

.translation-setting,
.goal-setting,
.interval-setting,
.sync-interval-setting {
  margin: 16px 0;
}

.goal-hint {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
  margin: 8px 0 0;
}

.search-option,
.cache-option,
.export-option,
.import-option,
.notification-option {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-option label,
.cache-option label,
.export-option label,
.import-option label,
.notification-option label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-history-actions,
.cache-actions,
.backup-actions,
.sync-actions {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.action-btn,
.clear-btn,
.export-btn,
.import-btn,
.backup-btn,
.restore-btn,
.manage-backups-btn,
.sync-btn,
.check-btn {
  padding: 10px 16px;
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
  gap: 8px;
}

.action-btn:hover,
.clear-btn:hover,
.export-btn:hover,
.import-btn:hover,
.backup-btn:hover,
.restore-btn:hover,
.manage-backups-btn:hover,
.sync-btn:hover,
.check-btn:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.search-history-list {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
}

.history-keyword {
  flex: 1;
  color: #333;
}

.history-type {
  color: #666;
  font-size: 12px;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.history-time {
  color: #999;
  font-size: 12px;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ff4757;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
}

.empty-history {
  text-align: center;
  padding: 32px;
  color: #999;
  font-family: 'Quicksand', sans-serif;
}

.offline-stats,
.cache-info,
.backup-info {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 2px solid #e8e8e8;
}

.stat-item,
.cache-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child,
.cache-stat:last-child {
  border-bottom: none;
}

.stat-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.network-status {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 20px;
  border: 2px solid #e8e8e8;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  margin-bottom: 16px;
}

.status-indicator.online {
  background: #e8f6ef;
  color: #27ae60;
}

.status-indicator.offline {
  background: #ffeaea;
  color: #ff4757;
}

.status-icon {
  font-size: 20px;
}

.network-info p {
  margin: 8px 0;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
}

.format-options,
.file-upload {
  margin: 16px 0;
}

.export-data-btn,
.import-data-btn,
.clear-cache-btn,
.analyze-cache-btn {
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.export-data-btn:hover,
.import-data-btn:hover,
.clear-cache-btn:hover,
.analyze-cache-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.import-data-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.file-name {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  text-align: center;
}

.warning-text {
  color: #ff4757;
  font-weight: 600;
  margin-top: 8px;
}

.import-dialog,
.restore-dialog {
  padding: 16px;
}

.backup-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 16px 0;
}

.backup-item {
  padding: 12px;
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
}

.backup-item:hover {
  border-color: #ffd591;
  transform: translateX(4px);
}

.backup-item.selected {
  border-color: #ff6b9d;
  background: #fff5f5;
}

.backup-date,
.backup-size,
.backup-items {
  color: #666;
}

.no-backups {
  text-align: center;
  padding: 32px;
  color: #999;
  font-family: 'Quicksand', sans-serif;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .settings-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 992px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-sidebar {
    flex: none;
    width: 100%;
  }
  
  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .nav-item {
    flex: 1;
    min-width: 150px;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 36px;
  }
  
  .section-title {
    font-size: 28px;
  }
}

@media (max-width: 576px) {
  .user-settings-view {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .settings-content {
    padding: 24px;
  }
  
  .theme-options,
  .reading-theme-options,
  .alignment-options,
  .algorithm-options,
  .search-scope-options {
    flex-direction: column;
  }
  
  .theme-option,
  .reading-theme-option,
  .align-option,
  .algorithm-option,
  .scope-option {
    width: 100%;
  }
}
</style>