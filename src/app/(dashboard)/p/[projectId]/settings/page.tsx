"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Users, Shield, Link2, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { organizations, currentOrgId } = useOrgStore();
  const { projects } = useProjectStore();
  
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'theme'>('members');

  const currentOrg = organizations.find(org => org.id === currentOrgId);
  const { themeColor, setThemeColor } = useLayoutStore();

  const themes = [
    { id: 'indigo', name: 'デフォルト (Indigo)', colors: ['#eef2ff', '#a5b4fc', '#6366f1', '#3730a3'] },
    { id: 'ocean', name: 'オーシャン (Cyan/Blue)', colors: ['#ecfeff', '#67e8f9', '#06b6d4', '#155e75'] },
    { id: 'forest', name: 'フォレスト (Emerald)', colors: ['#ecfdf5', '#6ee7b7', '#10b981', '#065f46'] },
    { id: 'sunset', name: 'サンセット (Rose/Orange)', colors: ['#fff1f2', '#fda4af', '#f43f5e', '#9f1239'] },
    { id: 'midnight', name: 'ミッドナイト (Fuchsia)', colors: ['#fdf4ff', '#f0abfc', '#d946ef', '#86198f'] },
  ];

  const handleCopyInviteLink = () => {
    if (!currentOrgId) return;
    const url = `${window.location.origin}/invite-org/${currentOrgId}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!currentOrg) {
    return <div className="p-8">組織情報を読み込み中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">組織設定</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">「{currentOrg.name}」のメンバーと権限を管理します</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'members' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          メンバー管理
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'projects' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          プロジェクト権限設定
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'theme' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          テーマカラー
        </button>
      </div>

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  組織メンバー ({currentOrg.members.length}名)
                </h2>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentOrg.members.map((member, idx) => (
                  <li key={idx} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                        {member.userId === user?.uid ? 'You' : 'M'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {member.userId === user?.uid ? 'あなた' : `User (${member.userId.substring(0, 8)}...)`}
                        </p>
                        <p className="text-xs text-slate-500">参加日: {new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${member.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                        {member.role.toUpperCase()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800/50">
              <h3 className="font-bold text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                新しいメンバーを招待
              </h3>
              <p className="text-sm text-primary-700/80 dark:text-primary-300/80 mb-6">
                招待リンクをコピーして、チームメンバーに共有してください。リンクから参加したユーザーは初期権限として「Viewer」になります。
              </p>
              <button
                onClick={handleCopyInviteLink}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/30"
              >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                {isCopied ? 'コピー完了！' : '招待リンクをコピー'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">プロジェクト単位の詳細権限設定</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            現在、組織メンバー全員がすべてのプロジェクトにアクセス可能です。
            特定のメンバーのみをプロジェクトに割り当てる機能（RBAC）は、今後のアップデートで提供されます。
          </p>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">テーマカラーを選択</h2>
              <p className="text-xs text-slate-500 mt-1">Colorion風のカラーパレットからお好みのスタイルを選択してください。</p>
            </div>
            <div className="p-6 space-y-6">
              {themes.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => setThemeColor(theme.id)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    themeColor === theme.id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {theme.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{theme.name}</span>
                  </div>
                  {themeColor === theme.id && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">プレビュー</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                  <h4 className="text-primary-800 dark:text-primary-200 font-bold text-sm mb-1">プライマリー背景</h4>
                  <p className="text-primary-600 dark:text-primary-400 text-xs">テキストの視認性を確認します。</p>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-primary-500/30">
                    メインボタン
                  </button>
                  <button className="px-4 py-2 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-lg font-bold text-sm transition-colors">
                    サブボタン
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">達成率</span>
                    <span className="text-primary-600 dark:text-primary-400 font-bold">75%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
