import type { AssetOperationsRepository } from "@/repositories/AssetOperationsRepository";

export class MaintenanceService {
  constructor(private readonly assets: AssetOperationsRepository) {}
  create(input: { assetId: string; maintenanceType: string; performedBy: string; notes?: string; maintenanceDate?: string }) {
    return this.assets.createMaintenance({ ...input, maintenanceDate: input.maintenanceDate ? new Date(input.maintenanceDate) : new Date() });
  }
}

