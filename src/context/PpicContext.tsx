import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  Material,
  Warehouse,
  WarehouseStockItem,
  WorkOrder,
  MaterialRiskAssessment,
  StockTransferPayload,
  ProductionSimulationConfig,
} from '../types/ppic';
import {
  INITIAL_MATERIALS,
  INITIAL_WAREHOUSES,
  INITIAL_WAREHOUSE_STOCK,
  INITIAL_WORK_ORDERS,
} from '../data/initialPpicData';
import { assessAllMaterialsRisk, calculateOverallPpicKpis } from '../utils/ppicCalculations';

export type AppMenu =
  | 'Dashboard'
  | 'Upload Excel'
  | 'Rekap Material'
  | 'Warehouse Management'
  | 'Penjadwalan Produksi'
  | 'Material Risk Analysis'
  | 'AI Assistant'
  | 'Pengaturan';

export interface PpicNotification {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface PpicContextType {
  activeMenu: AppMenu;
  setActiveMenu: (menu: AppMenu) => void;
  materials: Material[];
  warehouses: Warehouse[];
  warehouseStock: WarehouseStockItem[];
  workOrders: WorkOrder[];
  simulationConfig: ProductionSimulationConfig;
  setSimulationConfig: React.Dispatch<React.SetStateAction<ProductionSimulationConfig>>;
  riskAssessments: MaterialRiskAssessment[];
  kpis: ReturnType<typeof calculateOverallPpicKpis>;
  notifications: PpicNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  // CRUD & Operations
  addMaterial: (material: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  addWorkOrder: (wo: Omit<WorkOrder, 'id'>) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  transferStock: (payload: StockTransferPayload) => { success: boolean; message: string };
  releaseQcTransitItem: (stockId: string, toWarehouseCode: string) => void;
  importPpicData: (data: {
    materials?: Material[];
    workOrders?: WorkOrder[];
    warehouseStock?: WarehouseStockItem[];
  }) => void;
  resetToInitialData: () => void;
  selectedWorkOrderId: string | null;
  setSelectedWorkOrderId: (id: string | null) => void;
  activeSearchQuery: string;
  setActiveSearchQuery: (q: string) => void;
}

const PpicContext = createContext<PpicContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ppic_material_system_v1';

export const PpicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<AppMenu>('Dashboard');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  // Main state from local storage or fallback to initial
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_materials`);
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_warehouses`);
      return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
    } catch {
      return INITIAL_WAREHOUSES;
    }
  });

  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_stock`);
      return saved ? JSON.parse(saved) : INITIAL_WAREHOUSE_STOCK;
    } catch {
      return INITIAL_WAREHOUSE_STOCK;
    }
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_workorders`);
      return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
    } catch {
      return INITIAL_WORK_ORDERS;
    }
  });

  const [simulationConfig, setSimulationConfig] = useState<ProductionSimulationConfig>({
    demandMultiplier: 1.0,
    leadTimeDelayDays: 0,
    transferQcTransit: false,
  });

  const [notifications, setNotifications] = useState<PpicNotification[]>([
    {
      id: 'notif-1',
      type: 'critical',
      title: 'Shortage Kritis: Botol HDPE 250ml',
      message: 'SPK-2026-102 membutuhkan 8,000 Pcs tetapi free stock hanya 2,500 Pcs. Perlu tindakan segera!',
      timestamp: '10 menit yang lalu',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'critical',
      title: 'Defisit Material: Sodium Lauryl Sulfate',
      message: 'Akumulasi kebutuhan SLS mencapai 2,200 Kg vs total stok 1,800 Kg. 1,000 Kg menunggu di WH-04 Transit QC.',
      timestamp: '25 menit yang lalu',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'warning',
      title: 'Preservative Phenoxyethanol Di Bawah Safety Stock',
      message: 'Sisa stok setelah alokasi SPK hanya tersisa 10 Kg (Safety stock: 60 Kg).',
      timestamp: '1 jam yang lalu',
      read: false,
    },
  ]);

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_materials`, JSON.stringify(materials));
    } catch (e) {
      console.error(e);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_warehouses`, JSON.stringify(warehouses));
    } catch (e) {
      console.error(e);
    }
  }, [warehouses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_stock`, JSON.stringify(warehouseStock));
    } catch (e) {
      console.error(e);
    }
  }, [warehouseStock]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_workorders`, JSON.stringify(workOrders));
    } catch (e) {
      console.error(e);
    }
  }, [workOrders]);

  // Reactive Risk Assessment & KPIs
  const riskAssessments = useMemo(() => {
    return assessAllMaterialsRisk(materials, workOrders, warehouseStock, simulationConfig);
  }, [materials, workOrders, warehouseStock, simulationConfig]);

  const kpis = useMemo(() => {
    return calculateOverallPpicKpis(materials, workOrders, riskAssessments);
  }, [materials, workOrders, riskAssessments]);

  // Re-calculate allocatedStock for materials based on active work orders
  useEffect(() => {
    setMaterials((prevMaterials) => {
      const activeWOs = workOrders.filter((w) => w.status !== 'Selesai');
      return prevMaterials.map((mat) => {
        let totalAllocated = 0;
        for (const wo of activeWOs) {
          const b = wo.bom.find((item) => item.materialId === mat.id || item.materialCode === mat.code);
          if (b) {
            totalAllocated += b.qtyPerUnit * wo.targetQty;
          }
        }
        return {
          ...mat,
          allocatedStock: totalAllocated,
        };
      });
    });
  }, [workOrders]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addMaterial = (newMat: Omit<Material, 'id'>) => {
    const id = `mat-${Date.now()}`;
    setMaterials((prev) => [...prev, { ...newMat, id }]);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const addWorkOrder = (newWo: Omit<WorkOrder, 'id'>) => {
    const id = `wo-${Date.now()}`;
    setWorkOrders((prev) => [
      {
        ...newWo,
        id,
      },
      ...prev,
    ]);
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteWorkOrder = (id: string) => {
    setWorkOrders((prev) => prev.filter((w) => w.id !== id));
  };

  const transferStock = (payload: StockTransferPayload): { success: boolean; message: string } => {
    const { materialId, fromWarehouse, toWarehouse, qty, reason } = payload;
    if (fromWarehouse === toWarehouse) {
      return { success: false, message: 'Gudang asal dan tujuan tidak boleh sama.' };
    }
    if (qty <= 0) {
      return { success: false, message: 'Jumlah transfer harus lebih dari 0.' };
    }

    // Find stock items in fromWarehouse
    const sourceStock = warehouseStock.find(
      (s) => (s.materialId === materialId || s.materialCode === materialId) && s.warehouseCode === fromWarehouse
    );

    if (!sourceStock || sourceStock.qty < qty) {
      return {
        success: false,
        message: `Stok di gudang asal (${fromWarehouse}) tidak mencukupi. Tersedia: ${sourceStock ? sourceStock.qty : 0}.`,
      };
    }

    // Material details
    const mat = materials.find((m) => m.id === materialId || m.code === materialId);
    if (!mat) {
      return { success: false, message: 'Material tidak ditemukan.' };
    }

    // Update warehouse stock array
    setWarehouseStock((prev) => {
      const updated = prev.map((item) => {
        if (item.id === sourceStock.id) {
          return { ...item, qty: item.qty - qty };
        }
        return item;
      });

      // Find or create in destination warehouse
      const destIndex = updated.findIndex(
        (s) => (s.materialId === materialId || s.materialCode === materialId) && s.warehouseCode === toWarehouse
      );

      if (destIndex >= 0) {
        updated[destIndex] = {
          ...updated[destIndex],
          qty: updated[destIndex].qty + qty,
          qcStatus: toWarehouse === 'WH-04' ? 'Quarantine' : 'Approved',
        };
      } else {
        updated.push({
          id: `stk-${Date.now()}`,
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          warehouseCode: toWarehouse,
          batchLot: sourceStock.batchLot,
          qty,
          unit: mat.unit,
          binLocation: `${toWarehouse.replace('WH-0', '')}-GEN-01`,
          expiryDate: sourceStock.expiryDate,
          qcStatus: toWarehouse === 'WH-04' ? 'Quarantine' : 'Approved',
        });
      }

      return updated.filter((item) => item.qty > 0);
    });

    // If transferred from QC Hold/Transit (WH-04) to primary (WH-01 or WH-02), add to available totalStock
    if (fromWarehouse === 'WH-04' && (toWarehouse === 'WH-01' || toWarehouse === 'WH-02')) {
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, totalStock: m.totalStock + qty } : m))
      );
    }

    // Add activity notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'info',
        title: `Transfer Gudang Berhasil: ${mat.code}`,
        message: `Dipindahkan ${qty} ${mat.unit} dari ${fromWarehouse} ke ${toWarehouse}. Alasan: ${reason}.`,
        timestamp: 'Baru saja',
        read: false,
      },
      ...prev,
    ]);

    return { success: true, message: `Berhasil mentransfer ${qty} ${mat.unit} ke ${toWarehouse}.` };
  };

  const releaseQcTransitItem = (stockId: string, toWarehouseCode: string) => {
    const item = warehouseStock.find((s) => s.id === stockId);
    if (!item) return;

    transferStock({
      materialId: item.materialId,
      fromWarehouse: item.warehouseCode,
      toWarehouse: toWarehouseCode,
      qty: item.qty,
      reason: 'Pelepasan Karantina Mutu (QC Released)',
      requestedBy: 'QC Inbound Lead',
    });
  };

  const importPpicData = (data: {
    materials?: Material[];
    workOrders?: WorkOrder[];
    warehouseStock?: WarehouseStockItem[];
  }) => {
    if (data.materials && data.materials.length > 0) {
      setMaterials(data.materials);
    }
    if (data.workOrders && data.workOrders.length > 0) {
      setWorkOrders(data.workOrders);
    }
    if (data.warehouseStock && data.warehouseStock.length > 0) {
      setWarehouseStock(data.warehouseStock);
    }

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'info',
        title: 'Impor Data Excel Selesai',
        message: 'Data master material, rekap gudang, dan jadwal SPK berhasil disinkronkan.',
        timestamp: 'Baru saja',
        read: false,
      },
      ...prev,
    ]);
  };

  const resetToInitialData = () => {
    setMaterials(INITIAL_MATERIALS);
    setWarehouses(INITIAL_WAREHOUSES);
    setWarehouseStock(INITIAL_WAREHOUSE_STOCK);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setSimulationConfig({
      demandMultiplier: 1.0,
      leadTimeDelayDays: 0,
      transferQcTransit: false,
    });
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_materials`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_warehouses`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_stock`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_workorders`);
  };

  return (
    <PpicContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        materials,
        warehouses,
        warehouseStock,
        workOrders,
        simulationConfig,
        setSimulationConfig,
        riskAssessments,
        kpis,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        transferStock,
        releaseQcTransitItem,
        importPpicData,
        resetToInitialData,
        selectedWorkOrderId,
        setSelectedWorkOrderId,
        activeSearchQuery,
        setActiveSearchQuery,
      }}
    >
      {children}
    </PpicContext.Provider>
  );
};

export const usePpic = () => {
  const context = useContext(PpicContext);
  if (!context) {
    throw new Error('usePpic must be used within a PpicProvider');
  }
  return context;
};
