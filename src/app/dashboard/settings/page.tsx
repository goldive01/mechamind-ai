import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure preferences and future integrations without touching the core experience." />
      <Card title="Workspace settings" description="A dedicated settings surface is now in place for upcoming app configuration flows." />
    </div>
  );
}
