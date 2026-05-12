"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2, Globe, Sparkles, Loader2, Landmark, TrendingUp, Users2, Cpu, Swords, ShieldAlert, Replace, Truck, ShoppingCart, Gem, Star, Lock, LayoutTemplate } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { organizations, currentOrgId, updateOrganizationName, updateOrganizationMvv, isLoading } = useOrgStore();
  
  const [orgName, setOrgName] = useState('');
  const [masterMvv, setMasterMvv] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name);
      setMasterMvv(currentOrg.masterMvv || '');
      setCompanyUrl(currentOrg.companyUrl || '');
    }
  }, [currentOrg]);

  if (isLoading || !currentOrg) {
    return (
      <div className="min-h-screen bg-clean-canvas dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-strategic-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-logic-slate dark:text-slate-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  const { updateOrganizationFrameworks } = useOrgStore();

  const handleAnalyze = async () => {
    if (!companyUrl || !currentOrgId) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/generate-org-frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: companyUrl, companyName: orgName, masterMvv })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || '分析に失敗しました');

      await updateOrganizationFrameworks(currentOrgId, {
        companyUrl,
        pest: data.pest,
        fiveForces: data.fiveForces,
        vrio: data.vrio,
        industry: data.industry,
        lastCrawledAt: Date.now(),
        requiresStrategyReview: false
      });
      alert('マクロ環境のAI分析と保存が完了しました');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !currentOrgId) return;
    
    setIsSaving(true);
    try {
      await updateOrganizationName(currentOrgId, orgName.trim());
      await updateOrganizationMvv(currentOrgId, masterMvv.trim());
      alert("組織設定を更新しました");
    } catch (error) {
      console.error("Failed to update organization settings:", error);
      alert("組織設定の更新に失敗しました");
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
    <OrgLayout>
      <div className="min-h-screen bg-clean-canvas dark:bg-slate-900 text-oxford-navy dark:text-slate-200 font-sans p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Settings className="text-slate-400" />
            組織設定
          </h1>
          <p className="text-logic-slate dark:text-slate-400 mt-2">
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
            <form onSubmit={handleSave} className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  組織名
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Master MVV（組織全体のミッション・ビジョン・バリュー・制約条件）
                </label>
                <p className="text-xs text-logic-slate dark:text-slate-400 mb-2">
                  この組織配下で作成される全てのプロジェクト（部門KPIツリー）に、AIの推論時の「絶対的な制約・行動指針」として自動的に継承されます。
                </p>
                <textarea
                  value={masterMvv}
                  onChange={(e) => setMasterMvv(e.target.value)}
                  rows={6}
                  placeholder="例:&#13;&#10;【Mission】世界中の人々を笑顔にする&#13;&#10;【絶対の制約】短期的な利益のために顧客体験を犠牲にしてはならない。"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving || (orgName.trim() === currentOrg.name && masterMvv.trim() === (currentOrg.masterMvv || ''))}
                className="flex items-center gap-2 px-4 py-2 bg-strategic-teal hover:bg-strategic-teal disabled:opacity-50 disabled:hover:bg-strategic-teal text-white rounded-lg font-medium transition-colors"
              >
                <Save size={18} />
                {isSaving ? "保存中..." : "変更を保存"}
              </button>
            </form>
          </div>
        </section>

        {/* マクロ環境分析（羅針盤層） */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Globe size={20} className="text-blue-500" />
              マクロ環境分析 (AI推論)
            </h2>
            <p className="text-sm text-logic-slate dark:text-slate-400 mt-2">
              企業のURLを入力すると、AIがWebサイトをクローリングし、マクロ環境（PEST, 5Forces, VRIO）を自動推論します。
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4 items-end max-w-2xl">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  企業サイトURL
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !companyUrl}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-oxford-navy to-strategic-teal hover:from-oxford-navy hover:to-strategic-teal disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-sm"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isAnalyzing ? "分析中..." : "AI分析を実行"}
              </button>
            </div>

            {currentOrg.pest && (() => {
              const parseFramework = (dataStr: string | undefined) => {
                if (!dataStr) return null;
                try {
                  const parsed = JSON.parse(dataStr);
                  return typeof parsed === 'object' && parsed !== null ? parsed : { raw: dataStr };
                } catch (e) {
                  return { raw: dataStr };
                }
              };

              const pest = parseFramework(currentOrg.pest);
              const fiveForces = parseFramework(currentOrg.fiveForces);
              const vrio = parseFramework(currentOrg.vrio);

              return (
                <div className="mt-10 space-y-12">
                  {/* PEST Analysis */}
                  <div>
                    <h3 className="font-extrabold text-lg text-oxford-navy dark:text-slate-200 mb-4 flex items-center gap-2 border-b-2 border-strategic-teal pb-2 inline-flex">
                      PEST分析 <span className="text-sm font-normal text-logic-slate dark:text-slate-400 ml-2">マクロ環境</span>
                    </h3>
                    {pest?.raw ? (
                      <div className="bg-clean-canvas dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {pest.raw}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold mb-3"><Landmark size={18}/> Politics (政治)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.politics}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <div className="flex items-center gap-2 text-strategic-teal dark:text-blue-400 font-bold mb-3"><TrendingUp size={18}/> Economy (経済)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.economy}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-3"><Users2 size={18}/> Society (社会)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.society}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold mb-3"><Cpu size={18}/> Technology (技術)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.technology}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5 Forces Analysis */}
                  <div>
                    <h3 className="font-extrabold text-lg text-oxford-navy dark:text-slate-200 mb-4 flex items-center gap-2 border-b-2 border-strategic-teal pb-2 inline-flex">
                      5フォース分析 <span className="text-sm font-normal text-logic-slate dark:text-slate-400 ml-2">業界構造</span>
                    </h3>
                    {fiveForces?.raw ? (
                      <div className="bg-clean-canvas dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {fiveForces.raw}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-start-2 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-center relative z-10 shadow-sm">
                          <div className="flex items-center justify-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold mb-2"><ShieldAlert size={16}/> 新規参入の脅威</div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{fiveForces?.newEntrants}</p>
                        </div>
                        
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-clean-canvas dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2"><Truck size={16}/> 売り手の交渉力</div>
                            <p className="text-xs text-logic-slate dark:text-slate-400">{fiveForces?.suppliers}</p>
                          </div>
                          <div className="bg-slate-800 dark:bg-slate-700 text-white p-5 rounded-xl shadow-md border border-slate-700 transform scale-105 z-20 flex flex-col justify-center">
                            <div className="flex items-center justify-center gap-2 font-bold mb-3 text-center"><Swords size={20} className="text-amber-400"/> 既存企業間の敵対関係</div>
                            <p className="text-xs text-slate-200 text-center">{fiveForces?.rivalry}</p>
                          </div>
                          <div className="bg-clean-canvas dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2"><ShoppingCart size={16}/> 買い手の交渉力</div>
                            <p className="text-xs text-logic-slate dark:text-slate-400">{fiveForces?.buyers}</p>
                          </div>
                        </div>

                        <div className="md:col-start-2 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-center relative z-10 shadow-sm">
                          <div className="flex items-center justify-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold mb-2"><Replace size={16}/> 代替品の脅威</div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{fiveForces?.substitutes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VRIO Analysis */}
                  <div>
                    <h3 className="font-extrabold text-lg text-oxford-navy dark:text-slate-200 mb-4 flex items-center gap-2 border-b-2 border-teal-500 pb-2 inline-flex">
                      VRIO分析 <span className="text-sm font-normal text-logic-slate dark:text-slate-400 ml-2">競争優位性</span>
                    </h3>
                    {vrio?.raw ? (
                      <div className="bg-clean-canvas dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {vrio.raw}
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-amber-400 shadow-sm">
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-2"><Gem size={16}/> Value <span className="text-xs font-normal text-slate-400">(経済的価値)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.value}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-rose-400 shadow-sm">
                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold mb-2"><Star size={16}/> Rarity <span className="text-xs font-normal text-slate-400">(希少性)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.rarity}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-purple-400 shadow-sm">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mb-2"><Lock size={16}/> Imitability <span className="text-xs font-normal text-slate-400">(模倣困難性)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.imitability}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-blue-400 shadow-sm">
                          <div className="flex items-center gap-2 text-strategic-teal dark:text-blue-400 font-bold mb-2"><LayoutTemplate size={16}/> Organization <span className="text-xs font-normal text-slate-400">(組織)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.organization}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* 2. Members & Invites */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-emerald-500" />
              メンバー管理
            </h2>
            <div className="bg-clean-canvas dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-medium">
              {currentOrg.members?.length || 1} 人のメンバー
            </div>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Invite Link */}
            <div className="bg-clean-canvas dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <LinkIcon size={16} />
                招待リンク
              </h3>
              <p className="text-xs text-logic-slate dark:text-slate-400 mb-3">
                このリンクを共有することで、他のユーザーをこの組織に招待できます。
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-logic-slate dark:text-slate-400 truncate select-all">
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
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-strategic-teal rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {member.userId.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{member.userId === user?.uid ? "あなた" : "ユーザー"}</div>
                        <div className="text-xs text-logic-slate dark:text-slate-400">UID: {member.userId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'admin' ? 'bg-primary-100 text-strategic-teal dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
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
    </OrgLayout>
  );
}
