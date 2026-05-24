"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ArrowRight, User } from 'lucide-react';

interface MarketingRightPanelProps {
  isVisible: boolean;
  customGoalEvent?: string | null;
}

type Message = {
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
};

export const MarketingRightPanel = ({ isVisible, customGoalEvent }: MarketingRightPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '初めまして！Gnu.のAIコパイロットです。このワークスペースについて、何でも聞いてください。'
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const predefinedPrompts = [
    {
      label: 'Gnu.で何ができるの？',
      response: (
        <div className="space-y-3">
          <p>Gnu.は、抽象的な目標を具体的な「KPIツリー」に分解し、それを達成するための実務までAIが自律的に実行する次世代プラットフォームです。</p>
          <a href="/login" className="inline-flex items-center gap-2 bg-strategic-teal text-white px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-strategic-teal/90 transition-colors mt-2">
            ワークスペースを作る <ArrowRight size={14} />
          </a>
        </div>
      )
    },
    {
      label: '利用料金は？',
      response: (
        <div className="space-y-3">
          <p>エンタープライズ向けのGoogle Vertex AI基盤を定額でご利用いただけます。</p>
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mt-2">
            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">Pro Plan</span>
              <span className="font-black text-xl text-strategic-teal">¥50,000<span className="text-xs font-normal text-slate-500">/mo</span></span>
            </div>
            <ul className="text-[10px] space-y-1 mb-3 text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1">✓ Unlimited KPI Trees</li>
              <li className="flex items-center gap-1">✓ Gemini 1.5 Pro Access</li>
              <li className="flex items-center gap-1">✓ Agentic Workspace Auto-execution</li>
            </ul>
            <a href="/pricing" className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-slate-700 dark:hover:bg-white transition-colors">
              料金詳細を見る <ArrowRight size={14} />
            </a>
          </div>
        </div>
      )
    },
    {
      label: '活用シーンは？',
      response: (
        <div className="space-y-3">
          <p>様々な実務をAIが代行します。例えば：</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 p-2 rounded-lg flex flex-col items-center justify-center text-center aspect-square shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <span className="text-blue-500 font-bold text-[10px]">Doc</span>
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">記事の自動生成</span>
            </div>
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 p-2 rounded-lg flex flex-col items-center justify-center text-center aspect-square shadow-sm">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                <span className="text-purple-500 font-bold text-[10px]">SNS</span>
              </div>
              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">SNS投稿自動化</span>
            </div>
          </div>
          <a href="/use-cases" className="inline-flex items-center gap-2 text-purple-500 dark:text-purple-400 text-[10px] font-bold tracking-widest hover:underline mt-1">
            すべての事例を見る <ArrowRight size={12} />
          </a>
        </div>
      )
    }
  ];

  const handlePromptClick = (prompt: typeof predefinedPrompts[0]) => {
    setMessages(prev => [...prev, { role: 'user', content: prompt.label }]);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: prompt.response }]);
    }, 1000);
  };

  useEffect(() => {
    if (customGoalEvent) {
      setMessages(prev => [...prev, { role: 'user', content: `「${customGoalEvent}」という目標を追加したいです` }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: (
            <div className="space-y-3">
              <p>素晴らしい目標ですね！そのKGIを達成するために必要なKPIツリーを、私（AI）が自動で展開し、実務まで代行します。</p>
              <a href="/login" className="w-full inline-flex items-center justify-center gap-2 bg-strategic-teal text-white py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-strategic-teal/90 transition-colors">
                無料でアカウントを作成して実行する <ArrowRight size={14} />
              </a>
            </div>
          ) 
        }]);
      }, 1500);
    }
  }, [customGoalEvent]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
      transition={{ duration: 0.5 }}
      className={`absolute right-6 top-24 bottom-24 w-80 z-50 pointer-events-auto flex flex-col ${!isVisible && 'pointer-events-none'}`}
    >
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-white/40 dark:border-white/10 flex items-center px-4 bg-white/30 dark:bg-black/30">
          <Bot size={18} className="text-strategic-teal mr-2" />
          <h3 className="font-bold text-slate-800 dark:text-white text-xs tracking-widest uppercase">Soulful AI Coach</h3>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-strategic-teal/20 text-strategic-teal'}`}>
                  {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                </div>
                <div className={`text-xs leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-strategic-teal text-white p-3 rounded-2xl rounded-tr-sm' : 'bg-white/50 dark:bg-[#111]/50 text-slate-700 dark:text-slate-300 p-3 rounded-2xl rounded-tl-sm border border-white/50 dark:border-slate-800'}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-strategic-teal/20 text-strategic-teal">
                  <Sparkles size={12} />
                </div>
                <div className="bg-white/50 dark:bg-[#111]/50 p-3 rounded-2xl rounded-tl-sm border border-white/50 dark:border-slate-800 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-strategic-teal/50 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-strategic-teal/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-strategic-teal/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prompts Area */}
        <div className="p-4 bg-white/20 dark:bg-black/20 border-t border-white/40 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            {predefinedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt)}
                disabled={isTyping}
                className="text-[10px] font-bold tracking-widest bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-full border border-white/60 dark:border-slate-700 transition-colors"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
