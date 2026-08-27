import type { SyncEntity } from "@/domain/entities/FieldMobile";

export interface ConflictInput { entity: SyncEntity; localPayload: unknown; remotePayload: unknown; baseVersion: string | null; remoteVersion: string | null }
export interface ConflictResolution { strategy: "Use Local" | "Use Remote" | "Merge"; payload: unknown; reason: string }
const record = (value: unknown): Record<string, unknown> | null => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const timestamp = (value: unknown) => { const candidate = record(value)?.updatedAt; if (typeof candidate !== "string") return null; const time = Date.parse(candidate); return Number.isFinite(time) ? time : null; };

export class ConflictResolver {
  resolve(input: ConflictInput): ConflictResolution {
    if (["Inspection", "Photo", "VoiceNote", "GPS", "DigitalSignature"].includes(input.entity)) return { strategy: "Use Local", payload: input.localPayload, reason: "Append-only field evidence is preserved as a new server record." };
    const localTime = timestamp(input.localPayload); const remoteTime = timestamp(input.remotePayload);
    if (localTime !== null && remoteTime !== null) return localTime >= remoteTime ? { strategy: "Use Local", payload: input.localPayload, reason: "The local record is newer." } : { strategy: "Use Remote", payload: input.remotePayload, reason: "The remote record is newer." };
    const local = record(input.localPayload); const remote = record(input.remotePayload);
    if (local && remote) return { strategy: "Merge", payload: { ...remote, ...local }, reason: "Versions were unavailable; non-destructive fields were merged with local changes taking precedence." };
    return { strategy: "Use Remote", payload: input.remotePayload, reason: "The remote value was retained because structured version information was unavailable." };
  }
}
