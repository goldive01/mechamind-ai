import type { Alert } from "@/domain/entities/Alert";

export function groupAlertsByResolution(alerts: Alert[]) {
  return {
    active: alerts.filter((alert) => alert.status !== "Resolved"),
    resolved: alerts.filter((alert) => alert.status === "Resolved"),
  };
}

export function recentAlerts(alerts: Alert[], limit = 5) {
  return alerts.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
