export interface PumpSetting {
  pump_id: number;
  rate: number; // ml/second
  label: string;
  color?: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue";
  icon?: "Droplets" | "FlaskConical" | "Zap" | "Shield" | "Heart" | "Sparkles" | "Leaf" | "Water";
  max_limit_ml?: number;
  container_total_ml?: number;
  container_current_ml?: number;
  last_calibrated_at?: string;
}

export interface DosingLog {
  id?: number;
  pump_id: number;
  ml_amount: number;
  duration_seconds: number;
  mode: "Manuel" | "Zamanlayıcı";
  created_at?: string;
  status?: "Başarılı" | "Gecikmeli" | "Hata";
  source?: string;
}

export interface ActiveDosingState {
  remainingSeconds: number;
  totalSeconds: number;
  dosingDuration: number;
  delaySeconds: number;
  targetMl: number;
}

export interface ScheduleItem {
  id: number;
  pump_id: number;
  run_time: string;
  duration_seconds: number;
  is_active: boolean;
  is_one_time: boolean;
  schedule_type?: "daily" | "weekly" | "interval";
  days_of_week?: number[];
  interval_days?: number;
  start_date?: string;
}
export interface TuyaSocketChannel {
  code: string; // e.g. switch_1, switch_2
  label: string; // e.g. CO2 Tüpü (Solenoid Vana), Power LED 1
  icon: "Flask" | "Sun" | "Lightbulb" | "Zap";
  isSwitchOn: boolean;
  countdownSeconds?: number;
}

export interface TuyaDeviceState {
  id: string;
  name: string;
  online: boolean;
  isSwitchOn: boolean;
  isFilterRunning: boolean;
  filterCountdownSeconds: number;
  countdownSeconds?: number;
  maintenanceMode: boolean;
}



export interface TuyaStripDeviceState {

  id: string;
  name: string;
  online: boolean;
  channels: TuyaSocketChannel[];
}

export interface TuyaSocketSchedule {
  id: string;
  channelCode: string; // e.g. switch_1, switch_2
  label: string; // e.g. CO2 Tüpü, Power LED 1
  onTime: string; // "09:00"
  offTime: string; // "17:00"
  isActive: boolean;
  days?: number[]; // [1,2,3,4,5,6,0] (0 = Pazar, 1 = Pazartesi...)
  lastExecutedAction?: string;
}

export interface TemperatureLog {
  id?: number;
  temperature: number;
  created_at?: string;
}





