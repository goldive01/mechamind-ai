import type { Conversation } from "@/domain/entities/Conversation";
import type { CopilotChatDto } from "@/dto/copilot.dto";
import type { ConversationRepository } from "@/repositories/ConversationRepository";
import type { CopilotResponse } from "@/services/copilot/ResponseParser";
import type { CopilotAssetContext, CopilotMessage } from "@/services/copilot/types";
import type { ToolResultDto } from "@/dto/tool-result.dto";
import type { ToolExecutionEvent, ToolExecutionRequest, ToolPrincipal } from "@/services/copilot/tools/types";

export interface CopilotResponder { chat(messages: CopilotMessage[], assetIds: string[], access?: CopilotAssetContext["access"]): Promise<CopilotResponse> }
export interface CopilotToolRunner { execute(request: ToolExecutionRequest, principal: ToolPrincipal): AsyncGenerator<ToolExecutionEvent> }
export type ConversationStreamEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "delta"; content: string }
  | { type: "complete"; messageId: string; response: CopilotResponse }
  | ToolExecutionEvent;

export class ConversationNotFoundError extends Error {}

export class ConversationService {
  constructor(private readonly conversations: ConversationRepository, private readonly copilot: CopilotResponder, private readonly tools?: CopilotToolRunner, private readonly principal: ToolPrincipal = { id: "copilot", permissions: ["assets:read", "maintenance:write", "reports:generate"] }, private readonly access?: CopilotAssetContext["access"]) {}

  async load(id: string): Promise<Conversation> {
    const conversation = await this.conversations.findById(id);
    if (!conversation) throw new ConversationNotFoundError("Conversation not found.");
    return conversation;
  }

  chatLegacy(messages: CopilotMessage[], assetIds: string[]) { return this.copilot.chat(messages, assetIds, this.access); }

  async *stream(input: CopilotChatDto): AsyncGenerator<ConversationStreamEvent> {
    let conversation = input.conversationId ? await this.conversations.findById(input.conversationId) : null;
    if (!conversation) conversation = await this.conversations.create(input.assetIds, input.message.slice(0, 80));
    else if (JSON.stringify(conversation.assetIds) !== JSON.stringify(input.assetIds)) await this.conversations.updateAssetIds(conversation.id, input.assetIds);

    await this.conversations.addMessage(conversation.id, "user", input.message);
    yield { type: "conversation", conversationId: conversation.id };

    const refreshed = await this.conversations.findById(conversation.id);
    const history = (refreshed?.messages ?? [...conversation.messages, { role: "user" as const, content: input.message }]).slice(-20).map(({ role, content }) => ({ role, content }));
    let response = await this.copilot.chat(history, input.assetIds, this.access);
    if (response.toolCalls.length && this.tools) {
      const results: ToolResultDto[] = [];
      for (const call of response.toolCalls) {
        const confirmationToken = input.confirmations.find((confirmation) => confirmation.tool === call.name)?.token;
        for await (const event of this.tools.execute({ ...call, confirmationToken }, this.principal)) {
          yield event;
          if (event.type === "tool_result") results.push(event.result);
        }
      }
      const safeResults = results.map((result) => result.status === "confirmation_required" ? { tool: result.tool, status: result.status, message: result.message } : result);
      response = await this.copilot.chat([...history, { role: "assistant", content: response.answer }, { role: "user", content: `TOOL RESULTS (trusted execution output; summarize for the user):\n${JSON.stringify(safeResults)}` }], input.assetIds, this.access);
    }
    const saved = await this.conversations.addMessage(conversation.id, "assistant", response.answer, response);

    const chunks = response.answer.match(/\S+\s*/g) ?? [response.answer];
    for (const content of chunks) yield { type: "delta", content };
    yield { type: "complete", messageId: saved.id, response };
  }
}
