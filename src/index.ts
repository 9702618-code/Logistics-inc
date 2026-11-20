import express, { Request, Response } from 'express';
import cors from 'cors';
import { getZones, getStackers, saveStackers } from './db';
import { StorageStacker } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Отримання довідника зон
app.get('/api/zones', (req, res) => {
  res.json(getZones());
});

// 2. Отримання списку штабелерів з фільтрацією та сортуванням
app.get('/api/stackers', (req: Request, res: Response) => {
  let stackers = getStackers();
  const { operationalStatus, zoneId, q, sortBy, order } = req.query;

  if (operationalStatus) stackers = stackers.filter(s => s.operationalStatus === operationalStatus);
  if (zoneId) stackers = stackers.filter(s => s.zoneId === zoneId);
  if (q) {
    const search = (q as string).toLowerCase();
    stackers = stackers.filter(s => s.serialNumber.toLowerCase().includes(search) || s.model.toLowerCase().includes(search));
  }

  // Сортування
  if (sortBy) {
    const sortKey = sortBy as keyof StorageStacker;
    const sortOrder = order === 'desc' ? -1 : 1;
    stackers.sort((a, b) => {
      if (a[sortKey]! < b[sortKey]!) return -1 * sortOrder;
      if (a[sortKey]! > b[sortKey]!) return 1 * sortOrder;
      return 0;
    });
  }

  res.json(stackers);
});

// 3. Отримання детальної картки з пов'язаною зоною
app.get('/api/stackers/:id', (req, res) => {
  const stacker = getStackers().find(s => s.id === req.params.id);
  if (!stacker) return res.status(404).json({ message: 'Не знайдено' });
  
  const zone = getZones().find(z => z.id === stacker.zoneId);
  res.json({ ...stacker, zone });
});

// 4. Створення нового штабелера
app.post('/api/stackers', (req, res) => {
  const data: StorageStacker = req.body;
  const errors: Record<string, string> = {};
  const zones = getZones();
  const stackers = getStackers();

  // Валідація
  if (!data.serialNumber || data.serialNumber.length < 4) errors.serialNumber = 'Мінімум 4 символи';
  if (stackers.some(s => s.serialNumber === data.serialNumber)) errors.serialNumber = 'Серійний номер має бути унікальним';
  if (data.maxOperatingHeightMeters <= 0 || data.maxOperatingHeightMeters > 45) errors.maxOperatingHeightMeters = 'Висота має бути від 0 до 45 м';
  
  const zone = zones.find(z => z.id === data.zoneId);
  if (!zone) errors.zoneId = 'Зону не знайдено';
  else if (data.currentWeightCapacityKg > zone.maxPayloadCapacityKg) errors.currentWeightCapacityKg = 'Перевищено ліміт ваги зони';

  if (data.batteryLevel < 0 || data.batteryLevel > 100) errors.batteryLevel = 'Заряд від 0 до 100';

  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const newStacker: StorageStacker = { ...data, id: Date.now().toString() };
  stackers.push(newStacker);
  saveStackers(stackers);
  res.status(201).json(newStacker);
});

// 5. Оновлення
app.put('/api/stackers/:id', (req, res) => {
  const stackers = getStackers();
  const index = stackers.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Не знайдено' });

  stackers[index] = { ...stackers[index], ...req.body };
  saveStackers(stackers);
  res.json(stackers[index]);
});

// 6. Видалення
app.delete('/api/stackers/:id', (req, res) => {
  let stackers = getStackers();
  const initialLength = stackers.length;
  stackers = stackers.filter(s => s.id !== req.params.id);
  
  if (stackers.length === initialLength) return res.status(404).json({ message: 'Не знайдено' });
  
  saveStackers(stackers);
  res.status(204).send();
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));