import type { AssignmentRecommendation, Engineer, Team } from "@/domain/entities/Engineer";
import { assignmentRecommendationInputSchema, availabilityInputSchema, certificationInputSchema, createEngineerSchema, createTeamSchema, skillInputSchema, teamMembershipInputSchema, type AssignmentRecommendationInputDto, type AvailabilityInputDto, type CertificationInputDto, type CreateEngineerDto, type CreateTeamDto, type SkillInputDto, type TeamMembershipInputDto } from "@/dto/engineer.dto";
import type { AssignmentCandidate, EngineerRepository } from "@/repositories/EngineerRepository";

export class EngineerNotFoundError extends Error {}
export class WorkOrderForAssignmentNotFoundError extends Error {}

const terms = (value: string) => new Set(value.toLowerCase().split(/[^a-z0-9+#]+/).filter((term) => term.length > 2));

export class EngineerService {
  constructor(private readonly repository: EngineerRepository, private readonly clock: () => Date = () => new Date()) {}
  createEngineer(input: CreateEngineerDto): Promise<Engineer> { return this.repository.createEngineer(createEngineerSchema.parse(input)); }
  listEngineers(at = this.clock()) { return this.repository.listEngineers(at); }
  async getEngineer(id: string, at = this.clock()) { const engineer = await this.repository.findEngineer(id, at); if (!engineer) throw new EngineerNotFoundError(`Engineer ${id} was not found.`); return engineer; }
  createTeam(input: CreateTeamDto): Promise<Team> { return this.repository.createTeam(createTeamSchema.parse(input)); }
  listTeams(at = this.clock()) { return this.repository.listTeams(at); }
  addSkill(input: SkillInputDto) { return this.repository.addSkill(skillInputSchema.parse(input)); }
  addCertification(input: CertificationInputDto) { return this.repository.addCertification(certificationInputSchema.parse(input)); }
  addAvailability(input: AvailabilityInputDto) { return this.repository.addAvailability(availabilityInputSchema.parse(input)); }
  addTeamMember(input: TeamMembershipInputDto) { return this.repository.addTeamMember(teamMembershipInputSchema.parse(input)); }
  async recommend(input: AssignmentRecommendationInputDto): Promise<AssignmentRecommendation[]> {
    const value = assignmentRecommendationInputSchema.parse(input); const workOrder = await this.repository.getAssignmentWorkOrder(value.workOrderId);
    if (!workOrder) throw new WorkOrderForAssignmentNotFoundError(`Work order ${value.workOrderId} was not found.`);
    const target = terms(`${workOrder.title} ${workOrder.description} ${workOrder.assetCategory}`);
    return (await this.repository.listAssignmentCandidates(value.at)).map((engineer) => this.score(engineer, target)).toSorted((a, b) => b.score - a.score || a.engineerName.localeCompare(b.engineerName)).slice(0, value.limit);
  }
  private score(engineer: AssignmentCandidate, target: Set<string>): AssignmentRecommendation {
    const matched = engineer.skills.filter((skill) => { const skillTerms = terms(`${skill.name} ${skill.category}`); return [...skillTerms].some((term) => target.has(term)); });
    const workloadRatio = engineer.activeWorkOrders / engineer.maxConcurrentWorkOrders; const capacity = Math.max(0, Math.round(25 * (1 - workloadRatio)));
    const skillScore = matched.reduce((score, skill) => score + skill.proficiency * 8 + Math.min(8, Math.round(skill.yearsExperience)), 0);
    const available = engineer.active && !engineer.unavailableAt && workloadRatio < 1;
    const score = Math.max(0, Math.min(100, skillScore + capacity + (available ? 25 : 0)));
    const reasons = [matched.length ? `Matches ${matched.map((skill) => skill.name).join(", ")}.` : "No explicit skill match was found.", `${engineer.activeWorkOrders}/${engineer.maxConcurrentWorkOrders} active work orders.`, available ? "Available for assignment." : "Unavailable or at workload capacity."];
    return { engineerId: engineer.id, engineerName: engineer.name, score, available, workload: engineer.activeWorkOrders, matchedSkills: matched.map((skill) => skill.name), reasons };
  }
}
