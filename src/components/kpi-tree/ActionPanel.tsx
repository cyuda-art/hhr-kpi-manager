import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Lightbulb, Calculator, Link2, ArchiveRestore, MessageSquare, Bot, Loader2, Plus } from 'lucide-react';
import { TrendChart } from '../dashboard/TrendChart';
import { WorkflowTask } from '@/types';
import { getDisplayValue, getStorageValue, shouldScaleWithPeriod } from '@/lib/kpi-utils';
import { LinkKpiModal } from './LinkKpiModal';
import { ReviveKpiModal } from './ReviveKpiModal';

export const ActionPanel = () => {
  const { kpiData, selectedNodeId, actions, toggleActionStatus, addKpiNode, removeKpiNode, updateKpiNode, isPredictionMode, updateSimulatedValue, addAction, currentPeriod, saveHistory } = useKpiStore();
  const { currentProjectId, projects } = useProjectStore();
  const { user } = useAuthStore();
  const currentProject = projects.find(p => p.id === currentProjectId);
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
  // 定性ラベルの決定
  const getQualitativeLabel = () => {
    if (!selectedKpi) return '';
    if (selectedKpi.type === 'KGI') return 'Goal';
    return getLevel(selectedKpi.id) === 1 ? 'KSF' : 'Process';
  };

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'ai'>('details');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleAiReconstruct = async () => {
    if (!aiPrompt.trim() || !currentProject) return;
    setIsAiProcessing(true);
    try {
      const res = await fetch('/api/reconstruct-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          kpiData: kpiData,
          manifesto: currentProject.manifesto,
          swot: currentProject.swot,
          crossSwot: currentProject.crossSwot
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 取得した新しいKPIデータを一括更新
      // （※本来はstoreにsetKpiDataBulkなどを生やすべきですが、今回は簡易的に全消し＆追加か、個別にupdateをかけます。
      // ただしuseKpiStore.setState()が使えないため、一旦storeに追加するなどの対応が必要です。
      // ここではstoreのkpiDataを直接書き換えるためのメソッドを呼ぶ想定ですが、ActionPanelから直接変更する方法として、
      // ひとまず `useKpiStore.getState().kpiData = data.kpiData; useKpiStore.getState().recalculateTree...` は直接触れないので、
      // storeに `overwriteKpiData` メソッドを追加して呼び出すようにします）
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

  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editActualValue, setEditActualValue] = useState('');
  const [editName, setEditName] = useState('');
  const [editQualitativeName, setEditQualitativeName] = useState('');
  const [editUpdateFrequency, setEditUpdateFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [editCalculationFormula, setEditCalculationFormula] = useState('');
  const [editIsCalculated, setEditIsCalculated] = useState(false);
  const [editFormula, setEditFormula] = useState('');

  // 選択されたKPIが変わったら編集モードなどをリセット
  useEffect(() => {
    setIsEditingValue(false);
    if (selectedKpi) {
      const displayTarget = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue');
      const displayActual = getDisplayValue(isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue : selectedKpi.actualValue, selectedKpi, currentPeriod, isPredictionMode ? 'simulatedValue' : 'actualValue');
      
      setEditTargetValue(displayTarget.toString());
      setEditActualValue(displayActual.toString());
      setEditName(selectedKpi.name);
      setEditQualitativeName(selectedKpi.qualitativeName || '');
      setEditUpdateFrequency(selectedKpi.updateFrequency || 'monthly');
      setEditCalculationFormula(selectedKpi.calculationFormula || '');
      setEditIsCalculated(hasChildren ? true : (selectedKpi.isCalculated || false));
      setEditFormula(selectedKpi.formula || '');
    }
  }, [selectedNodeId, kpiData, isPredictionMode, hasChildren, currentPeriod]);

  const { applyRollingForecast } = useKpiStore();
  const handleAiRecovery = () => {
    if (!selectedKpi) return;
    const allMonths = [
      "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
      "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"
    ];
    // Exclude past months and current month (recovery starts NEXT month?)
    // Let's start recovery from current month if possible, but actually we usually recover from the REMAINING months.
    // If we are viewing 2026-05, we distribute the debt of (April) into May~March. So we use currentPeriod and onwards.
    const remainingMonths = allMonths.filter(m => m >= currentPeriod);
    if (remainingMonths.length === 0) return;
    
    const additionalTargetPerMonth = Math.ceil(shortfall / remainingMonths.length);
    applyRollingForecast(selectedKpi.id, additionalTargetPerMonth, remainingMonths);
  };

  const handleSaveValues = () => {
    if (!selectedNodeId || !selectedKpi) return;
    
    // 入力値(UI上の表示スケール)をDB保存用のベーススケール(year基準等)に戻す
    const storedTarget = getStorageValue(Number(editTargetValue) || 0, selectedKpi, currentPeriod, 'targetValue');
    const storedActual = getStorageValue(Number(editActualValue) || 0, selectedKpi, currentPeriod, 'actualValue');

    if (isPredictionMode) {
      updateSimulatedValue(selectedNodeId, storedActual);
      // 目標値のシミュレーション編集は一旦省略（実績のシミュレーションのみ）
    } else {
      saveHistory(); // 値や数式の変更を履歴に積む
      updateKpiNode(selectedNodeId, {
        targetValue: storedTarget,
        actualValue: storedActual,
        name: editName || selectedKpi.name,
        qualitativeName: editQualitativeName || selectedKpi.qualitativeName,
        updateFrequency: editUpdateFrequency,
        calculationFormula: editCalculationFormula,
        isCalculated: editIsCalculated,
        formula: editFormula,
        warning: undefined // 編集して保存したら警告を解除
      });
    }
    setIsEditingValue(false);
  };



  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#2d2f31] relative">
      {selectedKpi ? (
        <>
          {/* ヘッダー情報（常に表示） */}
          <div className="mb-2">
            {selectedKpi.type !== 'KGI' && (
              <button 
                onClick={() => removeKpiNode(selectedKpi.id)}
                className="absolute top-2 right-2 p-1.5 text-slate-400 dark:text-logic-slate dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                title="このKPIを削除"
              >
                <Trash2 size={16} />
              </button>
            )}
            <p className="text-[10px] font-bold text-slate-400 dark:text-logic-slate dark:text-slate-400 uppercase tracking-wider">{selectedKpi.businessUnit}</p>
            {selectedKpi.qualitativeName && (
              <h4 className="font-bold text-oxford-navy dark:text-slate-200 mt-1 break-words">
                <span className="text-[10px] text-primary-500 mr-1">{getQualitativeLabel()}:</span>
                {selectedKpi.qualitativeName.replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
              </h4>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <h4 className="font-bold text-oxford-navy dark:text-slate-200 break-words flex-1">
                <span className="text-[10px] text-emerald-500 mr-1">{selectedKpi.type === 'KGI' ? 'KGI:' : 'KPI:'}</span>
                {isPredictionMode && <span className="text-primary-500 mr-1 text-xs">[予測]</span>}
                {selectedKpi.name}
              </h4>
              <button 
                onClick={() => navigator.clipboard.writeText(`#{${selectedKpi.id}}`)} 
                className="text-[9px] font-mono bg-clean-canvas dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 hover:border-primary-200 dark:hover:text-primary-400 px-1.5 py-0.5 rounded cursor-copy border border-slate-200 dark:border-slate-800 dark:border-slate-700 active:bg-slate-200 flex items-center gap-1 shrink-0"
                title="クリックして計算式用のID（#{id}）をコピー"
              >
                IDをコピー
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <span className={`text-xs font-bold ${
                (isPredictionMode ? selectedKpi.simulatedStatus : selectedKpi.status) === 'danger' ? 'text-rose-500 dark:text-rose-400' : 
                (isPredictionMode ? selectedKpi.simulatedStatus : selectedKpi.status) === 'warning' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
              }`}>
                達成率: {isPredictionMode && selectedKpi.simulatedAchievementRate !== undefined ? selectedKpi.simulatedAchievementRate.toFixed(1) : selectedKpi.achievementRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 dark:border-slate-700 mt-4 mb-3">
            <button onClick={() => setActiveTab('details')} className={`flex-1 py-1.5 text-[11px] font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-strategic-teal text-strategic-teal dark:text-primary-400' : 'border-transparent text-logic-slate dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              詳細・数値
            </button>
            <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-1.5 text-[11px] font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-strategic-teal text-strategic-teal dark:text-primary-400' : 'border-transparent text-logic-slate dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              タスク ({selectedKpiTasks.length})
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
            {/* 1. 詳細・数値タブ */}
                    {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-oxford-navy dark:text-slate-200">AI Strategy Copilot</h3>
                  <p className="text-xs text-logic-slate dark:text-slate-400 mt-1 leading-relaxed">
                    現在のツリー構成やSWOT分析に基づいて、ツリーの動的な再編（再構築）を行います。
                    例：「もっと攻めの戦略に変えて」「プロセス階層を顧客体験中心に再編して」
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="AIへの指示を記述してください..."
                className="w-full h-32 p-3 text-sm border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
              />
              <button
                onClick={handleAiReconstruct}
                disabled={isAiProcessing || !aiPrompt.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {isAiProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isAiProcessing ? 'AIがツリーを再構築中...' : 'ツリーを再編する'}
              </button>
            </div>
          </div>
        )}
        {activeTab === 'details' && (
              <div className="space-y-4">
                {selectedKpi.linkedSource && (
                  <div className="bg-clean-canvas dark:bg-slate-800 border border-slate-200 dark:border-slate-800 dark:border-slate-700 p-2 rounded-md flex items-start gap-2 animate-in fade-in zoom-in-95">
                    <Link2 size={14} className="text-logic-slate dark:text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-logic-slate dark:text-slate-400">
                      この指標は他プロジェクトから同期されています。目標値・実績値はリンク元から自動取得されるため手動編集できません。
                    </p>
                  </div>
                )}
                {/* 数値編集UI */}
                <div>
                  {isEditingValue ? (
                    <div className="space-y-2 border border-slate-200 dark:border-slate-800 dark:border-slate-700 rounded-md p-3 bg-white dark:bg-slate-900">
                      <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800 dark:border-slate-700/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-logic-slate dark:text-slate-400">{getQualitativeLabel()}名 (定性)</span>
                          <input 
                            type="text" 
                            value={editQualitativeName} 
                            onChange={(e) => setEditQualitativeName(e.target.value)}
                            disabled={isPredictionMode}
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-logic-slate dark:text-slate-400">{selectedKpi.type === 'KGI' ? 'KGI名 (定量)' : 'KPI名 (定量)'}</span>
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={isPredictionMode}
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-logic-slate dark:text-slate-400">更新頻度</span>
                          <select
                            value={editUpdateFrequency}
                            onChange={(e) => setEditUpdateFrequency(e.target.value as any)}
                            disabled={isPredictionMode}
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50"
                          >
                            <option value="daily">日次 (Daily)</option>
                            <option value="weekly">週次 (Weekly)</option>
                            <option value="monthly">月次 (Monthly)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-logic-slate dark:text-slate-400">計算式（構造メモ）</span>
                          <input 
                            type="text" 
                            value={editCalculationFormula} 
                            onChange={(e) => setEditCalculationFormula(e.target.value)}
                            disabled={isPredictionMode}
                            placeholder="例: 客数 × 客単価"
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input 
                              type="checkbox" 
                              checked={editIsCalculated} 
                              onChange={(e) => setEditIsCalculated(e.target.checked)} 
                              disabled={isPredictionMode || hasChildren || !!selectedKpi.linkedSource}
                              className="rounded border-slate-300 text-primary-500 focus:ring-strategic-teal disabled:opacity-50"
                            />
                            <span className="text-xs text-logic-slate dark:text-slate-400 font-bold flex items-center gap-1">
                              <Calculator size={12} /> 他のKPIから自動計算する (Formula)
                            </span>
                          </label>
                          {hasChildren && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">※ 子ノードを持つ中間KPIは自動計算が必須です。</div>
                          )}
                        </div>
                        {editIsCalculated && (
                          <div className="flex flex-col gap-1 p-2 bg-clean-canvas dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 dark:border-slate-700">
                            <span className="text-xs text-logic-slate dark:text-slate-400 flex items-center justify-between">
                              <span>数式入力</span>
                            </span>
                            <textarea 
                              value={editFormula} 
                              onChange={(e) => setEditFormula(e.target.value)}
                              disabled={isPredictionMode}
                              placeholder="例: #{kpi_123} * #{kpi_456}"
                              className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50 min-h-[40px] font-mono"
                            />
                            <div className="text-[10px] text-slate-400 mt-1">※ 他ノードのIDを #&#123;id&#125; 形式で指定し四則演算が可能です。</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-logic-slate dark:text-slate-400 w-12">目標値</span>
                        <input 
                          type="number" 
                          value={editTargetValue} 
                          onChange={(e) => setEditTargetValue(e.target.value)}
                          disabled={isPredictionMode || editIsCalculated || !!selectedKpi.linkedSource}
                          className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                        <span className="text-xs text-logic-slate dark:text-slate-400 w-4">{selectedKpi.unit}</span>
                      </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-logic-slate dark:text-slate-400 w-12">{isPredictionMode ? '予測値' : '実績値'}</span>
                    <input 
                      type="number" 
                      value={editActualValue} 
                      onChange={(e) => setEditActualValue(e.target.value)}
                      disabled={editIsCalculated || hasChildren || !!selectedKpi.linkedSource}
                      className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                    <span className="text-xs text-logic-slate dark:text-slate-400 w-4">{selectedKpi.unit}</span>
                  </div>
                  {editIsCalculated && !isPredictionMode && (
                    <div className="text-[10px] text-slate-400 text-right mt-1">※ 自動計算ノードの実績は手動入力できません。</div>
                  )}
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditingValue(false)} className="text-[10px] px-2 py-1 text-logic-slate dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">キャンセル</button>
                    <button onClick={handleSaveValues} className="text-[10px] px-2 py-1 bg-primary-500 text-white rounded hover:bg-strategic-teal font-bold">保存して反映</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 group/edit cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors border border-transparent hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700" onClick={() => setIsEditingValue(true)}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-logic-slate dark:text-slate-400">
                        目標: <span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod, 'targetValue')).toLocaleString()}</span> {selectedKpi.unit}
                      </div>
                      <div className="text-xs text-logic-slate dark:text-slate-400">
                        {isPredictionMode ? '予測' : '実績'}: <span className="font-bold text-oxford-navy dark:text-slate-200">{Math.round(getDisplayValue(isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue : selectedKpi.actualValue, selectedKpi, currentPeriod, isPredictionMode ? 'simulatedValue' : 'actualValue')).toLocaleString()}</span> {selectedKpi.unit}
                      </div>
                    </div>
                    <div className="text-primary-500 opacity-0 group-hover/edit:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                      <Edit2 size={12} /> 編集
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 text-[10px] text-logic-slate dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-logic-slate dark:text-slate-400">
                          {selectedKpi.updateFrequency === 'daily' ? '日次更新' : selectedKpi.updateFrequency === 'weekly' ? '週次更新' : '月次更新'}
                        </span>
                      </span>
                      {selectedKpi.calculationFormula && (
                        <span className="truncate" title={selectedKpi.calculationFormula}>メモ: {selectedKpi.calculationFormula}</span>
                      )}
                    </div>
                    {selectedKpi.isCalculated ? (
                      <div className="flex items-center gap-1 text-[10px] text-strategic-teal dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded w-fit mt-1 border border-primary-100 dark:border-primary-800/50">
                        <Calculator size={10} /> 自動計算: <span className="font-mono">{selectedKpi.formula || '（数式が空です）'}</span>
                      </div>
                    ) : hasChildren ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded w-fit mt-1 border border-amber-200 dark:border-amber-800/50">
                        <AlertTriangle size={10} /> 計算式が未設定です（クリックして編集）
                      </div>
                    ) : null}

                    {selectedKpi.warning && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded w-full mt-1 border border-amber-200 dark:border-amber-800/50 animate-pulse">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" /> 
                        <span className="leading-tight">{selectedKpi.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AIリカバリープラン提案 (未達時のみ表示) */}
            {hasShortfall && !isPredictionMode && (
              <div className="mt-4 bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-1.5 rounded flex-shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[12px] font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                      未達残債アラート
                    </h5>
                    <p className="text-[11px] text-red-700/80 dark:text-red-400/80 mt-1 mb-2 leading-relaxed">
                      前月までの累計で <span className="font-bold text-red-600 dark:text-red-400">{Math.round(shortfall).toLocaleString()} {selectedKpi.unit}</span> のショートフォールが発生しています。残りの期間でリカバリーするための目標再設定をAIにシミュレーションさせますか？
                    </p>
                    <button 
                      onClick={handleAiRecovery}
                      className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 transition-colors py-1.5 rounded-[4px] text-[11px] font-bold shadow-sm"
                    >
                      <Bot size={14} />
                      AIリカバリープランを作成 (シミュレーション)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* トレンドチャート */}
            <div className="mt-4">
              <h5 className="text-[10px] font-bold text-logic-slate dark:text-slate-400 uppercase tracking-wider mb-2">トレンド推移</h5>
              <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 dark:border-slate-700">
                <TrendChart 
                  actualValue={selectedKpi.actualValue} 
                  targetValue={selectedKpi.targetValue} 
                  unit={selectedKpi.unit} 
                />
              </div>
            </div>

            {/* 子ノード追加・リンク機能 */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 dark:border-slate-700">
              <h5 className="text-[10px] font-bold text-logic-slate dark:text-slate-400 uppercase tracking-wider mb-2">子要素 (KPI/プロセス)</h5>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const newId = `kpi_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    useKpiStore.getState().addKpiNode({
                      id: newId,
                      name: '新規KPI (手動)',
                      qualitativeName: '手動追加された指標',
                      businessUnit: selectedKpi.businessUnit,
                      type: 'KPI',
                      parentId: selectedKpi.id,
                      targetValue: 100,
                      actualValue: 0,
                      unit: selectedKpi.unit || '件',
                      previousValue: 0,
                      description: '手動で追加されたKPIです。設定から詳細を編集してください。',
                      isCalculated: false,
                      formula: ''
                    });
                  }}
                  className="w-full text-[11px] py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-logic-slate dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm font-bold"
                >
                  <Plus size={14} /> 新規KPIを手動で追加
                </button>
                <button 
                  onClick={() => setIsLinkModalOpen(true)}
                  className="w-full text-[11px] py-2 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-strategic-teal dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center justify-center gap-1.5 shadow-sm font-bold"
                >
                  <Link2 size={14} /> 他プロジェクトから同期して追加
                </button>
                <button 
                  onClick={() => setIsReviveModalOpen(true)}
                  className="w-full text-[11px] py-2 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1.5 shadow-sm font-bold"
                >
                  <ArchiveRestore size={14} /> アーカイブデータ（履歴）を引き継いで追加
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                ※自社・他部署の既存プロジェクトから数値を自動連携できます（例: 顧客アンケート結果など）
              </p>
            </div>
          </div>
          )}

          {/* 2. タスクタブ */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {selectedKpiTasks.length === 0 ? (
                  <p className="text-xs text-logic-slate dark:text-slate-400 text-center py-4 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 dark:border-slate-700">タスクはありません</p>
                ) : (
                  selectedKpiTasks.map(task => (
                    <div key={task.id} className="flex flex-col bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 dark:border-slate-700 transition-colors group/task">
                      <div className="flex items-start gap-2 p-2">
                        <button 
                          onClick={() => toggleActionStatus(task.id)}
                          className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-primary-500 transition-colors"
                        >
                          {task.status === 'done' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
                        </button>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className={`text-xs font-medium truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] text-logic-slate dark:text-slate-400 bg-clean-canvas dark:bg-slate-800 px-1 rounded truncate max-w-[80px]">{task.owner || '未設定'}</span>
                            {task.department && <span className="text-[9px] text-logic-slate dark:text-slate-400 bg-clean-canvas dark:bg-slate-800 px-1 rounded">{task.department}</span>}
                            <span className="text-[9px] text-slate-400">
                              {task.startDate ? task.startDate.split('T')[0] : ''} 
                              {task.startDate || task.dueDate ? ' 〜 ' : '期限なし'}
                              {task.dueDate ? task.dueDate.split('T')[0] : ''}
                            </span>
                            {task.priority && (
                              <span className={`text-[9px] px-1 rounded ${
                                task.priority === 'urgent_important' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                task.priority === 'not_urgent_important' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                task.priority === 'urgent_not_important' ? 'bg-blue-100 text-strategic-teal dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {task.priority === 'urgent_important' ? '第1領域(必須・急)' :
                                 task.priority === 'not_urgent_important' ? '第2領域(重要・仕込)' :
                                 task.priority === 'urgent_not_important' ? '第3領域(錯覚・振分)' : '第4領域(無駄)'}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-logic-slate dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                          <button onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)} className="text-slate-400 hover:text-primary-500 p-1">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => { if(window.confirm('このタスクを削除しますか？')) useKpiStore.getState().removeAction(task.id) }} className="text-slate-400 hover:text-rose-500 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      {/* インライン編集フォーム */}
                      {editingTaskId === task.id && (
                        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-clean-canvas dark:bg-slate-900/50 space-y-2">
                          <div>
                            <label className="text-[10px] text-logic-slate dark:text-slate-400">タイトル</label>
                            <input type="text" defaultValue={task.title} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" onBlur={(e) => useKpiStore.getState().updateAction(task.id, { title: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[10px] text-logic-slate dark:text-slate-400">詳細</label>
                            <textarea defaultValue={task.description} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" rows={2} onBlur={(e) => useKpiStore.getState().updateAction(task.id, { description: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-logic-slate dark:text-slate-400">担当者</label>
                              <input type="text" defaultValue={task.owner} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" onBlur={(e) => useKpiStore.getState().updateAction(task.id, { owner: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-[10px] text-logic-slate dark:text-slate-400">部署</label>
                              <input type="text" defaultValue={task.department || ''} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" onBlur={(e) => useKpiStore.getState().updateAction(task.id, { department: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-logic-slate dark:text-slate-400">優先度 (重要度×緊急度)</label>
                              <select defaultValue={task.priority || 'unassigned'} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" onChange={(e) => useKpiStore.getState().updateAction(task.id, { priority: e.target.value as any })}>
                                <option value="unassigned">未設定</option>
                                <option value="urgent_important">第1領域(必須・緊急)</option>
                                <option value="not_urgent_important">第2領域(重要・仕込)</option>
                                <option value="urgent_not_important">第3領域(錯覚・振分)</option>
                                <option value="not_urgent_not_important">第4領域(無駄・削除)</option>
                              </select>
                            </div>
                            <div className="flex gap-1">
                              <div className="flex-1">
                                <label className="text-[10px] text-logic-slate dark:text-slate-400">開始日</label>
                                <input type="date" defaultValue={task.startDate?.split('T')[0]} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" onChange={(e) => useKpiStore.getState().updateAction(task.id, { startDate: e.target.value })} />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-logic-slate dark:text-slate-400">期限</label>
                                <input type="date" defaultValue={task.dueDate?.split('T')[0]} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200" onChange={(e) => useKpiStore.getState().updateAction(task.id, { dueDate: e.target.value })} />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button onClick={() => setEditingTaskId(null)} className="text-[10px] bg-primary-500 text-white px-3 py-1 rounded">完了</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 手動タスク追加 */}
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 dark:border-slate-700">
                <input 
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="新しいタスクを追加..."
                  className="flex-1 text-xs px-2 py-1.5 border-none dark:bg-slate-900 dark:text-slate-200 focus:outline-none"
                />
                <button 
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="text-[10px] font-bold px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  追加
                </button>
              </div>
            </div>
          )}
        </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-logic-slate dark:text-slate-400">
          ツリーからKPIを選択してください
        </div>
      )}

      {selectedKpi && (
        <>
          <LinkKpiModal 
            isOpen={isLinkModalOpen} 
            onClose={() => setIsLinkModalOpen(false)} 
            targetParentId={selectedKpi.id} 
          />
          <ReviveKpiModal 
            isOpen={isReviveModalOpen} 
            onClose={() => setIsReviveModalOpen(false)} 
            targetParentId={selectedKpi.id} 
          />
        </>
      )}
    </div>
  );
};
