import { describe, expect, it, vi } from "vitest";
import { AuthenticationError, AuthenticationService, hashPassword, hashSessionToken, verifyPassword } from "@/services/AuthenticationService";
import type { AuthenticationRepository } from "@/repositories/AuthenticationRepository";

const role = { id: "r1", name: "Engineer", description: null, permissions: [{ id: "p1", code: "assets:read", name: "Read assets", description: null }] };
function repository(): AuthenticationRepository { const user = { id: "u1", fullName: "Alex Morgan", email: "alex@example.com", active: true, role, passwordHash: hashPassword("StrongPass1!") }; return { findUserByEmail: vi.fn(async () => user), findUserById: vi.fn(async () => user), createUser: vi.fn(async (input) => ({ ...user, ...input })), assignRole: vi.fn(async () => user), createSession: vi.fn(async (_userId, _tokenHash, expiresAt) => ({ id: "s1", user, expiresAt, lastSeenAt: new Date() })), findSession: vi.fn(async () => ({ id: "s1", user, expiresAt: new Date(Date.now() + 60_000), lastSeenAt: new Date() })), touchSession: vi.fn(async () => undefined), revokeSession: vi.fn(async () => undefined) }; }

describe("AuthenticationService", () => {
  it("hashes passwords with a random salt and verifies them", () => { const hash = hashPassword("StrongPass1!"); expect(hash).not.toContain("StrongPass1!"); expect(verifyPassword("StrongPass1!", hash)).toBe(true); expect(verifyPassword("wrong", hash)).toBe(false); });
  it("creates a persisted opaque session for valid credentials", async () => { const repo = repository(); const result = await new AuthenticationService(repo).login({ email: "ALEX@example.com", password: "StrongPass1!" }); expect(result.user.id).toBe("u1"); expect(result.token).toBeTruthy(); expect(repo.createSession).toHaveBeenCalledWith("u1", hashSessionToken(result.token), expect.any(Date)); });
  it("rejects invalid credentials", async () => { const repo = repository(); vi.mocked(repo.findUserByEmail).mockResolvedValue(null); await expect(new AuthenticationService(repo).login({ email: "none@example.com", password: "StrongPass1!" })).rejects.toBeInstanceOf(AuthenticationError); });
  it("rejects expired sessions", async () => { const repo = repository(); vi.mocked(repo.findSession).mockResolvedValue({ id: "s1", user: (await repo.findUserByEmail("x"))!, expiresAt: new Date(Date.now() - 1), lastSeenAt: new Date() }); expect(await new AuthenticationService(repo).authenticate("token")).toBeNull(); });
});

