export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  description?: string;
  businessModel?: string; // 追加
  targetAudience?: string; // 追加
  members?: string[]; // 参加メンバーのUID配列
}
