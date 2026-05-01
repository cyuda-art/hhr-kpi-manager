"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Building2, Link2, LogIn, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const { user } = useAuthStore();
  const { joinProject, setCurrentProjectId } = useProjectStore();
  
  const [projectName, setProjectName] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プロジェクト情報を取得
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProjectName(docSnap.data().name);
        } else {
          setError("プロジェクトが見つかりません。リンクが無効か、削除された可能性があります。");
        }
      } catch (err) {
        console.error(err);
        setError("プロジェクト情報の取得に失敗しました。");
      }
    };
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleJoin = async () => {
    if (!user) {
      // ログインしていなければログイン画面へ
      router.push('/login');
      return;
    }

    setIsJoining(true);
    try {
      await joinProject(projectId, user.uid);
      setCurrentProjectId(projectId);
      router.push('/');
    } catch (err) {
      console.error(err);
      setError("プロジェクトへの参加に失敗しました。");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[120%] bg-white/10 rounded-full blur-[50px] pointer-events-none" />
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative z-10">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 relative z-10">プロジェクトへの招待</h1>
        </div>

        <div className="p-8 text-center">
          {error ? (
            <div className="text-red-500 font-medium mb-6">{error}</div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">以下のプロジェクトに招待されています</p>
                <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-800 dark:text-slate-100">
                  <Link2 className="w-5 h-5 text-indigo-500" />
                  {projectName || '読み込み中...'}
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
                  disabled={isJoining || !projectName}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isJoining ? '参加処理中...' : 'プロジェクトに参加する'}
                  {!isJoining && <ArrowRight className="w-5 h-5" />}
                </button>
              )}
            </>
          )}

          <div className="mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
            >
              ダッシュボードへ戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
