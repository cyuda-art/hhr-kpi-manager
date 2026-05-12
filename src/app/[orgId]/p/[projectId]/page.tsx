"use client";

import { useState, useMemo, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, CalendarDays, BarChart3, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { kpiData } = useKpiStore();
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'1m' | '3m' | '6m' | '1y' | '3y' | '10y'>('6m');
  const [viewMode, setViewMode] = useState<'actual' | 'rate'>('actual');
  const [showArchived, setShowArchived] = useState(false);

  // KPIリストをフラット化してセレクトボックス用に準備
  const kpiList = useMemo(() => {
    return Object.values(kpiData)
      .filter(node => showArchived || !node.isArchived)
      .map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        unit: node.unit,
        depth: node.parentId ? 1 : 0,
        isArchived: node.isArchived
      }));
  }, [kpiData, showArchived]);

  // 初期選択（KGI優先）
  useEffect(() => {
    if (!selectedKpiId && kpiList.length > 0) {
      const kgi = kpiList.find(k => k.type === 'KGI');
      setSelectedKpiId(kgi ? kgi.id : kpiList[0].id);
    }
  }, [kpiList, selectedKpiId]);

  const selectedNode = selectedKpiId ? kpiData[selectedKpiId] : null;

  // グラフ用のデータを生成
  const chartData = useMemo(() => {
    if (!selectedNode || !selectedNode.history || selectedNode.history.length === 0) {
      return [];
    }
    
    // 実データのみを使用する
    const baseData = [...selectedNode.history].sort((a, b) => a.date.localeCompare(b.date));

    // 期間の計算とグルーピング単位の決定
    const now = new Date();
    let startDate = new Date();
    let groupMode: 'day' | 'week' | 'month' | 'year' = 'day';

    switch (periodFilter) {
      case '1m': startDate.setMonth(now.getMonth() - 1); groupMode = 'day'; break;
      case '3m': startDate.setMonth(now.getMonth() - 3); groupMode = 'day'; break;
      case '6m': startDate.setMonth(now.getMonth() - 6); groupMode = 'week'; break;
      case '1y': startDate.setFullYear(now.getFullYear() - 1); groupMode = 'month'; break;
      case '3y': startDate.setFullYear(now.getFullYear() - 3); groupMode = 'month'; break;
      case '10y': startDate.setFullYear(now.getFullYear() - 10); groupMode = 'year'; break;
    }

    // フィルタリング
    const filtered = baseData.filter(item => new Date(item.date) >= startDate);

    // グルーピング（集計）
    const grouped = new Map<string, { totalActual: number; totalTarget: number; count: number }>();
    
    filtered.forEach(item => {
      const d = new Date(item.date);
      let key = item.date; // day
      if (groupMode === 'week') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜始まり
        const firstDay = new Date(d.setDate(diff));
        key = firstDay.toISOString().split('T')[0];
      } else if (groupMode === 'month') {
        key = item.date.substring(0, 7); // YYYY-MM
      } else if (groupMode === 'year') {
        key = item.date.substring(0, 4); // YYYY
      }

      if (!grouped.has(key)) {
        grouped.set(key, { totalActual: 0, totalTarget: 0, count: 0 });
      }
      const g = grouped.get(key)!;
      g.totalActual += item.actualValue;
      g.totalTarget += item.targetValue;
      g.count += 1;
    });

    const result = Array.from(grouped.entries()).map(([date, vals]) => {
      // 期間内の平均値を採用
      const actualValue = vals.totalActual / vals.count;
      const targetValue = vals.totalTarget / vals.count;
      return {
        date,
        actualValue: Math.round(actualValue * 10) / 10,
        targetValue: Math.round(targetValue * 10) / 10,
        achievementRate: targetValue > 0 ? (actualValue / targetValue) * 100 : 0
      };
    });
    
    return result.sort((a, b) => a.date.localeCompare(b.date));

  }, [selectedNode, periodFilter]);

  // 選択された期間全体のサマリー数値を計算（グラフに連動）
  const periodSummary = useMemo(() => {
    if (!selectedNode) return null;
    if (chartData.length === 0) {
      return {
        actualValue: selectedNode.actualValue,
        targetValue: selectedNode.targetValue,
        achievementRate: selectedNode.targetValue > 0 ? (selectedNode.actualValue / selectedNode.targetValue) * 100 : 0
      };
    }
    
    const totalActual = chartData.reduce((sum, item) => sum + item.actualValue, 0);
    const totalTarget = chartData.reduce((sum, item) => sum + item.targetValue, 0);
    const count = chartData.length;
    
    const avgActual = totalActual / count;
    const avgTarget = totalTarget / count;
    const achievementRate = avgTarget > 0 ? (avgActual / avgTarget) * 100 : 0;
    
    return {
      actualValue: Math.round(avgActual * 10) / 10,
      targetValue: Math.round(avgTarget * 10) / 10,
      achievementRate
    };
  }, [chartData, selectedNode]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] md:text-[36px] font-normal text-slate-900 dark:text-[#f1f3f4] flex items-center gap-3 tracking-tight">
            ダッシュボード
          </h1>
          <p className="text-[20px] md:text-[24px] font-normal text-slate-500 dark:text-[#9aa0a6] mt-2">
            プロジェクトのKGI・KPIの目標と実績の推移を可視化します。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側：セレクタ */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#2d2f31] rounded-[8px] border border-slate-200 dark:border-[#3c4043] p-4">
            <h3 className="font-medium text-[14px] mb-4 flex items-center gap-1.5 text-slate-800 dark:text-[#e8eaed]">
              <Target size={16} /> 対象指標の選択
            </h3>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {kpiList.map(kpi => (
                <button
                  key={kpi.id}
                  onClick={() => setSelectedKpiId(kpi.id)}
                  className={`w-full text-left px-3 py-2 rounded-[4px] text-[13px] transition-colors flex items-center gap-2 ${
                    selectedKpiId === kpi.id
                      ? 'bg-primary-600 dark:bg-[#8ab4f8]/10 text-primary-600 dark:text-[#8ab4f8] font-medium border border-primary-500 dark:border-[#8ab4f8]/20'
                      : 'text-slate-500 dark:text-[#9aa0a6] hover:bg-slate-200 dark:bg-[#3c4043] hover:text-slate-800 dark:text-[#e8eaed]'
                  }`}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-[2px] font-bold ${kpi.type === 'KGI' ? 'bg-[#fbbc04]/20 text-[#fbbc04]' : 'bg-[#5f6368] text-slate-800 dark:text-[#e8eaed]'}`}>
                    {kpi.type}
                  </span>
                  <span className={`truncate ${kpi.isArchived ? 'opacity-50 line-through' : ''}`}>{kpi.name}</span>
                  {kpi.isArchived && <span className="text-[9px] bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 rounded ml-auto">アーカイブ</span>}
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#3c4043]">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                  <div className={`block w-8 h-5 rounded-full transition-colors ${showArchived ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${showArchived ? 'translate-x-3' : ''}`}></div>
                </div>
                <span className="text-[12px] text-slate-500 dark:text-[#9aa0a6] group-hover:text-slate-700 dark:group-hover:text-[#e8eaed] transition-colors">
                  🗑️ アーカイブ済みのKPIも表示する
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 右側：メインレポート */}
        <div className="lg:col-span-3 space-y-6">
          {selectedNode ? (
            <div className="bg-white dark:bg-[#2d2f31] rounded-[8px] border border-slate-200 dark:border-[#3c4043] p-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-[16px] font-medium text-slate-900 dark:text-[#f1f3f4] flex items-center gap-2">
                    {selectedNode.name}
                    {selectedNode.isArchived && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-normal">アーカイブ済み</span>
                    )}
                  </h2>
                  <div className="text-[13px] text-slate-500 dark:text-[#9aa0a6] mt-1 flex items-center gap-2">
                    <span>期間内実績: <strong className="text-slate-800 dark:text-[#e8eaed]">{periodSummary?.actualValue.toLocaleString()}{selectedNode.unit}</strong></span>
                    <span>/</span>
                    <span>目標: {periodSummary?.targetValue.toLocaleString()}{selectedNode.unit}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded-[2px] font-medium text-[11px] ${(periodSummary?.achievementRate || 0) >= 100 ? 'bg-[#81c995]/20 text-[#81c995]' : (periodSummary?.achievementRate || 0) >= 80 ? 'bg-[#fbbc04]/20 text-[#fbbc04]' : 'bg-rose-500/20 text-rose-500'}`}>
                      達成率: {periodSummary?.achievementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-slate-50 dark:bg-[#202124] rounded-[4px] p-1 border border-slate-200 dark:border-[#3c4043]">
                    <button 
                      onClick={() => setViewMode('actual')}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-[2px] transition-colors ${viewMode === 'actual' ? 'bg-slate-200 dark:bg-[#3c4043] text-slate-800 dark:text-[#e8eaed]' : 'text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:text-[#e8eaed]'}`}
                    >
                      実数値
                    </button>
                    <button 
                      onClick={() => setViewMode('rate')}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-[2px] transition-colors ${viewMode === 'rate' ? 'bg-slate-200 dark:bg-[#3c4043] text-slate-800 dark:text-[#e8eaed]' : 'text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:text-[#e8eaed]'}`}
                    >
                      達成率 (%)
                    </button>
                  </div>

                  <select 
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] text-slate-800 dark:text-[#e8eaed] text-[13px] rounded-[4px] px-3 py-1.5 outline-none focus:border-primary-500 dark:border-[#8ab4f8] transition-colors"
                  >
                    <option value="1m">過去1ヶ月</option>
                    <option value="3m">過去3ヶ月</option>
                    <option value="6m">過去半年</option>
                    <option value="1y">過去1年</option>
                    <option value="3y">過去3年</option>
                    <option value="10y">過去10年</option>
                  </select>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[400px] w-full relative">
                {chartData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                    履歴データがありません。シートエディタからデータを追加するか、ツリーで実績を更新してください。
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3c4043" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9aa0a6', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9aa0a6', fontSize: 12 }}
                        tickFormatter={(val) => viewMode === 'actual' ? `${val.toLocaleString()}` : `${val}%`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#282a2d', borderRadius: '4px', border: '1px solid #3c4043', color: '#e8eaed' }}
                        formatter={(value: any, name: any) => [
                          viewMode === 'actual' ? `${value.toLocaleString()} ${selectedNode.unit}` : `${value.toFixed(1)}%`,
                          name
                        ]}
                        labelStyle={{ color: '#9aa0a6', marginBottom: '4px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Line 
                        type="monotone" 
                        dataKey={viewMode === 'actual' ? 'actualValue' : 'achievementRate'} 
                        name="実績" 
                        stroke="#8ab4f8" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2d2f31', strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      {viewMode === 'actual' && (
                        <Line 
                          type="monotone" 
                          dataKey="targetValue" 
                          name="目標" 
                          stroke="#9aa0a6" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Data Table */}
              {chartData.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[12px] text-slate-500 dark:text-[#9aa0a6] uppercase bg-white dark:bg-[#282a2d] border-y border-slate-200 dark:border-[#3c4043]">
                      <tr>
                        <th className="px-4 py-3 font-medium">期間 (日付)</th>
                        <th className="px-4 py-3 font-medium">目標値</th>
                        <th className="px-4 py-3 font-medium">実績値</th>
                        <th className="px-4 py-3 font-medium">達成率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-200 dark:border-[#3c4043] last:border-0 hover:bg-slate-100 dark:bg-[#323639] transition-colors text-[13px]">
                          <td className="px-4 py-3 text-slate-800 dark:text-[#e8eaed]">{row.date}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-[#9aa0a6]">{row.targetValue.toLocaleString()} {selectedNode.unit}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-[#f1f3f4]">{row.actualValue.toLocaleString()} {selectedNode.unit}</td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${row.achievementRate >= 100 ? 'text-[#81c995]' : row.achievementRate >= 80 ? 'text-[#fbbc04]' : 'text-rose-500 dark:text-[#f28b82]'}`}>
                              {row.achievementRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white dark:bg-[#282a2d] rounded-[8px] border border-dashed border-slate-300 dark:border-[#5f6368] p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle size={48} className="text-[#5f6368] mb-4" />
              <h3 className="text-[16px] font-medium text-slate-800 dark:text-[#e8eaed] mb-2">指標が選択されていません</h3>
              <p className="text-[13px] text-slate-500 dark:text-[#9aa0a6]">左側のリストから、推移を確認したいKGIまたはKPIを選択してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
