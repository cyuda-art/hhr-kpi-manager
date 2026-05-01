"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Users, Shield, Link2, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { organizations, currentOrgId } = useOrgStore();
  const { projects } = useProjectStore();
  
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'projects'>('members');

  const currentOrg = organizations.find(org => org.id === currentOrgId);

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
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          メンバー管理
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-4 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'projects' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          プロジェクト権限設定
        </button>
      </div>

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  組織メンバー ({currentOrg.members.length}名)
                </h2>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentOrg.members.map((member, idx) => (
                  <li key={idx} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
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
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                新しいメンバーを招待
              </h3>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mb-6">
                招待リンクをコピーして、チームメンバーに共有してください。リンクから参加したユーザーは初期権限として「Viewer」になります。
              </p>
              <button
                onClick={handleCopyInviteLink}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
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
    </div>
  );
}
