"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Building2, Plus, ArrowRight, FolderKanban, Copy, Trash2 } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject, duplicateProject, deleteProject } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = initializeProjects(user.uid);
      return () => unsubscribe();
    }
  }, [user, initializeProjects]);

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    router.push('/');
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
    e.stopPropagation(); // カード自体のクリック発火を防ぐ
    if (!user) return;
    setIsProcessing(projectId);
    try {
      await duplicateProject(projectId, user.uid);
    } catch (error) {
      console.error("Failed to duplicate", error);
      alert("複製に失敗しました");
    } finally {
      setIsProcessing(null);
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
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors relative overflow-hidden flex items-center justify-center">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'User'} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400">管理するプロジェクトを選択するか、新しく作成してください</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-indigo-600/30"
          >
            <Plus size={20} />
            新規プロジェクト
          </button>
        </div>

        {/* 新規作成モーダル */}
        {isCreating && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">新しいプロジェクトを作成</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">プロジェクト名</label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="例：株式会社HHRグループ KPI"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">説明 (任意)</label>
                  <input
                    type="text"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="例：2026年度の全社オムニチャネル指標"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    作成して始める
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => {
            // プロジェクトごとに異なるグラデーションを当てる簡易ロジック
            const gradients = [
              'from-blue-500 to-indigo-600',
              'from-emerald-400 to-teal-500',
              'from-purple-500 to-pink-600',
              'from-amber-400 to-orange-500'
            ];
            const bgGradient = gradients[idx % gradients.length];

            return (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.15)] hover:-translate-y-1 transition-all text-left group overflow-hidden relative"
              >
                {/* 飾り帯 */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${bgGradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${bgGradient} text-white shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <FolderKanban className="w-6 h-6" />
                </div>
                
                {/* 操作メニュー（右上に配置） */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleDuplicate(e, project.id)}
                    disabled={isProcessing === project.id}
                    title="プロジェクトを複製"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, project.id, project.name)}
                    disabled={isProcessing === project.id}
                    title="プロジェクトを削除"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-12">
                  {project.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                  {project.description || '説明なし'}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                    プロジェクトを開く 
                    <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  {isProcessing === project.id && (
                    <span className="text-xs text-indigo-500 animate-pulse font-medium">処理中...</span>
                  )}
                </div>
              </button>
            );
          })}

          {!isCreating && projects.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">まだプロジェクトがありません</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                最初のプロジェクトを作成して、KPIツリーの構築を始めましょう。テンプレートから簡単に始めることもできます。
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-indigo-600/30"
              >
                <Plus size={20} />
                最初のプロジェクトを作る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
