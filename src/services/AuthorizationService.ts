import type { AuthSession, AuthUser } from "@/domain/entities/Authorization";
import type { AuditService } from "@/services/AuditService";
export class AuthorizationError extends Error {}
export class AuthorizationService {
  constructor(private readonly audit?: AuditService) {}
  permissions(user: AuthUser) { return user.role?.permissions.map((permission) => permission.code) ?? []; }
  can(user: AuthUser, permission: string) { const permissions = this.permissions(user); return permissions.includes("system:admin") || permissions.includes(permission); }
  async require(session: AuthSession | null, permission: string, resource = "Application") { if (session && this.can(session.user, permission)) return session.user; await this.audit?.record({ userId: session?.user.id, action: "AUTHORIZATION", resource, outcome: "DENIED", metadata: { permission } }); throw new AuthorizationError(`Permission ${permission} is required.`); }
}

