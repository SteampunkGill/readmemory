// src/utils/validator.js
/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @param {Object} options - 选项
 * @returns {Object} 验证结果
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 6,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options;
  
  const result = {
    isValid: true,
    errors: [],
    score: 0
  };
  
  if (!password) {
    result.isValid = false;
    result.errors.push('密码不能为空');
    return result;
  }
  
  // 长度检查
  if (password.length < minLength) {
    result.isValid = false;
    result.errors.push(`密码长度至少为 ${minLength} 位`);
  } else {
    result.score += 20;
  }
  
  // 大写字母检查
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含大写字母');
  } else if (requireUppercase) {
    result.score += 20;
  }
  
  // 小写字母检查
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含小写字母');
  } else if (requireLowercase) {
    result.score += 20;
  }
  
  // 数字检查
  if (requireNumbers && !/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含数字');
  } else if (requireNumbers) {
    result.score += 20;
  }
  
  // 特殊字符检查
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含特殊字符');
  } else if (requireSpecialChars) {
    result.score += 20;
  }
  
  // 计算密码强度
  if (result.score >= 80) {
    result.strength = 'strong';
  } else if (result.score >= 60) {
    result.strength = 'medium';
  } else if (result.score >= 40) {
    result.strength = 'weak';
  } else {
    result.strength = 'very-weak';
  }
  
  return result;
}

/**
 * 验证必填字段
 * @param {any} value - 字段值
 * @returns {boolean} 是否有效
 */
export function validateRequired(value) {
  if (value === undefined || value === null) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return true;
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} 是否有效
 */
export function validateUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证手机号码
 * @param {string} phone - 手机号码
 * @returns {boolean} 是否有效
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const re = /^1[3-9]\d{9}$/;
  return re.test(phone);
}

/**
 * 验证身份证号码
 * @param {string} idCard - 身份证号码
 * @returns {boolean} 是否有效
 */
export function validateIdCard(idCard) {
  if (!idCard) return false;
  
  // 简单验证，实际项目需要更复杂的验证
  const re = /^\d{17}[\dXx]$/;
  if (!re.test(idCard)) return false;
  
  // 验证校验码（简单版）
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  return checkCode === idCard[17].toUpperCase();
}

/**
 * 验证数字范围
 * @param {number} value - 数值
 * @param {Object} options - 选项
 * @returns {boolean} 是否有效
 */
export function validateNumber(value, options = {}) {
  const { min, max, integer = false } = options;
  
  if (value === undefined || value === null) {
    return false;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return false;
  }
  
  if (integer && !Number.isInteger(num)) {
    return false;
  }
  
  if (min !== undefined && num < min) {
    return false;
  }
  
  if (max !== undefined && num > max) {
    return false;
  }
  
  return true;
}

/**
 * 验证字符串长度
 * @param {string} value - 字符串
 * @param {Object} options - 选项
 * @returns {boolean} 是否有效
 */
export function validateLength(value, options = {}) {
  const { min, max } = options;
  
  if (!value && min > 0) {
    return false;
  }
  
  const length = value ? value.length : 0;
  
  if (min !== undefined && length < min) {
    return false;
  }
  
  if (max !== undefined && length > max) {
    return false;
  }
  
  return true;
}

/**
 * 验证正则表达式
 * @param {string} value - 要验证的值
 * @param {RegExp|string} pattern - 正则表达式或模式字符串
 * @returns {boolean} 是否匹配
 */
export function validatePattern(value, pattern) {
  if (!value) return false;
  
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return regex.test(value);
}

/**
 * 创建验证器
 * @param {Object} schema - 验证模式
 * @returns {Function} 验证函数
 */
export function createValidator(schema) {
  return function(data) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const { type, message, ...ruleOptions } = rule;
        
        let isValid = true;
        
        switch (type) {
          case 'required':
            isValid = validateRequired(value);
            break;
          case 'email':
            isValid = validateEmail(value);
            break;
          case 'password':
            isValid = validatePassword(value, ruleOptions).isValid;
            break;
          case 'url':
            isValid = validateUrl(value);
            break;
          case 'phone':
            isValid = validatePhone(value);
            break;
          case 'idCard':
            isValid = validateIdCard(value);
            break;
          case 'number':
            isValid = validateNumber(value, ruleOptions);
            break;
          case 'length':
            isValid = validateLength(value, ruleOptions);
            break;
          case 'pattern':
            isValid = validatePattern(value, ruleOptions.pattern);
            break;
          case 'custom':
            isValid = ruleOptions.validator ? ruleOptions.validator(value, data) : true;
            break;
        }
        
        if (!isValid) {
          errors.push({
            field,
            message: message || `字段 ${field} 验证失败`,
            rule: type,
            value
          });
          break; // 一个字段一个错误
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  };
}