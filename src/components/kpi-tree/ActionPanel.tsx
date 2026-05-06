import { useState, useEffect, useRef } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { CheckCircle2, Circle, Plus, Sparkles, Trash2, Network, Loader2, MessageSquare, Send, ListChecks, Edit2 } from 'lucide-react';
import { Action } from '@/types';
import { TrendChart } from '../dashboard/TrendChart';

export const ActionPanel = () => {
  const { kpiData, selectedNodeId, actions, addAction, toggleActionStatus, addKpiNode, removeKpiNode, updateKpiNode, isPredictionMode, updateSimulatedValue } = useKpiStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');
  const [newTaskDepartment, setNewTaskDepartment] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const [newKpiName, setNewKpiName] = useState('');

  // 編集モード用
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editActualValue, setEditActualValue] = useState(''); // シミュレーション時もこのstateを共用する

  // AIインサイト用状態
  const [aiInsight, setAiInsight] = useState<{issue: string, actionIdea: string, kpiIdea: string, kpiIdeaTarget?: number, kpiIdeaUnit?: string} | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;
  const filteredActions = selectedNodeId 
    ? actions.filter(a => a.kpiId === selectedNodeId)
    : actions;

  // タブとチャット用の状態
  const [activeTab, setActiveTab] = useState<'actions' | 'chat'>('actions');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: 'こんにちは！KPI管理アシスタントです。現在の数値の分析や、改善施策のアイデア出しなど、何でもご相談ください。' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // チャットが更新されたら一番下へスクロール
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const newUserMsg = { role: 'user' as const, content: chatMessage };
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newUserMsg.content,
          kpiContext: selectedKpi,
          history: chatHistory.slice(1) // 最初の挨拶は除くか、すべて送るか。今回は全て送る
        }),
      });

      if (!response.ok) throw new Error('チャットの送信に失敗しました');
      const data = await response.json();
      
      setChatHistory(prev => [...prev, { role: 'model', content: data.text }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', content: '申し訳ありません、エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId || !newTaskTitle) return;

    addAction({
      kpiId: selectedNodeId,
      title: newTaskTitle,
      owner: newTaskOwner || '未定',
      department: newTaskDepartment || '部署未定',
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      status: 'todo'
    });
    setNewTaskTitle('');
    setNewTaskOwner('');
    setNewTaskDepartment('');
    setNewTaskDate('');
  };

  const handleAddSuggestedAction = (title: string) => {
    if (!selectedNodeId) return;
    addAction({
      kpiId: selectedNodeId,
      title: title,
      owner: 'AI提案',
      department: '未定',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1週間後
      status: 'todo'
    });
  };

  const handleAddKpi = (name: string, isAi = false, targetValue = 0, unit = '件') => {
    if (!selectedKpi) return;
    const newId = `kpi_custom_${Math.random().toString(36).substr(2, 9)}`;
    addKpiNode({
      id: newId,
      name: name,
      businessUnit: selectedKpi.businessUnit,
      type: 'KPI',
      parentId: selectedKpi.id,
      targetValue: targetValue,
      actualValue: 0,
      unit: unit,
      previousValue: 0,
      description: isAi ? 'AIによって提案された下位KPI' : '追加された下位KPI'
    });
    if (!isAi) setNewKpiName('');
  };

  // 選択されたKPIが変わったらAIインサイトと編集モードをリセット
  useEffect(() => {
    setAiInsight(null);
    setAiError('');
    setIsEditingValue(false);
    if (selectedKpi) {
      setEditTargetValue(selectedKpi.targetValue.toString());
      setEditActualValue(isPredictionMode && selectedKpi.simulatedValue !== undefined ? selectedKpi.simulatedValue.toString() : selectedKpi.actualValue.toString());
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
      });
    }
    setIsEditingValue(false);
  };

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
        let errorMsg = `APIリクエストに失敗しました (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch (e) {
          // JSONパース失敗（VercelのHTMLエラーページなどが返ってきた場合）
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiInsight({
        issue: data.issue || '課題が分析できませんでした',
        actionIdea: data.actionIdea || '具体的な改善案がありません',
        kpiIdea: data.kpiIdea || '推奨KPIなし',
        kpiIdeaTarget: Number(data.kpiIdeaTarget) || 0,
        kpiIdeaUnit: data.kpiIdeaUnit || '件',
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
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
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
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 text-center">
            ツリーからKPIを選択してください
          </div>
        )}
      </div>

      {/* タブ切り替え */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg mb-4">
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'actions' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <ListChecks size={14} />
          KSF & インサイト
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'chat' ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <MessageSquare size={14} />
          AIチャット
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex flex-col flex-1 min-h-0 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden relative">
          {/* チャット履歴 */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary-500 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.role === 'model' && i === 0 ? (
                    <div className="flex items-center gap-1.5 mb-1 text-primary-500 dark:text-primary-400">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-bold">AIアシスタント</span>
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          {/* 入力フォーム */}
          <form onSubmit={handleSendChat} className="p-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="KPI改善についてAIに質問..."
              disabled={isChatLoading}
              className="flex-1 bg-slate-100 dark:bg-slate-900 border-none text-xs rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim() || isChatLoading}
              className="w-8 h-8 flex-shrink-0 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">


      {selectedKpi && !aiInsight && !isGeneratingAi && (
        <button 
          onClick={generateAiInsights}
          className="mb-6 w-full py-3 bg-gradient-to-r from-primary-500/10 to-purple-500/10 hover:from-primary-500/20 hover:to-purple-500/20 border border-primary-200 dark:border-primary-800/50 rounded-xl flex items-center justify-center gap-2 text-primary-700 dark:text-primary-400 text-sm font-bold transition-all shadow-sm group"
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
        <div className="mb-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h5 className="text-xs font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              AI インサイト・提案
            </h5>
            <button onClick={generateAiInsights} className="text-[10px] text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 underline">再分析</button>
          </div>
          <p className="text-xs text-primary-900 dark:text-primary-200 mb-3">{aiInsight.issue}</p>
          
          <div className="space-y-2">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded shadow-sm border border-primary-100 dark:border-primary-800/30 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">💡 推奨アクション</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={aiInsight.actionIdea}>{aiInsight.actionIdea}</p>
              </div>
              <button 
                onClick={() => handleAddSuggestedAction(aiInsight.actionIdea)}
                className="flex-shrink-0 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-1 rounded font-bold hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
              >
                追加
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded shadow-sm border border-primary-100 dark:border-primary-800/30 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">📊 推奨下位KPI</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={aiInsight.kpiIdea}>
                  {aiInsight.kpiIdea} (目標: {aiInsight.kpiIdeaTarget?.toLocaleString()}{aiInsight.kpiIdeaUnit})
                </p>
              </div>
              <button 
                onClick={() => handleAddKpi(aiInsight.kpiIdea, true, aiInsight.kpiIdeaTarget, aiInsight.kpiIdeaUnit)}
                className="flex-shrink-0 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-1 rounded font-bold hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
              >
                ツリーに追加
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">登録済み KSF (重要施策)</h5>
        {!selectedNodeId ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">ツリーからKPIを選択すると表示されます</p>
        ) : filteredActions.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">KSFは登録されていません</p>
        ) : (
          filteredActions.map((action) => (
            <div key={action.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm flex items-start gap-3">
              <button onClick={() => toggleActionStatus(action.id)} className="mt-0.5 flex-shrink-0">
                {action.status === 'done' ? (
                  <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-slate-300 dark:text-slate-600 hover:text-primary-500 dark:hover:text-primary-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.status === 'done' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {action.title}
                </p>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">部署: {action.department || '未設定'}</span>
                  <span className="flex items-center">担当: {action.owner}</span>
                  <span className="flex items-center">期限: {action.dueDate}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddAction} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">新規 KSF (重要施策) 追加</h5>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="施策のタイトル"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={!selectedNodeId}
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
          />
          <div className="flex gap-2">
            <select
              value={newTaskDepartment}
              onChange={(e) => setNewTaskDepartment(e.target.value)}
              disabled={!selectedNodeId}
              className="w-1/3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
              <option value="">担当部署</option>
              <option value="経営管理部">経営管理部</option>
              <option value="宿泊部">宿泊部</option>
              <option value="温浴部">温浴部</option>
              <option value="料飲部">料飲部</option>
              <option value="物販部">物販部</option>
              <option value="マーケティング部">マーケティング部</option>
              <option value="全社横断">全社横断</option>
            </select>
            <input
              type="text"
              placeholder="担当者"
              value={newTaskOwner}
              onChange={(e) => setNewTaskOwner(e.target.value)}
              disabled={!selectedNodeId}
              className="w-1/3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            />
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              disabled={!selectedNodeId}
              className="w-1/3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!selectedNodeId || !newTaskTitle}
            className="w-full mt-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            KSF を追加
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
              className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500"
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
      )}
    </div>
  );
};
