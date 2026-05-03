import { KpiNodeData } from "@/types";

export const TEMPLATES = {
  hotel: [
    { id: 'h_1', name: '営業利益', type: 'KGI', parentId: null, targetValue: 50000000, actualValue: 42000000, unit: '円', businessUnit: 'company', previousValue: 0, description: 'ホテル事業全体の営業利益' },
    { id: 'h_2', name: '売上高', type: 'KPI', parentId: 'h_1', targetValue: 120000000, actualValue: 105000000, unit: '円', businessUnit: 'cross', previousValue: 0, description: '全施設の総売上' },
    { id: 'h_3', name: 'コスト (販管費等)', type: 'KPI', parentId: 'h_1', targetValue: 70000000, actualValue: 63000000, unit: '円', businessUnit: 'company', previousValue: 0, description: '運営にかかる総コスト' },
    { id: 'h_4', name: '宿泊売上', type: 'KPI', parentId: 'h_2', targetValue: 80000000, actualValue: 70000000, unit: '円', businessUnit: 'hotel', previousValue: 0, description: '客室からの売上' },
    { id: 'h_5', name: '料飲売上', type: 'KPI', parentId: 'h_2', targetValue: 40000000, actualValue: 35000000, unit: '円', businessUnit: 'restaurant', previousValue: 0, description: 'レストラン・宴会からの売上' },
    { id: 'h_6', name: '客室稼働率 (OCC)', type: 'KPI', parentId: 'h_4', targetValue: 85, actualValue: 78, unit: '%', businessUnit: 'hotel', previousValue: 0, description: '販売可能客室に対する実利用率' },
    { id: 'h_7', name: '平均客室単価 (ADR)', type: 'KPI', parentId: 'h_4', targetValue: 25000, actualValue: 24500, unit: '円', businessUnit: 'hotel', previousValue: 0, description: '1室あたりの平均販売単価' },
    { id: 'h_8', name: 'レストラン来客数', type: 'KPI', parentId: 'h_5', targetValue: 8000, actualValue: 7200, unit: '人', businessUnit: 'restaurant', previousValue: 0, description: '月間総利用人数' },
    { id: 'h_9', name: '飲食客単価', type: 'KPI', parentId: 'h_5', targetValue: 5000, actualValue: 4860, unit: '円', businessUnit: 'restaurant', previousValue: 0, description: '1人あたりの飲食単価' },
  ] as KpiNodeData[],
  
  restaurant: [
    { id: 'r_1', name: '店舗営業利益', type: 'KGI', parentId: null, targetValue: 8000000, actualValue: 6500000, unit: '円', businessUnit: 'restaurant', previousValue: 0, description: '飲食店舗の営業利益' },
    { id: 'r_2', name: '売上高', type: 'KPI', parentId: 'r_1', targetValue: 30000000, actualValue: 27500000, unit: '円', businessUnit: 'restaurant', previousValue: 0, description: '店舗総売上' },
    { id: 'r_3', name: 'FLコスト', type: 'KPI', parentId: 'r_1', targetValue: 18000000, actualValue: 17500000, unit: '円', businessUnit: 'company', previousValue: 0, description: '食材費(Food)と人件費(Labor)の合計' },
    { id: 'r_4', name: '来客数', type: 'KPI', parentId: 'r_2', targetValue: 10000, actualValue: 9200, unit: '人', businessUnit: 'restaurant', previousValue: 0, description: '月間総来客数' },
    { id: 'r_5', name: '客単価', type: 'KPI', parentId: 'r_2', targetValue: 3000, actualValue: 2989, unit: '円', businessUnit: 'restaurant', previousValue: 0, description: '1人あたりの平均単価' },
    { id: 'r_6', name: '新規客数', type: 'KPI', parentId: 'r_4', targetValue: 3000, actualValue: 2500, unit: '人', businessUnit: 'cross', previousValue: 0, description: '初回利用のお客様数' },
    { id: 'r_7', name: 'リピート客数', type: 'KPI', parentId: 'r_4', targetValue: 7000, actualValue: 6700, unit: '人', businessUnit: 'restaurant', previousValue: 0, description: '2回目以上の利用のお客様数' },
  ] as KpiNodeData[],

  retail: [
    { id: 'rt_1', name: '営業利益', type: 'KGI', parentId: null, targetValue: 15000000, actualValue: 12000000, unit: '円', businessUnit: 'company', previousValue: 0, description: '小売部門の営業利益' },
    { id: 'rt_2', name: '売上高', type: 'KPI', parentId: 'rt_1', targetValue: 50000000, actualValue: 45000000, unit: '円', businessUnit: 'shop', previousValue: 0, description: '総売上高' },
    { id: 'rt_3', name: '購買客数', type: 'KPI', parentId: 'rt_2', targetValue: 20000, actualValue: 18500, unit: '人', businessUnit: 'shop', previousValue: 0, description: 'レジ通過人数' },
    { id: 'rt_4', name: '客単価', type: 'KPI', parentId: 'rt_2', targetValue: 2500, actualValue: 2432, unit: '円', businessUnit: 'shop', previousValue: 0, description: '1レシートあたりの平均単価' },
    { id: 'rt_5', name: '来店客数', type: 'KPI', parentId: 'rt_3', targetValue: 40000, actualValue: 38000, unit: '人', businessUnit: 'cross', previousValue: 0, description: '店舗への来店者数' },
    { id: 'rt_6', name: '買上率', type: 'KPI', parentId: 'rt_3', targetValue: 50, actualValue: 48.6, unit: '%', businessUnit: 'shop', previousValue: 0, description: '来店者のうち購買した人の割合' },
    { id: 'rt_7', name: '平均買上点数', type: 'KPI', parentId: 'rt_4', targetValue: 3.5, actualValue: 3.2, unit: '点', businessUnit: 'shop', previousValue: 0, description: '1人あたりの購入商品数' },
  ] as KpiNodeData[],
};
