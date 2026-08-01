"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  CalendarClock, 
  Plus, 
  Clock, 
  Trash2, 
  Droplets, 
  Check, 
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Info,
  RefreshCw,
  Minus,
  FlaskConical,
  Zap,
  Shield,
  Heart,
  Sparkles,
  Leaf,
  Droplet,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Copy,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PumpSetting, ScheduleItem } from "@/types/aquamaster";

interface SchedulerTabProps {
  schedules: ScheduleItem[];
  pumpSettings: { [key: number]: PumpSetting };
  onAddSchedule: (newSchedule: Partial<ScheduleItem>) => Promise<void>;
  onDeleteSchedule: (id: number) => Promise<void>;
  onToggleSchedule?: (id: number, currentActiveState: boolean) => Promise<void>;
  onUpdateSchedule?: (id: number, updatedSchedule: Partial<ScheduleItem>) => Promise<void>;
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

const weekDays = [
  { id: 1, name: "Pzt" },
  { id: 2, name: "Sal" },
  { id: 3, name: "Çar" },
  { id: 4, name: "Per" },
  { id: 5, name: "Cum" },
  { id: 6, name: "Cmt" },
  { id: 7, name: "Paz" },
];

const getDynamicPumpTheme = (colorName?: string) => {
  const c = colorName || "cyan";
  const map: { [key: string]: any } = {
    cyan: {
      default: "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:border-cyan-400/80",
      selected: "bg-cyan-900/60 border-2 border-cyan-400 text-white ring-2 ring-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.55)] scale-[1.03] z-10",
      badge: "bg-cyan-900/40 border-cyan-400/50 text-cyan-300",
      badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-800/80",
      text: "text-cyan-400",
    },
    emerald: {
      default: "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:border-emerald-400/80",
      selected: "bg-emerald-900/60 border-2 border-emerald-400 text-white ring-2 ring-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.55)] scale-[1.03] z-10",
      badge: "bg-emerald-900/40 border-emerald-400/50 text-emerald-300",
      badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
      text: "text-emerald-400",
    },
    amber: {
      default: "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400/80",
      selected: "bg-amber-900/60 border-2 border-amber-400 text-white ring-2 ring-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.55)] scale-[1.03] z-10",
      badge: "bg-amber-900/40 border-amber-400/50 text-amber-300",
      badgeBg: "bg-amber-950/80 text-amber-300 border-amber-800/80",
      text: "text-amber-400",
    },
    rose: {
      default: "bg-rose-950/40 border-rose-500/50 text-rose-300 hover:border-rose-400/80",
      selected: "bg-rose-900/60 border-2 border-rose-400 text-white ring-2 ring-rose-400/80 shadow-[0_0_30px_rgba(244,63,94,0.55)] scale-[1.03] z-10",
      badge: "bg-rose-900/40 border-rose-400/50 text-rose-300",
      badgeBg: "bg-rose-950/80 text-rose-300 border-rose-800/80",
      text: "text-rose-400",
    },
    purple: {
      default: "bg-purple-950/40 border-purple-500/50 text-purple-300 hover:border-purple-400/80",
      selected: "bg-purple-900/60 border-2 border-purple-400 text-white ring-2 ring-purple-400/80 shadow-[0_0_30px_rgba(168,85,247,0.55)] scale-[1.03] z-10",
      badge: "bg-purple-900/40 border-purple-400/50 text-purple-300",
      badgeBg: "bg-purple-950/80 text-purple-300 border-purple-800/80",
      text: "text-purple-400",
    },
    blue: {
      default: "bg-blue-950/40 border-blue-500/50 text-blue-300 hover:border-blue-400/80",
      selected: "bg-blue-900/60 border-2 border-blue-400 text-white ring-2 ring-blue-400/80 shadow-[0_0_30px_rgba(59,130,246,0.55)] scale-[1.03] z-10",
      badge: "bg-blue-900/40 border-blue-400/50 text-blue-300",
      badgeBg: "bg-blue-950/80 text-blue-300 border-blue-800/80",
      text: "text-blue-400",
    },
  };
  return map[c] || map.cyan;
};

export default function SchedulerTab({
  schedules,
  pumpSettings,
  onAddSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  onUpdateSchedule,
}: SchedulerTabProps) {
  const [schedPump, setSchedPump] = useState<number>(1);
  const [schedTime, setSchedTime] = useState<string>("08:00");
  const [schedMl, setSchedMl] = useState<number>(15);
  const [schedType, setSchedType] = useState<"daily" | "weekly" | "interval">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 4, 6]);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  // Kaç gün sonra başlasın? Stepper State'i (0 = Bugün, 1 = Yarın, 2 = 2 Gün Sonra...)
  const [startOffsetDays, setStartOffsetDays] = useState<number>(0);

  // Form ve Filtreleme State'leri
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Aktifleştirme Çakışma Modalı State'i
  const [toggleConflictData, setToggleConflictData] = useState<{
    item: ScheduleItem;
    conflictingPumpLabel: string;
    conflictingTime: string;
    suggestedTime: string;
  } | null>(null);

  const monthNamesTr = useMemo(() => [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ], []);

  // Hesaplanan başlangıç tarihi objesi
  const computedStartDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + startOffsetDays);
    return d;
  }, [startOffsetDays]);

  // Formatted YYYY-MM-DD
  const startDate = useMemo(() => {
    return computedStartDateObj.toISOString().split("T")[0];
  }, [computedStartDateObj]);

  const toggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayNum));
      }
    } else {
      setSelectedDays([...selectedDays, dayNum].sort((a, b) => a - b));
    }
  };

  // Akıllı Çakışmasız Müsait Saat Bulucu Algoritması (Aktif & Pasif Tüm Kayıtları Tara)
  const findNextAvailableTime = useCallback((startTimeStr: string): string => {
    const [startH, startM] = startTimeStr.split(":").map(Number);
    let testMins = startH * 60 + startM + 5;

    const occupiedMins = schedules
      .filter((s) => !s.is_one_time && (!editingId || s.id !== editingId))
      .map((s) => {
        const [h, m] = s.run_time.split(":").map(Number);
        return h * 60 + m;
      });

    let attempts = 0;
    while (attempts < 288) {
      if (testMins >= 1440) testMins -= 1440;

      const hasConflict = occupiedMins.some((occ) => {
        const diff = Math.abs(testMins - occ);
        const circularDiff = Math.min(diff, 1440 - diff);
        return circularDiff < 5;
      });

      if (!hasConflict) {
        const sugH = String(Math.floor(testMins / 60)).padStart(2, "0");
        const sugM = String(testMins % 60).padStart(2, "0");
        return `${sugH}:${sugM}`;
      }

      testMins += 5;
      attempts++;
    }

    return startTimeStr;
  }, [schedules, editingId]);

  // 1. ZAMANLAYICI ÇAKIŞMA KONTROLÜ (TÜM KAYITLI AKTİF VE PASİF PROGRAMLARI KONTROL EDER)
  const conflictWarning = useMemo(() => {
    if (!schedTime) return null;

    const [reqH, reqM] = schedTime.split(":").map(Number);
    const reqTotalMins = reqH * 60 + reqM;

    for (const item of schedules) {
      if (item.is_one_time) continue;
      if (editingId && item.id === editingId) continue; // Düzenlenen mevcut kaydı muaf tut

      const [itemH, itemM] = item.run_time.split(":").map(Number);
      const itemTotalMins = itemH * 60 + itemM;
      const diff = Math.abs(reqTotalMins - itemTotalMins);
      const diffMins = Math.min(diff, 1440 - diff);

      const otherPumpName = pumpSettings[item.pump_id]?.label || `${item.pump_id}. Pompa`;
      const statusLabel = item.is_active ? "aktif" : "pasif";

      // 1. Aynı saatte başka HERHANGİ BİR motor tanımlı mı? (Birebir Çakışma)
      if (item.run_time === schedTime) {
        const suggestedTime = findNextAvailableTime(schedTime);

        return {
          hasConflict: true,
          reason: `[${schedTime}] saatinde ${statusLabel} bir program (${otherPumpName} - Kanal ${item.pump_id}) mevcut! Tekrar aktifleştirildiğinde veya çalışırken çakışmaması için aynı saatte başka motor olamaz.`,
          suggestedTime,
        };
      }

      // 2. Başka HERHANGİ BİR motor ile 5 dakika yakınlıkta çakışma var mı?
      if (diffMins < 5) {
        const suggestedTime = findNextAvailableTime(item.run_time);

        return {
          hasConflict: true,
          reason: `[${item.run_time}] saatinde ${statusLabel} durumlu ${otherPumpName} (Kanal ${item.pump_id}) programı var. Çakışma yaşanmaması için motorlar arasında en az 5 dakika olmalıdır.`,
          suggestedTime,
        };
      }
    }

    return null;
  }, [schedTime, schedPump, schedules, pumpSettings, editingId, findNextAvailableTime]);

  // 2. DEPO SEVİYESİ TAHMİNİ & KAÇ GÜN SONRA BİTECEĞİ HESABI (CONTAINER DEPLETION PREDICTION)
  const pumpDepletionStats = useMemo(() => {
    const dailyScheduledMl: { [pumpId: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };

    schedules.forEach((item) => {
      if (!item.is_active || item.is_one_time) return;
      const rate = pumpSettings[item.pump_id]?.rate || 1.0;
      const approxMl = item.duration_seconds * rate;

      if (item.schedule_type === "daily" || !item.schedule_type) {
        dailyScheduledMl[item.pump_id] += approxMl;
      } else if (item.schedule_type === "weekly" && item.days_of_week) {
        dailyScheduledMl[item.pump_id] += (approxMl * item.days_of_week.length) / 7;
      } else if (item.schedule_type === "interval" && item.interval_days) {
        dailyScheduledMl[item.pump_id] += approxMl / item.interval_days;
      }
    });

    const predictions: { [pumpId: number]: { remainingDays: number | null; dailyMl: number; isCritical: boolean } } = {};

    [1, 2, 3, 4].forEach((pId) => {
      const setting = pumpSettings[pId];
      const currentMl = setting?.container_current_ml ?? 1000;
      const dailyMl = dailyScheduledMl[pId];

      if (dailyMl > 0) {
        const remainingDays = Math.floor(currentMl / dailyMl);
        predictions[pId] = {
          remainingDays,
          dailyMl,
          isCritical: remainingDays <= 3,
        };
      } else {
        predictions[pId] = {
          remainingDays: null,
          dailyMl: 0,
          isCritical: false,
        };
      }
    });

    // Toplam Günlük & Aylık Tüketim
    const totalDailyMl = Object.values(dailyScheduledMl).reduce((a, b) => a + b, 0);
    const totalMonthlyMl = Math.round(totalDailyMl * 30);

    return { predictions, totalDailyMl, totalMonthlyMl };
  }, [schedules, pumpSettings]);

  // Filtrelenmiş Programlar Listesi
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      const setting = pumpSettings[item.pump_id] || { label: `${item.pump_id}. Pompa` };
      const matchesSearch =
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.run_time.includes(searchQuery) ||
        `kanal ${item.pump_id}`.includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.is_active
          : !item.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [schedules, pumpSettings, searchQuery, statusFilter]);

  // Düzenleme Modunu Başlatma
  const startEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setSchedPump(item.pump_id);
    setSchedTime(item.run_time);
    const rate = pumpSettings[item.pump_id]?.rate || 1.0;
    setSchedMl(Math.max(1, Math.round(item.duration_seconds * rate)));
    setSchedType(item.schedule_type || "daily");
    if (item.days_of_week) setSelectedDays(item.days_of_week);
    if (item.interval_days) setIntervalDays(item.interval_days);

    if (item.start_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(item.start_date);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      setStartOffsetDays(diffDays);
    } else {
      setStartOffsetDays(0);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Düzenleme Modunu İptal Etme
  const cancelEdit = () => {
    setEditingId(null);
    setSchedPump(1);
    setSchedTime("08:00");
    setSchedMl(15);
    setSchedType("daily");
    setSelectedDays([1, 2, 4, 6]);
    setStartOffsetDays(0);
  };
  // Pasif programı tekrar aktif ederken çakışma güvenlik kontrolü
  const handleToggleWithConflictCheck = (item: ScheduleItem) => {
    if (!item.is_active) {
      const [reqH, reqM] = item.run_time.split(":").map(Number);
      const reqMins = reqH * 60 + reqM;

      const conflictingActive = schedules.find((s) => {
        if (!s.is_active || s.id === item.id || s.is_one_time) return false;
        const [sH, sM] = s.run_time.split(":").map(Number);
        const sMins = sH * 60 + sM;
        const diff = Math.abs(reqMins - sMins);
        return Math.min(diff, 1440 - diff) < 5;
      });

      if (conflictingActive) {
        const otherLabel = pumpSettings[conflictingActive.pump_id]?.label || `${conflictingActive.pump_id}. Pompa`;
        const suggestedTime = findNextAvailableTime(item.run_time);

        setToggleConflictData({
          item,
          conflictingPumpLabel: otherLabel,
          conflictingTime: conflictingActive.run_time,
          suggestedTime,
        });
        return;
      }
    }

    if (onToggleSchedule) {
      onToggleSchedule(item.id, item.is_active);
    }
  };

  // Çakışmasız Önerilen Saati Kabul Edip Programı Güncelleme ve Aktif Etme
  const handleAcceptRescheduleAndActivate = async () => {
    if (!toggleConflictData) return;
    const { item, suggestedTime } = toggleConflictData;
    setToggleConflictData(null);

    if (onUpdateSchedule) {
      await onUpdateSchedule(item.id, { run_time: suggestedTime, is_active: true });
    } else if (onToggleSchedule) {
      await onToggleSchedule(item.id, false);
    }
  };



  // Programı Kopyalama (Çakışmasız En Yakın Müsait Saate)
  const handleDuplicate = async (item: ScheduleItem) => {
    const conflictFreeTime = findNextAvailableTime(item.run_time);

    await onAddSchedule({
      pump_id: item.pump_id,
      run_time: conflictFreeTime,
      duration_seconds: item.duration_seconds,
      is_active: true,
      is_one_time: false,
      schedule_type: item.schedule_type || "daily",
      days_of_week: item.days_of_week || [1, 2, 4, 6],
      interval_days: item.interval_days || 2,
      start_date: item.start_date || new Date().toISOString().split("T")[0],
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const rate = pumpSettings[schedPump]?.rate || 1.0;
    const durationSeconds = Math.max(1, Math.round(schedMl / rate));

    const scheduleData: Partial<ScheduleItem> = {
      pump_id: schedPump,
      run_time: schedTime,
      duration_seconds: durationSeconds,
      is_active: true,
      is_one_time: false,
      schedule_type: schedType,
      days_of_week: selectedDays,
      interval_days: intervalDays,
      start_date: startDate,
    };

    if (editingId && onUpdateSchedule) {
      await onUpdateSchedule(editingId, scheduleData);
      setEditingId(null);
    } else {
      await onAddSchedule(scheduleData);
    }

    setSaving(false);
  };

  const selectedPumpSetting = pumpSettings[schedPump] || { label: `${schedPump}. Pompa`, color: "cyan" };
  const currentRate = selectedPumpSetting.rate || 1.0;
  const estimatedSeconds = Math.max(1, Math.round(schedMl / currentRate));

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* YENİ DOZAJ PROGRAMI OLUŞTURMA / DÜZENLEME KARTI */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={`glass-panel rounded-3xl p-6 border transition-all shadow-2xl space-y-6 ${
        editingId ? "border-amber-500/60 ring-2 ring-amber-500/30" : "border-cyan-500/20"
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              editingId
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
            }`}>
              {editingId ? <Edit3 className="w-6 h-6 animate-pulse" /> : <CalendarClock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {editingId ? "Mevcut Dozaj Programını Düzenle" : "Yeni Dozaj Programı Oluştur"}
                {editingId && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    Düzenleme Modu (#ID {editingId})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {editingId
                  ? "Seçili otomatik dozlama programının parametrelerini güncelleyin"
                  : "Belirlediğiniz saat ve periyotlarda otomatik dozlama görevleri oluşturun"}
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4 text-red-400" />
              <span>İptal Et</span>
            </button>
          )}
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Üst Kısım: Sol Pompa Seçimi (50%), Sağ Saat ve Dozaj Miktarı (50%) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
            {/* Sol Taraf: Pompa Seçimi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Pompa Seçimi</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((pId) => {
                  const setting = pumpSettings[pId] || { label: `${pId}. Pompa`, color: "cyan", icon: "Droplets" };
                  const IconComp = iconMap[setting.icon || "Droplets"] || Droplets;
                  const isSelected = schedPump === pId;
                  const theme = getDynamicPumpTheme(setting.color);

                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => setSchedPump(pId)}
                      className={`h-[92px] p-2 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center select-none active:scale-95 ${
                        isSelected ? theme.selected : theme.default
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center mb-0.5 ${theme.badge}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs truncate max-w-full text-slate-100">{setting.label}</span>
                      <span className="text-[10px] font-mono opacity-80">Kanal {pId}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sağ Taraf: Çalışma Saati & Dozaj Miktarı (50-50 Yan Yana) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Çalışma Saati */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Çalışma Saati</label>
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 px-4 flex items-center justify-center gap-4 shadow-inner h-[92px]">
                  <div className="w-9 h-9 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    {/* Saat Stepper */}
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const [h, m] = schedTime.split(":").map(Number);
                          const newH = (h + 1) % 24;
                          setSchedTime(`${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
                        }}
                        className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer select-none"
                      >
                        ▲
                      </button>
                      <span className="text-xl font-black text-white tracking-widest">{schedTime.split(":")[0]}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const [h, m] = schedTime.split(":").map(Number);
                          const newH = (h - 1 + 24) % 24;
                          setSchedTime(`${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
                        }}
                        className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer select-none"
                      >
                        ▼
                      </button>
                    </div>

                    <span className="text-xl font-black text-cyan-400 mb-0.5">:</span>

                    {/* Dakika Stepper */}
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const [h, m] = schedTime.split(":").map(Number);
                          const newM = (m + 5) % 60;
                          setSchedTime(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
                        }}
                        className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer select-none"
                      >
                        ▲
                      </button>
                      <span className="text-xl font-black text-white tracking-widest">{schedTime.split(":")[1]}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const [h, m] = schedTime.split(":").map(Number);
                          const newM = (m - 5 + 60) % 60;
                          setSchedTime(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
                        }}
                        className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer select-none"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dozaj Miktarı (ml) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Dozaj Miktarı (ml)</label>
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 px-4 flex flex-col justify-center gap-1 shadow-inner h-[92px]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSchedMl((prev) => Math.max(1, prev - 5))}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xl font-black text-white px-2">{schedMl}</span>
                    <button
                      type="button"
                      onClick={() => setSchedMl((prev) => prev + 5)}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono text-center truncate">Tahmini süre: ~{estimatedSeconds} saniye</p>
                </div>
              </div>
            </div>
          </div>

          {/* Depo Ömrü Tahmini İkazı */}
          {pumpDepletionStats.predictions[schedPump]?.remainingDays !== null && (
            <div className="text-[11px] font-mono flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
              {pumpDepletionStats.predictions[schedPump].isCritical ? (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  ⚠️ Depo ~{pumpDepletionStats.predictions[schedPump].remainingDays} gün sonra tükenecek! Depoyu doldurmayı unutmayın.
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  💧 Depodaki sıvı mevcut programlar ile ~{pumpDepletionStats.predictions[schedPump].remainingDays} gün yeterli ({pumpDepletionStats.predictions[schedPump].dailyMl.toFixed(1)} ml/gün tüketim).
                </span>
              )}
            </div>
          )}

          {/* Alt Satır: Tekrarlama Periyodu */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tekrarlama Periyodu</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "daily", title: "Her Gün", icon: RefreshCw },
                { id: "weekly", title: "Belirli Günler", icon: Calendar },
                { id: "interval", title: "Aralıklı Gün", icon: Clock },
              ].map((item) => {
                const ItemIcon = item.icon;
                const isSelected = schedType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSchedType(item.id as any)}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
                      isSelected
                        ? "border-2 border-cyan-500/80 bg-cyan-950/40 text-white font-bold shadow-lg shadow-cyan-950/50"
                        : "bg-slate-950/70 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <ItemIcon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Haftalık Günler Seçimi */}
          {schedType === "weekly" && (
            <div className="space-y-2 animate-in fade-in">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Çalışılacak Günler:</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {selectedDays.length} gün seçili
                </span>
              </label>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekDays.map((d) => {
                  const isSelected = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`py-2 px-1 sm:py-3 sm:px-2 rounded-2xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                        isSelected
                          ? "bg-gradient-to-b from-emerald-500 to-teal-600 text-white border border-emerald-400/60 shadow-md shadow-emerald-950/50"
                          : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        {isSelected ? (
                          <div className="w-5 h-5 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75 duration-200">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-700 rounded-full transition-colors" />
                        )}
                      </div>
                      <span className="font-mono text-[11px]">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aralıklı Gün Seçimi (Tasarım Bütünlüklü Periyot Stepper ve Başlangıç Tarihi) */}
          {schedType === "interval" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
              {/* 1. Her Kaç Günde Bir? Stepper (Dozaj Miktarı ile 1:1 Aynı Tasarım) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">Her Kaç Günde Bir?</label>
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 px-4 flex flex-col justify-center gap-1 shadow-inner h-[88px]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIntervalDays((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xl font-black text-white px-2">{intervalDays}</span>
                    <button
                      type="button"
                      onClick={() => setIntervalDays((prev) => Math.min(30, prev + 1))}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono text-center truncate">günde 1 kez çalışır</p>
                </div>
              </div>

              {/* 2. İlk Başlangıç Günü Stepper (Tasarım Bütünlüklü Stepper) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">İlk Başlangıç Günü</label>
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 px-4 flex flex-col justify-center gap-1 shadow-inner h-[88px]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStartOffsetDays((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-center px-1">
                      <span className="font-mono text-base font-black text-cyan-300 block truncate max-w-[160px]">
                        {startOffsetDays === 0
                          ? "Bugün"
                          : startOffsetDays === 1
                          ? "Yarın"
                          : `${startOffsetDays} Gün Sonra`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStartOffsetDays((prev) => Math.min(30, prev + 1))}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-400 font-mono text-center truncate">
                    Tarih: {computedStartDateObj.getDate()} {monthNamesTr[computedStartDateObj.getMonth()]} {computedStartDateObj.getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ÇAKIŞMA UYARI PANERİ VE ERTELEME TAVSİYESİ */}
          {conflictWarning && conflictWarning.hasConflict && (
            <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs space-y-2 animate-in fade-in shadow-xl">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-300 text-sm">Zamanlayıcı Çakışma Uyarısı!</h4>
                  <p className="font-mono text-[11px] text-amber-200/90">{conflictWarning.reason}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-amber-500/30">
                <span className="font-mono text-[11px]">
                  Tavsiye Edilen Alternatif Saat: <b className="text-white font-bold">{conflictWarning.suggestedTime}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setSchedTime(conflictWarning.suggestedTime)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Tavsiye Edilen Saati Kullan ({conflictWarning.suggestedTime})
                </button>
              </div>
            </div>
          )}

          {/* Ekle / Güncelle Butonu */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 ${
                editingId
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/60"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-950/60"
              } text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50`}
            >
              {saving ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{editingId ? "✓ Program Değişikliklerini Kaydet" : "+ Zamanlayıcı Programını Kaydet"}</span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3.5 px-5 rounded-2xl text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* KAYITLI PROGRAMLAR LİSTESİ VE ARAMA / FİLTRELEME */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> Kayıtlı Otomatik Programlar
            <span className="bg-slate-900 text-slate-400 border border-slate-800 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
              {filteredSchedules.length} Program
            </span>
          </h3>

          {/* Arama & Filtre Kontrolleri */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Program ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-900">Tümü</option>
                <option value="active" className="bg-slate-900">Aktif</option>
                <option value="passive" className="bg-slate-900">Pasif</option>
              </select>
            </div>
          </div>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono bg-slate-950/40 rounded-2xl border border-slate-800/60">
            Kayıtlı otomatik dozlama programı bulunamadı.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchedules.map((item) => {
              const setting = pumpSettings[item.pump_id] || { label: `${item.pump_id}. Pompa`, color: "cyan", icon: "Droplets" };
              const IconComp = iconMap[setting.icon || "Droplets"] || Droplets;
              const theme = getDynamicPumpTheme(setting.color);
              const isBeingEdited = editingId === item.id;

              // Tekrar Özeti
              let repeatSummary = "Her Gün";
              if (item.schedule_type === "weekly" && item.days_of_week) {
                repeatSummary = item.days_of_week
                  .map((dId) => weekDays.find((w) => w.id === dId)?.name)
                  .filter(Boolean)
                  .join(", ");
              } else if (item.schedule_type === "interval" && item.interval_days) {
                repeatSummary = `${item.interval_days} günde 1 kez`;
              }

              return (
                <div
                  key={item.id}
                  className={`bg-slate-950/90 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-inner ${
                    isBeingEdited
                      ? "border-amber-500/80 bg-amber-950/20 ring-1 ring-amber-500/50"
                      : "border-slate-800/80 hover:border-slate-700/80"
                  }`}
                >
                  {/* Pompa İkonu & İsim */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${theme.badgeBg}`}>
                      <IconComp className={`w-5 h-5 ${theme.text}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {setting.label}
                        <span className="text-[10px] font-mono text-slate-400 font-normal">Kanal {item.pump_id}</span>
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">{repeatSummary}</p>
                    </div>
                  </div>

                  {/* Saat & Dozaj Miktarı */}
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Clock className={`w-3.5 h-3.5 ${theme.text}`} />
                      <span className="font-bold text-sm text-white">{item.run_time}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Droplet className={`w-3.5 h-3.5 ${theme.text}`} />
                      <span className="font-bold text-white">
                        {Math.round(item.duration_seconds * (setting.rate || 1.0))} ml
                      </span>
                      <span className="text-[10px] text-slate-400">(~{item.duration_seconds}s)</span>
                    </div>

                    {/* Sonraki Çalışma Geri Sayımı */}
                    <div className="hidden lg:flex flex-col text-[10px]">
                      <span className={`${theme.text} font-semibold flex items-center gap-1`}>
                        <CheckCircle2 className={`w-3 h-3 ${theme.text}`} />
                        Sonraki: Bugün {item.run_time}
                      </span>
                    </div>
                  </div>

                  {/* Durum Toggle, Kopyala, Düzenle & Sil Butonları */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Toggle Switch (Çakışma Güvenlikli) */}
                    <button
                      type="button"
                      onClick={() => handleToggleWithConflictCheck(item)}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer select-none active:scale-95 ${
                        item.is_active ? "bg-emerald-500 justify-end" : "bg-slate-800 justify-start"
                      }`}
                      title={item.is_active ? "Programı Pasif Yap" : "Programı Aktif Yap"}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md transition-transform" />
                    </button>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                        item.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-800/80 text-slate-400 border-slate-700/80"
                      }`}
                    >
                      {item.is_active ? "Aktif" : "Pasif"}
                    </span>

                    {/* Kopyala Butonu */}
                    <button
                      onClick={() => handleDuplicate(item)}
                      className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-cyan-500/10 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                      title="Programı Kopyala (5 dk sonraya)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Düzenle Butonu */}
                    <button
                      onClick={() => startEdit(item)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isBeingEdited
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "text-slate-400 hover:text-amber-300 bg-slate-900 hover:bg-amber-500/10 border-slate-800"
                      }`}
                      title="Programı Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Sil Butonu (Güvenlik Onay Modalı Açılır) */}
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                      title="Programı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* SİLME GÜVENLİK ONAY MODALI (DELETE CONFIRMATION MODAL) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-3xl border border-red-500/40 shadow-2xl max-w-md w-full space-y-4 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center text-red-400 mx-auto animate-bounce">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Zamanlayıcı Programını Sil</h3>
              <p className="text-xs text-slate-300 font-mono mt-1">
                <b className="text-red-300 font-bold">
                  {pumpSettings[schedules.find((s) => s.id === confirmDeleteId)?.pump_id || 1]?.label}
                </b>{" "}
                ({schedules.find((s) => s.id === confirmDeleteId)?.run_time}) otomatik görevini silmek istediğinize emin misiniz?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  if (id) await onDeleteSchedule(id);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-red-950/60 transition-all active:scale-95 cursor-pointer"
              >
                Evet, Programı Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ÇAKIŞMA OTOMATİK SAAT KAYDIRMA VE AKTİF ETME MODALI */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {toggleConflictData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/50 shadow-2xl max-w-md w-full space-y-4 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 mx-auto animate-bounce">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Aktifleştirme Çakışma Uyarısı!</h3>
              <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
                <b className="text-amber-300 font-bold">[{toggleConflictData.item.run_time}]</b> saatindeki bu program, halihazırda aktif çalışan{" "}
                <b className="text-white font-bold">"{toggleConflictData.conflictingPumpLabel}"</b> ({toggleConflictData.conflictingTime}) programı ile çakışmaktadır.
              </p>
              <div className="mt-3 p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-xs font-mono text-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 block">Önerilen Çakışmasız Müsait Saat:</span>
                <span className="text-emerald-400 text-sm font-black block">
                  {toggleConflictData.suggestedTime}
                </span>
                <span className="text-[10px] text-slate-400 block">Bu saate güncellenerek aktif edilsin mi?</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setToggleConflictData(null)}
                className="w-full sm:flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
              >
                Pasif Kalsın
              </button>
              <button
                type="button"
                onClick={handleAcceptRescheduleAndActivate}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Evet, ({toggleConflictData.suggestedTime}) Yap & Aktif Et</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* CANLI İSTATİSTİK ÖZET KARTLARI */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Toplam Program</span>
            <span className="font-mono text-base font-black text-white">{schedules.length}</span>
            <span className="text-[10px] font-mono text-slate-500 block">
              Aktif {schedules.filter((s) => s.is_active).length} • Pasif {schedules.filter((s) => !s.is_active).length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Günlük Tahmini Tüketim</span>
            <span className="font-mono text-base font-black text-emerald-400">
              {pumpDepletionStats.totalDailyMl.toFixed(0)} ml
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">~{Math.round(pumpDepletionStats.totalDailyMl)} saniye</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Aylık Tahmini Tüketim</span>
            <span className="font-mono text-base font-black text-purple-300">
              {pumpDepletionStats.totalMonthlyMl.toLocaleString("tr-TR")} ml
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">30 günlük periyot</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">En Yakın Depo Ömrü</span>
            <span className="font-mono text-base font-black text-amber-300">
              {Object.values(pumpDepletionStats.predictions).some((p) => p.remainingDays !== null)
                ? `${Math.min(...Object.values(pumpDepletionStats.predictions).filter((p) => p.remainingDays !== null).map((p) => p.remainingDays!))} Gün`
                : "Belirsiz"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">Programlı depo tüketimi</span>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ALT BİLGİ & ÇEVRİMDIŞI ÇALIŞMA GÜVENCE ÇUBUĞU */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Programlar ESP32 cihazında saklanır ve internet bağlantısı olmasa bile çalışmaya devam eder.</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span>Son senkronizasyon: {new Date().toLocaleTimeString("tr-TR")}</span>
          <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
        </div>
      </footer>
    </div>
  );
}
