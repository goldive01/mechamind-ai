import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Assistant" description="This placeholder route is ready for your intelligent assistant experience." />
      <Card title="Assistant workspace" description="The interface and conversation shell can be added here without changing the broader layout." />
    </div>
  );
}
