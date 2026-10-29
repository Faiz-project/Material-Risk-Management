import React, { useState, useMemo } from 'react';
import { usePpic } from '../../context/PpicContext';
import {
  Warehouse as WarehouseIcon,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  User,
  MapPin,
  Layers,
  X,
  FileCheck2,
} from 'lucide-react';
import { WarehouseStockItem } from '../../types/ppic';

export const WarehouseView: React.FC = () => {
  const {
    warehouses,
    warehouseStock,
    materials,
    transferStock,
    releaseQcTransitItem,
    activeSearchQuery,
  } = usePpic();

  const [selectedWhCode, setSelectedWhCode] = useState<string>('WH-01');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    materialId: '',
    fromWarehouse: 'WH-04',
    toWarehouse: 'WH-01',
    qty: 100,
    reason: 'Pemenuhan Kebutuhan SPK Mendesak',
  });

  const activeWarehouse = warehouses.find((w) => w.code === selectedWhCode) || warehouses[0];

  // Filter stock for the selected warehouse
  const filteredStock = useMemo(() => {
    return warehouseStock.filter((s) => {
      if (s.warehouseCode !== selectedWhCode) return false;
      if (!activeSearchQuery) return true;
      const q = activeSearchQuery.toLowerCase();
      return (
        s.materialCode.toLowerCase().includes(q) ||
        s.materialName.toLowerCase().includes(q) ||
        s.batchLot.toLowerCase().includes(q) ||
        s.binLocation.toLowerCase().includes(q)
      );
    });
  }, [warehouseStock, selectedWhCode, activeSearchQuery]);

  const handleOpenTransferModal = (stockItem?: WarehouseStockItem) => {
    if (stockItem) {
      setTransferForm({
        materialId: stockItem.materialId,
        fromWarehouse: stockItem.warehouseCode,
        toWarehouse: stockItem.warehouseCode === 'WH-04' ? 'WH-01' : 'WH-02',
        qty: stockItem.qty,
        reason:
          stockItem.warehouseCode === 'WH-04'
            ? 'Pelepasan Karantina QC (Release to Production WH)'
            : 'Transfer Buffer Antar Gudang',
      });
    } else {
      setTransferForm({
        materialId: materials[0]?.id || '',
        fromWarehouse: selectedWhCode,
        toWarehouse: selectedWhCode === 'WH-01' ? 'WH-05' : 'WH-01',
        qty: 50,
        reason: 'Alokasi Produksi',
      });
    }
    setTransferFeedback(null);
    setTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const res = transferStock({
      materialId: transferForm.materialId,
      fromWarehouse: transferForm.fromWarehouse,
      toWarehouse: transferForm.toWarehouse,
      qty: Number(transferForm.qty),
      reason: transferForm.reason,
      requestedBy: 'PPIC Planner',
    });

    if (res.success) {
      setTransferFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setTransferModalOpen(false);
      }, 1000);
    } else {
      setTransferFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            Multi-Warehouse Inventory & Inter-WH Transfer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visibilitas stok fisik per lokasi gudang, status batch lot karantina QC, dan transfer material antar gudang.
          </p>
        </div>

        <button
          onClick={() => handleOpenTransferModal()}
          className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transfer Antar Gudang (Inter-WH)
        </button>
      </div>

      {/* Warehouse Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {warehouses.map((wh) => {
          const isSelected = selectedWhCode === wh.code;
          const whItems = warehouseStock.filter((s) => s.warehouseCode === wh.code);
          const totalUnits = whItems.reduce((sum, item) => sum + item.qty, 0);
          const percentage = Math.round((wh.capacityUsed / wh.capacityMax) * 100);

          return (
            <button
              key={wh.code}
              onClick={() => setSelectedWhCode(wh.code)}
              className={`p-3.5 rounded-lg border text-left transition-all relative ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900">
                  {wh.code}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    wh.code === 'WH-04'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {wh.type}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-900 mt-1.5 truncate">
                {wh.name.replace(/\(.*\)/, '')}
              </div>

              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{whItems.length} Batch Item</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {percentage}% Kapasitas
                </span>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    percentage > 85 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Warehouse Detail Card */}
      {activeWarehouse && (
        <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {activeWarehouse.code}
                </span>
                <span className="text-slate-400">·</span>
                <h3 className="font-bold text-base text-white">{activeWarehouse.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {activeWarehouse.location}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  PIC: {activeWarehouse.manager}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeWarehouse.code === 'WH-04' && (
                <div className="px-3 py-1.5 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                  Gudang Karantina & Inbound QC Hold
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock list table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Daftar Stok Fisik di {activeWarehouse.code} ({filteredStock.length} Item)
          </div>

          <div className="text-xs text-slate-500">
            Total Batch: <strong className="text-slate-900 font-mono">{filteredStock.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3.5">Kode Material</th>
                <th className="py-2.5 px-3.5">Nama Material</th>
                <th className="py-2.5 px-3 font-mono">Batch / Lot</th>
                <th className="py-2.5 px-3 font-mono">Bin Lokasi</th>
                <th className="py-2.5 px-3 text-right">Kuantitas Fisik</th>
                <th className="py-2.5 px-3 font-mono">Tgl Kedaluwarsa</th>
                <th className="py-2.5 px-3">Status QC</th>
                <th className="py-2.5 px-3.5 text-center">Aksi PPIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada stok material yang tercatat di gudang ini saat ini.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                      {item.materialCode}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-900">
                      {item.materialName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {item.batchLot}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                      {item.binLocation}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {item.qty.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {item.expiryDate}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.qcStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.qcStatus === 'Quarantine'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.qcStatus === 'Approved' ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        {item.qcStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.warehouseCode === 'WH-04' ? (
                          <button
                            onClick={() => {
                              // If packaging, release to WH-02, otherwise WH-01
                              const targetWh = item.materialCode.startsWith('PKG') ? 'WH-02' : 'WH-01';
                              releaseQcTransitItem(item.id, targetWh);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                          >
                            Rilis QC ke {item.materialCode.startsWith('PKG') ? 'WH-02' : 'WH-01'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenTransferModal(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            Transfer Gudang
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">Transfer Stok Antar Gudang (Inter-WH)</h3>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4">
              {transferFeedback && (
                <div
                  className={`p-3 rounded text-xs flex items-center gap-2 ${
                    transferFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {transferFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{transferFeedback.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Material yang Ditransfer
                </label>
                <select
                  value={transferForm.materialId}
                  onChange={(e) => setTransferForm({ ...transferForm, materialId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gudang Asal (Source WH)
                  </label>
                  <select
                    value={transferForm.fromWarehouse}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, fromWarehouse: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {w.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gudang Tujuan (Destination WH)
                  </label>
                  <select
                    value={transferForm.toWarehouse}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, toWarehouse: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {w.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Kuantitas Transfer
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.qty}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, qty: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan / Referensi Kebutuhan PPIC
                </label>
                <input
                  type="text"
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Pelepasan Karantina QC untuk SPK-2026-102"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-xs"
                >
                  Konfirmasi Transfer Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
