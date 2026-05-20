import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KpiNodeData, KpiNodeWithComputed, Status, Action, AiWorkflow } from '@/types';


export interface KpiNodeWithComputedAndInit extends KpiNodeWithComputed {
  initialActualValue: number;
}

interface KpiStore {
  kpiData: Record<string, KpiNodeWithComputedAndInit>;
  projectData: Record<string, { projectInfo?: import('@/types').ProjectInfo, kpiData: Record<string, KpiNodeWithComputedAndInit>; actions: Action[]; workflows?: Record<string, AiWorkflow> }>;
  selectedNodeId: string | null;
  collapsedNodes: string[]; // 折りたたまれたノードのID配列
  actions: Action[];
  workflows: Record<string, AiWorkflow>;
  isDbInitialized: boolean;
  currentProjectId: string | null;
  currentOrgId: string | null;
  currentProjectInfo: import('@/types').ProjectInfo | null;
  currentPeriod: string;
  isCopilotSidebarOpen: boolean;
  setIsCopilotSidebarOpen: (isOpen: boolean) => void;
  isAiGenerating: boolean;
  setIsAiGenerating: (isGenerating: boolean) => void;
  setPeriod: (period: string) => void;
  togglePredictionMode: () => void;
  initializeDB: (projectId: string, orgId: string, projectName?: string, projectDesc?: string) => Promise<void>;
  updateSimulatedValue: (id: string, newValue: number) => void;
  updateSimulatedTarget: (id: string, newValue: number) => void;
  setSelectedNodeId: (id: string | null) => void;
  addAction: (action: Omit<Action, 'id'>) => void;
  updateAction: (id: string, updates: Partial<Action>) => void;
  deleteAction: (id: string) => void;
  removeAction: (id: string) => void;
  toggleActionStatus: (actionId: string) => void;
  setActionsBulk: (actions: Action[]) => void;
  setAiWorkflow: (kpiId: string, workflow: AiWorkflow) => void;
  commitBulkUpdate: (updates: { id: string; value: number }[]) => void;
  addKpiNode: (node: KpiNodeData) => void;
  removeKpiNode: (id: string) => void;
  updateKpiNode: (id: string, data: Partial<KpiNodeData>) => void;
  updateKpiNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateKpiNodePositionsBulk: (positions: { id: string; position: { x: number; y: number } }[]) => void;
  setKpiDataBulk: (nodes: KpiNodeData[]) => void;
  bulkUpdateMonthlyData: (updates: { kpiId: string, month: string, targetValue?: number, actualValue?: number }[]) => void;
  overwriteKpiData: (kpiData: Record<string, KpiNodeWithComputedAndInit>) => void;
  toggleNodeCollapse: (id: string) => void;
  setProjectInfo: (info: Partial<import('@/types').ProjectInfo>) => void;
  // 時系列データ管理
  addHistoryRecord: (kpiId: string, record: Omit<import('@/types').KpiHistoryEntry, 'id'>) => void;
  updateHistoryRecord: (kpiId: string, recordId: string, updates: Partial<import('@/types').KpiHistoryEntry>) => void;
  deleteHistoryRecord: (kpiId: string, recordId: string) => void;
  // 履歴管理（Undo/Redo用）
  pastStates: { kpiData: Record<string, KpiNodeWithComputedAndInit>, actions: Action[] }[];
  futureStates: { kpiData: Record<string, KpiNodeWithComputedAndInit>, actions: Action[] }[];
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  reviveKpiNode: (id: string, newParentId: string | null) => void;
  expandKpiNode: (kpiId: string) => Promise<void>;
  smartAddKpi: (query: string) => Promise<void>;
  applySmartAddPatch: (patchData: { updatedParent?: any, updatedNodes?: any[], newNodes?: any[] }) => Promise<void>;
  applyRollingForecast: (kpiId: string, additionalTargetPerMonth: number, targetMonths: string[]) => void;
  recalculateAllMonthsAction: () => void;
  smartAddMessages: { role: string; content: string }[];
  setSmartAddMessages: (messages: { role: string; content: string }[] | ((prev: { role: string; content: string }[]) => { role: string; content: string }[])) => void;
  recentlyUpdatedNodes: string[];
  setRecentlyUpdatedNodes: (nodes: string[]) => void;
  addAuditLog: (log: Omit<import('@/types').AuditLog, 'id' | 'projectId' | 'timestamp'>) => Promise<void>;
  fetchAuditLogs: (kpiId: string) => Promise<import('@/types').AuditLog[]>;
  addChatMessage: (kpiId: string, message: Omit<import('@/types').KpiChatMessage, 'id' | 'timestamp'>) => void;
}

// データベース(PostgreSQL API)更新用のヘルパー関数
const syncToDB = async (
  projectId: string | null, 
  orgId: string | null, 
  updates: {
    kpiData?: Record<string, KpiNodeWithComputedAndInit>;
    actions?: Action[];
    workflows?: Record<string, AiWorkflow>;
    collapsedNodes?: string[];
    isPredictionMode?: boolean;
    projectInfo?: any;
  }
) => {
  if (!projectId || !orgId) return;
  
  const isForce = (updates as any)._forceSync === true;
  if (!isForce && !useKpiStore.getState().isDbInitialized) {
    console.log("syncToDB aborted: DB is not initialized yet.");
    return;
  }

  console.log("🚀 [syncToDB] Start syncing to PostgreSQL. updates keys:", Object.keys(updates));

  try {
    const storeState = useKpiStore.getState();
    const kpiDataToSend = updates.kpiData || storeState.kpiData;
    const actionsToSend = updates.actions || storeState.actions;

    const res = await fetch(`/api/projects/${projectId}/kpi-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kpiData: kpiDataToSend,
        actions: actionsToSend
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("❌ [syncToDB] API Error:", errData.error);
    } else {
      console.log("✅ [syncToDB] Successfully synced to PostgreSQL.");
    }
  } catch (error) {
    console.error("❌ [syncToDB] PostgreSQL Sync Error:", error);
  }
};

const calculateComputed = (node: Partial<KpiNodeWithComputedAndInit>, customThresholds?: { good: number, warning: number }): KpiNodeWithComputedAndInit => {
  const actualValue = node.actualValue !== undefined && node.actualValue !== null ? node.actualValue : 0;
  const targetValue = node.targetValue !== undefined && node.targetValue !== null ? node.targetValue : 1;
  const initialActualValue = node.initialActualValue !== undefined && node.initialActualValue !== null ? node.initialActualValue : actualValue;
  const previousValue = node.previousValue !== undefined && node.previousValue !== null ? node.previousValue : actualValue;
  
  let achievementRate = targetValue === 0 ? 0 : (actualValue / targetValue) * 100;
  
  if (node.name?.includes('原価率') || node.name?.includes('キャンセル率') || node.name?.includes('コスト')) {
    achievementRate = actualValue === 0 ? 0 : (targetValue / actualValue) * 100;
  }

  const thresholds = customThresholds || useKpiStore.getState().currentProjectInfo?.statusThresholds || { good: 100, warning: 80 };

  let status: Status = 'good';
  if (achievementRate < thresholds.warning) {
    status = 'danger';
  } else if (achievementRate < thresholds.good) {
    status = 'warning';
  }

  // シミュレーション用の計算
  let simulatedAchievementRate = undefined;
  let simulatedStatus = undefined;
  if (node.simulatedValue !== undefined) {
    simulatedAchievementRate = targetValue === 0 ? 0 : (node.simulatedValue / targetValue) * 100;
    if (node.name?.includes('原価率') || node.name?.includes('キャンセル率') || node.name?.includes('コスト')) {
      simulatedAchievementRate = node.simulatedValue === 0 ? 0 : (targetValue / node.simulatedValue) * 100;
    }
    simulatedStatus = 'good' as Status;
    if (simulatedAchievementRate < thresholds.warning) {
      simulatedStatus = 'danger';
    } else if (simulatedAchievementRate < thresholds.good) {
      simulatedStatus = 'warning';
    }
  }

  let newHistory = node.history ? [...node.history] : [];
  
  // 履歴データが空の場合（プロジェクト作成時など）、初期値として今日の履歴を1行追加する
  if (newHistory.length === 0 && !node.isSimulated && node.simulatedValue === undefined) {
    newHistory.push({
      id: `hist_init_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      targetValue: targetValue,
      actualValue: actualValue,
      comment: '初期データ作成'
    });
  }

  return {
    ...node,
    actualValue,
    targetValue,
    initialActualValue,
    previousValue,
    achievementRate,
    status,
    history: newHistory,
    ...(simulatedAchievementRate !== undefined ? { simulatedAchievementRate, simulatedStatus } : {})
  } as KpiNodeWithComputedAndInit;
};

const initialData: Record<string, KpiNodeWithComputedAndInit> = {};

// --- 動的計算エンジン ---
// 数式のAIブレを吸収するサニタイズ関数（名前ベースで数式が書かれていた場合にIDに自動置換する）
const sanitizeKpiData = (draft: Record<string, KpiNodeWithComputedAndInit>) => {
  const nameToIdMap: Record<string, string> = {};
  Object.values(draft).forEach(node => {
    nameToIdMap[node.name] = node.id;
  });

  Object.values(draft).forEach(node => {
    if (node.isCalculated && node.formula) {
      let newFormula = node.formula;
      
      // 1. #{名前} のパターンを補正
      newFormula = newFormula.replace(/#\{([^}]+)\}/g, (match, nameOrId) => {
        if (draft[nameOrId]) return match; // 既にIDならOK
        if (nameToIdMap[nameOrId]) return `#{${nameToIdMap[nameOrId]}}`;
        return match;
      });

      // 2. [名前] のパターンを補正（AIがよく間違う）
      newFormula = newFormula.replace(/\[([^\]]+)\]/g, (match, nameOrId) => {
        if (draft[nameOrId]) return `#{${nameOrId}}`;
        if (nameToIdMap[nameOrId]) return `#{${nameToIdMap[nameOrId]}}`;
        return match;
      });
      
      node.formula = newFormula;
    }
  });
};

const evaluateFormula = (formulaStr: string, kpiData: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue' | 'simulatedValue' | 'simulatedTargetValue', currentPeriod: string): number | null => {
  if (!formulaStr) return null;
  let parsedFormula = formulaStr;
  
  // 例: "#{kpi_123} + #{kpi_456}" の形式をパース
  const regex = /#\{([^}]+)\}/g;
  parsedFormula = parsedFormula.replace(regex, (match, id) => {
    const node = kpiData[id];
    if (node) {
      let val: number;
      const isMonth = currentPeriod.match(/^\d{4}-\d{2}$/);
      
      const getVal = (field: 'actualValue' | 'targetValue' | 'simulatedValue' | 'simulatedTargetValue') => {
        if (isMonth && node.monthlyData && node.monthlyData[currentPeriod] && node.monthlyData[currentPeriod][field] !== undefined) {
          return node.monthlyData[currentPeriod][field]!;
        }
        return node[field] || 0;
      };

      if (valueType === 'simulatedValue') {
        val = getVal('simulatedValue');
        if (val === 0 && (!isMonth || !node.monthlyData || !node.monthlyData[currentPeriod] || node.monthlyData[currentPeriod].simulatedValue === undefined)) {
          val = getVal('actualValue');
        }
      } else if (valueType === 'simulatedTargetValue') {
        val = getVal('simulatedTargetValue');
        if (val === 0 && (!isMonth || !node.monthlyData || !node.monthlyData[currentPeriod] || node.monthlyData[currentPeriod].simulatedTargetValue === undefined)) {
          val = getVal('targetValue');
        }
      } else {
        val = getVal(valueType);
      }
      return val.toString();
    }
    return '0';
  });

  // 全角記号も念の為サポート
  parsedFormula = parsedFormula.replace(/×/g, '*').replace(/÷/g, '/').replace(/＋/g, '+').replace(/－/g, '-');

  try {
    // 許可する文字：数字、小数点、四則演算記号、括弧、スペースのみ
    if (/^[0-9\.\+\-\*\/\(\)\s]+$/.test(parsedFormula)) {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${parsedFormula}`)();
      return isNaN(result) ? null : result;
    }
    return null;
  } catch (e) {
    return null;
  }
};

// トポロジカルソートを用いた計算ツリーの再計算
const recalculateTree = (draft: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue' | 'simulatedValue' | 'simulatedTargetValue', currentPeriod: string) => {
  const inDegree: Record<string, number> = {};
  const graph: Record<string, string[]> = {};
  const nodesWithFormula: string[] = [];

  // 初期化
  Object.keys(draft).forEach(id => {
    inDegree[id] = 0;
    graph[id] = [];
  });

  // 依存関係（DAG）の構築
  Object.values(draft).forEach(node => {
    if (node.isCalculated && node.formula) {
      nodesWithFormula.push(node.id);
      const regex = /#\{([^}]+)\}/g;
      let match;
      while ((match = regex.exec(node.formula)) !== null) {
        const depId = match[1];
        if (draft[depId]) {
          // depIdも計算ノードである場合のみ、その完了を待つ必要がある（末端ノードの場合は値が確定済みのため待たない）
          if (draft[depId].isCalculated && draft[depId].formula) {
            graph[depId].push(node.id); // depIdが更新されたら、node.idを更新する必要がある
            inDegree[node.id] = (inDegree[node.id] || 0) + 1;
          }
        }
      }
    }
  });

  // inDegreeが0の（他への依存がない）数式ノードからQueueに追加
  const queue: string[] = [];
  nodesWithFormula.forEach(id => {
    if (inDegree[id] === 0) queue.push(id);
  });

  let processedCount = 0;

  while (queue.length > 0) {
    const currId = queue.shift()!;
    processedCount++;

    const node = draft[currId];
    if (node && node.isCalculated && node.formula) {
      const newValue = evaluateFormula(node.formula, draft, valueType, currentPeriod);
      if (newValue !== null && !isNaN(newValue) && isFinite(newValue)) {
        const isMonth = currentPeriod.match(/^\d{4}-\d{2}$/);
        let targetObj: Record<string, any> | undefined = undefined;
        if (isMonth) {
          targetObj = draft[node.id].monthlyData || {};
          if (!targetObj[currentPeriod]) {
            targetObj[currentPeriod] = { month: currentPeriod, targetValue: draft[node.id].targetValue, actualValue: draft[node.id].actualValue };
          }
        }

        if (valueType === 'simulatedValue') {
          if (isMonth && targetObj) {
            targetObj[currentPeriod].simulatedValue = newValue;
            draft[node.id] = calculateComputed({ ...draft[node.id], monthlyData: targetObj, isSimulated: true });
          } else {
            draft[node.id] = calculateComputed({ ...draft[node.id], simulatedValue: newValue, isSimulated: true });
          }
        } else if (valueType === 'simulatedTargetValue') {
          if (isMonth && targetObj) {
            targetObj[currentPeriod].simulatedTargetValue = newValue;
            draft[node.id] = calculateComputed({ ...draft[node.id], monthlyData: targetObj, isSimulated: true });
          } else {
            draft[node.id] = calculateComputed({ ...draft[node.id], simulatedTargetValue: newValue, isSimulated: true });
          }
        } else if (valueType === 'targetValue') {
          if (isMonth && targetObj) {
            targetObj[currentPeriod].targetValue = newValue;
            draft[node.id] = calculateComputed({ ...draft[node.id], monthlyData: targetObj });
          } else {
            draft[node.id] = calculateComputed({ ...draft[node.id], targetValue: newValue });
          }
        } else {
          if (isMonth && targetObj) {
            targetObj[currentPeriod].actualValue = newValue;
            draft[node.id] = calculateComputed({ ...draft[node.id], monthlyData: targetObj });
          } else {
            draft[node.id] = calculateComputed({ ...draft[node.id], actualValue: newValue, initialActualValue: newValue });
          }
        }
      }
    }

    // 依存しているノードのinDegreeを減らす
    graph[currId].forEach(dependentId => {
      inDegree[dependentId]--;
      if (inDegree[dependentId] === 0) {
        queue.push(dependentId);
      }
    });
  }

  // 循環参照エラー（Cycle Detection）
  if (processedCount < nodesWithFormula.length) {
    console.warn("⚠️ 循環参照が検出されたため、一部の計算式がスキップされました。");
  }
};

const recalculateAllMonths = (draft: Record<string, KpiNodeWithComputedAndInit>) => {
  const allMonths = new Set<string>();
  Object.values(draft).forEach(node => {
    if (node.monthlyData) {
      Object.keys(node.monthlyData).forEach(m => allMonths.add(m));
    }
  });
  
  const monthsArray = Array.from(allMonths).sort();
  monthsArray.forEach(m => {
    recalculateTree(draft, 'targetValue', m);
    recalculateTree(draft, 'actualValue', m);
  });
};

const saveToProjectData = (state: any) => {
  if (!state.currentProjectId) return state.projectData;
  return {
    ...state.projectData,
    [state.currentProjectId]: {
      projectInfo: state.currentProjectInfo || undefined,
      kpiData: state.kpiData,
      actions: state.actions,
      workflows: state.workflows
    }
  };
};
let isInitializingDB = false;

export const useKpiStore = create<KpiStore>()(
  persist(
    (set, get) => ({
      kpiData: initialData,
      projectData: {},
      selectedNodeId: null,
      collapsedNodes: [],
      actions: [],
      workflows: {},
      isDbInitialized: false,
      currentProjectId: null,
      currentOrgId: null,
      currentProjectInfo: null,
      currentPeriod: '2026-05',
      isPredictionMode: false,
      isCopilotSidebarOpen: false,
      isAiGenerating: false,
      smartAddMessages: [],
      setSmartAddMessages: (messages) => set((state) => ({ 
        smartAddMessages: typeof messages === 'function' ? messages(state.smartAddMessages) : messages 
      })),
      recentlyUpdatedNodes: [],
      setRecentlyUpdatedNodes: (nodes) => set({ recentlyUpdatedNodes: nodes }),
      pastStates: [],
      futureStates: [],

      saveHistory: () => set((state) => {
        const snapshot = { kpiData: state.kpiData, actions: state.actions };
        const newPast = [...state.pastStates, snapshot].slice(-30); // 最大30件保持
        return { pastStates: newPast, futureStates: [] };
      }),

      undo: () => set((state) => {
        if (state.pastStates.length === 0) return state;
        const previous = state.pastStates[state.pastStates.length - 1];
        const newPast = state.pastStates.slice(0, -1);
        const newFuture = [{ kpiData: state.kpiData, actions: state.actions }, ...state.futureStates];
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: previous.kpiData, actions: previous.actions, projectInfo: state.currentProjectInfo });
        return { kpiData: previous.kpiData, actions: previous.actions, pastStates: newPast, futureStates: newFuture, projectData: saveToProjectData({ ...state, kpiData: previous.kpiData, actions: previous.actions }) };
      }),

      redo: () => set((state) => {
        if (state.futureStates.length === 0) return state;
        const next = state.futureStates[0];
        const newFuture = state.futureStates.slice(1);
        const newPast = [...state.pastStates, { kpiData: state.kpiData, actions: state.actions }];
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: next.kpiData, actions: next.actions, projectInfo: state.currentProjectInfo });
        return { kpiData: next.kpiData, actions: next.actions, pastStates: newPast, futureStates: newFuture, projectData: saveToProjectData({ ...state, kpiData: next.kpiData, actions: next.actions }) };
      }),

      recalculateAllMonthsAction: () => set((state) => {
        const draft = { ...state.kpiData };
        recalculateAllMonths(draft);
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft });
        return { kpiData: draft };
      }),

      setPeriod: (period) => set({ currentPeriod: period }),
      togglePredictionMode: () => set((state) => {
        const isNowPrediction = !state.isPredictionMode;
        const draft = { ...state.kpiData };
        Object.keys(draft).forEach(key => {
          if (isNowPrediction) {
            draft[key] = calculateComputed({ 
              ...draft[key], 
              simulatedValue: draft[key].actualValue,
              simulatedTargetValue: draft[key].targetValue
            });
          } else {
            draft[key] = calculateComputed({ 
              ...draft[key], 
              simulatedValue: undefined, 
              simulatedTargetValue: undefined,
              isSimulated: false 
            });
          }
        });
        syncToDB(state.currentProjectId, state.currentOrgId, { isPredictionMode: isNowPrediction });
        return { isPredictionMode: isNowPrediction, kpiData: draft };
      }),
      setIsCopilotSidebarOpen: (isOpen: boolean) => set({ isCopilotSidebarOpen: isOpen }),
      setIsAiGenerating: (isGenerating: boolean) => set({ isAiGenerating: isGenerating }),

      initializeDB: async (projectId: string, orgId: string, projectName?: string, projectDesc?: string) => {
        if (get().isDbInitialized && get().currentProjectId === projectId) return;
        if (isInitializingDB) return;
        isInitializingDB = true;
        
        console.log(`🔄 [initializeDB] Starting load for project: ${projectId}`);
        const state = get();
        const pData = state.projectData[projectId] || { kpiData: {}, actions: [], workflows: {}, projectInfo: undefined };
        
        let kpiData = { ...pData.kpiData };
        let actions = [...pData.actions];
        let workflows = { ...(pData.workflows || {}) };
        
        // --- PostgreSQL (API) から最新データを取得 (Read) ---
        try {
          console.log("🌐 [initializeDB] Fetching nodes and actions from PostgreSQL...");
          const res = await fetch(`/api/projects/${projectId}/nodes`);
          if (res.ok) {
            const data = await res.json();
            console.log("✅ [initializeDB] Nodes received. Parsing data...");
            if (data.kpiData && Object.keys(data.kpiData).length > 0) {
              kpiData = data.kpiData;
            }
            if (data.actions) {
              actions = data.actions;
            }

            // 各ノードの computed 値と履歴の初期化
            Object.keys(kpiData).forEach(id => {
              kpiData[id] = calculateComputed(kpiData[id]);
            });

            sanitizeKpiData(kpiData as Record<string, KpiNodeWithComputedAndInit>);
            recalculateAllMonths(kpiData as any);
          } else {
            console.log("⚠️ [initializeDB] API returned non-ok status.");
          }
        } catch (error) {
          console.error("❌ [initializeDB] Failed to load KPI Data from API", error);
        }

        // SessionStorageにAI生成された初期データがあるかチェック
        const initDataStr = typeof window !== 'undefined' ? sessionStorage.getItem(`kpi_init_${projectId}`) : null;
        
        if (Object.keys(kpiData).length === 0) {
          if (initDataStr) {
            try {
              const parsedNodes = JSON.parse(initDataStr) as any[];
              const initialActions: Action[] = [];
              
              parsedNodes.forEach(node => {
                kpiData[node.id] = calculateComputed({
                  id: node.id,
                  name: node.name,
                  qualitativeName: node.qualitativeName,
                  businessUnit: node.businessUnit,
                  type: node.type,
                  parentId: node.parentId,
                  targetValue: node.targetValue,
                  actualValue: node.actualValue,
                  unit: node.unit,
                  previousValue: node.previousValue,
                  description: node.description,
                  isCalculated: node.isCalculated,
                  formula: node.formula,
                  monthlyData: node.monthlyData,
                  initialActualValue: node.actualValue || 0
                });
                
                // AI初期生成時に作成されたダミー履歴データをセット
                if (node.history && Array.isArray(node.history)) {
                  kpiData[node.id].history = node.history;
                }
                
                // AIが生成したタスクがあれば抽出
                if (node.tasks && Array.isArray(node.tasks)) {
                  node.tasks.forEach((task: any) => {
                    initialActions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      kpiId: node.id,
                      title: task.task_name,
                      description: `【期待インパクト】${task.expected_impact || '不明'} 【工数感】${task.effort_level || '不明'}\n${task.description || ''}\n留意点: ${task.focus_point || ''}`.trim(),
                      owner: '未定',
                      priority: task.expected_impact === 'High' && task.effort_level === 'Low' ? 'urgent_important' : 'unassigned',
                      startDate: task.start_date && task.start_date.match(/^\d{4}-\d{2}-\d{2}$/) ? task.start_date : new Date().toISOString().split('T')[0],
                      dueDate: task.due_date && task.due_date.match(/^\d{4}-\d{2}-\d{2}$/) ? task.due_date : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      status: 'todo'
                    });
                  });
                }
              });

              if (initialActions.length > 0) {
                pData.actions = [...pData.actions, ...initialActions];
                actions = [...actions, ...initialActions];
              }

              // --- 初期計算 ---
              // 数式セット後、ツリー全体の数値を再計算して整合性を取る
              recalculateAllMonths(kpiData as any);

              // ロード完了したらストレージから削除
              sessionStorage.removeItem(`kpi_init_${projectId}`);
              
              console.log("🚀 [initializeDB] Calling syncToDB to save AI generated data...");
              // この段階でFirestoreへ保存する
              syncToDB(projectId, orgId, { kpiData: kpiData, actions: pData.actions, projectInfo: pData.projectInfo, _forceSync: true } as any);
              console.log("✅ [initializeDB] syncToDB called.");
            } catch (e) {
              console.error("❌ [initializeDB] Failed to parse init KPI data", e);
            }
          }

          // それでも空ならフォールバックのKGIを作成
          if (Object.keys(kpiData).length === 0) {
            kpiData = {
              kgi_profit: calculateComputed({
                id: 'kgi_profit',
                name: projectName || pData.projectInfo?.name || '全社利益（KGI）',
                qualitativeName: '事業の成長と収益化',
                businessUnit: 'company',
                type: 'KGI',
                parentId: null,
                targetValue: 10000000,
                actualValue: 0,
                unit: '円',
                previousValue: 0,
                description: projectDesc || pData.projectInfo?.description || 'Goalを数値化した組織全体の最終利益目標'
              })
            };
          }
        }
        
        set({ 
          currentProjectId: projectId, 
          currentOrgId: orgId,
          currentProjectInfo: pData.projectInfo || { name: projectName || '新規プロジェクト', description: projectDesc || '' },
          kpiData: kpiData,
          actions: actions,
          workflows: workflows,
          collapsedNodes: (pData as any)._tempCollapsedNodes !== undefined ? (pData as any)._tempCollapsedNodes : get().collapsedNodes,
          isPredictionMode: (pData as any)._tempPredictionMode !== undefined ? (pData as any)._tempPredictionMode : get().isPredictionMode,
          isDbInitialized: true 
        });

        isInitializingDB = false;
      },

      setProjectInfo: (info) => set((state) => {
        const newInfo = { ...(state.currentProjectInfo || { name: '', description: '' }), ...info };
        
        // thresholdsが変更された場合は全ノードを再計算
        const newKpiData = { ...state.kpiData };
        if (info.statusThresholds) {
          Object.keys(newKpiData).forEach(id => {
            newKpiData[id] = calculateComputed(newKpiData[id], info.statusThresholds);
          });
        }
        
        const newState = { ...state, currentProjectInfo: newInfo, kpiData: newKpiData };
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: newKpiData, actions: state.actions, projectInfo: newInfo });
        return {
          currentProjectInfo: newInfo,
          kpiData: newKpiData,
          projectData: saveToProjectData(newState)
        };
      }),

      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  addAction: (action) => {
    const newAction = { ...action, id: Math.random().toString(36).substr(2, 9) };
    set((state) => {
      const newActions = [...state.actions, newAction];
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: state.kpiData, actions: newActions, projectInfo: state.currentProjectInfo });
      return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };
    });
  },

  updateAction: (id, updates) => {
    set((state) => {
      const newActions = state.actions.map(a => a.id === id ? { ...a, ...updates } : a);
      syncToDB(state.currentProjectId, state.currentOrgId, { actions: newActions });
      return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };
    });
  },

  deleteAction: (id) => {
    set((state) => {
      const updatedActions = state.actions.filter(a => a.id !== id);
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: state.kpiData, actions: updatedActions, projectInfo: state.currentProjectInfo });
      return { actions: updatedActions, projectData: saveToProjectData({ ...state, actions: updatedActions }) };
    });
  },

  removeAction: (id) => {
    set((state) => {
      const newActions = state.actions.filter(a => a.id !== id);
      syncToDB(state.currentProjectId, state.currentOrgId, { actions: newActions });
      return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };
    });
  },
  toggleActionStatus: (actionId) => {
    set((state) => {
      const newActions = state.actions.map(a => 
        a.id === actionId ? { ...a, status: (a.status === 'done' ? 'todo' : 'done') as 'todo' | 'done' } : a
      );
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: state.kpiData, actions: newActions, projectInfo: state.currentProjectInfo });
      return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };
    });
  },

  setActionsBulk: (newActions) => {
    set((state) => {
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: state.kpiData, actions: newActions, projectInfo: state.currentProjectInfo });
      return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };
    });
  },

  setAiWorkflow: (kpiId, workflow) => {
    set((state) => {
      const newWorkflows = { ...state.workflows, [kpiId]: workflow };
      const newState = { ...state, workflows: newWorkflows };
      syncToDB(state.currentProjectId, state.currentOrgId, { workflows: newWorkflows });
      return { workflows: newWorkflows, projectData: saveToProjectData(newState) };
    });
  },

  updateSimulatedValue: (id: string, newValue: number) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (!draft[id] || draft[id].simulatedValue === undefined) return state;

      const oldSimulated = draft[id].simulatedValue!;
      draft[id] = calculateComputed({ ...draft[id], simulatedValue: newValue, isSimulated: true });

      if (newValue !== oldSimulated) {
        // 動的計算エンジンによる再計算（シミュレーション値）
        recalculateTree(draft, 'simulatedValue', state.currentPeriod);
      }
      return { kpiData: draft }; // シミュレーションはDBやプロジェクトデータには即時保存しない
    });
  },

  updateSimulatedTarget: (id: string, newValue: number) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (!draft[id] || draft[id].simulatedTargetValue === undefined) return state;

      const oldTarget = draft[id].simulatedTargetValue!;
      if (oldTarget === newValue) return state;

      // トップダウンの配分ロジック（比率で下位に波及させる）
      const ratio = oldTarget !== 0 ? newValue / oldTarget : 1;
      
      const updateDescendants = (parentId: string, mult: number) => {
        Object.values(draft).forEach(node => {
          if (node.parentId === parentId) {
            const currentSimTarget = node.simulatedTargetValue !== undefined ? node.simulatedTargetValue : node.targetValue;
            draft[node.id] = calculateComputed({ ...draft[node.id], simulatedTargetValue: currentSimTarget * mult, isSimulated: true });
            updateDescendants(node.id, mult);
          }
        });
      };

      draft[id] = calculateComputed({ ...draft[id], simulatedTargetValue: newValue, isSimulated: true });
      updateDescendants(id, ratio);

      // ボトムアップの再計算（上位のターゲットも念のため計算式で再評価する）
      recalculateTree(draft, 'simulatedTargetValue', state.currentPeriod);

      return { kpiData: draft };
    });
  },

  commitBulkUpdate: (updates) => {
    set((state) => {
      const draft = { ...state.kpiData };
      
      // 値の更新
      updates.forEach(({ id, value }) => {
        if (draft[id]) {
          draft[id] = calculateComputed({ ...draft[id], actualValue: value, initialActualValue: value, isSimulated: false });
        }
      });

      // 動的計算エンジンによる再計算（実績値）
      recalculateTree(draft, 'actualValue', state.currentPeriod);

      // 一旦、全データを isSimulated = false にする
      Object.keys(draft).forEach(key => {
        draft[key] = { ...draft[key], isSimulated: false, initialActualValue: draft[key].actualValue };
      });

      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  addKpiNode: (node) => {
    set((state) => {
      const draft = { ...state.kpiData };
      draft[node.id] = calculateComputed({ ...node, initialActualValue: node.actualValue });
      
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  applyRollingForecast: (kpiId, additionalTargetPerMonth, targetMonths) => {
    set((state) => {
      const draft = { ...state.kpiData };
      const node = draft[kpiId];
      if (!node) return state;

      const updatedMonthlyData = { ...node.monthlyData };
      
      targetMonths.forEach(m => {
        if (!updatedMonthlyData[m]) {
          updatedMonthlyData[m] = { month: m, targetValue: node.targetValue, actualValue: 0 };
        }
        updatedMonthlyData[m] = {
          ...updatedMonthlyData[m],
          simulatedTargetValue: (updatedMonthlyData[m].targetValue || 0) + additionalTargetPerMonth
        };
      });

      draft[kpiId] = calculateComputed({ ...node, monthlyData: updatedMonthlyData, isSimulated: true });
      
      // We set isPredictionMode to true so the UI reflects the simulated targets
      const updates = { kpiData: draft, isPredictionMode: true };
      syncToDB(state.currentProjectId, state.currentOrgId, { ...updates, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, isPredictionMode: true, projectData: saveToProjectData({ ...state, ...updates }) };
    });
  },
  updateKpiNode: (id, data) => {
      set((state) => {
        const draft = { ...state.kpiData };
        if (draft[id]) {
          const oldActual = draft[id].actualValue;
          const oldTarget = draft[id].targetValue;
          
          draft[id] = calculateComputed({ ...draft[id], ...data });
          
          let valueChanged = false;

          // 実績値が更新された場合
          if (data.actualValue !== undefined && data.actualValue !== oldActual) {
            // 動的計算エンジンによる再計算（実績値）
            recalculateTree(draft, 'actualValue', state.currentPeriod);
            valueChanged = true;
          }

          // 目標値が更新された場合
          if (data.targetValue !== undefined && oldTarget > 0 && data.targetValue !== oldTarget) {
            // 動的計算エンジンによる再計算（目標値）
            recalculateTree(draft, 'targetValue', state.currentPeriod);
            valueChanged = true;
          }

          // 実績や目標値が変更された場合、関連する全ノード（再計算されたノード含む）の今日の履歴を更新する
          if (valueChanged) {
            const today = new Date().toISOString().split('T')[0];
            Object.keys(draft).forEach(key => {
              const node = draft[key];
              const newHistory = [...(node.history || [])];
              const todayRecordIndex = newHistory.findIndex(h => h.date === today);
              
              if (todayRecordIndex >= 0) {
                newHistory[todayRecordIndex] = { 
                  ...newHistory[todayRecordIndex], 
                  actualValue: node.actualValue, 
                  targetValue: node.targetValue 
                };
              } else {
                newHistory.push({
                  id: `hist_${Math.random().toString(36).substr(2, 9)}`,
                  date: today,
                  targetValue: node.targetValue,
                  actualValue: node.actualValue,
                  comment: ''
                });
              }
              draft[key] = { 
                ...node, 
                history: newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
              };
            });
          }
          
          syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
        }
        return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
      });
    },
  updateKpiNodePosition: (id, position) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (draft[id]) {
        draft[id] = { ...draft[id], position };
        // positionの変更はDBに即時保存するが、不要な再計算は行わない
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      }
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  updateKpiNodePositionsBulk: (positions) => {
    set((state) => {
      const draft = { ...state.kpiData };
      let hasChanges = false;
      positions.forEach(({ id, position }) => {
        if (draft[id]) {
          draft[id] = { ...draft[id], position };
          hasChanges = true;
        }
      });
      if (hasChanges) {
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      }
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  setKpiDataBulk: (nodes) => {
    set((state) => {
      const newData: Record<string, KpiNodeWithComputedAndInit> = {};
      nodes.forEach(node => {
        newData[node.id] = {
          ...node,
          initialActualValue: node.actualValue,
          achievementRate: (node.actualValue / node.targetValue) * 100,
          status: ((node.actualValue / node.targetValue) * 100) >= 100 ? 'good' : ((node.actualValue / node.targetValue) * 100) >= 80 ? 'warning' : 'danger',
          isSimulated: false
        };
      });
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: newData, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: newData, selectedNodeId: null, projectData: saveToProjectData({ ...state, kpiData: newData }) };
    });
  },
  bulkUpdateMonthlyData: (updates) => {
    set((state) => {
      const draft = { ...state.kpiData };
      let hasChanges = false;
      const updatedMonths = new Set<string>();

      updates.forEach(({ kpiId, month, targetValue, actualValue }) => {
        if (draft[kpiId]) {
          const node = draft[kpiId];
          const monthlyData = { ...(node.monthlyData || {}) };
          
          if (!monthlyData[month]) {
            monthlyData[month] = { month, targetValue: node.targetValue || 0, actualValue: 0 };
          }
          
          if (targetValue !== undefined) monthlyData[month].targetValue = targetValue;
          if (actualValue !== undefined) monthlyData[month].actualValue = actualValue;
          
          draft[kpiId] = calculateComputed({ ...node, monthlyData });
          hasChanges = true;
          updatedMonths.add(month);
        }
      });

      if (hasChanges) {
        // 更新された月すべてで、ツリーの動的再計算をトリガーする
        updatedMonths.forEach(month => {
          recalculateTree(draft, 'targetValue', month);
          recalculateTree(draft, 'actualValue', month);
        });
        
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      }
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  removeKpiNode: (id) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (draft[id]?.type === 'KGI') {
        alert('KGI（ゴール）は削除できません。');
        return state;
      }
      
      // 履歴に現在の状態を保存
      state.saveHistory();

      // 親ノードの数式チェックとフォールバック
      const parentId = draft[id]?.parentId;
      if (parentId && draft[parentId]) {
        const parent = draft[parentId];
        if (parent.formula && parent.formula.includes(`#{${id}}`)) {
          // 数式が壊れるため、手動モードへフォールバックしアラート文言をセット
          draft[parentId] = {
            ...parent,
            isCalculated: false,
            formula: '',
            warning: '子要素が削除されたため、計算連携が解除されました。新しいKPIを追加するか手入力してください。'
          };
        }
      }

      // 再帰的な子ノードのアーカイブ処理と、関連するタスク（Action）のアーカイブ処理
      let archivedNodeIds = new Set<string>();
      
      const archiveRecursive = (nodeId: string) => {
        archivedNodeIds.add(nodeId);
        Object.keys(draft).forEach(key => {
          if (draft[key].parentId === nodeId && !draft[key].isArchived) {
            archiveRecursive(key);
          }
        });
        // 物理削除ではなく、論理削除（アーカイブ）フラグを立てる
        draft[nodeId] = { ...draft[nodeId], isArchived: true };
      };
      
      archiveRecursive(id);
      
      // アーカイブされたノードに紐づくタスクも論理削除（アーカイブ）とする
      const newActions = state.actions.map(a => 
        archivedNodeIds.has(a.kpiId) ? { ...a, isArchived: true } : a
      );
      
      const newSelected = state.selectedNodeId === id ? null : state.selectedNodeId;
      
      // 再計算をトリガー
      recalculateTree(draft, 'actualValue', state.currentPeriod);
      recalculateTree(draft, 'targetValue', state.currentPeriod);
      
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: newActions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, actions: newActions, selectedNodeId: newSelected, projectData: saveToProjectData({ ...state, kpiData: draft, actions: newActions }) };
    });
  },

  reviveKpiNode: (id, newParentId) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (!draft[id]) return state;

      state.saveHistory();

      // アーカイブ状態を解除し、新しい親に紐付ける
      draft[id] = { ...draft[id], isArchived: false, parentId: newParentId, warning: undefined };

      // 紐づいていたタスクのアーカイブ状態も解除する
      const newActions = state.actions.map(a => 
        a.kpiId === id ? { ...a, isArchived: false } : a
      );

      // 再計算をトリガー
      recalculateTree(draft, 'actualValue', state.currentPeriod);
      recalculateTree(draft, 'targetValue', state.currentPeriod);

      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: newActions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, actions: newActions, projectData: saveToProjectData({ ...state, kpiData: draft, actions: newActions }) };
    });
  },
  
  addHistoryRecord: (kpiId, record) => {
    set((state) => {
      const draft = { ...state.kpiData };
      const node = draft[kpiId];
      if (!node) return state;

      const newRecord = { ...record, id: `hist_${Math.random().toString(36).substr(2, 9)}` };
      const newHistory = [...(node.history || []), newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // 最新の履歴の値をactualValueに反映
      const latestRecord = newHistory[newHistory.length - 1];
      const newActualValue = latestRecord ? latestRecord.actualValue : node.actualValue;

      draft[kpiId] = calculateComputed({
        ...node,
        history: newHistory,
        actualValue: newActualValue,
        initialActualValue: newActualValue
      });

      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },

  updateHistoryRecord: (kpiId, recordId, updates) => {
    set((state) => {
      const draft = { ...state.kpiData };
      const node = draft[kpiId];
      if (!node || !node.history) return state;

      const newHistory = node.history.map(h => h.id === recordId ? { ...h, ...updates } : h).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // 最新の履歴の値をactualValueに反映
      const latestRecord = newHistory[newHistory.length - 1];
      const newActualValue = latestRecord ? latestRecord.actualValue : node.actualValue;

      draft[kpiId] = calculateComputed({
        ...node,
        history: newHistory,
        actualValue: newActualValue,
        initialActualValue: newActualValue
      });

      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },

  deleteHistoryRecord: (kpiId, recordId) => {
    set((state) => {
      const draft = { ...state.kpiData };
      const node = draft[kpiId];
      if (!node || !node.history) return state;

      const newHistory = node.history.filter(h => h.id !== recordId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // 最新の履歴の値をactualValueに反映
      const latestRecord = newHistory[newHistory.length - 1];
      const newActualValue = latestRecord ? latestRecord.actualValue : 0; // 履歴がない場合は0に戻すか維持するか。一旦0に。

      draft[kpiId] = calculateComputed({
        ...node,
        history: newHistory,
        actualValue: newActualValue,
        initialActualValue: newActualValue
      });

      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },

  overwriteKpiData: (newKpiData) => set((state) => {
    state.saveHistory();
    const draft = { ...newKpiData };
    sanitizeKpiData(draft);
    recalculateTree(draft, 'actualValue', state.currentPeriod);
    recalculateTree(draft, 'targetValue', state.currentPeriod);
    syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft });
    return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
  }),

  expandKpiNode: async (kpiId: string) => {
    const state = useKpiStore.getState();
    const parentNode = state.kpiData[kpiId];
    if (!parentNode) return;

    try {
      const res = await fetch('/api/expand-kpi-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentNode })
      });

      if (!res.ok) throw new Error('Failed to expand KPI node');
      
      const { nodes, parentFormula } = await res.json();
      if (!nodes || nodes.length === 0) return;

      useKpiStore.setState((currentState) => {
        currentState.saveHistory();
        const draft = { ...currentState.kpiData };
        let newActions = [...currentState.actions];

        // 1. 新しいノードをdraftに追加
        nodes.forEach((node: any) => {
          // 重複を避けるためIDを上書き（万が一のため）
          let safeId = node.id;
          if (draft[safeId]) {
            safeId = `kpi_exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            node.id = safeId;
            // formula内のIDも置換が必要だが簡略化のためAIが被らないIDを出力すると信じるか置換処理を書く
            // 現状はAIの出力した一意なIDを利用する
          }

          // タスクがあればActionsに退避
          if (node.tasks && Array.isArray(node.tasks)) {
            node.tasks.forEach((task: any) => {
              const isString = typeof task === 'string';
              newActions.push({
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                kpiId: safeId,
                title: isString ? task : (task.task_name || '新規タスク'),
                description: isString ? '' : (task.description || ''),
                status: 'todo',
                owner: '未定',
                dueDate: isString ? new Date().toISOString().split('T')[0] : (task.due_date || new Date().toISOString().split('T')[0])
              });
            });
            delete node.tasks;
          }

          const newNode: KpiNodeWithComputedAndInit = {
            ...node,
            history: [],
            initialActualValue: node.actualValue || 0,
            addedAt: Date.now()
          };
          draft[safeId] = calculateComputed(newNode);
        });

        // 2. 親ノードの更新（計算式の設定など）
        const newParentFormula = parentFormula || nodes.map((n:any) => `#{${n.id}}`).join(" + ");
        const updatedParent = {
          ...draft[kpiId],
          isCalculated: true,
          formula: newParentFormula
        };
        draft[kpiId] = calculateComputed(updatedParent);

        // 3. ツリー全体の再計算
        sanitizeKpiData(draft);
        recalculateTree(draft, 'targetValue', state.currentPeriod);
        recalculateTree(draft, 'actualValue', state.currentPeriod);

        // 4. DBへ同期
        syncToDB(currentState.currentProjectId, currentState.currentOrgId, { kpiData: draft, actions: newActions });

        return { kpiData: draft, actions: newActions, projectData: saveToProjectData({ ...currentState, kpiData: draft, actions: newActions }) };
      });

    } catch (e) {
      console.error("Expand API error:", e);
      alert("展開に失敗しました。");
    }
  },

  applySmartAddPatch: async (patchData: { updatedParent?: any, updatedNodes?: any[], newNodes?: any[] }) => {
    try {
      const { updatedParent, updatedNodes = [], newNodes = [] } = patchData;

      if (!updatedParent && (!updatedNodes || updatedNodes.length === 0) && (!newNodes || newNodes.length === 0)) {
        throw new Error('Invalid patch format received from AI');
      }

      useKpiStore.setState((currentState) => {
        currentState.saveHistory();
        const draft = { ...currentState.kpiData };
        const newActions = [...currentState.actions];

        // 0. ID衝突の事前チェックとマップ作成
        const idMap: Record<string, string> = {};
        newNodes.forEach((node: any) => {
          let safeId = node.id;
          if (draft[safeId]) {
            safeId = `kpi_smart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            idMap[node.id] = safeId;
            node.id = safeId; // IDを更新
          }
        });

        // 1. 既存ノードのアップデート (updatedNodes)
        updatedNodes.forEach((uNode: any) => {
          if (draft[uNode.id]) {
            const originalNode = draft[uNode.id];
            
            // updateKpiNodeのように処理
            const updatedData = { ...originalNode };
            if (uNode.targetValue !== undefined) updatedData.targetValue = uNode.targetValue;
            if (uNode.actualValue !== undefined) updatedData.actualValue = uNode.actualValue;
            if (uNode.name !== undefined) updatedData.name = uNode.name;
            if (uNode.formula !== undefined) updatedData.formula = uNode.formula;
            
            draft[uNode.id] = calculateComputed(updatedData);

            // 月次データが選択されている場合、monthlyDataも更新する
            if (currentState.currentPeriod.match(/^\d{4}-\d{2}$/)) {
              const month = currentState.currentPeriod;
              const monthlyData = { ...(draft[uNode.id].monthlyData || {}) };
              
              if (!monthlyData[month]) {
                monthlyData[month] = { month, targetValue: draft[uNode.id].targetValue, actualValue: draft[uNode.id].actualValue };
              }
              if (uNode.targetValue !== undefined) monthlyData[month].targetValue = uNode.targetValue;
              if (uNode.actualValue !== undefined) monthlyData[month].actualValue = uNode.actualValue;
              
              draft[uNode.id] = calculateComputed({ ...draft[uNode.id], monthlyData });
            }
          }
        });

        // 親ノードの数式（newFormula）のID置換
        let finalNewFormula = updatedParent?.newFormula;
        if (finalNewFormula) {
          Object.keys(idMap).forEach(oldId => {
            finalNewFormula = finalNewFormula.replace(new RegExp(`#{${oldId}}`, 'g'), `#{${idMap[oldId]}}`);
          });
        }

        // 1.5. 新しいノードのフォーマットと追加
        newNodes.forEach((node: any) => {
          const safeId = node.id;

          // 親IDの置換
          if (node.parentId && idMap[node.parentId]) {
            node.parentId = idMap[node.parentId];
          }

          // 数式内のID置換
          if (node.formula) {
            Object.keys(idMap).forEach(oldId => {
              node.formula = node.formula.replace(new RegExp(`#{${oldId}}`, 'g'), `#{${idMap[oldId]}}`);
            });
          }

          // フォールバック: AIが数式を忘れたが、子ノードが存在する場合の自動補完
          const childrenOfThisNode = newNodes.filter((n: any) => n.parentId === safeId);
          if (childrenOfThisNode.length > 0 && (!node.isCalculated || !node.formula)) {
            node.isCalculated = true;
            node.formula = childrenOfThisNode.map((c: any) => `#{${c.id}}`).join(' + ');
          }

          if (node.tasks && Array.isArray(node.tasks)) {
            node.tasks.forEach((task: any) => {
              const isString = typeof task === 'string';
              newActions.push({
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                kpiId: safeId,
                title: isString ? task : (task.task_name || '新規タスク'),
                description: isString ? '' : (task.description || ''),
                status: 'todo',
                owner: '未定',
                dueDate: isString ? new Date().toISOString().split('T')[0] : (task.due_date || new Date().toISOString().split('T')[0])
              });
            });
            delete node.tasks;
          }

          // isKsf の自動判定 (親がKGIならtrue、それ以外はfalse)
          let isKsf = false;
          if (draft[node.parentId] && draft[node.parentId].type === 'KGI') {
            isKsf = true;
          }

          const newNode: KpiNodeWithComputedAndInit = {
            ...node,
            isKsf, // AIの出力を上書き
            history: [],
            initialActualValue: node.actualValue || 0,
            addedAt: Date.now()
          };
          draft[safeId] = calculateComputed(newNode);
        });

        // 2. 親ノードの数式更新
        if (updatedParent && draft[updatedParent.id] && finalNewFormula) {
          const updatedParentNode = {
            ...draft[updatedParent.id],
            isCalculated: true,
            formula: finalNewFormula
          };
          draft[updatedParent.id] = calculateComputed(updatedParentNode);
        }

        // 3. ツリー全体の再計算
        sanitizeKpiData(draft);
        recalculateTree(draft, 'targetValue', currentState.currentPeriod);
        recalculateTree(draft, 'actualValue', currentState.currentPeriod);

        // 4. DBへ同期
        syncToDB(currentState.currentProjectId, currentState.currentOrgId, { kpiData: draft, actions: newActions });

        return { kpiData: draft, actions: newActions, projectData: saveToProjectData({ ...currentState, kpiData: draft, actions: newActions }) };
      });

    } catch (e) {
      console.error("Smart Add KPI Patch error:", e);
      alert("KPIの追加に失敗しました。");
      throw e;
    }
  },

  smartAddKpi: async (query: string) => {
    try {
      const state = useKpiStore.getState();
      const nodesArray = Object.values(state.kpiData);
      
      const response = await fetch('/api/smart-add-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTree: nodesArray,
          query: query,
          businessUnit: state.currentProjectInfo?.name || 'company'
        })
      });

      if (!response.ok) throw new Error('Failed to smart add KPI');

      const data = await response.json();
      await state.applySmartAddPatch(data);

    } catch (e) {
      console.error("Smart Add KPI error:", e);
      alert("KPIの追加に失敗しました。詳細なプロンプトを試してください。");
      throw e;
    }
  },
  
  addAuditLog: async (log) => {
    const state = useKpiStore.getState();
    if (!state.currentProjectId || !state.currentOrgId) return;
    try {
      const logId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const auditLog: import('@/types').AuditLog = {
        ...log,
        id: logId,
        projectId: state.currentProjectId,
        timestamp: Date.now()
      };
      const logRef = doc(db, 'organizations', state.currentOrgId, 'projects', state.currentProjectId, 'auditLogs', logId);
      await setDoc(logRef, auditLog);
    } catch (e) {
      console.error("Failed to add audit log", e);
    }
  },

  fetchAuditLogs: async (kpiId: string) => {
    const state = useKpiStore.getState();
    if (!state.currentProjectId || !state.currentOrgId) return [];
    try {
      // 本来はwhere句でkpiIdを絞り込みますが、今回はシンプルな実装とします。
      const logsRef = collection(db, 'organizations', state.currentOrgId, 'projects', state.currentProjectId, 'auditLogs');
      const snap = await getDocs(logsRef);
      const logs: import('@/types').AuditLog[] = [];
      snap.forEach(doc => {
        const data = doc.data() as import('@/types').AuditLog;
        if (data.kpiId === kpiId) {
          logs.push(data);
        }
      });
      // 新しい順にソート
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
      return [];
    }
  },

  addChatMessage: (kpiId, message) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (!draft[kpiId]) return state;
      
      const newMessage: import('@/types').KpiChatMessage = {
        ...message,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        timestamp: Date.now()
      };
      
      const chatMessages = draft[kpiId].chatMessages ? [...draft[kpiId].chatMessages] : [];
      chatMessages.push(newMessage);
      
      draft[kpiId] = {
        ...draft[kpiId],
        chatMessages
      };
      
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },

  toggleNodeCollapse: (id) => {
    set((state) => {
      const isCollapsed = state.collapsedNodes.includes(id);
      let newCollapsedNodes;
      if (isCollapsed) {
        newCollapsedNodes = state.collapsedNodes.filter(nodeId => nodeId !== id);
      } else {
        newCollapsedNodes = [...state.collapsedNodes, id];
      }
      syncToDB(state.currentProjectId, state.currentOrgId, { collapsedNodes: newCollapsedNodes });
      return { collapsedNodes: newCollapsedNodes };
    });
  },
    }),
    {
      name: 'kpi-storage',
      partialize: (state) => ({ 
        collapsedNodes: state.collapsedNodes,
        currentPeriod: state.currentPeriod,
        smartAddMessages: state.smartAddMessages
      }),
    }
  )
);
