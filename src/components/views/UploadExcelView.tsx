import React, { useState } from 'react';
import { usePpic } from '../../context/PpicContext';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Material, WorkOrder, WarehouseStockItem } from '../../types/ppic';

export const UploadExcelView: React.FC = () => {
  const { materials, workOrders, warehouseStock, importPpicData, setActiveMenu } = usePpic();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    materials?: Material[];
    workOrders?: WorkOrder[];
    warehouseStock?: WarehouseStockItem[];
    rawRows?: any[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'template'>('preview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle real file upload & parsing
  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setStatusMessage('Membaca berkas Excel...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        // Parse sheets
        const sheetName = workbook.SheetNames[0];
        const rawJson = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Attempt smart mapping: detect if this is material or work order
        const mappedMaterials: Material[] = [];

        rawJson.forEach((row: any, idx: number) => {
          const code = row['Kode Material'] || row['Material Code'] || row['code'] || `RM-IMP-${idx + 1}`;
          const name = row['Nama Material'] || row['Material Name'] || row['name'] || `Material Impor ${idx + 1}`;
          const category = (row['Kategori'] || row['Category'] || 'Raw Material') as any;
          const unit = (row['Satuan'] || row['Unit'] || 'Kg') as any;
          const totalStock = parseFloat(row['Total Stok'] || row['Total Stock'] || row['stok'] || 1000);
          const allocatedStock = parseFloat(row['Alokasi SPK'] || row['Allocated'] || 0);
          const safetyStock = parseFloat(row['Safety Stock'] || row['Min Stock'] || 200);
          const leadTimeDays = parseInt(row['Lead Time (Hari)'] || row['Lead Time'] || 7, 10);
          const supplierName = row['Supplier'] || row['Vendor'] || 'PT Supplier Nasional';
          const defaultWarehouse = row['Gudang Utama'] || row['WH'] || 'WH-01';
          const unitPrice = parseFloat(row['Harga Satuan (IDR)'] || row['Price'] || 25000);

          mappedMaterials.push({
            id: `mat-imp-${idx}-${Date.now()}`,
            code: String(code).trim(),
            name: String(name).trim(),
            category,
            unit,
            totalStock,
            allocatedStock,
            safetyStock,
            leadTimeDays,
            supplierName,
            defaultWarehouse,
            unitPrice,
            minOrderQty: 500,
          });
        });

        setParsedData({
          materials: mappedMaterials,
          rawRows: rawJson,
        });

        setStatusMessage(
          `Berhasil membaca ${rawJson.length} baris dari lembar kerja "${sheetName}". Periksa pratinjau di bawah sebelum menerapkan.`
        );
      } catch (err: any) {
        console.error(err);
        setStatusMessage(`Gagal membaca file Excel: ${err.message || 'Format tidak valid'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 1-Click Load Realistic Sample Excel Data
  const loadRealisticSampleExcel = () => {
    setFileName('PPIC_Master_Production_Q4_2026.xlsx');
    const demoMaterials: Material[] = [
      {
        id: 'mat-demo-1',
        code: 'RM-RESIN-01',
        name: 'Polypropylene Copolymer (PP Blow Grade)',
        category: 'Raw Material',
        unit: 'Kg',
        totalStock: 3500,
        allocatedStock: 2500,
        safetyStock: 1200,
        leadTimeDays: 7,
        supplierName: 'PT Chandra Asri Petrochemical Tbk',
        defaultWarehouse: 'WH-01',
        unitPrice: 28500,
        minOrderQty: 2000,
      },
      {
        id: 'mat-demo-2',
        code: 'RM-SLS-02',
        name: 'Sodium Lauryl Sulfate (SLS 70% Paste)',
        category: 'Raw Material',
        unit: 'Kg',
        totalStock: 1800,
        allocatedStock: 2400,
        safetyStock: 800,
        leadTimeDays: 5,
        supplierName: 'PT BASF Indonesia',
        defaultWarehouse: 'WH-01',
        unitPrice: 34000,
        minOrderQty: 1000,
      },
      {
        id: 'mat-demo-3',
        code: 'PKG-BOT-250',
        name: 'Botol HDPE 250ml White Pearl (Neck 24/410)',
        category: 'Packaging',
        unit: 'Pcs',
        totalStock: 12500,
        allocatedStock: 18000,
        safetyStock: 5000,
        leadTimeDays: 6,
        supplierName: 'PT Sanpak Unggul',
        defaultWarehouse: 'WH-02',
        unitPrice: 1450,
        minOrderQty: 10000,
      },
      {
        id: 'mat-demo-4',
        code: 'PKG-CAP-FLIP',
        name: 'Flip Top Cap 24/410 Deep Blue Glossy',
        category: 'Packaging',
        unit: 'Pcs',
        totalStock: 24000,
        allocatedStock: 18000,
        safetyStock: 4000,
        leadTimeDays: 4,
        supplierName: 'PT Dynaplast',
        defaultWarehouse: 'WH-02',
        unitPrice: 480,
        minOrderQty: 5000,
      },
      {
        id: 'mat-demo-5',
        code: 'CHM-FRAG-OCEAN',
        name: 'Fragrance Fragrance Oil Oceanic Fresh Grade AA',
        category: 'Chemical',
        unit: 'Kg',
        totalStock: 320,
        allocatedStock: 200,
        safetyStock: 80,
        leadTimeDays: 14,
        supplierName: 'PT Givaudan Indonesia',
        defaultWarehouse: 'WH-03',
        unitPrice: 420000,
        minOrderQty: 50,
      },
      {
        id: 'mat-demo-6',
        code: 'CHM-PRSV-PHENO',
        name: 'Preservative Phenoxyethanol + Ethylhexylglycerin',
        category: 'Chemical',
        unit: 'Kg',
        totalStock: 150,
        allocatedStock: 135,
        safetyStock: 60,
        leadTimeDays: 10,
        supplierName: 'PT Clariant Indonesia',
        defaultWarehouse: 'WH-03',
        unitPrice: 195000,
        minOrderQty: 50,
      },
      {
        id: 'mat-demo-7',
        code: 'PKG-BOX-MSTR',
        name: 'Master Corrugated Carton Box K150 (Isi 48)',
        category: 'Packaging',
        unit: 'Box',
        totalStock: 900,
        allocatedStock: 450,
        safetyStock: 300,
        leadTimeDays: 3,
        supplierName: 'PT Fajar Surya Wisesa',
        defaultWarehouse: 'WH-02',
        unitPrice: 12500,
        minOrderQty: 500,
      },
    ];

    setParsedData({
      materials: demoMaterials,
      rawRows: demoMaterials.map((m) => ({
        'Kode Material': m.code,
        'Nama Material': m.name,
        Kategori: m.category,
        Satuan: m.unit,
        'Total Stok': m.totalStock,
        'Alokasi SPK': m.allocatedStock,
        'Safety Stock': m.safetyStock,
        'Lead Time (Hari)': m.leadTimeDays,
        Supplier: m.supplierName,
        'Gudang Utama': m.defaultWarehouse,
        'Harga Satuan (IDR)': m.unitPrice,
      })),
    });

    setStatusMessage(
      'Data contoh standar PPIC manufaktur berhasil dimuat (7 item material). Klik "Terapkan ke Sistem" untuk menyinkronkan.'
    );
  };

  // Commit to system state
  const handleCommitData = () => {
    if (!parsedData?.materials) return;
    importPpicData({
      materials: parsedData.materials,
    });
    setStatusMessage('Data berhasil diterapkan ke database sistem PPIC!');
    setTimeout(() => {
      setActiveMenu('Rekap Material');
    }, 1200);
  };

  // Export current active state to real Excel (.xlsx) file
  const handleExportCurrentToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Rekap Material
    const matSheetData = materials.map((m) => ({
      'Kode Material': m.code,
      'Nama Material': m.name,
      Kategori: m.category,
      Satuan: m.unit,
      'Total Stok': m.totalStock,
      'Alokasi SPK': m.allocatedStock,
      'Stok Bebas': Math.max(0, m.totalStock - m.allocatedStock),
      'Safety Stock': m.safetyStock,
      'Lead Time (Hari)': m.leadTimeDays,
      Supplier: m.supplierName,
      'Gudang Default': m.defaultWarehouse,
      'Harga Satuan (IDR)': m.unitPrice,
    }));
    const wsMaterials = XLSX.utils.json_to_sheet(matSheetData);
    XLSX.utils.book_append_sheet(wb, wsMaterials, 'Master_Material');

    // Sheet 2: Stok Per Gudang
    const stockSheetData = warehouseStock.map((s) => ({
      'Kode Material': s.materialCode,
      'Nama Material': s.materialName,
      'Kode Gudang': s.warehouseCode,
      'Batch / Lot': s.batchLot,
      Kuantitas: s.qty,
      Satuan: s.unit,
      'Bin Location': s.binLocation,
      'Status QC': s.qcStatus,
      'Tgl Kedaluwarsa': s.expiryDate,
    }));
    const wsStock = XLSX.utils.json_to_sheet(stockSheetData);
    XLSX.utils.book_append_sheet(wb, wsStock, 'Stok_Gudang');

    // Sheet 3: Jadwal SPK
    const woSheetData = workOrders.map((w) => ({
      'No. SPK': w.woNumber,
      'SKU Produk': w.productSku,
      'Nama Produk': w.productName,
      'Target Batch': w.targetQty,
      Satuan: w.unit,
      'Lini Mesin': w.line,
      'Tgl Mulai': w.startDate,
      'Tgl Selesai': w.endDate,
      Prioritas: w.priority,
      Status: w.status,
    }));
    const wsWO = XLSX.utils.json_to_sheet(woSheetData);
    XLSX.utils.book_append_sheet(wb, wsWO, 'Jadwal_Produksi');

    // Write file
    XLSX.writeFile(wb, `PPIC_Export_Data_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Download official template file (.xlsx)
  const handleDownloadBlankTemplate = () => {
    const wb = XLSX.utils.book_new();
    const templateData = [
      {
        'Kode Material': 'RM-RESIN-01',
        'Nama Material': 'Polypropylene Copolymer',
        Kategori: 'Raw Material',
        Satuan: 'Kg',
        'Total Stok': 5000,
        'Alokasi SPK': 1500,
        'Safety Stock': 1000,
        'Lead Time (Hari)': 7,
        Supplier: 'PT Petrokimia Jaya',
        'Gudang Utama': 'WH-01',
        'Harga Satuan (IDR)': 28000,
      },
      {
        'Kode Material': 'PKG-BOT-250',
        'Nama Material': 'Botol HDPE 250ml',
        Kategori: 'Packaging',
        Satuan: 'Pcs',
        'Total Stok': 20000,
        'Alokasi SPK': 5000,
        'Safety Stock': 4000,
        'Lead Time (Hari)': 5,
        Supplier: 'PT Kemasan Mulia',
        'Gudang Utama': 'WH-02',
        'Harga Satuan (IDR)': 1500,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_PPIC');
    XLSX.writeFile(wb, 'PPIC_Template_Import_Material.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Top Description Card */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            Unggah Berkas Excel & Sinkronisasi Data PPIC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Modul ini memungkinkan tim PPIC membaca file format Excel (.xlsx, .xls) atau CSV langsung dari komputer untuk memperbarui Master Material, Alokasi SPK, dan Stok Gudang secara terpadu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadBlankTemplate}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Unduh Template Excel
          </button>
          <button
            onClick={handleExportCurrentToExcel}
            className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Ekspor Data Sistem (.xlsx)
          </button>
        </div>
      </div>

      {/* Upload Drop Zone & Fast Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone Column */}
        <div className="lg:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-white ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Tarik & Lepas File Excel di Sini
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mendukung format .XLSX, .XLS, atau .CSV. Pastikan kolom memuat Kode Material, Nama, Stok, dan Alokasi SPK.
              </p>

              <div className="pt-2 flex items-center justify-center gap-3">
                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs cursor-pointer transition-colors inline-flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Pilih File dari Komputer
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {fileName && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-medium inline-flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  Berkas Terpilih: <strong>{fileName}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Demo Helper Column */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              Demo Data Excel PPIC
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika Anda belum memiliki file Excel lokal saat ini, klik tombol di bawah untuk menyimulasikan pembacaan berkas Excel laporan mingguan PPIC secara instan.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-800">Termasuk dalam dataset:</div>
              <div>• 7 Item Material Manufaktur Utama</div>
              <div>• Data Alokasi SPK Aktual & Safety Stock</div>
              <div>• Nilai Unit Price & Lead Time Supplier</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={loadRealisticSampleExcel}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              Muat Contoh Data Excel PPIC (Demo)
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          {parsedData?.materials && (
            <button
              onClick={handleCommitData}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              Terapkan ke Sistem Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedData?.rawRows && parsedData.rawRows.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Pratinjau Data Excel ({parsedData.rawRows.length} Baris Teridentifikasi)
              </h3>
            </div>
            <button
              onClick={handleCommitData}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Simpan & Sinkronkan ke Sistem
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  {Object.keys(parsedData.rawRows[0]).slice(0, 8).map((colKey) => (
                    <th key={colKey} className="py-2 px-3 whitespace-nowrap">
                      {colKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.rawRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    {Object.keys(parsedData.rawRows![0]).slice(0, 8).map((colKey) => (
                      <td key={colKey} className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {String(row[colKey] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
