import { describe, expect, it, vi } from "vitest";
import type { AssetInputDto } from "@/dto/asset.dto";
import type { AssetRepository } from "@/repositories/AssetRepository";
import { AssetService } from "@/services/AssetService";

const input: AssetInputDto = { name: "Pump", manufacturer: "Mecha", model: "P1", serialNumber: "SN-1", category: "Hydraulic", status: "Active" };

describe("AssetService", () => {
  it("delegates asset creation to its repository", async () => {
    const repository: AssetRepository = { create: vi.fn().mockResolvedValue({ assetId: "MM-000001" }), update: vi.fn() };
    await expect(new AssetService(repository).create(input)).resolves.toEqual({ assetId: "MM-000001" });
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it("rejects an empty asset id before updating", async () => {
    const repository: AssetRepository = { create: vi.fn(), update: vi.fn() };
    await expect(new AssetService(repository).update(" ", input)).rejects.toThrow("Asset id is required");
    expect(repository.update).not.toHaveBeenCalled();
  });
});

