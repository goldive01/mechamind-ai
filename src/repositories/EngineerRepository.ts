import type { Engineer, Team } from "@/domain/entities/Engineer";
import type { AvailabilityInputDto, CertificationInputDto, CreateEngineerDto, CreateTeamDto, SkillInputDto, TeamMembershipInputDto } from "@/dto/engineer.dto";

export interface AssignmentCandidate extends Engineer { unavailableAt: boolean }
export interface AssignmentWorkOrder { id: string; title: string; description: string; priority: string; assetCategory: string; scheduledStart: Date | null }
export interface EngineerRepository {
  createEngineer(input: CreateEngineerDto): Promise<Engineer>;
  listEngineers(at: Date): Promise<Engineer[]>;
  findEngineer(id: string, at: Date): Promise<Engineer | null>;
  createTeam(input: CreateTeamDto): Promise<Team>;
  listTeams(at: Date): Promise<Team[]>;
  addSkill(input: SkillInputDto): Promise<void>;
  addCertification(input: CertificationInputDto): Promise<void>;
  addAvailability(input: AvailabilityInputDto): Promise<void>;
  addTeamMember(input: TeamMembershipInputDto): Promise<void>;
  getAssignmentWorkOrder(id: string): Promise<AssignmentWorkOrder | null>;
  listAssignmentCandidates(at: Date): Promise<AssignmentCandidate[]>;
}
