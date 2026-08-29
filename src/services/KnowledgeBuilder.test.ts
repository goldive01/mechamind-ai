import { describe, expect, it, vi } from "vitest";
import type { EngineeringMemory } from "@/domain/entities/EngineeringMemory";
import { KnowledgeBuilder } from "@/services/KnowledgeBuilder";
import type { KnowledgeGraph } from "@/services/KnowledgeGraph";

const memory = (overrides: Partial<EngineeringMemory> = {}): EngineeringMemory => ({ id: "m1", organisationId: "o1", sourceType: "CompletedRepair", sourceId: "wo1", externalKey: "CompletedRepair:wo1", title: "Bearing repair", summary: "Replaced bearing and aligned shaft", details: { recommendations: ["Inspect alignment"], procedures: ["Lock out and replace bearing"], detectedComponents: ["Drive shaft"] }, equipmentId: "pump-1", assetId: "MM-1", fault: "bearing failure", engineerId: "eng-1", partId: "BRG-20", sensorId: "sensor-1", alertId: null, timelineType: null, confidence: 0.8, successful: true, occurrenceCount: 1, occurredAt: new Date("2026-08-29T10:00:00Z"), lastObservedAt: new Date("2026-08-29T10:00:00Z"), createdAt: new Date(), updatedAt: new Date(), events: [], tags: [{ id: "t1", memoryId: "m1", name: "severity", value: "high", createdAt: new Date() }], ...overrides });

describe("KnowledgeBuilder", () => {
  it("converts a memory into supported nodes without duplicates", () => {
    const result = new KnowledgeBuilder({} as KnowledgeGraph).build(memory({ details: { detectedComponents: ["pump-1", "Drive shaft", "Drive shaft"] } }));
    expect(result.nodes.map((node) => node.nodeType)).toEqual(expect.arrayContaining(["Asset", "Component", "Engineer", "SparePart", "Failure", "Sensor", "WorkOrder"]));
    expect(new Set(result.nodes.map((node) => `${node.nodeType}:${node.externalKey}`)).size).toBe(result.nodes.length);
  });

  it("creates relationships and supporting facts", () => {
    const result = new KnowledgeBuilder({} as KnowledgeGraph).build(memory());
    expect(result.edges).toEqual(expect.arrayContaining([expect.objectContaining({ relationship: "EXPERIENCED_FAILURE" }), expect.objectContaining({ relationship: "USES_SPARE_PART" }), expect.objectContaining({ relationship: "REPAIRED_BY" })]));
    expect(result.facts).toEqual(expect.arrayContaining([expect.objectContaining({ predicate: "SUMMARY" }), expect.objectContaining({ predicate: "SUCCESSFUL", value: "true" })]));
  });

  it("persists its validated memory-to-graph conversion", async () => {
    const apply = vi.fn(async () => ({ nodes: [], edges: [], facts: [] }));
    await new KnowledgeBuilder({ apply } as unknown as KnowledgeGraph).updateFromMemory(memory());
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ nodes: expect.any(Array), edges: expect.any(Array), facts: expect.any(Array) }));
  });
});
