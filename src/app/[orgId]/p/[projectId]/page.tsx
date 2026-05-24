"use client";

import { useState, useMemo, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, BarChart3, AlertCircle, AlertTriangle, Bot, CheckCircle2 } from 'lucide-react';
import { shouldScaleWithPeriod } from '@/lib/kpi-utils';

export default function DashboardPage() {
  const { kpiData, currentPeriod } = useKpiStore();
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);

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
    }).filter((item): item is NonNullable<typeof item> => item !== null);
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
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header (Minimal) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="text-strategic-teal" /> マネジメント・コックピット
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            AIローリング・フォーキャストによる全社KPI状況の俯瞰
          </p>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 md:gap-5">
        
        {/* 1. Hero Widget (KGI) - spans 8 cols */}
        <div className="md:col-span-4 lg:col-span-8 bg-gradient-to-br from-slate-900 to-oxford-navy dark:from-slate-800 dark:to-slate-900 rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden shadow-md border border-slate-800/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-strategic-teal/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-slate-300 mb-3">
                <Target size={18} className="text-strategic-teal" />
                <span className="font-bold text-[13px] tracking-widest uppercase">KGI Status</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-3 font-poppins">
                {Math.round(summary.kgiNode?.achievementRate || 0)}%
              </h2>
              <div className="text-slate-400 text-[13px] font-medium bg-white/5 inline-flex px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                目標: {summary.kgiNode?.targetValue.toLocaleString()} / 実績: {summary.kgiNode?.actualValue.toLocaleString()}
              </div>
            </div>
            {/* Context/Summary Text */}
            <div>
               <p className="text-[14px] text-slate-300 leading-relaxed max-w-xl">
                 全社KGI（{summary.kgiNode?.name}）は現在 {Math.round(summary.kgiNode?.achievementRate || 0)}% の進捗です。
                 右側のヘルスチェックと下部のアクションセンターから、ボトルネックとなっている指標を確認してください。
               </p>
            </div>
          </div>
        </div>

        {/* 2. Health Check Widget - spans 4 cols */}
        <div className="md:col-span-4 lg:col-span-4 grid grid-cols-2 gap-4 md:gap-5">
          {/* Good */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-[24px] p-5 border border-white/50 dark:border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[#81c995] bg-[#81c995]/10 w-10 h-10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-[32px] font-black text-slate-800 dark:text-slate-100 font-poppins leading-none mb-1">{summary.statusCounts.good}</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 font-bold">順調 (On Track)</div>
            </div>
          </div>
          {/* Warning */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-[24px] p-5 border border-white/50 dark:border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[#fbbc04] bg-[#fbbc04]/10 w-10 h-10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-[32px] font-black text-slate-800 dark:text-slate-100 font-poppins leading-none mb-1">{summary.statusCounts.warning}</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400 font-bold">注意 (At Risk)</div>
            </div>
          </div>
          {/* Danger (Spans 2 columns) */}
          <div className="col-span-2 bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/10 dark:to-[#2d2f31] rounded-[24px] p-6 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-[12px] text-rose-500 font-bold mb-2 flex items-center gap-1.5"><AlertTriangle size={16} /> 危険 (Off Track)</div>
              <div className="text-[40px] font-black text-rose-600 dark:text-rose-400 font-poppins leading-none">{summary.statusCounts.danger}</div>
            </div>
            <div className="w-16 h-16 rounded-full border-[6px] border-rose-100 dark:border-rose-900/30 flex items-center justify-center bg-white dark:bg-slate-800">
               <span className="text-rose-500 font-bold font-poppins">
                 {Math.round((summary.statusCounts.danger / Math.max(1, summary.statusCounts.good + summary.statusCounts.warning + summary.statusCounts.danger)) * 100)}%
               </span>
            </div>
          </div>
        </div>

        {/* 3. Smart Heatmap (Bento Cards) - Spans 12 cols */}
        <div className="md:col-span-4 lg:col-span-12 mt-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-[15px] text-slate-800 dark:text-slate-200 flex items-center gap-2"><BarChart3 size={18} className="text-primary-500"/> 主要指標ヒートマップ</h3>
            <span className="text-[12px] text-slate-500">Q1〜Q4の進捗状況</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {heatmapData.map((row, i) => (
              <div key={i} 
                   onClick={() => setSelectedKpiId(row.id)}
                   className={`group cursor-pointer rounded-[20px] p-5 border transition-all duration-200 ${selectedKpiId === row.id ? 'bg-primary-50 dark:bg-[#8ab4f8]/10 border-primary-300 dark:border-[#8ab4f8]/50 ring-4 ring-primary-500/10' : 'bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/50 dark:border-white/10 border-white/50 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md'}`}>
                 <div className="flex justify-between items-start mb-6">
                   <div className="flex flex-col min-w-0 pr-4">
                     <span className={`text-[10px] px-2 py-0.5 rounded-[4px] font-bold w-fit mb-2 ${row.type === 'KGI' ? 'bg-[#fbbc04]/20 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{row.type}</span>
                     <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">{row.name}</span>
                   </div>
                   <div className="text-right shrink-0">
                     <div className={`text-[20px] font-black font-poppins ${row.year && row.year >= 100 ? 'text-[#81c995]' : row.year && row.year >= 80 ? 'text-[#fbbc04]' : 'text-rose-500'}`}>
                       {row.year !== null ? `${row.year.toFixed(0)}%` : '-'}
                     </div>
                     <div className="text-[10px] text-slate-400 font-bold">年間累計</div>
                   </div>
                 </div>
                 
                 {/* Mini Grid for Q1-Q4 */}
                 <div className="grid grid-cols-4 gap-2 mt-auto">
                    {[row.q1, row.q2, row.q3, row.q4].map((q, idx) => {
                      let bgColor = "bg-slate-100 dark:bg-slate-800";
                      if (q !== null) {
                        if (q >= 100) bgColor = "bg-[#81c995]";
                        else if (q >= 80) bgColor = "bg-[#fbbc04]";
                        else bgColor = "bg-rose-500";
                      }
                      return (
                        <div key={idx} className="flex flex-col gap-1.5 items-center">
                          <div className={`w-full h-2 rounded-full ${bgColor} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                          <span className="text-[10px] font-bold text-slate-400">Q{idx+1}</span>
                        </div>
                      )
                    })}
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Action Center (Shortfall Leaderboard) - spans 4 cols */}
        <div className="md:col-span-4 lg:col-span-4 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-[24px] border border-white/50 dark:border-white/10 p-6 shadow-sm flex flex-col h-[500px]">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-[15px] text-slate-800 dark:text-slate-200 flex items-center gap-2">
               <Bot size={18} className="text-strategic-teal" /> アクションセンター
             </h3>
             {shortfallLeaderboard.length > 0 && (
               <span className="bg-rose-100 text-rose-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                 {shortfallLeaderboard.length}件の未達
               </span>
             )}
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
             {shortfallLeaderboard.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <CheckCircle2 size={40} className="text-[#81c995] mb-3" />
                 <p className="text-[14px] font-bold text-slate-600 dark:text-slate-300">全て順調です</p>
                 <p className="text-[12px] mt-1">未達のKPIはありません</p>
               </div>
             ) : (
               shortfallLeaderboard.map(({ node, shortfall }) => (
                 <button 
                   key={node.id}
                   onClick={() => setSelectedKpiId(node.id)}
                   className={`w-full text-left p-3.5 rounded-[16px] border transition-all duration-200 flex items-center gap-3.5 ${selectedKpiId === node.id ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800 ring-2 ring-rose-500/10' : 'bg-slate-50 dark:bg-[#202124] border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                 >
                   <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                     <AlertTriangle size={18} className="text-rose-500" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">{node.name}</div>
                     <div className="text-[12px] text-rose-500 font-medium truncate mt-0.5">
                       未達残債: {shortfall.toLocaleString()} {node.unit}
                     </div>
                   </div>
                 </button>
               ))
             )}
           </div>
        </div>

        {/* 5. Detail Chart - spans 8 cols */}
        <div className="md:col-span-4 lg:col-span-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-[24px] border border-white/50 dark:border-white/10 p-6 shadow-sm flex flex-col h-[500px]">
           {selectedNode ? (
              <>
                <div className="flex items-start justify-between mb-8">
                  <div>
                     <div className="flex items-center gap-2.5 mb-1.5">
                       <span className={`text-[10px] px-2 py-0.5 rounded-[4px] font-bold ${selectedNode.type === 'KGI' ? 'bg-[#fbbc04]/20 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{selectedNode.type}</span>
                       <h2 className="text-[20px] font-bold text-slate-800 dark:text-slate-100">{selectedNode.name}</h2>
                     </div>
                     <p className="text-[13px] text-slate-500 dark:text-slate-400">単位: {selectedNode.unit} / ローリング・フォーキャスト推移</p>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickFormatter={(val) => val.toLocaleString()}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#00205B', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value: any, name: any) => {
                            let label = name;
                            if (name === 'originalTarget') label = '当初目標';
                            if (name === 'actualValue') label = '実績';
                            return [`${value.toLocaleString()} ${selectedNode.unit}`, label];
                          }}
                          labelStyle={{ color: '#425563', marginBottom: '8px', fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
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
              </>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <BarChart3 size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-300">指標を選択</h3>
                <p className="text-sm text-slate-500 mt-2">ヒートマップまたはアクションセンターから<br/>分析したい指標を選択してください。</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
