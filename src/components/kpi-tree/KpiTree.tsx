"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useKpiStore } from '@/store/useKpiStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { KpiNodeComponent } from './KpiNodeComponent';
import dagre from 'dagre';
import { Wand2, PanelRightClose, PanelRightOpen, Map, Focus, X, Undo2, Redo2, MoveDown, MoveRight, Sparkles, Loader2, Bot } from 'lucide-react';
import { getDisplayValue } from '@/lib/kpi-utils';
import { AILoadingIndicator } from '@/components/ui/AILoadingIndicator';


const nodeTypes = {
  kpiNode: KpiNodeComponent,
};

const nodeWidth = 360;
const nodeHeight = 220;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 120, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  try {
    dagre.layout(dagreGraph);
  } catch (e) {
    console.error("Dagre layout error (possible cycle or missing node)", e);
    // エラー時は元のnodesをそのまま返す（クラッシュ回避）
    return { nodes, edges };
  }

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // 万が一dagreがノード位置を計算できなかった場合のフォールバック
    if (!nodeWithPosition) return node;

    const newNode = {
      ...node,
      targetPosition: (isHorizontal ? 'left' : 'top') as any,
      sourcePosition: (isHorizontal ? 'right' : 'bottom') as any,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode as Node;
  });

  return { nodes: newNodes, edges };
};

const generateNodesAndEdges = (kpiData: Record<string, any>, direction: 'TB' | 'LR' = 'TB') => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const isHorizontal = direction === 'LR';

  Object.keys(kpiData).forEach(id => {
    const data = kpiData[id];
    if (!data || data.isArchived) return;

    nodes.push({
      id,
      type: 'kpiNode',
      position: data.position || { x: 0, y: 0 },
      targetPosition: (isHorizontal ? 'left' : 'top') as any,
      sourcePosition: (isHorizontal ? 'right' : 'bottom') as any,
      data,
    });

    // 親ノードが存在する場合のみエッジを追加（AI生成ミスによる存在しない親への参照を防ぐ）
    if (data.parentId && kpiData[data.parentId] && !kpiData[data.parentId].isArchived) {
      edges.push({
        id: `e-${data.parentId}-${id}`,
        source: data.parentId,
        target: id,
        animated: data.isSimulated,
        style: { stroke: data.isSimulated ? '#6366f1' : '#cbd5e1', strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
};

export const KpiTree = ({ isDashboard = false, previewMode = false }: { isDashboard?: boolean, previewMode?: boolean }) => {
  const { kpiData, selectedNodeId, setSelectedNodeId, collapsedNodes, isPredictionMode, togglePredictionMode, undo, redo, pastStates, futureStates, currentPeriod } = useKpiStore();
  const { actionPanelWidth, isActionPanelCollapsed, setActionPanelWidth, toggleActionPanel, showMiniMap, toggleMiniMap, autoCenter, toggleAutoCenter, layoutDirection, setLayoutDirection } = useLayoutStore();
  
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const [isSmartAddModalOpen, setIsSmartAddModalOpen] = useState(false);
  const [smartAddQuery, setSmartAddQuery] = useState('');
  const [smartAddMessages, setSmartAddMessages] = useState<{role: string, content: string}[]>([]);
  const [isSmartAddThinking, setIsSmartAddThinking] = useState(false);
  const [isSmartAdding, setIsSmartAdding] = useState(false);

  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResizeMobile = () => setIsMobile(window.innerWidth < 1024);
    handleResizeMobile();
    window.addEventListener('resize', handleResizeMobile);
    return () => window.removeEventListener('resize', handleResizeMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingPanel) return;
      // 右側からの幅 = ウィンドウ幅 - マウスX座標
      const newWidth = window.innerWidth - e.clientX;
      setActionPanelWidth(Math.max(250, Math.min(newWidth, 600)));
    };

    const handleMouseUp = () => {
      setIsResizingPanel(false);
    };

    if (isResizingPanel) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel, setActionPanelWidth]);

  // Undo / Redo のキーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // フォーム入力中は無視
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const { nodes: genNodes, edges: genEdges } = generateNodesAndEdges(kpiData, layoutDirection);
    
    // 全てのノード（少なくともKGIなど）が有効なpositionを持っているかチェック
    const hasPositions = genNodes.some(n => n.position.x !== 0 || n.position.y !== 0);
    
    if (hasPositions) {
      return { nodes: genNodes, edges: genEdges };
    }
    
    // 初期状態で位置情報がない場合のみ自動レイアウトを適用
    return getLayoutedElements(genNodes, genEdges, layoutDirection);
  }, [layoutDirection]); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleAutoLayout = (direction: 'TB' | 'LR' = layoutDirection) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // 自動レイアウトの結果をストアとFirestoreに保存
    const positionsToSave = layoutedNodes.map(n => ({
      id: n.id,
      position: n.position
    }));
    useKpiStore.getState().updateKpiNodePositionsBulk(positionsToSave);
    
    if (rfInstance) {
      setTimeout(() => {
        const now = Date.now();
        const newlyAddedNodes = layoutedNodes.filter(n => n.data?.addedAt && (now - Number(n.data.addedAt)) < 10000);
        
        if (newlyAddedNodes.length > 0) {
          const topNewNodes = newlyAddedNodes.filter(n => {
            const parentId = n.data?.parentId;
            if (!parentId) return true;
            return !newlyAddedNodes.some(pn => pn.id === parentId);
          });
          
          const focusNode = topNewNodes.length > 0 ? topNewNodes[0] : newlyAddedNodes[0];
          
          if (focusNode) {
            rfInstance.setCenter(focusNode.position.x + 180, focusNode.position.y + 110, { zoom: 1.0, duration: 800 });
            return;
          }
        }
        
        rfInstance.fitView({ padding: 0.2, duration: 800 });
      }, 50);
    }
  };

  const toggleDirection = () => {
    const newDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(newDir);
    handleAutoLayout(newDir);
  };

  const nodeCount = Object.keys(kpiData).length;
  const previousNodeCountRef = useRef(nodeCount);

  useEffect(() => {
    if (nodeCount > previousNodeCountRef.current) {
      // ノードが増えた場合（AIによる段階的展開など）、自動レイアウトとFit Viewを実行
      setTimeout(() => handleAutoLayout(), 100);
    }
    previousNodeCountRef.current = nodeCount;
  }, [nodeCount]);

  useEffect(() => {
    // kpiDataから親子関係マップを作成し、あるノードが折りたたまれるべきかを判定
    const isNodeHidden = (nodeId: string): boolean => {
      let currentId = nodeId;
      while (currentId) {
        const nodeData = kpiData[currentId];
        if (!nodeData || !nodeData.parentId) return false;
        if (collapsedNodes.includes(nodeData.parentId)) return true;
        currentId = nodeData.parentId;
      }
      return false;
    };

    const highlightedNodeIds = new Set<string>();
    if (selectedNodeId) {
      highlightedNodeIds.add(selectedNodeId);
      // 上位方向（祖先）の取得
      let currentId = kpiData[selectedNodeId]?.parentId;
      while (currentId && kpiData[currentId]) {
        highlightedNodeIds.add(currentId);
        currentId = kpiData[currentId].parentId;
      }
      // 下位方向（子孫）の取得
      const getDescendants = (parentId: string) => {
        Object.keys(kpiData).forEach(id => {
          if (kpiData[id] && kpiData[id].parentId === parentId && !kpiData[id].isArchived) {
            highlightedNodeIds.add(id);
            getDescendants(id);
          }
        });
      };
      getDescendants(selectedNodeId);
    }

    setNodes((nds) => {
      const isHorizontal = layoutDirection === 'LR';
      const newNodes = nds
        .filter((node) => kpiData[node.id] && !kpiData[node.id].isArchived)
        .map((node) => {
          const hasChildren = Object.values(kpiData).some(k => k.parentId === node.id);
          const isCollapsed = collapsedNodes.includes(node.id);
          const hidden = isNodeHidden(node.id);

          const kpiNode = kpiData[node.id];
          return {
            ...node,
            position: kpiNode.position || node.position,
            hidden,
            targetPosition: (isHorizontal ? 'left' : 'top') as any,
            sourcePosition: (isHorizontal ? 'right' : 'bottom') as any,
            data: {
              ...kpiNode,
              hasChildren,
              isCollapsed,
              isHighlighted: highlightedNodeIds.has(node.id),
              isDimmed: selectedNodeId && !highlightedNodeIds.has(node.id)
            } as any,
          };
        });

      const existingIds = new Set(newNodes.map((n) => n.id));
      Object.keys(kpiData).forEach((id) => {
        if (!existingIds.has(id) && !kpiData[id].isArchived) {
          const parentId = kpiData[id].parentId;
          let x = 500;
          let y = 650;
          if (parentId) {
            const parentNode = newNodes.find((n) => n.id === parentId);
            if (parentNode) {
              x = parentNode.position.x;
              y = parentNode.position.y + 150;
            }
          }
          
          const hasChildren = Object.values(kpiData).some(k => k.parentId === id && !k.isArchived);
          const isCollapsed = collapsedNodes.includes(id);
          const hidden = isNodeHidden(id);

          const isHorizontal = layoutDirection === 'LR';

          newNodes.push({
            id,
            type: 'kpiNode',
            position: { x, y },
            targetPosition: (isHorizontal ? 'left' : 'top') as any,
            sourcePosition: (isHorizontal ? 'right' : 'bottom') as any,
            hidden,
            data: {
              ...kpiData[id],
              hasChildren,
              isCollapsed,
              isHighlighted: highlightedNodeIds.has(id),
              isDimmed: selectedNodeId && !highlightedNodeIds.has(id)
            } as any,
          });
        }
      });
      return newNodes;
    });

    const getEdgeStyle = (sourceId: string, targetId: string) => {
      const targetData = kpiData[targetId];
      const isSimulated = targetData?.isSimulated || false;
      let targetStatus = 'danger';
      
      if (targetData) {
        let displayTarget = targetData.targetValue || 0;
        let displayActual = targetData.actualValue || 0;
        
        if (isPredictionMode) {
          displayActual = targetData.simulatedValue !== undefined ? targetData.simulatedValue : displayActual;
          displayTarget = targetData.simulatedTargetValue !== undefined ? targetData.simulatedTargetValue : displayTarget;
        }

        displayActual = getDisplayValue(displayActual, targetData, currentPeriod, isPredictionMode ? 'simulatedValue' : 'actualValue');
        displayTarget = getDisplayValue(displayTarget, targetData, currentPeriod, isPredictionMode ? 'simulatedTargetValue' : 'targetValue');

        let achievementRate = 0;
        if (displayTarget > 0) {
          if (targetData.name?.includes('原価率') || targetData.name?.includes('キャンセル率') || targetData.name?.includes('コスト')) {
            achievementRate = displayActual === 0 ? 0 : (displayTarget / displayActual) * 100;
          } else {
            achievementRate = (displayActual / displayTarget) * 100;
          }
        }
        
        targetStatus = isPredictionMode && targetData.simulatedStatus ? targetData.simulatedStatus : (achievementRate >= 100 ? 'good' : achievementRate >= 80 ? 'warning' : 'danger');
      }


      let strokeColor = '#cbd5e1'; // default slate-300
      let strokeWidth = 2;
      let strokeDasharray = undefined as string | undefined;
      let animated = isSimulated;
      let filter = undefined as string | undefined;

      const isNew = targetData?.addedAt && Date.now() - targetData.addedAt < 5000;

      if (isNew) {
        strokeColor = '#00A3A1';
        strokeWidth = 3;
        animated = true;
        filter = 'drop-shadow(0 0 6px rgba(0, 163, 161, 0.6))';
      } else if (targetStatus === 'danger') {
        strokeColor = '#f43f5e'; // Solid red for bottleneck
        strokeWidth = 2.5;
      } else if (targetStatus === 'warning') {
        strokeColor = `url(#edge-progress-${targetId})`;
        strokeWidth = 2.5;
      } else if (targetStatus === 'good') {
        strokeColor = `url(#edge-progress-${targetId})`;
        strokeWidth = 3;
      }

      if (isSimulated && !isNew) {
        strokeColor = '#8ab4f8';
        animated = true;
        filter = 'drop-shadow(0 0 6px rgba(138, 180, 248, 0.6))';
      }

      // 選択中ノードとその影響範囲（上位・下位すべて）を点線にして発光させる
      if (selectedNodeId && highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId)) {
        strokeDasharray = '6, 6';
        strokeWidth = 3.5; 
        strokeColor = '#00A3A1'; // Strategic Teal
        animated = true;
        filter = 'drop-shadow(0 0 6px rgba(0, 163, 161, 0.7))';
      } else if (selectedNodeId) {
        // 選択外の線は薄くする
        strokeColor = '#e2e8f0'; // slate-200
        filter = undefined;
      }

      const style: any = { stroke: strokeColor, strokeWidth };
      if (strokeDasharray) style.strokeDasharray = strokeDasharray;
      if (filter) style.filter = filter;

      return { style, animated };
    };

    setEdges((eds) => {
      const newEdges = eds
        .filter((edge) => kpiData[edge.target] && !kpiData[edge.target].isArchived && kpiData[edge.source] && !kpiData[edge.source].isArchived)
        .map((edge) => {
          const hidden = isNodeHidden(edge.target);
          const { style, animated } = getEdgeStyle(edge.source, edge.target);

          return {
            ...edge,
            hidden,
            animated,
            style,
          };
        });

      const existingEdgeIds = new Set(newEdges.map((e) => e.id));
      Object.keys(kpiData).forEach((id) => {
        if (kpiData[id].isArchived) return;
        const parentId = kpiData[id].parentId;
        if (parentId && kpiData[parentId] && !kpiData[parentId].isArchived) {
          const edgeId = `e-${parentId}-${id}`;
          if (!existingEdgeIds.has(edgeId)) {
            const hidden = isNodeHidden(id);
            const { style, animated } = getEdgeStyle(parentId, id);
            newEdges.push({
              id: edgeId,
              source: parentId,
              target: id,
              hidden,
              animated,
              style,
            });
          }
        }
      });
      return newEdges;
    });
  }, [kpiData, setNodes, setEdges, collapsedNodes, selectedNodeId, isPredictionMode]);

  // 選択されたノードが変更されたらセンタリングするアニメーション
  useEffect(() => {
    if (autoCenter && selectedNodeId && rfInstance) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        // ノードの中心座標を計算してセンタリング
        const x = node.position.x + nodeWidth / 2;
        const y = node.position.y + nodeHeight / 2;
        rfInstance.setCenter(x, y, { zoom: 1.1, duration: 800 });
      }
    }
  }, [selectedNodeId, rfInstance, nodes, autoCenter]);

  return (
    <div className={`w-full h-full min-w-0 flex flex-col min-h-0 ${previewMode ? "fixed inset-0 z-50 m-0 p-0" : ""}`}>
      <div className={`w-full h-full flex-1 min-w-0 min-h-0 bg-white dark:bg-[#2d2f31] overflow-hidden transition-colors relative ${isDashboard ? 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm' : ''}`}>
        {!previewMode && (
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={undo}
                disabled={pastStates.length === 0}
                className="flex items-center justify-center w-8 h-8 text-logic-slate dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="元に戻す (Cmd+Z)"
              >
                <Undo2 size={16} />
              </button>
              <div className="w-[1px] bg-slate-200 dark:bg-slate-700"></div>
              <button
                onClick={redo}
                disabled={futureStates.length === 0}
                className="flex items-center justify-center w-8 h-8 text-logic-slate dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="やり直す (Cmd+Shift+Z)"
              >
                <Redo2 size={16} />
              </button>
            </div>
            <button
              onClick={() => handleAutoLayout()}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-logic-slate dark:text-slate-400 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-strategic-teal dark:hover:text-primary-400 transition-colors text-xs font-bold"
            >
              <Wand2 size={14} />
              自動整列 (Auto Layout)
            </button>

            <button
              onClick={toggleAutoCenter}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg shadow-sm border transition-colors text-xs font-bold ${autoCenter ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-strategic-teal dark:text-primary-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-logic-slate dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              title="選択時の自動センタリングのオン/オフ"
            >
              <Focus size={14} />
              自動フォーカス
            </button>
            <button
              onClick={togglePredictionMode}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg shadow-sm border transition-all text-xs font-bold ${isPredictionMode ? 'bg-[#8ab4f8]/10 border-[#8ab4f8] text-[#8ab4f8] shadow-[0_0_10px_rgba(138,180,248,0.3)] ring-1 ring-[#8ab4f8]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-logic-slate dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              title="AI予測（シミュレーション）モードのON/OFF"
            >
              <Bot size={14} />
              AI予測モード {isPredictionMode ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={toggleDirection}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-logic-slate dark:text-slate-400 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-strategic-teal dark:hover:text-primary-400 transition-colors text-xs font-bold"
              title="レイアウトの方向（縦・横）を切り替え"
            >
              {layoutDirection === 'TB' ? <MoveDown size={14} /> : <MoveRight size={14} />}
              方向: {layoutDirection === 'TB' ? '縦 (Top to Bottom)' : '横 (Left to Right)'}
            </button>
            <button
              onClick={() => setIsSmartAddModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-strategic-teal text-white border border-transparent rounded-lg shadow-sm hover:bg-strategic-teal/90 transition-colors text-xs font-bold"
              title="AIに最適な場所を判定させてKPIを追加"
            >
              <Sparkles size={14} />
              AIスマート追加
            </button>
            <button
              onClick={toggleMiniMap}
              className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-sm border transition-colors ${showMiniMap ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-strategic-teal dark:text-primary-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="ミニマップの表示/非表示"
            >
              <Map size={16} />
            </button>

            {/* 期間切替ドロップダウン */}
            <div className="flex items-center ml-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <select
                value={useKpiStore((state) => state.currentPeriod)}
                onChange={(e) => useKpiStore.getState().setPeriod(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-logic-slate dark:text-slate-400 px-3 py-1.5 focus:ring-0 cursor-pointer"
              >
                <option value="year">年次 (1年) - 累積</option>
                <optgroup label="サマリー (FY26)">
                  <option value="H1-2026">上半期 (H1)</option>
                  <option value="H2-2026">下半期 (H2)</option>
                  <option value="Q1-2026">第1四半期 (Q1: 4〜6月)</option>
                  <option value="Q2-2026">第2四半期 (Q2: 7〜9月)</option>
                  <option value="Q3-2026">第3四半期 (Q3: 10〜12月)</option>
                  <option value="Q4-2026">第4四半期 (Q4: 1〜3月)</option>
                </optgroup>
                <optgroup label="月次 (FY26)">
                  <option value="2026-04">2026年04月</option>
                  <option value="2026-05">2026年05月</option>
                  <option value="2026-06">2026年06月</option>
                  <option value="2026-07">2026年07月</option>
                  <option value="2026-08">2026年08月</option>
                  <option value="2026-09">2026年09月</option>
                  <option value="2026-10">2026年10月</option>
                  <option value="2026-11">2026年11月</option>
                  <option value="2026-12">2026年12月</option>
                  <option value="2027-01">2027年01月</option>
                  <option value="2027-02">2027年02月</option>
                  <option value="2027-03">2027年03月</option>
                </optgroup>
                <optgroup label="日次 (デイリーペース)">
                  <option value="today">今日 (Today)</option>
                </optgroup>
              </select>
            </div>
            
            {/* スマート検索バー */}
          </div>
        )}



        {/* 凡例（Legend） */}
        {!previewMode && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg text-[10px] sm:text-xs min-w-[200px]">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
              <span>ステータスと線の意味</span>
              <span className="text-[9px] font-normal text-slate-400">達成率</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[3px] bg-[#34d399] rounded-full"></div>
                  <span className="text-logic-slate dark:text-slate-400 font-medium">順調</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">100%〜</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[2.5px] bg-[#fbbf24] rounded-full"></div>
                  <span className="text-logic-slate dark:text-slate-400 font-medium">注意</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">80%〜99%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[3px] bg-[#f43f5e] rounded-full"></div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">ボトルネック / 不足</span>
                </div>
                <span className="text-[10px] text-rose-500 font-mono">〜79%</span>
              </div>
              <div className="flex flex-col gap-2 pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-0 border-t-[2px] border-dashed border-slate-400"></div>
                  <span className="text-logic-slate dark:text-slate-400 text-[10px]">選択中のKPIの依存経路（ハイライト）</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[2px] bg-[#8ab4f8] rounded-full"></div>
                  <span className="text-logic-slate dark:text-slate-400 text-[10px]">AI予測モードON時のみ青く発光</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={(_, node) => {
            useKpiStore.getState().updateKpiNodePosition(node.id, node.position);
          }}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.05}
          maxZoom={2}
          className="bg-clean-canvas dark:bg-slate-900 transition-colors"
        >
          
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              {Object.keys(kpiData).map(id => {
                const data = kpiData[id];
                if (!data || !data.parentId) return null;
                let displayTarget = data.targetValue || 0;
                let displayActual = data.actualValue || 0;
                
                if (isPredictionMode) {
                  displayActual = data.simulatedValue !== undefined ? data.simulatedValue : displayActual;
                  displayTarget = data.simulatedTargetValue !== undefined ? data.simulatedTargetValue : displayTarget;
                }

                displayActual = getDisplayValue(displayActual, data as any, currentPeriod, isPredictionMode ? 'simulatedValue' : 'actualValue');
                displayTarget = getDisplayValue(displayTarget, data as any, currentPeriod, isPredictionMode ? 'simulatedTargetValue' : 'targetValue');

                let achievementRate = 0;
                if (displayTarget > 0) {
                  if (data.name?.includes('原価率') || data.name?.includes('キャンセル率') || data.name?.includes('コスト')) {
                    achievementRate = displayActual === 0 ? 0 : (displayTarget / displayActual) * 100;
                  } else {
                    achievementRate = (displayActual / displayTarget) * 100;
                  }
                }
                
                achievementRate = Math.min(100, Math.max(0, achievementRate));
                const status = isPredictionMode && data.simulatedStatus ? data.simulatedStatus : (achievementRate >= 100 ? 'good' : achievementRate >= 80 ? 'warning' : 'danger');
                const color = status === 'good' ? '#10b981' : status === 'warning' ? '#fbbf24' : '#f43f5e';

                return (
                  <linearGradient key={`grad-${id}`} id={`edge-progress-${id}`} x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                    <stop offset="0%" stopColor={color} />
                    <stop offset={`${achievementRate}%`} stopColor={color} />
                    <stop offset={`${achievementRate}%`} stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                );
              })}
            </defs>
          </svg>
          <Background color="#94a3b8" gap={16} />
          <Controls className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 fill-slate-700 dark:fill-slate-300 shadow-lg" />
          {showMiniMap && (
            <MiniMap 
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl transition-opacity"
              nodeColor={(node) => {
                if (node.data?.status === 'warning') return '#f43f5e';
                if (node.data?.status === 'good') return '#10b981';
                return '#6366f1';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          )}
        </ReactFlow>
      </div>

      {/* AI Smart Add Sidebar (Copilot) */}
      {isSmartAddModalOpen && (
        <div className="absolute top-0 right-0 h-full w-[450px] z-50 bg-white dark:bg-[#202124] shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-strategic-teal/10 dark:bg-strategic-teal/10 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-strategic-teal flex items-center gap-2">
              <Sparkles className="text-strategic-teal" size={18} />
              AI戦略コンサルタント（Copilot）
            </h3>
            <button onClick={() => setIsSmartAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
              {isSmartAdding ? (
                <AILoadingIndicator 
                  message="AI IS THINKING..." 
                  subMessage="最適なKPIを自動生成しています" 
                  className="h-32 shadow-none border-none bg-transparent dark:bg-transparent"
                />
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 custom-scrollbar">
                    {smartAddMessages.length === 0 && (
                      <div className="text-[13px] text-slate-500 text-center mt-4 leading-relaxed">
                        追加したいKPIや要素を入力してください。AIが最適な階層への接続、中間KPIの生成、計算式の再構築を提案します。<br/>（例：「SNSマーケティングのKPIを追加したい」）
                      </div>
                    )}
                    {smartAddMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-4 py-3 text-[13px] shadow-sm ${msg.role === 'user' ? 'bg-strategic-teal text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-pre-wrap'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isSmartAddThinking && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-[13px] flex items-center gap-2 text-slate-700 dark:text-slate-300 shadow-sm">
                          <Loader2 size={14} className="animate-spin text-strategic-teal" /> AIアーキテクトが構成案を検討中...
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <input 
                      type="text" 
                      placeholder="AIアーキテクトにチャットで相談..."
                      value={smartAddQuery}
                      onChange={(e) => setSmartAddQuery(e.target.value)}
                      disabled={isSmartAddThinking || isSmartAdding}
                      className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-strategic-teal transition-all"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          if (!smartAddQuery.trim() || isSmartAddThinking || isSmartAdding) return;
                          
                          const userQuery = smartAddQuery;
                          setSmartAddQuery('');
                          setSmartAddMessages(prev => [...prev, { role: 'user', content: userQuery }]);
                          setIsSmartAddThinking(true);
                          
                          try {
                            const res = await fetch('/api/smart-add-chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                message: userQuery,
                                currentTree: Object.values(useKpiStore.getState().kpiData),
                                history: smartAddMessages,
                                businessUnit: useKpiStore.getState().currentProjectInfo?.name || 'company'
                              })
                            });
                            
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            
                            setSmartAddMessages(prev => [...prev, { role: 'model', content: data.text }]);
                            
                            if (data.patchData) {
                              // If AI outputted the patch JSON, we apply it and close the modal
                              setIsSmartAdding(true);
                              await useKpiStore.getState().applySmartAddPatch(data.patchData);
                              setIsSmartAddModalOpen(false);
                              setSmartAddMessages([]);
                            }
                          } catch (err) {
                            setSmartAddMessages(prev => [...prev, { role: 'model', content: 'エラーが発生しました。' }]);
                          } finally {
                            setIsSmartAddThinking(false);
                            setIsSmartAdding(false);
                          }
                        }
                      }}
                    />
                    <button 
                      disabled={!smartAddQuery.trim() || isSmartAddThinking || isSmartAdding}
                      onClick={async () => {
                          if (!smartAddQuery.trim() || isSmartAddThinking || isSmartAdding) return;
                          
                          const userQuery = smartAddQuery;
                          setSmartAddQuery('');
                          setSmartAddMessages(prev => [...prev, { role: 'user', content: userQuery }]);
                          setIsSmartAddThinking(true);
                          
                          try {
                            const res = await fetch('/api/smart-add-chat', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                message: userQuery,
                                currentTree: Object.values(useKpiStore.getState().kpiData),
                                history: smartAddMessages,
                                businessUnit: useKpiStore.getState().currentProjectInfo?.name || 'company'
                              })
                            });
                            
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            
                            setSmartAddMessages(prev => [...prev, { role: 'model', content: data.text }]);
                            
                            if (data.patchData) {
                              setIsSmartAdding(true);
                              await useKpiStore.getState().applySmartAddPatch(data.patchData);
                              setIsSmartAddModalOpen(false);
                              setSmartAddMessages([]);
                            }
                          } catch (err) {
                            setSmartAddMessages(prev => [...prev, { role: 'model', content: 'エラーが発生しました。' }]);
                          } finally {
                            setIsSmartAddThinking(false);
                            setIsSmartAdding(false);
                          }
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-strategic-teal to-blue-600 hover:from-strategic-teal/90 hover:to-blue-600/90 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      送信
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => setIsSmartAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isSmartAdding}
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  if (!smartAddQuery.trim()) return;
                  setIsSmartAdding(true);
                  try {
                    await useKpiStore.getState().smartAddKpi(smartAddQuery);
                    setSmartAddQuery('');
                    setIsSmartAddModalOpen(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSmartAdding(false);
                  }
                }}
                disabled={!smartAddQuery.trim() || isSmartAdding}
                className="px-4 py-2 text-sm font-bold text-white bg-strategic-teal hover:bg-strategic-teal/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSmartAdding ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    自動構築中...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    ツリーに自動追加
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
