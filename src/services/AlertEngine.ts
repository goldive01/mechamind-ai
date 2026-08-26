import type { AlertEvaluationInput, AlertFinding, AlertMetric, AlertSeverity } from "@/domain/entities/Alert";

interface Rule { severity: AlertSeverity; threshold: number; matches(value: number): boolean }
const upper = (low: number, medium: number, high: number, critical: number): Rule[] => [
  { severity: "Critical", threshold: critical, matches: (v) => v >= critical }, { severity: "High", threshold: high, matches: (v) => v >= high },
  { severity: "Medium", threshold: medium, matches: (v) => v >= medium }, { severity: "Low", threshold: low, matches: (v) => v >= low },
];
const rules: Record<Exclude<AlertMetric, "voltage" | "health_trend" | "failure_probability">, Rule[]> = {
  temperature: upper(70, 85, 100, 120), vibration: upper(4, 7, 12, 18), current: upper(70, 100, 150, 200), humidity: upper(70, 80, 90, 97),
};
const labels: Record<AlertMetric, string> = { temperature: "Temperature", vibration: "Vibration", voltage: "Voltage", current: "Current", humidity: "Humidity", health_trend: "Health trend", failure_probability: "Failure probability" };

function voltageRule(value: number): { severity: AlertSeverity; threshold: number } | null {
  const deviation = value > 230 ? value - 230 : 230 - value;
  return upper(30, 60, 130, 180).find((rule) => rule.matches(deviation)) ? { severity: upper(30, 60, 130, 180).find((rule) => rule.matches(deviation))!.severity, threshold: 230 + (value >= 230 ? 1 : -1) * upper(30, 60, 130, 180).find((rule) => rule.matches(deviation))!.threshold } : null;
}

export class AlertEngine {
  evaluate(input: AlertEvaluationInput): AlertFinding[] {
    const findings: AlertFinding[] = [];
    for (const metric of ["temperature", "vibration", "current", "humidity"] as const) {
      const value = input.reading?.[metric]; if (value === null || value === undefined) continue;
      const rule = rules[metric].find((candidate) => candidate.matches(value));
      if (rule) findings.push(this.finding(input.assetId, metric, rule.severity, value, rule.threshold, "Sensor"));
    }
    const voltage = input.reading?.voltage;
    if (voltage !== null && voltage !== undefined) { const rule = voltageRule(voltage); if (rule) findings.push(this.finding(input.assetId, "voltage", rule.severity, voltage, rule.threshold, "Sensor")); }
    const decline = input.health ? Math.max(0, -input.health.trendDelta) : 0;
    const healthRule = upper(3, 7, 12, 20).find((rule) => rule.matches(decline));
    if (healthRule) findings.push(this.finding(input.assetId, "health_trend", healthRule.severity, input.health!.trendDelta, -healthRule.threshold, input.source ?? "Health"));
    const probability = input.health?.failureProbability;
    const probabilityRule = probability === undefined || probability === null ? undefined : upper(20, 40, 65, 80).find((rule) => rule.matches(probability));
    if (probabilityRule) findings.push(this.finding(input.assetId, "failure_probability", probabilityRule.severity, probability!, probabilityRule.threshold, input.source ?? "Health"));
    return findings.map((finding) => finding.source === "Sensor" ? { ...finding, triggerType: "Sensor Reading", triggerId: input.sensorTriggerId ?? null } : { ...finding, triggerType: input.triggerType ?? finding.source, triggerId: input.triggerId ?? null });
  }
  private finding(assetId: string, metric: AlertMetric, severity: AlertSeverity, observedValue: number, thresholdValue: number, source: AlertFinding["source"]): AlertFinding {
    return { assetId, fingerprint: `${assetId}:${metric}`, severity, category: metric === "health_trend" || metric === "failure_probability" ? "Predictive Health" : "Sensor Telemetry", source, metric, title: `${severity} ${labels[metric].toLowerCase()} alert`, triggerType: null, triggerId: null, observedValue, thresholdValue };
  }
}
