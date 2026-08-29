import type { Organisation } from "@/domain/entities/Organisation";
import type { CreateOrganisationDto, UpdateOrganisationDto } from "@/dto/organisation.dto";
export interface OrganisationRepository { create(input: CreateOrganisationDto): Promise<Organisation>; update(input: UpdateOrganisationDto): Promise<Organisation>; listForUser(userId: string): Promise<Organisation[]>; findById(id: string, userId: string): Promise<Organisation | null>; }
