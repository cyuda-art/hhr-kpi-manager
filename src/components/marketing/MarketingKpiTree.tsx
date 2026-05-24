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
      description: '煩雑なマネジメントツールからの脱却と、自律実行型AIエージェントへの完全移行プロセス。',
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
      subtitle: 'AIコパイロット・ヒアリング機能',
      description: '画面右のAIコパイロットとの壁打ちチャットを通じ、曖昧な定性目標や潜在的ニーズを言語化します。',
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
      subtitle: '業界特化型KPIパターンの自動提案',
      description: '過去の実行データから学習し、あなたのビジネスに最適な「新しいKPIの型」と前提を自動提案します。',
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
      subtitle: 'KPIツリー瞬時自動展開エンジン',
      description: 'ヒアリング内容から、四則演算（＋、－、×、÷）で完全に連動する実行可能なKPIツリーを自動生成します。',
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
      subtitle: 'MVV逸脱防止ガードレール',
      description: '生成される行動ノードが企業のMVV（ミッション・ビジョン・バリュー）から逸脱しないよう常に監視します。',
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
      subtitle: 'ネクストアクション自動提示機能',
      description: '達成進捗をAIがリアルタイムに分析し、状況に応じた「次の一手」をポップアップでナビゲートします。',
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
      subtitle: '全社ツリー統合コネクター',
      description: '営業、開発、マーケティングなど、他部署のツリー同士を結合し、全社的な1つの巨大ツリーへ統合します。',
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
      subtitle: 'リアルタイム・シミュレーション機能',
      description: 'ツリー末端の数値を変更すると、KGIまでリアルタイムに計算が波及する高度なシミュレーターです。',
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
      subtitle: '次期目標アップグレード・ウィザード',
      description: '目標達成時に、さらに高い視座の次期目標へとスムーズに移行させるウィザードを提供します。',
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
      subtitle: 'さあ、自律実行フェーズへ',
      description: '右の雷ボタン⚡️を押して会員登録へ進み、Google Workspace等と連携して実務をスタートさせます。',
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
