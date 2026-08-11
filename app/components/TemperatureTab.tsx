"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TemperatureLog } from "@/types/aquamaster";
import {
  Thermometer,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Clock,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

interface TemperatureTabProps {
  currentTemp?: number | null;
  onNotify?: (text: string, type: "success" | "error") => void;
}

export default function TemperatureTab({ currentTemp, onNotify }: TemperatureTabProps) {
  const [logs, setLogs] = useState<TemperatureLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("24h");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; log: TemperatureLog } | null>(null);

  // Supabase'den Sıcaklık Loglarını Çek
  const fetchTemperatureLogs = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from("temperature_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        // Eğer tablo henüz yoksa geliştirici mesajı ver
        if (error.code === "42P01") {
          console.warn("temperature_logs tablosu Supabase'de henüz oluşturulmamış.");
        } else {
          throw error;
        }
      }

      if (data) {
        setLogs(data);
      }
    } catch (e: any) {
      console.error("Sıcaklık logları çekme hatası:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemperatureLogs();
    const interval = setInterval(fetchTemperatureLogs, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Zaman Filtresine Göre Logları Filtrele
  const filteredLogs = useMemo(() => {
    if (logs.length === 0) return [];
    const now = new Date().getTime();

    return logs.filter((item) => {
      if (!item.created_at) return true;
      const itemTime = new Date(item.created_at).getTime();
      const diffHours = (now - itemTime) / (1000 * 60 * 60);

      if (timeFilter === "24h") return diffHours <= 24;
      if (timeFilter === "7d") return diffHours <= 24 * 7;
      if (timeFilter === "30d") return diffHours <= 24 * 30;
      return true;
    }).reverse(); // Grafikte soldan sağa kronolojik aksın
  }, [logs, timeFilter]);

  // Metrik Hesaplamaları (Min, Max, Ortalama)
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      const active = currentTemp ?? 25.0;
      return {
        min: active,
        max: active,
        avg: active,
        current: active,
        count: 0,
      };
    }

    const temps = filteredLogs.map((l) => Number(l.temperature));
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const sum = temps.reduce((a, b) => a + b, 0);
    const avg = sum / temps.length;
    const current = currentTemp ?? temps[temps.length - 1];

    return { min, max, avg, current, count: filteredLogs.length };
  }, [filteredLogs, currentTemp]);

  // Sıcaklık Sağlık Durum Badge'i
  const getStatusBadge = (temp: number) => {
    if (temp >= 24 && temp <= 27.5) {
      return {
        text: "Ideal (24.0°C - 27.5°C)",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: CheckCircle2,
      };
    } else if (temp > 27.5 && temp <= 29) {
      return {
        text: "Hafif Yüksek",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: AlertTriangle,
      };
    } else if (temp > 29) {
      return {
        text: "Kritik Sıcak (Soğutma Lazım!)",
        color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        icon: AlertTriangle,
      };
    } else {
      return {
        text: "Düşük (Isıtıcı Kontrol Et)",
        color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        icon: AlertTriangle,
      };
    }
  };

  const statusBadge = getStatusBadge(stats.current);
  const StatusIcon = statusBadge.icon;

  // Interaktif SVG Grafiği İçin Koordinat Hesaplayıcı
  const chartGeometry = useMemo(() => {
    if (filteredLogs.length < 2) return null;

    const width = 800;
    const height = 240;
    const padding = 40;

    const temps = filteredLogs.map((l) => Number(l.temperature));
    let minTemp = Math.min(...temps, 23);
    let maxTemp = Math.max(...temps, 29);

    // Padding payı
    minTemp = Math.floor(minTemp - 0.5);
    maxTemp = Math.ceil(maxTemp + 0.5);

    const range = maxTemp - minTemp || 1;

    const points = filteredLogs.map((log, index) => {
      const x = padding + (index / (filteredLogs.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((Number(log.temperature) - minTemp) / range) * (height - 2 * padding);
      return { x, y, log };
    });

    // SVG Path String (Bezier Curve yumuşak çizgi)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    // Dolgu (Area fill under curve)
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    // 24°C - 27.5°C İdeal Alan Yeşil Band Y Yükseklikleri
    const idealMinY = height - padding - ((24 - minTemp) / range) * (height - 2 * padding);
    const idealMaxY = height - padding - ((27.5 - minTemp) / range) * (height - 2 * padding);

    return { width, height, padding, points, pathD, areaD, minTemp, maxTemp, idealMinY, idealMaxY };
  }, [filteredLogs]);

  // Tüm Logları Temizle
  const handleClearLogs = async () => {
    if (!confirm("Tüm geçmiş sıcaklık kayıtlarını silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from("temperature_logs").delete().gte("id", 0);
      if (error) throw error;
      setLogs([]);
      onNotify?.("Sıcaklık geçmişi temizlendi.", "success");
    } catch (e: any) {
      onNotify?.(`Silme hatası: ${e.message}`, "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ÜST BAŞLIK & İSTATİSTİK KARTLARI */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-500/30 text-white">
            <Thermometer className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-300">
                Akvaryum Sıcaklık Analizi
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusBadge.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusBadge.text}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              DS18B20 Su Sıcaklık Sensörü Canlı Grafiği ve Geçmiş Logları
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchTemperatureLogs}
            disabled={refreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
          </button>

          {/* Zaman Filtresi Butonları */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { id: "24h", label: "24 Saat" },
              { id: "7d", label: "7 Gün" },
              { id: "30d", label: "30 Gün" },
              { id: "all", label: "Tümü" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeFilter === f.id
                    ? "bg-teal-500 text-slate-950 font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4'lü ÖZET METRİK KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Anlık Sıcaklık */}
        <div className="glass-panel p-4 rounded-2xl border border-teal-500/30 bg-slate-900/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Anlık Su Sıcaklığı
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-teal-300 font-mono">
              {stats.current.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-teal-400">°C</span>
          </div>
          <p className="text-[10px] text-teal-400/80 mt-1 flex items-center gap-1 font-medium">
            <Activity className="w-3 h-3 animate-pulse" /> Canlı Sensör Telemetrisi
          </p>
        </div>

        {/* Card 2: 24h En Yüksek */}
        <div className="glass-panel p-4 rounded-2xl border border-rose-500/20 bg-slate-900/80 relative overflow-hidden group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Maksimum Sıcaklık
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-rose-400 font-mono">
              {stats.max.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-rose-500">°C</span>
          </div>
          <p className="text-[10px] text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3 text-rose-400" /> Seçilen Aralıktaki En Yüksek
          </p>
        </div>

        {/* Card 3: 24h En Düşük */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 bg-slate-900/80 relative overflow-hidden group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Minimum Sıcaklık
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-cyan-400 font-mono">
              {stats.min.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-cyan-500">°C</span>
          </div>
          <p className="text-[10px] text-cyan-400/80 mt-1 flex items-center gap-1 font-medium">
            <TrendingDown className="w-3 h-3 text-cyan-400" /> Seçilen Aralıktaki En Düşük
          </p>
        </div>

        {/* Card 4: Ortalama Sıcaklık */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-slate-900/80 relative overflow-hidden group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Ortalama Sıcaklık
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-400 font-mono">
              {stats.avg.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-emerald-500">°C</span>
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
            <SlidersHorizontal className="w-3 h-3 text-emerald-400" /> {stats.count} Veri Noktası
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* İNTERAKTİF İKİ BOYUTLU İÇ GRAFİK (SVG SMOOTH LINE CHART) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-slate-100">
              Sıcaklık Değişim Zaman Çizelgesi
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" /> Su Sıcaklığı (°C)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-400 inline-block" /> İdeal Bölge (24°C - 27.5°C)
            </span>
          </div>
        </div>

        {chartGeometry ? (
          <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-800 p-2">
            <svg
              viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Çizgi Altı Renk Gradyanı */}
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* İdeal Sıcaklık Yeşil Band Arka Planı (24 - 27.5 °C) */}
              {chartGeometry.idealMaxY < chartGeometry.height && (
                <rect
                  x={chartGeometry.padding}
                  y={Math.max(chartGeometry.padding, chartGeometry.idealMaxY)}
                  width={chartGeometry.width - 2 * chartGeometry.padding}
                  height={Math.max(0, chartGeometry.idealMinY - chartGeometry.idealMaxY)}
                  fill="#10b981"
                  fillOpacity="0.08"
                  rx="4"
                />
              )}

              {/* Izgara Çizgileri (Grid Lines) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = chartGeometry.padding + ratio * (chartGeometry.height - 2 * chartGeometry.padding);
                const tempVal = (chartGeometry.maxTemp - ratio * (chartGeometry.maxTemp - chartGeometry.minTemp)).toFixed(1);
                return (
                  <g key={i}>
                    <line
                      x1={chartGeometry.padding}
                      y1={y}
                      x2={chartGeometry.width - chartGeometry.padding}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartGeometry.padding - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {tempVal}°C
                    </text>
                  </g>
                );
              })}

              {/* Çizgi Altı Gradient Dolgusu */}
              <path d={chartGeometry.areaD} fill="url(#tempGradient)" />

              {/* Ana Yumuşak Çizgi */}
              <path
                d={chartGeometry.pathD}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Noktaları ve İnteraktif Hover Çemberleri */}
              {chartGeometry.points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#0f172a"
                    stroke="#2dd4bf"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              ))}

              {/* Active Hover Tooltip Highlight Line */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={chartGeometry.padding}
                  x2={hoveredPoint.x}
                  y2={chartGeometry.height - chartGeometry.padding}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
            </svg>

            {/* Floating Tooltip Div */}
            {hoveredPoint && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-900 border border-teal-500/40 text-slate-100 px-3 py-2 rounded-xl shadow-2xl text-xs font-mono backdrop-blur-md animate-in fade-in"
                style={{
                  left: `${(hoveredPoint.x / chartGeometry.width) * 100}%`,
                  top: `${(hoveredPoint.y / chartGeometry.height) * 100}%`,
                  transform: "translate(-50%, -120%)",
                }}
              >
                <div className="font-bold text-teal-300">{Number(hoveredPoint.log.temperature).toFixed(1)}°C</div>
                <div className="text-[10px] text-slate-400">
                  {hoveredPoint.log.created_at
                    ? new Date(hoveredPoint.log.created_at).toLocaleString("tr-TR")
                    : "Anlık"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <p className="font-bold">Grafik İçin Yeterli Sıcaklık Verisi Bekleniyor...</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              ESP32 cihazınız 5 dakikada bir sıcaklığı okuyup Supabase'e gönderdikçe grafik otomatik olarak çizilecektir.
            </p>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* GEÇMİŞ LOG KAYITLARI TABLOSU */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Sıcaklık Ölçüm Geçmişi ({logs.length} Kayıt)
            </h3>
          </div>

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Geçmişi Temizle
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5">#</th>
                <th className="p-3.5">Tarih & Saat</th>
                <th className="p-3.5">Sıcaklık (°C)</th>
                <th className="p-3.5">Durum / Değerlendirme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {logs.length > 0 ? (
                logs.slice(0, 50).map((log, index) => {
                  const temp = Number(log.temperature);
                  const badge = getStatusBadge(temp);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={log.id || index} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 text-slate-500 font-semibold">{logs.length - index}</td>
                      <td className="p-3.5 text-slate-300 font-medium">
                        {log.created_at ? new Date(log.created_at).toLocaleString("tr-TR") : "Henüz İletildi"}
                      </td>
                      <td className="p-3.5 font-bold text-teal-300 text-sm">
                        {temp.toFixed(1)} °C
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-sans">
                    {loading ? "Sıcaklık logları yükleniyor..." : "Henüz kaydedilmiş bir sıcaklık logu yok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
