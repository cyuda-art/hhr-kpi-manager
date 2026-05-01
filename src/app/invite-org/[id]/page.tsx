"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Users, LogIn, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
        const docRef = doc(db, 'organizations', orgId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrgName(docSnap.data().name);
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
      router.push('/projects');
    } catch (err) {
      console.error(err);
      setError("組織への参加に失敗しました。");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-slate-800/50 relative z-10">
        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">組織への招待</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            以下のビジネス組織に招待されています
          </p>
        </div>

        <div className="p-8 text-center">
          {error ? (
            <div className="text-red-500 font-medium mb-6">{error}</div>
          ) : (
            <>
              <div className="mb-8">
                <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-xl font-black text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                  {orgName || '読み込み中...'}
                </div>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    参加するにはログインまたはアカウント登録が必要です。
                  </p>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    <LogIn className="w-5 h-5" />
                    ログインして参加
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isJoining || !orgName}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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
