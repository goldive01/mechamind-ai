import { describe, expect, it, vi } from "vitest";
import type { Alert } from "@/domain/entities/Alert";
import { EscalationEngine } from "@/services/EscalationEngine";
import { NotificationEngine } from "@/services/NotificationEngine";
import { NotificationQueue } from "@/services/NotificationQueue";
import { NotificationService } from "@/services/NotificationService";
import { EmailProvider } from "@/services/notifications/EmailProvider";
import { PushProvider } from "@/services/notifications/PushProvider";
import { SMSProvider } from "@/services/notifications/SMSProvider";
import { SlackProvider } from "@/services/notifications/SlackProvider";
import { TeamsProvider } from "@/services/notifications/TeamsProvider";
import { WebhookProvider } from "@/services/notifications/WebhookProvider";

const now = new Date("2026-08-26T10:00:00Z");
const alert = (severity: Alert["severity"]): Alert => ({ id: `a-${severity}`, assetId: "MM-000001", assetName: "Pump", fingerprint: `MM-000001:${severity}`, severity, category: "Sensor Telemetry", status: "Open", source: "Sensor", metric: "temperature", title: `${severity} temperature alert`, description: "Temperature exceeded its threshold.", recommendation: "Inspect cooling.", triggerType: "Sensor Reading", triggerId: "reading-1", observedValue: 105, thresholdValue: 100, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null, createdAt: now, updatedAt: now });

describe("EscalationEngine", () => {
  it("implements severity-specific delivery and escalation rules", () => {
    const engine = new EscalationEngine();
    expect(engine.evaluate("Critical")).toMatchObject({ initialMode: "Immediate", escalateAfterMinutes: 15 });
    expect(engine.evaluate("High")).toMatchObject({ initialMode: "Immediate", escalateAfterMinutes: null });
    expect(engine.evaluate("Medium")).toMatchObject({ initialMode: "Daily Summary" });
    expect(engine.evaluate("Low")).toMatchObject({ initialMode: "Log Only", initialChannels: ["Log"] });
  });
});

describe("NotificationEngine and queue", () => {
  it("queues immediate critical notifications and delayed escalation", () => {
    const queue = new NotificationQueue(); const engine = new NotificationEngine(new EscalationEngine(), queue, () => now);
    expect(engine.schedule(alert("Critical"))).toHaveLength(10);
    expect(engine.due(now)).toHaveLength(6);
    expect(engine.pending()).toHaveLength(4);
    expect(engine.cancelAlert("a-Critical")).toBe(4);
  });
  it("defers medium alerts to the next daily summary", () => {
    const engine = new NotificationEngine(new EscalationEngine(), new NotificationQueue(), () => now);
    engine.schedule(alert("Medium"));
    expect(engine.due(now)).toEqual([]);
    expect(engine.pending()).toHaveLength(2);
  });
});

describe("NotificationService", () => {
  it("dispatches immediate notifications through the matching provider", async () => {
    const provider = { channel: "Email" as const, send: vi.fn().mockResolvedValue(undefined) };
    const logger = { info: vi.fn(), warn: vi.fn() };
    const engine = new NotificationEngine(new EscalationEngine(), new NotificationQueue(), () => now);
    await new NotificationService([provider], engine, logger).notify(alert("High"));
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({ channel: "Email", mode: "Immediate", alertId: "a-High" }));
  });
  it("logs low alerts without calling external providers", async () => {
    const provider = { channel: "Email" as const, send: vi.fn() }; const logger = { info: vi.fn(), warn: vi.fn() };
    await new NotificationService([provider], new NotificationEngine(new EscalationEngine(), new NotificationQueue(), () => now), logger).notify(alert("Low"));
    expect(provider.send).not.toHaveBeenCalled(); expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Low alert"), expect.objectContaining({ mode: "Log Only" }));
  });
  it("provides all six log-only channel implementations", () => {
    expect([new EmailProvider(), new PushProvider(), new SMSProvider(), new TeamsProvider(), new SlackProvider(), new WebhookProvider()].map(({ channel }) => channel)).toEqual(["Email", "Push", "SMS", "Teams", "Slack", "Webhook"]);
  });
});
