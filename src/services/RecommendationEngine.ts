import type { AlertCategory, AlertFinding, AlertSeverity } from "@/domain/entities/Alert";

const actions: Record<AlertFinding["metric"], string> = {
  temperature: "Inspect cooling, lubrication, and loading; isolate the asset if temperature continues to rise.", vibration: "Inspect bearings, alignment, mounts, and rotating balance before continued operation.",
  voltage: "Verify supply quality, connections, protection devices, and rated operating voltage.", current: "Check electrical loading, motor condition, phase balance, and downstream mechanical resistance.",
  humidity: "Inspect enclosure sealing, condensation, ventilation, and moisture ingress.", health_trend: "Review recent inspections and telemetry, then schedule a condition-based engineering inspection.",
  failure_probability: "Review the contributing health drivers, restrict operation where appropriate, and schedule risk-based maintenance.",
};
export class RecommendationEngine {
  recommend(severity: AlertSeverity, category: AlertCategory, health: number): string;
  recommend(finding: AlertFinding): string;
  recommend(input: AlertFinding | AlertSeverity, category?: AlertCategory, health?: number) {
    if (typeof input !== "string") return `${actions[input.metric]} Priority: ${input.severity.toLowerCase()}.`;
    const priority = input === "Critical" ? "Immediately isolate the asset and arrange an engineering inspection" : input === "High" ? "Restrict operation and schedule an urgent engineering inspection" : input === "Medium" ? "Schedule a condition-based engineering inspection" : "Monitor the condition and review it at the next planned inspection";
    const assetHealth = health ?? 100;
    const condition = assetHealth < 40 ? " The asset health is poor; complete a root-cause assessment before return to service." : assetHealth < 70 ? " Review recent telemetry and maintenance history." : " Continue trending asset health after the action.";
    return `${priority} for the ${(category ?? "Engineering").toLowerCase()} alert.${condition}`;
  }
  explain(finding: AlertFinding) { return `${finding.title}: observed ${finding.observedValue}, crossing the ${finding.severity.toLowerCase()} rule threshold of ${finding.thresholdValue}.`; }
}
