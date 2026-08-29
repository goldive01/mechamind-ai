import { describe, expect, it } from "vitest";
import { PromptBuilder } from "@/services/copilot/PromptBuilder";
import { ResponseParser } from "@/services/copilot/ResponseParser";

describe("Copilot prompt and response boundaries", () => {
  it("builds a structured, injection-aware engineering prompt", () => {
    const prompt = new PromptBuilder().build([{ role: "user", content: "Assess the pump" }], []);
    expect(prompt.system).toContain("industrial engineering copilot");
    expect(prompt.system).toContain("Markdown");
    expect(prompt.user).toContain("CONVERSATION HISTORY");
    expect(prompt.user).toContain("ASSET CONTEXT (JSON)");
  });

  it("injects ranked engineering memories with citation instructions", () => {
    const prompt = new PromptBuilder().build([{ role: "user", content: "How was this fault repaired before?" }], [], [{ id: "m1", citation: "[Memory:m1]", sourceType: "CompletedRepair", sourceId: "wo1", assetId: "MM-1", title: "Bearing repair", summary: "Bearing replaced successfully", occurredAt: "2026-08-01T00:00:00.000Z", confidence: 0.9, rank: 0.88, successful: true, ranking: { recency: 1, similarity: 0.8, confidence: 0.9, successOutcome: 1, frequency: 0.5 } }]);
    expect(prompt.user).toContain("ENGINEERING MEMORY");
    expect(prompt.user).toContain("[Memory:m1]");
    expect(prompt.system).toContain("Cite any used memory");
  });

  it("accepts alert evidence in structured responses", () => {
    const result = new ResponseParser().parse({ answer: "Investigate", severity: "high", recommendations: [], evidence: [{ assetId: "MM-000001", source: "alert", detail: "High temperature" }], followUpQuestions: [] });
    expect(result.evidence[0].source).toBe("alert");
  });
});
