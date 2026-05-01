import { create } from 'zustand';
import { KpiNodeData, KpiNodeWithComputed, Status, Action } from '@/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

const mockKpiData: KpiNodeData[] = [
  { id: 'kgi_profit', name: '全社営業利益', businessUnit: 'company', type: 'KGI', parentId: null, targetValue: 50000000, actualValue: 45000000, unit: '円', previousValue: 40000000, description: '全社の営業利益' },
  { id: 'kgi_sales_total', name: '全社売上', businessUnit: 'company', type: 'KGI', parentId: 'kgi_profit', targetValue: 300000000, actualValue: 280000000, unit: '円', previousValue: 270000000, description: '全事業の売上合算' },
  { id: 'kgi_sales_hotel', name: '宿泊売上', businessUnit: 'hotel', type: 'KGI', parentId: 'kgi_sales_total', targetValue: 120000000, actualValue: 115000000, unit: '円', previousValue: 110000000, description: '宿泊事業の売上' },
  { id: 'kgi_sales_spa', name: '温浴売上', businessUnit: 'spa', type: 'KGI', parentId: 'kgi_sales_total', targetValue: 60000000, actualValue: 62400000, unit: '円', previousValue: 58000000, description: '温浴事業の売上' },
  { id: 'kgi_sales_restaurant', name: '飲食売上', businessUnit: 'restaurant', type: 'KGI', parentId: 'kgi_sales_total', targetValue: 80000000, actualValue: 69840000, unit: '円', previousValue: 75000000, description: '飲食事業の売上' },
  { id: 'kgi_sales_shop', name: '物販売上', businessUnit: 'shop', type: 'KGI', parentId: 'kgi_sales_total', targetValue: 25000000, actualValue: 20000000, unit: '円', previousValue: 22000000, description: '物販事業の売上' },
  { id: 'kgi_sales_kitchen', name: 'CK外販売上', businessUnit: 'kitchen', type: 'KGI', parentId: 'kgi_sales_total', targetValue: 15000000, actualValue: 13000000, unit: '円', previousValue: 12000000, description: 'セントラルキッチンの外販' },

  { id: 'kpi_hotel_occ', name: '客室稼働率', businessUnit: 'hotel', type: 'KPI', parentId: 'kgi_sales_hotel', targetValue: 85, actualValue: 82, unit: '%', previousValue: 80, description: '客室の稼働率' },
  { id: 'kpi_hotel_adr', name: 'ADR', businessUnit: 'hotel', type: 'KPI', parentId: 'kgi_sales_hotel', targetValue: 15000, actualValue: 14800, unit: '円', previousValue: 14500, description: '平均客室単価' },
  
  { id: 'kpi_spa_visitors', name: '来館者数', businessUnit: 'spa', type: 'KPI', parentId: 'kgi_sales_spa', targetValue: 30000, actualValue: 32000, unit: '人', previousValue: 29000, description: '温浴施設の月間来館者数' },
  { id: 'kpi_spa_arpu', name: '客単価', businessUnit: 'spa', type: 'KPI', parentId: 'kgi_sales_spa', targetValue: 2000, actualValue: 1950, unit: '円', previousValue: 1980, description: '1人あたりの温浴利用単価' },

  { id: 'kpi_restaurant_visitors', name: '来店数', businessUnit: 'restaurant', type: 'KPI', parentId: 'kgi_sales_restaurant', targetValue: 20000, actualValue: 18000, unit: '人', previousValue: 19500, description: '飲食店の月間来店数' },
  { id: 'kpi_restaurant_arpu', name: '客単価', businessUnit: 'restaurant', type: 'KPI', parentId: 'kgi_sales_restaurant', targetValue: 4000, actualValue: 3880, unit: '円', previousValue: 3900, description: '1人あたりの飲食単価' },
  { id: 'kpi_restaurant_cost', name: '原価率', businessUnit: 'restaurant', type: 'KPI', parentId: 'kgi_sales_restaurant', targetValue: 30, actualValue: 33, unit: '%', previousValue: 31, description: '材料費の割合' },
];

export interface KpiNodeWithComputedAndInit extends KpiNodeWithComputed {
  initialActualValue: number;
}

interface KpiStore {
  kpiData: Record<string, KpiNodeWithComputedAndInit>;
  selectedNodeId: string | null;
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
}

// データベース更新用のヘルパー関数
const syncToDB = async (kpiData: Record<string, KpiNodeWithComputedAndInit>, actions: Action[], projectId: string | null) => {
  if (!projectId) return;
  try {
    await setDoc(doc(db, 'projects', projectId, 'kpiData', 'main'), { kpiData, actions });
  } catch (error) {
    console.error("DB Sync Error:", error);
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

const initialData = mockKpiData.reduce((acc, node) => {
  acc[node.id] = calculateComputed({ ...node, initialActualValue: node.actualValue });
  return acc;
}, {} as Record<string, KpiNodeWithComputedAndInit>);

// 限界利益率などの仮説パラメータ
const MARGINAL_PROFIT_RATIO = 0.4;
// 温浴来館者1人増えた時の飲食・物販への送客割合
const CROSS_SELL_SPA_TO_REST = 0.25; 
const CROSS_SELL_SPA_TO_SHOP = 0.10;

export const useKpiStore = create<KpiStore>((set, get) => ({
  kpiData: initialData,
  selectedNodeId: null,
  actions: [
    { id: 'a1', kpiId: 'kpi_restaurant_cost', title: '仕入先の見直しと相見積もり', owner: '田中', dueDate: '2026-05-15', status: 'in_progress' },
    { id: 'a2', kpiId: 'kpi_hotel_occ', title: '平日限定プランのOTA露出強化', owner: '佐藤', dueDate: '2026-05-10', status: 'todo' },
  ],
  isDbInitialized: false,
  currentProjectId: null,

  initializeDB: async (projectId: string) => {
    // 既に同じプロジェクトで初期化済みならリターン
    if (get().isDbInitialized && get().currentProjectId === projectId) return;
    
    set({ currentProjectId: projectId, isDbInitialized: false });
    
    const docRef = doc(db, 'projects', projectId, 'kpiData', 'main');
    const docSnap = await getDoc(docRef);

    // DBにデータがなければ初期データを書き込む
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        kpiData: initialData,
        actions: get().actions
      });
    }

    // リアルタイム同期のリスナーを設定
    onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        set({ 
          kpiData: data.kpiData || initialData, 
          actions: data.actions || [],
          isDbInitialized: true 
        });
      }
    });
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
  removeKpiNode: (id) => {
    set((state) => {
      const draft = { ...state.kpiData };
      delete draft[id];
      const newSelected = state.selectedNodeId === id ? null : state.selectedNodeId;
      
      syncToDB(draft, state.actions, state.currentProjectId);
      return { kpiData: draft, selectedNodeId: newSelected };
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
}));
