"use client";

import { useState } from "react";
import { Waves, Thermometer, FlaskConical, BarChart2 } from "lucide-react";
import WaterQualityTab from "./WaterQualityTab";
import TemperatureTab from "./TemperatureTab";
import DosingLogsTab from "./DosingLogsTab";
import { DosingLog, PumpSetting } from "@/types/aquamaster";

export type AnalyticsSubTab = "water_quality" | "temperature" | "dosing";

interface AnalyticsTabProps {
  currentTds?: number | null;
  currentEc?: number | null;
  currentTemp?: number | null;
  deviceIp?: string | null;
  waterChangeThreshold?: number;
  onUpdateThreshold?: (val: number) => void;
  dosingLogs?: DosingLog[];
  logsLoading?: boolean;
  pumpSettings?: { [key: number]: PumpSetting };
  onRefreshLogs?: () => void;
  onNotify?: (text: string, type: "success" | "error") => void;
  defaultSubTab?: AnalyticsSubTab;
}

export default function AnalyticsTab({
  currentTds,
  currentEc,
  currentTemp,
  deviceIp,
  waterChangeThreshold = 400,
  onUpdateThreshold,
  dosingLogs = [],
  logsLoading = false,
  pumpSettings = {},
  onRefreshLogs,
  onNotify,
  defaultSubTab = "water_quality",
}: AnalyticsTabProps) {
  const [subTab, setSubTab] = useState<AnalyticsSubTab>(defaultSubTab);

  const subTabsConfig = [
    {
      id: "water_quality" as AnalyticsSubTab,
      labelShort: "Su Kalitesi",
      labelFull: "Su Kalitesi (TDS & EC)",
      icon: Waves,
    },
    {
      id: "temperature" as AnalyticsSubTab,
      labelShort: "Sıcaklık",
      labelFull: "Sıcaklık",
      icon: Thermometer,
    },
    {
      id: "dosing" as AnalyticsSubTab,
      labelShort: "Dozaj Logları",
      labelFull: "Gübre Dozaj",
      icon: FlaskConical,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ANALİZ SAYFASI BAŞLIK & İÇ ALT TAB NAVİGASYONU */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Sistem Analiz & Trend Raporları
            </h1>
            <p className="text-xs text-slate-400">
              Su kalitesi (TDS/EC), sıcaklık değişimleri ve gübre dozaj geçmişini tek noktadan takip edin
            </p>
          </div>
        </div>

        {/* 3 ADET İÇ TAB GEÇİŞ BUTONU (MOBİL EKRANA %100 SIĞAN GRID DÜZENİ) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 w-full md:w-auto">
          {subTabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="sm:hidden whitespace-nowrap">{tab.labelShort}</span>
                <span className="hidden sm:inline whitespace-nowrap">{tab.labelFull}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* İÇ TAB İÇERİĞİ */}
      {subTab === "water_quality" && (
        <WaterQualityTab
          currentTds={currentTds}
          currentEc={currentEc}
          currentTemp={currentTemp}
          deviceIp={deviceIp}
          waterChangeThreshold={waterChangeThreshold}
          onUpdateThreshold={onUpdateThreshold}
          onNotify={onNotify}
        />
      )}

      {subTab === "temperature" && (
        <TemperatureTab currentTemp={currentTemp} />
      )}

      {subTab === "dosing" && (
        <DosingLogsTab
          logs={dosingLogs}
          logsLoading={logsLoading}
          pumpSettings={pumpSettings}
          onRefreshLogs={onRefreshLogs}
        />
      )}
    </div>
  );
}
