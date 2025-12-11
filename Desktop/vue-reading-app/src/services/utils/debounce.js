// src/utils/debounce.js

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} [immediate=false] - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait, immediate = false) {
  let timeout = null;
  let result;
  
  const debounced = function(...args) {
    const context = this;
    
    // 清除之前的定时器
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // 立即执行
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      
      if (callNow) {
        result = func.apply(context, args);
      }
    } else {
      // 延迟执行
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    }
    
    return result;
  };
  
  // 取消防抖
  debounced.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} [options] - 选项
 * @param {boolean} [options.leading=true] - 是否在开始时执行
 * @param {boolean} [options.trailing=true] - 是否在结束时执行
 * @returns {Function} 节流后的函数
 */
export function throttle(func, wait, options = {}) {
  let timeout = null;
  let previous = 0;
  let result;
  
  const { leading = true, trailing = true } = options;
  
  const throttled = function(...args) {
    const context = this;
    const now = Date.now();
    
    // 如果不是第一次执行且leading为false
    if (!previous && !leading) {
      previous = now;
    }
    
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      // 清除之前的定时器
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      previous = now;
      result = func.apply(context, args);
    } else if (!timeout && trailing) {
      // 设置定时器，在剩余时间后执行
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
    
    return result;
  };
  
  // 取消节流
  throttled.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    previous = 0;
  };
  
  return throttled;
}

/**
 * 防抖装饰器（用于类方法）
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} [immediate=false] - 是否立即执行
 * @returns {Function} 装饰器函数
 */
export function debounceDecorator(wait, immediate = false) {
  return function(target, name, descriptor) {
    const original = descriptor.value;
    
    descriptor.value = debounce(original, wait, immediate);
    
    return descriptor;
  };
}

/**
 * 节流装饰器（用于类方法）
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} [options] - 选项
 * @returns {Function} 装饰器函数
 */
export function throttleDecorator(wait, options = {}) {
  return function(target, name, descriptor) {
    const original = descriptor.value;
    
    descriptor.value = throttle(original, wait, options);
    
    return descriptor;
  };
}