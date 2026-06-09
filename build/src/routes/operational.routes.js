import { Router } from "express";
import { getAssetStatusController, getCriticalAlertsController, getHighVibrationAssetsController, getMaintenanceHistoryController, } from "../controllers/operational.controller.js";
export const operationalRoutes = Router();
operationalRoutes.get("/alerts/critical", getCriticalAlertsController);
operationalRoutes.get("/assets/high-vibration", getHighVibrationAssetsController);
operationalRoutes.get("/assets/:assetId/status", getAssetStatusController);
operationalRoutes.get("/assets/:assetId/maintenance", getMaintenanceHistoryController);
//# sourceMappingURL=operational.routes.js.map