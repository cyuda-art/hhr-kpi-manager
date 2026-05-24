"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Lock, Mail, ArrowRight, Network } from 'lucide-react';
import { AmbientSky } from '@/components/layout/AmbientSky';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      const userId = auth.currentUser?.uid;
      if (userId) {
        await useOrgStore.getState().initializeOrgs(userId);
        const { organizations, currentOrgId } = useOrgStore.getState();
        
        if (currentOrgId) {
          router.push(`/${currentOrgId}/dashboard`);
        } else if (organizations.length > 0) {
          router.push(`/${organizations[0].id}/dashboard`);
        } else {
          router.push('/org-setup');
        }
      } else {
        router.push('/org-setup');
      }
    } catch (err: any) {
      setError(err.message || '認証に失敗しました');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      
      const userId = auth.currentUser?.uid;
      if (userId) {
        await useOrgStore.getState().initializeOrgs(userId);
        const { organizations, currentOrgId } = useOrgStore.getState();
        
        if (currentOrgId) {
          router.push(`/${currentOrgId}/dashboard`);
        } else if (organizations.length > 0) {
          router.push(`/${organizations[0].id}/dashboard`);
        } else {
          router.push('/org-setup');
        }
      } else {
        router.push('/org-setup');
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(`Googleログインに失敗しました: ${err.message || err.toString()}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-strategic-teal/30 overflow-x-hidden text-oxford-navy dark:text-slate-200">
      {/* 空間背景を常に敷き詰める */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientSky />
      </div>

      <div className="absolute top-6 left-6 z-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-logic-slate dark:text-slate-400 hover:text-oxford-navy dark:hover:text-white text-sm font-bold transition-colors font-poppins tracking-widest">
          <ArrowRight className="w-4 h-4 rotate-180" />
          BACK TO TOP
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="max-w-md w-full bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-sm shadow-2xl overflow-hidden border border-white/50 dark:border-white/10">
        
        {/* ヘッダー部分 */}
        <div className="bg-white/20 dark:bg-black/20 p-8 text-center border-b border-white/50 dark:border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-strategic-teal/10 blur-2xl rounded-full"></div>
          <div className="w-14 h-14 border border-strategic-teal/50 rounded-sm flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative z-10 bg-white/5">
            <Network className="w-6 h-6 text-strategic-teal" />
          </div>
          <h1 className="text-2xl font-black text-oxford-navy dark:text-white mb-2 font-poppins tracking-wider relative z-10">Gnu.Done</h1>
          <p className="text-strategic-teal text-xs font-bold tracking-widest font-poppins relative z-10">NEXT-GEN STRATEGY PLATFORM</p>
        </div>

        {/* フォーム部分 */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-oxford-navy dark:text-white mb-6 text-center font-poppins tracking-tight">
            {isRegister ? 'CREATE ACCOUNT' : 'LOG IN'}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-sm border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-logic-slate dark:text-slate-400 mb-2 font-poppins tracking-widest">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-white/50 dark:border-white/20 rounded-sm focus:outline-none focus:border-strategic-teal transition-colors text-sm text-oxford-navy dark:text-white"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-logic-slate dark:text-slate-400 mb-2 font-poppins tracking-widest">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-white/50 dark:border-white/20 rounded-sm focus:outline-none focus:border-strategic-teal transition-colors text-sm text-oxford-navy dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-strategic-teal hover:bg-strategic-teal/90 text-white py-3 rounded-sm font-bold text-xs tracking-widest font-poppins transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? 'PROCESSING...' : (isRegister ? 'SIGN UP' : 'CONTINUE')}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <hr className="w-full border-white/50 dark:border-white/10" />
            <span className="px-4 text-[10px] text-slate-500 dark:text-slate-400 font-poppins tracking-widest uppercase">or</span>
            <hr className="w-full border-white/50 dark:border-white/10" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-white/50 dark:bg-black/50 hover:bg-white/60 dark:hover:bg-black/60 backdrop-blur-sm text-oxford-navy dark:text-slate-300 py-3 border border-white/50 dark:border-white/20 rounded-sm font-bold text-xs tracking-widest font-poppins transition-colors shadow-sm"
          >
            CONTINUE WITH GOOGLE
          </button>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-strategic-teal hover:text-strategic-teal/70 font-bold tracking-wide transition-colors font-lato"
            >
              {isRegister ? 'Already have an account? Log in' : 'New to Gnu.Done? Sign up here'}
            </button>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
