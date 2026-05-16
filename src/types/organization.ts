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
  
  // マクロ環境分析（羅針盤層）
  companyUrl?: string;
  industry?: string;
  pest?: string;
  fiveForces?: string;
  vrio?: string;
  
  // AI自動更新のバッチ管理
  lastCrawledAt?: number;
  requiresStrategyReview?: boolean; // 環境変化検知フラグ
  
  // エコノミクスと課金 (Agentic Pivot)
  aiCreditBalance?: number;
  subscriptionPlan?: string;

  createdAt: number;
}
