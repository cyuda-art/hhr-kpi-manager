import React, { useState, useEffect, useRef } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Sparkles, Send, Bot, User, CheckCircle2, History, X } from 'lucide-react';
import { getDisplayValue, formatDisplayValue } from '@/lib/kpi-utils';

export const KpiExecutionPanel = () => {
  const { kpiData, selectedNodeId, currentPeriod, addChatMessage, addAction } = useKpiStore();
  const { isActionPanelCollapsed, toggleActionPanel } = useLayoutStore();
  const { user } = useAuthStore();
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;

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

    // 即座にUIに反映
    addChatMessage(selectedKpi.id, { role: 'user', content: userMessage });

    try {
      const response = await fetch('/api/kpi-execution-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          kpiContext: {
            name: selectedKpi.name,
            targetValue: selectedKpi.targetValue,
            actualValue: selectedKpi.actualValue,
            unit: selectedKpi.unit,
            description: selectedKpi.description
          },
          actions: useKpiStore.getState().actions.filter(a => a.kpiId === selectedKpi.id && !a.isArchived),
          history: selectedKpi.chatMessages || []
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
            useKpiStore.getState().addAction({
              kpiId: selectedKpi.id,
              title: action.title,
              status: 'todo',
              dueDate: new Date().toISOString().split('T')[0],
              priority: action.priority || 'not_urgent_important',
              owner: user?.displayName || 'Guest'
            });
            useKpiStore.getState().addAuditLog({
              kpiId: selectedKpi.id,
              userId: user?.uid || 'guest',
              userName: user?.displayName || 'Guest',
              action: 'ADD_TODO',
              evidenceText: `AIによるタスク追加: ${action.title}`,
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
          }
        });
      }

      setIsProcessing(false);
      
    } catch (error) {
      console.error(error);
      addChatMessage(selectedKpi.id, { role: 'model', content: 'エラーが発生しました。' });
      setIsProcessing(false);
    }
  };

  const actualVal = getDisplayValue(selectedKpi.actualValue, selectedKpi, currentPeriod, 'actualValue');
  const targetVal = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#202124]">
      {/* ヘッダー部分（進捗サマリー） */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold text-strategic-teal dark:text-primary-400 uppercase tracking-wider mb-1">
              Selected {selectedKpi.type}
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

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
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
              {msg.content}
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
