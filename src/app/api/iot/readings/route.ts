import { z } from "zod";
import { sensorReadingDtoSchema } from "@/dto/sensor.dto";
import { apiError, apiSuccess, validationIssues } from "@/infrastructure/http/api-response";
import { createLogger } from "@/infrastructure/logging/Logger";
import { PrismaSensorRepository } from "@/infrastructure/repositories/PrismaSensorRepository";
import { SensorDeviceNotFoundError, SensorService } from "@/services/SensorService";
import { createAlertService } from "@/services/alertFactory";
import { authorizeApi } from "@/lib/auth-session";
import { createMemoryIngestionService } from "@/services/memoryFactory";

const logger = createLogger("api.iot.readings");
const sensorService = new SensorService(new PrismaSensorRepository(), createAlertService(), createMemoryIngestionService());

export async function POST(request: Request) {
  const auth = await authorizeApi("telemetry:create");
  if ("response" in auth) return auth.response;
  try {
    const payload: unknown = await request.json();
    const stored = await sensorService.record(sensorReadingDtoSchema.parse(payload));
    return apiSuccess({ success: true, reading: stored }, 201);
  } catch (error) {
    if (error instanceof SensorDeviceNotFoundError) return apiError(error.message, 404);
    if (error instanceof z.ZodError) {
      return apiError("Invalid sensor reading.", 422, { issues: validationIssues(error.issues) });
    }
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    logger.error("Unable to store sensor reading", error);
    return apiError("Unable to store sensor reading.", 500);
  }
}
