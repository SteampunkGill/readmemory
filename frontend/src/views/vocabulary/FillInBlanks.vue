<template>
  <div class="quiz-container">
    <div class="quiz-header">
      <button class="back-btn" @click="$router.push('/vocabulary')">
        <span class="icon">←</span> 返回
      </button>
      <h2>选词填空</h2>
      <div v-if="!loading && quizList.length > 0" class="progress">
        进度: {{ currentIndex + 1 }} / {{ quizList.length }}
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="quiz-card">
      <div class="sentence-display">
        <p class="label">正在加载您的复习计划...</p>
        <div class="sentence">Loading...</div>
      </div>
    </div>

    <!-- 测验卡片 -->
    <div v-else-if="currentQuestion && !quizFinished" class="quiz-card">
      <div class="sentence-display">
        <p class="label">请选择合适的单词填入空格</p>
        <div class="sentence">
          <template v-for="(part, index) in sentenceParts" :key="index">
            <span>{{ part }}</span>
            <span v-if="index < sentenceParts.length - 1" class="blank" :class="{ filled: answered }">
              {{ answered ? currentQuestion.word : '_______' }}
            </span>
          </template>
        </div>
        <!-- 优先显示后端返回的翻译，若无则显示释义 -->
        <p class="translation">{{ currentQuestion.translation || currentQuestion.definition }}</p>
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
          {{ option.word }}
        </button>
      </div>

      <div v-if="answered" class="feedback-area">
        <p v-if="isCorrect" class="correct-msg">太棒了！回答正确</p>
        <div v-else class="incorrect-msg">
          <p>可惜答错了</p>
          <p class="correct-answer">正确单词：{{ currentQuestion.word }}</p>
        </div>
        <div class="word-detail">
          <p><strong>{{ currentQuestion.word }}</strong> <span class="phonetic">{{ currentQuestion.phonetic }}</span></p>
          <p>{{ currentQuestion.definition }}</p>
          <p v-if="currentQuestion.source" class="source-info">—— 摘自《{{ currentQuestion.source }}》</p>
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
      <div class="sentence-display">
        <div class="sentence">当前没有待复习的单词</div>
      </div>
      <button class="home-btn" @click="$router.push('/vocabulary')">返回首页</button>
    </div>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/config';
import { auth } from '@/utils/auth';

export default {
  name: 'FillInBlanks',
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
    sentenceParts() {
      if (!this.currentQuestion || !this.currentQuestion.sentence) return [];
      return this.currentQuestion.sentence.split('_______');
    },
    isLastQuestion() {
      return this.currentIndex === this.quizList.length - 1;
    }
  },
  methods: {
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

        if (!response.ok) throw new Error('API Request Failed');

        const result = await response.json();

        if (result.success && result.data.words && result.data.words.length > 0) {
          this.processQuizData(result.data.words, result.data.distractorPool || []);
        } else {
          this.quizList = [];
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        this.quizList = [];
      } finally {
        this.loading = false;
      }
    },

    processQuizData(words, distractorPool) {
      // 模拟干扰项，用于词库不足时的兜底
      const mockDistractors = [
        { id: -301, word: 'strategy', definition: '策略；战略', phonetic: '/ˈstrætədʒi/' },
        { id: -302, word: 'resource', definition: '资源；财力', phonetic: '/rɪˈsɔːs/' },
        { id: -303, word: 'quality', definition: '质量；品质', phonetic: '/ˈkwɒləti/' },
        { id: -304, word: 'performance', definition: '性能；表演', phonetic: '/pəˈfɔːməns/' },
        { id: -305, word: 'management', definition: '管理；经营', phonetic: '/ˈmænɪdʒmənt/' },
        { id: -306, word: 'investment', definition: '投资；投入', phonetic: '/ɪnˈvestmənt/' },
        { id: -307, word: 'environment', definition: '环境；外界', phonetic: '/ɪnˈvaɪrənmənt/' },
        { id: -308, word: 'community', definition: '社区；团体', phonetic: '/kəˈmjuːnəti/' },
        { id: -309, word: 'analysis', definition: '分析；解析', phonetic: '/əˈnæləsɪs/' },
        { id: -310, word: 'benefit', definition: '利益；好处', phonetic: '/ˈbenɪfɪt/' },
        { id: -311, word: 'category', definition: '类别；范畴', phonetic: '/ˈkætəɡəri/' },
        { id: -312, word: 'delivery', definition: '交付；递送', phonetic: '/dɪˈlɪvəri/' }
      ];

      // 过滤掉没有例句的单词，确保题目符合“选词填空”
      const validWords = words.filter(w => w.sentence || w.example);
      const shuffledWords = [...validWords].sort(() => 0.5 - Math.random());
      
      this.quizList = shuffledWords.map(word => {
        // 处理句子：后端可能返回 example 字段，如果没有占位符则动态替换
        let sentence = word.sentence || word.example || "";
        if (sentence && !sentence.includes('_______')) {
          const regex = new RegExp(word.word, 'gi');
          sentence = sentence.replace(regex, '_______');
        }

        // 1. 优先从后端提供的真实干扰项池中选择
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
          sentence,
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
  color: white;
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
  border: 4px solid var(--accent-green);
}

/* --- 句子显示区域 --- */
.sentence-display {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.sentence-display .label {
  color: var(--text-color-light);
  font-size: 1.2rem;
  margin-bottom: var(--spacing-md);
  font-family: var(--font-body);
}

.sentence {
  font-family: var(--font-body);
  font-size: 2rem;
  line-height: 1.6;
  color: var(--text-color-dark);
  margin-bottom: var(--spacing-md);
  display: inline-block;
}

.blank {
  color: var(--primary-color);
  font-weight: bold;
  font-family: var(--font-title);
  border-bottom: 4px dashed var(--primary-light);
  padding: 0 12px;
  margin: 0 8px;
  transition: var(--transition-smooth);
  display: inline-block;
  min-width: 100px;
}

.blank.filled {
  color: #2ecc71;
  border-bottom-style: solid;
  border-bottom-color: #2ecc71;
  background: rgba(46, 204, 113, 0.1);
  border-radius: var(--border-radius-md);
}

.translation {
  color: var(--text-color-medium);
  font-style: italic;
  font-size: 1.2rem;
  font-family: var(--font-body);
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
  font-size: 1.4rem;
  color: var(--text-color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-smooth), transform 0.2s var(--transition-bounce);
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

/* --- 反馈样式 --- */
.option-btn.correct {
  background: var(--accent-green);
  border-color: #76c776;
}

.option-btn.incorrect {
  background: var(--accent-pink);
  border-color: #ff9aa8;
}

.feedback-area {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 3px dashed var(--border-color);
  text-align: center;
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

.word-detail {
  background: rgba(252, 248, 232, 0.5);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  margin: var(--spacing-lg) 0;
  text-align: left;
  font-family: var(--font-body);
  border: 2px solid var(--primary-light);
}

.word-detail strong {
  font-size: 1.8rem;
  color: var(--primary-dark);
  font-family: var(--font-title);
}

.word-detail .phonetic {
  color: var(--text-color-medium);
  font-size: 1.1rem;
  margin-left: 8px;
}

.source-info {
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--text-color-medium);
  font-style: italic;
  text-align: right;
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
  border: 4px solid var(--primary-color);
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
  .sentence {
    font-size: 1.5em;
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