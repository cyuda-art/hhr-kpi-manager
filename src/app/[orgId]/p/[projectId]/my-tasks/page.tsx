"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useMemo, useEffect } from 'react';
import { CheckSquare, Calendar as CalendarIcon, User, Building, AlertCircle, LayoutGrid, Clock, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Action, KpiNodeData } from '@/types';

type ViewMode = 'kanban' | 'timeline' | 'calendar';

// ツリー構造用のノード型
type TreeNode = {
  id: string;
  type: 'KGI' | 'KPI' | 'TASK';
  title: string;
  nodeData?: KpiNodeData;
  taskData?: Action;
  children: TreeNode[];
  startDate?: string;
  endDate?: string;
  depth: number;
};

const TaskCard = ({ action, kpiName, onDragStart, draggedTaskId, onClick }: { action: Action, kpiName: string, onDragStart: (e: React.DragEvent, id: string) => void, draggedTaskId: string | null, onClick?: () => void }) => {
  const isPastDue = action.dueDate && new Date(action.dueDate) < new Date() && action.status !== 'done';
  
  const getStatusColor = (status: string) => {
    if (status === 'done') return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400';
    if (status === 'in_progress') return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400';
    return 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, action.id)}
      onClick={onClick}
      className={`p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${getStatusColor(action.status)} ${draggedTaskId === action.id ? 'opacity-50' : 'opacity-100'} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-[13px] leading-tight">{action.title}</h4>
          {isPastDue && <span title="期限切れ"><AlertCircle size={14} className="text-rose-500 shrink-0" /></span>}
        </div>
        {action.priority && (
          <div className="flex">
            <span className={`text-[9px] px-1 rounded ${
              action.priority === 'urgent_important' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
              action.priority === 'not_urgent_important' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              action.priority === 'urgent_not_important' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {action.priority === 'urgent_important' ? '第1領域(必須・急)' :
               action.priority === 'not_urgent_important' ? '第2領域(重要・仕込)' :
               action.priority === 'urgent_not_important' ? '第3領域(錯覚・振分)' : '第4領域(無駄)'}
            </span>
          </div>
        )}
        {action.description && (
          <p className="text-[10px] opacity-80 line-clamp-2 mt-0.5">{action.description}</p>
        )}
        {kpiName && (
          <div className="text-[10px] flex items-center gap-1 opacity-70 mt-0.5 bg-black/5 dark:bg-white/10 w-fit px-1.5 py-0.5 rounded">
            <Building size={10} />
            <span className="truncate max-w-[150px]">{kpiName}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <User size={10} className="opacity-70" />
            <span className="truncate max-w-[80px]">{action.owner}</span>
            {action.department && <span className="opacity-70 ml-1 bg-black/5 dark:bg-white/10 px-1 rounded">{action.department}</span>}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-medium ${isPastDue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'opacity-70'}`}>
            <CalendarIcon size={10} />
            <span>{action.dueDate || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyTasksPage() {
  const { actions, setActionsBulk, kpiData } = useKpiStore();
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline'); // タイムラインをデフォルトに
  const [isMounted, setIsMounted] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [groupByKpi, setGroupByKpi] = useState(true);

  // タイムライン・カレンダー用の基準年月
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setIsMounted(true);
    // 初期状態でKGIはすべて開く
    const kgiIds = Object.values(kpiData).filter(n => n.type === 'KGI').map(n => n.id);
    setExpandedNodes(new Set(kgiIds));
  }, [kpiData]);
  
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

  // --- ツリー構築ロジック ---
  const treeData = useMemo(() => {
    const nodes = Object.values(kpiData);
    
    // サマリー日付を計算するヘルパー
    const calcDates = (children: TreeNode[]): { startDate?: string, endDate?: string } => {
      let minDate: string | undefined;
      let maxDate: string | undefined;
      
      children.forEach(c => {
        if (c.startDate && (!minDate || c.startDate < minDate)) minDate = c.startDate;
        if (c.endDate && (!maxDate || c.endDate > maxDate)) maxDate = c.endDate;
      });
      return { startDate: minDate, endDate: maxDate };
    };

    const buildNode = (kpiId: string, depth: number): TreeNode => {
      const kpi = kpiData[kpiId];
      // このKPIの直下の子KPI
      const childKpis = nodes.filter(n => n.parentId === kpiId).map(n => buildNode(n.id, depth + 1));
      // このKPIに直接紐づくタスク
      const childTasks = filteredActions.filter(a => a.kpiId === kpiId).map(a => ({
        id: `task-${a.id}`,
        type: 'TASK' as const,
        title: a.title,
        taskData: a,
        children: [],
        startDate: a.startDate || a.dueDate,
        endDate: a.dueDate,
        depth: depth + 1
      }));

      const children = [...childKpis, ...childTasks];
      const dates = calcDates(children);

      return {
        id: kpiId,
        type: kpi.type as 'KGI' | 'KPI',
        title: kpi.name,
        nodeData: kpi,
        children,
        startDate: dates.startDate,
        endDate: dates.endDate,
        depth
      };
    };

    // ルート（KGI）から構築
    const rootNodes = nodes.filter(n => !n.parentId).map(n => buildNode(n.id, 0));
    return rootNodes;
  }, [kpiData, filteredActions]);

  // タイムライン描画用にツリーをフラット化（開閉状態を反映）
  const flatVisibleNodes = useMemo(() => {
    const result: TreeNode[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        // 空のKPI（子もタスクもない）はフィルターなどにより非表示にしてもよいが、今回は表示
        result.push(node);
        if (expandedNodes.has(node.id) && node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    flatten(treeData);
    return result;
  }, [treeData, expandedNodes]);

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  // --- カンバンボード用のDrag & Dropロジック ---
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Action | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
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

  const handleUpdateTask = (updates: Partial<Action>) => {
    if (!editingTask) return;
    useKpiStore.getState().updateAction(editingTask.id, updates);
    setEditingTask({ ...editingTask, ...updates });
  };

  // --- タスクカードレンダラー（カンバン用） ---
  const renderTask = (action: Action, showKpiName: boolean = false) => {
    const kpiName = showKpiName ? (kpiData[action.kpiId]?.name || '不明なKPI') : '';
    return <TaskCard key={action.id} action={action} kpiName={kpiName} onDragStart={handleDragStart} draggedTaskId={draggedTaskId} onClick={() => setEditingTask(action)} />;
  };

  // --- Kanban View ---
  const renderKanban = () => {
    if (groupByKpi) {
      // スイムレーン表示 (KPIごとにグループ化)
      // タスクが存在するKPIのみを抽出
      const kpisWithTasks = Object.values(kpiData).filter(kpi => 
        filteredActions.some(a => a.kpiId === kpi.id)
      ).sort((a, b) => a.type === 'KGI' ? -1 : 1);

      return (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-8">
          {kpisWithTasks.map(kpi => {
            const kpiTasks = filteredActions.filter(a => a.kpiId === kpi.id);
            const todo = kpiTasks.filter(a => a.status === 'todo');
            const inProg = kpiTasks.filter(a => a.status === 'in_progress');
            const done = kpiTasks.filter(a => a.status === 'done');

            return (
              <div key={kpi.id} className="flex flex-col bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi.type === 'KGI' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>{kpi.type}</span>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{kpi.name}</h3>
                  <span className="text-xs text-slate-500 ml-auto">{kpiTasks.length} tasks</span>
                </div>
                
                <div className="flex flex-col md:flex-row w-full" style={{ minHeight: '200px' }}>
                  {/* To Do */}
                  <div className="flex-1 p-3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/30 dark:bg-slate-900/10" style={{ minWidth: '200px' }} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'todo')}>
                    <div className="text-[11px] font-bold text-slate-500 mb-1 px-1">To Do ({todo.length})</div>
                    {todo.map(a => renderTask(a))}
                  </div>
                  {/* In Progress */}
                  <div className="flex-1 p-3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col gap-3 bg-blue-50/10 dark:bg-blue-900/5" style={{ minWidth: '200px' }} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'in_progress')}>
                    <div className="text-[11px] font-bold text-blue-600 mb-1 px-1">In Progress ({inProg.length})</div>
                    {inProg.map(a => renderTask(a))}
                  </div>
                  {/* Done */}
                  <div className="flex-1 p-3 flex flex-col gap-3 bg-emerald-50/10 dark:bg-emerald-900/5" style={{ minWidth: '200px' }} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'done')}>
                    <div className="text-[11px] font-bold text-emerald-600 mb-1 px-1">Done ({done.length})</div>
                    {done.map(a => renderTask(a))}
                  </div>
                </div>
              </div>
            );
          })}
          {kpisWithTasks.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-500">タスクがありません</div>
          )}
        </div>
      );
    } else {
      // 従来のフラットなカンバン
      const todo = filteredActions.filter(a => a.status === 'todo');
      const inProg = filteredActions.filter(a => a.status === 'in_progress');
      const done = filteredActions.filter(a => a.status === 'done');
      
      const Column = ({ title, status, list, colorClass }: { title: string, status: any, list: Action[], colorClass: string }) => (
        <div 
          className="flex-1 min-w-[280px] flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden"
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDrop(e, status)}
        >
          <div className={`p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center ${colorClass}`}>
            <h3 className="font-bold text-[13px]">{title}</h3>
            <span className="bg-white/50 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-bold">{list.length}</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {list.map(a => renderTask(a, true))}
          </div>
        </div>
      );

      return (
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-x-auto custom-scrollbar pb-2">
          <Column title="To Do (未着手)" status="todo" list={todo} colorClass="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" />
          <Column title="In Progress (進行中)" status="in_progress" list={inProg} colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" />
          <Column title="Done (完了)" status="done" list={done} colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" />
        </div>
      );
    }
  };

  // --- Timeline View ---
  const renderTimeline = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({length: daysInMonth}, (_, i) => {
      const d = new Date(year, month, i + 1);
      return {
        date: d.getDate(),
        dayOfWeek: d.getDay(),
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
      };
    });

    return (
      <div className="flex-1 bg-white dark:bg-[#202124] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">
        <div className="flex overflow-x-auto flex-1 custom-scrollbar">
          
          {/* 左側の階層ツリーリスト */}
          <div className="w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#282a2d] sticky left-0 z-20 flex flex-col">
            <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-slate-500 shadow-sm z-10">
              目標・タスク階層
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
              {flatVisibleNodes.map(node => (
                <div 
                  key={node.id} 
                  className={`h-10 border-b border-slate-100 dark:border-slate-800/50 flex items-center pr-2 transition-colors ${node.type === 'TASK' ? 'bg-white dark:bg-[#202124] hover:bg-slate-50 dark:hover:bg-[#2a2d31]' : 'bg-slate-50 dark:bg-[#2d2f31] hover:bg-slate-100 dark:hover:bg-[#3c4043]'}`}
                >
                  <div className="flex items-center w-full" style={{ paddingLeft: `${node.depth * 16 + 8}px` }}>
                    {/* 開閉トグルアイコン */}
                    <div 
                      className={`w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer text-slate-400 hover:text-slate-600 ${node.children.length === 0 ? 'invisible' : ''}`}
                      onClick={() => toggleNode(node.id)}
                    >
                      {expandedNodes.has(node.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    
                    {/* アイコン */}
                    <div className="w-5 flex justify-center shrink-0 mr-1.5">
                      {node.type === 'KGI' && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      {node.type === 'KPI' && <span className="w-2 h-2 rounded-full bg-primary-500"></span>}
                      {node.type === 'TASK' && (
                        <span className={`w-2 h-2 rounded-sm ${node.taskData?.status === 'done' ? 'bg-emerald-500' : node.taskData?.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                      )}
                    </div>

                    {/* テキスト */}
                    <span className={`text-[12px] truncate ${node.type !== 'TASK' ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      {node.title}
                    </span>
                    
                    {/* 担当者（タスクのみ） */}
                    {node.type === 'TASK' && node.taskData?.owner && (
                      <span className="ml-auto text-[10px] text-slate-400 shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{node.taskData.owner}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側のガントチャート */}
          <div className="flex flex-col flex-1 min-w-max bg-white dark:bg-[#202124]">
            <div className="h-10 flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
              {days.map(d => (
                <div key={d.date} className={`w-8 shrink-0 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-800/50 ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-slate-100/80 dark:bg-slate-800/50' : ''}`}>
                  <span className="text-[8px] text-slate-400 leading-none mb-0.5">{['日','月','火','水','木','金','土'][d.dayOfWeek]}</span>
                  <span className={`text-[10px] font-bold leading-none ${d.dateStr === new Date().toISOString().split('T')[0] ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30 w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>{d.date}</span>
                </div>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar relative pb-10">
              {/* 背景のグリッド線 */}
              <div className="absolute inset-0 flex pointer-events-none">
                {days.map(d => (
                  <div key={d.date} className={`w-8 shrink-0 border-r border-slate-100 dark:border-slate-800/30 ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-slate-50/50 dark:bg-slate-800/10' : ''}`}></div>
                ))}
              </div>

              {/* チャート本体 */}
              <div className="relative">
                {flatVisibleNodes.map(node => {
                  const startStr = node.startDate;
                  const endStr = node.endDate;
                  
                  let startIdx = -1;
                  let endIdx = -1;

                  if (startStr && endStr) {
                    const startMonth = new Date(startStr).getMonth();
                    const endMonth = new Date(endStr).getMonth();
                    
                    startIdx = days.findIndex(d => d.dateStr === startStr);
                    endIdx = days.findIndex(d => d.dateStr === endStr);
                    
                    if (startIdx === -1 && startMonth < month) startIdx = 0;
                    if (endIdx === -1 && endMonth > month) endIdx = days.length - 1;
                    if (startIdx === -1) startIdx = endIdx;
                    if (endIdx === -1) endIdx = startIdx;
                  }

                  const left = startIdx !== -1 ? startIdx * 32 : 0; // w-8 = 32px
                  const width = (endIdx !== -1 && startIdx !== -1) ? ((endIdx - startIdx) + 1) * 32 : 0;
                  
                  // バーのスタイル
                  let barClass = "";
                  if (node.type === 'KGI') barClass = "bg-amber-400/80 dark:bg-amber-600/50 h-2 top-[14px]"; // サマリー細線
                  else if (node.type === 'KPI') barClass = "bg-primary-400/80 dark:bg-primary-600/50 h-2 top-[14px]"; // サマリー細線
                  else {
                    const status = node.taskData?.status;
                    barClass = `h-5 top-[6px] ${status === 'done' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`;
                  }

                  return (
                    <div key={node.id} className={`h-10 border-b border-transparent relative group ${node.type === 'TASK' ? 'hover:bg-slate-50/50 dark:hover:bg-white/5' : ''}`}>
                      {(startIdx !== -1 && endIdx !== -1 && width > 0) && (
                        <div 
                          className={`absolute rounded-sm shadow-sm transition-all z-10 cursor-pointer ${barClass}`}
                          style={{ left: `${left + 4}px`, width: `${Math.max(width - 8, 8)}px` }}
                          title={`${node.title} (${startStr} ~ ${endStr})`}
                        >
                          {/* ツリー側のテキストがあるため、バーの中のテキストはタスクの進行中など長い場合のみ表示 */}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Calendar View ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = filteredActions.filter(a => a.dueDate === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div key={d} className={`min-h-[120px] p-2 border border-slate-200 dark:border-slate-800 ${isToday ? 'bg-primary-50/30 dark:bg-primary-900/10' : 'bg-white dark:bg-[#282a2d]'}`}>
          <div className={`text-xs font-bold mb-1 ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}>{d}</div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
            {dayTasks.map(task => {
              const kpi = kpiData[task.kpiId];
              return (
                <div 
                  key={task.id} 
                  className={`text-[10px] p-1 px-1.5 rounded truncate flex items-center gap-1 border-l-2 ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300'}`}
                  title={`${task.title} (${kpi?.name})`}
                >
                  <span className="font-bold truncate">{task.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-white dark:bg-[#202124] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto custom-scrollbar bg-slate-100 dark:bg-[#202124] gap-[1px]">
          {days}
        </div>
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto w-full">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              プロジェクト・タスク管理
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-normal text-slate-500">{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">KGI/KPIのツリー階層と連動したタスクのステータスやスケジュールを管理します。</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          
          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-[#202124] text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Clock size={14} /> タイムライン
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-[#202124] text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={14} /> カンバン
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-[#202124] text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <CalendarIcon size={14} /> カレンダー
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

          {/* Grouping Toggle (Kanban Only) */}
          {viewMode === 'kanban' && (
            <button 
              onClick={() => setGroupByKpi(!groupByKpi)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-colors border ${groupByKpi ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
            >
              <Layers size={14} /> KPIでグループ化
            </button>
          )}

          {/* Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <User size={14} className="text-slate-400" />
            <select 
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="flex-1 md:w-32 bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="all">全担当者</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
              <option value="未定">未定</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' && renderKanban()}
      {viewMode === 'timeline' && renderTimeline()}
      {viewMode === 'calendar' && renderCalendar()}

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-lg">タスクの編集</h2>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">タイトル <span className="text-rose-500">*</span></label>
                <input type="text" value={editingTask.title} onChange={(e) => handleUpdateTask({ title: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">詳細説明</label>
                <textarea value={editingTask.description || ''} onChange={(e) => handleUpdateTask({ description: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24" placeholder="タスクの具体的な内容や前提条件など..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">担当者 <span className="text-rose-500">*</span></label>
                  <input type="text" value={editingTask.owner} onChange={(e) => handleUpdateTask({ owner: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">部署</label>
                  <input type="text" value={editingTask.department || ''} onChange={(e) => handleUpdateTask({ department: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="例: 営業部" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">優先度 (重要度×緊急度)</label>
                  <select value={editingTask.priority || 'unassigned'} onChange={(e) => handleUpdateTask({ priority: e.target.value as any })} className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="unassigned">未設定</option>
                    <option value="urgent_important">第1領域(必須・緊急)</option>
                    <option value="not_urgent_important">第2領域(重要・仕込)</option>
                    <option value="urgent_not_important">第3領域(錯覚・振分)</option>
                    <option value="not_urgent_not_important">第4領域(無駄・削除)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">期限</label>
                  <input type="date" value={editingTask.dueDate?.split('T')[0] || ''} onChange={(e) => handleUpdateTask({ dueDate: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-900/50">
              <button onClick={() => {
                if(window.confirm('このタスクを削除しますか？')) {
                  useKpiStore.getState().removeAction(editingTask.id);
                  setEditingTask(null);
                }
              }} className="text-sm font-bold text-rose-500 hover:text-rose-600 px-4 py-2">削除</button>
              <button onClick={() => setEditingTask(null)} className="text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors shadow-sm">完了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
