import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations overview"
        description="Track the health of your equipment, inspections, and maintenance actions in one calm workspace."
        actions={<Button href="/dashboard/inspections">Review inspections</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Active fleet" description="7 systems in the last 24 hours">
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">84%</p>
        </Card>
        <Card title="Inspection coverage" description="Teams are staying ahead of schedule">
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">92%</p>
        </Card>
        <Card title="Suggested actions" description="AI-ready follow-ups around the corner">
          <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">12</p>
        </Card>
      </div>
    </div>
  );
}
