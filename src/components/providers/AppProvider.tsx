"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useKpiStore } from '@/store/useKpiStore';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, initializeAuth } = useAuthStore();
  const { initializeOrgs } = useOrgStore();
  const { currentProjectId } = useProjectStore();
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

  // 3. プロジェクトが選択されている場合、DB（KPI/KFC）を初期化
  useEffect(() => {
    if (user && currentProjectId) {
      initializeDB(currentProjectId);
    }
  }, [user, currentProjectId, initializeDB]);

  return <>{children}</>;
};
