import { z } from "zod";

export const assetInputSchema = z.object({
  name: z.string().trim().min(1), manufacturer: z.string().trim().min(1), model: z.string().trim().min(1),
  serialNumber: z.string().trim().min(1), category: z.string().trim().min(1), location: z.string().trim().optional(),
  description: z.string().trim().optional(), status: z.enum(["Active", "Needs Attention", "Inactive"]), primaryImage: z.string().trim().optional(),
});

export type AssetInputDto = z.infer<typeof assetInputSchema>;

export function assetInputFromForm(formData: FormData): AssetInputDto {
  return assetInputSchema.parse({
    name: formData.get("name"), manufacturer: formData.get("manufacturer"), model: formData.get("model"),
    serialNumber: formData.get("serialNumber"), category: formData.get("category"), location: formData.get("location") || undefined,
    description: formData.get("description") || undefined, status: formData.get("status"), primaryImage: formData.get("primaryImage") || undefined,
  });
}

