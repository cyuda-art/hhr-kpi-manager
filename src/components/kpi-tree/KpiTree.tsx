"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useKpiStore } from '@/store/useKpiStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { KpiNodeComponent } from './KpiNodeComponent';
import { ActionPanel } from './ActionPanel';
import { AiSetupWizard } from './AiSetupWizard';
import dagre from 'dagre';
import { Wand2, PanelRightClose, PanelRightOpen, Map } from 'lucide-react';


const nodeTypes = {
  kpiNode: KpiNodeComponent,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 150;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode as Node;
  });

  return { nodes: newNodes, edges };
};

const generateNodesAndEdges = (kpiData: Record<string, any>) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  Object.keys(kpiData).forEach(id => {
    const data = kpiData[id];
    if (!data) return;

    nodes.push({
      id,
      type: 'kpiNode',
      position: { x: 0, y: 0 },
      data,
    });

    if (data.parentId) {
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
  const { kpiData, selectedNodeId, setSelectedNodeId, collapsedNodes } = useKpiStore();
  const { actionPanelWidth, isActionPanelCollapsed, setActionPanelWidth, toggleActionPanel, showMiniMap, toggleMiniMap } = useLayoutStore();
  
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

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const { nodes: genNodes, edges: genEdges } = generateNodesAndEdges(kpiData);
    // 初期状態で自動レイアウトを適用
    return getLayoutedElements(genNodes, genEdges);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
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
      const newNodes = nds
        .filter((node) => kpiData[node.id])
        .map((node) => {
          const hasChildren = Object.values(kpiData).some(k => k.parentId === node.id);
          const isCollapsed = collapsedNodes.includes(node.id);
          const hidden = isNodeHidden(node.id);

          return {
            ...node,
            hidden,
            data: {
              ...kpiData[node.id],
              hasChildren,
              isCollapsed,
            } as any,
          };
        });

      const existingIds = new Set(newNodes.map((n) => n.id));
      Object.keys(kpiData).forEach((id) => {
        if (!existingIds.has(id)) {
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
          
          const hasChildren = Object.values(kpiData).some(k => k.parentId === id);
          const isCollapsed = collapsedNodes.includes(id);
          const hidden = isNodeHidden(id);

          newNodes.push({
            id,
            type: 'kpiNode',
            position: { x, y },
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

    setEdges((eds) => {
      const newEdges = eds
        .filter((edge) => kpiData[edge.target] && kpiData[edge.source])
        .map((edge) => {
          const targetData = kpiData[edge.target];
          const isSimulated = targetData?.isSimulated || false;
          const hidden = isNodeHidden(edge.target);
          return {
            ...edge,
            hidden,
            animated: isSimulated,
            style: { stroke: isSimulated ? '#6366f1' : '#cbd5e1', strokeWidth: 2 },
          };
        });

      const existingEdgeIds = new Set(newEdges.map((e) => e.id));
      Object.keys(kpiData).forEach((id) => {
        const parentId = kpiData[id].parentId;
        if (parentId && kpiData[parentId]) {
          const edgeId = `e-${parentId}-${id}`;
          if (!existingEdgeIds.has(edgeId)) {
            const hidden = isNodeHidden(id);
            newEdges.push({
              id: edgeId,
              source: parentId,
              target: id,
              hidden,
              animated: kpiData[id].isSimulated || false,
              style: { stroke: kpiData[id].isSimulated ? '#6366f1' : '#cbd5e1', strokeWidth: 2 },
            });
          }
        }
      });
      return newEdges;
    });
  }, [kpiData, setNodes, setEdges, collapsedNodes]);

  // 選択されたノードが変更されたらセンタリングするアニメーション
  useEffect(() => {
    if (selectedNodeId && rfInstance) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        // ノードの中心座標を計算してセンタリング
        const x = node.position.x + nodeWidth / 2;
        const y = node.position.y + nodeHeight / 2;
        rfInstance.setCenter(x, y, { zoom: 1.1, duration: 800 });
      }
    }
  }, [selectedNodeId, rfInstance, nodes]);

  return (
    <div className={`w-full min-w-0 flex flex-col lg:flex-row gap-4 ${previewMode ? "h-screen w-screen m-0 p-0 fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950" : isDashboard ? "h-[500px] lg:h-full" : "h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)]"}`}>
      <div className={`w-full flex-1 min-w-0 min-h-0 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors relative ${previewMode ? 'border-0 rounded-none' : 'border border-slate-200 dark:border-slate-800 rounded-2xl'}`}>
        {!previewMode && (
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-bold"
            >
              <Wand2 size={14} />
              自動整列 (Auto Layout)
            </button>
            <button
              onClick={toggleMiniMap}
              className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-sm border transition-colors ${showMiniMap ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="ミニマップの表示/非表示"
            >
              <Map size={16} />
            </button>
          </div>
        )}

        {/* 初期セットアップウィザード */}
        {!previewMode && Object.keys(kpiData).length <= 1 && (
          <AiSetupWizard />
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-50 dark:bg-slate-950 transition-colors"
        >
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

      {/* 右側のインサイト・アクションパネル (プレビューモードでは非表示、かつノード選択時のみ表示) */}
      {!previewMode && selectedNodeId && (
        <div 
          ref={panelRef}
          style={{ width: isMobile ? '100%' : (isActionPanelCollapsed ? 48 : actionPanelWidth) }}
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ease-in-out relative flex flex-col shrink-0 min-h-0 ${isMobile ? 'h-[40vh]' : 'h-full'} ${isResizingPanel ? 'select-none' : ''}`}
        >
          <div 
            className="hidden lg:block absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 z-50 transition-colors"
            onMouseDown={() => setIsResizingPanel(true)}
            onDoubleClick={() => setActionPanelWidth(320)}
          />
          
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
            {!isActionPanelCollapsed && (
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 truncate">
                <span className="w-2 h-4 bg-indigo-500 rounded-full flex-shrink-0"></span>
                アクション ＆ インサイト
              </h2>
            )}
            <button 
              onClick={toggleActionPanel}
              className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors ${isActionPanelCollapsed ? 'mx-auto' : ''}`}
              title={isActionPanelCollapsed ? "パネルを展開" : "パネルを折りたたむ"}
            >
              {isActionPanelCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
            </button>
          </div>
          
          <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isActionPanelCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100 p-4'}`}>
            {!isActionPanelCollapsed && <ActionPanel />}
          </div>
        </div>
      )}
    </div>
  );
};
