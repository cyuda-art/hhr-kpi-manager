import { useState, useEffect } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { Sparkles, Trash2, Edit2 } from 'lucide-react';
import { TrendChart } from '../dashboard/TrendChart';

export const ActionPanel = () => {
  const { kpiData, selectedNodeId, addKpiNode, removeKpiNode, updateKpiNode, isPredictionMode, updateSimulatedValue } = useKpiStore();
  const selectedKpi = selectedNodeId ? kpiData[selectedNodeId] : null;

  const handleAddKsfAndKpi = () => {
    if (!selectedKpi || !aiInsight) return;
    
    const kpiId = `kpi_custom_kpi_${Math.random().toString(36).substr(2, 9)}`;
    addKpiNode({
      id: kpiId,
      name: aiInsight.kpiIdea, // 定量名
      qualitativeName: aiInsight.ksfIdea, // 定性名
      businessUnit: selectedKpi.businessUnit,
      type: 'KPI',
      parentId: selectedKpi.id,
      targetValue: aiInsight.kpiIdeaTarget || 0,
      actualValue: 0,
      unit: aiInsight.kpiIdeaUnit || '件',
      previousValue: 0,
      description: aiInsight.ksfReason
    });
    
    setAiInsight(null); // 追加後はクリア
  };
  
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editActualValue, setEditActualValue] = useState('');
  const [editName, setEditName] = useState('');
  const [editQualitativeName, setEditQualitativeName] = useState('');

  // AIインサイト用状態
  const [aiInsight, setAiInsight] = useState<{issue: string, ksfIdea: string, ksfReason: string, kpiIdea: string, kpiIdeaTarget?: number, kpiIdeaUnit?: string} | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  // 選択されたKPIが変わったらAIインサイトと編集モードをリセット
  useEffect(() => {
    setAiInsight(null);
    setAiError('');
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
        body: JSON.stringify({ kpiData: selectedKpi, allKpiData: kpiData }),
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
        ksfIdea: data.ksfIdea || '推奨KSFなし',
        ksfReason: data.ksfReason || '',
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
        <div className="mb-6 bg-[#2d2f31] border border-[#8ab4f8]/30 p-4 rounded-[8px]">
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-[12px] font-bold text-[#8ab4f8] flex items-center gap-1.5">
              <Sparkles size={14} />
              AI インサイト・提案
            </h5>
            <button onClick={generateAiInsights} className="text-[10px] text-[#9aa0a6] hover:text-[#e8eaed] underline">再分析</button>
          </div>
          <p className="text-[12px] text-[#e8eaed] mb-4">{aiInsight.issue}</p>
          
          <div className="bg-[#202124] p-3 rounded-[4px] shadow-sm border border-[#3c4043] flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[10px] text-[#8ab4f8] font-bold mb-1 uppercase tracking-wider">🎯 推奨 KSF (重要成功要因)</p>
                <p className="text-[14px] font-medium text-[#e8eaed] break-words leading-relaxed">{aiInsight.ksfIdea}</p>
                <p className="text-[11px] text-[#9aa0a6] mt-1.5 break-words leading-relaxed">{aiInsight.ksfReason}</p>
              </div>
            </div>

            <div className="border-t border-[#3c4043] pt-3 flex justify-between items-end gap-2 mt-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-[#fbbc04] font-bold mb-1 uppercase tracking-wider">📊 測定のための KPI</p>
                <p className="text-[13px] font-medium text-[#e8eaed] break-words leading-relaxed">
                  {aiInsight.kpiIdea} <span className="text-[#9aa0a6] text-[11px] font-normal block mt-0.5">(目標: {aiInsight.kpiIdeaTarget?.toLocaleString()}{aiInsight.kpiIdeaUnit})</span>
                </p>
              </div>
              <button 
                onClick={handleAddKsfAndKpi}
                className="flex-shrink-0 text-[11px] bg-[#8ab4f8] text-[#202124] px-3 py-1.5 rounded-[4px] font-bold hover:bg-[#aecbfa] transition-colors"
              >
                KSF & KPI を追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
