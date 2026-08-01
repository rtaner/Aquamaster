"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  Settings, 
  Droplets, 
  FlaskConical, 
  Zap, 
  Shield, 
  Heart, 
  Sparkles, 
  Leaf, 
  Droplet,
  Palette
} from "lucide-react";
import { PumpSetting } from "@/types/aquamaster";

interface PumpSettingsModalProps {
  isOpen: boolean;
  setting: PumpSetting | null;
  onSave: (updated: PumpSetting) => Promise<void>;
  onClose: () => void;
}

const availableIcons = [
  { name: "Droplets", label: "Damla", icon: Droplets },
  { name: "FlaskConical", label: "Erlen", icon: FlaskConical },
  { name: "Zap", label: "Şimşek", icon: Zap },
  { name: "Shield", label: "Kalkan", icon: Shield },
  { name: "Heart", label: "Kalp", icon: Heart },
  { name: "Sparkles", label: "Pırıltı", icon: Sparkles },
  { name: "Leaf", label: "Yaprak", icon: Leaf },
  { name: "Water", label: "Su", icon: Droplet },
] as const;

const availableColors = [
  { name: "cyan", label: "Turkuaz", class: "bg-cyan-500" },
  { name: "emerald", label: "Zümrüt", class: "bg-emerald-500" },
  { name: "amber", label: "Kehribar", class: "bg-amber-500" },
  { name: "rose", label: "Gül", class: "bg-rose-500" },
  { name: "purple", label: "Mor", class: "bg-purple-500" },
  { name: "blue", label: "Mavi", class: "bg-blue-500" },
] as const;

export default function PumpSettingsModal({
  isOpen,
  setting,
  onSave,
  onClose,
}: PumpSettingsModalProps) {
  const [label, setLabel] = useState<string>("");
  const [color, setColor] = useState<PumpSetting["color"]>("cyan");
  const [icon, setIcon] = useState<PumpSetting["icon"]>("Droplets");
  const [maxLimitMl, setMaxLimitMl] = useState<number>(50);
  const [containerTotalMl, setContainerTotalMl] = useState<number>(1000);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (setting) {
      setLabel(setting.label || `${setting.pump_id}. Pompa`);
      setColor(setting.color || "cyan");
      setIcon(setting.icon || "Droplets");
      setMaxLimitMl(setting.max_limit_ml || 50);
      setContainerTotalMl(setting.container_total_ml || 1000);
    }
  }, [setting]);

  if (!isOpen || !setting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...setting,
      label,
      color,
      icon,
      max_limit_ml: maxLimitMl,
      container_total_ml: containerTotalMl,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-y-auto max-h-[90vh]">
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Başlık */}
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/20 p-3 rounded-2xl border border-cyan-500/40 text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Kanal {setting.pump_id} Ayarları</h3>
            <p className="text-xs text-slate-400">Pompa etiketini, ikonunu, rengini ve koruma limitlerini özelleştirin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sıvı / Gübre Adı */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Gübre / Sıvı Adı:</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: Gübre A"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Renk Seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> Kanal Accent Rengi:
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableColors.map((c) => {
                const isSelected = color === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name as any)}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${c.class} ${
                      isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105" : "opacity-60 hover:opacity-100"
                    }`}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          {/* İkon Seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Kanal İkonu:</label>
            <div className="grid grid-cols-4 gap-2">
              {availableIcons.map((ic) => {
                const Icon = ic.icon;
                const isSelected = icon === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Depo Toplam Kapasitesi & Maksimum Dozaj Limiti */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Depo Hacmi (ml):</label>
              <input
                type="number"
                min="100"
                step="50"
                value={containerTotalMl}
                onChange={(e) => setContainerTotalMl(parseInt(e.target.value) || 1000)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Max Limit (ml):</label>
              <input
                type="number"
                min="1"
                step="5"
                value={maxLimitMl}
                onChange={(e) => setMaxLimitMl(parseInt(e.target.value) || 50)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Kaydet Butonu */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>Ayarları Kaydet</span>
          </button>
        </form>
      </div>
    </div>
  );
}
