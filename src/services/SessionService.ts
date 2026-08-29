import type { SessionRepository } from "@/repositories/SessionRepository";
import { hashSessionToken } from "@/services/AuthenticationService";

export class SessionService {
  constructor(private readonly sessions: SessionRepository) {}

  async validate(token: string | undefined) {
    if (!token) return null;
    const session = await this.sessions.findSession(hashSessionToken(token));
    if (!session || !session.user.active || session.expiresAt.getTime() <= Date.now()) return null;
    await this.sessions.touchSession(session.id, new Date());
    return session;
  }

  revoke(token: string, at = new Date()) {
    return this.sessions.revokeSession(hashSessionToken(token), at);
  }

  revokeAllForUser(userId: string, at = new Date()) {
    return this.sessions.revokeUserSessions(userId, at);
  }
}
