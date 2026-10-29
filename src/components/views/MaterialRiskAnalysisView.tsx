import React, { useState } from 'react';
import { usePpic } from '../../context/PpicContext';
import { RiskBadge } from '../common/RiskBadge';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  Building,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { RiskLevel } from '../../types/ppic';

export const MaterialRiskAnalysisView: React.FC = () => {
  const {
    riskAssessments,
    simulationConfig,
    setSimulationConfig,
    transferStock,
    setActiveMenu,
    kpis,
  } = usePpic();

  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const filteredAssessments = riskAssessments.filter((r) => {
    if (filterRisk === 'ALL') return true;
    return r.riskLevel === filterRisk;
  });

  const resetSimulation = () => {
    setSimulationConfig({
      demandMultiplier: 1.0,
      leadTimeDelayDays: 0,
      transferQcTransit: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Material Risk Analysis & What-If Production Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Mesin analitik risiko otomatis yang mengomparasikan saldo stok bebas, ambang batas safety stock, alokasi kebutuhan SPK, dan lead time pengiriman untuk memprediksi potensi <em>Line Stop</em> sebelum produksi dimulai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('AI Assistant')}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            Analisis AI untuk Solusi Shortage
          </button>
        </div>
      </div>

      {/* What-If Scenario Simulation Console */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold tracking-wide">
              Panel Simulasi Risiko (What-If Scenario Simulator)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetSimulation}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Baseline Nyata
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Scenario 1: Demand Surge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">1. Lonjakan Kebutuhan Produksi</span>
              <span className="font-mono text-blue-400 font-bold">
                {Math.round(simulationConfig.demandMultiplier * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Normal (100%)', val: 1.0 },
                { label: '+20% Demand', val: 1.2 },
                { label: '+50% Ekstrem', val: 1.5 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() =>
                    setSimulationConfig((prev) => ({ ...prev, demandMultiplier: btn.val }))
                  }
                  className={`py-1.5 px-2 text-[11px] font-medium rounded transition-colors ${
                    simulationConfig.demandMultiplier === btn.val
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario 2: Supplier Delay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">2. Keterlambatan Pengiriman Vendor</span>
              <span className="font-mono text-amber-400 font-bold">
                +{simulationConfig.leadTimeDelayDays} Hari
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Tepat Waktu', days: 0 },
                { label: '+3 Hari', days: 3 },
                { label: '+7 Hari', days: 7 },
              ].map((btn) => (
                <button
                  key={btn.days}
                  onClick={() =>
                    setSimulationConfig((prev) => ({ ...prev, leadTimeDelayDays: btn.days }))
                  }
                  className={`py-1.5 px-2 text-[11px] font-medium rounded transition-colors ${
                    simulationConfig.leadTimeDelayDays === btn.days
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario 3: Release QC Transit Stock */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">3. Pelepasan Stok Karantina (WH-04)</span>
              <span
                className={`font-mono text-xs font-bold ${
                  simulationConfig.transferQcTransit ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {simulationConfig.transferQcTransit ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <button
              onClick={() =>
                setSimulationConfig((prev) => ({
                  ...prev,
                  transferQcTransit: !prev.transferQcTransit,
                }))
              }
              className={`w-full py-2 px-3 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2 ${
                simulationConfig.transferQcTransit
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {simulationConfig.transferQcTransit
                ? 'Stok Transit QC Dimasukkan ke Saldo'
                : 'Simulasikan Rilis Cepat QC Inbound'}
            </button>
          </div>
        </div>
      </div>

      {/* 4-Tier Risk Summary Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Ready */}
        <button
          onClick={() => setFilterRisk(filterRisk === 'READY' ? 'ALL' : 'READY')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filterRisk === 'READY'
              ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
              : 'border-slate-200 bg-white hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <RiskBadge level="READY" size="sm" />
            <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">
              {kpis.readyCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Stok bebas &gt;= Kebutuhan + Safety Stock.
          </p>
        </button>

        {/* Medium Risk */}
        <button
          onClick={() => setFilterRisk(filterRisk === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filterRisk === 'MEDIUM'
              ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
              : 'border-slate-200 bg-white hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <RiskBadge level="MEDIUM" size="sm" />
            <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">
              {kpis.mediumRiskCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mencukupi SPK namun di bawah Safety Stock.
          </p>
        </button>

        {/* High Risk */}
        <button
          onClick={() => setFilterRisk(filterRisk === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filterRisk === 'HIGH'
              ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
              : 'border-slate-200 bg-white hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <RiskBadge level="HIGH" size="sm" />
            <span className="text-xl font-bold font-mono text-orange-800 tabular-nums">
              {kpis.highRiskCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Defisit stok, namun lead time masih terjangkau.
          </p>
        </button>

        {/* Critical Risk */}
        <button
          onClick={() => setFilterRisk(filterRisk === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filterRisk === 'CRITICAL'
              ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
              : 'border-slate-200 bg-white hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <RiskBadge level="CRITICAL" size="sm" />
            <span className="text-xl font-bold font-mono text-red-800 tabular-nums">
              {kpis.criticalCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Stok habis / line stop dalam 1-3 hari ke depan!
          </p>
        </button>
      </div>

      {/* Main Material Risk Matrix Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Matriks Kesiapan Material & Kebutuhan SPK ({filteredAssessments.length} Material)
            </h3>
            {filterRisk !== 'ALL' && (
              <span className="text-xs text-blue-600 font-semibold cursor-pointer underline" onClick={() => setFilterRisk('ALL')}>
                Reset Filter
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Readiness Index: <strong className="text-slate-900">{kpis.materialReadinessScore}%</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Kode & Nama Material</th>
                <th className="py-3 px-3 text-right">Stok Bebas</th>
                <th className="py-3 px-3 text-right">Kebutuhan SPK</th>
                <th className="py-3 px-3 text-right">Net Gap (Defisit)</th>
                <th className="py-3 px-3 text-right">Safety Buffer</th>
                <th className="py-3 px-3 text-center">Lead Time</th>
                <th className="py-3 px-3.5">SPK Terdampak</th>
                <th className="py-3 px-3.5">Rekomendasi Tindakan PPIC</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssessments.map((item) => {
                const isCritical = item.riskLevel === 'CRITICAL';
                const isHigh = item.riskLevel === 'HIGH';

                return (
                  <tr
                    key={item.materialId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isCritical ? 'bg-red-50/30' : isHigh ? 'bg-orange-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5">
                      <RiskBadge level={item.riskLevel} size="sm" />
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-slate-900">{item.materialCode}</div>
                      <div className="text-[11px] text-slate-700">{item.materialName}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {item.freeStock.toLocaleString('id-ID')} {item.unit}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {item.totalDemand.toLocaleString('id-ID')} {item.unit}
                    </td>

                    <td
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        item.netGap < 0
                          ? 'text-red-600 bg-red-100/50'
                          : item.netGap < item.safetyStock
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.netGap < 0 ? `${item.netGap.toLocaleString('id-ID')} ${item.unit}` : `+${item.netGap.toLocaleString('id-ID')} ${item.unit}`}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {item.safetyStock.toLocaleString('id-ID')} {item.unit}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {item.leadTimeDays} Hari
                    </td>

                    <td className="py-3 px-3.5">
                      {item.affectedWorkOrders.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.affectedWorkOrders.map((woNum) => (
                            <span
                              key={woNum}
                              className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold"
                            >
                              {woNum}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 max-w-xs text-[11px] text-slate-700 leading-snug">
                      {item.recommendedAction}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      {item.materialCode === 'PKG-BOT-250' || item.materialCode === 'RM-SLS-02' ? (
                        <button
                          onClick={() => {
                            if (item.materialCode === 'PKG-BOT-250') {
                              transferStock({
                                materialId: item.materialId,
                                fromWarehouse: 'WH-04',
                                toWarehouse: 'WH-02',
                                qty: 15000,
                                reason: 'Rilis Cepat QC Inbound untuk SPK-2026-102',
                                requestedBy: 'Budi Santoso',
                              });
                            } else {
                              transferStock({
                                materialId: item.materialId,
                                fromWarehouse: 'WH-04',
                                toWarehouse: 'WH-01',
                                qty: 1000,
                                reason: 'Rilis Cepat QC Inbound SLS',
                                requestedBy: 'Budi Santoso',
                              });
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded transition-colors whitespace-nowrap"
                        >
                          Rilis WH Transit
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveMenu('Warehouse Management')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                        >
                          Cek Gudang
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
