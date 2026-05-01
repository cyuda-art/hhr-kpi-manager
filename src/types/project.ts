export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  description?: string;
  members?: string[]; // 参加メンバーのUID配列
}
