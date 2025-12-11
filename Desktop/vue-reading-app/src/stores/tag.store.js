import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useTagStore = defineStore('tag', () => {
  // 状态定义
  const tags = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const tagCount = computed(() => tags.value.length);
  const popularTags = computed(() => 
    tags.value.slice().sort((a, b) => b.documentCount - a.documentCount).slice(0, 10)
  );

  // 动作
  const setTags = (newTags) => {
    tags.value = newTags;
  };

  const addTag = (tag) => {
    tags.value.push(tag);
  };

  const updateTag = (tagId, updates) => {
    const index = tags.value.findIndex(t => t.id === tagId);
    if (index !== -1) {
      tags.value[index] = { ...tags.value[index], ...updates };
    }
  };

  const removeTag = (tagId) => {
    const index = tags.value.findIndex(t => t.id === tagId);
    if (index !== -1) {
      tags.value.splice(index, 1);
    }
  };

  const getTagById = (tagId) => {
    return tags.value.find(t => t.id === tagId);
  };

  const incrementTagUsage = (tagId, count = 1) => {
    const tag = getTagById(tagId);
    if (tag) {
      tag.documentCount += count;
    }
  };

  const decrementTagUsage = (tagId, count = 1) => {
    const tag = getTagById(tagId);
    if (tag) {
      tag.documentCount = Math.max(0, tag.documentCount - count);
    }
  };

  const setLoading = (isLoading) => {
    loading.value = isLoading;
  };

  const setError = (err) => {
    error.value = err;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // 状态
    tags,
    loading,
    error,

    // 计算属性
    tagCount,
    popularTags,

    // 动作
    setTags,
    addTag,
    updateTag,
    removeTag,
    getTagById,
    incrementTagUsage,
    decrementTagUsage,
    setLoading,
    setError,
    clearError,
  };
});