import type { CopilotResponse } from "@/services/copilot/ResponseParser";
import type { CopilotRole } from "@/services/copilot/types";

export interface ConversationMessage {
  id: string;
  role: CopilotRole;
  content: string;
  response: CopilotResponse | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  assetIds: string[];
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

