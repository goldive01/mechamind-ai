import { z } from "zod";
import { availabilityStatuses } from "@/domain/entities/Engineer";

const optionalDate = z.union([z.date(), z.iso.datetime().transform((value) => new Date(value))]).nullable().optional();
export const createEngineerSchema = z.object({ employeeNumber: z.string().trim().min(2).max(40), name: z.string().trim().min(2).max(120), email: z.email(), active: z.boolean().default(true), maxConcurrentWorkOrders: z.number().int().min(1).max(50).default(5) });
export const createTeamSchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000).nullable().optional(), active: z.boolean().default(true) });
export const skillInputSchema = z.object({ engineerId: z.string().min(1), name: z.string().trim().min(2).max(100), category: z.string().trim().min(2).max(80), proficiency: z.number().int().min(1).max(5), yearsExperience: z.number().min(0).max(70) });
export const certificationInputSchema = z.object({ engineerId: z.string().min(1), name: z.string().trim().min(2).max(160), issuer: z.string().trim().min(2).max(160), credentialCode: z.string().trim().max(100).nullable().optional(), issuedAt: optionalDate, expiresAt: optionalDate }).refine((value) => !value.issuedAt || !value.expiresAt || value.expiresAt >= value.issuedAt, { message: "Expiry must be on or after issue date.", path: ["expiresAt"] });
export const availabilityInputSchema = z.object({ engineerId: z.string().min(1), startsAt: z.union([z.date(), z.iso.datetime().transform((value) => new Date(value))]), endsAt: z.union([z.date(), z.iso.datetime().transform((value) => new Date(value))]), status: z.enum(availabilityStatuses), note: z.string().trim().max(500).nullable().optional() }).refine((value) => value.endsAt > value.startsAt, { message: "Availability end must be after its start.", path: ["endsAt"] });
export const teamMembershipInputSchema = z.object({ teamId: z.string().min(1), engineerId: z.string().min(1), role: z.string().trim().min(2).max(80).default("Member") });
export const assignmentRecommendationInputSchema = z.object({ workOrderId: z.string().min(1), at: z.union([z.date(), z.iso.datetime().transform((value) => new Date(value))]).default(() => new Date()), limit: z.number().int().min(1).max(20).default(5) });
export type CreateEngineerDto = z.infer<typeof createEngineerSchema>;
export type CreateTeamDto = z.infer<typeof createTeamSchema>;
export type SkillInputDto = z.infer<typeof skillInputSchema>;
export type CertificationInputDto = z.infer<typeof certificationInputSchema>;
export type AvailabilityInputDto = z.infer<typeof availabilityInputSchema>;
export type TeamMembershipInputDto = z.infer<typeof teamMembershipInputSchema>;
export type AssignmentRecommendationInputDto = z.input<typeof assignmentRecommendationInputSchema>;
