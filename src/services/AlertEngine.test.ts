import { describe, expect, it } from "vitest";
import { AlertEngine } from "@/services/AlertEngine";

describe("AlertEngine", () => {
  it("evaluates every monitored sensor metric and health decline", () => {
    const findings = new AlertEngine().evaluate({ assetId: "MM-000001", reading: { temperature: 121, vibration: 13, voltage: 350, current: 110, humidity: 75 }, health: { trendDelta: -8, failureProbability: 50, overallHealth: 55, safetyScore: 60 } });
    expect(findings.map((finding) => finding.metric)).toEqual(["temperature", "vibration", "current", "humidity", "voltage", "overall_health", "failure_probability"]);
    expect(findings.find((finding) => finding.metric === "temperature")?.severity).toBe("Critical");
    expect(findings.find((finding) => finding.metric === "vibration")?.severity).toBe("High");
    expect(findings.find((finding) => finding.metric === "overall_health")?.severity).toBe("Medium");
    expect(findings.find((finding) => finding.metric === "failure_probability")?.severity).toBe("Medium");
  });

  it("returns no findings when values are within configured rules", () => {
    expect(new AlertEngine().evaluate({ assetId: "MM-000001", reading: { temperature: 45, vibration: 2, voltage: 230, current: 30, humidity: 50 }, health: { trendDelta: 2, failureProbability: 5, overallHealth: 90, safetyScore: 95 } })).toEqual([]);
  });
});
