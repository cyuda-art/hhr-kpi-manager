import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KpiNodeData, KpiNodeWithComputed, Status, Action } from '@/types';

const mockKpiData: KpiNodeData[] = [];

export interface KpiNodeWithComputedAndInit extends KpiNodeWithComputed {
  initialActualValue: number;
}

interface KpiStore {
  kpiData: Record<string, KpiNodeWithComputedAndInit>;
  selectedNodeId: string | null;
  collapsedNodes: string[]; // 折りたたまれたノードのID配列
  actions: Action[];
  isDbInitialized: boolean;
  currentProjectId: string | null;
  initializeDB: (projectId: string) => Promise<void>;
  updateActualValue: (id: string, newValue: number) => void;
  resetSimulations: () => void;
  setSelectedNodeId: (id: string | null) => void;
  addAction: (action: Omit<Action, 'id'>) => void;
  toggleActionStatus: (actionId: string) => void;
  commitBulkUpdate: (updates: { id: string; value: number }[]) => void;
  addKpiNode: (node: KpiNodeData) => void;
  removeKpiNode: (id: string) => void;
  updateKpiNode: (id: string, data: Partial<KpiNodeData>) => void;
  setKpiDataBulk: (nodes: KpiNodeData[]) => void;
  toggleNodeCollapse: (id: string) => void;
}

// データベース(Google Sheets)更新用のヘルパー関数
const syncToDB = async (kpiData: Record<string, KpiNodeWithComputedAndInit>, actions: Action[], projectId: string | null) => {
  // projectIdは将来の拡張用。現在は1つのスプレッドシートを想定。
  try {
    await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kpiData, actions }),
    });
  } catch (error) {
    console.error("Sheets Sync Error:", error);
  }
};

const calculateComputed = (node: Partial<KpiNodeWithComputedAndInit>): KpiNodeWithComputedAndInit => {
  const actual = node.actualValue || 0;
  const target = node.targetValue || 1;
  let achievementRate = (actual / target) * 100;
  
  if (node.name?.includes('原価率') || node.name?.includes('キャンセル率') || node.name?.includes('コスト')) {
    achievementRate = (target / actual) * 100;
  }

  let status: Status = 'good';
  if (achievementRate < 80) {
    status = 'danger';
  } else if (achievementRate < 100) {
    status = 'warning';
  }

  return {
    ...node,
    achievementRate,
    status,
  } as KpiNodeWithComputedAndInit;
};

const initialData: Record<string, KpiNodeWithComputedAndInit> = {
  kgi_profit: {
    id: 'kgi_profit',
    name: '全社営業利益',
    businessUnit: 'company',
    type: 'KGI',
    parentId: null,
    targetValue: 50000000,
    actualValue: 45000000,
    initialActualValue: 45000000,
    unit: '円',
    previousValue: 40000000,
    description: '全社の営業利益',
    achievementRate: 90,
    status: 'warning',
    isSimulated: false
  }
};

// 限界利益率などの仮説パラメータ
const MARGINAL_PROFIT_RATIO = 0.4;
// 温浴来館者1人増えた時の飲食・物販への送客割合
const CROSS_SELL_SPA_TO_REST = 0.25; 
const CROSS_SELL_SPA_TO_SHOP = 0.10;

export const useKpiStore = create<KpiStore>()(
  persist(
    (set, get) => ({
      kpiData: initialData,
      selectedNodeId: null,
      collapsedNodes: [],
      actions: [],
      isDbInitialized: false,
      currentProjectId: null,

      initializeDB: async (projectId: string) => {
        // 既に同じプロジェクトで初期化済みならリターン
        if (get().isDbInitialized && get().currentProjectId === projectId) return;
        
        set({ currentProjectId: projectId, isDbInitialized: false });
        
        try {
          const res = await fetch('/api/sheets');
          if (res.ok) {
            const data = await res.json();
            if (data.kpiData && Object.keys(data.kpiData).length > 0) {
              set({ 
                kpiData: data.kpiData, 
                actions: data.actions || [],
                isDbInitialized: true 
              });
            } else {
              // データが空なら初期データをセット（または現在のデータを保存）
              set({ isDbInitialized: true });
              syncToDB(get().kpiData, get().actions, projectId);
            }
          } else {
            console.error("Failed to fetch from sheets");
          }
        } catch (error) {
          console.error("Initialize DB Error:", error);
        }
      },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  addAction: (action) => {
    const newAction = { ...action, id: Math.random().toString(36).substr(2, 9) };
    set((state) => {
      const newActions = [...state.actions, newAction];
      syncToDB(state.kpiData, newActions, state.currentProjectId);
      return { actions: newActions };
    });
  },

  toggleActionStatus: (actionId) => {
    set((state) => {
      const newActions = state.actions.map(a => 
        a.id === actionId ? { ...a, status: (a.status === 'done' ? 'todo' : 'done') as 'todo' | 'done' } : a
      );
      syncToDB(state.kpiData, newActions, state.currentProjectId);
      return { actions: newActions };
    });
  },
  updateActualValue: (id: string, newValue: number) => {
    set((state) => {
      const draft = { ...state.kpiData };
      
      // 直接変更されたノードを更新
      if (draft[id]) {
        draft[id] = calculateComputed({ ...draft[id], actualValue: newValue, isSimulated: true });
      }

      // --- 連動シミュレーションロジック ---
      
      // 1. 横断KPI（送客）の計算
      // 温浴の来館者数が変わったら、飲食・物販の来店数を連動して増やす
      if (draft['kpi_spa_visitors'] && draft['kpi_restaurant_visitors']) {
        const spaDelta = draft['kpi_spa_visitors'].actualValue - draft['kpi_spa_visitors'].initialActualValue;
        
        // 飲食来店数 = 初期値 + (温浴増分 * 送客率) + (もし飲食来店数自体が手動変更されていればその分も考慮すべきだが今回は簡略化)
        // 飲食来店数自体がスライダーで変更された場合との競合を避けるため、spaDeltaのみをベースにする簡易計算
        if (id === 'kpi_spa_visitors') {
          const newRestVisitors = draft['kpi_restaurant_visitors'].initialActualValue + Math.round(spaDelta * CROSS_SELL_SPA_TO_REST);
          draft['kpi_restaurant_visitors'] = calculateComputed({ ...draft['kpi_restaurant_visitors'], actualValue: newRestVisitors, isSimulated: true });
          
          // (拡張案: 物販の来店数も増やすなどの処理をここに追加可能)
        }
      }

      // 2. 各事業の売上（KGI）を計算（ロールアップ）
      // 宿泊売上 = 部屋数(仮定100室 * 30日) * 稼働率 * ADR
      if (draft['kpi_hotel_occ'] && draft['kpi_hotel_adr'] && draft['kgi_sales_hotel']) {
        const roomsSold = 3000 * (draft['kpi_hotel_occ'].actualValue / 100);
        const newHotelSales = roomsSold * draft['kpi_hotel_adr'].actualValue;
        draft['kgi_sales_hotel'] = calculateComputed({ ...draft['kgi_sales_hotel'], actualValue: newHotelSales, isSimulated: true });
      }

      // 温浴売上 = 来館者数 * 客単価
      if (draft['kpi_spa_visitors'] && draft['kpi_spa_arpu'] && draft['kgi_sales_spa']) {
        const newSpaSales = draft['kpi_spa_visitors'].actualValue * draft['kpi_spa_arpu'].actualValue;
        draft['kgi_sales_spa'] = calculateComputed({ ...draft['kgi_sales_spa'], actualValue: newSpaSales, isSimulated: true });
      }

      // 飲食売上 = 来店数 * 客単価
      if (draft['kpi_restaurant_visitors'] && draft['kpi_restaurant_arpu'] && draft['kgi_sales_restaurant']) {
        const newRestSales = draft['kpi_restaurant_visitors'].actualValue * draft['kpi_restaurant_arpu'].actualValue;
        draft['kgi_sales_restaurant'] = calculateComputed({ ...draft['kgi_sales_restaurant'], actualValue: newRestSales, isSimulated: true });
      }

      // 3. 全社売上の計算
      const totalSalesId = 'kgi_sales_total';
      if (draft[totalSalesId]) {
        const businessSalesKeys = ['kgi_sales_hotel', 'kgi_sales_spa', 'kgi_sales_restaurant', 'kgi_sales_shop', 'kgi_sales_kitchen'];
        const newTotalSales = businessSalesKeys.reduce((sum, key) => sum + (draft[key]?.actualValue || 0), 0);
        draft[totalSalesId] = calculateComputed({ ...draft[totalSalesId], actualValue: newTotalSales, isSimulated: true });
        
        // 4. 全社営業利益の計算
        const profitId = 'kgi_profit';
        if (draft[profitId]) {
          const salesDelta = newTotalSales - draft[totalSalesId].initialActualValue;
          // 売上増加分に対して限界利益率を掛けて利益の増分とする（非常に簡易なモデル）
          const newProfit = draft[profitId].initialActualValue + (salesDelta * MARGINAL_PROFIT_RATIO);
          draft[profitId] = calculateComputed({ ...draft[profitId], actualValue: newProfit, isSimulated: true });
        }
      }

      // Firestoreにはシミュレーション中の値は送らず、ローカルの状態のみ更新する
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

      // ロールアップ再計算 (全社への波及)
      // 宿泊
      if (draft['kgi_sales_hotel']) {
        const occ = draft['kpi_hotel_occ']?.actualValue || 0;
        const adr = draft['kpi_hotel_adr']?.actualValue || 0;
        const sales = 3000 * (occ / 100) * adr;
        draft['kgi_sales_hotel'] = calculateComputed({ ...draft['kgi_sales_hotel'], actualValue: sales, initialActualValue: sales, isSimulated: false });
      }
      // 温浴
      if (draft['kgi_sales_spa']) {
        const vis = draft['kpi_spa_visitors']?.actualValue || 0;
        const arpu = draft['kpi_spa_arpu']?.actualValue || 0;
        const sales = vis * arpu;
        draft['kgi_sales_spa'] = calculateComputed({ ...draft['kgi_sales_spa'], actualValue: sales, initialActualValue: sales, isSimulated: false });
      }
      // 飲食
      if (draft['kgi_sales_restaurant']) {
        const vis = draft['kpi_restaurant_visitors']?.actualValue || 0;
        const arpu = draft['kpi_restaurant_arpu']?.actualValue || 0;
        const sales = vis * arpu;
        draft['kgi_sales_restaurant'] = calculateComputed({ ...draft['kgi_sales_restaurant'], actualValue: sales, initialActualValue: sales, isSimulated: false });
      }
      // 全社
      if (draft['kgi_sales_total']) {
        const keys = ['kgi_sales_hotel', 'kgi_sales_spa', 'kgi_sales_restaurant', 'kgi_sales_shop', 'kgi_sales_kitchen'];
        const total = keys.reduce((sum, key) => sum + (draft[key]?.actualValue || 0), 0);
        draft['kgi_sales_total'] = calculateComputed({ ...draft['kgi_sales_total'], actualValue: total, initialActualValue: total, isSimulated: false });
      }
      // 利益（ここでは簡易的に固定費を引く形を想定せず、売上ベースで簡易算出にするため割愛。必要に応じて厳密な計算を入れる）
      // 一旦、全データを isSimulated = false にする
      Object.keys(draft).forEach(key => {
        draft[key] = { ...draft[key], isSimulated: false, initialActualValue: draft[key].actualValue };
      });

      syncToDB(draft, state.actions, state.currentProjectId);
      return { kpiData: draft };
    });
  },
  addKpiNode: (node) => {
    set((state) => {
      const draft = { ...state.kpiData };
      draft[node.id] = calculateComputed({ ...node, initialActualValue: node.actualValue });
      
      syncToDB(draft, state.actions, state.currentProjectId);
      return { kpiData: draft };
    });
  },
    updateKpiNode: (id, data) => {
      set((state) => {
        const draft = { ...state.kpiData };
        if (draft[id]) {
          const oldActual = draft[id].actualValue;
          const oldTarget = draft[id].targetValue;
          
          draft[id] = calculateComputed({ ...draft[id], ...data });
          
          // 実績値が更新された場合、汎用シミュレーション（親ノードへの波及）を実行
          if (data.actualValue !== undefined && oldActual > 0 && data.actualValue !== oldActual) {
            const ratio = data.actualValue / oldActual;
            
            if (ratio !== 1) {
              // 親を辿って数値を更新する関数
              const propagateToParent = (childId: string, changeRatio: number) => {
                const node = draft[childId];
                if (!node || !node.parentId) return;
                
                const parent = draft[node.parentId];
                if (parent) {
                  // 親の新しい実績値を、子の変化率と同じだけ動かす
                  const newParentActual = parent.actualValue * changeRatio;
                  draft[parent.id] = calculateComputed({ 
                    ...parent, 
                    actualValue: newParentActual,
                    isSimulated: true // シミュレーションによって動いたことをマーク
                  });
                  // さらに上の親へ波及
                  propagateToParent(parent.id, changeRatio);
                }
              };
              
              propagateToParent(id, ratio);
            }
          }

          // 目標値が更新された場合、ツリー全体（親方向・子方向）へ目標値を連動波及させる
          if (data.targetValue !== undefined && oldTarget > 0 && data.targetValue !== oldTarget) {
            const ratio = data.targetValue / oldTarget;
            const visited = new Set<string>();
            visited.add(id);

            // 上方向（親）への波及
            const propagateUp = (currentId: string) => {
              const node = draft[currentId];
              if (!node || !node.parentId) return;
              const parent = draft[node.parentId];
              if (parent && !visited.has(parent.id)) {
                visited.add(parent.id);
                draft[parent.id] = calculateComputed({
                  ...parent,
                  targetValue: parent.targetValue * ratio,
                  isSimulated: true
                });
                propagateUp(parent.id);
              }
            };

            // 下方向（子）への波及
            const propagateDown = (currentId: string) => {
              Object.values(draft).forEach(child => {
                if (child.parentId === currentId && !visited.has(child.id)) {
                  visited.add(child.id);
                  draft[child.id] = calculateComputed({
                    ...child,
                    targetValue: child.targetValue * ratio,
                    isSimulated: true
                  });
                  propagateDown(child.id);
                }
              });
            };

            propagateUp(id);
            propagateDown(id);
          }
          
          syncToDB(draft, state.actions, state.currentProjectId);
        }
        return { kpiData: draft };
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
      syncToDB(newData, state.actions, state.currentProjectId);
      return { kpiData: newData, selectedNodeId: null };
    });
  },
  removeKpiNode: (id) => {
    set((state) => {
      const draft = { ...state.kpiData };
      delete draft[id];
      const newSelected = state.selectedNodeId === id ? null : state.selectedNodeId;
      
      syncToDB(draft, state.actions, state.currentProjectId);
      return { kpiData: draft, selectedNodeId: newSelected };
    });
  },
  toggleNodeCollapse: (id) => {
    set((state) => {
      const isCollapsed = state.collapsedNodes.includes(id);
      if (isCollapsed) {
        return { collapsedNodes: state.collapsedNodes.filter(nodeId => nodeId !== id) };
      } else {
        return { collapsedNodes: [...state.collapsedNodes, id] };
      }
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
      return { kpiData: draft };
    });
  },
    }),
    {
      name: 'kpi-storage',
      partialize: (state) => ({ kpiData: state.kpiData, actions: state.actions, collapsedNodes: state.collapsedNodes }),
    }
  )
);
