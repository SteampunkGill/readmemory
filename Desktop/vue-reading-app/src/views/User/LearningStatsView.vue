<template>
  <div class="learning-stats-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">学习统计</h1>
      <p class="page-subtitle">深入分析你的学习进度和习惯</p>
    </div>

    <!-- 时间范围选择器 -->
    <div class="time-range-selector">
      <div class="selector-header">
        <h3 class="selector-title">统计周期</h3>
        <div class="date-display">
          <span class="date-label">{{ formattedDateRange }}</span>
        </div>
      </div>
      <div class="range-options">
        <button 
          v-for="range in timeRanges" 
          :key="range.value"
          @click="setTimeRange(range.value)"
          class="range-btn"
          :class="{ active: currentRange === range.value }"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载统计数据中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadStatsData" class="error-retry-btn">重试</button>
    </div>

    <!-- 主要内容 -->
    <div v-if="!loading && !error" class="stats-content">
      <!-- 关键指标卡片 -->
      <div class="key-metrics-section">
        <h2 class="section-title">关键指标</h2>
        <div class="metrics-grid">
          <div class="metric-card total-reading">
            <div class="metric-icon">⏱️</div>
            <div class="metric-info">
              <div class="metric-value">{{ formatDuration(totalReadingTime) }}</div>
              <div class="metric-label">总阅读时间</div>
              <div class="metric-change" :class="getChangeClass(readingTimeChange)">
                {{ formatChange(readingTimeChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card documents-read">
            <div class="metric-icon">📚</div>
            <div class="metric-info">
              <div class="metric-value">{{ formatNumber(documentsRead) }}</div>
              <div class="metric-label">阅读文档</div>
              <div class="metric-change" :class="getChangeClass(documentsChange)">
                {{ formatChange(documentsChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card words-learned">
            <div class="metric-icon">🔤</div>
            <div class="metric-info">
              <div class="metric-value">{{ formatNumber(wordsLearned) }}</div>
              <div class="metric-label">学习单词</div>
              <div class="metric-change" :class="getChangeClass(wordsChange)">
                {{ formatChange(wordsChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card reviews-completed">
            <div class="metric-icon">✅</div>
            <div class="metric-info">
              <div class="metric-value">{{ formatNumber(reviewsCompleted) }}</div>
              <div class="metric-label">完成复习</div>
              <div class="metric-change" :class="getChangeClass(reviewsChange)">
                {{ formatChange(reviewsChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card review-accuracy">
            <div class="metric-icon">🎯</div>
            <div class="metric-info">
              <div class="metric-value">{{ formatPercentage(reviewAccuracy, 100, 1) }}</div>
              <div class="metric-label">复习准确率</div>
              <div class="metric-change" :class="getChangeClass(accuracyChange)">
                {{ formatChange(accuracyChange) }}
              </div>
            </div>
          </div>

          <div class="metric-card streak-days">
            <div class="metric-icon">🔥</div>
            <div class="metric-info">
              <div class="metric-value">{{ streakDays }} 天</div>
              <div class="metric-label">连续学习</div>
              <div class="metric-change" :class="getChangeClass(streakChange)">
                {{ formatChange(streakChange) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习趋势图表 -->
      <div class="trends-section">
        <div class="section-header">
          <h2 class="section-title">学习趋势</h2>
          <div class="trend-selector">
            <select v-model="selectedTrend" class="trend-select">
              <option value="reading_time">阅读时间</option>
              <option value="words_learned">学习单词</option>
              <option value="reviews_completed">完成复习</option>
              <option value="accuracy">复习准确率</option>
            </select>
          </div>
        </div>
        
        <div class="trend-chart-container">
          <div class="chart-placeholder">
            <div class="chart-grid">
              <div v-for="i in 5" :key="i" class="grid-line"></div>
            </div>
            <div class="chart-bars">
              <div 
                v-for="(day, index) in dailyTrends" 
                :key="index"
                class="chart-bar"
                :style="{ height: getBarHeight(day.value) + '%' }"
                :title="`${day.date}: ${formatTrendValue(day.value)}`"
              >
                <div class="bar-value">{{ formatTrendValue(day.value) }}</div>
              </div>
            </div>
            <div class="chart-labels">
              <div 
                v-for="(day, index) in dailyTrends" 
                :key="index"
                class="chart-label"
              >
                {{ formatDateLabel(day.date) }}
              </div>
            </div>
          </div>
          
          <div class="trend-summary">
            <div class="summary-item">
              <span class="summary-label">平均值</span>
              <span class="summary-value">{{ formatTrendValue(averageTrend) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">最高值</span>
              <span class="summary-value">{{ formatTrendValue(maxTrend) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">最低值</span>
              <span class="summary-value">{{ formatTrendValue(minTrend) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习习惯分析 -->
      <div class="habits-section">
        <h2 class="section-title">学习习惯分析</h2>
        
        <div class="habits-grid">
          <!-- 最佳学习时段 -->
          <div class="habit-card best-time">
            <h3 class="habit-title">最佳学习时段</h3>
            <div class="habit-content">
              <div class="time-chart">
                <div 
                  v-for="(hour, index) in studyHours" 
                  :key="index"
                  class="hour-bar"
                  :style="{ height: hour.value + '%' }"
                  :class="{ peak: hour.isPeak }"
                  :title="`${hour.hour}:00 - ${hour.value}%`"
                >
                  <div class="hour-label">{{ hour.hour }}</div>
                </div>
              </div>
              <div class="habit-insight">
                <div class="insight-icon">💡</div>
                <div class="insight-text">
                  {{ bestTimeInsight }}
                </div>
              </div>
            </div>
          </div>

          <!-- 学习频率 -->
          <div class="habit-card frequency">
            <h3 class="habit-title">学习频率</h3>
            <div class="habit-content">
              <div class="frequency-stats">
                <div class="stat-item">
                  <span class="stat-label">平均每周</span>
                  <span class="stat-value">{{ averageDaysPerWeek }} 天</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最长间隔</span>
                  <span class="stat-value">{{ longestGap }} 天</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">学习密度</span>
                  <span class="stat-value">{{ studyDensity }}%</span>
                </div>
              </div>
              <div class="frequency-chart">
                <div 
                  v-for="(week, index) in weeklyFrequency" 
                  :key="index"
                  class="week-bar"
                  :style="{ width: week.density + '%' }"
                  :title="`第${week.week}周: ${week.days}天`"
                >
                  <div class="week-label">{{ week.days }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 学习时长分布 -->
          <div class="habit-card duration">
            <h3 class="habit-title">学习时长分布</h3>
            <div class="habit-content">
              <div class="duration-stats">
                <div class="duration-item">
                  <span class="duration-label">短时学习 (&lt;15min)</span>
                  <div class="duration-bar">
                    <div 
                      class="duration-fill" 
                      :style="{ width: shortSessions + '%' }"
                    ></div>
                  </div>
                  <span class="duration-value">{{ shortSessions }}%</span>
                </div>
                <div class="duration-item">
                  <span class="duration-label">中等学习 (15-45min)</span>
                  <div class="duration-bar">
                    <div 
                      class="duration-fill" 
                      :style="{ width: mediumSessions + '%' }"
                    ></div>
                  </div>
                  <span class="duration-value">{{ mediumSessions }}%</span>
                </div>
                <div class="duration-item">
                  <span class="duration-label">长时学习 (&gt;45min)</span>
                  <div class="duration-bar">
                    <div 
                      class="duration-fill" 
                      :style="{ width: longSessions + '%' }"
                    ></div>
                  </div>
                  <span class="duration-value">{{ longSessions }}%</span>
                </div>
              </div>
              <div class="duration-insight">
                <div class="insight-icon">📊</div>
                <div class="insight-text">
                  {{ durationInsight }}
                </div>
              </div>
            </div>
          </div>

          <!-- 学习效率分析 -->
          <div class="habit-card efficiency">
            <h3 class="habit-title">学习效率分析</h3>
            <div class="habit-content">
              <div class="efficiency-metrics">
                <div class="efficiency-item">
                  <div class="efficiency-icon">⚡</div>
                  <div class="efficiency-info">
                    <div class="efficiency-value">{{ efficiencyScore }}%</div>
                    <div class="efficiency-label">学习效率</div>
                  </div>
                </div>
                <div class="efficiency-item">
                  <div class="efficiency-icon">🎯</div>
                  <div class="efficiency-info">
                    <div class="efficiency-value">{{ retentionRate }}%</div>
                    <div class="efficiency-label">记忆保持率</div>
                  </div>
                </div>
                <div class="efficiency-item">
                  <div class="efficiency-icon">📈</div>
                  <div class="efficiency-info">
                    <div class="efficiency-value">{{ improvementRate }}%</div>
                    <div class="efficiency-label">进步速度</div>
                  </div>
                </div>
              </div>
              <div class="efficiency-tips">
                <h4 class="tips-title">效率提升建议</h4>
                <ul class="tips-list">
                  <li v-for="(tip, index) in efficiencyTips" :key="index" class="tip-item">
                    {{ tip }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 语言技能分析 -->
      <div class="skills-section">
        <h2 class="section-title">语言技能分析</h2>
        
        <div class="skills-overview">
          <div class="skill-radar">
            <div class="radar-grid">
              <div v-for="i in 4" :key="i" class="radar-circle"></div>
            </div>
            <div class="radar-skills">
              <div 
                v-for="(skill, index) in languageSkills" 
                :key="index"
                class="skill-point"
                :style="getSkillPointStyle(skill.level, index)"
                :title="`${skill.name}: ${skill.level}/10`"
              >
                <div class="skill-name">{{ skill.name }}</div>
                <div class="skill-level">{{ skill.level }}</div>
              </div>
            </div>
          </div>
          
          <div class="skills-details">
            <div class="skill-progress">
              <h3 class="progress-title">技能进步</h3>
              <div class="progress-list">
                <div 
                  v-for="(skill, index) in languageSkills" 
                  :key="index"
                  class="progress-item"
                >
                  <div class="progress-header">
                    <span class="skill-label">{{ skill.name }}</span>
                    <span class="skill-level">{{ skill.level }}/10</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: skill.level * 10 + '%' }"
                    ></div>
                  </div>
                  <div class="progress-change">
                    <span class="change-label">过去30天</span>
                    <span class="change-value" :class="getChangeClass(skill.change)">
                      {{ formatChange(skill.change) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="weakness-analysis">
              <h3 class="weakness-title">待提升领域</h3>
              <div class="weakness-list">
                <div 
                  v-for="(weakness, index) in weaknesses" 
                  :key="index"
                  class="weakness-item"
                >
                  <div class="weakness-icon">🔍</div>
                  <div class="weakness-content">
                    <h4 class="weakness-name">{{ weakness.name }}</h4>
                    <p class="weakness-desc">{{ weakness.description }}</p>
                    <div class="weakness-suggestions">
                      <span class="suggestion-label">建议练习:</span>
                      <span class="suggestion-text">{{ weakness.suggestion }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习目标进度 -->
      <div class="goals-section">
        <h2 class="section-title">学习目标进度</h2>
        
        <div class="goals-container">
          <!-- 年度目标 -->
          <div class="goal-card annual-goal">
            <div class="goal-header">
              <h3 class="goal-title">年度目标</h3>
              <div class="goal-progress">
                <span class="progress-text">{{ annualGoalProgress }}%</span>
              </div>
            </div>
            <div class="goal-content">
              <div class="goal-metrics">
                <div class="metric-item">
                  <span class="metric-label">已学习天数</span>
                  <span class="metric-value">{{ annualStudyDays }}/365</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">已学习单词</span>
                  <span class="metric-value">{{ formatNumber(annualWordsLearned) }}/{{ formatNumber(annualWordGoal) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">已阅读文档</span>
                  <span class="metric-value">{{ annualDocumentsRead }}/{{ annualDocumentGoal }}</span>
                </div>
              </div>
              <div class="goal-timeline">
                <div class="timeline-bar">
                  <div 
                    class="timeline-fill" 
                    :style="{ width: annualGoalProgress + '%' }"
                  ></div>
                </div>
                <div class="timeline-labels">
                  <span class="timeline-label">1月</span>
                  <span class="timeline-label">6月</span>
                  <span class="timeline-label">12月</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 月度目标 -->
          <div class="goal-card monthly-goal">
            <div class="goal-header">
              <h3 class="goal-title">月度目标</h3>
              <div class="goal-progress">
                <span class="progress-text">{{ monthlyGoalProgress }}%</span>
              </div>
            </div>
            <div class="goal-content">
              <div class="goal-metrics">
                <div class="metric-item">
                  <span class="metric-label">本月进度</span>
                  <span class="metric-value">{{ currentDayOfMonth }}/{{ daysInMonth }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">学习天数</span>
                  <span class="metric-value">{{ monthlyStudyDays }}/{{ monthlyGoalDays }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">完成率</span>
                  <span class="metric-value">{{ monthlyCompletionRate }}%</span>
                </div>
              </div>
              <div class="goal-calendar">
                <div 
                  v-for="day in monthlyCalendar" 
                  :key="day.date"
                  class="calendar-day"
                  :class="{
                    'studied': day.studied,
                    'today': day.isToday,
                    'future': day.isFuture
                  }"
                  :title="day.tooltip"
                >
                  <div class="day-number">{{ day.day }}</div>
                  <div v-if="day.studied" class="study-indicator"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 自定义目标 -->
          <div class="goal-card custom-goals">
            <div class="goal-header">
              <h3 class="goal-title">自定义目标</h3>
              <button @click="showGoalModal = true" class="add-goal-btn">
                <span class="btn-icon">+</span>
                <span class="btn-text">添加目标</span>
              </button>
            </div>
            <div class="goal-content">
              <div v-if="customGoals.length > 0" class="custom-goals-list">
                <div 
                  v-for="goal in customGoals" 
                  :key="goal.id"
                  class="custom-goal-item"
                >
                  <div class="goal-info">
                    <h4 class="goal-name">{{ goal.name }}</h4>
                    <p class="goal-desc">{{ goal.description }}</p>
                  </div>
                  <div class="goal-progress">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: goal.progress + '%' }"
                      ></div>
                    </div>
                    <div class="progress-text">
                      {{ goal.current }}/{{ goal.target }}
                    </div>
                  </div>
                  <div class="goal-actions">
                    <button @click="updateGoalProgress(goal.id)" class="action-btn update-btn">
                      更新进度
                    </button>
                    <button @click="deleteGoal(goal.id)" class="action-btn delete-btn">
                      删除
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="no-goals">
                <div class="no-goals-icon">🎯</div>
                <p class="no-goals-text">暂无自定义目标</p>
                <button @click="showGoalModal = true" class="create-goal-btn">
                  创建第一个目标
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习报告摘要 -->
      <div class="report-section">
        <h2 class="section-title">学习报告摘要</h2>
        
        <div class="report-cards">
          <!-- 学习强度报告 -->
          <div class="report-card intensity">
            <h3 class="report-title">学习强度分析</h3>
            <div class="report-content">
              <div class="intensity-metrics">
                <div class="metric-item">
                  <span class="metric-label">日均学习时间</span>
                  <span class="metric-value">{{ formatDuration(dailyAverageTime) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">学习强度指数</span>
                  <span class="metric-value">{{ intensityIndex }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">学习稳定性</span>
                  <span class="metric-value">{{ studyStability }}%</span>
                </div>
              </div>
              <div class="intensity-insight">
                <div class="insight-icon">📈</div>
                <div class="insight-text">
                  {{ intensityInsight }}
                </div>
              </div>
            </div>
          </div>

          <!-- 学习效果报告 -->
          <div class="report-card effectiveness">
            <h3 class="report-title">学习效果评估</h3>
            <div class="report-content">
              <div class="effectiveness-metrics">
                <div class="metric-item">
                  <span class="metric-label">知识掌握度</span>
                  <span class="metric-value">{{ knowledgeMastery }}%</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">学习转化率</span>
                  <span class="metric-value">{{ learningConversion }}%</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">综合评分</span>
                  <span class="metric-value">{{ overallScore }}/100</span>
                </div>
              </div>
              <div class="effectiveness-chart">
                <div class="chart-bars">
                  <div 
                    v-for="(metric, index) in effectivenessMetrics" 
                    :key="index"
                    class="chart-bar"
                    :style="{ height: metric.value + '%' }"
                    :title="`${metric.name}: ${metric.value}%`"
                  >
                    <div class="bar-label">{{ metric.name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 个性化建议 -->
          <div class="report-card recommendations">
            <h3 class="report-title">个性化学习建议</h3>
            <div class="report-content">
              <div class="recommendations-list">
                <div 
                  v-for="(rec, index) in personalizedRecommendations" 
                  :key="index"
                  class="recommendation-item"
                >
                  <div class="rec-icon">💡</div>
                  <div class="rec-content">
                    <h4 class="rec-title">{{ rec.title }}</h4>
                    <p class="rec-desc">{{ rec.description }}</p>
                    <div class="rec-priority" :class="rec.priority">
                      优先级: {{ getPriorityLabel(rec.priority) }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="recommendations-summary">
                <div class="summary-icon">🎯</div>
                <div class="summary-text">
                  {{ recommendationSummary }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据导出 -->
      <div class="export-section">
        <div class="export-header">
          <h3 class="export-title">数据导出</h3>
          <p class="export-desc">导出你的学习统计数据进行分析</p>
        </div>
        <div class="export-options">
          <div class="export-option">
            <label class="option-label">
              <input 
                type="radio" 
                v-model="exportFormat" 
                value="json"
                class="option-radio"
              />
              <span class="option-text">JSON 格式</span>
            </label>
            <p class="option-desc">适合程序分析</p>
          </div>
          <div class="export-option">
            <label class="option-label">
              <input 
                type="radio" 
                v-model="exportFormat" 
                value="csv"
                class="option-radio"
              />
              <span class="option-text">CSV 格式</span>
            </label>
            <p class="option-desc">适合表格软件</p>
          </div>
          <div class="export-option">
            <label class="option-label">
              <input 
                type="radio" 
                v-model="exportFormat" 
                value="pdf"
                class="option-radio"
              />
              <span class="option-text">PDF 报告</span>
            </label>
            <p class="option-desc">适合打印和分享</p>
          </div>
        </div>
        <div class="export-actions">
          <button @click="exportStatsData" class="export-btn" :disabled="exporting">
            {{ exporting ? '导出中...' : '导出数据' }}
          </button>
          <button @click="generateReport" class="report-btn" :disabled="generatingReport">
            {{ generatingReport ? '生成中...' : '生成详细报告' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 目标设置模态框 -->
    <div v-if="showGoalModal" class="modal-overlay" @click.self="closeGoalModal">
      <div class="modal-content goal-modal">
        <div class="modal-header">
          <h3 class="modal-title">设置学习目标</h3>
          <button @click="closeGoalModal" class="modal-close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveGoal" class="goal-form">
            <div class="form-group">
              <label for="goal-name" class="form-label">目标名称</label>
              <input
                id="goal-name"
                v-model="newGoal.name"
                type="text"
                class="form-input"
                placeholder="例如：每日学习30分钟"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="goal-description" class="form-label">目标描述</label>
              <textarea
                id="goal-description"
                v-model="newGoal.description"
                class="form-textarea"
                placeholder="详细描述你的学习目标"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="goal-target" class="form-label">目标值</label>
                <input
                  id="goal-target"
                  v-model="newGoal.target"
                  type="number"
                  class="form-input"
                  placeholder="例如：30"
                  required
                  min="1"
                />
              </div>
              
              <div class="form-group">
                <label for="goal-unit" class="form-label">单位</label>
                <select v-model="newGoal.unit" class="form-select" required>
                  <option value="minutes">分钟</option>
                  <option value="words">单词</option>
                  <option value="documents">文档</option>
                  <option value="reviews">复习</option>
                  <option value="days">天数</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="goal-deadline" class="form-label">截止日期</label>
              <input
                id="goal-deadline"
                v-model="newGoal.deadline"
                type="date"
                class="form-input"
                :min="today"
                required
              />
            </div>
            
            <div class="form-actions">
              <button type="submit" class="save-btn" :disabled="savingGoal">
                {{ savingGoal ? '保存中...' : '保存目标' }}
              </button>
              <button type="button" @click="closeGoalModal" class="cancel-btn">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import userService from '@/services/user.service'
import { useUserStore } from '@/stores/user.store'
import { formatNumber, formatDate, formatDuration, formatPercentage } from '@/utils/formatter'

// 路由
const router = useRouter()

// 状态管理
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const error = ref(null)
const currentRange = ref('week')
const selectedTrend = ref('reading_time')
const exportFormat = ref('json')
const exporting = ref(false)
const generatingReport = ref(false)
const showGoalModal = ref(false)
const savingGoal = ref(false)

// 时间范围选项
const timeRanges = [
  { label: '今天', value: 'day' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' },
  { label: '全部', value: 'all' }
]

// 新目标表单
const newGoal = reactive({
  name: '',
  description: '',
  target: 30,
  unit: 'minutes',
  deadline: ''
})

// 计算属性
const today = computed(() => {
  const now = new Date()
  return now.toISOString().split('T')[0]
})

const formattedDateRange = computed(() => {
  const now = new Date()
  switch (currentRange.value) {
    case 'day':
      return formatDate(now, 'YYYY年MM月DD日')
    case 'week':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${formatDate(weekStart, 'MM/DD')} - ${formatDate(weekEnd, 'MM/DD')}`
    case 'month':
      return formatDate(now, 'YYYY年MM月')
    case 'year':
      return formatDate(now, 'YYYY年')
    case 'all':
      return '全部时间'
    default:
      return ''
  }
})

// 关键指标数据（模拟数据）
const totalReadingTime = computed(() => 12540) // 秒
const documentsRead = computed(() => 42)
const wordsLearned = computed(() => 1250)
const reviewsCompleted = computed(() => 380)
const reviewAccuracy = computed(() => 87.5)
const streakDays = computed(() => 14)

// 变化率数据（模拟数据）
const readingTimeChange = computed(() => 12.5)
const documentsChange = computed(() => 8.3)
const wordsChange = computed(() => 15.2)
const reviewsChange = computed(() => 5.7)
const accuracyChange = computed(() => 2.3)
const streakChange = computed(() => 0)

// 学习趋势数据（模拟数据）
const dailyTrends = computed(() => {
  const trends = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    let value
    switch (selectedTrend.value) {
      case 'reading_time':
        value = Math.floor(Math.random() * 60) + 30 // 30-90分钟
        break
      case 'words_learned':
        value = Math.floor(Math.random() * 50) + 20 // 20-70单词
        break
      case 'reviews_completed':
        value = Math.floor(Math.random() * 30) + 10 // 10-40复习
        break
      case 'accuracy':
        value = Math.floor(Math.random() * 20) + 80 // 80-100%
        break
      default:
        value = 0
    }
    
    trends.push({
      date: date.toISOString().split('T')[0],
      value: value
    })
  }
  
  return trends
})

const averageTrend = computed(() => {
  const values = dailyTrends.value.map(d => d.value)
  return values.reduce((a, b) => a + b, 0) / values.length
})

const maxTrend = computed(() => Math.max(...dailyTrends.value.map(d => d.value)))
const minTrend = computed(() => Math.min(...dailyTrends.value.map(d => d.value)))

// 学习习惯数据（模拟数据）
const studyHours = computed(() => {
  const hours = []
  for (let i = 0; i < 24; i++) {
    const value = Math.floor(Math.random() * 30) + (i >= 8 && i <= 22 ? 20 : 5)
    hours.push({
      hour: i,
      value: value,
      isPeak: value > 40
    })
  }
  return hours
})

const bestTimeInsight = computed(() => {
  const peakHours = studyHours.value.filter(h => h.isPeak)
  if (peakHours.length === 0) return '暂无最佳学习时段数据'
  
  const times = peakHours.map(h => `${h.hour}:00`)
  return `你在 ${times.join('、')} 时段学习效率最高`
})

const averageDaysPerWeek = computed(() => 4.2)
const longestGap = computed(() => 3)
const studyDensity = computed(() => 60)

const weeklyFrequency = computed(() => {
  const weeks = []
  for (let i = 0; i < 8; i++) {
    weeks.push({
      week: i + 1,
      days: Math.floor(Math.random() * 4) + 2,
      density: Math.floor(Math.random() * 40) + 30
    })
  }
  return weeks
})

const shortSessions = computed(() => 35)
const mediumSessions = computed(() => 45)
const longSessions = computed(() => 20)

const durationInsight = computed(() => {
  if (mediumSessions.value > 50) {
    return '你的学习时长分布合理，中等时长的学习占比较高'
  } else if (shortSessions.value > 50) {
    return '建议适当增加单次学习时长，提高学习深度'
  } else {
    return '你的学习习惯良好，继续保持'
  }
})

const efficiencyScore = computed(() => 78)
const retentionRate = computed(() => 85)
const improvementRate = computed(() => 12)

const efficiencyTips = computed(() => [
  '尝试在最佳学习时段（上午9-11点）进行重点学习',
  '每学习25分钟休息5分钟，保持注意力集中',
  '学习新单词后，24小时内进行第一次复习',
  '每周进行一次知识总结，巩固学习成果'
])

// 语言技能数据（模拟数据）
const languageSkills = computed(() => [
  { name: '词汇量', level: 7, change: 8.5 },
  { name: '阅读理解', level: 8, change: 5.2 },
  { name: '听力理解', level: 6, change: 12.3 },
  { name: '语法掌握', level: 7, change: 3.8 },
  { name: '口语表达', level: 5, change: 15.7 },
  { name: '写作能力', level: 6, change: 7.9 }
])

const weaknesses = computed(() => [
  {
    name: '口语表达',
    description: '口语表达流畅度有待提高，词汇运用不够丰富',
    suggestion: '每日跟读练习，尝试用英语描述日常事物'
  },
  {
    name: '听力理解',
    description: '快速对话理解能力需要加强',
    suggestion: '多听英语播客，尝试不同口音的听力材料'
  }
])

// 学习目标数据（模拟数据）
const annualGoalProgress = computed(() => 42)
const annualStudyDays = computed(() => 153)
const annualWordsLearned = computed(() => 1250)
const annualWordGoal = computed(() => 3000)
const annualDocumentsRead = computed(() => 42)
const annualDocumentGoal = computed(() => 100)

const monthlyGoalProgress = computed(() => 68)
const currentDayOfMonth = computed(() => new Date().getDate())
const daysInMonth = computed(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())
const monthlyStudyDays = computed(() => 18)
const monthlyGoalDays = computed(() => 25)
const monthlyCompletionRate = computed(() => 72)

const customGoals = computed(() => [
  {
    id: 1,
    name: '每日阅读30分钟',
    description: '坚持每天阅读英文文章30分钟',
    progress: 75,
    current: 22,
    target: 30
  },
  {
    id: 2,
    name: '学习500个新单词',
    description: '本月学习500个新单词',
    progress: 40,
    current: 200,
    target: 500
  }
])

const monthlyCalendar = computed(() => {
  const calendar = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  for (let i = 1; i <= daysInMonth; i++) {
    const studied = Math.random() > 0.4
    calendar.push({
      day: i,
      date: `${year}-${month + 1}-${i}`,
      studied: studied,
      isToday: i === now.getDate(),
      isFuture: i > now.getDate(),
      tooltip: studied ? `${i}日: 已学习` : `${i}日: 未学习`
    })
  }
  
  return calendar
})

// 学习报告数据（模拟数据）
const dailyAverageTime = computed(() => 45 * 60) // 45分钟
const intensityIndex = computed(() => 7.2)
const studyStability = computed(() => 78)

const intensityInsight = computed(() => {
  if (intensityIndex.value > 8) {
    return '你的学习强度很高，注意合理安排休息时间'
  } else if (intensityIndex.value > 6) {
    return '学习强度适中，继续保持良好的学习节奏'
  } else {
    return '建议适当提高学习强度，增加学习时间'
  }
})

const knowledgeMastery = computed(() => 72)
const learningConversion = computed(() => 65)
const overallScore = computed(() => 78)

const effectivenessMetrics = computed(() => [
  { name: '词汇', value: 85 },
  { name: '阅读', value: 78 },
  { name: '听力', value: 65 },
  { name: '语法', value: 72 },
  { name: '口语', value: 58 }
])

const personalizedRecommendations = computed(() => [
  {
    title: '加强听力训练',
    description: '每周至少进行3次听力练习，每次不少于20分钟',
    priority: 'high'
  },
  {
    title: '扩大阅读范围',
    description: '尝试阅读不同主题的英文文章，提高阅读广度',
    priority: 'medium'
  },
  {
    title: '口语练习',
    description: '每天用英语描述一件日常事物，提高口语流利度',
    priority: 'high'
  }
])

const recommendationSummary = computed(() => {
  const highPriority = personalizedRecommendations.value.filter(r => r.priority === 'high').length
  return `你有 ${highPriority} 个高优先级建议，建议优先处理`
})

// 生命周期钩子
onMounted(() => {
  loadStatsData()
})

// 方法
const loadStatsData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 加载学习统计
    await userService.getLearningStats({ period: currentRange.value })
    
    // 加载学习报告
    await userService.getLearningReport({ period: currentRange.value })
    
    // 加载积分等级
    await userService.getUserPointsAndLevel()
    
  } catch (err) {
    error.value = err.message || '加载统计数据失败'
    console.error('加载统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

const setTimeRange = (range) => {
  currentRange.value = range
  loadStatsData()
}

const getChangeClass = (change) => {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
}

const formatChange = (change) => {
  if (change > 0) return `+${change.toFixed(1)}%`
  if (change < 0) return `${change.toFixed(1)}%`
  return '0%'
}

const getBarHeight = (value) => {
  const maxValue = Math.max(...dailyTrends.value.map(d => d.value))
  return (value / maxValue) * 100
}

const formatTrendValue = (value) => {
  switch (selectedTrend.value) {
    case 'reading_time':
      return `${value} 分钟`
    case 'words_learned':
      return `${value} 个`
    case 'reviews_completed':
      return `${value} 次`
    case 'accuracy':
      return `${value.toFixed(1)}%`
    default:
      return value
  }
}

const formatDateLabel = (dateStr) => {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.getMonth() + 1
  return `${month}/${day}`
}

const getSkillPointStyle = (level, index) => {
  const totalSkills = languageSkills.value.length
  const angle = (index / totalSkills) * 2 * Math.PI
  const radius = level * 8 // 缩放因子
  
  const x = 50 + radius * Math.cos(angle)
  const y = 50 + radius * Math.sin(angle)
  
  return {
    left: `${x}%`,
    top: `${y}%`
  }
}

const exportStatsData = async () => {
  try {
    exporting.value = true
    
    const exportData = {
      timeRange: currentRange.value,
      dateRange: formattedDateRange.value,
      keyMetrics: {
        totalReadingTime: totalReadingTime.value,
        documentsRead: documentsRead.value,
        wordsLearned: wordsLearned.value,
        reviewsCompleted: reviewsCompleted.value,
        reviewAccuracy: reviewAccuracy.value,
        streakDays: streakDays.value
      },
      trends: dailyTrends.value,
      habits: {
        studyHours: studyHours.value,
        weeklyFrequency: weeklyFrequency.value
      },
      skills: languageSkills.value,
      goals: {
        annual: {
          progress: annualGoalProgress.value,
          studyDays: annualStudyDays.value,
          wordsLearned: annualWordsLearned.value,
          wordGoal: annualWordGoal.value,
          documentsRead: annualDocumentsRead.value,
          documentGoal: annualDocumentGoal.value
        },
        monthly: {
          progress: monthlyGoalProgress.value,
          studyDays: monthlyStudyDays.value,
          completionRate: monthlyCompletionRate.value
        },
        custom: customGoals.value
      },
      report: {
        intensity: {
          dailyAverageTime: dailyAverageTime.value,
          intensityIndex: intensityIndex.value,
          stability: studyStability.value
        },
        effectiveness: {
          knowledgeMastery: knowledgeMastery.value,
          learningConversion: learningConversion.value,
          overallScore: overallScore.value
        },
        recommendations: personalizedRecommendations.value
      },
      generatedAt: new Date().toISOString()
    }
    
    // 根据选择的格式处理数据
    let dataStr, mimeType, fileName
    
    switch (exportFormat.value) {
      case 'json':
        dataStr = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        fileName = `learning-stats-${currentRange.value}-${Date.now()}.json`
        break
        
      case 'csv':
        // 简化的CSV转换
        const csvRows = []
        csvRows.push(['指标', '数值', '单位'])
        csvRows.push(['总阅读时间', formatDuration(totalReadingTime.value), ''])
        csvRows.push(['阅读文档数', documentsRead.value, '个'])
        csvRows.push(['学习单词数', wordsLearned.value, '个'])
        csvRows.push(['完成复习数', reviewsCompleted.value, '次'])
        csvRows.push(['复习准确率', reviewAccuracy.value, '%'])
        csvRows.push(['连续学习天数', streakDays.value, '天'])
        
        dataStr = csvRows.map(row => row.join(',')).join('\n')
        mimeType = 'text/csv'
        fileName = `learning-stats-${currentRange.value}-${Date.now()}.csv`
        break
        
      case 'pdf':
        // PDF生成需要后端支持，这里模拟
        alert('PDF报告生成请求已发送，请稍后查看下载链接')
        return
    }
    
    // 创建下载链接
    const blob = new Blob([dataStr], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (err) {
    error.value = err.message || '导出数据失败'
    console.error('导出数据失败:', err)
  } finally {
    exporting.value = false
  }
}

const generateReport = async () => {
  try {
    generatingReport.value = true
    
    // 调用API生成详细报告
    await userService.getLearningReport({ 
      period: currentRange.value,
      detailed: true 
    })
    
    alert('详细报告已生成，请查看报告摘要')
    
  } catch (err) {
    error.value = err.message || '生成报告失败'
    console.error('生成报告失败:', err)
  } finally {
    generatingReport.value = false
  }
}

const closeGoalModal = () => {
  showGoalModal.value = false
  resetGoalForm()
}

const resetGoalForm = () => {
  newGoal.name = ''
  newGoal.description = ''
  newGoal.target = 30
  newGoal.unit = 'minutes'
  newGoal.deadline = ''
}

const saveGoal = async () => {
  try {
    savingGoal.value = true
    
    // 这里应该调用API保存目标
    console.log('保存目标:', newGoal)
    
    // 模拟保存成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 关闭模态框并重置表单
    closeGoalModal()
    
    // 重新加载数据
    loadStatsData()
    
  } catch (err) {
    error.value = err.message || '保存目标失败'
    console.error('保存目标失败:', err)
  } finally {
    savingGoal.value = false
  }
}

const updateGoalProgress = (goalId) => {
  alert(`更新目标 ${goalId} 的进度`)
}

const deleteGoal = (goalId) => {
  if (confirm('确定要删除这个目标吗？')) {
    console.log('删除目标:', goalId)
  }
}

const getPriorityLabel = (priority) => {
  const labels = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || priority
}
</script>

<style scoped>
.learning-stats-view {
  max-width: 1400px;
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
  color: #06D6A0;
  margin-bottom: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.page-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

/* 时间范围选择器 */
.time-range-selector {
  background: white;
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 32px;
  border: 3px solid #FFD166;
  box-shadow: 0 8px 24px rgba(255, 209, 102, 0.15);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #FFD166;
}

.selector-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #FF6B8B;
  margin: 0;
}

.date-display {
  background: #FFFBF0;
  border-radius: 20px;
  padding: 12px 24px;
  border: 2px solid #FFD166;
}

.date-label {
  font-size: 18px;
  font-weight: bold;
  color: #E65100;
}

.range-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.range-btn {
  padding: 12px 24px;
  border: 2px solid #E0E0E0;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.range-btn:hover {
  border-color: #06D6A0;
  color: #333;
}

.range-btn.active {
  background: #06D6A0;
  border-color: #06D6A0;
  color: white;
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
  border-top-color: #06D6A0;
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
  border: 3px solid #FF6B8B;
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-message {
  font-size: 18px;
  color: #D32F2F;
  margin-bottom: 24px;
}

.error-retry-btn {
  background: #FF6B8B;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px 40px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-retry-btn:hover {
  background: #FF4A6E;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 139, 0.3);
}

/* 关键指标卡片 */
.key-metrics-section {
  margin-bottom: 40px;
}

.section-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 32px;
  color: #118AB2;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 3px dashed #118AB2;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 3px solid;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
}

.metric-card.total-reading {
  border-color: #06D6A0;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
}

.metric-card.documents-read {
  border-color: #FF6B8B;
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E9 100%);
}

.metric-card.words-learned {
  border-color: #118AB2;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.metric-card.reviews-completed {
  border-color: #FFD166;
  background: linear-gradient(135deg, #FFFBF0 0%, #FFE5B4 100%);
}

.metric-card.review-accuracy {
  border-color: #9C27B0;
  background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%);
}

.metric-card.streak-days {
  border-color: #FF9800;
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
}

.metric-icon {
  font-size: 40px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.metric-card.total-reading .metric-value {
  color: #06D6A0;
}

.metric-card.documents-read .metric-value {
  color: #FF6B8B;
}

.metric-card.words-learned .metric-value {
  color: #118AB2;
}

.metric-card.reviews-completed .metric-value {
  color: #E65100;
}

.metric-card.review-accuracy .metric-value {
  color: #9C27B0;
}

.metric-card.streak-days .metric-value {
  color: #FF9800;
}

.metric-label {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.metric-change {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

.metric-change.positive {
  background: #E8F5E9;
  color: #2E7D32;
}

.metric-change.negative {
  background: #FFEBEE;
  color: #C62828;
}

.metric-change.neutral {
  background: #F5F5F5;
  color: #616161;
}

/* 学习趋势图表 */
.trends-section {
  background: white;
  border-radius: 32px;
  padding: 32px;
  margin-bottom: 40px;
  border: 3px solid #06D6A0;
  box-shadow: 0 8px 32px rgba(6, 214, 160, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px dashed #06D6A0;
}

.trend-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-select {
  padding: 12px 24px;
  border: 2px solid #06D6A0;
  border-radius: 20px;
  background: white;
  color: #333;
  font-size: 16px;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
}

.trend-select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 214, 160, 0.2);
}

.trend-chart-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.chart-placeholder {
  position: relative;
  height: 300px;
  background: #F8F9FA;
  border-radius: 24px;
  padding: 24px;
  border: 2px solid #E0E0E0;
}

.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  border-bottom: 1px dashed #E0E0E0;
  flex: 1;
}

.chart-bars {
  position: absolute;
  bottom: 40px;
  left: 40px;
  right: 40px;
  height: 200px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #FF6B8B, #FFD166);
  border-radius: 12px 12px 0 0;
  position: relative;
  transition: all 0.3s ease;
  min-width: 40px;
}

.chart-bar:hover {
  transform: scaleY(1.1);
  box-shadow: 0 4px 12px rgba(255, 107, 139, 0.3);
}

.bar-value {
  position: absolute;
  top: -30px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.chart-labels {
  position: absolute;
  bottom: 0;
  left: 40px;
  right: 40px;
  display: flex;
  justify-content: space-between;
}

.chart-label {
  font-size: 14px;
  color: #666;
  transform: rotate(-45deg);
  transform-origin: left top;
  white-space: nowrap;
}

.trend-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid #FFD166;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.summary-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #06D6A0;
}

/* 学习习惯分析 */
.habits-section {
  margin-bottom: 40px;
}

.habits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.habit-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 3px solid;
  transition: all 0.3s ease;
}

.habit-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
}

.habit-card.best-time {
  border-color: #118AB2;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.habit-card.frequency {
  border-color: #FF6B8B;
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E9 100%);
}

.habit-card.duration {
  border-color: #06D6A0;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
}

.habit-card.efficiency {
  border-color: #FFD166;
  background: linear-gradient(135deg, #FFFBF0 0%, #FFE5B4 100%);
}

.habit-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px dashed;
}

.habit-card.best-time .habit-title {
  border-color: #118AB2;
}

.habit-card.frequency .habit-title {
  border-color: #FF6B8B;
}

.habit-card.duration .habit-title {
  border-color: #06D6A0;
}

.habit-card.efficiency .habit-title {
  border-color: #FFD166;
}

.habit-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.time-chart {
  display: flex;
  align-items: flex-end;
  height: 150px;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 16px;
  border: 2px solid #E0E0E0;
}

.hour-bar {
  flex: 1;
  background: linear-gradient(to top, #4FC3F7, #29B6F6);
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s ease;
}

.hour-bar.peak {
  background: linear-gradient(to top, #FF6B8B, #FF4081);
}

.hour-bar:hover {
  transform: scaleY(1.2);
}

.hour-label {
  position: absolute;
  bottom: -25px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.habit-insight {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px solid #FFD166;
}

.insight-icon {
  font-size: 24px;
}

.insight-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.frequency-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 16px;
  border: 2px solid #E0E0E0;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #118AB2;
}

.frequency-chart {
  display: flex;
  align-items: flex-end;
  height: 100px;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 16px;
  border: 2px solid #E0E0E0;
}

.week-bar {
  flex: 1;
  background: linear-gradient(to top, #FF6B8B, #FFD166);
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s ease;
}

.week-bar:hover {
  transform: scaleY(1.2);
}

.week-label {
  position: absolute;
  top: -25px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.duration-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.duration-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration-label {
  flex: 2;
  font-size: 14px;
  color: #666;
}

.duration-bar {
  flex: 3;
  height: 12px;
  background: #E0E0E0;
  border-radius: 6px;
  overflow: hidden;
}

.duration-fill {
  height: 100%;
  background: linear-gradient(to right, #06D6A0, #4FC3F7);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.duration-value {
  flex: 1;
  text-align: right;
  font-size: 14px;
  font-weight: bold;
  color: #06D6A0;
}

.efficiency-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.efficiency-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px solid #FFD166;
}

.efficiency-icon {
  font-size: 24px;
}

.efficiency-info {
  flex: 1;
}

.efficiency-value {
  font-size: 20px;
  font-weight: bold;
  color: #FF6B8B;
  margin-bottom: 4px;
}

.efficiency-label {
  font-size: 12px;
  color: #666;
}

.efficiency-tips {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #06D6A0;
}

.tips-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px dashed #06D6A0;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tip-item {
  padding: 12px 0;
  border-bottom: 1px dashed #E0E0E0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.tip-item:last-child {
  border-bottom: none;
}

/* 语言技能分析 */
.skills-section {
  margin-bottom: 40px;
}

.skills-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
}

.skill-radar {
  position: relative;
  width: 300px;
  height: 300px;
  background: white;
  border-radius: 50%;
  border: 3px solid #9C27B0;
  padding: 20px;
}

.radar-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.radar-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px dashed #E0E0E0;
  border-radius: 50%;
}

.radar-circle:nth-child(1) {
  width: 80%;
  height: 80%;
}

.radar-circle:nth-child(2) {
  width: 60%;
  height: 60%;
}

.radar-circle:nth-child(3) {
  width: 40%;
  height: 40%;
}

.radar-circle:nth-child(4) {
  width: 20%;
  height: 20%;
}

.radar-skills {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.skill-point {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #FF6B8B;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(255, 107, 139, 0.3);
}

.skill-point:hover {
  transform: translate(-50%, -50%) scale(1.2);
  z-index: 10;
}

.skill-name {
  font-size: 10px;
  color: white;
  text-align: center;
  font-weight: bold;
}

.skill-level {
  font-size: 14px;
  color: white;
  font-weight: bold;
}

.skills-details {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.skill-progress,
.weakness-analysis {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 3px solid;
}

.skill-progress {
  border-color: #118AB2;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.weakness-analysis {
  border-color: #FF6B8B;
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E9 100%);
}

.progress-title,
.weakness-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px dashed;
}

.skill-progress .progress-title {
  border-color: #118AB2;
}

.weakness-analysis .weakness-title {
  border-color: #FF6B8B;
}

.progress-list,
.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item,
.weakness-item {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 2px solid #E0E0E0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skill-label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.skill-level {
  font-size: 14px;
  font-weight: bold;
  color: #118AB2;
}

.progress-bar {
  height: 10px;
  background: #E0E0E0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #118AB2, #4FC3F7);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-change {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.change-label {
  font-size: 12px;
  color: #666;
}

.change-value {
  font-size: 14px;
  font-weight: bold;
}

.change-value.positive {
  color: #2E7D32;
}

.change-value.negative {
  color: #C62828;
}

.change-value.neutral {
  color: #616161;
}

.weakness-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.weakness-icon {
  font-size: 24px;
  color: #FF6B8B;
}

.weakness-content {
  flex: 1;
}

.weakness-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.weakness-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.weakness-suggestions {
  background: #FFF0F5;
  border-radius: 12px;
  padding: 12px;
  border: 1px dashed #FF6B8B;
}

.suggestion-label {
  font-size: 12px;
  font-weight: bold;
  color: #FF6B8B;
  margin-right: 8px;
}

.suggestion-text {
  font-size: 14px;
  color: #333;
}

/* 学习目标进度 */
.goals-section {
  margin-bottom: 40px;
}

.goals-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.goal-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 3px solid;
  transition: all 0.3s ease;
}

.goal-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
}

.goal-card.annual-goal {
  border-color: #FFD166;
  background: linear-gradient(135deg, #FFFBF0 0%, #FFE5B4 100%);
}

.goal-card.monthly-goal {
  border-color: #06D6A0;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
}

.goal-card.custom-goals {
  border-color: #118AB2;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px dashed;
}

.goal-card.annual-goal .goal-header {
  border-color: #FFD166;
}

.goal-card.monthly-goal .goal-header {
  border-color: #06D6A0;
}

.goal-card.custom-goals .goal-header {
  border-color: #118AB2;
}

.goal-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #333;
  margin: 0;
}

.goal-progress {
  background: white;
  border-radius: 20px;
  padding: 8px 16px;
  border: 2px solid;
}

.goal-card.annual-goal .goal-progress {
  border-color: #FFD166;
}

.goal-card.monthly-goal .goal-progress {
  border-color: #06D6A0;
}

.goal-card.custom-goals .goal-progress {
  border-color: #118AB2;
}

.progress-text {
  font-size: 18px;
  font-weight: bold;
}

.goal-card.annual-goal .progress-text {
  color: #E65100;
}

.goal-card.monthly-goal .progress-text {
  color: #06D6A0;
}

.goal-card.custom-goals .progress-text {
  color: #118AB2;
}

.goal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.goal-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 16px;
  border: 2px solid #E0E0E0;
}

.metric-label {
  font-size: 14px;
  color: #666;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.goal-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-bar {
  height: 12px;
  background: #E0E0E0;
  border-radius: 6px;
  overflow: hidden;
}

.timeline-fill {
  height: 100%;
  background: linear-gradient(to right, #FF6B8B, #FFD166);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.goal-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.calendar-day.studied {
  background: #C8F7DC;
  border: 2px solid #06D6A0;
}

.calendar-day.today {
  background: #FFE5E5;
  border: 2px solid #FF6B8B;
}

.calendar-day.future {
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  color: #999;
}

.day-number {
  font-size: 12px;
  font-weight: bold;
}

.study-indicator {
  position: absolute;
  bottom: 2px;
  width: 6px;
  height: 6px;
  background: #06D6A0;
  border-radius: 50%;
}

.custom-goals-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-goal-item {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 2px solid #118AB2;
}

.goal-info {
  margin-bottom: 12px;
}

.goal-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.goal-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.goal-progress {
  margin-bottom: 12px;
}

.goal-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.update-btn {
  background: #06D6A0;
  color: white;
}

.update-btn:hover {
  background: #04B486;
}

.delete-btn {
  background: #FF6B8B;
  color: white;
}

.delete-btn:hover {
  background: #FF4A6E;
}

.no-goals {
  text-align: center;
  padding: 40px 20px;
}

.no-goals-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-goals-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.create-goal-btn {
  background: #118AB2;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-goal-btn:hover {
  background: #0A6D8C;
  transform: translateY(-2px);
}

/* 学习报告摘要 */
.report-section {
  margin-bottom: 40px;
}

.report-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.report-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 3px solid;
  transition: all 0.3s ease;
}

.report-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
}

.report-card.intensity {
  border-color: #FF6B8B;
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E9 100%);
}

.report-card.effectiveness {
  border-color: #06D6A0;
  background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
}

.report-card.recommendations {
  border-color: #FFD166;
  background: linear-gradient(135deg, #FFFBF0 0%, #FFE5B4 100%);
}

.report-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px dashed;
}

.report-card.intensity .report-title {
  border-color: #FF6B8B;
}

.report-card.effectiveness .report-title {
  border-color: #06D6A0;
}

.report-card.recommendations .report-title {
  border-color: #FFD166;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.intensity-metrics,
.effectiveness-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.intensity-insight {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px solid #FF6B8B;
}

.effectiveness-chart {
  height: 200px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px solid #06D6A0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #06D6A0, #4FC3F7);
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  transform: scaleY(1.2);
}

.bar-label {
  position: absolute;
  top: -25px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 2px solid #FFD166;
}

.rec-icon {
  font-size: 24px;
  color: #FFD166;
  margin-bottom: 12px;
}

.rec-content {
  flex: 1;
}

.rec-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.rec-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.rec-priority {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.rec-priority.high {
  background: #FFE5E5;
  color: #FF6B8B;
}

.rec-priority.medium {
  background: #FFFBF0;
  color: #FFD166;
}

.rec-priority.low {
  background: #F0FFF4;
  color: #06D6A0;
}

.recommendations-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px solid #FFD166;
}

.summary-icon {
  font-size: 24px;
}

.summary-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

/* 数据导出 */
.export-section {
  background: white;
  border-radius: 32px;
  padding: 32px;
  border: 3px solid #9C27B0;
  box-shadow: 0 8px 32px rgba(156, 39, 176, 0.1);
}

.export-header {
  text-align: center;
  margin-bottom: 32px;
}

.export-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 32px;
  color: #9C27B0;
  margin-bottom: 12px;
}

.export-desc {
  font-size: 16px;
  color: #666;
}

.export-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.export-option {
  background: #F3E5F5;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid #E1BEE7;
  transition: all 0.3s ease;
}

.export-option:hover {
  border-color: #9C27B0;
  transform: translateY(-4px);
}

.option-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}

.option-radio {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.option-desc {
  font-size: 14px;
  color: #666;
}

.export-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.export-btn,
.report-btn {
  padding: 16px 40px;
  border: none;
  border-radius: 50px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn {
  background: #9C27B0;
  color: white;
}

.export-btn:hover:not(:disabled) {
  background: #7B1FA2;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(156, 39, 176, 0.3);
}

.report-btn {
  background: #FFD166;
  color: #333;
}

.report-btn:hover:not(:disabled) {
  background: #FFC233;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 209, 102, 0.3);
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

.goal-modal {
  background: white;
  border-radius: 32px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px dashed #FFD166;
}

.modal-title {
  font-family: 'Kalam', 'Caveat', cursive;
  font-size: 28px;
  color: #FF6B8B;
  margin: 0;
}

.modal-close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #FF6B8B;
  color: white;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: #FF4A6E;
  transform: scale(1.1);
}

.modal-body {
  padding: 24px;
}

.goal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.form-input,
.form-textarea,
.form-select {
  padding: 14px 20px;
  border: 2px solid #FFD166;
  border-radius: 20px;
  font-size: 16px;
  font-family: 'Quicksand', sans-serif;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #06D6A0;
  box-shadow: 0 0 0 3px rgba(6, 214, 160, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.save-btn,
.cancel-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn {
  background: #06D6A0;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #04B486;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .skills-overview {
    grid-template-columns: 1fr;
  }
  
  .skill-radar {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .learning-stats-view {
    padding: 16px;
  }
  
  .page-title {
    font-size: 36px;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .metrics-grid,
  .habits-grid,
  .goals-container,
  .report-cards {
    grid-template-columns: 1fr;
  }
  
  .trends-section,
  .export-section {
    padding: 24px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .export-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 28px;
  }
  
  .metric-card {
    flex-direction: column;
    text-align: center;
  }
  
  .habit-card,
  .goal-card,
  .report-card {
    padding: 20px;
  }
  
  .chart-placeholder {
    height: 250px;
    padding: 16px;
  }
  
  .chart-bars {
    left: 20px;
    right: 20px;
  }
  
  .chart-labels {
    left: 20px;
    right: 20px;
  }
}
</style>