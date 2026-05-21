"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';

export const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { currentOrgId, organizations, isLoading: isOrgLoading } = useOrgStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      setIsRedirecting(true);
      // Wait for org to be loaded if not already
      if (!isOrgLoading) {
        if (currentOrgId) {
          router.push(`/${currentOrgId}/dashboard`);
        } else if (organizations.length > 0) {
          router.push(`/${organizations[0].id}/dashboard`);
        } else {
          router.push('/org-setup');
        }
      }
    }
  }, [user, isAuthLoading, currentOrgId, organizations, isOrgLoading, router]);

  if (isAuthLoading || (user && (isOrgLoading || isRedirecting))) {
    return <div className="min-h-screen bg-clean-canvas dark:bg-[#000a1f] flex items-center justify-center font-bold text-strategic-teal tracking-widest text-sm">AUTHENTICATING...</div>;
  }

  return <>{children}</>;
};
