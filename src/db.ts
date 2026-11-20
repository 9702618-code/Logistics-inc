import fs from 'fs';
import path from 'path';
import { LoadingZone, StorageStacker } from './types';

const ZONES_FILE = path.join(__dirname, '../data/zones.json');
const STACKERS_FILE = path.join(__dirname, '../data/stackers.json');

// Створюємо папку data, якщо її немає
if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'));
}

// Створюємо початкові зони, якщо файлу немає
if (!fs.existsSync(ZONES_FILE)) {
  const initialZones: LoadingZone[] = [
    { id: 'zone-a1', name: 'Сектор палетування А-1', warehouseCode: 'WH-NORTH-01', maxPayloadCapacityKg: 5000, status: 'active' },
    { id: 'zone-b2', name: 'Зона комплектації B-2', warehouseCode: 'WH-SOUTH-02', maxPayloadCapacityKg: 3000, status: 'maintenance' }
  ];
  fs.writeFileSync(ZONES_FILE, JSON.stringify(initialZones, null, 2));
}

// Створюємо початкові штабелери, якщо файлу немає
if (!fs.existsSync(STACKERS_FILE)) {
  const initialStackers: StorageStacker[] = [
    { id: '1', serialNumber: 'STK-2026-X14', model: 'Crown FC 4500', zoneId: 'zone-a1', maxOperatingHeightMeters: 12, currentWeightCapacityKg: 1500, operationalStatus: 'in_service', batteryLevel: 85, lastInspectionDate: '2026-10-15' }
  ];
  fs.writeFileSync(STACKERS_FILE, JSON.stringify(initialStackers, null, 2));
}

// Експорт функцій
export const getZones = (): LoadingZone[] => {
  return JSON.parse(fs.readFileSync(ZONES_FILE, 'utf-8'));
};

export const getStackers = (): StorageStacker[] => {
  return JSON.parse(fs.readFileSync(STACKERS_FILE, 'utf-8'));
};

export const saveStackers = (stackers: StorageStacker[]) => {
  fs.writeFileSync(STACKERS_FILE, JSON.stringify(stackers, null, 2));
};