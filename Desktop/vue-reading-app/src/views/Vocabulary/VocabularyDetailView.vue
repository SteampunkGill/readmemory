<template>
  <div class="vocabulary-detail-view">
    <!-- 背景装饰元素 -->
    <div class="background-decoration">
      <div class="bubble bubble-1">💭</div>
      <div class="bubble bubble-2">💭</div>
      <div class="bubble bubble-3">💭</div>
      <div class="bubble bubble-4">💭</div>
    </div>

    <!-- 返回按钮 -->
    <button @click="goBack" class="back-button">
      <span class="back-icon">←</span>
      返回生词本
    </button>

    <!-- 主内容区域 -->
    <div class="detail-container">
      <!-- 单词头部信息 -->
      <div class="word-header-section">
        <div class="word-title">
          <h1 class="word-text">{{ vocabulary.word }}</h1>
          <div class="word-meta">
            <span class="phonetic">{{ vocabulary.phonetic || '暂无音标' }}</span>
            <button 
              @click="playAudio" 
              class="audio-button"
              :disabled="!vocabulary.audioUrl"
              :class="{ 'has-audio': vocabulary.audioUrl }"
            >
              🔊
            </button>
          </div>
        </div>

        <!-- 状态标签 -->
        <div class="status-tags">
          <span :class="['status-badge', `status-${vocabulary.status}`]">
            {{ getStatusLabel(vocabulary.status) }}
          </span>
          <span class="difficulty-badge" :class="`difficulty-${vocabulary.difficulty || 'medium'}`">
            {{ getDifficultyLabel(vocabulary.difficulty || 'medium') }}
          </span>
          <span v-if="vocabulary.partOfSpeech" class="pos-badge">
            {{ vocabulary.partOfSpeech }}
          </span>
        </div>
      </div>

      <!-- 内容标签页 -->
      <div class="tab-container">
        <div class="tab-header">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <!-- 释义标签页 -->
          <div v-if="activeTab === 'definitions'" class="definitions-tab">
            <div class="section-header">
              <h2 class="section-title">📖 单词释义</h2>
              <button @click="refreshWordData" class="refresh-button" :disabled="refreshing">
                <span class="refresh-icon" :class="{ spinning: refreshing }">🔄</span>
                {{ refreshing ? '刷新中...' : '刷新数据' }}
              </button>
            </div>
            
            <div v-if="vocabulary.definitions && vocabulary.definitions.length > 0" class="definitions-list">
              <div 
                v-for="(definition, index) in vocabulary.definitions" 
                :key="index"
                class="definition-item"
              >
                <div class="definition-number">{{ index + 1 }}.</div>
                <div class="definition-content">
                  <p class="definition-text">{{ definition }}</p>
                  <div v-if="vocabulary.examples && vocabulary.examples[index]" class="example-text">
                    📝 {{ vocabulary.examples[index] }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-section">
              <div class="empty-icon">📝</div>
              <p class="empty-text">暂无释义数据</p>
            </div>

            <!-- 同义词和反义词 -->
            <div v-if="vocabulary.synonyms || vocabulary.antonyms" class="word-relations">
              <div v-if="vocabulary.synonyms && vocabulary.synonyms.length > 0" class="relation-group">
                <h3 class="relation-title">🔗 同义词</h3>
                <div class="relation-tags">
                  <span 
                    v-for="synonym in vocabulary.synonyms.slice(0, 8)" 
                    :key="synonym"
                    class="relation-tag synonym-tag"
                    @click="lookupWord(synonym)"
                  >
                    {{ synonym }}
                  </span>
                </div>
              </div>
              
              <div v-if="vocabulary.antonyms && vocabulary.antonyms.length > 0" class="relation-group">
                <h3 class="relation-title">⚡ 反义词</h3>
                <div class="relation-tags">
                  <span 
                    v-for="antonym in vocabulary.antonyms.slice(0, 8)" 
                    :key="antonym"
                    class="relation-tag antonym-tag"
                    @click="lookupWord(antonym)"
                  >
                    {{ antonym }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 学习信息标签页 -->
          <div v-if="activeTab === 'learning'" class="learning-tab">
            <div class="section-header">
              <h2 class="section-title">🎯 学习信息</h2>
              <button @click="startReview" class="review-button">
                <span class="review-icon">🔄</span>
                开始复习
              </button>
            </div>

            <!-- 掌握程度 -->
            <div class="mastery-section">
              <h3 class="subsection-title">掌握程度</h3>
              <div class="mastery-display">
                <div class="mastery-bar">
                  <div 
                    class="mastery-fill" 
                    :style="{ width: `${vocabulary.masteryLevel * 10}%` }"
                  ></div>
                </div>
                <div class="mastery-percentage">{{ vocabulary.masteryLevel * 10 }}%</div>
              </div>
              
              <div class="mastery-controls">
                <button 
                  v-for="level in masteryLevels" 
                  :key="level.value"
                  @click="updateMasteryLevel(level.value)"
                  :class="['mastery-level-btn', { active: vocabulary.masteryLevel === level.value }]"
                >
                  {{ level.label }}
                </button>
              </div>
            </div>

            <!-- 学习状态 -->
            <div class="status-section">
              <h3 class="subsection-title">学习状态</h3>
              <div class="status-controls">
                <button 
                  v-for="status in statusOptions" 
                  :key="status.value"
                  @click="updateStatus(status.value)"
                  :class="['status-option-btn', `status-${status.value}`, { active: vocabulary.status === status.value }]"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>

            <!-- 学习统计 -->
            <div class="stats-section">
              <h3 class="subsection-title">📊 学习统计</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ vocabulary.reviewCount || 0 }}</div>
                  <div class="stat-label">复习次数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ formatDate(vocabulary.createdAt) }}</div>
                  <div class="stat-label">添加时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ vocabulary.lastReviewedAt ? formatDate(vocabulary.lastReviewedAt) : '暂无' }}</div>
                  <div class="stat-label">上次复习</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ vocabulary.nextReviewAt ? formatDate(vocabulary.nextReviewAt) : '暂无' }}</div>
                  <div class="stat-label">下次复习</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 笔记标签页 -->
          <div v-if="activeTab === 'notes'" class="notes-tab">
            <div class="section-header">
              <h2 class="section-title">📝 学习笔记</h2>
              <button @click="isEditingNotes = !isEditingNotes" class="edit-notes-button">
                <span class="edit-icon">{{ isEditingNotes ? '💾' : '✏️' }}</span>
                {{ isEditingNotes ? '保存笔记' : '编辑笔记' }}
              </button>
            </div>

            <div v-if="isEditingNotes" class="notes-editor">
              <textarea 
                v-model="editedNotes" 
                class="notes-textarea"
                placeholder="在这里记录你的学习心得、记忆技巧、使用场景等..."
                rows="8"
              ></textarea>
              <div class="editor-actions">
                <button @click="saveNotes" class="save-notes-btn">💾 保存笔记</button>
                <button @click="cancelEditNotes" class="cancel-notes-btn">❌ 取消</button>
              </div>
            </div>
            <div v-else class="notes-display">
              <div v-if="vocabulary.notes" class="notes-content">
                {{ vocabulary.notes }}
              </div>
              <div v-else class="empty-notes">
                <div class="empty-icon">📝</div>
                <p class="empty-text">还没有添加笔记呢</p>
                <button @click="isEditingNotes = true" class="add-notes-btn">
                  ✏️ 添加笔记
                </button>
              </div>
            </div>

            <!-- 标签管理 -->
            <div class="tags-section">
              <h3 class="subsection-title">🏷️ 标签管理</h3>
              <div class="tags-display">
                <div v-if="vocabulary.tags && vocabulary.tags.length > 0" class="tags-list">
                  <span 
                    v-for="tag in vocabulary.tags" 
                    :key="tag"
                    class="tag-item"
                    @click="removeTag(tag)"
                  >
                    {{ tag }} ×
                  </span>
                </div>
                <div v-else class="empty-tags">
                  <p class="empty-text">还没有添加标签</p>
                </div>
                
                <div class="add-tag-form">
                  <input 
                    v-model="newTag" 
                    type="text" 
                    class="tag-input"
                    placeholder="添加新标签..."
                    @keyup.enter="addTag"
                  />
                  <button @click="addTag" class="add-tag-btn">➕ 添加</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 来源信息标签页 -->
          <div v-if="activeTab === 'source'" class="source-tab">
            <div class="section-header">
              <h2 class="section-title">📄 来源信息</h2>
              <button @click="goToSource" v-if="vocabulary.source" class="view-source-btn">
                📖 查看原文
              </button>
            </div>

            <div v-if="vocabulary.source" class="source-info">
              <div class="info-item">
                <span class="info-label">来源文档:</span>
                <span class="info-value">{{ vocabulary.source }}</span>
              </div>
              
              <div v-if="vocabulary.sourcePage" class="info-item">
                <span class="info-label">页码:</span>
                <span class="info-value">第 {{ vocabulary.sourcePage }} 页</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">添加时间:</span>
                <span class="info-value">{{ formatDate(vocabulary.createdAt) }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">最后更新:</span>
                <span class="info-value">{{ formatDate(vocabulary.updatedAt) }}</span>
              </div>
            </div>
            <div v-else class="empty-section">
              <div class="empty-icon">📄</div>
              <p class="empty-text">暂无来源信息</p>
            </div>

            <!-- 上下文例句 -->
            <div v-if="vocabulary.example" class="context-section">
              <h3 class="subsection-title">📖 上下文例句</h3>
              <div class="context-example">
                <p class="example-text">{{ vocabulary.example }}</p>
                <div v-if="vocabulary.word" class="highlighted-word">
                  <span class="highlight">{{ vocabulary.word }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <button @click="deleteVocabulary" class="action-btn delete-btn">
          🗑️ 删除单词
        </button>
        <button @click="startReview" class="action-btn review-btn">
          🔄 开始复习
        </button>
        <button @click="addToReviewPlan" class="action-btn add-to-plan-btn">
          📅 加入复习计划
        </button>
        <button @click="shareWord" class="action-btn share-btn">
          📤 分享单词
        </button>
      </div>
    </div>

    <!-- 确认删除模态框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="confirm-modal">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button @click="showDeleteConfirm = false" class="modal-close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="warning-icon">⚠️</div>
          <p class="warning-text">
            确定要删除单词 <strong>"{{ vocabulary.word }}"</strong> 吗？
          </p>
          <p class="warning-subtext">此操作不可撤销，单词将从你的生词本中永久删除。</p>
        </div>
        
        <div class="modal-footer">
          <button @click="showDeleteConfirm = false" class="modal-btn cancel-btn">
            取消
          </button>
          <button @click="confirmDelete" class="modal-btn confirm-delete-btn">
            确认删除
          </button>
        </div>
      </div>
    </div>

    <!-- 分享模态框 -->
    <div v-if="showShareModal" class="modal-overlay">
      <div class="share-modal">
        <div class="modal-header">
          <h3 class="modal-title">分享单词</h3>
          <button @click="showShareModal = false" class="modal-close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="share-preview">
            <div class="preview-header">
              <span class="preview-word">{{ vocabulary.word }}</span>
              <span class="preview-phonetic">{{ vocabulary.phonetic || '' }}</span>
            </div>
            <div class="preview-definition">
              {{ vocabulary.definition || '暂无释义' }}
            </div>
            <div class="preview-source">
              来自: 阅记星(ReadMemo)
            </div>
          </div>
          
          <div class="share-options">
            <button @click="copyShareLink" class="share-option copy-link-btn">
              📋 复制链接
            </button>
            <button @click="shareToSocial('wechat')" class="share-option wechat-btn">
              💬 微信分享
            </button>
            <button @click="shareToSocial('qq')" class="share-option qq-btn">
              💬 QQ分享
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import vocabularyService from '@/services/vocabulary.service'
import { useVocabularyStore } from '@/stores/vocabulary.store'
import { formatDate, truncateText } from '@/utils/formatter'
import { validateRequired, validateLength } from '@/utils/validator'
import { showSuccess, showError, showConfirm } from '@/utils/notify'

const route = useRoute()
const router = useRouter()
const vocabularyStore = useVocabularyStore()

// 响应式数据
const vocabulary = ref({})
const loading = ref(false)
const refreshing = ref(false)
const activeTab = ref('definitions')
const isEditingNotes = ref(false)
const editedNotes = ref('')
const newTag = ref('')
const showDeleteConfirm = ref(false)
const showShareModal = ref(false)

// 标签页配置
const tabs = ref([
  { id: 'definitions', label: '释义', icon: '📖' },
  { id: 'learning', label: '学习', icon: '🎯' },
  { id: 'notes', label: '笔记', icon: '📝' },
  { id: 'source', label: '来源', icon: '📄' }
])

// 状态选项
const statusOptions = ref([
  { value: 'new', label: '新单词', color: '#FFB74D' },
  { value: 'learning', label: '学习中', color: '#4FC3F7' },
  { value: 'reviewing', label: '复习中', color: '#9575CD' },
  { value: 'mastered', label: '已掌握', color: '#81C784' }
])

// 掌握程度选项
const masteryLevels = ref([
  { value: 0, label: '初识' },
  { value: 3, label: '了解' },
  { value: 6, label: '熟悉' },
  { value: 8, label: '掌握' },
  { value: 10, label: '精通' }
])

// 计算属性
const wordId = computed(() => route.params.id || route.query.id)

const availableTags = computed(() => {
  const allTags = vocabularyStore.items.reduce((tags, item) => {
    if (item.tags) {
      tags.push(...item.tags)
    }
    return tags
  }, [])
  
  return [...new Set(allTags)].filter(tag => 
    !vocabulary.value.tags?.includes(tag)
  )
})

// 方法
const loadVocabularyDetail = async () => {
  if (!wordId.value) {
    showError('单词ID不能为空')
    router.back()
    return
  }
  
  loading.value = true
  try {
    const item = await vocabularyService.getVocabularyItem(wordId.value)
    vocabulary.value = item
    editedNotes.value = item.notes || ''
    
    // 更新store中的当前项
    vocabularyStore.setCurrentItem(item)
  } catch (error) {
    showError('加载单词详情失败: ' + error.message)
    router.back()
  } finally {
    loading.value = false
  }
}

const refreshWordData = async () => {
  if (!vocabulary.value.word) return
  
  refreshing.value = true
  try {
    const wordDetail = await vocabularyService.lookupWord(vocabulary.value.word, vocabulary.value.language, {
      forceRefresh: true,
      addToHistory: false
    })
    
    // 合并新数据
    vocabulary.value = {
      ...vocabulary.value,
      ...wordDetail,
      // 保留原有的学习信息
      status: vocabulary.value.status,
      masteryLevel: vocabulary.value.masteryLevel,
      reviewCount: vocabulary.value.reviewCount,
      notes: vocabulary.value.notes,
      tags: vocabulary.value.tags,
      source: vocabulary.value.source,
      sourcePage: vocabulary.value.sourcePage
    }
    
    showSuccess('单词数据已刷新')
  } catch (error) {
    showError('刷新单词数据失败: ' + error.message)
  } finally {
    refreshing.value = false
  }
}

const playAudio = () => {
  if (!vocabulary.value.audioUrl) return
  
  const audio = new Audio(vocabulary.value.audioUrl)
  audio.play().catch(e => {
    console.error('播放音频失败:', e)
    showError('音频播放失败')
  })
}

const updateStatus = async (status) => {
  try {
    await vocabularyService.updateVocabularyItem(wordId.value, { status })
    vocabulary.value.status = status
    showSuccess('学习状态已更新')
  } catch (error) {
    showError('更新状态失败: ' + error.message)
  }
}

const updateMasteryLevel = async (level) => {
  try {
    await vocabularyService.updateVocabularyItem(wordId.value, { masteryLevel: level })
    vocabulary.value.masteryLevel = level
    showSuccess('掌握程度已更新')
  } catch (error) {
    showError('更新掌握程度失败: ' + error.message)
  }
}

const saveNotes = async () => {
  if (!validateRequired(editedNotes.value)) {
    showError('笔记内容不能为空')
    return
  }
  
  if (!validateLength(editedNotes.value, { max: 1000 })) {
    showError('笔记内容不能超过1000字')
    return
  }
  
  try {
    await vocabularyService.updateVocabularyItem(wordId.value, { notes: editedNotes.value })
    vocabulary.value.notes = editedNotes.value
    isEditingNotes.value = false
    showSuccess('笔记已保存')
  } catch (error) {
    showError('保存笔记失败: ' + error.message)
  }
}

const cancelEditNotes = () => {
  editedNotes.value = vocabulary.value.notes || ''
  isEditingNotes.value = false
}

const addTag = async () => {
  if (!newTag.value.trim()) {
    showError('标签内容不能为空')
    return
  }
  
  if (!validateLength(newTag.value, { max: 20 })) {
    showError('标签内容不能超过20字')
    return
  }
  
  const currentTags = vocabulary.value.tags || []
  
  if (currentTags.includes(newTag.value)) {
    showError('标签已存在')
    return
  }
  
  const updatedTags = [...currentTags, newTag.value]
  
  try {
    await vocabularyService.updateVocabularyItem(wordId.value, { tags: updatedTags })
    vocabulary.value.tags = updatedTags
    newTag.value = ''
    showSuccess('标签已添加')
  } catch (error) {
    showError('添加标签失败: ' + error.message)
  }
}

const removeTag = async (tagToRemove) => {
  const currentTags = vocabulary.value.tags || []
  const updatedTags = currentTags.filter(tag => tag !== tagToRemove)
  
  try {
    await vocabularyService.updateVocabularyItem(wordId.value, { tags: updatedTags })
    vocabulary.value.tags = updatedTags
    showSuccess('标签已删除')
  } catch (error) {
    showError('删除标签失败: ' + error.message)
  }
}

const deleteVocabulary = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  try {
    const success = await vocabularyService.deleteVocabularyItem(wordId.value)
    if (success) {
      showSuccess('单词已删除')
      router.push('/vocabulary')
    }
  } catch (error) {
    showError('删除单词失败: ' + error.message)
  } finally {
    showDeleteConfirm.value = false
  }
}

const startReview = () => {
  router.push({
    path: '/review',
    query: { wordId: wordId.value }
  })
}

const addToReviewPlan = async () => {
  try {
    await vocabularyService.updateVocabularyItem(wordId.value, { 
      status: 'reviewing',
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 明天
    })
    
    vocabulary.value.status = 'reviewing'
    showSuccess('已加入复习计划')
  } catch (error) {
    showError('加入复习计划失败: ' + error.message)
  }
}

const shareWord = () => {
  showShareModal.value = true
}

const copyShareLink = () => {
  const shareText = `单词: ${vocabulary.value.word}\n释义: ${vocabulary.value.definition || '暂无'}\n来源: 阅记星(ReadMemo)`
  
  navigator.clipboard.writeText(shareText).then(() => {
    showSuccess('分享链接已复制到剪贴板')
  }).catch(err => {
    console.error('复制失败:', err)
    showError('复制失败')
  })
}

const shareToSocial = (platform) => {
  // 这里可以实现具体的社交分享逻辑
  console.log('分享到:', platform)
  showSuccess('分享功能开发中...')
}

const goToSource = () => {
  if (vocabulary.value.source) {
    router.push({
      path: '/reader',
      query: { documentId: vocabulary.value.source }
    })
  }
}

const lookupWord = (word) => {
  router.push({
    path: '/vocabulary/detail',
    query: { word }
  })
}

const goBack = () => {
  router.back()
}

const getStatusLabel = (status) => {
  const option = statusOptions.value.find(opt => opt.value === status)
  return option ? option.label : status
}

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

// 监听器
watch(wordId, (newId) => {
  if (newId) {
    loadVocabularyDetail()
  }
})

// 生命周期
onMounted(() => {
  loadVocabularyDetail()
})
</script>

<style scoped>
.vocabulary-detail-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  padding: 20px;
  position: relative;
  overflow-x: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}

.bubble {
  position: absolute;
  font-size: 2rem;
  opacity: 0.1;
  animation: floatBubble 20s ease-in-out infinite;
}

.bubble-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.bubble-2 {
  top: 30%;
  right: 15%;
  animation-delay: 5s;
}

.bubble-3 {
  bottom: 20%;
  left: 20%;
  animation-delay: 10s;
}

.bubble-4 {
  bottom: 40%;
  right: 10%;
  animation-delay: 15s;
}

@keyframes floatBubble {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.1); }
}

/* 返回按钮 */
.back-button {
  position: relative;
  z-index: 10;
  padding: 12px 25px;
  background: white;
  border: 3px solid #667eea;
  border-radius: 25px;
  font-family: 'Comfortaa', cursive;
  font-size: 1rem;
  font-weight: bold;
  color: #667eea;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  margin-bottom: 20px;
}

.back-button:hover {
  background: #667eea;
  color: white;
  transform: translateX(-5px);
}

.back-icon {
  font-size: 1.2rem;
}

/* 主容器 */
.detail-container {
  position: relative;
  z-index: 1;
  background: white;
  border-radius: 35px;
  padding: 30px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 0 auto;
}

/* 单词头部 */
.word-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.word-title {
  flex: 1;
  min-width: 300px;
}

.word-text {
  font-family: 'Kalam', cursive;
  font-size: 3.5rem;
  color: #5D4037;
  margin: 0 0 10px 0;
  line-height: 1.2;
}

.word-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.phonetic {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.3rem;
  color: #666;
  font-style: italic;
  background: #F5F5F5;
  padding: 5px 15px;
  border-radius: 20px;
}

.audio-button {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.audio-button.has-audio:hover {
  background: #E3F2FD;
  transform: scale(1.1);
}

.audio-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 状态标签 */
.status-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-badge,
.difficulty-badge,
.pos-badge {
  padding: 8px 20px;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-badge {
  border: 2px solid;
}

.status-new {
  background: #FFE0B2;
  color: #E65100;
  border-color: #FFB74D;
}

.status-learning {
  background: #E1F5FE;
  color: #0277BD;
  border-color: #4FC3F7;
}

.status-reviewing {
  background: #F3E5F5;
  color: #4527A0;
  border-color: #9575CD;
}

.status-mastered {
  background: #E8F5E9;
  color: #2E7D32;
  border-color: #81C784;
}

.difficulty-easy {
  background: #E8F5E9;
  color: #2E7D32;
  border: 2px solid #81C784;
}

.difficulty-medium {
  background: #FFF3E0;
  color: #EF6C00;
  border: 2px solid #FFB74D;
}

.difficulty-hard {
  background: #FFEBEE;
  color: #C62828;
  border: 2px solid #EF9A9A;
}

.pos-badge {
  background: #E3F2FD;
  color: #1976D2;
  border: 2px solid #90CAF9;
}

/* 标签页容器 */
.tab-container {
  margin-bottom: 30px;
}

.tab-header {
  display: flex;
  gap: 5px;
  margin-bottom: 25px;
  border-bottom: 3px solid #F0F0F0;
  padding-bottom: 5px;
  overflow-x: auto;
}

.tab-button {
  padding: 15px 30px;
  background: none;
  border: none;
  border-radius: 25px 25px 0 0;
  font-family: 'Comfortaa', cursive;
  font-size: 1.1rem;
  font-weight: bold;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-button:hover {
  background: #F5F5F5;
  color: #333;
}

.tab-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-content {
  min-height: 400px;
}

/* 通用样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.section-title {
  font-family: 'Comfortaa', cursive;
  font-size: 1.8rem;
  color: #5D4037;
  margin: 0;
}

.subsection-title {
  font-family: 'Comfortaa', cursive;
  font-size: 1.4rem;
  color: #795548;
  margin: 0 0 15px 0;
}

.empty-section {
  text-align: center;
  padding: 40px 20px;
  background: #F9F9F9;
  border-radius: 25px;
  border: 2px dashed #E0E0E0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  color: #888;
  margin: 0;
}

/* 释义标签页 */
.refresh-button {
  padding: 10px 25px;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.definitions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.definition-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: #F9F9F9;
  border-radius: 25px;
  border-left: 8px solid #667eea;
  transition: transform 0.3s ease;
}

.definition-item:hover {
  transform: translateX(5px);
}

.definition-number {
  font-family: 'Comfortaa', cursive;
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.definition-content {
  flex: 1;
}

.definition-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.2rem;
  color: #333;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.example-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  color: #666;
  font-style: italic;
  padding: 10px 15px;
  background: white;
  border-radius: 15px;
  border-left: 4px solid #81C784;
}

/* 单词关系 */
.word-relations {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.relation-group {
  background: #F5F5F5;
  border-radius: 25px;
  padding: 20px;
}

.relation-title {
  font-family: 'Comfortaa', cursive;
  font-size: 1.3rem;
  color: #5D4037;
  margin: 0 0 15px 0;
}

.relation-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.relation-tag {
  padding: 8px 18px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.synonym-tag {
  background: #E8F5E9;
  color: #2E7D32;
  border: 2px solid #81C784;
}

.synonym-tag:hover {
  background: #C8E6C9;
  transform: scale(1.05);
}

.antonym-tag {
  background: #FFEBEE;
  color: #C62828;
  border: 2px solid #EF9A9A;
}

.antonym-tag:hover {
  background: #FFCDD2;
  transform: scale(1.05);
}

/* 学习标签页 */
.review-button {
  padding: 10px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.review-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.mastery-section,
.status-section,
.stats-section {
  margin-bottom: 30px;
  padding: 25px;
  background: #F9F9F9;
  border-radius: 25px;
}

.mastery-display {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.mastery-bar {
  flex: 1;
  height: 20px;
  background: #E0E0E0;
  border-radius: 10px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.mastery-percentage {
  font-family: 'Comfortaa', cursive;
  font-size: 1.8rem;
  font-weight: bold;
  color: #4CAF50;
  min-width: 80px;
}

.mastery-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.mastery-level-btn {
  padding: 10px 20px;
  background: white;
  border: 2px solid #E0E0E0;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mastery-level-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.mastery-level-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: scale(1.05);
}

.status-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-option-btn {
  padding: 12px 25px;
  border: 2px solid transparent;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-option-btn:hover {
  transform: scale(1.05);
}

.status-option-btn.active {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  background: white;
  border-radius: 20px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
}

.stat-value {
  font-family: 'Comfortaa', cursive;
  font-size: 1.5rem;
  font-weight: bold;
  color: #5D4037;
  margin-bottom: 8px;
}

.stat-label {
  font-family: 'Quicksand', sans-serif;
  font-size: 0.9rem;
  color: #666;
}

/* 笔记标签页 */
.edit-notes-button {
  padding: 10px 25px;
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.edit-notes-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.notes-editor {
  background: #FFF8E1;
  border-radius: 25px;
  padding: 25px;
  margin-bottom: 30px;
  border: 3px dashed #FFB74D;
}

.notes-textarea {
  width: 100%;
  padding: 20px;
  border: 2px solid #FFE0B2;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.3s ease;
}

.notes-textarea:focus {
  border-color: #FF9800;
}

.editor-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.save-notes-btn,
.cancel-notes-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-notes-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.save-notes-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.cancel-notes-btn {
  background: #F5F5F5;
  color: #666;
  border: 2px solid #E0E0E0;
}

.cancel-notes-btn:hover {
  background: #E0E0E0;
}

.notes-display {
  background: #F9F9F9;
  border-radius: 25px;
  padding: 30px;
  margin-bottom: 30px;
  min-height: 200px;
}

.notes-content {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}

.empty-notes {
  text-align: center;
  padding: 40px 20px;
}

.add-notes-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.add-notes-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 标签管理 */
.tags-section {
  background: #F5F5F5;
  border-radius: 25px;
  padding: 25px;
}

.tags-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tags-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 18px;
  border-radius: 20px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.tag-item:hover {
  transform: scale(1.05);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.empty-tags {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 20px;
  border: 2px dashed #E0E0E0;
}

.add-tag-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tag-input {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #E0E0E0;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.tag-input:focus {
  border-color: #667eea;
}

.add-tag-btn {
  padding: 12px 25px;
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-tag-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 来源标签页 */
.view-source-btn {
  padding: 10px 25px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-source-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.source-info {
  background: #E3F2FD;
  border-radius: 25px;
  padding: 25px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #BBDEFB;
}

.info-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-label {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #1976D2;
  min-width: 100px;
}

.info-value {
  font-family: 'Quicksand', sans-serif;
  color: #333;
}

.context-section {
  background: #F9F9F9;
  border-radius: 25px;
  padding: 25px;
}

.context-example {
  background: white;
  border-radius: 20px;
  padding: 20px;
  border-left: 8px solid #81C784;
}

.example-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 15px;
}

.highlighted-word {
  display: inline-block;
  padding: 5px 15px;
  background: #E8F5E9;
  border-radius: 15px;
  border: 2px solid #81C784;
}

.highlight {
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  color: #2E7D32;
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  padding-top: 25px;
  border-top: 3px solid #F0F0F0;
}

.action-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 30px;
  font-family: 'Comfortaa', cursive;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.delete-btn {
  background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
  color: white;
}

.review-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-to-plan-btn {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

.share-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-modal,
.share-modal {
  background: white;
  border-radius: 35px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  animation: modalSlideUp 0.4s ease;
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 3px solid #F0F0F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-family: 'Comfortaa', cursive;
  font-size: 1.8rem;
  color: #5D4037;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 2.5rem;
  color: #999;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: #F5F5F5;
  color: #666;
}

.modal-content {
  padding: 30px;
}

.warning-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 20px;
}

.warning-text {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.2rem;
  color: #333;
  text-align: center;
  margin-bottom: 10px;
}

.warning-subtext {
  font-family: 'Quicksand', sans-serif;
  font-size: 1rem;
  color: #666;
  text-align: center;
}

.modal-footer {
  padding: 25px 30px;
  border-top: 3px solid #F0F0F0;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn:hover {
  transform: translateY(-2px);
}

.cancel-btn {
  background: #F5F5F5;
  color: #666;
  border: 2px solid #E0E0E0;
}

.cancel-btn:hover {
  background: #E0E0E0;
}

.confirm-delete-btn {
  background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
  color: white;
}

.confirm-delete-btn:hover {
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 分享模态框 */
.share-preview {
  background: #F9F9F9;
  border-radius: 25px;
  padding: 25px;
  margin-bottom: 25px;
  border: 2px solid #E0E0E0;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.preview-word {
  font-family: 'Kalam', cursive;
  font-size: 2rem;
  color: #5D4037;
}

.preview-phonetic {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.2rem;
  color: #666;
  font-style: italic;
}

.preview-definition {
  font-family: 'Quicksand', sans-serif;
  font-size: 1.1rem;
  color: #333;
  line-height: 1.6;
  margin-bottom: 15px;
}

.preview-source {
  font-family: 'Quicksand', sans-serif;
  font-size: 0.9rem;
  color: #888;
  text-align: right;
}

.share-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.share-option {
  flex: 1;
  min-width: 150px;
  padding: 15px 25px;
  border: none;
  border-radius: 25px;
  font-family: 'Comfortaa', cursive;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.share-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.copy-link-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
}

.wechat-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.qq-btn {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-container {
    padding: 20px;
  }
  
  .word-text {
    font-size: 2.5rem;
  }
  
  .tab-header {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .action-bar {
    justify-content: center;
  }
  
  .action-btn {
    flex: 1;
    min-width: 150px;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .vocabulary-detail-view {
    padding: 10px;
  }
  
  .word-header-section {
    flex-direction: column;
  }
  
  .word-title {
    min-width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .modal-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  .share-option {
    min-width: 120px;
  }
}
</style>