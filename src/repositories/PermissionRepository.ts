import type { Permission } from "@/domain/entities/Authorization";
import type { CreatePermissionDto, UpdatePermissionDto } from "@/dto/auth.dto";
export interface PermissionRepository { create(input: CreatePermissionDto): Promise<Permission>; update(input: UpdatePermissionDto): Promise<Permission>; findByCode(code: string): Promise<Permission | null>; list(): Promise<Permission[]> }

