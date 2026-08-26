import { z } from "zod";

const assetIds = z.array(z.string().trim().regex(/^MM-\d{6}$/)).max(8).default([]);
export const copilotChatDtoSchema = z.object({ action: z.literal("chat").default("chat"), conversationId: z.string().trim().min(1).optional(), message: z.string().trim().min(1).max(8_000), assetIds, confirmations: z.array(z.object({ tool: z.string(), token: z.string().min(1) })).max(6).default([]) }).strict();
export const copilotLoadDtoSchema = z.object({ action: z.literal("load"), conversationId: z.string().trim().min(1) }).strict();
export const copilotLegacyDtoSchema = z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(8_000) })).min(1).max(20), assetIds }).strict().refine((value) => value.messages.at(-1)?.role === "user", { message: "The latest message must be from the user.", path: ["messages"] });
export const copilotRequestDtoSchema = z.union([copilotChatDtoSchema, copilotLoadDtoSchema, copilotLegacyDtoSchema]);
export type CopilotChatDto = z.infer<typeof copilotChatDtoSchema>;
