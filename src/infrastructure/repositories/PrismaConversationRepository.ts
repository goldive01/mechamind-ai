import "server-only";
import { prisma } from "@/lib/prisma";
import type { ConversationRepository } from "@/repositories/ConversationRepository";
import { copilotResponseSchema, type CopilotResponse } from "@/services/copilot/ResponseParser";
import type { CopilotRole } from "@/services/copilot/types";
import type { Prisma } from "@/generated/prisma/client";

const parseJsonArray = (value: string): string[] => {
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
};
const parseResponse = (value: string | null): CopilotResponse | null => {
  if (!value) return null;
  try { return copilotResponseSchema.parse(JSON.parse(value)); } catch { return null; }
};

type RecordWithMessages = Prisma.CopilotConversationGetPayload<{ include: { messages: true } }>;

function toDomain(record: RecordWithMessages) {
  return { id: record.id, title: record.title, assetIds: parseJsonArray(record.assetIds), createdAt: record.createdAt, updatedAt: record.updatedAt, messages: record.messages.map((message) => ({ id: message.id, role: message.role as CopilotRole, content: message.content, response: parseResponse(message.responseJson), createdAt: message.createdAt })) };
}

export class PrismaConversationRepository implements ConversationRepository {
  async create(assetIds: string[], title = "Engineering conversation") {
    const record = await prisma.copilotConversation.create({ data: { title, assetIds: JSON.stringify(assetIds) }, include: { messages: { orderBy: { createdAt: "asc" } } } });
    return toDomain(record);
  }
  async findById(id: string) {
    const record = await prisma.copilotConversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
    return record ? toDomain(record) : null;
  }
  async updateAssetIds(id: string, assetIds: string[]) { await prisma.copilotConversation.update({ where: { id }, data: { assetIds: JSON.stringify(assetIds) } }); }
  async addMessage(conversationId: string, role: CopilotRole, content: string, response?: CopilotResponse) {
    const message = await prisma.copilotConversationMessage.create({ data: { conversationId, role, content, responseJson: response ? JSON.stringify(response) : undefined } });
    return { id: message.id, role, content: message.content, response: parseResponse(message.responseJson), createdAt: message.createdAt };
  }
}
