import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { CheckCircle2, Circle, Plus, Sparkles, Trash2, Network, Loader2 } from 'lucide-react';
import { Action } from '@/types';

export const ActionPanel = () => {
  const { kpiData, selectedNodeId, actions, addAction, toggleActionStatus, addKpiNode, removeKpiNode } = useKpiStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  // 下位KPI手動追加用
  const [newKpiName, setNewKpiName] = useState('');

  // AIインサイト用状態
  const [aiInsight, setAiInsight] = useState<{issue: string, actionIdea: string, kpiIdea: string} | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;
  const filteredActions = selectedNodeId 
    ? actions.filter(a => a.kpiId === selectedNodeId)
    : actions;

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId || !newTaskTitle) return;

    addAction({
      kpiId: selectedNodeId,
      title: newTaskTitle,
      owner: newTaskOwner || '未定',
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      status: 'todo'
    });
    setNewTaskTitle('');
    setNewTaskOwner('');
    setNewTaskDate('');
  };

  const handleAddSuggestedAction = (title: string) => {
    if (!selectedNodeId) return;
    addAction({
      kpiId: selectedNodeId,
      title: title,
      owner: 'AI提案',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
      status: 'todo'
    });
  };

  const handleAddKpi = (name: string, isAi = false) => {
    if (!selectedKpi) return;
    const newId = `kpi_custom_${Math.random().toString(36).substr(2, 9)}`;
    addKpiNode({
      id: newId,
      name: name,
      businessUnit: selectedKpi.businessUnit,
      type: 'KPI',
      parentId: selectedKpi.id,
      targetValue: 100, // 仮の値
      actualValue: 80,  // 仮の値
      unit: '件',
      previousValue: 80,
      description: isAi ? 'AIによって提案された下位KPI' : '追加された下位KPI'
    });
    if (!isAi) setNewKpiName('');
  };

  // 選択されたKPIが変わったらAIインサイトをリセット
  useEffect(() => {
    setAiInsight(null);
    setAiError('');
  }, [selectedNodeId]);

  const generateAiInsights = async () => {
    if (!selectedKpi) return;
    setIsGeneratingAi(true);
    setAiError('');
    setAiInsight(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kpiData: selectedKpi }),
      });

      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiInsight({
        issue: data.issue || '課題が分析できませんでした',
        actionIdea: data.actionIdea || '具体的な改善案がありません',
        kpiIdea: data.kpiIdea || '推奨KPIなし',
      });
    } catch (err: any) {
      console.error(err);
      setAiError(`APIエラー: ${err.message || '予期せぬエラーが発生しました'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        {selectedKpi ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 relative">
            <button 
              onClick={() => removeKpiNode(selectedKpi.id)}
              className="absolute top-2 right-2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
              title="このKPIを削除"
            >
              <Trash2 size={16} />
            </button>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{selectedKpi.businessUnit}</p>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">{selectedKpi.name}</h4>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs font-bold ${selectedKpi.status === 'danger' ? 'text-rose-500 dark:text-rose-400' : selectedKpi.status === 'warning' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                達成率: {selectedKpi.achievementRate.toFixed(1)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 text-center">
            ツリーからKPIを選択してください
          </div>
        )}
      </div>

      {selectedKpi && !aiInsight && !isGeneratingAi && (
        <button 
          onClick={generateAiInsights}
          className="mb-6 w-full py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-400 text-sm font-bold transition-all shadow-sm group"
        >
          <Sparkles size={16} className="group-hover:animate-pulse" />
          AIに改善案を分析させる
        </button>
      )}

      {selectedKpi && isGeneratingAi && (
        <div className="mb-6 siri-blob-container p-1 rounded-xl">
          <div className="siri-blob rounded-xl"></div>
          <div className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 p-6 rounded-xl flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Sparkles size={28} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] mix-blend-overlay animate-pulse absolute inset-0" />
              <Sparkles size={28} className="text-slate-800 dark:text-slate-200 animate-pulse relative" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 animate-pulse tracking-wide">
              AIがインサイトを分析中...
            </p>
          </div>
        </div>
      )}

      {selectedKpi && aiError && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-4 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium">
          {aiError}
        </div>
      )}

      {selectedKpi && aiInsight && (
        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              AI インサイト・提案
            </h5>
            <button onClick={generateAiInsights} className="text-[10px] text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline">再分析</button>
          </div>
          <p className="text-xs text-indigo-900 dark:text-indigo-200 mb-3">{aiInsight.issue}</p>
          
          <div className="space-y-2">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded shadow-sm border border-indigo-100 dark:border-indigo-800/30 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">💡 推奨アクション</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={aiInsight.actionIdea}>{aiInsight.actionIdea}</p>
              </div>
              <button 
                onClick={() => handleAddSuggestedAction(aiInsight.actionIdea)}
                className="flex-shrink-0 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                追加
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded shadow-sm border border-indigo-100 dark:border-indigo-800/30 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">📊 推奨下位KPI</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={aiInsight.kpiIdea}>{aiInsight.kpiIdea}</p>
              </div>
              <button 
                onClick={() => handleAddKpi(aiInsight.kpiIdea, true)}
                className="flex-shrink-0 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                ツリーに追加
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">登録済みアクション</h5>
        {filteredActions.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">アクションは登録されていません</p>
        ) : (
          filteredActions.map((action) => (
            <div key={action.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm flex items-start gap-3">
              <button onClick={() => toggleActionStatus(action.id)} className="mt-0.5 flex-shrink-0">
                {action.status === 'done' ? (
                  <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.status === 'done' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {action.title}
                </p>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>担当: {action.owner}</span>
                  <span>期限: {action.dueDate}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddAction} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">新規アクション追加</h5>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="施策のタイトル"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={!selectedNodeId}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="担当者"
              value={newTaskOwner}
              onChange={(e) => setNewTaskOwner(e.target.value)}
              disabled={!selectedNodeId}
              className="w-1/2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            />
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              disabled={!selectedNodeId}
              className="w-1/2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!selectedNodeId || !newTaskTitle}
            className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            アクションを追加
          </button>
        </div>
      </form>

      {selectedKpi && (
        <form onSubmit={(e) => { e.preventDefault(); handleAddKpi(newKpiName); }} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 mt-4">
          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">手動で下位KPIを追加</h5>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="新しい指標名"
              value={newKpiName}
              onChange={(e) => setNewKpiName(e.target.value)}
              className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!newKpiName}
              className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Network size={14} />
              追加
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
