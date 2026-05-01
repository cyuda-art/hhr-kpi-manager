"use client";

import { useEffect, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useKpiStore } from '@/store/useKpiStore';
import { KpiNodeComponent } from './KpiNodeComponent';

const nodeTypes = {
  kpiNode: KpiNodeComponent,
};

// ノードの間隔を広げて重なりを解消
const generateNodesAndEdges = (kpiData: Record<string, any>) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const addNode = (id: string, x: number, y: number) => {
    const data = kpiData[id];
    if (!data) return;
    nodes.push({
      id,
      type: 'kpiNode',
      position: { x, y },
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
  };

  // Level 1
  addNode('kgi_profit', 750, 50);
  
  // Level 2
  addNode('kgi_sales_total', 750, 200);

  // Level 3 (横幅を広くとる)
  addNode('kgi_sales_hotel', 150, 350);
  addNode('kgi_sales_spa', 600, 350);
  addNode('kgi_sales_restaurant', 1050, 350);
  addNode('kgi_sales_shop', 1450, 350);

  // Level 4
  addNode('kpi_hotel_occ', 0, 500);
  addNode('kpi_hotel_adr', 300, 500);
  
  addNode('kpi_spa_visitors', 600, 500);
  
  addNode('kpi_restaurant_visitors', 900, 500);
  addNode('kpi_restaurant_cost', 1200, 500);

  return { nodes, edges };
};

export const KpiTree = ({ isDashboard = false }: { isDashboard?: boolean }) => {
  const { kpiData, setSelectedNodeId } = useKpiStore();

  // 初回のみ位置を含むノード・エッジを生成
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return generateNodesAndEdges(kpiData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ドラッグや選択状態を管理するためのHook
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // kpiData (状態や数値) が更新されたら、nodes と edges を同期する
  useEffect(() => {
    setNodes((nds) => {
      // 既存ノードの更新と削除
      const newNodes = nds
        .filter((node) => kpiData[node.id]) // 削除されたノードを除外
        .map((node) => ({
          ...node,
          data: kpiData[node.id] as any,
        }));

      // 追加された新規ノードの検知
      const existingIds = new Set(newNodes.map((n) => n.id));
      Object.keys(kpiData).forEach((id) => {
        if (!existingIds.has(id)) {
          const parentId = kpiData[id].parentId;
          let x = 500;
          let y = 650;
          if (parentId) {
            const parentNode = newNodes.find((n) => n.id === parentId) || nds.find((n) => n.id === parentId);
            if (parentNode) {
              x = parentNode.position.x + (Math.random() * 200 - 100);
              y = parentNode.position.y + 150;
            }
          }
          newNodes.push({
            id,
            type: 'kpiNode',
            position: { x, y },
            data: kpiData[id] as any,
          });
        }
      });
      return newNodes;
    });

    setEdges((eds) => {
      // 既存エッジの更新と削除
      const newEdges = eds
        .filter((edge) => kpiData[edge.target] && kpiData[edge.source]) // 削除されたノードに紐づくエッジを除外
        .map((edge) => {
          const targetData = kpiData[edge.target];
          const isSimulated = targetData?.isSimulated || false;
          return {
            ...edge,
            animated: isSimulated,
            style: { stroke: isSimulated ? '#6366f1' : '#cbd5e1', strokeWidth: 2 },
          };
        });

      // 追加された新規ノードのエッジ
      const existingEdgeIds = new Set(newEdges.map((e) => e.id));
      Object.keys(kpiData).forEach((id) => {
        const parentId = kpiData[id].parentId;
        if (parentId && kpiData[parentId]) {
          const edgeId = `e-${parentId}-${id}`;
          if (!existingEdgeIds.has(edgeId)) {
            newEdges.push({
              id: edgeId,
              source: parentId,
              target: id,
              animated: kpiData[id].isSimulated || false,
              style: { stroke: kpiData[id].isSimulated ? '#6366f1' : '#cbd5e1', strokeWidth: 2 },
            });
          }
        }
      });
      return newEdges;
    });
  }, [kpiData, setNodes, setEdges]);

  return (
    <div className={isDashboard ? "w-full h-full" : "h-[calc(100vh-8rem)] flex gap-6"}>
      <div className="w-full h-full flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-50 dark:bg-slate-950 transition-colors"
        >
          <Background color="#94a3b8" gap={16} />
          <Controls className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 fill-slate-700 dark:fill-slate-300 shadow-lg" />
          <MiniMap 
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl"
            nodeColor={(node) => {
              if (node.data?.status === 'warning') return '#f43f5e';
              if (node.data?.status === 'good') return '#10b981';
              return '#6366f1';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};
