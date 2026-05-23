"use client";

import { useState, useMemo } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { ChevronRight, ChevronDown, Target, ListChecks, TrendingUp, Search, CheckSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExplorerNode = ({ nodeId, level = 0 }: { nodeId: string, level?: number }) => {
  const { kpiData, selectedNodeId, setSelectedNodeId, actions, collapsedNodes, toggleNodeCollapse } = useKpiStore();
  const isExpanded = !collapsedNodes.includes(nodeId);
  
  const node = kpiData[nodeId];
  
  // Find children
  const childrenIds = useMemo(() => {
    return Object.keys(kpiData)
      .filter(id => kpiData[id] && kpiData[id].parentId === nodeId)
      .sort((a, b) => {
        // Sort by order or name
        return (kpiData[a].name || "").localeCompare(kpiData[b].name || "");
      });
  }, [kpiData, nodeId]);

  if (!node) return null;

  const hasChildren = childrenIds.length > 0;
  const isSelected = selectedNodeId === nodeId;

  // Icon logic based on node type and level
  const getIcon = () => {
    if (node.type === 'KGI') return <Target size={14} className="text-strategic-teal" />;
    if (level === 1) return <TrendingUp size={14} className="text-blue-500" />;
    return <ListChecks size={14} className="text-slate-400" />;
  };

  const statusColor = node.status === 'danger' ? 'bg-rose-500' : node.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-500';

  const nodeActions = actions.filter(a => a.kpiId === nodeId);
  const taskCount = nodeActions.length;
  const assignees = Array.from(new Set(nodeActions.map(a => a.owner).filter(Boolean)));
  const assigneeText = assignees.length > 1 ? '複数名' : assignees.length === 1 ? assignees[0] : '未定';

  return (
    <div className="select-none mb-0.5">
      <div 
        className={`flex flex-col py-1.5 px-2 hover:bg-white/40 dark:hover:bg-black/20 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-white/60 dark:bg-black/40 ring-1 ring-white/50 dark:ring-white/10 shadow-sm' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => setSelectedNodeId(nodeId)}
      >
        <div className="flex items-center">
          <div 
            className="w-4 h-4 flex items-center justify-center mr-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleNodeCollapse(nodeId);
            }}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </div>
          
          <div className="mr-2">
            {getIcon()}
          </div>
          
          <div className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
            {node.name || "名称未設定"}
          </div>
        </div>

        {/* 2段目：ステータス・タスク・担当者 */}
        <div className="flex items-center mt-1.5 gap-2.5 text-[10px] text-slate-500 dark:text-slate-400" style={{ paddingLeft: '28px' }}>
          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`}></div>
            {node.achievementRate !== undefined ? `${node.achievementRate.toFixed(1)}%` : '0.0%'}
          </span>
          
          {taskCount > 0 && (
            <span className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-700/60 px-1 py-0.5 rounded-sm text-slate-600 dark:text-slate-300 font-medium">
              <CheckSquare size={10} /> {taskCount}
            </span>
          )}
          
          <span className="flex items-center gap-1 truncate max-w-[80px]">
            <User size={10} /> {assigneeText}
          </span>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {childrenIds.map(childId => (
              <ExplorerNode key={childId} nodeId={childId} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const KpiTreeExplorer = () => {
  const { kpiData } = useKpiStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Find root nodes (KGI or nodes without parent)
  const rootNodeIds = useMemo(() => {
    return Object.keys(kpiData).filter(id => {
      const node = kpiData[id];
      if (!node) return false;
      
      if (searchQuery) {
        return node.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      return node.type === 'KGI' || !node.parentId || !kpiData[node.parentId];
    });
  }, [kpiData, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="p-3 border-b border-white/20 dark:border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="KPIを検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {rootNodeIds.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            {searchQuery ? '見つかりませんでした' : 'データがありません'}
          </div>
        ) : (
          rootNodeIds.map(nodeId => (
            <ExplorerNode key={nodeId} nodeId={nodeId} level={0} />
          ))
        )}
      </div>
    </div>
  );
};
