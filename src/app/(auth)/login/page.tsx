"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { Lock, Mail, ArrowRight, Building2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';

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
      router.push('/onboarding'); // 成功したらチャットオンボーディングへ
    } catch (err: any) {
      setError(err.message || '認証に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      router.push('/onboarding');
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(`Googleログインに失敗しました: ${err.message || err.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* ヘッダー部分 */}
        <div className="bg-primary-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">HHR KPI MANAGER</h1>
          <p className="text-primary-100 text-sm">次世代オムニチャネル経営基盤</p>
        </div>

        {/* フォーム部分 */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isRegister ? '新しいアカウントを作成' : 'アカウントにログイン'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? '処理中...' : (isRegister ? '登録する' : 'ログイン')}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <hr className="w-full border-slate-200" />
            <span className="px-4 text-sm text-slate-400 bg-white">または</span>
            <hr className="w-full border-slate-200" />
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-2.5 border border-slate-200 rounded-lg font-medium transition-colors"
          >
            Googleでログイン
          </button>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              {isRegister ? 'すでにアカウントをお持ちの方はこちら' : '初めてご利用の方はこちらから登録'}
            </button>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
