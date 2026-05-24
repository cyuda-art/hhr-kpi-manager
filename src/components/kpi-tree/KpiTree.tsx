"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useKpiStore } from '@/store/useKpiStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { KpiNodeComponent } from './KpiNodeComponent';
import dagre from 'dagre';
import { Wand2, PanelRightClose, PanelRightOpen, Map, Focus, X, Undo2, Redo2, MoveDown, MoveRight, Sparkles, Loader2, Bot, Info, Menu, ChevronLeft } from 'lucide-react';
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
  // 余白を広めに取って、KPI同士の間隔をゆったりとさせる（インダストリアルデザイン的な余白の美学）
  dagreGraph.setGraph({ rankdir: direction === 'TB' ? 'BT' : 'RL', ranksep: 200, nodesep: 150 });

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
      targetPosition: (isHorizontal ? 'right' : 'bottom') as any,
      sourcePosition: (isHorizontal ? 'left' : 'top') as any,
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
    if (!data) return;

    nodes.push({
      id,
      type: 'kpiNode',
      position: data.position || { x: 0, y: 0 },
      targetPosition: (isHorizontal ? 'right' : 'bottom') as any,
      sourcePosition: (isHorizontal ? 'left' : 'top') as any,
      data,
    });

    // 親ノードが存在する場合のみエッジを追加（AI生成ミスによる存在しない親への参照を防ぐ）
    if (data.parentId && kpiData[data.parentId]) {
      edges.push({
        id: `e-${id}-${data.parentId}`,
        source: id,
        target: data.parentId,
        animated: true, // データの流れを表現するアニメーション
        style: { stroke: 'rgba(148, 163, 184, 0.5)', strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
};

export const KpiTree = ({ isDashboard = false, previewMode = false }: { isDashboard?: boolean, previewMode?: boolean }) => {
  const { kpiData, selectedNodeId, setSelectedNodeId, collapsedNodes, undo, redo, pastStates, futureStates, currentPeriod, isAiGenerating } = useKpiStore();

  // 期間変更時のダイブ（没入）トランジション状態
  const [isDiving, setIsDiving] = useState(false);
  const prevPeriodRef = useRef(currentPeriod);

  useEffect(() => {
    if (prevPeriodRef.current !== currentPeriod) {
      setIsDiving(true);
      const timer = setTimeout(() => setIsDiving(false), 400); // ワープアニメーション時間と同期
      prevPeriodRef.current = currentPeriod;
      return () => clearTimeout(timer);
    }
  }, [currentPeriod]);

  // Z軸（奥行き）のスケール計算
  const getDepthScale = () => {
    if (currentPeriod === 'year') return 'scale-[0.92]'; // 一番奥（マクロ）
    if (currentPeriod === 'today') return 'scale-[1.08]'; // 一番手前（ミクロ）
    return 'scale-100'; // 中間（Qや月）
  };

  const { actionPanelWidth, isActionPanelCollapsed, setActionPanelWidth, toggleActionPanel, showMiniMap, toggleMiniMap, autoCenter, toggleAutoCenter, layoutDirection, setLayoutDirection, showStatusLegend, toggleStatusLegend } = useLayoutStore();
  const currentProjectInfo = useKpiStore((state) => state.currentProjectInfo);
  const thresholds = currentProjectInfo?.statusThresholds || { good: 100, warning: 80 };
  
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const setIsCopilotSidebarOpen = useKpiStore(state => state.setIsCopilotSidebarOpen);

  const [isMobile, setIsMobile] = useState(true);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

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
    
    // ノードの過半数が有効なpositionを持っているかチェック
    const positionedNodesCount = genNodes.filter(n => n.position.x !== 0 || n.position.y !== 0).length;
    
    // 座標が重複しているかチェック（DBに同じ座標が保存されて重なってしまう不具合の対策）
    const positionSet = new Set(genNodes.map(n => `${Math.round(n.position.x)},${Math.round(n.position.y)}`));
    const isOverlapping = genNodes.length > 1 && positionSet.size < genNodes.length / 2;
    
    const hasPositions = genNodes.length > 0 && positionedNodesCount > genNodes.length / 2 && !isOverlapping;
    
    if (hasPositions) {
      return { nodes: genNodes, edges: genEdges };
    }
    
    // 初期状態で位置情報がない、または重なっている場合は自動レイアウトを適用
    return getLayoutedElements(genNodes, genEdges, layoutDirection);
  }, [layoutDirection]); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleAutoLayout = (direction: 'TB' | 'LR' = layoutDirection) => {
    // 常に最新のノードとエッジを取得して古いクロージャによる重複を回避
    const currentNodes = rfInstance ? rfInstance.getNodes() : nodes;
    const currentEdges = rfInstance ? rfInstance.getEdges() : edges;
    
    if (currentNodes.length === 0) return;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(currentNodes, currentEdges, direction);
    
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
        } else {
          // 新規追加ノードがない場合（初回ロード時など）はKGIにフォーカス
          const kgiNode = layoutedNodes.find(n => n.data?.type === 'KGI' || !n.data?.parentId);
          if (kgiNode) {
            rfInstance.setCenter(kgiNode.position.x + 180, kgiNode.position.y + 110, { zoom: 0.9, duration: 800 });
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
  const previousNodeCountRef = useRef(0); // 初期値を0にして、初回マウント時に自動レイアウト＆フォーカスが発火するようにする

  useEffect(() => {
    if (nodeCount > previousNodeCountRef.current) {
      // ノードが増えた場合（AIによる段階的展開など）、自動レイアウトとFit Viewを実行
      setTimeout(() => handleAutoLayout(), 100);
    }
    previousNodeCountRef.current = nodeCount;
  }, [nodeCount]);

  useEffect(() => {
    // 初回マウント時など、位置情報がDBに保存されていない場合は、自動レイアウト結果をDBに保存する
    if (nodes.length === 0) return;
    
    const positionedNodesCount = Object.values(kpiData).filter(data => data.position && (data.position.x !== 0 || data.position.y !== 0)).length;
    const totalNodes = Object.keys(kpiData).length;
    
    // DB上の座標が重複しているかチェック
    const positionSet = new Set(Object.values(kpiData).map(n => n.position ? `${Math.round(n.position.x)},${Math.round(n.position.y)}` : '0,0'));
    const isOverlapping = totalNodes > 1 && positionSet.size < totalNodes / 2;
    
    // 位置情報を持っていないノードが過半数の場合、または重なっている場合
    if (totalNodes > 0 && (positionedNodesCount <= totalNodes / 2 || isOverlapping)) {
      console.log("Missing positions for many nodes. Saving initial layout to DB.");
      const positionsToSave = nodes.map(n => ({
        id: n.id,
        position: n.position
      }));
      
      const timeoutId = setTimeout(() => {
        useKpiStore.getState().updateKpiNodePositionsBulk(positionsToSave);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, kpiData]);

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
          if (kpiData[id] && kpiData[id].parentId === parentId) {
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
        .filter((node) => !!kpiData[node.id])
        .map((node) => {
          const hasChildren = Object.values(kpiData).some(k => k.parentId === node.id);
          const isCollapsed = collapsedNodes.includes(node.id);
          const hidden = isNodeHidden(node.id);

          const kpiNode = kpiData[node.id];
          // DBの座標が有効かどうか（0,0でないか）
          const hasValidDbPosition = kpiNode.position && (kpiNode.position.x !== 0 || kpiNode.position.y !== 0);

          return {
            ...node,
            // 基本はDB座標を最優先する。DBに座標がない（0,0）場合はReact Flow側（Dagre等）の座標を使う
            position: node.dragging ? node.position : (hasValidDbPosition && kpiNode.position ? kpiNode.position : node.position),
            hidden,
            targetPosition: (isHorizontal ? 'right' : 'bottom') as any,
            sourcePosition: (isHorizontal ? 'left' : 'top') as any,
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
        if (!existingIds.has(id)) {
          const parentId = kpiData[id].parentId;
          let x = 500;
          let y = 650;
          
          const initNode = initialNodes.find(n => n.id === id);
          
          if (kpiData[id]?.position && (kpiData[id].position.x !== 0 || kpiData[id].position.y !== 0)) {
            x = kpiData[id].position.x;
            y = kpiData[id].position.y;
          } else if (initNode) {
            x = initNode.position.x;
            y = initNode.position.y;
          } else if (parentId) {
            const parentNode = newNodes.find((n) => n.id === parentId);
            if (parentNode) {
              x = parentNode.position.x;
              y = parentNode.position.y + 150;
            }
          }
          
          const hasChildren = Object.values(kpiData).some(k => k.parentId === id);
          const isCollapsed = collapsedNodes.includes(id);
          const hidden = isNodeHidden(id);

          const isHorizontal = layoutDirection === 'LR';

          newNodes.push({
            id,
            type: 'kpiNode',
            position: { x, y },
            targetPosition: (isHorizontal ? 'right' : 'bottom') as any,
            sourcePosition: (isHorizontal ? 'left' : 'top') as any,
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
      let targetStatus = targetData?.status || 'danger';
      let strokeColor = '#94a3b8'; // darker default
      let strokeWidth = 3; // increased for better visibility
      let strokeDasharray = undefined as string | undefined;
      let animated = false;
      let filter: string | undefined = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'; // default shadow

      const isNew = targetData?.addedAt && Date.now() - targetData.addedAt < 5000;

      if (isNew) {
        strokeColor = '#00A3A1';
        strokeWidth = 4;
        animated = true;
        filter = 'drop-shadow(0 0 6px rgba(0, 163, 161, 0.6))';
      } else if (targetStatus === 'danger') {
        strokeColor = '#f43f5e'; // Solid red for bottleneck
        strokeWidth = 3.5;
        filter = 'drop-shadow(0px 2px 6px rgba(244,63,94,0.4))';
      } else if (targetStatus === 'warning') {
        strokeColor = `url(#edge-progress-${targetId})`;
        strokeWidth = 3.5;
        filter = 'drop-shadow(0px 2px 6px rgba(245,158,11,0.4))';
      } else if (targetStatus === 'good') {
        strokeColor = `url(#edge-progress-${targetId})`;
        strokeWidth = 4;
        filter = 'drop-shadow(0px 2px 6px rgba(16,185,129,0.4))';
      }

      // 選択中ノードとその影響範囲（上位・下位すべて）を点線にして発光させる
      if (selectedNodeId && highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId)) {
        strokeDasharray = '6, 6';
        strokeWidth = 3.5; 
        animated = true;
        if (targetStatus === 'good') {
          strokeColor = '#00A3A1'; // Strategic Teal
          filter = 'drop-shadow(0 0 6px rgba(0, 163, 161, 0.7))';
        } else if (targetStatus === 'warning') {
          strokeColor = '#f59e0b'; // amber-500
          filter = 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))';
        } else {
          strokeColor = '#f43f5e'; // rose-500
          filter = 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.7))';
        }
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
        .filter((edge) => kpiData[edge.target] && kpiData[edge.source])
        .map((edge) => {
          const hidden = isNodeHidden(edge.source);
          const { style, animated } = getEdgeStyle(edge.target, edge.source);

          return {
            ...edge,
            hidden,
            animated,
            style,
          };
        });

      const existingEdgeIds = new Set(newEdges.map((e) => e.id));
      Object.keys(kpiData).forEach((id) => {
        if (!kpiData[id]) return;
        const parentId = kpiData[id].parentId;
        if (parentId && kpiData[parentId]) {
          const edgeId = `e-${id}-${parentId}`;
          if (!existingEdgeIds.has(edgeId)) {
            const hidden = isNodeHidden(id);
            const { style, animated } = getEdgeStyle(parentId, id);
            newEdges.push({
              id: edgeId,
              source: id,
              target: parentId,
              hidden,
              animated,
              style,
            });
          }
        }
      });
      return newEdges;
    });
  }, [kpiData, setNodes, setEdges, collapsedNodes, selectedNodeId]);

  const prevSelectedNodeIdRef = useRef<string | null>(null);
  const prevAutoCenterRef = useRef<boolean>(autoCenter);

  // 選択されたノードが変更されたらセンタリングするアニメーション
  useEffect(() => {
    const shouldCenter = 
      (autoCenter && selectedNodeId !== prevSelectedNodeIdRef.current) || 
      (autoCenter && !prevAutoCenterRef.current && selectedNodeId);

    if (shouldCenter && selectedNodeId && rfInstance) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        // ノードの中心座標を計算してセンタリング
        const x = node.position.x + nodeWidth / 2;
        const y = node.position.y + nodeHeight / 2;
        rfInstance.setCenter(x, y, { zoom: 1.1, duration: 800 });
      }
    }

    prevSelectedNodeIdRef.current = selectedNodeId;
    prevAutoCenterRef.current = autoCenter;
  }, [selectedNodeId, rfInstance, nodes, autoCenter]);

  return (
    <div className={`w-full h-full min-w-0 flex flex-col min-h-0 kpi-tree-wrapper ${previewMode ? "fixed inset-0 z-50 m-0 p-0" : ""}`} ref={reactFlowWrapper}>
      <div className={`w-full h-full flex-1 min-w-0 min-h-0 bg-transparent overflow-hidden transition-colors relative ${isDashboard ? 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm' : ''} ${isAiGenerating ? 'ai-global-processing-border' : ''}`}>
        
        {/* AI生成中キャンバス内のオーロラエフェクト */}
        {isAiGenerating && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ borderRadius: 'inherit' }}>
            <div className="ai-caustic-surface" style={{ mixBlendMode: 'overlay', opacity: 0.6 }} />
          </div>
        )}

        {!previewMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-lg shadow-slate-200/50 dark:shadow-black/20 pointer-events-auto">
            {/* Toolbar Toggle */}
            <div className="relative group flex items-center justify-center">
              <button
                onClick={() => setIsToolbarOpen(!isToolbarOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {isToolbarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
              </button>
              <div className="absolute bottom-full mb-2 left-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                {isToolbarOpen ? 'ツールバーを閉じる' : 'ツールバーを開く'}
              </div>
            </div>

            {isToolbarOpen && (
              <>
                <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700/50 mx-0.5"></div>

                {/* Undo/Redo */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                  <div className="relative group flex items-center justify-center">
                    <button
                      onClick={undo}
                      disabled={pastStates.length === 0}
                      className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Undo2 size={14} />
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                      元に戻す (Cmd+Z)
                    </div>
                  </div>
                  <div className="relative group flex items-center justify-center">
                    <button
                      onClick={redo}
                      disabled={futureStates.length === 0}
                      className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Redo2 size={14} />
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                      やり直す (Cmd+Shift+Z)
                    </div>
                  </div>
                </div>
                
                <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700/50 mx-0.5"></div>

                {/* Layout Options */}
                <div className="relative group flex items-center justify-center">
                  <button
                    onClick={() => handleAutoLayout()}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-strategic-teal dark:text-slate-400 transition-colors"
                  >
                    <Wand2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                    ツリーを自動整列
                  </div>
                </div>
                <div className="relative group flex items-center justify-center">
                  <button
                    onClick={toggleAutoCenter}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${autoCenter ? 'bg-primary-50 dark:bg-primary-900/50 text-strategic-teal dark:text-primary-400' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Focus size={16} />
                  </button>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                    選択時の自動フォーカス
                  </div>
                </div>

                {/* Layout Direction Segmented Control */}
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                  <div className="relative group flex items-center justify-center">
                    <button
                      onClick={() => layoutDirection !== 'LR' && toggleDirection()}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${layoutDirection === 'LR' ? 'bg-white dark:bg-slate-700 shadow-sm text-strategic-teal dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      <MoveRight size={14} />
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                      横方向レイアウト
                    </div>
                  </div>
                  <div className="relative group flex items-center justify-center">
                    <button
                      onClick={() => layoutDirection !== 'TB' && toggleDirection()}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${layoutDirection === 'TB' ? 'bg-white dark:bg-slate-700 shadow-sm text-strategic-teal dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      <MoveDown size={14} />
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                      縦方向レイアウト
                    </div>
                  </div>
                </div>

                <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700/50 mx-0.5"></div>

                {/* Tools */}
                <div className="relative group flex items-center justify-center">
                  <button
                    onClick={toggleMiniMap}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${showMiniMap ? 'bg-primary-50 dark:bg-primary-900/50 text-strategic-teal dark:text-primary-400' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Map size={16} />
                  </button>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                    ミニマップ
                  </div>
                </div>
                <div className="relative group flex items-center justify-center">
                  <button
                    onClick={toggleStatusLegend}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${showStatusLegend ? 'bg-primary-50 dark:bg-primary-900/50 text-strategic-teal dark:text-primary-400' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Info size={16} />
                  </button>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                    ステータス凡例
                  </div>
                </div>


                <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700/50 mx-0.5"></div>

                {/* 期間切替ドロップダウン */}
                <div className="relative group flex items-center justify-center mr-1">
                  <select
                    value={currentPeriod}
                    onChange={(e) => useKpiStore.getState().setPeriod(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 py-1.5 px-2 focus:ring-0 cursor-pointer appearance-none text-center"
                    style={{ textAlignLast: 'center' }}
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
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-xl">
                    表示期間の切り替え
                  </div>
                </div>
              </>
            )}
          </div>
        )}



        {/* 凡例（Legend） */}
        {!previewMode && (
          <div className="absolute bottom-[140px] left-4 z-10 flex flex-col-reverse items-start gap-2">

            
            {showStatusLegend && (
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-lg text-[10px] sm:text-xs min-w-[200px]">
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
                <span className="text-[10px] text-slate-400 font-mono">{thresholds.good}%〜</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[2.5px] bg-[#fbbf24] rounded-full"></div>
                  <span className="text-logic-slate dark:text-slate-400 font-medium">注意</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{thresholds.warning}%〜{thresholds.good - 1}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[3px] bg-[#f43f5e] rounded-full"></div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">ボトルネック / 不足</span>
                </div>
                <span className="text-[10px] text-rose-500 font-mono">〜{thresholds.warning - 1}%</span>
              </div>
              <div className="flex flex-col gap-2 pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-0 border-t-[2px] border-dashed border-slate-400"></div>
                  <span className="text-logic-slate dark:text-slate-400 text-[10px]">選択中のKPIの依存経路（ハイライト）</span>
                </div>

              </div>
            </div>
          </div>
            )}
          </div>
        )}
        <div 
          className={`absolute inset-0 transition-all duration-700 ease-out ${getDepthScale()} ${isDiving ? 'blur-[8px] opacity-80' : 'blur-0 opacity-100'}`}
          style={{ transformOrigin: 'center center' }}
        >
          <ReactFlow
            nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={(_, node) => {
            useKpiStore.getState().updateKpiNodePosition(node.id, node.position);
          }}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            if (isActionPanelCollapsed) {
              toggleActionPanel();
            }
          }}
          onPaneClick={() => setSelectedNodeId(null)}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.05}
          maxZoom={2}
          className="bg-transparent transition-colors"
        >
          
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              {Object.keys(kpiData).map(id => {
                const data = kpiData[id];
                if (!data || !data.parentId) return null;
                let displayTarget = data.targetValue || 0;
                let displayActual = data.actualValue || 0;
                
                displayActual = getDisplayValue(displayActual, data as any, currentPeriod, 'actualValue');
                displayTarget = getDisplayValue(displayTarget, data as any, currentPeriod, 'targetValue');

                let achievementRate = 0;
                if (displayTarget > 0) {
                  if (data.name?.includes('原価率') || data.name?.includes('キャンセル率') || data.name?.includes('コスト')) {
                    achievementRate = displayActual === 0 ? 0 : (displayTarget / displayActual) * 100;
                  } else {
                    achievementRate = (displayActual / displayTarget) * 100;
                  }
                }
                
                achievementRate = Math.min(100, Math.max(0, achievementRate));
                const status = achievementRate >= 100 ? 'good' : achievementRate >= 80 ? 'warning' : 'danger';
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
          <Background color="rgba(148, 163, 184, 0.2)" gap={24} size={1} />
          <Controls className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 fill-slate-700 dark:fill-slate-300 shadow-lg" />
          {showMiniMap && (
            <MiniMap 
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl transition-opacity"
              nodeColor={(node) => {
                if (node.data?.status === 'warning') return '#f43f5e';
                if (node.data?.status === 'good') return '#10b981';
                return '#6366f1';
              }}
            />
          )}
        </ReactFlow>
        </div>
      </div>
    </div>
  );
};
