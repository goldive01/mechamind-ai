import { assetTimelineSchema, type AssetTimelineDto, type TimelineEventDto } from "@/dto/timeline.dto";
import { recommendationSummary } from "@/dto/recommendation.dto";
import { createLogger } from "@/infrastructure/logging/Logger";
import type { TimelineData, TimelineRepository } from "@/repositories/TimelineRepository";
import { HealthEngine } from "@/services/HealthEngine";
import type { MemoryIngestor } from "@/services/MemoryIngestionService";

export interface TimelineSummarizer { summarize(input: { assetId: string; assetName: string; trendExplanation: string; events: TimelineEventDto[] }): Promise<string>; }
interface ResponsesPayload { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }

export class OpenAITimelineSummarizer implements TimelineSummarizer {
  async summarize(input: { assetId: string; assetName: string; trendExplanation: string; events: TimelineEventDto[] }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return input.trendExplanation;
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(5_000), body: JSON.stringify({ model: process.env.OPENAI_TIMELINE_MODEL ?? process.env.OPENAI_ALERT_MODEL ?? "gpt-4.1-mini", input: [{ role: "system", content: "Summarize the asset engineering timeline in no more than three concise sentences. Use only supplied evidence, identify the trend and highest-priority next action, and do not invent causation." }, { role: "user", content: JSON.stringify({ ...input, events: input.events.slice(0, 40) }) }], max_output_tokens: 220 }) });
    if (!response.ok) throw new Error(`OpenAI timeline request failed with ${response.status}.`);
    const payload = await response.json() as ResponsesPayload;
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
    if (!text) throw new Error("OpenAI timeline response was empty.");
    return text.trim();
  }
}

export class TimelineService {
  private readonly logger = createLogger("TimelineService");
  constructor(private readonly repository: TimelineRepository, private readonly health = new HealthEngine(), private readonly summarizer?: TimelineSummarizer, private readonly memories?: MemoryIngestor) {}
  async build(assetId: string): Promise<AssetTimelineDto | null> {
    const data = await this.repository.getAssetTimelineData(assetId);
    if (!data) return null;
    const score = this.health.calculate(data.inspections, data.maintenance, data.asset.createdAt, data.readings);
    const events = this.events(data, score.trend);
    if (this.memories) for (const event of events) try { await this.memories.ingest({ organisationId: data.asset.organisationId, sourceType: "Timeline", sourceId: event.id, title: event.title, summary: event.summary, assetId, timelineType: event.type, confidence: 0.75, occurredAt: event.occurredAt, details: event.metadata, tags: [{ name: "timeline-type", value: event.type }] }); } catch (error) { this.logger.warn("Engineering memory timeline ingestion failed", { assetId, eventId: event.id, error: error instanceof Error ? error.message : String(error) }); }
    const trendExplanation = this.explainTrend(score.trendDelta, score.overallHealth, score.failureProbability, events);
    let aiSummary = trendExplanation;
    if (this.summarizer) try { aiSummary = await this.summarizer.summarize({ assetId, assetName: data.asset.name, trendExplanation, events }); } catch (error) { this.logger.warn("AI timeline summary unavailable; using deterministic explanation", { assetId, error: error instanceof Error ? error.message : error }); }
    return assetTimelineSchema.parse({ assetId, assetName: data.asset.name, organisation: { id: data.asset.organisationId, name: data.asset.organisationName, site: data.asset.siteName, building: data.asset.buildingName, area: data.asset.areaName }, generatedAt: new Date(), trendExplanation, aiSummary, events });
  }
  private events(data: TimelineData, trend: Array<{ date: Date; overall: number; mechanical: number; electrical: number; safety: number }>): TimelineEventDto[] {
    const inspections: TimelineEventDto[] = data.inspections.map((item) => ({ id: `inspection:${item.id}`, type: "Inspection", occurredAt: item.inspectionDate, title: `${item.overallCondition} inspection`, summary: item.notes ?? item.aiReport?.diagnosis ?? "Inspection completed.", severity: null, metadata: { condition: item.overallCondition, riskLevel: item.aiReport?.riskLevel ?? null } }));
    const readings: TimelineEventDto[] = data.readings.map((item, index) => { const values = Object.entries({ temperature: item.temperature, vibration: item.vibration, voltage: item.voltage, current: item.current, humidity: item.humidity }).filter((entry): entry is [string, number] => entry[1] !== null); return { id: `sensor:${item.id ?? index}:${item.recordedAt.toISOString()}`, type: "Sensor Reading", occurredAt: item.recordedAt, title: "Sensor reading recorded", summary: values.length ? values.map(([name, value]) => `${name} ${value}`).join(" · ") : "Reading contained no monitored values.", severity: null, metadata: Object.fromEntries(values) }; });
    const health: TimelineEventDto[] = trend.map((item, index) => ({ id: `health:${index}:${item.date.toISOString()}`, type: "Health", occurredAt: item.date, title: `Health score ${item.overall}%`, summary: `Mechanical ${item.mechanical}%, electrical ${item.electrical}%, safety ${item.safety}%.`, severity: item.overall <= 25 ? "Critical" : item.overall <= 40 ? "High" : item.overall <= 55 ? "Medium" : item.overall <= 70 ? "Low" : null, metadata: { overall: item.overall, mechanical: item.mechanical, electrical: item.electrical, safety: item.safety } }));
    const alerts: TimelineEventDto[] = data.alerts.map((item) => ({ id: `alert:${item.id}`, type: "Alert", occurredAt: item.createdAt, title: item.title, summary: item.description, severity: item.severity, metadata: { alertId: item.id, status: item.status } }));
    const recommendations: TimelineEventDto[] = data.alerts.map((item) => ({ id: `recommendation:${item.id}`, type: "Recommendation", occurredAt: item.updatedAt, title: `Recommendation for ${item.title}`, summary: recommendationSummary(item.recommendation), severity: item.severity, metadata: { alertId: item.id, status: item.status } }));
    const maintenance: TimelineEventDto[] = data.maintenance.map((item) => ({ id: `maintenance:${item.id}`, type: "Maintenance", occurredAt: item.maintenanceDate, title: item.maintenanceType, summary: item.notes ?? `Maintenance completed by ${item.performedBy}.`, severity: null, metadata: { performedBy: item.performedBy } }));
    const workOrders: TimelineEventDto[] = data.workOrders.map((item) => { const assignee = item.assignedEngineer?.name ?? item.assignedTo; return { id: `work-order:${item.id}`, type: "Work Order", occurredAt: item.completedAt ?? item.updatedAt ?? item.createdAt, title: item.title, summary: `${item.status} work order${assignee ? ` assigned to ${assignee}` : ""}${item.team ? ` (${item.team.name})` : ""}. ${item.description}`, severity: item.priority === "Critical" || item.priority === "High" || item.priority === "Medium" || item.priority === "Low" ? item.priority : null, metadata: { workOrderId: item.id, status: item.status, priority: item.priority, assignedTo: assignee, assignedEngineerId: item.assignedEngineer?.id ?? null, teamId: item.team?.id ?? null, team: item.team?.name ?? null } }; });
    const stockMovements: TimelineEventDto[] = data.stockMovements.map((item) => ({ id: `stock:${item.id}`, type: "Stock Movement", occurredAt: item.createdAt, title: this.stockTitle(item.movementType), summary: `${item.inventoryItem.sparePart.partNumber} · ${item.inventoryItem.sparePart.name}: ${item.quantity > 0 ? "+" : ""}${item.quantity} at ${item.inventoryItem.warehouse.code}.${item.notes ? ` ${item.notes}` : ""}`, severity: null, metadata: { workOrderId: item.workOrderId, movementType: item.movementType, quantity: item.quantity, balanceAfter: item.balanceAfter, warehouse: item.inventoryItem.warehouse.code, partNumber: item.inventoryItem.sparePart.partNumber, performedBy: item.performedBy } }));
    return [...inspections, ...readings, ...health, ...alerts, ...recommendations, ...maintenance, ...workOrders, ...stockMovements].toSorted((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }
  private explainTrend(delta: number, health: number, failureProbability: number, events: TimelineEventDto[]) {
    const direction = delta <= -5 ? `declining by ${Math.abs(delta)} points` : delta >= 5 ? `improving by ${delta} points` : "stable";
    const activeAlerts = events.filter((event) => event.type === "Alert" && event.metadata.status !== "Resolved").length;
    return `Asset health is ${direction}, with a current score of ${health}% and failure probability of ${failureProbability}%. ${activeAlerts ? `${activeAlerts} active alert${activeAlerts === 1 ? "" : "s"} require review.` : "There are no active alerts in the timeline."}`;
  }
  private stockTitle(type: string) { return type === "RECEIVED" ? "Stock Received" : type === "RETURNED" ? "Part Returned" : type === "TRANSFERRED" ? "Warehouse Transfer" : type === "ADJUSTED" ? "Inventory Adjustment" : "Part Issued"; }
}
