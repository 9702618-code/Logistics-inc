<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStackersStore } from '../stores/stackers';
import type { StackerWithZone } from '../types';

const route = useRoute();
const router = useRouter();
const store = useStackersStore();

const stacker = ref<StackerWithZone | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Отримуємо ID з URL
const stackerId = route.params.id as string;

onMounted(async () => {
  try {
    const data = await store.fetchStackerById(stackerId);
    if (data) {
      stacker.value = data;
    } else {
      // Якщо не знайдено — перекидаємо на глобальну 404
      router.push('/404');
    }
  } catch (err) {
    error.value = 'Не вдалося завантажити деталі.';
  } finally {
    isLoading.value = false;
  }
});

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'in_service': 'В роботі',
    'standby': 'Очікування',
    'repair': 'Ремонт',
    'emergency_stop': 'Аварійна зупинка'
  };
  return map[status] || status;
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

// Перевірка на попередження
const hasWarning = computed(() => {
  if (!stacker.value) return false;
  return stacker.value.batteryLevel < 20 || stacker.value.operationalStatus === 'emergency_stop';
});
</script>

<template>
  <div class="detail-container">
    <!-- Навігація -->
    <div class="nav-header">
      <button @click="router.back()" class="btn btn-outline">← Назад до реєстру</button>
      <div v-if="stacker">
        <RouterLink :to="`/stackers/${stacker.id}/edit`" class="btn btn-primary">Редагувати</RouterLink>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">Завантаження...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <!-- Картка -->
    <div v-else-if="stacker" class="content-grid">
      
      <!-- Блок попередження -->
      <div v-if="hasWarning" class="alert-warning">
        ⚠️ Увага! Штабелер потребує негайної уваги (низький заряд або аварійна зупинка).
      </div>

      <!-- Основна інформація -->
      <div class="card main-info">
        <div class="card-header">
          <h2>{{ stacker.serialNumber }}</h2>
          <span class="badge" :class="getStatusBadgeClass(stacker.operationalStatus)">
            {{ getStatusText(stacker.operationalStatus) }}
          </span>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Модель</span>
            <span class="value">{{ stacker.model }}</span>
          </div>
          <div class="info-item">
            <span class="label">Макс. висота підйому</span>
            <span class="value">{{ stacker.maxOperatingHeightMeters }} м</span>
          </div>
          <div class="info-item">
            <span class="label">Вантажопідйомність</span>
            <span class="value">{{ stacker.currentWeightCapacityKg }} кг</span>
          </div>
          <div class="info-item">
            <span class="label">Дата останньої інспекції</span>
            <span class="value">{{ stacker.lastInspectionDate }}</span>
          </div>
        </div>
      </div>

      <!-- Інформація про зону -->
      <div class="card zone-info" v-if="stacker.zone">
        <h3>Прив'язана зона</h3>
        <div class="info-item">
          <span class="label">Назва</span>
          <span class="value">{{ stacker.zone.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">Код складу</span>
          <span class="value">{{ stacker.zone.warehouseCode }}</span>
        </div>
        <div class="info-item">
          <span class="label">Максимальне навантаження</span>
          <span class="value">{{ stacker.zone.maxPayloadCapacityKg }} кг</span>
        </div>
      </div>

      <!-- Заряд батареї -->
      <div class="card battery-card">
        <h3>Рівень заряду</h3>
        <div class="big-battery">
          <div class="battery-fill" :style="{ width: stacker.batteryLevel + '%' }" :class="{ 'low': stacker.batteryLevel < 20 }"></div>
        </div>
        <p class="battery-text">{{ stacker.batteryLevel }}%</p>
      </div>

      <!-- Примітки -->
      <div class="card notes-card" v-if="stacker.notes">
        <h3>Примітки диспетчера</h3>
        <p>{{ stacker.notes }}</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.detail-container { max-width: 1000px; margin: 0 auto; }

.nav-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

/* Сітка контенту */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.alert-warning {
  grid-column: 1 / -1;
  background: #fef2f2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.card h2 { margin: 0; font-size: 1.5rem; }
.card h3 { margin-top: 0; margin-bottom: 1rem; color: var(--text-muted); font-size: 1rem; text-transform: uppercase; }

/* Сітка інформації */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.info-item .label { font-size: 0.85rem; color: var(--text-muted); }
.info-item .value { font-weight: 500; font-size: 1.1rem; }

/* Велика батарея */
.battery-card { text-align: center; }
.big-battery {
  height: 40px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  border: 2px solid #d1d5db;
}
.big-battery .battery-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s;
}
.big-battery .battery-fill.low { background: #ef4444; }
.battery-text { font-size: 1.5rem; font-weight: bold; margin: 0; }

/* Бейджі */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-success { background: #d1fae5; color: #065f46; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-info { background: #dbeafe; color: #1e40af; }
.badge-danger { background: #fee2e2; color: #991b1b; }

/* Кнопки */
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
.btn-outline:hover { background: #f9fafb; }

.loading-state, .error-state { text-align: center; padding: 3rem; color: var(--text-muted); }
.error-state { color: var(--danger); }
</style>