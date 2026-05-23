import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatOnboardingProps = {
  onComplete: (collectedData: Record<string, string>) => void;
  onCancel: () => void;
};

export function ChatOnboarding({ onComplete, onCancel }: ChatOnboardingProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `こんにちは、${user?.displayName || 'ゲスト'}さん！\nあなたが達成したい目標や、解決したい課題を自由に入力してください。\n\n（例: 会社の売上を倍にしたい、3ヶ月で英語を話せるようになりたい、10kg痩せたい など）` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || hasSubmitted) return;

    const userMessage = input.trim();
    setInput('');
    setHasSubmitted(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // AIの即座のリアクションを演出
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '承知いたしました。\n入力いただいた情報から、あなたの目標達成に必要なVISIONからKPIまでの全7階層を推論し、最適な戦略ツリーを構築します。\n\n少々お待ちください...' }]);
      
      // 親コンポーネントへ入力内容を渡してAPI呼び出し（generate-universal-tree）をトリガーする
      setTimeout(() => {
        onComplete({ userGoal: userMessage });
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#202124] rounded-[16px] w-full max-w-4xl h-[90vh] sm:h-[85vh] shadow-2xl border border-slate-200 dark:border-[#3c4043] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#3c4043] bg-white dark:bg-[#202124] z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-strategic-teal/10 dark:bg-[#8ab4f8]/10 flex items-center justify-center text-strategic-teal dark:text-[#8ab4f8]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-[#f1f3f4]">目標設定（AIワンショット生成）</h2>
              <div className="text-[12px] text-slate-500 dark:text-[#9aa0a6] font-medium mt-1">
                あなたの思いをAIが7階層のツリーに具現化します
              </div>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#3c4043]">
            キャンセル
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-[#202124]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-[#3c4043] text-slate-600 dark:text-[#e8eaed]' : 'bg-strategic-teal text-white'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-[12px] p-4 ${msg.role === 'user' ? 'bg-slate-100 dark:bg-[#3c4043] text-slate-800 dark:text-[#e8eaed]' : 'bg-white dark:bg-[#282a2d] text-slate-800 dark:text-[#e8eaed] border border-slate-200 dark:border-[#3c4043] shadow-sm'} whitespace-pre-wrap leading-relaxed text-[14px] sm:text-[15px]`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 animate-in fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full bg-strategic-teal text-white flex items-center justify-center mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-white dark:bg-[#282a2d] border border-slate-200 dark:border-[#3c4043] shadow-sm rounded-[12px] p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-strategic-teal dark:text-[#8ab4f8]" />
                <span className="text-[14px] text-slate-500 dark:text-[#9aa0a6]">ツリーを構築中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#282a2d] border-t border-slate-200 dark:border-[#3c4043] shrink-0">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping || hasSubmitted}
              placeholder="ここに回答を入力してください..."
              className="w-full pl-4 pr-14 py-4 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] text-slate-900 dark:text-[#f1f3f4] rounded-full focus:outline-none focus:border-strategic-teal dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-strategic-teal dark:focus:ring-[#8ab4f8] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || hasSubmitted}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-strategic-teal text-white hover:bg-strategic-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
