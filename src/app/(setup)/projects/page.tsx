"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { 
  Building2, Plus, ArrowRight, FolderKanban, Copy, Trash2, LogOut, 
  User as UserIcon, Mail, ShieldCheck, CreditCard, CheckCircle2, Settings 
} from 'lucide-react';

export default function WorkspacePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject, duplicateProject, deleteProject } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
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

  const handleLogout = async () => {
    await logout();
    window.location.href = '/lp';
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white bg-slate-50 dark:bg-slate-950">Loading workspace...</div>;
  }

  const currentOrg = organizations.find(org => org.id === currentOrgId);
  const isEnterprise = currentOrg?.name?.includes('HHR'); // モック用の簡易判定

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary-600 dark:bg-slate-900 border-b border-primary-700 dark:border-slate-800" />
      <div className="absolute top-0 left-0 w-full h-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto relative z-10 space-y-8 mt-4">
        
        {/* Header & Logout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-white mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">ワークスペース</h1>
            <p className="text-primary-100 dark:text-slate-400">組織の管理、ユーザー設定、プロジェクトへのアクセス</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-bold backdrop-blur-sm"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>

        {/* Dashboard Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100">{user?.displayName || 'ユーザー'}</h2>
                  <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">Owner</span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-primary-600 transition-colors" title="プロフィールを編集">
                <Settings size={18} />
              </button>
            </div>
            <div className="space-y-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{user?.email || 'email@example.com'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <ShieldCheck size={16} className="text-slate-400" />
                <span>セキュリティ: <strong className="text-emerald-600 dark:text-emerald-400">良好</strong></span>
              </div>
            </div>
          </div>

          {/* Organization Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800">
                  <Building2 size={24} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100">{currentOrg?.name || '未設定の組織'}</h2>
                  <span className="text-xs text-slate-500">ID: {currentOrgId?.slice(0,8) || '---'}</span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-primary-600 transition-colors" title="組織情報を編集">
                <Settings size={18} />
              </button>
            </div>
            <div className="space-y-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">登録メンバー</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">1 / 5 名</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">作成済みプロジェクト</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{projects.length} 個</span>
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className={`rounded-2xl p-6 shadow-lg flex flex-col relative overflow-hidden ${isEnterprise ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white' : 'bg-gradient-to-br from-primary-600 to-primary-800 border border-primary-500 text-white'}`}>
            {isEnterprise && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />}
            
            <div className="flex items-start justify-between mb-2 relative z-10">
              <div>
                <p className="text-sm font-medium opacity-80 mb-1">現在のプラン</p>
                <h2 className="text-2xl font-black flex items-center gap-2">
                  {isEnterprise ? 'Enterprise' : 'Professional'}
                  <CheckCircle2 size={20} className={isEnterprise ? "text-amber-400" : "text-emerald-400"} />
                </h2>
              </div>
              <CreditCard size={28} className="opacity-50" />
            </div>
            
            <p className="text-sm opacity-90 mt-2 mb-6 relative z-10 leading-relaxed">
              {isEnterprise 
                ? '無制限のプロジェクトとAI予測機能を利用可能です。' 
                : '高度なAIシミュレーションと組織管理機能が利用可能です。'}
            </p>
            
            <div className="mt-auto relative z-10">
              {!isEnterprise ? (
                <button className="w-full py-2 bg-white text-primary-700 hover:bg-primary-50 rounded-lg font-bold text-sm transition-colors shadow-sm">
                  Enterpriseへアップグレード
                </button>
              ) : (
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold text-sm transition-colors">
                  プラン設定の管理
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FolderKanban className="text-primary-500" />
              プロジェクト一覧
            </h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md shadow-primary-600/20"
            >
              <Plus size={18} />
              新規作成
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => {
              const gradients = [
                'from-blue-500 to-primary-600',
                'from-emerald-400 to-teal-500',
                'from-purple-500 to-pink-600',
                'from-amber-400 to-orange-500'
              ];
              const bgGradient = gradients[idx % gradients.length];

              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group overflow-hidden relative"
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${bgGradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${bgGradient} text-white shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDuplicate(e, project.id)}
                      disabled={isProcessing === project.id}
                      title="プロジェクトを複製"
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, project.id, project.name)}
                      disabled={isProcessing === project.id}
                      title="プロジェクトを削除"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors pr-12 truncate">
                    {project.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {project.description || '説明なし'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-bold">
                      開く 
                      <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    {isProcessing === project.id && (
                      <span className="text-xs text-primary-500 animate-pulse font-medium">処理中...</span>
                    )}
                  </div>
                </button>
              );
            })}

            {!isCreating && projects.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">プロジェクトがありません</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  最初のプロジェクトを作成して、KPIツリーの構築を始めましょう。
                </p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-bold inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  新規プロジェクト作成
                </button>
              </div>
            )}
          </div>
        </div>
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
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">説明 (任意)</label>
                <input
                  type="text"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="例：2026年度の全社オムニチャネル指標"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  作成して始める
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
