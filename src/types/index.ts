export type KpiType = 'KGI' | 'KPI';
export type BusinessUnit = 'company' | 'hotel' | 'spa' | 'restaurant' | 'shop' | 'kitchen' | 'cross';
export type Status = 'good' | 'warning' | 'danger';

export interface KpiHistoryEntry {
  date: string; // YYYY-MM-DD形式
  actualValue: number;
  targetValue: number;
}

export interface KpiNodeData {
  id: string;
  name: string; // KGIまたはKPIの名称（定量）
  qualitativeName?: string; // GoalまたはKSFの名称（定性）
  businessUnit: BusinessUnit;
  type: KpiType;
  parentId: string | null;
  targetValue: number;
  actualValue: number;
  unit: string;
  previousValue: number;
  description: string;
  history?: KpiHistoryEntry[]; // 時系列データ
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

export interface ProjectInfo {
  name: string;
  description: string;
  mvv?: string;
  industry?: string;
  revenueScale?: string;
  currentIssues?: string;
}

export interface WorkflowTask {
  task_name: string;
  description: string;
  expected_impact: 'High' | 'Medium' | 'Low';
  effort_level: 'Small' | 'Medium' | 'Large';
  focus_point: string;
}

export interface WorkflowPhase {
  phase_name: string;
  objective: string;
  tasks: WorkflowTask[];
}

export interface AiWorkflow {
  ksf_analysis: string;
  workflow: WorkflowPhase[];
  kpi_advice: string;
  generatedAt: number;
}

