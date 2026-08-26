"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { InspectionReportCard } from "@/components/reports/InspectionReportCard";
import { InspectionReportDocument } from "@/components/reports/InspectionReportDocument";

export interface ReportRecord {
  id: string;
  equipmentName: string;
  manufacturer: string;
  category: string;
  confidence: number;
  estimatedCondition: string;
  summary: string;
  detectedComponents: string[];
  safetyHazards: string[];
  possibleFaults: string[];
  maintenanceRecommendations: string[];
  inspectionDate: string;
  imagePath: string | null;
}

interface ReportsViewerProps {
  initialReports: ReportRecord[];
}

export function ReportsViewer({ initialReports }: ReportsViewerProps) {
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(initialReports[0] ?? null);

  const getReportDetails = (report: ReportRecord) => ({
    equipmentName: report.equipmentName,
    manufacturer: report.manufacturer,
    category: report.category,
    inspectionDate: new Date(report.inspectionDate).toLocaleDateString(),
    confidence: report.confidence,
    estimatedCondition: report.estimatedCondition,
    summary: report.summary,
    detectedComponents: report.detectedComponents,
    safetyHazards: report.safetyHazards,
    possibleFaults: report.possibleFaults,
    maintenanceRecommendations: report.maintenanceRecommendations,
    imagePath: report.imagePath,
  });

  const selectedDetails = useMemo(() => {
    return selectedReport ? getReportDetails(selectedReport) : null;
  }, [selectedReport]);

  const handlePrint = (report: ReportRecord) => {
    setSelectedReport(report);
    window.setTimeout(() => window.print(), 0);
  };

  const handleDownload = (report: ReportRecord) => {
    const reportDetails = getReportDetails(report);

    const document = `Inspection Report\n\nEquipment: ${reportDetails.equipmentName}\nManufacturer: ${reportDetails.manufacturer}\nCategory: ${reportDetails.category}\nInspection Date: ${reportDetails.inspectionDate}\nConfidence: ${Math.round(reportDetails.confidence * 100)}%\nCondition: ${reportDetails.estimatedCondition}\n\nSummary\n${reportDetails.summary}\n\nDetected Components\n${reportDetails.detectedComponents.join("\n")}\n\nSafety Hazards\n${reportDetails.safetyHazards.join("\n")}\n\nPossible Faults\n${reportDetails.possibleFaults.join("\n")}\n\nMaintenance Recommendations\n${reportDetails.maintenanceRecommendations.join("\n")}`;

    const blob = new Blob([document], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${reportDetails.equipmentName.toLowerCase().replace(/\s+/g, "-")}-report.txt`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card title="Saved reports" description="Browse previously generated inspection reports.">
        <div className="space-y-4">
          {initialReports.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No reports saved yet. Generate one from the scanner to see it here.</p>
          ) : (
            initialReports.map((report) => (
              <InspectionReportCard
                key={report.id}
                title={report.equipmentName}
                manufacturer={report.manufacturer}
                category={report.category}
                confidence={report.confidence}
                condition={report.estimatedCondition}
                summary={report.summary}
                onView={() => setSelectedReport(report)}
                onPrint={() => handlePrint(report)}
                onDownload={() => handleDownload(report)}
              />
            ))
          )}
        </div>
      </Card>

      <Card title="Report preview" description="Open a saved report to review or export it.">
        {selectedDetails ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => selectedReport && handlePrint(selectedReport)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Print Report
              </button>
              <button onClick={() => selectedReport && handleDownload(selectedReport)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Download Report
              </button>
            </div>
            <InspectionReportDocument {...selectedDetails} />
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">Select a report to preview it here.</p>
        )}
      </Card>
    </div>
  );
}
