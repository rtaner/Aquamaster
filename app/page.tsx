"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { 
  Droplets, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  CalendarClock, 
  Power, 
  Trash2, 
  Plus, 
  Gauge, 
  FlaskConical, 
  Save, 
  Play, 
  Info,
  ChevronDown,
  Check,
  Tag,
  History,
  X,
  RotateCcw,
  Filter,
  Lock
} from "lucide-react";

export default function AquaMaster() {
  const [activeTab, setActiveTab] = useState<"manual" | "scheduler" | "calibration">("manual");
  const [loading, setLoading] = useState<number | null>(null);
  const [calibLoading, setCalibLoading] = useState<number | null>(null);
  const [calibSaving, setCalibSaving] = useState<number | null>(null);
  const [labelSaving, setLabelSaving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // ESP32 Çevrimiçi/Çevrimdışı durumu
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  // Log Modal ve Verileri
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [dosingLogs, setDosingLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logPumpFilter, setLogPumpFilter] = useState<number>(0);

  // Hangi pompaların 10 saniyelik testinin çalıştırıldığının takibi (Güvenlik Kilit Durumu)
  const [testedPumps, setTestedPumps] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // 4 Pompa için kalibrasyon oranları (ml/sn) ve sıvı/gübre etiketleri
  const [pumpSettings, setPumpSettings] = useState<{ [key: number]: { rate: number; label: string } }>({
    1: { rate: 1.0, label: "Gübre A" },
    2: { rate: 1.0, label: "Gübre B" },
    3: { rate: 1.0, label: "pH Düşürücü" },
    4: { rate: 1.0, label: "Cal-Mag" },
  });

  // Manuel tetikleme için 4 pompanın ml durumu
  const [manualMl, setManualMl] = useState<{ [key: number]: number }>({ 1: 15, 2: 15, 3: 15, 4: 15 });

  // Kalibrasyon sekmesindeki ölçülen ml değerleri ve etiket girdileri
  const [calibMeasuredMl, setCalibMeasuredMl] = useState<{ [key: number]: string }>({
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [calibLabels, setCalibLabels] = useState<{ [key: number]: string }>({
    1: "Gübre A",
    2: "Gübre B",
    3: "pH Düşürücü",
    4: "Cal-Mag",
  });

  // Zamanlayıcı formu için durumlar
  const [schedPump, setSchedPump] = useState<number>(1);
  const [schedTime, setSchedTime] = useState<string>("08:00");
  const [schedMl, setSchedMl] = useState<number>(15);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Özel Modern Açılır Menü (Custom Dropdown) Durumu
  const [isPumpDropdownOpen, setIsPumpDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklanınca açılır menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPumpDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sayfa yüklendiğinde ayarları, programları ve cihaz durumunu çek
  useEffect(() => {
    fetchPumpSettings();
    fetchSchedules();
    fetchDeviceStatus();

    // Her 1 saniyede bir dijital saati güncelle
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Her 5 saniyede bir ESP32 canlılık durumunu kontrol et
    const statusTimer = setInterval(() => fetchDeviceStatus(), 5000);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  // ESP32 Canlılık Durumunu Supabase'den Çek
  const fetchDeviceStatus = async () => {
    const { data } = await supabase
      .from("device_status")
      .select("*")
      .eq("id", 1)
      .single();

    if (data && data.last_seen) {
      const lastSeen = new Date(data.last_seen).getTime();
      const now = new Date().getTime();
      const diffSec = (now - lastSeen) / 1000;
      setIsOnline(diffSec < 30);
    } else {
      setIsOnline(false);
    }
  };

  // Supabase'den Dozaj Loglarını Çek
  const fetchDosingLogs = async () => {
    setLogsLoading(true);
    let query = supabase
      .from("dosing_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (logPumpFilter > 0) {
      query = query.eq("pump_id", logPumpFilter);
    }

    const { data } = await query;
    if (data) setDosingLogs(data);
    setLogsLoading(false);
  };

  // Filtre değiştiğinde logları yeniden çek
  useEffect(() => {
    if (isLogModalOpen) {
      fetchDosingLogs();
    }
  }, [logPumpFilter, isLogModalOpen]);

  // Supabase'den pompa kalibrasyon oranlarını ve etiketlerini çek
  const fetchPumpSettings = async () => {
    const { data } = await supabase.from("pump_settings").select("*");
    if (data && data.length > 0) {
      const settingsMap: { [key: number]: { rate: number; label: string } } = {
        1: { rate: 1.0, label: "Gübre A" },
        2: { rate: 1.0, label: "Gübre B" },
        3: { rate: 1.0, label: "pH Düşürücü" },
        4: { rate: 1.0, label: "Cal-Mag" },
      };
      const labelMap: { [key: number]: string } = {
        1: "Gübre A",
        2: "Gübre B",
        3: "pH Düşürücü",
        4: "Cal-Mag",
      };

      data.forEach((item: { pump_id: number; ml_per_second: number; label?: string }) => {
        const itemLabel = item.label && item.label.trim() !== "" ? item.label : `${item.pump_id}. Pompa`;
        settingsMap[item.pump_id] = {
          rate: item.ml_per_second || 1.0,
          label: itemLabel,
        };
        labelMap[item.pump_id] = itemLabel;
      });

      setPumpSettings(settingsMap);
      setCalibLabels(labelMap);
    }
  };

  // Supabase'den kayıtlı zamanlayıcı programlarını çek
  const fetchSchedules = async () => {
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("is_one_time", false)
      .order("run_time", { ascending: true });
    if (data) setSchedules(data);
  };

  const bildirimGoster = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- MANUEL TETİKLEME (ML ➔ SANİYE HESABI İLE + LOG KAYDI) ---
  const motorCalistir = async (pumpId: number) => {
    setLoading(pumpId);
    const targetMl = manualMl[pumpId] || 1;
    const rate = pumpSettings[pumpId]?.rate || 1.0;
    const label = pumpSettings[pumpId]?.label || `${pumpId}. Pompa`;

    const durationSeconds = Math.max(1, Math.round(targetMl / rate));

    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hedefSaat = now.toTimeString().split(" ")[0];

    // 1. ESP32 için emir ekle
    const { error } = await supabase.from("schedules").insert([
      {
        pump_id: pumpId,
        run_time: hedefSaat,
        duration_seconds: durationSeconds,
        is_active: true,
        is_one_time: true,
      },
    ]);

    // 2. Geçmiş Log tablosuna ekle
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
      bildirimGoster(
        `${pumpId}. Pompa (${label}) ${targetMl} ml (${durationSeconds} sn) çalıştırılıyor.`,
        "success"
      );
    }

    setLoading(null);
  };

  // --- KALİBRASYON TEST ÇALIŞTIRMASI (TAM 10 SANİYE + KİLİT AÇMA) ---
  const testCalibrateRun = async (pumpId: number) => {
    setCalibLoading(pumpId);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hedefSaat = now.toTimeString().split(" ")[0];

    const { error } = await supabase.from("schedules").insert([
      {
        pump_id: pumpId,
        run_time: hedefSaat,
        duration_seconds: 10,
        is_active: true,
        is_one_time: true,
      },
    ]);

    if (error) {
      bildirimGoster("Hata: " + error.message, "error");
    } else {
      // Test başarıyla başlatıldı, pompanın veri giriş kilidini aç!
      setTestedPumps((prev) => ({ ...prev, [pumpId]: true }));
      bildirimGoster(
        `${pumpId}. Pompa 10 saniyelik test için başlatıldı. Sıvıyı ölçüp 2. adıma yazabilirsiniz.`,
        "success"
      );
    }

    setCalibLoading(null);
  };

  // --- SADECE ETİKETİ KAYDETME ---
  const saveLabelOnly = async (pumpId: number) => {
    const labelVal = calibLabels[pumpId]?.trim() || `${pumpId}. Pompa`;
    setLabelSaving(pumpId);

    const currentRate = pumpSettings[pumpId]?.rate || 1.0;

    const { error } = await supabase.from("pump_settings").upsert(
      [
        {
          pump_id: pumpId,
          ml_per_second: currentRate,
          label: labelVal,
        },
      ],
      { onConflict: "pump_id" }
    );

    if (error) {
      bildirimGoster("Etiket kaydedilemedi: " + error.message, "error");
    } else {
      bildirimGoster(`${pumpId}. Pompa etiketi "${labelVal}" olarak güncellendi!`, "success");
      await fetchPumpSettings();
    }

    setLabelSaving(null);
  };

  // --- KALİBRASYON DEĞERİNİ KAYDETME ---
  const saveCalibration = async (pumpId: number) => {
    if (!testedPumps[pumpId]) {
      bildirimGoster("Lütfen önce 10 saniyelik test çalıştırmasını yapın!", "error");
      return;
    }

    const rawVal = calibMeasuredMl[pumpId];
    const measuredMl = parseFloat(rawVal);
    const labelVal = pumpSettings[pumpId]?.label || `${pumpId}. Pompa`;

    if (isNaN(measuredMl) || measuredMl <= 0) {
      bildirimGoster("Lütfen geçerli bir mililitre (ml) değeri girin.", "error");
      return;
    }

    setCalibSaving(pumpId);

    const mlPerSecond = parseFloat((measuredMl / 10).toFixed(3));

    const { error } = await supabase.from("pump_settings").upsert(
      [
        {
          pump_id: pumpId,
          ml_per_second: mlPerSecond,
          label: labelVal,
        },
      ],
      { onConflict: "pump_id" }
    );

    if (error) {
      bildirimGoster("Kalibrasyon kaydedilemedi: " + error.message, "error");
    } else {
      bildirimGoster(
        `${pumpId}. Pompa (${labelVal}) kalibre edildi: 10 sn'de ${measuredMl} ml ➔ Hız: ${mlPerSecond} ml/sn`,
        "success"
      );
      await fetchPumpSettings();
    }

    setCalibSaving(null);
  };

  // --- ZAMANLAYICI EKLEME FONKSİYONU ---
  const programEkle = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = pumpSettings[schedPump]?.rate || 1.0;
    const label = pumpSettings[schedPump]?.label || `${schedPump}. Pompa`;
    const durationSeconds = Math.max(1, Math.round(schedMl / rate));

    const { error } = await supabase.from("schedules").insert([
      {
        pump_id: schedPump,
        run_time: schedTime + ":00",
        duration_seconds: durationSeconds,
        is_active: true,
        is_one_time: false,
      },
    ]);

    if (error) {
      bildirimGoster("Hata: " + error.message, "error");
    } else {
      bildirimGoster(
        `Yeni program eklendi! ${schedPump}. Pompa (${label}) ${schedMl} ml (~${durationSeconds} sn)`,
        "success"
      );
      fetchSchedules();
    }
  };

  // --- ZAMANLAYICI SİLME FONKSİYONU ---
  const programSil = async (id: number) => {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (!error) {
      bildirimGoster("Program silindi.", "success");
      fetchSchedules();
    }
  };

  const totalDosedMlToday = dosingLogs.reduce((acc, curr) => acc + (curr.ml_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 pb-12">
      {/* Üst Menü (Header) */}
      <header className="bg-slate-900/80 border-b border-slate-800 p-4 sm:p-6 flex items-center justify-between shadow-lg backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Droplets className="text-cyan-400 w-8 h-8" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Aqua Master
          </h1>
        </div>

        {/* Header Sağ Bölüm: LOGLAR İKONU & Canlı Saat */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsLogModalOpen(true);
              fetchDosingLogs();
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 hover:text-cyan-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-inner"
            title="Dozaj Geçmişi ve Logları Görüntüle"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Loglar</span>
          </button>

          {/* Canlı Akan Dijital Saat & ESP32 Çevrimiçi Simgesi */}
          {currentTime && (
            <div
              className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2 sm:px-4 rounded-xl border border-slate-800 shadow-inner font-mono text-cyan-400 transition-all cursor-help"
              title={
                isOnline === true
                  ? "ESP32 Cihazı Çevrimiçi (İnternete Bağlı)"
                  : isOnline === false
                  ? "ESP32 Cihazı Çevrimdışı (Bağlantı Yok)"
                  : "Cihaz Durumu Kontrol Ediliyor..."
              }
            >
              <Clock
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 ${
                  isOnline === true
                    ? "text-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : isOnline === false
                    ? "text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                    : "text-slate-500"
                }`}
              />
              <span className="text-sm sm:text-lg tracking-wider">
                {currentTime.toLocaleTimeString("tr-TR")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Sekmeler (Tabs) */}
      <div className="max-w-6xl mx-auto px-6 mt-6 flex flex-wrap sm:flex-nowrap gap-3">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 min-w-[130px] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "manual"
              ? "bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-950/50"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          <Power className="w-5 h-5" /> Manuel Kontrol
        </button>

        <button
          onClick={() => setActiveTab("scheduler")}
          className={`flex-1 min-w-[130px] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "scheduler"
              ? "bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-950/50"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          <CalendarClock className="w-5 h-5" /> Zamanlayıcı
        </button>

        <button
          onClick={() => setActiveTab("calibration")}
          className={`flex-1 min-w-[130px] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "calibration"
              ? "bg-cyan-900/40 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-950/50"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
          }`}
        >
          <FlaskConical className="w-5 h-5" /> Kalibrasyon & Etiketler
        </button>
      </div>

      <main className="max-w-6xl mx-auto p-6 flex flex-col gap-8">
        {/* Bildirim Ekranı */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                : "bg-red-500/10 border-red-500/50 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* --- MANUEL KONTROL SEKME İÇERİĞİ (4 POMPA) --- */}
        {activeTab === "manual" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
            {[1, 2, 3, 4].map((pumpId) => {
              const info = pumpSettings[pumpId] || { rate: 1.0, label: `${pumpId}. Pompa` };
              const currentMl = manualMl[pumpId] || 15;
              const estSecExact = currentMl / info.rate;
              const estSecRound = Math.max(1, Math.round(estSecExact));

              return (
                <div
                  key={pumpId}
                  className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                          <Droplets className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-200">{pumpId}. Pompa</h3>
                        </div>
                      </div>
                      <span className="bg-slate-950 text-xs px-2.5 py-1 rounded-full text-slate-400 border border-slate-800 font-mono">
                        CH {pumpId}
                      </span>
                    </div>

                    {/* Özel Sıvı/Gübre Etiketi */}
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 bg-cyan-950/60 text-cyan-300 text-xs font-semibold px-3 py-1 rounded-lg border border-cyan-500/30">
                        <Tag className="w-3 h-3 text-cyan-400" />
                        {info.label}
                      </span>
                    </div>

                    {/* Akış Hızı Rozeti */}
                    <div className="mb-6 flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Hız:
                      </span>
                      <span className="font-mono font-semibold text-cyan-300">
                        {info.rate.toFixed(3)} ml/sn
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            Miktar (ml)
                          </label>
                          <span className="text-xs font-mono text-slate-400" title={`Hassas: ${estSecExact.toFixed(1)} sn`}>
                            ~{estSecRound} sn
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="1000"
                          value={manualMl[pumpId] || ""}
                          onChange={(e) =>
                            setManualMl({
                              ...manualMl,
                              [pumpId]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                          placeholder="Örn: 30"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => motorCalistir(pumpId)}
                    disabled={loading === pumpId || (manualMl[pumpId] || 0) <= 0}
                    className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 px-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading === pumpId ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" /> Dozla ({manualMl[pumpId] || 0} ml)
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* --- ZAMANLAYICI SEKME İÇERİĞİ --- */}
        {activeTab === "scheduler" && (
          <div className="space-y-8 animate-in fade-in">
            {/* Yeni Program Ekleme Formu */}
            <form
              onSubmit={programEkle}
              className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row gap-5 items-end"
            >
              {/* MODERN ÖZEL AÇILIR MENÜ (CUSTOM DROPDOWN) */}
              <div className="flex-1 w-full flex flex-col gap-2 relative" ref={dropdownRef}>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Motor / Gübre Seçimi
                </label>
                <button
                  type="button"
                  onClick={() => setIsPumpDropdownOpen(!isPumpDropdownOpen)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 px-4 text-white flex items-center justify-between transition-all focus:outline-none focus:border-cyan-500 shadow-inner group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 text-cyan-400">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm text-slate-200">
                        {schedPump}. Pompa • {pumpSettings[schedPump]?.label || "Gübre"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        CH {schedPump} • {(pumpSettings[schedPump]?.rate || 1.0).toFixed(3)} ml/sn
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-transform duration-300 ${
                      isPumpDropdownOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>

                {/* Popover Açılır Liste */}
                {isPumpDropdownOpen && (
                  <div className="absolute top-[105%] left-0 w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[1, 2, 3, 4].map((pumpId) => {
                      const info = pumpSettings[pumpId] || { rate: 1.0, label: `${pumpId}. Pompa` };
                      const isSelected = schedPump === pumpId;

                      return (
                        <button
                          key={pumpId}
                          type="button"
                          onClick={() => {
                            setSchedPump(pumpId);
                            setIsPumpDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            isSelected
                              ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold"
                              : "hover:bg-slate-800/80 text-slate-300 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? "bg-cyan-500 text-slate-950 font-bold"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              <Droplets className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold flex items-center gap-2">
                                {pumpId}. Pompa
                                <span className="text-xs text-cyan-400 font-normal">
                                  ({info.label})
                                </span>
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                Akış Hızı: {info.rate.toFixed(3)} ml/sn
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-slate-950 text-[10px] px-2 py-0.5 rounded-full text-slate-400 border border-slate-800 font-mono">
                              CH {pumpId}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-cyan-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Çalışma Saati Girişi */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Çalışma Saati
                </label>
                <input
                  type="time"
                  required
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-cyan-500 font-mono shadow-inner transition-colors"
                />
              </div>

              {/* Miktar Girişi */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Miktar (ml)
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    ~{Math.max(1, Math.round(schedMl / (pumpSettings[schedPump]?.rate || 1.0)))} sn
                  </span>
                </div>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="1"
                  max="1000"
                  value={schedMl}
                  onChange={(e) => setSchedMl(parseFloat(e.target.value) || 1)}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-cyan-500 font-mono shadow-inner transition-colors"
                />
              </div>

              {/* Program Ekle Butonu */}
              <button
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-950/40"
              >
                <Plus className="w-5 h-5" /> Program Ekle
              </button>
            </form>

            {/* Kayıtlı Programlar Listesi */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarClock className="text-cyan-400 w-5 h-5" /> Kayıtlı Günlük Programlar
              </h3>
              {schedules.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Henüz kayıtlı bir program bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {schedules.map((sched) => {
                    const info = pumpSettings[sched.pump_id] || { rate: 1.0, label: `${sched.pump_id}. Pompa` };
                    const estMl = (sched.duration_seconds * info.rate).toFixed(1);

                    return (
                      <div
                        key={sched.id}
                        className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-cyan-400 border border-slate-800">
                            P{sched.pump_id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-slate-200">
                                {sched.run_time.substring(0, 5)}
                              </p>
                              <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-md font-semibold">
                                {info.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Her gün{" "}
                              <span className="text-emerald-400 font-semibold">
                                ~{estMl} ml
                              </span>{" "}
                              <span className="text-slate-500">
                                ({sched.duration_seconds} saniye)
                              </span>{" "}
                              dozlama
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => programSil(sched.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-2 bg-slate-900 rounded-lg hover:bg-red-500/10"
                          title="Sil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- KALİBRASYON & ETİKET SEKME İÇERİĞİ (2 AYRI BLOK) --- */}
        {activeTab === "calibration" && (
          <div className="space-y-10 animate-in fade-in">
            {/* 1. BLOK: GÜBRE / SIVI ETİKET AYARLARI */}
            <section className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">
                    1. Blok: Sıvı / Gübre Etiket Ayarları
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pompalara hangi gübrenin bağlı olduğunu buradan tanımlayabilirsiniz (Kalibrasyon gerekmez).
                  </p>
                </div>
              </div>

              {/* 4 Pompa Etiket Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((pumpId) => {
                  return (
                    <div
                      key={pumpId}
                      className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between gap-3 shadow-inner"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-300">
                          {pumpId}. Pompa
                        </span>
                        <span className="bg-slate-900 text-[10px] px-2 py-0.5 rounded-full text-slate-400 border border-slate-800 font-mono">
                          CH {pumpId}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-slate-400 font-semibold">
                          Gübre / Sıvı Adı
                        </label>
                        <input
                          type="text"
                          value={calibLabels[pumpId] || ""}
                          onChange={(e) =>
                            setCalibLabels({
                              ...calibLabels,
                              [pumpId]: e.target.value,
                            })
                          }
                          placeholder="Örn: Gübre A"
                          className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-medium"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => saveLabelOnly(pumpId)}
                        disabled={labelSaving === pumpId}
                        className="w-full bg-cyan-600/90 hover:bg-cyan-500 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {labelSaving === pumpId ? (
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Tag className="w-3.5 h-3.5" /> Etiketi Kaydet
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. BLOK: SIVI AKIŞ HIZI KALİBRASYONU (GÜVENLİK KİLİTLİ 10 SANİYE) */}
            <section className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">
                    2. Blok: Sıvı Akış Hızı Kalibrasyonu (10 Saniyelik Test)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sistem güvenliği için 1. Adımdaki test çalıştırılmadan miktar girişi kilitlidir.
                  </p>
                </div>
              </div>

              {/* Bilgilendirme Kılavuzu Kutu */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Kalibrasyon Adımları:
                </p>
                <p>1. Hortumun sıvıyla dolu olduğundan emin olun ve <span className="text-cyan-300 font-semibold">10 Sn Test Et</span> butonuna basın.</p>
                <p>2. Test çalıştırıldıktan sonra kilit açılacaktır. Ölçtüğünüz ml değerini yazın.</p>
                <p>3. <span className="text-emerald-400 font-semibold">Kalibrasyonu Kaydet</span> butonuna basarak tamamlayın.</p>
              </div>

              {/* 4 Pompa Kalibrasyon Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((pumpId) => {
                  const info = pumpSettings[pumpId] || { rate: 1.0, label: `${pumpId}. Pompa` };
                  const isTested = testedPumps[pumpId];
                  const rawVal = calibMeasuredMl[pumpId] || "";
                  const valNum = parseFloat(rawVal);
                  const calculatedRate =
                    !isNaN(valNum) && valNum > 0
                      ? (valNum / 10).toFixed(3)
                      : null;

                  return (
                    <div
                      key={pumpId}
                      className={`bg-slate-950 rounded-2xl p-5 border flex flex-col justify-between gap-4 shadow-inner transition-all ${
                        isTested ? "border-cyan-500/40 shadow-cyan-950/30" : "border-slate-800"
                      }`}
                    >
                      <div>
                        {/* Başlık ve Etiket Rozeti */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-sm text-slate-200">
                            {pumpId}. Pompa
                          </h4>
                          <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded text-[11px] font-medium">
                            {info.label}
                          </span>
                        </div>

                        {/* Güncel Akış Hızı Rozeti */}
                        <div className="mb-4 bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Mevcut Hız:
                          </span>
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            {info.rate.toFixed(3)} ml/sn
                          </span>
                        </div>

                        {/* Adım 1: Test Çalıştır Butonu */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="text-[11px] text-slate-400 uppercase font-semibold">
                                1. Adım: Test
                              </label>
                              {isTested && (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Test Edildi
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => testCalibrateRun(pumpId)}
                              disabled={calibLoading === pumpId}
                              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                                isTested
                                  ? "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
                                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 animate-pulse"
                              }`}
                            >
                              {calibLoading === pumpId ? (
                                <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 text-cyan-300 fill-current" />
                                  {isTested ? "Tekrar Test Et" : "10 Sn Test Çalıştır"}
                                </>
                              )}
                            </button>
                          </div>

                          {/* Adım 2: Ölçülen Sıvı Girişi (GÜVENLİK KİLİTLİ) */}
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800 relative">
                            <label className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                              <span>2. Adım: Biriken (ml)</span>
                              {!isTested && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                  <Lock className="w-3 h-3" /> Kilitli
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              disabled={!isTested}
                              value={calibMeasuredMl[pumpId] || ""}
                              onChange={(e) =>
                                setCalibMeasuredMl({
                                  ...calibMeasuredMl,
                                  [pumpId]: e.target.value,
                                })
                              }
                              placeholder={isTested ? "Örn: 15.0" : "Önce Testi Çalıştırın 🔒"}
                              className={`rounded-xl p-2.5 text-xs font-mono transition-all ${
                                !isTested
                                  ? "bg-slate-900/40 border border-slate-800 text-slate-600 cursor-not-allowed placeholder:text-slate-600"
                                  : "bg-slate-900 border border-cyan-500/50 text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                              }`}
                            />
                          </div>

                          {/* Canlı Matematik Hesaplaması */}
                          {calculatedRate && isTested && (
                            <div className="bg-cyan-950/40 border border-cyan-500/30 p-2 rounded-xl text-[11px] text-cyan-300 font-mono flex items-center justify-between">
                              <span>{valNum} ml / 10s =</span>
                              <span className="font-bold text-xs text-cyan-200">
                                {calculatedRate} ml/sn
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Adım 3: Kalibrasyonu Kaydet Butonu (GÜVENLİK KİLİTLİ) */}
                      <button
                        type="button"
                        onClick={() => saveCalibration(pumpId)}
                        disabled={
                          !isTested ||
                          calibSaving === pumpId ||
                          !calibMeasuredMl[pumpId] ||
                          parseFloat(calibMeasuredMl[pumpId]) <= 0
                        }
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                      >
                        {calibSaving === pumpId ? (
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Kalibrasyonu Kaydet
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* HEADER LOGLAR MODAL / SLIDE-OVER PANELİ */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Dozaj Geçmişi & Loglar</h3>
                  <p className="text-xs text-slate-400">Tüm pompaların geçmiş çalışma ve dozajlama kayıtları</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDosingLogs}
                  disabled={logsLoading}
                  className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-950 rounded-xl border border-slate-800 transition-colors"
                  title="Yenile"
                >
                  <RotateCcw className={`w-4 h-4 ${logsLoading ? "animate-spin text-cyan-400" : ""}`} />
                </button>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 rounded-xl border border-slate-800 transition-colors"
                  title="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal İçerik / İstatistik & Filtre Barı */}
            <div className="p-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap gap-4 items-center justify-between">
              {/* İstatistikler */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Toplam Dozlanan: </span>
                  <span className="text-emerald-400 font-bold">{totalDosedMlToday.toFixed(1)} ml</span>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Kayıt Sayısı: </span>
                  <span className="text-cyan-400 font-bold">{dosingLogs.length}</span>
                </div>
              </div>

              {/* Pompa Filtreleme Butonları */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filtre:
                </span>
                <button
                  onClick={() => setLogPumpFilter(0)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    logPumpFilter === 0
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  Tümü
                </button>
                {[1, 2, 3, 4].map((pumpId) => {
                  const info = pumpSettings[pumpId] || { label: `${pumpId}. Pompa` };
                  const isSelected = logPumpFilter === pumpId;

                  return (
                    <button
                      key={pumpId}
                      onClick={() => setLogPumpFilter(pumpId)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      P{pumpId} ({info.label})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Liste Gövdesi */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {logsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Clock className="w-6 h-6 animate-spin text-cyan-400" />
                  <p className="text-sm">Loglar yükleniyor...</p>
                </div>
              ) : dosingLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Henüz kaydedilmiş bir dozaj geçmişi bulunmuyor.
                </div>
              ) : (
                dosingLogs.map((log) => {
                  const info = pumpSettings[log.pump_id] || { label: `${log.pump_id}. Pompa` };
                  const createdDate = new Date(log.created_at);

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between bg-slate-950/80 p-3.5 px-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="bg-slate-900 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-cyan-400 border border-slate-800 text-sm">
                          P{log.pump_id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 text-sm">
                              {info.label}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                log.mode === "Manuel"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {log.mode === "Manuel" ? "⚡ Manuel" : "📅 Zamanlanmış"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {createdDate.toLocaleDateString("tr-TR")} - {createdDate.toLocaleTimeString("tr-TR")}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400 font-mono">
                          +{log.ml_amount} ml
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {log.duration_seconds} saniye
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}