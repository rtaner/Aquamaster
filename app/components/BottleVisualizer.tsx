"use client";

import { useEffect, useRef } from "react";
import { Droplet, RotateCcw, AlertTriangle } from "lucide-react";

interface BottleVisualizerProps {
  pumpId: number;
  label: string;
  currentMl: number;
  totalMl: number;
  color: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue";
  onRefill: (pumpId: number) => void;
}

const colorHexMap = {
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  purple: "#a855f7",
  blue: "#3b82f6",
};

const colorClasses = {
  cyan: {
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    bg: "bg-cyan-950/30",
  },
  emerald: {
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-950/30",
  },
  amber: {
    border: "border-amber-500/30",
    text: "text-amber-400",
    bg: "bg-amber-950/30",
  },
  rose: {
    border: "border-rose-500/30",
    text: "text-rose-400",
    bg: "bg-rose-950/30",
  },
  purple: {
    border: "border-purple-500/30",
    text: "text-purple-400",
    bg: "bg-purple-950/30",
  },
  blue: {
    border: "border-blue-500/30",
    text: "text-blue-400",
    bg: "bg-blue-950/30",
  },
};

/**
 * Geri sayım ekranındaki aynı çift sinüs dalga SVG algoritmasını kullanan
 * canlı 60fps sıvı dalgası bileşeni
 */
function MiniLiquidWave({ percentage, colorHex }: { percentage: number; colorHex: string }) {
  const wave1Ref = useRef<SVGPathElement>(null);
  const wave2Ref = useRef<SVGPathElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const V = 100; // ViewBox boyutu

  const wavePath = (levelY: number, amp: number, offset: number, tilt: number) => {
    const points: string[] = [];
    const centerX = V / 2;
    for (let x = -10; x <= V + 10; x += 10) {
      // Sakin çalkalanma eğim açısı (sağ yukarı, sol aşağı)
      const tiltOffset = ((x - centerX) / centerX) * tilt;
      const y = levelY + tiltOffset + Math.sin(x / 14 + offset) * amp;
      points.push(`${x},${y.toFixed(1)}`);
    }
    return `M -10,${V} L -10,${levelY.toFixed(1)} L ${points.join(" L ")} L ${
      V + 10
    },${V} Z`;
  };

  useEffect(() => {
    const tick = () => {
      phaseRef.current += 0.018; // Ultra sakin ve yavaş dalgalanma hızı
      // Yüzdeye göre sıvı yüksekliği Y koordinatı
      const levelY = V - (percentage / 100) * (V - 4);
      const tilt = Math.sin(phaseRef.current * 0.8) * 3;

      wave1Ref.current?.setAttribute("d", wavePath(levelY - 1, 3, phaseRef.current, tilt));
      wave2Ref.current?.setAttribute("d", wavePath(levelY + 1, 2, phaseRef.current + 1.4, -tilt));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [percentage]);

  return (
    <svg viewBox={`0 0 ${V} ${V}`} preserveAspectRatio="none" className="w-full h-full">
      <path ref={wave1Ref} fill={colorHex} opacity={0.45} />
      <path ref={wave2Ref} fill={colorHex} opacity={0.85} />
    </svg>
  );
}

export default function BottleVisualizer({
  pumpId,
  currentMl,
  totalMl,
  color,
  onRefill,
}: BottleVisualizerProps) {
  const percentage = Math.max(0, Math.min(100, Math.round((currentMl / totalMl) * 100)));
  const isLow = percentage <= 15;
  const theme = colorClasses[color] || colorClasses.cyan;
  const hexColor = colorHexMap[color] || "#06b6d4";

  return (
    <div className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border ${theme.border} ${theme.bg} shadow-md`}>
      {/* Şişe İkonik Kap Grafiği */}
      <div className="relative w-11 h-16 bg-slate-950 rounded-xl border border-slate-700/80 overflow-hidden flex flex-col justify-end p-0 shadow-inner">
        {/* Şişe Kapağı Detayı */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-slate-700 rounded-b-md z-10" />

        {/* Geri Sayım Ekranı İle Aynı Canlı Çift Sinüs Dalgalı SVG Sıvı Seviyesi */}
        <div className="absolute inset-0">
          <MiniLiquidWave percentage={percentage} colorHex={hexColor} />
        </div>

        {/* Doluluk Yüzdesi Metni */}
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-black text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)] z-20 pointer-events-none">
          %{percentage}
        </div>
      </div>

      {/* Şişe Bilgi ve Mütevazı Yeniden Doldurma Butonu */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Droplet className={`w-3 h-3 ${theme.text}`} /> Depo Seviyesi
          </span>
          {isLow && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> Sıvı Azaldı
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="font-mono text-xs font-bold text-slate-200">
            <span className={theme.text}>{Math.round(currentMl)}</span>
            <span className="text-slate-500 text-[10px]"> / {totalMl} ml</span>
          </div>

          {/* Mütevazı, Göz Yormayan Yeniden Doldurma Butonu */}
          <button
            type="button"
            onClick={() => onRefill(pumpId)}
            className="p-1 px-2 text-[9px] bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center gap-1 transition-all active:scale-95 cursor-pointer opacity-75 hover:opacity-100"
            title="Depoyu %100 Doldur"
          >
            <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
            <span>Doldur</span>
          </button>
        </div>
      </div>
    </div>
  );
}
