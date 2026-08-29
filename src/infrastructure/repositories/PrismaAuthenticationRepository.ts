import "server-only";
import { prisma } from "@/lib/prisma";
import type { AuthenticationRepository } from "@/repositories/AuthenticationRepository";

const includeUser = { role: { include: { permissions: { include: { permission: true } } } } } as const;
interface UserRow { id: string; fullName: string; email: string; active: boolean; role: null | { id: string; name: string; description: string | null; permissions: Array<{ permission: { id: string; code: string; name: string; description: string | null } }> } }
function mapUser(user: UserRow) { return { id: user.id, fullName: user.fullName, email: user.email, active: user.active, role: user.role ? { id: user.role.id, name: user.role.name, description: user.role.description, permissions: user.role.permissions.map((entry) => entry.permission) } : null }; }

export class PrismaAuthenticationRepository implements AuthenticationRepository {
  async findUserByEmail(email: string) { const user = await prisma.user.findUnique({ where: { email }, include: includeUser }); return user ? { ...mapUser(user), passwordHash: user.passwordHash } : null; }
  async findUserById(id: string) { const user = await prisma.user.findUnique({ where: { id }, include: includeUser }); return user ? mapUser(user) : null; }
  async listUsers() { return (await prisma.user.findMany({ include: includeUser, orderBy: { fullName: "asc" } })).map(mapUser); }
  async createUser(input: Parameters<AuthenticationRepository["createUser"]>[0]) { const user = await prisma.user.create({ data: input, include: includeUser }); return mapUser(user); }
  async assignRole(userId: string, roleId: string | null) { const user = await prisma.user.update({ where: { id: userId }, data: { roleId }, include: includeUser }); return mapUser(user); }
  async createSession(userId: string, tokenHash: string, expiresAt: Date) { const session = await prisma.session.create({ data: { userId, tokenHash, expiresAt }, include: { user: { include: includeUser } } }); return { id: session.id, user: mapUser(session.user), expiresAt: session.expiresAt, lastSeenAt: session.lastSeenAt }; }
  async findSession(tokenHash: string) { const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: { include: includeUser } } }); if (!session || session.revokedAt) return null; return { id: session.id, user: mapUser(session.user), expiresAt: session.expiresAt, lastSeenAt: session.lastSeenAt }; }
  async touchSession(id: string, at: Date) { await prisma.session.update({ where: { id }, data: { lastSeenAt: at } }); }
  async revokeSession(tokenHash: string, at: Date) { await prisma.session.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: at } }); }
  async revokeUserSessions(userId: string, at: Date) { return (await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: at } })).count; }
}
