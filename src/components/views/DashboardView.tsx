import React from 'react';
import { usePpic } from '../../context/PpicContext';
import { RiskBadge } from '../common/RiskBadge';
import {
  CalendarClock,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Warehouse,
  Boxes,
  FileSpreadsheet,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    kpis,
    riskAssessments,
    workOrders,
    warehouses,
    setActiveMenu,
    setSelectedWorkOrderId,
    transferStock,
  } = usePpic();

  // Top critical materials needing immediate PPIC attention
  const criticalItems = riskAssessments.filter(
    (r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH'
  );

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Plant Overview & Operational Summary */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl shadow-xs border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              PPIC Command Center · Plant Cikarang 1
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Monitoring Kesiapan Material & Risiko Produksi
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
              Sistem mendeteksi <strong className="text-red-400">{kpis.criticalCount} material kritis</strong> yang berpotensi menyebabkan downtime lini perakitan dalam 7 hari ke depan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveMenu('Material Risk Analysis')}
              className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              Tinjau {kpis.criticalCount} Material Kritis
            </button>
            <button
              onClick={() => setActiveMenu('AI Assistant')}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Konsultasi AI PPIC
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Readiness Score */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Material Readiness</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                kpis.materialReadinessScore >= 80
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {kpis.materialReadinessScore >= 80 ? 'Optimal' : 'Perlu Perhatian'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {kpis.materialReadinessScore}%
            </span>
            <span className="text-xs text-slate-500">dari total BOM terjadwal</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kpis.materialReadinessScore >= 80
                  ? 'bg-emerald-500'
                  : kpis.materialReadinessScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${kpis.materialReadinessScore}%` }}
            />
          </div>
        </div>

        {/* Card 2: Work Orders */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jadwal SPK / Work Order</span>
            <CalendarClock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {kpis.scheduledCount}
            </span>
            <span className="text-xs text-slate-500">batch aktif</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span>Berjalan: <strong className="text-blue-700">{kpis.runningCount}</strong></span>
            <span>Tertunda: <strong className="text-amber-700">{kpis.delayedCount}</strong></span>
          </div>
        </div>

        {/* Card 3: Critical Material Risk */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Status Risiko Material</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600 tabular-nums">
              {kpis.criticalCount}
            </span>
            <span className="text-xs text-red-600 font-medium">Kritis Shortage</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span>High: <strong className="text-orange-600">{kpis.highRiskCount}</strong></span>
            <span>Medium: <strong className="text-amber-600">{kpis.mediumRiskCount}</strong></span>
            <span>Ready: <strong className="text-emerald-600">{kpis.readyCount}</strong></span>
          </div>
        </div>

        {/* Card 4: Inventory Valuation */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Valuasi Stok Material</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {formatIdr(kpis.totalStockValuation)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
            <span>5 Gudang Aktif</span>
            <span className="text-emerald-600 font-medium">Terverifikasi ERP</span>
          </div>
        </div>
      </div>

      {/* Critical Shortage Alert Box (Immediate Action Required) */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50/60 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-red-950">
                Peringatan Defisit Material Kritis ({criticalItems.length} Item Menuntut Tindakan Segera)
              </h3>
            </div>
            <button
              onClick={() => setActiveMenu('Material Risk Analysis')}
              className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1"
            >
              Lihat Analisis Mendalam <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalItems.slice(0, 4).map((item) => (
              <div
                key={item.materialId}
                className="bg-white p-3.5 rounded border border-red-100 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.materialCode}
                        </span>
                        <RiskBadge level={item.riskLevel} size="sm" />
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        {item.materialName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-50 rounded text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Stok Bebas:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {item.freeStock} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kebutuhan SPK:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {item.totalDemand} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-red-500 font-semibold block">Defisit Gap:</span>
                      <span className="font-mono font-bold text-red-600">
                        {item.netGap} {item.unit}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    <strong className="text-slate-800">Rekomendasi:</strong> {item.recommendedAction}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Mempengaruhi SPK: <strong>{item.affectedWorkOrders.join(', ')}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (item.materialCode === 'PKG-BOT-250') {
                        transferStock({
                          materialId: item.materialId,
                          fromWarehouse: 'WH-04',
                          toWarehouse: 'WH-02',
                          qty: 15000,
                          reason: 'Rilis Cepat QC Inbound untuk Memenuhi SPK-2026-102',
                          requestedBy: 'Budi Santoso (PPIC Lead)',
                        });
                      } else if (item.materialCode === 'RM-SLS-02') {
                        transferStock({
                          materialId: item.materialId,
                          fromWarehouse: 'WH-04',
                          toWarehouse: 'WH-01',
                          qty: 1000,
                          reason: 'Rilis Bahan Baku SLS Karantina QC',
                          requestedBy: 'Budi Santoso (PPIC Lead)',
                        });
                      } else {
                        setActiveMenu('Material Risk Analysis');
                      }
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded transition-colors"
                  >
                    Eksekusi Rilis WH Transit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Production Schedule Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Jadwal Eksekusi Produksi (Work Orders)
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar SPK yang sedang dipantau kesiapan materialnya oleh tim PPIC
                </p>
              </div>
              <button
                onClick={() => setActiveMenu('Penjadwalan Produksi')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Lihat Seluruh SPK <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-4">No. SPK</th>
                    <th className="py-2.5 px-4">Produk / SKU</th>
                    <th className="py-2.5 px-4">Lini Mesin</th>
                    <th className="py-2.5 px-4 text-right">Target Batch</th>
                    <th className="py-2.5 px-4">Tgl Mulai</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Aksi PPIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrders.map((wo) => {
                    const isDeficitWo = wo.woNumber === 'SPK-2026-102';
                    return (
                      <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {wo.woNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{wo.productName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{wo.productSku}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                          {wo.line}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {wo.targetQty.toLocaleString('id-ID')} {wo.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {wo.startDate}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              wo.status === 'Sedang Berjalan'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : wo.status === 'Terjadwal'
                                ? isDeficitWo
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedWorkOrderId(wo.id);
                              setActiveMenu('Penjadwalan Produksi');
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                          >
                            Cek BOM
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Warehouse Capacity & Quick Actions */}
        <div className="space-y-6">
          {/* Warehouse Occupancy Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Status Kapasitas Gudang (WH)
                </h3>
                <p className="text-xs text-slate-500">
                  Monitoring beban penyimpanan per gudang
                </p>
              </div>
              <Warehouse className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3.5">
              {warehouses.map((wh) => {
                const percentage = Math.round((wh.capacityUsed / wh.capacityMax) * 100);
                return (
                  <div key={wh.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {wh.code} - {wh.type}
                      </span>
                      <span className="font-mono text-slate-500">
                        {percentage}% ({wh.capacityUsed.toLocaleString()} / {wh.capacityMax.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentage > 85
                            ? 'bg-red-500'
                            : percentage > 70
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
              <button
                onClick={() => setActiveMenu('Warehouse Management')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Buka Manajemen Gudang & Transfer <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Jalan Pintas Operasional PPIC
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveMenu('Upload Excel')}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-md transition-colors group"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                  Upload Excel
                </div>
                <div className="text-[10px] text-slate-500">
                  Sinkronisasi BOM & Stok
                </div>
              </button>

              <button
                onClick={() => setActiveMenu('Rekap Material')}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-md transition-colors group"
              >
                <Boxes className="w-4 h-4 text-blue-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                  Rekap Material
                </div>
                <div className="text-[10px] text-slate-500">
                  Katalog Master Stok
                </div>
              </button>

              <button
                onClick={() => setActiveMenu('Penjadwalan Produksi')}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-md transition-colors group"
              >
                <CalendarClock className="w-4 h-4 text-purple-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                  Buat SPK Baru
                </div>
                <div className="text-[10px] text-slate-500">
                  Jadwalkan Lini Mesin
                </div>
              </button>

              <button
                onClick={() => setActiveMenu('AI Assistant')}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-md transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-amber-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                  AI Consultant
                </div>
                <div className="text-[10px] text-slate-500">
                  Solusi Reschedule
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
