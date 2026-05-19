import type { Filter } from "mongodb";

import type { AlertDocument, SensorReadingDocument } from "../models/operational.models.js";
import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";

export interface GetCriticalAlertsInput {
  assetType?: string;
}

export interface GetCriticalAlertsResult {
  tool: "getCriticalAlerts";
  count: number;
  alerts: AlertDocument[];
}

export interface GetHighVibrationAssetsInput {
  minimumVibration?: number;
}

export interface GetHighVibrationAssetsResult {
  tool: "getHighVibrationAssets";
  threshold: number;
  count: number;
  assets: SensorReadingDocument[];
}

export async function getCriticalAlerts(
  _input: GetCriticalAlertsInput = {},
  database: DatabaseLike = getDatabase(),
): Promise<GetCriticalAlertsResult> {
  const alerts = await database
    .collection<AlertDocument>("alerts")
    .find({ severity: "critical" } as Filter<AlertDocument>)
    .sort({ timestamp: -1 })
    .toArray();

  return {
    tool: "getCriticalAlerts",
    count: alerts.length,
    alerts,
  };
}

export async function getHighVibrationAssets(
  input: GetHighVibrationAssetsInput = {},
  database: DatabaseLike = getDatabase(),
): Promise<GetHighVibrationAssetsResult> {
  const threshold = input.minimumVibration ?? 7;

  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error("minimumVibration must be a non-negative number.");
  }

  const assets = await database
    .collection<SensorReadingDocument>("sensor_readings")
    .find({ vibration: { $gte: threshold } } as Filter<SensorReadingDocument>)
    .sort({ vibration: -1 })
    .toArray();

  return {
    tool: "getHighVibrationAssets",
    threshold,
    count: assets.length,
    assets,
  };
}
