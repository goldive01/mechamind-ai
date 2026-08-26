import type { AlertSeverity } from "@/domain/entities/Alert";
import { escalationSchema, type EscalationDto } from "@/dto/escalation.dto";

const rules: Record<AlertSeverity, EscalationDto> = {
  Critical: { severity: "Critical", initialMode: "Immediate", initialChannels: ["Email", "Push", "SMS", "Teams", "Slack", "Webhook"], escalateAfterMinutes: 15, escalationChannels: ["SMS", "Teams", "Slack", "Webhook"] },
  High: { severity: "High", initialMode: "Immediate", initialChannels: ["Email", "Push", "Teams", "Slack"], escalateAfterMinutes: null, escalationChannels: [] },
  Medium: { severity: "Medium", initialMode: "Daily Summary", initialChannels: ["Email", "Teams"], escalateAfterMinutes: null, escalationChannels: [] },
  Low: { severity: "Low", initialMode: "Log Only", initialChannels: ["Log"], escalateAfterMinutes: null, escalationChannels: [] },
};
export class EscalationEngine { evaluate(severity: AlertSeverity) { return escalationSchema.parse(rules[severity]); } }
