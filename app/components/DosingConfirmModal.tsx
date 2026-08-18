"use client";

import { AlertTriangle, CheckCircle2, X, Play, ShieldAlert } from "lucide-react";
import { PumpSetting } from "@/types/aquamaster";

interface DosingConfirmModalProps {
  isOpen: boolean;
  pumpSetting: PumpSetting | null;
  targetMl: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DosingConfirmModal({
  isOpen,
  pumpSetting,
  targetMl,
  onConfirm,
  onClose,
}: DosingConfirmModalProps) {
  if (!isOpen || !pumpSetting) return null;

  const maxLimit = pumpSetting.max_limit_ml || 50;
  const isExceedingLimit = targetMl > maxLimit;
  const rate = pumpSetting.rate || 1.0;
  const exactDurationSec = Number((targetMl / rate).toFixed(2));
  const exactDurationMs = Math.round((targetMl / rate) * 1000);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Başlık */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${isExceedingLimit ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"}`}>
            {isExceedingLimit ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Dozajlama Onayı</h3>
            <p className="text-xs text-slate-400">Fiziksel pompanın tetiklenmesi için doğrulama gerekiyor</p>
          </div>
        </div>

        {/* Özet Kutusu */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Seçilen Pompa:</span>
            <span className="text-white font-bold">{pumpSetting.label} (Kanal {pumpSetting.pump_id})</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Pompa Akış Hızı:</span>
            <span className="text-slate-200 font-semibold">{rate.toFixed(3)} ml/sn</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Dozaj Miktarı:</span>
            <span className="text-cyan-300 font-bold text-sm">{targetMl} ml</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-400">Hassas Çalışma Süresi:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {exactDurationSec} sn <span className="text-[11px] text-emerald-300/80 font-normal">({exactDurationMs} ms)</span>
            </span>
          </div>
        </div>

        {/* Limit İkaz Kutusu */}
        {isExceedingLimit && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Güvenlik Uyarısı (Max Limit Aşıldı)</span>
              <span>
                Girdiğiniz <b>{targetMl} ml</b> miktar, belirlediğiniz <b>{maxLimit} ml</b> maksimum koruma sınırından daha yüksek. Aşırı gübreleme riskine karşı devam etmek istediğinizden emin olun.
              </span>
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 font-bold py-2.5 px-4 rounded-xl text-xs text-white shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isExceedingLimit
                ? "bg-amber-600 hover:bg-amber-500 shadow-amber-950/50"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isExceedingLimit ? "Yine de Başlat" : "Evet, Dozla"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
