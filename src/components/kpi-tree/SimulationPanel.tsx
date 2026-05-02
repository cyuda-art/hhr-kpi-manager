"use client";

import { useKpiStore } from '@/store/useKpiStore';

export const SimulationPanel = () => {
  const { kpiData, updateActualValue, resetSimulations } = useKpiStore();

  // シミュレーション対象となるKPIの一部をピックアップ
  const targetKeys = [
    'kpi_hotel_occ',
    'kpi_hotel_adr',
    'kpi_spa_visitors',
    'kpi_restaurant_visitors',
    'kpi_restaurant_cost',
  ];

  return (
    <div className="h-full p-6 flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <span className="w-2 h-6 bg-primary-500 rounded-full block"></span>
          シミュレーション
        </h3>
        <p className="text-xs text-slate-500 mt-2">スライダーや直接入力で数値を変更し、ツリーへの影響を確認できます。</p>
      </div>

      <div className="space-y-6 flex-1">
        {targetKeys.map((key) => {
          const kpi = kpiData[key];
          if (!kpi) return null;

          return (
            <div key={key} className="space-y-2 border-b border-slate-100 pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700">{kpi.name}</label>
                <span className="text-[10px] text-slate-400">単位: {kpi.unit}</span>
              </div>
              
              <input 
                type="number"
                value={kpi.actualValue}
                onChange={(e) => updateActualValue(key, Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
              />

              <input 
                type="range" 
                min={kpi.targetValue * 0.5} 
                max={kpi.targetValue * 1.5} 
                step={kpi.targetValue * 0.05}
                value={kpi.actualValue}
                onChange={(e) => updateActualValue(key, Number(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{(kpi.targetValue * 0.5).toLocaleString()}</span>
                <span>{(kpi.targetValue * 1.5).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <button 
          onClick={resetSimulations}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
        >
          リセット
        </button>
      </div>
    </div>
  );
};
