import "server-only";
import { PrismaAreaRepository } from "@/infrastructure/repositories/PrismaAreaRepository";
import { PrismaBuildingRepository } from "@/infrastructure/repositories/PrismaBuildingRepository";
import { PrismaMembershipRepository } from "@/infrastructure/repositories/PrismaMembershipRepository";
import { PrismaOrganisationRepository } from "@/infrastructure/repositories/PrismaOrganisationRepository";
import { PrismaSiteRepository } from "@/infrastructure/repositories/PrismaSiteRepository";
import { AreaService } from "@/services/AreaService";
import { BuildingService } from "@/services/BuildingService";
import { MembershipService } from "@/services/MembershipService";
import { OrganisationService } from "@/services/OrganisationService";
import { SiteService } from "@/services/SiteService";
export function createOrganisationServices() { return { organisations: new OrganisationService(new PrismaOrganisationRepository()), sites: new SiteService(new PrismaSiteRepository()), buildings: new BuildingService(new PrismaBuildingRepository()), areas: new AreaService(new PrismaAreaRepository()), memberships: new MembershipService(new PrismaMembershipRepository()) }; }
