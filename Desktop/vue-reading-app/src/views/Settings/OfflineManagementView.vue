<template>
  <div class="offline-management-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">📱 离线管理</h1>
      <p class="page-subtitle">管理离线数据和网络连接</p>
    </div>

    <!-- 网络状态卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2 class="status-title">📡 网络状态</h2>
        <div class="status-indicator" :class="{ online: isOnline, offline: !isOnline }">
          <span class="status-icon">{{ isOnline ? '✅' : '❌' }}</span>
          <span class="status-text">{{ isOnline ? '在线' : '离线' }}</span>
        </div>
      </div>
      
      <div class="status-details">
        <div class="status-item">
          <span class="item-label">最后同步时间:</span>
          <span class="item-value">{{ formatDate(offlineStore.lastSyncTime) || '从未同步' }}</span>
        </div>
        
        <div class="status-item">
          <span class="item-label">待同步操作:</span>
          <span class="item-value">{{ offlineStore.pendingOperations }}</span>
        </div>
        
        <div class="status-item">
          <span class="item-label">离线数据大小:</span>
          <span class="item-value">{{ formatFileSize(offlineStore.offlineDataSize) }}</span>
        </div>
      </div>
    </div>

    <!-- 离线设置 -->
    <div class="settings-section">
      <h2 class="section-title">⚙️ 离线设置</h2>
      
      <div class="settings-grid">
        <!-- 离线模式 -->
        <div class="setting-card">
          <h3 class="setting-title">🌐 离线模式</h3>
          <p class="setting-description">启用后优先使用离线数据</p>
          
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
        </div>

        <!-- 自动同步 -->
        <div class="setting-card">
          <h3 class="setting-title">🔄 自动同步</h3>
          <p class="setting-description">网络恢复时自动同步数据</p>
          
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
        </div>

        <!-- 同步间隔 -->
        <div class="setting-card">
          <h3 class="setting-title">⏰ 同步间隔</h3>
          <p class="setting-description">自动同步的时间间隔</p>
          
          <div class="interval-setting">
            <div class="slider-control">
              <input
                type="range"
                v-model="offlineSettings.syncInterval"
                min="1"
                max="1440"
                step="5"
                @change="updateOfflineSettings"
              />
              <div class="slider-labels">
                <span>1分钟</span>
                <span>24小时</span>
              </div>
            </div>
            <div class="interval-value">
              {{ offlineSettings.syncInterval }} 分钟
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <h2 class="section-title">📊 离线数据统计</h2>
      
      <div class="stats-grid">
        <!-- 文档统计 -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📄</span>
            <h3 class="stat-title">文档</h3>
          </div>
          
          <div class="stat-content">
            <div class="stat-item">
              <span class="item-label">数量:</span>
              <span class="item-value">{{ offlineStats.documentsCount }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">未同步:</span>
              <span class="item-value">{{ offlineStats.unsyncedDocuments }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">大小:</span>
              <span class="item-value">{{ formatFileSize(offlineStats.documentsSize) }}</span>
            </div>
          </div>
        </div>

        <!-- 词汇统计 -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📖</span>
            <h3 class="stat-title">词汇</h3>
          </div>
          
          <div class="stat-content">
            <div class="stat-item">
              <span class="item-label">数量:</span>
              <span class="item-value">{{ offlineStats.vocabularyCount }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">未同步:</span>
              <span class="item-value">{{ offlineStats.unsyncedVocabulary }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">大小:</span>
              <span class="item-value">{{ formatFileSize(offlineStats.vocabularySize) }}</span>
            </div>
          </div>
        </div>

        <!-- 复习记录统计 -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">🔄</span>
            <h3 class="stat-title">复习记录</h3>
          </div>
          
          <div class="stat-content">
            <div class="stat-item">
              <span class="item-label">数量:</span>
              <span class="item-value">{{ offlineStats.reviewsCount }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">未同步:</span>
              <span class="item-value">{{ offlineStats.unsyncedReviews }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">大小:</span>
              <span class="item-value">{{ formatFileSize(offlineStats.reviewsSize) }}</span>
            </div>
          </div>
        </div>

        <!-- 笔记统计 -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📝</span>
            <h3 class="stat-title">笔记</h3>
          </div>
          
          <div class="stat-content">
            <div class="stat-item">
              <span class="item-label">数量:</span>
              <span class="item-value">{{ offlineStats.notesCount }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">未同步:</span>
              <span class="item-value">{{ offlineStats.unsyncedNotes }}</span>
            </div>
            
            <div class="stat-item">
              <span class="item-label">大小:</span>
              <span class="item-value">{{ formatFileSize(offlineStats.notesSize) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <h2 class="section-title">🚀 操作</h2>
      
      <div class="actions-grid">
        <!-- 立即同步 -->
        <button
          class="action-btn primary"
          @click="syncOfflineData"
          :disabled="offlineStore.isSyncing || !isOnline"
        >
          <span class="action-icon">🔄</span>
          <span class="action-label">
            {{ offlineStore.isSyncing ? '同步中...' : '立即同步' }}
          </span>
        </button>

        <!-- 清除缓存 -->
        <button
          class="action-btn secondary"
          @click="showClearCacheDialog = true"
          :disabled="offlineStore.offlineDataSize === 0"
        >
          <span class="action-icon">🧹</span>
          <span class="action-label">清除缓存</span>
        </button>

        <!-- 导出数据 -->
        <button
          class="action-btn tertiary"
          @click="exportOfflineData"
          :disabled="offlineStore.offlineDataSize === 0"
        >
          <span class="action-icon">📤</span>
          <span class="action-label">导出数据</span>
        </button>

        <!-- 导入数据 -->
        <button
          class="action-btn quaternary"
          @click="showImportDialog = true"
        >
          <span class="action-icon">📥</span>
          <span class="action-label">导入数据</span>
        </button>
      </div>
    </div>

    <!-- 同步队列 -->
    <div v-if="syncQueue.length > 0" class="queue-section">
      <h2 class="section-title">📋 同步队列</h2>
      
      <div class="queue-list">
        <div
          v-for="item in syncQueue"
          :key="item.id"
          class="queue-item"
        >
          <div class="queue-header">
            <span class="queue-type">{{ getTypeIcon(item.type) }} {{ item.type }}</span>
            <span class="queue-action">{{ item.action }}</span>
          </div>
          
          <div class="queue-content">
            <p class="queue-data">{{ getQueueItemDescription(item) }}</p>
            <span class="queue-time">{{ formatRelativeTime(item.timestamp) }}</span>
          </div>
          
          <div class="queue-status" :class="item.status">
            {{ getStatusText(item.status) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 清除缓存对话框 -->
    <AppModal
      v-if="showClearCacheDialog"
      title="🧹 清除离线缓存"
      :show-close="true"
      :show-footer="true"
      @close="showClearCacheDialog = false"
      @confirm="clearOfflineCache"
    >
      <div class="clear-cache-dialog">
        <p class="warning-text">⚠️ 确定要清除离线缓存吗？</p>
        
        <div class="cache-options">
          <div class="cache-option">
            <label>
              <input type="checkbox" v-model="cacheSettings.clearDocuments" />
              <span class="option-label">文档缓存 ({{ formatFileSize(offlineStats.documentsSize) }})</span>
            </label>
          </div>
          
          <div class="cache-option">
            <label>
              <input type="checkbox" v-model="cacheSettings.clearVocabulary" />
              <span class="option-label">词汇缓存 ({{ formatFileSize(offlineStats.vocabularySize) }})</span>
            </label>
          </div>
          
          <div class="cache-option">
            <label>
              <input type="checkbox" v-model="cacheSettings.clearReviews" />
              <span class="option-label">复习记录 ({{ formatFileSize(offlineStats.reviewsSize) }})</span>
            </label>
          </div>
          
          <div class="cache-option">
            <label>
              <input type="checkbox" v-model="cacheSettings.clearAll" @change="toggleClearAllCache" />
              <span class="option-label">全部缓存 ({{ formatFileSize(offlineStats.totalSize) }})</span>
            </label>
          </div>
        </div>
        
        <p class="cache-hint">清除后需要重新下载数据才能离线使用</p>
      </div>
    </AppModal>

    <!-- 导入数据对话框 -->
    <AppModal
      v-if="showImportDialog"
      title="📥 导入离线数据"
      :show-close="true"
      :show-footer="true"
      size="lg"
      @close="showImportDialog = false"
      @confirm="importOfflineData"
    >
      <div class="import-data-dialog">
        <div class="import-instructions">
          <h4>导入说明：</h4>
          <ul>
            <li>支持 JSON 和 CSV 格式</li>
            <li>导入前建议备份当前数据</li>
            <li>导入过程可能需要几分钟时间</li>
          </ul>
        </div>
        
        <div class="import-options">
          <div class="import-option">
            <label>
              <input type="radio" v-model="importSettings.mode" value="merge" />
              <span class="option-label">合并数据（保留现有数据）</span>
            </label>
          </div>
          
          <div class="import-option">
            <label>
              <input type="radio" v-model="importSettings.mode" value="replace" />
              <span class="option-label">替换数据（清除现有数据）</span>
            </label>
          </div>
        </div>
        
        <div class="file-upload">
          <input
            type="file"
            ref="importFileInput"
            @change="handleImportFile"
            accept=".json,.csv"
            style="display: none"
          />
          <button class="upload-btn" @click="triggerFileInput">
            📁 选择文件
          </button>
          
          <div v-if="importSettings.file" class="file-info">
            <p class="file-name">文件: {{ importSettings.file.name }}</p>
            <p class="file-size">大小: {{ formatFileSize(importSettings.file.size) }}</p>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useOfflineStore } from '@/stores/offline.store'
import offlineService from '@/services/offline.service'
import { formatDate, formatFileSize, formatRelativeTime } from '@/utils/formatter'
import AppModal from '@/components/common/AppModal.vue'

const offlineStore = useOfflineStore()

// 状态
const loading = ref(false)
const showClearCacheDialog = ref(false)
const showImportDialog = ref(false)

// 设置数据
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

const importSettings = reactive({
  mode: 'merge',
  file: null,
  fileName: ''
})

// 计算属性
const isOnline = computed(() => offlineStore.isOnline)

const offlineStats = computed(() => {
  const documents = offlineStore.offlineDocuments
  const vocabulary = offlineStore.offlineVocabulary
  const reviews = offlineStore.offlineReviews
  
  return {
    documentsCount: documents.length,
    unsyncedDocuments: documents.filter(d => !d.isSynced).length,
    documentsSize: JSON.stringify(documents).length,
    
    vocabularyCount: vocabulary.length,
    unsyncedVocabulary: vocabulary.filter(v => !v.isSynced).length,
    vocabularySize: JSON.stringify(vocabulary).length,
    
    reviewsCount: reviews.length,
    unsyncedReviews: reviews.filter(r => !r.isSynced).length,
    reviewsSize: JSON.stringify(reviews).length,
    
    totalSize: offlineStore.offlineDataSize
  }
})

const syncQueue = computed(() => {
  return offlineStore.pendingOperations
})

// 生命周期
onMounted(async () => {
  await loadOfflineSettings()
})

// 方法
const loadOfflineSettings = async () => {
  try {
    offlineSettings.offlineMode = await offlineService.getOfflineMode()
    offlineSettings.autoSync = await offlineService.getAutoSync()
    offlineSettings.syncInterval = await offlineService.getSyncInterval()
  } catch (err) {
    console.error('加载离线设置失败:', err)
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

const syncOfflineData = async () => {
  try {
    loading.value = true
    
    await offlineService.syncOfflineData({
      force: true,
      onProgress: (progress) => {
        console.log('同步进度:', progress)
      }
    })
    
  } catch (err) {
    console.error('同步离线数据失败:', err)
  } finally {
    loading.value = false
  }
}

const clearOfflineCache = async () => {
  try {
    const options = {
      documents: cacheSettings.clearDocuments,
      vocabulary: cacheSettings.clearVocabulary,
      reviews: cacheSettings.clearReviews,
      all: cacheSettings.clearAll,
      skipConfirm: true
    }
    
    await offlineService.clearOfflineCache(options)
    
    // 重置缓存选择
    Object.keys(cacheSettings).forEach(key => {
      cacheSettings[key] = false
    })
    
    showClearCacheDialog.value = false
    
  } catch (err) {
    console.error('清除离线缓存失败:', err)
  }
}

const exportOfflineData = async () => {
  try {
    await offlineService.exportOfflineData({
      format: 'json',
      includeDocuments: true,
      includeVocabulary: true,
      includeReviews: true,
      includeNotes: true,
      includeHighlights: true
    })
  } catch (err) {
    console.error('导出离线数据失败:', err)
  }
}

const handleImportFile = (event) => {
  const file = event.target.files[0]
  if (file) {
    importSettings.file = file
    importSettings.fileName = file.name
  }
}

const triggerFileInput = () => {
  const fileInput = document.querySelector('input[type="file"]')
  if (fileInput) {
    fileInput.click()
  }
}

const importOfflineData = async () => {
  try {
    if (!importSettings.file) {
      alert('请先选择文件')
      return
    }
    
    loading.value = true
    
    await offlineService.importOfflineData(importSettings.file, {
      merge: importSettings.mode === 'merge',
      clearExisting: importSettings.mode === 'replace'
    })
    
    showImportDialog.value = false
    importSettings.file = null
    importSettings.fileName = ''
    
  } catch (err) {
    console.error('导入离线数据失败:', err)
  } finally {
    loading.value = false
  }
}

const getTypeIcon = (type) => {
  const iconMap = {
    document: '📄',
    vocabulary: '📖',
    review: '🔄',
    note: '📝',
    highlight: '🖍️'
  }
  
  return iconMap[type] || '📋'
}

const getQueueItemDescription = (item) => {
  switch (item.type) {
    case 'document':
      return `文档: ${item.data.title || '未命名文档'}`
    case 'vocabulary':
      return `词汇: ${item.data.word || '未命名词汇'}`
    case 'review':
      return `复习记录: ${item.data.word || '未命名单词'}`
    case 'note':
      return `笔记: ${item.data.content?.substring(0, 50) || '空笔记'}...`
    case 'highlight':
      return `高亮: ${item.data.text?.substring(0, 50) || '空高亮'}...`
    default:
      return '未知操作'
  }
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '等待同步',
    syncing: '同步中',
    failed: '同步失败',
    completed: '已完成'
  }
  
  return statusMap[status] || status
}

const toggleClearAllCache = () => {
  if (cacheSettings.clearAll) {
    cacheSettings.clearDocuments = true
    cacheSettings.clearVocabulary = true
    cacheSettings.clearReviews = true
  }
}
</script>

<style scoped>
.offline-management-view {
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

.status-card,
.settings-section,
.stats-section,
.actions-section,
.queue-section {
  background: white;
  border-radius: 32px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #ffd591;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.status-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
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

.status-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #999;
}

.item-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.section-title {
  font-family: 'Kalam', cursive;
  font-size: 28px;
  color: #ff6b9d;
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 2px dashed #e8e8e8;
}

.settings-grid,
.stats-grid,
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.setting-card,
.stat-card {
  background: #f9f9f9;
  border-radius: 24px;
  padding: 20px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.setting-card:hover,
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #ffd591;
}

.setting-title,
.stat-title {
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

.interval-setting {
  margin: 16px 0;
}

.slider-control {
  margin: 12px 0;
}

.slider-control input[type="range"] {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff6b9d;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
}

.interval-value {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  text-align: center;
  margin-top: 8px;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ddd;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.action-btn {
  flex: 1;
  min-width: 200px;
  padding: 16px 24px;
  border-radius: 24px;
  border: none;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.action-btn.primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #ffcc00 100%);
  color: white;
}

.action-btn.secondary {
  background: white;
  color: #666;
  border: 3px solid #ffd591;
}

.action-btn.tertiary {
  background: #118ab2;
  color: white;
}

.action-btn.quaternary {
  background: #06d6a0;
  color: white;
}

.action-icon {
  font-size: 20px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-item {
  background: #f9f9f9;
  border-radius: 20px;
  padding: 16px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s ease;
}

.queue-item:hover {
  border-color: #ffd591;
  transform: translateX(4px);
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.queue-type {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.queue-action {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: white;
  background: #666;
  padding: 4px 10px;
  border-radius: 12px;
}

.queue-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.queue-data {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0;
  flex: 1;
}

.queue-time {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
  margin-left: 16px;
}

.queue-status {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
}

.queue-status.pending {
  background: #ffd166;
}

.queue-status.syncing {
  background: #118ab2;
}

.queue-status.failed {
  background: #ff4757;
}

.queue-status.completed {
  background: #06d6a0;
}

.clear-cache-dialog,
.import-data-dialog {
  padding: 16px;
}

.warning-text {
  color: #ff4757;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}

.cache-options,
.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.cache-option,
.import-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.cache-option:hover,
.import-option:hover {
  background: #f0f0f0;
}

.cache-option label,
.import-option label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #333;
  width: 100%;
}

.option-label {
  flex: 1;
}

.cache-hint {
  font-family: 'Quicksand', sans-serif;
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 16px;
}

.import-instructions {
  background: #f0f9ff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.import-instructions h4 {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #118ab2;
  margin: 0 0 8px;
}

.import-instructions ul {
  margin: 0;
  padding-left: 20px;
}

.import-instructions li {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

.file-upload {
  text-align: center;
  margin: 20px 0;
}

.upload-btn {
  padding: 12px 24px;
  border-radius: 20px;
  border: 3px solid #ffd591;
  background: white;
  color: #666;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.upload-btn:hover {
  background: #fff5e6;
  transform: translateY(-2px);
}

.file-info {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 16px;
}

.file-name,
.file-size {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .settings-grid,
  .stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .offline-management-view {
    padding: 16px;
  }
  
  .page-header,
  .status-card,
  .settings-section,
  .stats-section,
  .actions-section,
  .queue-section {
    padding: 20px;
  }
  
  .settings-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    flex-direction: column;
  }
  
  .action-btn {
    min-width: 100%;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 36px;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .status-details {
    grid-template-columns: 1fr;
  }
}
</style>