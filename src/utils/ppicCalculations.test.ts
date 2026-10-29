import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRiskLevel,
  calculateWorkOrderReadiness,
  assessAllMaterialsRisk,
} from './ppicCalculations';
import { Material, WorkOrder } from '../types/ppic';

test('calculateRiskLevel assigns READY when stock exceeds demand + safety stock', () => {
  const result = calculateRiskLevel(1500, 1000, 200, 7, 5);
  assert.equal(result, 'READY');
});

test('calculateRiskLevel assigns MEDIUM when stock satisfies demand but breaches safety stock', () => {
  const result = calculateRiskLevel(1100, 1000, 200, 7, 5);
  assert.equal(result, 'MEDIUM');
});

test('calculateRiskLevel assigns HIGH when deficit exists but lead time is sufficient', () => {
  const result = calculateRiskLevel(800, 1000, 200, 10, 5);
  assert.equal(result, 'HIGH');
});

test('calculateRiskLevel assigns CRITICAL when deficit exists and production starts within lead time or <= 2 days', () => {
  const result = calculateRiskLevel(500, 1000, 200, 2, 5);
  assert.equal(result, 'CRITICAL');
});

test('calculateWorkOrderReadiness accurately computes BOM shortages and overall risk', () => {
  const mockMaterials: Material[] = [
    {
      id: 'm1',
      code: 'RM-01',
      name: 'Resin Polymer',
      category: 'Raw Material',
      unit: 'Kg',
      totalStock: 500,
      allocatedStock: 0,
      safetyStock: 100,
      leadTimeDays: 7,
      supplierName: 'PT Petrokimia',
      defaultWarehouse: 'WH-01',
      unitPrice: 25000,
      minOrderQty: 500,
    },
    {
      id: 'm2',
      code: 'PKG-01',
      name: 'Botol HDPE 250ml',
      category: 'Packaging',
      unit: 'Pcs',
      totalStock: 5000,
      allocatedStock: 0,
      safetyStock: 1000,
      leadTimeDays: 5,
      supplierName: 'PT Plastik Jaya',
      defaultWarehouse: 'WH-02',
      unitPrice: 1500,
      minOrderQty: 1000,
    },
  ];

  const mockWorkOrder: WorkOrder = {
    id: 'wo1',
    woNumber: 'WO-2026-001',
    productSku: 'FG-BOTTLE-A',
    productName: 'Shampoo Antidandruff 250ml',
    targetQty: 1000,
    unit: 'Bottle',
    line: 'Line 1',
    startDate: '2026-11-01',
    endDate: '2026-11-03',
    priority: 'Tinggi',
    status: 'Terjadwal',
    bom: [
      {
        materialId: 'm1',
        materialCode: 'RM-01',
        materialName: 'Resin Polymer',
        qtyPerUnit: 1, // requires 1000 Kg, but stock is only 500 Kg!
        unit: 'Kg',
      },
      {
        materialId: 'm2',
        materialCode: 'PKG-01',
        materialName: 'Botol HDPE 250ml',
        qtyPerUnit: 1, // requires 1000 Pcs, stock is 5000 Pcs (Sufficient)
        unit: 'Pcs',
      },
    ],
  };

  const assessment = calculateWorkOrderReadiness(mockWorkOrder, mockMaterials);
  assert.equal(assessment.readinessPercentage, 50);
  assert.equal(assessment.bomBreakdown[0].isReady, false);
  assert.equal(assessment.bomBreakdown[0].shortage, 500);
  assert.equal(assessment.bomBreakdown[1].isReady, true);
  assert.equal(assessment.bomBreakdown[1].shortage, 0);
  assert.equal(assessment.overallRisk, 'CRITICAL');
});
