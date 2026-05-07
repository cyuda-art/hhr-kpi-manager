"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Plus, ArrowRight, FolderKanban, Copy, Trash2, LogOut, MoreVertical } from 'lucide-react';

export default function WorkspacePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject, duplicateProject, deleteProject } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = initializeProjects(user.uid);
      return () => unsubscribe();
    }
  }, [user, initializeProjects]);

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
      const newId = await createProject(newProjectName, newProjectDesc, user.uid);
      setCurrentProjectId(newId);
      router.push('/onboarding');
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!user) return;
    setIsProcessing(projectId);
    try {
      await duplicateProject(projectId, user.uid);
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
        await deleteProject(projectId);
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
    return <div className="min-h-screen bg-[#202124] flex items-center justify-center text-[#f1f3f4]">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-[#202124] text-[#e8eaed] p-6 md:p-12 font-sans selection:bg-[#8ab4f8]/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
          <div>
            <p className="text-[20px] md:text-[24px] font-normal text-[#9aa0a6] mb-1">
              こんにちは、{user?.displayName || 'ゲスト'}さん
            </p>
            <h1 className="text-[32px] md:text-[36px] font-normal text-[#f1f3f4] tracking-tight">
              HHR-KPI MANAGER へようこそ
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[14px] font-medium text-[#9aa0a6] hover:text-[#f1f3f4] flex items-center gap-2 transition-colors px-3 py-1.5 rounded-md hover:bg-[#3c4043]"
          >
            <LogOut size={16} /> ログアウト
          </button>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-[14px] font-medium text-[#9aa0a6] mb-6 pb-2 border-b border-[#3c4043]">
            最近のプロジェクト
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            
            {/* Create New Project Card (Dashed) */}
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-transparent hover:bg-[#282a2d] border-2 border-dashed border-[#5f6368] hover:border-[#8ab4f8] rounded-[8px] h-[190px] flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-[#8ab4f8] bg-[#8ab4f8]/10 group-hover:bg-[#8ab4f8]/20 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-[16px] font-medium text-[#8ab4f8]">
                プロジェクトを追加
              </span>
            </button>

            {/* Existing Projects */}
            {projects.map(project => (
              <div 
                key={project.id} 
                onClick={() => handleSelectProject(project.id)}
                className="bg-[#2d2f31] hover:bg-[#323639] border border-[#3c4043] hover:border-[#5f6368] rounded-[8px] h-[190px] flex flex-col p-5 cursor-pointer transition-all relative group shadow-sm hover:shadow-md"
              >
                {/* 処理中のオーバーレイ */}
                {isProcessing === project.id && (
                  <div className="absolute inset-0 bg-[#202124]/80 flex items-center justify-center z-10 rounded-[8px] backdrop-blur-sm">
                    <span className="text-[13px] text-[#8ab4f8] font-medium animate-pulse">処理中...</span>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[16px] font-medium text-[#e8eaed] truncate pr-4 leading-tight">
                    {project.name}
                  </h3>
                  
                  {/* Context Menu Toggle */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === project.id ? null : project.id);
                    }}
                    className="text-[#9aa0a6] hover:text-[#f1f3f4] p-1 -m-1 rounded-full hover:bg-[#3c4043] transition-colors z-10"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Context Menu Dropdown */}
                  {menuOpenId === project.id && (
                    <div className="absolute top-10 right-4 w-40 bg-[#282a2d] border border-[#3c4043] rounded-[4px] shadow-lg overflow-hidden z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={(e) => handleDuplicate(e, project.id)}
                        className="w-full text-left px-4 py-2 text-[13px] text-[#e8eaed] hover:bg-[#3c4043] flex items-center gap-2"
                      >
                        <Copy size={14} /> 複製する
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, project.id, project.name)}
                        className="w-full text-left px-4 py-2 text-[13px] text-[#f28b82] hover:bg-[#3c4043] flex items-center gap-2"
                      >
                        <Trash2 size={14} /> 削除する
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex-1">
                  <p className="text-[12px] md:text-[13px] text-[#9aa0a6] font-normal leading-[1.5] line-clamp-3 mt-2">
                    {project.description || '説明がありません。プロジェクトを開いて詳細を設定できます。'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-auto pt-3 border-t border-[#3c4043]/50 flex items-center justify-between text-[#9aa0a6] group-hover:text-[#8ab4f8] transition-colors">
                  <span className="text-[12px] font-medium">ツリーを開く</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
            
          </div>
        </div>
      </div>

      {/* 新規作成モーダル */}
      {isCreating && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#282a2d] rounded-[8px] p-6 w-full max-w-md shadow-2xl border border-[#3c4043]">
            <h2 className="text-[20px] font-normal text-[#f1f3f4] mb-6">新しいプロジェクトを作成</h2>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-1.5">プロジェクト名 <span className="text-[#f28b82]">*</span></label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例：株式会社HHRグループ KPI"
                  className="w-full px-3 py-2 bg-[#202124] text-[#e8eaed] border border-[#5f6368] focus:border-[#8ab4f8] rounded-[4px] focus:outline-none transition-colors text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#9aa0a6] mb-1.5">プロジェクトの説明 (任意)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="プロジェクトの目的や概要を入力してください"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#202124] text-[#e8eaed] border border-[#5f6368] focus:border-[#8ab4f8] rounded-[4px] focus:outline-none transition-colors text-[14px] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-[14px] font-medium text-[#8ab4f8] hover:bg-[#8ab4f8]/10 rounded-[4px] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName}
                  className="px-4 py-2 text-[14px] font-medium bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] disabled:opacity-50 disabled:hover:bg-[#8ab4f8] rounded-[4px] transition-colors"
                >
                  続行
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
