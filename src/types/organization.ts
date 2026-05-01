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
  createdAt: number;
}
