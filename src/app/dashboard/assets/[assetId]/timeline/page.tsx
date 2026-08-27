import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { AssetTimeline } from "@/components/timeline/AssetTimeline";
import { createTimelineService } from "@/services/timelineFactory";

export const dynamic = "force-dynamic";
export default async function AssetTimelinePage({ params }: PageProps<"/dashboard/assets/[assetId]/timeline">) {
  const { assetId } = await params;
  const timeline = await createTimelineService().build(assetId);
  if (!timeline) notFound();
  return <div className="space-y-6"><Link href={`/dashboard/assets/${assetId}`} className="text-sm font-medium text-cyan-600 hover:text-cyan-500">← Asset details</Link><PageHeader title={`${timeline.assetId} · Engineering timeline`} description={`Inspections, telemetry, health, alerts, recommendations, maintenance, and work orders for ${timeline.assetName}.`} /><AssetTimeline timeline={timeline} /></div>;
}
