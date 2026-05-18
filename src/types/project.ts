export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  description?: string;
  businessModel?: string;
  targetAudience?: string;
  mvv?: string;
  manifesto?: string; // AI生成ウィザードで選択された作戦シナリオ
  kgiType?: string;
  kgiPeriod?: string;
  kgiTargetValue?: number;
  businessModelType?: string;
  industry?: string;
  revenueScale?: string;
  currentIssues?: string;
  members?: string[]; // 参加メンバーのUID配列
  
  // ミクロ環境・動的分析（地図層）
  swot?: string;
  crossSwot?: string;
  ansoff?: string;

  statusThresholds?: {
    good: number;
    warning: number;
  };
}
