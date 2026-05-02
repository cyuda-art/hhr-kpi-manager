"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useEffect } from 'react';
import { Save, AlertCircle, FileSpreadsheet } from 'lucide-react';

export const DataEditor = () => {
  const { kpiData, commitBulkUpdate } = useKpiStore();
  
  // ローカルステートとして編集中のデータを保持
  const [localData, setLocalData] = useState<Record<string, { targetValue: number; actualValue: number }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 初回ロードやkpiData更新時にローカルステートを初期化
  useEffect(() => {
    const initialLocal: Record<string, { targetValue: number; actualValue: number }> = {};
    Object.values(kpiData).forEach(node => {
      initialLocal[node.id] = { targetValue: node.targetValue, actualValue: node.actualValue };
    });
    setLocalData(initialLocal);
    setHasChanges(false);
  }, [kpiData]);

  const handleChange = (id: string, field: 'targetValue' | 'actualValue', value: string) => {
    const numValue = Number(value) || 0;
    setLocalData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: numValue
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates = Object.keys(localData).map(id => ({
      id,
      value: localData[id].actualValue,
      targetValue: localData[id].targetValue,
    }));
    
    // commitBulkUpdateは現在 actualValue のみの更新に対応しているため、
    // targetValueも更新できるようにする必要があるが、一旦既存の updateKpiNode をループするか、
    // useKpiStore に一括更新機能を持たせる。今回はシンプルに updateKpiNode を連続で呼ぶか、
    // もしくは、kpiDataを直接一括セットする関数を使うか。
    // ここでは1つずつ updateKpiNode を呼ぶ（シミュレーションを走らせないように注意だが、今回は全て上書きなのでOK）
    
    // ※ 理想はStore側で bulkUpdate を用意すること。ここでは簡易的に。
    updates.forEach(update => {
      useKpiStore.getState().updateKpiNode(update.id, { 
        actualValue: update.value, 
        targetValue: update.targetValue 
      });
    });
    
    setHasChanges(false);
  };

  const nodesList = Object.values(kpiData).sort((a, b) => {
    // 種類(KGI優先)や名前でソート
    if (a.type === 'KGI' && b.type !== 'KGI') return -1;
    if (a.type !== 'KGI' && b.type === 'KGI') return 1;
    return a.businessUnit.localeCompare(b.businessUnit);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">スプレッドシート型エディタ</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">セルを直接編集してKPIの目標・実績を一括更新します。</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            hasChanges 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save size={16} />
          変更を保存
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300 w-24">タイプ</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300 w-32">事業部</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300 min-w-[200px]">指標名</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300 w-40 text-right">目標値</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300 w-40 text-right">実績値</th>
                <th className="p-3 font-bold text-slate-600 dark:text-slate-300 w-24 text-center">達成率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {nodesList.map(node => (
                <tr key={node.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      node.type === 'KGI' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                      {node.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">
                    {node.businessUnit}
                  </td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                    {node.name}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={localData[node.id]?.targetValue ?? node.targetValue}
                        onChange={(e) => handleChange(node.id, 'targetValue', e.target.value)}
                        className="w-full text-right px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-all"
                      />
                      <span className="text-xs text-slate-400 flex-shrink-0 w-4">{node.unit}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        value={localData[node.id]?.actualValue ?? node.actualValue}
                        onChange={(e) => handleChange(node.id, 'actualValue', e.target.value)}
                        className="w-full text-right px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none transition-all font-bold"
                      />
                      <span className="text-xs text-slate-400 flex-shrink-0 w-4">{node.unit}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-bold ${
                      node.status === 'danger' ? 'text-rose-500' : node.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {node.achievementRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {nodesList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">データがありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
