"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { TEMPLATES } from '@/lib/templates';
import { Sparkles, Bot, User, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  options?: { label: string; value: string; type?: 'userType' | 'industry' }[];
  isTyping?: boolean;
}

export default function OnboardingChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentOrgId, createOrganization } = useOrgStore();
  const { createProject, setCurrentProjectId } = useProjectStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 初期メッセージ
  useEffect(() => {
    setMessages([
      {
        id: 'msg-1',
        sender: 'ai',
        text: 'はじめまして！K-Navigatorへようこそ。まずはあなたのプロファイルを設定し、最適な環境をご用意します。\\nあなたは法人としてご利用ですか？それとも個人ですか？',
        options: [
          { label: '🏢 法人・チーム', value: 'company', type: 'userType' },
          { label: '👤 個人・フリーランス', value: 'personal', type: 'userType' }
        ]
      }
    ]);
  }, []);

  // スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = async (option: { label: string; value: string; type?: 'userType' | 'industry' }) => {
    // ユーザーの返答を追加
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: option.label
    };

    // 以前の選択肢を消すためにメッセージ履歴を更新
    setMessages(prev => [
      ...prev.map(m => ({ ...m, options: undefined })), // 既存の選択肢を消す
      userMsg
    ]);

    if (option.type === 'userType') {
      setUserType(option.value);
      // 次のAIメッセージ
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: 'ありがとうございます。次に、あなたの業種や事業モデルを教えてください。\\nこれに基づき、AIが最適なKPIツリーを自動生成します。',
            options: [
              { label: '🏨 ホテル・宿泊', value: 'hotel', type: 'industry' },
              { label: '🍽️ 飲食・レストラン', value: 'restaurant', type: 'industry' },
              { label: '🛍️ 小売・店舗', value: 'retail', type: 'industry' },
              { label: '💻 B2B SaaS', value: 'saas', type: 'industry' },
              { label: '📦 その他', value: 'retail', type: 'industry' } // フォールバックとしてretail
            ]
          }
        ]);
      }, 800);
    } else if (option.type === 'industry') {
      setIndustry(option.value);
      // 完了処理へ
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: '設定が完了しました！\\nご指定の業種に合わせた「初期KPIツリー」と「プロジェクト」を作成しています...',
            isTyping: true
          }
        ]);
        handleCreateProject(option.value);
      }, 800);
    }
  };

  const handleCreateProject = async (selectedIndustry: string) => {
    setIsCreating(true);
    try {
      // 組織がなければ作る
      let targetOrgId = currentOrgId;
      if (!targetOrgId && user) {
        const orgId = await createOrganization(`${user.displayName || 'マイ'} 組織`, user.uid);
        targetOrgId = orgId;
      }

      // プロジェクト作成
      const projectName = `${selectedIndustry === 'hotel' ? 'ホテル事業' : selectedIndustry === 'restaurant' ? '飲食事業' : selectedIndustry === 'saas' ? 'SaaS事業' : '新規'}プロジェクト`;
      const projectId = await createProject(
        projectName,
        'AIオンボーディングで自動生成されたプロジェクトです。',
        user?.uid || 'guest'
      );

      // KPIデータの保存
      // templates.tsのデータ構造をFirestore用（Record<string, KpiNode>）に変換する
      const templateNodes = TEMPLATES[selectedIndustry as keyof typeof TEMPLATES] || TEMPLATES['retail'];
      const kpiData: Record<string, any> = {};
      
      templateNodes.forEach(node => {
        kpiData[node.id] = {
          ...node,
          achievementRate: node.targetValue > 0 ? (node.actualValue / node.targetValue) * 100 : 0,
          status: node.actualValue >= node.targetValue ? 'good' : 'warning',
          initialActualValue: node.actualValue,
          isSimulated: false
        };
      });

      await setDoc(doc(db, 'projects', projectId, 'kpiData', 'main'), {
        kpiData,
        actions: []
      });

      setCurrentProjectId(projectId);

      // 少し待ってから完了メッセージ＆遷移
      setTimeout(() => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            isTyping: false,
            text: '完了しました！プロジェクト一覧ページへ移動します。'
          };
          return newMessages;
        });
        
        setTimeout(() => {
          router.push('/projects');
        }, 1500);
      }, 2000);

    } catch (error) {
      console.error("Setup failed:", error);
      alert('セットアップ中にエラーが発生しました。');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 sticky top-0 z-10">
        <div className="font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
          <Sparkles size={20} />
          <span>K-Navigator Setup AI</span>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'ai' 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {msg.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col gap-3 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.isTyping ? (
                    <div className="flex items-center gap-1 h-6">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Options */}
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt)}
                        disabled={isCreating}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}
