import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConfirmationService } from "@/services/copilot/tools/ConfirmationService";
import { ToolExecutor } from "@/services/copilot/tools/ToolExecutor";
import { ToolRegistry } from "@/services/copilot/tools/ToolRegistry";
import type { ToolExecutionEvent, ToolPrincipal } from "@/services/copilot/tools/types";

const reader: ToolPrincipal = { id: "reader", permissions: ["assets:read"] };
const writer: ToolPrincipal = { id: "writer", permissions: ["assets:read", "maintenance:write"] };
const collect = async (events: AsyncGenerator<ToolExecutionEvent>) => { const values: ToolExecutionEvent[] = []; for await (const event of events) values.push(event); return values; };

describe("ToolExecutor", () => {
  it("validates arguments before executing", async () => {
    const execute = vi.fn();
    const executor = new ToolExecutor(new ToolRegistry([{ name: "getAssetHealth", description: "health", inputSchema: z.object({ assetId: z.string().regex(/^MM-\d{6}$/) }), permission: "assets:read", destructive: false, execute }]));
    const events = await collect(executor.execute({ id: "call-1", name: "getAssetHealth", arguments: { assetId: "bad" } }, reader));
    expect(events.at(-1)).toMatchObject({ type: "tool_result", result: { status: "invalid" } });
    expect(execute).not.toHaveBeenCalled();
  });

  it("enforces permissions", async () => {
    const execute = vi.fn();
    const executor = new ToolExecutor(new ToolRegistry([{ name: "createMaintenance", description: "create", inputSchema: z.object({ assetId: z.string() }), permission: "maintenance:write", destructive: true, execute }]));
    const events = await collect(executor.execute({ id: "call-2", name: "createMaintenance", arguments: { assetId: "MM-000001" } }, reader));
    expect(events.at(-1)).toMatchObject({ type: "tool_result", result: { status: "forbidden" } });
  });

  it("requires and verifies confirmation before a destructive action", async () => {
    const execute = vi.fn().mockResolvedValue({ id: "maintenance-1" });
    const confirmations = new ConfirmationService("test-secret");
    const executor = new ToolExecutor(new ToolRegistry([{ name: "createMaintenance", description: "create", inputSchema: z.object({ assetId: z.string() }), permission: "maintenance:write", destructive: true, execute }]), undefined, confirmations);
    const request = { id: "call-3", name: "createMaintenance" as const, arguments: { assetId: "MM-000001" } };
    const pending = await collect(executor.execute(request, writer));
    const resultEvent = pending.find((event) => event.type === "tool_result");
    expect(resultEvent).toMatchObject({ result: { status: "confirmation_required" } });
    expect(execute).not.toHaveBeenCalled();
    if (!resultEvent || resultEvent.type !== "tool_result" || resultEvent.result.status !== "confirmation_required") throw new Error("Expected confirmation token");
    const completed = await collect(executor.execute({ ...request, confirmationToken: resultEvent.result.confirmationToken }, writer));
    expect(completed.at(-1)).toMatchObject({ type: "tool_result", result: { status: "success", data: { id: "maintenance-1" } } });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("streams validation, execution, and completion progress", async () => {
    const executor = new ToolExecutor(new ToolRegistry([{ name: "searchAssets", description: "search", inputSchema: z.object({ query: z.string() }), permission: "assets:read", destructive: false, execute: vi.fn().mockResolvedValue([]) }]));
    const events = await collect(executor.execute({ id: "call-4", name: "searchAssets", arguments: { query: "pump" } }, reader));
    expect(events.filter((event) => event.type === "tool_progress").map((event) => event.stage)).toEqual(["validating", "executing", "completed"]);
  });
});

