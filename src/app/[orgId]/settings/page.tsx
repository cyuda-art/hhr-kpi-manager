"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { organizations, currentOrgId, updateOrganizationName, isLoading } = useOrgStore();
  
  const [orgName, setOrgName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name);
    }
  }, [currentOrg]);

  if (isLoading || !currentOrg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !currentOrgId) return;
    
    setIsSaving(true);
    try {
      await updateOrganizationName(currentOrgId, orgName.trim());
      // 成功のフィードバック表示などは省略
    } catch (error) {
      console.error("Failed to update organization name:", error);
      alert("組織名の更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite-org/${currentOrgId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Settings className="text-slate-400" />
            組織設定
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            組織の基本情報やメンバーの管理を行います。
          </p>
        </div>

        {/* 1. General Settings */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 size={20} className="text-primary-500" />
              基本情報
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSave} className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  組織名
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSaving || orgName.trim() === currentOrg.name}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                <Save size={18} />
                {isSaving ? "保存中..." : "変更を保存"}
              </button>
            </form>
          </div>
        </section>

        {/* 2. Members & Invites */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-emerald-500" />
              メンバー管理
            </h2>
            <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-medium">
              {currentOrg.members?.length || 1} 人のメンバー
            </div>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Invite Link */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <LinkIcon size={16} />
                招待リンク
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                このリンクを共有することで、他のユーザーをこの組織に招待できます。
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 truncate select-all">
                  {inviteLink}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? (
                    <><Check size={16} className="text-emerald-500" /> コピー完了</>
                  ) : (
                    <><Copy size={16} /> コピー</>
                  )}
                </button>
              </div>
            </div>

            {/* Member List */}
            <div>
              <h3 className="text-sm font-bold mb-3">現在のメンバー</h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {currentOrg.members?.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {member.userId.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{member.userId === user?.uid ? "あなた" : "ユーザー"}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">UID: {member.userId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {member.role === 'admin' ? '管理者' : 'メンバー'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
