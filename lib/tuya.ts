import crypto from "crypto";

const CLIENT_ID = process.env.TUYA_CLIENT_ID || "tfcruxw44ta7w5y5xsy9";
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || "883b91c3715b4b3499bd18dbecf22e59";
const ENDPOINT = process.env.TUYA_ENDPOINT || "https://openapi.tuyaeu.com";
export const FILTER_DEVICE_ID = process.env.TUYA_FILTER_DEVICE_ID || "bfe38c9d085605d6d0u0wa";
export const STRIP_DEVICE_ID = process.env.TUYA_STRIP_DEVICE_ID || "bffaf90d6e41c632a9u4tt";


interface TuyaTokenCache {
  token: string;
  expiresAt: number; // ms timestamp
}

let cachedToken: TuyaTokenCache | null = null;

// SHA256 Hash Yardımcısı
function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

// HMAC-SHA256 İmza Yardımcısı
function hmacSha256(secret: string, str: string): string {
  return crypto.createHmac("sha256", secret).update(str, "utf8").digest("hex").toUpperCase();
}

/**
 * Tuya API Access Token Alma (Token Caching ile)
 * Tuya günlük kota sınırına takılmamak için token bellekte saklanır.
 */
export async function getTuyaAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // Token varsa ve süresinin dolmasına en az 5 dakika varsa (ve forceRefresh istenmediyse) önbellekten döndür
  if (!forceRefresh && cachedToken && now < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }


  const timestamp = now.toString();
  const httpMethod = "GET";
  const path = "/v1.0/token?grant_type=1";
  const contentHash = sha256("");
  const stringToSign = `${httpMethod}\n${contentHash}\n\n${path}`;
  const signStr = CLIENT_ID + timestamp + stringToSign;
  const sign = hmacSha256(CLIENT_SECRET, signStr);

  const res = await fetch(`${ENDPOINT}${path}`, {
    method: "GET",
    headers: {
      client_id: CLIENT_ID,
      sign: sign,
      t: timestamp,
      sign_method: "HMAC-SHA256",
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.success || !data.result?.access_token) {
    throw new Error(`Tuya Token Alma Hatası: ${data.msg || JSON.stringify(data)}`);
  }

  const accessToken = data.result.access_token;
  const expiresInMs = (data.result.expire_time || 7200) * 1000;

  cachedToken = {
    token: accessToken,
    expiresAt: now + expiresInMs,
  };

  return accessToken;
}

/**
 * Tuya Imzalı Istek Gönderme
 */
async function tuyaRequest(
  method: "GET" | "POST" | "DELETE" | "PUT",
  path: string,
  body: any = null,
  forceFreshToken = false
) {

  const accessToken = await getTuyaAccessToken(forceFreshToken);
  const timestamp = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const contentHash = sha256(bodyStr);
  const stringToSign = `${method}\n${contentHash}\n\n${path}`;
  const signStr = CLIENT_ID + accessToken + timestamp + stringToSign;
  const sign = hmacSha256(CLIENT_SECRET, signStr);

  const headers: Record<string, string> = {
    client_id: CLIENT_ID,
    access_token: accessToken,
    sign: sign,
    t: timestamp,
    sign_method: "HMAC-SHA256",
    "Content-Type": "application/json",
  };

  const res = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers,
    body: body ? bodyStr : undefined,
    cache: "no-store",
  });

  const data = await res.json();

  // Yetki veya token hatasında bir defaya mahsus taze token alıp tekrar dene
  if (!forceFreshToken && (data.code === 28841101 || data.code === 1010 || data.code === 1004)) {
    return await tuyaRequest(method, path, body, true);
  }

  return data;
}


export interface TuyaDeviceDetail {
  id: string;
  name: string;
  online: boolean;
  isSwitchOn: boolean;
  countdownSeconds: number; // saniye cinsinden
  switchDpCode: string; // switch_1, switch vs.
  countdownDpCode: string; // countdown_1, countdown vs.
  rawStatus: Array<{ code: string; value: any }>;
}

/**
 * Priz Cihazının Anlık Durumunu ve Dinamik DP Kodlarını Çekme
 */
export async function getDeviceStatus(deviceId: string = FILTER_DEVICE_ID): Promise<TuyaDeviceDetail> {
  const data = await tuyaRequest("GET", `/v1.0/devices/${deviceId}`);

  if (!data.success || !data.result) {
    throw new Error(`Cihaz Durumu Alınamadı: ${data.msg || JSON.stringify(data)}`);
  }

  const result = data.result;
  const statusList: Array<{ code: string; value: any }> = result.status || [];

  // Dinamik DP Kodu Tespiti:
  // Ana Priz Röle Anahtarı: switch_1, switch, switch_main veya switch_\d+ (boolean olan)
  // Geri sayım için: countdown_1, countdown veya countdown_\d+
  let switchDpCode = "switch_1";
  let countdownDpCode = "countdown_1";

  let isSwitchOn = false;
  let countdownSeconds = 0;

  // 1. Ana Priz Rölesi Tespiti (Öncelikli: boolean olan switch_1, switch veya switch_\d+)
  const relayItem =
    statusList.find(
      (item) =>
        typeof item.value === "boolean" &&
        (item.code === "switch_1" ||
          item.code === "switch" ||
          item.code === "switch_main" ||
          /^switch_\d+$/i.test(item.code))
    ) ||
    statusList.find(
      (item) => typeof item.value === "boolean" && item.code.toLowerCase().startsWith("switch")
    );

  if (relayItem) {
    switchDpCode = relayItem.code;
    isSwitchOn = Boolean(relayItem.value);
  }

  // 2. Donanımsal Countdown Tespiti
  const countdownItem = statusList.find(
    (item) =>
      item.code === "countdown_1" ||
      item.code === "countdown" ||
      /^countdown_\d+$/i.test(item.code)
  );

  if (countdownItem) {
    countdownDpCode = countdownItem.code;
    countdownSeconds = Number(countdownItem.value) || 0;
  }

  return {
    id: result.id,
    name: result.name || "Akvaryum Dış Filtre Prizi",
    online: Boolean(result.online),
    isSwitchOn,
    countdownSeconds,
    switchDpCode,
    countdownDpCode,
    rawStatus: statusList,
  };
}

/**
 * Prizi Açma / Kapatma veya Countdown Kurma Komutu Gönderme
 */
export async function sendDeviceCommands(
  deviceId: string = FILTER_DEVICE_ID,
  commands: Array<{ code: string; value: any }>
) {
  const path = `/v1.0/devices/${deviceId}/commands`;
  const data = await tuyaRequest("POST", path, { commands });

  if (!data.success) {
    throw new Error(`Komut Gönderilemedi: ${data.msg || JSON.stringify(data)}`);
  }

  return data.result;
}

/**
 * Dış Filtre Bakım Modunu Başlat
 * - Prizi KAPATIR (switch_1: false)
 * - Donanımsal Countdown kurar (countdown_1: durationMinutes * 60) -> Saniye cinsinden
 * @param durationMinutes Bakım süresi (dakika)
 */
export async function startFilterMaintenance(
  deviceId: string = FILTER_DEVICE_ID,
  durationMinutes: number = 15
) {
  // Max cap: 30 dakika (1800 saniye)
  const safeMinutes = Math.min(Math.max(durationMinutes, 1), 30);
  const countdownSeconds = safeMinutes * 60; // Saniyeye çevir

  // Cihazın aktif DP kodlarını öğren
  const device = await getDeviceStatus(deviceId);

  const commands = [
    { code: device.switchDpCode, value: false },
    { code: device.countdownDpCode, value: countdownSeconds },
  ];

  await sendDeviceCommands(deviceId, commands);

  return {
    success: true,
    durationMinutes: safeMinutes,
    countdownSeconds,
    switchDpCode: device.switchDpCode,
    countdownDpCode: device.countdownDpCode,
  };
}

/**
 * Dış Filtre Bakım Modunu İptal Et & Filtreyi Aç
 * - Prizi AÇAR (switch_1: true)
 * - Donanımsal Countdown'u SIFIRLAR (countdown_1: 0)
 */
export async function cancelFilterMaintenance(deviceId: string = FILTER_DEVICE_ID) {
  const device = await getDeviceStatus(deviceId);

  const commands = [
    { code: device.switchDpCode, value: true },
    { code: device.countdownDpCode, value: 0 },
  ];

  await sendDeviceCommands(deviceId, commands);

  return {
    success: true,
    switchDpCode: device.switchDpCode,
    countdownDpCode: device.countdownDpCode,
  };
}

/**
 * Bakım Süresini Uzat (Ekstra Dakika Ekle - Toplam 30 Dakika Hard Cap Sınırı İle)
 */
export async function extendFilterMaintenance(
  deviceId: string = FILTER_DEVICE_ID,
  additionalMinutes: number = 5
) {
  const device = await getDeviceStatus(deviceId);
  const currentRemainingSeconds = device.countdownSeconds;

  // Yeni toplam saniye = Mevcut kalan saniye + Eklenecek saniye
  const newTotalSeconds = currentRemainingSeconds + additionalMinutes * 60;
  // Maximum 30 dakika (1800 saniye) hard cap limit
  const cappedSeconds = Math.min(newTotalSeconds, 1800);

  const commands = [
    { code: device.switchDpCode, value: false },
    { code: device.countdownDpCode, value: cappedSeconds },
  ];

  await sendDeviceCommands(deviceId, commands);

  return {
    success: true,
    newCountdownSeconds: cappedSeconds,
  };
}

export interface TuyaStripChannel {
  code: string;
  label: string;
  icon: "Flask" | "Sun" | "Lightbulb" | "Zap";
  isSwitchOn: boolean;
  countdownSeconds: number;
}

export interface TuyaStripDetail {
  id: string;
  name: string;
  online: boolean;
  channels: TuyaStripChannel[];
  rawStatus: Array<{ code: string; value: any }>;
}

const STRIP_CHANNEL_MAP: Record<string, { label: string; icon: "Flask" | "Sun" | "Lightbulb" | "Zap" }> = {
  switch_1: { label: "CO2 Tüpü (Solenoid Vana)", icon: "Flask" },
  switch_2: { label: "Power LED 1", icon: "Sun" },
  switch_3: { label: "Power LED 2", icon: "Sun" },
  switch_4: { label: "Power LED 3", icon: "Sun" },
};

/**
 * 4'lü Akıllı Priz Durumunu ve Kanallarını Çekme
 */
export async function getStripStatus(deviceId: string = STRIP_DEVICE_ID): Promise<TuyaStripDetail> {
  const data = await tuyaRequest("GET", `/v1.0/devices/${deviceId}`);

  if (!data.success || !data.result) {
    throw new Error(`4'lü Priz Durumu Alınamadı: ${data.msg || JSON.stringify(data)}`);
  }

  const result = data.result;
  const statusList: Array<{ code: string; value: any }> = result.status || [];

  const channels: TuyaStripChannel[] = [];

  for (const [code, meta] of Object.entries(STRIP_CHANNEL_MAP)) {
    const switchItem = statusList.find((item) => item.code === code);
    const countdownItem = statusList.find((item) => item.code === code.replace("switch_", "countdown_"));

    channels.push({
      code,
      label: meta.label,
      icon: meta.icon,
      isSwitchOn: Boolean(switchItem?.value),
      countdownSeconds: Number(countdownItem?.value) || 0,
    });
  }

  return {
    id: result.id,
    name: result.name || "Akvaryum Akıllı 4'lü Priz",
    online: Boolean(result.online),
    channels,
    rawStatus: statusList,
  };
}

/**
 * 4'lü Prizdeki Belirli Bir Kanalı Açma / Kapatma
 */
export async function toggleStripChannel(
  deviceId: string = STRIP_DEVICE_ID,
  channelCode: string,
  targetState?: boolean
) {
  let nextState = targetState;

  if (nextState === undefined) {
    const strip = await getStripStatus(deviceId);
    const channel = strip.channels.find((c) => c.code === channelCode);
    nextState = !(channel?.isSwitchOn ?? false);
  }

  const commands = [{ code: channelCode, value: nextState }];
  await sendDeviceCommands(deviceId, commands);

  return {
    success: true,
    channelCode,
    newState: nextState,
  };
}

export async function getDeviceTimersTest(deviceId: string, customPath: string) {
  const data = await tuyaRequest("GET", customPath, null, true);
  return data;
}

/**
 * Cihazın Tuya Donanımsal Zamanlayıcılarını Çekme (Tuya Cloud Timer API v2.0)
 */
export async function getDeviceTimers(deviceId: string = STRIP_DEVICE_ID) {
  const data = await tuyaRequest("GET", `/v2.0/cloud/timer/device/${deviceId}`);
  return data;
}

/**
 * Cihaza Donanımsal Zamanlayıcı Ekleme (Tuya Cloud Timer API v2.0)
 * İnternet kopsa dahi priz cihazının donanım hafızasında çalışır!
 */
export async function addDeviceTimer(
  deviceId: string = STRIP_DEVICE_ID,
  params: {
    time: string; // "09:00"
    code: string; // "switch_1"
    value: boolean; // true (Aç) veya false (Kapat)
    loops?: string; // "1111111" (Haftanın her günü)
  }
) {
  const body = {
    category: `category_${params.code}`,
    loops: params.loops || "1111111",
    timezone_id: "Europe/Istanbul",
    time: params.time,
    functions: [
      {
        code: params.code,
        value: params.value,
      },
    ],
  };

  const data = await tuyaRequest("POST", `/v2.0/cloud/timer/device/${deviceId}`, body);
  return data;
}

/**
 * Cihazdan Donanımsal Zamanlayıcı Silme (Tuya Cloud Timer API v2.0)
 */
export async function deleteDeviceTimer(deviceId: string = STRIP_DEVICE_ID, timerId: string) {
  const data = await tuyaRequest("DELETE", `/v2.0/cloud/timer/device/${deviceId}/batch?timer_ids=${timerId}`);
  return data;
}




