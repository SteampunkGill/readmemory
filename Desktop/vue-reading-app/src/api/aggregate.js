// src/api/aggregate.js
import authAPI from './auth';
import documentsAPI from './documents';
import readerAPI from './reader';
import vocabularyAPI from './vocabulary';
import reviewAPI from './review';
import userAPI from './user';
import settingsAPI from './settings';
import tagsAPI from './tags';
import searchAPI from './search';
import notificationsAPI from './notifications';
import feedbackAPI from './feedback';
import offlineAPI from './offline';
import exportAPI from './export';
import systemAPI from './system';

/**
 * API聚合模块
 * 将所有API模块聚合在一起，提供统一的访问接口
 */

const api = {
  auth: authAPI,
  documents: documentsAPI,
  reader: readerAPI,
  vocabulary: vocabularyAPI,
  review: reviewAPI,
  user: userAPI,
  settings: settingsAPI,
  tags: tagsAPI,
  search: searchAPI,
  notifications: notificationsAPI,
  feedback: feedbackAPI,
  offline: offlineAPI,
  export: exportAPI,
  system: systemAPI,
};

export default api;