"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useMemo, useEffect } from 'react';
import { CheckSquare, Calendar as CalendarIcon, User, Building, AlertCircle, LayoutGrid, Clock } from 'lucide-react';
import { Action } from '@/types';

type ViewMode = 'kanban' | 'timeline' | 'calendar';

export default function MyTasksPage() {
  const { actions, setActionsBulk, kpiData } = useKpiStore();
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isMounted, setIsMounted] = useState(false);

  // カレンダー・タイムライン用の基準年月（現在は今月固定とするが、拡張可能）
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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

  // Drag & Drop (Kanban)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
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

  const TaskCard = ({ action }: { action: Action }) => {
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
              <CalendarIcon size={12} />
              <span>{action.dueDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----- Calendar View Logic -----
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 空白マス
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50"></div>);
    }

    // 日付マス
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = filteredActions.filter(a => a.dueDate === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div key={d} className={`min-h-[120px] p-2 border border-slate-200 dark:border-slate-800 ${isToday ? 'bg-primary-50/30 dark:bg-primary-900/10' : 'bg-white dark:bg-[#282a2d]'}`}>
          <div className={`text-xs font-bold mb-1 ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}>{d}</div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px] custom-scrollbar">
            {dayTasks.map(task => (
              <div 
                key={task.id} 
                className={`text-[10px] p-1 px-1.5 rounded truncate ${task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto">
          {days}
        </div>
      </div>
    );
  };

  // ----- Timeline View Logic -----
  const renderTimeline = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    const days = Array.from({length: daysInMonth}, (_, i) => {
      const d = new Date(year, month, i + 1);
      return {
        date: d.getDate(),
        dayOfWeek: d.getDay(),
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      };
    });

    return (
      <div className="flex-1 bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="flex overflow-x-auto flex-1 custom-scrollbar">
          {/* 左側のタスクリスト */}
          <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#282a2d] sticky left-0 z-10 flex flex-col">
            <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-slate-500">
              タスク名
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredActions.map(action => (
                <div key={action.id} className="h-12 border-b border-slate-100 dark:border-slate-800/50 flex flex-col justify-center px-4">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{action.title}</span>
                  <span className="text-[9px] text-slate-500 truncate">{action.owner}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右側のガントチャート */}
          <div className="flex flex-col flex-1 min-w-max">
            <div className="h-12 flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0">
              {days.map(d => (
                <div key={d.date} className={`w-10 shrink-0 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-800/50 ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-slate-100/50 dark:bg-slate-800/30' : ''}`}>
                  <span className="text-[9px] text-slate-400">{['日','月','火','水','木','金','土'][d.dayOfWeek]}</span>
                  <span className={`text-[11px] font-bold ${d.dateStr === new Date().toISOString().split('T')[0] ? 'text-primary-500' : 'text-slate-700 dark:text-slate-300'}`}>{d.date}</span>
                </div>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {/* 背景のグリッド線 */}
              <div className="absolute inset-0 flex pointer-events-none">
                {days.map(d => (
                  <div key={d.date} className={`w-10 shrink-0 border-r border-slate-100 dark:border-slate-800/30 ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-slate-50/50 dark:bg-slate-800/10' : ''}`}></div>
                ))}
              </div>

              {/* タスクバー */}
              {filteredActions.map(action => {
                const startStr = action.startDate || action.dueDate; // startDateがなければdueDateのみ
                const endStr = action.dueDate;
                
                // 開始日が今月内かどうか
                const startMonth = new Date(startStr).getMonth();
                const endMonth = new Date(endStr).getMonth();
                
                // ガントチャート描画用の簡易的な計算（本来は厳密な日付計算が必要だが今回は月のインデックスで処理）
                let startIdx = days.findIndex(d => d.dateStr === startStr);
                let endIdx = days.findIndex(d => d.dateStr === endStr);
                
                // 月をまたぐ場合の補正
                if (startIdx === -1 && startMonth < month) startIdx = 0;
                if (endIdx === -1 && endMonth > month) endIdx = days.length - 1;
                
                if (startIdx === -1 && endIdx === -1) {
                   // 完全に月外の場合は描画しない（本来は前月・次月へのスクロール対応が必要）
                }

                // fallback
                if (startIdx === -1) startIdx = endIdx;
                if (endIdx === -1) endIdx = startIdx;

                const left = startIdx * 40; // 1日40px (w-10)
                const width = ((endIdx - startIdx) + 1) * 40;
                
                const barColor = action.status === 'done' ? 'bg-emerald-500' : action.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400';

                return (
                  <div key={action.id} className="h-12 border-b border-transparent relative flex items-center group">
                    {(startIdx !== -1 && endIdx !== -1) && (
                      <div 
                        className={`absolute h-6 rounded-full shadow-sm ${barColor} opacity-90 group-hover:opacity-100 transition-opacity z-10 flex items-center px-2 cursor-pointer`}
                        style={{ left: `${left + 4}px`, width: `${Math.max(width - 8, 24)}px` }}
                        title={`${action.title} (${startStr} ~ ${endStr})`}
                      >
                        {width > 60 && <span className="text-[10px] text-white font-bold truncate">{action.title}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto w-full">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              マイタスク 
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-normal text-slate-500">{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">担当している施策（KSF）のステータスやスケジュールを管理します。</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          
          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-[#202124] text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={14} /> カンバン
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-[#202124] text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Clock size={14} /> タイムライン
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-[#202124] text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <CalendarIcon size={14} /> カレンダー
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <User size={14} className="text-slate-400" />
            <select 
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="flex-1 sm:w-36 px-2 py-1.5 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">すべての担当者</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
              <option value="未定">未定</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' && (
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
      )}

      {viewMode === 'calendar' && renderCalendar()}
      {viewMode === 'timeline' && renderTimeline()}

    </div>
  );
}
