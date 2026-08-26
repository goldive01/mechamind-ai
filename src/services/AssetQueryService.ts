import type { AssetOperationsRepository } from "@/repositories/AssetOperationsRepository";
import { HealthEngine } from "@/services/HealthEngine";
import type { AlertMonitor } from "@/services/AlertEvaluationService";
import { createLogger } from "@/infrastructure/logging/Logger";

const logger = createLogger("AssetQueryService");

export class AssetQueryService {
  constructor(private readonly assets: AssetOperationsRepository, private readonly health = new HealthEngine(), private readonly alerts?: AlertMonitor) {}
  search(query: string, limit = 10) { return this.assets.search(query.trim(), Math.min(Math.max(limit, 1), 25)); }
  async getHealth(assetId: string) {
    const data = await this.assets.getHealthData(assetId);
    if (!data) return null;
    const result = { asset: data.asset, health: this.health.calculate(data.inspections, data.maintenance, data.asset.createdAt, data.readings) };
    try { await this.alerts?.evaluateAsset(assetId, "Health Recalculation"); } catch (error) { logger.error("Automatic alert evaluation failed", error, { assetId }); }
    return result;
  }
  async compare(assetIds: string[]) {
    const rows = (await Promise.all([...new Set(assetIds)].map((id) => this.getHealth(id)))).filter((item): item is NonNullable<typeof item> => item !== null);
    return rows.toSorted((a, b) => b.health.failureProbability - a.health.failureProbability);
  }
  async calculate(assetId: string) { return this.getHealth(assetId); }
}
