"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useMemo } from 'react';
import { Download, Search, Filter, ArrowUpDown, Plus, LayoutGrid, Hash, Target, Database, FileSpreadsheet, ListChecks, Calendar, Calculator, Code2, Trash2 } from 'lucide-react';
import { getDisplayValue, getStorageValue } from '@/lib/kpi-utils';

type TableMode = 'master' | 'ksf' | 'history' | 'database';

export const DataEditor = () => {
  const { kpiData, actions, currentProjectInfo, addHistoryRecord, updateHistoryRecord, deleteHistoryRecord, updateKpiNode, updateAction, currentPeriod, isPredictionMode } = useKpiStore();
  
  // 表示中のテーブルモード
  const [activeMode, setActiveMode] = useState<TableMode>('master');
  // historyモード時の選択中KPI
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);

  // アーカイブ表示のトグル
  const [showArchived, setShowArchived] = useState(false);

  // TABLESリスト用のKPI
  const kpiList = useMemo(() => {
    return Object.values(kpiData)
      .filter(node => showArchived || !node.isArchived)
      .sort((a, b) => {
        if (a.type === 'KGI') return -1;
        if (b.type === 'KGI') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [kpiData, showArchived]);

  const filteredActions = useMemo(() => {
    return actions.filter(action => showArchived || !action.isArchived);
  }, [actions, showArchived]);

  const selectedKpi = selectedKpiId ? kpiData[selectedKpiId] : null;

  // インライン編集用のステート
  const [editState, setEditState] = useState<{ id: string, field: string, value: any } | null>(null);

  // 新規行追加用のステート（history用）
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const handleUpdate = (id: string, field: string, value: any) => {
    if (activeMode === 'master') {
      let finalValue = value;
      if (field === 'targetValue' || field === 'actualValue') {
        const node = kpiData[id];
        finalValue = getStorageValue(Number(value) || 0, node, currentPeriod, field as 'targetValue' | 'actualValue');
      }
      updateKpiNode(id, { [field]: finalValue });
    } else if (activeMode === 'history' && selectedKpi) {
      let finalValue = value;
      if (field === 'targetValue' || field === 'actualValue') {
        finalValue = getStorageValue(Number(value) || 0, selectedKpi, currentPeriod, field as 'targetValue' | 'actualValue');
      }
      updateHistoryRecord(selectedKpi.id, id, { [field]: finalValue });
    } else if (activeMode === 'ksf') {
      updateAction(id, { [field]: value });
    }
  };

  const handleAddHistoryRow = () => {
    if (!selectedKpi) return;
    addHistoryRecord(selectedKpi.id, {
      date: newDate,
      actualValue: 0,
      targetValue: selectedKpi.targetValue,
      comment: ''
    });
    // 次の日の日付をセットしておく
    const nextDate = new Date(newDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setNewDate(nextDate.toISOString().split('T')[0]);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    if (activeMode === 'master') {
      csvContent += "ID,Type,BU,Name,Target,Actual,Unit,Parent\n";
      Object.values(kpiData).forEach(node => {
        csvContent += `${node.id},${node.type},${node.businessUnit},"${node.name}",${node.targetValue},${node.actualValue},${node.unit},${node.parentId || ''}\n`;
      });
    } else if (activeMode === 'ksf') {
      csvContent += "ID,KPI_ID,Title,Owner,Dept,StartDate,DueDate,Status\n";
      actions.forEach(a => {
        csvContent += `${a.id},${a.kpiId},"${a.title}","${a.owner}","${a.department || ''}",${a.startDate || ''},${a.dueDate},${a.status}\n`;
      });
    } else if (activeMode === 'history' && selectedKpi) {
      csvContent += "ID,Date,Target,Actual,Comment\n";
      (selectedKpi.history || []).forEach(h => {
        csvContent += `${h.id},${h.date},${h.targetValue},${h.actualValue},"${h.comment || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = activeMode === 'master' ? 'kpi_master.csv' : activeMode === 'ksf' ? 'ksf_list.csv' : `history_${selectedKpi?.name}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-[#202124]">
      
      {/* 左ペイン：TABLES リスト */}
      <div className="w-64 border-r border-slate-200 dark:border-[#3c4043] bg-slate-50 dark:bg-[#282a2d] flex flex-col pt-4">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider">Tables</span>
          <Plus size={14} className="text-slate-400 cursor-pointer hover:text-logic-slate dark:text-slate-400" />
        </div>
        
        <div className="px-2 space-y-0.5 mb-6">
          <button
            onClick={() => setActiveMode('master')}
            className={`w-full text-left px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 ${
              activeMode === 'master' 
                ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                : 'text-slate-600 dark:text-[#e8eaed] hover:bg-slate-200 dark:hover:bg-[#3c4043]'
            }`}
          >
            <Database size={14} className="opacity-70" />
            KPIマスター
            <span className="ml-auto text-[10px] text-slate-400">{kpiList.length}</span>
          </button>
          <button
            onClick={() => setActiveMode('ksf')}
            className={`w-full text-left px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 ${
              activeMode === 'ksf' 
                ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                : 'text-slate-600 dark:text-[#e8eaed] hover:bg-slate-200 dark:hover:bg-[#3c4043]'
            }`}
          >
            <ListChecks size={14} className="opacity-70" />
            KSF一覧
            <span className="ml-auto text-[10px] text-slate-400">{filteredActions.length}</span>
          </button>
          
          {/* Database (Raw) */}
          <button
            onClick={() => setActiveMode('database')}
            className={`w-full text-left px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 mt-4 ${
              activeMode === 'database' 
                ? 'bg-[#fbbc04]/20 text-[#fbbc04]' 
                : 'text-slate-600 dark:text-[#e8eaed] hover:bg-slate-200 dark:hover:bg-[#3c4043]'
            }`}
          >
            <Code2 size={14} className="opacity-70" />
            Database (Raw JSON)
          </button>
        </div>

        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-[#9aa0a6] uppercase tracking-wider">時系列データベース</span>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar pb-4">
          {kpiList.map(node => (
            <button
              key={node.id}
              onClick={() => { setActiveMode('history'); setSelectedKpiId(node.id); }}
              className={`w-full text-left px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 ${
                activeMode === 'history' && selectedKpiId === node.id 
                  ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' 
                  : 'text-slate-600 dark:text-[#e8eaed] hover:bg-slate-200 dark:hover:bg-[#3c4043]'
              }`}
            >
              <FileSpreadsheet size={14} className={node.type === 'KGI' ? 'text-amber-500' : 'opacity-50'} />
              <span className={`truncate ${node.isArchived ? 'opacity-50 line-through' : ''}`}>{node.name}</span>
              {node.isArchived && <span className="ml-auto text-[9px] bg-slate-300 dark:bg-slate-700 px-1 rounded text-logic-slate dark:text-slate-400">済</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 右ペイン：Data Grid (スプレッドシートUI) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#202124]">
        
        {/* ツールバー */}
        <div className="h-14 border-b border-slate-200 dark:border-[#3c4043] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-[#e8eaed] flex items-center gap-2">
              <LayoutGrid size={16} className="text-slate-400" />
              {activeMode === 'master' ? 'KPIマスター' : activeMode === 'ksf' ? 'KSF一覧' : activeMode === 'database' ? 'Database (Raw JSON)' : `${selectedKpi?.name || ''} - 時系列データ`}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search data..." 
                className="pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-[#2d2f31] border-none rounded-full text-[13px] focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] w-48 text-slate-800 dark:text-[#e8eaed]"
              />
            </div>
            <div className="h-4 w-px bg-slate-300 dark:bg-[#5f6368]"></div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px]">
              <Filter size={14} /> Filter
            </button>
            <label className="flex items-center gap-2 cursor-pointer group px-2">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                <div className={`block w-7 h-4 rounded-full transition-colors ${showArchived ? 'bg-primary-500' : 'bg-slate-300 dark:bg-[#5f6368]'}`}></div>
                <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${showArchived ? 'translate-x-3' : ''}`}></div>
              </div>
              <span className="text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] group-hover:text-slate-700 dark:group-hover:text-[#e8eaed] transition-colors">
                🗑️ アーカイブ表示
              </span>
            </label>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px]">
              <ArrowUpDown size={14} /> Sort
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-strategic-teal dark:text-[#8ab4f8] hover:bg-primary-50 dark:hover:bg-[#8ab4f8]/10 rounded-[4px] ml-2"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* グリッド領域 / データベース領域 */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {activeMode === 'database' ? (
            <div className="p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] min-h-full leading-relaxed">
              <div className="mb-4 text-emerald-400 font-bold">// Current State in Firestore (Read-only)</div>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    projectInfo: currentProjectInfo,
                    kpiData: kpiData,
                    actions: actions
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
                <thead className="bg-slate-50 dark:bg-[#282a2d] sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-[#3c4043]">
              <tr>
                <th className="w-12 border-r border-slate-200 dark:border-[#3c4043] bg-slate-100 dark:bg-[#3c4043]"></th>
                {activeMode === 'master' && (
                  <>
                    <th className="w-48 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Aa Name</th>
                    <th className="w-24 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Type</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">BU</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono"># Target</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono"># Actual</th>
                    <th className="w-24 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Unit</th>
                  </>
                )}
                {activeMode === 'history' && selectedKpi && (
                  <>
                    <th className="w-40 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono flex items-center gap-1"><Calendar size={12} /> Date</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono"># Target</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono"># Actual</th>
                    <th className="w-auto p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Aa Comment</th>
                  </>
                )}
                {activeMode === 'ksf' && (
                  <>
                    <th className="w-64 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Aa Title</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Owner</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Dept</th>
                    <th className="w-40 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Priority</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono flex items-center gap-1"><Calendar size={12} /> StartDate</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono flex items-center gap-1"><Calendar size={12} /> DueDate</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Status</th>
                  </>
                )}
                <th className="w-auto border-b border-slate-200 dark:border-[#3c4043]"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 dark:divide-[#3c4043]">
              
              {/* マスターモード */}
              {activeMode === 'master' && kpiList.map((node, index) => (
                <tr key={node.id} className={`hover:bg-slate-50 dark:hover:bg-[#282a2d] text-[13px] text-slate-800 dark:text-[#e8eaed] ${node.isArchived ? 'opacity-60 bg-slate-100 dark:bg-[#323639]' : ''}`}>
                  <td className="p-2 text-center text-slate-400 border-r border-slate-200 dark:border-[#3c4043]">
                    {index + 1}
                    {node.isArchived && <div className="text-[8px] text-amber-600 dark:text-amber-500 mt-1">アーカイブ</div>}
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={node.name} onChange={e => handleUpdate(node.id, 'name', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <select value={node.type} onChange={e => handleUpdate(node.id, 'type', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none">
                      <option value="KGI">KGI</option><option value="KPI">KPI</option>
                    </select>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={node.businessUnit} onChange={e => handleUpdate(node.id, 'businessUnit', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="number" value={getDisplayValue(node.targetValue, node, currentPeriod, 'targetValue')} onChange={e => handleUpdate(node.id, 'targetValue', e.target.value)} disabled={node.isCalculated} className={`w-full h-full p-2 bg-transparent outline-none text-right ${node.isCalculated ? 'text-primary-500 font-bold cursor-not-allowed' : ''}`} title={node.isCalculated ? '自動計算項目です' : ''} />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0 bg-slate-50 dark:bg-[#2d2f31] font-medium text-right">
                    <div className="w-full h-full p-2 flex items-center justify-end gap-1" title={node.isCalculated ? `自動計算: ${node.formula}` : ''}>
                      {node.isCalculated && <Calculator size={12} className="text-primary-500 opacity-70" />}
                      {isPredictionMode && node.simulatedValue !== undefined ? getDisplayValue(node.simulatedValue, node, currentPeriod, 'simulatedValue') : getDisplayValue(node.actualValue, node, currentPeriod, 'actualValue')}
                    </div>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={node.unit} onChange={e => handleUpdate(node.id, 'unit', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none" />
                  </td>
                  <td></td>
                </tr>
              ))}

              {/* ヒストリーモード */}
              {activeMode === 'history' && selectedKpi && (selectedKpi.history || []).map((hist, index) => (
                <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-[#282a2d] text-[13px] text-slate-800 dark:text-[#e8eaed] group">
                  <td className="p-2 text-center text-slate-400 bg-slate-50 dark:bg-[#282a2d] border-r border-slate-200 dark:border-[#3c4043]">{index + 1}</td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="date" value={hist.date} onChange={e => handleUpdate(hist.id!, 'date', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="number" value={getDisplayValue(hist.targetValue, selectedKpi, currentPeriod)} onChange={e => handleUpdate(hist.id!, 'targetValue', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none text-right focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="number" value={getDisplayValue(hist.actualValue, selectedKpi, currentPeriod)} onChange={e => handleUpdate(hist.id!, 'actualValue', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none text-right font-bold focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={hist.comment || ''} onChange={e => handleUpdate(hist.id!, 'comment', e.target.value)} placeholder="Click to add text..." className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="p-0 align-middle">
                    <button 
                      onClick={() => deleteHistoryRecord(selectedKpi.id, hist.id!)}
                      className="w-full h-full flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="この行を削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* KSFモード */}
              {activeMode === 'ksf' && filteredActions.map((action, index) => (
                <tr key={action.id} className={`hover:bg-slate-50 dark:hover:bg-[#282a2d] text-[13px] text-slate-800 dark:text-[#e8eaed] ${action.isArchived ? 'opacity-60 bg-slate-100 dark:bg-[#323639]' : ''}`}>
                  <td className="p-2 text-center text-slate-400 border-r border-slate-200 dark:border-[#3c4043]">
                    {index + 1}
                    {action.isArchived && <div className="text-[8px] text-amber-600 dark:text-amber-500 mt-1">アーカイブ</div>}
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={action.title} onChange={e => handleUpdate(action.id, 'title', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={action.owner} onChange={e => handleUpdate(action.id, 'owner', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={action.department || ''} onChange={e => handleUpdate(action.id, 'department', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <select value={action.priority || 'unassigned'} onChange={e => handleUpdate(action.id, 'priority', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal">
                      <option value="unassigned">未設定</option>
                      <option value="urgent_important">第1領域(必須・急)</option>
                      <option value="not_urgent_important">第2領域(重要・仕込)</option>
                      <option value="urgent_not_important">第3領域(錯覚・振分)</option>
                      <option value="not_urgent_not_important">第4領域(無駄)</option>
                    </select>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="date" value={action.startDate || ''} onChange={e => handleUpdate(action.id, 'startDate', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="date" value={action.dueDate || ''} onChange={e => handleUpdate(action.id, 'dueDate', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-strategic-teal" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <select value={action.status} onChange={e => handleUpdate(action.id, 'status', e.target.value)} className={`w-full h-full p-2 bg-transparent outline-none font-medium ${action.status === 'done' ? 'text-emerald-500' : action.status === 'in_progress' ? 'text-primary-500' : 'text-logic-slate dark:text-slate-400'}`}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">進行中</option>
                      <option value="done">完了</option>
                    </select>
                  </td>
                  <td></td>
                </tr>
              ))}

            </tbody>
          </table>

          {/* New Row Button (History mode) */}
          {activeMode === 'history' && selectedKpi && (
            <div className="flex border-b border-slate-200 dark:border-[#3c4043]">
               <div className="w-12 border-r border-slate-200 dark:border-[#3c4043] bg-slate-50 dark:bg-[#282a2d]"></div>
               <button 
                 onClick={handleAddHistoryRow}
                 className="flex-1 text-left p-2 text-[13px] text-logic-slate dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#2d2f31] transition-colors flex items-center gap-2"
               >
                 <Plus size={14} /> New row
               </button>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};
