<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStackersStore } from '../stores/stackers';

const store = useStackersStore();
const router = useRouter();
const route = useRoute();

// Ініціалізація фільтрів з URL
const search = ref((route.query.search as string) || '');
const statusFilter = ref((route.query.status as string) || '');
const zoneFilter = ref((route.query.zoneId as string) || '');
const sortBy = ref((route.query.sortBy as string) || '');
const sortOrder = ref((route.query.order as string) || 'asc');

const deleteModalOpen = ref(false);
const stackerToDelete = ref<string | null>(null);

// Завантажуємо зони ОДИН РАЗ при вході
onMounted(async () => {
  await store.fetchZones();
});

// Ця функція просто формує URL і оновлює його
const updateUrl = () => {
  const query: Record<string, string> = {};
  if (search.value) query.search = search.value;
  if (statusFilter.value) query.status = statusFilter.value;
  if (zoneFilter.value) query.zoneId = zoneFilter.value;
  if (sortBy.value) query.sortBy = sortBy.value;
  if (sortOrder.value) query.order = sortOrder.value;

  // Оновлюємо URL. Це викличе watch нижче.
  router.replace({ query });
};

// Цей watch слідкує за зміною URL і ЗАВАНТАЖУЄ ДАНІ
watch(
  () => route.query,
  async (newQuery) => {
    // Синхронізуємо локальні змінні з URL (якщо URL змінився ззовні)
    search.value = (newQuery.search as string) || '';
    statusFilter.value = (newQuery.status as string) || '';
    zoneFilter.value = (newQuery.zoneId as string) || '';
    sortBy.value = (newQuery.sortBy as string) || '';
    sortOrder.value = (newQuery.order as string) || 'asc';

    // Формуємо параметри для бекенду
    const apiParams: Record<string, string> = {};
    if (search.value) apiParams.q = search.value;
    if (statusFilter.value) apiParams.operationalStatus = statusFilter.value;
    if (zoneFilter.value) apiParams.zoneId = zoneFilter.value;
    if (sortBy.value) apiParams.sortBy = sortBy.value;
    if (sortOrder.value) apiParams.order = sortOrder.value;

    // Робимо запит
    await store.fetchStackers(apiParams);
  },
  { immediate: true } // Запускаємо відразу при завантаженні компонента
);

// Скидання фільтрів
const clearFilters = () => {
  search.value = '';
  statusFilter.value = '';
  zoneFilter.value = '';
  sortBy.value = '';
  sortOrder.value = 'asc';
  updateUrl();
};

const openDeleteModal = (id: string) => {
  stackerToDelete.value = id;
  deleteModalOpen.value = true;
};

const confirmDelete = async () => {
  if (stackerToDelete.value) {
    await store.deleteStacker(stackerToDelete.value);
    deleteModalOpen.value = false;
    stackerToDelete.value = null;
    // Після видалення просто оновлюємо поточний URL (дані завантажаться через watch)
    router.replace({ query: { ...route.query } });
  }
};

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    'in_service': 'badge-success',
    'standby': 'badge-warning',
    'repair': 'badge-info',
    'emergency_stop': 'badge-danger'
  };
  return map[status] || 'badge-default';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'in_service': 'В роботі',
    'standby': 'Очікування',
    'repair': 'Ремонт',
    'emergency_stop': 'Аварійна зупинка'
  };
  return map[status] || status;
};

const getZoneName = (zoneId: string) => {
  const zone = store.zones.find(z => z.id === zoneId);
  return zone ? zone.name : 'Невідома зона';
};
</script>

<template>
  <div class="registry-container">
    <div class="header-actions">
      <h1>Реєстр обладнання</h1>
      <RouterLink to="/stackers/new" class="btn btn-primary">+ Додати штабелер</RouterLink>
    </div>

    <div class="filters-panel">
      <!-- Додаємо @input та @change, щоб викликати updateUrl при зміні -->
      <input 
        v-model="search" 
        @input="updateUrl"
        type="text" 
        placeholder="Пошук за серійним номером або моделлю..." 
        class="input-field"
      />
      
      <select v-model="zoneFilter" @change="updateUrl" class="select-field">
        <option value="">Всі зони</option>
        <option v-for="zone in store.zones" :key="zone.id" :value="zone.id">
          {{ zone.name }}
        </option>
      </select>

      <select v-model="statusFilter" @change="updateUrl" class="select-field">
        <option value="">Всі статуси</option>
        <option value="in_service">В роботі</option>
        <option value="standby">Очікування</option>
        <option value="repair">Ремонт</option>
        <option value="emergency_stop">Аварійна зупинка</option>
      </select>

      <select v-model="sortBy" @change="updateUrl" class="select-field">
        <option value="">Без сортування</option>
        <option value="batteryLevel">За зарядом</option>
        <option value="currentWeightCapacityKg">За вантажопідйомністю</option>
        <option value="lastInspectionDate">За датою інспекції</option>
      </select>

      <select v-model="sortOrder" @change="updateUrl" class="select-field" v-if="sortBy">
        <option value="asc">За зростанням</option>
        <option value="desc">За спаданням</option>
      </select>

      <button @click="clearFilters" class="btn btn-outline">Скинути</button>
    </div>

    <div v-if="store.isLoading" class="loading-state">
      Завантаження даних...
    </div>

    <div v-else-if="store.error" class="error-state">
      <p>{{ store.error }}</p>
      <button @click="updateUrl" class="btn btn-primary">Спробувати знову</button>
    </div>

    <div v-else-if="store.stackers.length === 0" class="empty-state">
      <p>За вашими фільтрами нічого не знайдено.</p>
      <button @click="clearFilters" class="btn btn-primary">Скинути фільтри</button>
    </div>

    <div v-else class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Серійний номер</th>
            <th>Модель</th>
            <th>Зона</th>
            <th>Статус</th>
            <th>Заряд</th>
            <th>Висота (м)</th>
            <th>Вантаж (кг)</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stacker in store.stackers" :key="stacker.id">
            <td><strong>{{ stacker.serialNumber }}</strong></td>
            <td>{{ stacker.model }}</td>
            <td>{{ getZoneName(stacker.zoneId) }}</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(stacker.operationalStatus)">
                {{ getStatusText(stacker.operationalStatus) }}
              </span>
            </td>
            <td>
              <div class="battery-indicator">
                <div class="battery-fill" :style="{ width: stacker.batteryLevel + '%' }" :class="{ 'low': stacker.batteryLevel < 20 }"></div>
                <span class="battery-text">{{ stacker.batteryLevel }}%</span>
              </div>
            </td>
            <td>{{ stacker.maxOperatingHeightMeters }}</td>
            <td>{{ stacker.currentWeightCapacityKg }}</td>
            <td class="actions">
              <RouterLink :to="`/stackers/${stacker.id}`" class="action-link view" title="Переглянути">👁️</RouterLink>
              <RouterLink :to="`/stackers/${stacker.id}/edit`" class="action-link edit" title="Редагувати">✏️</RouterLink>
              <button @click="openDeleteModal(stacker.id)" class="action-link delete" title="Видалити">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="deleteModalOpen" class="modal-overlay" @click.self="deleteModalOpen = false">
      <div class="modal-content">
        <h3>Підтвердження видалення</h3>
        <p>Ви впевнені, що хочете видалити цей штабелер? Цю дію неможливо скасувати.</p>
        <div class="modal-actions">
          <button @click="deleteModalOpen = false" class="btn btn-outline">Скасувати</button>
          <button @click="confirmDelete" class="btn btn-danger">Видалити</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Стилі залишаються ті самі, що були */
.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
h1 { margin: 0; font-size: 1.75rem; }
.filters-panel { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.input-field, .select-field { padding: 0.6rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem; outline: none; min-width: 150px; }
.input-field { flex: 1; min-width: 250px; }
.input-field:focus, .select-field:focus { border-color: var(--primary); }
.btn { padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; justify-content: center; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
.btn-outline:hover { background: #f9fafb; }
.btn-danger { background: var(--danger); color: white; }
.btn-danger:hover { background: #dc2626; }
.table-responsive { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); }
.data-table th { background: #f9fafb; font-weight: 600; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
.data-table tr:last-child td { border-bottom: none; }
.badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-info { background: #dbeafe; color: #1e40af; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-default { background: #f3f4f6; color: #374151; }
.battery-indicator { width: 80px; height: 16px; background: #e5e7eb; border-radius: 4px; position: relative; overflow: hidden; display: flex; align-items: center; }
.battery-fill { height: 100%; background: #10b981; transition: width 0.3s ease; }
.battery-fill.low { background: #ef4444; }
.battery-text { position: absolute; width: 100%; text-align: center; font-size: 0.65rem; font-weight: bold; color: #000; mix-blend-mode: difference; color: white; }
.actions { display: flex; gap: 0.5rem; }
.action-link { background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 0.25rem; border-radius: 4px; transition: background 0.2s; text-decoration: none; }
.action-link:hover { background: #f3f4f6; }
.loading-state, .empty-state, .error-state { text-align: center; padding: 3rem; background: white; border-radius: 8px; color: var(--text-muted); font-size: 1.1rem; }
.error-state { color: var(--danger); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 100%; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
</style>