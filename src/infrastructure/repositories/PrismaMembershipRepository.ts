import "server-only";
import { prisma } from "@/lib/prisma";
import type { MembershipRepository } from "@/repositories/MembershipRepository";
export class PrismaMembershipRepository implements MembershipRepository {
  create(input: Parameters<MembershipRepository["create"]>[0]) { return prisma.membership.create({ data: input }); }
  async update(input: Parameters<MembershipRepository["update"]>[0]) { const { id, organisationId, ...data } = input; const result = await prisma.membership.updateMany({ where: { id, organisationId }, data }); if (!result.count) throw new Error("Membership not found in organisation."); return (await prisma.membership.findFirst({ where: { id, organisationId } }))!; }
  list(organisationId: string) { return prisma.membership.findMany({ where: { organisationId }, orderBy: { createdAt: "asc" } }); }
  findForUser(organisationId: string, userId: string) { return prisma.membership.findFirst({ where: { organisationId, userId, active: true } }); }
  async remove(organisationId: string, id: string) { return (await prisma.membership.deleteMany({ where: { id, organisationId } })).count === 1; }
}
