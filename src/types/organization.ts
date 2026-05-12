export type Role = 'admin' | 'editor' | 'viewer';

export interface OrgMember {
  userId: string;
  role: Role;
  joinedAt: number;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  members: OrgMember[];
  membersUidList?: string[]; // クエリ用のUID配列
  masterMvv?: string; // 組織全体のMission, Vision, Valuesおよび制約条件
  createdAt: number;
}
