import "server-only";
import { prisma } from "@/lib/prisma";
import type { PermissionRepository } from "@/repositories/PermissionRepository";
export class PrismaPermissionRepository implements PermissionRepository {
  create(input: Parameters<PermissionRepository["create"]>[0]) { return prisma.permission.create({ data: input }); }
  update({ id, ...input }: Parameters<PermissionRepository["update"]>[0]) { return prisma.permission.update({ where: { id }, data: input }); }
  findByCode(code: string) { return prisma.permission.findUnique({ where: { code } }); }
  list() { return prisma.permission.findMany({ orderBy: { code: "asc" } }); }
}

