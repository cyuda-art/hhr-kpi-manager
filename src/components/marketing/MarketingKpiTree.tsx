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
  // --- Main Narrative Branch ---
  {
    id: 'kgi',
    type: 'marketingNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'kgi',
      title: 'The End of Management.',
      subtitle: '管理の終焉と、本質的な目標達成の始まり',
      description: '日々のタスク管理や数値追跡に追われるのはもう終わりにしましょう。ここから真の実行が始まります。',
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
      title: 'Goal Narrative Universe',
      subtitle: 'ユーザーの想いを汲み取る世界線',
      description: '単なる数値目標ではなく、あなたの「想い」や「文脈」を理解し、定性的なストーリーとして世界観を構築します。',
      icon: Lightbulb,
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
      subtitle: '抽象から具体への展開',
      description: '構築されたストーリーラインから、現実世界で実行可能な「具体的なアクションの枝葉」へとAIが自動展開します。',
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
      title: 'Soulful AI Coach',
      subtitle: '魂を持った戦略パートナー',
      description: '企業の「経営理念（MVV）」を理解したAIが、「御社の理念に沿うなら」と熱意を持って具体的なプロセスへの壁打ちに伴走します。',
      icon: BrainCircuit,
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

const initialEdges: Edge[] = [
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
const MarketingKpiTreeContent = ({ activeNodeId, onTourEnd, customGoal }: { activeNodeId: string | null; onTourEnd: () => void; customGoal: string | null }) => {
  const { setCenter, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultLayoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultLayoutedEdges);
  const isInitialMount = useRef(true);
  const currentNodesRef = useRef(initialNodes);
  const currentEdgesRef = useRef(initialEdges);

  // カスタムノードの追加処理
  useEffect(() => {
    if (customGoal) {
      const newNodeId = `custom_${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'marketingNode',
        position: { x: 0, y: 0 },
        data: {
          type: 'kpi',
          title: customGoal,
          subtitle: 'User Custom Goal',
          description: 'この目標を達成するためのツリーを展開しますか？',
          icon: Target,
          color: 'bg-emerald-500'
        }
      };
      const newEdge: Edge = {
        id: `e-kgi-${newNodeId}`,
        source: 'kgi',
        target: newNodeId,
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 }
      };

      currentNodesRef.current = [...currentNodesRef.current, newNode];
      currentEdgesRef.current = [...currentEdgesRef.current, newEdge];

      const { nodes: newLayoutedNodes, edges: newLayoutedEdges } = getLayoutedElements(currentNodesRef.current, currentEdgesRef.current);
      
      setNodes(newLayoutedNodes);
      setEdges(newLayoutedEdges);

      // 追加したノードにフォーカス
      setTimeout(() => {
        const addedNode = newLayoutedNodes.find(n => n.id === newNodeId);
        if (addedNode) {
          setCenter(addedNode.position.x + 340 / 2, addedNode.position.y + 160 / 2, { zoom: 1.2, duration: 1200 });
        }
      }, 500);
    }
  }, [customGoal, setCenter, setNodes, setEdges]);

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

export const MarketingKpiTree = ({ activeNodeId, onTourEnd, customGoal }: { activeNodeId: string | null; onTourEnd: () => void; customGoal: string | null }) => {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <MarketingKpiTreeContent activeNodeId={activeNodeId} onTourEnd={onTourEnd} customGoal={customGoal} />
      </ReactFlowProvider>
    </div>
  );
};
