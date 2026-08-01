export interface PumpSetting {
  pump_id: number;
  rate: number; // ml/second
  label: string;
  color?: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue";
  icon?: "Droplets" | "FlaskConical" | "Zap" | "Shield" | "Heart" | "Sparkles" | "Leaf" | "Water";
  max_limit_ml?: number;
  container_total_ml?: number;
  container_current_ml?: number;
}

export interface DosingLog {
  id?: number;
  pump_id: number;
  ml_amount: number;
  duration_seconds: number;
  mode: "Manuel" | "Zamanlanmış";
  created_at?: string;
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
