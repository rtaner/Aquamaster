"use client";

import { useState } from "react";
import { 
  Droplets, 
  FlaskConical, 
  Zap, 
  Shield, 
  Heart, 
  Sparkles, 
  Leaf, 
  Droplet,
  Play, 
  Clock, 
  Settings, 
  History,
  Plus,
  Minus,
  CheckCircle2
} from "lucide-react";
import { PumpSetting, ActiveDosingState, DosingLog } from "@/types/aquamaster";
import BottleVisualizer from "./BottleVisualizer";
import RadialProgress from "./RadialProgress";

interface ManualPumpCardProps {
  setting: PumpSetting;
  lastLog?: DosingLog;
  activeState?: ActiveDosingState;
  completedState?: { targetMl: number; durationSeconds: number; label: string };
  isOnline: boolean | null;
  loading: boolean;
  primingPump: number | null;
  onStartPriming: (pumpId: number) => void;
  onStopPriming: (pumpId: number) => void;
  onDoseClick: (pumpId: number, targetMl: number) => void;
  onOpenSettings: (pumpId: number) => void;
  onRefillContainer: (pumpId: number) => void;
  onDismissCompletion?: (pumpId: number) => void;
}

const iconMap = {
  Droplets,
  FlaskConical,
  Zap,
  Shield,
  Heart,
  Sparkles,
  Leaf,
  Water: Droplet,
};

const themeColorStyles = {
  cyan: {
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-800/80",
    btnGrad: "from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500",
    glow: "shadow-cyan-950/40",
    text: "text-cyan-400",
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
    btnGrad: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
    glow: "shadow-emerald-950/40",
    text: "text-emerald-400",
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-400/60",
    badgeBg: "bg-amber-950/80 text-amber-300 border-amber-800/80",
    btnGrad: "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500",
    glow: "shadow-amber-950/40",
    text: "text-amber-400",
  },
  rose: {
    border: "border-rose-500/30 hover:border-rose-400/60",
    badgeBg: "bg-rose-950/80 text-rose-300 border-rose-800/80",
    btnGrad: "from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500",
    glow: "shadow-rose-950/40",
    text: "text-rose-400",
  },
  purple: {
    border: "border-purple-500/30 hover:border-purple-400/60",
    badgeBg: "bg-purple-950/80 text-purple-300 border-purple-800/80",
    btnGrad: "from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
    glow: "shadow-purple-950/40",
    text: "text-purple-400",
  },
  blue: {
    border: "border-blue-500/30 hover:border-blue-400/60",
    badgeBg: "bg-blue-950/80 text-blue-300 border-blue-800/80",
    btnGrad: "from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500",
    glow: "shadow-blue-950/40",
    text: "text-blue-400",
  },
};

export default function ManualPumpCard({
  setting,
  lastLog,
  activeState,
  completedState,
  isOnline,
  loading,
  onDoseClick,
  onOpenSettings,
  onRefillContainer,
  onDismissCompletion,
}: ManualPumpCardProps) {
  const [inputMl, setInputMl] = useState<number>(15);

  const IconComponent = iconMap[setting.icon || "Droplets"] || Droplets;
  const theme = themeColorStyles[setting.color || "cyan"];

  // Helper for last dosed human-readable time
  let lastDosedText = "Henüz dozlama yapılmadı";
  if (lastLog && lastLog.created_at) {
    const diffMs = new Date().getTime() - new Date(lastLog.created_at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) lastDosedText = `${lastLog.ml_amount} ml (Az önce)`;
    else if (diffMins < 60) lastDosedText = `${lastLog.ml_amount} ml (${diffMins} dk önce)`;
    else {
      const diffHours = Math.floor(diffMins / 60);
      lastDosedText = `${lastLog.ml_amount} ml (${diffHours} saat önce)`;
    }
  }

  const isDosing = Boolean(activeState);

  return (
    <div
      className={`glass-panel rounded-3xl p-5 border ${
        isDosing
          ? "scale-[1.04] z-30 ring-2 ring-cyan-400/80 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.55)]"
          : `${theme.border} ${theme.glow}`
      } transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden`}
    >
      {/* 1. Aktif Dozajlama Çalışıyorsa Radial Progress Overlay (Sallanan Su Dalga Efekti ile) */}
      {activeState ? (
        <RadialProgress
          pumpId={setting.pump_id}
          label={setting.label}
          activeState={activeState}
          color={setting.color || "cyan"}
        />
      ) : completedState ? (
        /* 2. Dozlama Sonrası Başarı Bilgi Kartı */
        <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-950/95 rounded-2xl border border-emerald-500/50 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200 min-h-[220px]">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <h4 className="font-black text-sm text-emerald-300">Dozajlama Başarıyla Tamamlandı!</h4>
            <p className="text-xs text-slate-300 font-mono mt-1">
              <b className="text-emerald-400">{completedState.targetMl} ml</b> {setting.label} ({completedState.durationSeconds} saniye) dozlandı.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismissCompletion && onDismissCompletion(setting.pump_id)}
            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-lg shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer"
          >
            Tamam (Kapat)
          </button>
        </div>
      ) : (
        /* 3. Normal Pompa Kartı */
        <>
          {/* Card Header: Pompa İkonu, İsmi & Ayarlar Butonu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${theme.badgeBg}`}>
                  <IconComponent className={`w-5 h-5 ${theme.text}`} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{setting.label}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Pompa {setting.pump_id} • {setting.rate.toFixed(2)} ml/sn
                  </span>
                </div>
              </div>

              {/* Pompa Ayarları Butonu */}
              <button
                onClick={() => onOpenSettings(setting.pump_id)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
                title="Pompa Ayarları"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Son Dozaj Mini Özeti */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 px-3 flex items-center justify-between text-[11px] font-mono mb-3">
              <span className="text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3 text-cyan-400" /> Son Dozaj:
              </span>
              <span className={`font-semibold ${theme.text}`}>{lastDosedText}</span>
            </div>

            {/* Şişe / Depo Seviye Visualizer */}
            <BottleVisualizer
              pumpId={setting.pump_id}
              label={setting.label}
              currentMl={setting.container_current_ml ?? 1000}
              totalMl={setting.container_total_ml ?? 1000}
              color={setting.color || "cyan"}
              onRefill={onRefillContainer}
            />
          </div>

          {/* Alt Kısım: Manuel Dozaj Miktarı & Başlat Butonu */}
          <div className="border-t border-slate-800/80 pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">Dozaj Miktarı (ml):</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setInputMl((prev) => Math.max(1, prev - 5))}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 min-w-[36px] min-h-[36px] rounded-lg border border-slate-700/80 text-xs flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={setting.max_limit_ml || 200}
                  value={inputMl}
                  onChange={(e) => setInputMl(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-[36px] bg-slate-950 border border-slate-700/80 rounded-lg p-1 text-center font-mono font-bold text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setInputMl((prev) => prev + 5)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 min-w-[36px] min-h-[36px] rounded-lg border border-slate-700/80 text-xs flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || isOnline !== true}
              onClick={() => onDoseClick(setting.pump_id, inputMl)}
              className={`w-full bg-gradient-to-r ${theme.btnGrad} text-white font-bold py-3 sm:py-2.5 min-h-[48px] px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
            >
              {loading ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-sm font-black tracking-wide">Dozla</span>
                    <span className="text-[10px] font-mono font-bold opacity-90">({inputMl} ml)</span>
                  </div>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
