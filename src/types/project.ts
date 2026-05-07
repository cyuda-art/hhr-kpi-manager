export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  description?: string;
  businessModel?: string;
  targetAudience?: string;
  mvv?: string;
  industry?: string;
  revenueScale?: string;
  currentIssues?: string;
  members?: string[]; // 参加メンバーのUID配列
}
