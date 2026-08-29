import { CopilotChat } from "@/components/copilot/CopilotChat";
import { PageHeader } from "@/components/PageHeader";
import { PrismaCopilotContextRepository } from "@/infrastructure/repositories/PrismaCopilotContextRepository";
import { requireOrganisationScope } from "@/lib/auth-session";

export default async function CopilotPage() {
  const { organisationId } = await requireOrganisationScope();
  const assets = await new PrismaCopilotContextRepository(organisationId).listAssetOptions();
  return <div className="space-y-6"><PageHeader title="AI Engineering Copilot" description="Investigate asset condition, live telemetry, inspection findings, and maintenance priorities with grounded engineering context." /><CopilotChat assets={assets} /></div>;
}
