export interface LoadingZone {
  id: string;
  name: string;
  warehouseCode: string;
  maxPayloadCapacityKg: number;
  status: 'active' | 'maintenance' | 'offline';
}

export interface StorageStacker {
  id: string;
  serialNumber: string;
  model: string;
  zoneId: string;
  maxOperatingHeightMeters: number;
  currentWeightCapacityKg: number;
  operationalStatus: 'in_service' | 'standby' | 'repair' | 'emergency_stop';
  batteryLevel: number;
  lastInspectionDate: string;
  notes?: string;
}