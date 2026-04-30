import { apiRequest } from "./apiClient";

/**
 * Endpoints del módulo de bloqueo/restricción de aplicaciones.
 */
export const getInstalledApps = () =>
  apiRequest("/api/installed-apps", { method: "GET", includeJson: false });

export const getBlockedApps = () =>
  apiRequest("/api/blocked-apps", { method: "GET", includeJson: false });

export const addBlockedApp = (executableName) =>
  apiRequest("/api/blocked-apps", {
    method: "POST",
    body: JSON.stringify({ executableName }),
  });

export const removeBlockedApp = (appName) =>
  apiRequest(`/api/blocked-apps/${encodeURIComponent(appName)}`, {
    method: "DELETE",
    includeJson: false,
  });

export const resetBlockedApps = () =>
  apiRequest("/api/blocked-apps/reset", {
    method: "DELETE",
    includeJson: false,
  });
