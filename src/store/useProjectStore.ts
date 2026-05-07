import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, deleteDoc, updateDoc, arrayUnion, onSnapshot, query, where, or } from 'firebase/firestore';
import { Project } from '@/types/project';

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  initializeProjects: (orgId: string) => () => void;
  setCurrentProjectId: (id: string | null) => void;
  createProject: (name: string, description: string, userId: string, orgId: string) => Promise<string>;
  deleteProject: (projectId: string, orgId: string) => Promise<void>;
  duplicateProject: (projectId: string, userId: string, orgId: string) => Promise<string>;
  joinProject: (projectId: string, userId: string, orgId: string) => Promise<void>;
  updateProject: (projectId: string, orgId: string, data: Partial<Project>) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: true,

  initializeProjects: (orgId: string) => {
    set({ isLoading: true });
    // 組織内のプロジェクトを全取得（セキュリティルールで組織メンバーのみアクセス可能にする前提）
    const q = query(collection(db, 'organizations', orgId, 'projects'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((doc) => {
        projects.push(doc.data() as Project);
      });
      set({ projects, isLoading: false });
    });

    return unsubscribe;
  },

  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  createProject: async (name, description, userId, orgId) => {
    const newProjectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      id: newProjectId,
      name,
      description,
      ownerId: userId,
      members: [userId], // 作成者もメンバーに含める
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'organizations', orgId, 'projects', newProjectId), newProject);
    return newProjectId;
  },

  deleteProject: async (projectId: string, orgId: string) => {
    try {
      // 1. KPIデータの削除
      await deleteDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'kpiData', 'main'));
      // 2. プロジェクト自体の削除
      await deleteDoc(doc(db, 'organizations', orgId, 'projects', projectId));
      
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
      // 1. 元プロジェクトの情報を取得
      const projectDoc = await getDoc(doc(db, 'organizations', orgId, 'projects', projectId));
      if (!projectDoc.exists()) throw new Error("Project not found");
      const originalProject = projectDoc.data() as Project;

      // 2. 新しいプロジェクトを作成
      const newProjectId = Math.random().toString(36).substr(2, 9);
      const newProject: Project = {
        ...originalProject,
        id: newProjectId,
        name: `${originalProject.name} のコピー`,
        ownerId: userId, // 複製した人がオーナーになる
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'organizations', orgId, 'projects', newProjectId), newProject);

      // 3. 元のKPIデータを取得してコピー
      const kpiDataDoc = await getDoc(doc(db, 'organizations', orgId, 'projects', projectId, 'kpiData', 'main'));
      if (kpiDataDoc.exists()) {
        await setDoc(doc(db, 'organizations', orgId, 'projects', newProjectId, 'kpiData', 'main'), kpiDataDoc.data());
      }

      return newProjectId;
    } catch (error) {
      console.error("Error duplicating project:", error);
      throw error;
    }
  },

  joinProject: async (projectId: string, userId: string, orgId: string) => {
    try {
      const projectRef = doc(db, 'organizations', orgId, 'projects', projectId);
      await updateDoc(projectRef, {
        members: arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error joining project:", error);
      throw error;
    }
  },

  updateProject: async (projectId: string, orgId: string, data: Partial<Project>) => {
    try {
      const projectRef = doc(db, 'organizations', orgId, 'projects', projectId);
      await updateDoc(projectRef, data);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }
}));
