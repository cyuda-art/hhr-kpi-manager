import { create } from 'zustand';
import { Organization } from '@/types/organization';
import { useAuthStore } from './useAuthStore';

interface OrgStore {
  organizations: Organization[];
  currentOrgId: string | null;
  isLoading: boolean;
  initializeOrgs: (userId: string) => Promise<void>;
  setCurrentOrgId: (id: string | null) => void;
  createOrganization: (name: string, userId: string) => Promise<string>;
  joinOrganization: (orgId: string, userId: string) => Promise<void>;
  updateOrganizationName: (orgId: string, name: string) => Promise<void>;
  updateOrganizationSettings: (orgId: string, data: Partial<Organization>) => Promise<void>;
  updateOrganizationMvv: (orgId: string, masterMvv: string) => Promise<void>;
  updateOrganizationFrameworks: (orgId: string, data: Partial<Organization>) => Promise<void>;
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  organizations: [],
  currentOrgId: null,
  isLoading: true,

  initializeOrgs: async (userId: string) => {
    set({ isLoading: true });
    
    try {
      const res = await fetch(`/api/organizations?userId=${userId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      const orgs: Organization[] = data.organizations || [];
      const currentOrgId = get().currentOrgId;
      if (!currentOrgId && orgs.length > 0) {
        set({ currentOrgId: orgs[0].id });
      }
      
      set({ organizations: orgs, isLoading: false });
    } catch (error) {
      console.warn('Backend DB failed, falling back to LocalStorage', error);
      // Fallback to LocalStorage
      const localOrgs = JSON.parse(localStorage.getItem('hhr_mock_orgs') || '[]');
      const currentOrgId = get().currentOrgId;
      if (!currentOrgId && localOrgs.length > 0) {
        set({ currentOrgId: localOrgs[0].id });
      }
      set({ organizations: localOrgs, isLoading: false });
    }
  },

  setCurrentOrgId: (id) => set({ currentOrgId: id }),

  createOrganization: async (name, userId) => {
    try {
      const authUser = useAuthStore.getState().user;
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId, email: authUser?.email, userName: authUser?.displayName })
      });
      if (!res.ok) throw new Error('API Error');
      const newOrg = await res.json();
      
      set((state) => ({ organizations: [...state.organizations, newOrg], currentOrgId: newOrg.id }));
      return newOrg.id;
    } catch (error) {
      console.warn('Backend DB failed, saving to LocalStorage', error);
      const newOrg = { id: `mock-org-${Date.now()}`, name, createdAt: new Date().toISOString() } as unknown as Organization;
      const localOrgs = JSON.parse(localStorage.getItem('hhr_mock_orgs') || '[]');
      localOrgs.push(newOrg);
      localStorage.setItem('hhr_mock_orgs', JSON.stringify(localOrgs));
      set((state) => ({ organizations: localOrgs, currentOrgId: newOrg.id }));
      return newOrg.id;
    }
  },

  joinOrganization: async (orgId: string, userId: string) => {
    try {
      const authUser = useAuthStore.getState().user;
      const res = await fetch(`/api/organizations/${orgId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: authUser?.email,
          userName: authUser?.displayName
        })
      });
      if (!res.ok) throw new Error('Failed to join organization');
      
      // Refresh organization list
      await get().initializeOrgs(userId);
      set({ currentOrgId: orgId });
    } catch (error) {
      console.error("Error joining organization:", error);
      throw error;
    }
  },

  updateOrganizationName: async (orgId: string, name: string) => {
    await get().updateOrganizationSettings(orgId, { name });
  },

  updateOrganizationSettings: async (orgId: string, data: Partial<Organization>) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update organization settings');
      const updatedOrg = await res.json();
      
      set((state) => ({
        organizations: state.organizations.map(org => 
          org.id === orgId ? { ...org, ...updatedOrg } : org
        )
      }));
    } catch (error) {
      console.error("Error updating organization settings:", error);
      throw error;
    }
  },

  updateOrganizationMvv: async (orgId: string, masterMvv: string) => {
    await get().updateOrganizationSettings(orgId, { masterMvv });
  },

  updateOrganizationFrameworks: async (orgId: string, data: Partial<Organization>) => {
    await get().updateOrganizationSettings(orgId, data);
  }
}));
