export interface Organisation { id: string; slug: string; name: string; description: string | null; active: boolean; createdAt: Date; updatedAt: Date }
export interface Site { id: string; organisationId: string; code: string; name: string; address: string | null; active: boolean; createdAt: Date; updatedAt: Date }
export interface Building { id: string; siteId: string; code: string; name: string; active: boolean; createdAt: Date; updatedAt: Date }
export interface Area { id: string; buildingId: string; code: string; name: string; description: string | null; active: boolean; createdAt: Date; updatedAt: Date }
export interface Membership { id: string; organisationId: string; userId: string; roleId: string | null; active: boolean; createdAt: Date; updatedAt: Date }
export interface OrganisationScope { organisationId: string }
