"use client";

import { useState, useMemo } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { ChevronRight, ChevronDown, Target, ListChecks, TrendingUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExplorerNode = ({ nodeId, level = 0 }: { nodeId: string, level?: number }) => {
  const { kpiData, selectedNodeId, setSelectedNodeId } = useKpiStore();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const node = kpiData[nodeId];
  
  // Find children
  const childrenIds = useMemo(() => {
    return Object.keys(kpiData)
      .filter(id => kpiData[id] && !kpiData[id].isArchived && kpiData[id].parentId === nodeId)
      .sort((a, b) => {
        // Sort by order or name
        return (kpiData[a].name || "").localeCompare(kpiData[b].name || "");
      });
  }, [kpiData, nodeId]);

  if (!node || node.isArchived) return null;

  const hasChildren = childrenIds.length > 0;
  const isSelected = selectedNodeId === nodeId;

  // Icon logic based on node type and level
  const getIcon = () => {
    if (node.type === 'KGI') return <Target size={14} className="text-strategic-teal" />;
    if (level === 1) return <TrendingUp size={14} className="text-blue-500" />;
    return <ListChecks size={14} className="text-slate-400" />;
  };

  const statusColor = node.status === 'danger' ? 'bg-rose-500' : node.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => setSelectedNodeId(nodeId)}
      >
        <div 
          className="w-4 h-4 flex items-center justify-center mr-1 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
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
        
        <div className={`w-1.5 h-1.5 rounded-full ${statusColor} ml-2 shrink-0`}></div>
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
      if (!node || node.isArchived) return false;
      
      if (searchQuery) {
        return node.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      return node.type === 'KGI' || !node.parentId || !kpiData[node.parentId];
    });
  }, [kpiData, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#202124] border-r border-slate-200 dark:border-slate-800">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="KPIを検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#2d2f31] border border-slate-200 dark:border-slate-700 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-strategic-teal transition-all"
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
