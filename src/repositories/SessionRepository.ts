import type { AuthSession } from "@/domain/entities/Authorization";

export interface SessionRepository {
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<AuthSession>;
  findSession(tokenHash: string): Promise<AuthSession | null>;
  touchSession(id: string, at: Date): Promise<void>;
  revokeSession(tokenHash: string, at: Date): Promise<void>;
  revokeUserSessions(userId: string, at: Date): Promise<number>;
}
