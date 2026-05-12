"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Plus, ArrowRight, FolderKanban, Copy, Trash2, LogOut, MoreVertical, Sparkles, Upload, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { AiLoadingOverlay } from '@/components/ui/AiLoadingOverlay';

export default function WorkspacePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject, duplicateProject, deleteProject } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
  
  type WizardStep = 'none' | 'input' | 'generating_manifestos' | 'select_manifesto' | 'generating_tree';
  const [wizardStep, setWizardStep] = useState<WizardStep>('none');
  const [manifestos, setManifestos] = useState<any[]>([]);
  const [selectedManifestoIndex, setSelectedManifestoIndex] = useState<number>(0);
  const [editableManifesto, setEditableManifesto] = useState<any>(null);

  const [projectUrl, setProjectUrl] = useState('');
  const [kgiType, setKgiType] = useState('売上高');
  const [kgiPeriod, setKgiPeriod] = useState('年間');
  const [kgiTargetValue, setKgiTargetValue] = useState('');
  const [customKgiType, setCustomKgiType] = useState('');
  const [businessModelType, setBusinessModelType] = useState('B2B SaaS（継続課金）');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const [hasSampleData, setHasSampleData] = useState(false);

  useEffect(() => {
    if (user && currentOrgId) {
      const unsubscribe = initializeProjects(currentOrgId);
      return () => unsubscribe();
    }
  }, [user, currentOrgId, initializeProjects]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const closeMenu = () => setMenuOpenId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    router.push(`/${currentOrgId}/p/${projectId}/kpi-tree`);
  };

  const handleGenerateManifestos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl || !kgiTargetValue) return;

    try {
      setWizardStep('generating_manifestos');
      setUploadStatus('Master MVVと事業特性に基づく戦略アプローチを推論中...');

      const orgRef = doc(db, 'organizations', currentOrgId!);
      const orgSnap = await getDoc(orgRef);
      const masterMvv = orgSnap.exists() ? orgSnap.data().masterMvv : '';

      const finalKgiType = kgiType === 'その他' && customKgiType.trim() !== '' ? customKgiType : kgiType;

      const res = await fetch('/api/generate-manifesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterMvv,
          kgiType: finalKgiType,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          projectUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate manifesto');

      if (data.manifestos && data.manifestos.length > 0) {
        setManifestos(data.manifestos);
        setEditableManifesto(data.manifestos[0]);
        setWizardStep('select_manifesto');
      } else {
        throw new Error('マニフェストが生成されませんでした');
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
      setWizardStep('input');
    }
  };

  const handleGenerateTree = async () => {
    if (!user || !projectUrl) return;

    const finalKgiType = kgiType === 'その他' && customKgiType.trim() !== '' ? customKgiType : kgiType;
    const projectName = `${finalKgiType} ${kgiTargetValue ? Number(kgiTargetValue).toLocaleString() : ''}達成プロジェクト`;

    try {
      setWizardStep('generating_tree');
      if (!currentOrgId) throw new Error("No organization selected");

      setUploadStatus('ファイルをアップロード中...');
      const uploadedFiles: { url: string; path: string; mimeType: string }[] = [];
      
      // 1. ファイルのアップロード処理
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}は5MBを超えているためアップロードできません。`);
          setWizardStep('select_manifesto');
          return;
        }
        const fileRef = ref(storage, `organizations/${currentOrgId}/temp_uploads/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedFiles.push({ url, path: fileRef.fullPath, mimeType: file.type });
      }

      setUploadStatus('過去のアーカイブ資産を走査中...');
      const archivedKpis: any[] = [];
      try {
        // 全プロジェクトの kpiData をフェッチしてアーカイブ済みKPIを収集
        for (const project of projects) {
          const kpiDataDoc = await getDoc(doc(db, 'organizations', currentOrgId, 'projects', project.id, 'kpiData', 'main'));
          if (kpiDataDoc.exists()) {
            const data = kpiDataDoc.data();
            if (data.kpiData) {
              Object.values(data.kpiData).forEach((k: any) => {
                if (k.isArchived) {
                  archivedKpis.push({
                    id: k.id,
                    projectId: project.id,
                    name: k.name,
                    qualitativeName: k.qualitativeName,
                    unit: k.unit,
                    type: k.type
                  });
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch archived KPIs', e);
      }

      setUploadStatus('AIが選択された作戦に基づきKPIツリーを構築中...');

      // 2. APIを呼んでKPIツリーをAI生成
      const res = await fetch('/api/generate-kpi-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl,
          kgiType: finalKgiType,
          kgiPeriod,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          businessModelType,
          selectedManifesto: editableManifesto,
          customInstructions,
          fileUrls: uploadedFiles.map(f => f.url),
          archivedKpis // 集めたアーカイブKPIをコンテキストとして渡す
        })
      });

      // 後処理：一時ファイルを削除（非同期でバックグラウンド実行）
      for (const f of uploadedFiles) {
        deleteObject(ref(storage, f.path)).catch(console.error);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      // AIからの返答に mappedSourceId があれば linkedSource に変換する
      if (data.nodes && Array.isArray(data.nodes)) {
        data.nodes = data.nodes.map((node: any) => {
          if (node.mappedSourceId) {
            const source = archivedKpis.find(k => k.id === node.mappedSourceId);
            if (source) {
              node.linkedSource = { projectId: source.projectId, kpiId: source.id, orgId: currentOrgId };
              node.isCalculated = false; // リンク元から引っ張るため
              node.formula = '';
              node.targetValue = 0;
              node.actualValue = 0;
            }
          }
          return node;
        });
      }

      // サンプルデータを生成する場合、全ノードに1年分の履歴データを追加する
      if (hasSampleData && data.nodes && Array.isArray(data.nodes)) {
        const today = new Date();
        data.nodes = data.nodes.map((node: any) => {
          if (node.linkedSource) return node;

          const history = [];
          const trendType = node.trend_type || 'steady_growth';
          const volatility = node.volatility || 0.1;
          const isPercentage = node.unit === '%' || node.unit === '％';
          const startRatio = 0.3;

          for (let i = 365; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const progress = (365 - i) / 365;
            let baseValue = (node.targetValue || 0) * (startRatio + (1 - startRatio) * progress);
            
            const month = date.getMonth(); // 0-11
            if (trendType === 'seasonal_summer') {
              const seasonFactor = Math.sin((month - 4) * Math.PI / 6) * 0.3; // ±30%
              baseValue = baseValue * (1 + seasonFactor);
            } else if (trendType === 'seasonal_winter') {
              const seasonFactor = Math.sin((month + 2) * Math.PI / 6) * 0.3; // ±30%
              baseValue = baseValue * (1 + seasonFactor);
            } else if (trendType === 'flat_random') {
              baseValue = node.targetValue || 0;
            }

            const randomNoise = 1 + (Math.random() * volatility * 2 - volatility);
            let actualVal = baseValue * randomNoise;
            
            if (isPercentage) {
              actualVal = Math.round(actualVal * 10) / 10;
              if (actualVal < 0) actualVal = 0;
              if (actualVal > 100) actualVal = 100;
            } else {
              actualVal = Math.round(actualVal);
              if (actualVal < 0) actualVal = 0;
            }
            
            history.push({
              id: Math.random().toString(36).substr(2, 9),
              date: dateString,
              targetValue: node.targetValue || 0,
              actualValue: actualVal,
              comment: i === 0 ? '現在' : i % 30 === 0 ? '月次まとめ' : ''
            });
          }
          node.actualValue = history[history.length - 1].actualValue;
          node.history = history;
          return node;
        });
      } else if (!hasSampleData && data.nodes && Array.isArray(data.nodes)) {
        data.nodes = data.nodes.map((node: any) => {
          if (!node.linkedSource) {
            node.actualValue = 0;
          }
          return node;
        });
      }

      // 2. プロジェクト作成
      const newId = await createProject(projectName, projectUrl, user.uid, currentOrgId, {
        description: projectUrl,
        manifesto: editableManifesto ? `${editableManifesto.title}
${editableManifesto.description}` : '', 
        kgiType: finalKgiType, 
        kgiPeriod,
        kgiTargetValue: Number(kgiTargetValue) || 0, 
        businessModelType
      });
      
      setCurrentProjectId(newId);

      // 3. 生成されたノード群と推論プロセスをセッションストレージに退避して次の画面でロードさせる
      if (data.nodes && Array.isArray(data.nodes)) {
        sessionStorage.setItem(`kpi_init_${newId}`, JSON.stringify(data.nodes));
      }
      if (data.thinkingProcess) {
        sessionStorage.setItem(`kpi_think_${newId}`, JSON.stringify(data.thinkingProcess));
      }

      router.push(`/${currentOrgId}/p/${newId}/kpi-tree`);
      setWizardStep('none');
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
      setWizardStep('select_manifesto');
    }
  };


  const handleDuplicate = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!user) return;
    setIsProcessing(projectId);
    try {
      if (!currentOrgId) throw new Error("No organization selected");
      const newId = await duplicateProject(projectId, user.uid, currentOrgId);
    } catch (error) {
      console.error("Failed to duplicate", error);
      alert("複製に失敗しました");
    } finally {
      setIsProcessing(null);
      setMenuOpenId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    if (window.confirm(`「${projectName}」を本当に削除しますか？\nこの操作は取り消せません。`)) {
      setIsProcessing(projectId);
      try {
        if (!currentOrgId) throw new Error("No organization selected");
        await deleteProject(projectId, currentOrgId);
      } catch (error) {
        console.error("Failed to delete", error);
        alert("削除に失敗しました");
      } finally {
        setIsProcessing(null);
        setMenuOpenId(null);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/lp';
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#202124] flex items-center justify-center text-slate-900 dark:text-[#f1f3f4]">読み込み中...</div>;
  }

  return (
    <>
      <AiLoadingOverlay 
        isVisible={wizardStep === 'generating_manifestos' || wizardStep === 'generating_tree'} 
        statusText={uploadStatus || 'AIが最適なKPIツリーを構築中...'} 
        subText="ヒアリング内容に基づき、事業特性に合わせたKGIとKPIの分解ツリー、および目標数値を自動生成しています。（最大10〜15秒かかります）" 
      />
      <OrgLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] p-6 md:p-12 font-sans selection:bg-[#8ab4f8]/30">
        <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
          <div>
            <p className="text-[20px] md:text-[24px] font-normal text-slate-500 dark:text-[#9aa0a6] mb-1">
              こんにちは、{user?.displayName || 'ゲスト'}さん
            </p>
            <h1 className="text-[32px] md:text-[36px] font-normal text-slate-900 dark:text-[#f1f3f4] tracking-tight">
              LogicTree Pro へようこそ
            </h1>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-[14px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-6 pb-2 border-b border-slate-200 dark:border-[#3c4043]">
            最近のプロジェクト
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            
            {/* Create New Project Card (Dashed) */}
            <button 
              onClick={() => setWizardStep('input')}
              className="bg-transparent hover:bg-white dark:bg-[#282a2d] border-2 border-dashed border-slate-300 dark:border-[#5f6368] hover:border-primary-500 dark:border-[#8ab4f8] rounded-[8px] h-[190px] flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-primary-600 dark:text-[#8ab4f8] bg-primary-600 dark:bg-[#8ab4f8]/10 group-hover:bg-primary-600 dark:bg-[#8ab4f8]/20 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-[16px] font-medium text-primary-600 dark:text-[#8ab4f8]">
                AIでKGI/KPIを生成
              </span>
            </button>

            {/* Existing Projects */}
            {projects.map(project => (
              <div 
                key={project.id} 
                onClick={() => handleSelectProject(project.id)}
                className="bg-white dark:bg-[#2d2f31] hover:bg-slate-100 dark:bg-[#323639] border border-slate-200 dark:border-[#3c4043] hover:border-slate-300 dark:border-[#5f6368] rounded-[8px] h-[190px] flex flex-col p-5 cursor-pointer transition-all relative group shadow-sm hover:shadow-md"
              >
                {/* 処理中のオーバーレイ */}
                {isProcessing === project.id && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-[#202124]/80 flex items-center justify-center z-10 rounded-[8px] backdrop-blur-sm">
                    <span className="text-[13px] text-primary-600 dark:text-[#8ab4f8] font-medium animate-pulse">処理中...</span>
                  </div>
                )}

                {/* Card Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[16px] font-medium text-slate-800 dark:text-[#e8eaed] truncate pr-4 leading-tight">
                    {project.name}
                  </h3>
                  
                  {/* Context Menu Toggle */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setMenuOpenId(menuOpenId === project.id ? null : project.id);
                    }}
                    className="text-slate-500 dark:text-[#9aa0a6] hover:text-slate-900 dark:text-[#f1f3f4] p-1 -m-1 rounded-full hover:bg-slate-200 dark:bg-[#3c4043] transition-colors z-10"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Context Menu Dropdown */}
                  {menuOpenId === project.id && (
                    <div 
                      className="absolute top-10 right-4 w-40 bg-white dark:bg-[#282a2d] border border-slate-200 dark:border-[#3c4043] rounded-[4px] shadow-lg overflow-hidden z-20 py-1 animate-in fade-in zoom-in-95 duration-100"
                      onClick={(e) => e.stopPropagation()} // ドロップダウン内クリックでカード遷移を防ぐ
                    >
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); handleDuplicate(e, project.id); }} // onMouseDownを使用してネイティブclickによる消滅を先行ブロック
                        className="w-full text-left px-4 py-2 text-[13px] text-slate-800 dark:text-[#e8eaed] hover:bg-slate-200 dark:bg-[#3c4043] flex items-center gap-2"
                      >
                        <Copy size={14} /> 複製する
                      </button>
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); handleDelete(e, project.id, project.name); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-rose-500 dark:text-[#f28b82] hover:bg-slate-200 dark:bg-[#3c4043] flex items-center gap-2"
                      >
                        <Trash2 size={14} /> 削除する
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex-1">
                  <p className="text-[12px] md:text-[13px] text-slate-500 dark:text-[#9aa0a6] font-normal leading-[1.5] line-clamp-3 mt-2">
                    {project.description || '説明がありません。プロジェクトを開いて詳細を設定できます。'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-[#3c4043]/50 flex items-center justify-between text-slate-500 dark:text-[#9aa0a6] group-hover:text-primary-600 dark:text-[#8ab4f8] transition-colors">
                  <span className="text-[12px] font-medium">ツリーを開く</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
            
          </div>
        </div>
      </div>

      {/* 新規作成AIウィザード (STEP 1: 入力) */}
      {wizardStep === 'input' && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#282a2d] rounded-[8px] p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-[#3c4043] relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-slate-900 dark:text-[#f1f3f4]">部門のKPIツリー作成（STEP 1）</h2>
            </div>

            <form onSubmit={handleGenerateManifestos} className="space-y-5">
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">1. 事業のURL（または事業概要のテキスト） <span className="text-rose-500">*</span></label>
                  <input
                    type="text" required autoFocus value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="例：https://example.com または ホテル5施設と飲食10店舗の運営"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">AIが事業ポートフォリオを解読します。</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">2. KGI（自部門の目標）</label>
                    <select 
                      value={kgiType} onChange={(e) => setKgiType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                    >
                      <optgroup label="財務指標（PL）">
                        <option value="売上高">売上高</option>
                        <option value="営業利益">営業利益</option>
                        <option value="ARR">ARR</option>
                        <option value="LTV">LTV</option>
                      </optgroup>
                      <optgroup label="非財務・組織/顧客指標（非PL）">
                        <option value="アンケート最高評価率">アンケート最高評価率</option>
                        <option value="NPS（ネットプロモータースコア）">NPS（ネットプロモータースコア）</option>
                        <option value="MAU / アクティブユーザー数">MAU / アクティブユーザー数</option>
                        <option value="システム稼働率">システム稼働率</option>
                        <option value="社員エンゲージメントスコア">社員エンゲージメントスコア</option>
                        <option value="採用成功数">採用成功数</option>
                      </optgroup>
                      <option value="その他">その他（自由入力）</option>
                    </select>
                    {kgiType === 'その他' && (
                      <input
                        type="text" required value={customKgiType} onChange={(e) => setCustomKgiType(e.target.value)}
                        placeholder="例：独自指標を入力..."
                        className="w-full px-3 py-2 mt-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none animate-in fade-in slide-in-from-top-1"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">目標期間</label>
                    <select 
                      value={kgiPeriod} onChange={(e) => setKgiPeriod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                    >
                      <option value="年間">年間</option>
                      <option value="半期">半期</option>
                      <option value="四半期">四半期</option>
                      <option value="月間">月間</option>
                      <option value="1日あたり">1日あたり</option>
                      <option value="常時（常に維持）">常時（常に維持）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">目標数値 (円/人/%など) <span className="text-rose-500">*</span></label>
                    <input
                      type="number" required value={kgiTargetValue} onChange={(e) => setKgiTargetValue(e.target.value)}
                      placeholder="例：500000000 または 95"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-primary-500 rounded-[4px] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">3. 主力となるビジネスモデルの型</label>
                  <select 
                    value={businessModelType} onChange={(e) => setBusinessModelType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none"
                  >
                    <option value="B2B SaaS（継続課金）">B2B SaaS（継続課金）</option>
                    <option value="店舗・施設（客数×単価）">店舗・施設（客数×単価）</option>
                    <option value="EC・物販">EC・物販</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">4. AIへの追加指示・前提条件 (任意)</label>
                  <textarea
                    value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} rows={2}
                    placeholder="「従業員定着率を重要視したい」「特定の施策を含めてほしい」など"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">5. 参考ファイル (CSV / PDF / 画像)</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-[#5f6368] rounded-[4px] p-4 text-center hover:bg-slate-50 dark:hover:bg-[#202124] transition-colors relative">
                    <input
                      type="file" multiple accept=".csv,.pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 3));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                      <Upload size={20} className="text-slate-400 mb-2" />
                      <p className="text-[12px] text-slate-500 font-medium">クリックまたはドラッグ＆ドロップでファイルを追加</p>
                    </div>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-[#3c4043] px-3 py-1.5 rounded-[4px] text-[11px] text-slate-700 dark:text-[#e8eaed]">
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-500 dark:text-[#9aa0a6] mb-1.5">6. 初期データの生成</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#e8eaed] cursor-pointer">
                      <input type="radio" checked={!hasSampleData} onChange={() => setHasSampleData(false)} className="text-primary-500 focus:ring-primary-500" />
                      空で作成（実績0からスタート）
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#e8eaed] cursor-pointer">
                      <input type="radio" checked={hasSampleData} onChange={() => setHasSampleData(true)} className="text-primary-500 focus:ring-primary-500" />
                      サンプルデータあり
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-[#3c4043]">
                <button
                  type="button"
                  onClick={() => setWizardStep('none')}
                  className="px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit" disabled={!projectUrl || !kgiTargetValue}
                  className="px-4 py-2 text-[14px] font-medium bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white rounded-[4px] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  AIで戦略案を生成（STEP 2へ）
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新規作成AIウィザード (STEP 2: マニフェスト選択) */}
      {wizardStep === 'select_manifesto' && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#282a2d] rounded-[8px] p-6 w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-[#3c4043] relative overflow-hidden flex flex-col max-h-[90vh]">
            <h2 className="text-[20px] font-bold text-slate-900 dark:text-[#f1f3f4] mb-2">AIが考案した3つの作戦（Manifesto）</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">組織のMaster MVVを遵守し、KGIを達成するための作戦です。方向性に最も近いものを1つ選び、必要に応じて修正してください。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 overflow-y-auto pr-2">
              {manifestos.map((m, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedManifestoIndex(idx);
                    setEditableManifesto(manifestos[idx]);
                  }}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col ${selectedManifestoIndex === idx ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'}`}
                >
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-3 leading-tight">{m.title}</h3>
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-4 flex-1 leading-relaxed">{m.description}</p>
                  <div className="text-[12px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <strong className="block mb-1">なぜこの作戦か？</strong>
                    {m.reason}
                  </div>
                </div>
              ))}
            </div>

            {/* 選択中のマニフェストの編集エリア */}
            <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                選択中の作戦を微調整（任意）
              </label>
              <input 
                type="text" 
                value={editableManifesto?.title || ''} 
                onChange={e => setEditableManifesto({...editableManifesto, title: e.target.value})}
                className="w-full font-bold text-[15px] px-3 py-2 bg-white dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none focus:border-primary-500 mb-3"
              />
              <textarea 
                value={editableManifesto?.description || ''} 
                onChange={e => setEditableManifesto({...editableManifesto, description: e.target.value})}
                rows={3}
                className="w-full text-[13px] px-3 py-2 bg-white dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setWizardStep('input')}
                className="px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px] transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleGenerateTree}
                className="px-4 py-2 text-[14px] font-medium bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white rounded-[4px] shadow-lg transition-all flex items-center gap-2"
              >
                <Sparkles size={16} />
                この作戦でKPIツリーを展開
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </OrgLayout>
    </>
  );
}
