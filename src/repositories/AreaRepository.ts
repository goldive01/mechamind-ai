import type { Area } from "@/domain/entities/Organisation";
import type { CreateAreaDto, UpdateAreaDto } from "@/dto/organisation.dto";
export interface AreaRepository { create(input: CreateAreaDto): Promise<Area>; update(input: UpdateAreaDto): Promise<Area>; list(organisationId: string, buildingId?: string): Promise<Area[]>; findById(organisationId: string, id: string): Promise<Area | null>; }
