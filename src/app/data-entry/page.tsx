"use client";

import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { Save, UploadCloud, FileSpreadsheet } from 'lucide-react';

export default function DataEntryPage() {
  const { kpiData, commitBulkUpdate } = useKpiStore();
  
  // 入力用の一時ステート
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [isSaved, setIsSaved] = useState(false);

  // 初期化時にストアの値をセット
  useEffect(() => {
    const initialInputs: Record<string, number> = {};
    Object.values(kpiData)
      .filter((node) => node.type === 'KPI')
      .forEach((node) => {
        initialInputs[node.id] = node.actualValue;
      });
    setInputs(initialInputs);
  }, [kpiData]);

  const handleInputChange = (id: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [id]: Number(value)
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const updates = Object.entries(inputs).map(([id, value]) => ({ id, value }));
    commitBulkUpdate(updates);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleMockCsvImport = () => {
    // CSVインポートを想定し、ランダムに値をブレさせるモック機能
    const mockUpdates: Record<string, number> = {};
    Object.keys(inputs).forEach(id => {
      const base = kpiData[id].targetValue;
      // 目標値の80%〜110%の間のランダム値にする
      mockUpdates[id] = Math.round(base * (0.8 + Math.random() * 0.3));
    });
    setInputs(mockUpdates);
    setIsSaved(false);
  };

  // 事業ごとにグループ化
  const groupedKpis = Object.values(kpiData)
    .filter((node) => node.type === 'KPI')
    .reduce((acc, node) => {
      if (!acc[node.businessUnit]) acc[node.businessUnit] = [];
      acc[node.businessUnit].push(node);
      return acc;
    }, {} as Record<string, typeof kpiData[string][]>);

  const businessUnitLabels: Record<string, string> = {
    hotel: '宿泊事業',
    spa: '温浴事業',
    restaurant: '飲食事業',
    shop: '物販事業',
    kitchen: 'セントラルキッチン'
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">実績データ入力</h1>
          <p className="text-slate-500 mt-1">現場担当者向けの日次・週次データ入力フォーム</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleMockCsvImport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 border border-slate-300"
          >
            <FileSpreadsheet size={16} />
            CSV一括インポート
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save size={16} />
            {isSaved ? '保存しました！' : '実績を確定する'}
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {Object.entries(groupedKpis).map(([unit, kpis]) => (
          <div key={unit} className="border-b border-slate-200 last:border-0">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                {businessUnitLabels[unit] || unit}
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kpis.map((kpi) => (
                <div key={kpi.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">{kpi.name}</label>
                    <span className="text-[10px] text-slate-400">目標: {kpi.targetValue.toLocaleString()}{kpi.unit}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      value={inputs[kpi.id] || 0}
                      onChange={(e) => handleInputChange(kpi.id, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      {kpi.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
