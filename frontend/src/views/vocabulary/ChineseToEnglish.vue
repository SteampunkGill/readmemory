<template>
  <div class="quiz-container">
    <div class="quiz-header">
      <button class="back-btn" @click="$router.push('/vocabulary')">
        <span class="icon">←</span> 返回
      </button>
      <h2>看义选英</h2>
      <div v-if="!loading && quizList.length > 0" class="progress">
        进度: {{ currentIndex + 1 }} / {{ quizList.length }}
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="quiz-card loading-state">
      <div class="loader">正在加载复习计划...</div>
    </div>

    <!-- 测验卡片 -->
    <div v-else-if="currentQuestion && !quizFinished" class="quiz-card">
      <div class="definition-display">
        <p class="label">中文释义</p>
        <h1>{{ currentQuestion.definition }}</h1>
      </div>

      <div class="options-grid">
        <button 
          v-for="(option, index) in currentQuestion.options" 
          :key="index"
          class="option-btn"
          :class="getOptionClass(option)"
          @click="handleAnswer(option)"
          :disabled="answered"
        >
          <span class="option-label">{{ String.fromCharCode(65 + index) }}</span>
          <div class="word-info">
            <span class="word">{{ option.word }}</span>
            <span class="phonetic" v-if="answered">{{ option.phonetic }}</span>
          </div>
        </button>
      </div>

      <div v-if="answered" class="feedback-area">
        <p v-if="isCorrect" class="correct-msg">回答正确！</p>
        <div v-else class="incorrect-msg">
          <p>回答错误</p>
          <p class="correct-answer">正确答案：{{ currentQuestion.correctAnswer.word }}</p>
        </div>
        
        <!-- 原文例句与来源展示 -->
        <div class="word-context-info" v-if="currentQuestion.example">
          <div class="context-label">原文例句：</div>
          <p class="context-text">{{ currentQuestion.example }}</p>
          <div class="context-source" v-if="currentQuestion.source">
            —— 摘自《{{ currentQuestion.source }}》
          </div>
        </div>

        <button class="next-btn" @click="nextQuestion">
          {{ isLastQuestion ? '查看结果' : '下一题' }}
        </button>
      </div>
    </div>

    <!-- 结果卡片 -->
    <div v-else-if="quizFinished" class="result-card">
      <h2>练习完成！</h2>
      <div class="score-display">
        <span class="score">{{ score }}</span>
        <span class="total">/ {{ quizList.length }}</span>
      </div>
      <p>正确率: {{ Math.round((score / quizList.length) * 100) }}%</p>
      <button class="retry-btn" @click="resetQuiz">再练一次</button>
      <button class="home-btn" @click="$router.push('/vocabulary')">返回首页</button>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="quiz-card">
      <p>暂无待复习单词，去学习新词吧！</p>
      <button class="home-btn" @click="$router.push('/vocabulary')">返回首页</button>
    </div>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/config';
import { auth } from '@/utils/auth';

export default {
  name: 'ChineseToEnglish',
  data() {
    return {
      currentIndex: 0,
      score: 0,
      answered: false,
      selectedOption: null,
      isCorrect: false,
      quizFinished: false,
      quizList: [],
      loading: false
    };
  },
  computed: {
    currentQuestion() {
      return this.quizList[this.currentIndex];
    },
    isLastQuestion() {
      return this.currentIndex === this.quizList.length - 1;
    }
  },
  methods: {
    // 从后端获取数据
    async fetchQuizData() {
      this.loading = true;
      const token = auth.getToken();
      const { mode, date } = this.$route.query;
      
      let url = `${API_BASE_URL}/review/due-words?limit=10&mode=${mode || 'spaced'}`;
      if (date) url += `&date=${date}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('网络请求失败');
        
        const result = await response.json();
        
        if (result.success && result.data.words && result.data.words.length > 0) {
          this.processQuizData(result.data.words, result.data.distractorPool || []);
        } else {
          this.quizList = [];
        }
      } catch (error) {
        console.error('获取后端数据失败:', error);
        this.quizList = [];
      } finally {
        this.loading = false;
      }
    },

    // 处理原始单词列表，生成题目和干扰项
    processQuizData(words, distractorPool) {
      // 模拟干扰项，用于词库不足时的兜底
      const mockDistractors = [
        { id: -201, word: 'achieve', definition: '达到；完成', phonetic: '/əˈtʃiːv/' },
        { id: -202, word: 'believe', definition: '相信；认为', phonetic: '/bɪˈliːv/' },
        { id: -203, word: 'consider', definition: '考虑；认为', phonetic: '/kənˈsɪdə/' },
        { id: -204, word: 'discover', definition: '发现；发觉', phonetic: '/dɪˈskʌvə/' },
        { id: -205, word: 'establish', definition: '建立；确立', phonetic: '/ɪˈstæblɪʃ/' },
        { id: -206, word: 'improve', definition: '改善；提高', phonetic: '/ɪmˈpruːv/' },
        { id: -207, word: 'maintain', definition: '维持；保养', phonetic: '/meɪnˈteɪn/' },
        { id: -208, word: 'provide', definition: '提供；规定', phonetic: '/prəˈvaɪd/' },
        { id: -209, word: 'require', definition: '需要；要求', phonetic: '/rɪˈkwaɪə/' },
        { id: -210, word: 'suggest', definition: '建议；暗示', phonetic: '/səˈdʒest/' },
        { id: -211, word: 'understand', definition: '理解；明白', phonetic: '/ˌʌndəˈstænd/' },
        { id: -212, word: 'prepare', definition: '准备；预备', phonetic: '/prɪˈpeə/' }
      ];

      // 检查是否包含中文字符的辅助正则
      const hasChinese = /[\u4e00-\u9fa5]/;

      // 过滤掉没有中文定义的单词，确保题目符合“看义选英”
      const validWords = words.filter(w => w.definition && hasChinese.test(w.definition));
      const shuffled = [...validWords].sort(() => 0.5 - Math.random());
      
      this.quizList = shuffled.map(word => {
        // 1. 优先从后端提供的真实干扰项池中选择（确保是英文单词）
        let distractors = [];
        if (distractorPool && distractorPool.length > 0) {
          distractors = distractorPool
            .filter(d => d.word !== word.word && d.word && d.word.trim() !== '')
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        }
        
        // 2. 如果干扰项不足，从当前复习单词列表中补充
        if (distractors.length < 3) {
          const additional = words
            .filter(w => w.id !== word.id && !distractors.find(d => d.id === w.id) && w.word)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3 - distractors.length);
          distractors = [...distractors, ...additional];
        }

        // 3. 如果仍然不足 3 个，使用模拟干扰项兜底
        if (distractors.length < 3) {
          const mocks = mockDistractors
            .filter(m => m.word !== word.word && !distractors.find(d => d.word === m.word))
            .sort(() => 0.5 - Math.random())
            .slice(0, 3 - distractors.length);
          distractors = [...distractors, ...mocks];
        }
          
        const options = [...distractors, word].sort(() => 0.5 - Math.random());
        
        return {
          ...word,
          options,
          correctAnswer: word
        };
      });
    },

    handleAnswer(option) {
      this.answered = true;
      this.selectedOption = option;
      this.isCorrect = option.id === this.currentQuestion.id;
      if (this.isCorrect) {
        this.score++;
      }
    },

    getOptionClass(option) {
      if (!this.answered) return '';
      if (option.id === this.currentQuestion.id) return 'correct';
      if (this.selectedOption && option.id === this.selectedOption.id) return 'incorrect';
      return '';
    },

    nextQuestion() {
      if (this.isLastQuestion) {
        this.quizFinished = true;
      } else {
        this.currentIndex++;
        this.answered = false;
        this.selectedOption = null;
      }
    },

    resetQuiz() {
      this.currentIndex = 0;
      this.score = 0;
      this.answered = false;
      this.quizFinished = false;
      this.fetchQuizData();
    }
  },
  created() {
    this.fetchQuizData();
  }
};
</script>

<style scoped>
/* --- 主体布局 --- */
.quiz-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

/* --- 头部 --- */
.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.back-btn {
  background-color: var(--surface-color);
  border: 2px solid var(--primary-dark);
  color: var(--primary-dark);
  padding: 8px 16px;
  border-radius: var(--border-radius-lg);
  font-weight: bold;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  font-family: var(--font-body);
}

.back-btn:hover {
  background-color: var(--primary-color);
  color: #f1f2f6;
  transform: translateY(-2px);
}

.back-btn .icon {
  margin-right: 8px;
}

.quiz-header h2 {
  font-size: 2rem;
  color: var(--primary-dark);
  margin: 0;
}

.progress {
  font-size: 1.1rem;
  color: var(--text-color-medium);
  font-family: var(--font-body);
}

/* --- 测验卡片 --- */
.quiz-card {
  background: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-medium);
  text-align: center;
  border: 4px solid var(--accent-pink);
}

.definition-display .label {
  color: var(--text-color-light);
  font-size: 1.2rem;
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-body);
}

.definition-display h1 {
  font-size: 3rem;
  margin-bottom: var(--spacing-xl);
  color: var(--text-color-dark);
  line-height: 1.4;
  font-family: var(--font-title);
}

/* --- 选项网格 --- */
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.option-btn {
  background: var(--surface-color);
  border: 3px solid var(--border-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  text-align: left;
  transition: var(--transition-smooth), transform 0.2s var(--transition-bounce);
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-body);
}

.option-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background-color: rgba(135, 206, 235, 0.1);
  transform: translateY(-4px) scale(1.02);
}

.option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.option-label {
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: 50%;
  font-weight: bold;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.word-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.word {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color-dark);
}

.phonetic {
  font-size: 1rem;
  color: var(--text-color-medium);
  margin-top: 4px;
}

/* --- 反馈样式 --- */
.option-btn.correct {
  background: var(--accent-green);
  border-color: #76c776;
}
.option-btn.correct .option-label {
  background: #5cb85c;
  color: #f1f2f6;
}

.option-btn.incorrect {
  background: var(--accent-pink);
  border-color: #ff9aa8;
}
.option-btn.incorrect .option-label {
  background: #d9534f;
  color: #f1f2f6;
}

.feedback-area {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 3px dashed var(--border-color);
}

.correct-msg {
  color: #2ecc71;
  font-weight: bold;
  font-size: 1.8rem;
  font-family: var(--font-title);
  margin-bottom: var(--spacing-md);
}

.incorrect-msg {
  margin-bottom: var(--spacing-md);
}

.incorrect-msg p {
  font-size: 1.5rem;
  color: #e74c3c;
  font-family: var(--font-title);
  margin-bottom: 4px;
}

.correct-answer {
  font-weight: bold;
  color: #2ecc71;
  font-size: 1.2rem;
}

/* --- 原文上下文样式 --- */
.word-context-info {
  background: rgba(252, 248, 232, 0.5);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin: var(--spacing-lg) 0;
  text-align: left;
  border-left: 5px solid var(--accent-yellow);
}

.context-label {
  font-weight: bold;
  color: var(--primary-dark);
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.context-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-color-dark);
  margin-bottom: 8px;
}

.context-source {
  text-align: right;
  font-size: 0.9rem;
  color: var(--text-color-medium);
  font-style: italic;
}

/* --- 按钮样式 --- */
.next-btn, .retry-btn, .home-btn {
  padding: 14px 32px;
  border-radius: var(--border-radius-xl);
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  transition: var(--transition-smooth);
  border: none;
  box-shadow: var(--shadow-soft);
}

.next-btn {
  background: var(--primary-color);
  color: var(--text-color-dark);
}
.next-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-3px);
}

.retry-btn {
  background: var(--accent-green);
  color: var(--text-color-dark);
  margin-right: var(--spacing-md);
}

.home-btn {
  background: var(--accent-yellow);
  color: var(--text-color-dark);
}

/* --- 结果卡片 --- */
.result-card {
  background: var(--surface-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  text-align: center;
  box-shadow: var(--shadow-medium);
  border: 4px solid var(--accent-green);
}

.result-card h2 {
  font-size: 3rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-md);
}

.score-display {
  font-size: 6rem;
  margin: var(--spacing-md) 0;
  line-height: 1;
}

.score {
  color: var(--primary-color);
  font-weight: bold;
  font-family: var(--font-title);
}
.total {
  color: var(--text-color-light);
  font-size: 0.5em;
}

.result-card p {
  font-size: 1.5rem;
  color: var(--text-color-medium);
  margin-bottom: var(--spacing-xl);
}

/* --- 响应式设计 --- */
@media (max-width: 768px) {
  .quiz-container {
    margin: var(--spacing-sm) var(--spacing-sm);
    padding: var(--spacing-md);
  }
  .quiz-header h2 {
    font-size: 1.8em;
  }
  .definition-display h1 {
    font-size: 2em;
  }
}

@media (max-width: 480px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
  .quiz-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  .quiz-header h2 {
    margin-top: var(--spacing-sm);
  }
  .quiz-card, .result-card {
    padding: var(--spacing-lg);
  }
  .score-display {
    font-size: 4em;
  }
}
</style>