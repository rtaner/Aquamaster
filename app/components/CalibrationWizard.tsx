"use client";

import { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  Droplet, 
  Gauge, 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Info,
  Droplets,
  Zap,
  Shield,
  ShieldCheck,
  Heart,
  Sparkles,
  Leaf,
  Calendar,
  RotateCcw,
  Plus,
  Minus
} from "lucide-react";
import { PumpSetting, DosingLog } from "@/types/aquamaster";

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

const parseLogDate = (raw?: any): Date => {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  let s = String(raw).trim();
  if (s.includes(" ") && !s.includes("T")) {
    s = s.replace(" ", "T");
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

const getDynamicPumpTheme = (colorName?: string) => {
  const c = colorName || "cyan";
  const map: { [key: string]: any } = {
    cyan: {
      default: "bg-cyan-950/40 border-2 border-cyan-500/30 text-cyan-300 hover:border-cyan-400/80",
      selected: "bg-cyan-900/60 border-2 border-cyan-400 text-white ring-2 ring-cyan-400/50 shadow-[0_0_18px_rgba(6,182,212,0.4)]",
      badge: "bg-cyan-900/40 border border-cyan-400/50 text-cyan-300",
      text: "text-cyan-400",
      liquidGradient: "from-cyan-500 via-blue-500 to-cyan-400",
      liquidGlow: "shadow-[0_0_15px_rgba(6,182,212,0.6)]",
      activeBg: "bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50",
    },
    emerald: {
      default: "bg-emerald-950/40 border-2 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/80",
      selected: "bg-emerald-900/60 border-2 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.4)]",
      badge: "bg-emerald-900/40 border border-emerald-400/50 text-emerald-300",
      text: "text-emerald-400",
      liquidGradient: "from-emerald-500 via-teal-500 to-emerald-400",
      liquidGlow: "shadow-[0_0_15px_rgba(16,185,129,0.6)]",
      activeBg: "bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/50",
    },
    amber: {
      default: "bg-amber-950/40 border-2 border-amber-500/30 text-amber-300 hover:border-amber-400/80",
      selected: "bg-amber-900/60 border-2 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-[0_0_18px_rgba(245,158,11,0.4)]",
      badge: "bg-amber-900/40 border border-amber-400/50 text-amber-300",
      text: "text-amber-400",
      liquidGradient: "from-amber-500 via-yellow-500 to-amber-400",
      liquidGlow: "shadow-[0_0_15px_rgba(245,158,11,0.6)]",
      activeBg: "bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 border-amber-300 ring-2 ring-amber-400/50",
    },
    rose: {
      default: "bg-rose-950/40 border-2 border-rose-500/30 text-rose-300 hover:border-rose-400/80",
      selected: "bg-rose-900/60 border-2 border-rose-400 text-white ring-2 ring-rose-400/50 shadow-[0_0_18px_rgba(244,63,94,0.4)]",
      badge: "bg-rose-900/40 border border-rose-400/50 text-rose-300",
      text: "text-rose-400",
      liquidGradient: "from-rose-500 via-pink-500 to-rose-400",
      liquidGlow: "shadow-[0_0_15px_rgba(244,63,94,0.6)]",
      activeBg: "bg-gradient-to-br from-rose-400 to-pink-600 text-slate-950 border-rose-300 ring-2 ring-rose-400/50",
    },
    purple: {
      default: "bg-purple-950/40 border-2 border-purple-500/30 text-purple-300 hover:border-purple-400/80",
      selected: "bg-purple-900/60 border-2 border-purple-400 text-white ring-2 ring-purple-400/50 shadow-[0_0_18px_rgba(168,85,247,0.4)]",
      badge: "bg-purple-900/40 border border-purple-400/50 text-purple-300",
      text: "text-purple-400",
      liquidGradient: "from-purple-500 via-fuchsia-500 to-purple-400",
      liquidGlow: "shadow-[0_0_15px_rgba(168,85,247,0.6)]",
      activeBg: "bg-gradient-to-br from-purple-400 to-fuchsia-600 text-slate-950 border-purple-300 ring-2 ring-purple-400/50",
    },
    blue: {
      default: "bg-blue-950/40 border-2 border-blue-500/30 text-blue-300 hover:border-blue-400/80",
      selected: "bg-blue-900/60 border-2 border-blue-400 text-white ring-2 ring-blue-400/50 shadow-[0_0_18px_rgba(59,130,246,0.4)]",
      badge: "bg-blue-900/40 border border-blue-400/50 text-blue-300",
      text: "text-blue-400",
      liquidGradient: "from-blue-500 via-indigo-500 to-blue-400",
      liquidGlow: "shadow-[0_0_15px_rgba(59,130,246,0.6)]",
      activeBg: "bg-gradient-to-br from-blue-400 to-indigo-600 text-slate-950 border-blue-300 ring-2 ring-blue-400/50",
    },
  };
  return map[c] || map.cyan;
};

interface CalibrationWizardProps {
  logs?: DosingLog[];
  pumpSettings: { [key: number]: PumpSetting };
  isOnline: boolean | null;
  calibLoading: number | null;
  calibSaving: number | null;
  primingPump: number | null;
  onStartPriming: (pumpId: number) => void;
  onStopPriming: (pumpId: number) => void;
  onRunTest: (pumpId: number) => Promise<void>;
  onSaveCalibration: (pumpId: number, rate: number) => Promise<void>;
}

export default function CalibrationWizard({
  logs,
  pumpSettings,
  isOnline,
  calibLoading,
  calibSaving,
  primingPump,
  onStartPriming,
  onStopPriming,
  onRunTest,
  onSaveCalibration,
}: CalibrationWizardProps) {
  const [selectedPump, setSelectedPump] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [testedForPump, setTestedForPump] = useState<{ [key: number]: boolean }>({});
  const [measuredMl, setMeasuredMl] = useState<string>("");

  const currentSetting = pumpSettings[selectedPump] || {
    pump_id: selectedPump,
    rate: 1.0,
    label: `${selectedPump}. Pompa`,
  };

  const selectedTheme = getDynamicPumpTheme(currentSetting.color);

  // Gerçek Veritabanı Logları & Ayarlarından Dinamik Pompa İstatistikleri Hesaplama
  const pumpStats = useMemo(() => {
    const pumpLogs = (logs || []).filter((l) => Number(l.pump_id) === Number(selectedPump));
    const totalDoses = pumpLogs.length;

    // 1. Son Kalibrasyon Tarihi (Veritabanındaki last_calibrated_at damgası)
    let lastCalibStr = "Kalibre Edilmeli";
    if (currentSetting.last_calibrated_at) {
      const d = parseLogDate(currentSetting.last_calibrated_at);
      lastCalibStr = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
    } else {
      const calibLogs = pumpLogs.filter((l) => (l.mode || "").toLowerCase().includes("kalibrasyon"));
      if (calibLogs.length > 0) {
        const latestCalib = new Date(Math.max(...calibLogs.map((l) => parseLogDate(l.created_at).getTime())));
        lastCalibStr = latestCalib.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
      }
    }

    // 2. Çalışma Sayısı
    const doseCountStr = totalDoses > 0 ? `${totalDoses} Dozlama` : "0 Dozlama";

    // 3. Kalibrasyon Güvenlik Skoru (Geçen Zaman Bazlı Hassasiyet Sağlık Skoru)
    let trustScore = "Kalibre Edilmeli";
    let trustColor = "text-amber-400/90 font-medium";

    if (currentSetting.last_calibrated_at) {
      const calibDate = parseLogDate(currentSetting.last_calibrated_at);
      const daysDiff = Math.floor((Date.now() - calibDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 30) {
        trustScore = "%98 Yüksek";
        trustColor = "text-emerald-400 font-bold";
      } else if (daysDiff <= 60) {
        trustScore = "%90 İyi";
        trustColor = "text-cyan-400 font-bold";
      } else if (daysDiff <= 90) {
        trustScore = "%75 Orta";
        trustColor = "text-amber-400 font-bold";
      } else {
        trustScore = "%50 Yenileme Zamanı";
        trustColor = "text-rose-400 font-bold";
      }
    }

    return {
      totalDoses: doseCountStr,
      lastCalibStr,
      trustScore,
      trustColor,
    };
  }, [logs, selectedPump, currentSetting]);

  const handleTestClick = async () => {
    await onRunTest(selectedPump);
    setTestedForPump((prev) => ({ ...prev, [selectedPump]: true }));
    setCurrentStep(3); // Step 3'e otomatik geç
  };

  const handleSaveClick = async () => {
    const valNum = parseFloat(measuredMl);
    if (isNaN(valNum) || valNum <= 0) return;

    const newRate = valNum / 10;
    await onSaveCalibration(selectedPump, newRate);
    setMeasuredMl("");
    setCurrentStep(4); // Tamamlandı
  };

  const valNum = parseFloat(measuredMl);
  const calculatedRate = !isNaN(valNum) && valNum > 0 ? (valNum / 10).toFixed(3) : null;
  const isTested = testedForPump[selectedPump];

  return (
    <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-6 animate-in fade-in duration-300">
      {/* Üst Bilgi Başlığı */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="bg-cyan-500/20 p-3 rounded-2xl border border-cyan-500/40 text-cyan-400">
          <FlaskConical className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Kalibrasyon Sihirbazı</h3>
          <p className="text-xs text-slate-400">
            Pompaların hassas ml/saniye akış hızını hesaplamak için adım adım yönergeleri takip edin.
          </p>
        </div>
      </div>

      {/* ÜST DÜZEN: SOLDA POMPA SEÇİMİ VE METRİKLER, SAĞDA MEVCUT KALİBRASYON BİLGİ PANENELİ */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* SOL ALAN: HIZLI METRİKLER & 4 ADET DÜZGÜN YAN YANA SEÇİM KUTUSU */}
        <div className="shrink-0 flex flex-col justify-between space-y-2.5">
          {/* Başlık ve Pompa İsmi */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 font-mono">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Pompa Seçimi:
            </label>
            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {currentSetting.label} (Kanal {selectedPump})
            </span>
          </div>

          {/* 3 Adet Veritabanı Destekli İstatistik Kartı (SABİT 44px YÜKSEKLİK) */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono w-full">
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2 h-11 min-h-[44px] flex items-center gap-1.5 overflow-hidden">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="text-slate-400 block text-[9px] truncate">Son Kalibrasyon</span>
                <span className="text-slate-200 font-bold truncate block">{pumpStats.lastCalibStr}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2 h-11 min-h-[44px] flex items-center gap-1.5 overflow-hidden">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="text-slate-400 block text-[9px] truncate">Çalışma Sayısı</span>
                <span className="text-slate-200 font-bold truncate block">{pumpStats.totalDoses}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2 h-11 min-h-[44px] flex items-center gap-1.5 overflow-hidden">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="overflow-hidden min-w-0">
                <span className="text-slate-400 block text-[9px] truncate">Güvenlik</span>
                <span className={`${pumpStats.trustColor} truncate block`}>{pumpStats.trustScore}</span>
              </div>
            </div>
          </div>

          {/* 4 Adet Tam Genişliğe Yayılan Eşit İri Kare Seçim Kutusu (SABİT KÜÇÜLMEYEN İDEAL BOYUT) */}
          <div className="grid grid-cols-4 gap-2.5 w-full">
            {[1, 2, 3, 4].map((id) => {
              const setting = pumpSettings[id] || { label: `${id}. Pompa`, color: "cyan", icon: "Droplets" };
              const IconComp = iconMap[setting.icon || "Droplets"] || Droplets;
              const isSelected = selectedPump === id;
              const theme = getDynamicPumpTheme(setting.color);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedPump(id);
                    setCurrentStep(1);
                    setMeasuredMl("");
                  }}
                  className={`w-22 h-22 sm:w-24 sm:h-24 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center justify-center p-1.5 gap-1 cursor-pointer text-center select-none active:scale-95 shrink-0 ${
                    isSelected ? theme.selected : theme.default
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${theme.badge}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs truncate max-w-full text-slate-100 font-mono leading-tight">{setting.label}</span>
                  <span className="text-[9.5px] font-mono opacity-70">Kanal {id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SAĞ ALAN: MEVCUT KALİBRASYON BİLGİ VE İPUCU PANENELİ (KALAN TÜM ALANI KAPLAR) */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between space-y-2 text-xs font-mono min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Pompa Kalibrasyon Bilgisi
            </span>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Kanal {selectedPump}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Mevcut Akış Hızı:</span>
              <span className="text-cyan-300 font-bold font-mono text-xs">
                {currentSetting.rate ? `${currentSetting.rate} ml/sn` : "1.000 ml/sn"}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">10sn Test Beklenen:</span>
              <span className="text-emerald-400 font-bold font-mono text-xs">
                ~{((currentSetting.rate || 1.0) * 10).toFixed(1)} ml
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            💡 <strong className="text-slate-300">İpucu:</strong> Hassas dozajlama için her 30 günde bir veya sıvı çeşidi değiştiğinde ölçü kabı ile kalibre edin.
          </p>
        </div>
      </div>

      {/* SIVI AKIŞLI HORTUM STEPPER ADIM GÖSTERGESİ (Liquid Flow Progress Hose Bar) */}
      <div className="relative border-y border-slate-800/80 py-5 px-4 my-2 select-none">
        {/* ARKA PLAN SAYDAM SİLİKON HORTUM (Transparent Silicone Hose Tube) */}
        <div className="absolute top-1/2 left-[12%] right-[12%] -translate-y-1/2 h-3.5 bg-slate-950/90 rounded-full border-2 border-slate-800/90 overflow-hidden shadow-inner z-0">
          {/* Cam Yansıma Çizgisi */}
          <div className="absolute top-0.5 left-0 right-0 h-[1px] bg-white/20 z-20" />

          {/* İLERLEYEN AKICI SIVI DOLDURMA (Flowing Liquid Fill inside Hose) */}
          <div
            className={`h-full bg-gradient-to-r ${selectedTheme.liquidGradient} transition-all duration-700 ease-out relative ${selectedTheme.liquidGlow}`}
            style={{
              width:
                currentStep === 1
                  ? "0%"
                  : currentStep === 2
                  ? "33.33%"
                  : currentStep === 3
                  ? "66.66%"
                  : "100%",
            }}
          >
            {/* Sıvı İçi Akış Baloncukları & Dalga Efekti (Horizontal Waves & Bubbles) */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:30px_100%] animate-pulse" />
          </div>
        </div>

        {/* 4 ADET ADIM HALKASI (Step Nodes OVERLAID ON HOSE) */}
        <div className="relative z-10 grid grid-cols-4 gap-2 text-center">
          {[
            { step: 1, title: "1. Hava Al" },
            { step: 2, title: "2. 10sn Test" },
            { step: 3, title: "3. Ölçüm Gir" },
            { step: 4, title: "4. Tamamla" },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isDone = currentStep > item.step;
            const isReached = currentStep >= item.step;

            return (
              <div
                key={item.step}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => isDone && setCurrentStep(item.step)}
              >
                {/* Adım Dairesi - Sıvı Ulaşınca Seçili Pompanın Temalı Rengini Alır */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-black border-2 transition-all duration-500 shadow-xl ${
                    isReached
                      ? `${selectedTheme.activeBg} scale-110 ${selectedTheme.liquidGlow}`
                      : "bg-slate-950 border-slate-700 text-slate-500"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 animate-in zoom-in-75 duration-300" />
                  ) : (
                    <span>{item.step}</span>
                  )}
                </div>

                {/* Adım Başlığı */}
                <span
                  className={`text-[11.5px] font-mono transition-colors duration-300 ${
                    isReached ? `${selectedTheme.text} font-bold` : "text-slate-500 font-normal"
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADIM 1: HAVA ALMA (PRIMING) */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Droplet className="w-4 h-4" /> Adım 1: Hortum Havasını Alın
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hassas bir kalibrasyon için hortumun içinde hava boşluğu bulunmamalıdır. Aşağıdaki butona basılı tutarak sıvının ölçü kabının ucuna kadar gelmesini sağlayın.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <button
              type="button"
              onMouseDown={() => onStartPriming(selectedPump)}
              onMouseUp={() => onStopPriming(selectedPump)}
              onMouseLeave={() => onStopPriming(selectedPump)}
              onTouchStart={() => onStartPriming(selectedPump)}
              onTouchEnd={() => onStopPriming(selectedPump)}
              className={`w-full max-w-sm py-4 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all shadow-lg select-none ${
                primingPump === selectedPump
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 ring-4 ring-cyan-500/40 animate-pulse scale-95"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-500/50"
              }`}
            >
              <Droplet className={`w-5 h-5 ${primingPump === selectedPump ? "animate-bounce" : "text-cyan-400"}`} />
              <span>{primingPump === selectedPump ? "Hava Alınıyor... (Bırakınca Durur)" : "Basılı Tutarak Hortum Havasını Al"}</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
            >
              <span>Devam Et (2. Adım)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ADIM 2: 10 SN TESTİ */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Adım 2: 10 Saniyelik Test Çalıştırması
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ölkü kabını hortumun ucuna yerleştirin. Aşağıdaki butona tıkladığınızda pompa <strong>tam 10 saniye</strong> çalışacak ve duracaktır.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <button
              type="button"
              onClick={handleTestClick}
              disabled={calibLoading === selectedPump || isOnline === false}
              className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/60 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {calibLoading === selectedPump ? (
                <>
                  <Clock className="w-5 h-5 animate-spin text-cyan-300" />
                  <span>10 Saniyelik Test Sürüyor...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>10 Saniyelik Testi Başlat</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>

            {isTested && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/60 cursor-pointer"
              >
                <span>Sonraki (3. Adım)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ADIM 3: ÖLÇÜM GİRMA (INTERAKTİF STEPPER + HIZLI PRESET + ELLE GİRİŞ) */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Adım 3: Ölçülen Sıvı Miktarını Girin
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              10 saniyelik test sonucunda dereceli kaba dolan toplam sıvı miktarını (ml cinsinden) girin veya stepper butonları ile hassasça ayarlayın.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <div className="w-full max-w-md space-y-3">
              <label className="text-xs text-slate-400 font-semibold block text-center font-mono">
                Ölçülen Sıvı Miktarı (ml):
              </label>

              {/* HIZLI SEÇİM PRESET BUTONLARI */}
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
                {[5, 8, 10, 12, 15].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMeasuredMl(preset.toString())}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      measuredMl === preset.toString()
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold shadow-sm"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
                    }`}
                  >
                    {preset} ml
                  </button>
                ))}
              </div>

              {/* INTERAKTİF STEPPER + ELLE GİRİŞ ALANI */}
              <div className="flex items-center justify-between gap-1.5 bg-slate-950/90 border-2 border-slate-700 focus-within:border-cyan-400 rounded-2xl p-2 shadow-xl">
                {/* -0.5 ml Stepper */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(measuredMl) || 0;
                    const next = Math.max(0.1, Math.round((current - 0.5) * 10) / 10);
                    setMeasuredMl(next.toString());
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  title="0.5 ml Azalt"
                >
                  -0.5
                </button>

                {/* -0.1 ml Stepper */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(measuredMl) || 0;
                    const next = Math.max(0.1, Math.round((current - 0.1) * 10) / 10);
                    setMeasuredMl(next.toString());
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                  title="0.1 ml Azalt"
                >
                  <Minus className="w-4 h-4" />
                </button>

                {/* ELLE GİRİŞ KUTUSU (Direct Keyboard Entry Input) */}
                <div className="flex-1 relative flex items-center justify-center px-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Örn: 8.5"
                    value={measuredMl}
                    onChange={(e) => setMeasuredMl(e.target.value)}
                    className="w-full bg-transparent text-center text-xl font-mono font-black text-white focus:outline-none placeholder:text-slate-600"
                  />
                  <span className="text-xs font-mono text-cyan-400 font-bold ml-1 pointer-events-none">ml</span>
                </div>

                {/* +0.1 ml Stepper */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(measuredMl) || 0;
                    const next = Math.round(((parseFloat(measuredMl) || 0) + 0.1) * 10) / 10;
                    setMeasuredMl(next.toString());
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                  title="0.1 ml Arttır"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* +0.5 ml Stepper */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(measuredMl) || 0;
                    const next = Math.round(((parseFloat(measuredMl) || 0) + 0.5) * 10) / 10;
                    setMeasuredMl(next.toString());
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  title="0.5 ml Arttır"
                >
                  +0.5
                </button>
              </div>
            </div>

            {/* HESAPLANAN AKIŞ HIZI ROZETİ */}
            {calculatedRate && (
              <div className="bg-cyan-950/60 border border-cyan-500/40 p-3.5 rounded-2xl text-center font-mono space-y-1 animate-in zoom-in-95 w-full max-w-md">
                <span className="text-[11px] text-slate-400 block">Hesaplanan Yeni Akış Hızı:</span>
                <span className="text-xl font-black text-cyan-300">{calculatedRate} ml / saniye</span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>

            <button
              type="button"
              onClick={handleSaveClick}
              disabled={calibSaving === selectedPump || isNaN(valNum) || valNum <= 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-50 transition-all cursor-pointer"
            >
              {calibSaving === selectedPump ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Kalibrasyonu Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ADIM 4: TAMAMLANDI */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-in fade-in text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-100">Kalibrasyon Başarıyla Tamamlandı!</h4>
            <p className="text-xs text-slate-400 font-mono">
              {currentSetting.label} için yeni akış hızı: <strong className="text-emerald-400">{currentSetting.rate} ml/saniye</strong> olarak güncellendi.
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setMeasuredMl("");
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-800 cursor-pointer"
            >
              Yeniden Kalibre Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
