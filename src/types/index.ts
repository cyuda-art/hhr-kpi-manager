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
  simulatedValue?: number; // シミュレーションモード中の仮想実績値
  simulatedAchievementRate?: number; // シミュレーションモード中の仮想達成率
  simulatedStatus?: Status; // シミュレーションモード中の仮想ステータス
}

export interface Action {
  id: string;
  kpiId: string;
  title: string;
  owner: string;
  department?: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
}

