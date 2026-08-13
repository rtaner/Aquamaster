"use client";

import { useMemo } from "react";
import {
  Thermometer,
  Wifi,
  WifiOff,
  FlaskConical,
  Sun,
  ShieldCheck,
  ChevronRight,
  Droplets,
  Clock,
} from "lucide-react";
import { PumpSetting, DosingLog, TuyaStripDeviceState, TuyaDeviceState, TuyaSocketSchedule } from "@/types/aquamaster";
import { formatCompactDuration, formatRelativeTimestamp } from "@/lib/timeUtils";

interface DashboardTabProps {
  temperature?: number | null;
  isOnline: boolean | null;
  deviceIp: string | null;
  lastSeenTime: number | null;
  currentTime: Date | null;
  filterDevice: TuyaDeviceState | null;
  stripDevice: TuyaStripDeviceState | null;
  tuyaSchedules: TuyaSocketSchedule[];
  pumpSettings: { [key: number]: PumpSetting };
  dosingLogs: DosingLog[];
  onNavigateTab: (tab: "dashboard" | "manual" | "sockets" | "temperature" | "calibration" | "logs") => void;
  onToggleFilter: () => void;
  onStartMaintenance: (minutes: number) => void;
  onToggleChannel: (channelCode: string, label: string, currentState: boolean) => void;
  onToggleAllStrip: (targetState: boolean) => void;
  onNotify?: (text: string, type: "success" | "error") => void;
}

export default function DashboardTab({
  temperature,
  isOnline,
  deviceIp,
  lastSeenTime,
  currentTime,
  filterDevice,
  stripDevice,
  tuyaSchedules,
  pumpSettings,
  dosingLogs,
  onNavigateTab,
  onToggleFilter,
  onToggleChannel,
}: DashboardTabProps) {
  // ESP32 Son Sinyal Geçen Süre
  const secondsAgo = useMemo(() => {
    if (!lastSeenTime || !currentTime) return null;
    return Math.max(0, Math.floor((currentTime.getTime() - lastSeenTime) / 1000));
  }, [lastSeenTime, currentTime]);

  // Tuya Soketleri İçin Zamanlayıcı Program Eşleşmesi ve Kalan Süre Hesaplama
  const getScheduleDurationInfo = (code: string, isCurrentlyOn: boolean) => {
    const schedule = tuyaSchedules.find((s) => s.channelCode === code && s.isActive);
    if (!schedule || !schedule.onTime || !schedule.offTime) {
      return { label: isCurrentlyOn ? "Durum" : "Açılmasına", value: isCurrentlyOn ? "Sürekli Açık" : "Çizelge Yok" };
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [onH, onM] = schedule.onTime.split(":").map(Number);
    const [offH, offM] = schedule.offTime.split(":").map(Number);

    const onMins = onH * 60 + onM;
    const offMins = offH * 60 + offM;

    if (isCurrentlyOn) {
      let remaining = offMins - currentMins;
      if (remaining < 0) remaining += 24 * 60;
      return { label: "Kalan Süre", value: formatCompactDuration(remaining) };
    } else {
      let remainingToOn = onMins - currentMins;
      if (remainingToOn < 0) remainingToOn += 24 * 60;
      return { label: "Açılmasına", value: formatCompactDuration(remainingToOn) };
    }
  };

  // 4 Gübre Kanalı Tanımları (İkon Harfi, Renkler & Sınıflar)
  const pumpConfigs: { [key: number]: { letter: string; colorClass: string; bgClass: string; barClass: string } } = {
    1: { letter: "K", colorClass: "text-purple-300", bgClass: "bg-purple-600/30 text-purple-200 border-purple-500/40", barClass: "bg-purple-500" },
    2: { letter: "M", colorClass: "text-cyan-300", bgClass: "bg-cyan-600/30 text-cyan-200 border-cyan-500/40", barClass: "bg-cyan-500" },
    3: { letter: "C", colorClass: "text-emerald-300", bgClass: "bg-emerald-600/30 text-emerald-200 border-emerald-500/40", barClass: "bg-emerald-500" },
    4: { letter: "P", colorClass: "text-amber-300", bgClass: "bg-amber-600/30 text-amber-200 border-amber-500/40", barClass: "bg-amber-500" },
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. ÜST CANLI BİLGİ VE STATUS BAR (SİSTEM SAATİ, ESP32 IP, ONLINE) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="glass-panel px-4 py-2.5 rounded-2xl border border-cyan-500/20 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs gap-2 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Online/Offline Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
            isOnline ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "bg-red-500/10 text-red-300 border-red-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-red-400"}`} />
            <span>{isOnline ? "Çevrimiçi" : "Çevrimdışı"}</span>
          </div>

          {/* ESP32 IP Adresi */}
          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
            <span>IP: {deviceIp || "192.168.1.X"}</span>
            {secondsAgo !== null && <span className="text-slate-500">({secondsAgo}s önce)</span>}
          </div>
        </div>

        {/* Canlı Sistem Saati */}
        {currentTime && (
          <div className="flex items-center gap-1.5 text-slate-300 font-mono font-bold text-[11px]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime.toLocaleTimeString("tr-TR")}</span>
            <span className="text-slate-500 font-normal hidden sm:inline">
              ({currentTime.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })})
            </span>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. 6'LI CİHAZ DURUM KARTLARI (2 SATIRDA 3'ER KUTU - MOCKUP BIREBIR) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* KART 1: SICAKLIK */}
        <div
          onClick={() => onNavigateTab("temperature")}
          className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 bg-slate-900/90 hover:bg-slate-900 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                SICAKLIK
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-black text-white font-mono my-1">
              {temperature !== null && temperature !== undefined ? temperature.toFixed(1) : "--.-"}
              <span className="text-xs sm:text-sm font-bold text-cyan-400 ml-0.5">°C</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
              İdeal
            </span>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
              24.0°C - 27.5°C
            </div>
          </div>
        </div>

        {/* KART 2: CO₂ */}
        {(() => {
          const co2State = stripDevice?.channels?.find((c) => c.code === "switch_1");
          const isOn = Boolean(co2State?.isSwitchOn);
          const durationInfo = getScheduleDurationInfo("switch_1", isOn);

          return (
            <div
              onClick={() => onToggleChannel("switch_1", "CO₂ Solenoid Vana", isOn)}
              className={`glass-panel p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden ${
                isOn ? "card-glow-emerald bg-slate-900/90" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 sm:p-2 rounded-xl border transition-all ${isOn ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      <FlaskConical className={`w-4 h-4 sm:w-5 sm:h-5 ${isOn ? "animate-pulse" : ""}`} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      CO₂
                    </span>
                  </div>
                  {isOn && <span className="w-2 h-2 rounded-full bg-emerald-400 status-beacon-pulse" title="Etkin" />}
                </div>

                <div className={`text-base sm:text-lg font-black my-1 flex items-center gap-1.5 ${isOn ? "text-emerald-400" : "text-slate-500"}`}>
                  {isOn ? "AÇIK" : "KAPALI"}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{durationInfo.label}</div>
                <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{durationInfo.value}</div>
              </div>
            </div>
          );
        })()}

        {/* KART 3: DIŞ FİLTRE */}
        <div
          onClick={onToggleFilter}
          className={`glass-panel p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden group ${
            filterDevice?.isSwitchOn ? "card-glow-cyan bg-slate-900/90" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
          }`}
        >
          {/* Fluval FX Serisi İkonik Dış Filtre Silüeti Arka Plan Filigranı */}
          <div className="absolute -right-3 -bottom-4 opacity-[0.09] pointer-events-none text-cyan-400 select-none transition-all duration-500 group-hover:opacity-[0.16] group-hover:scale-105">
            <svg width="95" height="115" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {/* Üst AquaStop Vanaları & Click-Fit Hortumlar */}
              <path d="M 34 16 V 5 M 34 5 C 34 2, 24 2, 24 2" />
              <path d="M 66 16 V 5 M 66 5 C 66 2, 76 2, 76 2" />
              <rect x="29" y="10" width="10" height="5" rx="2" fill="currentColor" fillOpacity="0.4" />
              <rect x="61" y="10" width="10" height="5" rx="2" fill="currentColor" fillOpacity="0.4" />

              {/* Fluval FX Ağır Hizmet Tipi Yuvarlak Üst Kapak */}
              <rect x="18" y="16" width="64" height="12" rx="4" fill="currentColor" fillOpacity="0.25" />

              {/* Çevresel 8-Cıvatalı Kilitleme Klipsleri (Swing-Lock Clamps) */}
              <rect x="13" y="17" width="6" height="10" rx="1.5" fill="currentColor" fillOpacity="0.6" />
              <rect x="81" y="17" width="6" height="10" rx="1.5" fill="currentColor" fillOpacity="0.6" />
              <rect x="24" y="24" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.4" />
              <rect x="72" y="24" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.4" />

              {/* Fluval FX Geniş Kova Gövdesi */}
              <path d="M 16 28 H 84 V 92 C 84 97, 76 101, 68 101 H 32 C 24 101, 16 97, 16 92 Z" fill="currentColor" fillOpacity="0.12" />

              {/* Yan Tutma Kaburgaları (Side Ribs / Handles) */}
              <path d="M 11 36 V 76 M 89 36 V 76" strokeWidth="2.5" />
              <line x1="11" y1="36" x2="16" y2="36" />
              <line x1="11" y1="76" x2="16" y2="76" />
              <line x1="84" y1="36" x2="89" y2="36" />
              <line x1="84" y1="76" x2="89" y2="76" />

              {/* Konsantrik İç Sepet Katmanları */}
              <rect x="24" y="36" width="52" height="16" rx="3" strokeDasharray="3 2" />
              <rect x="24" y="56" width="52" height="16" rx="3" strokeDasharray="3 2" />
              <rect x="24" y="76" width="52" height="16" rx="3" strokeDasharray="3 2" />

              {/* Fluval FX Alt Smart Pump Motor Tabanı & Tahliye Vanası */}
              <path d="M 22 101 H 78 V 109 C 78 113, 72 115, 64 115 H 36 C 28 115, 22 113, 22 109 Z" fill="currentColor" fillOpacity="0.3" />
              <path d="M 50 101 V 117" />
              <circle cx="50" cy="115" r="2.5" fill="currentColor" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 sm:p-2 rounded-xl border transition-all ${filterDevice?.isSwitchOn ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                  <ShieldCheck className={`w-4 h-4 sm:w-5 sm:h-5 ${filterDevice?.isSwitchOn ? "animate-pulse" : ""}`} />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                  DIŞ FİLTRE
                </span>
              </div>
              {filterDevice?.isSwitchOn && <span className="w-2 h-2 rounded-full bg-cyan-400 status-beacon-pulse" title="Sirkülasyon Aktif" />}
            </div>

            <div className={`text-base sm:text-lg font-black my-1 flex items-center gap-1.5 relative z-10 ${filterDevice?.isSwitchOn ? "text-cyan-400" : "text-slate-500"}`}>
              {filterDevice?.isSwitchOn ? "AÇIK" : "KAPALI"}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 relative z-10">
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Durum</div>
            <div className="text-xs sm:text-sm font-extrabold text-white">
              {filterDevice?.maintenanceMode ? "Bakımda" : filterDevice?.isSwitchOn ? "Çalışıyor" : "Durdu"}
            </div>
          </div>
        </div>

        {/* KART 4: POWER LED 1 */}
        {(() => {
          const led1State = stripDevice?.channels?.find((c) => c.code === "switch_2");
          const isOn = Boolean(led1State?.isSwitchOn);
          const durationInfo = getScheduleDurationInfo("switch_2", isOn);

          return (
            <div
              onClick={() => onToggleChannel("switch_2", "Power LED 1", isOn)}
              className={`glass-panel p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-lg ${
                isOn ? "card-glow-purple bg-slate-900/90" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 sm:p-2 rounded-xl border transition-all ${isOn ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${isOn ? "animate-pulse" : ""}`} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                      POWER LED 1
                    </span>
                  </div>
                  {isOn && <span className="w-2 h-2 rounded-full bg-purple-400 status-beacon-pulse" title="Işık Açık" />}
                </div>

                <div className={`text-base sm:text-lg font-black my-1 flex items-center gap-1.5 ${isOn ? "text-purple-400" : "text-slate-500"}`}>
                  {isOn ? "AÇIK" : "KAPALI"}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{durationInfo.label}</div>
                <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{durationInfo.value}</div>
              </div>

              {/* Alt Akzent Işıltı Çubuğu (Purple) */}
              <div className={`absolute bottom-0 left-2 right-2 h-1 rounded-full ${isOn ? "bg-purple-500 shadow-[0_0_12px_#a855f7]" : "bg-slate-800"}`} />
            </div>
          );
        })()}

        {/* KART 5: POWER LED 2 */}
        {(() => {
          const led2State = stripDevice?.channels?.find((c) => c.code === "switch_3");
          const isOn = Boolean(led2State?.isSwitchOn);
          const durationInfo = getScheduleDurationInfo("switch_3", isOn);

          return (
            <div
              onClick={() => onToggleChannel("switch_3", "Power LED 2", isOn)}
              className={`glass-panel p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-lg ${
                isOn ? "card-glow-amber bg-slate-900/90" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 sm:p-2 rounded-xl border transition-all ${isOn ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${isOn ? "animate-pulse" : ""}`} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                      POWER LED 2
                    </span>
                  </div>
                  {isOn && <span className="w-2 h-2 rounded-full bg-amber-400 status-beacon-pulse" title="Işık Açık" />}
                </div>

                <div className={`text-base sm:text-lg font-black my-1 flex items-center gap-1.5 ${isOn ? "text-amber-400" : "text-slate-500"}`}>
                  {isOn ? "AÇIK" : "KAPALI"}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{durationInfo.label}</div>
                <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{durationInfo.value}</div>
              </div>

              {/* Alt Akzent Işıltı Çubuğu (Amber/Orange) */}
              <div className={`absolute bottom-0 left-2 right-2 h-1 rounded-full ${isOn ? "bg-amber-500 shadow-[0_0_12px_#f59e0b]" : "bg-slate-800"}`} />
            </div>
          );
        })()}

        {/* KART 6: POWER LED 3 */}
        {(() => {
          const led3State = stripDevice?.channels?.find((c) => c.code === "switch_4");
          const isOn = Boolean(led3State?.isSwitchOn);
          const durationInfo = getScheduleDurationInfo("switch_4", isOn);

          return (
            <div
              onClick={() => onToggleChannel("switch_4", "Power LED 3", isOn)}
              className={`glass-panel p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-lg ${
                isOn ? "card-glow-blue bg-slate-900/90" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 sm:p-2 rounded-xl border transition-all ${isOn ? "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${isOn ? "animate-pulse" : ""}`} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                      POWER LED 3
                    </span>
                  </div>
                  {isOn && <span className="w-2 h-2 rounded-full bg-blue-400 status-beacon-pulse" title="Işık Açık" />}
                </div>

                <div className={`text-base sm:text-lg font-black my-1 flex items-center gap-1.5 ${isOn ? "text-blue-400" : "text-slate-500"}`}>
                  {isOn ? "AÇIK" : "KAPALI"}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">{durationInfo.label}</div>
                <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{durationInfo.value}</div>
              </div>

              {/* Alt Akzent Işıltı Çubuğu (Blue) */}
              <div className={`absolute bottom-0 left-2 right-2 h-1 rounded-full ${isOn ? "bg-blue-500 shadow-[0_0_12px_#3b82f6]" : "bg-slate-800"}`} />
            </div>
          );
        })()}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. SIVI & GÜBRE DOZAJ POMPALARI LİSTESİ (GÖRSEL MOCKUP BIREBIR) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-cyan-500/20 bg-slate-900/90 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
              SIVI & GÜBRE DOZAJ POMPALARI
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("manual")}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Ekrana git</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Kanal Liste Satırları */}
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((pumpId) => {
            const setting = pumpSettings[pumpId] || {
              pump_id: pumpId,
              rate: 1.0,
              label: pumpId === 1 ? "POTASYUM" : pumpId === 2 ? "MİKRO" : pumpId === 3 ? "CARBON" : "FOSFOR",
              color: "cyan",
              container_current_ml: 850,
              container_total_ml: 1000,
            };

            const conf = pumpConfigs[pumpId] || pumpConfigs[1];
            const lastLog = dosingLogs.find((l) => l.pump_id === pumpId);

            const currentMl = setting.container_current_ml ?? 850;
            const totalMl = setting.container_total_ml ?? 1000;
            const percentage = Math.max(0, Math.min(100, Math.round((currentMl / totalMl) * 100)));

            return (
              <div
                key={pumpId}
                onClick={() => onNavigateTab("manual")}
                className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Harfli Daire Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border shrink-0 ${conf.bgClass}`}>
                    {conf.letter}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 uppercase tracking-wide truncate">
                        {setting.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
                        Kanal {pumpId}
                      </span>
                    </div>

                    {/* Seviye Metni ve İlerleme Çubuğu */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-medium">
                        Seviye: <span className="font-mono font-bold text-slate-200">{currentMl} ml (%{percentage})</span>
                      </div>
                      <div className="w-36 sm:w-48 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div className={`h-full rounded-full ${conf.barClass}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ: Son Dozajlaşma Metni & Chevron */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                  <div className="text-left sm:text-right text-[11px]">
                    <div className="text-[10px] text-slate-500 font-medium">Son Dozaj</div>
                    <div className="font-mono font-bold text-cyan-400">
                      {lastLog ? `${lastLog.ml_amount} ml (${formatRelativeTimestamp(lastLog.created_at)})` : "10 ml (Henüz yapılmadı)"}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
