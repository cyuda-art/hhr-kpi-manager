import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
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

  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
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
        qualitativeName: editQualitativeName || selectedKpi?.qualitativeName
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

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        {selectedKpi ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 relative">
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
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1 break-words">
              <span className="text-[10px] text-emerald-500 mr-1">{selectedKpi.type === 'KGI' ? 'KGI:' : 'KPI:'}</span>
              {isPredictionMode && <span className="text-primary-500 mr-1 text-xs">[予測]</span>}
              {selectedKpi.name}
            </h4>
            <div className="flex gap-2 mt-2">
              <span className={`text-xs font-bold ${
                (isPredictionMode ? selectedKpi.simulatedStatus : selectedKpi.status) === 'danger' ? 'text-rose-500 dark:text-rose-400' : 
                (isPredictionMode ? selectedKpi.simulatedStatus : selectedKpi.status) === 'warning' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
              }`}>
                達成率: {isPredictionMode && selectedKpi.simulatedAchievementRate !== undefined ? selectedKpi.simulatedAchievementRate.toFixed(1) : selectedKpi.achievementRate.toFixed(1)}%
              </span>
            </div>

            {/* 数値編集UI */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
              {isEditingValue ? (
                <div className="space-y-2">
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
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 w-12">目標値</span>
                    <input 
                      type="number" 
                      value={editTargetValue} 
                      onChange={(e) => setEditTargetValue(e.target.value)}
                      disabled={isPredictionMode}
                      className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                    />
                    <span className="text-xs text-slate-500 w-4">{selectedKpi.unit}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 w-12">{isPredictionMode ? '予測値' : '実績値'}</span>
                    <input 
                      type="number" 
                      value={editActualValue} 
                      onChange={(e) => setEditActualValue(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <span className="text-xs text-slate-500 w-4">{selectedKpi.unit}</span>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditingValue(false)} className="text-[10px] px-2 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">キャンセル</button>
                    <button onClick={handleSaveValues} className="text-[10px] px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 font-bold">保存して反映</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between group/edit cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => setIsEditingValue(true)}>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      目標: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedKpi.targetValue.toLocaleString()}</span> {selectedKpi.unit}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {isPredictionMode ? '予測' : '実績'}: <span className="font-bold text-slate-800 dark:text-slate-200">{isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue.toLocaleString() : selectedKpi.actualValue.toLocaleString()}</span> {selectedKpi.unit}
                    </div>
                  </div>
                  <div className="text-primary-500 opacity-0 group-hover/edit:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold">
                    <Edit2 size={12} />
                    編集
                  </div>
                </div>
              )}
            </div>

            {/* トレンドチャート */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">トレンド推移</h5>
              <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden">
                <TrendChart 
                  actualValue={selectedKpi.actualValue} 
                  targetValue={selectedKpi.targetValue} 
                  unit={selectedKpi.unit} 
                />
              </div>
            </div>

            {/* 紐づくタスク一覧 */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>関連タスク</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{selectedKpiTasks.length}</span>
              </h5>
              
              <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                {selectedKpiTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2 bg-slate-100 dark:bg-slate-800/50 rounded">タスクはありません</p>
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
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="新しいタスクを追加..."
                  className="flex-1 text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 text-center">
            ツリーからKPIを選択してください
          </div>
        )}
      </div>

      {/* 統合AIアクション生成ボタン */}
      {selectedKpi && (
        <div className="mb-6 border-b border-slate-200 dark:border-[#3c4043] pb-6">
          {!currentWorkflow && !isGeneratingWorkflow && (
            <button 
              onClick={generateWorkflow}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-md group"
            >
              <Sparkles size={16} className="group-hover:animate-pulse" />
              AIで実行プラン（フェーズとタスク）を自動構築
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
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium mt-4">
              {workflowError}
            </div>
          )}

          {currentWorkflow && (
            <div className="bg-white dark:bg-[#2d2f31] border border-primary-200 dark:border-[#3c4043] p-4 rounded-[8px] shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-[14px] font-bold text-slate-800 dark:text-[#f1f3f4] flex items-center gap-1.5">
                  <Sparkles size={16} className="text-primary-500" />
                  生成された戦略見解
                </h5>
                <button onClick={generateWorkflow} className="text-[10px] text-slate-500 dark:text-[#9aa0a6] hover:text-slate-800 dark:text-[#e8eaed] underline">再生成して追加</button>
              </div>
              
              <p className="text-[12px] text-slate-600 dark:text-[#9aa0a6] bg-slate-50 dark:bg-[#202124] p-3 rounded">
                {currentWorkflow.ksf_analysis}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#5f6368]">
                <p className="text-[11px] text-slate-500 dark:text-[#9aa0a6]">
                  <strong>💡 KPIアドバイス:</strong> {currentWorkflow.kpi_advice}
                </p>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-4 text-center">
                ※ 生成された各フェーズはツリーの子ノード（KPI）として、<br/>タスクはマイタスク（ToDo）としてシステムに自動登録されました。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
