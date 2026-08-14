"use client";

import { Droplets, History, Power, Wifi, WifiOff, RefreshCw } from "lucide-react";

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
    <header className="sticky top-0 z-40 glass-panel border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-xl px-3 sm:px-8 py-2.5 sm:py-3.5 shadow-2xl pt-safe">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Sol Taraf: Marka & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-cyan-500/30 flex items-center justify-center">
            <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-cyan-300 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400">
                AquaMaster
              </h1>
              <span className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-semibold">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Akıllı Sıvı & Gübre Dozlama Kontrol Merkezi
            </p>
          </div>
        </div>

        {/* Orta: ESP32 Canlılık & Telemetri Rozetleri */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ESP32 Wi-Fi Canlılık Durumu */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 rounded-2xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-inner text-[11px] sm:text-xs">
            {isOnline === true ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px] sm:text-xs">
                    <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> <span className="hidden sm:inline">ESP32 </span>Çevrimiçi
                  </span>
                  {deviceIp && (
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden md:inline">
                      IP: {deviceIp} {secondsAgo !== null ? `(${secondsAgo}s önce)` : ""}
                    </span>
                  )}
                </div>
              </div>
            ) : isOnline === false ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-red-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-red-400 flex items-center gap-1 text-[11px] sm:text-xs">
                    <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" /> Kesildi
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] sm:text-xs">
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-cyan-400" />
                <span className="hidden sm:inline">Kontrol Ediliyor...</span>
              </div>
            )}
          </div>

          {/* TDS & EC Rozeti */}
          {tds !== undefined && tds !== null && tds > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 rounded-2xl px-3 py-1 text-xs">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-cyan-300">{tds} PPM</span>
                {ec !== undefined && ec !== null && (
                  <span className="text-[10px] text-emerald-400">({Math.round(ec)} µS/cm)</span>
                )}
              </div>
            </div>
          )}
        </div>



        {/* Sağ Taraf: Saat, E-STOP & Log Butonu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Dijital Saat */}
          {currentTime && (
            <div className="hidden lg:flex flex-col items-end font-mono text-xs text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="font-bold text-cyan-300">
                {currentTime.toLocaleTimeString("tr-TR")}
              </span>
              <span className="text-[9px] text-slate-400/80 tracking-tight">
                {currentTime.toLocaleDateString("tr-TR")}
              </span>
            </div>
          )}

          {/* Acil Durdurma Butonu (E-STOP) */}
          <button
            onClick={onEmergencyStop}
            className="animate-estop bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white text-[11px] sm:text-xs font-black py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl shadow-lg flex items-center gap-1 sm:gap-1.5 transition-transform active:scale-95 border border-red-400/40 cursor-pointer"
            title="Çalışan veya bekleyen tüm pompaları anında durdur"
          >
            <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
            <span>DURDUR</span>
          </button>

          {/* Dozaj Geçmişi / Log Butonu (Masaüstünde görünür) */}
          <button
            onClick={onOpenLogs}
            className="hidden sm:flex bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30 py-2 px-3.5 rounded-xl text-xs font-semibold items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Dozaj Logları</span>
          </button>
        </div>
      </div>
    </header>
  );
}
