"use client";

import React, { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { Sparkles, Loader2, Wand2, X } from 'lucide-react';
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

export const CopilotSidebar = () => {
  const { 
    isCopilotSidebarOpen, 
    setIsCopilotSidebarOpen, 
    kpiData, 
    currentProjectInfo, 
    applySmartAddPatch,
    smartAddMessages,
    setSmartAddMessages
  } = useKpiStore();
  
  const [smartAddQuery, setSmartAddQuery] = useState('');
  const [isSmartAddThinking, setIsSmartAddThinking] = useState(false);
  const [isSmartAdding, setIsSmartAdding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isCopilotSidebarOpen) return null;

  const renderAiProcessingEffect = () => {
    if (!isMounted || typeof document === 'undefined') return null;
    return createPortal(
      <AnimatePresence>
        {(isSmartAddThinking || isSmartAdding) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none z-[9999] rounded-none"
          >
            <div className="ai-caustic-surface" />
            <div className="ai-generating-border" />
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/5 relative">
      {renderAiProcessingEffect()}

      <div className="relative z-10 px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-[10px] tracking-widest uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Sparkles className="text-strategic-teal" size={12} />
          AI戦略コンサルタント (Copilot)
        </h3>
        <button onClick={() => setIsCopilotSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
        {smartAddMessages.length === 0 && (
          <div className="text-[13px] text-slate-500 text-center mt-4 leading-relaxed">
            追加したいKPIや要素、変更したい目標値などを入力してください。AIが最適な階層への接続、中間KPIの生成、既存KPIの目標値（Target Value）の再設定などを提案し、自動で反映します。<br/><br/>（例：「SNSマーケティングのKPIを追加したい」「営業利益の目標値を1日あたり10万円に変更して」）
          </div>
        )}
        {smartAddMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-[13px] shadow-sm ${msg.role === 'user' ? 'bg-strategic-teal text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-pre-wrap'}`}>
              {msg.role === 'model' ? (
                <TypewriterText text={msg.content} animate={idx === smartAddMessages.length - 1} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isSmartAddThinking && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-[13px] flex items-center gap-2 text-slate-700 dark:text-slate-300 shadow-sm">
              <Loader2 size={14} className="animate-spin text-strategic-teal" /> AIアーキテクトが構成案を検討中...
            </div>
          </div>
        )}
      </div>
      
      <div className="relative z-10 p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 shrink-0 bg-white dark:bg-[#202124]">
        <input 
          type="text" 
          placeholder="AIアーキテクトにチャットで相談..."
          value={smartAddQuery}
          onChange={(e) => setSmartAddQuery(e.target.value)}
          disabled={isSmartAddThinking || isSmartAdding}
          className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all"
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              if (!smartAddQuery.trim() || isSmartAddThinking || isSmartAdding) return;
              
              const userQuery = smartAddQuery;
              setSmartAddQuery('');
              setSmartAddMessages(prev => [...prev, { role: 'user', content: userQuery }]);
              setIsSmartAddThinking(true);
              
              try {
                const res = await fetch('/api/smart-add-chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: userQuery,
                    currentTree: Object.values(kpiData),
                    history: smartAddMessages,
                    businessUnit: currentProjectInfo?.name || 'company'
                  })
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                
                setSmartAddMessages(prev => [...prev, { role: 'model', content: data.text }]);
                
                if (data.patchData) {
                  setIsSmartAdding(true);
                  await applySmartAddPatch(data.patchData);
                  
                  // ハイライト演出用
                  const modifiedIds = [
                    ...(data.patchData.updatedNodes || []).map((n: any) => n.id),
                    ...(data.patchData.newNodes || []).map((n: any) => n.id)
                  ].filter(Boolean);
                  
                  if (modifiedIds.length > 0) {
                    useKpiStore.getState().setRecentlyUpdatedNodes(modifiedIds);
                    setTimeout(() => {
                      useKpiStore.getState().setRecentlyUpdatedNodes([]);
                    }, 4000);
                  }

                  setIsCopilotSidebarOpen(false);
                  setSmartAddMessages([]);
                }
              } catch (err) {
                setSmartAddMessages(prev => [...prev, { role: 'model', content: 'エラーが発生しました。' }]);
              } finally {
                setIsSmartAddThinking(false);
                setIsSmartAdding(false);
              }
            }
          }}
        />
        <button 
          disabled={!smartAddQuery.trim() || isSmartAddThinking || isSmartAdding}
          onClick={async () => {
              if (!smartAddQuery.trim() || isSmartAddThinking || isSmartAdding) return;
              
              const userQuery = smartAddQuery;
              setSmartAddQuery('');
              setSmartAddMessages(prev => [...prev, { role: 'user', content: userQuery }]);
              setIsSmartAddThinking(true);
              
              try {
                const res = await fetch('/api/smart-add-chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: userQuery,
                    currentTree: Object.values(kpiData),
                    history: smartAddMessages,
                    businessUnit: currentProjectInfo?.name || 'company'
                  })
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                
                setSmartAddMessages(prev => [...prev, { role: 'model', content: data.text }]);
                
                if (data.patchData) {
                  setIsSmartAdding(true);
                  await applySmartAddPatch(data.patchData);
                  
                  // ハイライト演出用
                  const modifiedIds = [
                    ...(data.patchData.updatedNodes || []).map((n: any) => n.id),
                    ...(data.patchData.newNodes || []).map((n: any) => n.id)
                  ].filter(Boolean);
                  
                  if (modifiedIds.length > 0) {
                    useKpiStore.getState().setRecentlyUpdatedNodes(modifiedIds);
                    setTimeout(() => {
                      useKpiStore.getState().setRecentlyUpdatedNodes([]);
                    }, 4000);
                  }

                  setIsCopilotSidebarOpen(false);
                  setSmartAddMessages([]);
                }
              } catch (err) {
                setSmartAddMessages(prev => [...prev, { role: 'model', content: 'エラーが発生しました。' }]);
              } finally {
                setIsSmartAddThinking(false);
                setIsSmartAdding(false);
              }
          }}
          className="px-6 py-2 bg-gradient-to-r from-strategic-teal to-blue-600 hover:from-strategic-teal/90 hover:to-blue-600/90 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <Sparkles size={16} />
          送信
        </button>
      </div>
    </div>
  );
};
