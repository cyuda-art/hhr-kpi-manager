import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KpiNodeData, KpiNodeWithComputed, Status, Action, AiWorkflow } from '@/types';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  isPredictionMode: boolean;
  setPeriod: (period: string) => void;
  togglePredictionMode: () => void;
  initializeDB: (projectId: string, orgId: string, projectName?: string, projectDesc?: string) => Promise<void>;
  updateActualValue: (id: string, newValue: number) => void;
  updateSimulatedValue: (id: string, newValue: number) => void;
  resetSimulations: () => void;
  setSelectedNodeId: (id: string | null) => void;
  addAction: (action: Omit<Action, 'id'>) => void;
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
  toggleNodeCollapse: (id: string) => void;
  setProjectInfo: (info: Partial<import('@/types').ProjectInfo>) => void;
  // 時系列データ管理
  addHistoryRecord: (kpiId: string, record: Omit<import('@/types').KpiHistoryEntry, 'id'>) => void;
  updateHistoryRecord: (kpiId: string, recordId: string, updates: Partial<import('@/types').KpiHistoryEntry>) => void;
  deleteHistoryRecord: (kpiId: string, recordId: string) => void;
}

// データベース(Firestore)更新用のヘルパー関数
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
  try {
    const kpiDataRef = doc(db, 'organizations', orgId, 'projects', projectId, 'kpiData', 'main');
    const dataToSave: any = {
      ...updates,
      updatedAt: Date.now()
    };
    await setDoc(kpiDataRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Firestore Sync Error:", error);
  }
};

const calculateComputed = (node: Partial<KpiNodeWithComputedAndInit>): KpiNodeWithComputedAndInit => {
  const actualValue = node.actualValue !== undefined && node.actualValue !== null ? node.actualValue : 0;
  const targetValue = node.targetValue !== undefined && node.targetValue !== null ? node.targetValue : 1;
  const initialActualValue = node.initialActualValue !== undefined && node.initialActualValue !== null ? node.initialActualValue : actualValue;
  const previousValue = node.previousValue !== undefined && node.previousValue !== null ? node.previousValue : actualValue;
  
  let achievementRate = targetValue === 0 ? 0 : (actualValue / targetValue) * 100;
  
  if (node.name?.includes('原価率') || node.name?.includes('キャンセル率') || node.name?.includes('コスト')) {
    achievementRate = actualValue === 0 ? 0 : (targetValue / actualValue) * 100;
  }

  let status: Status = 'good';
  if (achievementRate < 80) {
    status = 'danger';
  } else if (achievementRate < 100) {
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
    if (simulatedAchievementRate < 80) {
      simulatedStatus = 'danger';
    } else if (simulatedAchievementRate < 100) {
      simulatedStatus = 'warning';
    }
  }

  let newHistory = node.history ? [...node.history] : [];
  
  // シミュレーション中でなければ履歴を更新
  if (!node.isSimulated && node.simulatedValue === undefined) {
    // 既存の自動記録ロジックはコメントアウトするか、IDを付与する形に変更する
    // ここでは既存の自動追加ロジックは極力無効化し、明示的なHistory管理に任せる。
    // ただし、historyが存在しない場合のために空配列はセットしておく
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

const initialData: Record<string, KpiNodeWithComputedAndInit> = {
  kgi_profit: {
    id: 'kgi_profit',
    name: '全社営業利益',
    qualitativeName: '全社の持続的な成長と利益最大化',
    businessUnit: 'company',
    type: 'KGI',
    parentId: null,
    targetValue: 50000000,
    actualValue: 45000000,
    initialActualValue: 45000000,
    unit: '円',
    previousValue: 40000000,
    description: 'Goalを数値化した全社の営業利益',
    achievementRate: 90,
    status: 'warning',
    isSimulated: false,
    calculationFormula: '宿泊事業売上 ＋ 温浴事業売上 ＋ 飲食事業売上'
  }
};

// --- 動的計算エンジン ---
const evaluateFormula = (formulaStr: string, kpiData: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue' | 'simulatedValue'): number | null => {
  if (!formulaStr) return null;
  let parsedFormula = formulaStr;
  
  // 例: "#{kpi_123} + #{kpi_456}" の形式をパース
  const regex = /#\{([^}]+)\}/g;
  parsedFormula = parsedFormula.replace(regex, (match, id) => {
    const node = kpiData[id];
    if (node) {
      const val = valueType === 'simulatedValue' && node.simulatedValue !== undefined 
        ? node.simulatedValue 
        : node[valueType === 'simulatedValue' ? 'actualValue' : valueType];
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

const recalculateTree = (draft: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue' | 'simulatedValue') => {
  let hasChanged = true;
  let maxIterations = 5; // ループ上限
  
  while (hasChanged && maxIterations > 0) {
    hasChanged = false;
    maxIterations--;
    
    Object.values(draft).forEach(node => {
      if (node.isCalculated && node.formula) {
        const newValue = evaluateFormula(node.formula, draft, valueType);
        if (newValue !== null && !isNaN(newValue) && isFinite(newValue)) {
          const currentValue = valueType === 'simulatedValue' && node.simulatedValue !== undefined 
            ? node.simulatedValue 
            : node[valueType === 'simulatedValue' ? 'actualValue' : valueType];
          
          if (Math.abs(newValue - currentValue) > 0.01) { // 誤差許容
            hasChanged = true;
            if (valueType === 'simulatedValue') {
              draft[node.id] = calculateComputed({ ...draft[node.id], simulatedValue: newValue, isSimulated: true });
            } else if (valueType === 'targetValue') {
              draft[node.id] = calculateComputed({ ...draft[node.id], targetValue: newValue });
            } else {
              draft[node.id] = calculateComputed({ ...draft[node.id], actualValue: newValue, initialActualValue: newValue });
            }
          }
        }
      }
    });
  }
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

      setPeriod: (period) => set({ currentPeriod: period }),
      togglePredictionMode: () => set((state) => {
        const isNowPrediction = !state.isPredictionMode;
        const draft = { ...state.kpiData };
        Object.keys(draft).forEach(key => {
          if (isNowPrediction) {
            draft[key] = calculateComputed({ ...draft[key], simulatedValue: draft[key].actualValue });
          } else {
            draft[key] = calculateComputed({ ...draft[key], simulatedValue: undefined, isSimulated: false });
          }
        });
        syncToDB(state.currentProjectId, state.currentOrgId, { isPredictionMode: isNowPrediction });
        return { isPredictionMode: isNowPrediction, kpiData: draft };
      }),

      initializeDB: async (projectId: string, orgId: string, projectName?: string, projectDesc?: string) => {
        if (get().isDbInitialized && get().currentProjectId === projectId) return;
        
        const state = get();
        // プロジェクトごとのデータがあればそれをロード、なければ空にする
        const pData = state.projectData[projectId] || { kpiData: {}, actions: [], workflows: {}, projectInfo: undefined };
        
        let kpiData = { ...pData.kpiData };
        let actions = [...pData.actions];
        let workflows = { ...(pData.workflows || {}) };
        
        // --- Firestore から最新データを取得 (Read) ---
        try {
          const kpiDataDoc = await getDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'kpiData', 'main'));
          if (kpiDataDoc.exists()) {
            const data = kpiDataDoc.data();
            if (data.kpiData && Object.keys(data.kpiData).length > 0) kpiData = data.kpiData;
            if (data.actions) actions = data.actions;
            if (data.workflows) workflows = data.workflows;
            
            // set関数でそのままステートを上書きするため、ローカル変数ではなく直接取得した値をsetへ渡せるよう状態に持たせるか、
            // let変数として保持して後でsetする。
            const newCollapsedNodes = data.collapsedNodes !== undefined ? data.collapsedNodes : get().collapsedNodes;
            const newPredictionMode = data.isPredictionMode !== undefined ? data.isPredictionMode : get().isPredictionMode;
            
            // initializeDBの最後のsetで反映できるようにするために、変数に退避しておく
            (pData as any)._tempCollapsedNodes = newCollapsedNodes;
            (pData as any)._tempPredictionMode = newPredictionMode;
          }
        } catch (error) {
          console.error("Failed to load KPI Data from Firestore", error);
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
                  initialActualValue: node.actualValue || 0
                });
                
                // AIが生成したタスクがあれば抽出
                if (node.tasks && Array.isArray(node.tasks)) {
                  node.tasks.forEach((task: any) => {
                    initialActions.push({
                      id: Math.random().toString(36).substr(2, 9),
                      kpiId: node.id,
                      title: task.task_name,
                      owner: '未定',
                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
                      status: 'todo'
                    });
                  });
                }
              });

              if (initialActions.length > 0) {
                pData.actions = [...pData.actions, ...initialActions];
              }

              // --- 初期計算 ---
              // 数式セット後、ツリー全体の数値を再計算して整合性を取る
              recalculateTree(kpiData, 'targetValue');
              recalculateTree(kpiData, 'actualValue');

              // ロード完了したらストレージから削除
              sessionStorage.removeItem(`kpi_init_${projectId}`);
              
              // この段階でFirestoreへ保存する
              syncToDB(projectId, orgId, { kpiData: kpiData, actions: pData.actions, projectInfo: pData.projectInfo });
            } catch (e) {
              console.error("Failed to parse init KPI data", e);
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
      },

      setProjectInfo: (info) => set((state) => {
        const newInfo = { ...(state.currentProjectInfo || { name: '', description: '' }), ...info };
        const newState = { ...state, currentProjectInfo: newInfo };
        syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: state.kpiData, actions: state.actions, projectInfo: newInfo });
        return {
          currentProjectInfo: newInfo,
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

  updateActualValue: (id: string, newValue: number) => {
    set((state) => {
      const draft = { ...state.kpiData };
      
      // 直接変更されたノードを更新
      if (draft[id]) {
        draft[id] = calculateComputed({ ...draft[id], actualValue: newValue, initialActualValue: newValue });
      }

      // 動的計算エンジンによる再計算（実績値）
      recalculateTree(draft, 'actualValue');

      // 再計算後、全てのノードの今日の履歴(history)を更新・追加する
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

      // 実績値の更新なのでDBへ同期する
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
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
        recalculateTree(draft, 'simulatedValue');
      }
      return { kpiData: draft }; // シミュレーションはDBやプロジェクトデータには即時保存しない
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
      recalculateTree(draft, 'actualValue');

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
    updateKpiNode: (id, data) => {
      set((state) => {
        const draft = { ...state.kpiData };
        if (draft[id]) {
          const oldActual = draft[id].actualValue;
          const oldTarget = draft[id].targetValue;
          
          draft[id] = calculateComputed({ ...draft[id], ...data });
          
          // 実績値が更新された場合
          if (data.actualValue !== undefined && data.actualValue !== oldActual) {
            // 動的計算エンジンによる再計算（実績値）
            recalculateTree(draft, 'actualValue');
          }

          // 目標値が更新された場合
          if (data.targetValue !== undefined && oldTarget > 0 && data.targetValue !== oldTarget) {
            // 動的計算エンジンによる再計算（目標値）
            recalculateTree(draft, 'targetValue');
            
            // 既存の比率ベースの波及（計算式が設定されていないノードのためのフォールバックとして残すか迷うが、Excelライクな挙動を優先するなら不要。
            // しかしユーザーがすべてのノードに計算式を書くとは限らないため、比率波及は「計算式を持たない子」に対する簡易的な連動として残すのも手だが、
            // 今回は「計算式に基づく動的連動」がメイン要望なので、一旦古い比率波及は削除してスッキリさせる。
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
  removeKpiNode: (id) => {
    set((state) => {
      const draft = { ...state.kpiData };
      if (draft[id]?.type === 'KGI') {
        alert('KGI（ゴール）は削除できません。');
        return state;
      }
      delete draft[id];
      const newSelected = state.selectedNodeId === id ? null : state.selectedNodeId;
      
      syncToDB(state.currentProjectId, state.currentOrgId, { kpiData: draft, actions: state.actions, projectInfo: state.currentProjectInfo });
      return { kpiData: draft, selectedNodeId: newSelected, projectData: saveToProjectData({ ...state, kpiData: draft }) };
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
  resetSimulations: () => {
    set((state) => {
      // isSimulatedがtrueのものだけを元に戻す
      const draft = { ...state.kpiData };
      Object.keys(draft).forEach(key => {
        if (draft[key].isSimulated) {
          draft[key] = calculateComputed({ ...draft[key], actualValue: draft[key].initialActualValue, isSimulated: false });
        }
      });
      return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };
    });
  },
    }),
    {
      name: 'kpi-storage',
      partialize: (state) => ({ 
        projectData: state.projectData, 
        collapsedNodes: state.collapsedNodes,
        currentPeriod: state.currentPeriod
      }),
    }
  )
);
