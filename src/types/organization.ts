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
  
  // 組織の基本理念・概要
  managementPhilosophy?: string; // 経営理念
  masterMvv?: string; // 企業理念（Mission, Vision, Values等）
  companyUrl?: string; // 企業サイトURL
  businessDescription?: string; // 事業内容（提案：AIのコンテキスト用）
  targetMarket?: string; // ターゲット市場/主要顧客（提案：AIのコンテキスト用）
  
  // マクロ環境分析（羅針盤層）
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
