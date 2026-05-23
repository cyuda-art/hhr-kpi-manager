"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Plus, ArrowRight, FolderKanban, Copy, Trash2, LogOut, MoreVertical, Sparkles, Upload, X, Loader2 } from 'lucide-react';
import { AiLoadingOverlay } from '@/components/ui/AiLoadingOverlay';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChatOnboarding } from '@/components/dashboard/ChatOnboarding';

export default function WorkspacePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { projects, isLoading, initializeProjects, setCurrentProjectId, createProject, duplicateProject, deleteProject } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();

  const currentOrg = organizations.find(o => o.id === currentOrgId);
  const isFreePlan = currentOrg?.subscriptionPlan === 'FREE' || !currentOrg?.subscriptionPlan;
  const hasReachedProjectLimit = isFreePlan && projects.length >= 1;
  
  type WizardStep = 'none' | 'input' | 'generating_manifestos' | 'select_manifesto' | 'generating_tree' | 'chat_onboarding';
  const [wizardStep, setWizardStep] = useState<WizardStep>('none');
  const [manifestos, setManifestos] = useState<any[]>([]);
  const [selectedManifestoIndex, setSelectedManifestoIndex] = useState<number>(0);
  const [editableManifesto, setEditableManifesto] = useState<any>(null);
  const [copilotMessages, setCopilotMessages] = useState<{role: string, content: string}[]>([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

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

  const handleCopilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || isCopilotThinking) return;

    const userMessage = copilotInput;
    setCopilotInput('');
    setCopilotMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsCopilotThinking(true);

    try {
      const res = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentManifesto: editableManifesto,
          history: copilotMessages
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCopilotMessages(prev => [...prev, { role: 'model', content: data.text }]);
      
      // JSONで変更案が返ってきた場合は作戦テキストを自動アップデート
      if (data.updatedManifesto) {
        setEditableManifesto((prev: any) => ({
          ...prev,
          title: data.updatedManifesto.updatedTitle || prev.title,
          description: data.updatedManifesto.updatedDescription || prev.description
        }));
      }
    } catch (error) {
      setCopilotMessages(prev => [...prev, { role: 'model', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

  const handleGenerateManifestos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl || !kgiTargetValue) return;

    try {
      setWizardStep('generating_manifestos');
      if (!currentOrgId) throw new Error("No organization selected");

      setUploadStatus('ファイルをアップロード中...');
      const urls: string[] = [];
      
      // ファイルのアップロード処理（マニフェスト推論とツリー推論の両方で使う）
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}は5MBを超えているためアップロードできません。`);
          setWizardStep('input');
          return;
        }
        const fileRef = ref(storage, `organizations/${currentOrgId}/temp_uploads/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        urls.push(url);
      }
      setUploadedFileUrls(urls);

      setUploadStatus('Master MVVと事業特性に基づく戦略アプローチを推論中...');

      let orgData: any = {};
      try {
        const res = await fetch(`/api/organizations/${currentOrgId}`);
        if (res.ok) {
          orgData = await res.json();
        }
      } catch (e) {
        console.warn('Failed to fetch org info', e);
      }
      
      const masterMvv = orgData.masterMvv || '';
      const orgContext = {
        pest: orgData.pest || '',
        fiveForces: orgData.fiveForces || '',
        vrio: orgData.vrio || '',
        industry: orgData.industry || ''
      };

      const finalKgiType = kgiType === 'その他' && customKgiType.trim() !== '' ? customKgiType : kgiType;

      // DBおよびAI推論のベースは「年間」であるため、ユーザーが入力した期間目標を年間目標に換算する
      // （※率や単価など、スケールしない指標の場合はそのまま）
      let isRateOrUnit = false;
      if (finalKgiType.includes('率') || finalKgiType.includes('割合') || finalKgiType.includes('スコア') || finalKgiType.includes('単価') || finalKgiType.includes('LTV')) {
        isRateOrUnit = true;
      }
      
      let annualizedKgiTarget = Number(kgiTargetValue) || 0;
      if (!isRateOrUnit) {
        if (kgiPeriod === '半期') annualizedKgiTarget *= 2;
        else if (kgiPeriod === '四半期') annualizedKgiTarget *= 4;
        else if (kgiPeriod === '月間') annualizedKgiTarget *= 12;
        else if (kgiPeriod === '1日あたり') annualizedKgiTarget *= 365;
      }

      const res = await fetch('/api/generate-manifesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterMvv,
          orgContext,
          kgiType: finalKgiType,
          kgiTargetValue: annualizedKgiTarget,
          projectUrl,
          customInstructions, // 追加指示
          fileUrls: urls // アップロードファイル
        })
      });

      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}`);
      }

      if (!res.ok) throw new Error(data.error || 'Failed to generate manifesto');

      if (data.manifestos && data.manifestos.length > 0) {
        setManifestos(data.manifestos);
        setEditableManifesto(data.manifestos[0]);
        // SWOT/CrossSWOTのデータを保存
        if (data.swot) sessionStorage.setItem('temp_swot', data.swot);
        if (data.crossSwot) sessionStorage.setItem('temp_crossSwot', data.crossSwot);
        setWizardStep('select_manifesto');
      } else {
        throw new Error('マニフェストが生成されませんでした');
      }
    } catch (error: any) {
      console.error(error);
      alert(`エラーが発生しました: ${error?.message || String(error)}`);
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

      setUploadStatus('過去のアーカイブ資産を走査中...');


      setUploadStatus('AIが選択された作戦に基づきKPIツリーを構築中...');

      // DBおよびAI推論のベースは「年間」であるため、ユーザーが入力した期間目標を年間目標に換算する
      let isRateOrUnit = false;
      if (finalKgiType.includes('率') || finalKgiType.includes('割合') || finalKgiType.includes('スコア') || finalKgiType.includes('単価') || finalKgiType.includes('LTV')) {
        isRateOrUnit = true;
      }
      
      let annualizedKgiTarget = Number(kgiTargetValue) || 0;
      if (!isRateOrUnit) {
        if (kgiPeriod === '半期') annualizedKgiTarget *= 2;
        else if (kgiPeriod === '四半期') annualizedKgiTarget *= 4;
        else if (kgiPeriod === '月間') annualizedKgiTarget *= 12;
        else if (kgiPeriod === '1日あたり') annualizedKgiTarget *= 365;
      }

      // 2. APIを呼んでKPIツリーをAI生成
      const res = await fetch('/api/generate-kpi-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl,
          kgiType: finalKgiType,
          kgiPeriod,
          kgiTargetValue: annualizedKgiTarget,
          businessModelType,
          selectedManifesto: editableManifesto,
          customInstructions,
          fileUrls: uploadedFileUrls // 事前アップロード済みのURLを使用
        })
      });

      const textResponse = await res.text();
      let cleanText = textResponse.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();
      let data: any;
      try {
        data = JSON.parse(cleanText);
      } catch (e) {
        throw new Error(`AIの出力が不正です: ${cleanText.substring(0, 100)}`);
      }

      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate');

      // AIのハルシネーション対策（正規化とツリー構造の修復）
      let nodes = data.nodes || data;
      if (!Array.isArray(nodes)) {
        if (typeof nodes === 'object' && nodes !== null) {
          nodes = Object.values(nodes);
        } else {
          nodes = [];
        }
      }

      // 【DB設計の脆弱性パッチ】AIが生成した固定ID（kgi_main等）が他のプロジェクトと競合して
      // PrismaのUpsert時に他プロジェクトのノードを上書き＆自プロジェクトから消失するバグを防ぐため、
      // 全ノードのIDをこの時点でグローバルユニークに変換する
      const idMap: Record<string, string> = {};
      nodes.forEach((n: any) => {
        if (n.id) {
          idMap[n.id] = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      });

      nodes = nodes.map((n: any) => {
        let newFormula = n.formula;
        if (newFormula && typeof newFormula === 'string') {
          Object.keys(idMap).forEach(oldId => {
            // formulaの中の #{old_id} を #{new_id} に置換
            newFormula = newFormula.replace(new RegExp(`\\#\\{${oldId}\\}`, 'g'), `#{${idMap[oldId]}}`);
          });
        }
        
        return {
          ...n,
          id: idMap[n.id] || n.id,
          parentId: n.parentId && idMap[n.parentId] ? idMap[n.parentId] : n.parentId,
          formula: newFormula
        };
      });

      // 1. 存在しない親IDを参照しているノードのparentIdをnullクリアする（孤児ノード対策）
      const nodeIds = new Set(nodes.map((n: any) => n.id));
      nodes = nodes.map((n: any) => {
        if (n.parentId && !nodeIds.has(n.parentId)) {
          return { ...n, parentId: null };
        }
        // 文字列の"null"や空文字も念のためnullに変換
        if (n.parentId === "null" || n.parentId === "") {
          return { ...n, parentId: null };
        }
        return n;
      });

      // 2. ルートノードの特定
      const rootNodes = nodes.filter((n: any) => n.parentId === null || n.parentId === undefined);
      
      // 3. ルートノードが複数ある、またはルートノードがない（循環参照など）場合は、絶対的なKGIノードを1つ自動生成して束ねる
      if (rootNodes.length > 1 || rootNodes.length === 0) {
        const kgiMainId = 'kgi_main_auto_injected_' + Date.now();
        const nodesToBind = rootNodes.length > 1 ? rootNodes : nodes; // ルートがない場合は全ノードを新ルートに紐づける
        
        const totalTargetValue = nodesToBind.reduce((sum: number, n: any) => sum + (Number(n.targetValue) || 0), 0);
        const totalActualValue = nodesToBind.reduce((sum: number, n: any) => sum + (Number(n.actualValue) || 0), 0);
        const totalPrevValue = nodesToBind.reduce((sum: number, n: any) => sum + (Number(n.previousValue) || 0), 0);
        
        const newRoot = {
          id: kgiMainId,
          name: finalKgiType || "全社KGI",
          qualitativeName: "全社目標の達成",
          businessUnit: "company",
          type: "KGI",
          parentId: null,
          targetValue: totalTargetValue > 0 ? totalTargetValue : (annualizedKgiTarget || 100000000),
          actualValue: totalActualValue,
          previousValue: totalPrevValue,
          unit: nodesToBind[0]?.unit || "円",
          description: "AIが生成した複数の事業部KPIを束ねるための自動生成ノード",
          isCalculated: true,
          formula: nodesToBind.map((n: any) => `#{${n.id}}`).join(' + '),
          isKsf: false
        };
        
        nodes = nodes.map((n: any) => {
          if (n.parentId === null || n.parentId === undefined) {
            return { ...n, parentId: kgiMainId, type: n.type === 'KGI' ? 'KPI' : n.type };
          }
          return n;
        });
        
        nodes.unshift(newRoot);
      } else if (rootNodes.length === 1) {
        // ルートノードが1つの場合は、それを確実にKGIとする
        nodes = nodes.map((n: any) => {
          if (n.id === rootNodes[0].id) {
            return { ...n, type: 'KGI' };
          }
          return n;
        });
      }

      data.nodes = nodes;

      // AIからの返答に mappedSourceId があれば linkedSource に変換する
      const archivedKpis: any[] = [];
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
          
          // Generate monthlyData from history
          const monthlyData: Record<string, any> = {};
          
          // First, initialize FY26 (2026-04 to 2027-03) with targets
          const allMonths = [
            "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
            "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"
          ];
          for (const m of allMonths) {
            monthlyData[m] = {
              targetValue: isPercentage ? (node.targetValue || 0) : ((node.targetValue || 0) / 12),
              actualValue: 0
            };
          }

          // Then aggregate history into monthlyData
          for (const record of history) {
            const m = record.date.substring(0, 7); // YYYY-MM
            if (!monthlyData[m]) {
              monthlyData[m] = { targetValue: isPercentage ? (node.targetValue || 0) : ((node.targetValue || 0) / 12), actualValue: 0 };
            }
            if (isPercentage) {
              // For percentages, we can't just sum daily actuals. 
              // The generated history for percentages is already close to the target.
              // We'll just take the latest actual value of the month.
              monthlyData[m].actualValue = record.actualValue;
            } else {
              monthlyData[m].actualValue += record.actualValue;
            }
          }

          node.actualValue = history[history.length - 1].actualValue;
          node.history = history;
          node.monthlyData = monthlyData;
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
        manifesto: editableManifesto ? `${editableManifesto.title}\n${editableManifesto.description}` : '', 
        swot: sessionStorage.getItem('temp_swot') || '',
        crossSwot: sessionStorage.getItem('temp_crossSwot') || '',
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
    } catch (error: any) {
      console.error(error);
      alert(`エラーが発生しました: ${error?.message || String(error)}`);
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
    window.location.href = '/';
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
              Gnu.Done へようこそ
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
              onClick={() => {
                if (hasReachedProjectLimit) {
                  alert('無料プラン（FREE）では作成できるプロジェクトは1つまでです。新しいプロジェクトを作成するにはアップグレードしてください。');
                  router.push('/pricing');
                  return;
                }
                setWizardStep('chat_onboarding');
              }}
              className="bg-transparent hover:bg-white dark:bg-[#282a2d] border-2 border-dashed border-slate-300 dark:border-[#5f6368] hover:border-strategic-teal dark:border-[#8ab4f8] rounded-[8px] h-[190px] flex flex-col items-center justify-center text-center transition-all group relative"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-strategic-teal dark:text-[#8ab4f8] bg-strategic-teal dark:bg-[#8ab4f8]/10 group-hover:bg-strategic-teal dark:bg-[#8ab4f8]/20 transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-[16px] font-medium text-strategic-teal dark:text-[#8ab4f8]">
                AIでKGI/KPIを生成
              </span>
              {hasReachedProjectLimit && (
                <div className="absolute top-2 right-2 bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded font-bold">
                  上限到達
                </div>
              )}
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
                    <span className="text-[13px] text-strategic-teal dark:text-[#8ab4f8] font-medium animate-pulse">処理中...</span>
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
                        onMouseDown={(e) => { 
                          e.preventDefault(); 
                          if (hasReachedProjectLimit) {
                            alert('無料プラン（FREE）では作成できるプロジェクトは1つまでです。複製するにはアップグレードしてください。');
                            router.push('/pricing');
                            return;
                          }
                          handleDuplicate(e, project.id); 
                        }} // onMouseDownを使用してネイティブclickによる消滅を先行ブロック
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
                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-[#3c4043]/50 flex items-center justify-between text-slate-500 dark:text-[#9aa0a6] group-hover:text-strategic-teal dark:text-[#8ab4f8] transition-colors">
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-strategic-teal rounded-[4px] focus:outline-none"
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
                        className="w-full px-3 py-2 mt-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-strategic-teal rounded-[4px] focus:outline-none animate-in fade-in slide-in-from-top-1"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] focus:border-strategic-teal rounded-[4px] focus:outline-none"
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
                      <p className="text-[12px] text-logic-slate dark:text-slate-400 font-medium">クリックまたはドラッグ＆ドロップでファイルを追加</p>
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
                      <input type="radio" checked={!hasSampleData} onChange={() => setHasSampleData(false)} className="text-primary-500 focus:ring-strategic-teal" />
                      空で作成（実績0からスタート）
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-slate-700 dark:text-[#e8eaed] cursor-pointer">
                      <input type="radio" checked={hasSampleData} onChange={() => setHasSampleData(true)} className="text-primary-500 focus:ring-strategic-teal" />
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
                  className="px-4 py-2 text-[14px] font-medium bg-gradient-to-r from-oxford-navy to-strategic-teal hover:from-oxford-navy hover:to-strategic-teal text-white rounded-[4px] transition-all flex items-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#282a2d] h-full shadow-2xl border-l border-slate-200 dark:border-[#3c4043] flex flex-col animate-in slide-in-from-right duration-300 relative">
            
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#282a2d] sticky top-0 z-10">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-[#f1f3f4] mb-1">AIが考案した3つの作戦（Manifesto）</h2>
              <p className="text-[12px] text-logic-slate dark:text-slate-400">組織のMaster MVVを遵守し、KGIを達成するための作戦です。方向性に最も近いものを1つ選び、必要に応じて修正してください。</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {manifestos.map((m, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSelectedManifestoIndex(idx);
                      setEditableManifesto(manifestos[idx]);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col ${selectedManifestoIndex === idx ? 'border-strategic-teal bg-primary-50 dark:bg-primary-900/20 shadow-md scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <h3 className="font-bold text-[15px] text-oxford-navy dark:text-slate-200 mb-2 leading-tight">{m.title}</h3>
                    <p className="text-[12px] text-logic-slate dark:text-slate-400 mb-3 flex-1 leading-relaxed">{m.description}</p>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                      <strong className="block mb-0.5">なぜこの作戦か？</strong>
                      {m.reason}
                    </div>
                  </div>
                ))}
              </div>

              {/* 選択中のマニフェストの編集エリア */}
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-clean-canvas dark:bg-slate-900/50 flex flex-col gap-3">
                <label className="block text-[10px] tracking-widest uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  選択中の作戦を微調整（直接編集またはAIと壁打ち）
                </label>
                <input 
                  type="text" 
                  value={editableManifesto?.title || ''} 
                  onChange={e => setEditableManifesto({...editableManifesto, title: e.target.value})}
                  className="w-full font-bold text-[14px] px-3 py-2 bg-white dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none focus:border-strategic-teal"
                />
                <textarea 
                  value={editableManifesto?.description || ''} 
                  onChange={e => setEditableManifesto({...editableManifesto, description: e.target.value})}
                  rows={4}
                  className="w-full text-[13px] px-3 py-2 bg-white dark:bg-[#202124] text-slate-800 dark:text-[#e8eaed] border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none focus:border-strategic-teal resize-none"
                />
              </div>
            {/* AI壁打ちチャットUI (Copilot) */}
            <div className="flex flex-col border border-strategic-teal/30 dark:border-strategic-teal/30 rounded-lg bg-white dark:bg-[#202124] overflow-hidden flex-shrink-0">
              <div className="bg-strategic-teal/10 dark:bg-strategic-teal/10 px-4 py-2 flex items-center gap-2 border-b border-strategic-teal/20">
                <Sparkles size={16} className="text-strategic-teal" />
                <span className="text-[13px] font-bold text-strategic-teal">AI戦略コンサルタントと壁打ち（Copilot）</span>
              </div>
              
              <div className="h-40 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50 dark:bg-[#282a2d]/50">
                {copilotMessages.length === 0 && (
                  <div className="text-[13px] text-logic-slate dark:text-slate-400 text-center mt-4">
                    「もっとB2Bに特化させたい」「LTVより新規獲得を重視したい」など、<br/>作戦に対する要望を伝えるとAIが上の作戦案を自動でブラッシュアップします。
                  </div>
                )}
                {copilotMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${msg.role === 'user' ? 'bg-strategic-teal text-white' : 'bg-white dark:bg-[#3c4043] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-pre-wrap'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isCopilotThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-[#3c4043] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-[13px] flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Loader2 size={14} className="animate-spin text-strategic-teal" /> コンサルタントが思考中...
                    </div>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleCopilotSubmit} className="p-3 bg-white dark:bg-[#282a2d] border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  placeholder="作戦に対する要望や変更案をチャットで入力..."
                  className="flex-1 px-3 py-2 text-[13px] bg-slate-50 dark:bg-[#202124] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#5f6368] rounded-[4px] focus:outline-none focus:border-strategic-teal"
                  disabled={isCopilotThinking}
                />
                <button
                  type="submit"
                  disabled={isCopilotThinking || !copilotInput.trim()}
                  className="px-4 py-2 bg-strategic-teal text-white rounded-[4px] text-[13px] font-medium disabled:opacity-50 transition-colors"
                >
                  送信
                </button>
              </form>
            </div>
          </div>
          
          <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#282a2d] sticky bottom-0 z-10 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setWizardStep('input')}
              className="px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px] transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleGenerateTree}
              className="px-4 py-2 text-[14px] font-medium bg-gradient-to-r from-oxford-navy to-strategic-teal hover:from-oxford-navy hover:to-strategic-teal text-white rounded-[4px] shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles size={16} />
              この作戦でKPIツリーを展開
            </button>
          </div>
        </div>
      </div>
      )}
      
      {wizardStep === 'chat_onboarding' && (
        <ChatOnboarding 
          onComplete={async (collectedData) => {
            if (!user || !currentOrgId) return;
            setWizardStep('generating_tree');
            setUploadStatus('AIが回答をもとにKPIツリーを構築中...');
            
            try {
              const projectName = `${collectedData.kgi || '目標'}達成プロジェクト`;
              
              const res = await fetch('/api/generate-universal-tree', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectedData })
              });
              
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              
              let nodes = data.nodes;
              
              // Ensure unique IDs
              const idMap: Record<string, string> = {};
              nodes.forEach((n: any) => {
                if (n.id) idMap[n.id] = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              });
              nodes = nodes.map((n: any) => {
                let newFormula = n.formula;
                if (newFormula && typeof newFormula === 'string') {
                  Object.keys(idMap).forEach(oldId => {
                    newFormula = newFormula.replace(new RegExp(`\\#\\{${oldId}\\}`, 'g'), `#{${idMap[oldId]}}`);
                  });
                }
                return {
                  ...n,
                  id: idMap[n.id] || n.id,
                  parentId: n.parentId && idMap[n.parentId] ? idMap[n.parentId] : n.parentId,
                  formula: newFormula
                };
              });

              const newId = await createProject(projectName, 'ハイブリッドAIオンボーディングから生成', user.uid, currentOrgId, {
                description: collectedData.goal || '',
                manifesto: collectedData.manifesto || '',
                kgiType: 'カスタム',
                kgiPeriod: 'カスタム',
                kgiTargetValue: 0,
                businessModelType: 'カスタム'
              });
              
              setCurrentProjectId(newId);
              sessionStorage.setItem(`kpi_init_${newId}`, JSON.stringify(nodes));
              
              router.push(`/${currentOrgId}/p/${newId}/kpi-tree`);
              setWizardStep('none');
            } catch (error: any) {
              console.error(error);
              alert(`エラーが発生しました: ${error?.message || String(error)}`);
              setWizardStep('chat_onboarding');
            }
          }}
          onCancel={() => setWizardStep('none')}
        />
      )}
      
      </div>
      </OrgLayout>
    </>
  );
}
