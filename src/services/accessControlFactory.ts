import "server-only";
import { PrismaAuthenticationRepository } from "@/infrastructure/repositories/PrismaAuthenticationRepository";
import { PrismaPermissionRepository } from "@/infrastructure/repositories/PrismaPermissionRepository";
import { PrismaRoleRepository } from "@/infrastructure/repositories/PrismaRoleRepository";
import { AuthenticationService } from "@/services/AuthenticationService";
import { PermissionService } from "@/services/PermissionService";
import { RoleService } from "@/services/RoleService";
import { SessionService } from "@/services/SessionService";

export function createAccessControlServices() {
  const authenticationRepository = new PrismaAuthenticationRepository();
  return {
    authentication: new AuthenticationService(authenticationRepository),
    permissions: new PermissionService(new PrismaPermissionRepository()),
    roles: new RoleService(new PrismaRoleRepository(), authenticationRepository),
    sessions: new SessionService(authenticationRepository),
  };
}
