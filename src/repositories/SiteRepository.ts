import type { Site } from "@/domain/entities/Organisation";
import type { CreateSiteDto, UpdateSiteDto } from "@/dto/organisation.dto";
export interface SiteRepository { create(input: CreateSiteDto): Promise<Site>; update(input: UpdateSiteDto): Promise<Site>; list(organisationId: string): Promise<Site[]>; findById(organisationId: string, id: string): Promise<Site | null>; }
