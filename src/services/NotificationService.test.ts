import { describe, expect, it, vi } from "vitest";
import type { Alert } from "@/domain/entities/Alert";
import { NotificationService } from "@/services/NotificationService";

describe("NotificationService", () => {
  it("dispatches through every configured provider abstraction", async () => {
    const alert: Alert = { id: "a1", assetId: "MM-000001", assetName: "Pump", fingerprint: "MM-000001:temperature", severity: "High", category: "Sensor Telemetry", status: "Open", source: "Sensor", metric: "temperature", title: "High temperature alert", description: "Temperature exceeded its threshold.", recommendation: "Inspect cooling.", triggerType: "Sensor Reading", triggerId: "reading-1", observedValue: 105, thresholdValue: 100, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, resolvedBy: null, createdAt: new Date(), updatedAt: new Date() };
    const email = { channel: "Email" as const, send: vi.fn().mockResolvedValue(undefined) };
    const push = { channel: "Push" as const, send: vi.fn().mockResolvedValue(undefined) };
    const sms = { channel: "SMS" as const, send: vi.fn().mockResolvedValue(undefined) };
    await new NotificationService([email, push, sms]).notify(alert);
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ channel: "Email", alert }));
    expect(push.send).toHaveBeenCalledOnce();
    expect(sms.send).toHaveBeenCalledOnce();
  });
});

