import { describe, expect, it, vi } from "vitest";
import type { AssignmentCandidate, EngineerRepository } from "@/repositories/EngineerRepository";
import { availabilityInputSchema, certificationInputSchema, createEngineerSchema } from "@/dto/engineer.dto";
import { EngineerService, WorkOrderForAssignmentNotFoundError } from "@/services/EngineerService";

const now = new Date("2026-08-27T10:00:00Z");
const candidate = (input: Partial<AssignmentCandidate> & Pick<AssignmentCandidate, "id" | "name">): AssignmentCandidate => ({ employeeNumber: input.id, email: `${input.id}@example.com`, active: true, maxConcurrentWorkOrders: 5, activeWorkOrders: 0, skills: [], certifications: [], availability: [], teams: [], unavailableAt: false, ...input });
const repository = (candidates: AssignmentCandidate[] = []): EngineerRepository => ({
  createEngineer: vi.fn(), listEngineers: vi.fn().mockResolvedValue(candidates), findEngineer: vi.fn(), createTeam: vi.fn(), listTeams: vi.fn(), addSkill: vi.fn(), addCertification: vi.fn(), addAvailability: vi.fn(), addTeamMember: vi.fn(),
  getAssignmentWorkOrder: vi.fn().mockResolvedValue({ id: "wo-1", title: "Electrical motor inspection", description: "Diagnose motor voltage", priority: "High", assetCategory: "Electrical", scheduledStart: now }), listAssignmentCandidates: vi.fn().mockResolvedValue(candidates),
});

describe("EngineerService", () => {
  it("ranks matching, available engineers ahead of unavailable candidates", async () => {
    const matching = candidate({ id: "e-1", name: "Alex", skills: [{ id: "s-1", name: "Electrical diagnostics", category: "Electrical", proficiency: 5, yearsExperience: 8 }] });
    const unavailable = candidate({ id: "e-2", name: "Blair", unavailableAt: true, skills: [{ id: "s-1", name: "Electrical diagnostics", category: "Electrical", proficiency: 5, yearsExperience: 10 }] });
    const recommendations = await new EngineerService(repository([unavailable, matching]), () => now).recommend({ workOrderId: "wo-1", at: now });
    expect(recommendations.map((item) => item.engineerId)).toEqual(["e-1", "e-2"]);
    expect(recommendations[0]).toMatchObject({ available: true, matchedSkills: ["Electrical diagnostics"] });
    expect(recommendations[1].available).toBe(false);
  });
  it("accounts for workload capacity", async () => {
    const free = candidate({ id: "free", name: "Free", activeWorkOrders: 0 }); const busy = candidate({ id: "busy", name: "Busy", activeWorkOrders: 5 });
    const recommendations = await new EngineerService(repository([busy, free]), () => now).recommend({ workOrderId: "wo-1", at: now });
    expect(recommendations[0].engineerId).toBe("free"); expect(recommendations.find((item) => item.engineerId === "busy")?.available).toBe(false);
  });
  it("reports a missing work order", async () => { const repo = repository(); vi.mocked(repo.getAssignmentWorkOrder).mockResolvedValue(null); await expect(new EngineerService(repo).recommend({ workOrderId: "missing", at: now })).rejects.toBeInstanceOf(WorkOrderForAssignmentNotFoundError); });
  it("validates DTOs before repository writes", () => { const repo = repository(); expect(() => new EngineerService(repo).createEngineer({ employeeNumber: "", name: "A", email: "bad", active: true, maxConcurrentWorkOrders: 0 })).toThrow(); expect(repo.createEngineer).not.toHaveBeenCalled(); });
});

describe("engineer DTO validation", () => {
  it("accepts a valid engineer", () => { expect(createEngineerSchema.parse({ employeeNumber: "ENG-01", name: "Alex Morgan", email: "alex@example.com" })).toMatchObject({ active: true, maxConcurrentWorkOrders: 5 }); });
  it("requires availability to end after it starts", () => { expect(availabilityInputSchema.safeParse({ engineerId: "e-1", startsAt: now, endsAt: now, status: "Leave" }).success).toBe(false); });
  it("rejects certification expiry before issue date", () => { expect(certificationInputSchema.safeParse({ engineerId: "e-1", name: "HV", issuer: "Board", issuedAt: "2026-08-27T10:00:00Z", expiresAt: "2025-08-27T10:00:00Z" }).success).toBe(false); });
});
