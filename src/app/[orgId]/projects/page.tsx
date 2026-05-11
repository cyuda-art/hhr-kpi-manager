"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Plus, ArrowRight, FolderKanban, Copy, Trash2, LogOut, MoreVertical, Sparkles } from 'lucide-react';

export default function WorkspacePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject, duplicateProject, deleteProject } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [projectUrl, setProjectUrl] = useState('');
  const [kgiType, setKgiType] = useState('売上高');
  const [kgiPeriod, setKgiPeriod] = useState('年間');
  const [kgiTargetValue, setKgiTargetValue] = useState('');
  const [businessModelType, setBusinessModelType] = useState('B2B SaaS（継続課金）');
  const [mvv, setMvv] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [hasSampleData, setHasSampleData] = useState(false);

  useEffect(() => {
    if (user && currentOrgId) {
      const unsubscribe = initializeProjects(currentOrgId);
      return () => unsubscribe();
    }
  }, [user, currentOrgId, initializeProjects]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const closeMenu = () => setMenuOpenId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    router.push(`/${currentOrgId}/p/${projectId}/kpi-tree`);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectUrl) return;

    // 自動生成するプロジェクト名
    const projectName = `${kgiType} ${kgiTargetValue ? Number(kgiTargetValue).toLocaleString() : ''}達成プロジェクト`;

    try {
      setIsGenerating(true);
      if (!currentOrgId) throw new Error("No organization selected");

      // 1. APIを呼んでKPIツリーをAI生成
      const res = await fetch('/api/generate-kpi-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl,
          kgiType,
          kgiPeriod,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          businessModelType,
          mvv
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      // サンプルデータを生成する場合、全ノードに1年分の履歴データを追加する
      if (hasSampleData && data.nodes && Array.isArray(data.nodes)) {
        const today = new Date();
        data.nodes = data.nodes.map((node: any) => {
          const history = [];
          const trendType = node.trend_type || 'steady_growth';
          const volatility = node.volatility || 0.1;
          const isPercentage = node.unit === '%' || node.unit === '％';
          const startRatio = 0.3; // 1年前は目標の30%からスタートと仮定

          for (let i = 365; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            // 進行度 (0.0 〜 1.0)
            const progress = (365 - i) / 365;
            
            // ベース値の計算
            let baseValue = (node.targetValue || 0) * (startRatio + (1 - startRatio) * progress);
            
            // 季節変動（サイン波）の加味
            const month = date.getMonth(); // 0-11
            if (trendType === 'seasonal_summer') {
              // 夏(7,8月付近)がピーク
              const seasonFactor = Math.sin((month - 4) * Math.PI / 6) * 0.3; // ±30%
              baseValue = baseValue * (1 + seasonFactor);
            } else if (trendType === 'seasonal_winter') {
              // 冬(12,1月付近)がピーク
              const seasonFactor = Math.sin((month + 2) * Math.PI / 6) * 0.3; // ±30%
              baseValue = baseValue * (1 + seasonFactor);
            } else if (trendType === 'flat_random') {
              // 成長せず常に目標付近で推移
              baseValue = node.targetValue || 0;
            }

            // 日々のノイズ（ボラティリティ）
            const randomNoise = 1 + (Math.random() * volatility * 2 - volatility); // (1 - vol) ~ (1 + vol)
            let actualVal = baseValue * randomNoise;
            
            // 丸め処理（%の場合は小数点第1位まで、それ以外は整数）
            if (isPercentage) {
              actualVal = Math.round(actualVal * 10) / 10;
              if (actualVal < 0) actualVal = 0;
              if (actualVal > 100) actualVal = 100;
            } else {
              actualVal = Math.round(actualVal);
              if (actualVal < 0) actualVal = 0;
            }
            
            history.push({
              id: Math.random().toString(36).substr(2, 9),
              date: dateString,
              targetValue: node.targetValue || 0,
              actualValue: actualVal,
              comment: i === 0 ? '現在' : i % 30 === 0 ? '月次まとめ' : ''
            });
          }
          // 現時点の値を最新の履歴に合わせる
          node.actualValue = history[history.length - 1].actualValue;
          node.history = history;
          return node;
        });
      } else if (!hasSampleData && data.nodes && Array.isArray(data.nodes)) {
        // 空の場合、actualValue を 0 に初期化
        data.nodes = data.nodes.map((node: any) => {
          node.actualValue = 0;
          return node;
        });
      }

      // 2. プロジェクト作成
      const newId = await createProject(projectName, projectUrl, user.uid, currentOrgId, {
        description: projectUrl,
        mvv, 
        kgiType, 
        kgiPeriod,
        kgiTargetValue: Number(kgiTargetValue) || 0, 
        businessModelType
      });
      
      setCurrentProjectId(newId);

      // 3. 生成されたノード群と推論プロセスをセッションストレージに退避して次の画面でロードさせる
      if (data.nodes && Array.isArray(data.nodes)) {
        sessionStorage.setItem(`kpi_init_${newId}`, JSON.stringify(data.nodes));
      }
      if (data.thinkingProcess) {
        sessionStorage.setItem(`kpi_thinking_${newId}`, JSON.stringify(data.thinkingProcess));
      }

      router.push(`/${currentOrgId}/p/${newId}/kpi-tree`);
    } catch (error) {
      console.error("Failed to create project", error);
      alert('プロジェクトとKPIツリーのAI生成に失敗しました。時間をおいて再試行してください。');
      setIsGenerating(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!user) return;
    setIsProcessing(projectId);
    try {
      if (!currentOrgId) throw new Error("No organization selected");
      const newId = await duplicateProject(projectId, user.uid, currentOrgId);
    } catch (error) {
      console.error("Failed to duplicate", error);
      alert("複製に失敗しました");
    } finally {
      setIsProcessing(null);
      setMenuOpenId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    if (window.confirm(`「${projectName}」を本当に削除しますか？\nこの操作は取り消せません。`)) {
      setIsProcessing(projectId);
      try {
        if (!currentOrgId) throw new Error("No organization selected");
        await deleteProject(projectId, currentOrgId);
      } catch (error) {
        console.error("Failed to delete", error);
        alert("削除に失敗しました");
      } finally {
        setIsProcessing(null);
        setMenuOpenId(null);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/lp';
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#202124] flex items-center justify-center text-slate-900 dark:text-[#f1f3f4]">読み込み中...</div>;
  }

  return (
    <OrgLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] p-6 md:p-12 font-sans selection:bg-[#8ab4f8]/30">
        <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
          <div>
            <p className="text-[20px] md:text-[24px] font-normal text-slate-500 dark:text-[#9aa0a6] mb-1">
              こんにちは、{user?.displayName || 'ゲスト'}さん
            </p>
            <h1 className="text-[32px] md:text-[36px] font-normal text-slate-900 dark:text-[#f1f3f4] tracking-tight">
              LogicTree Pro へようこそ
            </h1>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-[14px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-6 pb-2 border-b border-slate-200 dark:border-[#3c4043]">
            最近のプロジェクト
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            
            {/* Create New Project Card (Dashed) */}
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-transparent hover:bg-white dark:bg-[#282a2d] border-2 border-dashed border-slate-300 dark:border-[#5f6368] hover:border-primary-500 dark:border-[#8ab4f8] rounded-[8px] h-[190px] flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-primary-600 dark:text-[#8ab4f8] bg-primary-600 dark:bg-[#8ab4f8]/10 group-hover:bg-primary-600 dark:bg-[#8ab4f8]/20 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-[16px] font-medium text-primary-600 dark:text-[#8ab4f8]">
                AIでKGI/KPIを生成
              </span>
            </button>

            {/* Existing Projects */}
            {projects.map(project => (
              <div 
                key={project.id} 
                onClick={() => handleSelectProject(project.id)}
                className="bg-white dark:bg-[#2d2f31] hover:bg-slate-100 dark:bg-[#323639] border border-slate-200 dark:border-[#3c4043] hover:border-slate-300 dark:border-[#5f6368] rounded-[8px] h-[190px] flex flex-col p-5 cursor-pointer transition-all relative group shadow-sm hover:shadow-md"
              >
                {/* 処理中のオーバーレイ */}
                {isProcessing === project.id && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-[#202124]/80 flex items-center justify-center z-10 rounded-[8px] backdrop-blur-sm">
                    <span className="text-[13px] text-primary-600 dark:text-[#8ab4f8] font-medium animate-pulse">処理中...</span>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[16px] font-medium text-slate-800 dark:text-[#e8eaed] truncate pr-4 leading-tight">
                    {project.name}
                  </h3>
                  
                  {/* Context Menu Toggle */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setMenuOpenId(menuOpenId === project.id ? null : project.id);
                    }}
                    className="text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:text-[#f1f3f4] p-1 -m-1 rounded-full hover:bg-slate-200 dark:bg-[#3c4043] transition-colors z-10"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Context Menu Dropdown */}
                  {menuOpenId === project.id && (
                    <div 
                      className="absolute top-10 right-4 w-40 bg-white dark:bg-[#282a2d] border border-slate-200 dark:border-[#3c4043] rounded-[4px] shadow-lg overflow-hidden z-20 py-1 animate-in fade-in zoom-in-95 duration-100"
                      onClick={(e) => e.stopPropagation()} // ドロップダウン内クリックでカード遷移を防ぐ
                    >
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); handleDuplicate(e, project.id); }} // onMouseDownを使用してネイティブclickによる消滅を先行ブロック
                        className="w-full text-left px-4 py-2 text-[13px] text-slate-800 dark:text-[#e8eaed] hover:bg-slate-200 dark:bg-[#3c4043] flex items-center gap-2"
                      >
                        <Copy size={14} /> 複製する
                      </button>
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); handleDelete(e, project.id, project.name); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-rose-500 dark:text-[#f28b82] hover:bg-slate-200 dark:bg-[#3c4043] flex items-center gap-2"
                      >
                        <Trash2 size={14} /> 削除する
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex-1">
                  <p className="text-[12px] md:text-[13px] text-slate-500 dark:text-[#9aa0a6] font-normal leading-[1.5] line-clamp-3 mt-2">
                    {project.description || '説明がありません。プロジェクトを開いて詳細を設定できます。'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-[#3c4043]/50 flex items-center justify-between text-slate-500 dark:text-[#9aa0a6] group-hover:text-primary-600 dark:text-[#8ab4f8] transition-colors">
                  <span className="text-[12px] font-medium">ツリーを開く</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
            
          </div>
        </div>
      </div>

      {/* 新規作成AIウィザード */}
      {isCreating && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#282a2d] rounded-[8px] p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-[#3c4043] relative overflow-hidden">
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-[#e8eaed] mb-2">AIが最適なKPIツリーを構築中...</h3>
                <p className="text-slate-500 dark:text-[#9aa0a6] text-center max-w-md">
                  ヒアリング内容に基づき、事業特性に合わせたKGIとKPIの分解ツリー、および目標数値を自動生成しています。（最大10〜15秒かかります）
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[20px] font-bold text-slate-900 dark:text-[#f1f3f4]">新しいKGIツリーの作成</h2>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-5">
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">1. 企業のURL（または事業概要のテキスト） <span className="text-rose-500">*</span></label>
                      <input
                        type="text" required autoFocus value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)}
                        placeholder="例：https://example.com または ホテル5施設と飲食10店舗の運営"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">AIがURLから事業ポートフォリオを解読し、マトリョーシカ構造の基本パラメータを自動抽出します。</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">2. KGI（最終目標）</label>
                        <select 
                          value={kgiType} onChange={(e) => setKgiType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                        >
                          <option value="売上高">売上高</option>
                          <option value="営業利益">営業利益</option>
                          <option value="ARR">ARR</option>
                          <option value="MAU">MAU</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">目標期間</label>
                        <select 
                          value={kgiPeriod} onChange={(e) => setKgiPeriod(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                        >
                          <option value="年間">年間</option>
                          <option value="半期">半期</option>
                          <option value="四半期">四半期</option>
                          <option value="月間">月間</option>
                          <option value="1日あたり">1日あたり</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">目標数値 (円/人など) <span className="text-rose-500">*</span></label>
                        <input
                          type="number" required value={kgiTargetValue} onChange={(e) => setKgiTargetValue(e.target.value)}
                          placeholder="例：500000000"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">3. 主力となるビジネスモデルの型</label>
                      <select 
                        value={businessModelType} onChange={(e) => setBusinessModelType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                      >
                        <option value="B2B SaaS（継続課金）">B2B SaaS（継続課金）</option>
                        <option value="店舗・施設（客数×単価）">店舗・施設（客数×単価）</option>
                        <option value="EC・物販">EC・物販</option>
                        <option value="その他">その他</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">第1階層の計算式（足し算型か掛け算型か）のテンプレートを決定します。</p>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">4. MVV（特に「NG行動・制約条件」）</label>
                      <textarea
                        value={mvv} onChange={(e) => setMvv(e.target.value)} rows={3}
                        placeholder="顧客に提供したい価値や、目標達成のためであっても絶対にやりたくない営業・接客手法など"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none resize-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">スパム的な解決策を弾き、ブランド価値を守るための制約パラメータとしてAIにセットされます。</p>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">5. 初期データの生成</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#e8eaed] cursor-pointer">
                          <input type="radio" checked={!hasSampleData} onChange={() => setHasSampleData(false)} className="text-primary-500 focus:ring-primary-500" />
                          空で作成（実績0からスタート）
                        </label>
                        <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#e8eaed] cursor-pointer">
                          <input type="radio" checked={hasSampleData} onChange={() => setHasSampleData(true)} className="text-primary-500 focus:ring-primary-500" />
                          サンプルデータあり（過去1年分のダミー履歴を生成）
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-[#3c4043]">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px] transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit" disabled={!projectUrl || !kgiTargetValue || isGenerating}
                      className="px-4 py-2 text-[14px] font-medium bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white rounded-[4px] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      AIでKPIツリーを自動生成
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </OrgLayout>
  );
}
