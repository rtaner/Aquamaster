"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { WaterQualityLog } from "@/types/aquamaster";
import {
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Clock,
  AlertTriangle,
  Settings,
  X,
  Waves,
  Sparkles,
  Info,
} from "lucide-react";

interface WaterQualityTabProps {
  currentTds?: number | null;
  currentEc?: number | null;
  currentTemp?: number | null;
  deviceIp?: string | null;
  waterChangeThreshold?: number;
  onUpdateThreshold?: (val: number) => void;
  onNotify?: (text: string, type: "success" | "error") => void;
}

export default function WaterQualityTab({
  currentTds,
  currentEc,
  currentTemp,
  deviceIp,
  waterChangeThreshold = 400,
  onUpdateThreshold,
  onNotify,
}: WaterQualityTabProps) {
  const [logs, setLogs] = useState<WaterQualityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [instantTesting, setInstantTesting] = useState<boolean>(false);
  const [instantResult, setInstantResult] = useState<{ tds: number; ec: number; temp: number; time: string } | null>(null);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("24h");
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempThresholdInput, setTempThresholdInput] = useState<number>(waterChangeThreshold);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; log: WaterQualityLog } | null>(null);

  useEffect(() => {
    setTempThresholdInput(waterChangeThreshold);
  }, [waterChangeThreshold]);

  // Manuel Anlık Test Ölçümü (Veritabanına İşlenmeyen Kayıtsız Test)
  const handleRunInstantTest = async () => {
    setInstantTesting(true);
    try {
      let resultObj: { tds: number; ec: number; temp: number } | null = null;

      if (deviceIp) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(`http://${deviceIp}/read_tds`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              resultObj = { tds: json.tds, ec: json.ec, temp: json.temperature };
            }
          }
        } catch (e) { }
      }

      if (!resultObj) {
        const { data } = await supabase.from("device_status").select("*").eq("id", 1).single();
        if (data && data.tds !== undefined) {
          resultObj = {
            tds: Number(data.tds),
            ec: Number(data.ec || Number(data.tds) * 2),
            temp: Number(data.temperature || currentTemp || 25.0),
          };
        }
      }

      if (resultObj) {
        setInstantResult({
          tds: resultObj.tds,
          ec: resultObj.ec,
          temp: resultObj.temp,
          time: new Date().toLocaleTimeString("tr-TR"),
        });
        if (onNotify) {
          onNotify(`Anlık Test Başarılı: ${resultObj.tds} PPM | ${Math.round(resultObj.ec)} µS/cm (Grafik verisi kirletilmedi)`, "success");
        }
      }
    } catch (e: any) {
      if (onNotify) onNotify("Anlık test ölçümü alınamadı.", "error");
    } finally {
      setInstantTesting(false);
    }
  };


  // Fetch Water Quality logs from Supabase
  const fetchWaterQualityLogs = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("water_quality_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        if (error.code === "42P01") {
          console.warn("water_quality_logs tablosu Supabase'de henüz oluşturulmamış.");
        } else {
          throw error;
        }
      }

      if (data) {
        setLogs(data);
      }
    } catch (e: any) {
      console.error("Su kalitesi logları çekme hatası:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWaterQualityLogs();
    const interval = setInterval(fetchWaterQualityLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    const now = new Date().getTime();

    return logs
      .filter((log) => {
        if (!log.created_at) return true;
        const logTime = new Date(log.created_at).getTime();
        const diffHours = (now - logTime) / (1000 * 60 * 60);

        if (timeFilter === "24h") return diffHours <= 24;
        if (timeFilter === "7d") return diffHours <= 24 * 7;
        if (timeFilter === "30d") return diffHours <= 24 * 30;
        return true;
      })
      .reverse();
  }, [logs, timeFilter]);

  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      const activeTds = currentTds ?? 0;
      const activeEc = currentEc ?? activeTds / 0.5;
      return {
        avgTds: activeTds,
        minTds: activeTds,
        maxTds: activeTds,
        avgEc: activeEc,
        minEc: activeEc,
        maxEc: activeEc,
        trend: "kararli" as "yukseliyor" | "dusuyor" | "kararli",
        tdsChange: 0,
      };
    }

    const tdsList = filteredLogs.map((l) => Number(l.tds));
    const ecList = filteredLogs.map((l) => Number(l.ec));

    const sumTds = tdsList.reduce((acc, val) => acc + val, 0);
    const sumEc = ecList.reduce((acc, val) => acc + val, 0);

    const firstPoint = tdsList[0];
    const lastPoint = tdsList[tdsList.length - 1];
    const diff = lastPoint - firstPoint;

    let trend: "yukseliyor" | "dusuyor" | "kararli" = "kararli";
    if (diff > 5) trend = "yukseliyor";
    else if (diff < -5) trend = "dusuyor";

    return {
      avgTds: Math.round(sumTds / tdsList.length),
      minTds: Math.round(Math.min(...tdsList)),
      maxTds: Math.round(Math.max(...tdsList)),
      avgEc: Math.round(sumEc / ecList.length),
      minEc: Math.round(Math.min(...ecList)),
      maxEc: Math.round(Math.max(...ecList)),
      trend,
      tdsChange: Math.round(diff),
    };
  }, [filteredLogs, currentTds, currentEc]);

  const effectiveTds = currentTds ?? (logs.length > 0 ? Number(logs[0].tds) : 0);
  const effectiveEc = currentEc ?? (currentTds ? currentTds / 0.5 : logs.length > 0 ? Number(logs[0].ec) : 0);
  const isWaterChangeNeeded = effectiveTds >= waterChangeThreshold;

  const getTdsBadge = (tds: number) => {
    if (tds < 60) return { label: "Saf / Osmos Su", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
    if (tds <= 350) return { label: "İdeal Akvaryum Suyu", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (tds <= waterChangeThreshold) return { label: "Yüksek Mineral", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    return { label: "Su Değişimi Gerekli!", color: "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse" };
  };

  const tdsBadge = getTdsBadge(effectiveTds);

  const chartPoints = useMemo(() => {
    if (filteredLogs.length < 2) return [];
    const width = 800;
    const height = 240;
    const padding = 20;

    const minT = Math.min(...filteredLogs.map((l) => l.tds)) * 0.9;
    const maxT = Math.max(...filteredLogs.map((l) => l.tds)) * 1.1 || 100;

    return filteredLogs.map((log, index) => {
      const x = padding + (index / (filteredLogs.length - 1)) * (width - padding * 2);
      const normalizedTds = (log.tds - minT) / (maxT - minT || 1);
      const y = height - padding - normalizedTds * (height - padding * 2);
      return { x, y, log };
    });
  }, [filteredLogs]);

  const svgPathD = useMemo(() => {
    if (chartPoints.length < 2) return "";
    return chartPoints.reduce((acc, point, i) => {
      return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, "");
  }, [chartPoints]);

  const handleSaveThreshold = () => {
    if (onUpdateThreshold) {
      onUpdateThreshold(tempThresholdInput);
    }
    setShowSettingsModal(false);
    if (onNotify) {
      onNotify(`Su Değişimi Eşiği ${tempThresholdInput} PPM olarak güncellendi.`, "success");
    }
  };

  return (
    <div className="space-y-6">
      {/* BAŞLIK VE EŞİK AYARLARI BUTONU */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Waves className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Su Kalitesi (TDS & EC) Analizi</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Saatlik dinamik sıcaklık kompanzasyonlu su iletkenliği ve çözünmüş madde takibi
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap justify-end">
          <button
            onClick={handleRunInstantTest}
            disabled={instantTesting}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-4 h-4 ${instantTesting ? "animate-spin text-slate-950" : "text-slate-950"}`} />
            <span>{instantTesting ? "Ölçülüyor..." : "⚡ Anlık Test (Kayıtsız)"}</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>
              Eşik: <strong className="text-cyan-300">{waterChangeThreshold} PPM</strong>
            </span>
          </button>

          <button
            onClick={fetchWaterQualityLogs}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ⚡ ANLIK KAYITSIZ TEST SONUÇ KUTUSU */}
      {instantResult && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Zap className="w-5 h-5 animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300">⚡ Anlık Test Ölçüm Sonucu</span>
                <span className="text-[10px] text-slate-400 font-mono">({instantResult.time})</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                  Grafik Verisini Kirletmedi
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 font-mono">
                <span className="text-base font-extrabold text-white">
                  {instantResult.tds} <span className="text-xs text-cyan-400">PPM</span>
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {Math.round(instantResult.ec)} <span className="text-xs text-emerald-500">µS/cm</span>
                </span>
                <span className="text-xs text-slate-300">
                  {instantResult.temp.toFixed(1)} °C
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setInstantResult(null)}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Kapat
          </button>
        </div>
      )}


      {/* 🚨 SU DEĞİŞİMİ ZAMANI GELDİ UYARI BARAJI */}
      {isWaterChangeNeeded && (
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border-2 border-rose-500/50 p-6 rounded-2xl shadow-xl shadow-rose-950/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-rose-200">🚨 SU DEĞİŞİMİ ZAMANI GELDİ!</h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    KRİTİK
                  </span>
                </div>
                <p className="text-sm text-rose-200/90 mt-1">
                  Mevcut su kalitesi TDS değeri <strong className="text-rose-100 font-bold">{effectiveTds} PPM</strong> (EC: {Math.round(effectiveEc)} µS/cm) seviyesine ulaştı. Belirlenen kritik sınır threshold barajını (<strong>{waterChangeThreshold} PPM</strong>) aştı.
                </p>
                <p className="text-xs text-rose-300/70 mt-2">
                  💡 Öneri: Akvaryumdaki birikmiş mineral, artık ve gübre tuz yükünü azaltmak için %20-%30 oranında taze su değişimi yapılması tavsiye edilir.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition whitespace-nowrap"
            >
              Eşik Değerini Ayarla
            </button>
          </div>
        </div>
      )}

      {/* ANLIK CANLI METRİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TDS KARTI */}
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Toplam Çözünmüş Madde (TDS)</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${tdsBadge.color}`}>
              {tdsBadge.label}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {effectiveTds > 0 ? effectiveTds : "--"}
            </span>
            <span className="text-sm font-bold text-cyan-400">PPM (mg/L)</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Saatlik Kompanze Okuma</span>
            <span className="font-semibold text-slate-300">Formül: 25°C Referans</span>
          </div>
        </div>

        {/* EC KARTI */}
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Elektriksel İletkenlik (EC)</span>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              µS/cm
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {effectiveEc > 0 ? Math.round(effectiveEc) : "--"}
            </span>
            <span className="text-sm font-bold text-emerald-400">µS/cm</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Dönüşüm Oranı</span>
            <span className="font-semibold text-slate-300">1 PPM ≈ 2 µS/cm</span>
          </div>
        </div>

        {/* TREND VE İSTATİSTİK ÖZETİ */}
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5 text-slate-400 text-sm font-medium">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Su Kalitesi Eğilimi</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold">
              {stats.trend === "yukseliyor" && (
                <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <TrendingUp className="w-3.5 h-3.5" /> Yükseliyor (+{stats.tdsChange} PPM)
                </span>
              )}
              {stats.trend === "dusuyor" && (
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingDown className="w-3.5 h-3.5" /> Düşüyor ({stats.tdsChange} PPM)
                </span>
              )}
              {stats.trend === "kararli" && (
                <span className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> Kararlı
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Min TDS</span>
              <span className="text-sm font-bold text-slate-200">{stats.minTds}</span>
            </div>
            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Ort TDS</span>
              <span className="text-sm font-bold text-cyan-300">{stats.avgTds}</span>
            </div>
            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Maks TDS</span>
              <span className="text-sm font-bold text-rose-300">{stats.maxTds}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Sıcaklık Kompanzasyon</span>
            <span className="font-semibold text-slate-300">{currentTemp ? `${currentTemp.toFixed(1)} °C` : "Aktif"}</span>
          </div>
        </div>
      </div>

      {/* TREND GRAFİĞİ BÖLÜMÜ */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Zamana Göre Su Kalitesi Grafiği</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {timeFilter === "24h" && "Son 24 saatlik saat başı TDS ve EC ölçüm geçmişi"}
              {timeFilter === "7d" && "Son 7 günlük su iletkenliği değişimi"}
              {timeFilter === "30d" && "Son 30 günlük su kalitesi kayıtları"}
              {timeFilter === "all" && "Tüm zamanların su kalitesi trendi"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            {(["24h", "7d", "30d", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  timeFilter === filter
                    ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {filter === "24h" ? "Günlük (24S)" : filter === "7d" ? "Haftalık (7G)" : filter === "30d" ? "Aylık" : "Tümü"}
              </button>
            ))}
          </div>
        </div>

        {/* GRAFİK EKRANI */}
        <div className="relative w-full h-[260px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Su kalitesi verileri yükleniyor...</span>
            </div>
          ) : filteredLogs.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <Info className="w-8 h-8 text-cyan-500/50" />
              <p className="text-center">
                Henüz yeterli grafik verisi yok. ESP32 saat başı ölçüm yaptıkça trend burada oluşacaktır.
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="tdsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(() => {
                  const minT = Math.min(...filteredLogs.map((l) => l.tds)) * 0.9;
                  const maxT = Math.max(...filteredLogs.map((l) => l.tds)) * 1.1 || 100;
                  const normalizedThresh = (waterChangeThreshold - minT) / (maxT - minT || 1);
                  const threshY = 240 - 20 - normalizedThresh * (240 - 40);

                  if (threshY >= 10 && threshY <= 230) {
                    return (
                      <g>
                        <line x1="20" y1={threshY} x2="780" y2={threshY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                        <text x="770" y={threshY - 6} fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="end">
                          Su Değişimi Eşiği ({waterChangeThreshold} PPM)
                        </text>
                      </g>
                    );
                  }
                  return null;
                })()}

                {chartPoints.length > 0 && (
                  <path
                    d={`${svgPathD} L ${chartPoints[chartPoints.length - 1].x} 220 L ${chartPoints[0].x} 220 Z`}
                    fill="url(#tdsGradient)"
                  />
                )}

                <path d={svgPathD} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {chartPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.log.id === pt.log.id ? "6" : "3.5"}
                    className="fill-cyan-400 stroke-slate-950 stroke-2 cursor-pointer transition-all hover:r-6"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>

              {hoveredPoint && (
                <div
                  className="absolute bg-slate-900/95 border border-cyan-500/40 p-2.5 rounded-xl shadow-xl text-xs z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 backdrop-blur-md"
                  style={{
                    left: `${(hoveredPoint.x / 800) * 100}%`,
                    top: `${(hoveredPoint.y / 240) * 100}%`,
                  }}
                >
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{hoveredPoint.log.tds} PPM</span>
                    <span className="text-slate-400">({Math.round(hoveredPoint.log.ec)} µS/cm)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {hoveredPoint.log.created_at
                      ? new Date(hoveredPoint.log.created_at).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Tarih yok"}
                  </div>
                  {hoveredPoint.log.temperature && (
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      Sıcaklık: {hoveredPoint.log.temperature.toFixed(1)} °C
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SAATLİK LOG GEÇMİŞİ TABLOSU */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Saatlik Ölçüm Kayıt Geçmişi</h3>
          </div>
          <span className="text-xs text-slate-400">Toplam {filteredLogs.length} Kayıt</span>
        </div>

        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-3.5 pl-5">Tarih / Saat</th>
                <th className="p-3.5">TDS Seviyesi</th>
                <th className="p-3.5">EC İletkenlik</th>
                <th className="p-3.5">Su Sıcaklığı</th>
                <th className="p-3.5 pr-5 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Kayıtlı su kalitesi verisi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const badge = getTdsBadge(log.tds);
                  return (
                    <tr key={log.id || index} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 pl-5 font-mono text-slate-400">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--"}
                      </td>
                      <td className="p-3.5 font-bold text-cyan-300">
                        {log.tds} <span className="text-[10px] text-slate-500 font-normal">PPM</span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-300">
                        {Math.round(log.ec)} <span className="text-[10px] text-slate-500 font-normal">µS/cm</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {log.temperature ? `${log.temperature.toFixed(1)} °C` : "--"}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SU DEĞİŞİMİ EŞİK AYARLARI MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">Su Değişim Sınırı Ayarları</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                TDS değeri bu sınırı aştığında sistem otomatik olarak <strong>"⚠️ Su Değişimi Zamanı Geldi"</strong> uyarısı yayınlayacaktır.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>TDS Uyarı Sınırı (PPM)</span>
                  <span className="text-cyan-400 font-bold">{tempThresholdInput} PPM</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="10"
                  value={tempThresholdInput}
                  onChange={(e) => setTempThresholdInput(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>100 PPM (Saf Osmos)</span>
                  <span>400 PPM (Varsayılan)</span>
                  <span>800 PPM (Çok Yüksek)</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Tahmini EC Uyarı Eşiği</span>
                </div>
                <p className="text-slate-400">
                  Belirlediğiniz {tempThresholdInput} PPM seviyesi yaklaşık <strong>{tempThresholdInput * 2} µS/cm</strong> iletkenliğe karşılık gelir.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition"
              >
                İptal
              </button>
              <button
                onClick={handleSaveThreshold}
                className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-lg transition"
              >
                Kaydet ve Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
