"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Users, LogIn, ArrowRight } from 'lucide-react';
import { AmbientSky } from '@/components/layout/AmbientSky';

export default function InviteOrgPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;
  
  const { user } = useAuthStore();
  const { joinOrganization, setCurrentOrgId } = useOrgStore();
  
  const [orgName, setOrgName] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 組織情報を取得
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await fetch(`/api/organizations/${orgId}`);
        if (res.ok) {
          const data = await res.json();
          setOrgName(data.name);
        } else {
          setError("組織が見つかりません。リンクが無効か、削除された可能性があります。");
        }
      } catch (err) {
        console.error(err);
        setError("組織情報の取得に失敗しました。");
      }
    };
    if (orgId) {
      fetchOrg();
    }
  }, [orgId]);

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsJoining(true);
    try {
      await joinOrganization(orgId, user.uid);
      router.push('/');
    } catch (err) {
      console.error(err);
      setError("組織への参加に失敗しました。");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors text-oxford-navy dark:text-slate-200">
      {/* 空間背景を常に敷き詰める */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientSky />
      </div>

      <div className="max-w-md w-full bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-white/10 relative z-10">
        <div className="p-8 text-center border-b border-white/50 dark:border-white/10">
          <div className="w-16 h-16 bg-white/50 dark:bg-black/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/50 dark:border-white/20">
            <Users className="w-8 h-8 text-strategic-teal dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-black text-oxford-navy dark:text-white mb-2">組織への招待</h1>
          <p className="text-logic-slate dark:text-slate-300 text-sm">
            以下のビジネス組織に招待されています
          </p>
        </div>

        <div className="p-8 text-center">
          {error ? (
            <div className="text-red-500 font-medium mb-6">{error}</div>
          ) : (
            <>
              <div className="mb-8">
                <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl text-xl font-black text-strategic-teal dark:text-white border border-white/50 dark:border-white/20 shadow-sm">
                  {orgName || '読み込み中...'}
                </div>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-logic-slate dark:text-slate-400">
                    参加するにはログインまたはアカウント登録が必要です。
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2 bg-strategic-teal hover:bg-strategic-teal text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-primary-600/30"
                  >
                    <LogIn className="w-5 h-5" />
                    ログインして参加
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isJoining || !orgName}
                  className="w-full flex items-center justify-center gap-2 bg-strategic-teal hover:bg-strategic-teal text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/30 disabled:opacity-50"
                >
                  {isJoining ? '参加処理中...' : 'この組織に参加する'}
                  {!isJoining && <ArrowRight className="w-5 h-5" />}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
