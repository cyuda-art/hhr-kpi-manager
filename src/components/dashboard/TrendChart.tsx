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

interface Props {
  actualValue: number;
  targetValue: number;
  unit: string;
}

export const TrendChart = ({ actualValue, targetValue, unit }: Props) => {
  // 過去6ヶ月分のダミーデータを生成
  const data = useMemo(() => {
    const months = ['10月', '11月', '12月', '1月', '2月', '今月'];
    return months.map((month, index) => {
      if (index === months.length - 1) {
        return { name: month, 実績: actualValue, 目標: targetValue };
      }
      // 過去の月は目標値の 75% 〜 105% 程度をランダムにブレさせる
      const randomActual = Math.round(targetValue * (0.75 + Math.random() * 0.3));
      return {
        name: month,
        実績: randomActual,
        目標: targetValue,
      };
    });
  }, [actualValue, targetValue]);

  return (
    <div className="w-full h-64 mt-4 bg-white p-4 rounded-lg border border-slate-200">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => {
              if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
              return value;
            }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`${Number(value).toLocaleString()}${unit}`, '']}
          />
          <ReferenceLine y={targetValue} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'top', value: '目標', fill: '#94a3b8', fontSize: 12 }} />
          <Line 
            type="monotone" 
            dataKey="実績" 
            stroke="#6366f1" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
