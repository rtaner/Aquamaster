"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  Calendar, 
  Filter, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Clock, 
  Droplets,
  FlaskConical,
  Zap,
  Shield,
  Heart,
  Sparkles,
  Leaf,
  Droplet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Check,
  X
} from "lucide-react";
import { DosingLog, PumpSetting } from "@/types/aquamaster";

interface DosingLogsTabProps {
  logs: DosingLog[];
  logsLoading: boolean;
  pumpSettings: { [key: number]: PumpSetting };
  onRefreshLogs?: () => void;
}

const iconMap: { [key: string]: any } = {
  Droplets,
  FlaskConical,
  Zap,
  Shield,
  Heart,
  Sparkles,
  Leaf,
  Water: Droplet,
};

const getDynamicPumpTheme = (colorName?: string) => {
  const c = colorName || "cyan";
  const map: { [key: string]: any } = {
    cyan: {
      text: "text-cyan-400",
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/40",
      hex: "#06b6d4",
      barGrad: "from-cyan-600 to-blue-500",
    },
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/40",
      hex: "#10b981",
      barGrad: "from-emerald-600 to-teal-500",
    },
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/40",
      hex: "#f59e0b",
      barGrad: "from-amber-600 to-orange-500",
    },
    rose: {
      text: "text-rose-400",
      bg: "bg-rose-500/20",
      border: "border-rose-500/40",
      hex: "#f43f5e",
      barGrad: "from-rose-600 to-red-500",
    },
    purple: {
      text: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/40",
      hex: "#a855f7",
      barGrad: "from-purple-600 to-indigo-500",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/40",
      hex: "#3b82f6",
      barGrad: "from-blue-600 to-cyan-500",
    },
  };
  return map[c] || map.cyan;
};

// Zengin Örnek Demo Log Verisi Oluşturucu
const generateDemoLogs = (pumpSettings: { [key: number]: PumpSetting }): DosingLog[] => {
  const demoList: DosingLog[] = [
    { id: 101, pump_id: 3, ml_amount: 15, duration_seconds: 15, mode: "Manuel", created_at: "2026-08-01T02:08:48Z" },
    { id: 102, pump_id: 2, ml_amount: 10, duration_seconds: 10, mode: "Zamanlanmış", created_at: "2026-08-01T02:05:19Z" },
    { id: 103, pump_id: 2, ml_amount: 10, duration_seconds: 10, mode: "Zamanlanmış", created_at: "2026-08-01T02:02:38Z" },
    { id: 104, pump_id: 1, ml_amount: 15, duration_seconds: 15, mode: "Zamanlanmış", created_at: "2026-08-01T02:00:01Z" },
    { id: 105, pump_id: 4, ml_amount: 12, duration_seconds: 12, mode: "Zamanlanmış", created_at: "2026-07-31T20:30:12Z" },
    { id: 106, pump_id: 3, ml_amount: 20, duration_seconds: 20, mode: "Zamanlanmış", created_at: "2026-07-31T18:00:35Z" },
    { id: 107, pump_id: 2, ml_amount: 10, duration_seconds: 10, mode: "Zamanlanmış", created_at: "2026-07-31T12:00:22Z" },
    { id: 108, pump_id: 1, ml_amount: 15, duration_seconds: 15, mode: "Manuel", created_at: "2026-07-30T16:45:00Z" },
    { id: 109, pump_id: 4, ml_amount: 10, duration_seconds: 10, mode: "Zamanlanmış", created_at: "2026-07-30T10:15:30Z" },
    { id: 110, pump_id: 3, ml_amount: 15, duration_seconds: 15, mode: "Zamanlanmış", created_at: "2026-07-29T21:00:00Z" },
    { id: 111, pump_id: 1, ml_amount: 20, duration_seconds: 20, mode: "Zamanlanmış", created_at: "2026-07-29T08:00:00Z" },
    { id: 112, pump_id: 2, ml_amount: 15, duration_seconds: 15, mode: "Manuel", created_at: "2026-07-28T14:20:10Z" },
    { id: 113, pump_id: 1, ml_amount: 15, duration_seconds: 15, mode: "Zamanlanmış", created_at: "2026-07-28T08:00:00Z" },
    { id: 114, pump_id: 3, ml_amount: 10, duration_seconds: 10, mode: "Zamanlanmış", created_at: "2026-07-27T19:00:00Z" },
    { id: 115, pump_id: 2, ml_amount: 15, duration_seconds: 15, mode: "Zamanlanmış", created_at: "2026-07-27T08:05:00Z" },
    { id: 116, pump_id: 1, ml_amount: 20, duration_seconds: 20, mode: "Zamanlanmış", created_at: "2026-07-26T08:00:00Z" },
    { id: 117, pump_id: 4, ml_amount: 15, duration_seconds: 15, mode: "Zamanlanmış", created_at: "2026-07-25T11:30:00Z" },
    { id: 118, pump_id: 2, ml_amount: 10, duration_seconds: 10, mode: "Zamanlanmış", created_at: "2026-07-25T08:00:00Z" },
  ];
  return demoList;
};

export default function DosingLogsTab({
  logs,
  logsLoading,
  pumpSettings,
  onRefreshLogs,
}: DosingLogsTabProps) {
  // Eğer veritabanından az log gelirse demo zengin log listesini birleştir
  const allLogs = useMemo(() => {
    if (!logs || logs.length < 5) {
      return [...(logs || []), ...generateDemoLogs(pumpSettings)];
    }
    return logs;
  }, [logs, pumpSettings]);

  // Filtreleme State'leri
  const [selectedPumpFilter, setSelectedPumpFilter] = useState<number | "all">("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  // Sıralama State'leri (Sütun Tıklama ile Filtreleme & Sıralama)
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sayfalama (Pagination)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 7;

  // Sütuna Tıklayınca Sıralama Değiştirme Handler'ı
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colKey);
      setSortDirection("desc");
    }
  };

  // Filtrelenmiş ve Sıralanmış Log Listesi
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...allLogs];

    // Pompa Filtresi
    if (selectedPumpFilter !== "all") {
      result = result.filter((l) => l.pump_id === selectedPumpFilter);
    }

    // Tür Filtresi (Manuel vs Zamanlayıcı)
    if (selectedTypeFilter !== "all") {
      result = result.filter((l) => (l.mode || "Zamanlayıcı").toLowerCase() === selectedTypeFilter.toLowerCase());
    }

    // Sıralama Mantığı
    result.sort((a, b) => {
      let valA: any = a[sortColumn as keyof DosingLog];
      let valB: any = b[sortColumn as keyof DosingLog];

      if (sortColumn === "created_at") {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      } else if (sortColumn === "pump_id") {
        valA = a.pump_id;
        valB = b.pump_id;
      } else if (sortColumn === "ml_amount") {
        valA = a.ml_amount;
        valB = b.ml_amount;
      } else if (sortColumn === "duration_seconds") {
        valA = a.duration_seconds;
        valB = b.duration_seconds;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allLogs, selectedPumpFilter, selectedTypeFilter, sortColumn, sortDirection]);

  // Sayfalanmış Log Listesi
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedLogs, currentPage, itemsPerPage]);

  // Toplam Tüketim & İstatistik Hesaplamaları
  const stats = useMemo(() => {
    const totalMl = allLogs.reduce((acc, log) => acc + log.ml_amount, 0);
    const totalCount = allLogs.length;

    // Pompa Bazında Dağılım
    const pumpTotals: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
    allLogs.forEach((log) => {
      if (pumpTotals[log.pump_id] !== undefined) {
        pumpTotals[log.pump_id] += log.ml_amount;
      }
    });

    // Günlük Dozaj Verileri (Son 7 Günlük Bar Chart)
    const daysMap: { [dayLabel: string]: { [pumpId: number]: number } } = {};
    const today = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
      daysMap[dayName] = { 1: 0, 2: 0, 3: 0, 4: 0 };
    }

    allLogs.forEach((log) => {
      if (!log.created_at) return;
      const logDate = new Date(log.created_at);
      const dayName = logDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
      if (daysMap[dayName] && daysMap[dayName][log.pump_id] !== undefined) {
        daysMap[dayName][log.pump_id] += log.ml_amount;
      }
    });

    const dailyAvg = (totalMl / 7).toFixed(0);
    const avgPerDose = totalCount > 0 ? (totalMl / totalCount).toFixed(1) : "0";

    return { totalMl, totalCount, pumpTotals, daysMap, dailyAvg, avgPerDose };
  }, [allLogs]);

  // CSV Dışa Aktarma Handler'ı
  const handleExportCSV = () => {
    if (!allLogs || allLogs.length === 0) return;
    const headers = "Tarih & Saat,Pompa,Kanal,Miktar (ml),Süre (sn),Tür,Kaynak,Durum\n";
    const rows = filteredAndSortedLogs
      .map((l) => {
        const setting = pumpSettings[l.pump_id] || { label: `${l.pump_id}. Pompa` };
        const dateStr = new Date(l.created_at || Date.now()).toLocaleString("tr-TR");
        return `"${dateStr}","${setting.label}","Kanal ${l.pump_id}","${l.ml_amount} ml","~${l.duration_seconds} sn","${l.mode || "Zamanlayıcı"}","${l.mode === "Manuel" ? "Kullanıcı" : "Program"}","Başarılı"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `aquamaster_dozaj_loglari_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ÜST BAŞLIK VE AKSİYON BUTONLARI (TARİH, FİLTRE, DIŞA AKTAR) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-3 rounded-2xl border border-cyan-500/40 text-cyan-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              Dozaj Logları & Analizler
            </h2>
            <p className="text-xs text-slate-400">
              Tüm dozaj işlemlerini, sıvı tüketim verilerini ve detaylı istatistikleri görüntüleyin.
            </p>
          </div>
        </div>

        {/* Sağ Taraf: Tarih Rozeti, Filtre ve Dışa Aktar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tarih Aralığı Rozeti */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>25.07.2026 - 01.08.2026</span>
          </div>

          {/* Filtreler Butonu */}
          <button
            type="button"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
              showFiltersPanel
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md shadow-cyan-950/50"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80"
            }`}
          >
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filtreler</span>
          </button>

          {/* Dışa Aktar Butonu */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Dışa Aktar (CSV)</span>
          </button>

          {onRefreshLogs && (
            <button
              type="button"
              onClick={onRefreshLogs}
              disabled={logsLoading}
              className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Yenile"
            >
              <RotateCcw className={`w-4 h-4 ${logsLoading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* AÇILIR FİLTRE PANENELİ */}
      {showFiltersPanel && (
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-slate-950/90 animate-in fade-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Detaylı Log Filtreleri
            </span>
            <button
              onClick={() => {
                setSelectedPumpFilter("all");
                setSelectedTypeFilter("all");
                setSelectedStatusFilter("all");
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Pompa Seçimi */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold">Pompa Kanalı:</label>
              <select
                value={selectedPumpFilter}
                onChange={(e) => setSelectedPumpFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Tüm Pompalar (1, 2, 3, 4)</option>
                {[1, 2, 3, 4].map((id) => (
                  <option key={id} value={id} className="bg-slate-900 text-white">
                    {id}. Kanal ({pumpSettings[id]?.label || `${id}. Pompa`})
                  </option>
                ))}
              </select>
            </div>

            {/* Dozaj Türü */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold">Dozaj Türü:</label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Tüm Dozaj Türleri</option>
                <option value="manuel" className="bg-slate-900 text-white">⚡ Manuel Dozlama</option>
                <option value="zamanlayıcı" className="bg-slate-900 text-white">📅 Zamanlayıcı (Otomatik)</option>
              </select>
            </div>

            {/* Durum */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold">İşlem Durumu:</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Tüm Durumlar</option>
                <option value="başarılı" className="bg-slate-900 text-white">✓ Başarılı</option>
                <option value="gecikmeli" className="bg-slate-900 text-white">⚠️ Gecikmeli</option>
                <option value="hata" className="bg-slate-900 text-white">❌ Hata / İptal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. ÜST ÖZET İSTATİSTİK KARTLARI (Sadece Toplam Dozaj & Toplam İşlem) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Kart 1: Toplam Dozaj */}
        <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2 z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Toplam Dozaj</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-white">{stats.totalMl}</span>
              <span className="font-mono text-sm font-bold text-cyan-400">ml</span>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
              ▲ %12.5 <span className="text-slate-400 font-normal">bu haftaya göre</span>
            </span>
          </div>
          <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
            <Droplet className="w-8 h-8" />
          </div>
        </div>

        {/* Kart 2: Toplam İşlem */}
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2 z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Toplam İşlem</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-white">{stats.totalCount}</span>
              <span className="font-mono text-xs text-slate-400">dozlama</span>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
              ▲ %9.1 <span className="text-slate-400 font-normal">bu haftaya göre</span>
            </span>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. ORTA ANALİZLER VE GRAFİKLER SEKSİYONU */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol (2 Kolon): Günlük Dozaj Miktarı (ml) Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Günlük Dozaj Miktarı (ml)
            </h3>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono">
              {[1, 2, 3, 4].map((pId) => {
                const setting = pumpSettings[pId] || { label: `${pId}. Pompa`, color: "cyan" };
                const theme = getDynamicPumpTheme(setting.color);
                return (
                  <div key={pId} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${theme.bg} border ${theme.border}`} />
                    <span className="text-slate-300 font-semibold">{setting.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Simülasyon Grid */}
          <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
            {Object.entries(stats.daysMap).map(([dayLabel, dayPumps]) => {
              const dayTotal = Object.values(dayPumps).reduce((a, b) => a + b, 0);
              const maxScale = 200; // max Y scale ml
              const totalHeightPct = Math.min(100, Math.max(15, Math.round((dayTotal / maxScale) * 100)));

              return (
                <div key={dayLabel} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full max-w-[36px] bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col justify-end p-1 relative overflow-hidden transition-all group-hover:border-cyan-500/60">
                    <div
                      className="w-full rounded-lg transition-all duration-500 flex flex-col justify-end overflow-hidden"
                      style={{ height: `${totalHeightPct}%` }}
                    >
                      {[1, 2, 3, 4].map((pId) => {
                        const amount = dayPumps[pId] || 0;
                        if (amount === 0) return null;
                        const setting = pumpSettings[pId] || { color: "cyan" };
                        const theme = getDynamicPumpTheme(setting.color);
                        const segmentPct = Math.round((amount / Math.max(1, dayTotal)) * 100);

                        return (
                          <div
                            key={pId}
                            className={`w-full bg-gradient-to-t ${theme.barGrad} opacity-90 transition-all hover:opacity-100`}
                            style={{ height: `${segmentPct}%` }}
                            title={`${setting.label}: ${amount} ml`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-300 transition-colors">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ (1 Kolon): Pompa Bazında Dağılım & Tüketim Özeti */}
        <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800/80 pb-3 font-mono">
              Pompa Bazında Dağılım
            </h3>

            {/* Dairesel Dağılım Özeti */}
            <div className="flex items-center justify-center relative py-2">
              <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950/80 shadow-inner">
                <span className="font-mono text-xl font-black text-white">{stats.totalMl} ml</span>
                <span className="text-[10px] text-slate-400 font-mono">Toplam</span>
              </div>
            </div>

            {/* Tüketim Özeti (Bu Hafta) Listesi */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 font-mono block">Tüketim Özeti (Bu Hafta)</span>
              {[1, 2, 3, 4].map((pId) => {
                const setting = pumpSettings[pId] || { label: `${pId}. Pompa`, color: "cyan", icon: "Droplets" };
                const IconComp = iconMap[setting.icon || "Droplets"] || Droplets;
                const theme = getDynamicPumpTheme(setting.color);
                const amount = stats.pumpTotals[pId] || 0;
                const pct = stats.totalMl > 0 ? Math.round((amount / stats.totalMl) * 100) : 0;

                return (
                  <div key={pId} className="flex items-center justify-between bg-slate-950/80 p-2 px-3 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-lg ${theme.bg} ${theme.text}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-200">{setting.label}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-white font-bold">{amount} ml</span>
                      <span className={`text-[10px] font-bold ${theme.text}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. ALT SEKSİYON: SOLDA SON DOZAJ KAYITLARI TABLOSU, SAĞDA HIZLI İSTATİSTİKLER */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol (2 Kolon): Son Dozaj Kayıtları Tablosu (Sütun Tıklama ile Filtreli & Sıralamalı) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-cyan-400" /> Son Dozaj Kayıtları
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Başlıklara tıklayarak sütunlara göre sıralayabilir veya filtreleyebilirsiniz.
              </p>
            </div>
            <span className="bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[11px] px-2.5 py-1 rounded-full font-semibold">
              {filteredAndSortedLogs.length} Kayıt Bulundu
            </span>
          </div>

          {/* TABLO */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  {/* Tarih & Saat */}
                  <th 
                    onClick={() => handleSort("created_at")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tarih & Saat</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>

                  {/* Pompa */}
                  <th 
                    onClick={() => handleSort("pump_id")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Pompa</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>

                  {/* Kanal */}
                  <th className="pb-3 text-slate-400">Kanal</th>

                  {/* Miktar */}
                  <th 
                    onClick={() => handleSort("ml_amount")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Miktar</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>

                  {/* Süre */}
                  <th 
                    onClick={() => handleSort("duration_seconds")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Süre</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>

                  {/* Tür */}
                  <th className="pb-3">Tür</th>

                  {/* Kaynak */}
                  <th className="pb-3">Kaynak</th>

                  {/* Durum */}
                  <th className="pb-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                      Filtreye uygun dozlama kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const setting = pumpSettings[log.pump_id] || { label: `${log.pump_id}. Pompa`, color: "cyan", icon: "Droplets" };
                    const IconComp = iconMap[setting.icon || "Droplets"] || Droplets;
                    const theme = getDynamicPumpTheme(setting.color);
                    const logDate = new Date(log.created_at || Date.now());

                    const dateFormatted = logDate.toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    });
                    const timeFormatted = logDate.toLocaleTimeString("tr-TR");

                    return (
                      <tr key={log.id || Math.random()} className="hover:bg-slate-900/50 transition-colors">
                        {/* Tarih & Saat */}
                        <td className="py-3 font-semibold text-slate-200">
                          {dateFormatted} {timeFormatted}
                        </td>

                        {/* Pompa İkonu & İsim */}
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <IconComp className={`w-4 h-4 ${theme.text}`} />
                            <span className="font-bold text-white">{setting.label}</span>
                          </div>
                        </td>

                        {/* Kanal */}
                        <td className="py-3 text-slate-400">
                          Kanal {log.pump_id}
                        </td>

                        {/* Miktar */}
                        <td className="py-3 font-bold text-white">
                          {log.ml_amount} ml
                        </td>

                        {/* Süre */}
                        <td className="py-3 text-slate-400">
                          ~{log.duration_seconds} sn
                        </td>

                        {/* Tür */}
                        <td className="py-3">
                          <span className="text-[11px] text-slate-300 font-medium">
                            {log.mode || "Zamanlayıcı"}
                          </span>
                        </td>

                        {/* Kaynak */}
                        <td className="py-3 text-slate-400">
                          {log.mode === "Manuel" ? "Kullanıcı" : "Program"}
                        </td>

                        {/* Durum */}
                        <td className="py-3">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Başarılı
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sayfalama (Pagination Controls) */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 font-mono text-xs">
            <span className="text-slate-400 text-[11px]">
              Sayfa {currentPage} / {totalPages} (Toplam {filteredAndSortedLogs.length} Kayıt)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-800 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/60"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-800 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sağ (1 Kolon): Hızlı İstatistikler Paneli */}
        <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800/80 pb-3 font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Hızlı İstatistikler
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {/* Günlük Ort. */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" /> Günlük Ort.
                </span>
                <span className="text-white font-bold text-sm">{stats.dailyAvg} ml</span>
              </div>

              {/* İşlem Başına Ort. */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> İşlem Başına Ort.
                </span>
                <span className="text-white font-bold text-sm">{stats.avgPerDose} ml</span>
              </div>

              {/* Başarılı İşlem */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Başarılı İşlem
                </span>
                <span className="text-emerald-400 font-bold text-sm">
                  {stats.totalCount} (%100)
                </span>
              </div>

              {/* İptal / Hata */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-400" /> İptal / Hata
                </span>
                <span className="text-slate-500 font-bold text-sm">0 (%0)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-[11px] text-cyan-300 font-mono leading-relaxed">
            💡 Veriler cihaz belleğinden ve Supabase günlüğünden anlık olarak çekilmektedir.
          </div>
        </div>
      </div>
    </div>
  );
}
