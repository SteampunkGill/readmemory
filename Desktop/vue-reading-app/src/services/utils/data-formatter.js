// src/utils/data-formatter.js
/**
 * 数据格式化工具
 * 提供各种数据格式转换和格式化功能
 */

import { formatDate, formatTime, formatDateTime } from './formatter';

/**
 * 格式化数字
 * @param {number|string} value - 要格式化的值
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(value, options = {}) {
  const {
    decimals = 2,
    decimalSeparator = '.',
    thousandSeparator = ',',
    prefix = '',
    suffix = ''
  } = options;
  
  let num = parseFloat(value);
  if (isNaN(num)) {
    return value;
  }
  
  // 处理小数位数
  num = num.toFixed(decimals);
  
  // 分割整数和小数部分
  const parts = num.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // 添加千位分隔符
  if (thousandSeparator) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  }
  
  // 组合结果
  let result = integerPart;
  if (decimalPart && decimals > 0) {
    result += decimalSeparator + decimalPart;
  }
  
  return prefix + result + suffix;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化百分比
 * @param {number} value - 数值（0-1之间）
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的百分比
 */
export function formatPercent(value, options = {}) {
  const {
    decimals = 2,
    showSign = true,
    multiply = true
  } = options;
  
  let num = parseFloat(value);
  if (isNaN(num)) {
    return '0%';
  }
  
  if (multiply) {
    num = num * 100;
  }
  
  const formatted = num.toFixed(decimals);
  const sign = showSign ? '%' : '';
  
  return formatted + sign;
}

/**
 * 格式化持续时间
 * @param {number} milliseconds - 毫秒数
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的持续时间
 */
export function formatDuration(milliseconds, options = {}) {
  const {
    showMilliseconds = false,
    showZero = false,
    compact = false
  } = options;
  
  const ms = Math.abs(milliseconds);
  
  // 计算各个时间单位
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const remainingMs = ms % 1000;
  
  const parts = [];
  
  if (days > 0 || showZero) {
    parts.push(`${days}${compact ? 'd' : '天'}`);
  }
  
  if (hours > 0 || showZero) {
    parts.push(`${hours}${compact ? 'h' : '小时'}`);
  }
  
  if (minutes > 0 || showZero) {
    parts.push(`${minutes}${compact ? 'm' : '分钟'}`);
  }
  
  if (seconds > 0 || showZero) {
    parts.push(`${seconds}${compact ? 's' : '秒'}`);
  }
  
  if (showMilliseconds && (remainingMs > 0 || showZero)) {
    parts.push(`${remainingMs}${compact ? 'ms' : '毫秒'}`);
  }
  
  // 如果没有部分，返回0秒
  if (parts.length === 0) {
    return `0${compact ? 's' : '秒'}`;
  }
  
  // 紧凑模式用空格分隔，否则用中文分隔
  const separator = compact ? ' ' : '';
  return parts.join(separator);
}

/**
 * 格式化相对时间
 * @param {Date|string|number} date - 日期
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay === 1) {
    return '昨天';
  } else if (diffDay < 7) {
    return `${diffDay}天前`;
  } else if (diffWeek === 1) {
    return '上周';
  } else if (diffWeek < 4) {
    return `${diffWeek}周前`;
  } else if (diffMonth === 1) {
    return '上个月';
  } else if (diffMonth < 12) {
    return `${diffMonth}个月前`;
  } else if (diffYear === 1) {
    return '去年';
  } else {
    return `${diffYear}年前`;
  }
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的货币
 */
export function formatCurrency(amount, options = {}) {
  const {
    currency = 'CNY',
    locale = 'zh-CN',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(amount);
  } catch (error) {
    // 如果Intl不支持，使用简单格式化
    return `${currency} ${formatNumber(amount, { decimals: 2 })}`;
  }
}

/**
 * 格式化电话号码
 * @param {string} phone - 电话号码
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的电话号码
 */
export function formatPhoneNumber(phone, options = {}) {
  const {
    format = 'xxx-xxxx-xxxx',
    separator = '-'
  } = options;
  
  if (!phone) return '';
  
  // 移除所有非数字字符
  const digits = phone.replace(/\D/g, '');
  
  if (format === 'xxx-xxxx-xxxx') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}${separator}${digits.slice(3)}`;
    return `${digits.slice(0, 3)}${separator}${digits.slice(3, 7)}${separator}${digits.slice(7, 11)}`;
  }
  
  return phone;
}

/**
 * 格式化JSON数据
 * @param {any} data - 要格式化的数据
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的JSON字符串
 */
export function formatJson(data, options = {}) {
  const {
    indent = 2,
    replacer = null,
    space = ' '
  } = options;
  
  try {
    return JSON.stringify(data, replacer, indent);
  } catch (error) {
    console.error('JSON格式化失败:', error);
    return String(data);
  }
}

/**
 * 格式化HTML内容
 * @param {string} html - HTML字符串
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的HTML
 */
export function formatHtml(html, options = {}) {
  const {
    indentSize = 2,
    maxLineLength = 80
  } = options;
  
  if (!html) return '';
  
  // 简单的HTML格式化
  let formatted = html
    .replace(/>\s+</g, '><') // 移除标签间的空白
    .replace(/(<[^>]+>)/g, '\n$1\n') // 在每个标签前后添加换行
    .replace(/\n\s*\n/g, '\n') // 移除多余的空行
    .trim();
  
  // 添加缩进
  let indentLevel = 0;
  const lines = formatted.split('\n');
  const result = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // 减少闭合标签的缩进
    if (line.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    // 添加缩进
    const indent = ' '.repeat(indentLevel * indentSize);
    result.push(indent + line);
    
    // 增加非自闭合、非闭合标签的缩进
    if (line.startsWith('<') && !line.startsWith('</') && 
        !line.endsWith('/>') && !line.match(/<(\w+)[^>]*>.*<\/\1>/)) {
      indentLevel++;
    }
  }
  
  return result.join('\n');
}

/**
 * 格式化Markdown内容
 * @param {string} markdown - Markdown字符串
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的Markdown
 */
export function formatMarkdown(markdown, options = {}) {
  const {
    lineLength = 80,
    listIndent = '  '
  } = options;
  
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  const result = [];
  
  for (let line of lines) {
    // 处理标题
    if (line.startsWith('# ')) {
      result.push(line);
      continue;
    }
    
    // 处理列表
    if (line.match(/^[\*\-\+]\s/)) {
      result.push(line);
      continue;
    }
    
    // 处理代码块
    if (line.startsWith('```') || line.startsWith('    ')) {
      result.push(line);
      continue;
    }
    
    // 普通文本换行处理
    if (line.length > lineLength) {
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + ' ' + word).length <= lineLength) {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
          if (currentLine) result.push(currentLine);
          currentLine = word;
        }
      }
      
      if (currentLine) result.push(currentLine);
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * 格式化CSV数据
 * @param {Array<Object>} data - 数据数组
 * @param {Object} options - 格式化选项
 * @returns {string} CSV字符串
 */
export function formatCsv(data, options = {}) {
  const {
    delimiter = ',',
    includeHeader = true,
    quoteChar = '"'
  } = options;
  
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const rows = [];
  
  // 添加表头
  if (includeHeader) {
    const headerRow = headers.map(header => 
      quoteChar + header.replace(quoteChar, quoteChar + quoteChar) + quoteChar
    ).join(delimiter);
    rows.push(headerRow);
  }
  
  // 添加数据行
  for (const item of data) {
    const row = headers.map(header => {
      let value = item[header];
      
      if (value === null || value === undefined) {
        value = '';
      } else {
        value = String(value);
        // 转义引号
        value = value.replace(new RegExp(quoteChar, 'g'), quoteChar + quoteChar);
      }
      
      return quoteChar + value + quoteChar;
    }).join(delimiter);
    
    rows.push(row);
  }
  
  return rows.join('\n');
}

/**
 * 格式化数组为字符串
 * @param {Array} array - 数组
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的字符串
 */
export function formatArray(array, options = {}) {
  const {
    separator = ', ',
    maxItems = 10,
    ellipsis = '...'
  } = options;
  
  if (!Array.isArray(array)) {
    return String(array);
  }
  
  if (array.length === 0) {
    return '';
  }
  
  if (array.length <= maxItems) {
    return array.join(separator);
  }
  
  const visibleItems = array.slice(0, maxItems);
  return visibleItems.join(separator) + separator + ellipsis + ` (共${array.length}项)`;
}

/**
 * 格式化对象为可读字符串
 * @param {Object} obj - 对象
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的字符串
 */
export function formatObject(obj, options = {}) {
  const {
    indent = 2,
    maxDepth = 3,
    currentDepth = 0
  } = options;
  
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  
  const type = typeof obj;
  
  if (type === 'string') return `"${obj}"`;
  if (type === 'number' || type === 'boolean') return String(obj);
  
  if (Array.isArray(obj)) {
    if (currentDepth >= maxDepth) return '[...]';
    
    const items = obj.map(item => 
      formatObject(item, { ...options, currentDepth: currentDepth + 1 })
    );
    
    return `[${items.join(', ')}]`;
  }
  
  if (type === 'object') {
    if (currentDepth >= maxDepth) return '{...}';
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    
    const indentStr = ' '.repeat(indent * (currentDepth + 1));
    const lines = entries.map(([key, value]) => {
      const formattedValue = formatObject(value, { 
        ...options, 
        currentDepth: currentDepth + 1 
      });
      return `${indentStr}${key}: ${formattedValue}`;
    });
    
    const outerIndent = ' '.repeat(indent * currentDepth);
    return `{\n${lines.join(',\n')}\n${outerIndent}}`;
  }
  
  return String(obj);
}

/**
 * 格式化查询参数
 * @param {Object} params - 查询参数对象
 * @returns {string} 查询参数字符串
 */
export function formatQueryParams(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }
  
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          searchParams.append(key, item);
        });
      } else {
        searchParams.append(key, value);
      }
    }
  }
  
  return searchParams.toString();
}

/**
 * 格式化颜色值
 * @param {string} color - 颜色值
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的颜色值
 */
export function formatColor(color, options = {}) {
  const {
    format = 'hex',
    alpha = 1
  } = options;
  
  if (!color) return '';
  
  // 移除所有空白字符
  color = color.replace(/\s/g, '');
  
  // 解析颜色值
  let r, g, b, a = alpha;
  
  // HEX格式
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  }
  // RGB格式
  else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\\((\\d\+),\\s\*(\\d\+),\\s\*(\\d\+)(?:,\\s\*(\[\\d.]\+))?\\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
      a = match[4] ? parseFloat(match[4]) : 1;
    }
  }
  
  if (r === undefined || g === undefined || b === undefined) {
    return color;
  }
  
  // 根据目标格式返回
  switch (format) {
    case 'hex':
      const toHex = (n) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
    
    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    
    case 'hsl':
      // 转换为HSL
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
          case gNorm: h = (bNorm - rNorm) / d + 2; break;
          case bNorm: h = (rNorm - gNorm) / d + 4; break;
        }
        
        h /= 6;
      }
      
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    
    default:
      return color;
  }
}

/**
 * 格式化数据为表格
 * @param {Array<Object>} data - 数据
 * @param {Object} options - 格式化选项
 * @returns {string} 表格字符串
 */
export function formatTable(data, options = {}) {
  const {
    headers = null,
    columnWidth = 20,
    border = true
  } = options;
  
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  // 确定表头
  const actualHeaders = headers || Object.keys(data[0]);
  
  // 计算每列的最大宽度
  const colWidths = actualHeaders.map(header => {
    let maxWidth = Math.min(header.length, columnWidth);
    
    for (const row of data) {
      const value = row[header];
      const strValue = value !== undefined && value !== null ? String(value) : '';
      maxWidth = Math.max(maxWidth, Math.min(strValue.length, columnWidth));
    }
    
    return maxWidth;
  });
  
  // 构建表格
  const lines = [];
  
  // 上边框
  if (border) {
    const topBorder = colWidths.map(width => '─'.repeat(width + 2)).join('┬');
    lines.push('┌' + topBorder + '┐');
  }
  
  // 表头
  const headerCells = actualHeaders.map((header, i) => {
    const width = colWidths[i];
    return ' ' + header.padEnd(width) + ' ';
  });
  
  lines.push((border ? '│' : '') + headerCells.join(border ? '│' : ' ') + (border ? '│' : ''));
  
  // 分隔线
  if (border) {
    const separator = colWidths.map(width => '─'.repeat(width + 2)).join('┼');
    lines.push('├' + separator + '┤');
  }
  
  // 数据行
  for (const row of data) {
    const cells = actualHeaders.map((header, i) => {
      const value = row[header];
      const strValue = value !== undefined && value !== null ? String(value) : '';
      const width = colWidths[i];
      
      // 截断过长的文本
      const displayValue = strValue.length > width ? 
        strValue.substring(0, width - 3) + '...' : strValue;
      
      return ' ' + displayValue.padEnd(width) + ' ';
    });
    
    lines.push((border ? '│' : '') + cells.join(border ? '│' : ' ') + (border ? '│' : ''));
  }
  
  // 下边框
  if (border) {
    const bottomBorder = colWidths.map(width => '─'.repeat(width + 2)).join('┴');
    lines.push('└' + bottomBorder + '┘');
  }
  
  return lines.join('\n');
}

/**
 * 深度克隆对象
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * 合并多个对象
 * @param {...Object} objects - 要合并的对象
 * @returns {Object} 合并后的对象
 */
export function deepMerge(...objects) {
  const result = {};
  
  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          result[key] = deepMerge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    }
  }
  
  return result;
}

export default {
  formatNumber,
  formatFileSize,
  formatPercent,
  formatDuration,
  formatRelativeTime,
  formatCurrency,
  formatPhoneNumber,
  formatJson,
  formatHtml,
  formatMarkdown,
  formatCsv,
  formatArray,
  formatObject,
  formatQueryParams,
  formatColor,
  formatTable,
  deepClone,
  deepMerge
};