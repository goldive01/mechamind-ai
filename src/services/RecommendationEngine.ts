import type { AlertFinding } from "@/domain/entities/Alert";

const actions: Record<AlertFinding["metric"], string> = {
  temperature: "Inspect cooling, lubrication, and loading; isolate the asset if temperature continues to rise.", vibration: "Inspect bearings, alignment, mounts, and rotating balance before continued operation.",
  voltage: "Verify supply quality, connections, protection devices, and rated operating voltage.", current: "Check electrical loading, motor condition, phase balance, and downstream mechanical resistance.",
  humidity: "Inspect enclosure sealing, condensation, ventilation, and moisture ingress.", health_trend: "Review recent inspections and telemetry, then schedule a condition-based engineering inspection.",
  failure_probability: "Review the contributing health drivers, restrict operation where appropriate, and schedule risk-based maintenance.",
};
export class RecommendationEngine {
  recommend(finding: AlertFinding) { return `${actions[finding.metric]} Priority: ${finding.severity.toLowerCase()}.`; }
  explain(finding: AlertFinding) { return `${finding.title}: observed ${finding.observedValue}, crossing the ${finding.severity.toLowerCase()} rule threshold of ${finding.thresholdValue}.`; }
}
