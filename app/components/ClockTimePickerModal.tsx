"use client";

import { useState, useEffect } from "react";
import { Clock, Check, X, Grid, CircleDot, Sun, Moon } from "lucide-react";

interface ClockTimePickerModalProps {
  isOpen: boolean;
  initialTime: string; // "08:00"
  title?: string;
  onSave: (time: string) => void;
  onClose: () => void;
}

const PRESET_HOURS = ["08:00", "10:00", "12:00", "15:00", "18:00", "20:00", "22:00", "00:00"];

// 12 Saatlik Pozisyonlar (0° en üst/12, 90° 3, 180° 6, 270° 9)
const CLOCK_HOURS_OUTER = [
  { val: 12, deg: 0, label: "12" },
  { val: 1, deg: 30, label: "1" },
  { val: 2, deg: 60, label: "2" },
  { val: 3, deg: 90, label: "3" },
  { val: 4, deg: 120, label: "4" },
  { val: 5, deg: 150, label: "5" },
  { val: 6, deg: 180, label: "6" },
  { val: 7, deg: 210, label: "7" },
  { val: 8, deg: 240, label: "8" },
  { val: 9, deg: 270, label: "9" },
  { val: 10, deg: 300, label: "10" },
  { val: 11, deg: 330, label: "11" },
];

const CLOCK_HOURS_INNER = [
  { val: 0, deg: 0, label: "00" },
  { val: 13, deg: 30, label: "13" },
  { val: 14, deg: 60, label: "14" },
  { val: 15, deg: 90, label: "15" },
  { val: 16, deg: 120, label: "16" },
  { val: 17, deg: 150, label: "17" },
  { val: 18, deg: 180, label: "18" },
  { val: 19, deg: 210, label: "19" },
  { val: 20, deg: 240, label: "20" },
  { val: 21, deg: 270, label: "21" },
  { val: 22, deg: 300, label: "22" },
  { val: 23, deg: 330, label: "23" },
];

const CLOCK_MINUTES = [
  { val: 0, deg: 0, label: "00" },
  { val: 5, deg: 30, label: "05" },
  { val: 10, deg: 60, label: "10" },
  { val: 15, deg: 90, label: "15" },
  { val: 20, deg: 120, label: "20" },
  { val: 25, deg: 150, label: "25" },
  { val: 30, deg: 180, label: "30" },
  { val: 35, deg: 210, label: "35" },
  { val: 40, deg: 240, label: "40" },
  { val: 45, deg: 270, label: "45" },
  { val: 50, deg: 300, label: "50" },
  { val: 55, deg: 330, label: "55" },
];

export default function ClockTimePickerModal({
  isOpen,
  initialTime = "08:00",
  title = "Saat Seçimi",
  onSave,
  onClose,
}: ClockTimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"hour" | "minute">("hour");
  const [pickerView, setPickerView] = useState<"dial" | "grid">("dial");

  useEffect(() => {
    if (initialTime && initialTime.includes(":")) {
      const [h, m] = initialTime.split(":").map(Number);
      setSelectedHour(!isNaN(h) ? Math.min(23, Math.max(0, h)) : 8);
      setSelectedMinute(!isNaN(m) ? Math.min(59, Math.max(0, m)) : 0);
    }
  }, [initialTime, isOpen]);

  if (!isOpen) return null;

  const timeString = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;

  const handleSave = () => {
    onSave(timeString);
    onClose();
  };

  const setNow = () => {
    const now = new Date();
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
  };

  // Kadran açısı hesabı
  const isInnerHour = selectedHour >= 13 || selectedHour === 0;
  const currentHandDeg =
    activeTab === "hour"
      ? (selectedHour % 12) * 30
      : (selectedMinute / 5) * 30; // Dakika açısı: 05 -> 30°, 55 -> 330°

  const handRadius = activeTab === "hour" ? (isInnerHour ? 62 : 96) : 96;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 relative overflow-hidden select-none">
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Başlık ve Görünüm Seçici */}
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/40 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">{title}</h3>
              <p className="text-[10px] text-slate-400 font-mono">Dokunarak veya seçerek belirleyin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPickerView(pickerView === "dial" ? "grid" : "dial")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Görünüm Değiştir (Kadrân / Izgara)"
          >
            {pickerView === "dial" ? <Grid className="w-3 h-3 text-cyan-400" /> : <CircleDot className="w-3 h-3 text-cyan-400" />}
            <span>{pickerView === "dial" ? "Izgara" : "Kadrân"}</span>
          </button>
        </div>

        {/* DİJİTAL SAAT EKRANI & SEKMELER */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 shadow-inner">
          {/* SAAT KUTUSU */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActiveTab("hour")}
              className={`w-20 py-1.5 rounded-xl text-3xl font-black font-mono transition-all text-center cursor-pointer ${
                activeTab === "hour"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400"
                  : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
              }`}
            >
              {String(selectedHour).padStart(2, "0")}
            </button>
            <span className="text-[9px] font-mono text-slate-500 font-bold mt-1 uppercase">Saat</span>
          </div>

          <span className="text-3xl font-black text-cyan-400/80 mb-4 font-mono">:</span>

          {/* DAKİKA KUTUSU */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActiveTab("minute")}
              className={`w-20 py-1.5 rounded-xl text-3xl font-black font-mono transition-all text-center cursor-pointer ${
                activeTab === "minute"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400"
                  : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
              }`}
            >
              {String(selectedMinute).padStart(2, "0")}
            </button>
            <span className="text-[9px] font-mono text-slate-500 font-bold mt-1 uppercase">Dakika</span>
          </div>
        </div>

        {/* 1. GÖRÜNÜM: KADRAN (ANALOG DIAL SIMULATION) */}
        {pickerView === "dial" ? (
          <div className="relative w-64 h-64 mx-auto bg-slate-950 rounded-full border-2 border-slate-800/80 shadow-2xl flex items-center justify-center">
            {/* Kadran Merkezi */}
            <div className="absolute w-3 h-3 bg-cyan-400 rounded-full z-30 shadow-[0_0_10px_rgba(6,182,212,0.9)]" />

            {/* AKREP / YELKOVAN KOLU VE HEDEF DAİRESİ (Kusursuz Eksenel Polar Konumlandırma) */}
            <div
              className="absolute bottom-1/2 left-1/2 origin-bottom transition-all duration-200 z-10 pointer-events-none"
              style={{
                width: "2px",
                height: `${handRadius}px`,
                transform: `translateX(-50%) rotate(${currentHandDeg}deg)`,
                backgroundColor: "#06b6d4",
                boxShadow: "0 0 8px rgba(6,182,212,0.6)",
              }}
            >
              {/* Kolun ucundaki hedef çemberi (Number Target Glow) */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                style={{
                  width: activeTab === "hour" && isInnerHour ? "28px" : "32px",
                  height: activeTab === "hour" && isInnerHour ? "28px" : "32px",
                }}
              />
            </div>

            {/* SAAT SEÇİM MODU */}
            {activeTab === "hour" && (
              <>
                {/* Dış Çember (1..12) - Yarıçap 96px */}
                {CLOCK_HOURS_OUTER.map((item) => {
                  const isSelected = selectedHour === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setSelectedHour(item.val);
                        setActiveTab("minute"); // Saati seçince otomatik dakikaya geç
                      }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${item.deg}deg) translateY(-96px) rotate(-${item.deg}deg)`,
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all z-20 cursor-pointer ${
                        isSelected
                          ? "bg-cyan-400 text-slate-950 font-black shadow-md scale-110"
                          : "text-slate-200 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}

                {/* İç Çember (13..23 ve 00) - Yarıçap 62px */}
                {CLOCK_HOURS_INNER.map((item) => {
                  const isSelected = selectedHour === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setSelectedHour(item.val);
                        setActiveTab("minute");
                      }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${item.deg}deg) translateY(-62px) rotate(-${item.deg}deg)`,
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all z-20 cursor-pointer ${
                        isSelected
                          ? "bg-cyan-400 text-slate-950 font-black shadow-md scale-110"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </>
            )}

            {/* DAKİKA SEÇİM MODU (00, 05, 10, ..., 55) - Yarıçap 96px */}
            {activeTab === "minute" && (
              <>
                {CLOCK_MINUTES.map((item) => {
                  const isSelected = Math.floor(selectedMinute / 5) * 5 === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSelectedMinute(item.val)}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${item.deg}deg) translateY(-96px) rotate(-${item.deg}deg)`,
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all z-20 cursor-pointer ${
                        isSelected
                          ? "bg-cyan-400 text-slate-950 font-black shadow-md scale-110"
                          : "text-slate-200 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          /* 2. GÖRÜNÜM: IZGARA SEÇİM MODU (MATRIX GRID PICKER) */
          <div className="space-y-3 py-1 animate-in fade-in">
            {activeTab === "hour" ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block">Saat Seçin (00 – 23):</span>
                <div className="grid grid-cols-6 gap-1.5 font-mono text-xs max-h-[220px] overflow-y-auto pr-1">
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setSelectedHour(h);
                        setActiveTab("minute");
                      }}
                      className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        selectedHour === h
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block">Dakika Seçin:</span>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs max-h-[220px] overflow-y-auto pr-1">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMinute(m)}
                      className={`py-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        selectedMinute === m
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      :{String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HIZLI PRESET SAAT BUTONLARI (Quick Chips) */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Hızlı Saatler:</span>
            <button
              type="button"
              onClick={setNow}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              Şimdiki Saat
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
            {PRESET_HOURS.map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => {
                  const [h, m] = pr.split(":").map(Number);
                  setSelectedHour(h);
                  setSelectedMinute(m);
                }}
                className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer text-[11px] font-bold ${
                  timeString === pr
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* AKSİYON BUTONLARI */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Saati Uygula ({timeString})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
