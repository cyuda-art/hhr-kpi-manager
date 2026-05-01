import { create } from 'zustand';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Project } from '@/types/project';

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  initializeProjects: (userId: string) => () => void;
  setCurrentProjectId: (id: string | null) => void;
  createProject: (name: string, description: string, userId: string) => Promise<string>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: true,

  initializeProjects: (userId: string) => {
    set({ isLoading: true });
    // ユーザーがオーナーのプロジェクトを取得（※将来的に共有機能をつけるならwhere句を広げる）
    const q = query(collection(db, 'projects'), where('ownerId', '==', userId));
    
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

  createProject: async (name, description, userId) => {
    const newProjectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      id: newProjectId,
      name,
      description,
      ownerId: userId,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'projects', newProjectId), newProject);
    return newProjectId;
  }
}));
