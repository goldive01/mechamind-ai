export const availabilityStatuses = ["Available", "Unavailable", "Leave", "Training"] as const;
export type AvailabilityStatus = typeof availabilityStatuses[number];

export interface EngineerSkill { id: string; name: string; category: string; proficiency: number; yearsExperience: number }
export interface EngineerCertification { id: string; name: string; issuer: string; credentialCode: string | null; issuedAt: Date | null; expiresAt: Date | null }
export interface EngineerAvailability { id: string; startsAt: Date; endsAt: Date; status: AvailabilityStatus; note: string | null }
export interface Engineer {
  id: string; employeeNumber: string; name: string; email: string; active: boolean; maxConcurrentWorkOrders: number;
  skills: EngineerSkill[]; certifications: EngineerCertification[]; availability: EngineerAvailability[];
  teams: Array<{ id: string; name: string; role: string }>; activeWorkOrders: number;
}
export interface Team { id: string; name: string; description: string | null; active: boolean; members: Array<{ engineerId: string; name: string; role: string; available: boolean }>; activeWorkOrders: number }
export interface AssignmentRecommendation { engineerId: string; engineerName: string; score: number; available: boolean; workload: number; matchedSkills: string[]; reasons: string[] }
