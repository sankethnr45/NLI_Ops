import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAssetStatus } from "../src/tools/assets.tool.js";
import { getCriticalAlerts, getHighVibrationAssets } from "../src/tools/alerts.tool.js";
import { getMaintenanceHistory } from "../src/tools/maintenance.tool.js";
function createDatabase(collections) {
    const matchesFilter = (document, filter) => Object.entries(filter).every(([key, value]) => {
        const documentValue = document[key];
        if (typeof value === "object" && value !== null && "$gte" in value) {
            return Number(documentValue) >= Number(value.$gte);
        }
        if (typeof value === "object" && value !== null && "$in" in value) {
            return value.$in.includes(documentValue);
        }
        return documentValue === value;
    });
    return {
        collection(name) {
            const documents = collections[name] ?? [];
            return {
                async findOne(filter) {
                    return documents.find((document) => matchesFilter(document, filter)) ?? null;
                },
                find(filter) {
                    const results = documents.filter((document) => matchesFilter(document, filter));
                    return {
                        sort() {
                            return this;
                        },
                        async toArray() {
                            return results;
                        },
                    };
                },
            };
        },
    };
}
describe("operational tools", () => {
    it("returns critical alerts filtered by severity", async () => {
        const db = createDatabase({
            alerts: [
                { asset_id: "248K001B", alert_type: "high_vibration", severity: "critical", value: 9.3 },
                { asset_id: "248P002A", alert_type: "overheating", severity: "warning", value: 88 },
            ],
            assets: [{ asset_id: "248K001B", type: "compressor", unit: "Unit-3", status: "running", health: "warning" }],
        });
        const result = await getCriticalAlerts({}, db);
        assert.equal(result.tool, "getCriticalAlerts");
        assert.equal(result.count, 1);
        assert.equal(result.alerts[0]?.asset_id, "248K001B");
        assert.equal(result.alerts[0]?.asset?.type, "compressor");
    });
    it("filters critical alerts by asset type and alert type", async () => {
        const db = createDatabase({
            alerts: [
                { asset_id: "248K001B", alert_type: "high_vibration", severity: "critical", value: 9.3 },
                { asset_id: "248P002A", alert_type: "high_vibration", severity: "critical", value: 9.1 },
            ],
            assets: [
                { asset_id: "248K001B", type: "compressor", unit: "Unit-3", status: "running", health: "warning" },
                { asset_id: "248P002A", type: "pump", unit: "Unit-2", status: "running", health: "critical" },
            ],
        });
        const result = await getCriticalAlerts({ assetType: "compressor", alertType: "high_vibration" }, db);
        assert.equal(result.count, 1);
        assert.equal(result.alerts[0]?.asset_id, "248K001B");
        assert.equal(result.alerts[0]?.asset?.type, "compressor");
    });
    it("returns asset status for a known asset", async () => {
        const db = createDatabase({
            assets: [{ asset_id: "248K001B", type: "compressor", unit: "Unit-3", status: "running", health: "warning" }],
        });
        const result = await getAssetStatus({ assetId: "248K001B" }, db);
        assert.equal(result.tool, "getAssetStatus");
        assert.equal(result.found, true);
        assert.equal(result.asset?.type, "compressor");
    });
    it("returns maintenance history for an asset", async () => {
        const db = createDatabase({
            maintenance_logs: [
                { asset_id: "248K001B", issue: "bearing wear", action: "bearing replaced" },
                { asset_id: "248P002A", issue: "seal leak", action: "seal inspected" },
            ],
        });
        const result = await getMaintenanceHistory({ assetId: "248K001B" }, db);
        assert.equal(result.tool, "getMaintenanceHistory");
        assert.equal(result.count, 1);
        assert.equal(result.maintenanceLogs[0]?.action, "bearing replaced");
    });
    it("returns high vibration assets from sensor readings", async () => {
        const db = createDatabase({
            sensor_readings: [
                { asset_id: "248K001B", vibration: 8.7, temperature: 92, pressure: 44 },
                { asset_id: "248P002A", vibration: 4.2, temperature: 70, pressure: 31 },
            ],
            assets: [{ asset_id: "248K001B", type: "compressor", unit: "Unit-3", status: "running", health: "warning" }],
        });
        const result = await getHighVibrationAssets({ minimumVibration: 7 }, db);
        assert.equal(result.tool, "getHighVibrationAssets");
        assert.equal(result.count, 1);
        assert.equal(result.assets[0]?.asset_id, "248K001B");
        assert.equal(result.assets[0]?.asset?.type, "compressor");
    });
    it("filters high vibration readings by asset type", async () => {
        const db = createDatabase({
            sensor_readings: [
                { asset_id: "248K001B", vibration: 8.7, temperature: 92, pressure: 44 },
                { asset_id: "248P002A", vibration: 8.2, temperature: 70, pressure: 31 },
            ],
            assets: [
                { asset_id: "248K001B", type: "compressor", unit: "Unit-3", status: "running", health: "warning" },
                { asset_id: "248P002A", type: "pump", unit: "Unit-2", status: "running", health: "normal" },
            ],
        });
        const result = await getHighVibrationAssets({ minimumVibration: 7, assetType: "compressor" }, db);
        assert.equal(result.count, 1);
        assert.equal(result.assets[0]?.asset_id, "248K001B");
        assert.equal(result.assets[0]?.asset?.type, "compressor");
    });
});
//# sourceMappingURL=operational-tools.test.js.map