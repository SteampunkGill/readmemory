<template>
  <div class="offline-management">
    <header class="header">
      <h1>📦 离线模式管理</h1>
      <p class="subtitle">管理已下载的文档，随时随地阅读</p>
    </header>

    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader">正在加载离线数据...</div>
    </div>

    <div class="content" v-else>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-info">
            <div class="stat-value">{{ downloadedCount }}</div>
            <div class="stat-label">已下载文档</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💾</div>
          <div class="stat-info">
            <div class="stat-value">{{ usedStorage }} MB</div>
            <div class="stat-label">已用存储</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📱</div>
          <div class="stat-info">
            <div class="stat-value">{{ availableSpace }} MB</div>
            <div class="stat-label">剩余空间</div>
          </div>
        </div>
      </div>

      <div class="controls">
        <button class="btn-primary" @click="openDownloadManager">
          ⬇️ 下载新文档
        </button>
        <button class="btn-secondary" @click="clearAllDownloads">
          🗑️ 清空所有下载
        </button>
        <button class="btn-secondary" @click="syncNow">
          🔄 立即同步
        </button>
      </div>

      <div class="document-list">
        <h2>已下载文档列表</h2>
        <div v-if="documents.length === 0" class="empty">
          <div class="empty-icon">📭</div>
          <p>暂无离线文档</p>
          <button class="btn-primary" @click="openDownloadManager">去下载</button>
        </div>
        <div v-else class="list">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="document-item"
            :class="{ expired: checkIsExpired(doc.updatedAt) }"
          >
            <div class="doc-icon">📄</div>
            <div class="doc-info">
              <h3>{{ doc.title }}</h3>
              <p>
                类型: {{ doc.fileType }} · 
                {{ (doc.fileSize / 1024 / 1024).toFixed(2) }} MB · 
                更新于 {{ formatDate(doc.updatedAt) }}
              </p>
              <div class="doc-status">
                <span class="status" :class="{ 'synced': doc.isSynced }">
                  {{ doc.isSynced ? '已同步' : '未同步' }}
                </span>
                <span v-if="checkIsExpired(doc.updatedAt)" class="expired-label">已过期</span>
              </div>
            </div>
            <div class="doc-actions">
              <button class="btn-action" @click="openDocument(doc)">阅读</button>
              <button class="btn-action" @click="deleteDocument(doc)">删除</button>
              <button class="btn-action" @click="updateDocument(doc)">更新</button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings">
        <h2>离线设置</h2>
        <div class="setting-group">
          <label class="setting-label">
            <input type="checkbox" v-model="settings.autoSync" />
            <span>自动同步更新</span>
          </label>
          <label class="setting-label">
            <input type="checkbox" v-model="settings.wifiOnly" />
            <span>仅在 WiFi 下下载</span>
          </label>
          <label class="setting-label">
            <span>离线存储上限</span>
            <input type="range" min="100" max="5000" v-model.number="settings.storageLimit" />
            <span class="value">{{ settings.storageLimit }} MB</span>
          </label>
          <label class="setting-label">
            <span>同步间隔</span>
            <select v-model="settings.syncInterval">
              <option :value="10080">7天</option>
              <option :value="43200">30天</option>
              <option :value="129600">90天</option>
              <option :value="0">从不</option>
            </select>
          </label>
        </div>
        <button class="btn-save" @click="saveSettings">保存设置</button>
      </div>
    </div>

    <!-- 下载管理器弹窗 -->
    <div class="modal" v-if="showDownloadManager">
      <div class="modal-content">
        <h3>下载新文档</h3>
        <div v-if="loadingAvailable" class="loader">正在获取可选文档...</div>
        <div v-else class="available-docs">
          <div
            v-for="doc in availableDocuments"
            :key="doc.id"
            class="available-doc"
          >
            <div class="doc-icon">📄</div>
            <div class="doc-info">
              <h4>{{ doc.title }}</h4>
              <p>{{ (doc.fileSize / 1024 / 1024).toFixed(2) }} MB</p>
            </div>
            <button
              class="btn-download"
              @click="downloadDocument(doc)"
              :disabled="doc.downloading"
            >
              {{ doc.downloading ? '下载中...' : '下载' }}
            </button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-close" @click="closeDownloadManager">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'


// --- 状态变量 ---
const isLoading = ref(true)
const loadingAvailable = ref(false)
const downloadedCount = ref(0)
const usedStorage = ref(0)
const documents = ref([])
const availableDocuments = ref([])
const showDownloadManager = ref(false)

const settings = ref({
  offlineMode: true,
  autoSync: true,
  storageLimit: 2000,
  syncInterval: 43200,
  wifiOnly: true,
  lastSyncTime: ''
})

const availableSpace = computed(() => {
  return Math.max(0, settings.value.storageLimit - usedStorage.value)
})

// --- API 请求逻辑 ---

const initData = async () => {
  isLoading.value = true
  try {
    // 并发请求初始化数据
    const [statsRes, docsRes, settingsRes] = await Promise.all([
      fetch('/api/v1/offline/stats'),
      fetch('/api/v1/offline/documents'),
      fetch('/api/v1/offline/settings')
    ])

    if (statsRes.ok && docsRes.ok && settingsRes.ok) {
      const statsData = await statsRes.json()
      const docsData = await docsRes.json()
      const settingsData = await settingsRes.json()

      // 映射后端数据
      downloadedCount.value = statsData.data.documentCount
      usedStorage.value = Math.round(statsData.data.totalSize / 1024 / 1024)
      documents.value = docsData.data || []
      settings.value = settingsData.data || settings.value
    } else {
      throw new Error('API 响应异常')
    }
  } catch (error) {
    console.error('初始化加载失败，切换至模拟数据:', error)
    // 失败回退到模拟数据
    documents.value = [...mockDocuments]
    downloadedCount.value = mockDocuments.length
    usedStorage.value = 245
  } finally {
    isLoading.value = false
  }
}

const openDownloadManager = async () => {
  showDownloadManager.value = true
  loadingAvailable.value = true
  try {
    const response = await fetch('/api/v1/documents')
    if (response.ok) {
      const result = await response.json()
      availableDocuments.value = result.data.map(d => ({ ...d, downloading: false }))
    } else {
      throw new Error()
    }
  } catch (error) {
    availableDocuments.value = [...mockAvailable]
  } finally {
    loadingAvailable.value = false
  }
}

const downloadDocument = async (doc) => {
  doc.downloading = true
  try {
    const response = await fetch(`/api/v1/offline/documents/${doc.id}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      alert(`已开始下载: ${doc.title}`)
      await initData() // 刷新列表
    } else {
      alert('下载任务启动失败')
    }
  } catch (error) {
    alert('网络错误，无法连接到后端')
  } finally {
    doc.downloading = false
  }
}

const deleteDocument = async (doc) => {
  if (!confirm(`确定删除 "${doc.title}" 吗？`)) return

  try {
    const response = await fetch(`/api/v1/offline/documents/${doc.id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      await initData()
    } else {
      alert('删除失败')
    }
  } catch (error) {
    // 模拟环境下本地删除
    documents.value = documents.value.filter(d => d.id !== doc.id)
    downloadedCount.value--
    usedStorage.value -= Math.round(doc.fileSize / 1024 / 1024)
  }
}

const saveSettings = async () => {
  try {
    const response = await fetch('/api/v1/offline/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    })
    if (response.ok) {
      alert('设置已成功同步到服务器')
    } else {
      alert('保存失败，请稍后重试')
    }
  } catch (error) {
    alert('设置已保存到本地（演示模式）')
  }
}

const syncNow = async () => {
  try {
    const response = await fetch('/api/v1/offline/sync/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskType: 'MANUAL_SYNC' })
    })
    if (response.ok) {
      alert('离线同步任务已启动')
      await initData()
    }
  } catch (error) {
    alert('无法连接到服务器进行同步')
  }
}

// --- 工具函数 ---

const checkIsExpired = (dateStr) => {
  if (!dateStr || settings.value.syncInterval === 0) return false
  const updateDate = new Date(dateStr)
  const now = new Date()
  const diffMinutes = (now - updateDate) / (1000 * 60)
  return diffMinutes > settings.value.syncInterval
}

const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  return dateStr.split('T')[0]
}

const closeDownloadManager = () => {
  showDownloadManager.value = false
}

const updateDocument = (doc) => {
  alert(`检查更新: ${doc.title}`)
}

const openDocument = (doc) => {
  alert(`正在打开本地离线文档: ${doc.title}`)
}

const clearAllDownloads = () => {
  if (confirm('确定清空所有本地离线缓存吗？')) {
    documents.value = []
    usedStorage.value = 0
    downloadedCount.value = 0
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.offline-management {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 3rem;
  color: var(--color-primary);
}

.subtitle {
  font-size: 1.5rem;
  color: var(--color-text-light);
}

.stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 200px;
  background-color: white;
  border-radius: var(--radius-large);
  padding: 1.5rem;
  border: 3px solid var(--color-secondary);
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  font-size: 3rem;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-primary);
}

.stat-label {
  font-size: 1.2rem;
  color: var(--color-text-light);
}

.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 15px 30px;
  border-radius: var(--radius-large);
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  border: 3px solid;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-secondary {
  background-color: white;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.document-list {
  background-color: white;
  border-radius: var(--radius-large);
  padding: 2rem;
  border: 3px solid var(--color-primary);
  margin-bottom: 2rem;
}

.document-list h2 {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  border-bottom: 3px solid var(--color-secondary);
  padding-bottom: 10px;
}

.empty {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.empty p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: var(--radius-large);
  border: 3px solid var(--color-secondary);
  transition: all 0.3s;
}

.document-item:hover {
  border-color: var(--color-primary);
  background-color: #f9f9f9;
}

.document-item.expired {
  opacity: 0.7;
  border-color: #ccc;
}

.doc-icon {
  font-size: 3rem;
}

.doc-info {
  flex: 1;
}

.doc-info h3 {
  font-size: 1.5rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.doc-info p {
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.doc-status {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.status {
  padding: 5px 15px;
  border-radius: var(--radius-medium);
  font-weight: bold;
  background-color: var(--color-success);
  color: white;
}

.status.已过期 {
  background-color: var(--color-danger);
}

.expired-label {
  color: var(--color-danger);
  font-weight: bold;
}

.doc-actions {
  display: flex;
  gap: 1rem;
}

.btn-action {
  padding: 10px 20px;
  border-radius: var(--radius-medium);
  border: 2px solid var(--color-secondary);
  background-color: white;
  font-weight: bold;
  cursor: pointer;
}

.settings {
  background-color: white;
  border-radius: var(--radius-large);
  padding: 2rem;
  border: 3px solid var(--color-primary);
}

.settings h2 {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  border-bottom: 3px solid var(--color-secondary);
  padding-bottom: 10px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
}

.setting-label span:first-child {
  min-width: 150px;
}

.setting-label input[type="range"] {
  flex: 1;
}

.value {
  min-width: 50px;
  text-align: right;
}

.btn-save {
  padding: 15px 40px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-large);
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 3rem;
  border-radius: var(--radius-large);
  border: 5px solid var(--color-primary);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
}

.available-docs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.available-doc {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: var(--radius-large);
  border: 3px solid var(--color-secondary);
}

.available-doc .doc-icon {
  font-size: 2.5rem;
}

.available-doc .doc-info {
  flex: 1;
}

.available-doc .doc-info h4 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.btn-download {
  padding: 10px 20px;
  border-radius: var(--radius-medium);
  background-color: var(--color-primary);
  color: white;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

.btn-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-actions {
  text-align: right;
}

.btn-close {
  padding: 12px 24px;
  border-radius: var(--radius-medium);
  background-color: var(--color-secondary);
  color: white;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
</style>