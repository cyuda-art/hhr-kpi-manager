import React, { useState, useEffect, useRef } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Sparkles, Send, Bot, User, CheckCircle2, Circle, CheckSquare, X, Trash2 } from 'lucide-react';
import { getDisplayValue, formatDisplayValue } from '@/lib/kpi-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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
  const { kpiData, selectedNodeId, currentPeriod, addChatMessage, addAction, setIsAiGenerating } = useKpiStore();
  const currentProjectInfo = useKpiStore((state) => state.currentProjectInfo);
  const { isActionPanelCollapsed, toggleActionPanel } = useLayoutStore();
  const { user } = useAuthStore();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebrations, setCelebrations] = useState<{id: number}[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;
  const isComputed = selectedKpi?.isCalculated || false;

  // 子KPIの取得
  const childKpis = selectedKpi ? Object.values(kpiData).filter(node => node.parentId === selectedKpi.id && !node.isArchived) : [];

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedKpi?.chatMessages]);

  // KPIが選択されていない場合
  if (!selectedKpi) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#202124] items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-[#2d2f31] rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-200 dark:border-slate-800">
          <Sparkles className="text-strategic-teal dark:text-primary-400" size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">KPI実行ナビゲーター</h3>
        <p className="text-xs text-logic-slate dark:text-slate-400">
          ツリーからKPIを選択すると、目標達成に向けたAIとの壁打ちや、日々の実績記録をチャットで行うことができます。
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

    // 即座にUIに反映
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
          actions: useKpiStore.getState().actions.filter(a => a.kpiId === selectedKpi.id && !a.isArchived),
          history: selectedKpi.chatMessages || [],
          projectInfo: currentProjectInfo
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      // AIからの返答をチャットに追加
      addChatMessage(selectedKpi.id, { 
        role: 'model', 
        content: data.text 
      });

      // システムアクションの実行（Function CallingのJSON解釈）
      if (data.systemActions && data.systemActions.length > 0) {
        data.systemActions.forEach((action: any) => {
          if (action.type === 'UPDATE_VALUE') {
            useKpiStore.getState().updateKpiNode(selectedKpi.id, { actualValue: action.newValue });
            useKpiStore.getState().addAuditLog({
              kpiId: selectedKpi.id,
              userId: user?.uid || 'guest',
              userName: user?.displayName || 'Guest',
              action: 'UPDATE_VALUE',
              previousValue: selectedKpi.actualValue,
              newValue: action.newValue,
              evidenceText: `AIによる自動更新: ${action.reason || 'チャット経由の報告'}`,
              source: 'user_chat'
            });
          } else if (action.type === 'ADD_TODO') {
            const targetKpiId = action.targetKpiId || selectedKpi.id;
            
            // 冪等性の担保（既に同じタイトルの未完了タスクがある場合は追加しない）
            const existingTasks = useKpiStore.getState().actions;
            const isDuplicate = existingTasks.some(a => a.kpiId === targetKpiId && a.title === action.title && a.status === 'todo' && !a.isArchived);
            
            if (!isDuplicate) {
              useKpiStore.getState().addAction({
                kpiId: targetKpiId,
                title: action.title,
                status: 'todo',
                dueDate: new Date().toISOString().split('T')[0],
                priority: action.priority || 'not_urgent_important',
                owner: user?.displayName || 'Guest'
              });
              useKpiStore.getState().addAuditLog({
                kpiId: targetKpiId,
                userId: user?.uid || 'guest',
                userName: user?.displayName || 'Guest',
                action: 'ADD_TODO',
                evidenceText: `AIによるタスク追加: ${action.title}`,
                source: 'user_chat'
              });
            } else {
              console.log('Skipped duplicate ADD_TODO for:', action.title);
            }
          } else if (action.type === 'DELETE_TODO') {
            useKpiStore.getState().deleteAction(action.actionId);
            useKpiStore.getState().addAuditLog({
              kpiId: selectedKpi.id,
              userId: user?.uid || 'guest',
              userName: user?.displayName || 'Guest',
              action: 'DELETE_TODO',
              actionId: action.actionId,
              evidenceText: `AIによるタスク削除: ${action.reason || 'チャット経由の指示'}`,
              source: 'user_chat'
            });
          } else if (action.type === 'COMPLETE_TODO') {
            useKpiStore.getState().updateAction(action.actionId, { status: 'done' });
            useKpiStore.getState().addAuditLog({
              kpiId: selectedKpi.id,
              userId: user?.uid || 'guest',
              userName: user?.displayName || 'Guest',
              action: 'COMPLETE_TODO',
              actionId: action.actionId,
              evidenceText: `AIによるタスク完了: ${action.reason || 'チャット経由の報告'}`,
              source: 'user_chat'
            });
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
    
    // アニメーション終了後に要素を削除
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== id));
    }, 3000);
  };

  const actualVal = getDisplayValue(selectedKpi.actualValue, selectedKpi, currentPeriod, 'actualValue');
  const targetVal = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue');

  // フルスクリーンCSSコンフェッティ（紙吹雪）の描画
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
              
              // 画面中央下部から放射状に広がる物理演算モック
              const destX = (Math.random() - 0.5) * 120; // -60vw to 60vw
              const destY = -(Math.random() * 80 + 20); // -20vh to -100vh
              const scaleMax = Math.random() * 1.5 + 0.5;
              
              return (
                <motion.div
                  key={i}
                  initial={{ x: '50vw', y: '100vh', scale: 0, opacity: 1 }}
                  animate={{ 
                    x: `calc(50vw + ${destX}vw)`, 
                    y: ['100vh', `calc(100vh + ${destY}vh)`, `calc(100vh + ${destY + 20}vh)`], 
                    scale: [0, scaleMax, 0],
                    rotate: Math.random() * 720 - 360
                  }}
                  transition={{ 
                    duration: Math.random() * 1 + 1.5, 
                    ease: [0.23, 1, 0.32, 1] // easeOutQuint
                  }}
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
                  🟣 Computed Node (自動計算)
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  🔵 Action Node (手動更新)
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {selectedKpi.name}
            </h2>
          </div>
          <button onClick={toggleActionPanel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">実績 / 目標</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-oxford-navy dark:text-slate-200">
                {formatDisplayValue(actualVal, selectedKpi.unit)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                / {formatDisplayValue(targetVal, selectedKpi.unit)} {selectedKpi.unit}
              </span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">達成率</span>
            <span className={`text-sm font-bold ${
              selectedKpi.status === 'good' ? 'text-emerald-600 dark:text-emerald-400' :
              selectedKpi.status === 'warning' ? 'text-amber-500 dark:text-amber-400' :
              'text-rose-500 dark:text-rose-400'
            }`}>
              {Math.round(selectedKpi.achievementRate || 0)}%
            </span>
          </div>
        </div>
      </div>

      {/* ToDoリストエリア */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 dark:bg-[#252628] dark:border-slate-800 shrink-0 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <CheckSquare size={14} className="text-strategic-teal" /> 関連するToDo
          </span>
          {isComputed && (
            <span className="text-[10px] text-slate-500">※子要素のタスクも含みます</span>
          )}
        </div>
        
        {useKpiStore.getState().actions.filter(a => 
          !a.isArchived && 
          (a.kpiId === selectedKpi.id || (isComputed && childKpis.some(c => c.id === a.kpiId)))
        ).length === 0 ? (
          <div className="text-[11px] text-slate-400 text-center py-2 bg-white dark:bg-[#2d2f31] rounded border border-slate-100 dark:border-slate-800">
            未完了のタスクはありません
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {useKpiStore.getState().actions
                .filter(a => !a.isArchived && (a.kpiId === selectedKpi.id || (isComputed && childKpis.some(c => c.id === a.kpiId))))
                .sort((a, b) => a.status === 'done' ? 1 : b.status === 'done' ? -1 : 0)
                .map(action => (
                  <motion.div 
                    key={action.id} 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      // 追加されたばかり（現在時刻から1秒以内かつcreatedAtが存在する）ならシェイクする
                      x: (action.createdAt && (Date.now() - action.createdAt) < 1000) ? [0, -4, 4, -4, 4, 0] : 0 
                    }}
                    transition={{ 
                      duration: 0.3,
                      x: { duration: 0.4, ease: "easeInOut" } // シェイク用のトランジション
                    }}
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
                      <span className={`text-xs ${action.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {action.title}
                      </span>
                      {action.kpiId !== selectedKpi.id && (() => {
                        const targetNode = kpiData[action.kpiId];
                        if (!targetNode) return null;
                        
                        let badgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                        if (targetNode.status === 'danger') {
                          badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
                        } else if (targetNode.status === 'warning') {
                          badgeColor = 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                        } else if (targetNode.status === 'good') {
                          badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
                        }

                        return (
                          <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded border w-fit font-medium flex items-center gap-1 ${badgeColor} ${action.status === 'done' ? 'opacity-50' : ''}`}>
                            対象: {targetNode.name} ({Math.round(targetNode.achievementRate || 0)}%)
                          </span>
                        );
                      })()}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        useKpiStore.getState().deleteAction(action.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-opacity ml-auto shrink-0"
                      title="削除"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-white dark:bg-transparent">
        {(!selectedKpi.chatMessages || selectedKpi.chatMessages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bot size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              目標「{formatDisplayValue(targetVal, selectedKpi.unit)}」を達成するための<br/>AIコンサルタントがスタンバイしています。<br/>
              <br/>
              「何から始めればいい？」「今日3件達成しました」など、お気軽に話しかけてください。
            </p>
          </div>
        )}

        {selectedKpi.chatMessages?.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-strategic-teal/10 flex items-center justify-center shrink-0 mt-1">
                <Bot size={12} className="text-strategic-teal" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] ${
              msg.role === 'user' 
                ? 'bg-strategic-teal text-white rounded-tr-sm' 
                : 'bg-white dark:bg-[#3c4043] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm shadow-sm'
            } whitespace-pre-wrap leading-relaxed`}>
              {msg.role === 'model' ? (
                <TypewriterText text={msg.content} animate={msg.id === selectedKpi.chatMessages?.[selectedKpi.chatMessages.length - 1]?.id} />
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User size={12} className="text-slate-500 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-full bg-strategic-teal/10 flex items-center justify-center shrink-0 mt-1">
              <Bot size={12} className="text-strategic-teal" />
            </div>
            <div className="bg-white dark:bg-[#3c4043] border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-strategic-teal/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-strategic-teal/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-strategic-teal/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力フォーム */}
      <div className="p-3 bg-white dark:bg-[#202124] border-t border-slate-200 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="「タスクを完了しました」「どうすればいい？」"
            disabled={isProcessing}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#2d2f31] border border-slate-200 dark:border-slate-700 rounded-full text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-strategic-teal focus:ring-1 focus:ring-strategic-teal transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-strategic-teal hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors"
          >
            <Send size={14} className={input.trim() && !isProcessing ? "translate-x-[-1px] translate-y-[1px]" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
};
