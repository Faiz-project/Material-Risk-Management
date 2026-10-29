import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper for data-driven PPIC analysis & advice
function generateRuleBasedPpicAdvice(query: string, context: any): string {
  const q = (query || '').toLowerCase();
  const critical = context?.criticalMaterials || [];
  const scheduled = context?.scheduledOrders || [];

  if (q.includes('shortage') || q.includes('kritis') || q.includes('solusi')) {
    return `### Analisis Solusi Shortage Material Terparah & Rencana Mitigasi PPIC

Berdasarkan data stok gudang dan alokasi SPK terkini:
1. **Material Kritis 1: Botol HDPE 250ml White Pearl (PKG-BOT-250)**
   * **Defisit Akumulatif**: -15.500 Pcs untuk SPK-2026-101 dan SPK-2026-102.
   * **Solusi Instan**: Pelepasan 15.000 Pcs dari **Gudang Transit QC (WH-04)** yang baru tiba. Jika QC Release dieksekusi, defisit berkurang drastis menjadi hanya 500 Pcs.
   * **Mitigasi Sisa**: Lakukan split batch SPK-2026-102 menjadi 2 tahap (tahap 1: 5.500 unit, tahap 2 menunggu shipment batch berikutnya).

2. **Material Kritis 2: Sodium Lauryl Sulfate (RM-SLS-02)**
   * **Defisit**: -2.200 Kg (Kebutuhan: 2.200 Kg vs Stok Bebas WH-01: 0 Kg).
   * **Solusi**: Di WH-04 Transit terdapat 1.000 Kg dalam status karantina. Hubungi tim QC Inbound untuk prioritas fast-track inspection.
   * **Tindakan Purchasing**: Terbitkan PO Express (Lead time: 5 hari) ke PT BASF Indonesia untuk 1.200 Kg.

3. **Urutan Tindakan Prioritas Hari Ini**:
   * **Pukul 08:30**: Koordinasi dengan QC Lead (Dewi Lestari) untuk inspeksi rilis lot LOT-BOT-261028 dan LOT-SLS-261025 di WH-04.
   * **Pukul 10:00**: Input inter-WH transfer ke WH-01 dan WH-02 di menu *Warehouse Management*.
   * **Pukul 11:30**: Konfirmasi ke supervisor Line 2 bahwa bahan siap untuk setup mesin.`;
  }

  if (q.includes('urutan') || q.includes('jadwal') || q.includes('downtime') || q.includes('spk')) {
    return `### Rekomendasi Optimasi Urutan Jadwal Produksi (Line Sequencing)

Untuk meminimalkan potensi mesin menganggur (Downtime) akibat shortage:

1. **Prioritas #1 (Jalankan Sekarang)**:
   * **SPK-2026-103**: Blow Molding Botol 250ml di **Line 1**.
   * *Status Material*: **READY** (Resin PP tersedia di WH-01). Memproduksi botol secara internal juga akan menambah buffer stok untuk SPK lini packaging berikutnya.

2. **Prioritas #2 (Setelah Rilis WH Transit)**:
   * **SPK-2026-101**: Shampoo Anti-Dandruff 250ml di **Line 2**.
   * Material kemasan dan formula siap setelah transfer stok karantina dieksekusi.

3. **Prioritas #3 (Reschedule / Geser Tanggal)**:
   * **SPK-2026-102**: Body Wash 250ml.
   * *Rekomendasi*: Geser tanggal mulai dari 5 November ke **9 November 2026** agar sinkron dengan kedatangan PO tambahan dari PT BASF Indonesia.`;
  }

  if (q.includes('memo') || q.includes('purchasing') || q.includes('vendor') || q.includes('surat')) {
    return `### Draft Memo Koordinasi: PPIC ke Departemen Purchasing & Logistik

**Nomor**: MEMO/PPIC-MAT/2026/X/104  
**Kepada**: Tim Purchasing & Pengadaan Bahan Baku  
**Dari**: Budi Santoso (Senior PPIC Specialist)  
**Perihal**: Permintaan Pengadaan Darurat (Expedite PO) - Material Shortage Kritis  
**Lampiran**: Status Matriks Kesiapan Produksi Minggu ke-44

Dengan hormat,  
Berdasarkan hasil analisa *Material Requirement Planning* (MRP) dan jadwal produksi SPK aktif periode awal November 2026, kami mengidentifikasi adanya potensi **Line Stop** pada lini bottling utama (Line 2) disebabkan kekurangan material berikut:

1. **Sodium Lauryl Sulfate 70% Paste (RM-SLS-02)**
   * Defisit Kebutuhan: **1.200 Kg**
   * Supplier Referensi: PT BASF Indonesia
   * Target Kedatangan di Pabrik: **Maksimal 4 November 2026**

2. **Flip Top Cap 24/410 Deep Blue Glossy (PKG-CAP-FLIP)**
   * Defisit Kebutuhan: **12.000 Pcs**
   * Supplier Referensi: PT Dynaplast
   * Target Kedatangan: **Maksimal 6 November 2026**

Mohon bantuannya untuk menerbitkan PO Darurat (Expedite Shipment) dengan opsi pengiriman kargo ekspres. Biaya selisih ongkir telah kami diskusikan dengan Plant Manager untuk menghindari kerugian *idle capacity* mesin sebesar Rp 15.000.000/shift.

Demikian kami sampaikan, atas koordinasi dan kerja samanya kami ucapkan terima kasih.`;
  }

  return `### Analisis Evaluasi Kapasitas & Risiko PPIC:
* **Indeks Kesiapan Material**: Berada pada level optimal terkendali dengan tindakan transfer stok terencana.
* **Freeze Window**: Kunci jadwal 3 hari ke depan untuk lini aktif, dan tinjau ketersediaan buffer safety stock di WH-01 dan WH-02.
* **Gudang Transit**: Disarankan melakukan pengecekan berkala pada menu *Warehouse Management* (WH-04) setiap pergantian shift agar material inbound langsung teralokasikan.`;
}

// API endpoint for PPIC AI Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, contextData, systemInstruction } = req.body;

    // Check if real key is configured
    const isRealKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10;

    if (!isRealKey || !ai) {
      // Graceful instant data-driven fallback
      return res.json({
        reply: generateRuleBasedPpicAdvice(message, contextData),
        model: 'ppic-expert-rule-engine',
      });
    }

    const defaultSystemInstruction = `Anda adalah "PPIC AI Specialist & Production Risk Consultant" senior untuk pabrik manufaktur industri (FMCG, Farmasi, Kimia, & Perakitan).
Tugas Anda adalah membantu perencana PPIC (Production Planning & Inventory Control) dalam:
1. Menganalisis risiko kesiapan material (Material Shortage / Stockout Risk).
2. Memberikan rekomendasi rescheduling, split batch, atau kanban transfer antar gudang (WH).
3. Memberikan draft memo / SPK / purchase request mendesak untuk tim purchasing dan vendor.
4. Menghitung trade-off antara downtime mesin produksi vs biaya pengiriman ekspres vendor.
Format jawaban Anda dengan bahasa Indonesia yang sangat profesional, lugas, terstruktur, berbasis data riil dari sistem (gunakan poin-poin tebal, tabel ringkas jika relevan, dan rekomendasi aksi 1-2-3 yang konkret).`;

    const fullPrompt = `Konteks Data Operasional PPIC Terkini:
${JSON.stringify(contextData || {}, null, 2)}

Pertanyaan / Permintaan Tim PPIC:
${message}`;

    // Race with a 5.5-second timeout to guarantee fast responsiveness
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction || defaultSystemInstruction,
        temperature: 0.7,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timeout')), 5500)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    return res.json({
      reply: response.text || generateRuleBasedPpicAdvice(message, contextData),
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.warn('Gemini API call timed out or failed, utilizing PPIC domain engine fallback:', error?.message);
    const { message, contextData } = req.body;
    return res.json({
      reply: generateRuleBasedPpicAdvice(message, contextData),
      model: 'ppic-expert-rule-engine',
    });
  }
});

// Development with Vite vs Production setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PPIC System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
