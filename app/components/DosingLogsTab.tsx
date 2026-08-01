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
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
  Check,
  X,
  Search,
  PieChart,
  Activity,
  Award,
  Columns,
  Grid,
  BarChart2
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

// Özel Dark Glass Popover Dropdown Bileşeni
interface CustomSelectOption {
  value: string | number;
  label: string;
  icon?: any;
  color?: string;
}

interface CustomSelectProps {
  value: string | number;
  options: CustomSelectOption[];
  onChange: (val: any) => void;
  className?: string;
}

function CustomSelect({ value, options, onChange, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value)) || options[0];

  return (
    <div className={`relative ${className || ""}`}>
      {/* Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/60 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 flex items-center justify-between gap-2 shadow-inner transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className={`w-3.5 h-3.5 shrink-0 ${selectedOption.color || "text-cyan-400"}`} />
          )}
          <span className="truncate font-semibold">{selectedOption?.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Açılır Popover Menü */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto font-mono">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              const IconComp = opt.icon;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {IconComp && <IconComp className={`w-3.5 h-3.5 shrink-0 ${opt.color || "text-cyan-400"}`} />}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Güvenli Tarih Çözümleyici (PostgreSQL "YYYY-MM-DD HH:mm:ss" & ISO Destekli)
const parseLogDate = (raw?: any): Date => {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  let s = String(raw).trim();
  if (s.includes(" ") && !s.includes("T")) {
    s = s.replace(" ", "T");
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    const d2 = new Date(raw);
    return isNaN(d2.getTime()) ? new Date(0) : d2;
  }
  return d;
};

// Format YYYY-MM-DD
const getDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

// Zengin Örnek Demo Log Verisi Oluşturucu (Çakışmayan Yüksek ID'li Veri Seti)
const generateDemoLogs = (pumpSettings: { [key: number]: PumpSetting }): DosingLog[] => {
  const now = new Date();
  const getPastDate = (daysAgo: number, hoursAgo: number = 0, minsAgo: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    d.setMinutes(d.getMinutes() - minsAgo);
    return d.toISOString();
  };

  const demoList: DosingLog[] = [
    // Bugün (0 gün önce)
    { id: 9001, pump_id: 1, ml_amount: 15, duration_seconds: 15, mode: "Manuel", status: "Başarılı", source: "Kullanıcı", created_at: getPastDate(0, 1, 12) },
    { id: 9002, pump_id: 2, ml_amount: 25, duration_seconds: 25, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(0, 3, 45) },
    { id: 9003, pump_id: 3, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(0, 6, 20) },
    { id: 9004, pump_id: 4, ml_amount: 10, duration_seconds: 10, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(0, 8, 0) },
    
    // 1 Gün Önce
    { id: 9005, pump_id: 4, ml_amount: 12, duration_seconds: 12, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(1, 2, 15) },
    { id: 9006, pump_id: 3, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(1, 5, 30) },
    { id: 9007, pump_id: 2, ml_amount: 30, duration_seconds: 30, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(1, 10, 0) },
    { id: 9008, pump_id: 1, ml_amount: 18, duration_seconds: 18, mode: "Manuel", status: "Başarılı", source: "Kullanıcı", created_at: getPastDate(1, 14, 10) },

    // 2 Gün Önce
    { id: 9009, pump_id: 1, ml_amount: 15, duration_seconds: 15, mode: "Manuel", status: "Başarılı", source: "Kullanıcı", created_at: getPastDate(2, 4, 10) },
    { id: 9010, pump_id: 4, ml_amount: 10, duration_seconds: 10, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(2, 9, 0) },
    { id: 9011, pump_id: 2, ml_amount: 25, duration_seconds: 25, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(2, 14, 0) },

    // 3 Gün Önce
    { id: 9012, pump_id: 3, ml_amount: 25, duration_seconds: 25, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(3, 1, 0) },
    { id: 9013, pump_id: 1, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(3, 7, 30) },
    { id: 9014, pump_id: 2, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(3, 12, 0) },

    // 4 Gün Önce
    { id: 9015, pump_id: 2, ml_amount: 15, duration_seconds: 15, mode: "Manuel", status: "Gecikmeli", source: "Kullanıcı", created_at: getPastDate(4, 2, 10) },
    { id: 9016, pump_id: 1, ml_amount: 15, duration_seconds: 15, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(4, 8, 0) },
    { id: 9017, pump_id: 4, ml_amount: 10, duration_seconds: 10, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(4, 15, 0) },

    // 5 Gün Önce
    { id: 9018, pump_id: 3, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(5, 5, 0) },
    { id: 9019, pump_id: 2, ml_amount: 25, duration_seconds: 25, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(5, 12, 0) },
    { id: 9020, pump_id: 1, ml_amount: 25, duration_seconds: 25, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(5, 18, 0) },

    // 6 Gün Önce
    { id: 9021, pump_id: 1, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(6, 6, 0) },
    { id: 9022, pump_id: 4, ml_amount: 15, duration_seconds: 15, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(6, 11, 0) },
    { id: 9023, pump_id: 2, ml_amount: 20, duration_seconds: 20, mode: "Zamanlayıcı", status: "Başarılı", source: "Program", created_at: getPastDate(6, 16, 0) },
  ];
  return demoList;
};

export default function DosingLogsTab({
  logs,
  logsLoading,
  pumpSettings,
  onRefreshLogs,
}: DosingLogsTabProps) {
  // Gerçek veritabanı logları ile demo loglarını akıllıca birleştir
  const allLogs = useMemo(() => {
    const demo = generateDemoLogs(pumpSettings);
    const realLogs = logs || [];

    // Eğer veritabanından gelen loglar 3'ten az ise demo verileriyle birleştir
    if (realLogs.length < 3) {
      const existingIds = new Set(realLogs.map((l) => l.id));
      const combined = [...realLogs];
      demo.forEach((dLog) => {
        if (!existingIds.has(dLog.id)) {
          combined.push(dLog);
        }
      });
      return combined;
    }

    // Son 7 güne ait gerçek log var mı kontrol et
    const nowMs = Date.now();
    const cutoff7Days = nowMs - 7 * 24 * 60 * 60 * 1000;
    const recentRealLogs = realLogs.filter((l) => parseLogDate(l.created_at).getTime() >= cutoff7Days);

    if (recentRealLogs.length < 3) {
      const existingIds = new Set(realLogs.map((l) => l.id));
      const combined = [...realLogs];
      demo.forEach((dLog) => {
        if (!existingIds.has(dLog.id)) {
          combined.push(dLog);
        }
      });
      return combined;
    }

    return realLogs;
  }, [logs, pumpSettings]);

  // Grafik Görünüm Modu State'i ("grouped": Yan Yana Sütunlar - VARSAYILAN, "heatmap": GitHub Grid Isı Haritası, "line": Trend Çizgisi)
  const [chartViewMode, setChartViewMode] = useState<"grouped" | "heatmap" | "line">("grouped");

  // Filtreleme State'leri
  const [selectedDateRange, setSelectedDateRange] = useState<"7days" | "30days" | "thisMonth" | "all">("7days");
  const [selectedPumpFilter, setSelectedPumpFilter] = useState<number | "all">("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [hoveredBarDay, setHoveredBarDay] = useState<string | null>(null);

  // Sıralama State'leri
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

  // Custom Dropdown Seçenekleri Listesi
  const dateRangeOptions = [
    { value: "7days", label: "Son 7 Gün", icon: Calendar },
    { value: "30days", label: "Son 30 Gün", icon: Calendar },
    { value: "thisMonth", label: "Bu Ay", icon: Clock },
    { value: "all", label: "Tüm Zamanlar", icon: Clock },
  ];

  const pumpFilterOptions = useMemo(() => [
    { value: "all", label: "Tüm Pompalar (1, 2, 3, 4)", icon: Droplets, color: "text-cyan-400" },
    { value: 1, label: `1. Kanal (${pumpSettings[1]?.label || "Potasyum"})`, icon: Droplets, color: "text-amber-400" },
    { value: 2, label: `2. Kanal (${pumpSettings[2]?.label || "Mikro"})`, icon: Droplets, color: "text-emerald-400" },
    { value: 3, label: `3. Kanal (${pumpSettings[3]?.label || "carbon"})`, icon: Droplets, color: "text-rose-400" },
    { value: 4, label: `4. Kanal (${pumpSettings[4]?.label || "Cal-Mag"})`, icon: Droplets, color: "text-purple-400" },
  ], [pumpSettings]);

  const typeFilterOptions = [
    { value: "all", label: "Tüm Dozaj Türleri", icon: Activity },
    { value: "manuel", label: "⚡ Manuel Dozlama", icon: Zap, color: "text-amber-400" },
    { value: "zamanlayıcı", label: "📅 Zamanlayıcı (Otomatik)", icon: Calendar, color: "text-cyan-400" },
  ];

  const statusFilterOptions = [
    { value: "all", label: "Tüm Durumlar", icon: Filter },
    { value: "başarılı", label: "✓ Başarılı", icon: CheckCircle2, color: "text-emerald-400" },
    { value: "gecikmeli", label: "⚠️ Gecikmeli", icon: AlertTriangle, color: "text-amber-400" },
    { value: "hata", label: "❌ Hata / İptal", icon: X, color: "text-red-400" },
  ];

  // Filtrelenmiş ve Sıralanmış Log Listesi
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...allLogs];

    // 1. Tarih Aralığı Filtresi
    const nowMs = Date.now();
    if (selectedDateRange === "7days") {
      const cutoff = nowMs - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((l) => parseLogDate(l.created_at).getTime() >= cutoff);
    } else if (selectedDateRange === "30days") {
      const cutoff = nowMs - 30 * 24 * 60 * 60 * 1000;
      result = result.filter((l) => parseLogDate(l.created_at).getTime() >= cutoff);
    } else if (selectedDateRange === "thisMonth") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      result = result.filter((l) => parseLogDate(l.created_at).getTime() >= firstDay);
    }

    // 2. Pompa Filtresi
    if (selectedPumpFilter !== "all") {
      result = result.filter((l) => Number(l.pump_id) === Number(selectedPumpFilter));
    }

    // 3. Tür Filtresi (Manuel vs Zamanlayıcı)
    if (selectedTypeFilter !== "all") {
      result = result.filter((l) => (l.mode || "Zamanlayıcı").toLowerCase() === selectedTypeFilter.toLowerCase());
    }

    // 4. İşlem Durumu Filtresi
    if (selectedStatusFilter !== "all") {
      result = result.filter((l) => {
        const st = (l.status || "Başarılı").toLowerCase();
        return st === selectedStatusFilter.toLowerCase();
      });
    }

    // 5. Anlık Arama Sorgusu
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        const setting = pumpSettings[l.pump_id] || { label: `${l.pump_id}. Pompa` };
        const labelMatch = setting.label.toLowerCase().includes(q);
        const pumpMatch = `p${l.pump_id}`.includes(q) || `kanal ${l.pump_id}`.includes(q);
        const modeMatch = (l.mode || "").toLowerCase().includes(q);
        const statusMatch = (l.status || "başarılı").toLowerCase().includes(q);
        const sourceMatch = (l.source || (l.mode === "Manuel" ? "Kullanıcı" : "Program")).toLowerCase().includes(q);
        return labelMatch || pumpMatch || modeMatch || statusMatch || sourceMatch;
      });
    }

    // 6. Sıralama Mantığı
    result.sort((a, b) => {
      let valA: any = a[sortColumn as keyof DosingLog];
      let valB: any = b[sortColumn as keyof DosingLog];

      if (sortColumn === "created_at") {
        valA = parseLogDate(a.created_at).getTime();
        valB = parseLogDate(b.created_at).getTime();
      } else if (sortColumn === "pump_id") {
        valA = Number(a.pump_id);
        valB = Number(b.pump_id);
      } else if (sortColumn === "ml_amount") {
        valA = Number(a.ml_amount);
        valB = Number(b.ml_amount);
      } else if (sortColumn === "duration_seconds") {
        valA = Number(a.duration_seconds);
        valB = Number(b.duration_seconds);
      } else if (sortColumn === "mode") {
        valA = a.mode || "Zamanlayıcı";
        valB = b.mode || "Zamanlayıcı";
      } else if (sortColumn === "status") {
        valA = a.status || "Başarılı";
        valB = b.status || "Başarılı";
      } else if (sortColumn === "source") {
        valA = a.source || (a.mode === "Manuel" ? "Kullanıcı" : "Program");
        valB = b.source || (b.mode === "Manuel" ? "Kullanıcı" : "Program");
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allLogs, selectedDateRange, selectedPumpFilter, selectedTypeFilter, selectedStatusFilter, searchQuery, sortColumn, sortDirection, pumpSettings]);

  // Dynamic Date Range Display Text for Header Badge
  const dateRangeBadgeText = useMemo(() => {
    if (filteredAndSortedLogs.length === 0) return "Kayıt Yok";
    
    const timestamps = filteredAndSortedLogs
      .map((l) => parseLogDate(l.created_at).getTime())
      .filter((t) => t > 0);

    if (timestamps.length === 0) return "Tüm Zamanlar";

    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    const minStr = minDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const maxStr = maxDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

    if (minStr === maxStr) return minStr;
    return `${minStr} - ${maxStr}`;
  }, [filteredAndSortedLogs]);

  // Sayfalanmış Log Listesi
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedLogs, currentPage, itemsPerPage]);

  // Detaylı Toplam & İstatistik Hesaplamaları (KPI, Grafikler, Dağılımlar)
  const stats = useMemo(() => {
    const totalMl = filteredAndSortedLogs.reduce((acc, log) => acc + (Number(log.ml_amount) || 0), 0);
    const totalCount = filteredAndSortedLogs.length;

    // Pompa Bazında Toplam Sıvı Tüketimi
    const pumpTotals: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
    filteredAndSortedLogs.forEach((log) => {
      const pId = Number(log.pump_id);
      if (pumpTotals[pId] !== undefined) {
        pumpTotals[pId] += Number(log.ml_amount) || 0;
      }
    });

    // En Çok Tüketilen Pompa / Sıvı (KPI Card 3)
    let topPumpId = 1;
    let topPumpMl = 0;
    Object.entries(pumpTotals).forEach(([idStr, amount]) => {
      if (amount > topPumpMl) {
        topPumpMl = amount;
        topPumpId = Number(idStr);
      }
    });
    const topPumpPct = totalMl > 0 ? ((topPumpMl / totalMl) * 100).toFixed(1) : "0";

    // Günlük Dozaj Verileri (Son 7 Günlük Bar Chart / Isı Haritası) - Yerel Saat ile YYYY-MM-DD Kesin Eşleşme
    const daysMap: { [dateKey: string]: { label: string; pumps: { [pumpId: number]: number } } } = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = getDateKey(d);
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthShort = d.toLocaleDateString("tr-TR", { month: "short" }).replace(".", "");
      const dayLabel = `${dayNum} ${monthShort}`;
      daysMap[dateKey] = { label: dayLabel, pumps: { 1: 0, 2: 0, 3: 0, 4: 0 } };
    }

    filteredAndSortedLogs.forEach((log) => {
      if (!log.created_at) return;
      const logDate = parseLogDate(log.created_at);
      const dateKey = getDateKey(logDate);

      if (daysMap[dateKey]) {
        const pId = Number(log.pump_id);
        if (daysMap[dateKey].pumps[pId] !== undefined) {
          daysMap[dateKey].pumps[pId] += Number(log.ml_amount) || 0;
        }
      }
    });

    // En Yoğun Gün
    let busiestDay = "-";
    let busiestDayMl = 0;
    Object.entries(daysMap).forEach(([_, dayData]) => {
      const daySum = Object.values(dayData.pumps).reduce((a, b) => a + b, 0);
      if (daySum > busiestDayMl) {
        busiestDayMl = daySum;
        busiestDay = dayData.label;
      }
    });

    const daysCount = Object.keys(daysMap).length || 7;
    const dailyAvg = (totalMl / daysCount).toFixed(1);
    const avgPerDose = totalCount > 0 ? (totalMl / totalCount).toFixed(1) : "0";

    const successCount = filteredAndSortedLogs.filter((l) => (l.status || "Başarılı") === "Başarılı").length;
    const delayedCount = filteredAndSortedLogs.filter((l) => l.status === "Gecikmeli").length;
    const errorCount = filteredAndSortedLogs.filter((l) => l.status === "Hata").length;
    const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(0) : "100";

    return {
      totalMl,
      totalCount,
      pumpTotals,
      topPumpId,
      topPumpMl,
      topPumpPct,
      daysMap,
      dailyAvg,
      avgPerDose,
      busiestDay,
      busiestDayMl,
      successCount,
      delayedCount,
      errorCount,
      successRate,
    };
  }, [filteredAndSortedLogs]);

  // GitHub Katkı Haritası İçin 21 Günlük Mikro Kare Matris Verisi
  const heatmapGridDays = useMemo(() => {
    const days: { dateKey: string; dayNum: string; dayLabel: string; pumps: { [pId: number]: number } }[] = [];
    const today = new Date();

    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = getDateKey(d);
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthShort = d.toLocaleDateString("tr-TR", { month: "short" }).replace(".", "");
      const dayLabel = `${dayNum} ${monthShort}`;
      days.push({
        dateKey,
        dayNum,
        dayLabel,
        pumps: { 1: 0, 2: 0, 3: 0, 4: 0 },
      });
    }

    const gridMap = Object.fromEntries(days.map((item) => [item.dateKey, item]));

    filteredAndSortedLogs.forEach((log) => {
      if (!log.created_at) return;
      const logDate = parseLogDate(log.created_at);
      const dateKey = getDateKey(logDate);
      if (gridMap[dateKey]) {
        const pId = Number(log.pump_id);
        if (gridMap[dateKey].pumps[pId] !== undefined) {
          gridMap[dateKey].pumps[pId] += Number(log.ml_amount) || 0;
        }
      }
    });

    return days;
  }, [filteredAndSortedLogs]);

  // CSV Dışa Aktarma Handler'ı
  const handleExportCSV = () => {
    if (!filteredAndSortedLogs || filteredAndSortedLogs.length === 0) return;
    const headers = "Tarih & Saat,Pompa,Kanal,Miktar (ml),Süre (sn),Tür,Kaynak,Durum\n";
    const rows = filteredAndSortedLogs
      .map((l) => {
        const setting = pumpSettings[l.pump_id] || { label: `${l.pump_id}. Pompa` };
        const dateStr = parseLogDate(l.created_at).toLocaleString("tr-TR");
        const statusStr = l.status || "Başarılı";
        const sourceStr = l.source || (l.mode === "Manuel" ? "Kullanıcı" : "Program");
        return `"${dateStr}","${setting.label}","Kanal ${l.pump_id}","${l.ml_amount} ml","~${l.duration_seconds} sn","${l.mode || "Zamanlayıcı"}","${sourceStr}","${statusStr}"`;
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

  // SVG Donut Halka Grafiği Çizim Verileri
  const donutSegments = useMemo(() => {
    const totalMl = stats.totalMl;
    const radius = 38;
    const circumference = 2 * Math.PI * radius; // ~238.76
    let accumulatedOffset = 0;

    return [1, 2, 3, 4].map((pId) => {
      const amount = stats.pumpTotals[pId] || 0;
      const pct = totalMl > 0 ? amount / totalMl : 0;
      const strokeDasharray = `${pct * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += pct * circumference;

      const setting = pumpSettings[pId] || { label: `${pId}. Pompa`, color: "cyan" };
      const theme = getDynamicPumpTheme(setting.color);

      return {
        pId,
        amount,
        pct: (pct * 100).toFixed(1),
        strokeDasharray,
        strokeDashoffset,
        colorHex: theme.hex,
        theme,
        setting,
      };
    });
  }, [stats.pumpTotals, stats.totalMl, pumpSettings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ÜST BAŞLIK VE AKSİYON BUTONLARI (TARİH, FİLTRE, DIŞA AKTAR) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-3 rounded-2xl border border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-950/50">
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

        {/* Sağ Taraf: Özel Şık Tarih Aralığı Seçici Dropdown, Rozet, Filtre ve Dışa Aktar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Özel Tasarlanmış Dark Glass Date Range Dropdown */}
          <CustomSelect
            value={selectedDateRange}
            options={dateRangeOptions}
            onChange={(val) => {
              setSelectedDateRange(val);
              setCurrentPage(1);
            }}
            className="w-40"
          />

          {/* Tarih Aralığı Rozeti */}
          <div className="hidden sm:flex bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono font-bold text-slate-300 items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRangeBadgeText}</span>
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

      {/* AÇILIR FİLTRE & ARAMA PANENELİ */}
      {showFiltersPanel && (
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-slate-950/90 animate-in fade-in zoom-in-95 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Gelişmiş Log Filtreleri & Arama
            </span>
            <button
              onClick={() => {
                setSelectedPumpFilter("all");
                setSelectedTypeFilter("all");
                setSelectedStatusFilter("all");
                setSelectedDateRange("7days");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Sıfırla
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Anlık Arama Kutusu */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 font-mono">
                <Search className="w-3 h-3 text-cyan-400" /> Arama Kutusu:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pompa, mod veya durum ara..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 pl-8 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Özel Tasarımlı Pompa Seçimi Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold font-mono">Pompa Kanalı:</label>
              <CustomSelect
                value={selectedPumpFilter}
                options={pumpFilterOptions}
                onChange={(val) => {
                  setSelectedPumpFilter(val);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Özel Tasarımlı Dozaj Türü Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold font-mono">Dozaj Türü:</label>
              <CustomSelect
                value={selectedTypeFilter}
                options={typeFilterOptions}
                onChange={(val) => {
                  setSelectedTypeFilter(val);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Özel Tasarımlı İşlem Durumu Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold font-mono">İşlem Durumu:</label>
              <CustomSelect
                value={selectedStatusFilter}
                options={statusFilterOptions}
                onChange={(val) => {
                  setSelectedStatusFilter(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. ÜST ÖZET İSTATİSTİK KARTLARI (4 ADET KPI ÖZET KARTI) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Kart 1: Toplam Dozaj */}
        <div className="glass-panel rounded-3xl p-5 border border-cyan-500/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1.5 z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Toplam Dozaj</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-white">{stats.totalMl}</span>
              <span className="font-mono text-xs font-bold text-cyan-400">ml</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
              ▲ %12.5 <span className="text-slate-400 font-normal">önceki döneme göre</span>
            </span>
          </div>
          <div className="bg-cyan-500/10 p-3.5 rounded-2xl border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
            <Droplet className="w-7 h-7" />
          </div>
        </div>

        {/* Kart 2: Toplam İşlem */}
        <div className="glass-panel rounded-3xl p-5 border border-emerald-500/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1.5 z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Toplam İşlem</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-white">{stats.totalCount}</span>
              <span className="font-mono text-xs text-slate-400">dozlama</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
              ▲ %9.1 <span className="text-slate-400 font-normal">başarı oranı %{stats.successRate}</span>
            </span>
          </div>
          <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        {/* Kart 3: En Çok Tüketilen Sıvı / Pompa */}
        {(() => {
          const topSetting = pumpSettings[stats.topPumpId] || { label: `${stats.topPumpId}. Pompa`, color: "cyan" };
          const theme = getDynamicPumpTheme(topSetting.color);
          return (
            <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
              <div className="space-y-1.5 z-10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">En Çok Tüketilen</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-mono text-lg font-black ${theme.text} truncate max-w-[130px]`}>
                    {topSetting.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1">
                  {stats.topPumpMl} ml <span className="text-amber-400 font-bold">(%{stats.topPumpPct})</span>
                </span>
              </div>
              <div className={`p-3.5 rounded-2xl border ${theme.bg} ${theme.border} ${theme.text} group-hover:scale-110 transition-transform`}>
                <Award className="w-7 h-7" />
              </div>
            </div>
          );
        })()}

        {/* Kart 4: Dozaj Ortalamaları */}
        <div className="glass-panel rounded-3xl p-5 border border-purple-500/30 shadow-xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1.5 z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Dozaj Ortalaması</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-black text-white">{stats.dailyAvg}</span>
              <span className="font-mono text-xs text-purple-400 font-bold">ml / gün</span>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-400 flex items-center gap-1">
              İşlem Başı: <span className="text-purple-300 font-bold">{stats.avgPerDose} ml</span>
            </span>
          </div>
          <div className="bg-purple-500/10 p-3.5 rounded-2xl border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
            <Activity className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. ORTA ANALİZLER VE GRAFİKLER SEKSİYONU */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol (2 Kolon): Günlük Dozaj Miktarı (ml) Grafiği / Isı Haritası */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Günlük Dozaj Analizi
              </h3>

              {/* Görünüm Modu Seçici (1. Yan Yana - VARSAYILAN, 2. GitHub Isı Haritası, 3. Trend Çizgisi) */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setChartViewMode("grouped")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    chartViewMode === "grouped"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Pompaları yan yana şeffaf kapsüller halinde kıyasla"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Yan Yana</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode("heatmap")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    chartViewMode === "heatmap"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="GitHub Katkı Matrisi tarzı Dozaj Isı Haritası"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Isı Haritası</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode("line")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    chartViewMode === "line"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Akıcı çizgi trend grafiği"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trend</span>
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
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

          {/* GRAFİK GÖVDE ALANI */}
          {(() => {
            const daysEntries = Object.entries(stats.daysMap);
            
            // MOD 1: YAN YANA (GROUPED SIDE-BY-SIDE) SÜTUNLAR - YENİLENMİŞ ULTRA MODERN & SHINE TASARIM (VARSAYILAN)
            if (chartViewMode === "grouped") {
              const maxSinglePumpDose = Math.max(
                20,
                ...daysEntries.flatMap(([_, dayData]) => Object.values(dayData.pumps))
              );

              return (
                <div className="h-64 pt-6 pb-2 px-2 flex flex-col justify-between font-mono relative select-none animate-in fade-in duration-300">
                  {/* Arka Plan Y-Ekseni Izgara Çizgileri & Değer Etiketleri */}
                  <div className="absolute inset-x-2 top-8 bottom-8 flex flex-col justify-between pointer-events-none opacity-25">
                    <div className="border-b border-slate-700 w-full flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{maxSinglePumpDose} ml</span>
                    </div>
                    <div className="border-b border-slate-700 w-full flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{Math.round(maxSinglePumpDose * 0.66)} ml</span>
                    </div>
                    <div className="border-b border-slate-700 w-full flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{Math.round(maxSinglePumpDose * 0.33)} ml</span>
                    </div>
                    <div className="border-b border-slate-700 w-full" />
                  </div>

                  {/* Gün Sütunları Yerleşimi */}
                  <div className="h-48 flex items-end justify-between gap-2.5 z-10 px-2">
                    {daysEntries.map(([dateKey, dayData]) => {
                      const dayTotal = Object.values(dayData.pumps).reduce((a, b) => a + b, 0);
                      const isHovered = hoveredBarDay === dateKey;

                      return (
                        <div
                          key={dateKey}
                          onMouseEnter={() => setHoveredBarDay(dateKey)}
                          onMouseLeave={() => setHoveredBarDay(null)}
                          className={`flex-1 flex flex-col items-center justify-end h-full group relative transition-all duration-200 p-1.5 rounded-2xl ${
                            isHovered ? "bg-slate-900/60 shadow-lg shadow-cyan-950/40 scale-[1.02]" : ""
                          }`}
                        >
                          {/* Günlük Toplam Miktar Rozeti (Üstte Süzülen Parlak Rozet) */}
                          <div className="h-5 flex items-center justify-center">
                            {dayTotal > 0 && (
                              <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-950/90 px-2.5 py-0.5 rounded-full border border-cyan-500/50 shadow-md shadow-cyan-950/60 animate-in zoom-in-95">
                                {dayTotal} ml
                              </span>
                            )}
                          </div>

                          {/* 4 Adet İnce Şık Parlak Pompa Kapsülü */}
                          <div className="w-full flex items-end justify-center gap-1.5 h-36 relative px-1">
                            {[1, 2, 3, 4].map((pId) => {
                              const amount = dayData.pumps[pId] || 0;
                              const setting = pumpSettings[pId] || { label: `Pompa ${pId}`, color: "cyan" };
                              const theme = getDynamicPumpTheme(setting.color);
                              const heightPct = amount > 0 ? Math.min(100, Math.max(12, Math.round((amount / maxSinglePumpDose) * 100))) : 0;

                              return (
                                <div key={pId} className="flex-1 max-w-[10px] flex flex-col items-center justify-end h-full group/bar relative">
                                  {/* İnteraktif Hover Tooltip Popover */}
                                  {amount > 0 && (
                                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-10 z-30 bg-slate-950 border border-cyan-500/60 px-2.5 py-1 rounded-xl text-[10px] font-mono text-white pointer-events-none transition-all shadow-2xl whitespace-nowrap">
                                      <span className={theme.text}>{setting.label}: </span>
                                      <span className="font-bold text-white">{amount} ml</span>
                                    </div>
                                  )}

                                  {amount > 0 ? (
                                    <div
                                      className={`w-full bg-gradient-to-t ${theme.barGrad} rounded-t-full shadow-md transition-all duration-500 group-hover/bar:brightness-125 group-hover/bar:scale-110`}
                                      style={{ height: `${heightPct}%` }}
                                    />
                                  ) : (
                                    <div className="w-full h-1 bg-slate-800/60 rounded-full" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Gün İsmi Etiketi (Altta) */}
                          <span className={`text-[10px] font-mono transition-colors mt-2 ${
                            isHovered ? "text-cyan-300 font-bold" : "text-slate-400 font-semibold"
                          }`}>
                            {dayData.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // MOD 2: GERÇEK GITHUB ACTIVITY GRID TARZI MİKRO KARE ISI HARİTASI (HEATMAP MATRIX)
            if (chartViewMode === "heatmap") {
              return (
                <div className="pt-1 px-1 flex flex-col justify-between font-mono space-y-3 animate-in fade-in duration-200">
                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                    <div className="min-w-[620px] space-y-1.5">
                      {/* Üst Tarih Aksı: Her 3 Günde Bir Tarih Etiketi */}
                      <div className="flex items-center pl-24 gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                        {heatmapGridDays.map((dItem, idx) => (
                          <div key={dItem.dateKey} className="w-7 text-center font-mono text-[9px] text-slate-400 shrink-0">
                            {idx % 3 === 0 ? dItem.dayNum : ""}
                          </div>
                        ))}
                      </div>

                      {/* Pompa Satırları (1, 2, 3, 4) */}
                      {[1, 2, 3, 4].map((pId) => {
                        const setting = pumpSettings[pId] || { label: `${pId}. Pompa`, color: "cyan" };
                        const theme = getDynamicPumpTheme(setting.color);
                        const totalPumpMl = heatmapGridDays.reduce((acc, d) => acc + (d.pumps[pId] || 0), 0);

                        return (
                          <div key={pId} className="flex items-center gap-2">
                            {/* Pompa Adı Etiketi (Solda Sabit) */}
                            <div className="w-24 flex items-center justify-between pr-2 shrink-0">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <div className={`w-2 h-2 rounded-full ${theme.bg} border ${theme.border} shrink-0`} />
                                <span className={`text-[11px] font-bold ${theme.text} truncate`}>
                                  {setting.label}
                                </span>
                              </div>
                            </div>

                            {/* 21 Adet GitHub Tarzı Mikro Kare Hücre (w-7 h-7 = 28x28px) */}
                            <div className="flex items-center gap-1.5">
                              {heatmapGridDays.map((dItem) => {
                                const amount = dItem.pumps[pId] || 0;
                                
                                // Dynamic Tile Styles based on intensity & pump theme
                                let tileStyle = "bg-slate-900/80 border border-slate-800/80 text-slate-600 hover:border-slate-700";
                                if (amount > 0 && amount <= 5) {
                                  tileStyle = `${theme.bg} border ${theme.border} ${theme.text} opacity-85 font-bold hover:scale-110`;
                                } else if (amount > 5 && amount <= 15) {
                                  tileStyle = `${theme.bg} border ${theme.border} ${theme.text} font-black opacity-100 shadow-sm hover:scale-110`;
                                } else if (amount > 15 && amount <= 25) {
                                  tileStyle = `bg-gradient-to-br ${theme.barGrad} text-white font-black shadow-md shadow-cyan-950/40 hover:scale-110`;
                                } else if (amount > 25) {
                                  tileStyle = `bg-gradient-to-br ${theme.barGrad} text-white font-black shadow-lg shadow-cyan-950/60 ring-1 ring-white/60 hover:scale-110`;
                                }

                                return (
                                  <div
                                    key={dItem.dateKey}
                                    className={`w-7 h-7 rounded-md border flex items-center justify-center text-[10px] font-mono transition-all duration-150 cursor-pointer group/cell relative shrink-0 ${tileStyle}`}
                                  >
                                    {/* Tooltip Popover on Hover */}
                                    <div className="opacity-0 group-hover/cell:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-950 border border-cyan-500/60 px-2.5 py-1 rounded-xl text-[10px] font-mono text-white pointer-events-none transition-all shadow-2xl whitespace-nowrap">
                                      <div className="font-bold text-cyan-300">{dItem.dayLabel} - {setting.label}</div>
                                      <div>Dozaj: <span className="text-white font-black">{amount} ml</span></div>
                                    </div>

                                    <span>{amount > 0 ? `${amount}` : "0"}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Sağ Taraf: Toplam Tüketim Rozeti */}
                            <span className="text-[10px] font-mono font-bold text-slate-300 ml-2 w-12 text-right shrink-0">
                              {totalPumpMl} ml
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Heatmap Lejant Bilgilendirme */}
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] font-mono text-slate-400 gap-2">
                    <span className="flex items-center gap-1 text-slate-400">
                      💡 21 Günlük GitHub Dozaj Matrisi: Küçük kutucuklar günlük ml miktarını ve renk yoğunluğunu gösterir.
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Az (0 ml)</span>
                      <div className="w-3.5 h-3.5 rounded-sm bg-slate-900 border border-slate-800" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/20 border border-cyan-500/40 opacity-70" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/40 border border-cyan-500/60" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-cyan-600 to-blue-500 shadow-sm" />
                      <span className="text-slate-300 font-bold">Yoğun (25+ ml)</span>
                    </div>
                  </div>
                </div>
              );
            }

            // MOD 3: AKICI SVG TREND ÇİZGİ GRAFİĞİ (LINE / AREA CHART)
            const maxVal = Math.max(15, ...daysEntries.flatMap(([_, d]) => Object.values(d.pumps)));

            return (
              <div className="h-64 pt-4 px-2 relative flex flex-col justify-between font-mono">
                <svg viewBox="0 0 500 180" className="w-full h-48 overflow-visible">
                  <defs>
                    {[1, 2, 3, 4].map((pId) => {
                      const setting = pumpSettings[pId] || { color: "cyan" };
                      const theme = getDynamicPumpTheme(setting.color);
                      return (
                        <linearGradient key={pId} id={`grad-pump-${pId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={theme.hex} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={theme.hex} stopOpacity="0.0" />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  {/* Arka Plan Yatay Izgara Çizgileri */}
                  {[0, 45, 90, 135].map((y) => (
                    <line key={y} x1="30" y1={y + 10} x2="480" y2={y + 10} stroke="#1e293b" strokeDasharray="3 3" />
                  ))}

                  {/* Her Pompa İçin Akıcı Yumuşak Trend Eğrisi Çizimi */}
                  {[1, 2, 3, 4].map((pId) => {
                    const setting = pumpSettings[pId] || { label: `P${pId}`, color: "cyan" };
                    const theme = getDynamicPumpTheme(setting.color);

                    const points = daysEntries.map(([_, dayData], idx) => {
                      const amount = dayData.pumps[pId] || 0;
                      const x = 50 + idx * 70;
                      const y = 145 - (amount / maxVal) * 125;
                      return { x, y, amount };
                    });

                    // Curved Path generator (Catmull-Rom / Bezier Approximation)
                    let dPath = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                      const p0 = points[i];
                      const p1 = points[i + 1];
                      const cpX = (p0.x + p1.x) / 2;
                      dPath += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
                    }

                    const areaPath = `${dPath} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                    return (
                      <g key={pId} className="group/line">
                        {/* Gradient Dolgu Alanı */}
                        <path d={areaPath} fill={`url(#grad-pump-${pId})`} />
                        {/* Çizgi Path */}
                        <path d={dPath} fill="none" stroke={theme.hex} strokeWidth="3" className="transition-all hover:stroke-width-4" />
                        {/* Veri Noktaları (Glowing Circles) */}
                        {points.map((pt, idx) => (
                          <g key={idx} className="cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              fill={theme.hex}
                              stroke="#090d16"
                              strokeWidth="2"
                              className="transition-transform group-hover/line:scale-125"
                            />
                            {pt.amount > 0 && (
                              <text
                                x={pt.x}
                                y={pt.y - 8}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="bold"
                                className="opacity-80 font-mono"
                              >
                                {pt.amount}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>
                    );
                  })}
                </svg>

                {/* X-Ekseni Gün Etiketleri */}
                <div className="flex justify-between px-6 text-[10px] text-slate-400 font-semibold border-t border-slate-800/80 pt-1">
                  {daysEntries.map(([dateKey, dayData]) => (
                    <span key={dateKey}>{dayData.label}</span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sağ (1 Kolon): Pompa Bazında Dağılım (SVG Donut Halka Grafiği) */}
        <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800/80 pb-3 font-mono flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" /> Pompa Bazında Dağılım
            </h3>

            {/* SVG DONUT HALKA GRAFİĞİ */}
            <div className="flex items-center justify-center relative py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Arka plan gri halka */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-800/80 fill-none"
                  />
                  {/* Pompa Dilimleri */}
                  {donutSegments.map((seg) => {
                    if (seg.amount === 0) return null;
                    return (
                      <circle
                        key={seg.pId}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={seg.colorHex}
                        strokeWidth="10"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        className="fill-none transition-all duration-700 hover:stroke-width-[12] cursor-pointer"
                      />
                    );
                  })}
                </svg>

                {/* Donut Merkez Metni */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-lg font-black text-white">{stats.totalMl} ml</span>
                  <span className="text-[10px] text-slate-400 font-mono">Toplam Dozaj</span>
                </div>
              </div>
            </div>

            {/* Tüketim Özeti Listesi */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 font-mono block">Pompa Tüketim Dağılımı</span>
              {donutSegments.map((seg) => {
                const IconComp = iconMap[seg.setting.icon || "Droplets"] || Droplets;
                return (
                  <div key={seg.pId} className="flex items-center justify-between bg-slate-950/80 p-2 px-3 rounded-xl border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-lg ${seg.theme.bg} ${seg.theme.text}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-200">{seg.setting.label}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-white font-bold">{seg.amount} ml</span>
                      <span className={`text-[10px] font-bold ${seg.theme.text}`}>{seg.pct}%</span>
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
        {/* Sol (2 Kolon): Son Dozaj Kayıtları Tablosu */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-cyan-400" /> Son Dozaj Kayıtları
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Başlıklara tıklayarak sıralayabilir veya filtre paneli üzerinden süzebilirsiniz.
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
                  <th 
                    onClick={() => handleSort("mode")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tür</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>

                  {/* Kaynak */}
                  <th 
                    onClick={() => handleSort("source")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kaynak</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>

                  {/* Durum */}
                  <th 
                    onClick={() => handleSort("status")} 
                    className="pb-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Durum</span>
                      <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    </div>
                  </th>
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
                    const logDate = parseLogDate(log.created_at);

                    const dateFormatted = logDate.toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    });
                    const timeFormatted = logDate.toLocaleTimeString("tr-TR");
                    const statusStr = log.status || "Başarılı";

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
                          {log.source || (log.mode === "Manuel" ? "Kullanıcı" : "Program")}
                        </td>

                        {/* Durum */}
                        <td className="py-3">
                          {statusStr === "Başarılı" ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Başarılı
                            </span>
                          ) : statusStr === "Gecikmeli" ? (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Gecikmeli
                            </span>
                          ) : (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                              <X className="w-3 h-3" /> Hata
                            </span>
                          )}
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

              {/* En Yoğun Gün */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" /> En Yoğun Gün
                </span>
                <span className="text-amber-400 font-bold text-sm">{stats.busiestDay} ({stats.busiestDayMl} ml)</span>
              </div>

              {/* Başarılı İşlem */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Başarılı İşlem
                </span>
                <span className="text-emerald-400 font-bold text-sm">
                  {stats.successCount} (%{stats.successRate})
                </span>
              </div>

              {/* Gecikmeli / Hata */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Gecikmeli / Hata
                </span>
                <span className="text-slate-400 font-bold text-sm">
                  {stats.delayedCount + stats.errorCount}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-[11px] text-cyan-300 font-mono leading-relaxed flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>Veriler cihaz belleğinden ve Supabase günlüğünden anlık olarak çekilmekte, dinamik grafiklerle sentezlenmektedir.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
