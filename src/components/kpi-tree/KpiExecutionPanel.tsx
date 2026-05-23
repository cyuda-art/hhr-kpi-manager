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

  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      <div className="flex flex-col h-full bg-white/5 dark:bg-black/10 items-center justify-center p-6 text-center relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className="w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute w-48 h-48 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', transform: 'translate(40px, -40px)' }} />
        </div>
        <div className="w-16 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 mb-6 border border-white/50 dark:border-slate-700/50 z-10 relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Zap className="text-blue-500 dark:text-blue-400 relative z-10" size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 z-10 font-poppins">
          Action-Oriented Cockpit
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 z-10">
          ツリーからKPIを選択して、目標達成に向けたサイクルを回しましょう。
        </p>
      </div>
    );
  }

  const executeChatCommand = async (userMessage: string) => {
    if (isProcessing) return;
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
            id: selectedKpi.id, name: selectedKpi.name, targetValue: selectedKpi.targetValue, actualValue: selectedKpi.actualValue,
            unit: selectedKpi.unit, description: selectedKpi.description, isCalculated: selectedKpi.isCalculated, formula: selectedKpi.formula
          },
          childKpis: childKpis.map(child => ({
            id: child.id, name: child.name, targetValue: child.targetValue, actualValue: child.actualValue, unit: child.unit, achievementRate: child.achievementRate, status: child.status
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
            if (!existingTasks.some(a => a.kpiId === targetKpiId && a.title === action.title && a.status === 'todo')) {
              useKpiStore.getState().addAction({
                kpiId: targetKpiId, title: action.title, status: 'todo', dueDate: new Date().toISOString().split('T')[0], priority: action.priority || 'not_urgent_important', owner: user?.displayName || 'Guest'
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
      setIsProcessing(false); setIsAiGenerating(false);
    } catch (error) {
      addChatMessage(selectedKpi.id, { role: 'model', content: 'エラーが発生しました。' });
      setIsProcessing(false); setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userMessage = input.trim();
    setInput('');
    await executeChatCommand(userMessage);
  };

  const triggerCelebration = () => {
    const id = Date.now();
    setCelebrations(prev => [...prev, { id }]);
    setTimeout(() => setCelebrations(prev => prev.filter(c => c.id !== id)), 3000);
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
              const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-rose-400', 'bg-purple-400'];
              const color = colors[i % colors.length];
              const destX = (Math.random() - 0.5) * 120;
              const destY = -(Math.random() * 80 + 20);
              const scaleMax = Math.random() * 1.5 + 0.5;
              return (
                <motion.div key={i} initial={{ x: '50vw', y: '100vh', scale: 0, opacity: 1 }} animate={{ x: `calc(50vw + ${destX}vw)`, y: ['100vh', `calc(100vh + ${destY}vh)`, `calc(100vh + ${destY + 20}vh)`], scale: [0, scaleMax, 0], rotate: Math.random() * 720 - 360 }} transition={{ duration: Math.random() * 1 + 1.5, ease: [0.23, 1, 0.32, 1] }} className={`absolute w-3 h-3 ${color} ${i % 2 === 0 ? 'rounded-full' : 'rounded-sm'} shadow-sm`} />
              );
            })}
          </div>
        ))}
      </div>, document.body
    );
  };

  // グローバルグラデーションはpage.tsxで管理するため、ローカルの背景設定は不要になりました。
  // 透過して親のグラスモーフィズムを活かします。

  return (
    <div className="flex flex-col h-full relative bg-transparent transition-colors duration-1000">
      {renderConfetti()}

      {/* 設定モーダル（Plan） */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-2xl flex flex-col h-full"
          >
            <div className="p-4 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Settings size={16} className="text-slate-600 dark:text-slate-400" /> KPI設定
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">定性名</label>
                <input type="text" value={editQualitativeName} onChange={e => setEditQualitativeName(e.target.value)} className="w-full text-sm px-3 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">定量名 (KPI名)</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-sm px-3 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">目標値 ({selectedKpi.unit})</label>
                  <input type="number" value={editTargetValue} onChange={e => setEditTargetValue(e.target.value)} disabled={editIsCalculated} className="w-full text-sm px-3 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">更新頻度</label>
                  <select value={editUpdateFrequency} onChange={e => setEditUpdateFrequency(e.target.value as any)} className="w-full text-sm px-3 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                    <option value="daily">日次 (Daily)</option>
                    <option value="weekly">週次 (Weekly)</option>
                    <option value="monthly">月次 (Monthly)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 pt-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={editIsCalculated} onChange={e => setEditIsCalculated(e.target.checked)} className="rounded border-slate-300 text-blue-500 focus:ring-blue-500" />
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">子KPIから自動計算する</span>
                </label>
                {editIsCalculated && (
                  <textarea value={editFormula} onChange={e => setEditFormula(e.target.value)} placeholder="例: #{kpi_123} * #{kpi_456}" className="w-full mt-2 text-xs px-3 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-24" />
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between">
              <button onClick={() => { removeKpiNode(selectedKpi.id); setIsSettingsOpen(false); toggleActionPanel(); }} className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20">
                <Trash2 size={14} /> KPIを削除
              </button>
              <button onClick={handleSaveSettings} className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold px-6 py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105">
                変更を保存
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ヘッダー部分 */}
      <div className="p-5 border-b border-white/20 dark:border-white/5 flex flex-col gap-4 shrink-0 bg-white/20 dark:bg-black/10 relative z-20">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-poppins">
                {selectedKpi.type}
              </div>
              {isComputed ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/50 text-slate-600 dark:bg-black/40 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                  自動計算
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                  実行可能
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {selectedKpi.name}
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 rounded-full p-1 border border-white/30 dark:border-white/10 shadow-sm">
            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
              <Settings size={14} />
            </button>
            <button onClick={toggleActionPanel} className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">実績 / 目標</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-poppins drop-shadow-sm">
                {formatDisplayValue(actualVal, selectedKpi.unit)}
              </span>
              <span className="text-xs font-medium text-slate-400 font-poppins">
                / {formatDisplayValue(targetVal, selectedKpi.unit)} {selectedKpi.unit}
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">達成率</span>
            <span className={`text-xl font-black font-poppins drop-shadow-sm ${
              selectedKpi.status === 'good' ? 'text-emerald-500 dark:text-emerald-400' :
              selectedKpi.status === 'warning' ? 'text-amber-500 dark:text-amber-400' :
              'text-rose-500 dark:text-rose-400'
            }`}>
              {Math.round(selectedKpi.achievementRate || 0)}%
            </span>
          </div>
        </div>
      </div>

      {/* トレンドチャート (Why/Check) */}
      <div className="bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/5 shrink-0 relative z-20">
        <button 
          onClick={() => setIsChartOpen(!isChartOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/30 dark:hover:bg-black/20 transition-colors"
        >
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <BarChart3 size={14} className="text-slate-400" /> パフォーマンス推移
          </span>
          {isChartOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
        </button>
        <AnimatePresence>
          {isChartOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-4 h-40">
                <TrendChart actualValue={selectedKpi.actualValue} targetValue={selectedKpi.targetValue} unit={selectedKpi.unit} history={selectedKpi.history} monthlyData={selectedKpi.monthlyData} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ToDoリストエリア (How/Do) */}
      <div className="px-5 py-4 bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/5 shrink-0 max-h-48 overflow-y-auto custom-scrollbar relative z-20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckSquare size={14} className="text-slate-400" /> 進行中のタスク
          </span>
        </div>
        
        {useKpiStore.getState().actions.filter(a => (a.kpiId === selectedKpi.id || (isComputed && childKpis.some(c => c.id === a.kpiId)))).length === 0 ? (
          <div className="text-[11px] text-slate-400 text-center py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-800/50 border-dashed">
            進行中のタスクはありません。
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {useKpiStore.getState().actions
                .filter(a => (a.kpiId === selectedKpi.id || (isComputed && childKpis.some(c => c.id === a.kpiId))))
                .sort((a, b) => a.status === 'done' ? 1 : b.status === 'done' ? -1 : 0)
                .map(action => (
                  <motion.div key={action.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex items-start gap-3 p-2.5 rounded-lg border transition-all ${action.status === 'done' ? 'bg-white/10 border-white/20 dark:bg-black/10 dark:border-white/5 opacity-50' : 'bg-white/40 border-white/30 dark:bg-black/30 dark:border-white/10 shadow-sm hover:shadow-md'}`}
                  >
                    <button onClick={() => { const isCompleting = action.status !== 'done'; useKpiStore.getState().toggleActionStatus(action.id); if (isCompleting) triggerCelebration(); }} className={`mt-0.5 shrink-0 transition-colors ${action.status === 'done' ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                      {action.status === 'done' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <div className="flex flex-col min-w-0 flex-1 mt-0.5">
                      <span className={`text-xs font-medium leading-tight ${action.status === 'done' ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {action.title}
                      </span>
                    </div>
                    {action.status !== 'done' && (
                      <button onClick={(e) => { e.stopPropagation(); setExecutingActionId(action.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all ml-auto shrink-0">
                        <Zap size={14} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); useKpiStore.getState().deleteAction(action.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* チャットエリア (Execution Engine) - 背景で呼吸するメッシュグラデーション */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar relative pb-40">
        {/* 2. 呼吸するメッシュグラデーション */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40 mix-blend-multiply dark:mix-blend-screen">
          <div className="absolute top-10 -left-10 w-48 h-48 bg-blue-300 dark:bg-blue-600 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute top-1/3 -right-10 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute bottom-10 left-1/4 w-56 h-56 bg-emerald-200 dark:bg-teal-700 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '9s' }} />
        </div>

        <div className="relative z-10 flex flex-col gap-5 h-full">
          {(!selectedKpi.chatMessages || selectedKpi.chatMessages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h4 className="text-[13px] font-black text-slate-800 dark:text-slate-200 mb-2 tracking-widest uppercase font-poppins">
                AI 実行エンジン
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400/80 leading-relaxed max-w-[240px]">
                システムは待機中です。<br/>実績の更新やタスクの生成を指示してください。
              </p>
            </div>
          )}

          {selectedKpi.chatMessages?.map((msg) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <Zap size={14} className="text-white dark:text-slate-900" />
                </div>
              )}
              {/* 4. ソリッドグラデーションの境界線（AIのみ） */}
              <div className={`max-w-[85%] relative ${msg.role === 'user' ? '' : 'p-px bg-white/20 dark:bg-white/10 rounded-r-2xl rounded-bl-2xl shadow-sm'}`}>
                <div className={`px-4 py-3 text-[13px] ${
                  msg.role === 'user' 
                    ? 'bg-slate-800/80 dark:bg-slate-200/80 text-white dark:text-slate-900 rounded-l-2xl rounded-br-2xl shadow-sm' 
                    : 'bg-white/60 dark:bg-black/40 text-slate-800 dark:text-slate-200 rounded-r-2xl rounded-bl-2xl'
                } whitespace-pre-wrap leading-relaxed`}>
                  {msg.role === 'model' ? (
                    <TypewriterText text={msg.content} animate={msg.id === selectedKpi.chatMessages?.[selectedKpi.chatMessages.length - 1]?.id} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User size={14} className="text-slate-500 dark:text-slate-400" />
                </div>
              )}
            </motion.div>
          ))}
          
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                <Zap size={14} className="text-white dark:text-slate-900" />
              </div>
              <div className="p-px bg-white/20 dark:bg-white/10 rounded-r-2xl rounded-bl-2xl shadow-sm">
                <div className="bg-white/60 dark:bg-black/40 px-5 py-4 rounded-r-2xl rounded-bl-2xl flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 5. フローティング・ピル型 入力フォームとサジェストチップ */}
      <div className="absolute bottom-0 left-0 w-full px-5 pb-6 pt-6 bg-white/20 dark:bg-black/30 backdrop-blur-xl border-t border-white/20 dark:border-white/5 flex flex-col gap-3 z-30 pointer-events-none">
        
        {/* 3. グラスモーフィズムのサジェストチップ */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 pointer-events-auto">
          <button onClick={() => executeChatCommand('現状の数値を分析し、不足分を補うための次のアクションを3つ提案・追加してください。')} disabled={isProcessing} className="shrink-0 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-slate-800/90 disabled:opacity-50 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-full transition-all border border-white/50 dark:border-slate-700/50 shadow-sm">
            アクション生成
          </button>
          {!isComputed && (
            <button onClick={() => executeChatCommand('今日の実績として、〇〇件完了しました。数値を更新してください。')} disabled={isProcessing} className="shrink-0 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-slate-800/90 disabled:opacity-50 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-full transition-all border border-white/50 dark:border-slate-700/50 shadow-sm">
              実績の更新
            </button>
          )}
          <button onClick={() => executeChatCommand('重複しているタスクや、不要になった古いタスクを整理・削除してください。')} disabled={isProcessing} className="shrink-0 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-slate-800/90 disabled:opacity-50 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-full transition-all border border-white/50 dark:border-slate-700/50 shadow-sm">
            タスク整理
          </button>
        </div>

        {/* フローティング・カプセル */}
        <div className="relative pointer-events-auto w-full group mt-1">
          {/* グロー効果（後光） */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-300" />
          
          <form onSubmit={handleSubmit} className="relative flex items-center bg-white/80 dark:bg-[#1a1c2e]/80 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 rounded-full shadow-lg">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="指示を入力 (例: タスクを追加して)"
              disabled={isProcessing}
              className="w-full pl-6 pr-12 py-3.5 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="absolute right-2 w-9 h-9 flex items-center justify-center bg-slate-800 dark:bg-slate-200 hover:bg-slate-900 dark:hover:bg-white disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white dark:text-slate-900 disabled:text-white rounded-full transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              <Send size={14} className={input.trim() && !isProcessing ? "translate-x-[1px]" : ""} />
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {executingActionId && (
          <AgentExecutionModal actionId={executingActionId} onClose={() => setExecutingActionId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
