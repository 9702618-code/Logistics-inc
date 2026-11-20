import { defineStore } from 'pinia';
import { ref } from 'vue';
import http from '../api/http';
import type { StorageStacker, LoadingZone, StackerWithZone } from '../types';

export const useStackersStore = defineStore('stackers', () => {
  const stackers = ref<StorageStacker[]>([]);
  const zones = ref<LoadingZone[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchZones = async () => {
    try {
      const response = await http.get('/zones');
      zones.value = response.data;
    } catch (err) {
      console.error('Помилка завантаження зон', err);
    }
  };

  const fetchStackers = async (params?: Record<string, string>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await http.get('/stackers', { params });
      stackers.value = response.data;
    } catch (err) {
      error.value = 'Не вдалося завантажити дані. Перевірте з’єднання.';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchStackerById = async (id: string): Promise<StackerWithZone | null> => {
    try {
      const response = await http.get(`/stackers/${id}`);
      return response.data;
    } catch (err) {
      return null;
    }
  };

  const createStacker = async (data: Omit<StorageStacker, 'id'>) => {
    const response = await http.post('/stackers', data);
    return response.data;
  };

  const updateStacker = async (id: string, data: Partial<StorageStacker>) => {
    const response = await http.put(`/stackers/${id}`, data);
    return response.data;
  };

  const deleteStacker = async (id: string) => {
    await http.delete(`/stackers/${id}`);
  };

  return {
    stackers,
    zones,
    isLoading,
    error,
    fetchZones,
    fetchStackers,
    fetchStackerById,
    createStacker,
    updateStacker,
    deleteStacker
  };
});