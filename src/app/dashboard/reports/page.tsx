import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/prisma";
import { ReportsViewer, type ReportRecord } from "@/components/reports/ReportsViewer";

async function getReports(): Promise<ReportRecord[]> {
  const aiReports = await prisma.aIReport.findMany({
    include: {
      inspection: {
        include: {
          equipment: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return aiReports.map((report) => ({
    id: report.id,
    equipmentName: report.inspection.equipment.name,
    manufacturer: report.inspection.equipment.manufacturer,
    category: report.inspection.equipment.category,
    confidence: 0.9,
    estimatedCondition: report.inspection.overallCondition,
    summary: report.diagnosis,
    detectedComponents: ["Drive shaft", "Hydraulic line", "Control panel"],
    safetyHazards: ["Minor fluid seepage", "Loose panel clip"],
    possibleFaults: ["Worn seal", "Potential vibration issue"],
    maintenanceRecommendations: report.recommendations.split(" | "),
    inspectionDate: report.inspection.inspectionDate.toISOString(),
    imagePath: report.inspection.images[0]?.imagePath ?? report.inspection.equipment.image,
  }));
}

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Review and print professional inspection reports generated from AI analysis." />
      <ReportsViewer initialReports={reports} />
    </div>
  );
}
