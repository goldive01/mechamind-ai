import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryList } from "@/components/assets/HistoryList";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { createAlertService } from "@/services/alertFactory";
import { recentAlerts } from "@/services/alertDashboard";
import { createWorkOrderService } from "@/services/workOrderFactory";

export default async function AssetDetailsPage({ params }: PageProps<"/dashboard/assets/[assetId]">) {
  const { assetId } = await params;
  const asset = await prisma.asset.findUnique({
    where: { assetId },
    include: {
      equipment: { include: { maintenanceRecords: { orderBy: { maintenanceDate: "desc" } } } },
      inspections: { orderBy: { inspectionDate: "desc" }, include: { aiReport: true, images: true } },
    },
  });
  if (!asset) notFound();
  const [assetAlerts, workOrders] = await Promise.all([createAlertService().findByAsset(asset.assetId), createWorkOrderService().findByAsset(asset.assetId)]);
  const alerts = recentAlerts(assetAlerts);

  const latestInspection = asset.inspections[0] ?? null;
  const latestReport = latestInspection?.aiReport ?? null;
  const primaryImage = asset.primaryImage ?? latestInspection?.images[0]?.imagePath ?? asset.equipment.image;

  return (
    <div className="space-y-6">
      <PageHeader title={`${asset.assetId} · ${asset.equipment.name}`} description="Complete equipment, inspection, AI, and maintenance context for this asset." actions={<div className="flex flex-wrap gap-3"><Button href={`/dashboard/work-orders/new?assetId=${asset.assetId}`} variant="secondary">Create work order</Button><Button href={`/dashboard/assets/${asset.assetId}/timeline`} variant="secondary">Engineering timeline</Button><Button href={`/dashboard/assets/${asset.assetId}/health`} variant="secondary">View health</Button><Button href={`/dashboard/assets/${asset.assetId}/edit`}>Edit asset</Button></div>} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card title="Primary image" description="Current visual reference for the asset.">
          {primaryImage ? <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"><Image src={primaryImage} alt={asset.equipment.name} fill className="object-contain" sizes="(min-width: 1024px) 40vw, 100vw" /></div> : <p className="text-sm text-slate-600 dark:text-slate-400">No primary image saved.</p>}
        </Card>
        <Card title="Equipment information" description={`${asset.status} · Added ${asset.createdAt.toLocaleDateString()}`}>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[['Manufacturer', asset.equipment.manufacturer], ['Model', asset.equipment.model], ['Serial number', asset.equipment.serialNumber], ['Category', asset.equipment.category], ['Location', asset.equipment.location ?? 'Not set'], ['Description', asset.equipment.description ?? 'Not set']].map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}
          </dl>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Latest inspection" description="Most recent recorded asset condition.">{latestInspection ? <div><div className="flex items-center justify-between"><p className="font-semibold">{latestInspection.overallCondition}</p><p className="text-sm text-slate-500">{latestInspection.inspectionDate.toLocaleDateString()}</p></div><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{latestInspection.notes ?? "No inspection notes."}</p></div> : <p className="text-sm text-slate-600 dark:text-slate-400">No inspections recorded.</p>}</Card>
        <Card title="AI report summary" description="Latest AI-supported assessment.">{latestReport ? <div><span className="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700">{latestReport.riskLevel} risk</span><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{latestReport.diagnosis}</p><p className="mt-3 text-sm font-medium">{latestReport.recommendations}</p></div> : <p className="text-sm text-slate-600 dark:text-slate-400">No AI report available.</p>}</Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Inspection history" description="All inspections recorded against this asset."><HistoryList emptyMessage="No inspections recorded." items={asset.inspections.map((inspection) => ({ id: inspection.id, title: inspection.overallCondition, date: inspection.inspectionDate.toLocaleDateString(), detail: inspection.notes, badge: inspection.aiReport?.riskLevel }))} /></Card>
        <Card title="Maintenance history" description="Completed maintenance activity for the linked equipment."><HistoryList emptyMessage="No maintenance records available." items={asset.equipment.maintenanceRecords.map((record) => ({ id: record.id, title: record.maintenanceType, date: record.maintenanceDate.toLocaleDateString(), detail: record.notes, badge: record.performedBy }))} /></Card>
      </div>
      <Card title="Recent alerts" description="Latest monitoring findings associated with this asset.">
        {alerts.length ? <div className="divide-y divide-slate-200 dark:divide-slate-800">{alerts.map((alert) => <Link key={alert.id} href={`/dashboard/alerts/${alert.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-semibold">{alert.title}</p><p className="mt-1 text-xs text-slate-500">{alert.category} · {alert.createdAt.toLocaleString("en-GB")}</p></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800">{alert.severity}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">{alert.status}</span></div></Link>)}</div> : <p className="text-sm text-slate-600 dark:text-slate-400">No alerts recorded for this asset.</p>}
      </Card>
      <Card title="Work orders" description="Latest planned and completed engineering work for this asset.">
        {workOrders.length ? <div className="divide-y divide-slate-200 dark:divide-slate-800">{workOrders.map((order) => <Link key={order.id} href={`/dashboard/work-orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-semibold">{order.title}</p><p className="mt-1 text-xs text-slate-500">{order.assignedTo ?? "Unassigned"} · Updated {order.updatedAt.toLocaleString("en-GB")}</p></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800">{order.priority}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">{order.status}</span></div></Link>)}</div> : <p className="text-sm text-slate-600 dark:text-slate-400">No work orders recorded for this asset.</p>}
      </Card>
    </div>
  );
}
