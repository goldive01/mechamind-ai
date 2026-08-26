import type { z } from "zod";
import type { ToolName, ToolResultDto } from "@/dto/tool-result.dto";

export type ToolPermission = "assets:read" | "maintenance:write" | "reports:generate";
export interface ToolPrincipal { id: string; permissions: ToolPermission[] }
export interface ToolExecutionRequest { id: string; name: ToolName; arguments: unknown; confirmationToken?: string }
export interface ToolProgressEvent { type: "tool_progress"; callId: string; tool: ToolName; stage: "validating" | "awaiting_confirmation" | "executing" | "completed" | "failed"; message: string }
export interface ToolResultEvent { type: "tool_result"; callId: string; result: ToolResultDto }
export type ToolExecutionEvent = ToolProgressEvent | ToolResultEvent;

export interface ToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: z.ZodType;
  permission: ToolPermission;
  destructive: boolean;
  execute(input: unknown): Promise<unknown>;
}
