import { beforeEach, describe, expect, it, vi } from "vitest";

const { alert, asset } = vi.hoisted(() => ({
  alert: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  asset: { findUniqueOrThrow: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { alert, asset } }));

import { PrismaAlertRepository } from "@/infrastructure/repositories/PrismaAlertRepository";

const now = new Date("2026-08-26T09:00:00Z");
const row = {
  id: "alert-1", assetId: "asset-db-1", fingerprint: "manual:MM-000001:1", severity: "High", category: "Engineering", status: "Open", source: "Health", metric: "health_trend", title: "Bearing risk", description: "Risk increased", recommendation: "Inspect bearing", triggerType: null, triggerId: null, observedValue: null, thresholdValue: null, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null, createdAt: now, updatedAt: now,
  asset: { assetId: "MM-000001", equipment: { name: "Pump" } },
};

describe("PrismaAlertRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an alert by resolving the public asset identifier", async () => {
    asset.findUniqueOrThrow.mockResolvedValue({ id: "asset-db-1" });
    alert.create.mockResolvedValue(row);
    const result = await new PrismaAlertRepository().create({ assetId: "MM-000001", severity: "High", category: "Engineering", source: "Health", title: "Bearing risk", description: "Risk increased", recommendation: "Inspect bearing" });
    expect(asset.findUniqueOrThrow).toHaveBeenCalledWith({ where: { assetId: "MM-000001" }, select: { id: true } });
    expect(alert.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ assetId: "asset-db-1", severity: "High" }) }));
    expect(result).toMatchObject({ id: "alert-1", assetId: "MM-000001", assetName: "Pump" });
  });

  it("finds active and asset alerts newest first", async () => {
    alert.findMany.mockResolvedValue([row]);
    const repository = new PrismaAlertRepository();
    expect(await repository.findActive()).toHaveLength(1);
    expect(alert.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: { not: "Resolved" } } }));
    expect(await repository.findByAsset("MM-000001")).toHaveLength(1);
    expect(alert.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { asset: { assetId: "MM-000001" } } }));
  });

  it("updates and deletes by id", async () => {
    alert.update.mockResolvedValue({ ...row, title: "Updated" });
    alert.delete.mockResolvedValue(row);
    const repository = new PrismaAlertRepository();
    expect(await repository.update("alert-1", { title: "Updated" })).toMatchObject({ title: "Updated" });
    await repository.delete("alert-1");
    expect(alert.delete).toHaveBeenCalledWith({ where: { id: "alert-1" } });
  });
});
