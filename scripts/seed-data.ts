// scripts/seed-data.ts

import { MongoClient } from "mongodb";
import { faker } from "@faker-js/faker";
import type {
  AssetDocument,
  AlertDocument,
  SensorReadingDocument,
  MaintenanceLogDocument,
  AssetHealth,
  AssetStatus,
  AlertSeverity
} from "../src/models/operational.models.js";

const MONGO_URI = "mongodb://localhost:27017/";
const DB_NAME = "nli_ops_assistant";

const client = new MongoClient(MONGO_URI);

const ASSET_TYPES = ["compressor", "pump", "turbine", "heat_exchanger"] as const;
const ASSET_STATUSES: AssetStatus[] = ["running", "stopped", "maintenance"];
const ASSET_HEALTHS: AssetHealth[] = ["normal", "warning", "critical"];

const ALERT_TYPES = [
  "high_vibration",
  "overheating",
  "pressure_anomaly",
  "seal_leakage",
  "bearing_failure",
];

const ALERT_SEVERITIES: AlertSeverity[] = ["info", "warning", "critical"];

const MAINTENANCE_ISSUES = [
  "bearing wear",
  "seal leakage",
  "rotor imbalance",
  "lubrication failure",
  "cooling system failure",
];

const MAINTENANCE_ACTIONS = [
  "bearing replaced",
  "seal replaced",
  "rotor aligned",
  "lubricant refilled",
  "cooling system repaired",
];

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);

    const assetsCollection = db.collection("assets");
    const alertsCollection = db.collection("alerts");
    const sensorReadingsCollection = db.collection("sensor_readings");
    const maintenanceLogsCollection = db.collection("maintenance_logs");

    console.log(" Cleaning existing collections...");
    await Promise.all([
      assetsCollection.deleteMany({}),
      alertsCollection.deleteMany({}),
      sensorReadingsCollection.deleteMany({}),
      maintenanceLogsCollection.deleteMany({}),
    ]);

    console.log("Generating assets...");
    const assets: AssetDocument[] = [];
    const assetIds: string[] = [];

    // Ensure we have JPZ84HWB as requested by user in their query example
    assetIds.push("JPZ84HWB");
    assets.push({
      asset_id: "JPZ84HWB",
      type: "compressor",
      unit: "Unit-1",
      status: "running",
      health: "warning",
    });

    for (let i = 2; i <= 25; i++) {
      const asset_id = faker.string.alphanumeric(8).toUpperCase();
      assetIds.push(asset_id);
      assets.push({
        asset_id,
        type: faker.helpers.arrayElement(ASSET_TYPES),
        unit: `Unit-${faker.number.int({ min: 1, max: 10 })}`,
        status: faker.helpers.arrayElement(ASSET_STATUSES),
        health: faker.helpers.arrayElement(ASSET_HEALTHS),
      });
    }

    await assetsCollection.insertMany(assets);
    console.log(`Inserted ${assets.length} assets`);

    console.log("Generating alerts...");
    const alerts: AlertDocument[] = [];
    for (let i = 0; i < 300; i++) {
      alerts.push({
        asset_id: faker.helpers.arrayElement(assetIds),
        alert_type: faker.helpers.arrayElement(ALERT_TYPES),
        severity: faker.helpers.arrayElement(ALERT_SEVERITIES),
        value: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
        timestamp: faker.date.recent({ days: 90 }).toISOString(),
      });
    }
    await alertsCollection.insertMany(alerts);
    console.log("Inserted 300 alerts");

    console.log("Generating sensor readings...");
    const sensorReadings: SensorReadingDocument[] = [];
    for (let i = 0; i < 1000; i++) {
      sensorReadings.push({
        asset_id: faker.helpers.arrayElement(assetIds),
        temperature: faker.number.float({ min: 50, max: 150, fractionDigits: 2 }),
        vibration: faker.number.float({ min: 0.5, max: 15, fractionDigits: 2 }),
        pressure: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
        timestamp: faker.date.recent({ days: 30 }).toISOString(),
      });
    }
    await sensorReadingsCollection.insertMany(sensorReadings);
    console.log("Inserted 1000 sensor readings");

    console.log("Generating maintenance logs...");
    const maintenanceLogs: MaintenanceLogDocument[] = [];
    for (let i = 0; i < 120; i++) {
      maintenanceLogs.push({
        asset_id: faker.helpers.arrayElement(assetIds),
        issue: faker.helpers.arrayElement(MAINTENANCE_ISSUES),
        action: faker.helpers.arrayElement(MAINTENANCE_ACTIONS),
        timestamp: faker.date.recent({ days: 180 }).toISOString(),
      });
    }
    await maintenanceLogsCollection.insertMany(maintenanceLogs);
    console.log("Inserted 120 maintenance logs");

    console.log("\nDatabase seeding completed successfully!");
  } catch (error) {
    console.error("Seed failed:");
    console.error(error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

seed();