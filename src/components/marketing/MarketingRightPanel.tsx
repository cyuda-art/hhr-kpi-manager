"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ArrowRight, User } from 'lucide-react';

interface MarketingRightPanelProps {
  isVisible: boolean;
}

type Message = {
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
};

export const MarketingRightPanel = ({ isVisible }: MarketingRightPanelProps) => {
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
          <p>初期費用ゼロで、まずは無料トライアルから始められます。エンタープライズ向けのGoogle Vertex AI基盤を、月額の定額制でご利用いただけます。</p>
          <a href="/pricing" className="inline-flex items-center gap-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-slate-700 dark:hover:bg-white transition-colors mt-2">
            料金プランを見る <ArrowRight size={14} />
          </a>
        </div>
      )
    },
    {
      label: '活用シーンは？',
      response: (
        <div className="space-y-3">
          <p>マーケティング戦略の立案から、ブログ記事の自動生成、SNSへの投稿スケジュール管理など、これまで人が手を動かしていた実行フェーズをAIが代行します。</p>
          <a href="/use-cases" className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-purple-600 transition-colors mt-2">
            活用シーンを見る <ArrowRight size={14} />
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
