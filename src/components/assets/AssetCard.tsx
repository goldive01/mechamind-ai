import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/Card";

interface AssetCardProps {
  assetId: string;
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  location: string | null;
  status: string;
  imagePath: string | null;
  inspectionCount: number;
  latestCondition: string | null;
}

export function AssetCard(props: AssetCardProps) {
  return (
    <Link href={`/dashboard/assets/${props.assetId}`} className="block transition hover:-translate-y-0.5">
      <Card className="h-full">
        {props.imagePath ? (
          <div className="relative mb-5 aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <Image src={props.imagePath} alt={props.name} fill className="object-cover" sizes="(min-width: 1024px) 30vw, 100vw" />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">{props.assetId}</p><h2 className="mt-2 text-lg font-semibold">{props.name}</h2></div>
          <span className="rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700">{props.status}</span>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{props.manufacturer} · {props.model}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-500">Category</p><p className="mt-1 font-medium">{props.category}</p></div>
          <div><p className="text-slate-500">Location</p><p className="mt-1 font-medium">{props.location ?? "Not set"}</p></div>
          <div><p className="text-slate-500">Inspections</p><p className="mt-1 font-medium">{props.inspectionCount}</p></div>
          <div><p className="text-slate-500">Condition</p><p className="mt-1 font-medium">{props.latestCondition ?? "Not inspected"}</p></div>
        </div>
      </Card>
    </Link>
  );
}
