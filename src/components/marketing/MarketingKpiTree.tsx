"use client";

import { useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, Position, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MarketingKpiNode } from './MarketingKpiNode';
import dagre from 'dagre';
import { Target, Lightbulb, Zap, Compass, Network, BrainCircuit, ShieldCheck } from 'lucide-react';

const nodeTypes = {
  marketingNode: MarketingKpiNode,
};

const initialNodes: Node[] = [
  {
    id: 'kgi',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kgi',
      title: 'Gnu.',
      subtitle: 'The End of Management.',
      description: '目標に対するモヤモヤに終止符を打つ。ここから実行が始まります。',
      icon: Target,
      color: 'bg-emerald-500',
    },
  },
  {
    id: 'kpi1',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Goal Node Unfolder',
      subtitle: '目標を具体的なノードに展開',
      description: '抽象的な目標を具体的なKPIツリーの枝葉へと自動展開します。',
      icon: Network,
      color: 'bg-blue-500',
    },
  },
  {
    id: 'kpi2',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Guide to Next Upgrade',
      subtitle: '伴走型ナビゲーション',
      description: 'AIが現状を把握し、次のレベルや目標達成へとナビゲートします。',
      icon: Compass,
      color: 'bg-indigo-500',
    },
  },
  {
    id: 'kpi3',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Goal Narrative Universe',
      subtitle: 'ユーザーの文脈を拡張',
      description: '単なる数値目標ではなく、ユーザーの思い（文脈）を汲み取って広がるKPIの世界。',
      icon: Lightbulb,
      color: 'bg-purple-500',
    },
  },
  {
    id: 'sub1',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'measure',
      title: 'Agentic Execution',
      subtitle: '自律実行モード',
      description: 'タスク横の⚡️ボタンを押すだけで、AIエージェントが自律的にGoogle Workspaceを操作し、実務を完遂させます。',
      icon: Zap,
      color: 'bg-yellow-500',
    },
  },
  {
    id: 'sub2',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'measure',
      title: 'Soulful AI Coach',
      subtitle: '魂を持った戦略パートナー',
      description: '会社の「経営理念（MVV）」を事前にインストール。「御社の理念に沿うなら」と熱意を持って壁打ちに付き合います。',
      icon: BrainCircuit,
      color: 'bg-rose-500',
    },
  },
  {
    id: 'sub3',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'measure',
      title: 'All-Google Ecosystem',
      subtitle: '鉄壁のセキュリティ',
      description: '情報漏洩リスクを排除。エンタープライズ向けのGoogle Vertex AIに一本化されたセキュアな環境。',
      icon: ShieldCheck,
      color: 'bg-slate-500',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-kgi-kpi1', source: 'kgi', target: 'kpi1', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-kgi-kpi2', source: 'kgi', target: 'kpi2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-kgi-kpi3', source: 'kgi', target: 'kpi3', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-kpi1-sub1', source: 'kpi1', target: 'sub1', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  { id: 'e-kpi2-sub2', source: 'kpi2', target: 'sub2', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  { id: 'e-kpi3-sub3', source: 'kpi3', target: 'sub3', style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
];

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

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);

// 内部でuseReactFlowを使うためのコンポーネント
const MarketingKpiTreeContent = ({ activeNodeId, onTourEnd }: { activeNodeId: string | null; onTourEnd: () => void }) => {
  const { setCenter, fitView } = useReactFlow();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!activeNodeId) return;

    if (activeNodeId === 'all') {
      fitView({ padding: 0.3, duration: isInitialMount.current ? 0 : 1500 });
      if (isInitialMount.current) isInitialMount.current = false;
      return;
    }

    const node = layoutedNodes.find(n => n.id === activeNodeId);
    if (node) {
      // ノードの中心にフォーカス
      const x = node.position.x + 340 / 2;
      const y = node.position.y + 160 / 2;
      setCenter(x, y, { zoom: 1.2, duration: isInitialMount.current ? 0 : 1200 });
      if (isInitialMount.current) isInitialMount.current = false;
    }
  }, [activeNodeId, setCenter, fitView]);

  return (
    <ReactFlow
      nodes={layoutedNodes}
      edges={layoutedEdges}
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
