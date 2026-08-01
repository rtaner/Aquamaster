"use client";

import { useState } from "react";
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
  Heart,
  Sparkles,
  Leaf
} from "lucide-react";
import { PumpSetting } from "@/types/aquamaster";

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
      default: "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:border-cyan-400/80",
      selected: "bg-cyan-900/60 border-2 border-cyan-400 text-white ring-2 ring-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.45)] scale-[1.03]",
      badge: "bg-cyan-900/40 border-cyan-400/50 text-cyan-300",
      text: "text-cyan-400",
    },
    emerald: {
      default: "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:border-emerald-400/80",
      selected: "bg-emerald-900/60 border-2 border-emerald-400 text-white ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.45)] scale-[1.03]",
      badge: "bg-emerald-900/40 border-emerald-400/50 text-emerald-300",
      text: "text-emerald-400",
    },
    amber: {
      default: "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400/80",
      selected: "bg-amber-900/60 border-2 border-amber-400 text-white ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.45)] scale-[1.03]",
      badge: "bg-amber-900/40 border-amber-400/50 text-amber-300",
      text: "text-amber-400",
    },
    rose: {
      default: "bg-rose-950/40 border-rose-500/50 text-rose-300 hover:border-rose-400/80",
      selected: "bg-rose-900/60 border-2 border-rose-400 text-white ring-2 ring-rose-400/80 shadow-[0_0_20px_rgba(244,63,94,0.45)] scale-[1.03]",
      badge: "bg-rose-900/40 border-rose-400/50 text-rose-300",
      text: "text-rose-400",
    },
    purple: {
      default: "bg-purple-950/40 border-purple-500/50 text-purple-300 hover:border-purple-400/80",
      selected: "bg-purple-900/60 border-2 border-purple-400 text-white ring-2 ring-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.45)] scale-[1.03]",
      badge: "bg-purple-900/40 border-purple-400/50 text-purple-300",
      text: "text-purple-400",
    },
    blue: {
      default: "bg-blue-950/40 border-blue-500/50 text-blue-300 hover:border-blue-400/80",
      selected: "bg-blue-900/60 border-2 border-blue-400 text-white ring-2 ring-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.45)] scale-[1.03]",
      badge: "bg-blue-900/40 border-blue-400/50 text-blue-300",
      text: "text-blue-400",
    },
  };
  return map[c] || map.cyan;
};

interface CalibrationWizardProps {
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
    <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-6">
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

      {/* Pompa Seçim Kanalları (Dinamik Renkli ve İkonlu Kartlar) */}
      <div className="space-y-2">
        <label className="text-xs text-slate-300 font-semibold block">Kalibre Edilecek Pompa Seçimi:</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer text-center select-none active:scale-95 ${
                  isSelected ? theme.selected : theme.default
                }`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center mb-0.5 ${theme.badge}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs truncate max-w-full text-slate-100">{setting.label}</span>
                <span className="text-[10px] font-mono opacity-80">Kanal {id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stepper Adım Göstergesi */}
      <div className="grid grid-cols-4 gap-2 border-y border-slate-800 py-4 text-center">
        {[
          { step: 1, title: "1. Hava Al" },
          { step: 2, title: "2. 10sn Test" },
          { step: 3, title: "3. Ölçüm Gir" },
          { step: 4, title: "4. Tamamla" },
        ].map((item) => {
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;
          return (
            <div
              key={item.step}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                isActive
                  ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold"
                  : isDone
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-semibold"
                  : "bg-slate-950/40 border-slate-800 text-slate-500"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-black ${
                  isActive
                    ? "bg-cyan-500 text-slate-950"
                    : isDone
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : item.step}
              </div>
              <span className="text-[11px] hidden sm:inline">{item.title}</span>
            </div>
          );
        })}
      </div>

      {/* ADIM 1: HAVA ALMA (PRIMING) */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
              <Droplet className="w-4 h-4" /> Adım 1: Hortum Havasını Alın
            </h4>
            <p>
              Hassas bir kalibrasyon için hortumun içinde hava boşluğu bulunmamalıdır. Aşağıdaki butona basılı tutarak sıvının ölçü kabının ucuna kadar gelmesini sağlayın.
            </p>
          </div>

          <button
            type="button"
            onMouseDown={() => onStartPriming(selectedPump)}
            onMouseUp={() => onStopPriming(selectedPump)}
            onMouseLeave={() => onStopPriming(selectedPump)}
            onTouchStart={() => onStartPriming(selectedPump)}
            onTouchEnd={() => onStopPriming(selectedPump)}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 select-none active:scale-95 cursor-pointer ${
              primingPump === selectedPump
                ? "bg-amber-500 text-slate-950 border border-amber-400 shadow-lg shadow-amber-950/60 animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
            }`}
          >
            <Droplet className="w-4 h-4 text-amber-400" />
            <span>{primingPump === selectedPump ? "Sıvı Çekiliyor..." : "Basılı Tutarak Hortum Havasını Al"}</span>
          </button>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer"
            >
              <span>Devam Et (2. Adım)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ADIM 2: 10 SANİYE TEST ÇALIŞTIR */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
              <Play className="w-4 h-4 fill-current" /> Adım 2: 10 Saniyelik Test Testi Çalıştırın
            </h4>
            <p>
              Boş bir milimetrelik ölçü kabını hortum çıkışına yerleştirin. Butona bastığınızda pompa tam 10 saniye çalışacaktır.
            </p>
          </div>

          <button
            type="button"
            disabled={calibLoading === selectedPump || isOnline !== true}
            onClick={handleTestClick}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
          >
            {calibLoading === selectedPump ? (
              <Clock className="w-4 h-4 animate-spin text-cyan-300" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>10 Saniye Testi Başlat</span>
              </>
            )}
          </button>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
            {isTested && (
              <button
                onClick={() => setCurrentStep(3)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer"
              >
                <span>Ölçüme Geç (3. Adım)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ADIM 3: ÖLÇÜLEN SIVI MİKTARINI GİR */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
              <Gauge className="w-4 h-4" /> Adım 3: Ölçü Kabındaki Biriken Sıvıyı Girin
            </h4>
            <p>10 saniyelik test tamamlandı! Ölçü kabında biriken ml miktarını hassas olarak girin.</p>
          </div>

          <div className="flex flex-col gap-2 bg-slate-950/90 border border-cyan-500/30 p-4 rounded-2xl">
            <label className="text-xs text-slate-300 font-semibold">Biriken Miktar (ml):</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={measuredMl}
              onChange={(e) => setMeasuredMl(e.target.value)}
              placeholder="Örn: 15.0"
              className="bg-slate-900 border border-cyan-500/50 rounded-xl p-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
            />

            {calculatedRate && (
              <div className="bg-cyan-950/60 border border-cyan-500/40 p-3 rounded-xl text-xs font-mono text-cyan-300 flex items-center justify-between mt-2">
                <span>{measuredMl} ml / 10 saniye =</span>
                <span className="font-bold text-sm text-cyan-200">{calculatedRate} ml/sn</span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>

            <button
              type="button"
              disabled={!calculatedRate || calibSaving === selectedPump}
              onClick={handleSaveClick}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-40"
            >
              {calibSaving === selectedPump ? (
                <Clock className="w-4 h-4 animate-spin" />
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
        <div className="py-6 text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-lg text-white">Kalibrasyon Başarıyla Kaydedildi!</h4>
          <p className="text-xs text-slate-400 font-mono">
            {currentSetting.label} için yeni akış hızı: <b>{currentSetting.rate.toFixed(3)} ml/sn</b>
          </p>

          <button
            onClick={() => {
              setCurrentStep(1);
              setMeasuredMl("");
            }}
            className="mt-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Başka Bir Pompa Kalibre Et
          </button>
        </div>
      )}
    </div>
  );
}
