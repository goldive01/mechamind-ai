import type { Building } from "@/domain/entities/Organisation";
import type { CreateBuildingDto, UpdateBuildingDto } from "@/dto/organisation.dto";
export interface BuildingRepository { create(input: CreateBuildingDto): Promise<Building>; update(input: UpdateBuildingDto): Promise<Building>; list(organisationId: string, siteId?: string): Promise<Building[]>; findById(organisationId: string, id: string): Promise<Building | null>; }
