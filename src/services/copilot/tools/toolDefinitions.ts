import { z } from "zod";
import { AssetQueryService } from "@/services/AssetQueryService";
import { InspectionReportService } from "@/services/InspectionReportService";
import { MaintenanceService } from "@/services/MaintenanceService";
import type { ToolDefinition } from "@/services/copilot/tools/types";

const assetId = z.string().regex(/^MM-\d{6}$/);
const searchSchema = z.object({ query: z.string().trim().max(200).default(""), limit: z.number().int().min(1).max(25).default(10) }).strict();
const singleAssetSchema = z.object({ assetId }).strict();
const compareSchema = z.object({ assetIds: z.array(assetId).min(2).max(8) }).strict();
const maintenanceSchema = z.object({ assetId, maintenanceType: z.string().trim().min(1).max(200), performedBy: z.string().trim().min(1).max(200), notes: z.string().trim().max(2000).optional(), maintenanceDate: z.iso.datetime({ offset: true }).optional() }).strict();
const reportSchema = z.object({ assetId, inspectionId: z.string().trim().min(1).optional() }).strict();

export function createToolDefinitions(assets: AssetQueryService, maintenance: MaintenanceService, reports: InspectionReportService): ToolDefinition[] {
  return [
    { name: "searchAssets", description: "Search registered assets by identifier, name, manufacturer, category, status, or location.", inputSchema: searchSchema, permission: "assets:read", destructive: false, execute: async (value) => { const input = searchSchema.parse(value); return assets.search(input.query, input.limit); } },
    { name: "getAssetHealth", description: "Get the current calculated health and risk analytics for one asset.", inputSchema: singleAssetSchema, permission: "assets:read", destructive: false, execute: async (value) => assets.getHealth(singleAssetSchema.parse(value).assetId) },
    { name: "compareAssets", description: "Compare calculated health and failure risk across two to eight assets.", inputSchema: compareSchema, permission: "assets:read", destructive: false, execute: async (value) => assets.compare(compareSchema.parse(value).assetIds) },
    { name: "createMaintenance", description: "Create a maintenance record for an asset. This changes application data and always requires confirmation.", inputSchema: maintenanceSchema, permission: "maintenance:write", destructive: true, execute: async (value) => maintenance.create(maintenanceSchema.parse(value)) },
    { name: "generateInspectionReport", description: "Generate a structured inspection report from the latest or specified asset inspection.", inputSchema: reportSchema, permission: "reports:generate", destructive: false, execute: async (value) => { const input = reportSchema.parse(value); return reports.generate(input.assetId, input.inspectionId); } },
    { name: "calculateHealth", description: "Recalculate health analytics from the latest persisted inspections, maintenance, and sensor readings.", inputSchema: singleAssetSchema, permission: "assets:read", destructive: false, execute: async (value) => assets.calculate(singleAssetSchema.parse(value).assetId) },
  ];
}

