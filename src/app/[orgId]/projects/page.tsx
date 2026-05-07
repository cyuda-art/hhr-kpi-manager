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
  const [step, setStep] = useState(1);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [mvv, setMvv] = useState('');
  const [industry, setIndustry] = useState('');
  const [revenueScale, setRevenueScale] = useState('');
  const [currentIssues, setCurrentIssues] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
    router.push(`/${currentOrgId}/p/${projectId}`);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName) return;

    try {
      setIsGenerating(true);
      if (!currentOrgId) throw new Error("No organization selected");

      // 1. APIを呼んでKPIツリーをAI生成
      const res = await fetch('/api/generate-kpi-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: newProjectName,
          description: newProjectDesc,
          mvv,
          industry,
          revenueScale,
          currentIssues
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      // 2. プロジェクト作成
      const newId = await createProject(newProjectName, newProjectDesc, user.uid, currentOrgId, {
        mvv, industry, revenueScale, currentIssues
      });
      
      setCurrentProjectId(newId);

      // 3. 生成されたノード群をセッションストレージに退避して次の画面でロードさせる
      if (data.nodes && Array.isArray(data.nodes)) {
        sessionStorage.setItem(`kpi_init_${newId}`, JSON.stringify(data.nodes));
      }

      router.push(`/${currentOrgId}/p/${newId}`);
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
              HHR-KPI MANAGER へようこそ
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
                  <div className="flex gap-2 text-sm font-medium">
                    <span className={step === 1 ? 'text-primary-600 dark:text-[#8ab4f8]' : 'text-slate-400'}>Step 1: 基本情報</span>
                    <span className="text-slate-300">/</span>
                    <span className={step === 2 ? 'text-primary-600 dark:text-[#8ab4f8]' : 'text-slate-400'}>Step 2: 課題のヒアリング</span>
                  </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); if (step === 1) setStep(2); else handleCreateProject(e); }} className="space-y-5">
                  {step === 1 ? (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">KGI名称（プロジェクト名） <span className="text-rose-500">*</span></label>
                        <input
                          type="text" required autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="例：株式会社HHRグループ KGI達成"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">事業・業種</label>
                          <input
                            type="text" value={industry} onChange={(e) => setIndustry(e.target.value)}
                            placeholder="例：ITコンサルティング、飲食業"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">現在の売上規模</label>
                          <input
                            type="text" value={revenueScale} onChange={(e) => setRevenueScale(e.target.value)}
                            placeholder="例：年商10億円"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">MVV (ミッション・ビジョン・バリュー)</label>
                        <textarea
                          value={mvv} onChange={(e) => setMvv(e.target.value)} rows={2}
                          placeholder="企業の目指す姿を入力すると、より本質的なKPIが生成されます"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">現状の最大の悩み・課題 <span className="text-rose-500">*</span></label>
                        <textarea
                          required value={currentIssues} onChange={(e) => setCurrentIssues(e.target.value)} rows={3} autoFocus
                          placeholder="例：新規リードの獲得コストが高騰している。既存顧客の離脱率が高い。等"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">この課題を解決するための具体的なKPI指標がツリーに組み込まれます。</p>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">プロジェクトの補足説明 (任意)</label>
                        <textarea
                          value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} rows={2}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-[#3c4043]">
                    <button
                      type="button"
                      onClick={() => { setIsCreating(false); setStep(1); }}
                      className="px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px] transition-colors"
                    >
                      キャンセル
                    </button>
                    {step === 1 ? (
                      <button
                        type="submit" disabled={!newProjectName}
                        className="px-4 py-2 text-[14px] font-medium bg-primary-600 dark:bg-[#8ab4f8] text-white dark:text-[#202124] hover:bg-primary-700 rounded-[4px] transition-colors disabled:opacity-50"
                      >
                        次へ進む
                      </button>
                    ) : (
                      <button
                        type="submit" disabled={!currentIssues}
                        className="px-4 py-2 text-[14px] font-medium bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white rounded-[4px] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles size={16} />
                        AIでKPIツリーを生成して作成
                      </button>
                    )}
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
