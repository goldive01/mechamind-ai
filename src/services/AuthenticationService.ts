import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { createUserDtoSchema, loginDtoSchema } from "@/dto/auth.dto";
import type { AuthenticationRepository } from "@/repositories/AuthenticationRepository";
import type { AuditService } from "@/services/AuditService";

const ITERATIONS = 210_000;
export class AuthenticationError extends Error {}
export const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex"); return `pbkdf2-sha256$${ITERATIONS}$${salt}$${hash}`; }
export function verifyPassword(password: string, encoded: string) { const [algorithm, iterations, salt, expected] = encoded.split("$"); if (algorithm !== "pbkdf2-sha256" || !iterations || !salt || !expected) return false; const actual = pbkdf2Sync(password, salt, Number(iterations), 32, "sha256"); const expectedBuffer = Buffer.from(expected, "hex"); return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer); }

export class AuthenticationService {
  constructor(private readonly repository: AuthenticationRepository, private readonly audit?: AuditService, private readonly sessionLifetimeMs = 8 * 60 * 60 * 1000) {}
  async register(value: unknown) { const input = createUserDtoSchema.parse(value); return this.repository.createUser({ fullName: input.fullName, email: input.email, roleId: input.roleId, active: input.active, passwordHash: hashPassword(input.password) }); }
  listUsers() { return this.repository.listUsers(); }
  async login(value: unknown) { const input = loginDtoSchema.parse(value); const user = await this.repository.findUserByEmail(input.email); if (!user || !user.active || !verifyPassword(input.password, user.passwordHash)) { await this.audit?.record({ action: "AUTH_LOGIN", resource: "Session", outcome: "FAILURE", metadata: { email: input.email } }); throw new AuthenticationError("Invalid email or password."); } const token = randomBytes(32).toString("base64url"); const expiresAt = new Date(Date.now() + this.sessionLifetimeMs); const session = await this.repository.createSession(user.id, hashSessionToken(token), expiresAt); await this.audit?.record({ userId: user.id, action: "AUTH_LOGIN", resource: "Session", resourceId: session.id }); return { token, expiresAt, user: session.user }; }
  async authenticate(token: string | undefined) { if (!token) return null; const session = await this.repository.findSession(hashSessionToken(token)); if (!session || session.expiresAt.getTime() <= Date.now() || !session.user.active) return null; await this.repository.touchSession(session.id, new Date()); return session; }
  async logout(token: string | undefined) { if (!token) return; const session = await this.authenticate(token); await this.repository.revokeSession(hashSessionToken(token), new Date()); await this.audit?.record({ userId: session?.user.id, action: "AUTH_LOGOUT", resource: "Session", resourceId: session?.id }); }
}
