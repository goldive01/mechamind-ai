import "server-only";
import { prisma } from "@/lib/prisma";
import type { OrganisationRepository } from "@/repositories/OrganisationRepository";
export class PrismaOrganisationRepository implements OrganisationRepository {
  create(input: Parameters<OrganisationRepository["create"]>[0]) { return prisma.organisation.create({ data: input }); }
  async update(input: Parameters<OrganisationRepository["update"]>[0]) { const { id, ...data } = input; return prisma.organisation.update({ where: { id }, data }); }
  listForUser(userId: string) { return prisma.organisation.findMany({ where: { active: true, memberships: { some: { userId, active: true } } }, orderBy: { name: "asc" } }); }
  findById(id: string, userId: string) { return prisma.organisation.findFirst({ where: { id, memberships: { some: { userId, active: true } } } }); }
}
