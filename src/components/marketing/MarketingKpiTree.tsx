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

const initialNodes: Node[] = [
  // --- KGI ---
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
  
  // --- KSF ---
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
    id: 'ksf_sub',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'ksf',
      title: 'Generating New Universe',
      subtitle: '新たな世界線の生成',
      description: 'ヒアリングを通じて、あなたのビジネスに最適な新しい世界観と前提を構築します。',
      icon: Lightbulb,
      color: 'bg-indigo-500',
    },
  },

  // --- KPI ---
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
    id: 'kpi_sub1',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Genuine Network Upholder',
      subtitle: '強固なネットワーク維持',
      description: '全てのノードが論理的に破綻しないよう、相互関係を監視し維持します。',
      icon: Network,
      color: 'bg-teal-500',
    },
  },
  {
    id: 'kpi_sub2',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Growth Navigation Utility',
      subtitle: '成長ナビゲーション',
      description: '設定したKPIに対し、最適な打ち手と次のステップをリアルタイムで提示します。',
      icon: Target,
      color: 'bg-cyan-500',
    },
  },
  {
    id: 'kpi_sub3',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kpi',
      title: 'Global Nexus Unification',
      subtitle: '全体文脈の統合',
      description: '社内のあらゆる活動や別チームの目標を、1つの大きな文脈として繋ぎ合わせます。',
      icon: BrainCircuit,
      color: 'bg-sky-500',
    },
  },

  // --- Process ---
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
    id: 'process_sub1',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'process',
      title: 'Graceful Next Upgrades',
      subtitle: '優雅な継続的成長',
      description: '一つの目標達成で終わらず、次のステージへ向けたアップグレードを自律的に提案します。',
      icon: Target,
      color: 'bg-orange-500',
    },
  },

  // --- Action (CTA) ---
  {
    id: 'process_zap',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'process',
      title: 'Join Gnu.',
      subtitle: 'さあ、真の目標達成をはじめよう',
      description: '右の雷ボタン⚡️を押して、会員登録（無料）へ進みます。ここからが、あなたの本当のスタートです。',
      icon: Zap,
      color: 'bg-yellow-500',
    },
  },
];

const initialEdges: Edge[] = [
  // Branch from KGI
  { id: 'e-kgi-ksf_main', source: 'kgi', target: 'ksf_main', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-kgi-ksf_sub', source: 'kgi', target: 'ksf_sub', style: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.6 } },
  
  // Branch from KSF Main
  { id: 'e-ksf_main-kpi_main', source: 'ksf_main', target: 'kpi_main', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e-ksf_main-kpi_sub1', source: 'ksf_main', target: 'kpi_sub1', style: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.6 } },
  
  // Branch from KSF Sub
  { id: 'e-ksf_sub-kpi_sub2', source: 'ksf_sub', target: 'kpi_sub2', style: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.6 } },
  { id: 'e-ksf_sub-kpi_sub3', source: 'ksf_sub', target: 'kpi_sub3', style: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 0.6 } },

  // Branch from KPI Main
  { id: 'e-kpi_main-process_main', source: 'kpi_main', target: 'process_main', animated: true, style: { stroke: '#cbd5e1', strokeWidth: 1.5 } },
  { id: 'e-kpi_main-process_sub1', source: 'kpi_main', target: 'process_sub1', style: { stroke: '#cbd5e1', strokeWidth: 1.5, opacity: 0.6 } },
  
  // To CTA
  { id: 'e-process_main-process_zap', source: 'process_main', target: 'process_zap', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
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
