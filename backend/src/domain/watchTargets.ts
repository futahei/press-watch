export type GroupId = string;
export type CompanyId = string;

/**
 * 監視対象の企業。
 * （DynamoDB の物理スキーマとは切り離した、純粋なドメインモデル）
 */
export interface Company {
  id: CompanyId;
  /** 表示名（企業名） */
  name: string;
  /** プレスリリース一覧ページなど、クロール対象となる URL */
  pressReleaseUrl: string;
  /** 監視対象として有効かどうか */
  enabled: boolean;
  /** 所属するグループ ID の一覧（多対多を許容） */
  groupIds: GroupId[];
}

/**
 * 記事を束ねるグループ。
 * 例: "default", "manufacturing", "my-favorite"
 */
export interface Group {
  id: GroupId;
  /** 表示名 */
  name: string;
  /** 任意の説明文 */
  description?: string;
  /** グループに含まれる企業 ID の一覧 */
  companyIds: CompanyId[];
}

/**
 * 設定全体のスナップショット。
 * - 将来的にはこれを DynamoDB の物理モデルにマッピングする想定。
 */
export interface WatchTargetsSnapshot {
  groups: Group[];
  companies: Company[];
}

/**
 * グループを新規作成する純粋関数。
 */
export function createGroup(input: {
  id: GroupId;
  name: string;
  description?: string;
  companyIds?: CompanyId[];
}): Group {
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    companyIds: dedupe(input.companyIds ?? []),
  };
}

/**
 * 企業を新規作成する純粋関数。
 */
export function createCompany(input: {
  id: CompanyId;
  name: string;
  pressReleaseUrl: string;
  enabled?: boolean;
  groupIds?: GroupId[];
}): Company {
  return {
    id: input.id,
    name: input.name,
    pressReleaseUrl: input.pressReleaseUrl,
    enabled: input.enabled ?? true,
    groupIds: dedupe(input.groupIds ?? []),
  };
}

/**
 * グループに企業 ID を追加（重複は追加しない）。
 */
export function addCompanyToGroup(group: Group, companyId: CompanyId): Group {
  if (group.companyIds.includes(companyId)) {
    return group;
  }
  return {
    ...group,
    companyIds: [...group.companyIds, companyId],
  };
}

/**
 * グループから企業 ID を削除。
 */
export function removeCompanyFromGroup(
  group: Group,
  companyId: CompanyId
): Group {
  if (!group.companyIds.includes(companyId)) {
    return group;
  }
  return {
    ...group,
    companyIds: group.companyIds.filter((id) => id !== companyId),
  };
}

/**
 * 企業にグループ ID を追加（重複は追加しない）。
 */
export function addGroupToCompany(company: Company, groupId: GroupId): Company {
  if (company.groupIds.includes(groupId)) {
    return company;
  }
  return {
    ...company,
    groupIds: [...company.groupIds, groupId],
  };
}

/**
 * 企業からグループ ID を削除。
 */
export function removeGroupFromCompany(
  company: Company,
  groupId: GroupId
): Company {
  if (!company.groupIds.includes(groupId)) {
    return company;
  }
  return {
    ...company,
    groupIds: company.groupIds.filter((id) => id !== groupId),
  };
}

/**
 * スナップショット全体に対して、
 * 特定の companyId を特定の groupId に所属させる。
 *
 * - グループ・企業が存在しない場合は Error
 * - 双方向（Group.companyIds / Company.groupIds）を更新
 * - 既に紐付いている場合は idempotent
 */
export function attachCompanyToGroup(
  snapshot: WatchTargetsSnapshot,
  companyId: CompanyId,
  groupId: GroupId
): WatchTargetsSnapshot {
  const groupIndex = snapshot.groups.findIndex((g) => g.id === groupId);
  if (groupIndex === -1) {
    throw new Error(`Group not found: ${groupId}`);
  }

  const companyIndex = snapshot.companies.findIndex((c) => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const updatedGroup = addCompanyToGroup(
    snapshot.groups[groupIndex],
    companyId
  );
  const updatedCompany = addGroupToCompany(
    snapshot.companies[companyIndex],
    groupId
  );

  const nextGroups = snapshot.groups.slice();
  nextGroups[groupIndex] = updatedGroup;

  const nextCompanies = snapshot.companies.slice();
  nextCompanies[companyIndex] = updatedCompany;

  return {
    groups: nextGroups,
    companies: nextCompanies,
  };
}

/**
 * スナップショット全体に対して、
 * 特定の companyId と groupId の紐付けを解除する。
 *
 * - グループ・企業が存在しない場合は Error
 * - 双方向（Group.companyIds / Company.groupIds）を更新
 * - そもそも紐付いていなかった場合は idempotent
 */
export function detachCompanyFromGroup(
  snapshot: WatchTargetsSnapshot,
  companyId: CompanyId,
  groupId: GroupId
): WatchTargetsSnapshot {
  const groupIndex = snapshot.groups.findIndex((g) => g.id === groupId);
  if (groupIndex === -1) {
    throw new Error(`Group not found: ${groupId}`);
  }

  const companyIndex = snapshot.companies.findIndex((c) => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const updatedGroup = removeCompanyFromGroup(
    snapshot.groups[groupIndex],
    companyId
  );
  const updatedCompany = removeGroupFromCompany(
    snapshot.companies[companyIndex],
    groupId
  );

  const nextGroups = snapshot.groups.slice();
  nextGroups[groupIndex] = updatedGroup;

  const nextCompanies = snapshot.companies.slice();
  nextCompanies[companyIndex] = updatedCompany;

  return {
    groups: nextGroups,
    companies: nextCompanies,
  };
}

/**
 * 配列の重複を取り除くユーティリティ。
 */
function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
