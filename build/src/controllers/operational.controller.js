import { fetchAssetStatus, fetchCriticalAlerts, fetchHighVibrationAssets, fetchMaintenanceHistory, } from "../services/operational.service.js";
function getRouteParam(request, name) {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
export async function getCriticalAlertsController(_request, response, next) {
    try {
        response.json(await fetchCriticalAlerts());
    }
    catch (error) {
        next(error);
    }
}
export async function getAssetStatusController(request, response, next) {
    try {
        response.json(await fetchAssetStatus(getRouteParam(request, "assetId")));
    }
    catch (error) {
        next(error);
    }
}
export async function getMaintenanceHistoryController(request, response, next) {
    try {
        response.json(await fetchMaintenanceHistory(getRouteParam(request, "assetId")));
    }
    catch (error) {
        next(error);
    }
}
export async function getHighVibrationAssetsController(request, response, next) {
    try {
        const rawMinimumVibration = request.query.minimumVibration;
        const minimumVibration = typeof rawMinimumVibration === "string" && rawMinimumVibration.trim()
            ? Number(rawMinimumVibration)
            : undefined;
        response.json(await fetchHighVibrationAssets(minimumVibration));
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=operational.controller.js.map