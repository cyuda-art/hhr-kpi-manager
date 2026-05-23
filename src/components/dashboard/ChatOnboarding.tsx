import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  suggestions?: string[];
};

type ChatOnboardingProps = {
  onComplete: (collectedData: Record<string, string>) => void;
  onCancel: () => void;
};

const STEP_DEFINITIONS = [
  { step: 1, key: 'vision', name: 'VISION（究極の目的）' },
  { step: 2, key: 'mission', name: 'MISSION（価値観・使命）' },
  { step: 3, key: 'manifesto', name: 'MANIFESTO（作戦）' },
  { step: 4, key: 'goal', name: 'GOAL（定性ゴール）' },
  { step: 5, key: 'kgi', name: 'KGI（定量目標）' },
  { step: 6, key: 'ksf', name: 'KSF（重要成功要因）' },
  { step: 7, key: 'kpi', name: 'KPI（行動指標）' }
];

export function ChatOnboarding({ onComplete, onCancel }: ChatOnboardingProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `こんにちは、${user?.displayName || 'ゲスト'}さん！\nこれから一緒に、あなたの目標達成に向けた「戦略ツリー」を作っていきましょう。\n\nまずは【Step 1: VISION】からです。\nあなたが最終的に成し遂げたいこと、究極の目的は何ですか？\n下の提案から選ぶか、自由にテキストで教えてください！`,
      suggestions: ['個人のスキルアップ・キャリア形成', '会社の売上拡大・事業成長', '健康的な肉体改造・ダイエット', '全く新しいプロジェクトの立ち上げ']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e?: React.FormEvent, suggestionText?: string) => {
    if (e) e.preventDefault();
    const userMessage = suggestionText || input.trim();
    if (!userMessage || isTyping) return;

    setInput('');
    setMessages(prev => {
      // ユーザーが送信したら、直前のサジェストチップは非表示にする（履歴として残さない）
      const newPrev = [...prev];
      if (newPrev.length > 0 && newPrev[newPrev.length - 1].role === 'assistant') {
        newPrev[newPrev.length - 1] = { ...newPrev[newPrev.length - 1], suggestions: undefined };
      }
      return [...newPrev, { role: 'user', content: userMessage }];
    });
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat-onboarding/evaluate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          userInput: userMessage,
          chatHistory: messages,
          collectedData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.isComplete && data.extractedValue) {
        const currentKey = STEP_DEFINITIONS.find(s => s.step === step)?.key;
        if (currentKey) {
          const newCollectedData = { ...collectedData, [currentKey]: data.extractedValue };
          setCollectedData(newCollectedData);
          
          if (step < 7) {
            setStep(s => s + 1);
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply, suggestions: data.suggestions }]);
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply + '\n\nすべてのヒヤリングが完了しました！これより、あなたの回答をもとにKPIツリーを自動構築します...' }]);
            setTimeout(() => {
              onComplete(newCollectedData);
            }, 2000);
          }
        }
      } else {
        // Not complete, keep at same step
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, suggestions: data.suggestions }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'すみません、エラーが発生しました。もう一度入力していただけますか？' }]);
    } finally {
      setIsTyping(false);
    }
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
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-[#f1f3f4]">目標設定（ハイブリッドAI）</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1">
                  {STEP_DEFINITIONS.map(s => (
                    <div 
                      key={s.step} 
                      className={`h-1.5 w-6 rounded-full transition-colors ${s.step < step ? 'bg-strategic-teal dark:bg-[#8ab4f8]' : s.step === step ? 'bg-strategic-teal/50 dark:bg-[#8ab4f8]/50 animate-pulse' : 'bg-slate-200 dark:bg-[#3c4043]'}`}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-slate-500 dark:text-[#9aa0a6] font-medium ml-2">
                  Step {step}/7: {STEP_DEFINITIONS.find(s => s.step === step)?.name}
                </span>
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
            <div key={idx} className="space-y-3">
              <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-[#3c4043] text-slate-600 dark:text-[#e8eaed]' : 'bg-strategic-teal text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-[12px] p-4 ${msg.role === 'user' ? 'bg-slate-100 dark:bg-[#3c4043] text-slate-800 dark:text-[#e8eaed]' : 'bg-white dark:bg-[#282a2d] text-slate-800 dark:text-[#e8eaed] border border-slate-200 dark:border-[#3c4043] shadow-sm'} whitespace-pre-wrap leading-relaxed text-[14px] sm:text-[15px]`}>
                  {msg.content}
                </div>
              </div>
              
              {/* Suggestion Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && !isTyping && (
                <div className="flex flex-wrap gap-2 ml-12 animate-in fade-in slide-in-from-bottom-2 delay-150">
                  {msg.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSubmit(undefined, sug)}
                      className="text-[13px] px-4 py-2 bg-white dark:bg-[#282a2d] border border-strategic-teal/30 dark:border-[#8ab4f8]/30 text-strategic-teal dark:text-[#8ab4f8] rounded-full hover:bg-strategic-teal/5 dark:hover:bg-[#8ab4f8]/10 transition-colors text-left max-w-full shadow-sm hover:shadow-md"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 animate-in fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full bg-strategic-teal text-white flex items-center justify-center mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-white dark:bg-[#282a2d] border border-slate-200 dark:border-[#3c4043] shadow-sm rounded-[12px] p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-strategic-teal dark:text-[#8ab4f8]" />
                <span className="text-[14px] text-slate-500 dark:text-[#9aa0a6]">AIが考え中...</span>
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
              disabled={isTyping || step > 7}
              placeholder="自分の言葉で回答する場合はここに入力..."
              className="w-full pl-4 pr-14 py-4 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] text-slate-900 dark:text-[#f1f3f4] rounded-full focus:outline-none focus:border-strategic-teal dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-strategic-teal dark:focus:ring-[#8ab4f8] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || step > 7}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-strategic-teal text-white hover:bg-strategic-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {collectedData.vision && <div className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-[#9aa0a6] rounded-full flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> VISION</div>}
            {collectedData.mission && <div className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-[#9aa0a6] rounded-full flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> MISSION</div>}
            {collectedData.manifesto && <div className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-[#9aa0a6] rounded-full flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> MANIFESTO</div>}
            {collectedData.goal && <div className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-[#9aa0a6] rounded-full flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> GOAL</div>}
            {collectedData.kgi && <div className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-[#9aa0a6] rounded-full flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> KGI</div>}
            {collectedData.ksf && <div className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-[#9aa0a6] rounded-full flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> KSF</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
