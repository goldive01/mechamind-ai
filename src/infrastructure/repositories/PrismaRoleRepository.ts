import "server-only";
import { prisma } from "@/lib/prisma";
import type { RoleRepository } from "@/repositories/RoleRepository";
const include = { permissions: { include: { permission: true } } } as const;
interface RoleRow { id: string; name: string; description: string | null; permissions: Array<{ permission: { id: string; code: string; name: string; description: string | null } }> }
const map = (role: RoleRow) => ({ id: role.id, name: role.name, description: role.description, permissions: role.permissions.map((entry) => entry.permission) });
export class PrismaRoleRepository implements RoleRepository {
  async create(input: Parameters<RoleRepository["create"]>[0]) { return map(await prisma.role.create({ data: input, include })); }
  async update({ id, ...input }: Parameters<RoleRepository["update"]>[0]) { return map(await prisma.role.update({ where: { id }, data: input, include })); }
  async findById(id: string) { const role = await prisma.role.findUnique({ where: { id }, include }); return role ? map(role) : null; }
  async list() { return (await prisma.role.findMany({ include, orderBy: { name: "asc" } })).map(map); }
  async grantPermission(roleId: string, permissionId: string) { await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId, permissionId } }, create: { roleId, permissionId }, update: {} }); return map(await prisma.role.findUniqueOrThrow({ where: { id: roleId }, include })); }
  async revokePermission(roleId: string, permissionId: string) { await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } }); return map(await prisma.role.findUniqueOrThrow({ where: { id: roleId }, include })); }
}
