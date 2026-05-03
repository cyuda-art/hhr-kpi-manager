const fs = require('fs');
const path = './src/store/useKpiStore.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. KpiStoreインターフェースの更新
code = code.replace(
  "kpiData: Record<string, KpiNodeWithComputedAndInit>;",
  "kpiData: Record<string, KpiNodeWithComputedAndInit>;\n  projectData: Record<string, { kpiData: Record<string, KpiNodeWithComputedAndInit>; actions: Action[] }>;"
);

// 2. initialDataの下あたりで初期状態を追加
code = code.replace(
  "kpiData: initialData,",
  "kpiData: initialData,\n      projectData: {},"
);

// 3. saveToProjectData ヘルパー関数の追加 (syncToDBの下あたり)
const helper = `
const saveToProjectData = (state: any) => {
  if (!state.currentProjectId) return state.projectData;
  return {
    ...state.projectData,
    [state.currentProjectId]: {
      kpiData: state.kpiData,
      actions: state.actions
    }
  };
};
`;
code = code.replace("export const useKpiStore = create<KpiStore>()(", helper + "\nexport const useKpiStore = create<KpiStore>()(");

// 4. initializeDB の書き換え
const initDbBlock = `
      initializeDB: async (projectId: string) => {
        if (get().isDbInitialized && get().currentProjectId === projectId) return;
        
        const state = get();
        // プロジェクトごとのデータがあればそれをロード、なければ空にする
        const pData = state.projectData[projectId] || { kpiData: {}, actions: [] };
        
        set({ 
          currentProjectId: projectId, 
          kpiData: pData.kpiData,
          actions: pData.actions,
          isDbInitialized: true 
        });
      },
`;
// initializeDBの古いブロックを正規表現で探して置換するのは少し危険なので、手動で置換する。
code = code.replace(/initializeDB: async \(projectId: string\) => \{[\s\S]*?\},[\s\n]*setSelectedNodeId/, initDbBlock.trim() + ",\n\n      setSelectedNodeId");

// 5. 各種更新関数の中で projectData も更新するようにする
// addAction
code = code.replace(
  "return { actions: newActions };",
  "return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };"
);

// toggleActionStatus
code = code.replace(
  "return { actions: newActions };",
  "return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };"
);

// setActionsBulk
code = code.replace(
  "return { actions: newActions };",
  "return { actions: newActions, projectData: saveToProjectData({ ...state, actions: newActions }) };"
);

// updateActualValue
code = code.replace(
  "return { kpiData: draft };",
  "return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };"
);

// commitBulkUpdate
code = code.replace(
  "return { kpiData: draft };",
  "return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };"
);

// addKpiNode
code = code.replace(
  "return { kpiData: draft };",
  "return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };"
);

// updateKpiNode
code = code.replace(
  "return { kpiData: draft };",
  "return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };"
);

// setKpiDataBulk
code = code.replace(
  "return { kpiData: newData, selectedNodeId: null };",
  "return { kpiData: newData, selectedNodeId: null, projectData: saveToProjectData({ ...state, kpiData: newData }) };"
);

// removeKpiNode
code = code.replace(
  "return { kpiData: draft, selectedNodeId: newSelected };",
  "return { kpiData: draft, selectedNodeId: newSelected, projectData: saveToProjectData({ ...state, kpiData: draft }) };"
);

// resetSimulations
code = code.replace(
  "return { kpiData: draft };",
  "return { kpiData: draft, projectData: saveToProjectData({ ...state, kpiData: draft }) };"
);

// 6. partialize (persistする対象) を変更。kpiDataとactionsは個別のキャッシュとしつつ、projectDataを確実に保存する
code = code.replace(
  "partialize: (state) => ({ kpiData: state.kpiData, actions: state.actions, collapsedNodes: state.collapsedNodes }),",
  "partialize: (state) => ({ projectData: state.projectData, collapsedNodes: state.collapsedNodes }),"
);

fs.writeFileSync(path, code);
console.log('Patched useKpiStore.ts');
