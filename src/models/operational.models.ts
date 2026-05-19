export type AssetHealth = "normal" | "warning" | "critical";
export type AssetStatus = "running" | "stopped" | "maintenance";
export type AlertSeverity = "info" | "warning" | "critical";

export interface AssetDocument {
  asset_id: string;
  type: "compressor" | "pump" | "turbine" | "heat_exchanger";
  unit: string;
  status: AssetStatus;
  health: AssetHealth;
}

export interface AlertDocument {
  asset_id: string;
  alert_type: string;
  severity: AlertSeverity;
  value: number;
  timestamp: string;
}

export interface SensorReadingDocument {
  asset_id: string;
  temperature: number;
  vibration: number;
  pressure: number;
  timestamp?: string;
}

export interface MaintenanceLogDocument {
  asset_id: string;
  issue: string;
  action: string;
  timestamp?: string;
}
