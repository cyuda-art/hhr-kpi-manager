import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectInfo, KpiNodeData, KpiNodeWithComputed, Action, MonthlyData, Status, AiWorkflow } from '@/types';

import { shouldScaleWithPeriod } from '@/lib/kpi-utils';

const generateDefaultMonthlyData = (node: Partial<KpiNodeData>, targetValue: number, actualValue: number) => {
  const monthlyData: Record<string, MonthlyData> = {};
  const currentYear = new Date().getFullYear();
  const isScale = shouldScaleWithPeriod(node);
  
  // 4月から翌年3月までの12ヶ月分を作成
  for (let month = 4; month <= 15; month++) {
    const actualMonth = month > 12 ? month - 12 : month;
    const actualYear = month > 12 ? currentYear + 1 : currentYear;
    const monthStr = `${actualYear}-${String(actualMonth).padStart(2, '0')}`;
    monthlyData[monthStr] = {
      month: monthStr,
      targetValue: isScale ? targetValue / 12 : targetValue,
      actualValue: isScale ? actualValue / 12 : actualValue,
    };
  }
  return monthlyData;
};

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
  initializeDB: (projectId: string, orgId: string, projectName?: string, projectDesc?: string) => Promise<void>;
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
  recalculateAllMonthsAction: () => void;
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
    projectInfo?: import('@/types').ProjectInfo | null;
  }
) => {
  if (!projectId || !orgId) return;
  
  const isForce = (updates as { _forceSync?: boolean })._forceSync === true;
  if (!isForce && !useKpiStore.getState().isDbInitialized) {
    return;
  }



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

    }
  } catch (error) {
    console.error("❌ [syncToDB] PostgreSQL Sync Error:", error);
  }
};

const calculateComputed = (node: Partial<KpiNodeWithComputedAndInit>, customThresholds?: { good: number, warning: number }): KpiNodeWithComputedAndInit => {
  const isQualitative = node.type ? ['VISION', 'MISSION', 'MANIFESTO', 'GOAL'].includes(node.type) : false;

  let actualValue = node.actualValue !== undefined && node.actualValue !== null ? node.actualValue : 0;
  let targetValue = node.targetValue !== undefined && node.targetValue !== null ? node.targetValue : 1;
  
  if (isQualitative) {
    actualValue = 0;
    targetValue = 0;
  }

  const initialActualValue = node.initialActualValue !== undefined && node.initialActualValue !== null ? node.initialActualValue : actualValue;
  const previousValue = node.previousValue !== undefined && node.previousValue !== null ? node.previousValue : actualValue;
  
  let achievementRate = targetValue === 0 ? 0 : (actualValue / targetValue) * 100;
  
  if (!isQualitative && (node.name?.includes('原価率') || node.name?.includes('キャンセル率') || node.name?.includes('コスト'))) {
    achievementRate = actualValue === 0 ? 0 : (targetValue / actualValue) * 100;
  }

  const thresholds = customThresholds || useKpiStore.getState().currentProjectInfo?.statusThresholds || { good: 100, warning: 80 };

  let status: Status = 'good';
  if (achievementRate < thresholds.warning) {
    status = 'danger';
  } else if (achievementRate < thresholds.good) {
    status = 'warning';
  }

  const newHistory = node.history ? [...node.history] : [];
  
  // 履歴データが空の場合（プロジェクト作成時など）、初期値として今日の履歴を1行追加する
  if (newHistory.length === 0) {
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
    history: newHistory
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
    // 強制的に定性ノードの数式をクリア
    const isQualitative = node.type ? ['VISION', 'MISSION', 'MANIFESTO', 'GOAL'].includes(node.type) : false;
    if (isQualitative) {
      node.isCalculated = false;
      node.formula = '';
      node.targetValue = 0;
      node.actualValue = 0;
    }

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

const evaluateFormula = (formulaStr: string, kpiData: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue', currentPeriod: string): number | null => {
  if (!formulaStr) return null;
  let parsedFormula = formulaStr;
  
  // 例: "#{kpi_123} + #{kpi_456}" の形式をパース
  const regex = /#\{([^}]+)\}/g;
  parsedFormula = parsedFormula.replace(regex, (match, id) => {
    const node = kpiData[id];
    if (node) {
      const isMonth = currentPeriod.match(/^\d{4}-\d{2}$/);
      
      const getVal = (field: 'actualValue' | 'targetValue') => {
        if (isMonth && node.monthlyData && node.monthlyData[currentPeriod] && node.monthlyData[currentPeriod][field] !== undefined) {
          return node.monthlyData[currentPeriod][field]!;
        }
        return node[field] || 0;
      };

      const val = getVal(valueType);
      return val.toString();
    }
    return '0';
  });

  // 全角記号も念の為サポート
  parsedFormula = parsedFormula.replace(/×/g, '*').replace(/÷/g, '/').replace(/＋/g, '+').replace(/－/g, '-');

  try {
    // 許可する文字：数字、小数点、四則演算記号、括弧、スペースのみ
    if (/^[0-9\.\+\-\*\/\(\)\s]+$/.test(parsedFormula)) {
       
      const result = new Function(`return ${parsedFormula}`)();
      return isNaN(result) ? null : result;
    }
    return null;
  } catch (_e) {
    return null;
  }
};

// トポロジカルソートを用いた計算ツリーの再計算
const recalculateTree = (draft: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue', currentPeriod: string) => {
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
        let targetObj: Record<string, import('@/types').MonthlyData> | undefined = undefined;
        if (isMonth) {
          targetObj = draft[node.id].monthlyData || {};
          if (!targetObj[currentPeriod]) {
            targetObj[currentPeriod] = { month: currentPeriod, targetValue: draft[node.id].targetValue, actualValue: draft[node.id].actualValue };
          }
        }

        if (valueType === 'targetValue') {
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

const saveToProjectData = (state: KpiStore) => {
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
      isCopilotSidebarOpen: false,
      isAiGenerating: false,
      recentlyUpdatedNodes: [],
      setRecentlyUpdatedNodes: (nodes) => set({ recentlyUpdatedNodes: nodes }),
      reviveKpiNode: (_id, _newParentId) => {},
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
      setIsCopilotSidebarOpen: (isOpen: boolean) => set({ isCopilotSidebarOpen: isOpen }),
      setIsAiGenerating: (isGenerating: boolean) => set({ isAiGenerating: isGenerating }),

      initializeDB: async (projectId: string, orgId: string, projectName?: string, projectDesc?: string) => {
        if (get().isDbInitialized && get().currentProjectId === projectId) return;
        if (isInitializingDB) return;
        isInitializingDB = true;
        

        const state = get();
        const pData = state.projectData[projectId] || { kpiData: {}, actions: [], workflows: {}, projectInfo: undefined };
        
        let kpiData = { ...pData.kpiData };
        let actions = [...pData.actions];
        const workflows = { ...(pData.workflows || {}) };
        
        // --- PostgreSQL (API) から最新データを取得 (Read) ---
        try {

          const res = await fetch(`/api/projects/${projectId}/nodes`);
          if (res.ok) {
            const data = await res.json();

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
            recalculateAllMonths(kpiData as Record<string, KpiNodeWithComputedAndInit>);
          } else {
            console.warn("⚠️ [initializeDB] API returned non-ok status.");
          }
        } catch (error) {
          console.error("❌ [initializeDB] Failed to load KPI Data from API", error);
        }

        // SessionStorageにAI生成された初期データがあるかチェック
        const initDataStr = typeof window !== 'undefined' ? sessionStorage.getItem(`kpi_init_${projectId}`) : null;
        
        if (Object.keys(kpiData).length === 0) {
          if (initDataStr) {
            try {
              const parsedNodes = JSON.parse(initDataStr) as (KpiNodeData & { tasks?: any })[];
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
                  node.tasks.forEach((task: import('@/types').WorkflowTask & { start_date?: string; due_date?: string; priority?: string }) => {
                    initialActions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      kpiId: node.id,
                      title: task.task_name || '名称未設定',
                      description: `【期待インパクト】${task.expected_impact || '不明'} 【工数感】${task.effort_level || '不明'}\n${task.description || ''}\n留意点: ${task.focus_point || ''}`.trim(),
                      owner: '未定',
                      priority: (task.priority && typeof task.priority === 'string') ? (task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase() as any) : 'Medium',
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
              recalculateAllMonths(kpiData as Record<string, KpiNodeWithComputedAndInit>);

              // ロード完了したらストレージから削除
              sessionStorage.removeItem(`kpi_init_${projectId}`);
              
              // この段階でDBへ保存する
              syncToDB(projectId, orgId, { kpiData: kpiData, actions: pData.actions, projectInfo: pData.projectInfo as import('@/types').ProjectInfo | null, _forceSync: true } as { kpiData: Record<string, KpiNodeWithComputedAndInit>; actions: import('@/types').Action[]; projectInfo: import('@/types').ProjectInfo | null; _forceSync: boolean });
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
          collapsedNodes: (pData as { _tempCollapsedNodes?: string[] })._tempCollapsedNodes !== undefined ? (pData as { _tempCollapsedNodes?: string[] })._tempCollapsedNodes : get().collapsedNodes,
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


  // simulated updating functions removed

  commitBulkUpdate: (updates) => {
    set((state) => {
      const draft = { ...state.kpiData };
      
      // 値の更新
      updates.forEach(({ id, value }) => {
        if (draft[id]) {
          draft[id] = calculateComputed({ ...draft[id], actualValue: value, initialActualValue: value });
        }
      });

      // 動的計算エンジンによる再計算（実績値）
      recalculateTree(draft, 'actualValue', state.currentPeriod);

      Object.keys(draft).forEach(key => {
        draft[key] = { ...draft[key], initialActualValue: draft[key].actualValue };
      });

      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  addKpiNode: (node) => {
    set((state) => {
      const draft = { ...state.kpiData };
      draft[node.id] = calculateComputed({ ...node, initialActualValue: node.actualValue });
      
      if (!draft[node.id].monthlyData || Object.keys(draft[node.id].monthlyData!).length === 0) {
        draft[node.id].monthlyData = generateDefaultMonthlyData(draft[node.id], node.targetValue || 0, node.actualValue || 0);
      }
      
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
  // applyRollingForecast removed
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
            // 月次データの同期
            if (draft[id].monthlyData && Object.keys(draft[id].monthlyData!).length > 0) {
              const isScale = shouldScaleWithPeriod(draft[id]);
              const ratio = (isScale && oldActual > 0) ? data.actualValue / oldActual : 1;
              Object.keys(draft[id].monthlyData!).forEach(monthKey => {
                draft[id].monthlyData![monthKey].actualValue = isScale && oldActual > 0
                  ? draft[id].monthlyData![monthKey].actualValue * ratio
                  : (isScale ? (data.actualValue || 0) / 12 : (data.actualValue || 0));
              });
            } else {
              draft[id].monthlyData = generateDefaultMonthlyData(draft[id], draft[id].targetValue, data.actualValue);
            }
            // 動的計算エンジンによる再計算（実績値）
            recalculateTree(draft, 'actualValue', state.currentPeriod);
            valueChanged = true;
          }

          // 目標値が更新された場合
          if (data.targetValue !== undefined && data.targetValue !== oldTarget) {
            // 月次データの同期
            if (draft[id].monthlyData && Object.keys(draft[id].monthlyData!).length > 0) {
              const isScale = shouldScaleWithPeriod(draft[id]);
              const ratio = (isScale && oldTarget > 0) ? data.targetValue / oldTarget : 1;
              Object.keys(draft[id].monthlyData!).forEach(monthKey => {
                draft[id].monthlyData![monthKey].targetValue = isScale && oldTarget > 0
                  ? draft[id].monthlyData![monthKey].targetValue * ratio
                  : (isScale ? (data.targetValue || 0) / 12 : (data.targetValue || 0));
              });
            } else {
              draft[id].monthlyData = generateDefaultMonthlyData(draft[id], data.targetValue, draft[id].actualValue);
            }
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
          status: ((node.actualValue / node.targetValue) * 100) >= 100 ? 'good' : ((node.actualValue / node.targetValue) * 100) >= 80 ? 'warning' : 'danger'
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

      // 再帰的な子ノードの削除処理
      const deletedNodeIds = new Set<string>();
      
      const deleteRecursive = (nodeId: string) => {
        deletedNodeIds.add(nodeId);
        Object.keys(draft).forEach(key => {
          if (draft[key].parentId === nodeId) {
            deleteRecursive(key);
          }
        });
        // 物理削除
        delete draft[nodeId];
      };
      
      deleteRecursive(id);
      
      // 削除されたノードに紐づくタスクも物理削除する
      const newActions = state.actions.filter(a => !deletedNodeIds.has(a.kpiId));
      
      const newSelected = state.selectedNodeId === id ? null : state.selectedNodeId;
      
      // 再計算をトリガー
      recalculateTree(draft, 'actualValue', state.currentPeriod);
      recalculateTree(draft, 'targetValue', state.currentPeriod);
      
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: newActions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, actions: newActions, selectedNodeId: newSelected, projectData: saveToProjectData({ ...state, kpiData: draft, actions: newActions }) };
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
    const state = get();
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

      set((currentState: KpiStore) => {
        currentState.saveHistory();
        const draft = { ...currentState.kpiData };
        const newActions = [...currentState.actions];

        // 1. 新しいノードをdraftに追加
        nodes.forEach((node: KpiNodeData & { tasks?: any }) => {
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
            node.tasks.forEach((task: import('@/types').WorkflowTask & { start_date?: string; due_date?: string } | string) => {
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
            status: 'danger', achievementRate: 0
          };
          draft[safeId] = calculateComputed(newNode);
        });

        // 2. 親ノードの更新（計算式の設定など）
        const newParentFormula = parentFormula || nodes.map((n: KpiNodeData) => `#{${n.id}}`).join(" + ");
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

  // smart add methods removed
  
  addAuditLog: async (log) => {
    const state = get();
    if (!state.currentProjectId || !state.currentOrgId) return;
    try {
      await fetch(`/api/projects/${state.currentProjectId}/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: state.currentOrgId,
          userId: log.userId,
          action: log.action,
          details: { kpiId: log.kpiId, details: log.details }
        })
      });
    } catch (e) {
      console.error("Failed to add audit log", e);
    }
  },

  fetchAuditLogs: async (kpiId: string) => {
    const state = get();
    if (!state.currentProjectId || !state.currentOrgId) return [];
    try {
      const res = await fetch(`/api/projects/${state.currentProjectId}/audit-logs`);
      if (!res.ok) return [];
      const data = await res.json();
      
      const logs = data.logs.map((log: import('@/types').AuditLog & { createdAt: string }) => {
        let detailsObj = {};
        try { detailsObj = JSON.parse(log.details || '{}'); } catch(_e){}
        return {
          id: log.id,
          kpiId: (detailsObj as Record<string, string>).kpiId || '',
          action: log.action,
          userId: log.userId,
          details: (detailsObj as Record<string, string>).details || '',
          timestamp: new Date(log.createdAt).getTime()
        };
      });
      
      // kpiId でフィルタリング
      return logs.filter((log: import('@/types').AuditLog) => log.kpiId === kpiId);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
      return [];
    }
  },

  addChatMessage: (kpiId: string, message: Omit<import('@/types').KpiChatMessage, 'id' | 'timestamp'>) => {
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
        currentPeriod: state.currentPeriod
      }),
    }
  )
);
