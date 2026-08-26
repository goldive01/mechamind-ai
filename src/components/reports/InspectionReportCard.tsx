import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface InspectionReportCardProps {
  title: string;
  manufacturer: string;
  category: string;
  confidence: number;
  condition: string;
  summary: string;
  onView: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function InspectionReportCard({
  title,
  manufacturer,
  category,
  confidence,
  condition,
  summary,
  onView,
  onPrint,
  onDownload,
}: InspectionReportCardProps) {
  return (
    <Card title={title} description={`${manufacturer} • ${category}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700">Confidence {Math.round(confidence * 100)}%</span>
          <span className="rounded-full border border-slate-300 px-3 py-1 dark:border-slate-700">Condition {condition}</span>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{summary}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onView} size="sm">View report</Button>
          {onPrint ? (
            <Button onClick={onPrint} variant="secondary" size="sm">
              Print
            </Button>
          ) : null}
          {onDownload ? (
            <Button onClick={onDownload} variant="secondary" size="sm">
              Download PDF
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
