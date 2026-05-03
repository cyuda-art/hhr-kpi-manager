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
import { Wand2, PanelRightClose, PanelRightOpen, Map, Focus, X, Search } from 'lucide-react';


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
  const { actionPanelWidth, isActionPanelCollapsed, setActionPanelWidth, toggleActionPanel, showMiniMap, toggleMiniMap, autoCenter, toggleAutoCenter } = useLayoutStore();
  
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 検索結果の計算
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return Object.values(kpiData).filter(node => 
      node.name.toLowerCase().includes(query) || 
      node.businessUnit.toLowerCase().includes(query)
    ).slice(0, 5); // 上位5件を表示
  }, [searchQuery, kpiData]);

  // 検索窓の外をクリックした時に閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as globalThis.Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSearchQuery('');
    setShowSearchResults(false);
    
    if (rfInstance) {
      // 検索時にそのノードが折りたたまれている場合は展開するなどの処理が必要ならここで行う
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const x = node.position.x + nodeWidth / 2;
        const y = node.position.y + nodeHeight / 2;
        rfInstance.setCenter(x, y, { zoom: 1.1, duration: 800 });
      } else {
        // ノードが hidden な場合はとりあえず親を辿って展開する必要があるが、今回は省略
      }
    }
  };

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
    <div className={`w-full min-w-0 flex flex-col lg:flex-row gap-4 ${previewMode ? "h-screen w-screen m-0 p-0 fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950" : isDashboard ? "h-[500px] lg:h-full" : "h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)]"}`}>
      <div className={`w-full flex-1 min-w-0 min-h-0 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors relative ${previewMode ? 'border-0 rounded-none' : 'border border-slate-200 dark:border-slate-800 rounded-2xl'}`}>
        {!previewMode && (
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button
              onClick={handleAutoLayout}
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
              onClick={toggleMiniMap}
              className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-sm border transition-colors ${showMiniMap ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="ミニマップの表示/非表示"
            >
              <Map size={16} />
            </button>
            
            {/* スマート検索バー */}
            <div className="relative ml-2" ref={searchContainerRef}>
              <div className="flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all">
                <Search size={14} className="text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="KPI・部署を検索..."
                  className="bg-transparent border-none outline-none text-xs w-32 focus:w-48 transition-all duration-300 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />
              </div>
              
              {/* 検索結果ドロップダウン */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map(node => (
                        <button
                          key={node.id}
                          onClick={() => handleSelectSearchResult(node.id)}
                          className="flex flex-col text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{node.name}</span>
                          <span className="text-[10px] font-bold text-primary-500 uppercase">{node.businessUnit}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      見つかりませんでした
                    </div>
                  )}
                </div>
              )}
            </div>
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

      {/* ポップアップ（モーダル）形式のアクションパネル */}
      {!previewMode && selectedNodeId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedNodeId(null)}
          ></div>
          <div className="relative w-full max-w-md h-[85vh] sm:h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <span className="w-2 h-4 bg-primary-500 rounded-full"></span>
                アクション ＆ インサイト
              </h2>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <ActionPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
