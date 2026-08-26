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

  it("accepts alert evidence in structured responses", () => {
    const result = new ResponseParser().parse({ answer: "Investigate", severity: "high", recommendations: [], evidence: [{ assetId: "MM-000001", source: "alert", detail: "High temperature" }], followUpQuestions: [] });
    expect(result.evidence[0].source).toBe("alert");
  });
});

