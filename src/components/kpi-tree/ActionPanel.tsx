import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Lightbulb, Calculator, Link2, ArchiveRestore } from 'lucide-react';
import { TrendChart } from '../dashboard/TrendChart';
import { WorkflowTask } from '@/types';
import { getDisplayValue, getStorageValue } from '@/lib/kpi-utils';
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
  
  // 階層(深さ)の計算
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

  // 定性ラベルの決定
  const getQualitativeLabel = () => {
    if (!selectedKpi) return '';
    if (selectedKpi.type === 'KGI') return 'Goal';
    return getLevel(selectedKpi.id) === 1 ? 'KSF' : 'Process';
  };

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);

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
      const displayTarget = getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod);
      const displayActual = getDisplayValue(isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue : selectedKpi.actualValue, selectedKpi, currentPeriod);
      
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

  const handleSaveValues = () => {
    if (!selectedNodeId || !selectedKpi) return;
    
    // 入力値(UI上の表示スケール)をDB保存用のベーススケール(year基準等)に戻す
    const storedTarget = getStorageValue(Number(editTargetValue) || 0, selectedKpi, currentPeriod);
    const storedActual = getStorageValue(Number(editActualValue) || 0, selectedKpi, currentPeriod);

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
                className="absolute top-2 right-2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                title="このKPIを削除"
              >
                <Trash2 size={16} />
              </button>
            )}
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{selectedKpi.businessUnit}</p>
            {selectedKpi.qualitativeName && (
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1 break-words">
                <span className="text-[10px] text-primary-500 mr-1">{getQualitativeLabel()}:</span>
                {selectedKpi.qualitativeName.replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
              </h4>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 break-words flex-1">
                <span className="text-[10px] text-emerald-500 mr-1">{selectedKpi.type === 'KGI' ? 'KGI:' : 'KPI:'}</span>
                {isPredictionMode && <span className="text-primary-500 mr-1 text-xs">[予測]</span>}
                {selectedKpi.name}
              </h4>
              <button 
                onClick={() => navigator.clipboard.writeText(`#{${selectedKpi.id}}`)} 
                className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-500 hover:bg-primary-50 hover:border-primary-200 dark:hover:text-primary-400 px-1.5 py-0.5 rounded cursor-copy border border-slate-200 dark:border-slate-700 active:bg-slate-200 flex items-center gap-1 shrink-0"
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
          <div className="flex border-b border-slate-200 dark:border-slate-700 mt-4 mb-3">
            <button onClick={() => setActiveTab('details')} className={`flex-1 py-1.5 text-[11px] font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              詳細・数値
            </button>
            <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-1.5 text-[11px] font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              タスク ({selectedKpiTasks.length})
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
            {/* 1. 詳細・数値タブ */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {selectedKpi.linkedSource && (
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-md flex items-start gap-2 animate-in fade-in zoom-in-95">
                    <Link2 size={14} className="text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      この指標は他プロジェクトから同期されています。目標値・実績値はリンク元から自動取得されるため手動編集できません。
                    </p>
                  </div>
                )}
                {/* 数値編集UI */}
                <div>
                  {isEditingValue ? (
                    <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-white dark:bg-slate-900">
                      <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">{getQualitativeLabel()}名 (定性)</span>
                          <input 
                            type="text" 
                            value={editQualitativeName} 
                            onChange={(e) => setEditQualitativeName(e.target.value)}
                            disabled={isPredictionMode}
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">{selectedKpi.type === 'KGI' ? 'KGI名 (定量)' : 'KPI名 (定量)'}</span>
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={isPredictionMode}
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">更新頻度</span>
                          <select
                            value={editUpdateFrequency}
                            onChange={(e) => setEditUpdateFrequency(e.target.value as any)}
                            disabled={isPredictionMode}
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <option value="daily">日次 (Daily)</option>
                            <option value="weekly">週次 (Weekly)</option>
                            <option value="monthly">月次 (Monthly)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">計算式（構造メモ）</span>
                          <input 
                            type="text" 
                            value={editCalculationFormula} 
                            onChange={(e) => setEditCalculationFormula(e.target.value)}
                            disabled={isPredictionMode}
                            placeholder="例: 客数 × 客単価"
                            className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input 
                              type="checkbox" 
                              checked={editIsCalculated} 
                              onChange={(e) => setEditIsCalculated(e.target.checked)} 
                              disabled={isPredictionMode || hasChildren || !!selectedKpi.linkedSource}
                              className="rounded border-slate-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <Calculator size={12} /> 他のKPIから自動計算する (Formula)
                            </span>
                          </label>
                          {hasChildren && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">※ 子ノードを持つ中間KPIは自動計算が必須です。</div>
                          )}
                        </div>
                        {editIsCalculated && (
                          <div className="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-500 flex items-center justify-between">
                              <span>数式入力</span>
                            </span>
                            <textarea 
                              value={editFormula} 
                              onChange={(e) => setEditFormula(e.target.value)}
                              disabled={isPredictionMode}
                              placeholder="例: #{kpi_123} * #{kpi_456}"
                              className="w-full text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 min-h-[40px] font-mono"
                            />
                            <div className="text-[10px] text-slate-400 mt-1">※ 他ノードのIDを #&#123;id&#125; 形式で指定し四則演算が可能です。</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 w-12">目標値</span>
                        <input 
                          type="number" 
                          value={editTargetValue} 
                          onChange={(e) => setEditTargetValue(e.target.value)}
                          disabled={isPredictionMode || editIsCalculated || !!selectedKpi.linkedSource}
                          className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        />
                        <span className="text-xs text-slate-500 w-4">{selectedKpi.unit}</span>
                      </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 w-12">{isPredictionMode ? '予測値' : '実績値'}</span>
                    <input 
                      type="number" 
                      value={editActualValue} 
                      onChange={(e) => setEditActualValue(e.target.value)}
                      disabled={editIsCalculated || hasChildren || !!selectedKpi.linkedSource}
                      className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                    <span className="text-xs text-slate-500 w-4">{selectedKpi.unit}</span>
                  </div>
                  {editIsCalculated && !isPredictionMode && (
                    <div className="text-[10px] text-slate-400 text-right mt-1">※ 自動計算ノードの実績は手動入力できません。</div>
                  )}
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditingValue(false)} className="text-[10px] px-2 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">キャンセル</button>
                    <button onClick={handleSaveValues} className="text-[10px] px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 font-bold">保存して反映</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 group/edit cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700" onClick={() => setIsEditingValue(true)}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        目標: <span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(getDisplayValue(selectedKpi.targetValue, selectedKpi, currentPeriod)).toLocaleString()}</span> {selectedKpi.unit}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {isPredictionMode ? '予測' : '実績'}: <span className="font-bold text-slate-800 dark:text-slate-200">{Math.round(getDisplayValue(isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue : selectedKpi.actualValue, selectedKpi, currentPeriod)).toLocaleString()}</span> {selectedKpi.unit}
                      </div>
                    </div>
                    <div className="text-primary-500 opacity-0 group-hover/edit:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                      <Edit2 size={12} /> 編集
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300">
                          {selectedKpi.updateFrequency === 'daily' ? '日次更新' : selectedKpi.updateFrequency === 'weekly' ? '週次更新' : '月次更新'}
                        </span>
                      </span>
                      {selectedKpi.calculationFormula && (
                        <span className="truncate" title={selectedKpi.calculationFormula}>メモ: {selectedKpi.calculationFormula}</span>
                      )}
                    </div>
                    {selectedKpi.isCalculated ? (
                      <div className="flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded w-fit mt-1 border border-primary-100 dark:border-primary-800/50">
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

            {/* トレンドチャート */}
            <div className="mt-4">
              <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">トレンド推移</h5>
              <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <TrendChart 
                  actualValue={selectedKpi.actualValue} 
                  targetValue={selectedKpi.targetValue} 
                  unit={selectedKpi.unit} 
                />
              </div>
            </div>

            {/* 子ノード追加・リンク機能 */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">子要素 (KPI/プロセス)</h5>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setIsLinkModalOpen(true)}
                  className="w-full text-[11px] py-2 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center justify-center gap-1.5 shadow-sm font-bold"
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
                  <p className="text-xs text-slate-500 text-center py-4 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">タスクはありません</p>
                ) : (
                  selectedKpiTasks.map(task => (
                    <div key={task.id} className="flex flex-col bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 transition-colors group/task">
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
                            <span className="text-[9px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded truncate max-w-[80px]">{task.owner || '未設定'}</span>
                            {task.department && <span className="text-[9px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded">{task.department}</span>}
                            <span className="text-[9px] text-slate-400">
                              {task.startDate ? task.startDate.split('T')[0] : ''} 
                              {task.startDate || task.dueDate ? ' 〜 ' : '期限なし'}
                              {task.dueDate ? task.dueDate.split('T')[0] : ''}
                            </span>
                            {task.priority && (
                              <span className={`text-[9px] px-1 rounded ${
                                task.priority === 'urgent_important' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                task.priority === 'not_urgent_important' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                task.priority === 'urgent_not_important' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {task.priority === 'urgent_important' ? '第1領域(必須・急)' :
                                 task.priority === 'not_urgent_important' ? '第2領域(重要・仕込)' :
                                 task.priority === 'urgent_not_important' ? '第3領域(錯覚・振分)' : '第4領域(無駄)'}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
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
                        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                          <div>
                            <label className="text-[10px] text-slate-500">タイトル</label>
                            <input type="text" defaultValue={task.title} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" onBlur={(e) => useKpiStore.getState().updateAction(task.id, { title: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500">詳細</label>
                            <textarea defaultValue={task.description} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" rows={2} onBlur={(e) => useKpiStore.getState().updateAction(task.id, { description: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500">担当者</label>
                              <input type="text" defaultValue={task.owner} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" onBlur={(e) => useKpiStore.getState().updateAction(task.id, { owner: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500">部署</label>
                              <input type="text" defaultValue={task.department || ''} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" onBlur={(e) => useKpiStore.getState().updateAction(task.id, { department: e.target.value })} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500">優先度 (重要度×緊急度)</label>
                              <select defaultValue={task.priority || 'unassigned'} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" onChange={(e) => useKpiStore.getState().updateAction(task.id, { priority: e.target.value as any })}>
                                <option value="unassigned">未設定</option>
                                <option value="urgent_important">第1領域(必須・緊急)</option>
                                <option value="not_urgent_important">第2領域(重要・仕込)</option>
                                <option value="urgent_not_important">第3領域(錯覚・振分)</option>
                                <option value="not_urgent_not_important">第4領域(無駄・削除)</option>
                              </select>
                            </div>
                            <div className="flex gap-1">
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500">開始日</label>
                                <input type="date" defaultValue={task.startDate?.split('T')[0]} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" onChange={(e) => useKpiStore.getState().updateAction(task.id, { startDate: e.target.value })} />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-slate-500">期限</label>
                                <input type="date" defaultValue={task.dueDate?.split('T')[0]} className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" onChange={(e) => useKpiStore.getState().updateAction(task.id, { dueDate: e.target.value })} />
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
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
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
        <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
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
