"use client";

import { useState, useMemo } from "react";
import { 
  History, 
  RotateCcw, 
  X, 
  Filter, 
  BarChart2, 
  Clock 
} from "lucide-react";
import { DosingLog, PumpSetting } from "@/types/aquamaster";

interface LogModalWithChartProps {
  isOpen: boolean;
  logs: DosingLog[];
  logsLoading: boolean;
  pumpSettings: { [key: number]: PumpSetting };
  onRefresh: () => void;
  onClose: () => void;
}

export default function LogModalWithChart({
  isOpen,
  logs,
  logsLoading,
  pumpSettings,
  onRefresh,
  onClose,
}: LogModalWithChartProps) {
  const [selectedPumpFilter, setSelectedPumpFilter] = useState<number>(0);

  // Filter logs by selected pump
  const filteredLogs = useMemo(() => {
    if (selectedPumpFilter === 0) return logs;
    return logs.filter((log) => log.pump_id === selectedPumpFilter);
  }, [logs, selectedPumpFilter]);

  // Calculate totals per pump for SVG Bar Chart
  const pumpTotals = useMemo(() => {
    const totals: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
    logs.forEach((log) => {
      if (totals[log.pump_id] !== undefined) {
        totals[log.pump_id] += log.ml_amount;
      }
    });
    return totals;
  }, [logs]);

  const maxTotalMl = Math.max(...Object.values(pumpTotals), 1);
  const totalDosedAll = Object.values(pumpTotals).reduce((a, b) => a + b, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/20 p-2.5 rounded-xl border border-cyan-500/40 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Dozaj Geçmişi & Tüketim Grafiği</h3>
              <p className="text-xs text-slate-400">Tüm pompaların sıvı tüketim istatistikleri ve geçmiş kayıtları</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={logsLoading}
              className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-950 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Yenile"
            >
              <RotateCcw className={`w-4 h-4 ${logsLoading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Görsel Tüketim Bar Grafiği (SVG Chart) */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/70 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-cyan-400" /> Pompa Bazında Toplam Sıvı Tüketimi (ml)
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Genel Toplam: {totalDosedAll.toFixed(1)} ml
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 pt-1">
            {[1, 2, 3, 4].map((pumpId) => {
              const setting = pumpSettings[pumpId] || { label: `${pumpId}. Pompa` };
              const amount = pumpTotals[pumpId] || 0;
              const barHeightPercent = Math.min(100, Math.max(8, Math.round((amount / maxTotalMl) * 100)));

              return (
                <div key={pumpId} className="flex flex-col items-center gap-1.5">
                  <div className="w-full bg-slate-900 h-24 rounded-xl border border-slate-800 p-1 flex flex-col justify-end relative overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-blue-500 rounded-lg transition-all duration-500 relative"
                      style={{ height: `${barHeightPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-30 animate-pulse" />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-white drop-shadow">
                      {amount.toFixed(1)} ml
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
                    P{pumpId} ({setting.label})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtreleme Barı */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold mr-1">Pompa Filtresi:</span>
            <button
              onClick={() => setSelectedPumpFilter(0)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedPumpFilter === 0
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              Tümü
            </button>
            {[1, 2, 3, 4].map((id) => (
              <button
                key={id}
                onClick={() => setSelectedPumpFilter(id)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedPumpFilter === id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                P{id}
              </button>
            ))}
          </div>

          <span className="text-slate-400 font-mono text-[11px]">
            Gösterilen Kayıt: {filteredLogs.length}
          </span>
        </div>

        {/* Log Listesi Gövdesi */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {logsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Clock className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-sm">Loglar yükleniyor...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-mono">
              Henüz kaydedilmiş bir dozaj geçmişi bulunmuyor.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const setting = pumpSettings[log.pump_id] || { label: `${log.pump_id}. Pompa` };
              const createdDate = log.created_at ? new Date(log.created_at) : new Date();

              return (
                <div
                  key={log.id || Math.random()}
                  className="flex items-center justify-between bg-slate-950/80 p-3.5 px-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-slate-900 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-cyan-400 border border-slate-800 text-sm">
                      P{log.pump_id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">
                          {setting.label}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            log.mode === "Manuel"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {log.mode === "Manuel" ? "⚡ Manuel" : "📅 Zamanlanmış"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {createdDate.toLocaleDateString("tr-TR")} - {createdDate.toLocaleTimeString("tr-TR")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400 font-mono">
                      +{log.ml_amount} ml
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {Number(log.duration_seconds || 0).toFixed(1)} sn ({Math.round(Number(log.duration_seconds || 0) * 1000)} ms)
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
