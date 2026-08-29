import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/infrastructure/http/api-response";
import { createLogger } from "@/infrastructure/logging/Logger";
import { PrismaInspectionRepository } from "@/infrastructure/repositories/PrismaInspectionRepository";
import { UploadValidationError, validateImageUpload } from "@/lib/uploads";
import { InspectionService } from "@/services/InspectionService";
import { createAlertService } from "@/services/alertFactory";
import { authorizeApi } from "@/lib/auth-session";
import { createMemoryIngestionService } from "@/services/memoryFactory";

const logger = createLogger("api.ai.save");
const inspectionService = new InspectionService(new PrismaInspectionRepository(), createAlertService(), createMemoryIngestionService());

export async function POST(request: NextRequest) {
  const auth = await authorizeApi("inspections:create");
  if ("response" in auth) return auth.response;
  try {
    const formData = await request.formData();
    const file = validateImageUpload(formData.get("image"));
    const value = formData.get("analysis");
    if (typeof value !== "string") return apiError("Analysis data is required.", 400);
    let analysis: unknown;
    try { analysis = JSON.parse(value); } catch { return apiError("Analysis data must be valid JSON.", 400); }
    return apiSuccess(await inspectionService.save(file, analysis));
  } catch (error) {
    if (error instanceof UploadValidationError) return apiError(error.message, error.status);
    if (error instanceof z.ZodError) return apiError("Invalid save payload.", 422);
    logger.error("Unable to save report", error);
    return apiError("Unable to save report.", 500);
  }
}
