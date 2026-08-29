import { createPermissionDtoSchema, updatePermissionDtoSchema } from "@/dto/auth.dto";
import type { PermissionRepository } from "@/repositories/PermissionRepository";
export class PermissionService { constructor(private readonly repository: PermissionRepository) {} create(value: unknown) { return this.repository.create(createPermissionDtoSchema.parse(value)); } update(value: unknown) { return this.repository.update(updatePermissionDtoSchema.parse(value)); } list() { return this.repository.list(); } findByCode(code: string) { return this.repository.findByCode(code); } }

