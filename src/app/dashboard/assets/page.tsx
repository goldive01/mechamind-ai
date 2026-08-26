import { AssetCard } from "@/components/assets/AssetCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";

interface AssetsPageProps {
  searchParams: Promise<{ query?: string; status?: string; category?: string }>;
}

const filterClasses = "rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950";

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const { query = "", status = "", category = "" } = await searchParams;
  const search = query.trim();
  const [assets, categoryRows] = await Promise.all([
    prisma.asset.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(category ? { equipment: { category } } : {}),
        ...(search ? {
          OR: [
            { assetId: { contains: search } },
            { equipment: { name: { contains: search } } },
            { equipment: { manufacturer: { contains: search } } },
            { equipment: { model: { contains: search } } },
            { equipment: { serialNumber: { contains: search } } },
          ],
        } : {}),
      },
      include: {
        equipment: true,
        inspections: { orderBy: { inspectionDate: "desc" }, take: 1 },
        _count: { select: { inspections: true } },
      },
      orderBy: { assetId: "asc" },
    }),
    prisma.equipment.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Assets" description="Search, inspect, and manage the complete smart asset registry." actions={<Button href="/dashboard/assets/new">Create asset</Button>} />
      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
          <input className={filterClasses} name="query" defaultValue={query} placeholder="Search asset ID, name, model, or serial" />
          <select className={filterClasses} name="status" defaultValue={status}><option value="">All statuses</option><option>Active</option><option>Needs Attention</option><option>Inactive</option></select>
          <select className={filterClasses} name="category" defaultValue={category}><option value="">All categories</option>{categoryRows.map((row) => <option key={row.category}>{row.category}</option>)}</select>
          <Button type="submit">Filter</Button>
        </form>
      </Card>
      {assets.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => <AssetCard key={asset.id} assetId={asset.assetId} name={asset.equipment.name} manufacturer={asset.equipment.manufacturer} model={asset.equipment.model} category={asset.equipment.category} location={asset.equipment.location} status={asset.status} imagePath={asset.primaryImage ?? asset.equipment.image} inspectionCount={asset._count.inspections} latestCondition={asset.inspections[0]?.overallCondition ?? null} />)}
        </div>
      ) : <Card><p className="text-sm text-slate-600 dark:text-slate-400">No assets match the current search and filters.</p></Card>}
    </div>
  );
}
