"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOrgStore } from "@/store/useOrgStore";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orgId = params.orgId as string;
  const { currentOrgId, setCurrentOrgId, organizations, isLoading } = useOrgStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    
    // URLのorgIdとZustandのstateを同期
    if (orgId && currentOrgId !== orgId) {
      setCurrentOrgId(orgId);
    }
    
    // 組織が存在しない場合はエラー画面など（今回は単純化のためそのまま進める）
  }, [orgId, currentOrgId, isLoading, setCurrentOrgId]);

  return (
    <AuthGuard>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
