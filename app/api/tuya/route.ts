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
      deviceId = FILTER_DEVICE_ID,
      durationMinutes,
      additionalMinutes,
      channelCode,
      targetState,
      time,
      loops,
      timerId,
    } = body;

    // 1. Dış Filtre Priz Aç / Kapat
    if (action === "toggle") {
      const device = await getDeviceStatus(deviceId);
      const nextState = !device.isSwitchOn;
      const commands = [
        { code: device.switchDpCode, value: nextState },
        ...(nextState ? [{ code: device.countdownDpCode, value: 0 }] : []),
      ];
      await sendDeviceCommands(deviceId, commands);
      return NextResponse.json({ success: true, newState: nextState });
    }

    // 2. 4'lü Priz Spesifik Kanal Aç / Kapat (switch_1, switch_2 vs.)
    if (action === "toggle_channel") {
      const targetStripId = deviceId || STRIP_DEVICE_ID;
      const result = await toggleStripChannel(targetStripId, channelCode, targetState);
      return NextResponse.json(result);
    }

    // 3. 4'lü Priz Tüm Kanalları Aç / Kapat
    if (action === "toggle_all_strip") {
      const targetStripId = deviceId || STRIP_DEVICE_ID;
      const strip = await getStripStatus(targetStripId);
      const commands = strip.channels.map((c) => ({
        code: c.code,
        value: Boolean(targetState),
      }));
      await sendDeviceCommands(targetStripId, commands);
      return NextResponse.json({ success: true, newState: targetState });
    }

    // 4. Bakım Modu Başlat
    if (action === "start_maintenance") {
      const duration = Number(durationMinutes) || 15;
      const result = await startFilterMaintenance(deviceId, duration);
      return NextResponse.json(result);
    }

    // 5. Bakım Modunu İptal Et
    if (action === "cancel_maintenance") {
      const result = await cancelFilterMaintenance(deviceId);
      return NextResponse.json(result);
    }

    // 6. Bakım Süresini Uzat
    if (action === "extend_maintenance") {
      const minutes = Number(additionalMinutes) || 5;
      const result = await extendFilterMaintenance(deviceId, minutes);
      return NextResponse.json(result);
    }

    // 7. Donanımsal Timer Ekleme (İnternet kopsa da çalışan donanım zamanlayıcısı)
    if (action === "add_timer") {
      const targetStripId = deviceId || STRIP_DEVICE_ID;
      const result = await addDeviceTimer(targetStripId, {
        time,
        code: channelCode,
        value: Boolean(targetState),
        loops: loops || "1111111",
      });
      return NextResponse.json(result);
    }

    // 8. Donanımsal Timer Silme
    if (action === "delete_timer") {
      const targetStripId = deviceId || STRIP_DEVICE_ID;
      const result = await deleteDeviceTimer(targetStripId, timerId);
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
