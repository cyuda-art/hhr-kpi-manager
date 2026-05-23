import React, { useState, useEffect, useRef } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Sparkles, Send, Bot, User, CheckCircle2, Circle, CheckSquare, X, Trash2, Zap, Settings, BarChart3, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import { getDisplayValue, formatDisplayValue, getStorageValue } from '@/lib/kpi-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AgentExecutionModal } from './AgentExecutionModal';
import { TrendChart } from '../dashboard/TrendChart';

const TypewriterText = ({ text, animate }: { text: string, animate: boolean }) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  
  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      return;
    }
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText((prev) => text.substring(0, i));
      if (i > text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text, animate]);

  return <>{displayedText}</>;
};

export const KpiExecutionPanel = () => {
  const { kpiData, selectedNodeId, currentPeriod, addChatMessage, addAction, setIsAiGenerating, removeKpiNode } = useKpiStore();
  const currentProjectInfo = useKpiStore((state) => state.currentProjectInfo);
  const { isActionPanelCollapsed, toggleActionPanel } = useLayoutStore();
  const { user } = useAuthStore();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebrations, setCelebrations] = useState<{id: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 追加: WHWのための状態
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 設定用ステート
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editName, setEditName] = useState('');
  const [editQualitativeName, setEditQualitativeName] = useState('');
  const [editUpdateFrequency, setEditUpdateFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [editIsCalculated, setEditIsCalculated] = useState(false);
  const [editFormula, setEditFormula] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;
  const isComputed = selectedKpi?.isCalculated || false;

  const childKpis = selectedKpi ? Object.values(kpiData).filter(node => node.parentId === selectedKpi.id) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedKpi?.chatMessages]);

  useEffect(() => {
    if (selectedKpi) {
      const displayTarget = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue');
      setEditTargetValue(displayTarget.toString());
      setEditName(selectedKpi.name);
      setEditQualitativeName(selectedKpi.qualitativeName || '');
      setEditUpdateFrequency(selectedKpi.updateFrequency || 'monthly');
      setEditIsCalculated(selectedKpi.isCalculated || false);
      setEditFormula(selectedKpi.formula || '');
    }
  }, [selectedNodeId, kpiData, currentPeriod]);

  const handleSaveSettings = () => {
    if (!selectedKpi) return;
    const storedTarget = getStorageValue(Number(editTargetValue) || 0, selectedKpi, currentPeriod, 'targetValue');
    useKpiStore.getState().updateKpiNode(selectedKpi.id, {
      targetValue: storedTarget,
      name: editName,
      qualitativeName: editQualitativeName,
      updateFrequency: editUpdateFrequency,
      isCalculated: editIsCalculated,
      formula: editFormula
    });
    setIsSettingsOpen(false);
  };

  if (!selectedKpi) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#202124] items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-[#2d2f31] rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-200 dark:border-slate-800">
          <Sparkles className="text-strategic-teal dark:text-primary-400" size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Action-Oriented Cockpit</h3>
        <p className="text-xs text-logic-slate dark:text-slate-400">
          ツリーからKPIを選択すると、目標とタスクを一元管理できます。
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    setIsAiGenerating(true);

    addChatMessage(selectedKpi.id, { role: 'user', content: userMessage });

    try {
      const response = await fetch('/api/kpi-execution-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          kpiContext: {
            id: selectedKpi.id,
            name: selectedKpi.name,
            targetValue: selectedKpi.targetValue,
            actualValue: selectedKpi.actualValue,
            unit: selectedKpi.unit,
            description: selectedKpi.description,
            isCalculated: selectedKpi.isCalculated,
            formula: selectedKpi.formula
          },
          childKpis: childKpis.map(child => ({
            id: child.id,
            name: child.name,
            targetValue: child.targetValue,
            actualValue: child.actualValue,
            unit: child.unit,
            achievementRate: child.achievementRate,
            status: child.status
          })),
          actions: useKpiStore.getState().actions.filter(a => a.kpiId === selectedKpi.id),
          history: selectedKpi.chatMessages || [],
          projectInfo: currentProjectInfo
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      addChatMessage(selectedKpi.id, { role: 'model', content: data.text });

      if (data.systemActions && data.systemActions.length > 0) {
        data.systemActions.forEach((action: any) => {
          if (action.type === 'UPDATE_VALUE') {
            useKpiStore.getState().updateKpiNode(selectedKpi.id, { actualValue: action.newValue });
          } else if (action.type === 'ADD_TODO') {
            const targetKpiId = action.targetKpiId || selectedKpi.id;
            const existingTasks = useKpiStore.getState().actions;
            const isDuplicate = existingTasks.some(a => a.kpiId === targetKpiId && a.title === action.title && a.status === 'todo');
            
            if (!isDuplicate) {
              useKpiStore.getState().addAction({
                kpiId: targetKpiId, title: action.title, status: 'todo',
                dueDate: new Date().toISOString().split('T')[0], priority: action.priority || 'not_urgent_important', owner: user?.displayName || 'Guest'
              });
            }
          } else if (action.type === 'DELETE_TODO') {
            useKpiStore.getState().deleteAction(action.actionId);
          } else if (action.type === 'COMPLETE_TODO') {
            useKpiStore.getState().updateAction(action.actionId, { status: 'done' });
            triggerCelebration();
          }
        });
      }

      setIsProcessing(false);
      setIsAiGenerating(false);
      
    } catch (error) {
      console.error(error);
      addChatMessage(selectedKpi.id, { role: 'model', content: 'エラーが発生しました。' });
      setIsProcessing(false);
      setIsAiGenerating(false);
    }
  };

  const triggerCelebration = () => {
    const id = Date.now();
    setCelebrations(prev => [...prev, { id }]);
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== id));
    }, 3000);
  };

  const actualVal = getDisplayValue(selectedKpi.actualValue, selectedKpi, currentPeriod, 'actualValue');
  const targetVal = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue');

  const renderConfetti = () => {
    if (!isMounted || typeof document === 'undefined' || celebrations.length === 0) return null;
    return createPortal(
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {celebrations.map(c => (
          <div key={c.id} className="absolute inset-0">
            {Array.from({ length: 60 }).map((_, i) => {
              const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-rose-400', 'bg-purple-400', 'bg-strategic-teal'];
              const color = colors[i % colors.length];
              const isCircle = i % 2 === 0;
              const destX = (Math.random() - 0.5) * 120;
              const destY = -(Math.random() * 80 + 20);
              const scaleMax = Math.random() * 1.5 + 0.5;
              return (
                <motion.div
                  key={i}
                  initial={{ x: '50vw', y: '100vh', scale: 0, opacity: 1 }}
                  animate={{ x: `calc(50vw + ${destX}vw)`, y: ['100vh', `calc(100vh + ${destY}vh)`, `calc(100vh + ${destY + 20}vh)`], scale: [0, scaleMax, 0], rotate: Math.random() * 720 - 360 }}
                  transition={{ duration: Math.random() * 1 + 1.5, ease: [0.23, 1, 0.32, 1] }}
                  className={`absolute w-3 h-3 ${color} ${isCircle ? 'rounded-full' : 'rounded-sm'} shadow-sm`}
                />
              );
            })}
          </div>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#202124] relative">
      {renderConfetti()}

      {/* 設定モーダル（Plan） */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-[#202124] flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#2d2f31]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Settings size={16} className="text-slate-500" /> KPI設定 (Plan)
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">定性名</label>
                <input type="text" value={editQualitativeName} onChange={e => setEditQualitativeName(e.target.value)} className="w-full text-xs px-2 py-2 border rounded dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-strategic-teal" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">定量名 (KPI名)</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-xs px-2 py-2 border rounded dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-strategic-teal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">目標値 ({selectedKpi.unit})</label>
                  <input type="number" value={editTargetValue} onChange={e => setEditTargetValue(e.target.value)} disabled={editIsCalculated} className="w-full text-xs px-2 py-2 border rounded dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-strategic-teal disabled:bg-slate-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">更新頻度</label>
                  <select value={editUpdateFrequency} onChange={e => setEditUpdateFrequency(e.target.value as any)} className="w-full text-xs px-2 py-2 border rounded dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-strategic-teal">
                    <option value="daily">日次 (Daily)</option>
                    <option value="weekly">週次 (Weekly)</option>
                    <option value="monthly">月次 (Monthly)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1 border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editIsCalculated} onChange={e => setEditIsCalculated(e.target.checked)} className="rounded border-slate-300 text-strategic-teal" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">子KPIから自動計算する</span>
                </label>
                {editIsCalculated && (
                  <textarea value={editFormula} onChange={e => setEditFormula(e.target.value)} placeholder="例: #{kpi_123} * #{kpi_456}" className="w-full mt-2 text-[11px] px-2 py-2 border rounded dark:bg-slate-900 dark:border-slate-700 font-mono outline-none focus:border-strategic-teal h-20" />
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#202124] flex justify-between">
              <button onClick={() => { removeKpiNode(selectedKpi.id); setIsSettingsOpen(false); toggleActionPanel(); }} className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1">
                <Trash2 size={14} /> 削除
              </button>
              <button onClick={handleSaveSettings} className="bg-strategic-teal text-white text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-teal-600">
                保存して閉じる
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ヘッダー部分（進捗サマリー） */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {selectedKpi.type}
              </div>
              {isComputed ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  🟣 Computed
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  🔵 Actionable
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {selectedKpi.name}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="設定 (Plan)">
              <Settings size={14} />
            </button>
            <button onClick={toggleActionPanel} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">実績 / 目標</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-oxford-navy dark:text-slate-200 tracking-tight font-poppins">
                {formatDisplayValue(actualVal, selectedKpi.unit)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-poppins">
                / {formatDisplayValue(targetVal, selectedKpi.unit)} {selectedKpi.unit}
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">達成率</span>
            <span className={`text-lg font-black font-poppins ${
              selectedKpi.status === 'good' ? 'text-emerald-600 dark:text-emerald-400' :
              selectedKpi.status === 'warning' ? 'text-amber-500 dark:text-amber-400' :
              'text-rose-500 dark:text-rose-400'
            }`}>
              {Math.round(selectedKpi.achievementRate || 0)}%
            </span>
          </div>
        </div>
      </div>

      {/* トレンドチャート (Why/Check) */}
      <div className="bg-white dark:bg-[#252628] border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button 
          onClick={() => setIsChartOpen(!isChartOpen)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <BarChart3 size={13} className="text-amber-500" /> パフォーマンス推移 (Why)
          </span>
          {isChartOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
        </button>
        <AnimatePresence>
          {isChartOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 h-36">
                <TrendChart 
                  actualValue={selectedKpi.actualValue} 
                  targetValue={selectedKpi.targetValue} 
                  unit={selectedKpi.unit} 
                  history={selectedKpi.history}
                  monthlyData={selectedKpi.monthlyData}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ToDoリストエリア (How/Do) */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 dark:bg-[#252628] dark:border-slate-800 shrink-0 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckSquare size={13} className="text-strategic-teal" /> 進行中のアクション (How)
          </span>
          {isComputed && (
            <span className="text-[9px] text-slate-500">※子要素のタスク含む</span>
          )}
        </div>
        
        {useKpiStore.getState().actions.filter(a => 
          (a.kpiId === selectedKpi.id || (isComputed && childKpis.some(c => c.id === a.kpiId)))
        ).length === 0 ? (
          <div className="text-[10px] text-slate-400 text-center py-2 bg-white dark:bg-[#2d2f31] rounded border border-slate-100 dark:border-slate-800">
            未完了のタスクはありません
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {useKpiStore.getState().actions
                .filter(a => (a.kpiId === selectedKpi.id || (isComputed && childKpis.some(c => c.id === a.kpiId))))
                .sort((a, b) => a.status === 'done' ? 1 : b.status === 'done' ? -1 : 0)
                .map(action => (
                  <motion.div 
                    key={action.id} 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: (action.createdAt && (Date.now() - action.createdAt) < 1000) ? [0, -4, 4, -4, 4, 0] : 0 }}
                    transition={{ duration: 0.3, x: { duration: 0.4, ease: "easeInOut" } }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={`group flex items-start gap-2 p-2 rounded border ${action.status === 'done' ? 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 opacity-60' : 'bg-white border-slate-200 dark:bg-[#2d2f31] dark:border-slate-700'} transition-colors`}
                  >
                    <button 
                      onClick={() => {
                        const isCompleting = action.status !== 'done';
                        useKpiStore.getState().toggleActionStatus(action.id);
                        if (isCompleting) triggerCelebration();
                      }}
                      className={`mt-0.5 shrink-0 ${action.status === 'done' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-emerald-400'}`}
                    >
                      {action.status === 'done' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`text-[11px] font-bold ${action.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {action.title}
                      </span>
                    </div>
                    {action.status !== 'done' && (
                      <button onClick={(e) => { e.stopPropagation(); setExecutingActionId(action.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-all ml-auto shrink-0" title="AIで自律実行">
                        <Zap size={13} className="animate-pulse" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); useKpiStore.getState().deleteAction(action.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-opacity shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* チャットエリア (Execution Engine) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-white dark:bg-transparent">
        {(!selectedKpi.chatMessages || selectedKpi.chatMessages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Zap size={24} className="text-slate-700 dark:text-slate-300 mb-3" />
            <h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 mb-2 tracking-wide uppercase">AI Execution Engine</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              目標「{formatDisplayValue(targetVal, selectedKpi.unit)}」を達成するための実務オペレーターが待機しています。<br/>
              自然言語で指示を出すことで、実績の更新やタスクの生成・整理を自律的に実行します。
            </p>
          </div>
        )}

        {selectedKpi.chatMessages?.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded-sm bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                <Zap size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 text-[12px] ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-l-md rounded-br-md' 
                : 'bg-white dark:bg-[#2d2f31] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-r-md rounded-bl-md shadow-sm'
            } whitespace-pre-wrap leading-relaxed`}>
              {msg.role === 'model' ? (
                <TypewriterText text={msg.content} animate={msg.id === selectedKpi.chatMessages?.[selectedKpi.chatMessages.length - 1]?.id} />
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-sm bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User size={12} className="text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-sm bg-slate-800 flex items-center justify-center shrink-0 mt-1">
              <Zap size={12} className="text-white" />
            </div>
            <div className="bg-white dark:bg-[#2d2f31] border border-slate-200 dark:border-slate-700 rounded-r-md rounded-bl-md px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力フォームとサジェストチップ */}
      <div className="p-3 bg-white dark:bg-[#202124] border-t border-slate-200 dark:border-slate-800 shrink-0 flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          <button onClick={() => setInput('現状の数値を分析し、不足分を補うための次のアクションを3つ提案・追加してください。')} className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 rounded-full transition-colors border border-slate-200 dark:border-slate-700">
            アクションの自動生成
          </button>
          {!isComputed && (
            <button onClick={() => setInput('今日の実績として、〇〇件完了しました。数値を更新してください。')} className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 rounded-full transition-colors border border-slate-200 dark:border-slate-700">
              実績の更新報告
            </button>
          )}
          <button onClick={() => setInput('重複しているタスクや、不要になった古いタスクを整理・削除してください。')} className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 rounded-full transition-colors border border-slate-200 dark:border-slate-700">
            タスクの整理
          </button>
        </div>
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="指示を入力 (例: タスクを追加して, 〇件完了した)"
            disabled={isProcessing}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#2d2f31] border border-slate-200 dark:border-slate-700 rounded-md text-[12px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-md transition-colors"
          >
            <Send size={12} className={input.trim() && !isProcessing ? "translate-x-[1px]" : ""} />
          </button>
        </form>
      </div>

      <AnimatePresence>
        {executingActionId && (
          <AgentExecutionModal
            actionId={executingActionId}
            onClose={() => setExecutingActionId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
