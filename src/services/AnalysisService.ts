import type { AnalysisDto } from "@/dto/analysis.dto";
import { analysisDtoSchema } from "@/dto/analysis.dto";

interface ResponsesPayload { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }
export class AnalysisConfigurationError extends Error {}
export class AnalysisProviderError extends Error { constructor(message: string, public readonly details?: string) { super(message); } }

const mockAnalysis = (): AnalysisDto => ({
  equipmentName: "Hydraulic Pump Unit 04", manufacturer: "Northwind Manufacturing", category: "Hydraulic", confidence: 0.91,
  summary: "The equipment appears to be operating within normal range with minor surface wear and no critical structural damage observed in the captured view.",
  detectedComponents: ["Pressure valve", "Drive shaft", "Seal housing", "Control manifold"], safetyHazards: ["Minor fluid seepage near the seal", "Loose cable cover at the base panel"],
  possibleFaults: ["Early-stage seal degradation", "Potential vibration imbalance in the drive train"], maintenanceRecommendations: ["Inspect the seal assembly during the next maintenance window", "Tighten the cable cover and confirm grounding continuity", "Monitor vibration levels over the next 48 hours"], estimatedCondition: "Good",
});

function canMock(error: unknown, status?: number) {
  if (process.env.NODE_ENV !== "development") return false;
  const text = typeof error === "string" ? error : error instanceof Error ? error.message : JSON.stringify(error);
  return status === 401 || status === 402 || status === 429 || /insufficient quota|quota|billing|invalid api key|invalid_api_key|network|fetch failed/i.test(text);
}

export class AnalysisService {
  async analyze(file: File): Promise<AnalysisDto> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AnalysisConfigurationError("OpenAI API key is not configured.");
    try {
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4.1-mini", input: [{ role: "system", content: "You analyze industrial equipment images and return compact JSON matching the requested schema." }, { role: "user", content: [{ type: "input_image", image_url: `data:${file.type || "image/png"};base64,${base64}` }, { type: "input_text", text: "Return strict JSON with fields: equipmentName, manufacturer, category, confidence, summary, detectedComponents, safetyHazards, possibleFaults, maintenanceRecommendations, estimatedCondition." }] }] }) });
      if (!response.ok) {
        const details = await response.text();
        if (canMock(details, response.status)) return mockAnalysis();
        throw new AnalysisProviderError("OpenAI request failed.", details);
      }
      const payload = await response.json() as ResponsesPayload;
      const text = payload.output_text || payload.output?.[0]?.content?.[0]?.text;
      if (!text) throw new AnalysisProviderError("No analysis returned from OpenAI.");
      return analysisDtoSchema.parse(JSON.parse(text));
    } catch (error) {
      if (error instanceof AnalysisProviderError) throw error;
      if (canMock(error)) return mockAnalysis();
      throw error;
    }
  }
}

