import type { Conversation, ConversationMessage } from "@/domain/entities/Conversation";
import type { CopilotResponse } from "@/services/copilot/ResponseParser";
import type { CopilotRole } from "@/services/copilot/types";

export interface ConversationRepository {
  create(assetIds: string[], title?: string): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  updateAssetIds(id: string, assetIds: string[]): Promise<void>;
  addMessage(conversationId: string, role: CopilotRole, content: string, response?: CopilotResponse): Promise<ConversationMessage>;
}

