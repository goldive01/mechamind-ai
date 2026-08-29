import "server-only";
import { prisma } from "@/lib/prisma";
import type { AreaRepository } from "@/repositories/AreaRepository";
export class PrismaAreaRepository implements AreaRepository {
  async create(input: Parameters<AreaRepository["create"]>[0]) { const { organisationId, ...data } = input; const building = await prisma.building.findFirst({ where: { id: data.buildingId, site: { organisationId } }, select: { id: true } }); if (!building) throw new Error("Building not found in organisation."); return prisma.area.create({ data }); }
  async update(input: Parameters<AreaRepository["update"]>[0]) { const { id, organisationId, ...data } = input; const area = await this.findById(organisationId, id); if (!area) throw new Error("Area not found in organisation."); return prisma.area.update({ where: { id }, data }); }
  list(organisationId: string, buildingId?: string) { return prisma.area.findMany({ where: { building: { site: { organisationId } }, ...(buildingId ? { buildingId } : {}) }, orderBy: { name: "asc" } }); }
  findById(organisationId: string, id: string) { return prisma.area.findFirst({ where: { id, building: { site: { organisationId } } } }); }
}
