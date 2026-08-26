import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/infrastructure/http/api-response";
import { createLogger } from "@/infrastructure/logging/Logger";
import { UploadValidationError, validateImageUpload } from "@/lib/uploads";
import { AnalysisConfigurationError, AnalysisProviderError, AnalysisService } from "@/services/AnalysisService";

const logger = createLogger("api.ai.analyse");
const analysisService = new AnalysisService();

export async function POST(request: NextRequest) {
  try {
    const file = validateImageUpload((await request.formData()).get("image"));
    return apiSuccess(await analysisService.analyze(file));
  } catch (error) {
    if (error instanceof UploadValidationError) return apiError(error.message, error.status);
    if (error instanceof AnalysisConfigurationError) return apiError(error.message, 500);
    if (error instanceof AnalysisProviderError) return apiError(error.message, 502, error.details ? { details: error.details } : {});
    if (error instanceof z.ZodError) return apiError("Invalid AI response shape.", 422);
    logger.error("Analysis failed", error);
    return apiError(error instanceof Error ? error.message : "Unknown OpenAI error", 500, { success: false });
  }
}

