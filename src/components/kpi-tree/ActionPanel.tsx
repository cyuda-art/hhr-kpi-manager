import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Lightbulb, Calculator } from 'lucide-react';
import { TrendChart } from '../dashboard/TrendChart';
import { WorkflowTask } from '@/types';

export const ActionPanel = () => {
  const { kpiData, selectedNodeId, actions, toggleActionStatus, addKpiNode, removeKpiNode, updateKpiNode, isPredictionMode, updateSimulatedValue, workflows, setAiWorkflow, addAction } = useKpiStore();
  const { currentProjectId, projects } = useProjectStore();
  const { user } = useAuthStore();
  const currentProject = projects.find(p => p.id === currentProjectId);
  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;
  const currentWorkflow = selectedNodeId ? workflows[selectedNodeId] : null;

  const selectedKpiTasks = actions.filter(a => a.kpiId === selectedNodeId);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'ai'>('details');

  const handleAddTask = () => {
    if (!selectedKpi || !newTaskTitle.trim()) return;
    addAction({
      kpiId: selectedKpi.id,
      title: newTaskTitle.trim(),
      owner: user?.displayName || user?.email?.split('@')[0] || '未定',
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

  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [isAnalyzingPdca, setIsAnalyzingPdca] = useState(false);
  const [pdcaResult, setPdcaResult] = useState<React.ReactNode | null>(null);
  const [workflowError, setWorkflowError] = useState('');

  // 選択されたKPIが変わったら編集モードなどをリセット
  useEffect(() => {
    setWorkflowError('');
    setIsEditingValue(false);
    if (selectedKpi) {
      setEditTargetValue(selectedKpi.targetValue.toString());
      setEditActualValue(isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue.toString() : selectedKpi.actualValue.toString());
      setEditName(selectedKpi.name);
      setEditQualitativeName(selectedKpi.qualitativeName || '');
      setEditUpdateFrequency(selectedKpi.updateFrequency || 'monthly');
      setEditCalculationFormula(selectedKpi.calculationFormula || '');
      setEditIsCalculated(selectedKpi.isCalculated || false);
      setEditFormula(selectedKpi.formula || '');
    }
  }, [selectedNodeId, kpiData, isPredictionMode]); 

  const handleSaveValues = () => {
    if (!selectedNodeId) return;
    
    if (isPredictionMode) {
      updateSimulatedValue(selectedNodeId, Number(editActualValue) || 0);
      // 目標値のシミュレーション編集は一旦省略（実績のシミュレーションのみ）
    } else {
      updateKpiNode(selectedNodeId, {
        targetValue: Number(editTargetValue) || 0,
        actualValue: Number(editActualValue) || 0,
        name: editName || selectedKpi?.name,
        qualitativeName: editQualitativeName || selectedKpi?.qualitativeName,
        updateFrequency: editUpdateFrequency,
        calculationFormula: editCalculationFormula,
        isCalculated: editIsCalculated,
        formula: editFormula
      });
    }
    setIsEditingValue(false);
  };



  const generateWorkflow = async () => {
    if (!selectedKpi) return;
    setIsGeneratingWorkflow(true);
    setWorkflowError('');
    
    try {
      const kgiNode = Object.values(kpiData).find(k => k.type === 'KGI');
      const companyInfo = currentProject ? `業種: ${currentProject.industry || '未設定'}, 売上規模: ${currentProject.revenueScale || '未設定'}, MVV: ${currentProject.mvv || '未設定'}` : '';

      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_info: companyInfo,
          kgi: kgiNode?.name || '',
          ksf: selectedKpi.qualitativeName || selectedKpi.name,
          kpi: `${selectedKpi.name} (目標: ${selectedKpi.targetValue}${selectedKpi.unit})`,
          current_status: `現在の達成率: ${selectedKpi.achievementRate.toFixed(1)}%`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate workflow');

      if (data.data && data.data.workflow) {
        let taskCount = 0;
        let currentParentId = selectedKpi.id; // 最初は選択されたノードを親とする
        
        // フェーズ（KSF）ごとに子ノードを作成し、そこにタスクをぶら下げる
        data.data.workflow.forEach((phase: any) => {
          const newKpiId = `kpi_ai_${Math.random().toString(36).substr(2, 9)}`;
          addKpiNode({
            id: newKpiId,
            name: phase.kpi_name || '新規KPI',
            qualitativeName: phase.phase_name,
            businessUnit: selectedKpi.businessUnit,
            type: 'KPI',
            parentId: currentParentId, // 直前のノードを親に設定して直列（一本道）に繋ぐ
            targetValue: phase.target_value || 0,
            actualValue: 0,
            unit: phase.unit || '件',
            previousValue: 0,
            description: phase.objective || ''
          });

          // 次のPhaseは、このPhaseの「下位」として繋ぐためにIDを更新する
          currentParentId = newKpiId;

          // 各タスクをToDo（actions）に追加
          if (Array.isArray(phase.tasks)) {
            phase.tasks.forEach((task: any) => {
              addAction({
                kpiId: newKpiId,
                title: task.task_name,
                owner: '未定', // 自動アサイン用に仮置き（後でユーザー名に変えやすい）
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'todo'
              });
              taskCount++;
            });
          }
        });

        // プレビュー表示用にも保存
        setAiWorkflow(selectedKpi.id, {
          ...data.data,
          generatedAt: Date.now()
        });

        alert(`ツリーの細分化と、全フェーズにおける計${taskCount}個のタスクの自動アサインが完了しました！`);
      }
    } catch (err: any) {
      console.error(err);
      setWorkflowError(`ワークフロー生成エラー: ${err.message || '予期せぬエラーが発生しました'}`);
    } finally {
      setIsGeneratingWorkflow(false);
    }
  };

  const handleAddTaskToTodo = (task: WorkflowTask) => {
    if (!selectedKpi) return;
    addAction({
      kpiId: selectedKpi.id,
      title: task.task_name,
      owner: '未定',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
      status: 'todo'
    });
    alert('タスクをToDoリストに追加しました！');
  };

  const analyzePdca = () => {
    if (!selectedKpi) return;
    setIsAnalyzingPdca(true);
    setPdcaResult(null);
    // モックアップ：AIからの返答をシミュレーション
    setTimeout(() => {
      const isAchieved = selectedKpi.achievementRate >= 100;
      setPdcaResult(isAchieved  
        ? <><div className="flex items-center gap-1 text-emerald-500 font-bold"><CheckCircle2 size={16} /> 【達成要因の分析】</div>目標を上回るペースで推移しています。現在のタスク（{selectedKpiTasks.length}件）が有効に機能していると考えられます。<br/><br/><div className="font-bold">【次の一手】</div>この成功パターンを他の事業部にも横展開するための「ナレッジ共有タスク」の追加を推奨します。</>
        : <><div className="flex items-center gap-1 text-rose-500 font-bold"><AlertTriangle size={16} /> 【未達要因の分析】</div>目標に対して{(100 - selectedKpi.achievementRate).toFixed(1)}%ショートしています。<br/>計算式「{selectedKpi.calculationFormula || '未設定'}」に照らし合わせると、現在の進捗スピードでは目標達成が困難です。<br/><br/><div className="font-bold">【次の一手】</div>リカバリープランとして以下のタスクを追加することを推奨します。<br/>・原因究明とボトルネックの特定（担当：マネージャー）<br/>・今週末までのテコ入れ施策の立案</>
      );
      setIsAnalyzingPdca(false);
    }, 2000);
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
                <span className="text-[10px] text-primary-500 mr-1">{selectedKpi.type === 'KGI' ? 'Goal:' : 'KSF:'}</span>
                {selectedKpi.qualitativeName}
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
            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-1.5 text-[11px] font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'ai' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Sparkles size={12} /> AI・PDCA
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
            {/* 1. 詳細・数値タブ */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {/* 数値編集UI */}
                <div>
                  {isEditingValue ? (
                    <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-md p-3 bg-white dark:bg-slate-900">
                      <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">{selectedKpi.type === 'KGI' ? 'Goal名 (定性)' : 'KSF名 (定性)'}</span>
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
                              disabled={isPredictionMode}
                              className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <Calculator size={12} /> 他のKPIから自動計算する (Formula)
                            </span>
                          </label>
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
                          disabled={isPredictionMode || editIsCalculated}
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
                      disabled={editIsCalculated}
                      className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                    <span className="text-xs text-slate-500 w-4">{selectedKpi.unit}</span>
                  </div>
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
                        目標: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedKpi.targetValue.toLocaleString()}</span> {selectedKpi.unit}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {isPredictionMode ? '予測' : '実績'}: <span className="font-bold text-slate-800 dark:text-slate-200">{isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue.toLocaleString() : selectedKpi.actualValue.toLocaleString()}</span> {selectedKpi.unit}
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
                    {selectedKpi.isCalculated && (
                      <div className="flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded w-fit mt-1 border border-primary-100 dark:border-primary-800/50">
                        <Calculator size={10} /> 自動計算: <span className="font-mono">{selectedKpi.formula}</span>
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
                    <div key={task.id} className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors">
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
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 rounded truncate max-w-[80px]">{task.owner || '未設定'}</span>
                          <span className="text-[9px] text-slate-400">{task.dueDate ? task.dueDate.split('T')[0] : '期限なし'}</span>
                        </div>
                      </div>
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

          {/* 3. AI分析・PDCAタブ */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary-500" />
                  実績データをもとにAIがPDCAを回す
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  現在の達成率（{selectedKpi.achievementRate.toFixed(1)}%）と関連タスクの進行状況をAIが分析し、未達の場合はリカバリー策となるタスクを自動提案します。
                </p>
                <button 
                  onClick={analyzePdca}
                  disabled={isAnalyzingPdca}
                  className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzingPdca ? '分析中...' : '現状分析と次の一手を提案'}
                </button>

                {pdcaResult && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    {pdcaResult}
                  </div>
                )}
              </div>

              {!currentWorkflow && !isGeneratingWorkflow && (
                <button 
                  onClick={generateWorkflow}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white rounded-lg flex items-center justify-center gap-2 text-[11px] font-bold transition-all shadow-sm group"
                >
                  <Sparkles size={14} className="group-hover:animate-pulse" />
                  ゼロから実行プラン（フェーズ・タスク）を構築
                </button>
              )}

              {isGeneratingWorkflow && (
                <div className="siri-blob-container p-1 rounded-xl">
                  <div className="siri-blob rounded-xl"></div>
                  <div className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 p-6 rounded-xl flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <Sparkles size={28} className="text-primary-500 animate-pulse relative" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 animate-pulse tracking-wide text-center">
                      戦略を具体的なタスクに分解中...<br/>
                      <span className="text-[10px] font-normal opacity-70">組織のリソース制約と目標を考慮しています</span>
                    </p>
                  </div>
                </div>
              )}

              {workflowError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-3 rounded-md text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-4">
                  {workflowError}
                </div>
              )}

              {currentWorkflow && (
                <div className="bg-white dark:bg-slate-900 border border-primary-200 dark:border-slate-700 p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary-500" />
                      生成された戦略見解
                    </h5>
                    <button onClick={generateWorkflow} className="text-[9px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline">再生成</button>
                  </div>
                  
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded leading-relaxed">
                    {currentWorkflow.ksf_analysis}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <strong className="flex items-center gap-1"><Lightbulb size={12} className="text-amber-500" /> KPIアドバイス:</strong> {currentWorkflow.kpi_advice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
          ツリーからKPIを選択してください
        </div>
      )}
    </div>
  );
};
