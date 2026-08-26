import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export async function allocateAssetId(tx: Prisma.TransactionClient): Promise<string> {
  const sequence = await tx.assetSequence.upsert({
    where: { id: "asset" },
    create: { id: "asset", value: 1 },
    update: { value: { increment: 1 } },
  });

  return `MM-${String(sequence.value).padStart(6, "0")}`;
}
