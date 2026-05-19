import type { NextFunction, Request, Response } from "express";

import {
  fetchAssetStatus,
  fetchCriticalAlerts,
  fetchHighVibrationAssets,
  fetchMaintenanceHistory,
} from "../services/operational.service.js";
 
function getRouteParam(request: Request, name: string): string {
  const value = request.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function getCriticalAlertsController(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await fetchCriticalAlerts());
  } catch (error) {
    next(error);
  }
}

export async function getAssetStatusController(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await fetchAssetStatus(getRouteParam(request, "assetId")));
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceHistoryController(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await fetchMaintenanceHistory(getRouteParam(request, "assetId")));
  } catch (error) {
    next(error);
  }
}

export async function getHighVibrationAssetsController(request: Request, response: Response, next: NextFunction) {
  try {
    const rawMinimumVibration = request.query.minimumVibration;
    const minimumVibration =
      typeof rawMinimumVibration === "string" && rawMinimumVibration.trim()
        ? Number(rawMinimumVibration)
        : undefined;

    response.json(await fetchHighVibrationAssets(minimumVibration));
  } catch (error) {
    next(error);
  }
}
