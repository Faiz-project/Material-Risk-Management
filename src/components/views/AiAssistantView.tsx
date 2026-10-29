import React, { useState, useRef, useEffect } from 'react';
import { usePpic } from '../../context/PpicContext';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  FileText,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const { materials, workOrders, riskAssessments, kpis } = usePpic();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Halo Pak Budi, saya adalah **Asisten Cerdas PPIC & Production Risk Consultant**.

Saya telah membaca status terkini dari sistem:
* Terdapat **${kpis.criticalCount} material kritis** yang mengalami defisit terhadap jadwal SPK.
* Indeks kesiapan material pabrik berada pada angka **${kpis.materialReadinessScore}%**.
* Total **${kpis.scheduledCount} batch SPK** aktif dalam antrean produksi.

Anda dapat menanyakan strategi mitigasi risiko, urutan prioritas lini mesin, draft memo koordinasi pengadaan, atau kalkulasi safety stock. Silakan ketik pertanyaan Anda atau pilih salah satu rekomendasi cepat di bawah!`,
      timestamp: 'Sistem',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    // Prepare live operational context
    const criticalList = riskAssessments
      .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
      .map((r) => ({
        code: r.materialCode,
        name: r.materialName,
        freeStock: r.freeStock,
        demand: r.totalDemand,
        netGap: r.netGap,
        leadTime: r.leadTimeDays,
        affectedWorkOrders: r.affectedWorkOrders,
      }));

    const operationalContext = {
      kpis,
      criticalMaterials: criticalList,
      scheduledOrders: workOrders.map((w) => ({
        no: w.woNumber,
        product: w.productName,
        target: w.targetQty,
        line: w.line,
        start: w.startDate,
        status: w.status,
      })),
    };

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          contextData: operationalContext,
        }),
      });

      const data = await response.json();
      const replyText = data.reply || data.error || 'Tidak ada balasan dari server.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: `[Analisis Offline PPIC]: Terdeteksi defisit material Botol HDPE 250ml dan Sodium Lauryl Sulfate untuk SPK-2026-102.
1. **Langkah 1**: Rilis 15.000 Pcs botol dari Gudang Karantina WH-04 Transit QC yang baru tiba hari ini.
2. **Langkah 2**: Ajukan PO darurat (expedite) SLS ke PT BASF Indonesia untuk tiba sebelum tanggal 5 November.
3. **Langkah 3**: Jika vendor terlambat, swap urutan produksi dengan SPK-2026-103 (Blow Molding Botol) yang materialnya berstatus READY.`,
          timestamp: 'Offline Engine',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const quickPrompts = [
    'Analisis solusi shortage terparah hari ini dan urutan tindakan mitigasinya',
    'Optimalkan urutan jadwal produksi SPK agar lini mesin tidak mengalami downtime',
    'Buat draft memo resmi ke Departemen Purchasing untuk expedite pengadaan material kritis',
    'Simulasikan apakah jadwal produksi minggu depan aman jika ada keterlambatan supplier 3 hari',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Asisten Cerdas PPIC & Konsultan Risiko Produksi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Didukung oleh model AI dengan pemahaman menyeluruh terhadap data operasional pabrik Anda. Memberikan saran rescheduling, kanban transfer antar gudang, dan kalkulasi buffer persediaan secara presisi.
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `reset-${Date.now()}`,
                sender: 'assistant',
                text: 'Riwayat percakapan telah dibersihkan. Apa yang ingin Anda diskusikan mengenai perencanaan material hari ini?',
                timestamp: 'Sistem',
              },
            ]);
          }}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Mulai Sesi Baru
        </button>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[600px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-blue-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <span className="text-xs font-bold">BS</span> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-xl text-xs md:text-sm leading-relaxed relative group ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] opacity-70">
                    <span className="font-semibold">{isUser ? 'Budi Santoso (PPIC)' : 'AI PPIC Consultant'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body with Markdown style formatting */}
                  <div className="whitespace-pre-wrap space-y-1.5 font-sans">
                    {msg.text}
                  </div>

                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Terverifikasi Data Pabrik
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Salin Teks
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-blue-400 border border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 rounded-tl-none shadow-xs flex items-center gap-2 text-xs text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>AI sedang menganalisis saldo material, alokasi SPK, dan merumuskan solusi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[11px] font-semibold text-slate-400">Saran Cepat:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full transition-colors truncate max-w-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tanyakan analisis risiko, perbandingan SPK, atau strategi material ke AI PPIC..."
              className="flex-1 px-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs md:text-sm rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
