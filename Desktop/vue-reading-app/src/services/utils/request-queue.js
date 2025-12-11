// src/utils/request-queue.js

class RequestQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.activeRequests = 0;
    this.requestId = 0;
  }

  /**
   * 添加请求到队列
   * @param {Function} requestFn - 请求函数
   * @param {Object} [options] - 选项
   * @param {number} [options.priority=0] - 优先级（数字越大优先级越高）
   * @param {number} [options.retryCount=0] - 重试次数
   * @param {number} [options.timeout=30000] - 超时时间（毫秒）
   * @returns {Promise} 请求结果
   */
  add(requestFn, options = {}) {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      
      const request = {
        id: requestId,
        fn: requestFn,
        resolve,
        reject,
        priority: options.priority || 0,
        retryCount: options.retryCount || 0,
        maxRetries: options.maxRetries || 0,
        timeout: options.timeout || 30000,
        attempts: 0
      };
      
      // 按优先级插入队列
      this._insertByPriority(request);
      
      // 尝试执行下一个请求
      this._processNext();
    });
  }

  /**
   * 按优先级插入请求
   * @param {Object} request - 请求对象
   * @private
   */
  _insertByPriority(request) {
    let inserted = false;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (request.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, request);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.queue.push(request);
    }
  }

  /**
   * 处理下一个请求
   * @private
   */
  _processNext() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    // 获取下一个请求
    const request = this.queue.shift();
    this.activeRequests++;
    
    // 执行请求
    this._executeRequest(request);
  }

  /**
   * 执行请求
   * @param {Object} request - 请求对象
   * @private
   */
  async _executeRequest(request) {
    request.attempts++;
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`请求超时 (${request.timeout}ms)`));
      }, request.timeout);
    });
    
    try {
      // 执行请求函数
      const result = await Promise.race([
        request.fn(),
        timeoutPromise
      ]);
      
      // 请求成功
      request.resolve(result);
    } catch (error) {
      // 检查是否需要重试
      if (request.attempts <= request.maxRetries) {
        console.log(`请求 ${request.id} 失败，正在重试 (${request.attempts}/${request.maxRetries})`, error);
        
        // 延迟后重新加入队列
        setTimeout(() => {
          this._insertByPriority(request);
          this.activeRequests--;
          this._processNext();
        }, 1000 * request.attempts); // 指数退避
      } else {
        // 重试次数用尽
        console.error(`请求 ${request.id} 失败，重试次数用尽`, error);
        request.reject(error);
        this.activeRequests--;
        this._processNext();
      }
      return;
    }
    
    // 请求完成，处理下一个
    this.activeRequests--;
    this._processNext();
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = [];
    console.log('请求队列已清空');
  }

  /**
   * 取消指定请求
   * @param {number} requestId - 请求ID
   * @returns {boolean} 是否取消成功
   */
  cancel(requestId) {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const request = this.queue[index];
      request.reject(new Error('请求被取消'));
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }
}

// 创建单例实例
const requestQueue = new RequestQueue();

// 导出实例
export { requestQueue };