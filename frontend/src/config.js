/**
 * 前端全局配置文件
 */

// 后端 API 基础路径
export const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

// 默认图片
export const DEFAULT_AVATAR = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1543005128-8181c33b9e94?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80';

export default {
  API_BASE_URL,
  DEFAULT_AVATAR,
  DEFAULT_BOOK_COVER
};