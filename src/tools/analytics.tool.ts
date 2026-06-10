import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";
import { logger } from "../utils/logger.js";
import { measureAsync } from "../utils/timing.js";
import type { AlertDocument, MaintenanceLogDocument, AssetDocument } from "../models/operational.models.js";

export interface RecurringFailure {
  asset_id: string;
  failure_count: number;
  recurring_issue_types: string[];
}

export interface ProblematicAsset {
  asset_id: string;
  risk_score: number;
}

export interface AssetHealthSummary {
  healthy: number;
  warning: number;
  critical: number;
}

export interface AlertTrend {
  alert_type: string;
  previous_period_count: number;
  current_period_count: number;
}

// Helper to group counts by asset from a list of documents
function groupCountsByAsset(docs: Array<{ asset_id: string; type?: string }>) {
  const map = new Map<string, { total: number; types: Set<string> }>();
  for (const d of docs) {
    const id = d.asset_id;
    const entry = map.get(id) ?? { total: 0, types: new Set<string>() };
    entry.total += 1;
    if (d.type) entry.types.add(d.type);
    map.set(id, entry);
  }
  return map;
}

// Identify assets with repeated alerts and maintenance events.
export async function getRecurringFailures(input: { minFailures?: number } = {}, database: DatabaseLike = getDatabase()): Promise<RecurringFailure[]> {
  const minFailures = input.minFailures ?? 2;

  // Fetch alerts and maintenance entries and group in JS for readability and testability.
  const { result: alerts, durationMs: aMs } = await measureAsync(() => database.collection<AlertDocument>("alerts").find({}).toArray());
  const { result: maintenance, durationMs: mMs } = await measureAsync(() => database.collection<MaintenanceLogDocument>("maintenance_logs").find({}).toArray());

  const alertDocs = alerts.map((a: any) => ({ asset_id: a.asset_id, type: a.alert_type }));
  const maintDocs = maintenance.map((m: any) => ({ asset_id: m.asset_id, type: m.issue }));

  const alertMap = groupCountsByAsset(alertDocs);
  const maintMap = groupCountsByAsset(maintDocs);

  const allAssetIds = new Set<string>([...alertMap.keys(), ...maintMap.keys()]);

  const results: RecurringFailure[] = [];
  for (const asset_id of allAssetIds) {
    const a = alertMap.get(asset_id);
    const m = maintMap.get(asset_id);
    const alertTotal = a?.total ?? 0;
    const maintTotal = m?.total ?? 0;
    const failure_count = alertTotal + maintTotal;
    if (failure_count >= minFailures) {
      const types = new Set<string>([...(a?.types ?? []), ...(m?.types ?? [])]);
      results.push({ asset_id, failure_count, recurring_issue_types: Array.from(types) });
    }
  }

  results.sort((x, y) => y.failure_count - x.failure_count);

  logger.info("Analytics - recurring failures computed", { category: "analytics", count: results.length, durationMs: (aMs ?? 0) + (mMs ?? 0) });

  return results;
}

// Rank assets using a simple risk score based on critical alerts and maintenance frequency
export async function getMostProblematicAssets(input: { limit?: number } = {}, database: DatabaseLike = getDatabase()): Promise<ProblematicAsset[]> {
  const limit = input.limit ?? 10;

  const { result: criticalAlerts } = await measureAsync(() => database.collection<AlertDocument>("alerts").find({ severity: "critical" }).toArray());
  const { result: maintenance } = await measureAsync(() => database.collection<MaintenanceLogDocument>("maintenance_logs").find({}).toArray());

  const criticalMap = new Map<string, number>();
  for (const a of criticalAlerts) {
    criticalMap.set(a.asset_id, (criticalMap.get(a.asset_id) ?? 0) + 1);
  }

  const maintMap = new Map<string, number>();
  for (const m of maintenance) {
    maintMap.set(m.asset_id, (maintMap.get(m.asset_id) ?? 0) + 1);
  }

  const assetIds = new Set<string>([...criticalMap.keys(), ...maintMap.keys()]);
  const results: ProblematicAsset[] = [];
  for (const id of assetIds) {
    const critical = criticalMap.get(id) ?? 0;
    const maint = maintMap.get(id) ?? 0;
    const risk_score = critical * 3 + maint; // simple weighting
    results.push({ asset_id: id, risk_score });
  }

  results.sort((a, b) => b.risk_score - a.risk_score);
  return results.slice(0, limit);
}

// Fleet health summary
export async function getAssetHealthSummary(database: DatabaseLike = getDatabase()): Promise<AssetHealthSummary> {
  const { result: assets } = await measureAsync(() => database.collection<AssetDocument>("assets").find({}).toArray());

  let healthy = 0;
  let warning = 0;
  let critical = 0;
  for (const a of assets) {
    if (a.health === "warning") warning += 1;
    else if (a.health === "critical") critical += 1;
    else healthy += 1;
  }

  return { healthy, warning, critical };
}

// Alert trends comparing previous and current period (days window)
export async function getAlertTrendAnalysis(input: { days?: number } = {}, database: DatabaseLike = getDatabase()): Promise<AlertTrend[]> {
  const days = input.days ?? 30;
  const now = new Date();
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);
  const previousEnd = currentStart;

  const { result: prevAlerts } = await measureAsync(() =>
    database
      .collection<AlertDocument>("alerts")
      .find({ timestamp: { $gte: previousStart.toISOString(), $lt: previousEnd.toISOString() } })
      .toArray(),
  );

  const { result: currAlerts } = await measureAsync(() =>
    database
      .collection<AlertDocument>("alerts")
      .find({ timestamp: { $gte: currentStart.toISOString() } })
      .toArray(),
  );

  const countByType = (alerts: AlertDocument[]) => {
    const m = new Map<string, number>();
    for (const a of alerts) {
      m.set(a.alert_type, (m.get(a.alert_type) ?? 0) + 1);
    }
    return m;
  };

  const prevMap = countByType(prevAlerts as AlertDocument[]);
  const currMap = countByType(currAlerts as AlertDocument[]);

  const types = new Set<string>([...prevMap.keys(), ...currMap.keys()]);
  const results: AlertTrend[] = [];
  for (const t of types) {
    results.push({ alert_type: t, previous_period_count: prevMap.get(t) ?? 0, current_period_count: currMap.get(t) ?? 0 });
  }

  return results;
}
