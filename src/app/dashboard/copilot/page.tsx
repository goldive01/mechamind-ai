import { CopilotChat } from "@/components/copilot/CopilotChat";
import { PageHeader } from "@/components/PageHeader";
import { PrismaCopilotContextRepository } from "@/infrastructure/repositories/PrismaCopilotContextRepository";

export default async function CopilotPage() {
  const assets = await new PrismaCopilotContextRepository().listAssetOptions();
  return <div className="space-y-6"><PageHeader title="AI Engineering Copilot" description="Investigate asset condition, live telemetry, inspection findings, and maintenance priorities with grounded engineering context." /><CopilotChat assets={assets} /></div>;
}
