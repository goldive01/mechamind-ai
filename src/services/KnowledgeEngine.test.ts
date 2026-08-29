import { describe, expect, it, vi } from "vitest";
import type { KnowledgeRepository } from "@/repositories/KnowledgeRepository";
import { KnowledgeEngine } from "@/services/KnowledgeEngine";
import { KnowledgeSearch } from "@/services/KnowledgeSearch";

const now = new Date("2026-08-29");
const node = { id: "n1", organisationId: "o1", categoryId: null, nodeType: "Asset" as const, externalKey: "mm-1", label: "MM-1", description: null, confidence: 0.9, occurrenceCount: 1, createdAt: now, updatedAt: now, facts: [] };
describe("KnowledgeEngine", () => {
  it("retrieves relevant roots and connected graph context for Copilot", async () => {
    const search = vi.fn(async () => ({ nodes: [node], edges: [], facts: [] }));
    const traverse = vi.fn(async () => ({ nodes: [node, { ...node, id: "n2", nodeType: "Failure" as const, externalKey: "bearing", label: "Bearing failure" }], edges: [{ id: "e1", organisationId: "o1", fromNodeId: "n1", toNodeId: "n2", relationship: "EXPERIENCED_FAILURE", confidence: 0.9, occurrenceCount: 1, sourceMemoryId: "m1", createdAt: now, updatedAt: now }], facts: [] }));
    const result = await new KnowledgeEngine(new KnowledgeSearch({ search, traverse } as unknown as KnowledgeRepository)).recall({ organisationId: "o1", query: "bearing", assetIds: ["MM-1"] });
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ organisationId: "o1", query: "bearing", assetIds: ["MM-1"] }));
    expect(traverse).toHaveBeenCalledWith(expect.objectContaining({ organisationId: "o1", nodeId: "n1" }));
    expect(result).toMatchObject({ nodes: [{ id: "n1" }, { id: "n2" }], edges: [{ relationship: "EXPERIENCED_FAILURE" }] });
  });
});
