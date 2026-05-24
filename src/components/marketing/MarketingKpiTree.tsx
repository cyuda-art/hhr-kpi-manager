"use client";

import { useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, Position, ReactFlowProvider, useReactFlow, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MarketingKpiNode } from './MarketingKpiNode';
import dagre from 'dagre';
import { Target, Lightbulb, Network, BrainCircuit, Zap } from 'lucide-react';

const nodeTypes = {
  marketingNode: MarketingKpiNode,
};

const baseInitialNodes: Node[] = [
  // --- Main Narrative Branch ---
  {
    id: 'kgi',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kgi',
      title: 'Gnu.',
      subtitle: 'The End of Management.',
      description: '目標に対するモヤモヤに終止符を打つ。ここから本質的な実行が始まります。',
      icon: Target,
      color: 'bg-emerald-500',
    },
  },
  {
    id: 'ksf_main',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'ksf',
      title: 'Gathering Needs & Understanding',
      subtitle: '対話から真のニーズを汲み取る',
      description: 'AIがあなたと対話し、漠然とした想いや文脈を正確に理解して言語化します。',
      icon: BrainCircuit,
      color: 'bg-purple-500',
    },
  },
  {
    id: 'kpi_main',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Goal Node Unfolder',
      subtitle: '目標を無数の行動ノードへ展開',
      description: '言語化されたストーリーを、現実世界で実行可能な「具体的なアクションの枝葉」へとAIが自動展開します。',
      icon: Network,
      color: 'bg-blue-500',
    },
  },
  {
    id: 'process_main',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'process',
      title: 'Grand Nodes United',
      subtitle: '全てのノードが一つの頂点へ収束',
      description: '展開された全ての行動が数学的（四則演算）に連動し、最終的にたった一つのKGIへとカチッと収束します。',
      icon: Lightbulb,
      color: 'bg-rose-500',
    },
  },
  {
    id: 'process_zap',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'process',
      title: 'Agentic Execution',
      subtitle: '自律実行モード',
      description: '決定したプロセス横の⚡️ボタンを押すだけで、AIエージェントが自律的にGoogle Workspaceを操作し、実務を完遂させます。',
      icon: Zap,
      color: 'bg-yellow-500',
    },
  },

  // --- Secondary Branches (For Realism) ---
  {
    id: 'ksf_sub',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'ksf',
      title: 'Guide to Next Upgrade',
      subtitle: '伴走型ナビゲーション',
      description: 'AIが現状を把握し、次のレベルや目標達成へとナビゲートします。',
      icon: Lightbulb,
      color: 'bg-indigo-500',
    },
  },
  {
    id: 'kpi_sub',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Context Integration',
      subtitle: 'コンテキストの統合',
      description: '過去の実行データから独自の知見を抽出し、次に活かします。',
      icon: Network,
      color: 'bg-teal-500',
    },
  },
  {
    id: 'process_sub',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'process',
      title: 'All-Google Ecosystem',
      subtitle: '鉄壁のセキュリティ環境',
      description: '情報漏洩リスクを排除したセキュアな基盤を提供します。',
      icon: Target,
      color: 'bg-slate-500',
    },
  },
];

const baseInitialEdges: Edge[] = [
  // Main Narrative Flow
  { id: 'e-kgi-ksf_main', source: 'kgi', target: 'ksf_main', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-ksf_main-kpi_main', source: 'ksf_main', target: 'kpi_main', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-kpi_main-process_main', source: 'kpi_main', target: 'process_main', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  { id: 'e-kpi_main-process_zap', source: 'kpi_main', target: 'process_zap', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  
  // Branching Edges
  { id: 'e-kgi-ksf_sub', source: 'kgi', target: 'ksf_sub', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  { id: 'e-ksf_main-kpi_sub', source: 'ksf_main', target: 'kpi_sub', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  { id: 'e-kpi_main-process_sub', source: 'kpi_main', target: 'process_sub', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
];

// 「ヌーの大群」を彷彿とさせる大量の枝葉を自動生成
const generateHerdOfGnus = () => {
  const herdNodes: Node[] = [];
  const herdEdges: Edge[] = [];
  
  const parentSources = ['ksf_main', 'ksf_sub', 'kpi_main', 'kpi_sub', 'process_main', 'process_sub'];
  let nodeIdCounter = 0;

  parentSources.forEach(source => {
    // 各親から3〜6個の細かいノードを分岐させる
    const numChildren = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < numChildren; i++) {
      const childId = `herd_${nodeIdCounter++}`;
      herdNodes.push({
        id: childId,
        type: 'marketingNode',
        position: { x: 0, y: 0 }, // dagre will handle layout
        data: {
          type: 'process',
          title: `Action Node ${nodeIdCounter}`,
          subtitle: 'Automated Process',
          icon: Network,
          color: 'bg-slate-700 dark:bg-slate-800',
        }
      });
      herdEdges.push({
        id: `e-${source}-${childId}`,
        source: source,
        target: childId,
        style: { stroke: '#e2e8f0', strokeWidth: 1, opacity: 0.5 }
      });

      // さらにその子供（孫）も少し生やす
      if (Math.random() > 0.5) {
        const grandChildId = `herd_${nodeIdCounter++}`;
        herdNodes.push({
          id: grandChildId,
          type: 'marketingNode',
          position: { x: 0, y: 0 },
          data: {
            type: 'process',
            title: `Micro Task ${nodeIdCounter}`,
            icon: Zap,
            color: 'bg-slate-700 dark:bg-slate-800',
          }
        });
        herdEdges.push({
          id: `e-${childId}-${grandChildId}`,
          source: childId,
          target: grandChildId,
          style: { stroke: '#f1f5f9', strokeWidth: 0.5, opacity: 0.3 }
        });
      }
    }
  });

  return { herdNodes, herdEdges };
};

const { herdNodes, herdEdges } = generateHerdOfGnus();
const initialNodes = [...baseInitialNodes, ...herdNodes];
const initialEdges = [...baseInitialEdges, ...herdEdges];

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 250, nodesep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 340, height: 160 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 340 / 2,
        y: nodeWithPosition.y - 160 / 2,
      },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    };
  });

  return { nodes: newNodes, edges };
};

const { nodes: defaultLayoutedNodes, edges: defaultLayoutedEdges } = getLayoutedElements(initialNodes, initialEdges);

// 内部でuseReactFlowを使うためのコンポーネント
const MarketingKpiTreeContent = ({ activeNodeId, onTourEnd }: { activeNodeId: string | null; onTourEnd: () => void }) => {
  const { setCenter, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultLayoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultLayoutedEdges);
  const isInitialMount = useRef(true);
  const currentNodesRef = useRef(initialNodes);
  const currentEdgesRef = useRef(initialEdges);

  // 初回マウント時またはツリー初期化時のレイアウト計算
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      currentNodesRef.current,
      currentEdgesRef.current
    );
    
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 1000 });
    }, 100);
  }, [fitView, setNodes, setEdges]);

  // ツアーによるフォーカス処理
  useEffect(() => {
    if (!activeNodeId || activeNodeId === 'custom_goal') return;

    if (activeNodeId === 'all') {
      fitView({ padding: 0.3, duration: isInitialMount.current ? 0 : 1500 });
      if (isInitialMount.current) isInitialMount.current = false;
      return;
    }

    const node = nodes.find(n => n.id === activeNodeId);
    if (node) {
      const x = node.position.x + 340 / 2;
      const y = node.position.y + 160 / 2;
      setCenter(x, y, { zoom: 1.2, duration: isInitialMount.current ? 0 : 1200 });
      if (isInitialMount.current) isInitialMount.current = false;
    }
  }, [activeNodeId, setCenter, fitView, nodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnScroll={true}
      panOnDrag={true}
    >
      <Background color="#94a3b8" gap={24} size={1} />
      <Controls showInteractive={false} className="bg-white/20 dark:bg-black/40 backdrop-blur-md border-white/20 fill-slate-800 dark:fill-white" />
    </ReactFlow>
  );
};

export const MarketingKpiTree = ({ activeNodeId, onTourEnd }: { activeNodeId: string | null; onTourEnd: () => void }) => {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <MarketingKpiTreeContent activeNodeId={activeNodeId} onTourEnd={onTourEnd} />
      </ReactFlowProvider>
    </div>
  );
};
