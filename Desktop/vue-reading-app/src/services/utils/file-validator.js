// src/utils/file-validator.js

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array<string>} allowedTypes - 允许的MIME类型数组
 * @returns {boolean} 是否允许
 */
export function validateFileType(file, allowedTypes) {
  if (!file || !allowedTypes || !Array.isArray(allowedTypes)) {
    return false;
  }
  
  // 如果没有文件类型，检查文件扩展名
  if (!file.type) {
    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = allowedTypes.map(type => {
      const parts = type.split('/');
      return parts.length > 1 ? parts[1] : null;
    }).filter(Boolean);
    
    return allowedExtensions.includes(extension);
  }
  
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {boolean} 是否允许
 */
export function validateFileSize(file, maxSize) {
  if (!file || !maxSize) {
    return false;
  }
  
  return file.size <= maxSize;
}

/**
 * 验证图片文件
 * @param {File} file - 文件对象
 * @param {Object} options - 选项
 * @param {Array<string>} [options.allowedTypes] - 允许的类型
 * @param {number} [options.maxSize] - 最大大小
 * @param {number} [options.maxWidth] - 最大宽度
 * @param {number} [options.maxHeight] - 最大高度
 * @returns {Promise<boolean>} 是否允许
 */
export async function validateImageFile(file, options = {}) {
  const defaultOptions = {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 2048,
    maxHeight: 2048
  };
  
  const config = { ...defaultOptions, ...options };
  
  // 验证类型
  if (!validateFileType(file, config.allowedTypes)) {
    return false;
  }
  
  // 验证大小
  if (!validateFileSize(file, config.maxSize)) {
    return false;
  }
  
  // 验证尺寸（如果需要）
  if (config.maxWidth || config.maxHeight) {
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width > config.maxWidth || dimensions.height > config.maxHeight) {
        return false;
      }
    } catch (error) {
      console.error('获取图片尺寸失败:', error);
      return false;
    }
  }
  
  return true;
}

/**
 * 获取图片尺寸
 * @param {File} file - 图片文件
 * @returns {Promise<{width: number, height: number}>} 图片尺寸
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      reject(new Error('加载图片失败'));
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  });
}

/**
 * 验证PDF文件
 * @param {File} file - 文件对象
 * @returns {boolean} 是否PDF文件
 */
export function validatePdfFile(file) {
  const allowedTypes = [
    'application/pdf',
    'application/x-pdf'
  ];
  
  return validateFileType(file, allowedTypes);
}

/**
 * 验证文档文件
 * @param {File} file - 文件对象
 * @returns {boolean} 是否文档文件
 */
export function validateDocumentFile(file) {
  const allowedTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'text/plain',
    'text/html',
    'application/rtf'
  ];
  
  return validateFileType(file, allowedTypes);
}