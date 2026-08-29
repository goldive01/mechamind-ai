import { createSiteSchema, updateSiteSchema } from "@/dto/organisation.dto";
import type { SiteRepository } from "@/repositories/SiteRepository";
export class SiteService { constructor(private readonly repository: SiteRepository) {} create(value: unknown) { return this.repository.create(createSiteSchema.parse(value)); } update(value: unknown) { return this.repository.update(updateSiteSchema.parse(value)); } list(organisationId: string) { return this.repository.list(organisationId); } get(organisationId: string, id: string) { return this.repository.findById(organisationId, id); } }
