import { NextResponse } from "next/server";
import {
  getDeviceStatus,
  getStripStatus,
  toggleStripChannel,
  sendDeviceCommands,
  startFilterMaintenance,
  cancelFilterMaintenance,
  extendFilterMaintenance,
  getDeviceTimers,
  getDeviceTimersTest,
  addDeviceTimer,
  deleteDeviceTimer,
  syncChannelTimers,
  FILTER_DEVICE_ID,
  STRIP_DEVICE_ID,
} from "@/lib/tuya";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDeviceId = searchParams.get("deviceId");
    const action = searchParams.get("action");



    // Timer listesi istendiyse
    if (action === "get_timers") {
      const targetId = requestedDeviceId || STRIP_DEVICE_ID;
      const result = await getDeviceTimers(targetId);
      return NextResponse.json({ success: true, timers: result });
    }

    // Tek bir spesifik cihaz istendiyse
    if (requestedDeviceId) {
      if (requestedDeviceId === STRIP_DEVICE_ID) {
        const stripDevice = await getStripStatus(requestedDeviceId);
        return NextResponse.json({ success: true, device: stripDevice, stripDevice });
      }
      const device = await getDeviceStatus(requestedDeviceId);
      return NextResponse.json({ success: true, device, filterDevice: device });
    }

    // Varsayılan: Hem Dış Filtre hem 4'lü Priz durumunu paralel çek
    const [filterDeviceResult, stripDeviceResult] = await Promise.allSettled([
      getDeviceStatus(FILTER_DEVICE_ID),
      getStripStatus(STRIP_DEVICE_ID),
    ]);

    const filterDevice = filterDeviceResult.status === "fulfilled" ? filterDeviceResult.value : null;
    const stripDevice = stripDeviceResult.status === "fulfilled" ? stripDeviceResult.value : null;

    return NextResponse.json({
      success: true,
      device: filterDevice,
      filterDevice,
      stripDevice,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Tuya cihaz durumu alınamadı" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      durationMinutes,
      additionalMinutes,
      channelCode,
      targetState,
      time,
      loops,
      timerId,
    } = body;

    // Cihaz Kimliklerini Kesin Olarak Ayrıştır (Ayrışım Güvencesi)
    const filterDeviceId = body.deviceId || FILTER_DEVICE_ID;
    const stripDeviceId =
      body.deviceId && body.deviceId !== FILTER_DEVICE_ID ? body.deviceId : STRIP_DEVICE_ID;

    // 1. Dış Filtre Priz Aç / Kapat (Kesinlikle Filter Prizini Hedefler)
    if (action === "toggle") {
      const device = await getDeviceStatus(filterDeviceId);
      const nextState = !device.isSwitchOn;
      const commands = [
        { code: device.switchDpCode, value: nextState },
        ...(nextState ? [{ code: device.countdownDpCode, value: 0 }] : []),
      ];
      await sendDeviceCommands(filterDeviceId, commands);
      return NextResponse.json({ success: true, newState: nextState });
    }

    // 2. 4'lü Priz Spesifik Kanal Aç / Kapat (Kesinlikle 4'lü Prizi Hedefler)
    if (action === "toggle_channel") {
      const result = await toggleStripChannel(stripDeviceId, channelCode, targetState);
      return NextResponse.json(result);
    }

    // 3. 4'lü Priz Tüm Kanalları Aç / Kapat (Kesinlikle 4'lü Prizi Hedefler)
    if (action === "toggle_all_strip") {
      const strip = await getStripStatus(stripDeviceId);
      const commands = strip.channels.map((c) => ({
        code: c.code,
        value: Boolean(targetState),
      }));
      await sendDeviceCommands(stripDeviceId, commands);
      return NextResponse.json({ success: true, newState: targetState });
    }

    // 4. Dış Filtre Bakım Modu Başlat (Kesinlikle Filter Prizini Hedefler)
    if (action === "start_maintenance") {
      const duration = Number(durationMinutes) || 15;
      const result = await startFilterMaintenance(filterDeviceId, duration);
      return NextResponse.json(result);
    }

    // 5. Dış Filtre Bakım Modunu İptal Et (Kesinlikle Filter Prizini Hedefler)
    if (action === "cancel_maintenance") {
      const result = await cancelFilterMaintenance(filterDeviceId);
      return NextResponse.json(result);
    }

    // 6. Dış Filtre Bakım Süresini Uzat (Kesinlikle Filter Prizini Hedefler)
    if (action === "extend_maintenance") {
      const minutes = Number(additionalMinutes) || 5;
      const result = await extendFilterMaintenance(filterDeviceId, minutes);
      return NextResponse.json(result);
    }

    // 7. Donanımsal Timer Ekleme (Kesinlikle 4'lü Prizi Hedefler)
    if (action === "add_timer") {
      const result = await addDeviceTimer(stripDeviceId, {
        time,
        code: channelCode,
        value: Boolean(targetState),
        loops: loops || "1111111",
      });
      return NextResponse.json(result);
    }

    // 7.5. Donanımsal Timer Kanalını Temizleyip Yeni Saatlerle Güncelleme (Kesinlikle 4'lü Prizi Hedefler)
    if (action === "sync_channel_timers") {
      const { onTime, offTime } = body;
      const result = await syncChannelTimers(stripDeviceId, channelCode, onTime, offTime);
      return NextResponse.json(result);
    }

    // 8. Donanımsal Timer Silme (Kesinlikle 4'lü Prizi Hedefler)
    if (action === "delete_timer") {
      const result = await deleteDeviceTimer(stripDeviceId, timerId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Geçersiz eylem" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Tuya işlem hatası" },
      { status: 500 }
    );
  }
}
