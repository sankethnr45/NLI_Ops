import type { Filter } from "mongodb";

import type { AlertDocument, AssetDocument, SensorReadingDocument } from "../models/operational.models.js";
import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";
import { logger } from "../utils/logger.js";
import { measureAsync } from "../utils/timing.js";

export interface GetCriticalAlertsInput {
  assetType?: string;
  alertType?: string;
}

export type EnrichedAlert = AlertDocument & {
  asset: AssetDocument | null;
};

export interface GetCriticalAlertsResult {
  tool: "getCriticalAlerts";
  count: number;
  alerts: EnrichedAlert[];
}

export interface GetHighVibrationAssetsInput {
  minimumVibration?: number;
  assetType?: string;
}

export type EnrichedSensorReading = SensorReadingDocument & {
  asset: AssetDocument | null;
};

export interface GetHighVibrationAssetsResult {
  tool: "getHighVibrationAssets";
  threshold: number;
  count: number;
  assets: EnrichedSensorReading[];
}

async function findAssetsByIds(database: DatabaseLike, assetIds: string[]): Promise<AssetDocument[]> {
  if (assetIds.length === 0) {
    return [];
  }

  logger.info("Executing query", { category: "mongo", operation: "find", collection: "assets", query: { asset_id: { $in: assetIds } } });
  const { result: assets, durationMs } = await measureAsync(() =>
    database
      .collection<AssetDocument>("assets")
      .find({ asset_id: { $in: assetIds } } as Filter<AssetDocument>)
      .sort({ asset_id: 1 })
      .toArray(),
  );
  logger.info("MongoDB query completed", {
    category: "mongo",
    operation: "find_complete",
    collection: "assets",
    durationMs,
    resultCount: assets.length,
  });

  return assets;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export async function getCriticalAlerts(
  input: GetCriticalAlertsInput = {},
  database: DatabaseLike = getDatabase(),
): Promise<GetCriticalAlertsResult> {
  const alertType = normalizeOptionalString(input.alertType);
  const assetType = normalizeOptionalString(input.assetType);
  const filter: Filter<AlertDocument> = { severity: "critical" } as Filter<AlertDocument>;

  if (alertType) {
    filter.alert_type = alertType;
  }

  logger.info("Executing query", { category: "mongo", operation: "find", collection: "alerts", query: filter });
  const { result: alerts, durationMs } = await measureAsync(() =>
    database.collection<AlertDocument>("alerts").find(filter).sort({ timestamp: -1 }).toArray(),
  );
  logger.info("MongoDB query completed", {
    category: "mongo",
    operation: "find_complete",
    collection: "alerts",
    durationMs,
    resultCount: alerts.length,
  });
  const assetIds = [...new Set(alerts.map((alert) => alert.asset_id))];
  const assets = await findAssetsByIds(database, assetIds);
  const assetsById = new Map(assets.map((asset) => [asset.asset_id, asset]));
  const enrichedAlerts = alerts
    .map((alert) => ({
      ...alert,
      asset: assetsById.get(alert.asset_id) ?? null,
    }))
    .filter((alert) => !assetType || alert.asset?.type === assetType);

  return {
    tool: "getCriticalAlerts",
    count: enrichedAlerts.length,
    alerts: enrichedAlerts,
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

  const assetType = normalizeOptionalString(input.assetType);
  logger.info("Executing query", { category: "mongo", operation: "find", collection: "sensor_readings", query: { vibration: { $gte: threshold } } });
  const { result: readings, durationMs } = await measureAsync(() =>
    database
      .collection<SensorReadingDocument>("sensor_readings")
      .find({ vibration: { $gte: threshold } } as Filter<SensorReadingDocument>)
      .sort({ vibration: -1 })
      .toArray(),
  );
  logger.info("MongoDB query completed", {
    category: "mongo",
    operation: "find_complete",
    collection: "sensor_readings",
    durationMs,
    resultCount: readings.length,
  });
  const assetIds = [...new Set(readings.map((reading) => reading.asset_id))];
  const assets = await findAssetsByIds(database, assetIds);
  const assetsById = new Map(assets.map((asset) => [asset.asset_id, asset]));
  const enrichedReadings = readings
    .map((reading) => ({
      ...reading,
      asset: assetsById.get(reading.asset_id) ?? null,
    }))
    .filter((reading) => !assetType || reading.asset?.type === assetType);

  return {
    tool: "getHighVibrationAssets",
    threshold,
    count: enrichedReadings.length,
    assets: enrichedReadings,
  };
}
