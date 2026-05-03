"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useMemo } from 'react';
import { CheckSquare, Calendar, User, Building, AlertCircle } from 'lucide-react';

export default function MyTasksPage() {
  const { actions, setActionsBulk, kpiData } = useKpiStore();
  const [filterOwner, setFilterOwner] = useState<string>('all');
  
  // 担当者のリスト（重複排除）
  const owners = useMemo(() => {
    const list = actions.map(a => a.owner).filter(o => o && o !== '未定');
    return Array.from(new Set(list)).sort();
  }, [actions]);

  // 表示するタスクのフィルタリング
  const filteredActions = useMemo(() => {
    if (filterOwner === 'all') return actions;
    return actions.filter(a => a.owner === filterOwner);
  }, [actions, filterOwner]);

  const todoList = filteredActions.filter(a => a.status === 'todo');
  const inProgressList = filteredActions.filter(a => a.status === 'in_progress');
  const doneList = filteredActions.filter(a => a.status === 'done');

  // Drag & Drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    // Firefox対応などに必要
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const updatedActions = actions.map(action => {
      if (action.id === draggedTaskId) {
        return { ...action, status: newStatus };
      }
      return action;
    });

    setActionsBulk(updatedActions);
    setDraggedTaskId(null);
  };

  const getStatusColor = (status: string) => {
    if (status === 'done') return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400';
    if (status === 'in_progress') return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400';
    return 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200';
  };

  const TaskCard = ({ action }: { action: any }) => {
    const isPastDue = new Date(action.dueDate) < new Date() && action.status !== 'done';
    const targetKpiName = kpiData[action.kpiId]?.name || '不明なKPI';

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, action.id)}
        className={`p-4 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${getStatusColor(action.status)} ${draggedTaskId === action.id ? 'opacity-50' : 'opacity-100'}`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-sm leading-tight">{action.title}</h4>
            {isPastDue && <span title="期限切れ"><AlertCircle size={14} className="text-rose-500 shrink-0" /></span>}
          </div>
          
          <div className="text-xs flex items-center gap-1.5 opacity-80 mt-1">
            <Building size={12} />
            <span className="truncate">{targetKpiName}</span>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <User size={12} className="opacity-70" />
              <span>{action.owner}</span>
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-medium ${isPastDue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'opacity-70'}`}>
              <Calendar size={12} />
              <span>{action.dueDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">マイタスク (カンバンボード)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">あなたが担当している施策（KFC）を管理し、ドラッグ＆ドロップでステータスを更新します。</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">担当者で絞り込む:</span>
          <select 
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="flex-1 sm:w-48 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">すべて表示</option>
            {owners.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
            <option value="未定">未定</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-x-auto pb-2 custom-scrollbar">
        {/* To Do Column */}
        <div 
          className="flex-1 min-w-[280px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'todo')}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              To Do (未着手)
            </h3>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold">{todoList.length}</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {todoList.map(action => <TaskCard key={action.id} action={action} />)}
            {todoList.length === 0 && (
              <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold">
                タスクがありません
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div 
          className="flex-1 min-w-[280px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in_progress')}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              In Progress (進行中)
            </h3>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">{inProgressList.length}</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {inProgressList.map(action => <TaskCard key={action.id} action={action} />)}
            {inProgressList.length === 0 && (
              <div className="h-24 border-2 border-dashed border-blue-200/50 dark:border-blue-900/50 rounded-xl flex items-center justify-center text-xs text-blue-400 font-bold">
                ドロップして進行中にする
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div 
          className="flex-1 min-w-[280px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'done')}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Done (完了)
            </h3>
            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">{doneList.length}</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {doneList.map(action => <TaskCard key={action.id} action={action} />)}
            {doneList.length === 0 && (
              <div className="h-24 border-2 border-dashed border-emerald-200/50 dark:border-emerald-900/50 rounded-xl flex items-center justify-center text-xs text-emerald-400 font-bold">
                ドロップして完了にする
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
