"use client";

import { useState, useEffect } from "react";
import { 
  Power, 
  Wrench, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  PlusCircle,
  Radio,
  FlaskConical,
  Sun,
  CheckCircle2
} from "lucide-react";
import { TuyaDeviceState, TuyaStripDeviceState } from "@/types/aquamaster";

interface TuyaSocketsCardProps {
  onNotify?: (message: string, type: "success" | "error") => void;
}

export default function TuyaSocketsCard({ onNotify }: TuyaSocketsCardProps) {
  const [filterDevice, setFilterDevice] = useState<TuyaDeviceState | null>(null);
  const [stripDevice, setStripDevice] = useState<TuyaStripDeviceState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/tuya");
      const data = await res.json();
      if (data.success) {
        if (data.filterDevice) setFilterDevice(data.filterDevice);
        if (data.stripDevice) setStripDevice(data.stripDevice);
      }
    } catch (e) {
      console.error("Tuya get status error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 10 saniyede bir otomatik senkronizasyon (auto-poll)
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1. Dış Filtre Bakım Modunu Başlat
  const handleStartMaintenance = async () => {
    setActionLoading("start_maintenance");
    try {
      const res = await fetch("/api/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_maintenance",
          durationMinutes: selectedMinutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.(
          `Dış Filtre kapatıldı. Donanımsal geri sayım (${data.durationMinutes} dk) kuruldu!`,
          "success"
        );
        await fetchStatus();
      } else {
        onNotify?.(`Hata: ${data.error}`, "error");
      }
    } catch (e: any) {
      onNotify?.(`Bağlantı hatası: ${e.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Bakımı Bitir & Filtreyi Aç
  const handleCancelMaintenance = async () => {
    setActionLoading("cancel_maintenance");
    try {
      const res = await fetch("/api/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_maintenance" }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.("Bakım tamamlandı! Dış filtre tekrar çalıştırıldı.", "success");
        await fetchStatus();
      } else {
        onNotify?.(`Hata: ${data.error}`, "error");
      }
    } catch (e: any) {
      onNotify?.(`Bağlantı hatası: ${e.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Bakımı 5 Dk Uzat (Max 30 dk limit)
  const handleExtendMaintenance = async () => {
    setActionLoading("extend_maintenance");
    try {
      const res = await fetch("/api/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_maintenance", additionalMinutes: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        const mins = Math.round(data.newCountdownSeconds / 60);
        onNotify?.(`Bakım süresi uzatıldı! Toplam kalan: ${mins} dk.`, "success");
        await fetchStatus();
      } else {
        onNotify?.(`Hata: ${data.error}`, "error");
      }
    } catch (e: any) {
      onNotify?.(`Bağlantı hatası: ${e.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Dış Filtre Manuel Aç / Kapat (Optimistik Güncelleme İle)
  const handleToggleFilter = async () => {
    if (!filterDevice) return;
    const targetState = !filterDevice.isSwitchOn;

    setActionLoading("toggle_filter");
    setFilterDevice((prev) => (prev ? { ...prev, isSwitchOn: targetState } : null));

    try {
      const res = await fetch("/api/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.(
          `Dış filtre prizi ${data.newState ? "AÇILDI" : "KAPATILDI"}.`,
          "success"
        );
      } else {
        onNotify?.(`Hata: ${data.error}`, "error");
        await fetchStatus(); // Revert on error
      }
    } catch (e: any) {
      onNotify?.(`Bağlantı hatası: ${e.message}`, "error");
      await fetchStatus(); // Revert on error
    } finally {
      setActionLoading(null);
    }
  };

  // 4'lü Priz Kanalını Aç / Kapat (Optimistik Güncelleme İle Anında Tepki)
  const handleToggleStripChannel = async (channelCode: string, label: string, currentState: boolean) => {
    const targetState = !currentState;
    setActionLoading(channelCode);

    // Anında Akıcı UI Tepkisi (Optimistic UI Update)
    setStripDevice((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        channels: prev.channels.map((ch) =>
          ch.code === channelCode ? { ...ch, isSwitchOn: targetState } : ch
        ),
      };
    });

    try {
      const res = await fetch("/api/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_channel",
          deviceId: stripDevice?.id,
          channelCode,
          targetState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.(`${label} ${targetState ? "AÇILDI" : "KAPATILDI"}.`, "success");
      } else {
        onNotify?.(`Hata: ${data.error}`, "error");
        await fetchStatus(); // Revert on error
      }
    } catch (e: any) {
      onNotify?.(`Bağlantı hatası: ${e.message}`, "error");
      await fetchStatus(); // Revert on error
    } finally {
      setActionLoading(null);
    }
  };

  // 4'lü Priz Tüm Kanalları Aç / Kapat
  const handleToggleAllStrip = async (targetState: boolean) => {
    setActionLoading("toggle_all_strip");

    // Optimistik Tümünü Aç/Kapat UI Güncellemesi
    setStripDevice((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        channels: prev.channels.map((ch) => ({ ...ch, isSwitchOn: targetState })),
      };
    });

    try {
      const res = await fetch("/api/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_all_strip",
          deviceId: stripDevice?.id,
          targetState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.(
          `4'lü prizdeki tüm soketler ${targetState ? "AÇILDI" : "KAPATILDI"}.`,
          "success"
        );
      } else {
        onNotify?.(`Hata: ${data.error}`, "error");
        await fetchStatus();
      }
    } catch (e: any) {
      onNotify?.(`Bağlantı hatası: ${e.message}`, "error");
      await fetchStatus();
    } finally {
      setActionLoading(null);
    }
  };

  // Geri Sayım Süresini MM:SS Şeklinde Formatla
  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isMaintenanceActive = Boolean(
    filterDevice && !filterDevice.isSwitchOn && (filterDevice.countdownSeconds || 0) > 0
  );


  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Tuya Akıllı Prizler & Donanım Kontrolü
            </h2>
            <p className="text-xs text-slate-400">
              Akvaryum Filtre, CO2 Solenoid Vana & Power LED Güvenlik Paneli
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading || actionLoading !== null}
          className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !filterDevice && !stripDevice ? (
        <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          Tuya cihaz durumları sorgulanıyor...
        </div>
      ) : (
        <div className="space-y-8">
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* BÖLÜM 1: DIŞ FİLTRE & BAKIM MODU */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {filterDevice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Ana Priz (Dış Filtre)
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filterDevice.online
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      filterDevice.online ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                    }`}
                  />
                  {filterDevice.online ? "Çevrimiçi" : "Çevrimdışı"}
                </span>
              </div>

              {/* Dış Filtre Kartı */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleToggleFilter}
                    disabled={actionLoading === "toggle_filter"}
                    className={`p-4 rounded-2xl transition-all duration-300 shadow-lg cursor-pointer ${
                      filterDevice.isSwitchOn
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                    }`}
                    title="Prizi Aç/Kapat"
                  >
                    <Power className="w-7 h-7" />
                  </button>

                  <div>
                    <h3 className="font-semibold text-white text-lg">{filterDevice.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Durum:</span>
                      <span
                        className={`font-semibold ${
                          filterDevice.isSwitchOn ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {filterDevice.isSwitchOn ? "AÇIK (Çalışıyor)" : "KAPALI (Durdu)"}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleFilter}
                  disabled={actionLoading === "toggle_filter"}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm border transition flex items-center justify-center gap-2 cursor-pointer ${
                    filterDevice.isSwitchOn
                      ? "bg-slate-800 text-rose-400 border-rose-500/30 hover:bg-rose-950/40"
                      : "bg-slate-800 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40"
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {filterDevice.isSwitchOn ? "Filtreyi Kapat" : "Filtreyi Aç"}
                </button>
              </div>

              {/* Dış Filtre Bakım Modu Alanı */}
              {isMaintenanceActive ? (
                /* Aktif Bakım Modu Durumu */
                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-6 relative overflow-hidden space-y-4 shadow-xl">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl animate-bounce">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/20 px-2.5 py-1 rounded-md">
                          Bakım Modu Aktif
                        </span>
                        <h4 className="text-lg font-bold text-white mt-1">
                          Dış Filtre Güvenli Kapatıldı
                        </h4>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 px-5 py-2.5 rounded-2xl border border-amber-500/30 flex items-center gap-3">
                      <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                      <div>
                        <div className="text-2xl font-mono font-bold text-amber-400 tracking-wider">
                          {formatCountdown(filterDevice.countdownSeconds || 0)}

                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          Kalan Süre
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Donanımsal Koruma Aktif:</strong> Priz çipi üzerindeki zamanlayıcı devrededir. Tarayıcı kapansa veya internet kopsa dahi filtre süre dolunca otomatik açılacaktır.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-2">
                    <button
                      onClick={handleCancelMaintenance}
                      disabled={actionLoading === "cancel_maintenance"}
                      className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Bakımı Bitir & Filtreyi Aç
                    </button>

                    <button
                      onClick={handleExtendMaintenance}
                      disabled={actionLoading === "extend_maintenance" || (filterDevice.countdownSeconds || 0) >= 1500}

                      className="bg-amber-600/80 hover:bg-amber-500 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      title="Süreyi 5 Dakika Uzat (Maks 30 Dakika)"
                    >
                      <PlusCircle className="w-5 h-5" />
                      +5 Dk Uzat
                    </button>
                  </div>
                </div>
              ) : (
                /* Bakım Modu Başlatma Paneli */
                <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-cyan-400" />
                      <h4 className="font-semibold text-white">Dış Filtre Bakım Modu</h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      Otomatik Geri Açma Korumalı
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Filtre temizliği veya yemleme esnasında tek tıkla dış filtreyi kapatır. Belirlenen süre tamamlandığında yararlı bakterileri korumak için filtre otomatik olarak geri açılır.
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      Bakım Süresi:
                    </span>
                    <div className="flex items-center gap-2">
                      {[15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setSelectedMinutes(mins)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            selectedMinutes === mins
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {mins} Dakika
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleStartMaintenance}
                    disabled={actionLoading === "start_maintenance"}
                    className="w-full bg-amber-600/90 hover:bg-amber-500 text-white font-semibold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer"
                  >
                    <Wrench className="w-5 h-5" />
                    Bakım Modunu Başlat ({selectedMinutes} Dk Kapat)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* BÖLÜM 2: AKILLI 4'LÜ PRİZ (CO2 & AYDINLATMA) */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {stripDevice && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {stripDevice.name} (CO2 & Power LED Kanalları)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAllStrip(true)}
                    disabled={actionLoading === "toggle_all_strip"}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                  >
                    Tümünü Aç
                  </button>
                  <button
                    onClick={() => handleToggleAllStrip(false)}
                    disabled={actionLoading === "toggle_all_strip"}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    Tümünü Kapat
                  </button>
                </div>
              </div>

              {/* 4 Kanal Grid Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stripDevice.channels.map((ch) => {
                  const isCO2 = ch.code === "switch_1";
                  const Icon = isCO2 ? FlaskConical : Sun;
                  const isThisChannelLoading = actionLoading === ch.code;

                  return (
                    <div
                      key={ch.code}
                      className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                        ch.isSwitchOn
                          ? isCO2
                            ? "bg-cyan-950/40 border-cyan-500/40 shadow-lg shadow-cyan-950/40"
                            : "bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-950/40"
                          : "bg-slate-950/50 border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`p-3 rounded-xl ${
                            ch.isSwitchOn
                              ? isCO2
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-amber-500/20 text-amber-300"
                              : "bg-slate-900 text-slate-500"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${ch.isSwitchOn ? "animate-pulse" : ""}`} />
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ch.isSwitchOn
                              ? isCO2
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {ch.isSwitchOn ? "Açık" : "Kapalı"}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-sm">{ch.label}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Soket: <span className="font-mono text-slate-300">{ch.code}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleStripChannel(ch.code, ch.label, ch.isSwitchOn)}
                        disabled={isThisChannelLoading}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 cursor-pointer ${
                          ch.isSwitchOn
                            ? "bg-slate-900 text-rose-400 border-rose-500/30 hover:bg-rose-950/40"
                            : "bg-slate-900 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40"
                        } ${isThisChannelLoading ? "opacity-50 cursor-wait" : ""}`}
                      >
                        <Power className={`w-3.5 h-3.5 ${isThisChannelLoading ? "animate-spin" : ""}`} />
                        {ch.isSwitchOn ? "Kapat" : "Aç"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
