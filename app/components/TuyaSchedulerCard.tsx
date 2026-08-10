"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CalendarClock, 
  Clock, 
  FlaskConical, 
  Sun, 
  Plus, 
  Trash2, 
  Check, 
  Power, 
  Sparkles,
  RefreshCw,
  Sliders,
  Send,
  ShieldCheck
} from "lucide-react";
import { TuyaSocketSchedule } from "@/types/aquamaster";

interface TuyaSchedulerCardProps {
  onNotify?: (message: string, type: "success" | "error") => void;
}

const DEFAULT_SCHEDULES: TuyaSocketSchedule[] = [
  {
    id: "co2-default",
    channelCode: "switch_1",
    label: "CO2 Tüpü (Solenoid Vana)",
    onTime: "09:00",
    offTime: "17:00",
    isActive: true,
  },
  {
    id: "led1-default",
    channelCode: "switch_2",
    label: "Power LED 1",
    onTime: "10:00",
    offTime: "18:00",
    isActive: true,
  },
  {
    id: "led2-default",
    channelCode: "switch_3",
    label: "Power LED 2",
    onTime: "10:30",
    offTime: "18:00",
    isActive: true,
  },
  {
    id: "led3-default",
    channelCode: "switch_4",
    label: "Power LED 3",
    onTime: "11:00",
    offTime: "17:30",
    isActive: true,
  },
];

const CHANNEL_OPTIONS = [
  { code: "switch_1", label: "CO2 Tüpü (Solenoid Vana)", icon: FlaskConical },
  { code: "switch_2", label: "Power LED 1", icon: Sun },
  { code: "switch_3", label: "Power LED 2", icon: Sun },
  { code: "switch_4", label: "Power LED 3", icon: Sun },
];

export default function TuyaSchedulerCard({ onNotify }: TuyaSchedulerCardProps) {
  const [schedules, setSchedules] = useState<TuyaSocketSchedule[]>(DEFAULT_SCHEDULES);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<TuyaSocketSchedule | null>(null);

  // 1. LocalStorage'dan Yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aquamaster_tuya_schedules");
      if (saved) {
        setSchedules(JSON.parse(saved));
      }
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  // 2. LocalStorage'a Kaydet
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("aquamaster_tuya_schedules", JSON.stringify(schedules));
    } catch (e) {}
  }, [schedules, isLoaded]);

  // 3. Timeline için aynı kanaldaki/prizdeki programları tek satırda birleştirme
  const groupedTimeline = useMemo(() => {
    const map: Record<string, { channelCode: string; label: string; items: TuyaSocketSchedule[] }> = {};

    for (const item of schedules) {
      if (!map[item.channelCode]) {
        map[item.channelCode] = {
          channelCode: item.channelCode,
          label: item.label,
          items: [],
        };
      }
      map[item.channelCode].items.push(item);
    }

    return Object.values(map);
  }, [schedules]);

  // 4. Otomatik Zamanlayıcı Motoru (Her 30 saniyede bir saati denetler)
  useEffect(() => {
    if (!isLoaded) return;

    const checkSchedules = async () => {
      const now = new Date();
      const currentHHMM = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const todayStr = now.toISOString().split("T")[0];

      for (const item of schedules) {
        if (!item.isActive) continue;

        // Açılış saati geldiyse
        if (item.onTime === currentHHMM && item.lastExecutedAction !== `on_${currentHHMM}_${todayStr}`) {
          try {
            await fetch("/api/tuya", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "toggle_channel",
                channelCode: item.channelCode,
                targetState: true,
              }),
            });
            onNotify?.(`⏰ Otomatik Zamanlayıcı: ${item.label} AÇILDI.`, "success");
            setSchedules((prev) =>
              prev.map((s) =>
                s.id === item.id ? { ...s, lastExecutedAction: `on_${currentHHMM}_${todayStr}` } : s
              )
            );
          } catch (e) {}
        }

        // Kapanış saati geldiyse
        if (item.offTime === currentHHMM && item.lastExecutedAction !== `off_${currentHHMM}_${todayStr}`) {
          try {
            await fetch("/api/tuya", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "toggle_channel",
                channelCode: item.channelCode,
                targetState: false,
              }),
            });
            onNotify?.(`⏰ Otomatik Zamanlayıcı: ${item.label} KAPATILIYOR.`, "success");
            setSchedules((prev) =>
              prev.map((s) =>
                s.id === item.id ? { ...s, lastExecutedAction: `off_${currentHHMM}_${todayStr}` } : s
              )
            );
          } catch (e) {}
        }
      }
    };

    checkSchedules();
    const interval = setInterval(checkSchedules, 30000);
    return () => clearInterval(interval);
  }, [schedules, isLoaded, onNotify]);

  // ⚡ TÜM PROGRAMLARI TUYA CİHAZINA SENKRONİZE ET
  const handleSyncAllToTuya = async () => {
    setSaving(true);
    try {
      let activeCount = 0;
      for (const item of schedules) {
        if (!item.isActive) continue;

        // Açılış Zamanlayıcısı (ON)
        await fetch("/api/tuya", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_timer",
            channelCode: item.channelCode,
            time: item.onTime,
            targetState: true,
          }),
        });

        // Kapanış Zamanlayıcısı (OFF)
        await fetch("/api/tuya", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_timer",
            channelCode: item.channelCode,
            time: item.offTime,
            targetState: false,
          }),
        });

        activeCount++;
      }

      onNotify?.(
        `⚡ ${activeCount} adet aktif zamanlayıcı programı Tuya 4'lü priz cihazına başarıyla senkronize edildi!`,
        "success"
      );
    } catch (e: any) {
      onNotify?.(`Senkronizasyon hatası: ${e.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  // Program Ekle / Güncelle
  const handleSaveSchedule = async (schedule: TuyaSocketSchedule) => {
    setSaving(true);
    try {
      const exists = schedules.some((s) => s.id === schedule.id);
      const updatedList = exists
        ? schedules.map((s) => (s.id === schedule.id ? schedule : s))
        : [...schedules, schedule];

      setSchedules(updatedList);

      // Tuya Cihazına Senkronize Et
      if (schedule.isActive) {
        await fetch("/api/tuya", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_timer",
            channelCode: schedule.channelCode,
            time: schedule.onTime,
            targetState: true,
          }),
        });

        await fetch("/api/tuya", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_timer",
            channelCode: schedule.channelCode,
            time: schedule.offTime,
            targetState: false,
          }),
        });
      }

      onNotify?.(`${schedule.label} programı kaydedildi ve Tuya ile senkronize edildi!`, "success");
      setEditingSchedule(null);
    } catch (e: any) {
      onNotify?.(`Kaydetme uyarısı: ${e.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  // Program Sil
  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    onNotify?.("Zamanlayıcı programı silindi.", "success");
  };

  // Program Aktif/Pasif Toggle
  const handleToggleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Saat Diliminden Dakika Hesabı (Visual Timeline için)
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <CalendarClock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              CO2 & Power LED Otomatik Zamanlayıcıları
            </h3>
            <p className="text-xs text-slate-400">
              Fotosentez ve Aydınlatma Zaman Senkronizasyonu
            </p>
          </div>
        </div>

        {/* Ana Aksiyon Butonları */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* ⚡ TÜMÜNÜ TUYA'YA SENKRONİZE ET BUTONU */}
          <button
            onClick={handleSyncAllToTuya}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
            title="Tüm Zamanlayıcı Programlarını Tuya Priz Donanımına Gönder"
          >
            <Send className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            ⚡ Tümünü Tuya Cihazına Senkronize Et
          </button>

          {/* + YENİ ZAMANLAYICI EKLE BUTONU */}
          <button
            onClick={() =>
              setEditingSchedule({
                id: "sch-" + Date.now(),
                channelCode: "switch_1",
                label: "CO2 Tüpü (Solenoid Vana)",
                onTime: "09:00",
                offTime: "17:00",
                isActive: true,
              })
            }
            className="px-4 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yeni Zamanlayıcı Ekle
          </button>
        </div>
      </div>

      {/* 24 Saatlik Görsel Zaman Çizelgesi (Timeline Bar - Kanal Bazlı Gruplanmış) */}
      <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Günlük Fotosentez & Işık Zaman Çizelgesi (24 Saat)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">00:00 - 23:59</span>
        </div>

        <div className="space-y-3 pt-2">
          {groupedTimeline.map((group) => {
            const isCO2 = group.channelCode === "switch_1";
            const activeItems = group.items.filter((i) => i.isActive);
            const timeRangesText = activeItems.map((i) => `${i.onTime} - ${i.offTime}`).join(", ");

            return (
              <div key={group.channelCode} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isCO2 ? "bg-cyan-400" : "bg-amber-400"}`} />
                    {group.label}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {timeRangesText || "Pasif"}
                  </span>
                </div>

                {/* Tek Satır Üzerinde Çoklu Çubuklar (Same Row Multi-Interval Bar) */}
                <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
                  {group.items.map((item) => {
                    if (!item.isActive) return null;
                    const startMin = timeToMinutes(item.onTime);
                    const endMin = timeToMinutes(item.offTime);
                    const leftPct = (startMin / 1440) * 100;
                    const widthPct = Math.max(((endMin - startMin) / 1440) * 100, 1.5);

                    return (
                      <div
                        key={item.id}
                        className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                          isCO2
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50"
                            : "bg-gradient-to-r from-amber-500 to-yellow-500 shadow-sm shadow-amber-500/50"
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${group.label}: ${item.onTime} - ${item.offTime}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Kartları Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((item) => {
          const isCO2 = item.channelCode === "switch_1";

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.isActive
                  ? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  : "bg-slate-950/30 border-slate-900 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isCO2 ? "bg-cyan-500/10 text-cyan-400" : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {isCO2 ? <FlaskConical className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.label}</h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      Soket: {item.channelCode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(item.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    item.isActive ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                  title={item.isActive ? "Pasif Yap" : "Aktif Yap"}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      item.isActive ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Saat Detayları */}
              <div className="flex items-center justify-between pt-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      Açılış Saati
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      {item.onTime}
                    </span>
                  </div>

                  <div className="text-slate-600 font-mono">→</div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      Kapanış Saati
                    </span>
                    <span className="font-mono text-rose-400 font-bold text-sm">
                      {item.offTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingSchedule(item)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Saatleri Düzenle"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Düzenleme / Ekleme Modalı */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Zamanlayıcı Programı Düzenle
              </h3>
              <button
                onClick={() => setEditingSchedule(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Kanal Seçimi */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Hedef Soket / Donanım:</label>
              <select
                value={editingSchedule.channelCode}
                onChange={(e) => {
                  const selected = CHANNEL_OPTIONS.find((c) => c.code === e.target.value);
                  setEditingSchedule({
                    ...editingSchedule,
                    channelCode: e.target.value,
                    label: selected?.label || editingSchedule.label,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {CHANNEL_OPTIONS.map((ch) => (
                  <option key={ch.code} value={ch.code}>
                    {ch.label} ({ch.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Saat Seçimi */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-emerald-400 font-medium">Açılış Saati (ON):</label>
                <input
                  type="time"
                  value={editingSchedule.onTime}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, onTime: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-rose-400 font-medium">Kapanış Saati (OFF):</label>
                <input
                  type="time"
                  value={editingSchedule.offTime}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, offTime: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Modal Butonları */}
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => setEditingSchedule(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                İptal
              </button>
              <button
                onClick={() => handleSaveSchedule(editingSchedule)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {saving ? "Senkronize Ediliyor..." : "Kaydet & Senkronize Et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
