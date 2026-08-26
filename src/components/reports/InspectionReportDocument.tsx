import Image from "next/image";

interface InspectionReportDocumentProps {
  equipmentName: string;
  manufacturer: string;
  category: string;
  inspectionDate: string;
  confidence: number;
  estimatedCondition: string;
  summary: string;
  detectedComponents: string[];
  safetyHazards: string[];
  possibleFaults: string[];
  maintenanceRecommendations: string[];
  imagePath?: string | null;
}

export function InspectionReportDocument({
  equipmentName,
  manufacturer,
  category,
  inspectionDate,
  confidence,
  estimatedCondition,
  summary,
  detectedComponents,
  safetyHazards,
  possibleFaults,
  maintenanceRecommendations,
  imagePath,
}: InspectionReportDocumentProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">Inspection Report</p>
            <h2 className="mt-2 text-3xl font-semibold">{equipmentName}</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
            <p className="font-semibold">Confidence</p>
            <p>{Math.round(confidence * 100)}%</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Manufacturer</p>
            <p className="mt-1 font-medium">{manufacturer}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</p>
            <p className="mt-1 font-medium">{category}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inspection Date</p>
            <p className="mt-1 font-medium">{inspectionDate}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          {imagePath ? (
            <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <Image src={imagePath} alt={`${equipmentName} inspection`} fill className="object-contain" sizes="(min-width: 1024px) 40vw, 100vw" />
            </div>
          ) : null}
          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Executive Summary</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{summary}</p>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Detected Components</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {detectedComponents.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Condition</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{estimatedCondition}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Safety Hazards</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {safetyHazards.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Possible Faults</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {possibleFaults.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold">Maintenance Recommendations</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {maintenanceRecommendations.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
