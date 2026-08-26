import { describe, expect, it, vi } from "vitest";
import type { Conversation } from "@/domain/entities/Conversation";
import type { ConversationRepository } from "@/repositories/ConversationRepository";
import { ConversationNotFoundError, ConversationService } from "@/services/copilot/ConversationService";
import type { CopilotResponse } from "@/services/copilot/ResponseParser";

const response: CopilotResponse = { answer: "**Inspect** the bearing.", severity: "high", recommendations: ["Inspect bearing"], evidence: [], followUpQuestions: [], toolCalls: [] };

function memoryRepository(): ConversationRepository {
  let value: Conversation | null = null;
  return {
    create: vi.fn(async (assetIds, title = "Conversation") => value = { id: "c1", title, assetIds, messages: [], createdAt: new Date(), updatedAt: new Date() }),
    findById: vi.fn(async (id) => value?.id === id ? value : null),
    updateAssetIds: vi.fn(async (_id, assetIds) => { if (value) value.assetIds = assetIds; }),
    addMessage: vi.fn(async (_id, role, content, structured) => {
      const message = { id: `m${(value?.messages.length ?? 0) + 1}`, role, content, response: structured ?? null, createdAt: new Date() };
      value?.messages.push(message); return message;
    }),
  };
}

describe("ConversationService", () => {
  it("persists both sides and emits a streamed completion", async () => {
    const repository = memoryRepository();
    const responder = { chat: vi.fn().mockResolvedValue(response) };
    const events = [];
    for await (const event of new ConversationService(repository, responder).stream({ action: "chat", message: "Check the bearing", assetIds: ["MM-000001"], confirmations: [] })) events.push(event);
    expect(events[0]).toEqual({ type: "conversation", conversationId: "c1" });
    expect(events.filter((event) => event.type === "delta").map((event) => event.content).join("")).toBe(response.answer);
    expect(events.at(-1)).toMatchObject({ type: "complete", response });
    expect(repository.addMessage).toHaveBeenCalledTimes(2);
  });

  it("rejects loading an unknown conversation", async () => {
    await expect(new ConversationService(memoryRepository(), { chat: vi.fn() }).load("missing")).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("executes planned tools and streams their progress before the final answer", async () => {
    const planned: CopilotResponse = { ...response, answer: "Checking live health.", toolCalls: [{ id: "t1", name: "getAssetHealth", arguments: { assetId: "MM-000001" } }] };
    const final: CopilotResponse = { ...response, answer: "Health is stable.", toolCalls: [] };
    const responder = { chat: vi.fn().mockResolvedValueOnce(planned).mockResolvedValueOnce(final) };
    const tools = { execute: vi.fn(async function* () { yield { type: "tool_progress" as const, callId: "t1", tool: "getAssetHealth" as const, stage: "executing" as const, message: "Executing." }; yield { type: "tool_result" as const, callId: "t1", result: { tool: "getAssetHealth" as const, status: "success" as const, data: { overallHealth: 80 }, message: "Completed." } }; }) };
    const events = [];
    for await (const event of new ConversationService(memoryRepository(), responder, tools).stream({ action: "chat", message: "Check health", assetIds: ["MM-000001"], confirmations: [] })) events.push(event);
    expect(events.some((event) => event.type === "tool_progress")).toBe(true);
    expect(events.some((event) => event.type === "tool_result")).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: "complete", response: { answer: "Health is stable." } });
    expect(responder.chat).toHaveBeenCalledTimes(2);
  });
});
