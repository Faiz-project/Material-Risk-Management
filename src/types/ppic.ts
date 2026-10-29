export type MaterialCategory = 'Raw Material' | 'Packaging' | 'Chemical' | 'Auxiliary';

export type MaterialUnit = 'Kg' | 'Pcs' | 'Roll' | 'Drum' | 'Box' | 'Liter';

export type RiskLevel = 'READY' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  totalStock: number;
  allocatedStock: number;
  safetyStock: number;
  leadTimeDays: number;
  supplierName: string;
  defaultWarehouse: string;
  unitPrice: number; // in IDR
  minOrderQty: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string;
  capacityMax: number;
  capacityUsed: number;
  manager: string;
}

export interface WarehouseStockItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  warehouseCode: string;
  batchLot: string;
  qty: number;
  unit: MaterialUnit;
  binLocation: string;
  expiryDate: string;
  qcStatus: 'Approved' | 'Quarantine' | 'Rejected';
}

export interface BomItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  qtyPerUnit: number;
  unit: MaterialUnit;
}

export interface WorkOrderBomItem extends BomItem {
  totalRequired: number;
  currentAvailable: number;
  shortage: number;
  riskLevel: RiskLevel;
}

export type WorkOrderStatus = 'Draft' | 'Terjadwal' | 'Sedang Berjalan' | 'Selesai' | 'Tertunda';
export type PriorityLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export interface WorkOrder {
  id: string;
  woNumber: string;
  productSku: string;
  productName: string;
  targetQty: number;
  unit: string;
  line: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  priority: PriorityLevel;
  status: WorkOrderStatus;
  bom: BomItem[];
  overallRisk?: RiskLevel;
  notes?: string;
}

export interface MaterialRiskAssessment {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  totalStock: number;
  allocatedStock: number;
  freeStock: number;
  safetyStock: number;
  leadTimeDays: number;
  totalDemand: number;
  netGap: number; // freeStock - totalDemand
  riskLevel: RiskLevel;
  affectedWorkOrders: string[];
  daysToStockout: number;
  recommendedAction: string;
}

export interface StockTransferPayload {
  materialId: string;
  fromWarehouse: string;
  toWarehouse: string;
  qty: number;
  batchLot?: string;
  reason: string;
  requestedBy: string;
}

export interface ProductionSimulationConfig {
  demandMultiplier: number; // e.g. 1.0 = 100%, 1.2 = +20%
  leadTimeDelayDays: number; // e.g. 0, 3, 5, 7 days delay
  transferQcTransit: boolean; // release QC Transit stock into RM WH
}
