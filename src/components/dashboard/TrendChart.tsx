"use client";

import { useMemo, useState } from 'react';
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

type Period = '1w' | '1m' | '3m' | '6m' | '1y' | '3y' | '5y';

const periodOptions: { value: Period; label: string }[] = [
  { value: '1w', label: '1週' },
  { value: '1m', label: '1ヶ月' },
  { value: '3m', label: '3ヶ月' },
  { value: '6m', label: '半年' },
  { value: '1y', label: '1年' },
  { value: '3y', label: '3年' },
  { value: '5y', label: '5年' },
];

export const TrendChart = ({ actualValue, targetValue, unit }: Props) => {
  const [period, setPeriod] = useState<Period>('6m');

  const data = useMemo(() => {
    // 期間に応じたデータポイント数とラベル生成
    let points = 6;
    let labelFormatter: (i: number, total: number) => string;

    const today = new Date();
    
    switch (period) {
      case '1w':
        points = 7;
        labelFormatter = (i, total) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (total - 1 - i));
          return `${d.getMonth() + 1}/${d.getDate()}`;
        };
        break;
      case '1m':
        points = 4; // 4週間
        labelFormatter = (i, total) => `${total - 1 - i === 0 ? '今週' : `${total - 1 - i}週前`}`;
        break;
      case '3m':
        points = 12; // 12週間
        labelFormatter = (i, total) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (total - 1 - i) * 7);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        };
        break;
      case '6m':
        points = 6;
        labelFormatter = (i, total) => {
          const d = new Date(today);
          d.setMonth(today.getMonth() - (total - 1 - i));
          return `${d.getMonth() + 1}月`;
        };
        break;
      case '1y':
        points = 12;
        labelFormatter = (i, total) => {
          const d = new Date(today);
          d.setMonth(today.getMonth() - (total - 1 - i));
          return `${d.getMonth() + 1}月`;
        };
        break;
      case '3y':
        points = 6; // 半期ごと
        labelFormatter = (i, total) => {
          const d = new Date(today);
          d.setMonth(today.getMonth() - (total - 1 - i) * 6);
          return `${d.getFullYear()}年${d.getMonth() + 1 >= 7 ? '下期' : '上期'}`;
        };
        break;
      case '5y':
        points = 5;
        labelFormatter = (i, total) => {
          const d = new Date(today);
          d.setFullYear(today.getFullYear() - (total - 1 - i));
          return `${d.getFullYear()}年`;
        };
        break;
    }

    const generatedData = [];
    let currentValue = actualValue; // 終点が現在実績

    // 過去に遡るほど実績が少しずつ低くなるような（右肩上がりの）トレンドを作る
    // もちろんランダムな上下も入れる
    for (let i = points - 1; i >= 0; i--) {
      if (i === points - 1) {
        generatedData.unshift({
          name: labelFormatter(i, points),
          実績: actualValue,
          目標: targetValue,
        });
      } else {
        // 1ポイント遡るごとに、平均して目標の 2%〜5% 程度下がるランダムウォーク
        const drop = targetValue * (0.02 + Math.random() * 0.05);
        // 時々上がる（ノイズ）
        const noise = targetValue * (Math.random() * 0.04 - 0.02);
        currentValue = Math.max(0, Math.round(currentValue - drop + noise));
        
        generatedData.unshift({
          name: labelFormatter(i, points),
          実績: currentValue,
          目標: targetValue,
        });
      }
    }

    return generatedData;
  }, [actualValue, targetValue, period]);

  return (
    <div className="w-full flex flex-col gap-2 mt-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
      
      {/* 期間選択タブ */}
      <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors whitespace-nowrap ${
              period === opt.value
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="w-full h-56 mt-2">
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
              formatter={(value: any) => [`${Number(value).toLocaleString()}${unit}`, '']}
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
      </div>
    </div>
  );
};
