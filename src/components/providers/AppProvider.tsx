"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useKpiStore } from '@/store/useKpiStore';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, initializeAuth } = useAuthStore();
  const { initializeOrgs, currentOrgId, isLoading: isOrgLoading } = useOrgStore();
  const { currentProjectId, initializeProjects, setIsLoading: setProjectLoading } = useProjectStore();
  const { initializeDB } = useKpiStore();

  // 1. Firebase Authの初期化（未ログイン・ログイン済みの判定）
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  // 2. ユーザーが存在する場合、所属する組織リストをロード
  useEffect(() => {
    if (user) {
      const unsubscribeOrgs = initializeOrgs(user.uid);
      return () => unsubscribeOrgs();
    }
  }, [user, initializeOrgs]);

  // 2.5 組織が選択されている場合、プロジェクトリストをロード。無い場合はローディング解除
  useEffect(() => {
    if (user) {
      if (currentOrgId) {
        const unsubscribeProjects = initializeProjects(currentOrgId);
        return () => unsubscribeProjects();
      } else if (!isOrgLoading) {
        setProjectLoading(false);
      }
    }
  }, [user, currentOrgId, isOrgLoading, initializeProjects, setProjectLoading]);

  // 3. プロジェクトが選択されている場合、DB（KPI/KSF）を初期化
  useEffect(() => {
    if (user && currentProjectId && currentOrgId) {
      initializeDB(currentProjectId, currentOrgId);
    }
  }, [user, currentProjectId, currentOrgId, initializeDB]);

  return <>{children}</>;
};
