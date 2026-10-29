import React, { useState, useMemo } from 'react';
import { usePpic } from '../../context/PpicContext';
import { WorkOrder, WorkOrderStatus, PriorityLevel } from '../../types/ppic';
import { calculateWorkOrderReadiness } from '../../utils/ppicCalculations';
import { RiskBadge } from '../common/RiskBadge';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  PauseCircle,
  Eye,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const ProductionScheduleView: React.FC = () => {
  const {
    workOrders,
    materials,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    setActiveMenu,
    selectedWorkOrderId,
    setSelectedWorkOrderId,
    activeSearchQuery,
  } = usePpic();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lineFilter, setLineFilter] = useState<string>('ALL');
  const [expandedWoId, setExpandedWoId] = useState<string | null>(selectedWorkOrderId);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New WO Form State
  const [newWoForm, setNewWoForm] = useState<{
    woNumber: string;
    productSku: string;
    productName: string;
    targetQty: number;
    unit: string;
    line: string;
    startDate: string;
    endDate: string;
    priority: PriorityLevel;
    notes: string;
    bomItems: Array<{ materialId: string; qtyPerUnit: number }>;
  }>({
    woNumber: `SPK-2026-${Math.floor(105 + Math.random() * 50)}`,
    productSku: 'FG-LOTION-200',
    productName: 'Moisturizing Body Lotion 200ml',
    targetQty: 5000,
    unit: 'Bottle',
    line: 'Line 2 - High Speed Liquid Bottling',
    startDate: '2026-11-15',
    endDate: '2026-11-17',
    priority: 'Sedang',
    notes: 'Jadwal pesanan batch baru',
    bomItems: [
      { materialId: materials[0]?.id || '', qtyPerUnit: 0.1 },
      { materialId: materials[3]?.id || '', qtyPerUnit: 1.0 },
    ],
  });

  const lines = useMemo(() => {
    const set = new Set(workOrders.map((w) => w.line));
    return Array.from(set);
  }, [workOrders]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
      if (lineFilter !== 'ALL' && wo.line !== lineFilter) return false;
      if (activeSearchQuery) {
        const q = activeSearchQuery.toLowerCase();
        return (
          wo.woNumber.toLowerCase().includes(q) ||
          wo.productName.toLowerCase().includes(q) ||
          wo.productSku.toLowerCase().includes(q) ||
          wo.line.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [workOrders, statusFilter, lineFilter, activeSearchQuery]);

  const handleAddBomItemRow = () => {
    setNewWoForm((prev) => ({
      ...prev,
      bomItems: [...prev.bomItems, { materialId: materials[0]?.id || '', qtyPerUnit: 1 }],
    }));
  };

  const handleRemoveBomItemRow = (idx: number) => {
    setNewWoForm((prev) => ({
      ...prev,
      bomItems: prev.bomItems.filter((_, i) => i !== idx),
    }));
  };

  const handleCreateWo = (e: React.FormEvent) => {
    e.preventDefault();
    const bomBuilt = newWoForm.bomItems
      .map((item) => {
        const mat = materials.find((m) => m.id === item.materialId);
        if (!mat) return null;
        return {
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          qtyPerUnit: item.qtyPerUnit,
          unit: mat.unit,
        };
      })
      .filter(Boolean) as any[];

    addWorkOrder({
      woNumber: newWoForm.woNumber,
      productSku: newWoForm.productSku,
      productName: newWoForm.productName,
      targetQty: Number(newWoForm.targetQty),
      unit: newWoForm.unit,
      line: newWoForm.line,
      startDate: newWoForm.startDate,
      endDate: newWoForm.endDate,
      priority: newWoForm.priority,
      status: 'Terjadwal',
      bom: bomBuilt,
      notes: newWoForm.notes,
    });

    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            Penjadwalan Produksi & Surat Perintah Kerja (SPK)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen urutan proses produksi, lini mesin, dan verifikasi ketersediaan Bill of Materials (BOM).
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Buat Jadwal SPK Baru
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2">Status:</span>
          {['ALL', 'Sedang Berjalan', 'Terjadwal', 'Draft', 'Tertunda', 'Selesai'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>

        {/* Machine line dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Lini Mesin:</span>
          <select
            value={lineFilter}
            onChange={(e) => setLineFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Lini Produksi</option>
            {lines.map((ln) => (
              <option key={ln} value={ln}>
                {ln}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Work Orders List & BOM Readiness Cards */}
      <div className="space-y-4">
        {filteredWorkOrders.map((wo) => {
          const readiness = calculateWorkOrderReadiness(wo, materials);
          const isExpanded = expandedWoId === wo.id;
          const hasShortage = readiness.readinessPercentage < 100;

          return (
            <div
              key={wo.id}
              className={`bg-white rounded-lg border transition-all ${
                hasShortage
                  ? 'border-amber-300 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* WO Main Row */}
              <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      wo.status === 'Sedang Berjalan'
                        ? 'bg-blue-600 text-white'
                        : hasShortage
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <CalendarClock className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {wo.woNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {wo.productSku}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          wo.priority === 'Tinggi'
                            ? 'bg-red-100 text-red-800'
                            : wo.priority === 'Sedang'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Prioritas {wo.priority}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          wo.status === 'Sedang Berjalan'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : wo.status === 'Terjadwal'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : wo.status === 'Tertunda'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {wo.productName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>Lini: <strong className="text-slate-700">{wo.line}</strong></span>
                      <span>Target: <strong className="text-slate-900 font-mono">{wo.targetQty.toLocaleString('id-ID')} {wo.unit}</strong></span>
                      <span>Jadwal: <strong className="text-slate-700 font-mono">{wo.startDate} s/d {wo.endDate}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right readiness & toggles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-slate-500">Kesiapan Material:</span>
                      <span
                        className={`font-bold font-mono text-xs ${
                          readiness.readinessPercentage === 100
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {readiness.readinessPercentage}% Ready
                      </span>
                    </div>
                    <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden ml-auto">
                      <div
                        className={`h-full rounded-full ${
                          readiness.readinessPercentage === 100
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${readiness.readinessPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedWoId(isExpanded ? null : wo.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>Tutup BOM <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Cek BOM ({wo.bom.length} Item) <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>

                    {wo.status === 'Terjadwal' && (
                      <button
                        onClick={() => updateWorkOrder(wo.id, { status: 'Sedang Berjalan' })}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="Mulai Jalankan SPK Ini"
                      >
                        Start Batch
                      </button>
                    )}

                    {wo.status === 'Sedang Berjalan' && (
                      <button
                        onClick={() => updateWorkOrder(wo.id, { status: 'Selesai' })}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                        title="Tandai Selesai Diproduksi"
                      >
                        Selesai
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Bill of Materials Breakdown */}
              {isExpanded && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Rincian Kebutuhan Material (Bill of Materials) untuk {wo.targetQty.toLocaleString('id-ID')} {wo.unit}
                    </div>
                    {hasShortage && (
                      <button
                        onClick={() => setActiveMenu('Material Risk Analysis')}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                      >
                        Buka Solusi Mitigasi Risiko <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto bg-white rounded border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2 px-3">Kode Material</th>
                          <th className="py-2 px-3">Nama Material</th>
                          <th className="py-2 px-3 text-right">Rasio/Unit</th>
                          <th className="py-2 px-3 text-right">Total Butuh</th>
                          <th className="py-2 px-3 text-right">Stok Bebas Tersedia</th>
                          <th className="py-2 px-3 text-right">Defisit Shortage</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {readiness.bomBreakdown.map((item) => (
                          <tr key={item.materialCode} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                              {item.materialCode}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {item.materialName}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500">
                              {item.qtyPerUnit} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              {item.totalRequired.toLocaleString('id-ID')} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {item.availableStock.toLocaleString('id-ID')} {item.unit}
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-mono font-bold ${
                                item.shortage > 0 ? 'text-red-600 bg-red-50/40' : 'text-slate-400'
                              }`}
                            >
                              {item.shortage > 0 ? `-${item.shortage.toLocaleString('id-ID')} ${item.unit}` : '0'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.isReady ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> READY
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                  <Flame className="w-3 h-3 text-red-600" /> SHORTAGE
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {wo.notes && (
                    <div className="mt-3 text-[11px] text-slate-600 italic">
                      Catatan PPIC: {wo.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create New WO Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">Buat Surat Perintah Kerja (SPK) Baru</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWo} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. SPK (Work Order)
                  </label>
                  <input
                    type="text"
                    required
                    value={newWoForm.woNumber}
                    onChange={(e) => setNewWoForm({ ...newWoForm, woNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Produk Jadi (FG)
                  </label>
                  <input
                    type="text"
                    required
                    value={newWoForm.productSku}
                    onChange={(e) => setNewWoForm({ ...newWoForm, productSku: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk Jadi (Finished Good)
                </label>
                <input
                  type="text"
                  required
                  value={newWoForm.productName}
                  onChange={(e) => setNewWoForm({ ...newWoForm, productName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Batch Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newWoForm.targetQty}
                    onChange={(e) =>
                      setNewWoForm({ ...newWoForm, targetQty: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan Output
                  </label>
                  <input
                    type="text"
                    required
                    value={newWoForm.unit}
                    onChange={(e) => setNewWoForm({ ...newWoForm, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={newWoForm.priority}
                    onChange={(e) =>
                      setNewWoForm({ ...newWoForm, priority: e.target.value as PriorityLevel })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Tinggi">Tinggi (High Priority)</option>
                    <option value="Sedang">Sedang (Normal)</option>
                    <option value="Rendah">Rendah (Low Buffer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lini Mesin Produksi
                  </label>
                  <select
                    value={newWoForm.line}
                    onChange={(e) => setNewWoForm({ ...newWoForm, line: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Line 1 - Extrusion Blow Molding Machine #3">
                      Line 1 - Extrusion Blow Molding
                    </option>
                    <option value="Line 2 - High Speed Liquid Bottling">
                      Line 2 - Liquid Bottling
                    </option>
                    <option value="Line 3 - Powder Mixing & Sachet Packing">
                      Line 3 - Powder Mixing
                    </option>
                    <option value="Line 4 - Specialty & Gel Filling Line">
                      Line 4 - Specialty & Gel
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tgl Mulai Produksi
                  </label>
                  <input
                    type="date"
                    required
                    value={newWoForm.startDate}
                    onChange={(e) => setNewWoForm({ ...newWoForm, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tgl Selesai Target
                  </label>
                  <input
                    type="date"
                    required
                    value={newWoForm.endDate}
                    onChange={(e) => setNewWoForm({ ...newWoForm, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* BOM items builder */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900">
                    Konfigurasi Bill of Materials (BOM)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBomItemRow}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Bahan
                  </button>
                </div>

                <div className="space-y-2">
                  {newWoForm.bomItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <select
                        value={item.materialId}
                        onChange={(e) => {
                          const updated = [...newWoForm.bomItems];
                          updated[idx].materialId = e.target.value;
                          setNewWoForm({ ...newWoForm, bomItems: updated });
                        }}
                        className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} - {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-32">
                        <input
                          type="number"
                          step="0.001"
                          min="0.0001"
                          value={item.qtyPerUnit}
                          onChange={(e) => {
                            const updated = [...newWoForm.bomItems];
                            updated[idx].qtyPerUnit = parseFloat(e.target.value) || 0;
                            setNewWoForm({ ...newWoForm, bomItems: updated });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono text-right bg-white"
                          placeholder="Rasio/unit"
                        />
                        <span className="text-[10px] text-slate-500">/unit</span>
                      </div>

                      {newWoForm.bomItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBomItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Khusus PPIC
                </label>
                <textarea
                  rows={2}
                  value={newWoForm.notes}
                  onChange={(e) => setNewWoForm({ ...newWoForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Instruksi khusus operator, target delivery customer, atau ketentuan QC..."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-xs"
                >
                  Simpan & Rilis Jadwal SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
