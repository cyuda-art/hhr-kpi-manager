import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { usePaywallStore } from '@/store/usePaywallStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Sparkles, Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Lightbulb, Calculator, Link2, ArchiveRestore, MessageSquare, Bot, Loader2, Plus, CheckSquare, User, Calendar, X, Target, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { TrendChart } from '../dashboard/TrendChart';
import { WorkflowTask } from '@/types';
import { getDisplayValue, getStorageValue, shouldScaleWithPeriod, formatDisplayValue } from '@/lib/kpi-utils';
import { LinkKpiModal } from './LinkKpiModal';
import { ReviveKpiModal } from './ReviveKpiModal';
import { AILoadingIndicator } from '@/components/ui/AILoadingIndicator';

export const ActionPanel = () => {
  const { kpiData, selectedNodeId, actions, toggleActionStatus, addKpiNode, removeKpiNode, updateKpiNode, addAction, currentPeriod, saveHistory } = useKpiStore();
  const { currentProjectId, projects } = useProjectStore();
  const { user } = useAuthStore();
  const { currentOrgId, organizations, updateOrganizationFrameworks } = useOrgStore();
  const { openPaywall } = usePaywallStore();
  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentOrg = organizations.find(o => o.id === currentOrgId);
  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;

  const selectedKpiTasks = actions.filter(a => a.kpiId === selectedNodeId);
  const hasChildren = selectedKpi ? Object.values(kpiData).some(node => node.parentId === selectedKpi.id) : false;
  
  const getLevel = (nodeId: string | null): number => {
    let currentId = nodeId;
    let level = 0;
    while (currentId && kpiData[currentId]) {
      const parentId = kpiData[currentId].parentId;
      if (!parentId) break; // KGI
      currentId = parentId;
      level++;
    }
    return level;
  };

  let shortfall = 0;
  let hasShortfall = false;
  if (selectedKpi && currentPeriod.match(/^\d{4}-\d{2}$/) && selectedKpi.monthlyData) {
    let accumTarget = 0;
    let accumActual = 0;
    const sortedMonths = Object.keys(selectedKpi.monthlyData).sort();
    for (const month of sortedMonths) {
      if (month < currentPeriod) {
        accumTarget += selectedKpi.monthlyData[month].targetValue || 0;
        accumActual += selectedKpi.monthlyData[month].actualValue || 0;
      }
    }
    shortfall = accumActual - accumTarget;
    if (shortfall < 0 && shouldScaleWithPeriod(selectedKpi)) {
      hasShortfall = true;
    }
  }
  const getQualitativeLabel = () => {
    if (!selectedKpi) return '';
    if (selectedKpi.type === 'KGI') return 'Goal';
    return getLevel(selectedKpi.id) === 1 ? 'KSF' : 'Process';
  };

  const isQualitative = selectedKpi ? ['VISION', 'MISSION', 'MANIFESTO', 'GOAL'].includes(selectedKpi.type) : false;

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Daily Record States
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickActual, setQuickActual] = useState('');
  const [quickComment, setQuickComment] = useState('');
  const [isSavingDaily, setIsSavingDaily] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(true);

  const fetchDailyRecords = async () => {
    if (selectedNodeId) {
      try {
        const res = await fetch(`/api/nodes/${selectedNodeId}/daily`);
        const data = await res.json();
        if (data.records) setDailyRecords(data.records);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchDailyRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId]);

  const handleQuickSave = async () => {
    if (!selectedNodeId || !quickDate || !quickActual) return;
    setIsSavingDaily(true);
    try {
      const res = await fetch(`/api/nodes/${selectedNodeId}/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: quickDate,
          actualValue: Number(quickActual),
          comment: quickComment
        })
      });
      if (res.ok) {
        await fetchDailyRecords();
        if (currentProjectId && currentOrgId) {
           await useKpiStore.getState().initializeDB(currentProjectId, currentOrgId);
        }
        setQuickActual('');
        setQuickComment('');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSavingDaily(false);
    }
  };

  const handleEditHistory = (r: any) => {
    setQuickDate(new Date(r.date).toISOString().split('T')[0]);
    setQuickActual(r.actualValue.toString());
    setQuickComment(r.comment || '');
  };

  const handleExportCSV = () => {
    if (dailyRecords.length === 0) return;
    const header = "Date,ActualValue,Comment\n";
    const rows = dailyRecords.map(r => {
      const d = new Date(r.date).toISOString().split('T')[0];
      const comment = (r.comment || '').replace(/"/g, '""');
      return `${d},${r.actualValue},"${comment}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedKpi?.name || 'kpi'}_daily_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Accordion States
  const [isPlanOpen, setIsPlanOpen] = useState(true);
  const [isDoOpen, setIsDoOpen] = useState(true);
  const [isCheckOpen, setIsCheckOpen] = useState(true);
  const [isActOpen, setIsActOpen] = useState(false); // Action/AI closed by default to save space

  // Edit States (Inline Editing)
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editActualValue, setEditActualValue] = useState('');
  const [editName, setEditName] = useState('');
  const [editQualitativeName, setEditQualitativeName] = useState('');
  const [editUpdateFrequency, setEditUpdateFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [editCalculationFormula, setEditCalculationFormula] = useState('');
  const [editIsCalculated, setEditIsCalculated] = useState(false);
  const [editFormula, setEditFormula] = useState('');

  // Sync state when KPI changes
  useEffect(() => {
    if (selectedKpi) {
      const displayTarget = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue');
      const displayActual = getDisplayValue(selectedKpi.actualValue, selectedKpi, currentPeriod, 'actualValue');
      
      setEditTargetValue(displayTarget.toString());
      setEditActualValue(displayActual.toString());
      setEditName(selectedKpi.name);
      setEditQualitativeName(selectedKpi.qualitativeName || '');
      setEditUpdateFrequency(selectedKpi.updateFrequency || 'monthly');
      setEditCalculationFormula(selectedKpi.calculationFormula || '');
      setEditIsCalculated(selectedKpi.isCalculated || false);
      setEditFormula(selectedKpi.formula || '');
    }
  }, [selectedNodeId, kpiData, currentPeriod]);

  const handleSaveValues = () => {
    if (!selectedNodeId || !selectedKpi) return;
    
    const storedTarget = getStorageValue(Number(editTargetValue) || 0, selectedKpi, currentPeriod, 'targetValue');
    const storedActual = getStorageValue(Number(editActualValue) || 0, selectedKpi, currentPeriod, 'actualValue');

    const isMonth = currentPeriod.match(/^\d{4}-\d{2}$/);
    
    // Check if any change actually happened to avoid unnecessary saves/history
    if (
      storedTarget !== selectedKpi.targetValue ||
      storedActual !== selectedKpi.actualValue ||
      editName !== selectedKpi.name ||
      editQualitativeName !== selectedKpi.qualitativeName ||
      editUpdateFrequency !== selectedKpi.updateFrequency ||
      editCalculationFormula !== selectedKpi.calculationFormula ||
      editIsCalculated !== selectedKpi.isCalculated ||
      editFormula !== selectedKpi.formula
    ) {
      saveHistory(); 
      updateKpiNode(selectedNodeId, {
        targetValue: storedTarget,
        actualValue: storedActual,
        name: editName || selectedKpi.name,
        qualitativeName: editQualitativeName || selectedKpi.qualitativeName,
        updateFrequency: editUpdateFrequency,
        calculationFormula: editCalculationFormula,
        isCalculated: editIsCalculated,
        formula: editFormula,
        warning: undefined
      });

      if (isMonth) {
        useKpiStore.getState().bulkUpdateMonthlyData([{
          kpiId: selectedNodeId,
          month: currentPeriod,
          targetValue: storedTarget,
          actualValue: storedActual
        }]);
      }
    }
  };

  // Immediate save for toggles/selects
  useEffect(() => {
    if (selectedKpi) {
      if (editIsCalculated !== selectedKpi.isCalculated || editUpdateFrequency !== selectedKpi.updateFrequency) {
        handleSaveValues();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editIsCalculated, editUpdateFrequency]);


  const consumeAiCredits = (featureName: string, requiredCredits: number): boolean => {
    if (!currentOrg) return false;
    if ((currentOrg.aiCreditBalance || 0) < requiredCredits) {
      openPaywall(featureName, requiredCredits);
      return false;
    }
    updateOrganizationFrameworks(currentOrg.id, {
      aiCreditBalance: (currentOrg.aiCreditBalance || 0) - requiredCredits
    });
    return true;
  };

  const handleReconstructFormula = () => {
    if (!selectedKpi) return;
    const children = Object.values(kpiData).filter(node => node.parentId === selectedKpi.id);
    if (children.length === 0) return;

    let needsDummyNode = false;
    const dummyMonthlyData: Record<string, any> = {};
    let dummyActualValue = 0;
    let dummyTargetValue = 0;

    if (selectedKpi.monthlyData && Object.keys(selectedKpi.monthlyData).length > 0) {
      Object.keys(selectedKpi.monthlyData).forEach(month => {
        const parentActual = selectedKpi.monthlyData![month]?.actualValue || 0;
        const parentTarget = selectedKpi.monthlyData![month]?.targetValue || 0;
        let childrenActualSum = 0;
        let childrenTargetSum = 0;
        children.forEach(c => {
          childrenActualSum += c.monthlyData?.[month]?.actualValue || 0;
          childrenTargetSum += c.monthlyData?.[month]?.targetValue || 0;
        });
        const actualGap = parentActual - childrenActualSum;
        const targetGap = parentTarget - childrenTargetSum;

        if (actualGap > 0 || targetGap > 0) {
          needsDummyNode = true;
          dummyMonthlyData[month] = { month, actualValue: Math.max(0, actualGap), targetValue: Math.max(0, targetGap) };
          dummyActualValue += Math.max(0, actualGap);
          dummyTargetValue += Math.max(0, targetGap);
        }
      });
    } else {
      let childrenActualSum = 0;
      let childrenTargetSum = 0;
      children.forEach(c => {
        childrenActualSum += c.actualValue || 0;
        childrenTargetSum += c.targetValue || 0;
      });
      const actualGap = (selectedKpi.actualValue || 0) - childrenActualSum;
      const targetGap = (selectedKpi.targetValue || 0) - childrenTargetSum;
      if (actualGap > 0 || targetGap > 0) {
        needsDummyNode = true;
        dummyActualValue = Math.max(0, actualGap);
        dummyTargetValue = Math.max(0, targetGap);
      }
    }

    const formulaElements = children.map(c => `#{${c.id}}`);

    if (needsDummyNode) {
      const dummyId = `kpi_dummy_${Date.now()}`;
      addKpiNode({
        id: dummyId,
        name: `その他（内訳未分類）`,
        qualitativeName: `システム自動退避`,
        type: 'KPI',
        parentId: selectedKpi.id,
        targetValue: dummyTargetValue,
        actualValue: dummyActualValue,
        unit: selectedKpi.unit,
        businessUnit: selectedKpi.businessUnit || 'company',
        previousValue: 0,
        description: '過去の入力を保護するためにシステムが自動生成した退避用データです。',
        isCalculated: false,
        formula: '',
        monthlyData: Object.keys(dummyMonthlyData).length > 0 ? dummyMonthlyData : undefined,
        addedAt: Date.now()
      });
      formulaElements.push(`#{${dummyId}}`);
      alert('過去の入力数値を保護するため、「その他（内訳未分類）」というデータを自動生成し過去実績を退避させました。');
    }

    const newFormula = formulaElements.join(' + ');

    updateKpiNode(selectedKpi.id, {
      isCalculated: true,
      formula: newFormula,
      warning: undefined 
    });
  };

  const handleAiReconstruct = async () => {
    if (!aiPrompt.trim() || !currentProject || !selectedKpi) return;
    if (!consumeAiCredits('AIツリー再構築（Neural Generation）', 100)) return;
    
    setIsAiProcessing(true);
    try {
      const res = await fetch('/api/reconstruct-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          selectedKpiId: selectedKpi.id,
          selectedKpiName: selectedKpi.name,
          kpiData: kpiData,
          manifesto: currentProject.manifesto,
          swot: currentProject.swot,
          crossSwot: currentProject.crossSwot
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      useKpiStore.setState({ kpiData: data.kpiData });
      alert('AIによるツリーの再構築が完了しました！');
      setAiPrompt('');
    } catch (error: any) {
      console.error(error);
      alert('再構築に失敗しました: ' + error.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAddTask = () => {
    if (!selectedKpi || !newTaskTitle.trim()) return;
    addAction({
      kpiId: selectedKpi.id,
      title: newTaskTitle.trim(),
      owner: user?.displayName || user?.email?.split('@')[0] || '未定',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
      status: 'todo'
    });
    setNewTaskTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/5 relative">
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {selectedKpi && selectedKpi.type !== 'KGI' && (
          <button 
            onClick={() => removeKpiNode(selectedKpi.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
            title="このKPIを削除"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button 
          onClick={() => useLayoutStore.getState().toggleActionPanel()}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          title="パネルを閉じる"
        >
          <X size={18} />
        </button>
      </div>

      {selectedKpi ? (
        <>
          {/* Header */}
          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="mb-2 pr-12">
              <p className="text-[10px] font-bold text-slate-400 dark:text-logic-slate uppercase tracking-wider">{selectedKpi.businessUnit}</p>
              {selectedKpi.qualitativeName && (
                <h4 className="font-bold text-oxford-navy dark:text-slate-200 mt-1 break-words text-[13px]">
                  <span className="text-[10px] text-primary-500 mr-1">{getQualitativeLabel()}:</span>
                  {selectedKpi.qualitativeName.replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
                </h4>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h4 className="font-bold text-oxford-navy dark:text-slate-200 break-words flex-1 text-lg">
                  <span className="text-[10px] text-emerald-500 mr-1">{selectedKpi.type === 'KGI' ? 'KGI:' : 'KPI:'}</span>
                  {selectedKpi.name}
                </h4>
                <button 
                  onClick={() => navigator.clipboard.writeText(`#{${selectedKpi.id}}`)} 
                  className="text-[9px] font-mono bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 px-1.5 py-0.5 rounded cursor-copy border border-slate-200 dark:border-slate-700 transition-colors"
                  title="クリックして計算式用のID（#{id}）をコピー"
                >
                  IDをコピー
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {!isQualitative && (
                  <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 ${
                    selectedKpi.status === 'danger' ? 'text-rose-500 border border-rose-200' : 
                    selectedKpi.status === 'warning' ? 'text-amber-500 border border-amber-200' : 'text-emerald-500 border border-emerald-200'
                  }`}>
                    達成率: {selectedKpi.achievementRate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Inspector Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

            {/* --- 0. Record (実績クイック入力) --- */}
            {!isQualitative && (
              <section className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <button 
                  onClick={() => setIsDailyOpen(!isDailyOpen)}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Edit2 size={14} className="text-primary-500"/> 実績クイック入力 (Daily)
                  </h3>
                  {isDailyOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                </button>
                
                {isDailyOpen && (
                  <div className="p-4 space-y-4">
                    {selectedKpi.isCalculated || !!selectedKpi.linkedSource ? (
                      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-center text-xs text-slate-500">
                        {selectedKpi.isCalculated 
                          ? 'この指標は子KPIから自動計算されるため、直接入力できません。' 
                          : 'この指標は外部システムから自動同期されています。'}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 items-end">
                          <div className="space-y-1 w-1/3">
                            <label className="text-[10px] font-bold text-slate-500">日付</label>
                            <input 
                              type="date" 
                              value={quickDate}
                              onChange={(e) => setQuickDate(e.target.value)}
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-primary-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1 flex-1">
                            <label className="text-[10px] font-bold text-slate-500">実績値 ({selectedKpi.unit})</label>
                            <input 
                              type="number" 
                              value={quickActual}
                              onChange={(e) => setQuickActual(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickSave()}
                              placeholder="例: 1500"
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-primary-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 items-end">
                          <div className="space-y-1 flex-1">
                            <label className="text-[10px] font-bold text-slate-500">要因・メモ (任意)</label>
                            <input 
                              type="text" 
                              value={quickComment}
                              onChange={(e) => setQuickComment(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickSave()}
                              placeholder="キャンペーンが好調など"
                              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-primary-500 outline-none"
                            />
                          </div>
                          <button 
                            onClick={handleQuickSave}
                            disabled={!quickActual || isSavingDaily}
                            className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded h-[28px] shrink-0 transition-colors"
                          >
                            {isSavingDaily ? <Loader2 size={14} className="animate-spin" /> : '保存'}
                          </button>
                        </div>
                      </>
                    )}

                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-bold text-slate-400">直近の入力履歴</h4>
                        <button 
                          onClick={handleExportCSV}
                          className="text-[10px] text-primary-500 hover:text-primary-600 flex items-center gap-1"
                        >
                          CSV出力
                        </button>
                      </div>
                      {dailyRecords.length === 0 ? (
                        <p className="text-[10px] text-slate-400">履歴はありません</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                          {dailyRecords.map((r, i) => (
                            <div 
                              key={i} 
                              onClick={() => handleEditHistory(r)}
                              className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded px-2 py-1.5 cursor-pointer hover:border-primary-300 transition-colors"
                              title="クリックして編集"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500">{new Date(r.date).toISOString().split('T')[0]}</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.actualValue.toLocaleString()}</span>
                              </div>
                              {r.comment && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[100px] ml-2" title={r.comment}>{r.comment}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
            
            {/* --- 1. Plan (計画) --- */}
            <section className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <button 
                onClick={() => setIsPlanOpen(!isPlanOpen)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Target size={14} className="text-blue-500"/> 1. Plan (計画)
                </h3>
                {isPlanOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
              </button>
              
              {isPlanOpen && (
                <div className="p-4 space-y-4">
                  {selectedKpi.linkedSource && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 rounded-md flex items-start gap-2">
                      <Link2 size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                        この指標は他プロジェクトから同期されています。目標値・実績値はリンク元から自動取得されるため手動編集できません。
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">定性名</label>
                      <input 
                        type="text" 
                        value={editQualitativeName} 
                        onChange={(e) => setEditQualitativeName(e.target.value)}
                        onBlur={handleSaveValues}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-strategic-teal outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">定量名 (KPI名)</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveValues}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-strategic-teal outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {!isQualitative && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">目標値 ({selectedKpi.unit})</label>
                        <input 
                          type="number" 
                          value={editTargetValue} 
                          onChange={(e) => setEditTargetValue(e.target.value)}
                          onBlur={handleSaveValues}
                          disabled={editIsCalculated || !!selectedKpi.linkedSource}
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-strategic-teal outline-none transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">更新頻度</label>
                      <select
                        value={editUpdateFrequency}
                        onChange={(e) => setEditUpdateFrequency(e.target.value as any)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-strategic-teal outline-none transition-colors"
                      >
                        <option value="daily">日次 (Daily)</option>
                        <option value="weekly">週次 (Weekly)</option>
                        <option value="monthly">月次 (Monthly)</option>
                      </select>
                    </div>
                  </div>

                  {!isQualitative && (
                    <div className="space-y-1 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                      <label className="text-[10px] font-bold text-slate-500">ツリー計算構造</label>
                      <input 
                        type="text" 
                        value={editCalculationFormula} 
                        onChange={(e) => setEditCalculationFormula(e.target.value)}
                        onBlur={handleSaveValues}
                        placeholder="例: 客数 × 客単価 (メモ)"
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 mb-2 focus:border-strategic-teal outline-none"
                      />
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input 
                          type="checkbox" 
                          checked={editIsCalculated} 
                          onChange={(e) => setEditIsCalculated(e.target.checked)} 
                          disabled={!!selectedKpi.linkedSource}
                          className="rounded border-slate-300 text-primary-500"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">子KPIから自動計算する</span>
                      </label>
                      {editIsCalculated && (
                        <div className="mt-2 pl-6">
                          <textarea 
                            value={editFormula} 
                            onChange={(e) => setEditFormula(e.target.value)}
                            onBlur={handleSaveValues}
                            placeholder="例: #{kpi_123} * #{kpi_456}"
                            className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 font-mono focus:border-strategic-teal outline-none min-h-[40px]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* --- 2. Do (実行・タスク) --- */}
            <section className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <button 
                onClick={() => setIsDoOpen(!isDoOpen)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={14} className="text-emerald-500"/> 2. Do (実行・タスク)
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{selectedKpiTasks.length}</span>
                  {isDoOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                </div>
              </button>
              
              {isDoOpen && (
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="新しい施策・タスクを追加..."
                      className="flex-1 text-[11px] px-3 py-1.5 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none"
                    />
                    <button 
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                      className="text-[11px] font-bold px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      追加
                    </button>
                  </div>

                  <div className="space-y-2 mt-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedKpiTasks.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">タスクはまだありません</p>
                    ) : (
                      selectedKpiTasks.map(task => (
                        <div key={task.id} className="border border-slate-200 dark:border-slate-700/50 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                          {/* Task Header Summary */}
                          <div 
                            className="p-2.5 flex items-start gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                          >
                            <button onClick={(e) => { e.stopPropagation(); toggleActionStatus(task.id); }} className="mt-0.5 shrink-0">
                              {task.status === 'done' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-slate-300 dark:text-slate-600" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[12px] font-bold truncate ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><User size={10}/> {task.owner}</span>
                                {task.dueDate && <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><Calendar size={10}/> {task.dueDate.split('T')[0]}</span>}
                                {task.isAiAgentTask && <span className="text-[9px] text-purple-500 font-bold bg-purple-50 dark:bg-purple-900/30 px-1 rounded flex items-center gap-0.5"><Bot size={10}/> AI</span>}
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); useKpiStore.getState().removeAction(task.id); }} className="text-slate-300 hover:text-rose-500 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Task Details Editor (Expanded) */}
                          {editingTaskId === task.id && (
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">タイトル</label>
                                <input 
                                  type="text" 
                                  value={task.title} 
                                  onChange={(e) => useKpiStore.getState().updateAction(task.id, { title: e.target.value })}
                                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 focus:border-emerald-500 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">詳細</label>
                                <textarea 
                                  value={task.description || ''} 
                                  onChange={(e) => useKpiStore.getState().updateAction(task.id, { description: e.target.value })}
                                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 focus:border-emerald-500 outline-none min-h-[40px]"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">担当者</label>
                                  <input 
                                    type="text" 
                                    value={task.owner} 
                                    onChange={(e) => useKpiStore.getState().updateAction(task.id, { owner: e.target.value })}
                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 focus:border-emerald-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">期限</label>
                                  <input 
                                    type="date" 
                                    value={task.dueDate?.split('T')[0] || ''} 
                                    onChange={(e) => useKpiStore.getState().updateAction(task.id, { dueDate: e.target.value })}
                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-900 dark:border-slate-700 focus:border-emerald-500 outline-none"
                                  />
                                </div>
                              </div>
                              
                              {/* AI Agent Execution */}
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Bot size={12} className="text-purple-500" />
                                    AIエージェントに自律実行を委任
                                  </label>
                                  <button 
                                    onClick={() => useKpiStore.getState().updateAction(task.id, { isAiAgentTask: !task.isAiAgentTask, agentStatus: !task.isAiAgentTask ? 'PENDING' : undefined })}
                                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${task.isAiAgentTask ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                  >
                                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${task.isAiAgentTask ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                  </button>
                                </div>
                                
                                {task.isAiAgentTask && (
                                  <div className="mt-2 bg-[#0d1117] rounded-md border border-[#30363d] overflow-hidden flex flex-col">
                                    <div className="bg-[#161b22] px-2 py-1 border-b border-[#30363d] flex items-center justify-between">
                                      <span className="text-[9px] font-mono text-[#8b949e]">Terminal</span>
                                      {task.agentStatus === 'EXECUTING' && (
                                        <span className="flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span></span>
                                      )}
                                    </div>
                                    <div className="p-2 font-mono text-[9px] text-[#c9d1d9] h-20 overflow-y-auto whitespace-pre-wrap flex flex-col gap-1">
                                      {task.agentLog || <span className="text-[#8b949e] italic">// Ready...</span>}
                                    </div>
                                    <div className="p-1.5 bg-[#161b22] border-t border-[#30363d] flex justify-end">
                                      <button 
                                        onClick={async () => {
                                          if (!consumeAiCredits('AIエージェント実行', 30)) return;
                                          useKpiStore.getState().updateAction(task.id, { agentStatus: 'EXECUTING', agentLog: '> Starting autonomous execution...\n' });
                                          try {
                                            const res = await fetch('/api/agent-execute', {
                                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ taskTitle: task.title, taskDescription: task.description, kpiContext: selectedKpi, manifesto: currentProject?.manifesto })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error);
                                            useKpiStore.getState().updateAction(task.id, { agentStatus: 'SUCCESS', agentLog: data.log + '\n\n【Summary】\n' + data.summary, status: 'done' });
                                          } catch (error: any) {
                                            useKpiStore.getState().updateAction(task.id, { agentStatus: 'FAILED', agentLog: `> ERROR: ${error.message}` });
                                          }
                                        }}
                                        disabled={task.agentStatus === 'EXECUTING'}
                                        className="text-[9px] font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 text-white px-2 py-0.5 rounded"
                                      >
                                        実行
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end pt-2">
                                <button onClick={() => setEditingTaskId(null)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">閉じる</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* --- 3. Check (評価・分析) --- */}
            <section className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <button 
                onClick={() => setIsCheckOpen(!isCheckOpen)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={14} className="text-amber-500"/> 3. Check (評価・分析)
                </h3>
                {isCheckOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
              </button>
              
              {isCheckOpen && (
                <div className="p-4 space-y-4">
                  {/* Warning message from automated calculations */}
                  {selectedKpi.warning && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded w-full border border-amber-200 dark:border-amber-800/50">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" /> 
                      <span className="leading-tight">{selectedKpi.warning}</span>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500">現在の実績値 ({selectedKpi.unit})</span>
                      {editIsCalculated && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded">自動計算中</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={editActualValue} 
                        onChange={(e) => setEditActualValue(e.target.value)}
                        onBlur={handleSaveValues}
                        disabled={editIsCalculated || hasChildren || !!selectedKpi.linkedSource}
                        className="flex-1 text-lg font-black font-poppins px-2 py-1.5 border border-slate-200 rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 focus:border-amber-500 outline-none transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">トレンド推移</h5>
                    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-40">
                      <TrendChart 
                        actualValue={selectedKpi.actualValue} 
                        targetValue={selectedKpi.targetValue} 
                        unit={selectedKpi.unit} 
                        history={selectedKpi.history}
                        monthlyData={selectedKpi.monthlyData}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* --- 4. Act (改善・AIコパイロット) --- */}
            <section className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
              <button 
                onClick={() => setIsActOpen(!isActOpen)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Bot size={14} className="text-purple-500"/> 4. Act (改善・AI)
                </h3>
                {isActOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
              </button>
              
              {isActOpen && (
                <div className="p-4 space-y-5">
                  
                  {/* AI Copilot */}
                  <div className="bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-800/50 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-purple-500" />
                      <h4 className="text-[11px] font-bold text-purple-700 dark:text-purple-400">AI Strategy Copilot</h4>
                    </div>
                    {isAiProcessing ? (
                      <AILoadingIndicator subMessage="ツリー構造を再編・最適化しています" />
                    ) : (
                      <>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="例: このKPIを改善するための具体的な施策案を3つ出して、ツリーに追加して。"
                          className="w-full text-[11px] p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:border-purple-500 outline-none resize-none h-16 mb-2"
                        />
                        <button
                          onClick={handleAiReconstruct}
                          disabled={!aiPrompt.trim()}
                          className="w-full py-1.5 bg-purple-600 text-white text-[11px] font-bold rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          AIに改善案を生成・反映させる
                        </button>
                      </>
                    )}
                  </div>

                  {/* Structure modifications */}
                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">構造の管理 (ツリー拡張)</h4>
                     <button 
                        onClick={() => addKpiNode({
                          id: `kpi_${Date.now()}`, name: '新規KPI', type: 'KPI', parentId: selectedKpi.id, targetValue: 0, actualValue: 0, unit: selectedKpi.unit, businessUnit: selectedKpi.businessUnit, addedAt: Date.now(), previousValue: 0, description: ''
                        })}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs text-slate-600 dark:text-slate-300 font-bold"
                      >
                        <Plus size={14} /> 新規の子KPIを追加
                      </button>
                      <button 
                        onClick={() => setIsLinkModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs text-slate-600 dark:text-slate-300 font-bold"
                      >
                        <Link2 size={14} /> 他PJの指標を子としてリンク
                      </button>
                      <button 
                        onClick={() => setIsReviveModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs text-slate-600 dark:text-slate-300 font-bold"
                      >
                        <ArchiveRestore size={14} /> 削除済みのノードを復元
                      </button>
                      
                      {hasChildren && !selectedKpi.isCalculated && (
                        <button 
                          onClick={handleReconstructFormula}
                          className="w-full flex items-center justify-center gap-2 py-2 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 transition-colors text-xs font-bold mt-2"
                        >
                          <Calculator size={14} /> 子要素から計算式を自動生成
                        </button>
                      )}
                  </div>

                </div>
              )}
            </section>
            
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-sm text-slate-400">
          ツリーからKPIを選択してください
        </div>
      )}

      {selectedKpi && (
        <>
          <LinkKpiModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} targetParentId={selectedKpi.id} />
          <ReviveKpiModal isOpen={isReviveModalOpen} onClose={() => setIsReviveModalOpen(false)} targetParentId={selectedKpi.id} />
        </>
      )}
    </div>
  );
};
