"use client";

import { LayoutDashboard, Droplets, Zap, BarChart3, Scale } from "lucide-react";

export type TabType = "dashboard" | "manual" | "sockets" | "analytics" | "calibration" | "logs" | "water_quality" | "temperature";

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const tabs: { id: TabType; label: string; icon: typeof Droplets }[] = [
    { id: "dashboard", label: "Ana Sayfa", icon: LayoutDashboard },
    { id: "manual", label: "Dozaj", icon: Droplets },
    { id: "sockets", label: "Otomasyon", icon: Zap },
    { id: "calibration", label: "Kalibrasyon", icon: Scale },
    { id: "analytics", label: "Analiz", icon: BarChart3 },
  ];






  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav px-2 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] border-t border-cyan-500/20">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 select-none min-h-[48px] ${
                isActive
                  ? "text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {/* Aktif Pill Arka Plan & Glow Effect */}
              {isActive && (
                <div className="absolute inset-x-2 inset-y-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)] animate-in fade-in zoom-in-95 duration-150" />
              )}

              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" : "opacity-80"
                  }`}
                />
                <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-cyan-200 font-extrabold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </div>

              {/* Aktif Nokta Göstergesi */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
