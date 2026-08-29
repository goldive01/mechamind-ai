import "server-only";
import { prisma } from "@/lib/prisma";
import type { BuildingRepository } from "@/repositories/BuildingRepository";
export class PrismaBuildingRepository implements BuildingRepository {
  async create(input: Parameters<BuildingRepository["create"]>[0]) { const { organisationId, ...data } = input; const site = await prisma.site.findFirst({ where: { id: data.siteId, organisationId }, select: { id: true } }); if (!site) throw new Error("Site not found in organisation."); return prisma.building.create({ data }); }
  async update(input: Parameters<BuildingRepository["update"]>[0]) { const { id, organisationId, ...data } = input; const building = await this.findById(organisationId, id); if (!building) throw new Error("Building not found in organisation."); return prisma.building.update({ where: { id }, data }); }
  list(organisationId: string, siteId?: string) { return prisma.building.findMany({ where: { site: { organisationId }, ...(siteId ? { siteId } : {}) }, orderBy: { name: "asc" } }); }
  findById(organisationId: string, id: string) { return prisma.building.findFirst({ where: { id, site: { organisationId } } }); }
}
