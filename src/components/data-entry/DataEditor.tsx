"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useMemo, useEffect } from 'react';
import { Save, Plus, Trash2, Edit, TrendingUp, Calendar, MessageSquare, ChevronRight, Hash, Target, ChevronDown } from 'lucide-react';
import { TrendChart } from '../dashboard/TrendChart';

export const DataEditor = () => {
  const { kpiData, addHistoryRecord, updateHistoryRecord, deleteHistoryRecord, updateKpiNode } = useKpiStore();
  
  // 初期選択ノードをセット
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedKpiId && Object.keys(kpiData).length > 0) {
      // 最初にKGIを選ぶ
      const kgi = Object.values(kpiData).find(k => k.type === 'KGI');
      setSelectedKpiId(kgi ? kgi.id : Object.keys(kpiData)[0]);
    }
  }, [kpiData, selectedKpiId]);

  const selectedKpi = selectedKpiId ? kpiData[selectedKpiId] : null;

  // 階層的なリスト（左ペイン用）を作るための簡易的なソート
  const kpiList = useMemo(() => {
    return Object.values(kpiData).sort((a, b) => {
      if (a.type === 'KGI') return -1;
      if (b.type === 'KGI') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [kpiData]);

  // 新規追加用のローカルステート
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newActual, setNewActual] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newComment, setNewComment] = useState('');

  // 編集用のローカルステート
  const [editingHistId, setEditingHistId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editActual, setEditActual] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editComment, setEditComment] = useState('');

  // 選択が変わったら新規入力の初期値をリセット
  useEffect(() => {
    if (selectedKpi) {
      setNewTarget(selectedKpi.targetValue.toString());
      setNewActual('');
      setNewComment('');
      setEditingHistId(null);
    }
  }, [selectedKpiId, selectedKpi?.targetValue]);

  const handleAddHistory = () => {
    if (!selectedKpi) return;
    addHistoryRecord(selectedKpi.id, {
      date: newDate,
      actualValue: Number(newActual) || 0,
      targetValue: Number(newTarget) || selectedKpi.targetValue,
      comment: newComment
    });
    setNewActual('');
    setNewComment('');
  };

  const startEdit = (hist: any) => {
    setEditingHistId(hist.id);
    setEditDate(hist.date);
    setEditActual(hist.actualValue.toString());
    setEditTarget(hist.targetValue.toString());
    setEditComment(hist.comment || '');
  };

  const handleSaveEdit = () => {
    if (!selectedKpi || !editingHistId) return;
    updateHistoryRecord(selectedKpi.id, editingHistId, {
      date: editDate,
      actualValue: Number(editActual) || 0,
      targetValue: Number(editTarget) || 0,
      comment: editComment
    });
    setEditingHistId(null);
  };

  const handleDeleteHistory = (histId: string) => {
    if (!selectedKpi) return;
    if (confirm('この記録を削除しますか？')) {
      deleteHistoryRecord(selectedKpi.id, histId);
    }
  };

  // 目標値やKPI名などの基本情報を更新する関数
  const handleUpdateKpiInfo = (field: string, value: any) => {
    if (!selectedKpi) return;
    updateKpiNode(selectedKpi.id, { [field]: value });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#202124]">
      
      {/* 左ペイン：KPIエクスプローラー */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#282a2d] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KPIエクスプローラー</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
          {kpiList.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedKpiId(node.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                selectedKpiId === node.id 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {node.type === 'KGI' ? <Target size={14} className="text-amber-500" /> : <Hash size={14} className="opacity-50" />}
              <span className="truncate">{node.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 右ペイン：詳細エディター */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#202124]">
        {selectedKpi ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* ヘッダーエリア */}
            <div className="bg-white dark:bg-[#282a2d] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${selectedKpi.type === 'KGI' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                      {selectedKpi.type}
                    </span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{selectedKpi.businessUnit}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 group cursor-text">
                    <input 
                      type="text" 
                      value={selectedKpi.name}
                      onChange={(e) => handleUpdateKpiInfo('name', e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none transition-colors w-[400px]"
                    />
                  </h1>
                  {selectedKpi.qualitativeName && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedKpi.qualitativeName}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-1">現在の達成率</div>
                  <div className={`text-3xl font-bold ${selectedKpi.status === 'danger' ? 'text-rose-500' : selectedKpi.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {selectedKpi.achievementRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">目標値 (Target)</label>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      value={selectedKpi.targetValue}
                      onChange={(e) => handleUpdateKpiInfo('targetValue', Number(e.target.value) || 0)}
                      className="text-lg font-bold bg-transparent focus:outline-none focus:border-b focus:border-primary-500 w-24 text-slate-800 dark:text-slate-200"
                    />
                    <span className="text-sm text-slate-500">{selectedKpi.unit}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">最新実績 (Actual)</label>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {selectedKpi.actualValue.toLocaleString()} <span className="text-sm font-normal text-slate-500">{selectedKpi.unit}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">説明・定義</label>
                  <input 
                    type="text" 
                    value={selectedKpi.description || ''}
                    onChange={(e) => handleUpdateKpiInfo('description', e.target.value)}
                    placeholder="このKPIの定義や計算式を記載..."
                    className="w-full text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none transition-colors text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* トレンドグラフ */}
            <div className="bg-white dark:bg-[#282a2d] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-500" />
                トレンド推移
              </h3>
              <div className="h-[250px]">
                <TrendChart 
                  actualValue={selectedKpi.actualValue}
                  targetValue={selectedKpi.targetValue}
                  unit={selectedKpi.unit}
                  history={selectedKpi.history}
                />
              </div>
            </div>

            {/* 時系列データ（シート） */}
            <div className="bg-white dark:bg-[#282a2d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-500" />
                  時系列データシート (History)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 font-bold text-slate-500 w-32">日付</th>
                      <th className="p-3 font-bold text-slate-500 w-32 text-right">目標値</th>
                      <th className="p-3 font-bold text-slate-500 w-32 text-right">実績値</th>
                      <th className="p-3 font-bold text-slate-500">コメント / 要因分析</th>
                      <th className="p-3 font-bold text-slate-500 w-20 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    
                    {/* 履歴リスト */}
                    {(selectedKpi.history || []).map((hist) => (
                      <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                        {editingHistId === hist.id ? (
                          <>
                            <td className="p-2"><input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-2 py-1 border rounded text-xs dark:bg-slate-800 dark:border-slate-700" /></td>
                            <td className="p-2"><input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} className="w-full px-2 py-1 border rounded text-xs text-right dark:bg-slate-800 dark:border-slate-700" /></td>
                            <td className="p-2"><input type="number" value={editActual} onChange={e => setEditActual(e.target.value)} className="w-full px-2 py-1 border rounded text-xs text-right dark:bg-slate-800 dark:border-slate-700" /></td>
                            <td className="p-2"><input type="text" value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="コメント..." className="w-full px-2 py-1 border rounded text-xs dark:bg-slate-800 dark:border-slate-700" /></td>
                            <td className="p-2 text-center">
                              <button onClick={handleSaveEdit} className="text-xs bg-primary-500 text-white px-2 py-1 rounded hover:bg-primary-600">保存</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{hist.date}</td>
                            <td className="p-3 text-right text-slate-500">{hist.targetValue.toLocaleString()}</td>
                            <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">{hist.actualValue.toLocaleString()}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                              {hist.comment ? (
                                <span className="flex items-center gap-1.5"><MessageSquare size={12} className="opacity-50"/> {hist.comment}</span>
                              ) : <span className="opacity-30">-</span>}
                            </td>
                            <td className="p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => startEdit(hist)} className="text-slate-400 hover:text-primary-500"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteHistory(hist.id!)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}

                    {/* 新規追加行 */}
                    <tr className="bg-primary-50/30 dark:bg-primary-900/10">
                      <td className="p-3">
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm focus:border-primary-500 focus:outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="目標" className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-right focus:border-primary-500 focus:outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={newActual} onChange={e => setNewActual(e.target.value)} placeholder="実績" className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-right font-bold focus:border-primary-500 focus:outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="今日の要因や特記事項を入力..." className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm focus:border-primary-500 focus:outline-none" />
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={handleAddHistory}
                          disabled={!newActual}
                          className="flex items-center justify-center w-full gap-1 px-2 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded text-xs font-bold transition-colors"
                        >
                          <Plus size={14} /> 追加
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Hash size={24} className="text-slate-400" />
            </div>
            <p>左側のエクスプローラーからKPIを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
};
