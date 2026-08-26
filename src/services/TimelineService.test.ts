import { describe, expect, it, vi } from "vitest";
import type { TimelineRepository } from "@/repositories/TimelineRepository";
import { TimelineService } from "@/services/TimelineService";

const repository: TimelineRepository = { getAssetTimelineData: vi.fn().mockResolvedValue({
  asset: { assetId: "MM-000001", name: "Pump", createdAt: new Date("2026-01-01Z") },
  inspections: [{ id: "i1", overallCondition: "Poor", notes: "Bearing wear", inspectionDate: new Date("2026-01-02Z"), aiReport: { diagnosis: "Bearing fault", recommendations: "Inspect", riskLevel: "High" } }],
  readings: [{ id: "r1", recordedAt: new Date("2026-01-04Z"), temperature: 120, humidity: 90, vibration: 18, voltage: 230, current: 80 }],
  maintenance: [{ id: "m1", maintenanceDate: new Date("2026-01-03Z"), maintenanceType: "Bearing inspection", notes: "Wear confirmed", performedBy: "Engineer" }],
  alerts: [{ id: "a1", severity: "High", status: "Open", title: "High vibration alert", description: "Vibration exceeded threshold", recommendation: "Inspect bearings", createdAt: new Date("2026-01-05Z"), updatedAt: new Date("2026-01-05Z") }],
}) };

describe("TimelineService", () => {
  it("aggregates every engineering event type in reverse chronological order", async () => {
    const timeline = await new TimelineService(repository).build("MM-000001");
    expect(new Set(timeline?.events.map(({ type }) => type))).toEqual(new Set(["Inspection", "Sensor Reading", "Health", "Alert", "Recommendation", "Maintenance"]));
    expect(timeline?.events.map(({ occurredAt }) => occurredAt.getTime())).toEqual(timeline?.events.map(({ occurredAt }) => occurredAt.getTime()).toSorted((a, b) => b - a));
    expect(timeline?.trendExplanation).toContain("failure probability");
  });
  it("uses deterministic trend explanation when AI summarization fails", async () => {
    const summarizer = { summarize: vi.fn().mockRejectedValue(new Error("offline")) };
    const timeline = await new TimelineService(repository, undefined, summarizer).build("MM-000001");
    expect(timeline?.aiSummary).toBe(timeline?.trendExplanation);
  });
  it("returns null when the asset does not exist", async () => {
    expect(await new TimelineService({ getAssetTimelineData: vi.fn().mockResolvedValue(null) }).build("missing")).toBeNull();
  });
});
