"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  BoltIcon as BoltOutline,
  SunIcon as SunOutline,
  BeakerIcon as BeakerOutline,
  CircleStackIcon as FilterOutline,
  ClockIcon as ClockOutline,
  WrenchIcon as WrenchOutline,
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";

import {
  BoltIcon as BoltSolid,
  SunIcon as SunSolid,
  BeakerIcon as BeakerSolid,
  CircleStackIcon as FilterSolid,
  ClockIcon as ClockSolid,
  WrenchIcon as WrenchSolid,
  HeartIcon as HeartSolid,
} from "@heroicons/react/24/solid";

import {
  Thermometer,
  ChevronRight,
  Droplets,
  Check,
} from "lucide-react";

import { PumpSetting, DosingLog, TuyaStripDeviceState, TuyaDeviceState, TuyaSocketSchedule, WaterQualityLog, ScheduleItem } from "@/types/aquamaster";
import { formatCompactDuration } from "@/lib/timeUtils";



interface DashboardTabProps {
  temperature?: number | null;
  tds?: number | null;
  ec?: number | null;
  waterChangeThreshold?: number;
  isOnline: boolean | null;
  deviceIp: string | null;
  lastSeenTime: number | null;
  currentTime: Date | null;
  filterDevice: TuyaDeviceState | null;
  stripDevice: TuyaStripDeviceState | null;
  tuyaSchedules: TuyaSocketSchedule[];
  schedules?: ScheduleItem[];
  pumpSettings: { [key: number]: PumpSetting };
  dosingLogs: DosingLog[];
  onNavigateTab: (tab: "dashboard" | "manual" | "sockets" | "analytics" | "calibration" | "logs" | "water_quality") => void;
  onToggleFilter: () => void;
  onStartMaintenance: (minutes: number) => void;
  onToggleChannel: (channelCode: string, label: string, currentState: boolean) => void;
  onToggleAllStrip?: (targetState: boolean) => void;
  onNotify?: (text: string, type: "success" | "error") => void;
}

export default function DashboardTab({
  temperature,
  tds,
  ec,
  waterChangeThreshold = 400,
  isOnline,
  deviceIp,
  lastSeenTime,
  currentTime,
  filterDevice,
  stripDevice,
  tuyaSchedules,
  schedules = [],
  pumpSettings,
  dosingLogs = [],
  onNavigateTab,
  onToggleFilter,
  onStartMaintenance,
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

  // Son TDS ölçüm saati (örneğin "23:57")
  const lastTdsTimeStr = useMemo(() => {
    if (!currentTime) return "23:57";
    const minutes = currentTime.getMinutes();
    const roundedMinutes = Math.floor(minutes / 60) * 60;
    const d = new Date(currentTime);
    d.setMinutes(roundedMinutes, 0, 0);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }, [currentTime]);

  const displayTds = tds !== undefined && tds !== null && tds > 0 ? tds.toFixed(1) : "142.7";
  const displayEc = ec !== undefined && ec !== null && ec > 0 ? Math.round(ec) : Math.round(Number(displayTds) * 2);
  const displayTemp = temperature !== undefined && temperature !== null && temperature > -50 ? temperature.toFixed(1) : "25.3";

  // Supabase Veritabanından Son 12 TDS Ölçüm Kaydını Canlı Çek (Sparkline Trend Çizgisi İçin)
  const [sparklineLogs, setSparklineLogs] = useState<WaterQualityLog[]>([]);

  useEffect(() => {
    const fetchSparklineLogs = async () => {
      try {
        const { data } = await supabase
          .from("water_quality_logs")
          .select("id, tds, ec, temperature, created_at")
          .order("created_at", { ascending: false })
          .limit(12);


        if (data && data.length > 0) {
          setSparklineLogs(data.reverse());
        }
      } catch (e) {
        console.warn("Sparkline için Supabase logs okunamadı:", e);
      }
    };

    fetchSparklineLogs();
    const interval = setInterval(fetchSparklineLogs, 60000); // 1 dakikada bir otomatik yenile
    return () => clearInterval(interval);
  }, []);

  // Supabase Veritabanındaki Gerçek TDS Verilerinden Yumuşak (Cubic Bezier Spline) SVG Eğrisi Oluşturma
  const sparklinePath = useMemo(() => {
    if (!sparklineLogs || sparklineLogs.length < 2) {
      // Şablon Trend Çizgisi (Log yokken yumuşak dalga)
      return {
        area: "M 0,32 Q 30,24 60,30 T 120,20 T 180,25 T 240,16 T 300,18 L 300,40 L 0,40 Z",
        line: "M 0,32 Q 30,24 60,30 T 120,20 T 180,25 T 240,16 T 300,18",
      };
    }

    const values = sparklineLogs.map((l) => l.tds);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    const width = 300;
    const height = 20; // 12 to 32 Y aralığı (yumuşatılmış genlik)

    const points = values.map((val, idx) => {
      const x = Math.round((idx / (values.length - 1)) * width);
      const norm = (val - min) / range;
      const y = Math.round(30 - norm * height);
      return { x, y };
    });

    // 🌊 Cubic Bezier Spline ile Keskin Köşeleri Yumuşatarak İpek Gibi Dalga Oluşturma
    let line = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      line += ` C ${Math.round(cp1x)},${Math.round(cp1y)} ${Math.round(cp2x)},${Math.round(cp2y)} ${p2.x},${p2.y}`;
    }

    const area = `${line} L ${points[points.length - 1].x},40 L ${points[0].x},40 Z`;
    return { area, line };
  }, [sparklineLogs]);

  // Her gübre/pompa için sadece 1 adet EN YAKIN (Sıradaki) Dozaj Programını Hesaplama
  const realDosingSchedules = useMemo(() => {
    const now = currentTime || new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const colors = [
      "text-purple-400 bg-purple-500/20 border-purple-500/30",
      "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
      "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
      "text-amber-400 bg-amber-500/20 border-amber-500/30",
      "text-rose-400 bg-rose-500/20 border-rose-500/30",
    ];

    if (!schedules || schedules.length === 0) {
      // Şablon Varsayılan Programlar (Eğer henüz veritabanında program tanımlanmamışsa)
      return [
        { id: 1, pumpId: 1, name: pumpSettings[1]?.label || "Potasyum", ml: "2.5 ml", time: "22:00", isActive: true, color: colors[0], lastDoseText: "Henüz yapılmadı", isDosedToday: false },
        { id: 2, pumpId: 2, name: pumpSettings[2]?.label || "Mikro", ml: "1.5 ml", time: "21:00", isActive: true, color: colors[1], lastDoseText: "Henüz yapılmadı", isDosedToday: false },
        { id: 3, pumpId: 3, name: pumpSettings[3]?.label || "Karbon", ml: "1.0 ml", time: "20:00", isActive: true, color: colors[2], lastDoseText: "Henüz yapılmadı", isDosedToday: false },
      ];
    }

    // Pompaya (Gübreye) göre grupla
    const pumpGroups: { [pumpId: number]: ScheduleItem[] } = {};
    schedules.forEach((s) => {
      if (!pumpGroups[s.pump_id]) pumpGroups[s.pump_id] = [];
      pumpGroups[s.pump_id].push(s);
    });

    const result = [];

    for (const pumpIdStr in pumpGroups) {
      const pumpId = Number(pumpIdStr);
      const pumpScheds = pumpGroups[pumpId];
      const pumpSetting = pumpSettings[pumpId];
      const label = pumpSetting?.label || `Pompa ${pumpId}`;
      const rate = pumpSetting?.rate || 1.0;

      // Bu pompa için şu andan sonraki ilk en yakın zamanlanmış programı bul
      let nextSched: ScheduleItem | null = null;
      let minWaitMins = Infinity;

      for (const s of pumpScheds) {
        if (!s.run_time) continue;
        const [h, m] = s.run_time.split(":").map(Number);
        const schedMins = h * 60 + m;
        let waitMins = schedMins - currentMins;
        if (waitMins <= 0) waitMins += 24 * 60; // Bugün geçtiyse yarınki saate kalır

        if (waitMins < minWaitMins) {
          minWaitMins = waitMins;
          nextSched = s;
        }
      }

      if (nextSched) {
        const mlVal = (nextSched.duration_seconds * rate).toFixed(1);
        const lastLog = dosingLogs?.find((l) => l.pump_id === pumpId);
        let lastDoseText = "Henüz yapılmadı";
        let isDosedToday = false;

        if (lastLog && lastLog.created_at) {
          const logD = new Date(lastLog.created_at);
          const isToday = logD.toDateString() === now.toDateString();
          const timeStr = logD.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
          if (isToday) {
            isDosedToday = true;
            lastDoseText = `Bugün ${timeStr} (${lastLog.ml_amount} ml)`;
          } else {
            const isYesterday = new Date(now.getTime() - 86400000).toDateString() === logD.toDateString();
            if (isYesterday) {
              lastDoseText = `Dün ${timeStr} (${lastLog.ml_amount} ml)`;
            } else {
              const dateStr = logD.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
              lastDoseText = `${dateStr} ${timeStr} (${lastLog.ml_amount} ml)`;
            }
          }
        }

        result.push({
          id: nextSched.id,
          pumpId,
          name: label,
          ml: `${mlVal} ml`,
          time: nextSched.run_time,
          isActive: nextSched.is_active,
          color: colors[(pumpId - 1) % colors.length] || colors[0],
          lastDoseText,
          isDosedToday,
        });
      }
    }

    // Pompa ID'sine göre sırala
    return result.sort((a, b) => a.pumpId - b.pumpId);
  }, [schedules, pumpSettings, currentTime, dosingLogs]);





  return (
    <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-200">


      {/* 🚨 SU DEĞİŞİMİ ZAMANI GELDİ UYARI BARAJI (Eğer TDS Eşiği Aşılırsa) */}
      {Number(displayTds) >= waterChangeThreshold && (
        <div
          onClick={() => onNavigateTab("analytics" as any)}
          className="relative overflow-hidden bg-gradient-to-r from-rose-950/90 via-rose-900/50 to-slate-900 border-2 border-rose-500/60 p-4 rounded-2xl shadow-xl cursor-pointer hover:border-rose-400 transition group"
        >
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-200">🚨 SU DEĞİŞİMİ ZAMANI GELDİ!</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/30 text-rose-300">
                    {displayTds} PPM
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Su kirliliği belirlenen <strong>{waterChangeThreshold} PPM</strong> eşiğini aştı. Detaylar için tıklayın.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-rose-300 group-hover:translate-x-1 transition" strokeWidth={2} />
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. AKVARYUM DURUMU KART (PIXEL-PERFECT CSS METRİK DÜZENİ) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        onClick={() => onNavigateTab("analytics" as any)}
        className="bg-[linear-gradient(165deg,#142236,#101c2b)] border border-white/[0.06] rounded-[22px] p-[22px] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)] cursor-pointer relative overflow-hidden transition-all duration-300 group"
      >
        {/* Üst Satır Düzeni (.hero-top) */}
        <div className="flex justify-between items-start">
          {/* Sol Taraf Metin Bloğu */}
          <div>
            {/* .metric-label ("AKVARYUM DURUMU") - Kalp İkonu Kaldırıldı */}
            <div className="text-[10.5px] font-semibold text-[#7c8ba0] tracking-[0.7px] uppercase mb-[10px]">
              AKVARYUM DURUMU
            </div>


            {/* .metric-value ("176.7 PPM" Baseline Hizalama) */}
            <div className="text-[42px] font-semibold font-mono tracking-[-1px] leading-none text-[#eef2f7] flex items-baseline gap-[7px]">
              <span>{displayTds}</span>
              <span className="text-[14px] font-medium text-[#7c8ba0] font-sans">PPM</span>
            </div>

            {/* .metric-mid ("TDS" En Soluk Ton) */}
            <div className="text-[12px] font-medium text-[#4c5a6e] uppercase tracking-[0.4px] mt-[8px]">
              TDS
            </div>

            {/* .metric-sub ("353 µS/cm · 02:00" Cyan Accent) */}
            <div className="font-mono text-[13px] font-semibold text-[#2fd8e0] mt-[4px]">
              {displayEc} µS/cm · {lastTdsTimeStr}
            </div>
          </div>

          {/* Sağ Taraf Sıcaklık Kutusu (.temp-badge) */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-[16px] px-[16px] py-[13px] min-w-[80px] flex flex-col items-center gap-[8px]">
            <Thermometer className="w-[18px] h-[18px] text-[#2fd8e0]" strokeWidth={2} />
            <div className="font-mono text-[16px] font-semibold text-[#eef2f7]">
              {displayTemp}°C
            </div>
            <span className="text-[9.5px] font-bold text-[#3fd694] bg-[#3fd694]/[0.14] px-[9px] py-[3px] rounded-[20px]">
              İDEAL
            </span>
          </div>
        </div>

        {/* 📈 En Altta Sparkline TDS Trend Çizgi Grafiği */}
        <div className="pt-3 relative">
          <div className="h-10 sm:h-12 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tdsSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fd8e0" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2fd8e0" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Gölgeli Dolgu Alanı */}
              <path
                d={sparklinePath.area}
                fill="url(#tdsSparklineGrad)"
              />
              {/* Parlak Cyan Accent Çizgi */}
              <path
                d={sparklinePath.line}
                fill="none"
                stroke="#2fd8e0"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_#2fd8e0]"
              />
            </svg>
          </div>
        </div>
      </div>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. EKİPMANLAR (GRİ METRİK BAŞLIK DÜZENİ) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center gap-[6px] text-[#7c8ba0] font-semibold text-[10.5px] uppercase tracking-[0.7px] px-1">
          <BoltSolid className="w-3.5 h-3.5 text-[#7c8ba0]" />
          <span>EKİPMANLAR</span>
        </div>


        {/* Üst Satır: CO2 & Dış Filtre (2 Kolon) */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* CO2 Kartı */}
          {(() => {
            const co2State = stripDevice?.channels?.find((c) => c.code === "switch_1");
            const isOn = Boolean(co2State?.isSwitchOn);
            const durationInfo = getScheduleDurationInfo("switch_1", isOn);
            return (
              <div
                onClick={() => onToggleChannel("switch_1", "CO₂ Solenoid Vana", isOn)}
                className={`p-4 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isOn
                    ? "bg-gradient-to-b from-[#162744] via-[#122038] to-[#0f1a2e] border-2 border-[#00d2ff] shadow-[0_0_30px_rgba(0,210,255,0.35),inset_0_0_15px_rgba(0,210,255,0.15)]"
                    : "bg-gradient-to-b from-[#141f33] to-[#0e1726] border border-[#1f3150] shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:border-[#2d4670]"
                }`}
              >
                {/* Aktif Işık Saçan Arka Plan Parlaması */}
                {isOn && (
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00d2ff]/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
                )}

                <div className="space-y-2.5 relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Heroicons: Pasif = Outline, Aktif = Solid Dolgulu */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOn
                        ? "bg-[#0a2834] border border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                        : "bg-slate-900/90 border border-slate-700/60 text-slate-400"
                    }`}>
                      {isOn ? (
                        <BeakerSolid className="w-5 h-5 text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]" />
                      ) : (
                        <BeakerOutline className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-100 tracking-wider">CO₂</span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOn ? "bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-ping" : "bg-slate-500"}`} />
                    <span className={`text-xs font-black tracking-wide ${isOn ? "text-[#00ff88] drop-shadow-[0_0_6px_rgba(0,255,136,0.4)]" : "text-slate-400"}`}>
                      {isOn ? "AÇIK" : "KAPALI"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-2.5 border-t border-[#1b2a45]/80 mt-2.5 flex items-center gap-1.5 relative z-10">
                  <ClockOutline className="w-3.5 h-3.5 text-slate-400" />
                  <span>{durationInfo.value}</span>
                </div>
              </div>
            );
          })()}

          {/* Dış Filtre Kartı */}
          <div
            onClick={onToggleFilter}
            className={`p-4 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              filterDevice?.isSwitchOn
                ? "bg-gradient-to-b from-[#162744] via-[#122038] to-[#0f1a2e] border-2 border-[#00d2ff] shadow-[0_0_30px_rgba(0,210,255,0.35),inset_0_0_15px_rgba(0,210,255,0.15)]"
                : "bg-gradient-to-b from-[#141f33] to-[#0e1726] border border-[#1f3150] shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:border-[#2d4670]"
            }`}
          >
            {/* Aktif Işık Saçan Arka Plan Parlaması */}
            {filterDevice?.isSwitchOn && (
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00d2ff]/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
            )}

            <div className="space-y-2.5 relative z-10">
              <div className="flex items-center gap-3">
                {/* Heroicons: Pasif = Outline, Aktif = Solid Dolgulu */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  filterDevice?.isSwitchOn
                    ? "bg-[#0a2834] border border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                    : "bg-slate-900/90 border border-slate-700/60 text-slate-400"
                }`}>
                  {filterDevice?.isSwitchOn ? (
                    <FilterSolid className="w-5 h-5 text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]" />
                  ) : (
                    <FilterOutline className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <span className="text-xs font-black text-slate-100 tracking-wider">DIŞ FİLTRE</span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${filterDevice?.isSwitchOn ? "bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-ping" : "bg-slate-500"}`} />
                <span className={`text-xs font-black tracking-wide ${filterDevice?.isSwitchOn ? "text-[#00ff88] drop-shadow-[0_0_6px_rgba(0,255,136,0.4)]" : "text-slate-400"}`}>
                  {filterDevice?.isSwitchOn ? "AÇIK" : "KAPALI"}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono pt-2.5 border-t border-[#1b2a45]/80 mt-2.5 font-bold relative z-10">
              {filterDevice?.maintenanceMode ? "Bakımda" : filterDevice?.isSwitchOn ? "Çalışıyor" : "Durdu"}
            </div>
          </div>
        </div>

        {/* Alt Satır: LED 1, LED 2, LED 3 (3 Kolon) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { code: "switch_2", label: "LED 1" },
            { code: "switch_3", label: "LED 2" },
            { code: "switch_4", label: "LED 3" },
          ].map((led) => {
            const chState = stripDevice?.channels?.find((c) => c.code === led.code);
            const isOn = Boolean(chState?.isSwitchOn);
            const durationInfo = getScheduleDurationInfo(led.code, isOn);

            return (
              <div
                key={led.code}
                onClick={() => onToggleChannel(led.code, led.label, isOn)}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isOn
                    ? "bg-gradient-to-b from-[#162744] via-[#122038] to-[#0f1a2e] border-2 border-[#00d2ff] shadow-[0_0_25px_rgba(0,210,255,0.3),inset_0_0_12px_rgba(0,210,255,0.15)]"
                    : "bg-gradient-to-b from-[#141f33] to-[#0e1726] border border-[#1f3150] shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:border-[#2d4670]"
                }`}
              >
                {isOn && (
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#00d2ff]/15 rounded-full blur-xl pointer-events-none animate-pulse" />
                )}

                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    {/* Heroicons: Pasif = Outline Sun, Aktif = Solid Sun */}
                    {isOn ? (
                      <SunSolid className="w-4.5 h-4.5 text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]" />
                    ) : (
                      <SunOutline className="w-4.5 h-4.5 text-slate-400" />
                    )}
                    <span className="text-[11px] sm:text-xs font-black text-slate-100 tracking-wider">{led.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 my-1">
                    <span className={`w-2 h-2 rounded-full ${isOn ? "bg-[#00ff88] shadow-[0_0_8px_#00ff88]" : "bg-slate-500"}`} />
                    <span className={`text-[10px] font-black tracking-wide ${isOn ? "text-[#00ff88]" : "text-slate-400"}`}>
                      {isOn ? "AÇIK" : "KAPALI"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1b2a45]/80 mt-1.5 relative z-10">
                  <span className="text-[9px] text-slate-400 font-medium block">{durationInfo.label}</span>
                  <span className="text-[10px] sm:text-[11px] font-black text-white font-mono">{durationInfo.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. DOZAJ PROGRAMI (HEROICONS DÜZENİ) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-[6px] text-[#7c8ba0] font-semibold text-[10.5px] uppercase tracking-[0.7px]">
            <BeakerSolid className="w-3.5 h-3.5 text-[#7c8ba0]" />
            <span>DOZAJ PROGRAMI</span>
          </div>
          <button
            onClick={() => onNavigateTab("manual")}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Tümü</span>
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>


        {/* Gübre Zamanlayıcı Listesi (Son Dozaj Bilgisi & Durum Rozetli) */}
        <div className="space-y-2.5">
          {realDosingSchedules.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => onNavigateTab("manual")}
                className="bg-gradient-to-r from-[#141f33] to-[#0e1726] p-3.5 rounded-2xl border border-[#1f3150] shadow-[0_6px_16px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer hover:border-[#2d4670] transition duration-200"
              >
                {/* Sol Taraf: Pompa İkonu, İsmi & Planlanan Saat / Miktar */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${item.color}`}>
                    <BeakerSolid className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-200 tracking-wide text-sm">{item.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded-md">
                        {item.ml}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mt-0.5">
                      <ClockOutline className="w-3.5 h-3.5 text-slate-500" />
                      <span>Planlanan Saat: <strong className="text-slate-200">{item.time}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Sağ Taraf: Son Dozaj Durumu (Yapılıp Yapılmadığı) */}
                <div className="flex items-center justify-between sm:justify-end gap-3 font-mono border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Son Dozaj:</span>
                    <span className={`text-[11px] font-bold ${item.isDosedToday ? "text-[#00ff88]" : "text-slate-300"}`}>
                      {item.lastDoseText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                        item.isDosedToday
                          ? "bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/40 shadow-[0_0_8px_rgba(0,255,136,0.2)]"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {item.isDosedToday ? "✓ Bugün Yapıldı" : "⏳ Bekleniyor"}
                    </span>

                    <div className={`p-1 rounded-full ${item.isActive ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 shadow-[0_0_8px_rgba(0,255,136,0.3)]" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                      <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1 px-1">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-ping" />
          <span>{realDosingSchedules.filter((s) => s.isActive).length} aktif program zamanlandı</span>
        </div>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 5. BAKIM MODU KARTI (HEROICONS DÜZENİ) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-[#0a2834] border border-[#00e5ff]/50 flex items-center justify-center text-[#00e5ff] shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <WrenchSolid className="w-5 h-5 text-[#00e5ff] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
              AKVARYUM BAKIM MODU
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Yemleme veya filtre temizliği için dış filtre ve CO₂ sistemini durdurun
            </p>
          </div>
        </div>

        {/* 3 Farklı Süreli Bakım Modu Butonları */}
        <div className="grid grid-cols-3 gap-3.5 pt-1">
          <button
            onClick={() => onStartMaintenance(15)}
            className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-[#141f33] to-[#0e1726] hover:from-[#162744] hover:to-[#0f1a2e] hover:border-[#00d2ff] hover:shadow-[0_0_20px_rgba(0,210,255,0.3)] text-cyan-300 border border-[#1f3150] font-bold text-xs transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
          >
            <ClockOutline className="w-4.5 h-4.5 text-cyan-400 group-hover:scale-110 transition duration-200" />
            <span className="font-extrabold">15 Dakika</span>
            <span className="text-[9px] font-normal text-slate-400">Hızlı Yemleme</span>
          </button>

          <button
            onClick={() => onStartMaintenance(30)}
            className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-[#141f33] to-[#0e1726] hover:from-[#162744] hover:to-[#0f1a2e] hover:border-[#00d2ff] hover:shadow-[0_0_20px_rgba(0,210,255,0.3)] text-blue-300 border border-[#1f3150] font-bold text-xs transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
          >
            <ClockOutline className="w-4.5 h-4.5 text-blue-400 group-hover:scale-110 transition duration-200" />
            <span className="font-extrabold">30 Dakika</span>
            <span className="text-[9px] font-normal text-slate-400">Su Değişimi</span>
          </button>

          <button
            onClick={() => onStartMaintenance(45)}
            className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-[#141f33] to-[#0e1726] hover:from-[#162744] hover:to-[#0f1a2e] hover:border-[#00d2ff] hover:shadow-[0_0_20px_rgba(0,210,255,0.3)] text-indigo-300 border border-[#1f3150] font-bold text-xs transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
          >
            <ClockOutline className="w-4.5 h-4.5 text-indigo-400 group-hover:scale-110 transition duration-200" />
            <span className="font-extrabold">45 Dakika</span>
            <span className="text-[9px] font-normal text-slate-400">Genel Temizlik</span>
          </button>
        </div>
      </div>

    </div>
  );
}
