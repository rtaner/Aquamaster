"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { 
  Droplets, 
  Clock, 
  CalendarClock, 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Power
} from "lucide-react";
import { PumpSetting, DosingLog, ActiveDosingState, ScheduleItem } from "@/types/aquamaster";
import GlobalHeader from "./components/GlobalHeader";
import ManualPumpCard from "./components/ManualPumpCard";
import DosingConfirmModal from "./components/DosingConfirmModal";
import CalibrationWizard from "./components/CalibrationWizard";
import PumpSettingsModal from "./components/PumpSettingsModal";
import SchedulerTab from "./components/SchedulerTab";
import DosingLogsTab from "./components/DosingLogsTab";
import { FileText } from "lucide-react";

const DEFAULT_PUMP_SETTINGS: { [key: number]: PumpSetting } = {
  1: { pump_id: 1, rate: 1.0, label: "Gübre A", color: "cyan", icon: "Droplets", max_limit_ml: 50, container_total_ml: 1000, container_current_ml: 850 },
  2: { pump_id: 2, rate: 1.0, label: "Gübre B", color: "emerald", icon: "FlaskConical", max_limit_ml: 50, container_total_ml: 1000, container_current_ml: 900 },
  3: { pump_id: 3, rate: 1.0, label: "pH Düşürücü", color: "rose", icon: "Zap", max_limit_ml: 25, container_total_ml: 500, container_current_ml: 400 },
  4: { pump_id: 4, rate: 1.0, label: "Cal-Mag", color: "purple", icon: "Sparkles", max_limit_ml: 50, container_total_ml: 1000, container_current_ml: 950 },
};

export default function AquaMaster() {
  const [activeTab, setActiveTab] = useState<"manual" | "scheduler" | "calibration" | "logs">("manual");
  const [loading, setLoading] = useState<number | null>(null);
  const [calibLoading, setCalibLoading] = useState<number | null>(null);
  const [calibSaving, setCalibSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // ESP32 Telemetri Durumları
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [deviceIp, setDeviceIp] = useState<string | null>(null);
  const [lastSeenTime, setLastSeenTime] = useState<number | null>(null);

  // Pompalar, Loglar ve Zamanlayıcılar (SSR Uyumlu)
  const [pumpSettings, setPumpSettings] = useState<{ [key: number]: PumpSetting }>(DEFAULT_PUMP_SETTINGS);
  const [dosingLogs, setDosingLogs] = useState<DosingLog[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Aktif Dozlama Geri Sayımı ve Tamamlanan Dozaj State'leri
  const [activeDosing, setActiveDosing] = useState<{ [pumpId: number]: ActiveDosingState }>({});
  const [completedDosing, setCompletedDosing] = useState<{ [pumpId: number]: { targetMl: number; durationSeconds: number; label: string } }>({});

  // Modallar
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [confirmModalPumpId, setConfirmModalPumpId] = useState<number | null>(null);
  const [confirmModalMl, setConfirmModalMl] = useState<number>(15);
  const [editingPumpId, setEditingPumpId] = useState<number | null>(null);

  // Hortum Havası Alma (Priming)
  const [primingPump, setPrimingPump] = useState<number | null>(null);
  const primeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mounted Ref
  const isMountedRef = useRef<boolean>(true);

  const bildirimGoster = (text: string, type: "success" | "error") => {
    if (isMountedRef.current) {
      setMessage({ text, type });
      setTimeout(() => {
        if (isMountedRef.current) setMessage(null);
      }, 5000);
    }
  };

  // 1. Hydration tamamlandıktan sonra localStorage'dan yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aquamaster_pump_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPumpSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  // 2. Yalnızca yükleme tamamlandıktan sonra localStorage'a kaydet
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("aquamaster_pump_settings", JSON.stringify(pumpSettings));
    } catch (e) {}
  }, [pumpSettings, isLoaded]);

  // Sayfa Yüklendiğinde ve Aralıklarla Verileri Çek
  useEffect(() => {
    isMountedRef.current = true;
    setCurrentTime(new Date());

    fetchPumpSettings();
    fetchSchedules();
    fetchDeviceStatus();
    fetchDosingLogs();

    const timer = setInterval(() => {
      if (isMountedRef.current) setCurrentTime(new Date());
    }, 1000);
    const statusTimer = setInterval(() => {
      if (isMountedRef.current) fetchDeviceStatus();
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  // Canlı Geri Sayım Zamanlayıcısı
  useEffect(() => {
    const activePumpIds = Object.keys(activeDosing).map(Number);
    if (activePumpIds.length === 0) return;

    const timer = setInterval(() => {
      setActiveDosing((prev) => {
        const next = { ...prev };
        let hasChanges = false;

        Object.keys(next).forEach((keyStr) => {
          const pumpId = Number(keyStr);
          if (next[pumpId]) {
            if (next[pumpId].remainingSeconds > 1) {
              next[pumpId] = {
                ...next[pumpId],
                remainingSeconds: next[pumpId].remainingSeconds - 1,
              };
              hasChanges = true;
            } else {
              const finished = next[pumpId];
              delete next[pumpId];
              hasChanges = true;

              // Dozajlama bittiğinde başarı özet kartını doldur!
              if (finished) {
                setCompletedDosing((prevComp) => ({
                  ...prevComp,
                  [pumpId]: {
                    targetMl: finished.targetMl,
                    durationSeconds: finished.dosingDuration,
                    label: pumpSettings[pumpId]?.label || `${pumpId}. Pompa`,
                  },
                }));
              }
            }
          }
        });

        return hasChanges ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDosing, pumpSettings]);

  // ESP32 Canlılık Durumu Çekme
  const fetchDeviceStatus = async () => {
    try {
      const { data } = await supabase
        .from("device_status")
        .select("*")
        .eq("id", 1)
        .single();

      if (!isMountedRef.current) return;

      if (data && data.last_seen) {
        const lastSeen = new Date(data.last_seen).getTime();
        setLastSeenTime(lastSeen);
        if (data.ip_address) setDeviceIp(data.ip_address);
        const now = new Date().getTime();
        const diffSec = (now - lastSeen) / 1000;
        setIsOnline(diffSec < 35);
      } else {
        setIsOnline(false);
      }
    } catch (e) {
      if (isMountedRef.current) setIsOnline(false);
    }
  };

  // Pompa Ayarlarını Supabase'den Çekme ve Birleştirme
  const fetchPumpSettings = async () => {
    const { data } = await supabase.from("pump_settings").select("*");
    if (!isMountedRef.current) return;

    if (data && data.length > 0) {
      setPumpSettings((prev) => {
        const updated = { ...prev };
        data.forEach((item: any) => {
          const id = item.pump_id;
          updated[id] = {
            ...updated[id],
            pump_id: id,
            rate: item.ml_per_second || updated[id]?.rate || 1.0,
            label: item.label && item.label.trim() !== "" ? item.label : updated[id]?.label || `${id}. Pompa`,
          };
        });
        return updated;
      });
    }
  };

  // Dozaj Loglarını Çekme
  const fetchDosingLogs = async () => {
    if (isMountedRef.current) setLogsLoading(true);
    const { data } = await supabase
      .from("dosing_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (!isMountedRef.current) return;
    if (data) setDosingLogs(data);
    setLogsLoading(false);
  };

  // Zamanlayıcı Programlarını Çekme
  const fetchSchedules = async () => {
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("is_one_time", false)
      .order("run_time", { ascending: true });

    if (!isMountedRef.current) return;
    if (data) setSchedules(data);
  };

  // Hortum Havası Alma (Priming)
  const startPriming = (pumpId: number) => {
    if (!deviceIp) {
      bildirimGoster("ESP32 Lokal IP adresi henüz alınamadı. Cihazın açık olduğundan emin olun.", "error");
      return;
    }
    setPrimingPump(pumpId);

    const sendSignal = (state: "on" | "off") => {
      fetch(`http://${deviceIp}/prime?pump=${pumpId}&state=${state}`, { mode: "no-cors" }).catch(() => {});
    };

    sendSignal("on");
    if (primeIntervalRef.current) clearInterval(primeIntervalRef.current);
    primeIntervalRef.current = setInterval(() => sendSignal("on"), 500);
  };

  const stopPriming = (pumpId: number) => {
    if (primeIntervalRef.current) {
      clearInterval(primeIntervalRef.current);
      primeIntervalRef.current = null;
    }
    setPrimingPump(null);
    if (deviceIp) {
      fetch(`http://${deviceIp}/prime?pump=${pumpId}&state=off`, { mode: "no-cors" }).catch(() => {});
    }
  };

  // Manuel Dozaj Tetikleme İsteği (Onay Modalı Açılır)
  const handleRequestDose = (pumpId: number, targetMl: number) => {
    if (isOnline !== true) {
      bildirimGoster("Cihaz Çevrimdışı! ESP32 bağlı olmadığı için manuel dozlama başlatılamıyor.", "error");
      return;
    }
    setConfirmModalPumpId(pumpId);
    setConfirmModalMl(targetMl);
  };

  // Manuel Dozajlama Onaylandıktan Sonra Tetikleme
  const handleExecuteDose = async () => {
    if (!confirmModalPumpId) return;
    const pumpId = confirmModalPumpId;
    const targetMl = confirmModalMl;
    setConfirmModalPumpId(null);
    setLoading(pumpId);

    const setting = pumpSettings[pumpId] || DEFAULT_PUMP_SETTINGS[pumpId];
    const rate = setting.rate || 1.0;
    const durationSeconds = Math.max(1, Math.round(targetMl / rate));

    let delaySeconds = 5;
    if (isOnline && lastSeenTime) {
      const nowMs = new Date().getTime();
      const elapsedSec = (nowMs - lastSeenTime) / 1000;
      delaySeconds = Math.max(1, Math.ceil(10 - (elapsedSec % 10)));
    }

    const totalCountdown = delaySeconds + durationSeconds;

    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hedefSaat = now.toTimeString().split(" ")[0];

    // 1. ESP32 emir ekle
    const { error } = await supabase.from("schedules").insert([
      {
        pump_id: pumpId,
        run_time: hedefSaat,
        duration_seconds: durationSeconds,
        is_active: true,
        is_one_time: true,
      },
    ]);

    // 2. Log ekle
    await supabase.from("dosing_logs").insert([
      {
        pump_id: pumpId,
        ml_amount: targetMl,
        duration_seconds: durationSeconds,
        mode: "Manuel",
      },
    ]);

    if (error) {
      bildirimGoster("Hata: " + error.message, "error");
    } else {
      // Aktif Dozaj geri sayımını başlat
      setActiveDosing((prev) => ({
        ...prev,
        [pumpId]: {
          remainingSeconds: totalCountdown,
          totalSeconds: totalCountdown,
          dosingDuration: durationSeconds,
          delaySeconds: delaySeconds,
          targetMl: targetMl,
        },
      }));

      // Şişe seviyesini düşür
      setPumpSettings((prev) => {
        const curr = prev[pumpId];
        if (!curr) return prev;
        const currentMl = curr.container_current_ml ?? 1000;
        return {
          ...prev,
          [pumpId]: {
            ...curr,
            container_current_ml: Math.max(0, currentMl - targetMl),
          },
        };
      });

      // Manuel dozlamada kart içi canlı sayaç (RadialProgress) gösterildiği için üst bildirim kaldırıldı.
      // Logları tazele
      fetchDosingLogs();
    }

    setLoading(null);
  };

  // Global ACİL DURDUR (E-STOP)
  const handleEmergencyStop = async () => {
    // 1. Canlı geri sayımı durdur
    setActiveDosing({});

    // 2. Priming'i kes
    if (primeIntervalRef.current) {
      clearInterval(primeIntervalRef.current);
      primeIntervalRef.current = null;
    }
    setPrimingPump(null);

    // 3. ESP32 lokal HTTP sinyali gönder
    if (deviceIp) {
      fetch(`http://${deviceIp}/prime?pump=1&state=off`, { mode: "no-cors" }).catch(() => {});
      fetch(`http://${deviceIp}/prime?pump=2&state=off`, { mode: "no-cors" }).catch(() => {});
      fetch(`http://${deviceIp}/prime?pump=3&state=off`, { mode: "no-cors" }).catch(() => {});
      fetch(`http://${deviceIp}/prime?pump=4&state=off`, { mode: "no-cors" }).catch(() => {});
    }

    // 4. Supabase'deki bekleyen tek seferlik emirleri sil
    await supabase.from("schedules").delete().eq("is_one_time", true);

    bildirimGoster("🚨 ACİL DURDURMA TETİKLENDİ! Tüm çalışan ve bekleyen pompalar anında durduruldu.", "error");
  };

  // Kalibrasyon Test Çalıştırması (10s)
  const handleRunCalibrationTest = async (pumpId: number) => {
    if (isOnline !== true) {
      bildirimGoster("Cihaz Çevrimdışı! ESP32 bağlı olmadığı için kalibrasyon testi başlatılamıyor.", "error");
      return;
    }

    setCalibLoading(pumpId);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hedefSaat = now.toTimeString().split(" ")[0];

    await supabase.from("schedules").insert([
      {
        pump_id: pumpId,
        run_time: hedefSaat,
        duration_seconds: 10,
        is_active: true,
        is_one_time: true,
      },
    ]);

    bildirimGoster(`${pumpId}. Pompa için 10 saniyelik test komutu gönderildi.`, "success");
    setCalibLoading(null);
  };

  // Kalibrasyon Hızını Kaydetme
  const handleSaveCalibrationRate = async (pumpId: number, newRate: number) => {
    setCalibSaving(pumpId);
    const nowIso = new Date().toISOString();
    await supabase.from("pump_settings").upsert({
      pump_id: pumpId,
      ml_per_second: newRate,
      label: pumpSettings[pumpId]?.label || `${pumpId}. Pompa`,
      last_calibrated_at: nowIso,
    });

    setPumpSettings((prev) => ({
      ...prev,
      [pumpId]: {
        ...prev[pumpId],
        rate: newRate,
        last_calibrated_at: nowIso,
      },
    }));

    bildirimGoster(`${pumpId}. Pompa yeni akış hızı (${newRate.toFixed(3)} ml/sn) kaydedildi.`, "success");
    setCalibSaving(null);
  };

  // Pompa Ayarlarını Güncelleme (Label, Icon, Color, Max Limit, Container Volume)
  const handleSavePumpSettings = async (updated: PumpSetting) => {
    await supabase.from("pump_settings").upsert({
      pump_id: updated.pump_id,
      ml_per_second: updated.rate,
      label: updated.label,
    });

    setPumpSettings((prev) => ({
      ...prev,
      [updated.pump_id]: updated,
    }));

    bildirimGoster(`${updated.label} (Kanal ${updated.pump_id}) ayarları güncellendi.`, "success");
  };

  // Şişe Depoyu Doldurma
  const handleRefillContainer = (pumpId: number) => {
    setPumpSettings((prev) => {
      const curr = prev[pumpId];
      if (!curr) return prev;
      const totalMl = curr.container_total_ml || 1000;
      return {
        ...prev,
        [pumpId]: {
          ...curr,
          container_current_ml: totalMl,
        },
      };
    });
    bildirimGoster(`${pumpSettings[pumpId]?.label || pumpId} deposu yeniden dolduruldu.`, "success");
  };

  // Zamanlayıcı Programı Ekleme & Silme
  const handleAddSchedule = async (newSchedule: Partial<ScheduleItem>) => {
    const { error } = await supabase.from("schedules").insert([newSchedule]);
    if (error) bildirimGoster("Program ekleme hatası: " + error.message, "error");
    else {
      bildirimGoster("Zamanlayıcı programı eklendi.", "success");
      fetchSchedules();
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) bildirimGoster("Silme hatası: " + error.message, "error");
    else {
      bildirimGoster("Program silindi.", "success");
      fetchSchedules();
    }
  };

  const handleUpdateSchedule = async (id: number, updatedSchedule: Partial<ScheduleItem>) => {
    const { error } = await supabase
      .from("schedules")
      .update(updatedSchedule)
      .eq("id", id);

    if (error) {
      bildirimGoster("Program güncelleme hatası: " + error.message, "error");
    } else {
      bildirimGoster("Zamanlayıcı programı güncellendi.", "success");
      fetchSchedules();
    }
  };

  const handleToggleSchedule = async (id: number, currentActiveState: boolean) => {
    const nextState = !currentActiveState;
    // Anında akıcı UI tepkisi için yerel state güncellemesi
    setSchedules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_active: nextState } : item))
    );

    const { error } = await supabase
      .from("schedules")
      .update({ is_active: nextState })
      .eq("id", id);

    if (error) {
      bildirimGoster("Durum değiştirme hatası: " + error.message, "error");
      fetchSchedules();
    } else {
      bildirimGoster(
        `Program ${nextState ? "aktif (etkin)" : "pasif (devre dışı)"} yapıldı.`,
        "success"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* GLOBAL HEADER BAR */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <GlobalHeader
        isOnline={isOnline}
        deviceIp={deviceIp}
        lastSeenTime={lastSeenTime}
        currentTime={currentTime}
        onOpenLogs={() => setActiveTab("logs")}
        onEmergencyStop={handleEmergencyStop}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ANA İÇERİK & TAB GEÇİŞLERİ */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Bildirim Toast Mesajı */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-in slide-in-from-top-4 shadow-xl ${
              message.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-red-950/80 border-red-500/50 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Butonları */}
        <div className="glass-panel p-1.5 rounded-2xl flex items-center justify-between border border-cyan-500/20 max-w-3xl mx-auto">
          {[
            { id: "manual", title: "Manuel Dozaj", icon: Droplets },
            { id: "scheduler", title: "Zamanlayıcı", icon: CalendarClock },
            { id: "calibration", title: "Kalibrasyon Sihirbazı", icon: FlaskConical },
            { id: "logs", title: "Dozaj Logları & Analizler", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 1: MANUEL DOZAJ KARTLARI (4 KANAL) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "manual" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
            {[1, 2, 3, 4].map((pumpId) => {
              const setting = pumpSettings[pumpId] || DEFAULT_PUMP_SETTINGS[pumpId];
              const lastLog = dosingLogs.find((l) => l.pump_id === pumpId);

              return (
                <ManualPumpCard
                  key={pumpId}
                  setting={setting}
                  lastLog={lastLog}
                  activeState={activeDosing[pumpId]}
                  completedState={completedDosing[pumpId]}
                  isOnline={isOnline}
                  loading={loading === pumpId}
                  primingPump={primingPump}
                  onStartPriming={startPriming}
                  onStopPriming={stopPriming}
                  onDoseClick={handleRequestDose}
                  onOpenSettings={(id) => setEditingPumpId(id)}
                  onRefillContainer={handleRefillContainer}
                  onDismissCompletion={(id) =>
                    setCompletedDosing((prev) => {
                      const next = { ...prev };
                      delete next[id];
                      return next;
                    })
                  }
                />
              );
            })}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 2: ESNEK ZAMANLAYICI PROGRAMLARI */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "scheduler" && (
          <SchedulerTab
            schedules={schedules}
            pumpSettings={pumpSettings}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onToggleSchedule={handleToggleSchedule}
            onUpdateSchedule={handleUpdateSchedule}
          />
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 3: ADIM ADIM KALİBRASYON SİHİRBAZI */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "calibration" && (
          <CalibrationWizard
            logs={dosingLogs}
            pumpSettings={pumpSettings}
            isOnline={isOnline}
            calibLoading={calibLoading}
            calibSaving={calibSaving}
            primingPump={primingPump}
            onStartPriming={startPriming}
            onStopPriming={stopPriming}
            onRunTest={handleRunCalibrationTest}
            onSaveCalibration={handleSaveCalibrationRate}
          />
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 4: DOZAJ LOGLARI & ANALİZLER */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "logs" && (
          <DosingLogsTab
            logs={dosingLogs}
            logsLoading={logsLoading}
            pumpSettings={pumpSettings}
            onRefreshLogs={fetchDosingLogs}
          />
        )}
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* MODALLAR */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Dozaj Güvenlik Onay Modalı */}
      <DosingConfirmModal
        isOpen={confirmModalPumpId !== null}
        pumpSetting={confirmModalPumpId ? pumpSettings[confirmModalPumpId] || null : null}
        targetMl={confirmModalMl}
        onConfirm={handleExecuteDose}
        onClose={() => setConfirmModalPumpId(null)}
      />

      {/* Pompa Ayarları Modalı */}
      <PumpSettingsModal
        isOpen={editingPumpId !== null}
        setting={editingPumpId ? pumpSettings[editingPumpId] || null : null}
        onSave={handleSavePumpSettings}
        onClose={() => setEditingPumpId(null)}
      />


    </div>
  );
}