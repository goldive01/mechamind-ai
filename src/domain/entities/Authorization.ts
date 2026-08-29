export interface Permission { id: string; code: string; name: string; description: string | null }
export interface Role { id: string; name: string; description: string | null; permissions: Permission[] }
export interface AuthUser { id: string; fullName: string; email: string; active: boolean; role: Role | null }
export interface AuthSession { id: string; user: AuthUser; expiresAt: Date; lastSeenAt: Date }
export interface AuditEvent { userId?: string | null; action: string; resource: string; resourceId?: string | null; outcome?: "SUCCESS" | "DENIED" | "FAILURE"; metadata?: Record<string, unknown>; ipAddress?: string | null; userAgent?: string | null }

