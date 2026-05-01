"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Building2, Plus, ArrowRight, FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

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
      router.push('/');
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">プロジェクト一覧</h1>
            <p className="text-slate-500 mt-1">管理するKPIツリーのプロジェクトを選択してください</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            <span>新規プロジェクト</span>
          </button>
        </div>

        {isCreating ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4">新しいプロジェクトを作成</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">プロジェクト名</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例：株式会社HHRグループ KPI"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">説明 (任意)</label>
                <input
                  type="text"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="例：2026年度の全社オムニチャネル指標"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelectProject(project.id)}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <FolderKanban className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                {project.description || '説明なし'}
              </p>
              <div className="flex items-center text-sm text-indigo-600 font-medium">
                開く <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}

          {!isCreating && projects.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">プロジェクトがありません</h3>
              <p className="text-slate-500 mb-4">右上のボタンから最初のプロジェクトを作成してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
