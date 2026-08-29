import type { Membership } from "@/domain/entities/Organisation";
import type { CreateMembershipDto, UpdateMembershipDto } from "@/dto/organisation.dto";
export interface MembershipRepository { create(input: CreateMembershipDto): Promise<Membership>; update(input: UpdateMembershipDto): Promise<Membership>; list(organisationId: string): Promise<Membership[]>; findForUser(organisationId: string, userId: string): Promise<Membership | null>; remove(organisationId: string, id: string): Promise<boolean>; }
