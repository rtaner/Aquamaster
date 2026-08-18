"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FlaskConical,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Droplet,
  Leaf,
  Zap,
  Activity,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  History,
  FileText,
  RotateCcw,
  Copy,
} from "lucide-react";
import { ManualWaterTest } from "@/types/aquamaster";
import { supabase } from "@/lib/supabase";

interface ManualWaterTestSectionProps {
  onNotify?: (text: string, type: "success" | "error") => void;
}

const PARAM_DEFINITIONS = [
  {
    key: "ph",
    label: "pH (Asitlik)",
    unit: "",
    step: 0.05,
    min: 4.0,
    max: 9.5,
    idealMin: 6.5,
    idealMax: 7.2,
    icon: FlaskConical,
    color: "cyan",
    desc: "Su asitlik/alkalinite dengesi",
  },
  {
    key: "kh",
    label: "KH (Karbonat)",
    unit: "°dKH",
    step: 0.5,
    min: 0,
    max: 25,
    idealMin: 3.0,
    idealMax: 6.0,
    icon: ShieldCheck,
    color: "amber",
    desc: "pH tamponlama & CO2 kapasitesi",
  },
  {
    key: "gh",
    label: "GH (Genel Sertlik)",
    unit: "°dGH",
    step: 0.5,
    min: 0,
    max: 30,
    idealMin: 5.0,
    idealMax: 10.0,
    icon: Droplet,
    color: "blue",
    desc: "Kalsiyum & Magnezyum mineral seviyesi",
  },
  {
    key: "no3",
    label: "NO3 (Nitrat)",
    unit: "ppm",
    step: 1,
    min: 0,
    max: 100,
    idealMin: 10.0,
    idealMax: 25.0,
    icon: Leaf,
    color: "emerald",
    desc: "Makro besin ve su tazelik göstergesi",
  },
  {
    key: "po4",
    label: "PO4 (Fosfat)",
    unit: "ppm",
    step: 0.05,
    min: 0,
    max: 10,
    idealMin: 0.5,
    idealMax: 1.5,
    icon: Sparkles,
    color: "purple",
    desc: "Bitki besini & Yosun kontrol dengesi",
  },
  {
    key: "fe",
    label: "Fe (Demir)",
    unit: "ppm",
    step: 0.01,
    min: 0,
    max: 2,
    idealMin: 0.05,
    idealMax: 0.2,
    icon: Zap,
    color: "rose",
    desc: "Mikro element & Renk canlılığı",
  },
  {
    key: "k",
    label: "K (Potasyum)",
    unit: "ppm",
    step: 1,
    min: 0,
    max: 50,
    idealMin: 10.0,
    idealMax: 20.0,
    icon: Activity,
    color: "cyan",
    desc: "Temel fotosentez makro elementi",
  },
];

const colorStyles: { [key: string]: { border: string; bg: string; text: string; badge: string; glow: string } } = {
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    glow: "shadow-cyan-950/30",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    glow: "shadow-amber-950/30",
  },
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    glow: "shadow-blue-950/30",
  },
  emerald: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    glow: "shadow-emerald-950/30",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-950/40",
    text: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    glow: "shadow-purple-950/30",
  },
  rose: {
    border: "border-rose-500/30",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    glow: "shadow-rose-950/30",
  },
};

// CO2 Çözünürlük Hesabı Formülü: 3 * KH * 10^(7.00 - pH)
const calculateCo2Ppm = (ph?: number | null, kh?: number | null): number | null => {
  if (ph === undefined || ph === null || kh === undefined || kh === null || ph <= 0 || kh <= 0) {
    return null;
  }
  const co2 = 3.0 * kh * Math.pow(10, 7.0 - ph);
  return Math.round(co2 * 10) / 10;
};

const formatRelativeDays = (dateStr?: string | null) => {
  if (!dateStr) return "Ölçülmedi";
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
};

export default function ManualWaterTestSection({ onNotify }: ManualWaterTestSectionProps) {
  const [tests, setTests] = useState<ManualWaterTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  // Form State (Varsayılan olarak boştur — sadece ölçülen değerler doldurulur)
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formPh, setFormPh] = useState<string>("");
  const [formKh, setFormKh] = useState<string>("");
  const [formGh, setFormGh] = useState<string>("");
  const [formNo3, setFormNo3] = useState<string>("");
  const [formPo4, setFormPo4] = useState<string>("");
  const [formFe, setFormFe] = useState<string>("");
  const [formK, setFormK] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");

  // 1. Supabase Veritabanından Test Kayıtlarını Çek
  const fetchTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("manual_water_tests")
        .select("*")
        .order("test_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("manual_water_tests tablosu sorgu:", error.message);
      } else if (data) {
        setTests(data);
      }
    } catch (e) {
      console.warn("Supabase verileri alınamadı:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // HER PARAMETRENİN EN SON ÖLÇÜLDÜĞÜ DEĞER VE TARİHİNİ AYRI AYRI BULMA (Multi-date Intelligent Aggregation)
  const latestValuesMap = useMemo(() => {
    const result: {
      [key: string]: { val: number | null; testDate: string | null; notes?: string };
    } = {};

    PARAM_DEFINITIONS.forEach((def) => {
      result[def.key] = { val: null, testDate: null };
      for (const t of tests) {
        const v = (t as any)[def.key];
        if (v !== undefined && v !== null && !isNaN(v)) {
          result[def.key] = { val: Number(v), testDate: t.test_date, notes: t.notes };
          break;
        }
      }
    });

    return result;
  }, [tests]);

  // Son güncel pH ve KH'a göre dinamik CO2 hesabı
  const activePh = latestValuesMap["ph"]?.val;
  const activeKh = latestValuesMap["kh"]?.val;
  const latestCo2 = useMemo(() => calculateCo2Ppm(activePh, activeKh), [activePh, activeKh]);

  // Form Canlı CO2 Önizlemesi (Formda girilen veya son bilinen pH/KH ile)
  const previewCo2 = useMemo(() => {
    const pVal = formPh !== "" ? parseFloat(formPh) : activePh;
    const kVal = formKh !== "" ? parseFloat(formKh) : activeKh;
    if (pVal === undefined || pVal === null || kVal === undefined || kVal === null || isNaN(pVal) || isNaN(kVal) || pVal <= 0 || kVal <= 0) {
      return null;
    }
    return calculateCo2Ppm(pVal, kVal);
  }, [formPh, formKh, activePh, activeKh]);

  // Modal Açma (Tamamen Boş Başlat — Zorunluluk Yok)
  const openNewTestModal = () => {
    setEditingTestId(null);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPh("");
    setFormKh("");
    setFormGh("");
    setFormNo3("");
    setFormPo4("");
    setFormFe("");
    setFormK("");
    setFormNotes("");
    setIsModalOpen(true);
  };

  // Önceki Ölçüm Değerlerini Forma Doldur (Hızlı Kopyalama Butonu)
  const handlePreFillPreviousValues = () => {
    if (latestValuesMap["ph"]?.val !== null) setFormPh(String(latestValuesMap["ph"].val));
    if (latestValuesMap["kh"]?.val !== null) setFormKh(String(latestValuesMap["kh"].val));
    if (latestValuesMap["gh"]?.val !== null) setFormGh(String(latestValuesMap["gh"].val));
    if (latestValuesMap["no3"]?.val !== null) setFormNo3(String(latestValuesMap["no3"].val));
    if (latestValuesMap["po4"]?.val !== null) setFormPo4(String(latestValuesMap["po4"].val));
    if (latestValuesMap["fe"]?.val !== null) setFormFe(String(latestValuesMap["fe"].val));
    if (latestValuesMap["k"]?.val !== null) setFormK(String(latestValuesMap["k"].val));
  };

  const openEditModal = (item: ManualWaterTest) => {
    setEditingTestId(item.id || null);
    setFormDate(item.test_date);
    setFormPh(item.ph !== undefined && item.ph !== null ? String(item.ph) : "");
    setFormKh(item.kh !== undefined && item.kh !== null ? String(item.kh) : "");
    setFormGh(item.gh !== undefined && item.gh !== null ? String(item.gh) : "");
    setFormNo3(item.no3 !== undefined && item.no3 !== null ? String(item.no3) : "");
    setFormPo4(item.po4 !== undefined && item.po4 !== null ? String(item.po4) : "");
    setFormFe(item.fe !== undefined && item.fe !== null ? String(item.fe) : "");
    setFormK(item.k !== undefined && item.k !== null ? String(item.k) : "");
    setFormNotes(item.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();

    const parseNum = (str: string) => {
      if (str.trim() === "") return null;
      const v = parseFloat(str);
      return isNaN(v) ? null : v;
    };

    const phVal = parseNum(formPh);
    const khVal = parseNum(formKh);
    const ghVal = parseNum(formGh);
    const no3Val = parseNum(formNo3);
    const po4Val = parseNum(formPo4);
    const feVal = parseNum(formFe);
    const kVal = parseNum(formK);

    // En az 1 alan girilmiş olmalı
    const filledCount = [phVal, khVal, ghVal, no3Val, po4Val, feVal, kVal].filter((v) => v !== null).length;
    if (filledCount === 0) {
      if (onNotify) onNotify("Lütfen ölçtüğünüz en az bir parametre değeri girin.", "error");
      return;
    }

    const co2Val = calculateCo2Ppm(phVal, khVal);

    const recordPayload: any = {
      test_date: formDate,
      ph: phVal,
      kh: khVal,
      gh: ghVal,
      no3: no3Val,
      po4: po4Val,
      fe: feVal,
      k: kVal,
      co2_calculated: co2Val,
      notes: formNotes.trim() || null,
    };

    try {
      if (editingTestId) {
        const { error } = await supabase
          .from("manual_water_tests")
          .update(recordPayload)
          .eq("id", editingTestId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("manual_water_tests")
          .insert([recordPayload]);
        if (error) throw error;
      }

      await fetchTests();
      setIsModalOpen(false);

      if (onNotify) {
        onNotify(`🧪 ${filledCount} adet su parametresi veritabanına kaydedildi!`, "success");
      }
    } catch (e: any) {
      console.error("Supabase kayıt hatası:", e);
      if (onNotify) {
        onNotify(`Veritabanı Hatası: ${e.message || "Kayıt eklenemedi"}`, "error");
      }
    }
  };

  const handleDeleteTest = async (id?: string) => {
    if (!id) return;
    try {
      const { error } = await supabase.from("manual_water_tests").delete().eq("id", id);
      if (error) throw error;
      await fetchTests();
      if (onNotify) onNotify("Ölçüm kaydı veritabanından silindi.", "success");
    } catch (e: any) {
      if (onNotify) onNotify(`Silme hatası: ${e.message}`, "error");
    }
  };

  const getParamStatus = (val?: number | null, idealMin?: number, idealMax?: number) => {
    if (val === undefined || val === null) return { text: "Ölçülmedi", color: "text-slate-500", badge: "bg-slate-900 border-slate-800 text-slate-500" };
    if (idealMin !== undefined && idealMax !== undefined) {
      if (val >= idealMin && val <= idealMax) {
        return { text: "İdeal Aralık", color: "text-emerald-400 font-bold", badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" };
      } else if (val < idealMin) {
        return { text: "Düşük", color: "text-amber-400 font-bold", badge: "bg-amber-500/10 border-amber-500/30 text-amber-400" };
      } else {
        return { text: "Yüksek", color: "text-rose-400 font-bold", badge: "bg-rose-500/10 border-rose-500/30 text-rose-400" };
      }
    }
    return { text: "Kayıtlı", color: "text-slate-300", badge: "bg-slate-800 border-slate-700 text-slate-300" };
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-6 animate-in fade-in duration-300">
      {/* BAŞLIK VE HIZLI AKSİYONLAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-3 rounded-2xl border border-cyan-500/40 text-cyan-400 shadow-lg">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 font-mono">Manuel Su Test Kiti Parametreleri</h3>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                Esnek Giriş (Tekil / Çoklu)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hangi testi yaptıysanız (yalnızca pH, sadece Nitrat vb.) tek tek kaydedebilir, son ölçümleri bağımsız takip edebilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ölçüm Geçmişi ({tests.length})</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={openNewTestModal}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ölçüm Ekle</span>
          </button>
        </div>
      </div>

      {/* PARAMETRE KARTLARI IZGARASI (HER PARAMETRE KENDİ SON TEST TARİHİYLE GÖSTERİLİR) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {PARAM_DEFINITIONS.map((def) => {
          const IconComp = def.icon;
          const style = colorStyles[def.color] || colorStyles.cyan;
          const paramData = latestValuesMap[def.key] || { val: null, testDate: null };
          const rawVal = paramData.val;
          const status = getParamStatus(rawVal, def.idealMin, def.idealMax);
          const relativeTime = formatRelativeDays(paramData.testDate);

          return (
            <div
              key={def.key}
              className={`glass-panel rounded-2xl p-3.5 border ${style.border} ${style.bg} ${style.glow} flex flex-col justify-between space-y-2 relative overflow-hidden transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 truncate font-mono">{def.label}</span>
                <div className={`p-1.5 rounded-lg border ${style.badge}`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {rawVal !== null ? rawVal : "—"}
                  </span>
                  {def.unit && <span className="text-[10px] text-slate-400 font-mono font-bold">{def.unit}</span>}
                </div>
                <div className="flex items-center justify-between text-[9.5px] font-mono mt-1.5 pt-1 border-t border-slate-800/80">
                  <span className={`px-1.5 py-0.5 rounded-full border ${status.badge}`}>{status.text}</span>
                  <span className="text-slate-400 flex items-center gap-1" title={paramData.testDate || ""}>
                    <Clock className="w-2.5 h-2.5 text-cyan-400/80" /> {relativeTime}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* 8. KART: ÇÖZÜNMÜŞ CO2 KARTI */}
        <div className="glass-panel rounded-2xl p-3.5 border border-emerald-500/40 bg-emerald-950/40 shadow-emerald-950/30 flex flex-col justify-between space-y-2 relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300 truncate font-mono">Çözünmüş CO2</span>
            <div className="p-1.5 rounded-lg border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-300 font-mono">
                {latestCo2 !== null ? latestCo2 : "—"}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono font-bold">ppm</span>
            </div>
            <div className="flex items-center justify-between text-[9.5px] font-mono mt-1.5 pt-1 border-t border-emerald-900/60">
              <span
                className={`px-1.5 py-0.5 rounded-full border ${
                  latestCo2 && latestCo2 >= 20 && latestCo2 <= 35
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                    : latestCo2 && latestCo2 < 20
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                {latestCo2 && latestCo2 >= 20 && latestCo2 <= 35
                  ? "🌿 İdeal CO2"
                  : latestCo2 && latestCo2 < 20
                  ? "⚠️ Düşük CO2"
                  : latestCo2 && latestCo2 > 35
                  ? "🚨 Yüksek CO2"
                  : "pH/KH Gerekli"}
              </span>
              <span className="text-slate-400 font-mono">İdeal: 20-35</span>
            </div>
          </div>
        </div>
      </div>

      {/* GEÇMİŞ TEST KAYITLARI ÇEKMECESİ */}
      {showHistory && (
        <div className="space-y-3 pt-2 animate-in slide-in-from-top-4 duration-200 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-400" /> Ölçüm Geçmişi ({tests.length} Kayıt)
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Boş bırakılan parametreler o testte ölçülmemiştir (—)</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5 px-3">Tarih</th>
                  <th className="p-2.5">pH</th>
                  <th className="p-2.5">KH</th>
                  <th className="p-2.5">GH</th>
                  <th className="p-2.5">NO3</th>
                  <th className="p-2.5">PO4</th>
                  <th className="p-2.5">Fe</th>
                  <th className="p-2.5">K</th>
                  <th className="p-2.5">CO2 (Hesap)</th>
                  <th className="p-2.5">Not</th>
                  <th className="p-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-2.5 px-3 font-bold text-slate-200">{t.test_date}</td>
                    <td className="p-2.5 text-cyan-300 font-bold">{t.ph ?? "—"}</td>
                    <td className="p-2.5 text-amber-300 font-semibold">{t.kh ? `${t.kh}°` : "—"}</td>
                    <td className="p-2.5 text-blue-300 font-semibold">{t.gh ? `${t.gh}°` : "—"}</td>
                    <td className="p-2.5 text-emerald-300 font-semibold">{t.no3 !== null && t.no3 !== undefined ? `${t.no3} ppm` : "—"}</td>
                    <td className="p-2.5 text-purple-300 font-semibold">{t.po4 !== null && t.po4 !== undefined ? `${t.po4} ppm` : "—"}</td>
                    <td className="p-2.5 text-rose-300 font-semibold">{t.fe !== null && t.fe !== undefined ? `${t.fe} ppm` : "—"}</td>
                    <td className="p-2.5 text-cyan-300 font-semibold">{t.k !== null && t.k !== undefined ? `${t.k} ppm` : "—"}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{t.co2_calculated ? `${t.co2_calculated} ppm` : "—"}</td>
                    <td className="p-2.5 text-slate-400 max-w-[150px] truncate" title={t.notes || ""}>
                      {t.notes || "—"}
                    </td>
                    <td className="p-2.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTest(t.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* YENİ ÖLÇÜM EKLE / DÜZENLE MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Kapat Butonu */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Başlığı */}
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2.5 rounded-2xl border border-cyan-500/40 text-cyan-400">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {editingTestId ? "Ölçüm Kaydını Düzenle" : "Yeni Su Testi Sonucu Gir"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Yalnızca ölçtüğünüz alanları doldurun; diğerlerini boş bırakabilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            {/* Hızlı Butonlar */}
            <div className="flex items-center justify-between text-[11px] font-mono border-y border-slate-800 py-2">
              <span className="text-slate-400">💡 İpucu: Boş kalan alanlar etkilenmez.</span>
              <button
                type="button"
                onClick={handlePreFillPreviousValues}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Önceki Değerleri Kopyala</span>
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-4 font-mono text-xs">
              {/* Test Tarihi */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Ölçüm Tarihi:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setFormDate(new Date().toISOString().split("T")[0])}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Bugün
                  </button>
                </div>
              </div>

              {/* Parametre Giriş Izgarası */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* pH */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-cyan-300">pH (Asitlik)</span>
                    <span className="text-[10px] text-slate-500">6.5 - 7.2</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    placeholder={latestValuesMap["ph"]?.val ? `Son: ${latestValuesMap["ph"].val}` : "Örn: 6.8"}
                    value={formPh}
                    onChange={(e) => setFormPh(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                {/* KH */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-amber-300">KH (Karbonat)</span>
                    <span className="text-[10px] text-slate-500">3 - 6 °dKH</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={latestValuesMap["kh"]?.val ? `Son: ${latestValuesMap["kh"].val}` : "Örn: 4.0"}
                    value={formKh}
                    onChange={(e) => setFormKh(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                {/* GH */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-blue-300">GH (Genel Sertlik)</span>
                    <span className="text-[10px] text-slate-500">5 - 10 °dGH</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={latestValuesMap["gh"]?.val ? `Son: ${latestValuesMap["gh"].val}` : "Örn: 7.0"}
                    value={formGh}
                    onChange={(e) => setFormGh(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                {/* NO3 */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-emerald-300">NO3 (Nitrat)</span>
                    <span className="text-[10px] text-slate-500">10 - 25 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    placeholder={latestValuesMap["no3"]?.val ? `Son: ${latestValuesMap["no3"].val}` : "Örn: 15"}
                    value={formNo3}
                    onChange={(e) => setFormNo3(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                {/* PO4 */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-purple-300">PO4 (Fosfat)</span>
                    <span className="text-[10px] text-slate-500">0.5 - 1.5 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    placeholder={latestValuesMap["po4"]?.val ? `Son: ${latestValuesMap["po4"].val}` : "Örn: 1.0"}
                    value={formPo4}
                    onChange={(e) => setFormPo4(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                {/* Fe */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-rose-300">Fe (Demir)</span>
                    <span className="text-[10px] text-slate-500">0.05 - 0.2 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={latestValuesMap["fe"]?.val ? `Son: ${latestValuesMap["fe"].val}` : "Örn: 0.1"}
                    value={formFe}
                    onChange={(e) => setFormFe(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>

                {/* K */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1 col-span-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-cyan-300">K (Potasyum)</span>
                    <span className="text-[10px] text-slate-500">10 - 20 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    placeholder={latestValuesMap["k"]?.val ? `Son: ${latestValuesMap["k"].val}` : "Örn: 15"}
                    value={formK}
                    onChange={(e) => setFormK(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* CANLI HESAPLANAN CO2 ÖNİZLEMESİ */}
              {previewCo2 !== null && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-emerald-300 block text-[11px]">Otomatik Hesaplanan CO2:</span>
                      <span className="text-[10px] text-slate-400">
                        {formPh !== "" ? `pH ${formPh}` : `Son pH (${activePh})`} ve {formKh !== "" ? `KH ${formKh}` : `Son KH (${activeKh})`} ile
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-300">{previewCo2} ppm</span>
                    <span className="text-[9.5px] text-emerald-400/90 block font-semibold">
                      {previewCo2 >= 20 && previewCo2 <= 35 ? "🌿 İdeal Bitkili" : previewCo2 < 20 ? "⚠️ Düşük" : "🚨 Yüksek"}
                    </span>
                  </div>
                </div>
              )}

              {/* Not Alanı */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Ölçüm Notu (Opsiyonel):</label>
                <input
                  type="text"
                  placeholder="Örn: Yalnızca Nitrat kontrol edildi"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Butonlar */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingTestId ? "Güncellemeyi Kaydet" : "Ölçümü Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
