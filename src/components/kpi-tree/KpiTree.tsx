"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useKpiStore } from '@/store/useKpiStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { KpiNodeComponent } from './KpiNodeComponent';
import dagre from 'dagre';
import { Wand2, PanelRightClose, PanelRightOpen, Map, Focus, X, Undo2, Redo2 } from 'lucide-react';


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
  const { kpiData, selectedNodeId, setSelectedNodeId, collapsedNodes, isPredictionMode, undo, redo, pastStates, futureStates } = useKpiStore();
  const { actionPanelWidth, isActionPanelCollapsed, setActionPanelWidth, toggleActionPanel, showMiniMap, toggleMiniMap, autoCenter, toggleAutoCenter, layoutDirection, setLayoutDirection } = useLayoutStore();
  
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [rfInstance, setRfInstance] = useState<any>(null);

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
      setTimeout(() => rfInstance.fitView({ padding: 0.2, duration: 800 }), 50);
    }
  };

  const toggleDirection = () => {
    const newDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(newDir);
    handleAutoLayout(newDir);
  };

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

    setNodes((nds) => {
      const isHorizontal = layoutDirection === 'LR';
      const newNodes = nds
        .filter((node) => kpiData[node.id])
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
            } as any,
          });
        }
      });
      return newNodes;
    });

    const getEdgeStyle = (targetId: string) => {
      const targetData = kpiData[targetId];
      const isSimulated = targetData?.isSimulated || false;
      const targetStatus = isPredictionMode 
        ? (targetData?.simulatedStatus || targetData?.status) 
        : targetData?.status;

      let strokeColor = '#cbd5e1'; // default slate-300
      let strokeWidth = 2;
      let strokeDasharray = undefined as string | undefined;
      let animated = isSimulated;

      if (targetStatus === 'danger') {
        strokeColor = 'url(#edge-gradient-danger)'; // rose-500
        strokeWidth = 3;
        strokeDasharray = '5, 5';
      } else if (targetStatus === 'warning') {
        strokeColor = 'url(#edge-gradient-warning)'; // amber-400
        strokeWidth = 2.5;
      } else if (targetStatus === 'good') {
        strokeColor = 'url(#edge-gradient-good)'; // emerald-400
        strokeWidth = 3;
      }

      if (isSimulated) {
        strokeColor = '#8ab4f8';
        animated = true;
      }

      const style: any = { stroke: strokeColor, strokeWidth };
      if (strokeDasharray) style.strokeDasharray = strokeDasharray;

      return { style, animated };
    };

    setEdges((eds) => {
      const newEdges = eds
        .filter((edge) => kpiData[edge.target] && kpiData[edge.source])
        .map((edge) => {
          const hidden = isNodeHidden(edge.target);
          const { style, animated } = getEdgeStyle(edge.target);

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
            const { style, animated } = getEdgeStyle(id);
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
  }, [kpiData, setNodes, setEdges, collapsedNodes]);

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
                className="flex items-center justify-center w-8 h-8 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="元に戻す (Cmd+Z)"
              >
                <Undo2 size={16} />
              </button>
              <div className="w-[1px] bg-slate-200 dark:bg-slate-700"></div>
              <button
                onClick={redo}
                disabled={futureStates.length === 0}
                className="flex items-center justify-center w-8 h-8 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="やり直す (Cmd+Shift+Z)"
              >
                <Redo2 size={16} />
              </button>
            </div>
            <button
              onClick={() => handleAutoLayout()}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-xs font-bold"
            >
              <Wand2 size={14} />
              自動整列 (Auto Layout)
            </button>
            <button
              onClick={toggleAutoCenter}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg shadow-sm border transition-colors text-xs font-bold ${autoCenter ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              title="選択時の自動センタリングのオン/オフ"
            >
              <Focus size={14} />
              自動フォーカス
            </button>
            <button
              onClick={toggleDirection}
              className="flex items-center justify-center px-3 py-1.5 rounded-lg shadow-sm border transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold"
              title="レイアウトの方向（縦・横）を切り替え"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 9V3h-6"/><path d="M3 15v6h6"/><path d="M21 3l-6 6"/><path d="M3 21l6-6"/></svg>
              方向切替 ({layoutDirection === 'TB' ? '上→下' : '左→右'})
            </button>
            <button
              onClick={toggleMiniMap}
              className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-sm border transition-colors ${showMiniMap ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="ミニマップの表示/非表示"
            >
              <Map size={16} />
            </button>

            {/* 期間切替ドロップダウン */}
            <div className="flex items-center ml-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <select
                value={useKpiStore((state) => state.currentPeriod)}
                onChange={(e) => useKpiStore.getState().setPeriod(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 px-3 py-1.5 focus:ring-0 cursor-pointer"
              >
                <option value="year">年次 (1年)</option>
                <option value="half">半期 (6ヶ月)</option>
                <option value="quarter">四半期 (3ヶ月)</option>
                <option value="month">月次 (1ヶ月)</option>
                <option value="day">日次 (1日)</option>
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
                  <span className="text-slate-600 dark:text-slate-400 font-medium">順調</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">100%〜</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-[2.5px] bg-[#fbbf24] rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">注意</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">80%〜99%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-0 border-t-[3px] border-dotted border-[#f43f5e]"></div>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">ボトルネック / 不足</span>
                </div>
                <span className="text-[10px] text-rose-500 font-mono">〜79%</span>
              </div>
              <div className="flex items-center gap-2.5 pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/50">
                <div className="w-6 h-[2px] bg-[#8ab4f8] rounded-full"></div>
                <span className="text-slate-500 dark:text-slate-500 text-[10px]">AI予測モードON時のみ青く発光</span>
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
          className="bg-slate-50 dark:bg-slate-950 transition-colors"
        >
          
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="edge-gradient-good" x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="edge-gradient-warning" x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="edge-gradient-danger" x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
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


    </div>
  );
};
