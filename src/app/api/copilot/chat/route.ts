import { z } from "zod";
import { copilotRequestDtoSchema } from "@/dto/copilot.dto";
import { apiError, apiSuccess, validationIssues } from "@/infrastructure/http/api-response";
import { createLogger } from "@/infrastructure/logging/Logger";
import { PrismaConversationRepository } from "@/infrastructure/repositories/PrismaConversationRepository";
import { PrismaCopilotContextRepository } from "@/infrastructure/repositories/PrismaCopilotContextRepository";
import { PrismaAssetOperationsRepository } from "@/infrastructure/repositories/PrismaAssetOperationsRepository";
import { AssetQueryService } from "@/services/AssetQueryService";
import { InspectionReportService } from "@/services/InspectionReportService";
import { MaintenanceService } from "@/services/MaintenanceService";
import { ContextBuilder, CopilotConfigurationError, CopilotProviderError, CopilotService, ConversationNotFoundError, ConversationService } from "@/services/copilot";
import { ToolExecutor } from "@/services/copilot/tools/ToolExecutor";
import { ToolRegistry } from "@/services/copilot/tools/ToolRegistry";
import { createToolDefinitions } from "@/services/copilot/tools/toolDefinitions";
import { createAlertService } from "@/services/alertFactory";

const logger = createLogger("api.copilot.chat");
const operations = new PrismaAssetOperationsRepository();
const toolRegistry = new ToolRegistry(createToolDefinitions(new AssetQueryService(operations, undefined, createAlertService()), new MaintenanceService(operations), new InspectionReportService(operations)));
const service = new ConversationService(new PrismaConversationRepository(), new CopilotService(new ContextBuilder(new PrismaCopilotContextRepository())), new ToolExecutor(toolRegistry));
const encoder = new TextEncoder();
const line = (value: unknown) => encoder.encode(`${JSON.stringify(value)}\n`);

export async function POST(request: Request) {
  try {
    const input = copilotRequestDtoSchema.parse(await request.json());
    if ("action" in input && input.action === "load") return apiSuccess({ conversation: await service.load(input.conversationId) });
    if ("messages" in input) return apiSuccess({ response: await service.chatLegacy(input.messages, input.assetIds) });

    const events = service.stream(input);
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try { for await (const event of events) controller.enqueue(line(event)); }
        catch (error) {
          logger.error("Copilot stream failed", error);
          const message = error instanceof CopilotConfigurationError ? "The AI Copilot is not configured." : error instanceof CopilotProviderError ? "The engineering copilot is temporarily unavailable." : "Unable to complete the copilot request.";
          controller.enqueue(line({ type: "error", error: message }));
        } finally { controller.close(); }
      },
    });
    return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Invalid copilot request.", 422, { issues: validationIssues(error.issues) });
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    if (error instanceof ConversationNotFoundError) return apiError(error.message, 404);
    if (error instanceof CopilotConfigurationError) return apiError("The AI Copilot is not configured.", 503);
    if (error instanceof CopilotProviderError) return apiError("The engineering copilot is temporarily unavailable.", 502);
    logger.error("Copilot request failed", error);
    return apiError("Unable to complete the copilot request.", 500);
  }
}
