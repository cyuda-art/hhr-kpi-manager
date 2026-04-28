export type KpiType = 'KGI' | 'KPI';
export type BusinessUnit = 'company' | 'hotel' | 'spa' | 'restaurant' | 'shop' | 'kitchen' | 'cross';
export type Status = 'good' | 'warning' | 'danger';

export interface KpiNodeData {
  id: string;
  name: string;
  businessUnit: BusinessUnit;
  type: KpiType;
  parentId: string | null;
  targetValue: number;
  actualValue: number;
  unit: string;
  previousValue: number;
  description: string;
}

// 達成率やステータスは計算で導出する拡張インタフェース
export interface KpiNodeWithComputed extends KpiNodeData {
  achievementRate: number;
  status: Status;
  isSimulated?: boolean;
}

export interface Action {
  id: string;
  kpiId: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
}

