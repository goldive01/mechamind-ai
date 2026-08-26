import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export default function EquipmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Equipment" description="Manage connected assets and equipment status from one place." />
      <Card title="Equipment inventory" description="This placeholder page is ready for your first real data model." />
    </div>
  );
}
