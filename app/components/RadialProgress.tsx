"use client";

import { Droplet, RefreshCw } from "lucide-react";
import { ActiveDosingState } from "@/types/aquamaster";
import LiquidLevelCountdown from "./LiquidLevelCountdown";

interface RadialProgressProps {
  pumpId: number;
  label: string;
  activeState: ActiveDosingState;
  color?: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue";
}

const colorHexMap = {
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  purple: "#a855f7",
  blue: "#3b82f6",
};

export default function RadialProgress({
  label,
  activeState,
  color = "cyan",
}: RadialProgressProps) {
  const { remainingSeconds, totalSeconds, dosingDuration, targetMl } = activeState;

  // Determine stage: Transmitting delay vs Motor running
  const isTransmitting = remainingSeconds > dosingDuration;
  const hexColor = colorHexMap[color] || "#06b6d4";

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/95 rounded-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden min-h-[240px]">
      {/* 🌊 ÇİFT SİNÜS DALGALI SIVI SEVİYESİ GERİ SAYIMI (LIQUID LEVEL COUNTDOWN) */}
      <div className="my-1">
        <LiquidLevelCountdown
          totalSeconds={totalSeconds}
          remainingSeconds={remainingSeconds}
          isRunning={true}
          color={hexColor}
          size={140}
        />
      </div>

      {/* Aşama Bilgi Rozeti */}
      <div className="mt-3 text-center z-10">
        {isTransmitting ? (
          <span className="bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[10px] px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 animate-pulse backdrop-blur-md">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            Komut İletiliyor (~{remainingSeconds - dosingDuration}s)
          </span>
        ) : (
          <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[10px] px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 animate-pulse backdrop-blur-md">
            <Droplet className="w-3 h-3 animate-bounce text-emerald-300" />
            Pompa Çalışıyor ({targetMl} ml)
          </span>
        )}
        <p className="text-[11px] text-slate-300 mt-1 font-bold">{label}</p>
      </div>
    </div>
  );
}
