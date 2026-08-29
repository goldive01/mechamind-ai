import { describe, expect, it } from "vitest";
import { createBuildingSchema, createOrganisationSchema, createSiteSchema } from "@/dto/organisation.dto";
describe("organisation DTOs", () => {
  it("normalises location codes", () => { expect(createSiteSchema.parse({ organisationId: "org-1", code: "north-1", name: "North site" }).code).toBe("NORTH-1"); });
  it("rejects unsafe slugs", () => { expect(() => createOrganisationSchema.parse({ slug: "North Plant", name: "North Plant" })).toThrow(); });
  it("requires the organisation boundary on nested locations", () => { expect(() => createBuildingSchema.parse({ siteId: "site-1", code: "B1", name: "Building 1" })).toThrow(); });
});
