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
      router.push('/onboarding');
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center dark:text-white">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">プロジェクト選択</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">作業するプロジェクトを選択するか、新しく作成してください</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            新規プロジェクト
          </button>
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
