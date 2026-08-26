import { describe, expect, it, vi } from "vitest";
import type { AlertFinding, AlertMetric } from "@/domain/entities/Alert";
import { parseRecommendation, recommendationSchema } from "@/dto/recommendation.dto";
import { EngineeringRuleEngine } from "@/services/EngineeringRuleEngine";
import { RecommendationEngine } from "@/services/RecommendationEngine";

const finding = (metric: AlertMetric, severity: AlertFinding["severity"] = "High"): AlertFinding => ({ assetId: "MM-000001", fingerprint: `MM-000001:${metric}`, severity, category: metric === "overall_health" || metric === "failure_probability" ? "Predictive Health" : "Sensor Telemetry", source: "Health", metric, title: `${severity} ${metric} alert`, triggerType: "Health Recalculation", triggerId: null, observedValue: 85, thresholdValue: 80 });

describe("EngineeringRuleEngine", () => {
  it("produces the complete recommendation DTO for every monitored metric", () => {
    const metrics: AlertMetric[] = ["temperature", "vibration", "voltage", "current", "humidity", "overall_health", "failure_probability"];
    for (const metric of metrics) expect(recommendationSchema.safeParse(new EngineeringRuleEngine().evaluate(finding(metric))).success).toBe(true);
  });
  it("maps severity to deterministic engineering priority", () => {
    expect(new EngineeringRuleEngine().evaluate(finding("temperature", "Critical")).priority).toBe("Immediate");
    expect(new EngineeringRuleEngine().evaluate(finding("temperature", "Low")).priority).toBe("Monitor");
  });
});

describe("RecommendationEngine", () => {
  it("serializes structured deterministic recommendations for alert persistence", () => {
    const recommendation = parseRecommendation(new RecommendationEngine().recommend(finding("failure_probability", "Critical")));
    expect(recommendation).toMatchObject({ priority: "Immediate", requiredSkills: expect.arrayContaining(["Reliability engineering"]) });
    expect(recommendation?.actions[0]).toContain("risk drivers");
  });
  it("falls back to deterministic rules when AI enhancement is unavailable", async () => {
    const enhancer = { enhance: vi.fn().mockRejectedValue(new Error("unavailable")) };
    const recommendation = await new RecommendationEngine(new EngineeringRuleEngine(), enhancer).generate(finding("vibration"));
    expect(recommendation.rootCause).toContain("bearing wear");
    expect(recommendation.actions).toContain("Inspect bearings, mounts, coupling alignment, and rotating balance.");
  });
  it("retains the legacy severity recommendation interface", () => {
    expect(new RecommendationEngine().recommend("Critical", "Safety", 25)).toContain("Immediately isolate");
  });
});
