import type { ToolPermission, ToolPrincipal } from "@/services/copilot/tools/types";

export interface PermissionChecker { can(principal: ToolPrincipal, permission: ToolPermission): boolean }
export class DefaultPermissionChecker implements PermissionChecker {
  can(principal: ToolPrincipal, permission: ToolPermission) { return principal.permissions.includes(permission); }
}

