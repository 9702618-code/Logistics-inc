<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useStackersStore } from '../stores/stackers';
import type { StorageStacker } from '../types';

const route = useRoute();
const router = useRouter();
const store = useStackersStore();

const isEditMode = computed(() => !!route.params.id);
const stackerId = route.params.id as string;

const form = ref<Partial<StorageStacker>>({
  serialNumber: '',
  model: '',
  zoneId: '',
  maxOperatingHeightMeters: 0,
  currentWeightCapacityKg: 0,
  operationalStatus: 'standby',
  batteryLevel: 100,
  lastInspectionDate: new Date().toISOString().split('T')[0],
  notes: ''
});

const isSaving = ref(false);
const serverErrors = ref<Record<string, string>>({});
const isDirty = ref(false);

onMounted(async () => {
  await store.fetchZones();

  if (isEditMode.value) {
    const data = await store.fetchStackerById(stackerId);
    if (data) {
      form.value = { ...data };
    } else {
      router.push('/404');
    }
  }
});

const markDirty = () => { isDirty.value = true; };

const validateForm = () => {
  const errors: Record<string, string> = {};
  if (!form.value.serialNumber || form.value.serialNumber.length < 4) {
    errors.serialNumber = 'Мінімум 4 символи';
  }
  if (!form.value.model) errors.model = "Обов'язкове поле";
  if (!form.value.zoneId) errors.zoneId = "Оберіть зону";
  if (!form.value.maxOperatingHeightMeters || form.value.maxOperatingHeightMeters > 45) {
    errors.maxOperatingHeightMeters = 'Від 0 до 45 м';
  }
  if (!form.value.currentWeightCapacityKg || form.value.currentWeightCapacityKg > 10000) {
    errors.currentWeightCapacityKg = 'Від 0 до 10000 кг';
  }
  if (form.value.batteryLevel === undefined || form.value.batteryLevel < 0 || form.value.batteryLevel > 100) {
    errors.batteryLevel = 'Від 0 до 100%';
  }
  return errors;
};

const handleSubmit = async () => {
  const clientErrors = validateForm();
  if (Object.keys(clientErrors).length > 0) {
    serverErrors.value = clientErrors;
    return;
  }

  isSaving.value = true;
  serverErrors.value = {};

  try {
    if (isEditMode.value) {
      await store.updateStacker(stackerId, form.value);
    } else {
      await store.createStacker(form.value as Omit<StorageStacker, 'id'>);
    }
    isDirty.value = false;
    router.push('/stackers');
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.errors) {
      serverErrors.value = err.response.data.errors;
    } else {
      alert('Помилка збереження');
    }
  } finally {
    isSaving.value = false;
  }
};

onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && !isSaving.value) {
    const answer = window.confirm('У вас є незбережені зміни. Ви впевнені, що хочете піти?');
    if (answer) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});
</script>

<template>
  <div class="form-container">
    <div class="nav-header">
      <button @click="router.back()" class="btn btn-outline">← Назад</button>
      <h1>{{ isEditMode ? 'Редагування штабелера' : 'Новий штабелер' }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="form-grid" @input="markDirty">
      
      <div class="form-group">
        <label>Серійний номер *</label>
        <input v-model="form.serialNumber" type="text" class="input-field" placeholder="STK-2026-XXX" />
        <span class="error-text" v-if="serverErrors.serialNumber">{{ serverErrors.serialNumber }}</span>
      </div>

      <div class="form-group">
        <label>Модель *</label>
        <input v-model="form.model" type="text" class="input-field" placeholder="Crown FC 4500" />
        <span class="error-text" v-if="serverErrors.model">{{ serverErrors.model }}</span>
      </div>

      <div class="form-group">
        <label>Зона навантаження *</label>
        <select v-model="form.zoneId" class="input-field">
          <option value="" disabled>Оберіть зону</option>
          <option v-for="zone in store.zones" :key="zone.id" :value="zone.id">
            {{ zone.name }} ({{ zone.status }})
          </option>
        </select>
        <span class="error-text" v-if="serverErrors.zoneId">{{ serverErrors.zoneId }}</span>
      </div>

      <div class="form-group">
        <label>Операційний статус</label>
        <select v-model="form.operationalStatus" class="input-field">
          <option value="in_service">В роботі</option>
          <option value="standby">Очікування</option>
          <option value="repair">Ремонт</option>
          <option value="emergency_stop">Аварійна зупинка</option>
        </select>
      </div>

      <div class="form-group">
        <label>Макс. висота (м) *</label>
        <input v-model.number="form.maxOperatingHeightMeters" type="number" class="input-field" step="0.1" />
        <span class="error-text" v-if="serverErrors.maxOperatingHeightMeters">{{ serverErrors.maxOperatingHeightMeters }}</span>
      </div>

      <div class="form-group">
        <label>Вантажопідйомність (кг) *</label>
        <input v-model.number="form.currentWeightCapacityKg" type="number" class="input-field" />
        <span class="error-text" v-if="serverErrors.currentWeightCapacityKg">{{ serverErrors.currentWeightCapacityKg }}</span>
      </div>

      <div class="form-group">
        <label>Заряд батареї (%) *</label>
        <input v-model.number="form.batteryLevel" type="number" class="input-field" min="0" max="100" />
        <span class="error-text" v-if="serverErrors.batteryLevel">{{ serverErrors.batteryLevel }}</span>
      </div>

      <div class="form-group">
        <label>Дата інспекції *</label>
        <input v-model="form.lastInspectionDate" type="date" class="input-field" />
      </div>

      <div class="form-group full-width">
        <label>Примітки</label>
        <textarea v-model="form.notes" class="input-field" rows="3"></textarea>
      </div>

      <div class="form-actions full-width">
        <button type="button" @click="router.push('/stackers')" class="btn btn-outline">Скасувати</button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          {{ isSaving ? 'Збереження...' : 'Зберегти' }}
        </button>
      </div>

      <div v-if="Object.keys(serverErrors).length > 0" class="server-error-banner">
        Будь ласка, виправте помилки у формі.
      </div>

    </form>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.nav-header h1 { margin: 0; font-size: 1.5rem; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.full-width { grid-column: 1 / -1; }

label { font-weight: 500; font-size: 0.9rem; }

.input-field {
  padding: 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  font-family: inherit;
}
.input-field:focus { border-color: var(--primary); }

.error-text {
  color: var(--danger);
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.server-error-banner {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
.btn-outline:hover { background: #f9fafb; }
</style>