import "server-only";
import { PrismaAuditRepository } from "@/infrastructure/repositories/PrismaAuditRepository";
import { PrismaAuthenticationRepository } from "@/infrastructure/repositories/PrismaAuthenticationRepository";
import { AuditService } from "@/services/AuditService";
import { AuthenticationService } from "@/services/AuthenticationService";
import { AuthorizationService } from "@/services/AuthorizationService";
export function createAuthServices() { const audit = new AuditService(new PrismaAuditRepository()); return { audit, authentication: new AuthenticationService(new PrismaAuthenticationRepository(), audit), authorization: new AuthorizationService(audit) }; }

