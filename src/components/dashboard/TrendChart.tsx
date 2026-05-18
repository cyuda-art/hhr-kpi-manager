"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatDisplayValue } from '@/lib/kpi-utils';

interface Props {
  actualValue: number;
  targetValue: number;
  unit: string;
  history?: import('@/types').KpiHistoryEntry[];
  monthlyData?: Record<string, import('@/types').MonthlyData>;
}

export const TrendChart = ({ targetValue, unit, history, monthlyData }: Props) => {
  const data = useMemo(() => {
    // monthlyDataがある場合は月次トレンドを描画
    if (monthlyData && Object.keys(monthlyData).length > 0) {
      const sortedMonths = Object.keys(monthlyData).sort();
      return sortedMonths.map(m => ({
        name: m.substring(5).replace('-', '/'), // YYYY-MM -> MM/DD or MM
        実績: monthlyData[m].actualValue,
        目標: monthlyData[m].targetValue,
        シミュレーション: monthlyData[m].simulatedValue
      }));
    }

    // historyがある場合はそれを優先して描画する
    if (history && history.length > 0) {
      // 履歴データを日付順にソート（念のため）
      const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return sortedHistory.map(h => ({
        name: h.date.substring(5).replace('-', '/'), // MM/DD形式
        実績: h.actualValue,
        目標: h.targetValue,
      }));
    }
    // どちらもない場合は空の配列を返す
    return [];
  }, [history, monthlyData]);

  return (
    <div className="w-full flex flex-col gap-2 mt-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="w-full h-56 mt-2 relative">
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            履歴データがありません
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => {
                  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}億`;
                  if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
                  return value;
                }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`${formatDisplayValue(Number(value), unit)} ${unit}`, '']}
                labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <ReferenceLine y={targetValue} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'top', value: '目標', fill: '#94a3b8', fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey="実績" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
