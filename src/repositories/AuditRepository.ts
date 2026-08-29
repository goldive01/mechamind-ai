import type { AuditEvent } from "@/domain/entities/Authorization";
export interface AuditRecord extends AuditEvent { id: string; createdAt: Date }
export interface AuditRepository { create(event: AuditEvent): Promise<AuditRecord>; list(resource?: string, resourceId?: string): Promise<AuditRecord[]> }
