import type { Role } from "@/domain/entities/Authorization";
import type { CreateRoleDto, UpdateRoleDto } from "@/dto/auth.dto";
export interface RoleRepository { create(input: CreateRoleDto): Promise<Role>; update(input: UpdateRoleDto): Promise<Role>; findById(id: string): Promise<Role | null>; list(): Promise<Role[]>; grantPermission(roleId: string, permissionId: string): Promise<Role>; revokePermission(roleId: string, permissionId: string): Promise<Role> }

