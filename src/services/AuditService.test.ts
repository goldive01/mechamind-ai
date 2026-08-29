import { describe, expect, it, vi } from "vitest";
import type { AuditRepository } from "@/repositories/AuditRepository";
import { AuditService } from "@/services/AuditService";
describe("AuditService", () => { it("validates and records structured security events", async () => { const repository = { create: vi.fn(async (event) => ({ ...event, id: "audit-1", createdAt: new Date() })), list: vi.fn(async () => []) } as AuditRepository; const record = await new AuditService(repository).record({ userId: "user-1", action: "AUTH_LOGIN", resource: "Session", metadata: { method: "password" } }); expect(record.id).toBe("audit-1"); expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ outcome: "SUCCESS" })); }); });
