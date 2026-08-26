import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export default function InspectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inspections" description="Review inspection runs, findings, and recommended actions." />
      <Card title="Pending inspections" description="A future list view will render here once your data layer is connected." />
    </div>
  );
}
