import { auditEventDtoSchema } from "@/dto/auth.dto";
import type { AuditEvent } from "@/domain/entities/Authorization";
import type { AuditRepository } from "@/repositories/AuditRepository";
export class AuditService { constructor(private readonly repository: AuditRepository) {} record(event: AuditEvent) { return this.repository.create(auditEventDtoSchema.parse(event)); } history(resource?: string, resourceId?: string) { return this.repository.list(resource, resourceId); } }
