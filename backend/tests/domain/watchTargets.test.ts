import { describe, it, expect } from "vitest";
import {
  createCompany,
  createGroup,
  attachCompanyToGroup,
  detachCompanyFromGroup,
  type WatchTargetsSnapshot,
} from "../../src/domain/watchTargets.js";

describe("watchTargets domain logic", () => {
  it("createGroup should initialize with deduped companyIds", () => {
    const group = createGroup({
      id: "g1",
      name: "Default Group",
      companyIds: ["c1", "c2", "c1"],
    });

    expect(group).toEqual({
      id: "g1",
      name: "Default Group",
      description: undefined,
      companyIds: ["c1", "c2"],
    });
  });

  it("createCompany should initialize with defaults and deduped groupIds", () => {
    const company = createCompany({
      id: "c1",
      name: "Example Corp",
      pressReleaseUrl: "https://example.com/press",
      groupIds: ["g1", "g2", "g1"],
    });

    expect(company.id).toBe("c1");
    expect(company.enabled).toBe(true);
    expect(company.groupIds).toEqual(["g1", "g2"]);
  });

  it("attachCompanyToGroup should update both group and company", () => {
    const snapshot: WatchTargetsSnapshot = {
      groups: [
        createGroup({ id: "g1", name: "Group 1" }),
        createGroup({ id: "g2", name: "Group 2" }),
      ],
      companies: [
        createCompany({
          id: "c1",
          name: "Company 1",
          pressReleaseUrl: "https://example.com/p1",
        }),
      ],
    };

    const next = attachCompanyToGroup(snapshot, "c1", "g1");

    const group = next.groups.find((g) => g.id === "g1")!;
    const company = next.companies.find((c) => c.id === "c1")!;

    expect(group.companyIds).toEqual(["c1"]);
    expect(company.groupIds).toEqual(["g1"]);
  });

  it("attachCompanyToGroup should be idempotent", () => {
    const snapshot: WatchTargetsSnapshot = {
      groups: [createGroup({ id: "g1", name: "Group 1", companyIds: ["c1"] })],
      companies: [
        createCompany({
          id: "c1",
          name: "Company 1",
          pressReleaseUrl: "https://example.com/p1",
          groupIds: ["g1"],
        }),
      ],
    };

    const next = attachCompanyToGroup(snapshot, "c1", "g1");

    const group = next.groups[0];
    const company = next.companies[0];

    expect(group.companyIds).toEqual(["c1"]);
    expect(company.groupIds).toEqual(["g1"]);
  });

  it("detachCompanyFromGroup should update both group and company", () => {
    const snapshot: WatchTargetsSnapshot = {
      groups: [createGroup({ id: "g1", name: "Group 1", companyIds: ["c1"] })],
      companies: [
        createCompany({
          id: "c1",
          name: "Company 1",
          pressReleaseUrl: "https://example.com/p1",
          groupIds: ["g1"],
        }),
      ],
    };

    const next = detachCompanyFromGroup(snapshot, "c1", "g1");

    const group = next.groups[0];
    const company = next.companies[0];

    expect(group.companyIds).toEqual([]);
    expect(company.groupIds).toEqual([]);
  });

  it("detachCompanyFromGroup should be idempotent when relation does not exist", () => {
    const snapshot: WatchTargetsSnapshot = {
      groups: [createGroup({ id: "g1", name: "Group 1" })],
      companies: [
        createCompany({
          id: "c1",
          name: "Company 1",
          pressReleaseUrl: "https://example.com/p1",
        }),
      ],
    };

    const next = detachCompanyFromGroup(snapshot, "c1", "g1");

    const group = next.groups[0];
    const company = next.companies[0];

    expect(group.companyIds).toEqual([]);
    expect(company.groupIds).toEqual([]);
  });

  it("attachCompanyToGroup should throw if group not found", () => {
    const snapshot: WatchTargetsSnapshot = {
      groups: [],
      companies: [
        createCompany({
          id: "c1",
          name: "Company 1",
          pressReleaseUrl: "https://example.com/p1",
        }),
      ],
    };

    expect(() => attachCompanyToGroup(snapshot, "c1", "g1")).toThrowError(
      "Group not found: g1"
    );
  });

  it("attachCompanyToGroup should throw if company not found", () => {
    const snapshot: WatchTargetsSnapshot = {
      groups: [createGroup({ id: "g1", name: "Group 1" })],
      companies: [],
    };

    expect(() => attachCompanyToGroup(snapshot, "c1", "g1")).toThrowError(
      "Company not found: c1"
    );
  });
});
