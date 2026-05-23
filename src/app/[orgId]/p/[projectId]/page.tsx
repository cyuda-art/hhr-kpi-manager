"use client";

import { useState, useMemo, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TrendingUp, Target, BarChart3, AlertCircle, AlertTriangle, Bot, CheckCircle2 } from 'lucide-react';
import { shouldScaleWithPeriod } from '@/lib/kpi-utils';

export default function DashboardPage() {
  const { kpiData, currentPeriod } = useKpiStore();
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'actual' | 'rate'>('actual');

  // Executive Summary Calculations
  const summary = useMemo(() => {
    let kgiNode: any = null;
    let statusCounts = { good: 0, warning: 0, danger: 0 };
    
    Object.values(kpiData).forEach(node => {
      if (node.type === 'KGI') kgiNode = node;
      
      if (node.status === 'good') statusCounts.good++;
      else if (node.status === 'warning') statusCounts.warning++;
      else statusCounts.danger++;
    });

    return { kgiNode, statusCounts };
  }, [kpiData]);

  // Current logical period for rolling forecast
  const cp = currentPeriod.match(/^\d{4}-\d{2}$/) ? currentPeriod : "2026-06"; // Fallback to a mid-year month

  // KPIs with Shortfall (Leaderboard)
  const shortfallLeaderboard = useMemo(() => {
    const list = Object.values(kpiData).filter(node => {
      if (!shouldScaleWithPeriod(node as any)) return false;
      if (!node.monthlyData) return false;
      return true;
    }).map(node => {
      let accumTarget = 0;
      let accumActual = 0;
      const sortedMonths = Object.keys(node.monthlyData!).sort();
      for (const month of sortedMonths) {
        if (month < cp) {
          accumTarget += node.monthlyData![month].targetValue || 0;
          accumActual += node.monthlyData![month].actualValue || 0;
        }
      }
      return { node, shortfall: accumActual - accumTarget };
    }).filter(item => item.shortfall < 0);

    return list.sort((a, b) => a.shortfall - b.shortfall); // Most negative first (worst)
  }, [kpiData, cp]);

  const kpiList = useMemo(() => {
    return Object.values(kpiData);
  }, [kpiData]);

  // Heatmap Data (Macro View)
  const heatmapData = useMemo(() => {
    // KGIを探す
    const kgi = kpiList.find(k => k.type === 'KGI');
    // KGIとその直接の子（KSF）のみを抽出
    const list = kpiList.filter(k => k.type === 'KGI' || (kgi && k.parentId === kgi.id));
    
    return list.map(kpi => {
      const node = kpiData[kpi.id];
      if (!node || !node.monthlyData) return null;
      
      const getAggregatedRate = (months: string[]) => {
        let t = 0; let a = 0;
        let count = 0;
        for (const m of months) {
          if (node.monthlyData![m]) {
            t += node.monthlyData![m].targetValue || 0;
            a += node.monthlyData![m].actualValue || 0;
            count++;
          }
        }
        if (count === 0) return null;
        if (!shouldScaleWithPeriod(node as any)) {
          const avgT = t / count;
          const avgA = a / count;
          return avgT > 0 ? (avgA / avgT) * 100 : (avgA > 0 ? 100 : null);
        }
        return t > 0 ? (a / t) * 100 : (a > 0 ? 100 : null);
      };

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        q1: getAggregatedRate(["2026-04", "2026-05", "2026-06"]),
        q2: getAggregatedRate(["2026-07", "2026-08", "2026-09"]),
        q3: getAggregatedRate(["2026-10", "2026-11", "2026-12"]),
        q4: getAggregatedRate(["2027-01", "2027-02", "2027-03"]),
        year: getAggregatedRate([
          "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
          "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"
        ])
      };
    }).filter(Boolean);
  }, [kpiList, kpiData]);

  useEffect(() => {
    if (!selectedKpiId && kpiList.length > 0) {
      const kgi = kpiList.find(k => k.type === 'KGI');
      setSelectedKpiId(kgi ? kgi.id : kpiList[0].id);
    }
  }, [kpiList, selectedKpiId]);

  const selectedNode = selectedKpiId ? kpiData[selectedKpiId] : null;

  // Chart Data based on Monthly Data (Rolling Forecast)
  const chartData = useMemo(() => {
    if (!selectedNode || !selectedNode.monthlyData) return [];
    
    const allMonths = [
      "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
      "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"
    ];

    return allMonths.map(month => {
      const mData = selectedNode.monthlyData![month] || { targetValue: 0, actualValue: 0 };
      
      const isPast = month < cp;
      const isCurrent = month === cp;
      const isFuture = month > cp;

      let t = mData.targetValue || 0;
      let a = mData.actualValue || 0;
      return {
        month,
        originalTarget: t,
        actualValue: isPast || isCurrent ? a : undefined,
      };
    });
  }, [selectedNode, cp]);



  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[32px] md:text-[36px] font-normal text-slate-900 dark:text-[#f1f3f4] flex items-center gap-3 tracking-tight">
          マネジメント・コックピット
        </h1>
        <p className="text-[18px] font-normal text-slate-500 dark:text-[#9aa0a6] mt-1">
          全社の目標達成状況の俯瞰と、AIを活用したローリング・フォーキャスト
        </p>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-logic-slate dark:text-slate-300">
            <Target className="text-strategic-teal" />
            <h3 className="font-bold text-[16px]">KGI 進捗サマリー</h3>
          </div>
          {summary.kgiNode ? (
            <div>
              <div className="text-[32px] font-bold text-oxford-navy dark:text-slate-100 leading-tight">
                {Math.round(summary.kgiNode.achievementRate || 0)}%
              </div>
              <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                目標: {summary.kgiNode.targetValue.toLocaleString()} / 実績: {summary.kgiNode.actualValue.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">KGIが設定されていません</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 text-slate-800 dark:text-[#e8eaed]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-rose-500" />
              <h3 className="font-bold text-[16px]">全社ショートフォール</h3>
            </div>
            {shortfallLeaderboard.length > 0 && (
              <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {shortfallLeaderboard.length}件のアラート
              </span>
            )}
          </div>
          <div className="text-[32px] font-bold text-rose-600 leading-tight">
            {shortfallLeaderboard.length > 0 ? '要注意' : '正常'}
          </div>
          <div className="text-[13px] text-slate-500 mt-1">
            未達残債を抱えているKPIの数
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-800 dark:text-[#e8eaed]">
            <BarChart3 className="text-blue-500" />
            <h3 className="font-bold text-[16px]">KPI ヘルスチェック</h3>
          </div>
          <div className="flex items-end gap-6">
            <div className="text-center">
              <div className="text-[24px] font-bold text-[#81c995]">{summary.statusCounts.good}</div>
              <div className="text-[11px] text-slate-500">順調</div>
            </div>
            <div className="text-center">
              <div className="text-[24px] font-bold text-[#fbbc04]">{summary.statusCounts.warning}</div>
              <div className="text-[11px] text-slate-500">注意</div>
            </div>
            <div className="text-center">
              <div className="text-[24px] font-bold text-rose-500">{summary.statusCounts.danger}</div>
              <div className="text-[11px] text-slate-500">危険</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-Down Heatmap (Macro View) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-hidden">
        <div className="mb-4">
          <h2 className="text-[18px] font-bold text-oxford-navy dark:text-slate-100 flex items-center gap-2">
            <Target size={20} className="text-strategic-teal" />
            ドリルダウン・ヒートマップ
          </h2>
          <p className="text-[13px] text-logic-slate dark:text-slate-400 mt-1">
            KGIと主要KPIの四半期ごとの達成状況。赤いセル（ボトルネック）をクリックすると詳細チャートへドリルダウンします。
          </p>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left border-collapse">
            <thead className="text-[12px] text-logic-slate dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-slate-700">指標名</th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 text-center">Q1<br/><span className="text-[10px] font-normal opacity-70">4-6月</span></th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 text-center">Q2<br/><span className="text-[10px] font-normal opacity-70">7-9月</span></th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 text-center">Q3<br/><span className="text-[10px] font-normal opacity-70">10-12月</span></th>
                <th className="px-4 py-3 font-medium border-b border-slate-200 dark:border-slate-700 text-center">Q4<br/><span className="text-[10px] font-normal opacity-70">1-3月</span></th>
                <th className="px-4 py-3 font-bold border-b border-slate-200 dark:border-slate-700 text-center border-l border-slate-100 dark:border-slate-700/50">年間累計</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row: any, i) => {
                const getBgColor = (rate: number | null) => {
                  if (rate === null) return "bg-slate-50 dark:bg-slate-800/20";
                  if (rate >= 100) return "bg-[#81c995]/20 hover:bg-[#81c995]/30 text-emerald-800 dark:text-emerald-300";
                  if (rate >= 80) return "bg-[#fbbc04]/20 hover:bg-[#fbbc04]/30 text-amber-800 dark:text-amber-300";
                  return "bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-300";
                };

                const renderCell = (rate: number | null) => (
                  <td 
                    className={`px-4 py-3 text-center text-[13px] font-bold transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700/50 ${getBgColor(rate)}`}
                    onClick={() => setSelectedKpiId(row.id)}
                  >
                    {rate !== null ? `${rate.toFixed(1)}%` : '-'}
                  </td>
                );

                return (
                  <tr key={i} className={`group ${row.type === 'KGI' ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                    <td 
                      className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setSelectedKpiId(row.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-bold ${row.type === 'KGI' ? 'bg-[#fbbc04]/20 text-amber-700 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {row.type}
                        </span>
                        <span className={`text-[13px] font-medium truncate ${selectedKpiId === row.id ? 'text-strategic-teal font-bold' : 'text-oxford-navy dark:text-slate-200'}`}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    {renderCell(row.q1)}
                    {renderCell(row.q2)}
                    {renderCell(row.q3)}
                    {renderCell(row.q4)}
                    <td 
                      className={`px-4 py-3 text-center text-[13px] font-bold cursor-pointer border-b border-l border-slate-100 dark:border-slate-700/50 ${getBgColor(row.year)}`}
                      onClick={() => setSelectedKpiId(row.id)}
                    >
                      {row.year !== null ? `${row.year.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Leaderboard & Selector */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Recovery Panel */}
          {shortfallLeaderboard.length > 0 && (
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-xl border border-rose-200 dark:border-rose-800 p-4">
              <h3 className="font-bold text-[14px] text-rose-800 dark:text-rose-300 flex items-center gap-2 mb-3">
                <AlertCircle size={16} /> 未達KPI リーダーボード
              </h3>
              <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {shortfallLeaderboard.map(({ node, shortfall }) => (
                  <button 
                    key={node.id}
                    onClick={() => setSelectedKpiId(node.id)}
                    className="w-full text-left bg-white/60 dark:bg-slate-800/60 p-2 rounded border border-rose-100 dark:border-rose-900/50 hover:bg-white transition-colors"
                  >
                    <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{node.name}</div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      累計未達: {shortfall.toLocaleString()} {node.unit}
                    </div>
                  </button>
                ))}
              </div>

            </div>
          )}



          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-bold text-[14px] mb-4 flex items-center gap-1.5 text-slate-800 dark:text-[#e8eaed]">
              <Target size={16} /> 指標を選択して分析
            </h3>
            <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
              {kpiList.map(kpi => (
                <button
                  key={kpi.id}
                  onClick={() => setSelectedKpiId(kpi.id)}
                  className={`w-full text-left px-3 py-2 rounded-[6px] text-[13px] transition-colors flex items-center gap-2 ${
                    selectedKpiId === kpi.id
                      ? 'bg-strategic-teal dark:bg-[#8ab4f8]/10 text-strategic-teal dark:text-[#8ab4f8] font-bold border border-strategic-teal/20 dark:border-[#8ab4f8]/20'
                      : 'text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043]'
                  }`}
                >
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-[3px] font-bold ${kpi.type === 'KGI' ? 'bg-[#fbbc04]/20 text-[#fbbc04]' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-[#e8eaed]'}`}>
                    {kpi.type}
                  </span>
                  <span className="truncate">{kpi.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Rolling Forecast Chart */}
        <div className="lg:col-span-3">
          {selectedNode ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-[20px] font-bold text-oxford-navy dark:text-slate-100 flex items-center gap-2">
                    {selectedNode.name}
                    <span className="text-[12px] font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      単位: {selectedNode.unit}
                    </span>
                  </h2>
                  <p className="text-[13px] text-logic-slate dark:text-slate-400 mt-1">
                    ローリング・フォーキャスト（実績 vs 当初目標 vs AIシミュレーション）
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(val) => val.toLocaleString()}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#00205B', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: any) => {
                        let label = name;
                        if (name === 'originalTarget') label = '当初目標';
                        if (name === 'actualValue') label = '実績';
                        return [`${value.toLocaleString()} ${selectedNode.unit}`, label];
                      }}
                      labelStyle={{ color: '#425563', marginBottom: '8px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* 当初目標 */}
                    <Line 
                      type="monotone" 
                      dataKey="originalTarget" 
                      name="originalTarget" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                    />
                    
                    {/* 実績 (過去) */}
                    <Line 
                      type="monotone" 
                      dataKey="actualValue" 
                      name="actualValue" 
                      stroke="#00A3A1" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#00A3A1', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Data Table */}
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[12px] text-logic-slate dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-medium">月次</th>
                      <th className="px-4 py-3 font-medium">当初目標</th>
                      <th className="px-4 py-3 font-medium">実績</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-[13px]">
                        <td className="px-4 py-3 font-bold text-oxford-navy dark:text-slate-200">
                          {row.month}
                          {row.month === cp && <span className="ml-2 bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded">CURRENT</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {row.originalTarget.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {row.actualValue !== undefined ? row.actualValue.toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 flex flex-col items-center justify-center text-center h-full">
              <AlertCircle size={48} className="text-slate-400 dark:text-slate-500 mb-4" />
              <h3 className="text-[18px] font-bold text-oxford-navy dark:text-slate-200 mb-2">指標を選択してください</h3>
              <p className="text-[14px] text-logic-slate dark:text-slate-400">
                左側のリストから、ローリング・フォーキャストを確認したいKGI・KPIを選択してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
