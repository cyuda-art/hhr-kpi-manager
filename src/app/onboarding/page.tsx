"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { Bot, User as UserIcon, Send, Sparkles, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { KpiNodeData, KpiNodeWithComputed } from '@/types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentProjectId } = useProjectStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: '新しいプロジェクトですね！最適なKPIツリーを自動生成するために、いくつか質問させてください。まず、どのような業種・ビジネスモデルですか？（例：ホテル、SaaS、飲食店など）' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [step, setStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ユーザーの回答を保持するステート
  const [answers, setAnswers] = useState({
    industry: '',
    kgi: '',
    channels: ''
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!currentProjectId) {
      router.push('/projects');
    }
  }, [currentProjectId, router]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // AIの返答をシミュレート
    setTimeout(() => {
      let aiResponse = '';
      if (step === 1) {
        setAnswers(prev => ({ ...prev, industry: userMessage.text }));
        aiResponse = `「${userMessage.text}」ですね、承知いたしました。次に、このプロジェクトの最終的な目標（KGI）は何ですか？（例：月間売上1,000万円、MRR500万円など）`;
        setStep(2);
      } else if (step === 2) {
        setAnswers(prev => ({ ...prev, kgi: userMessage.text }));
        aiResponse = `ありがとうございます。目標達成のための主要な集客・販売チャネルは何ですか？（例：Web広告とオーガニック検索、OTAと自社サイトなど）`;
        setStep(3);
      } else if (step === 3) {
        setAnswers(prev => ({ ...prev, channels: userMessage.text }));
        aiResponse = `完璧です！いただいた情報を元に、最適なKPIツリー構造をAIが構築します。準備ができたら下のボタンを押してください。`;
        setStep(4);
      }
      
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  const generateTree = async () => {
    if (!currentProjectId) return;
    setIsGenerating(true);

    try {
      // サーバーAPI（Gemini）を呼び出してツリーを生成
      const response = await fetch('/api/generate-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      const nodes: any[] = data.nodes;

      // kpiDataフォーマットに変換
      const kpiData: Record<string, any> = {};
      nodes.forEach(node => {
        kpiData[node.id] = {
          ...node,
          achievementRate: (node.actualValue / node.targetValue) * 100,
          status: (node.actualValue / node.targetValue) * 100 >= 100 ? 'good' : 'warning',
          initialActualValue: node.actualValue,
          isSimulated: false
        };
      });

      // Firestoreに保存
      await setDoc(doc(db, 'projects', currentProjectId, 'kpiData', 'main'), {
        kpiData,
        actions: []
      });
      
      // 保存完了後、ダッシュボードへ遷移
      router.push('/');
    } catch (error) {
      console.error("Failed to save generated tree", error);
      setIsGenerating(false);
      alert('ツリーの生成に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h1 className="font-bold text-slate-800">AI オンボーディング</h1>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            スキップして手動で作成
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-white border border-slate-200'}`}>
                {msg.sender === 'user' ? <UserIcon size={16} className="text-white" /> : <Bot size={18} className="text-indigo-600" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Bot size={18} className="text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          {step === 4 ? (
            <button
              onClick={generateTree}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>AIがツリーを生成中...（数秒かかります）</>
              ) : (
                <>
                  <Sparkles size={20} />
                  KPIツリーを自動生成する
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="w-full bg-transparent px-4 py-3 outline-none resize-none max-h-32 text-slate-700"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
}
