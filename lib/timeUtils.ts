/**
 * AquaMaster Human-Readable Relative Time & Schedule Helper Utilities
 */

/**
 * Bir zamanlayıcı programı (örn: onTime "16:30", offTime "22:30") ve cihazın anlık durumuna göre
 * insan dostu göreceli açıklama metinleri üretir.
 * Örnek çıktılar:
 * - "32 dakika önce açıldı"
 * - "Işık açılmasına 18 dakika kaldı"
 * - "2 saat önce kapandı"
 * - "Kapanmasına 4 saat var"
 */
export function calculateRelativeStatus(
  onTime?: string,
  offTime?: string,
  isCurrentlyOn: boolean = false
): { statusText: string; subText?: string } {
  if (!onTime || !offTime) {
    return {
      statusText: isCurrentlyOn ? "Çalışıyor" : "Kapalı",
      subText: "Zamanlayıcı bilgisi tanımlanmadı",
    };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [onH, onM] = onTime.split(":").map(Number);
  const [offH, offM] = offTime.split(":").map(Number);

  const onMinutes = onH * 60 + onM;
  const offMinutes = offH * 60 + offM;

  if (isCurrentlyOn) {
    // 🟢 CİHAZ ŞU AN AÇIK
    let elapsed = currentMinutes - onMinutes;
    if (elapsed < 0) elapsed += 24 * 60; // Gece yarısı devri

    let remaining = offMinutes - currentMinutes;
    if (remaining < 0) remaining += 24 * 60;

    const elapsedText = formatMinutesToTurkish(elapsed);
    const remainingText = formatMinutesToTurkish(remaining);

    return {
      statusText: `${elapsedText} önce açıldı`,
      subText: `${remainingText} sonra kapanacak (${offTime})`,
    };
  } else {
    // 🔴 CİHAZ ŞU AN KAPALI
    let remainingToOn = onMinutes - currentMinutes;
    if (remainingToOn < 0) remainingToOn += 24 * 60;

    let elapsedFromOff = currentMinutes - offMinutes;
    if (elapsedFromOff < 0) elapsedFromOff += 24 * 60;

    const remainingText = formatMinutesToTurkish(remainingToOn);
    const elapsedText = formatMinutesToTurkish(elapsedFromOff);

    return {
      statusText: `Açılmasına ${remainingText} kaldı (${onTime})`,
      subText: `${elapsedText} önce kapandı (${offTime})`,
    };
  }
}

/**
 * Dakika değerini kısa formatta dönüştürür (örn: 92 dk -> "1s 32dk", 45 dk -> "45dk")
 */
export function formatCompactDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "az önce";
  if (totalMinutes < 60) return `${totalMinutes}dk`;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) return `${hours}s`;
  return `${hours}s ${mins}dk`;
}

/**
 * Dakika değerini okunabilir Türkçe metne dönüştürür (örn: 32 dk -> "32 dakika", 125 dk -> "2 saat 5 dakika")
 */
export function formatMinutesToTurkish(totalMinutes: number): string {

  if (totalMinutes <= 0) return "az önce";
  if (totalMinutes < 60) return `${totalMinutes} dakika`;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) return `${hours} saat`;
  return `${hours} saat ${mins} dk`;
}

/**
 * ISO Tarih dizgisini (örn: "2026-08-12T01:30:00Z") Türkçe göreceli zaman metnine dönüştürür.
 * Örnek: "12 dakika önce", "Bugün 09:00", "Dün 18:30"
 */
export function formatRelativeTimestamp(isoDateStr?: string): string {
  if (!isoDateStr) return "Henüz veri yok";

  const date = new Date(isoDateStr);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return "Az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dakika önce`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    const timeFormatted = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `Bugün ${timeFormatted} (${diffHour} saat önce)`;
  }

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) {
    const timeFormatted = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `Dün ${timeFormatted}`;
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Log kaydındaki gerçek kalibre edilmiş dozaj miktarını (ml) hesaplar.
 * ESP32 zamanlanmış loglarda duration_seconds üzerinden kalibrasyon hızını uygular.
 */
export function getLogEffectiveMl(
  log: { pump_id: number; ml_amount?: number | null; duration_seconds?: number | null; mode?: string },
  pumpSettings?: { [key: number]: { rate?: number } }
): number {
  const rate = pumpSettings?.[log.pump_id]?.rate || 1.0;

  // Otomatik (Zamanlanmış) dozajlarda ESP süreyi (sn) kaydettiği için akış hızıyla gerçek ml'e dönüştür
  if (log.mode === "Zamanlanmış" && log.duration_seconds) {
    return Number((Number(log.duration_seconds) * rate).toFixed(1));
  }

  // Manuel dozlamalarda ml_amount doğrudan girilen ml değeridir
  if (log.ml_amount !== undefined && log.ml_amount !== null && Number(log.ml_amount) > 0) {
    return Number(Number(log.ml_amount).toFixed(1));
  }

  if (log.duration_seconds && Number(log.duration_seconds) > 0) {
    return Number((Number(log.duration_seconds) * rate).toFixed(1));
  }

  return 0;
}
