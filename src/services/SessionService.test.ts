import { describe, expect, it, vi } from "vitest";
import type { SessionRepository } from "@/repositories/SessionRepository";
import { hashSessionToken } from "@/services/AuthenticationService";
import { SessionService } from "@/services/SessionService";

const user = { id: "u1", fullName: "Alex", email: "alex@example.com", active: true, role: null };
function repository(): SessionRepository { return { createSession: vi.fn(), findSession: vi.fn(async () => ({ id: "s1", user, expiresAt: new Date(Date.now() + 60_000), lastSeenAt: new Date() })), touchSession: vi.fn(async () => undefined), revokeSession: vi.fn(async () => undefined), revokeUserSessions: vi.fn(async () => 1) }; }

describe("SessionService", () => {
  it("validates and touches active sessions", async () => { const repo = repository(); expect((await new SessionService(repo).validate("opaque-token"))?.id).toBe("s1"); expect(repo.findSession).toHaveBeenCalledWith(hashSessionToken("opaque-token")); expect(repo.touchSession).toHaveBeenCalled(); });
  it("rejects expired sessions", async () => { const repo = repository(); vi.mocked(repo.findSession).mockResolvedValue({ id: "s1", user, expiresAt: new Date(0), lastSeenAt: new Date() }); expect(await new SessionService(repo).validate("opaque-token")).toBeNull(); });
  it("revokes every session for a user", async () => { const repo = repository(); expect(await new SessionService(repo).revokeAllForUser("u1")).toBe(1); });
});
