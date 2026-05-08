"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useState, useMemo } from 'react';
import { Download, Search, Filter, ArrowUpDown, Plus, LayoutGrid, Hash, Target, Database, FileSpreadsheet, ListChecks } from 'lucide-react';

type TableMode = 'master' | 'ksf' | 'history';

export const DataEditor = () => {
  const { kpiData, actions, addHistoryRecord, updateHistoryRecord, updateKpiNode } = useKpiStore();
  
  // 表示中のテーブルモード
  const [activeMode, setActiveMode] = useState<TableMode>('master');
  // historyモード時の選択中KPI
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);

  // TABLESリスト用のKPI
  const kpiList = useMemo(() => {
    return Object.values(kpiData).sort((a, b) => {
      if (a.type === 'KGI') return -1;
      if (b.type === 'KGI') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [kpiData]);

  const selectedKpi = selectedKpiId ? kpiData[selectedKpiId] : null;

  // インライン編集用のステート
  const [editState, setEditState] = useState<{ id: string, field: string, value: any } | null>(null);

  // 新規行追加用のステート（history用）
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const handleUpdate = (id: string, field: string, value: any) => {
    if (activeMode === 'master') {
      updateKpiNode(id, { [field]: value });
    } else if (activeMode === 'history' && selectedKpi) {
      updateHistoryRecord(selectedKpi.id, id, { [field]: value });
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
          <Plus size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
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
            <span className="ml-auto text-[10px] text-slate-400">{Object.keys(kpiData).length}</span>
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
            <span className="ml-auto text-[10px] text-slate-400">{actions.length}</span>
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
              <span className="truncate">{node.name}</span>
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
              {activeMode === 'master' ? 'KPIマスター' : activeMode === 'ksf' ? 'KSF一覧' : `${selectedKpi?.name} - 時系列データ`}
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-[#9aa0a6] hover:bg-slate-100 dark:hover:bg-[#3c4043] rounded-[4px]">
              <ArrowUpDown size={14} /> Sort
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-primary-600 dark:text-[#8ab4f8] hover:bg-primary-50 dark:hover:bg-[#8ab4f8]/10 rounded-[4px] ml-2"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* グリッド領域 */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
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
                    <th className="w-40 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">📅 Date</th>
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
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">📅 StartDate</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">📅 DueDate</th>
                    <th className="w-32 p-2 text-[12px] font-medium text-slate-500 dark:text-[#9aa0a6] border-r border-slate-200 dark:border-[#3c4043] font-mono">Status</th>
                  </>
                )}
                <th className="w-auto border-b border-slate-200 dark:border-[#3c4043]"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 dark:divide-[#3c4043]">
              
              {/* マスターモード */}
              {activeMode === 'master' && Object.values(kpiData).map((node, index) => (
                <tr key={node.id} className="hover:bg-slate-50 dark:hover:bg-[#282a2d] text-[13px] text-slate-800 dark:text-[#e8eaed]">
                  <td className="p-2 text-center text-slate-400 bg-slate-50 dark:bg-[#282a2d] border-r border-slate-200 dark:border-[#3c4043]">{index + 1}</td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={node.name} onChange={e => handleUpdate(node.id, 'name', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500" />
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
                    <input type="number" value={node.targetValue} onChange={e => handleUpdate(node.id, 'targetValue', Number(e.target.value))} className="w-full h-full p-2 bg-transparent outline-none text-right" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0 bg-slate-50 dark:bg-[#2d2f31] font-medium text-right">
                    <div className="w-full h-full p-2">{node.actualValue}</div>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={node.unit} onChange={e => handleUpdate(node.id, 'unit', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none" />
                  </td>
                  <td></td>
                </tr>
              ))}

              {/* ヒストリーモード */}
              {activeMode === 'history' && selectedKpi && (selectedKpi.history || []).map((hist, index) => (
                <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-[#282a2d] text-[13px] text-slate-800 dark:text-[#e8eaed]">
                  <td className="p-2 text-center text-slate-400 bg-slate-50 dark:bg-[#282a2d] border-r border-slate-200 dark:border-[#3c4043]">{index + 1}</td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="date" value={hist.date} onChange={e => handleUpdate(hist.id!, 'date', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="number" value={hist.targetValue} onChange={e => handleUpdate(hist.id!, 'targetValue', Number(e.target.value))} className="w-full h-full p-2 bg-transparent outline-none text-right focus:ring-1 focus:ring-inset focus:ring-primary-500" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="number" value={hist.actualValue} onChange={e => handleUpdate(hist.id!, 'actualValue', Number(e.target.value))} className="w-full h-full p-2 bg-transparent outline-none text-right font-bold focus:ring-1 focus:ring-inset focus:ring-primary-500" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="text" value={hist.comment || ''} onChange={e => handleUpdate(hist.id!, 'comment', e.target.value)} placeholder="Click to add text..." className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500" />
                  </td>
                  <td></td>
                </tr>
              ))}

              {/* KSFモード */}
              {activeMode === 'ksf' && actions.map((action, index) => (
                <tr key={action.id} className="hover:bg-slate-50 dark:hover:bg-[#282a2d] text-[13px] text-slate-800 dark:text-[#e8eaed]">
                  <td className="p-2 text-center text-slate-400 bg-slate-50 dark:bg-[#282a2d] border-r border-slate-200 dark:border-[#3c4043]">{index + 1}</td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <div className="w-full h-full p-2 font-medium truncate">{action.title}</div>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <div className="w-full h-full p-2 truncate">{action.owner}</div>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <div className="w-full h-full p-2 truncate">{action.department || '-'}</div>
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="date" value={action.startDate || ''} onChange={e => handleUpdate(action.id, 'startDate', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <input type="date" value={action.dueDate || ''} onChange={e => handleUpdate(action.id, 'dueDate', e.target.value)} className="w-full h-full p-2 bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-primary-500" />
                  </td>
                  <td className="border-r border-slate-200 dark:border-[#3c4043] p-0">
                    <select value={action.status} onChange={e => handleUpdate(action.id, 'status', e.target.value)} className={`w-full h-full p-2 bg-transparent outline-none font-medium ${action.status === 'done' ? 'text-emerald-500' : action.status === 'in_progress' ? 'text-primary-500' : 'text-slate-500'}`}>
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
                 className="flex-1 text-left p-2 text-[13px] text-slate-500 hover:bg-slate-50 dark:hover:bg-[#2d2f31] transition-colors flex items-center gap-2"
               >
                 <Plus size={14} /> New row
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
