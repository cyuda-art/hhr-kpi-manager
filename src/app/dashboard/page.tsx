"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Network } from 'lucide-react';

export default function DashboardRouter() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { currentOrgId, organizations, isLoading: isOrgLoading } = useOrgStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isAuthLoading || isOrgLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // 組織IDがあればプロジェクト一覧へ、なければ組織作成へ
    if (currentOrgId) {
      router.replace(`/${currentOrgId}/projects`);
    } else if (organizations.length > 0) {
      router.replace(`/${organizations[0].id}/projects`);
    } else {
      router.replace('/org-setup');
    }
  }, [mounted, isAuthLoading, isOrgLoading, user, currentOrgId, organizations, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border border-strategic-teal/50 rounded-sm flex items-center justify-center bg-white/5 animate-pulse">
          <Network className="w-6 h-6 text-strategic-teal" />
        </div>
        <div className="font-mono text-sm tracking-widest text-slate-400 animate-pulse">
          AUTHENTICATING...
        </div>
      </div>
    </div>
  );
}
