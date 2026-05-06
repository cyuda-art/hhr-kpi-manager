"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useEffect } from 'react';
import { Save, FileSpreadsheet, Plus, Trash2, Edit, ListChecks } from 'lucide-react';
import { KpiNodeData, Action } from '@/types';

export const DataEditor = () => {
  const { kpiData, setKpiDataBulk, actions, setActionsBulk } = useKpiStore();
  
  const [activeTab, setActiveTab] = useState<'kpi' | 'ksf'>('kpi');

  // KPI用のローカルステート
  const [localData, setLocalData] = useState<Record<string, KpiNodeData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // KSF用のローカルステート
  const [localActions, setLocalActions] = useState<Record<string, Action>>({});
  const [hasActionChanges, setHasActionChanges] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [recentlySavedRowId, setRecentlySavedRowId] = useState<string | null>(null);

  const handleAutoSave = (rowId?: string) => {
    if (activeTab === 'kpi' && !hasChanges) return;
    if (activeTab === 'ksf' && !hasActionChanges) return;
    
    setSaveStatus('saving');
    
    if (activeTab === 'kpi') {
      // ローカルデータを最新のオブジェクトから配列化して保存
      setKpiDataBulk(Object.values(localData));
      setHasChanges(false);
    } else {
      setActionsBulk(Object.values(localActions));
      setHasActionChanges(false);
    }

    if (rowId) {
      setRecentlySavedRowId(rowId);
    }
    
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      setRecentlySavedRowId(null);
    }, 2000);
  };


  useEffect(() => {
    // kpiDataのコピーをローカルステートにセット
    const initialLocal: Record<string, KpiNodeData> = {};
    Object.values(kpiData).forEach(node => {
      initialLocal[node.id] = { ...node };
    });
    setLocalData(initialLocal);
    setHasChanges(false);

    // actionsのコピーをローカルステートにセット
    const initialActions: Record<string, Action> = {};
    actions.forEach(action => {
      initialActions[action.id] = { ...action };
    });
    setLocalActions(initialActions);
    setHasActionChanges(false);
  }, [kpiData, actions]);

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

  const handleActionChange = (id: string, field: keyof Action, value: any) => {
    setLocalActions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
    setHasActionChanges(true);
  };

  const handleAddActionRow = () => {
    const newId = `action_custom_${Math.random().toString(36).substr(2, 9)}`;
    setLocalActions(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        kpiId: Object.keys(localData)[0] || '', // 最初のKPIを割り当てる
        title: '新しい施策',
        owner: '未定',
        department: '未設定',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'todo'
      }
    }));
    setHasActionChanges(true);
    setEditingActionId(newId);
    setTimeout(() => {
      const container = document.getElementById('editor-table-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  const handleDeleteActionRow = (id: string) => {
    if (confirm('このKSFを削除しますか？')) {
      setLocalActions(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setHasActionChanges(true);
    }
  };

  const handleSave = () => {
    if (activeTab === 'kpi') {
      setKpiDataBulk(Object.values(localData));
      setHasChanges(false);
      setEditingId(null);
    } else {
      setActionsBulk(Object.values(localActions));
      setHasActionChanges(false);
      setEditingActionId(null);
    }
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
          <div className={`p-2 rounded-lg ${activeTab === 'kpi' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
            {activeTab === 'kpi' ? <FileSpreadsheet size={24} /> : <ListChecks size={24} />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">データエディター (Data Editor)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Glideappsのようなフル機能のエディターで、ツリーの全構造やKSFを直接編集します。</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-4">
            <button
              onClick={() => setActiveTab('kpi')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'kpi' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              <FileSpreadsheet size={14} /> KPIマスター
            </button>
            <button
              onClick={() => setActiveTab('ksf')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'ksf' ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              <ListChecks size={14} /> KSF (重要施策)
            </button>
          </div>

          <button
            onClick={activeTab === 'kpi' ? handleAddRow : handleAddActionRow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Plus size={16} />
            行を追加
          </button>
          <button
            onClick={handleSave}
            disabled={activeTab === 'kpi' ? !hasChanges : !hasActionChanges}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              (activeTab === 'kpi' ? hasChanges : hasActionChanges)
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
            {activeTab === 'kpi' && (
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
            )}
            {activeTab === 'ksf' && (
              <thead className="bg-emerald-50/50 dark:bg-emerald-900/10 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <tr>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-12 text-center"></th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 min-w-[200px]">施策タイトル (Title)</th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 min-w-[200px]">関連KPI (Target KPI)</th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32">担当部署 (Dept)</th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32">担当者 (Owner)</th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32">期限 (Due Date)</th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-32">ステータス (Status)</th>
                  <th className="p-3 font-bold text-slate-500 dark:text-slate-400 w-16 text-center">操作</th>
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {activeTab === 'kpi' && nodesList.map(node => (
                <tr 
                  key={node.id} 
                  className={`hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group ${editingId === node.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''} ${recentlySavedRowId === node.id ? 'bg-emerald-100 dark:bg-emerald-900/40 transition-none' : ''}`}
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
                      onBlur={() => handleAutoSave(node.id)}
                      onChange={(e) => handleChange(node.id, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                    />
                  </td>
                  
                  {/* Type */}
                  <td className="p-2">
                    <select
                      value={node.type}
                      onBlur={() => handleAutoSave(node.id)}
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
                      onBlur={() => handleAutoSave(node.id)}
                      onChange={(e) => handleChange(node.id, 'businessUnit', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 uppercase transition-all"
                    />
                  </td>

                  {/* Parent */}
                  <td className="p-2">
                    <select
                      value={node.parentId || ''}
                      onBlur={() => handleAutoSave(node.id)}
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
                      onBlur={() => handleAutoSave(node.id)}
                      onChange={(e) => handleChange(node.id, 'targetValue', e.target.value)}
                      className="w-full text-right px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-700 dark:text-slate-300 transition-all"
                    />
                  </td>

                  {/* Actual */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={node.actualValue}
                      onBlur={() => handleAutoSave(node.id)}
                      onChange={(e) => handleChange(node.id, 'actualValue', e.target.value)}
                      className="w-full text-right px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                    />
                  </td>

                  {/* Unit */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={node.unit}
                      onBlur={() => handleAutoSave(node.id)}
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

              {activeTab === 'ksf' && Object.values(localActions).map(action => (
                <tr 
                  key={action.id} 
                  className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group ${editingActionId === action.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''} ${recentlySavedRowId === action.id ? 'bg-emerald-100 dark:bg-emerald-900/40 transition-none' : ''}`}
                  onClick={() => setEditingActionId(action.id)}
                >
                  <td className="p-3 text-center text-slate-300 dark:text-slate-600 group-hover:text-emerald-400">
                    <Edit size={14} className="mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                  
                  {/* Title */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={action.title}
                      onBlur={() => handleAutoSave(action.id)}
                      onChange={(e) => handleActionChange(action.id, 'title', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                    />
                  </td>
                  
                  {/* KPI ID */}
                  <td className="p-2">
                    <select
                      value={action.kpiId}
                      onBlur={() => handleAutoSave(action.id)}
                      onChange={(e) => handleActionChange(action.id, 'kpiId', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 transition-all truncate"
                    >
                      <option value="">-- 対象KPI --</option>
                      {nodesList.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Department */}
                  <td className="p-2">
                    <select
                      value={action.department || ''}
                      onBlur={() => handleAutoSave(action.id)}
                      onChange={(e) => handleActionChange(action.id, 'department', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 transition-all"
                    >
                      <option value="">未設定</option>
                      <option value="経営管理部">経営管理部</option>
                      <option value="宿泊部">宿泊部</option>
                      <option value="温浴部">温浴部</option>
                      <option value="料飲部">料飲部</option>
                      <option value="物販部">物販部</option>
                      <option value="マーケティング部">マーケティング部</option>
                      <option value="全社横断">全社横断</option>
                    </select>
                  </td>

                  {/* Owner */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={action.owner}
                      onBlur={() => handleAutoSave(action.id)}
                      onChange={(e) => handleActionChange(action.id, 'owner', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 transition-all"
                    />
                  </td>

                  {/* Due Date */}
                  <td className="p-2">
                    <input
                      type="date"
                      value={action.dueDate}
                      onBlur={() => handleAutoSave(action.id)}
                      onChange={(e) => handleActionChange(action.id, 'dueDate', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none text-slate-600 dark:text-slate-400 transition-all"
                    />
                  </td>

                  {/* Status */}
                  <td className="p-2">
                    <select
                      value={action.status}
                      onBlur={() => handleAutoSave(action.id)}
                      onChange={(e) => handleActionChange(action.id, 'status', e.target.value)}
                      className={`w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded outline-none font-bold transition-all ${action.status === 'done' ? 'text-emerald-500' : 'text-slate-600'}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">進行中</option>
                      <option value="done">完了 (Done)</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteActionRow(action.id); }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {activeTab === 'kpi' && nodesList.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <FileSpreadsheet size={32} className="text-slate-400" />
                    </div>
                    <p>データがありません。「行を追加」から新しい指標を作成してください。</p>
                  </td>
                </tr>
              )}
              {activeTab === 'ksf' && Object.values(localActions).length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <ListChecks size={32} className="text-slate-400" />
                    </div>
                    <p>KSFデータがありません。「行を追加」から新しい施策を作成してください。</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* オートセーブのトースト通知 */}
      <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg shadow-lg transition-all duration-300 transform ${saveStatus === 'saved' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <Save size={16} className="text-emerald-400" />
        <span className="text-sm font-bold">自動保存しました</span>
      </div>
    </div>
  );
};
