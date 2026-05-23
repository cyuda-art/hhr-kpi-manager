export type KpiType = 'KGI' | 'KPI';
export type BusinessUnit = 'company' | 'hotel' | 'spa' | 'restaurant' | 'shop' | 'kitchen' | 'cross';
export type Status = 'good' | 'warning' | 'danger';

export interface KpiHistoryEntry {
  id: string; // 編集・削除用の一意のID
  date: string; // YYYY-MM-DD形式
  actualValue: number;
  targetValue: number;
  comment?: string; // 特記事項・要因など
}

export interface MonthlyData {
  month: string; // "YYYY-MM"
  targetValue: number; // その月の目標
  actualValue: number; // その月の実績
  revisedTargetValue?: number; // ローリング・フォーキャスト用の修正目標
  simulatedValue?: number; // シミュレーション用の仮想実績
  simulatedTargetValue?: number; // シミュレーション用の仮想目標
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
  updateFrequency?: 'daily' | 'weekly' | 'monthly'; // 更新頻度
  calculationFormula?: string; // 計算式（例: "客数 × 客単価"）
  isCalculated?: boolean; // 自動計算列かどうか
  formula?: string; // 自動計算の数式（例: "#{kpi_A} * #{kpi_B}"）
  position?: { x: number; y: number }; // React Flow上の座標
  linkedSource?: { projectId: string; kpiId: string; orgId?: string }; // 他プロジェクトからの同期用リンク情報
  warning?: string; // アラートメッセージ（例: 子要素削除による数式エラーなど）
  mappedSourceId?: string; // AI生成時に既存のアーカイブKPIを復活させた場合の元ID
  isKsf?: boolean; // AI戦略においてKey Success Factor（最重要ノード）と判定されたか
  addedAt?: number; // UI演出用の追加時刻タイムスタンプ
  monthlyData?: Record<string, MonthlyData>; // 月次データ（YYYY-MM形式をキーとする）
  chatMessages?: KpiChatMessage[]; // 対話型PDCA用のチャット履歴
}

// 達成率やステータスは計算で導出する拡張インタフェース
export interface KpiNodeWithComputed extends KpiNodeData {
  achievementRate: number;
  status: Status;
}

export type TaskPriority = 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'not_urgent_not_important' | 'unassigned';

export interface Action {
  id: string;
  kpiId: string;
  title: string;
  description?: string;
  owner: string;
  department?: string;
  startDate?: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: TaskPriority;
  mappedSourceId?: string; // AI生成時に既存のアーカイブActionを復活させた場合の元ID
  
  // 自律型エージェント用拡張 (Agentic Pivot)
  isAiAgentTask?: boolean; // 人間ではなくAIエージェントが実行するか
  agentStatus?: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  agentLog?: string; // ターミナルログ
  createdAt?: number;
}

export interface ProjectInfo {
  name: string;
  description: string; // URLまたは事業概要テキスト
  mvv?: string; // NG行動・制約条件
  manifesto?: string; // AI生成ウィザードで選択された作戦シナリオ
  kgiType?: string; // KGIの種類（売上高、ARRなど）
  kgiTargetValue?: number; // KGIの目標数値
  businessModelType?: string; // ビジネスモデルの型（SaaS、店舗など）
  // 過去バージョンとの互換性用
  industry?: string;
  revenueScale?: string;
  currentIssues?: string;
  statusThresholds?: {
    good: number;
    warning: number;
  };
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
  kpi_name: string;
  target_value: number;
  unit: string;
  tasks: WorkflowTask[];
}

export interface AiWorkflow {
  ksf_analysis: string;
  workflow: WorkflowPhase[];
  kpi_advice: string;
  generatedAt: number;
}

export interface AuditLog {
  id: string;
  projectId: string;
  kpiId: string;
  userId: string;
  userName: string;
  timestamp: number;
  action: 'UPDATE_VALUE' | 'COMPLETE_TODO' | 'ADD_TODO' | 'DELETE_TODO' | 'OTHER';
  previousValue?: number | string;
  newValue?: number | string;
  actionId?: string; // 関連するToDoのID
  evidenceText?: string; // チャット内容や変更理由などの証拠
  details?: string; // その他の詳細情報（JSON等）
  source: 'user_chat' | 'manual_edit' | 'ai_automation';
}

export interface KpiChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  toolCalls?: any[]; // For Function Calling
}

