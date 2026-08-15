"use client";

import { Droplets, History, Wifi, WifiOff, RefreshCw, Square } from "lucide-react";

interface GlobalHeaderProps {
  isOnline: boolean | null;
  deviceIp: string | null;
  lastSeenTime: number | null;
  temperature?: number | null;
  tds?: number | null;
  ec?: number | null;
  currentTime: Date | null;
  onOpenLogs: () => void;
  onEmergencyStop: () => void;
  isEmergencyStopActive?: boolean;
}

export default function GlobalHeader({
  isOnline,
  deviceIp,
  lastSeenTime,
  temperature,
  tds,
  ec,
  currentTime,
  onOpenLogs,
  onEmergencyStop,
}: GlobalHeaderProps) {
  // Calculate seconds since last ping from ESP32
  let secondsAgo: number | null = null;
  if (lastSeenTime && currentTime) {
    secondsAgo = Math.max(0, Math.floor((currentTime.getTime() - lastSeenTime) / 1000));
  }

  return (
    <header className="sticky top-0 z-40 bg-[#09101d] px-4 sm:px-8 py-3.5 pt-safe">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        {/* Sol Taraf: Örnekteki Logo Kutusu + Marka + Canlılık Alt Yazısı */}
        <div className="flex items-center gap-3">
          {/* Yuvarlatılmış Koyu Logo Kutusu */}
          <div className="w-10 h-10 rounded-2xl bg-[#0f1d2e] border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,210,255,0.15)]">
            <Droplets className="w-5 h-5 text-cyan-400" strokeWidth={2} />
          </div>

          <div className="flex flex-col justify-center">
            {/* Marka Adı */}
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
              AquaMaster
            </h1>

            {/* Canlılık Göstergesi: Yeşil Nokta + Wi-Fi İkonu + Saniye (güncellendi kelimesi olmadan) */}
            <div className="flex items-center gap-1.5 text-xs text-[#2fd8e0] font-mono mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
              <span className="font-extrabold text-emerald-300">
                {secondsAgo !== null ? `${secondsAgo}s` : "0s"}
              </span>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Örnekteki Birebir Koyu Kırmızı Pill "DOZAJI DURDUR" Butonu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEmergencyStop}
            className="bg-[#1a0c10] border border-red-500/60 hover:bg-red-950/40 text-red-500 hover:text-red-400 rounded-full px-4 py-2 text-xs font-black tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
            title="Çalışan veya bekleyen tüm pompaları anında durdur"
          >
            <Square className="w-2.5 h-2.5 fill-current text-red-500 animate-pulse" />
            <span>DOZAJI DURDUR</span>
          </button>
        </div>
      </div>
    </header>
  );
}


