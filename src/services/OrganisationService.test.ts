import { describe, expect, it, vi } from "vitest";
import { OrganisationService } from "@/services/OrganisationService";
import type { OrganisationRepository } from "@/repositories/OrganisationRepository";
const organisation = { id: "org-1", slug: "north-plant", name: "North Plant", description: null, active: true, createdAt: new Date(), updatedAt: new Date() };
describe("OrganisationService", () => {
  it("lists only through the user-scoped repository method", async () => { const repository = { listForUser: vi.fn().mockResolvedValue([organisation]) } as unknown as OrganisationRepository; const result = await new OrganisationService(repository).listForUser("user-1"); expect(repository.listForUser).toHaveBeenCalledWith("user-1"); expect(result).toEqual([organisation]); });
  it("validates create input before persistence", () => { const repository = { create: vi.fn() } as unknown as OrganisationRepository; expect(() => new OrganisationService(repository).create({ slug: "Invalid Slug", name: "North Plant" })).toThrow(); expect(repository.create).not.toHaveBeenCalled(); });
});
