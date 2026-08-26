import { describe, expect, it } from "vitest";
import { RecommendationEngine } from "@/services/RecommendationEngine";

describe("RecommendationEngine", () => {
  it("provides metric-specific, severity-aware engineering actions", () => {
    const recommendation = new RecommendationEngine().recommend({ assetId: "MM-000001", fingerprint: "MM-000001:failure_probability", severity: "Critical", category: "Predictive Health", source: "Health", metric: "failure_probability", title: "Critical failure probability alert", triggerType: "Health Recalculation", triggerId: null, observedValue: 85, thresholdValue: 80 });
    expect(recommendation).toContain("risk-based maintenance");
    expect(recommendation).toContain("critical");
  });
});

