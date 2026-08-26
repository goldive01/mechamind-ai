export type AssetStatus = "Active" | "Needs Attention" | "Inactive";

export interface Asset {
  id: string;
  assetId: string;
  equipmentId: string;
  status: AssetStatus | string;
  primaryImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

