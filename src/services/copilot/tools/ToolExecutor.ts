import type { ToolResultDto } from "@/dto/tool-result.dto";
import { createLogger } from "@/infrastructure/logging/Logger";
import { ConfirmationService } from "@/services/copilot/tools/ConfirmationService";
import { DefaultPermissionChecker, type PermissionChecker } from "@/services/copilot/tools/PermissionChecker";
import { ToolRegistry } from "@/services/copilot/tools/ToolRegistry";
import type { ToolExecutionEvent, ToolExecutionRequest, ToolPrincipal } from "@/services/copilot/tools/types";

const logger = createLogger("ToolExecutor");
export class ToolExecutor {
  constructor(private readonly registry: ToolRegistry, private readonly permissions: PermissionChecker = new DefaultPermissionChecker(), private readonly confirmations = new ConfirmationService()) {}

  async *execute(request: ToolExecutionRequest, principal: ToolPrincipal): AsyncGenerator<ToolExecutionEvent> {
    yield { type: "tool_progress", callId: request.id, tool: request.name, stage: "validating", message: `Validating ${request.name}.` };
    const definition = this.registry.get(request.name);
    if (!definition) {
      yield { type: "tool_result", callId: request.id, result: { tool: request.name, status: "invalid", message: "Unknown tool.", issues: [] } }; return;
    }
    if (!this.permissions.can(principal, definition.permission)) {
      yield { type: "tool_result", callId: request.id, result: { tool: request.name, status: "forbidden", message: `Permission ${definition.permission} is required.` } }; return;
    }
    const parsed = definition.inputSchema.safeParse(request.arguments);
    if (!parsed.success) {
      yield { type: "tool_result", callId: request.id, result: { tool: request.name, status: "invalid", message: "Tool arguments are invalid.", issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } }; return;
    }
    if (definition.destructive && !this.confirmations.verify(request.confirmationToken, request.name, parsed.data)) {
      const confirmation = this.confirmations.issue(request.name, parsed.data);
      const result: ToolResultDto = { tool: request.name, status: "confirmation_required", confirmationToken: confirmation.token, expiresAt: confirmation.expiresAt, message: `${request.name} changes application data and requires confirmation.` };
      yield { type: "tool_progress", callId: request.id, tool: request.name, stage: "awaiting_confirmation", message: result.message };
      yield { type: "tool_result", callId: request.id, result }; return;
    }
    yield { type: "tool_progress", callId: request.id, tool: request.name, stage: "executing", message: `Executing ${request.name}.` };
    try {
      const data = await definition.execute(parsed.data);
      const result: ToolResultDto = { tool: request.name, status: "success", data, message: `${request.name} completed.` };
      yield { type: "tool_progress", callId: request.id, tool: request.name, stage: "completed", message: result.message };
      yield { type: "tool_result", callId: request.id, result };
    } catch (error) {
      logger.error("Tool execution failed", error, { tool: request.name, callId: request.id });
      yield { type: "tool_progress", callId: request.id, tool: request.name, stage: "failed", message: `${request.name} failed.` };
      yield { type: "tool_result", callId: request.id, result: { tool: request.name, status: "error", message: error instanceof Error ? error.message : `${request.name} failed.` } };
    }
  }
}

