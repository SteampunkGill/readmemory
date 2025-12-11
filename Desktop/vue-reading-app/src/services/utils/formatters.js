// src/utils/formatter.js

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} [decimals=2] - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或对象
 * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - 格式
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  const replacements = {
    'YYYY': d.getFullYear(),
    'MM': pad(d.getMonth() + 1),
    'DD': pad(d.getDate()),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
    'M': d.getMonth() + 1,
    'D': d.getDate(),
    'H': d.getHours(),
    'm': d.getMinutes(),
    's': d.getSeconds()
  };
  
  return format.replace(
    /YYYY|MM|DD|HH|mm|ss|M|D|H|m|s/g,
    (match) => replacements[match] || match
  );
}

/**
 * 格式化时间间隔
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间间隔
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.floor(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  }
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} [suffix='...'] - 后缀
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
}

/**
 * 格式化百分比
 * @param {number} value - 值
 * @param {number} total - 总数
 * @param {number} [decimals=1] - 小数位数
 * @returns {string} 百分比字符串
 */
export function formatPercentage(value, total, decimals = 1) {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}