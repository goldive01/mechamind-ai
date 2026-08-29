import { z } from "zod";

const id = z.string().trim().min(1).max(128);
const permissionCode = z.string().trim().min(3).max(100).regex(/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/);
export const loginDtoSchema = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(10).max(128) }).strict();
export const createUserDtoSchema = z.object({ fullName: z.string().trim().min(2).max(120), email: z.email().trim().toLowerCase(), password: z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/), roleId: id.nullable().optional(), active: z.boolean().default(true) }).strict();
export const createRoleDtoSchema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).nullable().optional() }).strict();
export const updateRoleDtoSchema = createRoleDtoSchema.partial().extend({ id });
export const createPermissionDtoSchema = z.object({ code: permissionCode, name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).nullable().optional() }).strict();
export const updatePermissionDtoSchema = createPermissionDtoSchema.partial().extend({ id });
export const assignRoleDtoSchema = z.object({ userId: id, roleId: id.nullable() }).strict();
export const rolePermissionDtoSchema = z.object({ roleId: id, permissionId: id }).strict();
export const auditEventDtoSchema = z.object({ userId: id.nullable().optional(), action: z.string().trim().min(2).max(100), resource: z.string().trim().min(2).max(100), resourceId: id.nullable().optional(), outcome: z.enum(["SUCCESS", "DENIED", "FAILURE"]).default("SUCCESS"), metadata: z.record(z.string(), z.unknown()).default({}), ipAddress: z.string().trim().max(64).nullable().optional(), userAgent: z.string().trim().max(500).nullable().optional() }).strict();
export type LoginDto = z.infer<typeof loginDtoSchema>;
export type CreateUserDto = z.infer<typeof createUserDtoSchema>;
export type CreateRoleDto = z.infer<typeof createRoleDtoSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleDtoSchema>;
export type CreatePermissionDto = z.infer<typeof createPermissionDtoSchema>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionDtoSchema>;

