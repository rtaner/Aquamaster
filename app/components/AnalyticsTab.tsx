"use client";

import { useState } from "react";
import { Thermometer, FileText, Activity, Droplets } from "lucide-react";
import TemperatureTab from "./TemperatureTab";
import DosingLogsTab from "./DosingLogsTab";
import { DosingLog, PumpSetting } from "@/types/aquamaster";

interface AnalyticsTabProps {
  temperature?: number | null;
  logs: DosingLog[];
  logsLoading: boolean;
  pumpSettings: { [key: number]: PumpSetting };
  onRefreshLogs?: () => void;
  onNotify?: (text: string, type: "success" | "error") => void;
}

export default function AnalyticsTab({
  temperature,
  logs,
  logsLoading,
  pumpSettings,
  onRefreshLogs,
  onNotify,
}: AnalyticsTabProps) {
  const [subTab, setSubTab] = useState<"temperature" | "dosing">("temperature");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ÜST İKİLİ SUB-TAB ANAHTARI */}
      <div className="glass-panel p-2 rounded-2xl border border-cyan-500/20 bg-slate-900/90 max-w-xl mx-auto flex items-center justify-between shadow-xl">
        <button
          onClick={() => setSubTab("temperature")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === "temperature"
              ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-950/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Thermometer className="w-4 h-4 text-teal-300" />
          <span>Su Sıcaklığı Grafiği</span>
        </button>

        <button
          onClick={() => setSubTab("dosing")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === "dosing"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Droplets className="w-4 h-4 text-cyan-300" />
          <span>Gübre Dozaj Logları</span>
        </button>
      </div>

      {/* ALT İÇERİK SEÇİMİ */}
      {subTab === "temperature" ? (
        <TemperatureTab currentTemp={temperature} onNotify={onNotify} />
      ) : (
        <DosingLogsTab
          logs={logs}
          logsLoading={logsLoading}
          pumpSettings={pumpSettings}
          onRefreshLogs={onRefreshLogs}
        />
      )}
    </div>
  );
}
