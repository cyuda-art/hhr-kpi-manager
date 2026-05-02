"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useEffect } from 'react';
import { Save, FileSpreadsheet, Plus, Trash2, Edit } from 'lucide-react';
import { KpiNodeData } from '@/types';

export const DataEditor = () => {
  const { kpiData, setKpiDataBulk } = useKpiStore();
  
  const [localData, setLocalData] = useState<Record<string, KpiNodeData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // kpiDataのコピーをローカルステートにセット
    const initialLocal: Record<string, KpiNodeData> = {};
    Object.values(kpiData).forEach(node => {
      initialLocal[node.id] = { ...node };
    });
    setLocalData(initialLocal);
    setHasChanges(false);
  }, [kpiData]);

  const handleChange = (id: string, field: keyof KpiNodeData, value: any) => {
    let finalValue = value;
    if (field === 'targetValue' || field === 'actualValue' || field === 'previousValue') {
      finalValue = Number(value) || 0;
    }
    
    setLocalData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: finalValue
      }
    }));
    setHasChanges(true);
  };

  const handleAddRow = () => {
    const newId = `kpi_custom_${Math.random().toString(36).substr(2, 9)}`;
    setLocalData(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        name: '新しい指標',
        businessUnit: 'company',
        type: 'KPI',
        parentId: Object.keys(prev)[0] || null, // とりあえず最初の要素を親にする
        targetValue: 100,
        actualValue: 0,
        unit: '件',
        previousValue: 0,
        description: '',
      }
    }));
    setHasChanges(true);
    setEditingId(newId);
    // スクロールを下まで移動する処理を少し遅らせて実行
    setTimeout(() => {
      const container = document.getElementById('editor-table-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('このノードを削除しますか？子ノードの親が失われる可能性があります。')) {
      setLocalData(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    // Bulk保存（シミュレーションの波及を考慮せず強制上書きするため、setKpiDataBulkを使用）
    setKpiDataBulk(Object.values(localData));
    setHasChanges(false);
    setEditingId(null);
  };

  const nodesList = Object.values(localData).sort((a, b) => {
    if (a.type === 'KGI' && b.type !== 'KGI') return -1;
    if (a.type !== 'KGI' && b.type === 'KGI') return 1;
    return a.businessUnit.localeCompare(b.businessUnit);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-400">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">データエディター (Data Editor)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Glideappsのようなフル機能のエディターで、ツリーの全構造とプロパティを編集します。</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Plus size={16} />
            行を追加
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              hasChanges 
                ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            変更を同期
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div id="editor-table-container" className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-sm">
              <tr>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-12 text-center"></th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 min-w-[200px]">指標名 (Name)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32">タイプ (Type)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32">事業部 (BU)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 min-w-[200px]">親ノード (Parent)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32 text-right">目標 (Target)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32 text-right">実績 (Actual)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-24">単位 (Unit)</th>
                <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-16 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {nodesList.map(node => (
                <tr 
                  key={node.id} 
                  className={`hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group ${editingId === node.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  onClick={() => setEditingId(node.id)}
                >
                  <td className="p-3 text-center text-slate-300 dark:text-slate-600 group-hover:text-primary-400">
                    <Edit size={14} className="mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                  
                  {/* Name */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={node.name}
                      onChange={(e) => handleChange(node.id, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                    />
                  </td>
                  
                  {/* Type */}
                  <td className="p-2">
                    <select
                      value={node.type}
                      onChange={(e) => handleChange(node.id, 'type', e.target.value)}
                      className={`w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold transition-all ${node.type === 'KGI' ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400'}`}
                    >
                      <option value="KGI">KGI</option>
                      <option value="KPI">KPI</option>
                    </select>
                  </td>

                  {/* Business Unit */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={node.businessUnit}
                      onChange={(e) => handleChange(node.id, 'businessUnit', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 uppercase transition-all"
                    />
                  </td>

                  {/* Parent */}
                  <td className="p-2">
                    <select
                      value={node.parentId || ''}
                      onChange={(e) => handleChange(node.id, 'parentId', e.target.value || null)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 transition-all truncate"
                    >
                      <option value="">-- なし (Root) --</option>
                      {nodesList.filter(n => n.id !== node.id).map(n => (
                        <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                      ))}
                    </select>
                  </td>

                  {/* Target */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={node.targetValue}
                      onChange={(e) => handleChange(node.id, 'targetValue', e.target.value)}
                      className="w-full text-right px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-700 dark:text-slate-300 transition-all"
                    />
                  </td>

                  {/* Actual */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={node.actualValue}
                      onChange={(e) => handleChange(node.id, 'actualValue', e.target.value)}
                      className="w-full text-right px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                    />
                  </td>

                  {/* Unit */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={node.unit}
                      onChange={(e) => handleChange(node.id, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 transition-all"
                    />
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRow(node.id); }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {nodesList.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <FileSpreadsheet size={32} className="text-slate-400" />
                    </div>
                    <p>データがありません。「行を追加」から新しい指標を作成してください。</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
