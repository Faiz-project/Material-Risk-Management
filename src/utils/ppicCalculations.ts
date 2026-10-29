import {
  Material,
  WorkOrder,
  WarehouseStockItem,
  RiskLevel,
  MaterialRiskAssessment,
  ProductionSimulationConfig,
} from '../types/ppic';

/**
 * Calculates risk level based on available stock, scheduled demand, safety buffer,
 * and time remaining until scheduled production start.
 * 
 * Rules:
 * - READY: Available >= Demand + Safety Stock
 * - MEDIUM RISK: Available >= Demand, but falls below Safety Stock
 * - HIGH RISK: Available < Demand, but days until start >= lead time (can expedite)
 * - CRITICAL RISK: Available < Demand and days until start < lead time or < 3 days (line stop imminent!)
 */
export function calculateRiskLevel(
  availableStock: number,
  demand: number,
  safetyStock: number,
  daysUntilStart: number,
  leadTimeDays: number
): RiskLevel {
  const net = availableStock - demand;

  if (net >= safetyStock) {
    return 'READY';
  }

  if (net >= 0) {
    return 'MEDIUM';
  }

  // Deficit exists (net < 0)
  if (daysUntilStart <= 2 || daysUntilStart < leadTimeDays) {
    return 'CRITICAL';
  }

  return 'HIGH';
}

/**
 * Assesses risk for all materials given active production work orders.
 * Takes into account simulation parameters (demand increase, lead time delay, QC transit release).
 */
export function assessAllMaterialsRisk(
  materials: Material[],
  workOrders: WorkOrder[],
  warehouseStock: WarehouseStockItem[],
  simulation: ProductionSimulationConfig = {
    demandMultiplier: 1.0,
    leadTimeDelayDays: 0,
    transferQcTransit: false,
  }
): MaterialRiskAssessment[] {
  const activeWOs = workOrders.filter(
    (wo) => wo.status === 'Terjadwal' || wo.status === 'Sedang Berjalan' || wo.status === 'Draft'
  );

  // Today reference (mocked to realistic baseline)
  const now = new Date();

  return materials.map((material) => {
    // 1. Calculate gross demand across all active work orders for this material
    let totalDemand = 0;
    const affectedWorkOrders: string[] = [];
    let earliestDaysUntilStart = 999;

    for (const wo of activeWOs) {
      const bomEntry = wo.bom.find((b) => b.materialId === material.id || b.materialCode === material.code);
      if (bomEntry) {
        const requiredForWo = bomEntry.qtyPerUnit * wo.targetQty * simulation.demandMultiplier;
        totalDemand += requiredForWo;
        affectedWorkOrders.push(wo.woNumber);

        // Calculate days until WO start
        const startDate = new Date(wo.startDate);
        const diffDays = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        if (diffDays < earliestDaysUntilStart) {
          earliestDaysUntilStart = diffDays;
        }
      }
    }

    if (earliestDaysUntilStart === 999) {
      earliestDaysUntilStart = 14;
    }

    // 2. Compute effective available stock (accounting for QC transit simulation if toggled)
    let effectiveTotalStock = material.totalStock;
    if (simulation.transferQcTransit) {
      const transitStock = warehouseStock
        .filter((item) => (item.materialId === material.id || item.materialCode === material.code) && item.warehouseCode === 'WH-04')
        .reduce((sum, item) => sum + item.qty, 0);
      effectiveTotalStock += transitStock;
    }

    const freeStock = Math.max(0, effectiveTotalStock - material.allocatedStock);
    const effectiveLeadTime = material.leadTimeDays + simulation.leadTimeDelayDays;
    const netGap = freeStock - totalDemand;

    const riskLevel = calculateRiskLevel(
      freeStock,
      totalDemand,
      material.safetyStock,
      earliestDaysUntilStart,
      effectiveLeadTime
    );

    // Days to stockout estimate
    const dailyBurnRate = totalDemand > 0 ? totalDemand / 7 : 1;
    const daysToStockout = totalDemand > 0 ? Math.max(0, Math.round(freeStock / dailyBurnRate)) : 99;

    let recommendedAction = 'Stok dalam batas aman. Siap untuk eksekusi produksi.';
    if (riskLevel === 'CRITICAL') {
      recommendedAction = `SHORTAGE KRITIS (-${Math.abs(Math.round(netGap))} ${material.unit})! Tunda WO ${affectedWorkOrders.join(', ')} atau rilis darurat dari WH Transit / Pinjam vendor.`;
    } else if (riskLevel === 'HIGH') {
      recommendedAction = `Defisit material (${Math.abs(Math.round(netGap))} ${material.unit}). Terbitkan PO Express ke ${material.supplierName} (Lead time: ${effectiveLeadTime} hari).`;
    } else if (riskLevel === 'MEDIUM') {
      recommendedAction = `Stok mencukupi namun di bawah Safety Stock (${material.safetyStock} ${material.unit}). Buat Purchase Requisition reguler.`;
    }

    return {
      materialId: material.id,
      materialCode: material.code,
      materialName: material.name,
      category: material.category,
      unit: material.unit,
      totalStock: effectiveTotalStock,
      allocatedStock: material.allocatedStock,
      freeStock,
      safetyStock: material.safetyStock,
      leadTimeDays: effectiveLeadTime,
      totalDemand: Math.round(totalDemand * 10) / 10,
      netGap: Math.round(netGap * 10) / 10,
      riskLevel,
      affectedWorkOrders,
      daysToStockout,
      recommendedAction,
    };
  });
}

/**
 * Calculates work order readiness and assigns overall risk based on BOM items.
 */
export function calculateWorkOrderReadiness(
  workOrder: WorkOrder,
  materials: Material[]
): {
  bomBreakdown: Array<{
    materialCode: string;
    materialName: string;
    qtyPerUnit: number;
    totalRequired: number;
    availableStock: number;
    shortage: number;
    unit: string;
    isReady: boolean;
  }>;
  overallRisk: RiskLevel;
  readinessPercentage: number;
} {
  const materialsMap = new Map(materials.map((m) => [m.id, m]));
  const materialsByCode = new Map(materials.map((m) => [m.code, m]));

  let readyCount = 0;
  let highestRisk: RiskLevel = 'READY';

  const bomBreakdown = workOrder.bom.map((b) => {
    const mat = materialsMap.get(b.materialId) || materialsByCode.get(b.materialCode);
    const totalRequired = b.qtyPerUnit * workOrder.targetQty;
    const available = mat ? Math.max(0, mat.totalStock - mat.allocatedStock) : 0;
    const shortage = Math.max(0, totalRequired - available);
    const isReady = shortage === 0;

    if (isReady) {
      readyCount++;
    } else {
      if (highestRisk !== 'CRITICAL') {
        highestRisk = shortage > totalRequired * 0.3 ? 'CRITICAL' : 'HIGH';
      }
    }

    return {
      materialCode: b.materialCode,
      materialName: b.materialName,
      qtyPerUnit: b.qtyPerUnit,
      totalRequired,
      availableStock: available,
      shortage,
      unit: b.unit,
      isReady,
    };
  });

  const readinessPercentage =
    workOrder.bom.length > 0 ? Math.round((readyCount / workOrder.bom.length) * 100) : 100;

  return {
    bomBreakdown,
    overallRisk: highestRisk,
    readinessPercentage,
  };
}

/**
 * Computes high-level PPIC KPIs for the executive dashboard
 */
export function calculateOverallPpicKpis(
  materials: Material[],
  workOrders: WorkOrder[],
  riskAssessments: MaterialRiskAssessment[]
) {
  const criticalCount = riskAssessments.filter((r) => r.riskLevel === 'CRITICAL').length;
  const highRiskCount = riskAssessments.filter((r) => r.riskLevel === 'HIGH').length;
  const mediumRiskCount = riskAssessments.filter((r) => r.riskLevel === 'MEDIUM').length;
  const readyCount = riskAssessments.filter((r) => r.riskLevel === 'READY').length;

  const totalMaterials = materials.length;
  const materialReadinessScore = totalMaterials > 0 ? Math.round((readyCount / totalMaterials) * 100) : 100;

  const activeOrders = workOrders.filter((w) => w.status !== 'Selesai');
  const scheduledCount = activeOrders.length;
  const runningCount = workOrders.filter((w) => w.status === 'Sedang Berjalan').length;
  const delayedCount = workOrders.filter((w) => w.status === 'Tertunda').length;

  return {
    criticalCount,
    highRiskCount,
    mediumRiskCount,
    readyCount,
    materialReadinessScore,
    scheduledCount,
    runningCount,
    delayedCount,
    totalStockValuation: materials.reduce((sum, m) => sum + m.totalStock * m.unitPrice, 0),
  };
}
