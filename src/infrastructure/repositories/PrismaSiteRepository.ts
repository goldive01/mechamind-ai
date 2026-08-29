import "server-only";
import { prisma } from "@/lib/prisma";
import type { SiteRepository } from "@/repositories/SiteRepository";
export class PrismaSiteRepository implements SiteRepository {
  create(input: Parameters<SiteRepository["create"]>[0]) { return prisma.site.create({ data: input }); }
  async update(input: Parameters<SiteRepository["update"]>[0]) { const { id, organisationId, ...data } = input; const result = await prisma.site.updateMany({ where: { id, organisationId }, data }); if (!result.count) throw new Error("Site not found in organisation."); return (await this.findById(organisationId, id))!; }
  list(organisationId: string) { return prisma.site.findMany({ where: { organisationId }, orderBy: { name: "asc" } }); }
  findById(organisationId: string, id: string) { return prisma.site.findFirst({ where: { id, organisationId } }); }
}
