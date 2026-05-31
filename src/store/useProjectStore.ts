import { create } from 'zustand';
import { Project } from '@/types/project';

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  initializeProjects: (orgId: string) => () => void;
  setCurrentProjectId: (id: string | null) => void;
  createProject: (name: string, description: string, userId: string, orgId: string, extraData?: Partial<Project>) => Promise<string>;
  deleteProject: (projectId: string, orgId: string) => Promise<void>;
  duplicateProject: (projectId: string, userId: string, orgId: string) => Promise<string>;
  joinProject: (projectId: string, userId: string, orgId: string) => Promise<void>;
  updateProject: (projectId: string, orgId: string, data: Partial<Project>) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),

  initializeProjects: (orgId: string) => {
    set({ isLoading: true });
    
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: {
            'x-organization-id': orgId
          }
        });
        const data = await res.json();
        if (res.ok && data.projects) {
          const mappedProjects: Project[] = data.projects.map((p: Project & { ownerId?: string }) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            ownerId: p.ownerId || 'admin',
            members: [p.ownerId || 'admin'],
            createdAt: new Date(p.createdAt).getTime(),
          }));
          set({ projects: mappedProjects, isLoading: false });
        } else {
          throw new Error(data.error || 'API Error');
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
        set({ projects: [], isLoading: false });
      }
    };

    fetchProjects();

    // クリーンアップ関数（モック）
    return () => {};
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  createProject: async (name, description, userId, orgId, extraData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, organizationId: orgId })
      });
      
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      const newProject: Project = {
        id: data.project.id,
        name: data.project.name,
        description: data.project.description || '',
        ownerId: userId,
        members: [userId],
        createdAt: new Date(data.project.createdAt).getTime(),
        ...extraData,
      };

      set(state => ({ projects: [newProject, ...state.projects] }));
      return newProject.id;
    } catch (error) {
      console.error("Failed to create project", error);
      throw error;
    }
  },

  deleteProject: async (projectId: string, orgId: string) => {
    try {


      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId)
      }));
      
      const { currentProjectId, setCurrentProjectId } = get();
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },

  duplicateProject: async (projectId: string, userId: string, orgId: string) => {
    try {
      // 1. 元プロジェクト情報をローカルのstateから探すか、API経由で取得
      const original = get().projects.find(p => p.id === projectId);
      if (!original) throw new Error("Project not found in store");

      // 2. 新しいプロジェクトを複製名で作成
      const newProjectId = await get().createProject(
        `${original.name} のコピー`,
        original.description || '',
        userId,
        orgId
      );

      // 3. 元のKPIデータとタスクデータを取得
      const resNodes = await fetch(`/api/projects/${projectId}/nodes`);
      if (resNodes.ok) {
        const data = await resNodes.json();
        // 取得したデータを新しいプロジェクトID配下で保存
        if (data.kpiData) {
          // ノードのIDをすべて新規のIDにマッピングし直す（主キー重複回避）
          const oldToNewIdMap: Record<string, string> = {};
          const newKpiData: Record<string, import('@/types').KpiNodeData> = {};

          Object.keys(data.kpiData).forEach(oldId => {
            const newId = Math.random().toString(36).substr(2, 9);
            oldToNewIdMap[oldId] = newId;
          });

          Object.keys(data.kpiData).forEach(oldId => {
            const node = data.kpiData[oldId];
            const newId = oldToNewIdMap[oldId];
            newKpiData[newId] = {
              ...node,
              id: newId,
              parentId: node.parentId ? (oldToNewIdMap[node.parentId] || null) : null
            };
          });

          const newActions = (data.actions || []).map((act: import('@/types').Action) => ({
            ...act,
            id: Math.random().toString(36).substr(2, 9),
            kpiId: oldToNewIdMap[act.kpiId] || act.kpiId
          }));

          // コピー先プロジェクトに保存
          await fetch(`/api/projects/${newProjectId}/kpi-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              kpiData: newKpiData,
              actions: newActions
            })
          });
        }
      }

      return newProjectId;
    } catch (error) {
      console.error("Error duplicating project:", error);
      throw error;
    }
  },

  joinProject: async (_projectId: string, _userId: string, _orgId: string) => {
    // PostgreSQL / Prismaモデルでは組織内の全プロジェクトが全ユーザーに紐付くため、joinはダミー処理とする
    return Promise.resolve();
  },

  updateProject: async (projectId: string, orgId: string, data: Partial<Project>) => {
    try {


      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      set(state => ({
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...data } : p)
      }));
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }
}));
