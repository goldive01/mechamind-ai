import { describe, expect, it, vi } from "vitest";
import { BuildingService } from "@/services/BuildingService";
import type { BuildingRepository } from "@/repositories/BuildingRepository";
describe("organisation location services", () => { it("passes organisation scope to building reads", async () => { const repository = { list: vi.fn().mockResolvedValue([]) } as unknown as BuildingRepository; await new BuildingService(repository).list("org-1", "site-1"); expect(repository.list).toHaveBeenCalledWith("org-1", "site-1"); }); });
