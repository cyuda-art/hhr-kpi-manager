"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { AiLoadingOverlay } from '@/components/ui/AiLoadingOverlay';
import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2, Globe, Sparkles, Loader2, Landmark, TrendingUp, Users2, Cpu, Swords, ShieldAlert, Replace, Truck, ShoppingCart, Gem, Star, Lock, LayoutTemplate } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { organizations, currentOrgId, updateOrganizationSettings, isLoading } = useOrgStore();
  
  const [orgName, setOrgName] = useState('');
  const [managementPhilosophy, setManagementPhilosophy] = useState('');
  const [masterMvv, setMasterMvv] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name);
      setManagementPhilosophy(currentOrg.managementPhilosophy || '');
      setMasterMvv(currentOrg.masterMvv || '');
      setCompanyUrl(currentOrg.companyUrl || '');
      setBusinessDescription(currentOrg.businessDescription || '');
      setTargetMarket(currentOrg.targetMarket || '');
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
      await updateOrganizationSettings(currentOrgId, {
        name: orgName.trim(),
        managementPhilosophy: managementPhilosophy.trim(),
        masterMvv: masterMvv.trim(),
        companyUrl: companyUrl.trim(),
        businessDescription: businessDescription.trim(),
        targetMarket: targetMarket.trim(),
      });
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
      <AiLoadingOverlay 
        isVisible={isAnalyzing} 
        statusText="経営環境をAIで推論・分析中..." 
        subText="指定された企業のWebサイト情報を読み込み、PEST分析、5Forces分析、VRIO分析を実行しています。"
      />
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
                  組織名 <span className="text-rose-500">*</span>
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
                  企業サイトURL
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">企業理念・事業情報（AIコンテキスト用）</h3>
                <p className="text-xs text-logic-slate dark:text-slate-400 mb-4">
                  これらの情報は、AIエージェントがKPIツリーやマクロ環境を分析する際の「前提知識・絶対的な制約」として自動的に継承されます。
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      経営理念
                    </label>
                    <textarea
                      value={managementPhilosophy}
                      onChange={(e) => setManagementPhilosophy(e.target.value)}
                      rows={2}
                      placeholder="例: 全従業員の物心両面の幸福を追求すると同時に、人類、社会の進歩発展に貢献すること。"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      企業理念（Mission・Vision・Values）
                    </label>
                    <textarea
                      value={masterMvv}
                      onChange={(e) => setMasterMvv(e.target.value)}
                      rows={4}
                      placeholder="例:&#13;&#10;【Mission】世界中の人々を笑顔にする&#13;&#10;【Vision】業界No.1の顧客満足度&#13;&#10;【Values】挑戦を恐れない"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all resize-y"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        事業内容・中核となる強み
                      </label>
                      <textarea
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        rows={3}
                        placeholder="例: B2B向けSaaSの提供。独自のAIアルゴリズムによる高精度なデータ分析が強み。"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        ターゲット市場・主要顧客
                      </label>
                      <textarea
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        rows={3}
                        placeholder="例: 従業員100〜1000名規模の国内製造業。主にDX推進部門や経営企画室。"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isSaving || 
                  (orgName.trim() === currentOrg.name && 
                   masterMvv.trim() === (currentOrg.masterMvv || '') &&
                   managementPhilosophy.trim() === (currentOrg.managementPhilosophy || '') &&
                   companyUrl.trim() === (currentOrg.companyUrl || '') &&
                   businessDescription.trim() === (currentOrg.businessDescription || '') &&
                   targetMarket.trim() === (currentOrg.targetMarket || ''))
                }
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-w-2xl">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">分析対象のURL</p>
                <p className="text-sm text-logic-slate dark:text-slate-400 mt-1">
                  {companyUrl ? companyUrl : '基本情報で企業サイトURLを保存してください'}
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !companyUrl}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-oxford-navy to-strategic-teal hover:from-oxford-navy hover:to-strategic-teal disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-sm whitespace-nowrap"
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
                    <h3 className="font-extrabold text-lg text-oxford-navy dark:text-slate-200 mb-6 flex items-center gap-2 border-b-2 border-strategic-teal pb-2 inline-flex font-poppins tracking-wider">
                      PEST ANALYSIS <span className="text-sm font-bold text-strategic-teal ml-2 tracking-widest">マクロ環境</span>
                    </h3>
                    {pest?.raw ? (
                      <div className="bg-clean-canvas dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-oxford-navy dark:text-slate-300 font-lato leading-relaxed">
                        {pest.raw}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[
                          { title: 'Politics', subtitle: '政治・法律的要因', icon: <Landmark size={20}/>, content: pest?.politics, color: 'text-oxford-navy' },
                          { title: 'Economy', subtitle: '経済的要因', icon: <TrendingUp size={20}/>, content: pest?.economy, color: 'text-strategic-teal' },
                          { title: 'Society', subtitle: '社会的要因', icon: <Users2 size={20}/>, content: pest?.society, color: 'text-oxford-navy' },
                          { title: 'Technology', subtitle: '技術的要因', icon: <Cpu size={20}/>, content: pest?.technology, color: 'text-strategic-teal' }
                        ].map((item, i) => (
                          <div key={i} className="bg-white dark:bg-[#001133] p-6 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 hover:border-strategic-teal/50 transition-colors">
                            <div className={`md:w-48 flex-shrink-0 ${item.color} dark:text-white`}>
                              <div className="flex items-center gap-2 font-black font-poppins tracking-wider mb-1">
                                {item.icon} {item.title}
                              </div>
                              <div className="text-xs font-bold text-logic-slate dark:text-slate-400">{item.subtitle}</div>
                            </div>
                            <div className="flex-1 text-sm text-logic-slate dark:text-slate-300 font-lato leading-relaxed">
                              {item.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5 Forces Analysis */}
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
                    <h3 className="font-extrabold text-lg text-oxford-navy dark:text-slate-200 mb-6 flex items-center gap-2 border-b-2 border-strategic-teal pb-2 inline-flex font-poppins tracking-wider">
                      FIVE FORCES <span className="text-sm font-bold text-strategic-teal ml-2 tracking-widest">業界構造</span>
                    </h3>
                    {fiveForces?.raw ? (
                      <div className="bg-clean-canvas dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-oxford-navy dark:text-slate-300 font-lato leading-relaxed">
                        {fiveForces.raw}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { title: 'Rivalry', subtitle: '既存企業間の敵対関係', icon: <Swords size={20}/>, content: fiveForces?.rivalry, colSpan: 'md:col-span-2', bg: 'bg-oxford-navy dark:bg-[#000a1f]', text: 'text-white' },
                          { title: 'New Entrants', subtitle: '新規参入の脅威', icon: <ShieldAlert size={20}/>, content: fiveForces?.newEntrants, colSpan: '', bg: 'bg-white dark:bg-[#001133]', text: 'text-oxford-navy dark:text-slate-200' },
                          { title: 'Substitutes', subtitle: '代替品の脅威', icon: <Replace size={20}/>, content: fiveForces?.substitutes, colSpan: '', bg: 'bg-white dark:bg-[#001133]', text: 'text-oxford-navy dark:text-slate-200' },
                          { title: 'Suppliers', subtitle: '売り手の交渉力', icon: <Truck size={20}/>, content: fiveForces?.suppliers, colSpan: '', bg: 'bg-white dark:bg-[#001133]', text: 'text-oxford-navy dark:text-slate-200' },
                          { title: 'Buyers', subtitle: '買い手の交渉力', icon: <ShoppingCart size={20}/>, content: fiveForces?.buyers, colSpan: '', bg: 'bg-white dark:bg-[#001133]', text: 'text-oxford-navy dark:text-slate-200' }
                        ].map((item, i) => (
                          <div key={i} className={`${item.colSpan} ${item.bg} p-6 rounded-sm border ${item.bg.includes('oxford-navy') ? 'border-transparent' : 'border-slate-200 dark:border-slate-800'} shadow-sm`}>
                            <div className={`flex items-center gap-2 font-black font-poppins tracking-wider mb-1 ${item.bg.includes('oxford-navy') ? 'text-white' : 'text-strategic-teal'}`}>
                              {item.icon} {item.title}
                            </div>
                            <div className={`text-xs font-bold mb-3 ${item.bg.includes('oxford-navy') ? 'text-slate-400' : 'text-logic-slate dark:text-slate-400'}`}>{item.subtitle}</div>
                            <div className={`text-sm font-lato leading-relaxed ${item.text}`}>
                              {item.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* VRIO Analysis */}
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
                    <h3 className="font-extrabold text-lg text-oxford-navy dark:text-slate-200 mb-6 flex items-center gap-2 border-b-2 border-strategic-teal pb-2 inline-flex font-poppins tracking-wider">
                      VRIO ANALYSIS <span className="text-sm font-bold text-strategic-teal ml-2 tracking-widest">競争優位性</span>
                    </h3>
                    {vrio?.raw ? (
                      <div className="bg-clean-canvas dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-oxford-navy dark:text-slate-300 font-lato leading-relaxed">
                        {vrio.raw}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { title: 'Value', subtitle: '経済的価値', icon: <Gem size={20}/>, content: vrio?.value },
                          { title: 'Rarity', subtitle: '希少性', icon: <Star size={20}/>, content: vrio?.rarity },
                          { title: 'Imitability', subtitle: '模倣困難性', icon: <Lock size={20}/>, content: vrio?.imitability },
                          { title: 'Organization', subtitle: '組織', icon: <LayoutTemplate size={20}/>, content: vrio?.organization }
                        ].map((item, i) => (
                          <div key={i} className="bg-white dark:bg-[#001133] p-6 rounded-sm border-l-4 border-l-strategic-teal border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 font-black font-poppins tracking-wider mb-1 text-oxford-navy dark:text-white">
                              {item.icon} {item.title}
                            </div>
                            <div className="text-xs font-bold text-logic-slate dark:text-slate-400 mb-3">{item.subtitle}</div>
                            <div className="text-sm text-logic-slate dark:text-slate-300 font-lato leading-relaxed">
                              {item.content}
                            </div>
                          </div>
                        ))}
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
